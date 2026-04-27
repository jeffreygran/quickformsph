#!/usr/bin/env tsx
/**
 * autoUppercase lowercase-leak audit.
 *
 * For every form in FORMS and every sample row in `samplesBySlug`, flag any
 * value where the schema declares `autoUppercase: true` but the literal in
 * page.tsx contains lowercase letters.
 *
 * Why this matters: even though `applyFieldTransforms` (L-FIELDXFORM-01) now
 * upper-cases at runtime, leaving lowercase letters in the source literals
 * makes the file misleading and causes diffs to look noisy when a maintainer
 * "fixes" them by hand. This audit gives us a one-shot list to clean up plus
 * a CI gate against future drift.
 *
 * Run: `npx tsx scripts/audit-uppercase-leaks.ts`
 * Wire later: `npm run audit:uppercase` (add to package.json when desired).
 *
 * Exit code 0 = clean, 1 = leaks found.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FORMS, type FormField } from '../src/data/forms';

const PAGE_PATH = path.join(__dirname, '..', 'src', 'app', 'forms', '[slug]', 'page.tsx');
const src = fs.readFileSync(PAGE_PATH, 'utf8');

// ── Reused literal-extraction (kept in sync with check-sample-data.ts) ──────
function extractBracketBalanced(text: string, startIdx: number, open: string, close: string): string | null {
  if (text[startIdx] !== open) return null;
  let depth = 0;
  let inString: string | null = null;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === '\\') { escape = true; continue; }
      if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inString = ch; continue; }
    if (ch === '/' && text[i + 1] === '/') {
      const eol = text.indexOf('\n', i);
      i = eol === -1 ? text.length : eol;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

function extractArrayConst(varName: string): string | null {
  const re = new RegExp(`\\bconst\\s+${varName}\\s*(?::[^=]*)?=\\s*\\[`);
  const m = src.match(re);
  if (!m || m.index === undefined) return null;
  const bracketIdx = src.indexOf('[', m.index);
  return extractBracketBalanced(src, bracketIdx, '[', ']');
}

const samplesByMatch = src.match(/samplesBySlug\b[^=]*=\s*\{/);
if (!samplesByMatch || samplesByMatch.index === undefined) {
  console.error('FATAL: could not locate samplesBySlug declaration');
  process.exit(2);
}
const objIdx = src.indexOf('{', samplesByMatch.index + samplesByMatch[0].length - 1);
const objText = extractBracketBalanced(src, objIdx, '{', '}');
if (!objText) {
  console.error('FATAL: could not bracket-balance samplesBySlug body');
  process.exit(2);
}

function extractSlugEntries(body: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const inner = body.slice(1, -1);
  const slugRe = /'([a-z0-9-]+)'\s*:\s*/g;
  const matches: { slug: string; valStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = slugRe.exec(inner)) !== null) {
    let depth = 0;
    let inStr: string | null = null;
    let esc = false;
    for (let i = 0; i < m.index; i++) {
      const ch = inner[i];
      if (esc) { esc = false; continue; }
      if (inStr) {
        if (ch === '\\') { esc = true; continue; }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
      if (ch === '{' || ch === '[') depth++;
      else if (ch === '}' || ch === ']') depth--;
    }
    if (depth !== 0) continue;
    matches.push({ slug: m[1], valStart: m.index + m[0].length });
  }
  for (const { slug, valStart } of matches) {
    const ch = inner[valStart];
    let valText: string | null = null;
    if (ch === '[') {
      valText = extractBracketBalanced(inner, valStart, '[', ']');
    } else if (/[a-zA-Z_]/.test(ch)) {
      const idMatch = inner.slice(valStart).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (idMatch) valText = extractArrayConst(idMatch[1]);
    }
    if (valText) entries[slug] = valText;
  }
  return entries;
}

function sanitize(literal: string): string {
  return literal
    .replace(/\bas\s+[A-Za-z_<>,\s\[\]|]+(?=[,\]\}\)])/g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

function evalLiteral(literal: string): Record<string, string>[] {
  const clean = sanitize(literal);
  const stubs = `const todayMaskedDate = () => '01/01/2025'; const todayDate = () => '2025-01-01';`;
  return new Function(`${stubs} return (${clean});`)() as Record<string, string>[];
}

const slugLiterals = extractSlugEntries(objText);

// ── Audit ───────────────────────────────────────────────────────────────────
type Leak = { slug: string; sampleIndex: number; field: string; value: string; lowercaseChars: string };
const leaks: Leak[] = [];
let totalChecks = 0;
let formsAudited = 0;

// Match any ASCII lowercase letter; we treat `[a-z]` as a leak only when the
// field is autoUppercase. Accents/diacritics are extremely rare in PH gov
// forms and safe to ignore (they'd require Unicode-aware case folding anyway).
const LOWERCASE_RE = /[a-z]/;

for (const form of FORMS) {
  const literal = slugLiterals[form.slug];
  if (!literal) continue;
  let samples: Record<string, string>[];
  try {
    samples = evalLiteral(literal);
  } catch {
    continue;
  }
  if (!Array.isArray(samples) || samples.length === 0) continue;
  formsAudited++;

  const upperFields = (form.fields as FormField[]).filter(f => f.autoUppercase);

  samples.forEach((sample, idx) => {
    for (const field of upperFields) {
      const value = sample[field.id];
      if (typeof value !== 'string' || value === '') continue;
      totalChecks++;
      if (LOWERCASE_RE.test(value)) {
        const lower = Array.from(new Set(value.match(/[a-z]/g) ?? [])).sort().join('');
        leaks.push({ slug: form.slug, sampleIndex: idx, field: field.id, value, lowercaseChars: lower });
      }
    }
  });
}

// ── Report ──────────────────────────────────────────────────────────────────
if (leaks.length === 0) {
  console.log(`✓ No autoUppercase lowercase-leaks. (${totalChecks} value-checks across ${formsAudited} forms)`);
  process.exit(0);
}

console.error(`✗ ${leaks.length} autoUppercase lowercase-leak(s) found across ${formsAudited} forms (${totalChecks} value-checks):\n`);
const bySlug = new Map<string, Leak[]>();
for (const l of leaks) {
  if (!bySlug.has(l.slug)) bySlug.set(l.slug, []);
  bySlug.get(l.slug)!.push(l);
}
for (const [slug, entries] of bySlug) {
  console.error(`  [${slug}] ${entries.length} leak(s)`);
  for (const l of entries) {
    const preview = l.value.length > 60 ? l.value.slice(0, 57) + '...' : l.value;
    console.error(`    sample[${l.sampleIndex}].${l.field} = ${JSON.stringify(preview)}  (lowercase: '${l.lowercaseChars}')`);
  }
}
console.error('\nRuntime is unaffected — applyFieldTransforms upper-cases on read (L-FIELDXFORM-01).');
console.error('Source-literal cleanup is recommended to keep diffs honest. Edit page.tsx samplesBySlug.\n');
process.exit(1);

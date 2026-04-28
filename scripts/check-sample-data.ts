/**
 * Sample-data CI validator.
 *
 * For every form in FORMS and every sample row in `samplesBySlug` (extracted
 * from src/app/forms/[slug]/page.tsx), assert:
 *
 *   1. Every `required: true` field has a non-empty value (REQUIRED-FIELD check).
 *   2. Every `type: 'dropdown'` value is in the field's `options` array
 *      (DROPDOWN-ENUM check).
 *
 * Run: `npx tsx scripts/check-sample-data.ts`
 * Wire into the release pipeline: `npm run test:samples`.
 *
 * Background: this catches the bug class found across the 14-form sweep on
 * 2026-04-26 — pre-fix, most Pag-IBIG forms had samples missing 5-6 required
 * dropdowns, and SLF-065 used `loan_purpose='Healthcare Plan from accredited
 * HMO'` (an SLF-089 enum, not in SLF-065).
 */
import * as fs from 'fs';
import * as path from 'path';
import { FORMS, type FormField } from '../src/data/forms';

const PAGE_PATH = path.join(__dirname, '..', 'src', 'app', 'forms', '[slug]', 'page.tsx');
const src = fs.readFileSync(PAGE_PATH, 'utf8');

// ── Bracket-balanced literal extraction ─────────────────────────────────────
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
      // line comment
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

// Find a top-level `const NAME = [` or `const NAME: TYPE = [` in src and return the array literal text.
function extractArrayConst(varName: string): string | null {
  const re = new RegExp(`\\bconst\\s+${varName}\\s*(?::[^=]*)?=\\s*\\[`);
  const m = src.match(re);
  if (!m || m.index === undefined) return null;
  const bracketIdx = src.indexOf('[', m.index);
  return extractBracketBalanced(src, bracketIdx, '[', ']');
}

// Locate samplesBySlug body
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

// Walk top-level `'slug': VALUE,` entries
function extractSlugEntries(body: string): Record<string, string> {
  const entries: Record<string, string> = {};
  // Strip outer braces
  const inner = body.slice(1, -1);
  const slugRe = /'([a-z0-9-]+)'\s*:\s*/g;
  let lastEnd = 0;
  const matches: { slug: string; valStart: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = slugRe.exec(inner)) !== null) {
    // Only top-level entries: ensure preceding char is `,` `{` or whitespace at column-start
    const before = inner.slice(Math.max(0, m.index - 80), m.index);
    // Skip if inside a nested object (heuristic: count unmatched braces)
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
    if (depth !== 0) continue; // not top-level
    matches.push({ slug: m[1], valStart: m.index + m[0].length });
    void before; void lastEnd;
  }
  for (const { slug, valStart } of matches) {
    const ch = inner[valStart];
    let valText: string | null = null;
    if (ch === '[') {
      valText = extractBracketBalanced(inner, valStart, '[', ']');
    } else if (/[a-zA-Z_]/.test(ch)) {
      // identifier reference like `hqpSamples` or `pmrfSamples as Record<...>`
      const idMatch = inner.slice(valStart).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (idMatch) {
        const refName = idMatch[1];
        valText = extractArrayConst(refName);
      }
    }
    if (valText) entries[slug] = valText;
  }
  return entries;
}

const slugLiterals = extractSlugEntries(objText);

// ── Sanitize TS literal → JS-evaluable string ────────────────────────────────
// Strip `as TYPE` casts, type assertions, single-line and block comments.
function sanitize(literal: string): string {
  let s = literal;
  // Strip `as Record<string, string>[]` casts
  s = s.replace(/\bas\s+[A-Za-z_<>,\s\[\]|]+(?=[,\]\}\)])/g, '');
  // Strip line comments
  s = s.replace(/\/\/[^\n]*/g, '');
  // Strip block comments
  s = s.replace(/\/\*[\s\S]*?\*\//g, '');
  return s;
}

// Evaluate sanitized literal in a sandboxed Function. Source is trusted (our own
// repo) and contains only string-valued properties — no expressions, no calls.
function evalLiteral(literal: string): Record<string, string>[] {
  const clean = sanitize(literal);
  try {
    // Stub helpers used inside samples (e.g. `signature_date: todayMaskedDate()`).
    // These return a representative non-empty string so required-field checks pass.
    const stubs = `const todayMaskedDate = () => '01/01/2025'; const todayDate = () => '2025-01-01';`;
    return new Function(`${stubs} return (${clean});`)() as Record<string, string>[];
  } catch (e) {
    throw new Error(`eval failed for literal (first 200 chars): ${clean.slice(0, 200)}\n${(e as Error).message}`);
  }
}

// ── Validation ───────────────────────────────────────────────────────────────
type Failure = { slug: string; sampleIndex: number; check: 'required' | 'enum'; field: string; details: string };
const failures: Failure[] = [];
let totalChecks = 0;

for (const form of FORMS) {
  const literal = slugLiterals[form.slug];
  if (!literal) {
    failures.push({ slug: form.slug, sampleIndex: -1, check: 'required', field: '<form>', details: 'no samplesBySlug entry — falls through to hqpSamples default' });
    continue;
  }
  let samples: Record<string, string>[];
  try {
    samples = evalLiteral(literal);
  } catch (e) {
    failures.push({ slug: form.slug, sampleIndex: -1, check: 'required', field: '<eval>', details: (e as Error).message });
    continue;
  }
  if (!Array.isArray(samples) || samples.length === 0) {
    failures.push({ slug: form.slug, sampleIndex: -1, check: 'required', field: '<form>', details: 'samples not an array or empty' });
    continue;
  }

  // For each sample row, validate required + dropdown
  samples.forEach((sample, idx) => {
    for (const field of form.fields as FormField[]) {
      const value = sample[field.id];
      const isBlank = value === undefined || value === null || value === '';

      // Respect visibleWhen — a hidden field is not effectively required.
      const vw: any = (field as any).visibleWhen;
      let isVisible = true;
      if (vw && typeof vw === 'object') {
        const gateVal = sample[vw.field];
        if ('equals' in vw) {
          isVisible = (gateVal ?? '') === vw.equals;
        } else if (Array.isArray(vw.equalsOneOf)) {
          isVisible = vw.equalsOneOf.includes(gateVal);
        }
      }

      if (field.required && isBlank && isVisible) {
        failures.push({ slug: form.slug, sampleIndex: idx, check: 'required', field: field.id, details: `required field is ${value === undefined ? 'missing' : 'empty'}` });
      }
      if (field.type === 'dropdown' && !isBlank && Array.isArray(field.options)) {
        if (!field.options.includes(value)) {
          failures.push({ slug: form.slug, sampleIndex: idx, check: 'enum', field: field.id, details: `value ${JSON.stringify(value)} not in options ${JSON.stringify(field.options)}` });
        }
      }
      totalChecks++;
    }
  });
}

// ── Report ───────────────────────────────────────────────────────────────────
if (failures.length === 0) {
  console.log(`✓ All sample data passes validation. (${totalChecks} field-checks across ${FORMS.length} forms)`);
  process.exit(0);
}

console.error(`✗ ${failures.length} sample-data validation failure(s) (${totalChecks} field-checks across ${FORMS.length} forms):\n`);
const grouped: Record<string, Failure[]> = {};
for (const f of failures) {
  (grouped[f.slug] ??= []).push(f);
}
for (const slug of Object.keys(grouped)) {
  console.error(`  [${slug}]`);
  for (const f of grouped[slug]) {
    const sampleLabel = f.sampleIndex === -1 ? '<form>' : `sample[${f.sampleIndex}]`;
    console.error(`    ${sampleLabel} ${f.check}: ${f.field} — ${f.details}`);
  }
}
process.exit(1);

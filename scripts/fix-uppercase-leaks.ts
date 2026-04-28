#!/usr/bin/env tsx
/**
 * One-shot fixer for autoUppercase lowercase-leaks (companion to
 * audit-uppercase-leaks.ts). For each leak the auditor would report, find the
 * exact `key: 'value'` literal inside the corresponding `samplesBySlug` row in
 * `src/app/forms/[slug]/page.tsx` and rewrite the value to uppercase IN PLACE,
 * preserving quote style and surrounding whitespace.
 *
 * Why a script instead of hand edits: 137 leaks across 15 forms; hand-editing
 * is slow and risks accidental over-replacement (e.g. "Quezon City" appears in
 * dozens of unrelated rows). This walks each `slug → sample[i] → field` triple
 * and operates only inside that row's bounds.
 *
 * Run: `npx tsx scripts/fix-uppercase-leaks.ts`
 * Idempotent: re-run after edits — exits 0 with "no changes" once clean.
 *
 * Safety: writes to disk via fs.writeFileSync; commit before running.
 * Verify with `npm run audit:uppercase` and `npm test` afterwards.
 */
import * as fs from 'fs';
import * as path from 'path';
import { FORMS, type FormField } from '../src/data/forms';

const PAGE_PATH = path.join(__dirname, '..', 'src', 'app', 'forms', '[slug]', 'page.tsx');

function bracketBalanced(text: string, startIdx: number, open: string, close: string): { end: number } | null {
  if (text[startIdx] !== open) return null;
  let depth = 0;
  let inStr: string | null = null;
  let esc = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') { esc = true; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && text[i + 1] === '/') {
      const eol = text.indexOf('\n', i);
      i = eol === -1 ? text.length : eol;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return { end: i };
    }
  }
  return null;
}

function findRowSpans(arrayText: string): { start: number; end: number }[] {
  // Walks the array literal and returns absolute spans (relative to arrayText)
  // of each top-level `{...}` row.
  const spans: { start: number; end: number }[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let esc = false;
  for (let i = 1; i < arrayText.length - 1; i++) {
    const ch = arrayText[i];
    if (esc) { esc = false; continue; }
    if (inStr) {
      if (ch === '\\') { esc = true; continue; }
      if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue; }
    if (ch === '{') {
      if (depth === 0) {
        const b = bracketBalanced(arrayText, i, '{', '}');
        if (b) {
          spans.push({ start: i, end: b.end });
          i = b.end;
          continue;
        }
      }
      depth++;
    } else if (ch === '}') {
      depth--;
    }
  }
  return spans;
}

let src = fs.readFileSync(PAGE_PATH, 'utf8');

const samplesByMatch = src.match(/samplesBySlug\b[^=]*=\s*\{/);
if (!samplesByMatch || samplesByMatch.index === undefined) {
  console.error('FATAL: could not locate samplesBySlug declaration');
  process.exit(2);
}
const objIdx = src.indexOf('{', samplesByMatch.index + samplesByMatch[0].length - 1);
const objEnd = bracketBalanced(src, objIdx, '{', '}')?.end;
if (!objEnd) {
  console.error('FATAL: could not bracket-balance samplesBySlug body');
  process.exit(2);
}

// Build slug → array-literal absolute span by scanning the object body for
// "'<slug>': [...]" pairs.
// Some slugs reference a named top-level const (e.g. `hqpSamples`) instead of
// an inline literal — for those we resolve the const declaration's array span.
type SlugSpan = { slug: string; arrayStart: number; arrayEnd: number };
const slugSpans: SlugSpan[] = [];

function findConstArraySpan(name: string): { start: number; end: number } | null {
  const re = new RegExp(`\\bconst\\s+${name}\\s*(?::[^=]+)?=\\s*\\[`, 'g');
  const m = re.exec(src);
  if (!m) return null;
  const bracketIdx = src.indexOf('[', m.index + m[0].length - 1);
  const b = bracketBalanced(src, bracketIdx, '[', ']');
  if (!b) return null;
  return { start: bracketIdx, end: b.end };
}

{
  const inner = src.slice(objIdx + 1, objEnd);
  const innerOffset = objIdx + 1;
  const slugRe = /'([a-z0-9-]+)'\s*:\s*/g;
  let m: RegExpExecArray | null;
  while ((m = slugRe.exec(inner)) !== null) {
    // Filter out matches inside nested braces or strings.
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
    const after = m.index + m[0].length;
    const ch = inner[after];
    if (ch === '[') {
      const b = bracketBalanced(inner, after, '[', ']');
      if (!b) continue;
      slugSpans.push({
        slug: m[1],
        arrayStart: innerOffset + after,
        arrayEnd: innerOffset + b.end,
      });
    } else if (/[a-zA-Z_]/.test(ch)) {
      const idMatch = inner.slice(after).match(/^([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (!idMatch) continue;
      const span = findConstArraySpan(idMatch[1]);
      if (!span) continue;
      // Avoid duplicate spans when multiple slugs share the same const.
      if (slugSpans.some(s => s.arrayStart === span.start)) {
        slugSpans.push({ slug: m[1], arrayStart: span.start, arrayEnd: span.end });
      } else {
        slugSpans.push({ slug: m[1], arrayStart: span.start, arrayEnd: span.end });
      }
    }
  }
}

// For each form, identify autoUppercase fields and walk samples in-source.
type Edit = { absStart: number; absEnd: number; replacement: string; slug: string; field: string; sampleIndex: number };
const edits: Edit[] = [];

for (const form of FORMS) {
  const span = slugSpans.find(s => s.slug === form.slug);
  if (!span) continue;
  const upperFieldIds = new Set(
    (form.fields as FormField[]).filter(f => f.autoUppercase).map(f => f.id)
  );
  if (upperFieldIds.size === 0) continue;
  const arrayText = src.slice(span.arrayStart, span.arrayEnd + 1);
  const rows = findRowSpans(arrayText);
  rows.forEach((row, sampleIndex) => {
    const rowAbsStart = span.arrayStart + row.start;
    const rowText = src.slice(rowAbsStart, span.arrayStart + row.end + 1);
    // Match `key: 'value'` or `key: "value"` (no template literals expected for samples).
    const kvRe = /(\b[a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*('([^'\\]*(?:\\.[^'\\]*)*)'|"([^"\\]*(?:\\.[^"\\]*)*)")/g;
    let kv: RegExpExecArray | null;
    while ((kv = kvRe.exec(rowText)) !== null) {
      const key = kv[1];
      if (!upperFieldIds.has(key)) continue;
      const quote = kv[2][0]; // ' or "
      const rawValue = kv[3] ?? kv[4] ?? '';
      // Decode minimal escape sequences relevant for case-comparison.
      const decoded = rawValue.replace(/\\(.)/g, (_, c) => c);
      if (!/[a-z]/.test(decoded)) continue;
      const upperDecoded = decoded.toUpperCase();
      // Re-encode: only the original escape pairs we decoded need to be preserved.
      // Since uppercase preserves backslashes and quote escapes, just re-escape
      // any backslashes and the quote char.
      const reEncoded = upperDecoded
        .replace(/\\/g, '\\\\')
        .replace(new RegExp(quote, 'g'), `\\${quote}`);
      const valueAbsStart = rowAbsStart + kv.index + kv[0].indexOf(kv[2]);
      const valueAbsEnd = valueAbsStart + kv[2].length;
      const replacement = `${quote}${reEncoded}${quote}`;
      edits.push({ absStart: valueAbsStart, absEnd: valueAbsEnd, replacement, slug: form.slug, field: key, sampleIndex });
    }
  });
}

if (edits.length === 0) {
  console.log('✓ No lowercase leaks to fix.');
  process.exit(0);
}

// Apply edits from end to start so offsets remain valid.
edits.sort((a, b) => b.absStart - a.absStart);
for (const e of edits) {
  src = src.slice(0, e.absStart) + e.replacement + src.slice(e.absEnd);
}
fs.writeFileSync(PAGE_PATH, src, 'utf8');

const bySlug = new Map<string, number>();
for (const e of edits) bySlug.set(e.slug, (bySlug.get(e.slug) ?? 0) + 1);
console.log(`✓ Uppercased ${edits.length} sample literal(s) across ${bySlug.size} forms.`);
for (const [slug, n] of bySlug) console.log(`  [${slug}] ${n} fix(es)`);
console.log('\nRe-run `npm run audit:uppercase` to confirm clean and `npm test` to verify smoke.');

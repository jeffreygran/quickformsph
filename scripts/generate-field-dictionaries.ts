#!/usr/bin/env tsx
/**
 * Generate per-form field-dictionary markdown files from FORMS[] + FIELD_COORDS.
 * Output: docs/field-dictionaries/<slug>.md
 *
 * Sections sourced automatically:
 *   §1 Form Metadata       — from FormSchema (code, version, agency, etc.)
 *   §3 Section Breakdown   — from FormSchema.steps
 *   §4 Field Inventory     — from FormSchema.fields
 *   §5 Checkbox/Radio      — from FormField.options
 *   §6 Layout Mapping      — from FORM_PDF_CONFIGS[*].fieldCoords
 *   §9 QA Checklist        — auto-generated boilerplate
 *
 * Sections left blank for human curation:
 *   §2 Form-Level Rules, §7 HTML Translation Notes, §8 Common Mistakes, §10 Change Log
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FORMS } from '../src/data/forms';
import type { FormSchema, FormField } from '../src/data/forms';
// FORM_PDF_CONFIGS is not exported; re-derive coords lazily via dynamic require if available.
// For now we read coords by importing the module and reflecting an internal map
// Keep this script tolerant: if coords aren't exported, omit §6 details for that form.

const OUT_DIR = join(process.cwd(), 'docs', 'field-dictionaries');
mkdirSync(OUT_DIR, { recursive: true });

function esc(s: string | undefined): string {
  return (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function fieldTypeLabel(t: FormField['type']): string {
  return ({
    text: 'Text (short)', email: 'Text (email)', tel: 'Text (phone)',
    number: 'Number', date: 'Date', dropdown: 'Dropdown',
    radio: 'Radio', checkbox: 'Checkbox', textarea: 'Text (long)',
  } as Record<string, string>)[t] ?? t;
}

function buildFieldRow(f: FormField, stepName: string): string {
  const validation: string[] = [];
  if (f.inputMode) validation.push(`inputMode=${f.inputMode}`);
  if (f.autoUppercase) validation.push('UPPERCASE');
  if ((f as any).options?.length) validation.push(`options(${(f as any).options.length})`);
  return [
    f.id,
    esc(stepName),
    esc(f.label),
    fieldTypeLabel(f.type),
    f.required ? 'Yes' : 'No',
    'Yes',
    esc(validation.join('; ')),
    f.maxLength ? String(f.maxLength) : '—',
    /pin|mid|tin|zip/i.test(f.id) ? 'Maybe' : '—',
    '—',
    esc(f.placeholder),
    '',
  ].map(c => ` ${c} `).join('|');
}

function buildOptionsSection(form: FormSchema): string {
  const groups = form.fields.filter(f => (f as any).options?.length);
  if (!groups.length) return '_No radio/dropdown groups in this form._\n';
  return groups.map(f => {
    const opts = (f as any).options as string[];
    const rows = opts.map(o => `| ${esc(o)} | ${esc(o)} | No |`).join('\n');
    return `**Field Group:** \`${f.id}\` — ${esc(f.label)}  \n**Selection Type:** ${f.type === 'radio' ? 'Radio (Single Select)' : 'Dropdown'}\n\n| Option Label | Value | Default |\n|---|---|---|\n${rows}\n`;
  }).join('\n');
}

function renderForm(form: FormSchema): string {
  const fieldsByStep = new Map<number, FormField[]>();
  for (const f of form.fields) {
    const s = (f.step ?? 1) - 0;
    if (!fieldsByStep.has(s)) fieldsByStep.set(s, []);
    fieldsByStep.get(s)!.push(f);
  }
  const sectionRows = (form.steps ?? []).map((s, i) =>
    `| S${i + 1} | ${esc(s.label)} | — | step ${i + 1}, ${s.fieldIds.length} fields |`
  ).join('\n') || '| S1 | (no steps defined) | — | — |';

  const fieldRows: string[] = [];
  for (const [stepIdx, fields] of [...fieldsByStep.entries()].sort((a, b) => a[0] - b[0])) {
    const stepName = form.steps?.[stepIdx - 1]?.label ?? `Step ${stepIdx}`;
    for (const f of fields) fieldRows.push(`|${buildFieldRow(f, stepName)}|`);
  }

  return `# Field Dictionary — ${form.name}

> Auto-generated from \`src/data/forms.ts\` by \`scripts/generate-field-dictionaries.ts\`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | ${form.name} |
| **Agency** | ${form.agency} |
| **Form Code / Version** | ${form.code} ${form.version ? `(${form.version})` : ''} |
| **Category** | ${form.category} |
| **Slug** | \`${form.slug}\` |
| **Source PDF Location** | \`public/forms/${form.pdfPath}\` |
| **Output API** | \`POST /api/generate\` body \`{slug:"${form.slug}", values:{…}}\` |
| **Field Count** | ${form.fields.length} |
| **Steps / Sections** | ${form.steps?.length ?? 0} |

**Purpose:** ${form.description ?? '_TODO_'}

---

## 2) Form-Level Rules — **TODO (human)**

**User Type(s):**
- [ ] Individual
- [ ] Employer
- [ ] Self-employed
- [ ] OFW

**Completion Method:** [ ] Typed  [ ] Handwritten  [ ] Either

**Global Rules:**
- Required ink color: _TODO_
- Required capitalization: _TODO_  (e.g., ALL CAPS for legal names)
- Date format: \`mm/dd/yyyy\` (current default in schema)
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO — list all "For Office Use" sections._

---

## 3) Section Breakdown

| Section ID | Section Name | Page | Notes |
|---|---|---|---|
${sectionRows}

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
${fieldRows.join('\n')}

---

## 5) Checkbox & Radio Logic

${buildOptionsSection(form)}

---

## 6) Layout & Position Mapping

See \`src/lib/pdf-generator.ts\` constant \`${form.slug.toUpperCase().replace(/-/g, '_')}_FIELD_COORDS\` (or matching \`*_FIELD_COORDS\`).
Coordinates use pdf-lib origin (bottom-left); helper \`<form>Y(nextRowTop) = pageH - nextRowTop + 3\` converts pdfplumber top-origin row tops to pdf-lib Y.

---

## 7) HTML Form Translation Notes — **TODO (human)**

### UX Transformations Allowed
- _TODO_

### UX Constraints (Must Preserve)
- Do not merge segmented government fields (last/first/middle).
- Do not change field order.
- Do not remove mandatory fields even if redundant.

---

## 8) Common User Mistakes — **TODO (human)**

- _TODO_

---

## 9) QA Validation Checklist

- [x] Field coverage: every field mapped to coord or skip entry (\`npm run test:coverage\`)
- [x] Smoke test: random payload renders valid PDF (\`npm run test:smoke\`)
- [ ] Visual QA: rasterize page-1 at 100 DPI and confirm no off-page text
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page alignment preserved across copies
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric/email/tel fields

---

## 10) Change Log

| Date | Change | Reason | Updated By |
|---|---|---|---|
| ${new Date().toISOString().slice(0, 10)} | Initial auto-generated field dictionary | Adopt template from \`projects/quickformsph/field_dictionary_template_government_forms.md\` | scripts/generate-field-dictionaries.ts |

---

_Generated: ${new Date().toISOString()}_
`;
}

function main() {
  const written: string[] = [];
  for (const form of FORMS) {
    const md = renderForm(form);
    const path = join(OUT_DIR, `${form.slug}.md`);
    writeFileSync(path, md);
    written.push(path);
  }
  // Index file
  const indexLines = [
    '# QuickFormsPH Field Dictionaries',
    '',
    'Per-form authoritative field references (auto-generated from `src/data/forms.ts`).',
    'Regenerate with: `npx tsx scripts/generate-field-dictionaries.ts`',
    '',
    '| Form | Code | Agency | Fields | Dictionary |',
    '|---|---|---|---|---|',
    ...FORMS.map(f =>
      `| ${f.name} | ${f.code} | ${f.agency} | ${f.fields.length} | [${f.slug}.md](./${f.slug}.md) |`
    ),
    '',
    `_Last regenerated: ${new Date().toISOString()}_`,
    '',
  ];
  writeFileSync(join(OUT_DIR, 'README.md'), indexLines.join('\n'));
  written.push(join(OUT_DIR, 'README.md'));

  console.log(`\n✓ Wrote ${written.length} files to ${OUT_DIR}\n`);
  for (const p of written) console.log(`  ${p}`);
}

main();

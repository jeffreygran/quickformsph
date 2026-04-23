#!/usr/bin/env tsx
/**
 * Generate / refresh per-form field-dictionary markdown files.
 *
 * KEY: Uses sentinel markers so HUMAN edits survive regen.
 *   <!-- AUTOGEN:START name="metadata" -->...<!-- AUTOGEN:END name="metadata" -->
 *
 * Only content between matching markers is replaced. Anything else (§2 form-level
 * rules, §7 HTML notes, §8 common mistakes) is preserved across regenerations.
 *
 * Auto-regenerated sections:
 *   metadata, sections, fields, choices, layout, qa-checklist
 *
 * Also validates: every coord must reference a real schema field (exit 1 with --strict).
 *
 * Usage: npm run docs:dictionaries [-- --strict]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { FORMS } from '../src/data/forms';
import type { FormSchema, FormField } from '../src/data/forms';
import { FORM_PDF_CONFIGS } from '../src/lib/pdf-generator';

const OUT_DIR = join(process.cwd(), 'docs', 'field-dictionaries');
mkdirSync(OUT_DIR, { recursive: true });

const esc = (s?: string) => (s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const FIELD_TYPE_LABEL: Record<string, string> = {
  text: 'Text', email: 'Text (email)', tel: 'Text (phone)', number: 'Number',
  date: 'Date', dropdown: 'Dropdown', radio: 'Radio', checkbox: 'Checkbox',
  textarea: 'Text (long)',
};

// ─── Per-section renderers ─────────────────────────────────────────────────
function renderMetadata(form: FormSchema): string {
  return `| Field | Value |
|---|---|
| **Form Name** | ${form.name} |
| **Agency** | ${form.agency} |
| **Form Code / Version** | ${form.code}${form.version ? ` (${form.version})` : ''} |
| **Category** | ${form.category} |
| **Slug** | \`${form.slug}\` |
| **Source PDF** | \`public/forms/${form.pdfPath}\` |
| **API** | \`POST /api/generate\` body \`{slug:"${form.slug}", values:{…}}\` |
| **Field Count** | ${form.fields.length} |
| **Steps / Sections** | ${form.steps?.length ?? 0} |

**Purpose:** ${form.description ?? '_TODO_'}`;
}

function renderSections(form: FormSchema): string {
  if (!form.steps?.length) return '_No wizard steps defined._';
  const rows = form.steps.map((s, i) =>
    `| S${i + 1} | ${esc(s.label)} | ${s.fieldIds.length} fields |`
  ).join('\n');
  return `| Section ID | Section Name | Notes |
|---|---|---|
${rows}`;
}

function renderFields(form: FormSchema): string {
  const stepName = (idx?: number) => form.steps?.[(idx ?? 1) - 1]?.label ?? `Step ${idx ?? 1}`;
  const rows = [...form.fields]
    .sort((a, b) => (a.step ?? 1) - (b.step ?? 1))
    .map(f => {
      const validation: string[] = [];
      if (f.inputMode) validation.push(`inputMode=${f.inputMode}`);
      if (f.autoUppercase) validation.push('UPPERCASE');
      if ((f as any).options?.length) validation.push(`${(f as any).options.length} options`);
      return `| \`${f.id}\` | ${esc(stepName(f.step))} | ${esc(f.label)} | ${FIELD_TYPE_LABEL[f.type] ?? f.type} | ${f.required ? 'Yes' : 'No'} | ${esc(validation.join('; '))} | ${f.maxLength ?? '—'} | ${esc(f.placeholder)} |`;
    }).join('\n');
  return `| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
${rows}`;
}

function renderChoices(form: FormSchema): string {
  const groups = form.fields.filter(f => (f as any).options?.length);
  if (!groups.length) return '_No radio/dropdown groups in this form._';
  return groups.map(f => {
    const opts = (f as any).options as string[];
    const rows = opts.map(o => `| ${esc(o)} | \`${esc(o)}\` |`).join('\n');
    return `**\`${f.id}\` — ${esc(f.label)}** (${f.type})\n\n| Option | Value |\n|---|---|\n${rows}`;
  }).join('\n\n');
}

function renderLayout(form: FormSchema): string {
  const cfg = FORM_PDF_CONFIGS[form.slug];
  if (!cfg) return '_No PDF coord config registered for this form._';
  const coords = cfg.fieldCoords;
  const skips = cfg.skipValues ?? {};
  const fieldIds = new Set(form.fields.map(f => f.id));
  const coordRows = Object.entries(coords)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, c]) => {
      const inSchema = fieldIds.has(id) ? '✓' : '⚠ orphan';
      return `| \`${id}\` | ${c.page} | ${c.x} | ${c.y.toFixed(2)} | ${c.fontSize} | ${c.maxWidth ?? '—'} | ${inSchema} |`;
    }).join('\n');
  const skipList = Object.keys(skips).length
    ? Object.entries(skips).map(([k, v]) => `- \`${k}\`: ${v.map(x => `\`${x || '<empty>'}\``).join(', ')}`).join('\n')
    : '_None._';
  const checkboxCount = cfg.checkboxCoords ? Object.keys(cfg.checkboxCoords).length : 0;
  return `**Coord origin:** pdf-lib (bottom-left). Use \`<form>Y(nextRowTop) = pageH - nextRowTop + 3\` to convert pdfplumber row tops.

**Copy Y offsets:** ${(cfg.copyYOffsets ?? [0]).join(', ')}
**Checkbox coord groups:** ${checkboxCount}

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
${coordRows}

**Skip values (treated as blank):**

${skipList}`;
}

function renderQAChecklist(): string {
  return `- [x] Coverage CI: every field has coord or skip entry — \`npm run test:coverage\`
- [x] Smoke test: random payload renders valid PDF — \`npm run test:smoke\`
- [ ] Visual QA: rasterize at 100 DPI, no off-page text or wrong-cell overflow
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page / multi-copy alignment preserved
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric / email / tel fields`;
}

// ─── Splice helper ──────────────────────────────────────────────────────────
function spliceBlock(doc: string, name: string, body: string): string {
  const start = `<!-- AUTOGEN:START name="${name}" -->`;
  const end   = `<!-- AUTOGEN:END name="${name}" -->`;
  const block = `${start}\n${body}\n${end}`;
  const rx = new RegExp(`<!-- AUTOGEN:START name="${name}" -->[\\s\\S]*?<!-- AUTOGEN:END name="${name}" -->`);
  if (rx.test(doc)) return doc.replace(rx, block);
  return doc.trimEnd() + '\n\n' + block + '\n';
}

// ─── First-time scaffold ───────────────────────────────────────────────────
function scaffold(form: FormSchema): string {
  return `# Field Dictionary — ${form.name}

> Authoritative reference for ${form.code}. Auto-generated sections are wrapped
> in \`<!-- AUTOGEN -->\` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run \`npm run docs:dictionaries\` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
<!-- AUTOGEN:END name="metadata" -->

---

## 2) Form-Level Rules

> _Human-curated. Edit freely; regen will not touch this section._

**User Type(s):**
- [ ] Individual
- [ ] Employer
- [ ] Self-employed
- [ ] OFW

**Completion Method:** [ ] Typed  [ ] Handwritten  [ ] Either

**Global Rules:**
- Required ink color: _TODO_
- Required capitalization: _TODO_
- Date format: \`mm/dd/yyyy\`
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO_

---

## 3) Section Breakdown

<!-- AUTOGEN:START name="sections" -->
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
<!-- AUTOGEN:END name="layout" -->

---

## 7) HTML Form Translation Notes

> _Human-curated._

### UX Transformations Allowed
- _TODO_

### UX Constraints (Must Preserve)
- Do not merge segmented government fields (last/first/middle).
- Do not change field order.
- Do not remove mandatory fields even if redundant.

---

## 8) Common User Mistakes

> _Human-curated._

- _TODO_

---

## 9) QA Validation Checklist

<!-- AUTOGEN:START name="qa-checklist" -->
<!-- AUTOGEN:END name="qa-checklist" -->

---

## 10) Change Log

> _Append-only history. Add a row whenever the form version changes or a coord bug is fixed._

| Date | Change | Reason | Updated By |
|---|---|---|---|
| ${new Date().toISOString().slice(0, 10)} | Initial dictionary | Adopt template | scripts/generate-field-dictionaries.ts |
`;
}

// ─── Validator ─────────────────────────────────────────────────────────────
function validate(form: FormSchema): string[] {
  const issues: string[] = [];
  const cfg = FORM_PDF_CONFIGS[form.slug];
  if (!cfg) { issues.push(`no PDF config registered`); return issues; }
  const fieldIds = new Set(form.fields.map(f => f.id));
  for (const coordId of Object.keys(cfg.fieldCoords)) {
    if (!fieldIds.has(coordId)) issues.push(`orphan coord \`${coordId}\` (no matching schema field)`);
  }
  return issues;
}

// ─── Main ──────────────────────────────────────────────────────────────────
function main() {
  const allIssues: Array<{ slug: string; issues: string[] }> = [];
  for (const form of FORMS) {
    const path = join(OUT_DIR, `${form.slug}.md`);
    let doc = existsSync(path) ? readFileSync(path, 'utf8') : scaffold(form);
    if (!doc.includes('AUTOGEN:START')) doc = scaffold(form);

    doc = spliceBlock(doc, 'metadata',     renderMetadata(form));
    doc = spliceBlock(doc, 'sections',     renderSections(form));
    doc = spliceBlock(doc, 'fields',       renderFields(form));
    doc = spliceBlock(doc, 'choices',      renderChoices(form));
    doc = spliceBlock(doc, 'layout',       renderLayout(form));
    doc = spliceBlock(doc, 'qa-checklist', renderQAChecklist());

    writeFileSync(path, doc);

    const issues = validate(form);
    if (issues.length) allIssues.push({ slug: form.slug, issues });
  }

  const indexLines = [
    '# QuickFormsPH Field Dictionaries',
    '',
    'Per-form authoritative references. Auto-sections wrap in `<!-- AUTOGEN -->` markers — human edits outside markers are preserved across regeneration.',
    '',
    'Regenerate: `npm run docs:dictionaries`',
    'Validate (fail on orphans): `npm run docs:validate`',
    '',
    '| Form | Code | Agency | Fields | Coords | Dictionary |',
    '|---|---|---|---|---|---|',
    ...FORMS.map(f => {
      const coords = FORM_PDF_CONFIGS[f.slug] ? Object.keys(FORM_PDF_CONFIGS[f.slug].fieldCoords).length : 0;
      return `| ${f.name} | ${f.code} | ${f.agency} | ${f.fields.length} | ${coords} | [${f.slug}.md](./${f.slug}.md) |`;
    }),
    '',
    `_Last regenerated: ${new Date().toISOString()}_`,
    '',
  ];
  writeFileSync(join(OUT_DIR, 'README.md'), indexLines.join('\n'));

  console.log(`✓ Refreshed ${FORMS.length} dictionaries (+ README index) at ${OUT_DIR}`);
  if (allIssues.length) {
    console.error(`\n⚠ Validation issues:`);
    for (const { slug, issues } of allIssues) {
      console.error(`  ${slug}:`);
      for (const i of issues) console.error(`    - ${i}`);
    }
    if (process.argv.includes('--strict')) process.exit(1);
  } else {
    console.log(`✓ Validation: no orphan coords.`);
  }
}

main();

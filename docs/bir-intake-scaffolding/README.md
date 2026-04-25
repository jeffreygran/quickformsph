# BIR Intake Scaffolding (Gate 1/2 — April 2026)

This folder contains **pre-implementation scaffolding** for the four new BIR
forms delivered with the October 2025 (ENCS) revision:

- BIR 1901 — Application for Registration (Self-Employed / Mixed Income / Estate / Trust)
- BIR 1902 — Application for Registration (Individuals Earning Purely Compensation Income)
- BIR 1904 — Application for Registration (One-Time Taxpayer / EO 98)
- BIR 1905 — Application for Registration Information Update / Correction / Cancellation

## Status

**Gate 1 and Gate 2 only.** No schema has been added to `src/data/forms.ts`;
no coord map has been added to `src/lib/pdf-generator.ts`; no PDFs have been
generated. The forms are NOT available on the live site yet.

This scaffolding exists so the next implementation session can start from
a known, verified baseline without re-doing the layout analysis.

## Why this was deferred

During the intake attempt on 2026-04-24, layout analysis revealed that BIR
forms use a **different rect-pairing pattern** than the PhilHealth / Pag-IBIG
forms the codebase was previously tuned for (see `learnings-addendum-BIR.md`).
To hit the SOP bar of "zero BLOCKER/MAJOR defects on first QA" — especially
for 1901 (~150 fields) and 1905 (~140 fields with heavy conditional logic) —
a single-session batch delivery was not feasible. This scaffolding turns the
remaining work into a reproducible, low-risk intake that can be executed
form-by-form in subsequent sessions.

## Contents

```
README.md                   — this file
bir-1901-fields.md          — field dictionary (draft) for 1901
bir-1902-fields.md          — field dictionary (draft) for 1902
bir-1904-fields.md          — field dictionary (draft) for 1904
bir-1905-fields.md          — field dictionary (draft) for 1905
extract-layouts.py          — Gate 1 extractor (pdfplumber → JSON)
digest.py                   — human-readable char-row digest
classify-cells.py           — text_cell / digit_box / checkbox / agency_prefilled classifier
extracts/*.json.gz          — checked-in Gate 1 extracts (reproducible via extract-layouts.py)
previews/*.png              — page 1 renderings at 110 DPI
learnings-addendum-BIR.md   — new rect patterns discovered, append to main learnings file
```

## How to resume

### Suggested order

1. **1904** (smallest; 2 pages; ~55 fields; no repeating tables)
2. **1902** (2 pages; ~70 fields; pre-filled default values to account for)
3. **1901** (4 pages; ~150 fields; requires LOB repeating-row extension to CoordsMap)
4. **1905** (4 pages; ~140 fields; heavy conditional logic + repeating facility rows)

1904 and 1902 are realistic single-session implementations each. 1901 and
1905 likely need 2 sessions each (schema + wizard UX in one, coords + QA in
the next) because they introduce new coord-map primitives.

### Per-form checklist (Gates 3–8)

- [ ] **Gate 3** Schema: add form to `src/data/forms.ts` — sections `steps[]`,
      fields[] with types/validation/step. Use the field dictionary as ground truth.
- [ ] **Gate 4** Coord map: derive `<SLUG>_FIELD_COORDS` + `<SLUG>_SKIP_VALUES`
      ENTIRELY from `classify-cells.py` output. Never hand-transcribe.
      Compute `cx = (x0+x1)/2` in code.
- [ ] **Gate 4b** Checkbox coords: separate `<SLUG>_CHECKBOX_COORDS` dict.
      Every radio/checkbox option gets its own `(x, y, page)` entry.
- [ ] **Gate 4c** Pre-filled `0` agency cells: verify their cx is EXCLUDED
      from any `boxCenters[]` array.
- [ ] **Gate 5** Wire into `FORM_PDF_CONFIGS` in `pdf-generator.ts`.
- [ ] **Gate 6** Build two personas (`/tmp/<slug>_persona_{a,b}.json`);
      every field populated with distinct plausible Filipino values.
      Persona A exercises conditional sections; Persona B exercises the
      null/default path.
- [ ] **Gate 7a** Analytical char-cx diff: render PDF, extract every char,
      confirm `|rendered_cx − expected_cx| < 1 pt` for every digit-box field.
- [ ] **Gate 7b** Char-in-rect diff: every rendered char must lie inside its
      target rect.
- [ ] **Gate 7c** Gray-cell respect: no char inside a pre-filled `0` agency cell.
- [ ] **Gate 7d** MANDATORY zoom-crop visual pass at 150 DPI, ≥4 horizontal
      bands per page, `view_image` every band.
- [ ] **Gate 8** Intake report + learnings append.

### Don't forget

- `src/components/FormWizard.tsx` (or equivalent) must render the new step
  structure. Conditional sections (1905 especially) require `dependsOn`
  logic in the wizard.
- Spouse fields: only render when `civil_status == 'married'`.
- ZIP Code validation: `^\d{4}$` — digit boxes often show 4 cells.

## How to regenerate extracts

```bash
cd ~/projects/quickformsph-dev
python3 docs/bir-intake-scaffolding/extract-layouts.py
gzip -f docs/bir-intake-scaffolding/extracts/*.json
```

## How to use the digests

```bash
# Line-by-line char cluster for 1904
python3 docs/bir-intake-scaffolding/digest.py bir-1904 | less

# Classified fillable cells for 1904
python3 docs/bir-intake-scaffolding/classify-cells.py bir-1904
```

---

*Prepared by: Irwin · Co-owner: Mai · 2026-04-24*

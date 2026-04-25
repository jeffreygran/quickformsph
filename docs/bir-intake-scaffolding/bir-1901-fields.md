# BIR 1901 — Field Dictionary (Gate 1/2 draft)

**Source PDF:** `public/forms/BIR - 1901 October 2025 ENCS Final.pdf`
**Size:** 612 × 936 pt · **Pages:** 4
**Audience:** Self-Employed (Single Proprietor/Professional), Mixed Income Individuals,
Non-Resident Alien Engaged in Trade/Business, Estate and Trust.
**Slug (proposed):** `bir-1901`

> **Status: DRAFT — Gate 1/2 only.** This is BIR's most complex registration form.
> Page 1 covers taxpayer info; pages 2–4 cover business registration, tax types,
> line of business, registration fee, attached documents checklist, declaration.

## Page 1 — Parts I–IV

### Header / Registering Office
- `dln` (AGENCY, SKIP)
- `registering_office` — radio: `head_office` / `branch_office` / `facility`
- `registration_date` — AGENCY, SKIP
- `philsys_pcn` — text
- `new_tin_to_be_issued` — AGENCY (pre-filled `0 0 0 0 0`), SKIP

### Part I — Taxpayer Information
- 4 `existing_tin` — 12+5 digit boxes; trailing 5 SKIP (pre-filled)
- 5 `rdo_code` — AGENCY, SKIP
- 6 `taxpayer_type` — radio, **13 options**: 
  - Single Proprietorship Only (Resident Citizen)
  - Single Proprietor – Digital Service Provider
  - Resident Alien – Single Proprietorship
  - Resident Alien – Professional
  - Professional – Licensed (PRC, IBP)
  - Professional – In General
  - Professional and Single Proprietor
  - Mixed Income Earner – Compensation + Single Proprietor
  - Mixed Income Earner – Compensation + Professional
  - Mixed Income Earner – Compensation + Single Proprietor & Professional
  - Non-Resident Alien Engaged in Trade/Business
  - Estate – Filipino Citizen
  - Estate – Foreign National
  - Trust – Filipino Citizen
  - Trust – Foreign National
- 7 `name` — last/first/middle/suffix/nickname (+ estate/trust variant)
- 8 `gender` — radio male/female
- 9 `civil_status` — radio single/married/widow/legally_separated
- 10 `date_of_birth` — date boxes
- 11 `place_of_birth` — text
- 12 `mothers_maiden_name` — text
- 13 `fathers_name` — text
- 14 `citizenship` — text
- 15 `other_citizenship` — text
- 16 `local_address_*` — 10 sub-fields (unit, building, lot, street, subdivision, barangay, town, city, province, zip)
- 17 `business_address_*` — 10 sub-fields (may be same as local)
- 18 `foreign_address` — text
- 19 `municipality_code` — AGENCY, SKIP
- 20 `purpose_of_tin` — text (generally pre-printed narrative; verify)
- 21 `id_*` — Type / ID Number / Effectivity / Expiry / Issuer / Place of Issue
- 22 `preferred_contact_type` — checkboxes: landline/fax/mobile/email + values
- 23 `tax_8pct_option` — radio yes/no "Are you availing of the 8% income tax rate option?"

### Part II — Taxpayer Classification
- 24 `annual_gross_sales` — radio 4 options: Micro / Small / Medium / Large

### Part III — Spouse Information
- 25–29 — mirrors 1904 Part II (employment status, spouse name, TIN, employer name, employer TIN)

### Part IV — Authorized Representative
- 30 `auth_rep_name` — if Individual (last/first/middle/suffix/nickname) or Non-Individual (registered name)

## Pages 2–4

Not itemised in detail yet but include:
- **Business details**: Trade name, Business line, Start of business, Accounting type (fiscal/calendar), Fiscal year end, Issuance tax type, Registration fee info.
- **Line of Business (LOB)**: One primary + multiple secondary rows with PSIC codes — table.
- **Tax Type selection matrix**: Income Tax / Percentage Tax / VAT / Withholding / Excise / DST / Other — checkboxes with form-type, ATC, effectivity.
- **Accountant / Bookkeeper info**: name, TIN, address, accreditation.
- **Attached documents checklist**: many checkboxes.
- **Declaration + signature block** (system).
- **For BIR Use Only**: entire sections of agency-only cells (SKIP).

## Gate 1 stats

- 4 pages, 23,125 chars, 19,514 rects. Largest of the four.
- Rect-pair pattern identical to 1904 (outer bevel `h≈14-20` + inner `h≈10`, both `ns=0.749`).
- Multiple pre-filled `0` agency cells across the form — must catalogue each and add to SKIP.
- Estimated user-fillable fields: **120–150**. Sectioned wizard required (≥10 steps).
- Recommended step structure: Registering Office → Taxpayer Info → Name/DOB → Addresses → Business Info → Line of Business → Tax Type Matrix → Identification & Contact → Spouse → Classification & 8% Election → Authorized Rep → Declaration.

## Implementation risk register (carry into next session)

1. Line of Business PSIC table is a **repeating row** — not yet supported by the generator's coord map (all existing forms are fixed-layout). Will require extending CoordsMap to accept `rows[]` with per-row y offset.
2. Tax Type checkbox matrix cells share x-position across columns — careful cx derivation required.
3. Page 3/4 may be entirely static reference; verify before wiring.

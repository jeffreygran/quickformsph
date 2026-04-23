# Field Dictionary — Pag-IBIG HEAL Application — Co-Borrower

> Authoritative reference for HQP-HLF-868. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG HEAL Application — Co-Borrower |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-HLF-868 (V01 (07/2021)) |
| **Category** | Loans |
| **Slug** | `pagibig-hlf-868` |
| **Source PDF** | `public/forms/PagIbig - HLF868_ApplicationHomeEquityAppreciationLoan(Co-borrower).pdf` |
| **API** | `POST /api/generate` body `{slug:"pagibig-hlf-868", values:{…}}` |
| **Field Count** | 48 |
| **Steps / Sections** | 4 |

**Purpose:** Application for Home Equity Appreciation Loan (HEAL) — Co-borrower section. MVP fills the co-borrower identification, address, and employer info on page 1.
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
- Date format: `mm/dd/yyyy`
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO_

---

## 3) Section Breakdown

<!-- AUTOGEN:START name="sections" -->
| Section ID | Section Name | Notes |
|---|---|---|
| S1 | Identification | 10 fields |
| S2 | Permanent Address | 9 fields |
| S3 | Present Address | 13 fields |
| S4 | Employer | 16 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `mid_no` | Identification | Pag-IBIG MID Number | Text | Yes | inputMode=numeric | 14 | 0000-0000-0000 |
| `housing_account_no` | Identification | Housing Account No. | Text | No |  | 14 | Office use |
| `last_name` | Identification | Last Name | Text | Yes | UPPERCASE | — | DELA CRUZ |
| `first_name` | Identification | First Name | Text | Yes | UPPERCASE | — | JUAN |
| `ext_name` | Identification | Name Extension | Dropdown | No | 6 options | — |  |
| `middle_name` | Identification | Middle Name | Text | No | UPPERCASE | — | SANTOS |
| `maiden_middle_name` | Identification | Maiden Middle Name (married women) | Text | No | UPPERCASE | — |  |
| `dob` | Identification | Date of Birth (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/1990 |
| `citizenship` | Identification | Citizenship | Text | Yes |  | — | Filipino |
| `proportionate_share` | Identification | Desired Proportionate Share (%) | Text | Yes | inputMode=numeric | 5 | 50 |
| `perm_unit` | Permanent Address | Unit/Room/Floor/Building/Lot/Block/Phase/House No. | Text | Yes |  | — | Unit 4B, 123 Bldg |
| `perm_street` | Permanent Address | Street Name | Text | Yes |  | — | Rizal St |
| `perm_subdivision` | Permanent Address | Subdivision | Text | No |  | — |  |
| `perm_barangay` | Permanent Address | Barangay | Text | Yes |  | — | SAN JOSE |
| `perm_city` | Permanent Address | Municipality / City | Text | Yes |  | — | QUEZON CITY |
| `perm_province` | Permanent Address | Province / State / Country | Text | Yes |  | — | METRO MANILA |
| `perm_zip` | Permanent Address | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `perm_country_tel` | Permanent Address | Country + Area Code Telephone | Text | No |  | — | 63-2 |
| `perm_home_tel` | Permanent Address | Home Telephone Number | Text (phone) | No |  | — | 12345678 |
| `pres_unit` | Present Address | Unit/Room/Floor/Building/Lot/Block/Phase/House No. | Text | No |  | — | Same as Permanent if blank |
| `pres_street` | Present Address | Street Name | Text | No |  | — |  |
| `pres_subdivision` | Present Address | Subdivision | Text | No |  | — |  |
| `pres_barangay` | Present Address | Barangay | Text | No |  | — |  |
| `pres_city` | Present Address | Municipality / City | Text | No |  | — |  |
| `pres_province` | Present Address | Province / State / Country | Text | No |  | — |  |
| `pres_zip` | Present Address | ZIP Code | Text | No | inputMode=numeric | 4 |  |
| `pres_business_tel` | Present Address | Business Telephone Number | Text (phone) | No |  | — | 02-12345678 |
| `pres_cellphone` | Present Address | Cellphone Number (REQUIRED) | Text (phone) | Yes | inputMode=tel | 11 | 09171234567 |
| `email_address` | Present Address | Email Address (REQUIRED) | Text (email) | Yes | inputMode=email | — | juan@example.com |
| `years_stay_present` | Present Address | Years of Stay in Present Home Address | Text | No | inputMode=numeric | 3 | 5 |
| `tin` | Present Address | Taxpayer Identification No. (TIN) | Text | Yes | inputMode=numeric | 12 | 123456789000 |
| `sss_gsis` | Present Address | SSS / GSIS ID Number | Text | No |  | — | 12-3456789-0 |
| `occupation` | Employer | Occupation | Text | Yes |  | — | Software Engineer |
| `employer_name` | Employer | Employer / Business Name | Text | Yes |  | — | ACME Corp. |
| `employer_address_line` | Employer | Employer Address — Unit/Floor/Bldg/Street | Text | Yes |  | — | 5th Floor ACME Bldg, Ayala Avenue |
| `employer_subdivision` | Employer | Employer Subdivision | Text | No |  | — |  |
| `employer_barangay` | Employer | Employer Barangay | Text | Yes |  | — |  |
| `employer_city` | Employer | Employer City | Text | Yes |  | — |  |
| `employer_province` | Employer | Employer Province / Country | Text | Yes |  | — |  |
| `employer_zip` | Employer | Employer ZIP | Text | No | inputMode=numeric | 4 |  |
| `employer_business_tel` | Employer | Business Telephone (Direct or Trunk Line) | Text (phone) | No |  | — | 02-12345678 |
| `employer_email` | Employer | Employer / Business Email Address | Text (email) | No |  | — | hr@acme.com |
| `position_dept` | Employer | Position & Department | Text | Yes |  | — | Senior Engineer / IT |
| `preferred_time_contact` | Employer | Preferred Time to be Contacted (Employer) | Text | No |  | — | Mon-Fri 9am-5pm |
| `place_assignment` | Employer | Place of Assignment | Text | No |  | — | Makati Office |
| `years_employment` | Employer | Years in Employment / Business | Text | Yes | inputMode=numeric | 3 | 5 |
| `no_dependents` | Employer | No. of Dependent/s | Text | Yes | inputMode=numeric | 3 | 2 |
| `signature_date` | Employer | Date Signed (mm/dd/yyyy) | Text | Yes |  | 10 | 04/23/2026 |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`ext_name` — Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 0

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `citizenship` | 0 | 162 | 578.00 | 8 | 55 | ✓ |
| `dob` | 0 | 93 | 578.00 | 9 | 65 | ✓ |
| `email_address` | 0 | 449 | 430.00 | 7.5 | 138 | ✓ |
| `employer_address_line` | 0 | 30 | 344.00 | 7.5 | 395 | ✓ |
| `employer_barangay` | 0 | 124 | 312.00 | 8 | 70 | ✓ |
| `employer_business_tel` | 0 | 449 | 397.00 | 9 | 138 | ✓ |
| `employer_city` | 0 | 196 | 312.00 | 8 | 75 | ✓ |
| `employer_email` | 0 | 449 | 344.00 | 7.5 | 138 | ✓ |
| `employer_name` | 0 | 30 | 376.00 | 8 | 395 | ✓ |
| `employer_province` | 0 | 273 | 312.00 | 8 | 120 | ✓ |
| `employer_subdivision` | 0 | 30 | 312.00 | 8 | 90 | ✓ |
| `employer_zip` | 0 | 395 | 312.00 | 9 | 50 | ✓ |
| `ext_name` | 0 | 220 | 617.00 | 8 | 70 | ✓ |
| `first_name` | 0 | 130 | 617.00 | 8 | 85 | ✓ |
| `housing_account_no` | 0 | 420 | 648.00 | 9 | 168 | ✓ |
| `last_name` | 0 | 30 | 617.00 | 8 | 95 | ✓ |
| `maiden_middle_name` | 0 | 388 | 617.00 | 8 | 130 | ✓ |
| `mid_no` | 0 | 240 | 648.00 | 9 | 175 | ✓ |
| `middle_name` | 0 | 297 | 617.00 | 8 | 86 | ✓ |
| `no_dependents` | 0 | 460 | 282.00 | 9 | 130 | ✓ |
| `occupation` | 0 | 30 | 397.00 | 8 | 124 | ✓ |
| `perm_barangay` | 0 | 124 | 520.00 | 8 | 70 | ✓ |
| `perm_city` | 0 | 196 | 520.00 | 8 | 75 | ✓ |
| `perm_country_tel` | 0 | 449 | 547.00 | 9 | 138 | ✓ |
| `perm_home_tel` | 0 | 449 | 520.00 | 9 | 138 | ✓ |
| `perm_province` | 0 | 273 | 520.00 | 8 | 120 | ✓ |
| `perm_street` | 0 | 30 | 520.00 | 8 | 60 | ✓ |
| `perm_subdivision` | 0 | 92 | 520.00 | 8 | 30 | ✓ |
| `perm_unit` | 0 | 30 | 547.00 | 7.5 | 395 | ✓ |
| `perm_zip` | 0 | 395 | 520.00 | 9 | 50 | ✓ |
| `place_assignment` | 0 | 258 | 282.00 | 8 | 118 | ✓ |
| `position_dept` | 0 | 30 | 282.00 | 8 | 115 | ✓ |
| `preferred_time_contact` | 0 | 147 | 282.00 | 8 | 110 | ✓ |
| `pres_barangay` | 0 | 124 | 459.00 | 8 | 70 | ✓ |
| `pres_business_tel` | 0 | 449 | 488.00 | 9 | 138 | ✓ |
| `pres_cellphone` | 0 | 449 | 459.00 | 9 | 138 | ✓ |
| `pres_city` | 0 | 196 | 459.00 | 8 | 75 | ✓ |
| `pres_province` | 0 | 273 | 459.00 | 8 | 120 | ✓ |
| `pres_street` | 0 | 30 | 459.00 | 8 | 60 | ✓ |
| `pres_subdivision` | 0 | 92 | 459.00 | 8 | 30 | ✓ |
| `pres_unit` | 0 | 30 | 488.00 | 7.5 | 395 | ✓ |
| `pres_zip` | 0 | 395 | 459.00 | 9 | 50 | ✓ |
| `proportionate_share` | 0 | 30 | 578.00 | 9 | 60 | ✓ |
| `signature_date` | 1 | 100 | 285.00 | 9 | 130 | ✓ |
| `sss_gsis` | 0 | 298 | 397.00 | 9 | 145 | ✓ |
| `tin` | 0 | 156 | 397.00 | 9 | 140 | ✓ |
| `years_employment` | 0 | 378 | 282.00 | 9 | 80 | ✓ |
| `years_stay_present` | 0 | 320 | 430.00 | 9 | 70 | ✓ |

**Skip values (treated as blank):**

- `housing_account_no`: `<empty>`
- `ext_name`: `<empty>`, `N/A`
- `middle_name`: `<empty>`
- `maiden_middle_name`: `<empty>`
- `perm_subdivision`: `<empty>`
- `perm_country_tel`: `<empty>`
- `perm_home_tel`: `<empty>`
- `pres_unit`: `<empty>`
- `pres_street`: `<empty>`
- `pres_subdivision`: `<empty>`
- `pres_barangay`: `<empty>`
- `pres_city`: `<empty>`
- `pres_province`: `<empty>`
- `pres_zip`: `<empty>`
- `pres_business_tel`: `<empty>`
- `years_stay_present`: `<empty>`
- `sss_gsis`: `<empty>`
- `employer_subdivision`: `<empty>`
- `employer_zip`: `<empty>`
- `employer_business_tel`: `<empty>`
- `employer_email`: `<empty>`
- `preferred_time_contact`: `<empty>`
- `place_assignment`: `<empty>`
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
- [x] Coverage CI: every field has coord or skip entry — `npm run test:coverage`
- [x] Smoke test: random payload renders valid PDF — `npm run test:smoke`
- [ ] Visual QA: rasterize at 100 DPI, no off-page text or wrong-cell overflow
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page / multi-copy alignment preserved
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric / email / tel fields
<!-- AUTOGEN:END name="qa-checklist" -->

---

## 10) Change Log

> _Append-only history. Add a row whenever the form version changes or a coord bug is fixed._

| Date | Change | Reason | Updated By |
|---|---|---|---|
| 2026-04-23 | Initial dictionary | Adopt template | scripts/generate-field-dictionaries.ts |

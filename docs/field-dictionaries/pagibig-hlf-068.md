# Field Dictionary — Pag-IBIG Housing Loan Application

> Authoritative reference for HQP-HLF-068. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG Housing Loan Application |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-HLF-068 (V01 (07/2021)) |
| **Category** | Loans |
| **Slug** | `pagibig-hlf-068` |
| **Source PDF** | `public/forms/PagIbig - HLF068_HousingLoanApplication.pdf` |
| **API** | `POST /api/generate` body `{slug:"pagibig-hlf-068", values:{…}}` |
| **Field Count** | 39 |
| **Steps / Sections** | 4 |

**Purpose:** Apply for a Pag-IBIG Housing Loan. MVP fills the BORROWER'S DATA section (identification, addresses, employer) on page 1. Loan particulars, property details, and spouse/co-borrower sections deferred to iteration 2.
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
| S1 | Identification | 9 fields |
| S2 | Permanent Address | 7 fields |
| S3 | Present Address & Contacts | 11 fields |
| S4 | Employer | 12 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `mid_no` | Identification | Pag-IBIG MID Number / RTN | Text | Yes | inputMode=numeric | 14 | 0000-0000-0000 |
| `housing_account_no` | Identification | Housing Account Number (HAN), if existing | Text | No |  | 14 | Office use |
| `desired_loan_amount` | Identification | Desired Loan Amount (PHP) | Text | Yes | inputMode=numeric | — | 1500000 |
| `last_name` | Identification | Last Name | Text | Yes | UPPERCASE | — | DELA CRUZ |
| `first_name` | Identification | First Name | Text | Yes | UPPERCASE | — | JUAN |
| `ext_name` | Identification | Name Extension | Dropdown | No | 6 options | — |  |
| `middle_name` | Identification | Middle Name | Text | No | UPPERCASE | — |  |
| `citizenship` | Identification | Citizenship | Text | Yes |  | — | Filipino |
| `dob` | Identification | Date of Birth (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/1990 |
| `perm_unit` | Permanent Address | Permanent — Unit/Floor/Building/Lot/Block/Phase/House No. | Text | Yes |  | — |  |
| `perm_street` | Permanent Address | Street Name | Text | Yes |  | — |  |
| `perm_subdivision` | Permanent Address | Subdivision | Text | No |  | — |  |
| `perm_barangay` | Permanent Address | Barangay | Text | Yes |  | — |  |
| `perm_city` | Permanent Address | Municipality / City | Text | Yes |  | — |  |
| `perm_province` | Permanent Address | Province / State / Country | Text | Yes |  | — |  |
| `perm_zip` | Permanent Address | ZIP Code | Text | Yes | inputMode=numeric | 4 |  |
| `pres_unit` | Present Address & Contacts | Present — Unit/Floor/Building/Lot/Block/Phase/House No. | Text | No |  | — |  |
| `pres_street` | Present Address & Contacts | Street Name | Text | No |  | — |  |
| `pres_subdivision` | Present Address & Contacts | Subdivision | Text | No |  | — |  |
| `pres_barangay` | Present Address & Contacts | Barangay | Text | No |  | — |  |
| `pres_city` | Present Address & Contacts | Municipality / City | Text | No |  | — |  |
| `pres_province` | Present Address & Contacts | Province / State / Country | Text | No |  | — |  |
| `pres_zip` | Present Address & Contacts | ZIP Code | Text | No | inputMode=numeric | 4 |  |
| `pres_cellphone` | Present Address & Contacts | Cellphone Number | Text (phone) | Yes | inputMode=tel | 11 | 09171234567 |
| `email_address` | Present Address & Contacts | Email Address | Text (email) | Yes | inputMode=email | — |  |
| `years_stay_present` | Present Address & Contacts | Years of Stay in Present Home Address | Text | No | inputMode=numeric | 3 |  |
| `sss_gsis` | Present Address & Contacts | SSS / GSIS ID Number | Text | No |  | — | 12-3456789-0 |
| `employer_name` | Employer | Employer / Business Name | Text | Yes |  | — |  |
| `tin` | Employer | Taxpayer Identification No. (TIN) | Text | Yes | inputMode=numeric | 12 |  |
| `employer_address_line` | Employer | Employer Address — Unit/Floor/Bldg/Street | Text | Yes |  | — |  |
| `occupation` | Employer | Occupation | Text | Yes |  | — | Software Engineer |
| `employer_subdivision` | Employer | Employer Subdivision | Text | No |  | — |  |
| `employer_barangay` | Employer | Employer Barangay | Text | Yes |  | — |  |
| `employer_city` | Employer | Employer City | Text | Yes |  | — |  |
| `employer_province` | Employer | Employer Province / Country | Text | Yes |  | — |  |
| `employer_zip` | Employer | Employer ZIP | Text | No | inputMode=numeric | 4 |  |
| `position_dept` | Employer | Position & Department | Text | Yes |  | — |  |
| `years_employment` | Employer | Years in Employment / Business | Text | Yes | inputMode=numeric | 3 |  |
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
| `citizenship` | 0 | 346 | 545.00 | 8 | 60 | ✓ |
| `desired_loan_amount` | 0 | 475 | 791.00 | 9 | 100 | ✓ |
| `dob` | 0 | 410 | 545.00 | 9 | 110 | ✓ |
| `email_address` | 0 | 412 | 412.00 | 7.5 | 175 | ✓ |
| `employer_address_line` | 0 | 30 | 324.00 | 7.5 | 265 | ✓ |
| `employer_barangay` | 0 | 101 | 296.00 | 8 | 54 | ✓ |
| `employer_city` | 0 | 157 | 296.00 | 8 | 68 | ✓ |
| `employer_name` | 0 | 30 | 356.00 | 8 | 265 | ✓ |
| `employer_province` | 0 | 227 | 296.00 | 8 | 130 | ✓ |
| `employer_subdivision` | 0 | 30 | 296.00 | 8 | 68 | ✓ |
| `employer_zip` | 0 | 360 | 296.00 | 9 | 48 | ✓ |
| `ext_name` | 0 | 180 | 545.00 | 8 | 95 | ✓ |
| `first_name` | 0 | 102 | 545.00 | 8 | 75 | ✓ |
| `housing_account_no` | 0 | 0 | 865.40 | 9 | — | ✓ |
| `last_name` | 0 | 30 | 545.00 | 8 | 70 | ✓ |
| `mid_no` | 0 | 0 | 865.80 | 9 | — | ✓ |
| `middle_name` | 0 | 278 | 545.00 | 8 | 65 | ✓ |
| `occupation` | 0 | 370 | 324.00 | 8 | 222 | ✓ |
| `perm_barangay` | 0 | 101 | 475.00 | 8 | 54 | ✓ |
| `perm_city` | 0 | 157 | 475.00 | 8 | 68 | ✓ |
| `perm_province` | 0 | 227 | 475.00 | 8 | 130 | ✓ |
| `perm_street` | 0 | 363 | 505.00 | 8 | 225 | ✓ |
| `perm_subdivision` | 0 | 30 | 475.00 | 8 | 68 | ✓ |
| `perm_unit` | 0 | 30 | 505.00 | 7.5 | 330 | ✓ |
| `perm_zip` | 0 | 360 | 475.00 | 9 | 48 | ✓ |
| `position_dept` | 0 | 412 | 160.00 | 8 | 110 | ✓ |
| `pres_barangay` | 0 | 101 | 412.00 | 8 | 54 | ✓ |
| `pres_cellphone` | 0 | 412 | 439.00 | 9 | 175 | ✓ |
| `pres_city` | 0 | 157 | 412.00 | 8 | 68 | ✓ |
| `pres_province` | 0 | 227 | 412.00 | 8 | 130 | ✓ |
| `pres_street` | 0 | 363 | 439.00 | 7.5 | 47 | ✓ |
| `pres_subdivision` | 0 | 30 | 412.00 | 8 | 68 | ✓ |
| `pres_unit` | 0 | 30 | 439.00 | 7.5 | 330 | ✓ |
| `pres_zip` | 0 | 360 | 412.00 | 9 | 48 | ✓ |
| `signature_date` | 2 | 100 | 555.00 | 9 | 130 | ✓ |
| `sss_gsis` | 0 | 305 | 376.00 | 9 | 100 | ✓ |
| `tin` | 0 | 296 | 356.00 | 9 | 110 | ✓ |
| `years_employment` | 0 | 525 | 160.00 | 9 | 65 | ✓ |
| `years_stay_present` | 0 | 220 | 376.00 | 9 | 75 | ✓ |

**Skip values (treated as blank):**

- `housing_account_no`: `<empty>`
- `ext_name`: `<empty>`, `N/A`
- `middle_name`: `<empty>`
- `perm_subdivision`: `<empty>`
- `pres_unit`: `<empty>`
- `pres_street`: `<empty>`
- `pres_subdivision`: `<empty>`
- `pres_barangay`: `<empty>`
- `pres_city`: `<empty>`
- `pres_province`: `<empty>`
- `pres_zip`: `<empty>`
- `years_stay_present`: `<empty>`
- `sss_gsis`: `<empty>`
- `employer_subdivision`: `<empty>`
- `employer_zip`: `<empty>`
<!-- AUTOGEN:END name="layout" -->

---

## 7) HTML Form Translation Notes

> _Human-curated._

### UX Transformations Allowed
- Using nickname instead of legal name (HUMAN EDIT)

### UX Constraints (Must Preserve)
- Do not merge segmented government fields (last/first/middle).
- Do not change field order.
- Do not remove mandatory fields even if redundant.

---

## 8) Common User Mistakes

> _Human-curated._

- Using nickname instead of legal name (HUMAN EDIT)

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

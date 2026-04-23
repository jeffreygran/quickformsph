# Field Dictionary — Pag-IBIG Multi-Purpose Loan Application Form

> Authoritative reference for HQP-SLF-065. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG Multi-Purpose Loan Application Form |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-SLF-065 (V10 (05/2025)) |
| **Category** | Loans |
| **Slug** | `pagibig-slf-065` |
| **Source PDF** | `public/forms/Pagibig - SLF065_MultiPurposeLoanApplicationForm.pdf` |
| **API** | `POST /api/generate` body `{slug:"pagibig-slf-065", values:{…}}` |
| **Field Count** | 50 |
| **Steps / Sections** | 5 |

**Purpose:** Apply for the Pag-IBIG Multi-Purpose Loan (MPL). MVP fills the main applicant identification, address, employer, and loan details on page 1.
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
| S2 | Personal Info | 6 fields |
| S3 | Permanent Address | 11 fields |
| S4 | Present Address | 11 fields |
| S5 | Employer / Loan | 13 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `mid_no` | Identification | Pag-IBIG MID No. | Text | Yes | inputMode=numeric | 14 | 0000-0000-0000 |
| `application_no` | Identification | Application No. (leave blank for new) | Text | No |  | 14 | Office use |
| `last_name` | Identification | Last Name | Text | Yes | UPPERCASE | — | DELA CRUZ |
| `first_name` | Identification | First Name | Text | Yes | UPPERCASE | — | JUAN |
| `ext_name` | Identification | Name Extension | Dropdown | No | 6 options | — |  |
| `middle_name` | Identification | Middle Name | Text | No | UPPERCASE | — | SANTOS |
| `no_maiden_middle_name` | Identification | Maiden Middle Name (married women) | Text | No | UPPERCASE | — |  |
| `dob` | Identification | Date of Birth (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/1990 |
| `place_of_birth` | Identification | Place of Birth | Text | Yes | UPPERCASE | — | QUEZON CITY |
| `mothers_maiden_name` | Personal Info | Complete Mother's Maiden Name | Text | Yes | UPPERCASE | — | MARIA REYES SANTOS |
| `nationality` | Personal Info | Nationality | Text | Yes |  | — | Filipino |
| `sex` | Personal Info | Sex | Dropdown | Yes | 2 options | — |  |
| `marital_status` | Personal Info | Marital Status | Dropdown | Yes | 5 options | — |  |
| `citizenship` | Personal Info | Citizenship | Text | Yes |  | — | Filipino |
| `email` | Personal Info | Email Address | Text (email) | Yes | inputMode=email | — | juan@example.com |
| `perm_unit` | Permanent Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text | Yes |  | — | Unit 4B, 123 Bldg, Block 5 |
| `perm_cell_phone` | Permanent Address | Cell Phone Number | Text (phone) | Yes | inputMode=tel | 11 | 09171234567 |
| `perm_home_tel` | Permanent Address | Home Telephone Number | Text (phone) | No |  | — | 02-12345678 |
| `perm_street` | Permanent Address | Street Name | Text | Yes |  | — | Rizal St |
| `perm_subdivision` | Permanent Address | Subdivision | Text | No |  | — |  |
| `perm_barangay` | Permanent Address | Barangay | Text | Yes |  | — | SAN JOSE |
| `perm_city` | Permanent Address | Municipality / City | Text | Yes |  | — | QUEZON CITY |
| `perm_province` | Permanent Address | Province / State / Country | Text | Yes |  | — | METRO MANILA |
| `perm_zip` | Permanent Address | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `perm_tin` | Permanent Address | Applicant's Taxpayer Identification Number (TIN) | Text | Yes | inputMode=numeric | 12 | 123456789000 |
| `perm_sss_gsis` | Permanent Address | SSS / GSIS No. | Text | No |  | — | 12-3456789-0 |
| `pres_unit` | Present Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text | No |  | — | Same as Permanent if blank |
| `pres_business_tel` | Present Address | Business Telephone Number | Text (phone) | No |  | — | 02-12345678 |
| `pres_nature_of_work` | Present Address | Nature of Work | Text | Yes |  | — | Software Engineer |
| `pres_street` | Present Address | Street Name | Text | No |  | — |  |
| `pres_subdivision` | Present Address | Subdivision | Text | No |  | — |  |
| `pres_barangay` | Present Address | Barangay | Text | No |  | — |  |
| `pres_city` | Present Address | Municipality / City | Text | No |  | — |  |
| `pres_province` | Present Address | Province / State / Country | Text | No |  | — |  |
| `pres_zip` | Present Address | ZIP Code | Text | No | inputMode=numeric | 4 |  |
| `loan_term` | Present Address | Loan Term | Dropdown | Yes | 3 options | — |  |
| `desired_loan_amount` | Present Address | Desired Loan Amount (PHP) | Text | Yes | inputMode=numeric | — | 50000 |
| `employer_name` | Employer / Loan | Employer / Business Name | Text | Yes |  | — | ACME Corp. |
| `loan_purpose` | Employer / Loan | Loan Purpose | Dropdown | Yes | 10 options | — |  |
| `employer_address_line` | Employer / Loan | Employer Address — Unit/Bldg/Street | Text | Yes |  | — | 5th Floor ACME Bldg, Ayala Avenue |
| `employer_subdivision` | Employer / Loan | Employer Subdivision | Text | No |  | — |  |
| `employer_barangay` | Employer / Loan | Employer Barangay | Text | Yes |  | — |  |
| `employer_city` | Employer / Loan | Employer City | Text | Yes |  | — |  |
| `employer_province` | Employer / Loan | Employer Province / Country | Text | Yes |  | — |  |
| `employer_zip` | Employer / Loan | Employer ZIP | Text | No | inputMode=numeric | 4 |  |
| `employee_id_no` | Employer / Loan | Employee ID Number | Text | No |  | — | EMP-12345 |
| `date_of_employment` | Employer / Loan | Date of Employment (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/2020 |
| `source_of_fund` | Employer / Loan | Source of Fund | Text | Yes |  | — | Salary |
| `payroll_bank_name` | Employer / Loan | Payroll Account Bank / Branch | Text | No |  | — | BDO Makati |
| `signature_date` | Employer / Loan | Date Signed (mm/dd/yyyy) | Text | Yes |  | 10 | 04/23/2026 |
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

**`sex` — Sex** (dropdown)

| Option | Value |
|---|---|
| Male | `Male` |
| Female | `Female` |

**`marital_status` — Marital Status** (dropdown)

| Option | Value |
|---|---|
| Single/Unmarried | `Single/Unmarried` |
| Married | `Married` |
| Widow/er | `Widow/er` |
| Legally Separated | `Legally Separated` |
| Annulled | `Annulled` |

**`loan_term` — Loan Term** (dropdown)

| Option | Value |
|---|---|
| One (1) Year | `One (1) Year` |
| Two (2) Years | `Two (2) Years` |
| Three (3) Years | `Three (3) Years` |

**`loan_purpose` — Loan Purpose** (dropdown)

| Option | Value |
|---|---|
| Livelihood / additional capital in small business | `Livelihood / additional capital in small business` |
| Tuition / Educational Expenses | `Tuition / Educational Expenses` |
| Payment of utility / credit card bills | `Payment of utility / credit card bills` |
| Purchase of appliance & furniture / electronic gadgets | `Purchase of appliance & furniture / electronic gadgets` |
| Minor home improvement / home renovation / upgrades | `Minor home improvement / home renovation / upgrades` |
| Vacation / travel | `Vacation / travel` |
| Special events | `Special events` |
| Car repair | `Car repair` |
| Health & wellness | `Health & wellness` |
| Others | `Others` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 0

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `application_no` | 0 | 499 | 872.00 | 9 | 95 | ✓ |
| `citizenship` | 0 | 397 | 830.00 | 8 | 98 | ✓ |
| `date_of_employment` | 0 | 148 | 659.00 | 9 | 115 | ✓ |
| `desired_loan_amount` | 0 | 499 | 746.00 | 9 | 95 | ✓ |
| `dob` | 0 | 397 | 851.00 | 9 | 98 | ✓ |
| `email` | 0 | 499 | 830.00 | 7.5 | 95 | ✓ |
| `employee_id_no` | 0 | 22 | 659.00 | 8 | 124 | ✓ |
| `employer_address_line` | 0 | 22 | 704.00 | 7.5 | 368 | ✓ |
| `employer_barangay` | 0 | 70 | 680.00 | 8 | 46 | ✓ |
| `employer_city` | 0 | 118 | 680.00 | 8 | 60 | ✓ |
| `employer_name` | 0 | 22 | 725.00 | 8 | 368 | ✓ |
| `employer_province` | 0 | 180 | 680.00 | 8 | 160 | ✓ |
| `employer_subdivision` | 0 | 22 | 680.00 | 8 | 46 | ✓ |
| `employer_zip` | 0 | 344 | 680.00 | 9 | 46 | ✓ |
| `ext_name` | 0 | 200 | 851.00 | 8 | 33 | ✓ |
| `first_name` | 0 | 148 | 851.00 | 8 | 50 | ✓ |
| `last_name` | 0 | 22 | 851.00 | 8 | 122 | ✓ |
| `mid_no` | 0 | 397 | 872.00 | 9 | 98 | ✓ |
| `middle_name` | 0 | 236 | 851.00 | 8 | 26 | ✓ |
| `mothers_maiden_name` | 0 | 22 | 830.00 | 8 | 122 | ✓ |
| `nationality` | 0 | 148 | 830.00 | 8 | 48 | ✓ |
| `no_maiden_middle_name` | 0 | 266 | 851.00 | 8 | 51 | ✓ |
| `payroll_bank_name` | 0 | 470 | 571.00 | 9 | 120 | ✓ |
| `perm_barangay` | 0 | 130 | 788.00 | 8 | 45 | ✓ |
| `perm_cell_phone` | 0 | 397 | 810.00 | 9 | 98 | ✓ |
| `perm_city` | 0 | 178 | 788.00 | 8 | 56 | ✓ |
| `perm_home_tel` | 0 | 499 | 810.00 | 9 | 95 | ✓ |
| `perm_province` | 0 | 238 | 788.00 | 8 | 108 | ✓ |
| `perm_sss_gsis` | 0 | 499 | 788.00 | 9 | 95 | ✓ |
| `perm_street` | 0 | 22 | 788.00 | 8 | 56 | ✓ |
| `perm_subdivision` | 0 | 80 | 788.00 | 8 | 47 | ✓ |
| `perm_tin` | 0 | 397 | 788.00 | 9 | 98 | ✓ |
| `perm_unit` | 0 | 22 | 810.00 | 7.5 | 368 | ✓ |
| `perm_zip` | 0 | 350 | 788.00 | 9 | 38 | ✓ |
| `place_of_birth` | 0 | 499 | 851.00 | 8 | 95 | ✓ |
| `pres_barangay` | 0 | 130 | 746.00 | 8 | 45 | ✓ |
| `pres_business_tel` | 0 | 397 | 767.00 | 9 | 98 | ✓ |
| `pres_city` | 0 | 178 | 746.00 | 8 | 56 | ✓ |
| `pres_nature_of_work` | 0 | 499 | 767.00 | 8 | 95 | ✓ |
| `pres_province` | 0 | 238 | 746.00 | 8 | 108 | ✓ |
| `pres_street` | 0 | 22 | 746.00 | 8 | 56 | ✓ |
| `pres_subdivision` | 0 | 80 | 746.00 | 8 | 47 | ✓ |
| `pres_unit` | 0 | 22 | 767.00 | 7.5 | 368 | ✓ |
| `pres_zip` | 0 | 350 | 746.00 | 9 | 38 | ✓ |
| `signature_date` | 0 | 470 | 110.00 | 9 | 110 | ✓ |
| `source_of_fund` | 0 | 265 | 659.00 | 8 | 124 | ✓ |

**Skip values (treated as blank):**

- `application_no`: `<empty>`
- `ext_name`: `<empty>`, `N/A`
- `middle_name`: `<empty>`
- `no_maiden_middle_name`: `<empty>`
- `perm_subdivision`: `<empty>`
- `perm_home_tel`: `<empty>`
- `perm_sss_gsis`: `<empty>`
- `pres_unit`: `<empty>`
- `pres_street`: `<empty>`
- `pres_subdivision`: `<empty>`
- `pres_barangay`: `<empty>`
- `pres_city`: `<empty>`
- `pres_province`: `<empty>`
- `pres_zip`: `<empty>`
- `pres_business_tel`: `<empty>`
- `employer_subdivision`: `<empty>`
- `employer_zip`: `<empty>`
- `employee_id_no`: `<empty>`
- `payroll_bank_name`: `<empty>`
- `sex`: `<empty>`, `Male`, `Female`
- `marital_status`: `<empty>`, `Single/Unmarried`, `Married`, `Widow/er`, `Legally Separated`, `Annulled`
- `loan_term`: `<empty>`, `One (1) Year`, `Two (2) Years`, `Three (3) Years`
- `loan_purpose`: `<empty>`, `Livelihood / additional capital in small business`, `Tuition / Educational Expenses`, `Payment of utility / credit card bills`, `Purchase of appliance & furniture / electronic gadgets`, `Minor home improvement / home renovation / upgrades`, `Vacation / travel`, `Special events`, `Car repair`, `Health & wellness`, `Others`
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

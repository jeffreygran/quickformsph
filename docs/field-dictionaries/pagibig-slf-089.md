# Field Dictionary — Pag-IBIG HELPs Application Form

> Authoritative reference for HQP-SLF-089. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG HELPs Application Form |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-SLF-089 (V05 (05/2025)) |
| **Category** | Loans |
| **Slug** | `pagibig-slf-089` |
| **Source PDF** | `public/forms/PagIbig - SLF089_PagIBIGHELPsApplicationForm.pdf` |
| **API** | `POST /api/generate` body `{slug:"pagibig-slf-089", values:{…}}` |
| **Field Count** | 55 |
| **Steps / Sections** | 5 |

**Purpose:** Apply for the Pag-IBIG Health and Education Loan Programs (HELPs). MVP fills the main applicant identification, address, employer, and loan details on page 1.
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
| S2 | Personal Info | 5 fields |
| S3 | Permanent Address | 11 fields |
| S4 | Present Address | 11 fields |
| S5 | Employer / Loan | 19 fields |
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
| `no_maiden_middle_name` | Identification | No Maiden Middle Name (married women) | Text | No | UPPERCASE | — | Maiden surname if applicable |
| `dob` | Identification | Date of Birth (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/1990 |
| `place_of_birth` | Identification | Place of Birth | Text | Yes | UPPERCASE | — | QUEZON CITY |
| `mothers_maiden_name` | Personal Info | Complete Mother's Maiden Name | Text | Yes | UPPERCASE | — | MARIA REYES SANTOS |
| `sex` | Personal Info | Sex | Dropdown | Yes | 2 options | — |  |
| `marital_status` | Personal Info | Marital Status | Dropdown | Yes | 5 options | — |  |
| `citizenship` | Personal Info | Citizenship | Text | Yes |  | — | Filipino |
| `nationality` | Personal Info | Nationality | Text | Yes |  | — | Filipino |
| `perm_unit` | Permanent Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text | Yes |  | — | Unit 4B, 123 Bldg, Block 5 |
| `perm_street` | Permanent Address | Street Name | Text | Yes |  | — | Rizal Street |
| `perm_cell_phone` | Permanent Address | Cell Phone Number | Text (phone) | Yes | inputMode=tel | 11 | 09171234567 |
| `perm_home_tel` | Permanent Address | Home Telephone Number | Text (phone) | No |  | — | 02-12345678 |
| `perm_subdivision` | Permanent Address | Subdivision | Text | No |  | — |  |
| `perm_barangay` | Permanent Address | Barangay | Text | Yes |  | — | SAN JOSE |
| `perm_city` | Permanent Address | Municipality / City | Text | Yes |  | — | QUEZON CITY |
| `perm_province` | Permanent Address | Province / State / Country | Text | Yes |  | — | METRO MANILA |
| `perm_zip` | Permanent Address | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `perm_email` | Permanent Address | Email Address | Text (email) | Yes | inputMode=email | — | juan@example.com |
| `perm_tin` | Permanent Address | Applicant's Taxpayer Identification Number (TIN) | Text | Yes | inputMode=numeric | 12 | 123456789000 |
| `pres_unit` | Present Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text | No |  | — | Same as Permanent if blank |
| `pres_street` | Present Address | Street Name | Text | No |  | — |  |
| `pres_employee_id` | Present Address | Employee ID Number | Text | No |  | — | EMP-12345 |
| `pres_nature_of_work` | Present Address | Nature of Work | Text | Yes |  | — | Software Engineer |
| `pres_subdivision` | Present Address | Subdivision | Text | No |  | — |  |
| `pres_barangay` | Present Address | Barangay | Text | No |  | — |  |
| `pres_city` | Present Address | Municipality / City | Text | No |  | — |  |
| `pres_province` | Present Address | Province / State / Country | Text | No |  | — |  |
| `pres_zip` | Present Address | ZIP Code | Text | No | inputMode=numeric | 4 |  |
| `pres_sss_gsis` | Present Address | SSS / GSIS No. | Text | No |  | — | 12-3456789-0 |
| `pres_business_tel` | Present Address | Business Telephone Number | Text (phone) | No |  | — | 02-12345678 |
| `employer_name` | Employer / Loan | Employer / Business Name | Text | Yes |  | — | ACME Corp. |
| `date_of_employment` | Employer / Loan | Date of Employment (mm/dd/yyyy) | Text | Yes |  | 10 | 01/15/2020 |
| `desired_loan_amount` | Employer / Loan | Desired Loan Amount (PHP) | Text | Yes | inputMode=numeric | — | 50000 |
| `loan_amount_type` | Employer / Loan | Loan Amount Type | Dropdown | Yes | 2 options | — |  |
| `employer_address_line` | Employer / Loan | Employer Address — Unit/Bldg/Street | Text | Yes |  | — | 5th Floor ACME Bldg, Ayala Avenue |
| `source_of_fund` | Employer / Loan | Source of Fund | Text | Yes |  | — | Salary |
| `employer_subdivision` | Employer / Loan | Employer Subdivision | Text | No |  | — |  |
| `employer_barangay` | Employer / Loan | Employer Barangay | Text | Yes |  | — |  |
| `employer_city` | Employer / Loan | Employer City | Text | Yes |  | — |  |
| `employer_province` | Employer / Loan | Employer Province / Country | Text | Yes |  | — |  |
| `employer_zip` | Employer / Loan | Employer ZIP | Text | No | inputMode=numeric | 4 |  |
| `loan_purpose` | Employer / Loan | Loan Purpose | Dropdown | Yes | 3 options | — |  |
| `beneficiary_last` | Employer / Loan | Beneficiary's Last Name | Text | Yes | UPPERCASE | — | DELA CRUZ |
| `beneficiary_first` | Employer / Loan | Beneficiary's First Name | Text | Yes | UPPERCASE | — | MARIA |
| `beneficiary_ext` | Employer / Loan | Beneficiary's Name Extension | Dropdown | No | 6 options | — |  |
| `beneficiary_middle` | Employer / Loan | Beneficiary's Middle Name | Text | No | UPPERCASE | — |  |
| `student_id_no` | Employer / Loan | Student Number / Identification Number | Text | No |  | — | For educational loans only |
| `loan_term` | Employer / Loan | Loan Term | Dropdown | Yes | 4 options | — |  |
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
| Widower | `Widower` |
| Legally Separated | `Legally Separated` |
| Annulled | `Annulled` |

**`loan_amount_type` — Loan Amount Type** (dropdown)

| Option | Value |
|---|---|
| Maximum Loan Amount | `Maximum Loan Amount` |
| Others (specify in Desired Amount) | `Others (specify in Desired Amount)` |

**`loan_purpose` — Loan Purpose** (dropdown)

| Option | Value |
|---|---|
| Educational Expenses | `Educational Expenses` |
| Medical Expenses | `Medical Expenses` |
| Healthcare Plan from accredited HMO | `Healthcare Plan from accredited HMO` |

**`beneficiary_ext` — Beneficiary's Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`loan_term` — Loan Term** (dropdown)

| Option | Value |
|---|---|
| Six (6) Months | `Six (6) Months` |
| Twelve (12) Months | `Twelve (12) Months` |
| Twenty-four (24) Months | `Twenty-four (24) Months` |
| Thirty-six (36) Months | `Thirty-six (36) Months` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 0

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `application_no` | 0 | 496 | 855.00 | 9 | 95 | ✓ |
| `beneficiary_ext` | 0 | 182 | 625.00 | 8 | 38 | ✓ |
| `beneficiary_first` | 0 | 108 | 625.00 | 8 | 70 | ✓ |
| `beneficiary_last` | 0 | 24 | 625.00 | 8 | 80 | ✓ |
| `beneficiary_middle` | 0 | 224 | 625.00 | 8 | 90 | ✓ |
| `citizenship` | 0 | 406 | 809.00 | 8 | 84 | ✓ |
| `date_of_employment` | 0 | 226 | 698.00 | 9 | 86 | ✓ |
| `desired_loan_amount` | 0 | 314 | 698.00 | 9 | 88 | ✓ |
| `dob` | 0 | 406 | 834.00 | 9 | 84 | ✓ |
| `employer_address_line` | 0 | 24 | 674.00 | 7.5 | 285 | ✓ |
| `employer_barangay` | 0 | 116 | 653.00 | 8 | 60 | ✓ |
| `employer_city` | 0 | 178 | 653.00 | 8 | 60 | ✓ |
| `employer_name` | 0 | 24 | 698.00 | 8 | 200 | ✓ |
| `employer_province` | 0 | 240 | 653.00 | 8 | 75 | ✓ |
| `employer_subdivision` | 0 | 24 | 653.00 | 8 | 90 | ✓ |
| `employer_zip` | 0 | 320 | 653.00 | 9 | 80 | ✓ |
| `ext_name` | 0 | 182 | 834.00 | 8 | 38 | ✓ |
| `first_name` | 0 | 108 | 834.00 | 8 | 70 | ✓ |
| `last_name` | 0 | 24 | 834.00 | 8 | 80 | ✓ |
| `mid_no` | 0 | 406 | 855.00 | 9 | 84 | ✓ |
| `middle_name` | 0 | 224 | 834.00 | 8 | 70 | ✓ |
| `mothers_maiden_name` | 0 | 24 | 809.00 | 8 | 154 | ✓ |
| `nationality` | 0 | 496 | 809.00 | 8 | 95 | ✓ |
| `no_maiden_middle_name` | 0 | 298 | 834.00 | 8 | 100 | ✓ |
| `perm_barangay` | 0 | 116 | 764.00 | 8 | 60 | ✓ |
| `perm_cell_phone` | 0 | 406 | 787.00 | 9 | 84 | ✓ |
| `perm_city` | 0 | 178 | 764.00 | 8 | 60 | ✓ |
| `perm_email` | 0 | 358 | 764.00 | 7.5 | 130 | ✓ |
| `perm_home_tel` | 0 | 496 | 787.00 | 9 | 95 | ✓ |
| `perm_province` | 0 | 240 | 764.00 | 8 | 75 | ✓ |
| `perm_street` | 0 | 226 | 787.00 | 8 | 175 | ✓ |
| `perm_subdivision` | 0 | 24 | 764.00 | 8 | 90 | ✓ |
| `perm_tin` | 0 | 496 | 764.00 | 9 | 95 | ✓ |
| `perm_unit` | 0 | 24 | 787.00 | 7.5 | 200 | ✓ |
| `perm_zip` | 0 | 320 | 764.00 | 9 | 35 | ✓ |
| `place_of_birth` | 0 | 496 | 834.00 | 8 | 95 | ✓ |
| `pres_barangay` | 0 | 116 | 721.00 | 8 | 60 | ✓ |
| `pres_business_tel` | 0 | 496 | 721.00 | 9 | 95 | ✓ |
| `pres_city` | 0 | 178 | 721.00 | 8 | 60 | ✓ |
| `pres_employee_id` | 0 | 314 | 741.00 | 8 | 88 | ✓ |
| `pres_nature_of_work` | 0 | 406 | 741.00 | 8 | 185 | ✓ |
| `pres_province` | 0 | 240 | 721.00 | 8 | 75 | ✓ |
| `pres_sss_gsis` | 0 | 406 | 721.00 | 9 | 84 | ✓ |
| `pres_street` | 0 | 226 | 741.00 | 8 | 86 | ✓ |
| `pres_subdivision` | 0 | 24 | 721.00 | 8 | 90 | ✓ |
| `pres_unit` | 0 | 24 | 741.00 | 7.5 | 200 | ✓ |
| `pres_zip` | 0 | 320 | 721.00 | 9 | 80 | ✓ |
| `signature_date` | 0 | 470 | 110.00 | 9 | 110 | ✓ |
| `source_of_fund` | 0 | 314 | 674.00 | 8 | 88 | ✓ |
| `student_id_no` | 0 | 314 | 625.00 | 8 | 88 | ✓ |

**Skip values (treated as blank):**

- `application_no`: `<empty>`
- `ext_name`: `<empty>`, `N/A`
- `middle_name`: `<empty>`
- `no_maiden_middle_name`: `<empty>`
- `perm_subdivision`: `<empty>`
- `perm_home_tel`: `<empty>`
- `pres_unit`: `<empty>`
- `pres_street`: `<empty>`
- `pres_employee_id`: `<empty>`
- `pres_subdivision`: `<empty>`
- `pres_barangay`: `<empty>`
- `pres_city`: `<empty>`
- `pres_province`: `<empty>`
- `pres_zip`: `<empty>`
- `pres_sss_gsis`: `<empty>`
- `pres_business_tel`: `<empty>`
- `employer_subdivision`: `<empty>`
- `employer_zip`: `<empty>`
- `beneficiary_ext`: `<empty>`, `N/A`
- `beneficiary_middle`: `<empty>`
- `student_id_no`: `<empty>`
- `sex`: `<empty>`, `Male`, `Female`
- `marital_status`: `<empty>`, `Single/Unmarried`, `Married`, `Widower`, `Legally Separated`, `Annulled`
- `loan_amount_type`: `<empty>`, `Maximum Loan Amount`, `Others (specify in Desired Amount)`
- `loan_purpose`: `<empty>`, `Educational Expenses`, `Medical Expenses`, `Healthcare Plan from accredited HMO`
- `loan_term`: `<empty>`, `Six (6) Months`, `Twelve (12) Months`, `Twenty-four (24) Months`, `Thirty-six (36) Months`
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

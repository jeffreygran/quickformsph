# Field Dictionary — Pag-IBIG HELPs Application Form

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG HELPs Application Form |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-SLF-089 (V05 (05/2025)) |
| **Category** | Loans |
| **Slug** | `pagibig-slf-089` |
| **Source PDF Location** | `public/forms/PagIbig - SLF089_PagIBIGHELPsApplicationForm.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"pagibig-slf-089", values:{…}}` |
| **Field Count** | 55 |
| **Steps / Sections** | 5 |

**Purpose:** Apply for the Pag-IBIG Health and Education Loan Programs (HELPs). MVP fills the main applicant identification, address, employer, and loan details on page 1.

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
- Date format: `mm/dd/yyyy` (current default in schema)
- Signature required: [ ] Yes [ ] No
- Thumbmark required: [ ] Yes [ ] No
- Photo required: [ ] Yes [ ] No

**Agency-Use-Only fields (must remain blank):** _TODO — list all "For Office Use" sections._

---

## 3) Section Breakdown

| Section ID | Section Name | Page | Notes |
|---|---|---|---|
| S1 | Identification | — | step 1, 9 fields |
| S2 | Personal Info | — | step 2, 5 fields |
| S3 | Permanent Address | — | step 3, 11 fields |
| S4 | Present Address | — | step 4, 11 fields |
| S5 | Employer / Loan | — | step 5, 19 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mid_no | Identification | Pag-IBIG MID No. | Text (short) | Yes | Yes | inputMode=numeric | 14 | Maybe | — | 0000-0000-0000 |  |
| application_no | Identification | Application No. (leave blank for new) | Text (short) | No | Yes |  | 14 | — | — | Office use |  |
| last_name | Identification | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | DELA CRUZ |  |
| first_name | Identification | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | JUAN |  |
| ext_name | Identification | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| middle_name | Identification | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | SANTOS |  |
| no_maiden_middle_name | Identification | No Maiden Middle Name (married women) | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | Maiden surname if applicable |  |
| dob | Identification | Date of Birth (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 01/15/1990 |  |
| place_of_birth | Identification | Place of Birth | Text (short) | Yes | Yes | UPPERCASE | — | — | — | QUEZON CITY |  |
| mothers_maiden_name | Personal Info | Complete Mother's Maiden Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | MARIA REYES SANTOS |  |
| sex | Personal Info | Sex | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| marital_status | Personal Info | Marital Status | Dropdown | Yes | Yes | options(5) | — | — | — |  |  |
| citizenship | Personal Info | Citizenship | Text (short) | Yes | Yes |  | — | — | — | Filipino |  |
| nationality | Personal Info | Nationality | Text (short) | Yes | Yes |  | — | — | — | Filipino |  |
| perm_unit | Permanent Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text (short) | Yes | Yes |  | — | — | — | Unit 4B, 123 Bldg, Block 5 |  |
| perm_street | Permanent Address | Street Name | Text (short) | Yes | Yes |  | — | — | — | Rizal Street |  |
| perm_cell_phone | Permanent Address | Cell Phone Number | Text (phone) | Yes | Yes | inputMode=tel | 11 | — | — | 09171234567 |  |
| perm_home_tel | Permanent Address | Home Telephone Number | Text (phone) | No | Yes |  | — | — | — | 02-12345678 |  |
| perm_subdivision | Permanent Address | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| perm_barangay | Permanent Address | Barangay | Text (short) | Yes | Yes |  | — | — | — | SAN JOSE |  |
| perm_city | Permanent Address | Municipality / City | Text (short) | Yes | Yes |  | — | — | — | QUEZON CITY |  |
| perm_province | Permanent Address | Province / State / Country | Text (short) | Yes | Yes |  | — | — | — | METRO MANILA |  |
| perm_zip | Permanent Address | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| perm_email | Permanent Address | Email Address | Text (email) | Yes | Yes | inputMode=email | — | — | — | juan@example.com |  |
| perm_tin | Permanent Address | Applicant's Taxpayer Identification Number (TIN) | Text (short) | Yes | Yes | inputMode=numeric | 12 | Maybe | — | 123456789000 |  |
| pres_unit | Present Address | Unit/Floor/Building/Lot/Block/Phase/House No. | Text (short) | No | Yes |  | — | — | — | Same as Permanent if blank |  |
| pres_street | Present Address | Street Name | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_employee_id | Present Address | Employee ID Number | Text (short) | No | Yes |  | — | — | — | EMP-12345 |  |
| pres_nature_of_work | Present Address | Nature of Work | Text (short) | Yes | Yes |  | — | — | — | Software Engineer |  |
| pres_subdivision | Present Address | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_barangay | Present Address | Barangay | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_city | Present Address | Municipality / City | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_province | Present Address | Province / State / Country | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_zip | Present Address | ZIP Code | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| pres_sss_gsis | Present Address | SSS / GSIS No. | Text (short) | No | Yes |  | — | — | — | 12-3456789-0 |  |
| pres_business_tel | Present Address | Business Telephone Number | Text (phone) | No | Yes |  | — | — | — | 02-12345678 |  |
| employer_name | Employer / Loan | Employer / Business Name | Text (short) | Yes | Yes |  | — | — | — | ACME Corp. |  |
| date_of_employment | Employer / Loan | Date of Employment (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 01/15/2020 |  |
| desired_loan_amount | Employer / Loan | Desired Loan Amount (PHP) | Text (short) | Yes | Yes | inputMode=numeric | — | — | — | 50000 |  |
| loan_amount_type | Employer / Loan | Loan Amount Type | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| employer_address_line | Employer / Loan | Employer Address — Unit/Bldg/Street | Text (short) | Yes | Yes |  | — | — | — | 5th Floor ACME Bldg, Ayala Avenue |  |
| source_of_fund | Employer / Loan | Source of Fund | Text (short) | Yes | Yes |  | — | — | — | Salary |  |
| employer_subdivision | Employer / Loan | Employer Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| employer_barangay | Employer / Loan | Employer Barangay | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_city | Employer / Loan | Employer City | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_province | Employer / Loan | Employer Province / Country | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_zip | Employer / Loan | Employer ZIP | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| loan_purpose | Employer / Loan | Loan Purpose | Dropdown | Yes | Yes | options(3) | — | — | — |  |  |
| beneficiary_last | Employer / Loan | Beneficiary's Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | DELA CRUZ |  |
| beneficiary_first | Employer / Loan | Beneficiary's First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | MARIA |  |
| beneficiary_ext | Employer / Loan | Beneficiary's Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| beneficiary_middle | Employer / Loan | Beneficiary's Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| student_id_no | Employer / Loan | Student Number / Identification Number | Text (short) | No | Yes |  | — | — | — | For educational loans only |  |
| loan_term | Employer / Loan | Loan Term | Dropdown | Yes | Yes | options(4) | — | — | — |  |  |
| signature_date | Employer / Loan | Date Signed (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 04/23/2026 |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `ext_name` — Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `sex` — Sex  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Male | Male | No |
| Female | Female | No |

**Field Group:** `marital_status` — Marital Status  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Single/Unmarried | Single/Unmarried | No |
| Married | Married | No |
| Widower | Widower | No |
| Legally Separated | Legally Separated | No |
| Annulled | Annulled | No |

**Field Group:** `loan_amount_type` — Loan Amount Type  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Maximum Loan Amount | Maximum Loan Amount | No |
| Others (specify in Desired Amount) | Others (specify in Desired Amount) | No |

**Field Group:** `loan_purpose` — Loan Purpose  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Educational Expenses | Educational Expenses | No |
| Medical Expenses | Medical Expenses | No |
| Healthcare Plan from accredited HMO | Healthcare Plan from accredited HMO | No |

**Field Group:** `beneficiary_ext` — Beneficiary's Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `loan_term` — Loan Term  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Six (6) Months | Six (6) Months | No |
| Twelve (12) Months | Twelve (12) Months | No |
| Twenty-four (24) Months | Twenty-four (24) Months | No |
| Thirty-six (36) Months | Thirty-six (36) Months | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PAGIBIG_SLF_089_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
Coordinates use pdf-lib origin (bottom-left); helper `<form>Y(nextRowTop) = pageH - nextRowTop + 3` converts pdfplumber top-origin row tops to pdf-lib Y.

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

- [x] Field coverage: every field mapped to coord or skip entry (`npm run test:coverage`)
- [x] Smoke test: random payload renders valid PDF (`npm run test:smoke`)
- [ ] Visual QA: rasterize page-1 at 100 DPI and confirm no off-page text
- [ ] Per-digit boxes (PIN/MID/TIN/ZIP) align character-by-character
- [ ] Multi-page alignment preserved across copies
- [ ] Conditional logic exercised end-to-end
- [ ] Mobile keyboard correct for numeric/email/tel fields

---

## 10) Change Log

| Date | Change | Reason | Updated By |
|---|---|---|---|
| 2026-04-23 | Initial auto-generated field dictionary | Adopt template from `projects/quickformsph/field_dictionary_template_government_forms.md` | scripts/generate-field-dictionaries.ts |

---

_Generated: 2026-04-23T17:02:26.388Z_

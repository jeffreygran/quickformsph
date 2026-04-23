# Field Dictionary — Pag-IBIG Housing Loan Application

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG Housing Loan Application |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-HLF-068 (V01 (07/2021)) |
| **Category** | Loans |
| **Slug** | `pagibig-hlf-068` |
| **Source PDF Location** | `public/forms/PagIbig - HLF068_HousingLoanApplication.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"pagibig-hlf-068", values:{…}}` |
| **Field Count** | 39 |
| **Steps / Sections** | 4 |

**Purpose:** Apply for a Pag-IBIG Housing Loan. MVP fills the BORROWER'S DATA section (identification, addresses, employer) on page 1. Loan particulars, property details, and spouse/co-borrower sections deferred to iteration 2.

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
| S2 | Permanent Address | — | step 2, 7 fields |
| S3 | Present Address & Contacts | — | step 3, 11 fields |
| S4 | Employer | — | step 4, 12 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mid_no | Identification | Pag-IBIG MID Number / RTN | Text (short) | Yes | Yes | inputMode=numeric | 14 | Maybe | — | 0000-0000-0000 |  |
| housing_account_no | Identification | Housing Account Number (HAN), if existing | Text (short) | No | Yes |  | 14 | — | — | Office use |  |
| desired_loan_amount | Identification | Desired Loan Amount (PHP) | Text (short) | Yes | Yes | inputMode=numeric | — | — | — | 1500000 |  |
| last_name | Identification | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | DELA CRUZ |  |
| first_name | Identification | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | JUAN |  |
| ext_name | Identification | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| middle_name | Identification | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| citizenship | Identification | Citizenship | Text (short) | Yes | Yes |  | — | — | — | Filipino |  |
| dob | Identification | Date of Birth (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 01/15/1990 |  |
| perm_unit | Permanent Address | Permanent — Unit/Floor/Building/Lot/Block/Phase/House No. | Text (short) | Yes | Yes |  | — | — | — |  |  |
| perm_street | Permanent Address | Street Name | Text (short) | Yes | Yes |  | — | — | — |  |  |
| perm_subdivision | Permanent Address | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| perm_barangay | Permanent Address | Barangay | Text (short) | Yes | Yes |  | — | — | — |  |  |
| perm_city | Permanent Address | Municipality / City | Text (short) | Yes | Yes |  | — | — | — |  |  |
| perm_province | Permanent Address | Province / State / Country | Text (short) | Yes | Yes |  | — | — | — |  |  |
| perm_zip | Permanent Address | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| pres_unit | Present Address & Contacts | Present — Unit/Floor/Building/Lot/Block/Phase/House No. | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_street | Present Address & Contacts | Street Name | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_subdivision | Present Address & Contacts | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_barangay | Present Address & Contacts | Barangay | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_city | Present Address & Contacts | Municipality / City | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_province | Present Address & Contacts | Province / State / Country | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_zip | Present Address & Contacts | ZIP Code | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| pres_cellphone | Present Address & Contacts | Cellphone Number | Text (phone) | Yes | Yes | inputMode=tel | 11 | — | — | 09171234567 |  |
| email_address | Present Address & Contacts | Email Address | Text (email) | Yes | Yes | inputMode=email | — | — | — |  |  |
| years_stay_present | Present Address & Contacts | Years of Stay in Present Home Address | Text (short) | No | Yes | inputMode=numeric | 3 | — | — |  |  |
| sss_gsis | Present Address & Contacts | SSS / GSIS ID Number | Text (short) | No | Yes |  | — | — | — | 12-3456789-0 |  |
| employer_name | Employer | Employer / Business Name | Text (short) | Yes | Yes |  | — | — | — |  |  |
| tin | Employer | Taxpayer Identification No. (TIN) | Text (short) | Yes | Yes | inputMode=numeric | 12 | Maybe | — |  |  |
| employer_address_line | Employer | Employer Address — Unit/Floor/Bldg/Street | Text (short) | Yes | Yes |  | — | — | — |  |  |
| occupation | Employer | Occupation | Text (short) | Yes | Yes |  | — | — | — | Software Engineer |  |
| employer_subdivision | Employer | Employer Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| employer_barangay | Employer | Employer Barangay | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_city | Employer | Employer City | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_province | Employer | Employer Province / Country | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_zip | Employer | Employer ZIP | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| position_dept | Employer | Position & Department | Text (short) | Yes | Yes |  | — | — | — |  |  |
| years_employment | Employer | Years in Employment / Business | Text (short) | Yes | Yes | inputMode=numeric | 3 | — | — |  |  |
| signature_date | Employer | Date Signed (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 04/23/2026 |  |

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


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PAGIBIG_HLF_068_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

_Generated: 2026-04-23T17:02:26.389Z_

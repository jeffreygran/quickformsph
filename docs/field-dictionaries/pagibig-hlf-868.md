# Field Dictionary — Pag-IBIG HEAL Application — Co-Borrower

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | Pag-IBIG HEAL Application — Co-Borrower |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-HLF-868 (V01 (07/2021)) |
| **Category** | Loans |
| **Slug** | `pagibig-hlf-868` |
| **Source PDF Location** | `public/forms/PagIbig - HLF868_ApplicationHomeEquityAppreciationLoan(Co-borrower).pdf` |
| **Output API** | `POST /api/generate` body `{slug:"pagibig-hlf-868", values:{…}}` |
| **Field Count** | 48 |
| **Steps / Sections** | 4 |

**Purpose:** Application for Home Equity Appreciation Loan (HEAL) — Co-borrower section. MVP fills the co-borrower identification, address, and employer info on page 1.

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
| S1 | Identification | — | step 1, 10 fields |
| S2 | Permanent Address | — | step 2, 9 fields |
| S3 | Present Address | — | step 3, 13 fields |
| S4 | Employer | — | step 4, 16 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mid_no | Identification | Pag-IBIG MID Number | Text (short) | Yes | Yes | inputMode=numeric | 14 | Maybe | — | 0000-0000-0000 |  |
| housing_account_no | Identification | Housing Account No. | Text (short) | No | Yes |  | 14 | — | — | Office use |  |
| last_name | Identification | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | DELA CRUZ |  |
| first_name | Identification | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | JUAN |  |
| ext_name | Identification | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| middle_name | Identification | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | SANTOS |  |
| maiden_middle_name | Identification | Maiden Middle Name (married women) | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| dob | Identification | Date of Birth (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 01/15/1990 |  |
| citizenship | Identification | Citizenship | Text (short) | Yes | Yes |  | — | — | — | Filipino |  |
| proportionate_share | Identification | Desired Proportionate Share (%) | Text (short) | Yes | Yes | inputMode=numeric | 5 | — | — | 50 |  |
| perm_unit | Permanent Address | Unit/Room/Floor/Building/Lot/Block/Phase/House No. | Text (short) | Yes | Yes |  | — | — | — | Unit 4B, 123 Bldg |  |
| perm_street | Permanent Address | Street Name | Text (short) | Yes | Yes |  | — | — | — | Rizal St |  |
| perm_subdivision | Permanent Address | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| perm_barangay | Permanent Address | Barangay | Text (short) | Yes | Yes |  | — | — | — | SAN JOSE |  |
| perm_city | Permanent Address | Municipality / City | Text (short) | Yes | Yes |  | — | — | — | QUEZON CITY |  |
| perm_province | Permanent Address | Province / State / Country | Text (short) | Yes | Yes |  | — | — | — | METRO MANILA |  |
| perm_zip | Permanent Address | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| perm_country_tel | Permanent Address | Country + Area Code Telephone | Text (short) | No | Yes |  | — | — | — | 63-2 |  |
| perm_home_tel | Permanent Address | Home Telephone Number | Text (phone) | No | Yes |  | — | — | — | 12345678 |  |
| pres_unit | Present Address | Unit/Room/Floor/Building/Lot/Block/Phase/House No. | Text (short) | No | Yes |  | — | — | — | Same as Permanent if blank |  |
| pres_street | Present Address | Street Name | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_subdivision | Present Address | Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_barangay | Present Address | Barangay | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_city | Present Address | Municipality / City | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_province | Present Address | Province / State / Country | Text (short) | No | Yes |  | — | — | — |  |  |
| pres_zip | Present Address | ZIP Code | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| pres_business_tel | Present Address | Business Telephone Number | Text (phone) | No | Yes |  | — | — | — | 02-12345678 |  |
| pres_cellphone | Present Address | Cellphone Number (REQUIRED) | Text (phone) | Yes | Yes | inputMode=tel | 11 | — | — | 09171234567 |  |
| email_address | Present Address | Email Address (REQUIRED) | Text (email) | Yes | Yes | inputMode=email | — | — | — | juan@example.com |  |
| years_stay_present | Present Address | Years of Stay in Present Home Address | Text (short) | No | Yes | inputMode=numeric | 3 | — | — | 5 |  |
| tin | Present Address | Taxpayer Identification No. (TIN) | Text (short) | Yes | Yes | inputMode=numeric | 12 | Maybe | — | 123456789000 |  |
| sss_gsis | Present Address | SSS / GSIS ID Number | Text (short) | No | Yes |  | — | — | — | 12-3456789-0 |  |
| occupation | Employer | Occupation | Text (short) | Yes | Yes |  | — | — | — | Software Engineer |  |
| employer_name | Employer | Employer / Business Name | Text (short) | Yes | Yes |  | — | — | — | ACME Corp. |  |
| employer_address_line | Employer | Employer Address — Unit/Floor/Bldg/Street | Text (short) | Yes | Yes |  | — | — | — | 5th Floor ACME Bldg, Ayala Avenue |  |
| employer_subdivision | Employer | Employer Subdivision | Text (short) | No | Yes |  | — | — | — |  |  |
| employer_barangay | Employer | Employer Barangay | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_city | Employer | Employer City | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_province | Employer | Employer Province / Country | Text (short) | Yes | Yes |  | — | — | — |  |  |
| employer_zip | Employer | Employer ZIP | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — |  |  |
| employer_business_tel | Employer | Business Telephone (Direct or Trunk Line) | Text (phone) | No | Yes |  | — | — | — | 02-12345678 |  |
| employer_email | Employer | Employer / Business Email Address | Text (email) | No | Yes |  | — | — | — | hr@acme.com |  |
| position_dept | Employer | Position & Department | Text (short) | Yes | Yes |  | — | — | — | Senior Engineer / IT |  |
| preferred_time_contact | Employer | Preferred Time to be Contacted (Employer) | Text (short) | No | Yes |  | — | — | — | Mon-Fri 9am-5pm |  |
| place_assignment | Employer | Place of Assignment | Text (short) | No | Yes |  | — | — | — | Makati Office |  |
| years_employment | Employer | Years in Employment / Business | Text (short) | Yes | Yes | inputMode=numeric | 3 | — | — | 5 |  |
| no_dependents | Employer | No. of Dependent/s | Text (short) | Yes | Yes | inputMode=numeric | 3 | — | — | 2 |  |
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

See `src/lib/pdf-generator.ts` constant `PAGIBIG_HLF_868_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

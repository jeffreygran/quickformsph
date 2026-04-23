# Field Dictionary — Member's Change of Information Form (MCIF)

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | Member's Change of Information Form (MCIF) |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-PFF-049 (V12 (12/2025)) |
| **Category** | Membership |
| **Slug** | `pagibig-pff-049` |
| **Source PDF Location** | `public/forms/Pagibig - PFF049_MembersChangeInformationForm.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"pagibig-pff-049", values:{…}}` |
| **Field Count** | 37 |
| **Steps / Sections** | 5 |

**Purpose:** Update your Pag-IBIG records — name, marital status, date of birth, address, and contact details. Only fill in the sections that apply to your change request.

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
| S1 | Identification | — | step 1, 8 fields |
| S2 | Name / Category / DOB | — | step 2, 12 fields |
| S3 | Marital Status | — | step 3, 6 fields |
| S4 | Address & Contact | — | step 4, 8 fields |
| S5 | Others & Signature | — | step 5, 3 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mid_no | Identification | Pag-IBIG MID No. | Text (short) | Yes | Yes | inputMode=numeric | — | Maybe | — | 0000-0000-0000 |  |
| housing_account_no | Identification | Housing Account No. (if applicable) | Text (short) | No | Yes |  | — | — | — | Leave blank if not applicable |  |
| loyalty_card_holder | Identification | Pag-IBIG Loyalty Card Holder? | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| loyalty_partner_bank | Identification | Loyalty Card Issuing Partner-Bank/s | Text (short) | No | Yes |  | — | — | — | e.g., UnionBank |  |
| current_last_name | Identification | Current Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | DELA CRUZ |  |
| current_first_name | Identification | Current First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | JUAN |  |
| current_ext_name | Identification | Current Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| current_middle_name | Identification | Current Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | SANTOS |  |
| category_from | Name / Category / DOB | Membership Category — FROM | Text (short) | No | Yes |  | — | — | — | e.g., Employed Local |  |
| category_to | Name / Category / DOB | Membership Category — TO | Text (short) | No | Yes |  | — | — | — | e.g., Self-Employed |  |
| name_from_last | Name / Category / DOB | Name Change — FROM Last Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| name_from_first | Name / Category / DOB | Name Change — FROM First Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| name_from_ext | Name / Category / DOB | Name Change — FROM Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| name_from_middle | Name / Category / DOB | Name Change — FROM Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| name_to_last | Name / Category / DOB | Name Change — TO Last Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| name_to_first | Name / Category / DOB | Name Change — TO First Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| name_to_ext | Name / Category / DOB | Name Change — TO Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| name_to_middle | Name / Category / DOB | Name Change — TO Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| dob_from | Name / Category / DOB | DOB Correction — FROM (mm/dd/yyyy) | Text (short) | No | Yes |  | — | — | — | 01/15/1985 |  |
| dob_to | Name / Category / DOB | DOB Correction — TO (mm/dd/yyyy) | Text (short) | No | Yes |  | — | — | — | 01/15/1986 |  |
| marital_from | Marital Status | Marital Status — FROM | Dropdown | No | Yes | options(7) | — | — | — |  |  |
| marital_to | Marital Status | Marital Status — TO | Dropdown | No | Yes | options(7) | — | — | — |  |  |
| spouse_last_name | Marital Status | Spouse Last Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| spouse_first_name | Marital Status | Spouse First Name | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| spouse_ext_name | Marital Status | Spouse Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| spouse_middle_name | Marital Status | Spouse Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| new_address_line | Address & Contact | New Address — Street / House / Unit | Text (short) | No | Yes |  | — | — | — | Unit 4B, 123 Rizal Street, Brgy. San Jose |  |
| new_barangay | Address & Contact | New Barangay | Text (short) | No | Yes |  | — | — | — |  |  |
| new_city | Address & Contact | New City / Municipality | Text (short) | No | Yes |  | — | — | — |  |  |
| new_province | Address & Contact | New Province / State / Country | Text (short) | No | Yes |  | — | — | — |  |  |
| new_zip | Address & Contact | New Zip Code | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| new_cell_phone | Address & Contact | New Cell Phone | Text (phone) | No | Yes | inputMode=tel | — | — | — | 09171234567 |  |
| new_email | Address & Contact | New Email Address | Text (email) | No | Yes | inputMode=email | — | — | — | juan@example.com |  |
| preferred_mailing | Address & Contact | Preferred Mailing Address | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| others_from | Others & Signature | Other Update — FROM | Text (short) | No | Yes |  | — | — | — | e.g., Place of Birth — Manila |  |
| others_to | Others & Signature | Other Update — TO | Text (short) | No | Yes |  | — | — | — | e.g., Place of Birth — Quezon City |  |
| signature_date | Others & Signature | Date Signed (mm/dd/yyyy) | Text (short) | Yes | Yes |  | 10 | — | — | 04/15/2026 |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `loyalty_card_holder` — Pag-IBIG Loyalty Card Holder?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `current_ext_name` — Current Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `name_from_ext` — Name Change — FROM Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `name_to_ext` — Name Change — TO Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `marital_from` — Marital Status — FROM  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Single | Single | No |
| Married | Married | No |
| Legally Separated | Legally Separated | No |
| Annulled/Nullified | Annulled/Nullified | No |
| Widowed | Widowed | No |
| Divorced | Divorced | No |

**Field Group:** `marital_to` — Marital Status — TO  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Single | Single | No |
| Married | Married | No |
| Legally Separated | Legally Separated | No |
| Annulled/Nullified | Annulled/Nullified | No |
| Widowed | Widowed | No |
| Divorced | Divorced | No |

**Field Group:** `spouse_ext_name` — Spouse Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `preferred_mailing` — Preferred Mailing Address  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Present Home Address | Present Home Address | No |
| Permanent Home Address | Permanent Home Address | No |
| Employer/Business Address | Employer/Business Address | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PAGIBIG_PFF_049_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

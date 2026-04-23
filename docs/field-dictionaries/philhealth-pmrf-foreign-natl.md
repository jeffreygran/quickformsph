# Field Dictionary — PhilHealth Member Registration Form (Foreign National)

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | PhilHealth Member Registration Form (Foreign National) |
| **Agency** | PhilHealth |
| **Form Code / Version** | PMRF-FN (Foreign National (2018)) |
| **Category** | Membership |
| **Slug** | `philhealth-pmrf-foreign-natl` |
| **Source PDF Location** | `public/forms/PhilHealth - PMRF_ForeignNatl.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"philhealth-pmrf-foreign-natl", values:{…}}` |
| **Field Count** | 39 |
| **Steps / Sections** | 4 |

**Purpose:** Register as a PhilHealth member as a foreign national residing in the Philippines.

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
| S1 | Member's Profile | — | step 1, 12 fields |
| S2 | Contact & Address | — | step 2, 4 fields |
| S3 | Dependents (Optional) | — | step 3, 21 fields |
| S4 | Signature | — | step 4, 2 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| philhealth_number | Member's Profile | PhilHealth Number | Text (short) | No | Yes |  | — | — | — | 12-345678901-2 |  |
| acr_icard_number | Member's Profile | ACR I-card Number | Text (short) | No | Yes |  | — | — | — |  |  |
| pra_srrv_number | Member's Profile | PRA SRRV Number | Text (short) | No | Yes |  | — | — | — |  |  |
| last_name | Member's Profile | Last Name | Text (short) | Yes | Yes |  | — | — | — |  |  |
| first_name | Member's Profile | First Name | Text (short) | Yes | Yes |  | — | — | — |  |  |
| middle_name | Member's Profile | Middle Name | Text (short) | No | Yes |  | — | Maybe | — |  |  |
| sex | Member's Profile | Sex | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| nationality | Member's Profile | Nationality | Text (short) | Yes | Yes |  | — | — | — | e.g., American, Japanese |  |
| dob_month | Member's Profile | Date of Birth — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | 01-12 |  |
| dob_day | Member's Profile | Date of Birth — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | 01-31 |  |
| dob_year | Member's Profile | Date of Birth — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| civil_status | Member's Profile | Civil Status | Dropdown | Yes | Yes | options(5) | — | — | — |  |  |
| philippine_address_line1 | Contact & Address | Philippine Address — Line 1 | Text (short) | Yes | Yes |  | — | Maybe | — | Unit / Building / Street |  |
| philippine_address_line2 | Contact & Address | Philippine Address — Line 2 | Text (short) | No | Yes |  | — | Maybe | — |  |  |
| contact_phone | Contact & Address | Contact / Phone Number | Text (phone) | Yes | Yes |  | — | — | — | +63 9XX XXX XXXX |  |
| email | Contact & Address | Email Address | Text (email) | Yes | Yes |  | — | — | — |  |  |
| dep1_last | Dependents (Optional) | Dependent 1 — Last Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep1_first | Dependents (Optional) | Dependent 1 — First Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep1_middle | Dependents (Optional) | Dependent 1 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — |  |  |
| dep1_sex | Dependents (Optional) | Dependent 1 — Sex (M/F) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| dep1_relationship | Dependents (Optional) | Dependent 1 — Relationship | Text (short) | No | Yes |  | — | — | — | Spouse, Child, Parent |  |
| dep1_dob | Dependents (Optional) | Dependent 1 — Date of Birth (mm/dd/yyyy) | Text (short) | No | Yes |  | — | — | — | mm/dd/yyyy |  |
| dep1_nationality | Dependents (Optional) | Dependent 1 — Nationality | Text (short) | No | Yes |  | — | — | — |  |  |
| dep2_last | Dependents (Optional) | Dependent 2 — Last Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep2_first | Dependents (Optional) | Dependent 2 — First Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep2_middle | Dependents (Optional) | Dependent 2 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — |  |  |
| dep2_sex | Dependents (Optional) | Dependent 2 — Sex (M/F) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| dep2_relationship | Dependents (Optional) | Dependent 2 — Relationship | Text (short) | No | Yes |  | — | — | — | Spouse, Child, Parent |  |
| dep2_dob | Dependents (Optional) | Dependent 2 — Date of Birth (mm/dd/yyyy) | Text (short) | No | Yes |  | — | — | — | mm/dd/yyyy |  |
| dep2_nationality | Dependents (Optional) | Dependent 2 — Nationality | Text (short) | No | Yes |  | — | — | — |  |  |
| dep3_last | Dependents (Optional) | Dependent 3 — Last Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep3_first | Dependents (Optional) | Dependent 3 — First Name | Text (short) | No | Yes |  | — | — | — |  |  |
| dep3_middle | Dependents (Optional) | Dependent 3 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — |  |  |
| dep3_sex | Dependents (Optional) | Dependent 3 — Sex (M/F) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| dep3_relationship | Dependents (Optional) | Dependent 3 — Relationship | Text (short) | No | Yes |  | — | — | — | Spouse, Child, Parent |  |
| dep3_dob | Dependents (Optional) | Dependent 3 — Date of Birth (mm/dd/yyyy) | Text (short) | No | Yes |  | — | — | — | mm/dd/yyyy |  |
| dep3_nationality | Dependents (Optional) | Dependent 3 — Nationality | Text (short) | No | Yes |  | — | — | — |  |  |
| signature_printed_name | Signature | Printed Name (Signatory) | Text (short) | Yes | Yes |  | — | — | — |  |  |
| signature_date | Signature | Date Signed | Date | Yes | Yes |  | — | — | — |  |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `sex` — Sex  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Male | Male | No |
| Female | Female | No |

**Field Group:** `civil_status` — Civil Status  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Single | Single | No |
| Married | Married | No |
| Widowed | Widowed | No |
| Separated | Separated | No |
| Annulled | Annulled | No |

**Field Group:** `dep1_sex` — Dependent 1 — Sex (M/F)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| M | M | No |
| F | F | No |

**Field Group:** `dep2_sex` — Dependent 2 — Sex (M/F)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| M | M | No |
| F | F | No |

**Field Group:** `dep3_sex` — Dependent 3 — Sex (M/F)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| M | M | No |
| F | F | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PHILHEALTH_PMRF_FOREIGN_NATL_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

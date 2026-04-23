# Field Dictionary — PhilHealth Claim Signature Form

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Signature Form |
| **Agency** | PhilHealth |
| **Form Code / Version** | CSF-2018 (Revised September 2018) |
| **Category** | Claims |
| **Slug** | `philhealth-claim-signature-form` |
| **Source PDF Location** | `public/forms/PhilHealth - ClaimSignatureForm_2018.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"philhealth-claim-signature-form", values:{…}}` |
| **Field Count** | 33 |
| **Steps / Sections** | 4 |

**Purpose:** Sign-off companion form for PhilHealth claims — member/patient certification, employer certification, and consent to access patient records.

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
| S1 | Member Info | — | step 1, 9 fields |
| S2 | Patient & Confinement | — | step 2, 15 fields |
| S3 | Employer (if employed) | — | step 3, 6 fields |
| S4 | Consent Signature | — | step 4, 3 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| series_no | Member Info | Series # | Text (short) | No | Yes | inputMode=numeric | 13 | — | — | up to 13 digits |  |
| member_pin | Member Info | Member PhilHealth PIN | Text (short) | Yes | Yes | inputMode=numeric | 14 | Maybe | — | 12-345678901-2 |  |
| member_last_name | Member Info | Member — Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — |  |  |
| member_first_name | Member Info | Member — First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — |  |  |
| member_ext_name | Member Info | Member — Name Extension (JR/SR/III) | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| member_middle_name | Member Info | Member — Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| member_dob_month | Member Info | Member DOB — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | MM |  |
| member_dob_day | Member Info | Member DOB — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | DD |  |
| member_dob_year | Member Info | Member DOB — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| dependent_pin | Patient & Confinement | Dependent PhilHealth PIN (if applicable) | Text (short) | No | Yes | inputMode=numeric | 14 | Maybe | — | 12-345678901-2 |  |
| patient_last_name | Patient & Confinement | Patient — Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — |  |  |
| patient_first_name | Patient & Confinement | Patient — First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — |  |  |
| patient_ext_name | Patient & Confinement | Patient — Name Extension | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| patient_middle_name | Patient & Confinement | Patient — Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — |  |  |
| relationship_to_member | Patient & Confinement | Relationship to Member | Dropdown | Yes | Yes | options(4) | — | — | — |  |  |
| date_admitted_month | Patient & Confinement | Date Admitted — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | MM |  |
| date_admitted_day | Patient & Confinement | Date Admitted — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | DD |  |
| date_admitted_year | Patient & Confinement | Date Admitted — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| date_discharged_month | Patient & Confinement | Date Discharged — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | MM |  |
| date_discharged_day | Patient & Confinement | Date Discharged — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | DD |  |
| date_discharged_year | Patient & Confinement | Date Discharged — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| patient_dob_month | Patient & Confinement | Patient DOB — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | MM |  |
| patient_dob_day | Patient & Confinement | Patient DOB — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | DD |  |
| patient_dob_year | Patient & Confinement | Patient DOB — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| employer_pen | Employer (if employed) | Employer PhilHealth Number (PEN) | Text (short) | No | Yes | inputMode=numeric | 14 | — | — | 12 digits |  |
| employer_contact_no | Employer (if employed) | Employer Contact No. | Text (phone) | No | Yes |  | — | — | — |  |  |
| business_name | Employer (if employed) | Business Name (Employer) | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| employer_date_signed_month | Employer (if employed) | Employer Date Signed — Month | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | MM |  |
| employer_date_signed_day | Employer (if employed) | Employer Date Signed — Day | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | DD |  |
| employer_date_signed_year | Employer (if employed) | Employer Date Signed — Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | YYYY |  |
| consent_date_signed_month | Consent Signature | Consent Date Signed — Month | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | MM |  |
| consent_date_signed_day | Consent Signature | Consent Date Signed — Day | Text (short) | Yes | Yes | inputMode=numeric | 2 | — | — | DD |  |
| consent_date_signed_year | Consent Signature | Consent Date Signed — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | YYYY |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `relationship_to_member` — Relationship to Member  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Self | Self | No |
| Child | Child | No |
| Parent | Parent | No |
| Spouse | Spouse | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PHILHEALTH_CLAIM_SIGNATURE_FORM_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

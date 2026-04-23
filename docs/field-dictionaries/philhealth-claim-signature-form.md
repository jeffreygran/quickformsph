# Field Dictionary — PhilHealth Claim Signature Form

> Authoritative reference for CSF-2018. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Signature Form |
| **Agency** | PhilHealth |
| **Form Code / Version** | CSF-2018 (Revised September 2018) |
| **Category** | Claims |
| **Slug** | `philhealth-claim-signature-form` |
| **Source PDF** | `public/forms/PhilHealth - ClaimSignatureForm_2018.pdf` |
| **API** | `POST /api/generate` body `{slug:"philhealth-claim-signature-form", values:{…}}` |
| **Field Count** | 33 |
| **Steps / Sections** | 4 |

**Purpose:** Sign-off companion form for PhilHealth claims — member/patient certification, employer certification, and consent to access patient records.
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
| S1 | Member Info | 9 fields |
| S2 | Patient & Confinement | 15 fields |
| S3 | Employer (if employed) | 6 fields |
| S4 | Consent Signature | 3 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `series_no` | Member Info | Series # | Text | No | inputMode=numeric | 13 | up to 13 digits |
| `member_pin` | Member Info | Member PhilHealth PIN | Text | Yes | inputMode=numeric | 14 | 12-345678901-2 |
| `member_last_name` | Member Info | Member — Last Name | Text | Yes | UPPERCASE | — |  |
| `member_first_name` | Member Info | Member — First Name | Text | Yes | UPPERCASE | — |  |
| `member_ext_name` | Member Info | Member — Name Extension (JR/SR/III) | Text | No | UPPERCASE | — |  |
| `member_middle_name` | Member Info | Member — Middle Name | Text | No | UPPERCASE | — |  |
| `member_dob_month` | Member Info | Member DOB — Month | Text | Yes | inputMode=numeric | 2 | MM |
| `member_dob_day` | Member Info | Member DOB — Day | Text | Yes | inputMode=numeric | 2 | DD |
| `member_dob_year` | Member Info | Member DOB — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
| `dependent_pin` | Patient & Confinement | Dependent PhilHealth PIN (if applicable) | Text | No | inputMode=numeric | 14 | 12-345678901-2 |
| `patient_last_name` | Patient & Confinement | Patient — Last Name | Text | Yes | UPPERCASE | — |  |
| `patient_first_name` | Patient & Confinement | Patient — First Name | Text | Yes | UPPERCASE | — |  |
| `patient_ext_name` | Patient & Confinement | Patient — Name Extension | Text | No | UPPERCASE | — |  |
| `patient_middle_name` | Patient & Confinement | Patient — Middle Name | Text | No | UPPERCASE | — |  |
| `relationship_to_member` | Patient & Confinement | Relationship to Member | Dropdown | Yes | 4 options | — |  |
| `date_admitted_month` | Patient & Confinement | Date Admitted — Month | Text | Yes | inputMode=numeric | 2 | MM |
| `date_admitted_day` | Patient & Confinement | Date Admitted — Day | Text | Yes | inputMode=numeric | 2 | DD |
| `date_admitted_year` | Patient & Confinement | Date Admitted — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
| `date_discharged_month` | Patient & Confinement | Date Discharged — Month | Text | Yes | inputMode=numeric | 2 | MM |
| `date_discharged_day` | Patient & Confinement | Date Discharged — Day | Text | Yes | inputMode=numeric | 2 | DD |
| `date_discharged_year` | Patient & Confinement | Date Discharged — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
| `patient_dob_month` | Patient & Confinement | Patient DOB — Month | Text | Yes | inputMode=numeric | 2 | MM |
| `patient_dob_day` | Patient & Confinement | Patient DOB — Day | Text | Yes | inputMode=numeric | 2 | DD |
| `patient_dob_year` | Patient & Confinement | Patient DOB — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
| `employer_pen` | Employer (if employed) | Employer PhilHealth Number (PEN) | Text | No | inputMode=numeric | 14 | 12 digits |
| `employer_contact_no` | Employer (if employed) | Employer Contact No. | Text (phone) | No |  | — |  |
| `business_name` | Employer (if employed) | Business Name (Employer) | Text | No | UPPERCASE | — |  |
| `employer_date_signed_month` | Employer (if employed) | Employer Date Signed — Month | Text | No | inputMode=numeric | 2 | MM |
| `employer_date_signed_day` | Employer (if employed) | Employer Date Signed — Day | Text | No | inputMode=numeric | 2 | DD |
| `employer_date_signed_year` | Employer (if employed) | Employer Date Signed — Year | Text | No | inputMode=numeric | 4 | YYYY |
| `consent_date_signed_month` | Consent Signature | Consent Date Signed — Month | Text | Yes | inputMode=numeric | 2 | MM |
| `consent_date_signed_day` | Consent Signature | Consent Date Signed — Day | Text | Yes | inputMode=numeric | 2 | DD |
| `consent_date_signed_year` | Consent Signature | Consent Date Signed — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`relationship_to_member` — Relationship to Member** (dropdown)

| Option | Value |
|---|---|
| Self | `Self` |
| Child | `Child` |
| Parent | `Parent` |
| Spouse | `Spouse` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 1

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `business_name` | 0 | 125 | 434.00 | 9 | 460 | ✓ |
| `consent_date_signed_day` | 0 | 0 | 271.59 | 9 | — | ✓ |
| `consent_date_signed_month` | 0 | 0 | 271.59 | 9 | — | ✓ |
| `consent_date_signed_year` | 0 | 0 | 271.59 | 9 | — | ✓ |
| `date_admitted_day` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `date_admitted_month` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `date_admitted_year` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `date_discharged_day` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `date_discharged_month` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `date_discharged_year` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `dependent_pin` | 0 | 0 | 697.60 | 9 | — | ✓ |
| `employer_contact_no` | 0 | 460 | 449.00 | 9 | 127 | ✓ |
| `employer_date_signed_day` | 0 | 0 | 353.59 | 9 | — | ✓ |
| `employer_date_signed_month` | 0 | 0 | 353.59 | 9 | — | ✓ |
| `employer_date_signed_year` | 0 | 0 | 353.59 | 9 | — | ✓ |
| `employer_pen` | 0 | 0 | 443.59 | 9 | — | ✓ |
| `member_dob_day` | 0 | 0 | 732.60 | 9 | — | ✓ |
| `member_dob_month` | 0 | 0 | 732.60 | 9 | — | ✓ |
| `member_dob_year` | 0 | 0 | 732.60 | 9 | — | ✓ |
| `member_ext_name` | 0 | 248 | 738.00 | 9 | 95 | ✓ |
| `member_first_name` | 0 | 139 | 738.00 | 9 | 95 | ✓ |
| `member_last_name` | 0 | 28 | 738.00 | 9 | 95 | ✓ |
| `member_middle_name` | 0 | 358 | 738.00 | 9 | 78 | ✓ |
| `member_pin` | 0 | 0 | 763.60 | 9 | — | ✓ |
| `patient_dob_day` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `patient_dob_month` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `patient_dob_year` | 0 | 0 | 619.60 | 9 | — | ✓ |
| `patient_ext_name` | 0 | 248 | 673.00 | 9 | 95 | ✓ |
| `patient_first_name` | 0 | 139 | 673.00 | 9 | 95 | ✓ |
| `patient_last_name` | 0 | 28 | 673.00 | 9 | 95 | ✓ |
| `patient_middle_name` | 0 | 358 | 673.00 | 9 | 78 | ✓ |
| `series_no` | 0 | 0 | 825.85 | 9 | — | ✓ |

**Skip values (treated as blank):**

- `member_ext_name`: `<empty>`, `N/A`
- `patient_ext_name`: `<empty>`, `N/A`
- `series_no`: `<empty>`
- `dependent_pin`: `<empty>`
- `employer_pen`: `<empty>`
- `employer_contact_no`: `<empty>`
- `business_name`: `<empty>`
- `employer_date_signed_month`: `<empty>`
- `employer_date_signed_day`: `<empty>`
- `employer_date_signed_year`: `<empty>`
- `relationship_to_member`: `Self`
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

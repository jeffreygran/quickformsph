# Field Dictionary — PhilHealth Member Registration Form (Foreign National)

> Authoritative reference for PMRF-FN. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | PhilHealth Member Registration Form (Foreign National) |
| **Agency** | PhilHealth |
| **Form Code / Version** | PMRF-FN (Foreign National (2018)) |
| **Category** | Membership |
| **Slug** | `philhealth-pmrf-foreign-natl` |
| **Source PDF** | `public/forms/PhilHealth - PMRF_ForeignNatl.pdf` |
| **API** | `POST /api/generate` body `{slug:"philhealth-pmrf-foreign-natl", values:{…}}` |
| **Field Count** | 39 |
| **Steps / Sections** | 4 |

**Purpose:** Register as a PhilHealth member as a foreign national residing in the Philippines.
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
| S1 | Member's Profile | 12 fields |
| S2 | Contact & Address | 4 fields |
| S3 | Dependents (Optional) | 21 fields |
| S4 | Signature | 2 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `philhealth_number` | Member's Profile | PhilHealth Number | Text | No |  | — | 12-345678901-2 |
| `acr_icard_number` | Member's Profile | ACR I-card Number | Text | No |  | — |  |
| `pra_srrv_number` | Member's Profile | PRA SRRV Number | Text | No |  | — |  |
| `last_name` | Member's Profile | Last Name | Text | Yes |  | — |  |
| `first_name` | Member's Profile | First Name | Text | Yes |  | — |  |
| `middle_name` | Member's Profile | Middle Name | Text | No |  | — |  |
| `sex` | Member's Profile | Sex | Dropdown | Yes | 2 options | — |  |
| `nationality` | Member's Profile | Nationality | Text | Yes |  | — | e.g., American, Japanese |
| `dob_month` | Member's Profile | Date of Birth — Month | Text | Yes | inputMode=numeric | 2 | 01-12 |
| `dob_day` | Member's Profile | Date of Birth — Day | Text | Yes | inputMode=numeric | 2 | 01-31 |
| `dob_year` | Member's Profile | Date of Birth — Year | Text | Yes | inputMode=numeric | 4 | YYYY |
| `civil_status` | Member's Profile | Civil Status | Dropdown | Yes | 5 options | — |  |
| `philippine_address_line1` | Contact & Address | Philippine Address — Line 1 | Text | Yes |  | — | Unit / Building / Street |
| `philippine_address_line2` | Contact & Address | Philippine Address — Line 2 | Text | No |  | — |  |
| `contact_phone` | Contact & Address | Contact / Phone Number | Text (phone) | Yes |  | — | +63 9XX XXX XXXX |
| `email` | Contact & Address | Email Address | Text (email) | Yes |  | — |  |
| `dep1_last` | Dependents (Optional) | Dependent 1 — Last Name | Text | No |  | — |  |
| `dep1_first` | Dependents (Optional) | Dependent 1 — First Name | Text | No |  | — |  |
| `dep1_middle` | Dependents (Optional) | Dependent 1 — Middle Name | Text | No |  | — |  |
| `dep1_sex` | Dependents (Optional) | Dependent 1 — Sex (M/F) | Dropdown | No | 2 options | — |  |
| `dep1_relationship` | Dependents (Optional) | Dependent 1 — Relationship | Text | No |  | — | Spouse, Child, Parent |
| `dep1_dob` | Dependents (Optional) | Dependent 1 — Date of Birth (mm/dd/yyyy) | Text | No |  | — | mm/dd/yyyy |
| `dep1_nationality` | Dependents (Optional) | Dependent 1 — Nationality | Text | No |  | — |  |
| `dep2_last` | Dependents (Optional) | Dependent 2 — Last Name | Text | No |  | — |  |
| `dep2_first` | Dependents (Optional) | Dependent 2 — First Name | Text | No |  | — |  |
| `dep2_middle` | Dependents (Optional) | Dependent 2 — Middle Name | Text | No |  | — |  |
| `dep2_sex` | Dependents (Optional) | Dependent 2 — Sex (M/F) | Dropdown | No | 2 options | — |  |
| `dep2_relationship` | Dependents (Optional) | Dependent 2 — Relationship | Text | No |  | — | Spouse, Child, Parent |
| `dep2_dob` | Dependents (Optional) | Dependent 2 — Date of Birth (mm/dd/yyyy) | Text | No |  | — | mm/dd/yyyy |
| `dep2_nationality` | Dependents (Optional) | Dependent 2 — Nationality | Text | No |  | — |  |
| `dep3_last` | Dependents (Optional) | Dependent 3 — Last Name | Text | No |  | — |  |
| `dep3_first` | Dependents (Optional) | Dependent 3 — First Name | Text | No |  | — |  |
| `dep3_middle` | Dependents (Optional) | Dependent 3 — Middle Name | Text | No |  | — |  |
| `dep3_sex` | Dependents (Optional) | Dependent 3 — Sex (M/F) | Dropdown | No | 2 options | — |  |
| `dep3_relationship` | Dependents (Optional) | Dependent 3 — Relationship | Text | No |  | — | Spouse, Child, Parent |
| `dep3_dob` | Dependents (Optional) | Dependent 3 — Date of Birth (mm/dd/yyyy) | Text | No |  | — | mm/dd/yyyy |
| `dep3_nationality` | Dependents (Optional) | Dependent 3 — Nationality | Text | No |  | — |  |
| `signature_printed_name` | Signature | Printed Name (Signatory) | Text | Yes |  | — |  |
| `signature_date` | Signature | Date Signed | Date | Yes |  | — |  |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`sex` — Sex** (dropdown)

| Option | Value |
|---|---|
| Male | `Male` |
| Female | `Female` |

**`civil_status` — Civil Status** (dropdown)

| Option | Value |
|---|---|
| Single | `Single` |
| Married | `Married` |
| Widowed | `Widowed` |
| Separated | `Separated` |
| Annulled | `Annulled` |

**`dep1_sex` — Dependent 1 — Sex (M/F)** (dropdown)

| Option | Value |
|---|---|
| M | `M` |
| F | `F` |

**`dep2_sex` — Dependent 2 — Sex (M/F)** (dropdown)

| Option | Value |
|---|---|
| M | `M` |
| F | `F` |

**`dep3_sex` — Dependent 3 — Sex (M/F)** (dropdown)

| Option | Value |
|---|---|
| M | `M` |
| F | `F` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 1

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `acr_icard_number` | 0 | 122 | 596.00 | undefined | 176 | ✓ |
| `civil_status` | 0 | 397 | 472.20 | undefined | 156 | ✓ |
| `contact_phone` | 0 | 132 | 403.20 | undefined | 205 | ✓ |
| `dep1_dob` | 0 | 424 | 284.00 | 8 | 54 | ✓ |
| `dep1_first` | 0 | 132 | 284.00 | 8 | 78 | ✓ |
| `dep1_last` | 0 | 48 | 284.00 | 8 | 73 | ✓ |
| `dep1_middle` | 0 | 222 | 284.00 | 8 | 78 | ✓ |
| `dep1_nationality` | 0 | 492 | 284.00 | 8 | 58 | ✓ |
| `dep1_relationship` | 0 | 347 | 284.00 | 8 | 63 | ✓ |
| `dep1_sex` | 0 | 312 | 284.00 | 8 | 24 | ✓ |
| `dep2_dob` | 0 | 424 | 263.00 | 8 | 54 | ✓ |
| `dep2_first` | 0 | 132 | 263.00 | 8 | 78 | ✓ |
| `dep2_last` | 0 | 48 | 263.00 | 8 | 73 | ✓ |
| `dep2_middle` | 0 | 222 | 263.00 | 8 | 78 | ✓ |
| `dep2_nationality` | 0 | 492 | 263.00 | 8 | 58 | ✓ |
| `dep2_relationship` | 0 | 347 | 263.00 | 8 | 63 | ✓ |
| `dep2_sex` | 0 | 312 | 263.00 | 8 | 24 | ✓ |
| `dep3_dob` | 0 | 424 | 242.00 | 8 | 54 | ✓ |
| `dep3_first` | 0 | 132 | 242.00 | 8 | 78 | ✓ |
| `dep3_last` | 0 | 48 | 242.00 | 8 | 73 | ✓ |
| `dep3_middle` | 0 | 222 | 242.00 | 8 | 78 | ✓ |
| `dep3_nationality` | 0 | 492 | 242.00 | 8 | 58 | ✓ |
| `dep3_relationship` | 0 | 347 | 242.00 | 8 | 63 | ✓ |
| `dep3_sex` | 0 | 312 | 242.00 | 8 | 24 | ✓ |
| `dob_day` | 0 | 220 | 472.20 | 10 | 40 | ✓ |
| `dob_month` | 0 | 140 | 472.20 | 10 | 55 | ✓ |
| `dob_year` | 0 | 275 | 472.20 | 10 | 65 | ✓ |
| `email` | 0 | 408 | 403.20 | undefined | 145 | ✓ |
| `first_name` | 0 | 245 | 542.00 | undefined | 165 | ✓ |
| `last_name` | 0 | 42 | 542.00 | undefined | 190 | ✓ |
| `middle_name` | 0 | 424 | 542.00 | undefined | 127 | ✓ |
| `nationality` | 0 | 397 | 493.20 | undefined | 156 | ✓ |
| `philhealth_number` | 0 | 123 | 621.50 | undefined | 180 | ✓ |
| `philippine_address_line1` | 0 | 132 | 439.20 | undefined | 420 | ✓ |
| `philippine_address_line2` | 0 | 132 | 422.70 | undefined | 420 | ✓ |
| `pra_srrv_number` | 0 | 120 | 570.50 | undefined | 180 | ✓ |
| `signature_date` | 0 | 270 | 96.50 | undefined | 102 | ✓ |
| `signature_printed_name` | 0 | 42 | 96.50 | undefined | 215 | ✓ |

**Skip values (treated as blank):**

_None._
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

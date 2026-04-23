# Field Dictionary — Member's Change of Information Form (MCIF)

> Authoritative reference for HQP-PFF-049. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | Member's Change of Information Form (MCIF) |
| **Agency** | Pag-IBIG Fund |
| **Form Code / Version** | HQP-PFF-049 (V12 (12/2025)) |
| **Category** | Membership |
| **Slug** | `pagibig-pff-049` |
| **Source PDF** | `public/forms/Pagibig - PFF049_MembersChangeInformationForm.pdf` |
| **API** | `POST /api/generate` body `{slug:"pagibig-pff-049", values:{…}}` |
| **Field Count** | 37 |
| **Steps / Sections** | 5 |

**Purpose:** Update your Pag-IBIG records — name, marital status, date of birth, address, and contact details. Only fill in the sections that apply to your change request.
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
| S1 | Identification | 8 fields |
| S2 | Name / Category / DOB | 12 fields |
| S3 | Marital Status | 6 fields |
| S4 | Address & Contact | 8 fields |
| S5 | Others & Signature | 3 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `mid_no` | Identification | Pag-IBIG MID No. | Text | Yes | inputMode=numeric | — | 0000-0000-0000 |
| `housing_account_no` | Identification | Housing Account No. (if applicable) | Text | No |  | — | Leave blank if not applicable |
| `loyalty_card_holder` | Identification | Pag-IBIG Loyalty Card Holder? | Dropdown | Yes | 2 options | — |  |
| `loyalty_partner_bank` | Identification | Loyalty Card Issuing Partner-Bank/s | Text | No |  | — | e.g., UnionBank |
| `current_last_name` | Identification | Current Last Name | Text | Yes | UPPERCASE | — | DELA CRUZ |
| `current_first_name` | Identification | Current First Name | Text | Yes | UPPERCASE | — | JUAN |
| `current_ext_name` | Identification | Current Name Extension | Dropdown | No | 6 options | — |  |
| `current_middle_name` | Identification | Current Middle Name | Text | No | UPPERCASE | — | SANTOS |
| `category_from` | Name / Category / DOB | Membership Category — FROM | Text | No |  | — | e.g., Employed Local |
| `category_to` | Name / Category / DOB | Membership Category — TO | Text | No |  | — | e.g., Self-Employed |
| `name_from_last` | Name / Category / DOB | Name Change — FROM Last Name | Text | No | UPPERCASE | — |  |
| `name_from_first` | Name / Category / DOB | Name Change — FROM First Name | Text | No | UPPERCASE | — |  |
| `name_from_ext` | Name / Category / DOB | Name Change — FROM Extension | Dropdown | No | 6 options | — |  |
| `name_from_middle` | Name / Category / DOB | Name Change — FROM Middle Name | Text | No | UPPERCASE | — |  |
| `name_to_last` | Name / Category / DOB | Name Change — TO Last Name | Text | No | UPPERCASE | — |  |
| `name_to_first` | Name / Category / DOB | Name Change — TO First Name | Text | No | UPPERCASE | — |  |
| `name_to_ext` | Name / Category / DOB | Name Change — TO Extension | Dropdown | No | 6 options | — |  |
| `name_to_middle` | Name / Category / DOB | Name Change — TO Middle Name | Text | No | UPPERCASE | — |  |
| `dob_from` | Name / Category / DOB | DOB Correction — FROM (mm/dd/yyyy) | Text | No |  | — | 01/15/1985 |
| `dob_to` | Name / Category / DOB | DOB Correction — TO (mm/dd/yyyy) | Text | No |  | — | 01/15/1986 |
| `marital_from` | Marital Status | Marital Status — FROM | Dropdown | No | 7 options | — |  |
| `marital_to` | Marital Status | Marital Status — TO | Dropdown | No | 7 options | — |  |
| `spouse_last_name` | Marital Status | Spouse Last Name | Text | No | UPPERCASE | — |  |
| `spouse_first_name` | Marital Status | Spouse First Name | Text | No | UPPERCASE | — |  |
| `spouse_ext_name` | Marital Status | Spouse Name Extension | Dropdown | No | 6 options | — |  |
| `spouse_middle_name` | Marital Status | Spouse Middle Name | Text | No | UPPERCASE | — |  |
| `new_address_line` | Address & Contact | New Address — Street / House / Unit | Text | No |  | — | Unit 4B, 123 Rizal Street, Brgy. San Jose |
| `new_barangay` | Address & Contact | New Barangay | Text | No |  | — |  |
| `new_city` | Address & Contact | New City / Municipality | Text | No |  | — |  |
| `new_province` | Address & Contact | New Province / State / Country | Text | No |  | — |  |
| `new_zip` | Address & Contact | New Zip Code | Text | No | inputMode=numeric | 4 | 1100 |
| `new_cell_phone` | Address & Contact | New Cell Phone | Text (phone) | No | inputMode=tel | — | 09171234567 |
| `new_email` | Address & Contact | New Email Address | Text (email) | No | inputMode=email | — | juan@example.com |
| `preferred_mailing` | Address & Contact | Preferred Mailing Address | Dropdown | No | 4 options | — |  |
| `others_from` | Others & Signature | Other Update — FROM | Text | No |  | — | e.g., Place of Birth — Manila |
| `others_to` | Others & Signature | Other Update — TO | Text | No |  | — | e.g., Place of Birth — Quezon City |
| `signature_date` | Others & Signature | Date Signed (mm/dd/yyyy) | Text | Yes |  | 10 | 04/15/2026 |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`loyalty_card_holder` — Pag-IBIG Loyalty Card Holder?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`current_ext_name` — Current Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`name_from_ext` — Name Change — FROM Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`name_to_ext` — Name Change — TO Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`marital_from` — Marital Status — FROM** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Single | `Single` |
| Married | `Married` |
| Legally Separated | `Legally Separated` |
| Annulled/Nullified | `Annulled/Nullified` |
| Widowed | `Widowed` |
| Divorced | `Divorced` |

**`marital_to` — Marital Status — TO** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Single | `Single` |
| Married | `Married` |
| Legally Separated | `Legally Separated` |
| Annulled/Nullified | `Annulled/Nullified` |
| Widowed | `Widowed` |
| Divorced | `Divorced` |

**`spouse_ext_name` — Spouse Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`preferred_mailing` — Preferred Mailing Address** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Present Home Address | `Present Home Address` |
| Permanent Home Address | `Permanent Home Address` |
| Employer/Business Address | `Employer/Business Address` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 3

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `category_from` | 0 | 28 | 678.00 | 9 | 265 | ✓ |
| `category_to` | 0 | 302 | 678.00 | 9 | 285 | ✓ |
| `current_ext_name` | 0 | 292 | 716.00 | 9 | 165 | ✓ |
| `current_first_name` | 0 | 152 | 716.00 | 9 | 135 | ✓ |
| `current_last_name` | 0 | 28 | 716.00 | 9 | 120 | ✓ |
| `current_middle_name` | 0 | 465 | 716.00 | 9 | 120 | ✓ |
| `dob_from` | 0 | 28 | 610.00 | 10 | 265 | ✓ |
| `dob_to` | 0 | 302 | 610.00 | 10 | 285 | ✓ |
| `housing_account_no` | 0 | 0 | 828.00 | 9 | — | ✓ |
| `loyalty_partner_bank` | 0 | 424 | 787.00 | 9 | 165 | ✓ |
| `mid_no` | 0 | 0 | 857.50 | 9 | — | ✓ |
| `name_from_ext` | 0 | 196 | 644.00 | 9 | 45 | ✓ |
| `name_from_first` | 0 | 121 | 644.00 | 9 | 70 | ✓ |
| `name_from_last` | 0 | 28 | 644.00 | 9 | 90 | ✓ |
| `name_from_middle` | 0 | 244 | 644.00 | 9 | 50 | ✓ |
| `name_to_ext` | 0 | 470 | 644.00 | 9 | 45 | ✓ |
| `name_to_first` | 0 | 395 | 644.00 | 9 | 70 | ✓ |
| `name_to_last` | 0 | 302 | 644.00 | 9 | 90 | ✓ |
| `name_to_middle` | 0 | 518 | 644.00 | 9 | 70 | ✓ |
| `new_address_line` | 0 | 28 | 421.00 | 9 | 395 | ✓ |
| `new_barangay` | 0 | 28 | 390.00 | 9 | 95 | ✓ |
| `new_cell_phone` | 0 | 492 | 459.00 | 9 | 115 | ✓ |
| `new_city` | 0 | 127 | 390.00 | 9 | 90 | ✓ |
| `new_email` | 0 | 492 | 435.00 | 9 | 115 | ✓ |
| `new_province` | 0 | 220 | 390.00 | 9 | 165 | ✓ |
| `new_zip` | 0 | 390 | 390.00 | 9 | 35 | ✓ |
| `others_from` | 0 | 28 | 164.00 | 9 | 270 | ✓ |
| `others_to` | 0 | 302 | 164.00 | 9 | 285 | ✓ |
| `signature_date` | 0 | 395 | 81.00 | 10 | 160 | ✓ |
| `spouse_ext_name` | 0 | 295 | 526.00 | 9 | 95 | ✓ |
| `spouse_first_name` | 0 | 195 | 526.00 | 9 | 95 | ✓ |
| `spouse_last_name` | 0 | 90 | 526.00 | 9 | 100 | ✓ |
| `spouse_middle_name` | 0 | 395 | 526.00 | 9 | 95 | ✓ |

**Skip values (treated as blank):**

- `current_ext_name`: `<empty>`, `N/A`
- `name_from_ext`: `<empty>`, `N/A`
- `name_to_ext`: `<empty>`, `N/A`
- `spouse_ext_name`: `<empty>`, `N/A`
- `housing_account_no`: `<empty>`
- `loyalty_partner_bank`: `<empty>`
- `category_from`: `<empty>`
- `category_to`: `<empty>`
- `name_from_last`: `<empty>`
- `name_from_first`: `<empty>`
- `name_from_middle`: `<empty>`
- `name_to_last`: `<empty>`
- `name_to_first`: `<empty>`
- `name_to_middle`: `<empty>`
- `dob_from`: `<empty>`
- `dob_to`: `<empty>`
- `marital_from`: `<empty>`, `N/A`
- `marital_to`: `<empty>`, `N/A`
- `spouse_last_name`: `<empty>`
- `spouse_first_name`: `<empty>`
- `spouse_middle_name`: `<empty>`
- `new_address_line`: `<empty>`
- `new_barangay`: `<empty>`
- `new_city`: `<empty>`
- `new_province`: `<empty>`
- `new_zip`: `<empty>`
- `new_cell_phone`: `<empty>`
- `new_email`: `<empty>`
- `loyalty_card_holder`: `<empty>`, `No`, `Yes`
- `preferred_mailing`: `<empty>`, `N/A`
- `others_from`: `<empty>`
- `others_to`: `<empty>`
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

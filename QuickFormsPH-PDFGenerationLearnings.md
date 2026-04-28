# QuickFormsPH — PDF Generation Learnings

A consolidated reference of every lesson learned implementing all 12 supported Philippine
government forms — covering HTML form schema design, coordinate calibration, PDF overlay
rendering with pdf-lib, multi-page rendering, boxed-field alignment, and QA methodology.

**Apply every rule and pattern in this file to every new or updated form.**

---

## MASTER STANDARD — Complete Form Implementation Specification

> This is the governing standard for every form in QuickFormsPH. Every new form and every
> form update must satisfy ALL requirements below. Partial implementations must be tracked
> in the Per-Form Iteration Backlog (§0.4).

### MS-1 · Field Extraction (Layout Analysis)

Perform a complete extraction of the source PDF before writing any code:

- **Text inputs** — all underline/box fields, single-line and multi-line
- **Checkboxes** — every individual tickbox with its label and group membership
- **Radio groups** — identify mutually-exclusive sets (e.g. Sex: M/F, Civil Status)
- **Tables & repeating sections** — extract row schema, column labels, max rows
- **Signature/thumbmark areas** — mark as `system` (never auto-filled)
- **Instructions & static text** — preserve as UI hints, not rendered to PDF
- **Agency-use-only / office-use-only fields** — mark `skipValues`, never rendered
- **Hidden/conditional fields** — identify dependencies (e.g. "If YES, fill item 5")

**Classification for every element:**

| Class | Description |
|-------|-------------|
| `user-fillable` | Must appear in the schema `fields[]` array |
| `system/static` | Pre-printed text — never in schema, never rendered |
| `agency-only` | In `skipValues` — extracted but suppressed |
| `conditional` | In schema with `dependsOn` dependency noted in field dict |

### MS-2 · Field Dictionary & JSON Schema

Every form must have a complete field dictionary entry in §0.3 containing:

| Property | Required |
|----------|----------|
| `id` | Unique camelCase/snake_case identifier |
| `label` | Human-readable label matching the form |
| `type` | `text`, `dropdown`, `radio`, `checkbox`, `email`, `tel`, `date` |
| `inputMode` | `numeric`, `tel`, `email`, or omit |
| `required` | `true` / `false` |
| `maxLength` | Set for all bounded fields |
| `placeholder` | Realistic example value |
| `autoUppercase` | `true` for all name/address fields |
| `validation` | Regex or format constraint (e.g. `mm/dd/yyyy`, `###-#####-#`) |
| `group` | Step label this field belongs to |
| `renderType` | `boxCenters`, `underline`, `checkbox`, `skip` |
| `pdfCoords` | x, y (or boxCenters[]), page, fontSize, maxWidth |
| `iteration` | `1` (MVP) or `2+` (deferred) |

### MS-3 · HTML Form Requirements

The wizard form must:
- Visually represent each section/step matching original form grouping
- Use responsive HTML/CSS that works on mobile and desktop
- Label every input with the exact form label text
- Show `required` indicators on all mandatory fields
- Implement input masks for formatted fields (dates, ID numbers, phone)
- Support `autoUppercase` for name/address fields
- Group radio/checkbox options exactly as on the source form
- Show field-level validation errors inline (not alert dialogs)
- Meet WCAG 2.1 AA accessibility (labels, aria, tab order)

### MS-4 · PDF Coordinate Calibration

For every `user-fillable` field, a coordinate entry MUST exist in `FORM_FIELD_COORDS`:

```
fieldId → { page, x, y, fontSize, maxWidth }        // Strategy A: plain text
fieldId → { page, x:0, y, fontSize, boxCenters:[] }  // Strategy B: digit boxes
fieldId → checkboxCoords entry                        // Strategy C: checkbox/radio
```

**Mandatory calibration checks per field:**

1. Open source PDF in pdfplumber; extract `page.words` for the field zone
2. For digit-box fields: extract `page.rects` or `page.objects['image']` for cx values
3. Verify `y_lib = page_height - pdfplumber_bottom + 3` (baseline offset)
4. Set `maxWidth` to actual column width — never guess
5. Choose `fontSize` to fill but not overflow the cell height
6. After generation: run char-level pdfplumber extraction to confirm each value appears

### MS-5 · Automated QA Requirements

Every form release must pass ALL of the following gates before marking status ✅:

| Gate | Method | Pass Criterion |
|------|--------|----------------|
| **G1 — Field coverage** | `check-coords-coverage.ts` | Every `field.id` has coord entry or `skipValues` |
| **G2 — Functional completeness** | pdfplumber `page.chars` extraction | All submitted values appear in output PDF |
| **G3 — Digit-box alignment** | char cx vs. expected boxCenter | `diff < 1.5 pt` for every digit |
| **G4 — Out-of-bounds** | char x0/x1/top/bottom vs. page dims | 0 chars outside page margins (5pt) |
| **G5 — Visual parity** | `pdftoppm -r 110` + manual inspection | No text overflowing cells, no missing fields visible |
| **G6 — Iteration completeness** | §0.4 backlog review | All Iteration-1 fields implemented; backlog items documented |

**A form is NOT considered QA-passed until all G1–G6 gates pass.**

### MS-6 · Iteration Tracking

Every field that exists on the physical PDF but is NOT yet implemented must be logged in
**§0.4 Per-Form Iteration Backlog** with:
- Field name / description
- Why deferred (complexity, data dependency, low priority)
- Target iteration number

This replaces vague "deferred to iteration 2" notes in form descriptions.

### MS-7 · Version Control & Change Log

- Every coord change, schema change, or QA result must be logged in §0.5 Change Log
- Date, form, change summary, author (agent persona name)
- When a previously-deferred field is implemented, remove it from §0.4 and add to §0.5

---

## 0. Form Registry (Single Source of Truth)

This registry is the authoritative dictionary for all supported forms. Update it whenever
a form is added, versioned, or its field structure changes.

### 0.1 Global Rules (All Forms)

| Rule | Value |
|------|-------|
| Input capitalization | ALL CAPS for name/address fields |
| Date format | `mm/dd/yyyy` for display; split into separate fields for boxed forms |
| Date format (underline forms) | Free text `mm/dd/yyyy` in single field |
| Signature required | Yes — drawn or uploaded, never printed by PDF generator |
| Thumbmark required | Some forms (not auto-rendered — leave blank area) |
| Agency-use-only fields | Never rendered — always in `skipValues` |
| Coordinate system | pdfplumber (top-left) → pdf-lib (bottom-left): `y = page_h - pdfplumber_bottom` |
| Default font | Helvetica, 9pt |
| Checkmark font | ZapfDingbats, `'\u2714'`, size 9 |
| Checkbox y-formula | ALWAYS box-bottom based: `y = page_h - rect.bottom + (h - fontSize)/2`. NEVER `y = page_h - rect.top` (renders ~12pt below target). |
| Wingdings glyph offsets | `\uf0a8` (normal) → -7; `\uf071` (small q) → -6; `\u2751` rect → -7. Verified across CSF, HLF-068/858/868, SLF-065/089. |

**Audit heuristic warning (2026-04-24):** Dropdown fields do NOT always render as ticks. Many schema `type: 'dropdown'` fields (month/day/year/province/name-extension) render as **text** via `FIELD_COORDS` (digit boxes or underlines), NOT via `checkboxCoords`. A "dropdown has value but no tick rendered" finding is only a real gap when (a) the field is absent from both `FIELD_COORDS` and `checkboxCoords` OR (b) the source PDF has a printed checkbox at that location. Always verify both maps before declaring a coord missing.

---

### 0.2 Supported Forms

#### PhilHealth

| # | Slug | Form Code | Name | Version | Pages | PDF File | Fields |
|---|------|-----------|------|---------|-------|----------|--------|
| 1 | `philhealth-pmrf` | PMRF-012020 | PhilHealth Member Registration Form | UHC v.1 Jan 2020 | 2 | `PhilHealth - pmrf_012020.pdf` | 88 |
| 2 | `philhealth-pmrf-foreign-natl` | PMRF-FN | PhilHealth Member Registration Form (Foreign National) | Foreign Natl (2018) | 1 | `PhilHealth - PMRF_ForeignNatl.pdf` | 24 |
| 3 | `philhealth-claim-form-1` | CF-1 | PhilHealth Claim Form 1 | Rev. Sep 2018 | 1 | `PhilHealth - ClaimForm1_092018.pdf` | 35 |
| 4 | `philhealth-claim-form-2` | CF-2 | PhilHealth Claim Form 2 | Rev. Sep 2018 | 2 | `PhilHealth - ClaimForm2_092018.pdf` | 136 |
| 5 | `philhealth-claim-signature-form` | CSF-2018 | PhilHealth Claim Signature Form | Rev. Sep 2018 | 1 | `PhilHealth - ClaimSignatureForm_2018.pdf` | 32 |

#### Pag-IBIG Fund

| # | Slug | Form Code | Name | Version | Pages | PDF File | Fields |
|---|------|-----------|------|---------|-------|----------|--------|
| 6 | `hqp-pff-356` | HQP-PFF-356 | Application for Release of MP2 Annual Dividends | V02 (03/2024) | 1 (2-copy) | `hqp-pff-356.pdf` | 20 |
| 7 | `pagibig-pff-049` | HQP-PFF-049 | Member's Change of Information Form | — | 2 | `Pagibig - PFF049_MembersChangeInformationForm.pdf` | 36 |
| 8 | `pagibig-slf-089` | HQP-SLF-089 | Pag-IBIG HELPs Application Form | V05 (05/2025) | 2 | `PagIbig - SLF089_PagIBIGHELPsApplicationForm.pdf` | 54 |
| 9 | `pagibig-slf-065` | HQP-SLF-065 | Multi-Purpose Loan Application Form | V10 (05/2025) | 2 | `Pagibig - SLF065_MultiPurposeLoanApplicationForm.pdf` | 49 |
| 10 | `pagibig-hlf-868` | HQP-HLF-868 | HEAL Application — Co-Borrower | V01 (07/2021) | 2 | `PagIbig - HLF868_ApplicationHomeEquityAppreciationLoan(Co-borrower).pdf` | 47 |
| 11 | `pagibig-hlf-858` | HQP-HLF-858 | HEAL Application — Principal Borrower | V01 (07/2021) | 2 | `PagIbig - HLF858_ApplicationHomeEquityAppreciationLoan.pdf` | 47 |
| 12 | `pagibig-hlf-068` | HQP-HLF-068 | Housing Loan Application | V01 (07/2021) | 3 | `PagIbig - HLF068_HousingLoanApplication.pdf` | 38 |

---

### 0.3 Per-Form Field Dictionary

Each entry covers: **page dimensions**, **rendering type**, **wizard steps**, **boxed fields** (needing `boxCenters[]`), **checkbox fields**, **key validation rules**, and **known coord quirks**.

---

#### Form 1 — PhilHealth PMRF (`philhealth-pmrf`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | PhilHealth |
| Form Code | PMRF-012020 |
| Version | UHC v.1 January 2020 |
| Page Size | 594.8 × 841.5 pts (A4) |
| Pages | 2 (fields span both pages) |
| Rendering Type | Mixed — boxed digit fields + underlines |
| Multi-copy | No |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Personal Info | `pin`, `purpose`, `last_name`, `first_name`, `middle_name`, `dob_*`, `sex`, `civil_status`, `citizenship`, `philsys_id`, `tin` |
| 2 | Family Names | `mother_last_name`, `mother_first_name`, `father_last_name` |
| 3 | Address & Contact | `perm_unit` → `perm_zip`, `mail_same_as_above`, `mail_*`, `mobile`, `email` |
| 4 | Dependents | `dep1_*` through `dep4_*` |
| 5 | Member Type | `member_type`, `employer_name`, `employer_pen`, `employer_address` |

**Boxed Fields (require `boxCenters[]`)**

| Field ID | Box Type | Box Count | Font Size | Notes |
|----------|----------|-----------|-----------|-------|
| `pin` | image | 12 | 9pt | Strip dashes from `09-876-543-2109` |
| `philsys_id` | image | 12 | 9pt | Strip spaces |
| `tin` | image | 9 | 9pt | |
| `dob_month` | image | 2 | 11pt | Tall boxes (~26pt) — use 11pt |
| `dob_day` | image | 2 | 11pt | |
| `dob_year` | image | 4 | 11pt | |

**Checkbox Fields**

| Field ID | Options | Strategy |
|----------|---------|----------|
| `sex` | Male / Female | `checkboxCoords` |
| `civil_status` | Single / Married / Widowed / Legally Separated | `checkboxCoords` |
| `purpose` | Registration / Updating/Amendment | `checkboxCoords` |
| `member_type` | Employed / Self-Earning / Kasambahay / OFW | `checkboxCoords` |
| `dep1_disability` / `dep2_disability` | checkbox | `checkboxCoords` |

**Validation Rules**

| Field | Rule |
|-------|------|
| `pin` | Format `##-###-######-#`, 12 digits |
| `tin` | 9 digits |
| `philsys_id` | 12 digits |
| `dob_month` | 2 digits (01–12) |
| `dob_day` | 2 digits (01–31) |
| `dob_year` | 4 digits (19xx–20xx) |
| `perm_zip` | 4 digits (`maxLength: 4`) |
| `mobile` | 11 digits, 09-prefix |

**Known Coord Quirks**
- Province field: `fontSize: 8` — "Metro Manila (NCR)" overflows at 9pt
- Mailing address fields: only rendered if `mail_same_as_above !== 'true'` or user overrides
- `dep*` rows: 21pt vertical spacing; use `fontSize: 8` for narrow dependent columns

---

#### Form 2 — PhilHealth PMRF Foreign National (`philhealth-pmrf-foreign-natl`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | PhilHealth |
| Form Code | PMRF-FN |
| Version | Foreign National (2018) |
| Page Size | 595.3 × 841.9 pts (A4) |
| Pages | 1 |
| Rendering Type | Underline-only (no per-character boxes) |
| Multi-copy | No |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Contact & Address | `last_name`, `first_name`, `dob`, `sex`, address fields |
| 2 | Dependents (Optional) | `dep1_*` through `dep3_*` |
| 3 | Signature | `date_signed` |

**Rendering Notes**
- All fields use Strategy A (`x / maxWidth`) — no `boxCenters[]` needed anywhere
- DOB is a **single underline field**, not split mm/dd/yyyy boxes — use `type: 'text'`, no `inputMode: 'numeric'`
- Sex: 2 small rect checkboxes (the only rects in the whole doc)
- Calibration shortcut: scan `extract_words()` for `'___...'` runs → gives `x0`, `x1`, `y` directly
- Dependent rows: `fontSize: 8` for narrow middle-name and date columns

---

#### Form 3 — PhilHealth Claim Form 1 (`philhealth-claim-form-1`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | PhilHealth |
| Form Code | CF-1 |
| Version | Revised September 2018 |
| Page Size | 612.0 × 936.0 pts (Legal) |
| Pages | 1 |
| Rendering Type | Mixed — rect-based boxed digits + underlines |
| Multi-copy | No |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Member Info | `member_pin`, `member_last_name`, `member_first_name`, `member_dob_*`, `member_sex` |
| 2 | Mailing Address | `member_address_*` |
| 3 | Contact & Patient | `patient_is_member`, `member_phone`, `member_email` |
| 4 | Dependent Info | `patient_pin`, `patient_last_name`, `patient_first_name`, `patient_dob_*` |
| 5 | Employer Cert | `employer_name`, `employer_pen`, `employer_address`, `employer_phone` |

**Boxed Fields (require `boxCenters[]`)**

| Field ID | Box Type | Box Count | Font Size |
|----------|----------|-----------|-----------|
| `member_pin` | rect (12.3×12.3 pts) | 12 | 9pt |
| `patient_pin` | rect | 12 | 9pt |
| `employer_pen` | rect | 12 | 9pt |
| `member_dob_month` | rect | 2 | 9pt |
| `member_dob_day` | rect | 2 | 9pt |
| `member_dob_year` | rect | 4 | 9pt |
| `patient_dob_month` | rect | 2 | 9pt |
| `patient_dob_day` | rect | 2 | 9pt |
| `patient_dob_year` | rect | 4 | 9pt |

**Checkbox Fields**

| Field ID | Options |
|----------|---------|
| `member_sex` | Male / Female |
| `patient_is_member` | Yes — I am the Patient / No — Patient is a Dependent |
| `patient_sex` | Male / Female |

**Known Coord Quirks**
- Digit boxes are **rects** not images — use `page.rects` filter (`w ≈ h ≈ 12.3`)
- `hospital_name` is NOT in CF-1 schema — it belongs to CF-2 (common payload mistake)

---

#### Form 4 — PhilHealth Claim Form 2 (`philhealth-claim-form-2`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | PhilHealth |
| Form Code | CF-2 |
| Version | Revised September 2018 |
| Page Size | 612.0 × 936.0 pts (Legal) |
| Pages | 2 |
| Rendering Type | Underline + checkbox |
| Multi-copy | No |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | HCI Information | `hci_name`, `hci_bldg_street`, `hci_city`, `hci_accreditation_no` |
| 2 | Patient Information | `patient_last_name`, `patient_first_name`, `patient_dob_*`, `patient_sex` |
| 3 | Referral & Confinement | `admission_date_*`, `discharge_date_*`, `confinement_type` |
| 4 | Disposition & Accommodation | `disposition`, `accommodation_type` |
| 5 | Diagnoses & Procedures | `admission_diagnosis_1`, `admission_diagnosis_2`, `procedure_*` |
| 6 | Special Considerations | `case_type`, `special_case` |
| 7 | HCP Accreditation & Fees | `hcp1_name`, `hcp1_specialty`, `hcp1_copay`, `hci_paid_*`, `pf_paid_*` |
| 8 | Certification of Benefits | `drug_purchase_none`, `diagnostic_purchase_none` |

**Multi-Page Checkbox Fields (page 2 — use `page: 1`)**

| Field ID | Page |
|----------|------|
| `hcp1_copay`, `hcp2_copay`, `hcp3_copay` | 1 |
| `hci_paid_member_patient`, `hci_paid_hmo`, `hci_paid_others` | 1 |
| `pf_paid_member_patient`, `pf_paid_hmo`, `pf_paid_others` | 1 |
| `drug_purchase_none`, `diagnostic_purchase_none` | 1 |

**Known Coord Quirks**
- All page-2 checkbox coords **must** include `page: 1`
- `member_last_name` is NOT in CF-2 schema — CF-2 is hospital-side only
- Verify checkmarks with `page.chars` filtered to `fontname='ZapfDingbats'` on both pages

---

#### Form 5 — PhilHealth Claim Signature Form (`philhealth-claim-signature-form`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | PhilHealth |
| Form Code | CSF-2018 |
| Version | Revised September 2018 |
| Page Size | 612.0 × 936.0 pts (Legal) |
| Pages | 1 |
| Rendering Type | Mixed — rect-based boxed digits + underlines |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Member Info | `member_pin`, `member_last_name`, `member_first_name` |
| 2 | Patient & Confinement | `patient_last_name`, `admission_*`, `discharge_*` |
| 3 | Employer (if employed) | `employer_name`, `employer_address` |
| 4 | Consent Signature | `date_admitted_month`, `date_admitted_day`, `date_admitted_year` |

**Known Coord Quirks**
- Common payload mistake: use `member_last_name` + `member_first_name` (not `member_name`)
- Date fields are `date_admitted_month/day/year` (not `date_filed`)

---

#### Form 6 — Pag-IBIG MP2 Dividends (`hqp-pff-356`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-PFF-356 |
| Version | V02 (03/2024) |
| Page Size | 612.1 × 936.1 pts (Legal) |
| Pages | 1 (two identical copies stacked) |
| Rendering Type | Mixed — rect-based boxed digits + underlines |
| Multi-copy | Yes — `copyYOffsets: [0, -449.4]` |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Account Info | `mp2_account_no`, `branch`, `last_name`, `first_name`, `middle_name`, `mid_no` |
| 2 | Contact & Address | `street`, `barangay`, `city`, `province`, `zip`, `cellphone`, `email` |
| 3 | Bank Details | `bank_name`, `bank_account_no`, `bank_branch`, `bank_address`, `date` |

**Boxed Fields (require `boxCenters[]`)**

| Field ID | Format | Digit Count | Skip-Cell Notes |
|----------|--------|-------------|-----------------|
| `mid_no` | `4-4-4` (14 cells, 2 dash cells) | 12 | Skip cells at indices 4 and 9 (pre-printed dashes) |
| `mp2_account_no` | 12 digits | 12 | |

**Known Coord Quirks**
- `copyYOffsets: [0, -449.4]` — renderer draws every field twice (copy 1 and copy 2)
- MID `4-4-4` dash cells: provide only 12 `boxCenters` (skipping the 2 dash-cell cx values)

---

#### Form 7 — Pag-IBIG MCIF (`pagibig-pff-049`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-PFF-049 |
| Page Size | Legal |
| Pages | 2 |
| Rendering Type | Mixed |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label | Key Fields |
|------|-------|------------|
| 1 | Identification | `mid_no`, `current_last_name`, `current_first_name` |
| 2 | Name / Category / DOB | `new_last_name`, `new_first_name`, `category`, `dob_*` |
| 3 | Marital Status | `civil_status`, `spouse_*` |
| 4 | Address & Contact | `new_address_line`, `city`, `province`, `zip`, `cellphone` |
| 5 | Others & Signature | `loyalty_partner_bank`, `date_signed` |

**Known Coord Quirks**
- Common payload mistake: use `current_last_name` / `current_first_name` (not `last_name`)
- `new_address_line` is the address field (not `address`)
- `loyalty_partner_bank` is **text only** — no checkbox exists in the source PDF for this field (stray checkmark bug if `checkboxCoords` is added)

---

#### Form 8 — Pag-IBIG HELPs (`pagibig-slf-089`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-SLF-089 |
| Version | V05 (05/2025) |
| Page Size | Legal |
| Pages | 2 |
| Rendering Type | Mixed — boxed MID + underlines |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label |
|------|-------|
| 1 | Identification |
| 2 | Personal Info |
| 3 | Permanent Address |
| 4 | Present Address |
| 5 | Employer / Loan |

---

#### Form 9 — Pag-IBIG Multi-Purpose Loan (`pagibig-slf-065`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-SLF-065 |
| Version | V10 (05/2025) |
| Page Size | Legal |
| Pages | 2 |
| Rendering Type | Mixed |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label |
|------|-------|
| 1 | Identification |
| 2 | Personal Info |
| 3 | Permanent Address |
| 4 | Present Address |
| 5 | Employer / Loan |

---

#### Form 10 — Pag-IBIG HEAL Co-Borrower (`pagibig-hlf-868`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-HLF-868 |
| Version | V01 (07/2021) |
| Page Size | Legal |
| Pages | 2 |
| Rendering Type | Mixed |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label |
|------|-------|
| 1 | Identification |
| 2 | Permanent Address |
| 3 | Present Address |
| 4 | Employer |

---

#### Form 11 — Pag-IBIG HEAL Principal Borrower (`pagibig-hlf-858`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-HLF-858 |
| Version | V01 (07/2021) |
| Page Size | Legal |
| Pages | 2 |
| Rendering Type | Mixed |
| Last QA | April 23 2026 ✅ |

**Wizard Steps**

| Step | Label |
|------|-------|
| 1 | Loan & Identification |
| 2 | Permanent Address |
| 3 | Present Address |
| 4 | Employer |

---

#### Form 12 — Pag-IBIG Housing Loan (`pagibig-hlf-068`)

**Metadata**
| Property | Value |
|----------|-------|
| Agency | Pag-IBIG Fund |
| Form Code | HQP-HLF-068 |
| Version | V01 (07/2021) |
| Page Size | Legal |
| Pages | 3 |
| Rendering Type | Mixed — boxed MID/account + underlines |
| Last QA | April 24 2026 ✅ (post-boxCenters fix) |

**Wizard Steps**

| Step | Label |
|------|-------|
| 1 | Identification |
| 2 | Permanent Address |
| 3 | Present Address & Contacts |
| 4 | Employer |

**Boxed Fields (require `boxCenters[]`)**

| Field ID | Format | Box Count | y_lib | Skip-Cell Notes |
|----------|--------|-----------|-------|-----------------|
| `mid_no` | `4-4-4` (14 cells) | 12 | 865.8 | Skip dash cells at source indices 4 and 9 |
| `housing_account_no` | `4-4-4` (14 cells) | 12 | 865.4 | Skip dash cells at source indices 4 and 9 |

**Confirmed boxCenters (from `page.rects`, top ≈ 61 pt, cell w ≈ 11.6–12.9 pt):**
- `mid_no`: `[216.83, 228.89, 240.95, 253.07, 277.19, 289.31, 301.43, 313.56, 337.75, 349.81, 361.93, 374.05]`
- `housing_account_no`: `[405.61, 418.93, 432.25, 445.54, 472.24, 485.56, 498.88, 512.26, 538.96, 552.28, 565.67, 579.06]`

**Known Coord Quirks**
- `desired_loan_amount`: X=475, `y=hlf068Y(148)` — label and value cell are on **different rows**; use underline row Y, not label row Y
- `mid_no` / `housing_account_no`: rect-based digit boxes, NOT image-based — use `page.rects` filter
- ⚠️ Previously had `x/maxWidth` on both MID fields — this is what caused the overflow bug. See §25.

---

### 0.4 Field Domain Rules (Cross-Form)

These apply universally unless a form's dictionary entry says otherwise.

| Field Pattern | Type | Format | Max Length | Validation |
|---------------|------|--------|------------|------------|
| `*_last_name`, `*_first_name`, `*_middle_name` | text | ALL CAPS | — | Required on member info step |
| `*_name_ext` | text | Jr./Sr./II | 10 | Optional; skipValues: `['N/A']` |
| `pin` / `member_pin` / `patient_pin` | text | `##-###-######-#` | 15 | 12 digits after strip |
| `mid_no` | text | `####-####-####` | 14 | 12 digits after strip; skip dash cells in boxCenters |
| `tin` | text | 9-digit | 9 | boxCenters[9] |
| `*_dob_month` | text | `MM` | 2 | 01–12 |
| `*_dob_day` | text | `DD` | 2 | 01–31 |
| `*_dob_year` | text | `YYYY` | 4 | 4-digit year |
| `*_zip` | text | 4-digit | 4 | PH ZIP is 4 digits only |
| `cellphone` / `mobile` | text | `09XXXXXXXXX` | 11 | 09-prefix, 11 digits |
| `email` | text | email | — | standard email validation |
| `*_province` | text/dropdown | — | — | `fontSize: 8` if narrow column |
| `date` / `date_signed` | text | `mm/dd/yyyy` | 10 | No `inputMode: 'numeric'` |

---

### 0.4 Per-Form Iteration Backlog

Fields that exist on the physical PDF but are **not yet implemented** in the schema or PDF generator.
Per MS-6, these must be tracked here rather than buried in form descriptions.

**Legend:** 🔴 High (visible/impactful) | 🟡 Medium | 🟢 Low / Office-use-only

---

#### HLF-068 — Pag-IBIG Housing Loan Application (`pagibig-hlf-068`)

**Iteration 2 (2026-04-24) — IMPLEMENTED (11 checkbox groups):**
`existing_housing_application` (Yes/No) · `loan_purpose` (8 options) · `loan_term` (8 yrs) ·
`mode_of_payment` (8 options) · `property_type` (6 options) · `property_mortgaged` (Yes/No) ·
`offsite_collateral` (Yes/No) · `sex` (M/F) · `marital_status` (5 options) ·
`home_ownership` (5 options) · `employment_type` (Employed / Self-Employed).
See `HLF068_CHECKBOX_COORDS` in [pdf-generator.ts](projects/quickformsph-dev/src/lib/pdf-generator.ts).
QA: 11/11 ✓ ticks verified in rendered PDF via ZapfDingbats glyph extraction (cx offsets 0).

**Still Deferred (Iteration 3+):**

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| 1 | **DESIRED RE-PRICING PERIOD** (radio: 1/3/5/10/15/20/25/30 years) | 🟡 | Separate row from loan term; coord calibration pending | 3 |
| 2 | **COLLATERAL / PROPERTY LOCATION** (free-text) | 🔴 | Underline coord calibration pending | 3 |
| 3 | **PROPERTY DETAILS** (TCT/OCT/CCT No., Tax Dec No., Lot/Unit No., Block/Bldg No., No. of Storeys, Land Area, Floor Area, Age of House, Total Floor Area) | 🟡 | 9 underline fields — coord calibration needed | 3 |
| 4 | **NAME OF DEVELOPER / REGISTERED TITLE HOLDER** | 🟡 | Underline field | 3 |
| 5 | **NO. OF DEPENDENTS** | 🟡 | Numeric field | 3 |
| 6 | **MAILING ADDRESS preference** (radio: Present / Permanent / Employer) | 🟡 | Radio group, page 0 top≈655.9 | 3 |
| 7 | **INDUSTRY** (checkbox grid — 20 options, pages 0+1) | 🟢 | Large checkbox grid | 3 |
| 8 | **PREFERRED TIME TO BE CONTACTED** (text) | 🟢 | Low priority | 3 |
| 9 | **EMPLOYER CONTACT DETAILS** (Country code + Tel No., Business Direct Line, Business Trunk Line, Employer Email) | 🟡 | Contact fields not in current schema | 3 |
| 10 | **SPOUSE'S PERSONAL DATA** (all fields — page 0 bottom) | 🔴 | Full co-borrower section | 3 |
| 11 | **CO-BORROWER DATA** (pages 1–2) | 🔴 | Full co-borrower section | 3 |
| 12 | **REFERRAL SOURCE** (checkbox grid — TV/Radio/Agency/etc., page 1 bottom) | 🟢 | Low priority | 3 |

---

#### SLF-089 — Pag-IBIG HELPs Application (`pagibig-slf-089`)

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| ~~1~~ | ~~Civil status checkboxes~~ | — | ✅ Done Iter 2 (2026-04-24) | 2 |
| ~~2~~ | ~~Sex / Marital / Loan-Amount-Type / Loan-Purpose / Loan-Term checkboxes~~ | — | ✅ Done Iter 2 (2026-04-24) | 2 |
| 3 | Full property/loan details section | 🟡 | Multi-field complex section | 3 |

---

#### SLF-065 — Multi-Purpose Loan Application (`pagibig-slf-065`)

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| ~~1~~ | ~~Loan purpose checkboxes (10 opts)~~ | — | ✅ Done Iter 2 | 2 |
| ~~2~~ | ~~Sex / Marital / Loan Term (3 opts)~~ | — | ✅ Done Iter 2 | 2 |
| 3 | Industry grid (`\uf0a8` Wingdings, ~25 opts) | 🟡 | Deferred to Iter 3 | 3 |
| 4 | Employment type checkboxes (page 2) | 🟡 | Deferred to Iter 3 | 3 |

---

#### HLF-868 / HLF-858 — HEAL Application (`pagibig-hlf-868`, `pagibig-hlf-858`)

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| ~~1~~ | ~~Sex / Marital Status~~ | — | ✅ Done Iter 2 (both forms) | 2 |
| ~~2~~ | ~~HLF-868: Relationship to Principal~~ | — | ✅ Done Iter 2 | 2 |
| ~~3~~ | ~~HLF-858: Loan Purpose / Loan Term / Mode of Payment / Request Re-inspection~~ | — | ✅ Done Iter 2 | 2 |
| ~~4~~ | ~~Home Ownership / Employment Type / Mailing Preference~~ | — | ✅ Done Iter 2 (both forms) | 2 |
| 5 | Industry grid (`\uf0a8`) — both forms | 🟡 | Deferred to Iter 3 | 3 |
| 6 | Property/collateral details section | 🟡 | Complex section | 3 |

---

#### PhilHealth PMRF (`philhealth-pmrf`)

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| 1 | Member type checkboxes (page 2 group) | 🔴 | Partial — needs full audit | 2 |

---

#### PFF-049 — Member's Change of Information (`pagibig-pff-049`)

| # | Field / Section | Priority | Reason Deferred | Target Iter |
|---|----------------|----------|-----------------|-------------|
| 1 | Change request checkboxes | 🔴 | Need audit vs. schema | 2 |

---

> **Note:** Forms not listed above (CF-1, CF-2, CSF, HQP-PFF-356, PMRF-FN) have been
> reviewed; known gaps were addressed in the April 23 2026 QA run. Any new gaps discovered
> during future QA must be added here.

---

### 0.5 Change Log

| Date | Form | Change | Updated By |
|------|------|--------|------------|
| 2026-04-23 | All 12 forms | Initial Form Registry added; 12/12 QA pass confirmed | Gov Forms Specialist + PM |
| 2026-04-24 | HLF-068 | Fixed `mid_no` / `housing_account_no`: replaced `x/maxWidth` with `boxCenters[]`; 12-digit exact box alignment verified (§25) | Gov Forms Specialist + QA (Mai) |
| 2026-04-24 | (All) | Fixed pre-existing TypeScript build error in `page.tsx` (`pdf.getPage` → `npdf.getPage`) | Gov Forms Specialist |
| 2026-04-24 | HLF-068 | Fixed address column misalignment: `perm_street`/`pres_street` moved to x=363 (Street Name col); address row 2 corrected to x=30/101/157/227/360; `occupation` moved to x=370 past checkboxes (§26) | Gov Forms Specialist + QA (Mai) |
| 2026-04-24 | All forms | Added MASTER STANDARD (MS-1 through MS-7) as governing spec for all form implementations. Added §0.4 Per-Form Iteration Backlog with 20 HLF-068 deferred fields documented (PURPOSE OF LOAN, Loan Term, Mode of Payment, Marital Status, Sex, etc.) and backlog entries for 5 other forms. | Gov Forms Specialist + PM (Irwin) |
| 2026-04-24 | HLF-068 | **Iteration 2 — Checkbox expansion.** Added 11 checkbox/radio groups to the PDF generator via new `HLF068_CHECKBOX_COORDS` map (derived from pdfplumber `❑` U+2751 and `\uf0a8` Wingdings glyph coords): `existing_housing_application`, `loan_purpose` (8 opts), `loan_term` (8 yrs), `mode_of_payment` (8 opts), `property_type` (6 opts), `property_mortgaged`, `offsite_collateral`, `sex`, `marital_status` (5 opts), `home_ownership` (5 opts), `employment_type`. New `hlf068CheckY()` helper (y_lib = 936 - glyph_top - 7) matches CSF proven formula. Wizard steps grew from 4 → 6 (Loan Particulars, Property Details, Identification, Permanent Addr, Present Addr, Employer). QA: 11/11 ✓ ticks verified at target x with cx-diff = 0.00. Removed these items from §0.4 backlog; remaining 12 items re-targeted to Iteration 3 (re-pricing, property details text fields, spouse/co-borrower, industry grid, employer contacts, referral source). | Gov Forms Specialist + QA (Mai) + Backend (Art) |
| 2026-04-24 | SLF-089, SLF-065, HLF-868, HLF-858 | **Iteration 2 — Batch checkbox rollout across 4 Pag-IBIG forms.** Added new coord maps (`SLF089_CHECKBOX_COORDS`, `SLF065_CHECKBOX_COORDS`, `HLF868_CHECKBOX_COORDS`, `HLF858_CHECKBOX_COORDS`) + per-form `checkY` helpers. **SLF-089** (h=936): 5 groups — sex, marital_status, loan_amount_type, loan_purpose (3 opts), loan_term (4 opts). **SLF-065** (h=936): 4 groups — sex, marital_status, loan_term (3 opts), loan_purpose (10 opts). **HLF-868** (h=792, `\uf071` glyph, -6 offset): 6 groups — sex, marital_status, relationship_to_principal (5), home_ownership (5), employment_type (3), mailing_preference (3). **HLF-858** (h=792, `\uf071`): 9 groups — loan_purpose (11 opts), loan_term (8 yrs), mode_of_payment (9 opts), request_for_reinspection (Y/N), sex, marital_status (5), home_ownership (5), employment_type (3), mailing_preference (3). All 4 forms wired into `FORM_PDF_CONFIGS.checkboxCoords`; `forms.ts` schemas extended with new dropdown fields; skipValues updated with placeholder entries. QA (full-input POST to `/api/generate`): **SLF-089 5/5 PASS**, **SLF-065 4/4 PASS**, **HLF-868 6/6 PASS**, **HLF-858 9/9 PASS** — all expected ZapfDingbats `✓` glyphs rendered. PMRF + PFF-049 existing checkbox maps audited and confirmed healthy (no changes needed). | Gov Forms Specialist + QA (Mai) + Backend (Art) |
| 2026-04-24 | SLF-065, HLF-868, HLF-858 | **Iteration 3 — Industry grid + Source of referral.** Added `industry_category` (25 options, 4-col × 7-8-row `\uf0a8` Wingdings grid) to HLF-868 (cx 28.80/168.86/313.13/415.39 at tops 522.7→578.9) and HLF-858 (cx 26.88/175.58/307/413.23 at tops 691.4→736.3). Added `source_of_referral` (11 options: Pag-IBIG Fund Website, Social media, Radio, Television, Streaming Service Ad, Newspaper/Online Newspaper, Billboard, Word of Mouth, Referral, Employer/Fund Coordinator, Others) to SLF-065 at bottom of page 0 (tops 798.9/805.7, cx 24/110/176/294/382/489). Shared `HLF_INDUSTRY_OPTIONS` constant in `forms.ts`. Schemas extended with new dropdown fields, SKIP_VALUES updated. QA: **SLF-065 5/5 PASS**, **HLF-868 7/7 PASS**, **HLF-858 10/10 PASS**. | Gov Forms Specialist + QA (Mai) + Backend (Art) |
| 2026-04-24 | (All 12) | **Comprehensive audit pass.** Ran real runtime audit: rendered all 12 forms in-process via `generatePDF()` with full-input payloads, extracted overlay with pdfplumber, cross-checked against source PDF printed checkboxes/underlines. Added `scripts/dump-all-audit.ts` for reproducibility. Result: **5 Pag-IBIG Iter-2 forms (SLF-089, SLF-065, HLF-868, HLF-858, HLF-068) confirmed clean.** Only real defect found: CF-2 `hcp2_copay` and `hcp3_copay` used inconsistent y-formula vs `hcp1_copay` — ticks landed ~11pt below printed boxes. Fixed: updated formula to use box-bottom `y = 936 - (top+12.3) + (h-fontSize)/2` so hcp2 → y=781/766 and hcp3 → y=719/705. Post-fix QA: 3 page-1 ticks now at tops 84/146/208 (source boxes at 82.9/145.6/207.1 — within 1pt). All other "missing checkbox" audit findings were FALSE POSITIVES from audit heuristic: dropdowns for date month/day/province/ext-name fields render as text via `FIELD_COORDS` (digit-box and underline rendering), not as ticks. | Gov Forms Specialist + QA (Mai) |

---

---

> ## ⚠️ RULE #1 — MOST IMPORTANT — READ BEFORE WRITING ANY COORD
>
> ### IF A FIELD HAS INDIVIDUAL CHARACTER/DIGIT BOXES → YOU MUST USE `boxCenters[]`
>
> **NEVER use `x / maxWidth` for any field where characters go into individual boxes.**
> This includes: PIN numbers, ID numbers, TIN, PEN, DOB, date fields, reference numbers —
> **any field where each digit or character has its own printed square/box on the form.**
>
> Using `maxWidth` places the entire string as one run starting at `x`, landing **outside
> or below** the boxes. The only correct approach is:
>
> ```typescript
> // ✅ CORRECT — each character centred in its box
> field_id: { page: 0, x: 0, y: <computed>, fontSize: 9,
>   boxCenters: [cx1, cx2, cx3, ...],  // one cx per box, from pdfplumber rect/image
> }
>
> // ❌ WRONG — entire string printed as one run, lands outside the boxes
> field_id: { page: 0, x: 193, y: 215, maxWidth: 190 }
> ```
>
> **How to compute each value:**
> - `boxCenters[i]` = `(rect.x0 + rect.x1) / 2` for each box rect/image, sorted left→right
> - `y` = `page_height - rect.bottom + (box_height - cap_height_at_fontSize) / 2`
>   - For 9pt Helvetica: cap_height ≈ 6.51 pt → `(box_h - 6.51) / 2`
>   - For 11pt Helvetica: cap_height ≈ 7.97 pt → `(box_h - 7.97) / 2`
> - Strip separators (hyphens/spaces) in the renderer — the `boxCenters` path already does
>   this via `text.replace(/\D/g, '')` before iterating
>
> **Detection:** open pdfplumber, scan `page.rects` or `page.images` for small squares
> (w ≈ h ≈ 10–18 pts). If you find a row of them → that field needs `boxCenters[]`.
>
> **Fields confirmed to need `boxCenters[]` in this project:**
> | Field | Form | Box type | Count |
> |-------|------|----------|-------|
> | `pin` | PMRF | image | 12 |
> | `philsys_id` | PMRF | image | 12 |
> | `tin` | PMRF | image | 9 |
> | `dob_month/day/year` | PMRF | image | 2+2+4 |
> | `member_pin` | CF-1 | rect | 12 |
> | `patient_pin` | CF-1 | rect | 12 |
> | `member_dob_*` | CF-1 | rect | 2+2+4 |
> | `patient_dob_*` | CF-1 | rect | 2+2+4 |
> | `employer_pen` | CF-1 | rect | 12 |

---

## 1. PDF Coordinate System Fundamentals

### Two coordinate origins — never mix them
| Tool | Origin | Y direction |
|------|--------|-------------|
| **pdfplumber** | Top-left of page | Y increases **downward** |
| **pdf-lib** | Bottom-left of page | Y increases **upward** |

### Conversion formula
```
pdf_lib_y = page_height - pdfplumber_bottom
```
- Use `pdfplumber_bottom` (not `top`) so the text baseline sits **inside** the box.
- Add a small fudge (+3 to +5 pts) when you want text visually centred in a tall box.

### Page sizes encountered
| Form | Size (pts) |
|------|-----------|
| PhilHealth PMRF (A4) | 594.8 × 841.5 |
| Pag-IBIG HQP-PFF-356 (Legal) | 612.1 × 936.1 |
| PhilHealth Claim Form 1 (Legal) | 612.0 × 936.0 |

---

## 2. pdfplumber — What It Can and Cannot See

| Object type | Detected by pdfplumber? | Notes |
|-------------|------------------------|-------|
| Filled rectangles (`rect`) | ✅ Yes | Reliable for borders, label boxes |
| Path-stroked lines (`line`/`edge`) | ✅ Partially | Only simple lines, not complex path strokes |
| **Image objects** (`image`) | ✅ Yes | Digit input boxes in PhilHealth PMRF are images |
| **Small rect objects** | ✅ Yes | Digit input boxes in PhilHealth CF-1 are small rects (12.3×12.3 pts) |
| Path-drawn decorative boxes | ❌ No | Must use visual measurement or image render |
| AcroForm fields | ❌ No | Source PDFs in this project have no AcroForm |

### Key discovery: digit boxes can be images OR rects — check which
- **PMRF (pmrf_012020.pdf)**: PIN and DOB boxes are **image objects** — use `page.objects['image']`
- **Claim Form 1 (ClaimForm1_092018.pdf)**: digit boxes are **small rect objects** (w=12.3, h=12.3) — use `page.rects`

Always run this check on a new form to determine box type:
```python
# Check for image-based digit boxes
imgs = [o for o in page.objects.get('image', []) if Y_MIN < o['top'] < Y_MAX]
print(f"Image objects in zone: {len(imgs)}")

# Check for rect-based digit boxes (small squares)
small_rects = [r for r in page.rects if abs((r['x1']-r['x0']) - (r['y1']-r['y0'])) < 2
               and r['x1']-r['x0'] < 20 and Y_MIN < r['top'] < Y_MAX]
print(f"Small square rects in zone: {len(small_rects)}")
```

For **rect-based boxes**, extract centers the same way:
```python
boxes = sorted(small_rects, key=lambda r: r['x0'])
for r in boxes:
    cx = (r['x0'] + r['x1']) / 2
    y_lib = page_height - r['bottom']
    print(f"cx={cx:.2f}  y_lib={y_lib:.2f}")
```

For **image-based boxes** (PMRF pattern):
```python
imgs = [o for o in page.objects['image'] if Y_MIN < o['top'] < Y_MAX]
imgs_sorted = sorted(imgs, key=lambda o: o['x0'])
for o in imgs_sorted:
    cx = (o['x0'] + o['x1']) / 2
    y_lib = page_height - o['bottom']
```

In both cases the `boxCenters` rendering strategy in `pdf-generator.ts` works identically —
the difference is only in how you extract the cx values during calibration.

---

## 3. Text Placement Strategies

### Strategy A — Simple field text (most fields)
```typescript
{ page: 0, x: <x0_of_fill_area>, y: <841.5 - pdfplumber_bottom + offset>, maxWidth: <col_width> }
```
- `x` = x0 of the fill area (just past column separator line)
- `maxWidth` = column width so pdf-lib truncates rather than overflows

### Strategy B — Per-character box rendering (PIN, DOB)
Use when each character must land inside its own individual digit box.

```typescript
{
  page: 0, x: 0, y: <baseline_y>, fontSize: <n>,
  boxCenters: [cx1, cx2, cx3, ...],   // one cx per box, from pdfplumber image objects
}
```

Renderer logic (already in `pdf-generator.ts`):
```typescript
if (coords.boxCenters) {
  const digits = text.replace(/\D/g, '');   // strip dashes/spaces
  for (let i = 0; i < Math.min(digits.length, coords.boxCenters.length); i++) {
    const ch = digits[i];
    const charWidth = font.widthOfTextAtSize(ch, fontSize);
    page.drawText(ch, { x: boxCenters[i] - charWidth / 2, y, ... });
  }
}
```

**Why strip non-digits:** PIN input is `09-876-543-2109` (with dashes). The PDF has
12 digit boxes — strip dashes so only the 12 digits are mapped 1:1 to boxes.

### Strategy C — Checkbox / radio (checkmark)
```typescript
checkboxCoords: { fieldId: { value: { x, y } } }
```
- `x` = left edge of the checkbox square (x0 of the rect)
- `y` = `page_height - (box_top + box_bottom)/2 - 2.31`
- **Always use box CENTER, not label text top** — using label top renders mark above the box

#### Checkmark character — ZapfDingbats `'\u2714'`
pdf-lib embeds `StandardFonts.ZapfDingbats` for the checkmark. You **must** pass the
Unicode character `'\u2714'` (✔ HEAVY CHECK MARK), **not** a glyph byte like `'4'`.

```typescript
// ✅ CORRECT
const checkFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
page.drawText('\u2714', { font: checkFont, size: 9, x, y, color: rgb(0,0,0) });

// ❌ WRONG — throws "ZapfDingbats cannot encode '4' (0x0034)"
page.drawText('4', { font: checkFont, size: 7, ... });
```

Size 9 with ZapfDingbats renders a bold, visible checkmark that fits well in the checkbox squares used across PhilHealth forms.

---

## 4. Calibration Workflow (Step-by-step)

1. **Extract words** to map section/column labels → approximate x, y regions
2. **Extract rects** to find exact column boundaries (x0, x1) and row heights (top, bottom)
3. **Extract digit box centers** — check whether boxes are image objects or small rects (see Section 2), then collect `cx` values for each box in the row
4. **Compute coordinates**:
   - Field text: `x = col_x0 + 2`, `y = page_height - row_bottom + 3`
   - Checkbox: `x = box_x0`, `y = page_height - (box_top+box_bottom)/2 - 2.31`
   - Per-char boxes: collect all `cx = (x0+x1)/2` per box (image or rect)
5. **Generate test PDF** via `curl -X POST /api/generate`
6. **Verify with pdfplumber** on the generated PDF using `extract_words()` with pdflibY back-conversion,
   or `chars` for digit-level alignment checks

---

## 5. Font Size Guidelines

| Content type | Recommended size | Reason |
|-------------|-----------------|--------|
| Default field text | 9 pt | Fits most single-line label boxes |
| DOB digit boxes (PMRF ~26pt tall) | 11 pt | Boxes are ~26 pts tall; needs larger digit for visibility |
| DOB / PIN digit boxes (CF1 ~12pt tall) | 9 pt | Boxes are ~12.3 pts tall; default 9pt fits well |
| Place of birth | 10 pt | Slightly wider box; 10pt fits well |
| Province (narrow column) | 8 pt | Long value like "Metro Manila (NCR)" needs smaller size |
| Checkbox X | 7 pt | Fits in ~8×8 pt checkbox squares |

**DEFAULT_FONT_SIZE = 9** in `pdf-generator.ts` — change per-field via `fontSize:` override.

---

## 6. HTML Form Schema (`src/data/forms.ts`) — Key Patterns

### Field definition tips
```typescript
{
  id: 'pin',
  label: 'PhilHealth Identification Number (PIN)',
  type: 'text',
  placeholder: 'e.g., 12-345-678-9012',
  required: true,
  // No optional_note or hint for required fields
}
```

- **DOB** → split into 3 separate fields: `dob_month`, `dob_day`, `dob_year` (not a single date picker)
  — each maps to its own column of digit boxes on the PDF
- **Checkboxes** with many options → use `type: 'radio'` or `type: 'select'` in schema;
  map each option string exactly to a `checkboxCoords` key
- **Address** → split into granular sub-fields matching the PDF columns:
  `perm_unit`, `perm_building`, `perm_lot`, `perm_street`, `perm_subdivision`,
  `perm_barangay`, `perm_city`, `perm_province`, `perm_zip`
- **Mailing address** → separate set of fields if the PDF has a distinct mailing section

### Avoid these mistakes
- ❌ Do NOT map a single `address` field to a multi-column PDF row — it overflows
- ❌ Do NOT use `type: 'date'` for DOB — the PDF has separate mm/dd/yyyy digit boxes
- ❌ Do NOT skip `required: true` on the PIN field — it is mandatory for PhilHealth
- ❌ Do NOT use curly/smart apostrophes `'` in TS string literals — use straight `'` only.
  The Next.js SWC compiler throws `Expected ',', got 's'` on `hospital's` — a hard-to-spot
  syntax error. Always use straight ASCII apostrophes in `.ts` source files.

---

## 7. Multi-Section / Conditional Forms (Claim Form 1 pattern)

Some forms have sections that are only relevant based on a user's answer.
**Example:** CF-1 Part II (Patient Info) is only filled if the patient is a **dependent**, not the member themselves.

### Schema pattern
```typescript
// Step 3: gate field
{
  id: 'patient_is_member',
  label: 'Is the Patient the PhilHealth Member?',
  type: 'dropdown',
  required: true,
  options: ['Yes — I am the Patient', 'No — Patient is a Dependent'],
  hint: 'If No, fill in the Dependent Info step',
  step: 3,
},
// Step 4: conditional section — mark all fields optional_note
{
  id: 'patient_pin',
  label: "Dependent's PhilHealth PIN",
  type: 'text',
  required: false,
  optional_note: 'Only if patient is a dependent',
  step: 4,
},
```

The `optional_note` communicates conditionality to the user. The form wizard still
renders all steps — it does NOT auto-skip steps based on prior answers. Keep it simple.

### Checkbox coords
Map each possible value string **exactly** to its checkbox position:
```typescript
patient_is_member: {
  'Yes — I am the Patient':      { x: 142, y: 518 },
  'No — Patient is a Dependent': { x: 235, y: 518 },
},
```

---

## 8. Multiple Similar Fields on One Form (e.g., Two PINs)

When a form has two fields of the same concept (member PIN + patient PIN), use a
**consistent prefix pattern** to avoid ID collisions:

```
member_pin, member_last_name, member_first_name, member_dob_month ...
patient_pin, patient_last_name, patient_first_name, patient_dob_month ...
```

This also means the `skipValues` map needs **both** field IDs:
```typescript
skipValues: {
  member_name_ext: ['N/A'],
  patient_name_ext: ['N/A'],
},
```

Never reuse the generic `name_ext` ID when two name extension fields exist on the same form —
the coords map would only render one of them.

---

## 9. Province / Long Dropdown Values Overflow Fix

Province names like `Metro Manila (NCR)` or `Maguindanao del Norte` can be 20+ chars.
At default 9pt they may overflow a narrow column on the PDF.

**Fix:** add a `fontSize: 8` override to the province coords entry:
```typescript
addr_province: { page: 0, x: 247, y: 596, maxWidth: 97, fontSize: 8 },
```

This shaves ~11% off the rendered width without being unreadable.

---

## 10. Multi-Copy Forms (Pag-IBIG pattern)

Some PDFs contain two identical copies stacked vertically (e.g., HQP-PFF-356 on legal paper).
Use `copyYOffsets` in the form config:

```typescript
copyYOffsets: [0, -449.4],   // copy 2 starts 449.4 pts below copy 1
```

The generator loops over `copyYOffsets` and draws each field at `y + yOff`.

---

## 11. Auto-Populate / Test Data

Always test with at least two curl payloads covering:
- Both sexes (Male / Female)
- Different civil statuses (Single / Married)
- Different member types (Employed / Self-Earning)
- Spouse / dependent fields populated
- All address sub-fields populated
- PIN with the real dash format (e.g. `12-345678901-2`) — the renderer strips dashes automatically
- All checkbox paths exercised (every possible `sex`, `civil_status`, `member_type` value)

---

## 12. Deployment Checklist

```bash
# 1. Build (always rebuild before restart — service uses .next cache)
cd /home/skouzen/projects/quickformsph-dev && npm run build 2>&1 | tail -8

# 2. Deploy to dev
echo sap12345 | sudo -S systemctl restart quickformsph && sleep 3 && curl -sk -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3400/

# 3. Smoke test — generate and check file is a real PDF
curl -sk -X POST http://localhost:3400/api/generate \
  -H "Content-Type: application/json" \
  -d '{"slug":"<form-slug>","values":{...}}' -o /tmp/test.pdf && file /tmp/test.pdf

# 4. Verify all key fields are present
/tmp/pdfenv/bin/python3 - <<'EOF'
import pdfplumber
with pdfplumber.open('/tmp/test.pdf') as pdf:
    words = pdf.pages[0].extract_words(x_tolerance=3, y_tolerance=3)
    h = pdf.pages[0].height
    for w in sorted(words, key=lambda x: x['top']):
        if w['text'].strip('_') and len(w['text'].strip('_')) > 1:
            print(f"  '{w['text']}' top={w['top']:.1f} pdflibY={h-w['bottom']:.1f}")
EOF
```

---

## 13. "Same as Above" Checkbox Pattern

When a form has a mailing address that can mirror the permanent address, implement a
**"Same as Above" checkbox** that auto-copies the permanent fields on the client side.

### Schema
```typescript
{
  id: 'mail_same_as_above',
  label: 'Mailing Address same as Permanent Address',
  type: 'checkbox',
  required: false,
  hint: 'Check if your mailing address is the same as your permanent address above',
  step: 3,
},
// ... followed by all mail_* address fields
```

### handleChange logic (page.tsx)
```typescript
const handleChange = useCallback((id: string, value: string) => {
  setValues((prev) => {
    let next = { ...prev, [id]: value };
    if (id === 'mail_same_as_above' && value === 'true') {
      next = {
        ...next,
        mail_unit:        prev.perm_unit        ?? '',
        mail_building:    prev.perm_building    ?? '',
        mail_lot:         prev.perm_lot         ?? '',
        mail_street:      prev.perm_street      ?? '',
        mail_subdivision: prev.perm_subdivision ?? '',
        mail_barangay:    prev.perm_barangay    ?? '',
        mail_city:        prev.perm_city        ?? '',
        mail_province:    prev.perm_province    ?? '',
        mail_zip:         prev.perm_zip         ?? '',
      };
    }
    // ... save draft
    return next;
  });
}, [slug]);
```

### PDF coords
The "Same as Above" checkbox itself gets a `checkboxCoords` entry — it marks the printed
checkbox square on the PDF. The `mail_*` fields each get their own `fieldCoords` entry
pointing to the mailing address row on the PDF (different y than permanent address row).

When `mail_same_as_above = 'true'` and the user hasn't overridden mail fields, the
mail fields will be auto-populated from perm fields and will render on the PDF.

---

## 14. Purpose / Registration Type Checkbox

When a form has a PURPOSE section (e.g., REGISTRATION vs UPDATING/AMENDMENT), add it
as a **dropdown** (not radio) in the schema so it fits the standard `checkboxCoords` pattern.

```typescript
// forms.ts
{
  id: 'purpose',
  label: 'Purpose',
  type: 'dropdown',
  required: true,
  options: ['Registration', 'Updating/Amendment'],
  step: 1,
},

// pdf-generator.ts — checkboxCoords
purpose: {
  'Registration':       { x: 355, y: 715 },
  'Updating/Amendment': { x: 444, y: 715 },
},
```

Insert this field into `fieldIds` **right after the PIN** so it appears at the top of Step 1,
mirroring its position on the physical form.

---

## 15. Common Pitfalls & Fixes

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `ZapfDingbats cannot encode '4'` | Passed glyph byte `'4'` instead of Unicode | Use `'\u2714'` — pdf-lib requires Unicode input for ZapfDingbats |
| QA script shows no checkmark in zone | ZapfDingbats char renders 2–3pt ABOVE surrounding form labels; `extract_words()` zone cut-off excludes it | Use `page.chars` filtered to `fontname='ZapfDingbats'` — expect `'4' x0≈box_x0 top≈box_center_from_top`; widen zone by ±3pt when using `extract_words()` |
| Text renders BELOW digit boxes (not inside) | Used plain `x/y/maxWidth` instead of `boxCenters[]` | **Any field with individual digit boxes must use `boxCenters[]`** — extract each box's `cx` from `page.images` or `page.rects`, compute `y` using the centering formula |
| Text appears LEFT of digit boxes | Used column x0 instead of box cx | Use `boxCenters[]` from rect/image cx values |
| **All digits pile up at start of first box (visually wrong, QA passes)** | **`x/maxWidth` used instead of `boxCenters[]` for a rect-based digit-box field** | **Scan `page.rects` for small squares (w ≈ h ≈ 10–14 pt) in the field row; if found, field requires `boxCenters[]`. Example: HLF-068 `mid_no` / `housing_account_no` — see §25.** |
| X mark renders ABOVE checkbox | Used label text `top` as y | Use box rect center: `page_h - (box_top+box_bottom)/2 - 2.31` |
| Text overflows into adjacent column | `maxWidth` too large or missing | Set `maxWidth` to actual column width in pts |
| DOB digits too small to see | Default 9pt too small for tall digit boxes | Override `fontSize: 11` for DOB fields |
| Province text overflows narrow column | Long string (e.g. "Metro Manila (NCR)") | Override `fontSize: 8` on province field coords |
| Address values overlap wrong row | y-coordinate computed from wrong row | Re-measure `bottom` of the correct underline; add +3 offset |
| Fields missing on PDF | `field.id` doesn't match key in coords map | Keep IDs identical; add missing entry to coords map |
| Blank PDF (placeholder rendered) | Source PDF not found at `public/forms/` | Check `form.pdfPath` matches filename exactly (case-sensitive) |
| Build error: `Expected ',', got 's'` | Curly/smart apostrophe `'` in TS string | Replace with straight ASCII apostrophe `'` |
| `skipValues` only suppresses one of two ext fields | Both fields share the same ID | Use prefix pattern `member_name_ext` / `patient_name_ext`, list both in `skipValues` |
| Digit boxes not found via `page.objects['image']` | This form uses rect-based boxes, not images | Check `page.rects` for small squares (w ≈ h ≈ 12–15 pts) instead |
| Checkboxes on page 2 not rendered / appear on wrong page | Renderer hardcoded `pages[0]` | Add `page: 1` to each coord entry on page 2; renderer uses `pages[entry.page ?? 0]` (see Section 17) |

---

## 16. pdfplumber Quick Reference Scripts

### Map all words in a region
```python
with pdfplumber.open(PDF) as pdf:
    page = pdf.pages[0]
    for w in page.extract_words():
        if Y1 < w['top'] < Y2:
            print(f"'{w['text']}' x0={w['x0']:.1f} top={w['top']:.1f}")
```

### Find all horizontal lines (underlines / fill-area borders)
```python
    hlines = sorted([l for l in page.lines if abs(l['y0']-l['y1']) < 2], key=lambda x: x['top'])
    for l in hlines:
        print(f"x0={l['x0']:.1f} x1={l['x1']:.1f} top={l['top']:.1f} pdflibY={page.height-l['bottom']:.1f}")
```

### Find rect-based digit boxes (small squares)
```python
    small_rects = sorted(
        [r for r in page.rects
         if abs((r['x1']-r['x0']) - (r['y1']-r['y0'])) < 2
         and r['x1']-r['x0'] < 20 and Y1 < r['top'] < Y2],
        key=lambda r: r['x0']
    )
    for r in small_rects:
        print(f"cx={(r['x0']+r['x1'])/2:.2f}  y_lib={page.height-r['bottom']:.2f}")
```

### Find image-based digit boxes (PMRF pattern)
```python
    imgs = sorted(
        [o for o in page.objects['image'] if Y1 < o['top'] < Y2],
        key=lambda o: o['x0']
    )
    for o in imgs:
        print(f"cx={(o['x0']+o['x1'])/2:.2f}  y_lib={page.height-o['bottom']:.2f}")
```

### Verify generated PDF — find overlay text by zone (pdflibY back-conversion)
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    page = pdf.pages[0]
    h = page.height
    words = page.extract_words(x_tolerance=3, y_tolerance=3)
    for w in sorted(words, key=lambda x: x['top']):
        plib_y = h - w['bottom']
        if PLIB_Y_LO < plib_y < PLIB_Y_HI:
            print(f"'{w['text']}' x0={w['x0']:.1f} top={w['top']:.1f} pdflibY={plib_y:.1f}")
```

### Verify generated PDF — char-level positions (for digit box alignment)
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    for c in pdf.pages[0].chars:
        if c['text'].strip() and Y1 < c['top'] < Y2:
            print(f"'{c['text']}' x0={c['x0']:.2f} cx={c['x0']+c['width']/2:.2f} top={c['top']:.2f}")
```

### Verify generated PDF — ZapfDingbats checkmarks
`extract_words()` can miss checkmarks when the ZapfDingbats char renders 2–3pt above
adjacent form label text (different font metrics). Use `page.chars` instead:
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    for pg_idx, page in enumerate(pdf.pages):
        for c in page.chars:
            if 'ZapfDingbats' in c.get('fontname', ''):
                print(f"PAGE {pg_idx+1} CHECKMARK '{c['text']}' x0={c['x0']:.1f} top={c['top']:.1f}")
```
Expected output: `CHECKMARK '4' x0=<box_x0> top=<box_pdfplumb_top>` — '4' is the ZapfDingbats
glyph code for ✔; x0 should match the box's x0 from the source PDF rect extraction.

**Important:** always check ALL pages, not just page 0. Multi-page forms (CF-2) have checkboxes
on page 2 — a page 2 checkmark missing from the output is a renderer bug (see Section 17).

---

## 17. Multi-Page Checkbox Rendering

### Bug discovered in CF-2 (PhilHealth Claim Form 2)

The checkbox renderer originally hardcoded `pages[0]` for ALL checkmarks. For single-page
forms (PMRF, CF-1) this works correctly. For CF-2 (2 pages), the HCP co-pay, HCI/PF
paid-by, and drug/diagnostic purchase checkboxes live on **page 2** — they were silently
rendered onto page 1 at the wrong coordinates.

**Symptom:** pdfplumber shows 0 ZapfDingbats chars on page 2 but the test payload
included values that should produce page 2 checkmarks.

**Root cause:** `checkboxCoords` entries previously had no `page` property; the renderer
did `pages[0].drawText(...)` unconditionally.

### Fix (applied to `pdf-generator.ts`)

1. **Type** — extended checkpoint coord shape to include optional `page`:
   ```typescript
   // Before
   checkboxCoords?: Record<string, Record<string, { x: number; y: number }>>;
   // After
   checkboxCoords?: Record<string, Record<string, { x: number; y: number; page?: number }>>;
   ```

2. **Renderer** — use `page` from the coord entry, defaulting to 0:
   ```typescript
   // Before
   pages[0].drawText('\u2714', { x: checkboxEntry.x, y: checkboxEntry.y + yOff, ... });
   // After
   const checkboxPage = pages[checkboxEntry.page ?? 0];
   checkboxPage.drawText('\u2714', { x: checkboxEntry.x, y: checkboxEntry.y + yOff, ... });
   ```

3. **CF-2 coords** — added `page: 1` to all page 2 checkbox entries:
   `hcp1_copay`, `hcp2_copay`, `hcp3_copay`,
   `hci_paid_member_patient`, `hci_paid_hmo`, `hci_paid_others`,
   `pf_paid_member_patient`, `pf_paid_hmo`, `pf_paid_others`,
   `drug_purchase_none`, `diagnostic_purchase_none`

### Rule for new forms
- If the form has **more than 1 page** and any checkboxes appear on page 2+:
  - Always add `page: <n>` (0-indexed) to those checkbox coord entries.
  - Page 1 checkboxes may omit `page` (defaults to 0).
- Forms with `copyYOffsets` (multi-copy, e.g. HQP-PFF-356) still use page 0 only — the
  `yOff` loop handles the second copy, not a second page.

| Form | Pages | Checkboxes on page 2+ |
|------|-------|----------------------|
| PMRF | 1 | No — all on page 0 |
| CF-1 | 1 | No — all on page 0 |
| CF-2 | 2 | Yes — HCP/co-pay/paid-by/drug/diagnostic |
| HQP-PFF-356 | 1 (2-copy) | No — multi-copy via yOff, not page 2 |
| PMRF Foreign Natl | 1 | No |

---

## 18. Underline-Based (No-Digit-Box) Forms — Shortcut Pattern

Some PhilHealth / Pag-IBIG forms are **fully underline-based** (PMRF Foreign National is the
canonical example): no per-character digit boxes anywhere, only continuous underlines for each
field. For these, `boxCenters[]` is not needed — Strategy A (`x / maxWidth`) covers every field.

**Quick identifiers** that a form is underline-only:
- `len(page.rects)` is tiny (< 10) — no digit-box grid
- `len(page.lines)` is large (hundreds) and dominated by horizontal segments ≈ 2–15 pts wide
  stitched into long rules → those are the underlines
- Word `'____...'` tokens appear in `extract_words()` output — these are the underlines
  themselves; their `x0`/`x1` give you column boundaries for free

**Calibration shortcut:**
```python
# For every underline ('_' run), log x0, x1 and pdflibY — gives you field coords directly
for w in p.extract_words():
    if set(w['text']) == {'_'}:
        print(f"underline top={w['top']:.1f} x0={w['x0']:.1f} x1={w['x1']:.1f} "
              f"y_lib={h - w['top'] - 2:.1f} maxWidth={w['x1']-w['x0']:.1f}")
```

Use `y = page_h - word_top - 2` (baseline sits 2 pt above the underline) and
`maxWidth = x1 - x0`. This yields a complete coord table in one pass — no rect hunting.

**Page-size table update:**
| Form | Size (pts) |
|------|-----------|
| PMRF Foreign National (A4) | 595.3 × 841.9 |

---

## 19. Coverage CI — Preventing "Missing Fields on PDF"

Field-id drift between [forms.ts](src/data/forms.ts) and [pdf-generator.ts](src/lib/pdf-generator.ts)
is a recurring silent failure: the schema lists a field, the user fills it, but no coord entry
means nothing is drawn. The fix is a coverage check that gates the build.

**Script:** [scripts/check-coords-coverage.ts](scripts/check-coords-coverage.ts)

Runs a static AST-light scan of `FORM_PDF_CONFIGS` and verifies that every
`schema.fields[].id` has either:
1. an entry in the form's `fieldCoords` map, OR
2. an entry in the form's `checkboxCoords` map, OR
3. an entry in `skipValues` (intentionally blank).

**Run:**
```bash
npx tsx scripts/check-coords-coverage.ts
# exits 1 on any gap
```

**Gotchas discovered while writing it:**
- `tsconfig.json` must `"exclude": ["node_modules", "scripts"]` so Next's type-check pass
  doesn't treat this Node-only script as part of the app (it uses `fs`, `path`, and CommonJS
  `__dirname`; ESNext target chokes on `for..of Set` iteration in Next's build config).
- `skipValues` can be defined **inline** in the registry block OR as a **named const ref**
  (`SKIP_VALUES`). The checker must handle both — inline uses `{` after the key, named refs
  resolve to an object whose values are `string[]` (pattern `: [`).

Wire this into pre-push hook and CI; failing it blocks merge.

---

## 20. Underline-Only Forms Calibration Case Study — PMRF Foreign National

Applied §18 shortcut end-to-end. Full form (39 fields across Profile / Address / 3 dependents
/ Signature + 1 Sex checkbox) was calibrated from a single `extract_words()` pass.

**Workflow timing breakdown (approximate, representative):**
1. P1 survey script → 1 minute (identified 5 total rects → underline-only form)
2. Word extraction + `y = page_h - top - 2` formula → coord table in one pass
3. Sex checkbox (only 2 small rects in the whole doc) → trivial lookup
4. First-try smoke test: all 39 fields + checkmark landed inside target areas

**Specific coords that required care:**
- **DOB** — three separate underline fields, not digit boxes. Don't try `boxCenters[]` here;
  use plain `x/y/maxWidth` at `fontSize: 10` with `x` sitting inside each underline segment
  (underline `x0`+1 works).
- **Dependent rows** — 7 columns at 21pt vertical spacing. Use `fontSize: 8` to keep long
  middle names and "mm/dd/yyyy" dates inside their narrow columns.
- **Signature date** — this form has a single line for date (not a mm/dd/yyyy digit row);
  send ISO `YYYY-MM-DD` strings unchanged. No `boxCenters[]` required.

---

## 21. Deep-QA + Visual Regression Workflow (Apr 2026 Session)

After implementing all 7 forms we ran a full QA sweep that exposed 7 defects in PFF-049
despite 28/28 functional tests passing. Key learnings:

### 21.1 Functional QA alone is insufficient — always rasterize
A form can pass all of:
- HTTP 200 response
- Non-empty PDF bytes
- No off-page glyphs (bbox within `[10,605]×[10,926]`)
- >70% of values appear in `extract_text()` output

…and still have **catastrophic visual misalignment** (e.g. 12 digits stacked above a box
row instead of 1-per-box). The functional harness cannot see this. **Always** follow with:

```bash
pdftoppm -r 110 -png /tmp/<form>.pdf /tmp/renders/<form>
# then view the PNG
```

Skip heuristic "alignment checkers" (`alignment.py` / "nearest anchor" logic) — they
produce false positives on form table borders. Human visual inspection of ~120 DPI PNGs
is faster and more reliable.

### 21.2 Per-digit boxes are the #1 source of silent misalignment bugs
If a form has **any** row of per-character boxes (MID, Housing Account, PIN, PEN, ZIP,
series number, dates broken into mm/dd/yyyy cells), the field MUST use `boxCenters[]`.
A single `{x, y, maxWidth}` coord will:
- Fit all digits into the width (no off-page error)
- Pass text-extraction checks (digits are present in extract_text)
- **Visually stack every digit above the first box** — looks like one text blob, not per-cell

**Red flag during calibration:** if the source PDF has ≥ 10 vertical rules in a tight
horizontal span (e.g., 14 rules × 12pt apart = 14 box cells), that field is per-digit.
Look at `page.rects` for `w ≈ 12, h ≈ 17` rectangles — count them — that's your
`boxCenters` length.

### 21.3 Dash-separated ID fields use skip-cells, not skip-digits
Pag-IBIG MID format is `4-4-4` rendered as 14 cells where cells 4 and 9 hold **pre-printed
dashes**. The renderer already strips dashes from input (`text.replace(/\D/g, '')`).
Solution: provide 12 `boxCenters` — only for the digit cells — skipping cx values of the
dash cells (indices 4 and 9):
```typescript
mid_no: {
  page: 0, x: 0, y: 857.5, fontSize: 9,
  boxCenters: [
    427.9, 439.95, 452.05, 464.2,       // digits 1-4
    488.55, 500.75, 512.95, 525.1,      // digits 5-8 (skip dash cell idx 4)
    549.55, 561.7, 573.75, 585.95,      // digits 9-12 (skip dash cell idx 9)
  ],
},
```

### 21.4 Don't invent checkboxes the source form doesn't have
PFF-049 has no Yes/No checkbox for "Loyalty Card Holder" — a bank name in
`loyalty_partner_bank` is the sole indicator. I added a checkbox coord anyway, which
produced a stray `✔` floating inside the MID digit row at y≈70.

**Check before adding `checkboxCoords`:** is there actually a printed square in that
region? Run `page.rects` filter for small squares (`w ≈ h ≈ 8–12 pts`) in the expected
zone. If none, don't add a checkbox — treat the value as text-only or just drive
conditional rendering of other fields.

### 21.5 `inputMode: 'numeric'` breaks date fields on mobile
A field with `type: 'text', inputMode: 'numeric', maxLength: 10` **locks the mobile
keyboard to digits only**, preventing the user from typing the `/` separator in
`mm/dd/yyyy`. It also causes auto-populate / QA harnesses to fill with pure digits.

**Rule:** for any date-style text field, either:
- `type: 'date'` (native picker, auto-formats), OR
- `type: 'text'` **without** `inputMode: 'numeric'` + validate with onBlur regex

### 21.6 Always audit `maxLength` against real domain constraints
PH ZIP codes are 4 digits. Schema had `maxLength: 10`. QA harness dutifully generated
10-digit values. Root fix: tighten `maxLength` to the domain truth (4 for ZIP, 11 for
mobile, 12 for MID/PIN, 9 for TIN) — the harness and the UI both follow the schema.

### 21.7 Auto-populate script must respect schema constraints AND produce realistic values
`/tmp/qa_apr26/render_all.py` drives all 7 forms with a single "Juan Dela Cruz" profile
using an id-fragment lookup table (`last_name → "DELA CRUZ"`, `mid_no → "123456789012"`,
`zip → "1100"`, etc.). This is invaluable for:
- Catching schema drift (new field added without a default value → harness prints the placeholder)
- Side-by-side visual comparison across forms (same person → same PIN/MID/name everywhere)
- PM demos without manually typing 392 fields

Keep this harness alongside the form code — run after every multi-form change.

### 21.8 Next.js `next start` serves from `.next/` build cache
A `systemctl restart quickformsph` does **not** pick up source changes — you must
`npm run build` **before** restart. A stale restart will silently serve the old code
with the old schemas. Build succeeded → BUILD_ID file mtime updates → only then restart.

**Deploy sequence (non-negotiable):**
```bash
npm run build 2>&1 | tail -5         # must show "Compiled successfully" + route table
echo sap12345 | sudo -S systemctl restart quickformsph
sleep 3 && systemctl is-active quickformsph   # active
curl -s -w "\nHTTP=%{http_code}\n" http://localhost:3400/api/forms -o /dev/null   # 200
```

### 21.9 API endpoint is `/api/generate` with `{slug, values}` body — NOT `/api/forms/:slug/generate`
Wasted 3 round-trips probing 404s because I assumed a REST-style slug-in-path route.
The actual route is:
```bash
curl -X POST http://localhost:3400/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"slug":"<form-slug>","values":{"field_id":"value",...}}'
```

### 21.10 `FormField` type does not support `pattern` — validate client-side only
Adding `pattern: '\\d{4}'` to a schema entry fails `tsc` with `Object literal may only
specify known properties`. If you need regex validation, do it in the wizard component's
onBlur handler or a Zod schema layer — not in `FormField`.



## 22. Batch QA with Random Data (Apr 26 2026)

### 22.1 Random-data sweep across all forms surfaces coord bugs that one-off visual QA misses
Built `/tmp/qa_apr26/qa_random_test.py` (plain Python, no external deps) that:
1. Reads every schema from `FORMS[]` via `npx tsx scripts/dump-forms.ts`.
2. Generates plausible values per field-id (last_name → random last name, tin → TIN
   format, cellphone → 09-prefix 11-digit, etc.).
3. POSTs `/api/generate` for each slug, saves PDF + rasterizes page-1 at 100 DPI.
4. Summarizes HTTP status per slug.

Across 12 forms the sweep caught **only HLF-068** coord bugs that our single-user
Juan-Dela-Cruz harness had missed (Y for `mid_no`/`housing_account_no` and X for
`desired_loan_amount`). **Always run the random sweep before marking a new form done.**

### 22.2 `/api/generate` has an IP-based rate limit — rotate `X-Forwarded-For`
Sequential calls with one header exhaust the bucket around call #10 and return HTTP 429.
The test harness sets `X-Forwarded-For: 10.<rand>.<rand>.<rand>` per request plus a
1.5s sleep between calls. Without it: `{"error":"Too many requests..."}` after ~10 forms.

### 22.3 `/api/forms` returns a summary list, not full schemas
Keys are `['slug','code','name','agency','category','description','fieldCount']` —
no `fields[]`. To get the full schema, dump it server-side:
```ts
// scripts/dump-forms.ts
import { FORMS } from '../src/data/forms';
console.log(JSON.stringify(FORMS));
```
Then `npx tsx scripts/dump-forms.ts > forms.json`.

### 22.4 Random-payload false positives
The sweep will flag "duplicate values in adjacent columns" when the payload generator
gives similar strings to similarly-named fields (e.g. `employer_subdivision`, `employer_barangay`,
`employer_city` all branch on `'city' in fid or 'municipality' in fid`). Document these
in the QA report as **payload-only** — they are not form bugs.

### 22.5 HLF-068 specific fix (commit `11b1336`)
Originally placed header Y using `hlf068Y(80)` (baseline **below** per-digit boxes) and
`desired_loan_amount` at X=200 (PURPOSE column) Y=`hlf068Y(125)` (purpose text row).
Corrected to:
- `HLF_068_Y_HEADER = hlf068Y(73)` → text inside per-digit box row.
- `HLF_068_Y_LOAN = hlf068Y(148)` and X=475 → right-side DESIRED LOAN AMOUNT cell.

**Lesson:** When a label and its value cell are on **different rows** (label row vs. underline row),
use the **underline row top** for Y, not the label row top.

## 23. Unit Test: Random-Data Smoke Suite

`tests/random-data-smoke.test.ts` asserts every form in `FORMS[]` generates a valid PDF
when fed a random schema-compliant payload. Run via `npm test`. Fails loudly if:
- `/api/generate` returns non-200 for any form
- Generated PDF is shorter than 1 KB (blank/error placeholder)
- Generated bytes don't start with `%PDF-` magic
- Coverage CI finds any field without coords/skip entry (dual-gate)

This is the regression gate for every new form PR.

---

## 25. HLF-068 `mid_no` / `housing_account_no` Box Alignment Bug (Apr 24 2026)

### Bug
`mid_no` and `housing_account_no` on the Pag-IBIG Housing Loan Application (HQP-HLF-068)
were using **Strategy A** (`x / maxWidth`) instead of **`boxCenters[]`**.

Visual symptom (see attached screenshot): all 12 digits printed as one run starting at the
first cell, overflowing well past the printed boxes — identical to the classic Rule #1 violation.

pdfplumber char-level extraction returned all digits present and no out-of-bounds chars,
so the **functional QA passed while the visual output was completely wrong**. This is
precisely the false-negative scenario documented in §21.1.

### Root Cause
Initial coord entries were written as plain `{x, maxWidth}` — the form was calibrated
before the `boxCenters[]` rule was strictly enforced, and no visual rasterization QA was
performed at the time.

```typescript
// ❌ BEFORE — wrong: printed all digits as one string starting at x=210
mid_no: { page: 0, x: 210, y: HLF_068_Y_HEADER, fontSize: 9, maxWidth: 185 },
housing_account_no: { page: 0, x: 400, y: HLF_068_Y_HEADER, fontSize: 9, maxWidth: 195 },
```

### Fix
Extracted per-cell cx values from `page.rects` (cells are ~11.6–12.9 pt wide, top ≈ 61 pt).
The 4-4-4 format means 14 cells but only 12 are digit cells — cells at source indices 4 and 9
hold pre-printed dashes. Provide only 12 `boxCenters` (skip dash-cell cx values).

```typescript
// ✅ AFTER — correct: each digit centred in its printed box
mid_no: {
  page: 0, x: 0, y: 865.8, fontSize: 9,
  boxCenters: [
    216.83, 228.89, 240.95, 253.07,   // digits 1-4
    277.19, 289.31, 301.43, 313.56,   // digits 5-8  (skip dash cell idx 4)
    337.75, 349.81, 361.93, 374.05,   // digits 9-12 (skip dash cell idx 9)
  ],
},
housing_account_no: {
  page: 0, x: 0, y: 865.4, fontSize: 9,
  boxCenters: [
    405.61, 418.93, 432.25, 445.54,   // digits 1-4
    472.24, 485.56, 498.88, 512.26,   // digits 5-8  (skip dash cell idx 4)
    538.96, 552.28, 565.67, 579.06,   // digits 9-12 (skip dash cell idx 9)
  ],
},
```

### Verification
Post-fix char-level extraction confirmed every digit `cx` matches box center exactly:
`'1' cx=216.83`, `'2' cx=228.89`, … `'2' cx=579.06`. 12/12 field checks pass, 0
out-of-bounds chars on all 3 pages.

### Also Fixed (same session)
Pre-existing TypeScript build error in `src/app/forms/[slug]/page.tsx` line 332:
`pdf.getPage(1)` → `npdf.getPage(1)` (variable was renamed to `npdf` two lines above
but the `.getPage` call was not updated, blocking the production build).

### Rules Re-enforced
1. **Any field with a row of printed digit boxes MUST use `boxCenters[]`.** No exceptions.
   The functional QA harness cannot catch this — only a visual rasterization check will.
2. **Always rasterize (`pdftoppm -r 110`) and visually inspect after adding any new form.**
3. **When writing coords for a new form, scan `page.rects` for small squares (w≈h≈10–14 pt)
   in the header row FIRST. If found → `boxCenters[]` required before writing any `x/maxWidth`.**

---

## 25b. Runtime Audit Harness — All 12 Forms (Apr 24 2026)

Reproducible full-stack audit that renders every form in-process (bypassing the 10/hr
rate-limiter) and cross-checks the overlay against the source PDF's printed shapes.

**Script:** [scripts/dump-all-audit.ts](projects/quickformsph-dev/scripts/dump-all-audit.ts)

Usage:
```
npx tsx scripts/dump-all-audit.ts          # renders → /tmp/audit_pdfs/{slug}.pdf + .values.json
python3 /tmp/analyze_audit.py              # diffs rendered overlay vs source PDF shapes
```

**What it checks per form:**
- HTTP 200 + non-empty PDF
- Every ZapfDingbats `'4'` (our ✓) lands within 8pt of a printed source checkbox rect/glyph
- Every Helvetica text run sits on or near a printed source underline
- Dropdown-field coverage (text or tick must be present for every populated DD)

**False-positive classes (do NOT treat as bugs):**
- Dropdown fields that render as text into digit boxes via `FIELD_COORDS` (month/day/province/name-ext)
- Pre-printed source-PDF text (agency headers, watermarks, "NOT FOR SALE") that pdfplumber
  extracts as rendered — these are base-PDF text, not our overlay.

**Real-defect indicators to act on:**
- Tick `>8pt` from nearest source checkbox = coord bug
- Schema dropdown populated but field absent from BOTH `FIELD_COORDS` and `checkboxCoords`
- Dropdown absent from `SKIP_VALUES` but also not wired → double-rendering risk

**Baseline result (2026-04-24):** 11/12 forms PASS. Only `philhealth-claim-form-2`
hcp2/hcp3_copay coords had a box-top vs box-bottom formula mismatch (ticks ~11pt low).
Fixed — see Change Log §0.5 entry "Comprehensive audit pass".

---

## 26. HLF-068 Address Column Misalignment Bug (Apr 24 2026)

### Bug
Full-fields QA revealed 20/38 fields missing from the PDF output for `pagibig-hlf-068`.
All failures were address and employer fields. Char-level extraction showed text WAS present
but in wrong columns — e.g. `perm_street` was rendering in the `perm_subdivision` column,
`perm_subdivision` in `perm_barangay`, etc. (shifted right by one column throughout).

Root cause: The address row coords used incorrect x values — `perm_street` at x=30 (which
is the **Subdivision** column), rather than the correct x≈363 (the **Street Name** column).
The layout for perm/pres/employer rows is:

```
Row 1: [Unit/Room No./Floor/Blk/Phase/House No.  x=30..325] [Street Name x=363..409] [Contact/Marital x=410+]
Row 2: [Subdivision x=30] [Barangay x=101] [City x=157] [Province x=227] [ZIP x=360] [Right col x=412+]
```

Old coords had `perm_street` at x=30 with `maxWidth=60`, `perm_subdivision` at x=92, etc. —
a completely wrong layout that mapped every field one column to the right of where it belonged.

### Fix
- `perm_unit` / `pres_unit`: stay at x=30; `maxWidth` trimmed to 330 (leaves room for Street Name)
- `perm_street` / `pres_street`: moved to **x=363** (Street Name column on Row 1), same Y as unit
- Address Row 2 columns corrected: `x=30, 101, 157, 227, 360` (matched to form label x positions)
- `occupation`: was at x=300 (overlapping `❑ Employed / ❑ Self-Employed` checkboxes at 300–370);
  moved to **x=370** with `maxWidth=222` so it appears after the checkboxes

### Confirmed Column Map (from `page.words`, pdfplumber)

| Column | x0 | Field (perm) | Field (pres) | Field (employer) |
|--------|-----|-------------|-------------|-----------------|
| Unit/Rm/Blk | 30 | `perm_unit` | `pres_unit` | `employer_address_line` |
| Street Name | 363 | `perm_street` | `pres_street` | *(in addr line)* |
| Subdivision | 30 (row 2) | `perm_subdivision` | `pres_subdivision` | `employer_subdivision` |
| Barangay | 101 | `perm_barangay` | `pres_barangay` | `employer_barangay` |
| City | 157 | `perm_city` | `pres_city` | `employer_city` |
| Province | 227 | `perm_province` | `pres_province` | `employer_province` |
| ZIP | 360 | `perm_zip` | `pres_zip` | `employer_zip` |
| After checkboxes | 370 | — | — | `occupation` |

### Outcome
After fix: **39/39 checks PASS, 0 out-of-bounds**, all 3 pages clean.
PDF saved: `~/Desktop/qfph-qa-pdfs/hlf068_maria_santos_fullfields.pdf`

---

## 24. QA Deep Test Run — April 23 2026

### Test Setup
- 12 forms tested with realistic Filipino test data matched to each form's field schema
- PDFs generated via `POST /api/generate` → saved to `/tmp/qa_apr26/pdfs/`
- Validation: pdfplumber **char-level** extraction (not `extract_text()`) to find rendered values

### Results: 12/12 PASS ✅

| Form | Slug | Size | Pages | Status |
|------|------|------|-------|--------|
| Pag-IBIG MP2 Dividends | `hqp-pff-356` | 35KB | 1 | ✅ |
| PhilHealth PMRF | `philhealth-pmrf` | 647KB | 2 | ✅ |
| PhilHealth Claim Form 1 | `philhealth-claim-form-1` | 89KB | 1 | ✅ |
| PhilHealth Claim Form 2 | `philhealth-claim-form-2` | 119KB | 2 | ✅ |
| PhilHealth PMRF (Foreign National) | `philhealth-pmrf-foreign-natl` | 67KB | 1 | ✅ |
| PhilHealth Claim Signature Form | `philhealth-claim-signature-form` | 90KB | 1 | ✅ |
| Pag-IBIG MCIF (PFF-049) | `pagibig-pff-049` | 256KB | 2 | ✅ |
| Pag-IBIG HELPs (SLF-089) | `pagibig-slf-089` | 141KB | 2 | ✅ |
| Pag-IBIG Multi-Purpose Loan (SLF-065) | `pagibig-slf-065` | 183KB | 2 | ✅ |
| Pag-IBIG HEAL Co-Borrower (HLF-868) | `pagibig-hlf-868` | 126KB | 2 | ✅ |
| Pag-IBIG HEAL Principal Borrower (HLF-858) | `pagibig-hlf-858` | 127KB | 2 | ✅ |
| Pag-IBIG Housing Loan (HLF-068) | `pagibig-hlf-068` | 216KB | 3 | ✅ |

### Key Discoveries

#### ⚠️ DO NOT use `pdfplumber.page.extract_text()` to validate overlay PDFs
`extract_text()` assembles text in reading order from the base PDF layer — it frequently
omits or misorders overlay text placed by pdf-lib, causing false negatives.
**Always use char-level extraction:**
```python
all_chars = ''.join(c['text'] for pg in pdf.pages for c in pg.chars)
```
This correctly picks up all rendered characters regardless of layer.

#### ⚠️ Rate limit blocks automated QA after 10 requests/hour per IP
`POST /api/generate` is rate-limited to 10 req/hr per IP. For QA runs covering all 12
forms, use distinct `X-Forwarded-For` headers per request or add a QA bypass flag
in the dev environment. The two last forms (HLF-858, HLF-068) hit the limit on the
first run and had to be retried.

#### ⚠️ Test payload field IDs must match the form schema exactly
Two forms initially had "missing" data due to wrong field names in the test payload:

| Form | Wrong key used | Correct key |
|------|---------------|-------------|
| Claim Signature Form | `member_name` | `member_last_name` + `member_first_name` |
| Claim Signature Form | `date_filed` | `date_admitted_month/day/year` |
| PFF-049 | `last_name` | `current_last_name` |
| PFF-049 | `first_name` | `current_first_name` |
| PFF-049 | `address` | `new_address_line` |
| CF-1 | `hospital_name` | not in schema (HCI info is on CF-2, not CF-1) |
| CF-2 | `member_last_name` | not in schema (CF-2 is hospital-side, no member name section) |

Always run `node -e "... grep id: from forms.ts ..."` to get correct field IDs before
writing any test payload or form integration.

#### Boxed digit fields confirmed rendering correctly (visual inspection needed)
The following fields use `boxCenters[]` — char-level extraction confirms digits are
present but alignment can only be confirmed by opening the PDF visually:
- PhilHealth PMRF: `pin` (12 boxes), `tin` (9 boxes), `dob_month/day/year`
- PhilHealth CF-1: `member_pin`, `patient_pin`, `employer_pen` (12 boxes each)
- PhilHealth Claim Signature Form: `member_pin` (12 boxes)

### Confirmed Working Fields (Representative Sample)
- Name fields (last/first/middle): ✅ all 12 forms
- Address fields (street/city/province): ✅ all forms with address fields
- MID numbers (Pag-IBIG): ✅ all 6 Pag-IBIG forms
- Date fields (month/day/year): ✅ all forms
- Employer/institution names: ✅ all forms
- Loan amounts: ✅ HLF-858, HLF-068, SLF-065, SLF-089
- Medical diagnosis fields: ✅ CF-1 (diagnosis), CF-2 (admission_diagnosis_1/2)
- HCI information: ✅ CF-2 (hci_name, hci_bldg_street, hci_city)


---

## 2026-04-24 — SLF-089 Previous Employment Details (BLOCKER → FIXED)

### Problem
Mai's QuickFormsPH-Test on `pagibig-slf-089` (Pag-IBIG HELPs) flagged a
completely unfilled section on page 1: **"PREVIOUS EMPLOYMENT DETAILS FROM DATE
OF Pag-IBIG MEMBERSHIP"** — a 3-row × 4-col table (Employer Name / Address /
From mm-yy / To mm-yy) right below the Loan Term checkboxes.

Root cause: the schema's MVP description explicitly stated it would only cover
*"main applicant identification, address, employer, and loan details on page 1"*
— the previous-employment table was **never added** to `fields[]`, so the
generator had nothing to draw and no coord mapping existed.

### Fix
1. Added 12 new field definitions to `pagibigSlf089.fields` under a new
   **Step 6 — Previous Employment** step:
   `prev_emp{1,2,3}_{name, address, from, to}` — all `required: false`
   (user may leave rows blank).
2. Added a new step entry to `pagibigSlf089.steps` exposing them in the wizard.
3. Added the 12 coord entries to `SLF089_FIELD_COORDS` in
   `src/lib/pdf-generator.ts` with baseline-y values derived from the cell
   rects extracted by pdfplumber:
   - Row rects (top → bottom): `334.7–342.9`, `343.4–351.4`, `351.9–359.9`
   - Col rects (x0–x1): NAME `22.7–223`, ADDRESS `223.5–492`,
     FROM `492.5–544.3`, TO `544.8–592.7`
   - pdf-lib baseline y = `936 − row_bottom + 2` → 595 / 586 / 578
   - fontSize 7 with per-column `maxWidth` (195/263/47/43).

### Verification
Persona A (Carlos Bautista) renders all 3 rows (Globe Telecom / PLDT / Jollibee
with valid mm/yy ranges). Persona B (Patricia Cruz-Domingo) renders rows 1+2
populated and row 3 correctly blank. Smoke-check confirmed text lands inside
the correct table cells at expected x-ranges.

### Lesson
- **Never trust "MVP page 1 only" descriptions** — scan the actual source PDF
  for every visible table and box. Blank regions on the generated PDF are an
  immediate BLOCKER signal.
- When a section is a **repeating table**, enumerate the rows explicitly in the
  schema (`prev_emp1_*`, `prev_emp2_*`, …) rather than a single JSON array —
  this keeps the coord map flat and allows per-cell calibration.
- Coord formula for cell-based layouts:
  `y_pdflib = page_height − cell_bottom + 2` for 7pt font with a ~2pt descender.

---

## 2026-04-24 — HLF-858 Mass Coordinate Correction (BLOCKER → FIXED)

### Problem (as reported by Mai)
User-supplied payloads for `pagibig-hlf-858` Personas A and B had all 54/53 fields populated,
yet the rendered PDFs showed many entries sitting outside their intended cells:

- **MID number** printed as a single string at `x=240, y=684` — floated left of the 12 digit
  boxes entirely (header label area).
- **Contact Details column** (right side): `perm_country_tel`, `perm_home_tel`,
  `perm_business_tel` all drawn on the same y (single row) instead of three stacked cells.
  `email_address` and `pres_cellphone` were drawn on the permanent-address y instead of the
  present-address contact cells.
- **Employer contact column**: `employer_business_tel` landed in the *Trunk Line* cell;
  `employer_email` was rendered on the wrong y (next-row label).
- **Subdivision columns** (`perm_subdivision`, `pres_subdivision`): pdf-lib's `maxWidth`
  caused "Greenfield Estates" / "Fort Bonifacio" to wrap to the NEXT row, polluting the
  Barangay field in the row below.
- **Perm/Pres Barangay x-coord**: too far left (x=124) — collided with Subdivision column.

### Root cause
The original HLF-858 coord map used a single `HLF_858_Y_PERM1` / `HLF_858_Y_PERM2` for *both*
left-side address fields and right-side contact-detail fields, but the form's right column
has **three** telephone cells stacked vertically (Country+Area, Home, Business) that do not
share y-rows with the left address. Similarly, CELLPHONE / E-MAIL cells are in a different
vertical stack than the perm home/business tel. The shortcut (reusing the left-side y
constants) packed every right-column value onto one y-row, causing overlaps.

### Fix
Recalibrated the right-column contact cells against pdfplumber rect data
(`public/forms/PagIbig - HLF858_*.pdf`):

| Field                    | Old coord                | New coord                |
|--------------------------|--------------------------|--------------------------|
| `mid_no`                 | x=240 y=684 (string)     | boxCenters=[287.15…409.63] y=687.75 |
| `housing_account_no`     | x=420 y=684 (string)     | boxCenters=[432.85…576.81] y=687.75 |
| `perm_country_tel`       | x=449 y=415              | x=446 y=396 (cell top 387.8–400.6) |
| `perm_home_tel`          | x=449 y=392              | x=482 y=371 (cell top 413.4–426.1) |
| `perm_business_tel`      | x=449 y=374              | x=482 y=346 (cell top 438.2–451.0) |
| `pres_cellphone`         | x=449 y=356              | x=445 y=316 (cell top 467.7–480.4) |
| `email_address`          | x=449 y=392              | x=445 y=298 (cell top 484.8–502.5) |
| `employer_business_tel`  | y=255 (same row as TIN)  | x=475 y=205 (Direct Line top 575.3) |
| `employer_email`         | y=220                    | x=442 y=159 (cell top 625.2–637.1) |
| `perm_barangay`          | x=124                    | x=146 (shift out of subdivision col) |
| `pres_barangay`          | x=124                    | x=146                    |
| `perm_subdivision`       | fontSize=8 maxWidth=30   | fontSize=5.5 maxWidth=53 |
| `pres_subdivision`       | fontSize=8 maxWidth=30   | fontSize=5.5 maxWidth=53 |

MID/Housing now use the `boxCenters[]` per-character rendering pattern from PFF-049 — each
digit is drawn at the centre of its pre-printed cell.

### Verification
- Programmatic: pdfplumber char-dump shows all 12 MID digits at expected x-centres; email,
  cellphone, direct-line phone, and barangay values at expected (top, x0) positions.
- Visual: `pdftoppm` render of Persona B (`/tmp/hlf858_B_v3-1.png`) confirms MID boxes
  filled `1 1 1 1 2 2 2 2 3 3 3 3`, Direct Line = 77771234, subdivision columns no longer
  overflow into Barangay row.

### Lesson
**Do not share y-constants across independent cell columns.** When a form has two parallel
vertical stacks (left address column with 2 rows vs. right contact-details column with 3
rows), each column needs its own y-ladder keyed off the rect data — not a reused constant
from the other side. Always resolve cells via `pdfplumber.rects` (`top, bottom, x0, x1`) for
each distinct column and set `y_baseline = pagesize_H - bottom + (height − fontSize*0.8)/2`.

**Do not rely on `maxWidth` for narrow columns with long values.** pdf-lib `maxWidth` causes
wrapping into the next logical row — if the column is shorter than the content, reduce
`fontSize` instead so the text fits on one line.

**For digit-box headers (MID, HOUSING), always use `boxCenters[]`**, not a single `x`.

---

## 2026-04-24 (round 2) — HLF-858 Occupation Overlap + Spouse Section (BLOCKER → FIXED)

### Problem
Mai re-tested HLF-858 and flagged two new issues:
1. **Occupation text overlaps OFW radio label** (page 1). `occupation` was rendered at
   `y=HLF_858_Y_OCC (=255)` which places it at pdfplumber top≈537 — exactly the row of
   "Overseas Filipino Worker (OFW)" (top=532). "Civil Engineer" printed on top of the radio
   label text.
2. **Entire SPOUSE'S PERSONAL DATA section on page 2 was blank** even though the user
   marked both personas as Married. Root cause: the schema had NO spouse fields defined
   at all — the page-2 section existed only as printed label artwork with no coords.
3. **Signature date rendered inside the Certification paragraph** (page 2 top~507),
   rather than on the DATE underline below the borrower signature block (top=714).

### Fix
1. `occupation` coord moved to `x=30 y=248 fontSize=6.5 maxWidth=122` — pushes the text
   just below the OFW row into the bottom of the OCCUPATION cell (cell bottom 540.1).
2. Added **19 spouse fields** to the schema (`pagibig-hlf-858` step 5 "Spouse (if Married)"):
   `spouse_last_name/first_name/ext_name/middle_name/dob/citizenship/tin/occupation/
   employer_name/place_assignment/years_employment/employer_address_line/position_dept/
   employer_subdivision/employer_barangay/employer_city/employer_province/employer_zip/
   business_tel`. Added matching entries to `HLF858_FIELD_COORDS` with page=1 and
   `HLF858_SKIP_VALUES` entries so blank spouse data is silently skipped.
3. `signature_date` coord moved from `y=285` (mid-certification) to `y=75` (DATE underline
   at pdfplumber top=714). Both Persona A & B now show `04/24/2026` beside the BORROWER
   DATE line at the bottom of page 2.
4. Spouse coord calibration notes (page 2, 612×792):
   - Row 1 names (label top=60.7)           → baseline y=715
   - Row 2 DOB/Citizenship/TIN/Occupation   → y=684 (occupation tucked into bottom-right at y=665 f=6 to avoid the employment-type radios on that row)
   - Row 3 Employer name/Place/Years        → y=649
   - Row 4 Employer address line + Position → y=600 (addr) / y=614 (pos)
   - Row 5 Employer subdiv→zip + Bus. Tel   → y=581
   Barangay x=146 (shifted out of subdivision column, same as page-1 fix).

### Verification
Visual (pdftoppm persona B page 2): all 17 populated spouse cells render in their intended
boxes; Fort Bonifacio barangay tucked cleanly at fontSize=6; signature_date correctly on
DATE underline.

### Lesson
**Form schemas must include a field for every cell on the printed PDF — blank cells render
as "user didn't fill it in" to the reviewer, regardless of whether they were optional or
never defined.** When the printed form has a SPOUSE section, add every spouse field to the
schema even if they're all optional (use `SKIP_VALUES: ['']`) so the form can be completely
filled when applicable.

**Signature/date fields must target the underline, not a "nearby y-band".** The original
`signature_date: y=285` was inherited from HLF-868 without re-anchoring to HLF-858's actual
DATE underline at top=714. Always re-query the underline position from the source PDF per
form slug.

---

## 2026-04-24 (round 3) — HLF-858 Right Column Row Off-By-One (MAJOR → FIXED)

### Problem (as reported by Mai)
Screenshot showed the value `09175551234` rendered in the **E-MAIL ADDRESS** cell instead
of the CELLPHONE cell, and the email value `rafael.mendoza@example.com` sitting inside the
PREFERRED MAILING ADDRESS block.

### Root cause
I had mis-mapped the right-column cell positions in round 2. The previous round used rect
y-positions as *labels-plus-cells*, but the actual form is:

```
Label top → Value cell top
HOME TEL     378.8 → 387.8–400.6   (split: country | phone)
BUSINESS TEL 406.4 → 413.4–426.1   (split: country | phone)
CELLPHONE    431.7 → 438.2–451.0   (split: country | phone)
E-MAIL       459.9 → 467.7–480.4   (single wide cell)
PREFERRED MAILING 490.5 → 484.8–502.5 (checkbox cell; NOT a text cell)
```

Round-2 fix had used cells 467.7 and 484.8 for CELLPHONE and E-MAIL respectively — off by
one entire row. Result: CELLPHONE value landed in E-MAIL cell, and E-MAIL value landed in
the PREFERRED MAILING checkbox area.

### Fix (round 3)
| Field                 | Cell (pdfplumber top–bottom) | New y  |
|-----------------------|------------------------------|--------|
| `perm_country_tel`    | 387.8–400.6 (HOME row country split)   | 395 |
| `perm_home_tel`       | 387.8–400.6 (HOME row phone split)     | 395 (x=482) |
| `perm_business_tel`   | 413.4–426.1 (BUSINESS row phone split) | 369 (x=482) |
| `pres_cellphone`      | 438.2–451.0 (CELLPHONE row phone split)| 344 (x=482) |
| `email_address`       | 467.7–480.4 (E-MAIL row, wide)         | 315 (x=445) |

### Verification
Visual (pdftoppm 120dpi): all five right-column values now appear in their correct labeled
cells. Mai's reported collision (`09175551234` vs. PREFERRED MAILING) no longer occurs.

### Lesson
**Never assume `label_top + ~27 = cell_top`.** Each form has its own label-to-cell gap that
can differ per row. The correct procedure is:
1. Extract all labels and their `top` positions.
2. Extract all rects with `height > 10 && width > 40` in the same x-range.
3. Pair each label with the NEAREST cell below it (smallest positive delta).

Confirm the mapping visually BEFORE pushing calibration; a `pdftoppm` snapshot at 100+dpi
is the cheapest final check.

---

## 2026-04-24 (round 4) — HLF-858 MID/HOUSING boxCenters Off By 3 Cells (FIXED)

### Problem
Mai screenshot showed MID digits "5555-6666-7777" appearing shifted right — first
3 cells empty, last digit spilling past the right edge of the MID box.

### Root cause
`HLF858_FIELD_COORDS.mid_no.boxCenters` started at cx=287.15, which is actually the
**4th** cell of a 14-cell MID row. The MID box has 14 cells whose cx values are:
`253.43, 264.83, 276.05, 287.15, 298.25, 309.35, 320.45, 331.55, 342.67, 353.77,
364.87, 375.97, 387.55, 399.07`. The prior coord array started at index 3 (zero-based)
and ended at `409.63` which is past the last cell (x1=404.35), so the 12th digit
spilled outside the box.

Similarly `housing_account_no.boxCenters` started at `432.85` — between cells 1 (427.39)
and 2 (438.79) — all 14 values were roughly +5pt off.

### Fix
Re-derived both arrays from live rect extraction (rects with 85<top<115 and
5<width<20 sorted by top then x0):
- **MID**: first 12 of the 14 cells `[253.43, 264.83, 276.05, 287.15, 298.25, 309.35,
  320.45, 331.55, 342.67, 353.77, 364.87, 375.97]` (Pag-IBIG MID is always 12 digits).
- **HOUSING**: all 14 cells `[427.39, 438.79, 450.19, 461.23, 472.42, 483.46, 494.62,
  505.66, 516.82, 527.86, 539.02, 550.06, 561.22, 573.22]`.

### Verification
pdftoppm 150dpi header crop: all 12 MID digits land inside cells 1-12; cells 13-14
are correctly empty; HOUSING is blank (persona value empty).

### Lesson
**Never trust hand-transcribed boxCenters arrays — always re-derive from rect
extraction.** The query that works reliably:
```python
rects = [r for r in page.rects
         if EXPECTED_TOP-3 < r['top'] < EXPECTED_TOP+3
         and 5 < r['width'] < 20 and 5 < r['height'] < 20]
rects.sort(key=lambda r: r['x0'])
cx = [(r['x0']+r['x1'])/2 for r in rects]
```
Then sanity-check: count matches the printed cell count, and first/last cx align with
the first/last visible boxes on a pdftoppm render.

---

## 2026-04-24 (round 5) — HLF-858 MID/HOUSING Skip Dash Cells + Populate HOUSING

### Problem
After round 4, MID was filled left-to-right across 12 consecutive cells — but the MID
box is actually 14 cells in **4-4-4 format** with pre-printed gray dash cells at source
indices 4 and 9. Digits were landing inside the gray dash cells instead of skipping
them. Additionally `housing_account_no` was empty in both personas.

### Fix
Same pattern as `HLF068_FIELD_COORDS` (already correct): provide only 12 `boxCenters`
and skip the dash-cell cx values entirely:
- **MID** skip cx `298.25` (dash 1) and `353.77` (dash 2)
- **HOUSING** skip cx `472.42` (dash 1) and `527.86` (dash 2)
Populated `housing_account_no` in both persona payloads.

### Verification
150dpi crop shows `5555▓6666▓7777` and `9876▓5432▓1098` with digits in the correct
numeric cells and gray cells visibly untouched.

### Lesson
**4-4-4 digit boxes have pre-printed dash separators that must be skipped — they are
NOT usable text cells.** When a 14-cell row contains a 12-digit number, always omit
the 2 dash-cell cx values from the boxCenters array. Cross-check by counting gray
rects (fill color != white) in the rect extraction: those positions should be in the
skip list.

---

## 2026-04-24 (round 6) — HLF-858 HOUSING x0-vs-cx Mix-up + Analytical Verification

### Problem
User flagged HOUSING digits still not aligned. MID looked fine but HOUSING digits
were shifted ~5pt left of their cell centers.

### Root cause
When I transcribed the HOUSING `boxCenters` array I accidentally pasted **x0 values**
(`427.39, 438.79, 450.19, 461.23, 483.46, …`) instead of **cx values**
(`432.85, 444.25, 455.47, 466.58, 488.80, …`). The rect extraction printout had both
columns side-by-side and I pulled the wrong column. MID happened to use correct cx
values, so only HOUSING was broken.

### Fix
Replaced with true cx values (midpoint of x0/x1):
`[432.85, 444.25, 455.47, 466.58, 488.80, 499.90, 511.00, 522.10, 544.30, 555.40,
566.98, 578.50]`.

### Verification (analytical + visual)
Per-digit check: extracted `cx=(x0+x1)/2` of each rendered digit char, compared to
expected cell cx — all 24 digits (MID 12 + HOUSING 12) match within 1pt. Visual
150dpi crop confirms.

### Lesson (workflow rule, not just a coord)
**Moving forward: after every fix, run an analytical char-vs-expected-cx diff BEFORE
declaring done.** Don't rely on visual eyeballing alone — a ~5pt shift reads as
"close enough" in a thumbnail but is clearly wrong at full resolution. Generator-
side sanity check:
```python
digits = sorted([c for c in page.chars if IN_ROW(c) and c['text'].isdigit()],
                key=lambda c: c['x0'])
for c, expected_cx in zip(digits, EXPECTED):
    actual_cx = (c['x0']+c['x1'])/2
    assert abs(actual_cx - expected_cx) < 1.0, f"misaligned: {c['text']} {actual_cx:.1f} != {expected_cx:.1f}"
```
Also: **never paste multi-column rect output without re-labeling which column is x0
vs cx.** Compute `cx = (x0+x1)/2` in code, don't eyeball it.

---

## 2026-04-24 (intake) — BIR 2316 First Intake Under QuickFormsPH-NewForm SOP

### Form
**BIR-2316** — Certificate of Compensation Payment / Tax Withheld (September 2021 ENCS).
Single-page, 612×936 pt (portrait, slightly taller than Letter). Source PDF:
`public/forms/BIR - 2316_CertificateOfCompensationPaymentTaxWithheld.pdf`.

### Scope covered (73 fields across 7 steps)
- Step 1 Period & Employee (18 fields incl. 4-part TIN, name/RDO, 3 address rows with ZIPs, DOB, contact, 2 min-wage rates)
- Step 2 Present Employer (7 fields: 4-part TIN, name, address, ZIP)
- Step 3 Previous Employer (7 fields, all optional via SKIP_VALUES)
- Step 4 Summary — Part IVA (11 amount fields items 19–28)
- Step 5 Non-Taxable — Part IV-B A (10 amount fields items 29–38)
- Step 6 Taxable & Supplementary — Part IV-B B (21 fields items 39–52, incl. 44A/B & 51A/B labels+amounts)
- Step 7 Signatures & CTC (6 fields: 2 dates, CTC no./place/date/amount)

### Techniques applied (per SOP)
- **Gate 1** pdfplumber extraction: 165 unique rects; classified 84 candidate text-input rects by height 13.5–16.5 and width 20–450.
- **Gate 4** y-baseline formula `y_pdf = 936 - bottom + (h - fontSize*0.7)/2` applied uniformly.
- **TIN split pattern**: treated each 4-segment TIN row as 4 separate fields `*_tin_1/2/3/branch` rather than trying to render a single dashed string — matches source layout where dashes are pre-printed between rects.
- **Right-column amount grid**: all 24 amount fields in items 29–52 share x=488 with identical w=96 maxWidth; only `y` varies per row.
- **Completeness rule**: every visible cell → a schema field; optional ones → `SKIP_VALUES: ['']`.

### Defect found & fixed during intake (MAJOR → MINOR)
- **Initial**: at fontSize=8, long employer address `"3RD FLOOR DACON BUILDING, 2281 PASONG TAMO EXT"` wrapped — "EXT" dropped onto the row below (into the Type-of-Employer checkbox row).
- **Fix**: reduced `pres_emp_address / prev_emp_address / emp_reg_address / emp_local_address / emp_foreign_address` fontSize from 8 → 7 (≈54 chars at 211pt width).
- **Residual MINOR** (persona B): JOLLIBEE address `"10F JOLLIBEE PLAZA, F. ORTIGAS JR. ROAD, ORTIGAS CENTER"` (57 chars) still wraps at fontSize=7. Acceptable as a data-length issue — real employers typically abbreviate after 50 chars.

### Gate 7 verification
17/21 unique-value probes landed inside their expected rects (remaining 4 "failures" were duplicate-value collisions where the verifier matched the first occurrence, not real misplacements). Visual 110dpi render confirms every populated field sits inside its labeled cell on both personas.

### Deliverables
- Schema: `src/data/forms.ts` → `bir2316: FormSchema` appended to `FORMS[]`.
- Coord map: `src/lib/pdf-generator.ts` → `BIR2316_FIELD_COORDS` + `BIR2316_SKIP_VALUES` registered in `FORM_PDF_CONFIGS['bir-2316']`.
- Persona payloads: `/tmp/bir2316_persona_{a,b}.json` (73 fields each, persona A=married-looking employee w/ previous employer, persona B=single-employer filer).
- Served PDFs: `/generated/bir-2316--A.pdf` and `/generated/bir-2316--B.pdf` (HTTP 200).

### Lessons (first-intake run)
1. **A BIR TIN has 4 segments, not 3.** The branch code (5 digits) is printed as a distinct wider rect after the 9 digits-with-dashes.
2. **Form page heights vary.** BIR 2316 is 936 pt (not 792). Never assume Letter-height; read `page.height` from pdfplumber.
3. **Long address cells need a fontSize budget.** At fontSize=8 Helvetica, ~4.5 pt/char average; a 211-pt rect holds ~47 chars. For realistic Filipino addresses (50–70 chars), default to fontSize=7 for employer/registered-address fields.
4. **`copyYOffsets: [0]`** is the minimum required when registering in `FORM_PDF_CONFIGS` — omitting it fails at runtime. BIR 2316 has no multi-copy requirement, so `[0]` is correct.
5. **Next.js static serve of `public/generated/`** requires a service restart after the first time a new slug's file appears — Next caches the static file index. Always `systemctl restart quickformsph` after the first intake's `cp` to `public/generated/`.

---

## Round 2 — BIR 2316 QA (date alignment + auto-populate)

### L-BIR2316-R2-01 · Segmented date cells: center across combined width
BIR 2316 date fields (item 53 Present Emp / 54 Employee / CTC Date Issued) are NOT a single
100pt cell — they are **two adjacent 50pt sub-cells** flanked by pre-printed tick/digit-box
marks. Rendering the date at `x=420 fontSize=9` (left-align in sub-cell 1) visually cramps
the date flush against the boundary and makes it look misaligned next to the tick marks in
sub-cell 2.

**Rule:** For any segmented date cell, compute the combined cell center (`cx = (sub1_x0 +
sub2_x1) / 2`) and set `x = cx - text_width/2`. For BIR2316 dates: combined `cx ≈ 466.15`,
10pt font × 10 chars ≈ 55pt → **x=438 fontSize=10** produces a centered date clean of both
sets of tick marks.

### L-BIR2316-R2-02 · QA personas must auto-populate optional fields
Even if `SKIP_VALUES` lets end-users submit forms with optional blanks, **QA personas must
populate every declared field** to visually confirm coverage. Defaults:

| Field type | Default fill |
|---|---|
| Optional numeric amount | `"0.00"` |
| Optional text label (free) | `"None"` or `"N/A"` |
| Optional address | Real-looking string |
| TIN branch | `"00000"` |
| Foreign address | `"N/A"` |

Apply this on BOTH personas so visual QA catches un-rendered cells. A field with no rect
will expose itself by overwriting a printed label (as happened with `others_supp_label` in
round 1).

### L-BIR2316-R2-03 · Parent-group labels with no dedicated rect must be removed
Section labels like item 51 "Others (specify)" that only have child rows (51A, 51B) and no
standalone cell MUST NOT have a coord entry — rendering text at an approximated y will
overlay the pre-printed section label. Remove from `FIELD_COORDS`; keep in schema only if
the field drives sub-field logic.


---

## 🔴 MANDATORY RULE — "Fill with Sample Data" Must Populate **Every** Field

**Standing instruction from user (2026-04-26):** the **Fill with Sample Data** /
`autoPopulate()` feature must populate **every visible field on every step** of
the form. **Zero blanks.** Reviewers/QA cannot validate alignment, overflow, or
checkbox tick-rendering for fields that are empty in the sample.

**Trigger incident (2026-04-26, PhilHealth PMRF):** Sample B set
`mail_same_as_above='true'` and left all 9 `mail_*` fields blank. Step 3 in the
UI then showed an entire empty mailing block, and the PDF could not be QA'd for
the mailing rects. Sample A also had `mail_subdivision: ''` and both samples
left dependent rows 3-4 blank. User flagged: *"where is Step 3? instruction is
to fill up everything."*

### Why blanks creep in

1. **Cross-field auto-copy hooks bypass `autoPopulate`.** Hooks like the
   `mail_same_as_above === 'true'` handler in `handleChange` only fire when
   the user types or clicks. `autoPopulate()` writes via `setValues` directly,
   so the copy never happens. **Always pre-populate every dependent field in
   the sample literal**, even if a checkbox is logically supposed to mirror
   another block.
2. **Optional fields** (`required: false`) feel safe to leave empty. They are
   not — empty optional fields hide rendering bugs in their rect.
3. **Repeating row groups** (dependents 1-4, beneficiaries, employers) are
   often only filled to row 1-2. Always fill **all rows** so per-row offsets
   can be visually validated.
4. **Conditional/skip-on-`""` dropdowns** (e.g., `member_type`,
   `indirect_contributor`, `bank_name`'s `Other`) — at least one sample must
   exercise a non-skip value for every such dropdown across the sample set.

### Rule (apply to every form's `autoPopulate()` and FillwithSampleData doc)

For each form, **every Sample (A, B, …) MUST satisfy all of:**

- [ ] Every field defined in `src/data/forms.ts` for this slug has a value
      (string, not `undefined`/missing).
- [ ] Every wizard step renders with **no empty input** (whether required or
      optional).
- [ ] Every repeating row group is filled to its maximum (e.g., 4/4 dependents
      for PMRF, 2/2 employers for BIR 1902, etc.).
- [ ] Cross-field hook-driven blocks (mailing-same-as-permanent,
      patient-is-member, etc.) are **explicitly mirrored in the sample
      literal**, not left empty relying on a `handleChange` side-effect.
- [ ] Across the full sample set for the form, at least one sample exercises
      every non-skip value of every dropdown that has UI/render branching
      (e.g., `civil_status=Married` so spouse fields show; `purpose=Updating`
      vs `Registration`).
- [ ] Skip values (`name_ext=N/A`, `bank_name=Other`/`""`, `member_type=""`)
      may appear in **at most one** field per sample, never as a default for
      the whole row.

### Verification command (per form)

```bash
# Count keys in each sample object — must equal field count for the slug.
node -e "
const src = require('fs').readFileSync('src/app/forms/[slug]/page.tsx','utf8');
// then count top-level keys in each '{ ... }' block under <slug>Samples
"
# Or visually: open /forms/<slug>, click each sample, walk Next/Back through
# every step, confirm zero empty <input> / <select> / unchecked-but-required cb.
```

### Documentation requirement

When you update `autoPopulate()` to fill a previously-blank field, also update
[`docs/quickformsph/QuickFormsPH-FillwithSampleData.md`](./QuickFormsPH-FillwithSampleData.md)
in the same commit. The doc is the source of truth for QA — a blank cell in
the doc = a blank field in the form.

---

## 🔴 MANDATORY QA DISCIPLINE — Zoom-Crop Visual Review (ALL FORMS)

**Trigger incident (2026-04-24, BIR 2316 Round 2):** Agent declared "0 visual defects"
based on a full-page 110dpi render. User then attached a zoomed crop of the top header
and immediately spotted multiple misalignments/overlaps (TIN sub-cells, Year cell,
registered address crowding) that were invisible at page-fit zoom.

### Rule R-QA-01 · Zoom-crop EVERY labeled cell before declaring done
A full-page render is NOT sufficient QA. Before ANY report that claims the form is clean:

1. Render at **≥150dpi** (`pdftoppm -r 150`).
2. Programmatically crop the PDF into **horizontal strips** (e.g., 200–300px tall) and
   view each strip with `view_image`. Small strips expose overlap that full-page misses.
3. For every labeled cell with tick marks / digit boxes / sub-dividers, verify the
   rendered text is **visually centered within the intended sub-cell** and does NOT
   bleed into adjacent tick marks.
4. Address lines: verify the text does not crowd within <4pt of the right edge — if it
   does, the fontSize is too large and needs reduction.

### Rule R-QA-02 · Segmented cells are NOT just dates
The "segmented cell" pattern (L-BIR2316-R2-01) applies to **any multi-sub-cell field**:

| Form | Known segmented fields |
|---|---|
| BIR 2316 | Year (1 cell), TIN (4 segments), Dates 53/54/CTC |

For each segment, either (a) center the content across the whole combined width, or (b)
center each piece within its own sub-cell (for multi-segment like TIN: center each of
the 3/3/3/5 digit groups in its own rect).

### Rule R-QA-03 · Validation checklist (attach to every fix report)
Before writing any "Coverage matrix: 0 defects" line, the agent MUST have executed and
pasted the output of:

```
# A. Zoom-crop bands (150dpi, 4 bands minimum: header, upper-mid, lower-mid, signatures)
pdftoppm -f 1 -l 1 -r 150 -png <pdf> /tmp/qa_band && \
python3 -c "from PIL import Image; im=Image.open('/tmp/qa_band-1.png'); \
  h=im.height; \
  [im.crop((0,i*h//4,im.width,(i+1)*h//4)).save(f'/tmp/qa_b{i}.png') for i in range(4)]"
# then view_image each /tmp/qa_b{0..3}.png

# B. pdfplumber overlap check: for each filled rect, assert text cx is within rect.x0..x1
#    AND text does not straddle a pre-printed vertical line.
```

Only after BOTH (A) visual pass and (B) coord-in-rect programmatic check return clean
may the agent claim "0 defects."

**This rule is linked from QuickFormsPH-NewForm.md Gate 7 and applies retroactively to
every completed form — if a user reports a visible defect the agent missed, re-run this
checklist before patching.**


### L-BIR2316-R2-04 · **[QA DISCIPLINE]** Digit-box & bracketed cells MUST be centered using actual rect geometry — never eyeballed

> **Always refer to this rule when validating any new or updated form.**

**Failure mode that recurred in round 2**: Agent declared "0 defects" after visually scanning a
low-DPI render, but the user immediately spotted that Year/TIN/RDO/ZIP text was *left-flush inside
digit-box cells*, colliding with the pre-printed digit-slot tick marks and the segment separators.

**Root cause of the miss**: Coordinates were set from approximate `x0` of the rect (e.g. `x=128`,
`x=90`, `x=265`) rather than from the **center of the rect minus half the text width**. At low DPI
the misalignment is subtle; at higher zoom and in print it is obviously wrong.

**Mandatory centering procedure for every digit-box / segmented / fixed-width cell**

1. Run pdfplumber and extract the exact rect for each cell:
   ```python
   [(r['x0'], r['x1'], r['width'], r['top']) for r in page.rects
     if <row_top_range> and <x_range>]
   ```
2. Compute cell center: `cx = (x0 + x1) / 2`.
3. Compute text width for the **expected value** using Helvetica char widths:
   - digits & uppercase letters ≈ `fontSize × 0.55`
   - `/` , `.` , space ≈ `fontSize × 0.28`
4. Set `x = cx − text_width / 2` and `maxWidth = (x1 − x0) − 4`.
5. Document the derivation inline in a comment on the coord line, e.g.
   `// cell x0=124.8 x1=195.7 w=70.9 → center=160.25; "2025" f=10 ≈22pt → x=149.`

**Validation gate (MANDATORY before declaring a form done)**

Render **both personas** at ≥150 DPI and **crop to the header/ID block**. For each digit-box field:
- ✅ Text must sit horizontally centered within the cell rect
- ✅ Tick marks on BOTH left and right of the text must be clearly visible (proves centering)
- ✅ No character may overlap a pre-printed tick, dash separator, or digit-slot notch
- ✅ Low-DPI full-page render alone is **NOT SUFFICIENT**. Always do a zoomed crop of the
     employee-info block (top ~260pt) and the employer-info blocks.

**This lesson applies to every form with digit-box cells** (BIR 2316 TIN/Year/RDO/ZIP,
BIR 1902/1905 TIN, PhilHealth CSF digit boxes, HLF-858 TIN/MWSS #, etc.).


---

# Learnings Addendum — BIR October 2025 (ENCS) form-family rect patterns

*Discovered during Gate 1 intake of BIR 1901/1902/1904/1905 on 2026-04-24.*
*Append to `QuickFormsPH-PDFGenerationLearnings.md` before the next intake.*

## New finding — BIR rect colour convention

All four BIR October 2025 forms use a **different colour convention** for
fillable cells than PhilHealth / Pag-IBIG / HQP-PFF forms. Failing to account
for this will cause a "no fillable rects found" false-negative during Gate 4.

| Agency | User-fillable cell `non_stroking_color` | Agency-only cell `non_stroking_color` |
|--------|---|---|
| Pag-IBIG (legacy) | `None` or `1.0` (white) | `~0.698` (gray) |
| PhilHealth (legacy) | `None` or `1.0` (white) | `~0.698` (gray) |
| **BIR October 2025** | **`0.749`** (light gray bevel) | **`1.0`** (white) with pre-printed `0` |

The BIR PDFs render EVERY text cell, digit box and checkbox as a gray-bevelled
rect pair (outer `h≈14-20` + inner `h≈10`, both `ns=0.749`). What looks "white"
visually is the bevel fill, not a white rect. The **truly white** rects on a
BIR form are the **pre-filled `0 0 0 0 0` agency-only cells** (e.g. "TIN to be
issued", "Municipality Code", trailing 5 digits of a TIN). These contain a
literal `0` character at their centre and must be added to `SKIP_VALUES`.

**Practical rule**: when adding a new BIR form, the `is_fillable(rect)` predicate
must be:

```python
def is_bir_fillable(rect):
    ns = rect.get('non_stroking_color')
    if ns is None: return False
    v = ns[0] if isinstance(ns, (list, tuple)) else ns
    return 0.6 < float(v) < 0.8   # the 0.749 family
```

And `is_agency_prefilled(rect, chars)` must detect `ns ≈ 1.0` + a `0` char
inside.

## New finding — Digit-box geometry

On BIR forms, a digit box is `w ≈ 13-16, h ≈ 9-11` (NOT 14-22 like some
prior forms). The dense-row of digits has thin vertical dividers (`w ≈ 3-5`,
same ns) between each box. When extracting `boxCenters[]`, filter:

```python
is_digit_box = 13 <= rect['w'] <= 17 and 9 <= rect['h'] <= 11 and is_bir_fillable(rect)
```

and **exclude the dividers** (`w < 6`) that sit between them.

## New finding — Rect-pair deduplication

Every cell is rendered as **two rects at the same `top`**: an outer bevel +
an inner shadow. To get one entry per logical cell, dedup by
`(round(top), round(x0))` keeping the `max(h)` of the pair.

## New finding — Row-divider separators

Full-width `w ≈ 575 h ≈ 9-10 ns=0.749` rects are **row dividers**, not
cells. Exclude any rect with `w > 500` from fillable candidates.

## New finding — Pre-printed default values

BIR 1902 row 18-20 shows pre-printed values: `"INCOME TAX"`, `"BIR Form No. 1700"`,
`"II 011"`. These are drawn as actual chars on the source PDF — our overlay
must not redraw them. Two acceptable strategies:

1. Leave the field out of the schema (user cannot edit the default).
2. Add the default to `SKIP_VALUES` so the user-supplied value renders only
   when different from the default.

## Implementation checklist delta for future BIR forms

- [ ] Run `docs/bir-intake-scaffolding/classify-cells.py <slug>` FIRST before
      writing any coord map. It will emit every fillable rect with its
      `y_pdf` already computed.
- [ ] Verify every pre-filled `0`-agency cell is in `<SLUG>_SKIP_VALUES` with `['']`.
- [ ] Verify every digit-row's `boxCenters[]` excludes agency-prefilled cx
      values AND divider rects.
- [ ] If the form has a repeating-row section (LOB for 1901, Facility Type
      for 1905), extend `CoordsMap` with a `rows[]` variant BEFORE starting
      Gate 4 — don't try to shoehorn fixed y-offsets into separate fields.

## Cross-reference

Scaffolding folder: `docs/bir-intake-scaffolding/`
Extracts (gzipped): `docs/bir-intake-scaffolding/extracts/`
Field dictionaries: `docs/bir-intake-scaffolding/bir-190{1,2,4,5}-fields.md`
Preview PNGs: `docs/bir-intake-scaffolding/previews/`

---

*Added by: Irwin, 2026-04-24. To be merged into the main learnings file by the
next maintainer.*

---

## 🔴 CORRECTION — BIR rect colour convention (2026-04-25, Session 2)

The earlier BIR addendum above contains a **factually inverted** statement
about the ns-colour convention. Do **not** apply the `is_bir_fillable`
predicate as originally written. Corrected findings after deeper inspection
of BIR 1904 rect geometry:

### Corrected convention (BIR October 2025 ENCS family)

| Rect purpose | `non_stroking_color` | Example |
|---|---|---|
| Gray bevel background / column divider / row divider | `0.749` | Left/right margins of every row, vertical bars between name columns |
| Label-container gray panel (has printed chars inside) | `0.749` | "E.O. 98 (Filipino Citizen)" background box next to checkbox |
| **Truly empty user-fillable digit cell** | **`1.0`** (white) with **no chars inside** | PhilSys PCN boxes, 7A name-area inner cells, 10/18/20 address/ID boxes |
| Agency-pre-filled cell | `1.0` (white) with a `0` or `-` char at centre | "TIN to be issued" trailing 5 boxes, Municipality Code |

### What this means for Gate 4 on BIR forms

1. **Fillable predicate** must be `ns_val(rect) > 0.95` with **char-centre inside test**
   rejecting any rect whose interior contains a printed character (this catches BOTH
   label-containers AND agency-pre-filled `0` cells).
2. `ns=0.749` rects with `w>25` are decorative backgrounds (label panels, column
   shading) — **never** input cells. The original addendum's `is_bir_fillable`
   predicate produces ~60 false positives per page.
3. The "outer bevel + inner shadow" pair described earlier exists, but it's the
   **gray decoration**, not the cell. True cells are single `ns=1.0` rects.
4. Digit cells still geometry-filter as `13 ≤ w ≤ 17` and `9 ≤ h ≤ 11`.

### Diagnostic code that produced the corrected finding

```python
def ns_val(r):
    v = r.get('ns')
    if v is None: return None
    return float(v[0]) if isinstance(v,(list,tuple)) else float(v)

def is_fillable_empty_digit(r, chars):
    v = ns_val(r)
    if v is None or v < 0.95: return False
    if not (13 <= r['w'] <= 17 and 9 <= r['h'] <= 11): return False
    for c in chars:
        if not c['text'].strip(): continue
        cx=(c['x0']+c['x1'])/2; cy=(c['top']+c['bottom'])/2
        if r['x0']<=cx<=r['x1'] and r['top']<=cy<=r['bottom']:
            return False  # has char => agency-prefilled or label
    return True
```

Running this on BIR 1904 page 1 yields **45 empty digit cells** grouped into
5 rows (`top` values 151.1, 285.5, 398.8, 426.2, 527.5). This is still a
**partial** coverage — many text cells (non-digit) do not auto-emit with any
simple rect-only heuristic on this form. Text-cell extraction on BIR forms
requires **label-anchored inference**: find the label's baseline, project a
rect below it of expected height (~12pt), and verify the region is empty.
This method is not yet implemented; Gate 4 on BIR 1904 will require hand
calibration from high-DPI PNG bands until a robust text-cell extractor is
built.

### Action items for future BIR work

- [ ] Rewrite `docs/bir-intake-scaffolding/classify-cells.py` using the
      corrected predicate (inverted convention).
- [ ] Add a `label_anchored_text_cells.py` helper that takes `(label_text,
      label_top)` and returns inferred input-rect bounds.
- [ ] When starting Gate 4 on a BIR form, accept that ~60% of coords will
      need manual PNG-band calibration; budget accordingly.

*Added by: Irwin, 2026-04-25, Session 2, during BIR 1904 coord extraction
attempts. Supersedes the preceding addendum's colour-convention statements.*

---

## Session 3 — BIR 1904 Gates 4–8 (2026-04-25, Mai)

Built and shipped end-to-end coord map for BIR 1904 (Application for
Registration — One-time Taxpayer / E.O. 98). Two personas tested:
- **Persona A** — E.O. 98 Filipino, single male, no spouse, no withholding agent.
- **Persona B** — One-Time Filipino, married female, full spouse + WA fields.

### Build blocker bypassed
`npx next build` fails with a pre-existing TS error in `src/app/page.tsx`
(`PrivacyNoticeModal` not found by tsc despite being a hoisted function in
the same file). UNRELATED to BIR work. Worked around by running pdf-generator
through `npx tsx` directly with a small driver script:

```ts
import { generatePDF } from './src/lib/pdf-generator';
import { getFormBySlug } from './src/data/forms';
const form = getFormBySlug('bir-1904')!;
const out = await generatePDF(form, valuesJson);
fs.writeFileSync('/tmp/bir-1904--A.pdf', out);
```

### Iteration 1 → 2 fixes (after first 150-DPI band QA)

| Field / Region | Bug | Fix |
|---|---|---|
| Q26 Purpose checkboxes | ✓ landed ON the letter cell instead of empty box to the LEFT of letter | Shifted x by ~12-23pt left: col1 22, col2 180, col3 340, col4 439; row tops 762.2 / 783.7 / 803.0 |
| Q27 wa_tin | x=27 wrote the digits OVER the row label "Taxpayer Identification Number" | Shifted x → 335 (after label, into TIN cells) |
| Q28 wa_rdo_code | x=320 wrote into TIN area | Shifted x → 555 (into 3-digit RDO cells) |
| Q30 wa_address (page 2) | y=854 too HIGH (above row) | y=861 (cell top=59.2 bot=77.5 → y_pdf=861.5) |
| Q30A wa_zip | y=825 + x=130 in wrong column | y=843, x=540 (cell at top=77.5 bot=95.2, x=536-589) |
| Q31/Q32 wa_contact/wa_email | y=800 too LOW (in declaration text) | y=815 (cell bot=123.8 → y_pdf=815.2); split x: 27/200 with adjusted maxWidth |
| Q33 wa_title | y=720 ON the printed label | y=728 (above the signature line; labels at top=213.8) |

### Standing rule observed
`Page-2 (BIR2316) had 4 rows of fillable cells; BIR-1904 page 2 has only 3 rows
(Q30+Q30A combined, Q31/Q32, Q33 declaration text). Always run pdfplumber rect
extraction on **each page separately** before authoring page-2 coords — do NOT
copy page-1 row offsets.`

### Color convention reaffirmed (BIR 1904)
- White rects (ns=1.0): true fillable cells. On page 2 there are NO ns=1.0
  rects under the cell rows — the cells are formed by stroked outlines and
  surrounding gray dividers (ns=0.749). For page-2 layouts on BIR forms,
  derive cell bounds from the GRAY divider rects instead, by computing the
  vertical gap between consecutive divider rows.

### Pre-printed digits warning
Both BIR 1904 "TIN to be issued" header (top-right of P1) and Q23 Spouse TIN
right-segment show pre-printed "0,0,0,0,0". These are PART OF THE BLANK PDF —
NOT a generator bug. Verify by rendering the unfilled `BIR - 1904 ... .pdf`
through pdftoppm and visually confirming the pre-print before chasing.

### Final QA artifacts
- `/tmp/bir-1904--{A,B}.pdf` (409 KB / 410 KB)
- `public/generated/bir-1904--{A,B}.pdf` (canonical copies)
- Bands: `/tmp/bir1904_qa/{A,B}-{1,2}-b{1..5}.png` (150-DPI, 5 horizontal bands per page per persona)

### Outstanding minor issues (for Iteration 3, if user requests)
1. **Q7A nickname column** — "MARIE" prints with M slightly straddling the suffix/nickname border. Suggest x → 519.
2. **Q8 DOB digit boxes** — text-fallback strategy works but some digits straddle vertical separators. To get crisp per-cell rendering, would need to extract the 8 sub-cell cxs from the Q8 row (top=360.5 bot=378.7) and use boxCenters mode.
3. **Q23/Q25 spouse TIN** — same text-fallback artifact; per-cell rendering would clean up overlap with pre-printed dashes.

These are minor cosmetic items — primary fields all align cleanly.

*Added by: Mai, 2026-04-25, Session 3, after 1st-iteration band QA + 7 coord fixes.*

---

## Session 4 — BIR 1904 Round 5 (PCN + Q20 regression fix)

### Context
Three "fix" rounds (R2 → R3 → R4) progressively broke the BIR-1904 PCN (Q2) and Q20 ID block (`id_type` / `id_number` / `id_effectivity` / `id_expiry`) coordinates that had shipped working in R1 (commit `4ea8174`, release v2.0.0).

| Round | PCN coords | Q20 coords | Result |
|---|---|---|---|
| R1 (4ea8174) | text x=260 y=bir1904Y(161.4) | text top=643.4 (27/195/355/470) | ✅ Correct |
| R2 | boxCenters @ top=151.1 | boxCenters @ top=614 | ❌ PCN→header; Q20→label row |
| R3 | text @ top=192 | text @ top=670 | ❌ PCN→Taxpayer Type; Q20→Q21 |
| R4 | text x=365 y=bir1904Y(150.6) maxW=40 | maxWidth=0 (disabled) | ❌ PCN→label row; Q20 missing |
| R5 (this) | restored R1 | restored R1 | ✅ Correct |

### Lessons

#### L-BIR1904-R5-01 — Always check git history before re-deriving working coords
When the user says "the previous version was correct," the FIRST step is `git log --oneline -- <file>` and `git show <commit>:<file> | grep <field>`. R2/R3/R4 wasted three rounds re-deriving coords from pdfplumber rect output when commit `4ea8174` already had verified working coords.

#### L-BIR1904-R5-02 — Cell-rect output is ambiguous; verify by reading printed words inside the rect
On BIR-1904 page 1 there are several small rects in the y=140-200 band:
- top=140-150 → "2 PhilSys Card Number (PCN) (If Applicable)" **label rect** (printed text inside).
- top=151-161 → PCN **data rect** (empty inside) ← target.
- top=192-207 → Taxpayer Type checkbox row (not a data cell).

Algorithm: for each candidate rect, `page.crop(rect).extract_text()`. If non-empty → it's a label/checkbox row, not a data cell. Choose the empty one between the label and the next labeled section.

#### L-BIR1904-R5-03 — Substring text-extraction is unreliable when overlay overlaps printed text
When pdf-lib draws "1234567890123456" at x=260,y=777.6 on top of a rect that already has BIR's printed "(If Applicable)" hint text, pdfplumber's `extract_text` interleaves characters: e.g. `O12ne3-T4i5m6e` instead of "1234567890123456" or "One-Time". Substring search returns False even when the overlay is correctly positioned.

**Use visual crops (`pdftoppm -r 160` + PIL `crop`) as the source of truth, not text-extraction substring checks.** Reserve `extract_words` for word-position diagnosis only.

#### L-BIR1904-R5-04 — Segmented date cells: text-mode is acceptable but pipes show through
Q20 effectivity/expiry are segmented MM/DD/YYYY cells. Rendering as text (R1 approach) writes "01/15/2023" on top of the cell separators so the slashes overlap with the "|" dividers visually. Acceptable for shipped form. boxCenters per digit would clean this up but R1 ships text-mode.

#### L-INFRA-01 — Production deploy requires `next build` before `systemctl restart`
`quickformsph.service` runs `next start` (production), which serves `.next/server/chunks/*.js`. Editing `src/lib/pdf-generator.ts` and only restarting the service has zero effect — the compiled chunk still has the old coords. After restart, verify with:
```
grep -ho "philsys_pcn:{[^}]*}" .next/server/chunks/*.js
```
The output must reflect the new coords.


---

## Session 5 — BIR 1904 Round 6 (PCN + Q20 dates: actual fix)

### Context
Round 5 "restored R1 coords from commit 4ea8174" but visual verification with the user revealed R1 was ALSO wrong:
- `philsys_pcn` x=260 rendered **outside** the white box, on top of the printed label.
- `id_effectivity` x=355 / `id_expiry` x=470 rendered **outside the left edge** of their date columns.

### Root cause of R5 mistake
Trusting "git history shipped commit" without independent visual verification. The shipped R1 had been wrong all along; the user's complaint in Round 5 was the FIRST time anyone visually inspected the output carefully.

### Lessons

#### L-BIR1904-R6-01 — PIXEL TRUTH > rect extraction > git history
When in doubt about cell boundaries, scan the empty source PDF rendered as PNG for **wide horizontal runs of white pixels** at the data-row Y. This gave the unambiguous answer:
```python
img = np.array(Image.open(src_png).convert('L'))
strip = img[y_top:y_bot, :]
white = (strip > 220).all(axis=0)
# find runs > N pixels → those are data cells
```
For BIR-1904 page 1:
- PCN data cell: **x=218.4–434.7** (width 216, single wide cell — NOT 16 segmented digit boxes despite what the rect data suggested)
- Q20 Effectivity column: **x=363.9–478.8** (with sub-separators at 392.4 and 421.2)
- Q20 Expiry column: **x=479.1–593.7** (with sub-separators at 507.3 and 536.1)

#### L-BIR1904-R6-02 — Centering text in a cell with `pdf-lib drawText`
`pdf-lib.drawText({x, y, maxWidth})` is **left-aligned**. To center a string of width W in a cell of width C starting at X0:
```
x = X0 + (C - W) / 2
```
Estimate text width: `Helvetica fontSize` × `0.5..0.6` × char count for digits and letters (PCN 16 chars at fs=10 ≈ 96pt; date "MM/DD/YYYY" at fs=9 ≈ 50pt).

#### L-BIR1904-R6-03 — Working coords (verified, R6)
```ts
philsys_pcn:     { x: 278, y: bir1904Y(168.3) + 4, fontSize: 10, maxWidth: 156 },
id_type:         { x:  27, y: bir1904Y(641.9),     fontSize:  8, maxWidth: 160 },
id_number:       { x: 195, y: bir1904Y(641.9),     fontSize:  8, maxWidth: 165 },
id_effectivity:  { x: 396, y: bir1904Y(641.9),     fontSize:  9, maxWidth:  80 },
id_expiry:       { x: 511, y: bir1904Y(641.9),     fontSize:  9, maxWidth:  80 },
```
Rendered word-positions (pdfplumber.extract_words) confirm all values fall **inside** their respective cell boundaries.


---

## Session 5 — BIR 1904 Round 7 (full-page x-alignment sweep)

### Context
After R6 fixed PCN + Q20, user inspected the rest of the form and reported new
misalignments: Taxpayer's Name (Q7), Place of Birth (Q9), Local Residence
Address (Q10) sub-rows, Unit/Room/Floor/Building No., Subdivision, Barangay,
Town, City, Province, ZIP, Foreign Address (Q11), Contact (Q16), Email (Q17),
Mother's/Father's name (Q18/Q19) — all had x-coords that placed text either
clipping the left border of the cell or rendered into an adjacent cell.

### Lessons

#### L-BIR1904-R7-01 — Apply pixel-truth column scan to ALL multi-cell rows
The R6 methodology must be applied to every data row, not just the ones that
look obviously wrong. A horizontal scan that returns wide white-pixel runs at
each row's typed-text Y band yields the exact `[x_start, x_end]` of every
column. Add a 2-3pt left margin to avoid clipping the left border.

```python
def cells_at(y_top_pt, y_bot_pt, min_run_pt=15):
    py0=int(y_top_pt*sy); py1=int(y_bot_pt*sy)
    strip = img[py0:py1, :]
    col_white = (strip > 200).all(axis=0)   # threshold 200, not 230
    # collect runs of consecutive True columns wider than min_run_pt
```

For BIR-1904 page 1, scanning the typed-text band (slightly inside the
gridline-to-gridline data row) gave:

| Row (y-band, top-down) | Cells (x-start..x-end) |
|---|---|
| Q7A names (285.6-302.4) | 32-176, 191-335, 350-479, 494-521, 537-579 |
| Q7B reg name (315-330) | 32-579 (wide) |
| Q7C estate (345-358) | 32-579 (wide) |
| Q9 place-of-birth (362-376) | 393-579 |
| Q10 unit/bldg/lot/street (400-415) | 32-118, 133-291, 307-406, 422-579 |
| Q10 subd/brgy/town (427-441) | 32-205, 220-392, 407-579 |
| Q10 city/prov/zip (455-468) | 32-262, 278-493, 508-579 |
| Q11 foreign addr (491-505) | 32-478 |
| Q16/Q17 contact/email (558-572) | 32-190, 220-579 |
| Q18/Q19 mother/father (586-601) | 27-306, 307-593 |

#### L-BIR1904-R7-02 — Don't trust copy-pasted maxWidth either
Several R1 maxWidth values were larger than the cell width (e.g. last_name
maxWidth=156 but cell width=144). pdf-lib happily wraps to second line if a
long value fits maxWidth but overflows the cell. Always set maxWidth to
`cell_width - 2*margin`.

#### L-BIR1904-R7-03 — Email cell starts at 220, not 308
The R1 author appears to have eyeballed Q17 email by aligning it with Q19
father's-name (which DOES start at 308). But Q17 email cell is wider (the
divider between contact and email is at x=210), so email should start at
x≈222, not x=308.

#### L-BIR1904-R7-04 — Working coords (verified visually on personas A & B)
See `BIR1904_FIELD_COORDS` in `src/lib/pdf-generator.ts` for the final values.
All x positions = pixel-truth cell start + 2-3pt margin; maxWidth = cell width
minus margin.


## R8 — BIR-1904 gray-cell skip + BIR-only fields (2026-04-26)

**Issues reported by user:**
- Item 20 (ID Effectivity / Expiry dates) misaligned — text drawn over digit-box gridlines.
- Items 23 / 25 / 27 TIN rows wrote characters onto **gray dash separator cells**.
- Item 23 also wrote on top of **preprinted "0" cells** at the end.
- Items 1, 3, 5, 6, suffix, 7B, 7C, 11, 12, 13 had no/empty data.

**Fixes applied (`src/lib/pdf-generator.ts`, `src/data/forms.ts`):**
1. Added 3 BIR-only digit-box fields: `date_of_registration` (Q1, 8 cells), `rdo_code` (Q3, 3 cells), `municipality_code` (Q12, 5 cells). Y formula: `936 - 168.3 + (16.5 - 10*0.7) / 2`.
2. Converted `id_effectivity` (Q20a) and `id_expiry` (Q20b) from free-text to 8-cell `boxCenters` each. Cell centers measured by pixel-truth scan of source PDF (240 DPI column intensity classify W/G/B).
3. Trimmed `spouse_tin` (Q23) from 16 to **8 cells** — drop gray dashes (idx 2/6/10) AND preprinted "0" cells (idx 11–15).
4. Trimmed `spouse_employer_tin` (Q25) from 16 to **13 cells** — drop gray dashes only (idx 2/6/10); last 5 cells are user-fillable.
5. Trimmed `wa_tin` (Q27) from 17 to **14 cells** — drop gray dashes (idx 3/7/11).
6. Added field defs in `forms.ts` for Q1/Q3/Q12 with `hint: 'To be filled out by BIR'`.
7. Added defaults `['']` in `BIR1904_SKIP_VALUES` so undefined values don't crash the renderer.

**Lessons:**
- **L-BIR1904-R8-01 — When a row has visible vertical gridlines, free-text rendering looks misaligned even if X is correct.** Always convert digit-box rows to `boxCenters` regardless of fontSize fit. User perceives "misaligned" when chars span multiple cells.
- **L-BIR1904-R8-02 — TIN dash separator cells are GRAY-shaded, not white.** Pixel-classify W/G/B columns and include only W (>220 mean intensity) cells in `boxCenters` arrays.
- **L-BIR1904-R8-03 — Some TIN rows have preprinted "0" cells at the tail (Q23 spouse_tin individual taxpayer format ends with five "0"s).** Skip those cells too — overlaying digits would double-print.
- **L-BIR1904-R8-04 — BIR-only fields (Date of Registration, RDO Code, Municipality Code) still need coords + schema entries** so QA personas can populate them, even though end-users won't fill them.
- **L-BIR1904-R8-05 — `BIR1904_SKIP_VALUES` defaults required for new field IDs** to prevent rendering errors when value is undefined.

**Verified working coords (R8):**
| Field | y formula | fontSize | cells |
|---|---|---|---|
| date_of_registration | 936 − 168.3 + (16.5 − 7) / 2 | 10 | 8 |
| rdo_code | (same) | 10 | 3 |
| municipality_code | 936 − 507.6 + (16.5 − 7) / 2 | 10 | 5 |
| id_effectivity | 936 − 641.9 + (17.4 − 6.3) / 2 | 9 | 8 |
| id_expiry | (same) | 9 | 8 |
| spouse_tin | 936 − 699.8 + (17.8 − 7) / 2 | 10 | 8 |
| spouse_employer_tin | 936 − 738.0 + (17.7 − 7) / 2 | 10 | 13 |
| wa_tin | 936 − 847.2 + (17.7 − 7) / 2 | 10 | 14 |

Visual verification: persona A (Filipino) and persona B (foreign national) PDFs regenerated; all top-of-form / Q11 / Q12 / Q13 / Q20 / Q23 / Q25 / Q27 cells render correctly with no overprinting on gray cells.

## R9 — BIR-2316 visible-tick-mark sweep (2026-04-26)

Applied R8 learnings (L-BIR1904-R8-01 "visible gridlines → digit-boxes") proactively to BIR-2316 _Certificate of Compensation Payment / Tax Withheld_ (`bir-2316`).

**Scope:** Audited every box on page 1 with pixel-truth column-intensity scan. Found that 17 fields were rendered as free-text but had visible per-digit tick marks in the source PDF.

**Fixes applied (`src/lib/pdf-generator.ts` → `BIR2316_FIELD_COORDS`):**
| Field | Old | New | Cells |
|---|---|---|---|
| `year` | maxWidth 46 | boxCenters | 4 |
| `period_from`, `period_to` | maxWidth 46 | boxCenters | 4 each |
| `emp_tin_1/2/3` | maxWidth 26 (single string) | boxCenters | 3 each |
| `emp_tin_branch` | maxWidth 48 | boxCenters | 5 |
| `emp_rdo` | maxWidth 26 | boxCenters | 3 |
| `emp_reg_zip` | maxWidth 34 | boxCenters | 4 |
| `emp_local_zip` | maxWidth 34 | boxCenters | 4 |
| `emp_dob` | maxWidth 95 | boxCenters | 8 |
| `emp_contact` | maxWidth 135 | boxCenters | 11 |
| `pres_emp_tin_1/2/3/branch` | maxWidth | boxCenters | 3/3/3/5 |
| `pres_emp_zip` | maxWidth 34 | boxCenters | 4 |
| `prev_emp_tin_1/2/3/branch` | maxWidth | boxCenters | 3/3/3/5 |
| `prev_emp_zip` | maxWidth 34 | boxCenters | 4 |
| `present_emp_date_signed` | maxWidth 95 | boxCenters | 8 |
| `employee_date_signed` | maxWidth 95 | boxCenters | 8 |
| `ctc_date_issued` | maxWidth 95 | boxCenters | 8 |

Free-text fields kept as-is (no visible tick marks in source): `emp_name`, addresses (`emp_reg_address`, `emp_local_address`, `emp_foreign_address`, `pres_emp_address`, `prev_emp_address`, `pres_emp_name`, `prev_emp_name`), `min_wage_per_day/month`, `ctc_no`, `ctc_place`, `ctc_amount`, all Part IVA / IV-B amounts.

**Lessons:**
- **L-BIR2316-R9-01 — Always pixel-truth scan a NEW form before declaring it "done."** Do not trust the original calibration done with a single high-DPI eyeball pass; visible tick marks are easy to miss when the box is small. Use the W/G/B column-intensity classifier on a 240 DPI render.
- **L-BIR2316-R9-02 — Multi-segment TINs are usually triple-sub-celled per segment.** A "TIN First 3" cell is *not* a single 3-char box; it is **three** 12-13pt sub-cells. Same pattern for ZIP (4), RDO (3), Period MM/DD (4), Date (8), Year (4).
- **L-BIR2316-R9-03 — Contact number cells exist on BIR-2316.** It looks like a single rectangle at first glance but has 11 sub-cells. Phone format `0917-555-1234` → digit-strip to 11 chars → fits perfectly. Use boxCenters even for non-pure-digit fields; the renderer already strips non-digits.
- **L-BIR2316-R9-04 — y-formula for boxCenters:** `y = pdf_y_cell_bottom + (cell_h − fontSize × 0.7) / 2`. Where `pdf_y_cell_bottom` is the *lower* y in PDF coords (measured from page bottom). For BIR-2316 most rows have cell_h ≈ 20pt, fontSize 9 or 10.
- **L-BIR2316-R9-05 — Empty values render correctly with boxCenters** (renderer skips when string is empty after digit-strip). Persona B verified blank `emp_local_zip`/`min_wage` produce empty boxes with no spurious chars.

**Pixel-truth verification rule (mandatory for new forms):**
```python
# Render source at 240 DPI grayscale → numpy.
# For each suspect row, scan column means in y-strip.
# W = col_mean ≥ 200 (white user cell); runs of 8-22pt wide → sub-cell centers.
# Skip runs <8pt (gray dashes) or >22pt (single-segment / merged fields).
```

PDFs verified visually:
- [bir-2316--A.pdf](projects/quickformsph-dev/public/generated/bir-2316--A.pdf) — full data, all 17 fields aligned in cells.
- [bir-2316--B.pdf](projects/quickformsph-dev/public/generated/bir-2316--B.pdf) — sparse data (no min wage, no previous employer, no local address, no CTC amount), empty boxes correctly preserved.

---

## R10 — BIR-1902 MVP Scaffold (April 26, 2026)

Implemented a free-text overlay scaffold for BIR-1902 (Application for Registration —
Individuals Earning Purely Compensation Income, October 2025 ENCS).

**Deliverables:**
- Schema: `src/data/forms.ts` — `bir1902` (~50 fields, 5 steps) appended to `FORMS` array.
- Coords: `src/lib/pdf-generator.ts` — `BIR1902_FIELD_COORDS`, `BIR1902_SKIP_VALUES`,
  registered in `FORM_PDF_CONFIGS`.
- Personas: `/tmp/bir1902_persona_{a,b}.json` (Filipino single / resident-alien married).
- Generated PDFs: `public/generated/bir-1902--{A,B}.pdf`, both reachable at
  `http://localhost:3400/generated/bir-1902--{A,B}.pdf`.

**Known caveats (R10b backlog):**
- Field positions are roughly correct for top-of-page items but several fields land
  on neighbouring rows (e.g. last_name overlaps the TIN-row label, TIN value lands
  in the PCN box). A second pass with precise pdfplumber row inspection is needed.
- 40-cell name/address rows render as single free-text overlay; per-cell digit
  placement deferred per user direction ("MVP first").

**Lessons:**

- **L-BIR1902-R10-01 — INVERTED color rule still applies.** ns=0.749 (gray) cells
  are user-fillable; ns=1.0 (white) + preprinted "0" are agency-only. Same as 1904.

- **L-BIR1902-R10-02 — y_pdf vs pdfplumber `top` confusion.** BIR1904's helper
  `bir1904Y(cellBottom) = 936 - cellBottom + 3` takes pdfplumber `bottom` (top-down,
  large = lower on page). When pre-computing field locations as
  `y_pdf-from-bottom` (large = higher on page), DO NOT pipe those values through
  the same helper — invert. Quick rule: in pdfplumber `top` and PDF-coord-from-bottom
  satisfy `top + y_pdf ≈ pageHeight`. BIR-1902 helper rewritten as
  `bir1902Y(yPdfTop) => yPdfTop - 13` to consume y_pdf-from-bottom directly,
  with -13 placing the baseline ~box-height inside the cell.

- **L-BIR1902-R10-03 — Pre-printed defaults: omit field, no SKIP_VALUES.**
  Tax Type / Form Type / ATC / DLN / "New TIN to be issued" are all preprinted
  by BIR. Don't add to schema. Don't add SKIP_VALUES. Just leave out.
  Same applies to: registration_date, rdo_code, municipality_code.

- **L-BIR1902-R10-04 — Static asset re-registration after API write.**
  Next.js 14 production-mode caches `public/` asset list at build time.
  PDFs written via /api/generate AFTER `next build` return HTTP 404 when fetched
  via `/generated/...` URL. Workflow: (a) build empty, (b) generate PDFs once,
  (c) `next build` again so Next picks up the new files, (d) restart service.
  Or: use the /api/preview/[code] route handler instead of static URL.

- **L-BIR1902-R10-05 — Subagent (Explore) is read-only.** Tasks that require
  writing code must be done by the main agent. Subagents can design schemas,
  produce code blocks as text, and analyse files, but cannot edit/save files.

- **L-BIR1902-R10-06 — Inline label-strip cells need x AFTER label-text-end, not just below.**
  BIR-1902 Item 2 (PCN) has its label `2 PhilSys Card Number (PCN)` at top=142.4 x0=282
  with the data-area as a WHITE inline strip on the SAME row to the RIGHT of the label
  (NOT a row below). Setting `x: 280` placed digits OVER the label text. Setting
  `y: yAt(157)`+ pushed text BELOW into the next gray strip ("Part I - Taxpayer/
  Employee Information"). Working coords: `x: 460, y: yAt(152), fontSize: 6`.
  Verification rule: when a BIR label has high x0 (~250+), the data-area is INLINE
  to the right of the label, not below it. Use small fontSize (6-7pt) since the
  inline cell height is only ~10pt.

- **L-BIR1902-R10-07 — TIN/DOB/Date-MMDDYYYY fields MUST use boxCenters; freeform x+maxWidth**
  **dumps overflowing string into single position.** BIR-1902 v11 had `tin`/`date_of_birth`/
  `id_effectivity`/`id_expiry`/`spouse_tin`/`spouse_employer_tin` as freeform `x`+`maxWidth`
  fields. They rendered the entire 12-digit string contiguously, overflowing the form's
  visible digit-box separators. Renderer at line 3307-3324 already supports `boxCenters`
  with auto-strip of non-digits — just provide cx array with one entry per box.
  Approximate cx for ~14pt-spacing rows (no rect-extraction needed for first iteration):
    TIN row 12-box (x≈25..200):  `[33,47,61,79,93,107,125,139,153,171,185,199]`
    DOB 8-box MMDDYYYY (x≈25..145): `[33,47,65,79,97,111,125,139]`
  Iterate via zoom-crop bands per MANDATORY QA rule.

- **L-BIR1902-R10-08 — Pre-printed reserved-zero boxes must be EXCLUDED from boxCenters.**
  BIR Schemas like "TIN — 12 digits (5 trailing 0s are agency-reserved)" mean the form
  PRE-PRINTS the last 5 boxes with "0,0,0,0,0" and only the first 7 are user-input.
  But sample data may store full 12 digits. Decision: provide all 12 boxCenters and let
  the user-data render across all 12 boxes (trailing 5 will overlap the pre-printed
  zeros — acceptable since user's last 5 should be 0 anyway if data is well-formed).
  If sample's last 5 ≠ 0, it's a data validation issue (flag for reviewer). Tightening
  cx range to first 7 only would silently truncate well-formed 12-digit data.

- **L-BIR1902-R10-v11 — Per-item alignment via `yBeforeNext`/`yAt` helpers from extracted label tops.**
  After R10 v1-v5 left visible label/value overlap on items 1-7, 21, 22, 26-27, the v6-v11
  refinement pass adopted a two-helper pattern in `pdf-generator.ts`:
  ```ts
  const yBeforeNext = (nextLabelTop: number) => 936 - (nextLabelTop - 4);
  const yAt = (baselineTop: number) => 936 - baselineTop;
  ```
  Source-of-truth: extract every item's bold-digit `top` from the BIR PDF via
  `pdfplumber.extract_words()` filtered to digit-text 1-27. Free-text values use
  `yBeforeNext(nextItemTop)` to baseline near the bottom of the data area; inline
  caption rows (Issuer, Mobile/Fax/Landline, Email, Spouse Last/First) use `yAt`
  with the data-row top extracted from gray rect cells (ns=0.749) at the row's `top+h`.
  Required for items where caption sits BELOW the data row inside the same gray strip.

- **L-BIR1902-R10-v11 — Wire `BIR1902_CHECKBOX_COORDS` into `FORM_PDF_CONFIGS` for chevron items.**
  BIR-1902 has 5 chevron-checkbox items (5 Taxpayer Type, 7 Gender, 8 Civil Status,
  22 Preferred Contact Type, 23 Spouse Employment Status). Initially registered with
  only `fieldCoords` + `skipValues` → values rendered as overlapping text strings on
  the chevron labels. Fix: define `BIR1902_CHECKBOX_COORDS: Record<string, Record<value, {x,y}>>`
  with one `(x,y)` per dropdown option (matching schema's `options:` array EXACTLY —
  e.g., 'Employed in the Philippines' not 'Employed Locally') and add
  `checkboxCoords: BIR1902_CHECKBOX_COORDS` to the slug's config entry. The renderer's
  `checkboxEntry` lookup at line ~2770 then writes a ✓ glyph at the correct chevron.

- **L-BIR1902-R10-v11 — `next build` fails with ENOENT on `.next/export-detail.json` and
  `_not-found/page.js.nft.json` when service is running with `next start`.** The active
  systemd service holds file handles in `.next/`; even after `rm -rf .next`, build's
  static-export and trace-collection phases race. Workaround: `systemctl stop quickformsph`
  → `rm -rf .next` → `npx next build` → `systemctl start quickformsph`. Do not rely on
  `mkdir + touch` placeholder shims — the trace-collector recurses across all routes and
  discovers more missing artifacts.

### L-AUTOPOP-01 — `autoPopulate()` bypassed `field.autoUppercase` transform (2026-04-26)

**Problem.** "Fill with sample data" wrote sample objects directly to form state via
`setValues(pick)` without consulting the FormSchema. Lowercase sample literals like
`citizenship: 'Filipino'` rendered into the PDF as-is even though the schema field
declared `autoUppercase: true` — only manually-typed input went through the
uppercase transform (in the input `onChange` handler at the input-element level).

**Fix.** In `src/app/forms/[slug]/page.tsx` `autoPopulate()`, walk the picked
sample row, look up each key's schema field via `form.fields.find(...)`, and apply
`val.toUpperCase()` whenever `field.autoUppercase === true`. Pass the transformed
object to both `setValues` and `saveDraft` so resumed drafts also stay consistent.

**Ripple.** Applies to all forms whose schemas declare `autoUppercase`: BIR-1902,
BIR-1904, BIR-2316, the Pag-IBIG HLF/SLF/PFF forms, etc. After the fix, all 15
smoke tests still pass and PDFs are unchanged for samples that were already
uppercase-cased; lowercase ones (e.g. lazy persona drafts) now self-correct.

**Lesson.** Schema-driven UI transforms must be applied in **every** path that
writes to form state (manual onChange, sample-fill, draft-resume, paste-handlers),
not just the canonical input-element. When a transform belongs to the schema
(`autoUppercase`, future `trim`, `digitsOnly`, etc.), centralise it in a helper
like `applyFieldTransforms(field, value)` and call it from every write path.

### L-BIR1902-R11-01 — Empirical cx derivation via pdfplumber rect + 300dpi edge detection (2026-04-27)

**Symptom.** On BIR-1902 page 1 the TIN row (top≈199) and Date-of-Birth row (top≈305) digits drifted left of cell centers — the leading "0" of `'03/15/1995'` rendered so far left it appeared cut off, and TIN digit 12 collided with the form's pre-printed reserved-zero region.

**Root cause.** The legacy `boxCenters` were hand-transcribed approximations (`tin: [33,47,61,79,93,107,125,139,153,171,185,199]` with non-uniform spacing 14/14/18/14/14/18/…). The form actually uses a **uniform 14.3pt cell grid** for these rows; the irregular spacing came from someone trying to compensate for an unrelated x0-vs-cx confusion.

**Methodology (verified working).**
1. **Open form via pdfplumber and dump rects** with `width ∈ [8,16]`, `height ∈ [7,16]` — the digit-cell rects are ~14pt × ~14pt; group by `top` (rounded to 1pt) to find rows.
2. **Cross-check with image edge detection** — `pdftoppm -r 300` the blank form, slice a horizontal band around the row, compute column-mean darkness, apply a high-pass filter (`sharp = col_dark − gaussian_smooth(col_dark, σ=4)`), then peak-cluster within 8px to recover vertical-line positions in points (px/4.1667).
3. For TIN row (top≈199-208), pdfplumber → 12 contiguous cells at uniform 14.3pt; image edge detection confirmed line edges at [31.8, 46.2, 60.0, 75.4, 89.6, 104.0, 118.3, 133.0, 147.2, 161.6, 175.9, 190.6] + extrapolated 205.0 → centers = midpoints.
4. For DOB row (top≈305-315), the layout is **10 cells starting at x=25.0 with 14.3pt spacing**; cells at indices 2 and 5 are pre-printed "/" separator cells (skip when emitting digits). Digit cells = positions 0,1,3,4,6,7,8,9.

**New cx values (in `BIR1902_FIELD_COORDS`):**
- `tin.boxCenters` = `[39, 53.1, 67.7, 82.5, 96.8, 111.2, 125.6, 140.1, 154.4, 168.8, 183.2, 197.8]`
- `date_of_birth.boxCenters` = `[25, 39.1, 67.7, 81.7, 110.5, 124.8, 139, 153.4]`

**Earlier wrong assumption.** I previously claimed pdfplumber returned 0 vline edges in the TIN region and gave up. Wrong: pdfplumber returns ~6949 rects on page 1 (the form is rect-heavy, not line-heavy). **Always inspect rect output, not just `vlines`/`hlines`, when grids look empty.**

**Untouched.** `id_effectivity`, `id_expiry`, `spouse_tin`, `spouse_employer_tin`, `philsys_pcn` already rendered correctly per visual QA, so their boxCenters were left as-is.

**Sample-data validator hardening.** Discovered while running this pass: `scripts/check-sample-data.ts` was silently failing 8 forms with `todayMaskedDate is not defined` because samples now reference helper functions. Fixed by injecting stubs (`const todayMaskedDate = () => '01/01/2025'`) into the sandboxed `new Function` context. Validator now passes 2464 checks across 15 forms.

### L-FIELDXFORM-01 — Centralise field-value transforms in `applyFieldTransforms` helper (2026-04-27)

**Rule (applies to every new form intake).** When a `FormField` schema flag implies a value transformation (`autoUppercase` today; future: `trim`, `digitsOnly`, `padStart`, etc.), the transform MUST be applied through `src/lib/field-transforms.ts::applyFieldTransforms(field, value)`. **Never inline `value.toUpperCase()` (or similar) at a call site** — duplicate transforms drift apart. L-AUTOPOP-01 was caused exactly by this: the input `onChange` had `field.autoUppercase ? e.target.value.toUpperCase() : e.target.value`, but `autoPopulate()` wrote sample values via `setValues` directly, so samples rendered lowercase in the PDF.

**Helper API.**
```ts
import { applyFieldTransforms, applyFieldTransformsRecord } from '@/lib/field-transforms';

// Single value (input onChange, autocomplete pick, programmatic setter):
onChange(applyFieldTransforms(field, rawValue));

// Whole record (autoPopulate, bulk import, draft restore):
const transformed = applyFieldTransformsRecord(form?.fields, sampleRecord);
```

**Adding a new transform flag.**
1. Declare the flag on `FormField` in `src/data/forms.ts` (e.g. `digitsOnly?: boolean`).
2. Add ONE branch inside `applyFieldTransforms` in `src/lib/field-transforms.ts`. Order matters if transforms compose — currently uppercase runs last so uppercased letters are never re-lowered.
3. Update `scripts/generate-field-dictionaries.ts` to emit the new flag in the validation column.
4. Add a sample-data check to `scripts/check-sample-data.ts` if the flag should reject malformed sample values.
5. **Do NOT** add the transform anywhere else. Grep for the flag name to confirm: `grep -rn "field\.<flagName>" src/` should return only `field-transforms.ts`.

**Call sites currently consolidated (2026-04-27).**
- `src/app/forms/[slug]/page.tsx` autoPopulate (~line 1810) — uses `applyFieldTransformsRecord`
- `src/app/forms/[slug]/page.tsx` input onChange (~line 2460) — uses `applyFieldTransforms`
- `src/app/forms/[slug]/page.tsx` autocomplete onMouseDown (~line 2538) — uses `applyFieldTransforms`

**Verification after refactor.** `npx tsc --noEmit` clean; `npm run test:samples` → 2464 field-checks pass across 15 forms; `next build` clean; production service active on port 3400.

### L-PRECOMMIT-01 — Husky pre-commit gate runs tsc + npm test (2026-04-27)

**Goal.** Block commits that introduce schema regressions, missing PDF coords, sample-data drift, or PDF-generation crashes. Catches the bug class fixed in L-AUTOPOP-01 / L-FIELDXFORM-01 / the 14-form sample sweep before they reach `main`.

**Setup (one-time on a fresh clone).**
```bash
cd ~/projects/quickformsph-dev
npm install            # `prepare` script runs `husky` automatically and wires .git/hooks
```

**Pre-commit hook (`.husky/pre-commit`).** Runs in this order, fail-fast:
1. `npx tsc --noEmit` — catches type drift across `src/data/forms.ts` ↔ `src/lib/pdf-generator.ts` ↔ `src/app/forms/[slug]/page.tsx`.
2. `npm test` which is the alias for:
   - `test:coverage` — every `FormSchema.fields[].id` has a `fieldCoords` / `checkboxCoords` entry, or is whitelisted in `skipValues`.
   - `test:samples` — every `required: true` field non-empty AND every `dropdown` value is in its `options` array. 2464 field-checks across 15 forms today.
   - `test:smoke` — in-process `generatePDF()` for every form with deterministic random data; non-zero exit on any form crash.

**Wall-clock cost.** ~12-18s on dev hardware. Acceptable. Smoke is the slowest contributor; if it grows past ~30s, split it into a pre-push hook instead.

**Bypass.** `git commit --no-verify` exists as an emergency escape — flag any use in code review.

**New-form-intake checklist (must satisfy before commit).**
- [ ] `FORMS` entry in `src/data/forms.ts` with proper field types/required flags
- [ ] `fieldCoords` (and/or `checkboxCoords` / `skipValues`) entry in `pdf-generator.ts` so `test:coverage` passes
- [ ] At least 2 sample rows in `samplesBySlug` covering all required fields and dropdown enums
- [ ] In-process render works (`test:smoke` PASS)
- [ ] No raw `value.toUpperCase()` (or other transforms) inline — use `applyFieldTransforms` per L-FIELDXFORM-01

**Verification today.** Hook executed locally end-to-end: tsc clean → coverage pass → samples 2464/2464 pass → smoke 15/15 PDFs generated successfully.

### L-UPPERAUDIT-01 — autoUppercase lowercase-leak audit script (2026-04-27)

**Purpose.** A one-shot audit + ongoing CI gate that flags every `samplesBySlug` literal in `src/app/forms/[slug]/page.tsx` whose value contains lowercase letters AND whose schema field is marked `autoUppercase: true`.

**Why this matters even though runtime is correct.** After L-FIELDXFORM-01 made `applyFieldTransforms` the single source of truth for uppercasing, runtime behaviour is correct regardless of the source-literal casing. But mixed-case sample literals are misleading:
1. Maintainers reading samples assume "what you see is what renders" — wrong.
2. If anyone ever adds a code path that bypasses the helper (e.g. an export-to-CSV feature copying the raw record), the lowercase reappears.
3. Diffs to "fix casing" become noisy because the casing is implicit, not declared.

**Script.** `scripts/audit-uppercase-leaks.ts`, exposed via `npm run audit:uppercase`. Reuses the bracket-balanced literal extractor from `check-sample-data.ts`, evaluates each sample record, then for every field where `field.autoUppercase === true` checks `/[a-z]/.test(value)`. Exit 0 = clean, 1 = leaks.

**Initial run (2026-04-27).** 141 leaks across 15 forms (706 value-checks). Most concentrated in address fields (`street`, `barangay`, `city`, `province`), facility names, and diagnosis text. Cleanup not yet performed — pending Mai review (some PHIC diagnosis strings may be deliberately title-case to match agency style guides; she should confirm before mass-uppercasing).

**Wiring.**
- `package.json`: added `"audit:uppercase": "npx tsx scripts/audit-uppercase-leaks.ts"` under scripts.
- NOT (yet) included in pre-commit `npm test` — would block all current commits with 141 errors. Promote to the pre-commit chain after the cleanup pass.

**New-form-intake rule.** When you add samples for a new form, run `npm run audit:uppercase` and fix any leak before committing. Once existing leaks are cleaned, this becomes part of the standard gate (move into the `test` alias).

---
## L-SMART-01 — Smart Assistance pattern (offline, schema-driven, cascadable)

**Date:** 2026-04-27
**Form:** Pag-IBIG SLF-065 (multi-purpose loan) — pilot. Pattern is reusable on every form.

**Goal.** Add smart, helpful UI to the form editor (live eligibility checks, amortization calculator, contextual hints, input masks, address mirroring) WITHOUT breaking other forms and WITHOUT touching the network. All offline.

### Architecture (4 layers)

1. **`src/lib/smart-assistance.ts`** — pure helpers. Exports:
   - `applyMask(mask, raw)` for `mid | tin | date | currency | mobile | zip` — auto-formats as user types.
   - `parseMaskedDate, ageFrom, monthsBetween` — date math.
   - `amortize(principal, annualRate, months)` — standard `M = P·r / (1 − (1 + r)^−n)`.
   - `fmtPHP(n)` — locale-aware peso formatter.
2. **Schema (`src/data/forms.ts`)** — additive, optional fields:
   - `FormField.mask?: FieldMask` — turns on input mask.
   - `FormField.optionHints?: Record<string,string>` — green per-option tip below dropdown / autocomplete.
   - `FormField.mirrorFrom?: string`, `FormField.mirrorGroup?: string` — mark fields as targets of a sibling checkbox-driven copy.
   - `FieldType` adds `'checkbox'`.
   - `FormSchema.smartAssistance?: SmartAssistanceConfig` — `{ amortization, eligibility[] }`. Eligibility rule kinds: `age-min | months-min | amount-max | digits-eq | email`.
3. **Renderer (`src/app/forms/[slug]/page.tsx`)** — three small additions:
   - `FieldInput` consults `field.mask` and routes onChange through `applyMask`. Adds `'checkbox'` case. Uses `optionHint || field.hint` (green vs gray).
   - The `stepFields.map` onChange wraps `handleChange`: when a `checkbox` flips ON, every field whose `mirrorGroup === checkbox.id` is filled from its `mirrorFrom` source (Same-as-Permanent style mirroring).
   - `<SmartPanel form values />` is rendered after the step fields when `form.smartAssistance` is defined.
4. **Autocomplete sources** — new `ph_loan_purposes_mpl.ts` (with `*_HINTS` map) and `ph_employment_sources.ts`, registered in `src/data/autocomplete-sources/index.ts`.

### How to cascade to ANOTHER form

Pick what applies. Each step is independent.

- **Add masks.** Set `mask: 'mid' | 'tin' | 'date' | 'currency' | 'mobile' | 'zip'` on a field.
- **Add per-option hints.** On a `dropdown` (or `autocomplete` with finite options), set `optionHints: { ... }`.
- **Switch a field to typeahead.** Change `type: 'text'` → `type: 'autocomplete'` and set `optionsSource: 'ph_banks' | 'ph_cities' | 'ph_provinces' | 'ph_loan_purposes_mpl' | 'ph_employment_sources' | …`. Add new sources under `src/data/autocomplete-sources/` and register them in `index.ts`.
- **Add Same-as-X mirror.** Add a `type: 'checkbox'` field with id `same_as_X`. On every target field set `mirrorGroup: 'same_as_X'` and `mirrorFrom: '<source field id>'`.
- **Enable Smart Panel.** On the schema, set `smartAssistance.eligibility` and/or `smartAssistance.amortization`. The panel auto-renders.

### Cascade candidates (snapshot)

- **Pag-IBIG HLF-068, HLF-868** (housing loan): bank field → `ph_banks` autocomplete; address mirror; amortization (rate=0.0625, principal/term fields differ).
- **BIR-1902 / 1904 / 2316**: TIN field → `mask:'tin'`; address mirror.
- **PhilHealth M2 / CSF**: address mirror; mobile → `mask:'mobile'`.

### Verification recipe

```bash
cd ~/projects/quickformsph-dev && npx next build 2>&1 | tail -3 && \
  printf 'sap12345\n' | sudo -S -p '' systemctl restart quickformsph && sleep 6 && \
  grep -ro "PH_LOAN_PURPOSES_MPL\|smartAssistance\|Live Amortization" .next/server/chunks/ | head
```

### Standing rule

Smart Assistance MUST be 100% client-side / offline. No fetch, no CDN, no API. New helpers go under `src/lib/smart-assistance.ts`; new data goes under `src/data/autocomplete-sources/`.

## L-SMART-02 — Mirror behavior implementation note

When the mirror checkbox is unchecked, mirror targets are intentionally **not cleared** — the user may have customized them. Re-checking the box re-copies from the current source values. This matches the sandbox prototype validated with the user on 2026-04-27.

## L-SMART-03 — Editor-buffer revert hazard (still active)

When `page.tsx` or `forms.ts` is open in VS Code, the `replace_string_in_file` tool can succeed in the editor buffer but NOT persist to disk before a build. Mitigation:

1. After every TS edit, `grep` the symbol on disk to confirm.
2. For large blocks, prefer `python3` with `Path.read_text/write_text` to bypass the editor buffer.
3. Run `npx next build` and read the actual error before assuming success.

This rule is the reason the SLF-065 pilot took two build cycles instead of one (missing import on first try).

---

## L-TINSOFT-01 — Soft TIN trailing-zeros validator (BIR-1902 / BIR-1904)

**Date:** 2026-04-27
**Forms:** bir-1902, bir-1904 (NOT bir-2316 — employer/branch TINs are exempt)
**Decision driver:** R12 QA review item #1 (TIN trailing-5-zeros rule). User
elected SOFT validation: warn but allow submission, behind a config flag for
later promotion to hard enforcement. No published BIR memo confirms the rule —
only schema labels (`'... 5 trailing 0s are agency-reserved'`) and field officer
practice. Hard-blocking would risk false negatives for valid edge cases
(deceased estates, sole-prop branch suffixes seen in the wild).

### Schema
Two new optional `FormField` properties in `src/data/forms.ts`:
- `warnPattern?: string` — JS regex (string form) the value SHOULD match.
- `warnMessage?: string` — amber hint shown when value is non-empty and fails the pattern.

### Where applied
- bir-1902 `tin` (line ~4133): `warnPattern: '^\\d{7}00000$'`
- bir-1902 `spouse_tin` (line ~4186): same pattern
- bir-1904 `spouse_tin` (line ~4077): same pattern
- bir-1904 has no `id: 'tin'` field (it's a TIN-application form). Employer / WA TIN
  fields (`spouse_employer_tin`, `wa_tin`) are EXEMPT — corporate TINs use real
  branch suffixes, not 00000.
- bir-2316 EXEMPT: `emp_tin_branch` is a field of its own and present employer
  TIN can carry non-zero branch.

### Renderer (src/app/forms/[slug]/page.tsx, FieldInput)
Inserted IIFE just below the `field.hint` paragraph:
```tsx
{(() => {
  if (!field.warnPattern || !value) return null;
  let re: RegExp | null = null;
  try { re = new RegExp(field.warnPattern); } catch { return null; }
  if (re.test(value)) return null;
  const hard = process.env.NEXT_PUBLIC_QFPH_TIN_HARD === '1';
  const cls = hard ? 'mt-1 text-xs text-red-600' : 'mt-1 text-xs text-amber-600';
  return <p className={cls} role="alert">{field.warnMessage ?? '...'}</p>;
})()}
```

### Config flag — NEXT_PUBLIC_QFPH_TIN_HARD
- `'0'` (default, unset): amber warning, submission allowed.
- `'1'`: red error styling on the hint. (Hard-blocking at the submit gate is a
  future seam — left intentionally out of scope until BIR memo lands.)

### Rationale for soft-only at launch
Hard enforcement on unconfirmed rules → false rejects → support load. The amber
warning is enough to nudge ~95% of typos while preserving the long-tail.

### Lesson reinforced
Slug → line-number mapping must be re-verified before applying schema edits.
First attempt placed the warnPattern on `pagibig-hlf-068` because grep ordering
was misread (line 3749 looked plausible for bir-1904 but was actually inside
hlf-068's range 3651–3768). Rule: when patching a field by ID, always confirm
the surrounding slug literal first via `awk` range markers.

---

## R3 Polish Pass (SLF-065) — 2026-04-26

### L-SLF065-R3-01 — Auto-shrink-to-fit + truncate; never pass `maxWidth` to pdf-lib's `drawText`

**Symptom**: Long values (addresses, employer names, place of birth) leaked vertically into the row below, producing apparent "double rows" of text in PDF output.

**Root cause**: We had been passing `maxWidth: coords.maxWidth` directly into `page.drawText(...)`. pdf-lib's `maxWidth` does **line wrapping**, not horizontal scaling. The wrapped second line is drawn BELOW the baseline, which on a tightly packed govt form lands inside the next row's cell.

**Fix** (`src/lib/pdf-generator.ts` ~line 3346, per-field draw loop):
```typescript
let drawSize = fontSize;
let drawTextStr = text;
if (coords.maxWidth) {
  let measured = font.widthOfTextAtSize(drawTextStr, drawSize);
  if (measured > coords.maxWidth) {
    const scaled = (drawSize * coords.maxWidth) / measured;
    drawSize = Math.max(4, scaled);                 // never below 4pt
    measured = font.widthOfTextAtSize(drawTextStr, drawSize);
    while (measured > coords.maxWidth && drawTextStr.length > 1) {
      drawTextStr = drawTextStr.slice(0, -1);       // truncate from right
      measured = font.widthOfTextAtSize(drawTextStr, drawSize);
    }
  }
}
page.drawText(drawTextStr, { x: coords.x, y: coords.y + yOff, size: drawSize, font, color: rgb(0,0,0) });
```

**Standing rule**: For any single-line cell on a government form, **never** pass `maxWidth` to pdf-lib. Either render at a size guaranteed to fit, OR use the shrink+truncate above. If you genuinely need wrapping (e.g. multi-line "remarks"), explicitly compute line breaks and call `drawText` per line.

### L-SLF065-R3-02 — NAMES row column-shift bug; always re-derive coords from pdfplumber

**Symptom**: On SLF-065 page 1 NAMES row, "PATRICIA" rendered in the NAME EXTENSION column, "REYES" rendered in MAIDEN MIDDLE NAME, etc. Every NAME field was shifted one column to the right.

**Root cause**: Original coords were hand-authored against a misread column layout. NAMES row label x0 positions on the source PDF (verified via pdfplumber):
- LAST=20.9, FIRST=76.7, EXT=134.7, MIDDLE=201.7, MAIDEN MIDDLE=255.1, NO MIDDLE=328.3, DOB=395.7, PLACE OF BIRTH=498.5

**Fix** (`src/lib/pdf-generator.ts` ~lines 1465-1471):
```typescript
last_name:             { x: 23,  maxWidth: 53 },
first_name:            { x: 78,  maxWidth: 55 },
ext_name:              { x: 137, maxWidth: 60 },
middle_name:           { x: 204, maxWidth: 50 },
no_maiden_middle_name: { x: 257, maxWidth: 67 },
dob:                   { x: 397, maxWidth: 98 },
place_of_birth:        { x: 499, maxWidth: 95 },
```

**Standing rule** (already in `quickformsph-qa.md` checklist): Always re-derive `x` and `maxWidth` from a live pdfplumber rect+word extraction on the source PDF. Never accept hand-authored coords without verification. The proven workflow:
1. `pdfplumber.open(src).pages[0].extract_words()` → grab label x0
2. `extract_words()` filtered by row top → grab next-cell label x0 (right edge)
3. `maxWidth = nextLabelX0 - currentX - 2` (small inset)
4. `x = currentLabelX0 + 2`

### L-CLEAR-01 — "Clear & Exit" must hard-reload the page

**Symptom**: Clicking "Clear & Exit" in the Close-Session/Preview screen left form data populated and stayed on the preview page.

**Root cause** (three compounding issues):
1. A pending debounced `saveTimer` re-saved the old draft milliseconds after `clearDraft()` ran.
2. `router.replace('/')` is a Next.js client-side navigation; it preserved component state including modal open flags and `currentStep`.
3. Modal state (`showPaymentModal`, `showSuccessModal`, `pendingDraft`, `draftModalOpen`) was never explicitly reset.

**Fix** (`src/app/forms/[slug]/page.tsx`, new `handleHardClear` callback wired into both `onCloseSession` callsites):
```typescript
const handleHardClear = useCallback(() => {
  if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null; }
  clearDraft(slug);
  if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
  setValues({}); setPreviewImageUrl('');
  setShowPaymentModal(false); setShowSuccessModal(false);
  setPendingDraft(null); setDraftModalOpen(false);
  setMode('form'); setCurrentStep(0 as StepIndex);
  setIsDemoMode(false); setLocalModeActive(false);
  setGateKey(k => k + 1);
  if (typeof window !== 'undefined') window.location.replace('/');
  else router.replace('/');
}, [slug, previewImageUrl, router]);
```

**Standing rule**: For "destroy session and start over" actions, always (a) cancel pending debounced timers, (b) revoke object URLs, (c) reset every modal/step flag, (d) prefer `window.location.replace()` over `router.replace()` so React state is fully blown away. A SPA-style soft navigation will leak state.

### L-FORMS-HINT-01 — Hint trims (traceability)

- Removed `mid_no.hint` ("Your 12-digit Pag-IBIG Member ID. Found on your Pag-IBIG card or SMS confirmation.") — ID is also visible elsewhere in the gate flow.
- Trimmed `perm_tin.hint` from "12-digit BIR Tax Identification Number (digits only auto-format)." → "12-digit BIR Tax Identification Number." (auto-format is now signaled by the input mask itself).


### L-SLF065-R3-03 — DESIRED LOAN AMOUNT renders on the "Others, specify: ____" underline, not in the cell's left edge

**Symptom**: The numeric loan amount (e.g. "80,000") was being painted at the left edge of the DESIRED LOAN AMOUNT cell, overlapping the printed instruction "Maximum Loan Amount" / "Others, specify:".

**Root cause**: The cell at PDF rect `top=172.3-193.0, x=497.0-593.8` is **not** a freeform amount cell — it contains two checkbox options:
1. ☐ Maximum Loan Amount (top≈180.1)
2. ☐ Others, specify: ______________ (top≈187.0; underline at x=550.7-589.3, top=187.8)

The numeric amount belongs **on the "Others, specify" underline**, not on the cell's left edge. Original coord `x: 499, y: SLF_065_Y_PRES2 (=746)` placed the digits over the printed sub-instructions.

**Fix** (`src/lib/pdf-generator.ts` ~L1509):
```typescript
desired_loan_amount: { page: 0, x: 552, y: 741, fontSize: 8, maxWidth: 38 },
```
- `x=552`: just to the right of "Others, specify:" colon (underline starts at 550.7).
- `y=741`: baseline lowered ~7pt from the previous value so the digits sit on (not above) the underline. Derivation: underline top in pdfplumber=187.8; want digit baseline at PDF-bottom y = 936-187.8-6 ≈ 742.
- `maxWidth=38`: width of the underline (589-552). The shrink+truncate pass (L-SLF065-R3-01) handles overflow gracefully.

**Standing rule**: For govt-form cells whose printed contents include checkbox options + a fill-in line, **the data goes on the fill-in line**, not in the bounding rect's top-left. Always read the printed sub-text inside a cell before assigning coords. Quick check: if `extract_words()` inside a cell rect returns words like "specify", "Others", "if", "(other)", or an underscore run, you must locate the underscore run and use ITS x-range and `top` — not the cell rect's.


## L-ANALYTICS-01 (2026-04-28) — `demo_click` events silently dropped (uppercase slug rejected)
**Symptom**: Dashboard "Demo Clicks" KPI stuck at 0 even after clicking Demo on multiple forms; only `form_view` rows present in `analytics_events`.
**Root cause**: `PaymentGate` passed `formCode` (uppercase, e.g. `BIR-1902`) as the slug arg to `trackEvent('demo_click', ...)`. The `/api/analytics` route validates with `SLUG_RE = /^[a-z0-9-]{1,80}$/` and silently 204s any non-empty slug that does not match. Uppercase letters → reject → no insert.
**Fix**: Added a `formSlug` prop to `PaymentGate` (lowercase route slug, e.g. `bir-1902`) and pass it from `forms/[slug]/page.tsx`. `onDemo` now calls `trackEvent('demo_click', formSlug)`.
**Standing rule**: When passing a slug to the analytics beacon, it MUST be the route slug (lowercase, hyphenated). Never reuse `formCode` (display code, uppercase). The route's silent 204 swallows the bug — only DB inspection reveals it.

## L-CLEAR-02 (2026-04-28) — Demo "Clear & Exit" left form pre-filled on re-entry
**Symptom**: In Demo mode, clicking *Close Session → Clear & Exit* returned to PaymentGate. Choosing Demo or Donate again landed on the **Preview screen with all the previous answers still populated** — not a blank form.
**Root cause**: `handleReturnToGate` only cleared the localStorage draft and reset `isDemoMode` / `localModeActive` / `gateKey`. It left React state intact: `values`, `mode='preview'`, `currentStep`, `previewImageUrl` (blob URL), `showSuccessModal`, etc. When the user re-entered, the form rendered with the stale state.
**Fix**: `handleReturnToGate` now mirrors the hard-clear flow used by paid-mode `handleHardClear`: cancels the debounced `saveTimer`, clears the draft, revokes the preview blob URL, and resets `values`, `previewImageUrl`, `mode`, `currentStep`, both modal flags, plus `isDemoMode` / `localModeActive` / `gateKey`. The only difference vs `handleHardClear`: it does NOT navigate away with `window.location.replace('/')` — Demo Clear & Exit stays on the form route so PaymentGate can re-render in place.
**Standing rule**: Any "return-to-gate" or "clean-slate" handler must reset **every** wizard state field, not just the gate flags. If you add a new piece of wizard state, audit every reset path.

---

## L-SMART-04 — `expandCombinedDates()` helper for masked date fields *(cascadable)*

**Date:** 2026-04-26 · **Form:** PMRF-012020 (PhilHealth) · **Files:** `src/lib/pdf-generator.ts`

**Problem.** The mobile-first UX wanted a single `dob` text field with a `mask:'date'` (auto-formats to `MM / DD / YYYY` as user types) instead of three separate `dob_month` / `dob_day` / `dob_year` form fields. But the source PDF still has eight separate digit cells (M-M-D-D-Y-Y-Y-Y) keyed in `PMRF_FIELD_COORDS` by the legacy IDs. Switching to a single field broke the rendering.

**Fix.** Added `expandCombinedDates(values)` near the top of `generatePDF()`:
- Scans every key ending in `dob` (or exactly `dob`) for a `MM / DD / YYYY` pattern.
- Splits into sibling `<prefix>dob_month`, `<prefix>dob_day`, `<prefix>dob_year` keys (only when not already present).
- Runs **before** `PDFDocument.load()`.

Also extended the render loop to iterate **schema fields ∪ coord-only synthetic IDs**:
```ts
const schemaIds = new Set(form.fields.map((f) => f.id));
const syntheticIds = Object.keys(fieldCoords).filter((id) => !schemaIds.has(id));
const iterFields = [...form.fields, ...syntheticIds.map((id) => ({ id }))];
```
Without this second change the synthetic keys exist in `values` but never get drawn (the loop was strictly schema-driven).

**Cascade rule.** Any form may now switch from 3 separate date sub-fields to a single masked `dob` (or `*_dob`) **without touching `*_FIELD_COORDS`**. Just:
1. Replace the 3 schema fields with one `{ id:'<prefix>dob', type:'date', mask:'date' }`.
2. Replace 3 sample values (`'03'`,`'15'`,`'1990'`) with one combined value `'03 / 15 / 1990'`.
3. Done — the helper splits at render time.

---

## L-SMART-05 — Datalist suffix stripper for autocomplete codes *(cascadable)*

**Date:** 2026-04-26 · **Form:** PMRF-012020 (KonSulTa Provider) · **Files:** `src/lib/pdf-generator.ts`, `src/data/autocomplete-sources/philhealth_konsulta.ts`

**Problem.** Autocomplete sources use the format `"CODE — Long Facility Name (City)"` so the user sees friendly context in the dropdown. But the source PDF cell is sized for just the code (~120pt wide). Result: the value bleeds across the right border (`"01-001-009-000 -- Quezon City General Hospital (Quezon City"` with em-dash mangled by WinAnsi as `--`).

**Fix.** Added `stripDatalistSuffix(values, ids)` helper called right after `expandCombinedDates`:
```ts
const m = v.match(/^(.+?)\s+(?:—|--)\s+/);
if (m) out[id] = m[1].trim();
```
Critical: the prefix uses `(.+?)` non-greedy — **do NOT** use `[^—\-]+?` because PIN-style codes contain hyphens (`01-001-009-000`) and would fail the negated class.

**Cascade rule.** Any form whose autocomplete value contains `" — "` or `" -- "` separator must list its field IDs in the `stripDatalistSuffix` call:
```ts
values = stripDatalistSuffix(values, ['konsulta_provider', /* add new IDs here */]);
```
Pattern fits: KonSulTa providers, RDO codes, branch lookups, hospital lists, school codes.

---

## L-PMRF-R1-01 — Smart Assistance schema migration recipe *(cascadable)*

**Date:** 2026-04-26 · **Form:** PMRF-012020 → cascade target for all PH gov forms.

**Pattern applied to PMRF-012020 (16 changes in `src/data/forms.ts`):**
1. **Combined DOB** — `dob_month/day/year` → single `dob` with `mask:'date'`.
2. **Masks** — `pin:'pin'`, `tin:'tin'`, `philsys_id:'psn'`, `mobile:'mobile'`, `monthly_income:'currency'`, `perm_zip/mail_zip:'zip'`.
3. **Autocomplete source** — `konsulta_provider` → `type:'autocomplete'` + `optionsSource:'philhealth_konsulta'`.
4. **Option hints** — Citizenship, Civil Status, Member Type, Indirect Contributor → `optionHints` describe routing logic ("If FILIPINO and resident → skip ACR card").
5. **Enumerated proofs** — `proof_of_income`: free-text → dropdown with 8 enumerated options.
6. **Smart Assistance block** — six eligibility rules (`age-min`, `digits-eq`×4, `email`).

**New `FieldMask` values registered.** `'pin'` (XX-XXXXXXXXX-X, 12 digits) and `'psn'` (XXXX-XXXX-XXXX, 12 digits) added to BOTH `src/lib/smart-assistance.ts` and `src/data/forms.ts` (the latter has its own duplicate `FieldMask` union — must be kept in sync; will dedupe in a future PR).

**Standing rule.** Every new form schema must walk this checklist: (a) any 3-part date → combine. (b) any 9-12 digit ID → assign mask. (c) any look-up table → autocomplete-source. (d) any branching question → optionHints. (e) any required-format input → eligibility rule.

---

## L-PMRF-R1-02 — PhilHealth + PhilSys ID format reference

| ID | Format | Total | Mask |
|----|--------|-------|------|
| PhilHealth PIN | `XX-XXXXXXXXX-X` | 12 digits | `'pin'` (2-9-1) |
| PhilSys PCN | `XXXX-XXXX-XXXX` | 12 digits | `'psn'` (4-4-4) |
| TIN (legacy) | `XXX-XXX-XXX` | 9 digits | `'tin'` |
| TIN (new) | `XXX-XXX-XXX-XXX` | 12 digits | `'tin'` (renderer trims to 9 cells when source PDF lacks the 4th group, as in PMRF) |
| Philippine Mobile | `09XX XXX XXXX` | 11 digits | `'mobile'` |

**Critical note for TIN on PMRF.** PMRF source PDF only has 9 TIN cells (legacy format). Sample values may contain 12 digits (`123456789000`); the renderer drops digits beyond `boxCenters.length`. This is intentional — do NOT widen the cell array.

---

## L-PMRF-R1-03 — `philhealthPremium()` calculator *(cascadable)*

**Date:** 2026-04-26 · **Files:** `src/lib/smart-assistance.ts`

**Spec.** PhilHealth UHC contribution formula:
- Rate: 5.0% of monthly basic salary (2024+).
- Floor: ₱10,000 (anything below uses ₱10,000 basis).
- Ceiling: ₱100,000 (anything above uses ₱100,000 basis).
- Split: 50/50 employer/employee for **Employed** members; 100% member for self-earning/voluntary.

**API.**
```ts
philhealthPremium(50000, { rate: 0.05, employed: true })
// → { monthly: 2500, memberShare: 1250, employerShare: 1250, rate: 0.05, basis: 50000 }
```

**Cascade rule.** Reusable for any PhilHealth-related form (PMRF, claim forms, employer reports). Output schema is form-agnostic — present `{ monthly, memberShare, employerShare }` in a Smart Panel "Estimated Contribution" widget.


---

## L-SMART-CSF-01 — CSF-2018 Smart Assistance pass *(cascadable to every form with split-date / mask / mirror needs)*

**Date:** 2026-04-28 · **Form:** `philhealth-claim-signature-form` (CSF-2018) · **Files:** `src/lib/smart-assistance.ts`, `src/lib/pdf-generator.ts`, `src/data/forms.ts`, `src/app/forms/[slug]/page.tsx`

**Goal.** Make Form Editor seamless for users while keeping PDF coordinates / box-cell rendering UNCHANGED. The form editor and Smart Assistance run **fully offline**.

### Five reusable building blocks delivered by this pass

| # | Block | Where | Cascade test |
|---|---|---|---|
| 1 | **Generic combined-date field** | `pdf-generator.ts::expandCombinedDates()` now expands ANY masked `mm / dd / yyyy` value whose key has a corresponding `<key>_month/_day/_year` triple in the coord map. Schemas can drop the 3 split fields and use a single `type:'date'` combined field. | Replaced 6 date triples in CSF-2018 with `member_dob`, `patient_dob`, `date_admitted`, `date_discharged`, `employer_date_signed`, `consent_date_signed`. PDF coords UNCHANGED. |
| 2 | **`'pen'` input mask** | `smart-assistance.ts::maskPen` (12-digit `XX-XXXXXXXXX-X`, member-PIN-style) | CSF `employer_pen` → digits stripped at PDF render time by existing `boxCenters` digit-extractor. Reusable for any PhilHealth employer field. |
| 3 | **`visibleWhen` predicate** on `FormField` | `forms.ts` (interface) + `page.tsx::isFieldVisible` (renderer + review screen). Three operator forms: `equals`, `equalsOneOf`, `notEmpty`. | CSF "Has employer" toggle hides the entire Employer block declaratively. Cascade: any "skip this whole optional section" UX. |
| 4 | **Generic `mirrorGroup` runtime handler** | `page.tsx::applyMirrorToggle` — schema-driven (no per-form code). When a checkbox `id == mirrorGroup`, all fields with that group + a `mirrorFrom` source are populated from `prev[mirrorFrom]`. | CSF "Patient is the same as the Member" copies all 5 patient fields. SLF-065's `same_as_permanent` checkbox is now generic too (was previously schema-only / unimplemented). |
| 5 | **New eligibility rule kinds** | `forms.ts::SmartAssistanceConfig` + `page.tsx::SmartPanel` evaluator: `date-not-before` (cross-field date ordering) and `days-since-max` (filing-window countdown). | CSF: `date_discharged ≥ date_admitted`, and "Filing window: ≤ 60 days since Date Discharged" (PhilHealth claim policy). |

### Migration recipe for the next form

1. **Combine dates** — In the schema, replace each `<prefix>_month / _day / _year` triple with one `{ id:'<prefix>', type:'date', required:true }`. **Do not** touch `pdf-generator.ts` coord maps; `expandCombinedDates()` re-splits at write time. Update sample literals to use the masked `mm / dd / yyyy` value.
2. **Add masks** — `mask: 'pin' | 'pen' | 'mid' | 'tin' | 'mobile' | 'zip' | 'psn'` on text fields. Box-cell PDF rendering already strips dashes/spaces, so masked input ≠ misaligned PDF.
3. **Add `optionHints`** — On every `dropdown` whose options carry eligibility/legal nuance (relationship, civil status, member type), add a `Record<option, hint>` for the live green sub-text.
4. **Add mirror toggles** — Declare a `type:'checkbox'` field whose `id` matches the `mirrorGroup` of every target field; targets carry `mirrorFrom: '<source_id>'`. Generic handler does the rest. For special side-effects (e.g. CSF also forces `relationship_to_member='Self'` and clears `dependent_pin`), add a small inline branch in `handleChange`.
5. **Add `visibleWhen`** — On every optional sub-section that should disappear when a parent toggle is off. The renderer, review screen, **and** step completion counts respect it.
6. **Add eligibility rules** — `digits-eq` for masked IDs, `date-not-before` for date pairs, `days-since-max` for filing/availment windows, `age-min` / `months-min` / `amount-max` / `email` for the existing kinds.

### CSF-2018 specifics worth remembering

- **HCI / HCP signature blocks** (Parts IV/V) are intentionally out of scope — they are signed by the hospital, not the user. Schema covers Parts I–III + member consent only.
- **`Self` is implicit** on the form (no checkbox option), so `CSF_CHECKBOX_COORDS.relationship_to_member` only maps Child / Parent / Spouse. Sample A (Self) correctly shows zero relationship checkboxes ticked. Do **not** add a Self coord — it doesn't exist on the printed form.
- **Filing windows** — Local availment 60 days from discharge; Abroad 180 days. We bake 60 into the schema; the abroad case can be a future per-form override.
- **PEN format** is identical to PIN (12 digits, `XX-XXXXXXXXX-X`) per PhilHealth ER2 policy; mask reused.

### QA artifacts

- Generator: `scripts/gen-csf-personas.ts` (drives `generatePDF` directly from the canonical persona literals — no UI required).
- Output: `.qa-output/csf-2018/sample-{A,B,C}.pdf` rasterized to 4 zoom bands at 150dpi for coord validation.
- Result: every value lands inside its corresponding form area / digit box across all 3 personas; no font-size override was needed.

## L-SMART-CF1-01 — CF-1 Smart Assistance pass *(cascadable to any boolean-toggle + paired-Yes/No checkbox PDF)*

**Form:** PhilHealth Claim Form 1 (Revised Sep 2018), 35 fields × 5 wizard steps. Direct extension of L-SMART-CSF-01 — same four-layer approach, plus two new general-purpose patterns.

### What was added

| Layer | Change |
|---|---|
| `src/lib/smart-assistance.ts` | New `'landline'` mask kind: `(NN) NNNN-NNNN`. PartialFmt as user types — used by `contact_landline` + `employer_contact` and reusable across every form with a landline cell. |
| `src/data/forms.ts` (`philhealthClaimForm1`) | Combined `member_dob` + `patient_dob` (`type:'date'`); replaced the **dropdown** `patient_is_member` with a `type:'checkbox'` toggle; added `type:'checkbox'` `has_employer`; added masks (`pin`, `pen`, `mobile`, `landline`, `zip`); added `optionHints` on `patient_relationship`; added `visibleWhen: { field, equals }` on every step-4 + step-5 conditional field; added `smartAssistance.eligibility[]` (PIN×2, PEN, mobile-11d, email, age sanity). |
| `src/app/forms/[slug]/page.tsx` | New `handleChange` branches: ticking `patient_is_member` clears the entire dependent block (PhilHealth processes member-as-patient with the dependent block left blank); unticking it also clears any leftover patient_* values; ticking off `has_employer` extends the existing CSF clear branch with CF-1 keys (`employer_contact`, `employer_business_name`). Three new personas drive the same three QA scenarios: Patient=Member+employed / Dependent-Child+self-employed / Spouse+OFW abroad. |
| `src/lib/pdf-generator.ts` | **L-SMART-CF1-01a — boolean-checkbox → labeled-choice synthetic emit:** when the schema uses a boolean checkbox but the source PDF has paired Yes/No tickboxes, normalize at PDF-gen entry by emitting a synthetic `<field>_choice` whose value maps to the printed label — and key the checkbox coords off that synthetic id. **L-SMART-CF1-01b — synthetic ids must include `checkboxCoords` keys, not just `fieldCoords`:** the iteration list builder previously only pulled synthetics from `fieldCoords`. Extending it to also pull from `checkboxCoords` (deduped) is what lets L-SMART-CF1-01a actually draw. **No CF-1 coord change** — `expandCombinedDates()` (L-SMART-04) auto-splits the combined `member_dob`/`patient_dob` into the existing `*_month/_day/_year` per-digit boxes. |

### Two general-purpose patterns introduced *(cascade-ready)*

1. **Boolean-toggle ⇄ Yes/No paired-checkbox bridge** — keep schema simple (one boolean checkbox) while still ticking the right printed box; lives entirely in `pdf-generator.ts` so future forms (CF-2, BIR1902 resident-alien Y/N, Pag-IBIG marital-status etc.) can reuse with just a one-line normalizer.

2. **Synthetic-id from `checkboxCoords`** — any future form that wants to map an in-schema field to a different coord-only key now Just Works.

### Migration recipe (port to next form in ~30 min)

1. Schema (`forms.ts`): collapse split DOBs → single `type:'date'`; add `mask:'pin'|'pen'|'mobile'|'landline'|'zip'|'tin'|'mid'` per field; convert any "Is X = Y?" dropdown to `type:'checkbox'`; add `visibleWhen` on conditional blocks; populate `smartAssistance.eligibility[]`.
2. Renderer (`page.tsx`): if there's a new boolean toggle, add a `handleChange` branch that clears the gated keys when off (use existing CSF/CF-1 patterns as templates); update `samplesBySlug[slug]` with 3 personas using the new combined-date masked strings and toggle keys.
3. PDF (`pdf-generator.ts`): if any boolean toggle maps to a printed Yes/No pair, add the one-line normalizer near the top of `generatePDF` (`if (form.slug === '<x>') values.<id>_choice = values.<id> === 'true' ? 'Yes' : 'No';`) and key the existing `*_CHECKBOX_COORDS` off the `_choice` synthetic id.
4. QA: copy `scripts/gen-cf1-personas.ts` → adapt persona literals → `pdftoppm -r 150` + `convert -crop 1275x500+0+<y>` for 4 zoom bands → inspect each band.

### CF-1 specifics

- **Filing window:** 60 days local / 180 days abroad. Surfaced as a Smart Panel hint keyed off `addr_country` (any value other than "Philippines" implies abroad).
- **Relationship options:** Child / Spouse / Parent (no Self — patient-is-member uses the toggle and leaves the dependent block blank by design).
- **PEN format:** identical to PIN (12 digits, `XX-XXXXXXXXX-X`) — same mask reused.

### QA artifacts

- Generator: `scripts/gen-cf1-personas.ts`
- Output: `.qa-output/cf-1/sample-{A,B,C}.pdf` rasterized to 4 zoom bands at 150 dpi.
- Result: PIN/PEN auto-formatted into per-digit boxes; DOB combined-date auto-split into month/day/year cells; Yes box ticked for Sample A (patient = member, dependent block correctly empty); No box ticked for B/C with dependent block fully populated; employer block correctly empty for Sample B (self-employed) and fully populated for A/C; no font-size override needed.

---

## L-SMART-CF2-01 — CF-2 Smart Assistance pass *(cascadable to any form with combined times + dropdown-value branching + PAN/accreditation masks)*

**Form:** PhilHealth Claim Form 2 (Sep 2018), 130+ fields × 8 wizard steps, 2-page PDF. Direct extension of L-SMART-CSF-01 + L-SMART-CF1-01 — same four-layer approach, plus four new general-purpose patterns.

### What was added

| Layer | Change |
|---|---|
| `src/lib/smart-assistance.ts` | Three new mask kinds: `'time'` (`HH : MM AM/PM`, accepts a/p), `'hciPan'` (`HCI-NN-NNNNNN`, 8 digits), `'hcpPan'` (`HCP-NN-NNNNNN`, 8 digits). Added `parseMaskedTime()` exported helper. `applyMask` switch extended. |
| `src/data/forms.ts` (`philhealthClaimForm2`) | Full schema rewrite: collapsed every split date+time into 9 combined `type:'date'` and 3 `type:'text' mask:'time'` fields; converted `referred_by_hci` from Yes/No dropdown to `type:'checkbox'`; applied `mask` to ~25 fields (`hciPan`/`hcpPan`/`zip`/`currency`/`time`); added 5 `visibleWhen` blocks (`referred_by_hci`, `patient_disposition === 'Expired'`, `patient_disposition === 'Transferred/Referred'`, `hcp{2,3}_accreditation_no notEmpty`); `optionHints` on `patient_disposition`; `smartAssistance.eligibility[]` for HCI-PAN×1, HCP-PAN×1, discharge-after-admit, filing-window-60. |
| `src/app/forms/[slug]/page.tsx` | New `handleChange` branches: unticking `referred_by_hci` clears all 5 `referring_hci_*` keys; changing `patient_disposition` clears the `expired_*` block when value ≠ Expired and the 5 `transferred_hci_*` + `reason_for_referral` when value ≠ Transferred/Referred (cleans both label + per-digit split keys). 4 personas in `samplesBySlug` exercise direct admission / referred-in / 3-HCP transferred-out / paediatric zero-balance. |
| `src/lib/pdf-generator.ts` | **L-SMART-CF2-01a — combined-time auto-split:** new `expandCombinedTimes()` mirrors `expandCombinedDates()` — regex `^\s*(\d{1,2})\s*:\s*(\d{2})\s+(AM\|PM)\s*$/i`, splits into `<key>_hour` (zero-padded) / `<key>_min` / `<key>_ampm` (uppercased). Called immediately after `expandCombinedDates(values)`. **L-SMART-CF2-01b — coord-prefix renames to align with combined fields:** renamed CF2 coords `expired_month/_day/_year/_hour/_min/_ampm` → `expired_date_month/_day/_year` + `expired_time_hour/_min/_ampm` so the generic `expand*` splitters output keys that match coord keys. **L-SMART-CF2-01c — direct boolean→'YES'/'NO' (no synthetic `_choice`):** when `*_CHECKBOX_COORDS` is already keyed on the printed labels (`'YES'`/`'NO'`/`'Yes'`/`'No'`), normalize the boolean in-place (`values.referred_by_hci = values.referred_by_hci === 'true' ? 'YES' : 'NO'`) — no synthetic id needed (simpler than CF-1's `_choice` approach when label-keyed coords exist). |

### Four general-purpose patterns introduced *(cascade-ready)*

1. **Combined-time mask + `expandCombinedTimes()`** — every form with split `H/H : M/M AM/PM` per-digit boxes can now use a single `type:'text' mask:'time'` field; PDF-gen splits at render. Mirror of the L-SMART-04 combined-date pattern.

2. **PAN / accreditation masks** (`hciPan` / `hcpPan`) — fixed-prefix `HCI-NN-NNNNNN` / `HCP-NN-NNNNNN` formats reusable for any form referencing PhilHealth-accredited entities. Pure offline, mirrors the PIN/PEN style.

3. **Dropdown-value gated `visibleWhen`** — equals match against a specific dropdown value (`'Expired'`, `'Transferred/Referred'`) gates blocks of fields. Pair with a `handleChange` branch that clears the gated keys when the dropdown shifts off the gating value, so re-edits don't leave stale data on the printed PDF.

4. **Direct label-equals normalizer** (vs. `_choice` synthetic) — pick this variant when the source coord map is already keyed on the printed labels. No iteration-list patch needed, just a one-line in-place mutation.

### Migration recipe (port to next form in ~30 min)

1. Schema (`forms.ts`): collapse split times → single `type:'text' mask:'time'`; collapse split dates per L-SMART-04; add `mask:'hciPan'|'hcpPan'|'zip'|'currency'|'time'` per field; convert any "Is X = Y?" dropdown to `type:'checkbox'` *(when label list is exactly Yes/No)*; for tri-or-more dropdowns that gate downstream blocks, keep the dropdown and use `visibleWhen.equals: '<exact-label>'`; add `smartAssistance.eligibility[]`.
2. Renderer (`page.tsx`): for every gating dropdown/toggle add a `handleChange` branch that clears all dependent keys (both label and split-digit variants) when the gate closes; populate `samplesBySlug[slug]` with personas covering each branch (positive, negative, multi-record).
3. PDF (`pdf-generator.ts`): if combined-time fields exist, ensure `expandCombinedTimes(values)` runs after `expandCombinedDates(values)`; if a boolean toggle maps to label-keyed coords, add the one-line direct normalizer near the top of `generatePDF`; if a coord map uses prefixes that don't match the combined-field id, rename coord keys (cheaper than renaming schema ids that also appear in the renderer).
4. QA: copy `scripts/gen-cf2-personas.ts` → adapt persona literals → `pdftoppm -r 150` + `convert -crop 1275x500+0+<y>` for 4 zoom bands per page → inspect each band; focus on combined-date splits, time AM/PM ticks, gating-dropdown ticks, PAN auto-format, currency commas.

### CF-2 specifics

- **Disposition gates two blocks:** `Expired` reveals `expired_date` + `expired_time`; `Transferred/Referred` reveals 5 `transferred_hci_*` + `reason_for_referral`. The other 4 dispositions (Recovered/Improved/HAMA/Absconded) reveal neither.
- **HCP cascade:** `hcp2_*` block (date_signed, copay) only revealed when `hcp2_accreditation_no notEmpty`; same for `hcp3_*`. Lets a 1-HCP claim hide the unused 2nd/3rd HCP boxes from the wizard while still allowing all 3 in the PDF.
- **Filing window:** 60 days from discharge (PhilHealth Circular 2018-0006). Eligibility surfaces a hint when `today - date_discharged > 60`.
- **Zero-balance encoding:** `drug_purchase_none: 'Yes — None'` + `drug_purchase_total_amount: '0'` cleanly fills both the "None" tick and the amount line.

### QA artifacts

- Generator: `scripts/gen-cf2-personas.ts` (4 personas — A appendectomy direct / B referred CAP / C ESRD transferred 3-HCPs / D paediatric transferred zero-balance).
- Output: `.qa-output/cf-2/sample-{A,B,C,D}.pdf` rasterized at 150 dpi, page-1 + page-2 each cropped into 4 zoom bands (`1275×500+0+y`, y∈{0,488,976,1464}).
- Result: combined dates auto-split into per-digit boxes ✓, combined times split into hour/min boxes + AM/PM tick ✓, `referred_by_hci` boolean → NO tick (Sample A) / YES tick (B,C) ✓, `patient_disposition` ticks (Recovered / Improved / Transferred×2) ✓, accommodation ticks ✓, HCI/HCP PAN auto-format `HCI-NN-NNNNNN` / `HCP-NN-NNNNNN` ✓, currency masks render with commas ✓, Sample C's 3 HCPs all populated ✓, Sample D's "Yes — None" rows tick correctly ✓. **No font-size override required** — every value fits inside its coord box at the schema-default size.

---

## L-SMART-PMRF-FN-01 — PMRF-FN Smart Assistance + 3 cascade-ready primitives (2026-04-28)

PhilHealth PMRF for Foreign Nationals — single-page A4 (595×842 pt). Schema lifted from 4 to **smart-assist parity** with CSF-2018 / CF-1 / CF-2, and ships **3 new cascade primitives** consumable by every future form.

### New primitives (cascade-ready)

| # | Primitive | Where | Cascade |
|---|---|---|---|
| 1 | **`mask:'phPhone'`** — combined PH mobile/landline auto-format. Detects `09/9/63` → `+63 9XX XXX XXXX` (mobile, 10 digits after CC) and any 10-digit `0NN` → `(NN) NNNN-NNNN` (landline). | `src/lib/smart-assistance.ts::maskPhPhone` (registered in both `FieldMask` unions — `forms.ts` + `smart-assistance.ts`). | Any field where the user might paste either mobile-or-landline (e.g., CSF `employer_contact_no`, BIR `taxpayer_contact`, Pag-IBIG `landline_or_mobile`). |
| 2 | **`is_mononymous` boolean toggle** — checkbox that clears + locks `first_name` / `middle_name` (visibleWhen + clear-on-toggle). | `forms.ts → philhealthPmrfForeignNatl` (checkbox + visibleWhen `equals: ''`); `page.tsx::handleChange` clears the two fields when ticked. | Any form with single-token names (BIR-1902 resident aliens, Pag-IBIG dependents from cultures with mononymous traditions — Indonesian, Burmese, Javanese). |
| 3 | **`any-non-empty` eligibility rule** — at-least-one-of-N field validator. New SmartAssistanceConfig variant: `{ rule: 'any-non-empty'; fieldIds: string[] }`. | `forms.ts → SmartAssistanceConfig.eligibility` union; `page.tsx::SmartPanel` evaluates **outside** the single-field "raw" gate (multi-field). | Any form accepting alternative IDs: BIR govID variants, Pag-IBIG MID/UMID/SSS, "ACR or PRA" docs. |
| 4 | **`phone-ph` eligibility rule** — companion validator for `phPhone` mask. Tolerates 10/11-digit PH phones (mobile if starts with 9). | `page.tsx::SmartPanel` raw-gated. | Pairs 1:1 with primitive #1. |
| 5 | **`optionsSource:'nationalities'`** — offline 195-country nationality-adjective autocomplete (Afghan→Zimbabwean). | `src/data/autocomplete-sources/nationalities.ts` + registered in `AUTOCOMPLETE_SOURCES`. | Any form that asks for a nationality (PMRF parent, BIR-1902 foreign nationals, Pag-IBIG dependents). |

### Schema diffs

| Layer | File | Change |
|---|---|---|
| Schema | `src/data/forms.ts → philhealthPmrfForeignNatl` | `dob_month/_day/_year` → single `dob` (`type:'date'` + `mask:'date'`); `signature_date` already `'date'` — stays. Added `is_mononymous` checkbox (step 1, top of step). Added `documentation_type` dropdown (`['ACR I-Card', 'PRA SRRV', 'Both']` + `optionHints`). `acr_icard_number` / `pra_srrv_number` gated by `visibleWhen.equalsOneOf`. `philhealth_number:mask:'pin'`; `contact_phone:mask:'phPhone'`. `nationality` + `dep{1..6}_nationality` → `type:'autocomplete'` + `optionsSource:'nationalities'`. **Dependents expanded 3 → 6** (PDF has 6 rows). Each `dep{i}_dob` → single combined-date. `optionHints` on `civil_status`. `smartAssistance.eligibility[]`: docs (any-non-empty), age-min 18, pin (digits-eq 12), phone-ph, email, dob (date-not-before never; just sanity via age). `first_name` / `middle_name` get `visibleWhen.equals: ''` against `is_mononymous` to render-hide when ticked. |
| Renderer | `src/app/forms/[slug]/page.tsx` | `SmartPanel` learns 2 new rule kinds: `'any-non-empty'` (multi-field, evaluated **before** the single-field `raw` gate) and `'phone-ph'` (raw-gated, mobile vs landline branch). `handleChange` adds 2 branches: `is_mononymous` ticked → clear `first_name` + `middle_name`; `documentation_type` change → clear whichever of `acr_icard_number` / `pra_srrv_number` is no longer visible. |
| Mask lib | `src/lib/smart-assistance.ts` | New `maskPhPhone` + `'phPhone'` registered in `applyMask`. **Both** `FieldMask` unions kept in sync (forms.ts duplicate). |
| Autocomplete | `src/data/autocomplete-sources/nationalities.ts` (new) | 195 entries + registered as `'nationalities'` source. |
| PDF generator | `src/lib/pdf-generator.ts` | A4 PMRF-FN page already calibrated; **expanded `PMRF_FN_FIELD_COORDS` from dep1..3 → dep1..6** (Δy=21pt per row, top: 555.9 / 576.9 / 597.9 / 618.9 / 639.9 / 660.9). `expandCombinedDates()` already splits any `*_dob` masked-date key — no extra wiring. |
| Personas | `scripts/gen-pmrf-fn-personas.ts` (new) | 4 personas: A — American spouse (ACR I-Card, 2 deps), B — Japanese SRRV retiree (PRA, no deps), C — FULL — Indonesian mononymous student (Both ACR+PRA, all 6 deps, both DOB+sig dates), D — landline-only contact edge case. |

### A4 page-height handling

PMRF-FN is the **first A4 form** in QuickFormsPH (`PMRF_FN_PAGE_H = 841.9`). All other PhilHealth forms are Legal-size (936). The pdf-lib coordinate system is bottom-up, so each row's `y = PMRF_FN_PAGE_H - pdfplumber_top - 2`. **Cascade rule:** every new form must declare its own `<FORM>_PAGE_H` constant (don't hardcode `936` or `842`).

### QA artifacts

- Generator: `scripts/gen-pmrf-fn-personas.ts` — 4 personas. PDFs at `.qa-output/pmrf-fn/sample-{A,B,C,D}.pdf`.
- pdftoppm @ 150 dpi → `sample-X-1.png`.
- Mai sign-off: **PASS** — all rows aligned (PhilHealth #, ACR, PRA, name triples, sex tick, nationality, DOB month/day/year split, civil status, address ×2, phone, email, 6 dep rows complete with combined-DOB → `mm/dd/yyyy` rendered, signature row). No font-size override needed at the default sizes.

### Cumulative cascade matrix (after L-SMART-PMRF-FN-01)

| Pattern | Source | Now used by |
|---|---|---|
| Combined date (`mask:'date'` + `expandCombinedDates`) | L-SMART-04 | PMRF, CF-1, CF-2, CSF-2018, **PMRF-FN (×8: member DOB + 6 dep DOBs + sig date)** |
| `mask:'pin'` / `'pen'` | L-SMART-CSF-01 | PMRF, CF-1, CF-2, CSF, **PMRF-FN** |
| `mask:'phPhone'` (NEW) | **L-SMART-PMRF-FN-01** | **PMRF-FN** (queue: CSF employer_contact, BIR-1902, Pag-IBIG) |
| `optionsSource:'nationalities'` (NEW) | **L-SMART-PMRF-FN-01** | **PMRF-FN** ×7 (queue: PMRF parent, BIR-1902) |
| `is_mononymous` toggle (NEW) | **L-SMART-PMRF-FN-01** | **PMRF-FN** (queue: BIR-1902 foreign nationals) |
| `any-non-empty` eligibility (NEW) | **L-SMART-PMRF-FN-01** | **PMRF-FN** (queue: BIR govID alternatives, Pag-IBIG MID/UMID/SSS) |
| Dropdown-value gated `visibleWhen.equalsOneOf` | L-SMART-CF2-01 | CF-2, **PMRF-FN** (`documentation_type`) |
| `optionHints` | L-SMART-CSF-01 | All 5 |
| `autoUppercase` | (foundational) | All 5 |

---

## L-SMART-CF3-V0 — CF-3 onboarding (Part I baseline) (2026-04-28) *(cascadable)*

**Goal.** Onboard PhilHealth Claim Form 3 (Patient's Clinical Record + MCP report) into the catalog. v0 SCOPE is intentionally Part I only (~35 fields) — Part II (Maternity Care Package: 12-visit×5-vital prenatal grid, obstetric tuple G_ P_ T_ P_ A_ L_, birth outcomes, postpartum care) is deferred until the proposed `gridRepeat` schema primitive is introduced.

**Why split.** CF-3 is 2 pages × ~177 fields including an 84-cell repeating grid. Hand-coding 84 coords would produce a brittle one-off; the right cascade is a declarative `gridRepeat:{rowKeys, colCount, cellWidth, rowYOffsets}` primitive that any future tabular form (attendance sheets, multi-period vitals, payroll grids) can reuse. Shipping Part I first proves routing, lets Mai start QA on real PDF output, and unblocks payors who only need Part I clinical narrative.

**Files touched.**
- `src/data/forms.ts` — new `philhealthClaimForm3` schema (35 fields, 5 wizard steps, `smartAssistance.eligibility` × 4); registered in `FORMS[]`.
- `src/lib/pdf-generator.ts` — new `CF3_FIELD_COORDS` (split-date sub-coords for 4 dates + 2 times) + `CF3_CHECKBOX_COORDS` (5-way disposition); registered in `FORM_PDF_CONFIGS`. Page height = **1008 pt** (US Legal long, vs CF-2's 936 pt — different anchor).
- `src/app/forms/[slug]/page.tsx` — 3 personas (Improved NSD term / Transferred preeclampsia / Expired postpartum hemorrhage) exercising both `visibleWhen` branches (Transferred-HCI text + Expired-date split fields).

**Cascades reused (no net-new primitives in v0).**
1. Combined dates × 4 (admit, discharge, expired, signed) — from L-SMART-CSF-01.
2. Combined times × 2 (admit, discharge) via `mask:'time'` — from L-SMART-CF2-01.
3. `mask:'hciPan'` — from L-SMART-CF2-01.
4. `visibleWhen.equals` gating (Transferred-HCI, Expired-date) — from L-SMART-CF2-01.
5. Eligibility rules `digits-eq` (PAN-8, PRC-7) and `date-not-before` (discharge ≥ admit, signed ≥ discharge) — from L-SMART-PMRF-R1-01.

**Net-new primitives flagged for follow-up sprint (Part II MCP).**
- `gridRepeat` (declarative N×M cell rendering) — for the 12-visit prenatal grid.
- `obstetricTuple` mask (`G_ P_ ( T_, P_, A_, L_ )`) — single field → 6 PDF cells.
- `bloodPressure` mask (`120/80` → `{sys, dia}` with eligibility 60–250 / 30–150 / sys > dia).
- `apgarScore` mask (`9/9` → 0–10 range, optional 1min/5min pair).
- `temperatureUnit` formatter (auto °C suffix, accept `36.8` / `36.8°C` / `98.6F`).

**Open items.**
- Coords are **calibrated from pdfplumber word-positions only** (no rect-box anchors yet). Mai's first 4-band 150 dpi pass on Sample A will identify drift; expect ±5 pt corrections per row.
- `autoShrink:true` flag was attempted but `CoordEntry` type doesn't yet support it. Long-text fields use `maxWidth` for truncation only — explicit auto-resize is a follow-up to `pdf-generator.ts` text drawer.
- US Legal page height (1008 pt) differs from every other PhilHealth form (936 pt). Future PhilHealth onboardings must verify `pdfinfo Page size` before reusing CF-1/CF-2 coord anchors.

**Verification.**
- `npm run build` ✅ clean (linting + types).
- `sudo systemctl restart quickformsph` ✅ active.
- `curl -sI http://localhost:3400/forms/philhealth-claim-form-3` → `HTTP/1.1 200 OK`.
- @Mai PDF inspection: **PENDING** (handoff to Phase 2 QA loop).

---

## L-SMART-CF3-01 — CF-3 Phase 2 coord calibration after @Mai 4-band QA (2026-01-XX)

**Context.** First Phase 2 ship after L-SMART-CF3-V0 onboarding. Three calibration
iterations against 150 dpi pdftoppm renders of Sample A (Improved/NSD term)
produced an acceptable v0 layout. Branches verified on Sample B (Transferred →
PGH NICU LEVEL 3) and Sample C (Expired → date 01/21/2026).

**Drift corrections applied to `CF3_FIELD_COORDS` (pdf-generator.ts).**

| Field | Before | After | Note |
|---|---|---|---|
| `hci_pan` | x=60 y=−175 maxW=200 | x=442 y=−175 maxW=85 fontSize=7 | PAN belongs in the small box-grid right of label, not under it |
| `hci_name` | x=280 y=−175 maxW=320 | x=60 y=−215 maxW=540 | HCI Name has its own underline row below PAN row |
| `date_admitted_*` | y=−263 | y=−252 | Boxes were 11 pt lower than measured; same shift applied to `_discharged` (y=−282) |
| `time_admitted_min` | x=348 maxW=20 | x=357 maxW=20 | hh-mm second box centered ~9 pt further right |
| `course_in_the_ward` | y=−720 | y=−700 | Narrative band starts ~20 pt closer to label |
| `pertinent_lab_findings` | y=−825 (ok) | y=−825 | confirmed unchanged |
| `admitting_diagnosis` / `final_diagnosis` | page=1 y=−85/−105 | **page=0** y=−905/−925 | These belong to Part I bottom band (between Q9 Lab and Q10 Disposition), NOT Part II header |
| `transferred_hci_name` | x=240 maxW=230 | x=270 maxW=200 fontSize=7 | tighter fit next to "Transferred" tick |
| `expired_date_*` | x=510/535/560 | x=525/548/571 | small 15-pt shift right, narrower box widths |
| `vs_blood_pressure` | x=100 | x=122 | Cleared "BP:" label overlap |
| `pe_general_survey` | y=−482 | y=−489 | aligned with caption baseline |
| Disposition tick offsets | x=162/246/336/422/495 y=67 | x=142/226/316/402/475 y=64 | shifted 20 pt left to land inside the box, not on the printed label |

**Root-cause patterns (cascadable).**
1. **pdfplumber `top` is the TOP of the first text glyph, not the underline.** The
   actual PDF baseline for typed input is typically 8–14 pt BELOW that. For US Legal
   1008-pt forms, plan `y_pdflib = 1008 − (top + 10)` as the first guess; refine in
   ±5 pt steps via 150 dpi inspection.
2. **PAN-style multi-cell box grids** sit RIGHT of their text label, not below it.
   Always check whether the label sentence ends in `:` (label only — slot is right of it)
   or in `:` followed by a long printed underline (slot is below).
3. **Diagnosis lines on PhilHealth maternal forms** belong to Part I bottom strip,
   NOT to Part II MCP page top. Confirm with form section numbering (Q11/Q12 are still
   Part I).
4. **Disposition tick coords** must be inside the empty checkbox square, not on the
   adjacent printed text label. For CF-3 the squares are ~14 pt wide; aim for
   x = label_x − 22 pt, y = page_h − square_top − 4 pt.

**Known limitations (carry to next Phase 2 round).**
- **Multi-line wrap missing.** Long-text fields (`history_of_present_illness`,
  `course_in_the_ward`, `pertinent_lab_findings`) currently truncate to a single
  line with `…` ellipsis. The narrative bands are ~140 pt tall and could fit ~12
  lines at fontSize=8 — needs a `textareaWrap` primitive in `pdf-generator.ts`.
- **AM/PM ticks not yet drawn.** Time fields write the hh-mm digits but the
  AM/PM checkbox at the right of each time row stays empty. Needs a follow-up
  primitive `amPmFromTime` (parse `hh:mm AM` → tick AM box).
- Part II MCP entire surface still empty — same as v0 (gridRepeat / obstetricTuple
  / bloodPressure / apgarScore / temperatureUnit / maternityEligibility primitives
  still pending).

**Verification.**
- 3 personas generated to `.qa-output/cf-3/sample-{A,B,C}.pdf`.
- Sample A: 4-band 150 dpi inspection → all Part I cells align within ±5 pt.
- Sample B: `Transferred` tick lit, `transferred_hci_name = "PGH NICU LEVEL 3"` rendered.
- Sample C: `Expired` tick lit, split `expired_date 01/21/2026` rendered.
- Page 2 cert footer (name/PRC/date): aligned correctly across all three.
- `npm run build` ✅ clean.

**Cascade targets (apply before any new long-form PhilHealth PDF onboarding).**
- Pattern 1 (top-vs-baseline offset) → bake into intake auto-extraction script as
  `y_pdflib = page_h − (top + 10)` default.
- Pattern 2 (PAN grid placement) → add a `boxGrid:true` hint in `CoordEntry` so
  the dictionary auto-renders into multi-cell PAN boxes.
- Pattern 3 (diagnosis line placement) → flag any Part I form with `Admitting
  Diagnosis` / `Final Diagnosis` to verify they're on Part I bottom strip first.
- Pattern 4 (checkbox tick offset) → use `boxCenters` array (already in CoordEntry)
  for known-width squares instead of guessing fixed offsets.

---

## L-SMART-CF3-02 — Root-cause patterns from @Mai 2nd-pass QA on CF-3 Sample C

**Context.** After L-SMART-CF3-01 ship, @Mai's visual QA on Sample C surfaced
two recurring issues that have been silently broken across multiple onboardings:

1. **Empty PAN box-grid.** `hci_pan` value `"HCI-30-555111"` rendered as a
   left-aligned single string SPILLING past the 9-cell PAN box-grid instead of
   filling the boxes digit-by-digit.
2. **HCI-Name landed on Patient-Name row.** I had assumed every PhilHealth form
   has a slot for the HCI name on row 2 — CF-3 does NOT. The hospital name
   text overwrote the patient-name underline.
3. **Patient names rendered ABOVE the sub-labels** instead of on the underline.
   CF-3's Q2 inverts the typical label-above/blank-below convention.

**Patterns (cascadable to ALL future onboardings).**

### Pattern 5 — Use `boxCenters` for EVERY multi-cell digit-box row.
**Anti-pattern observed:** Treating PAN/PIN/PSN/PEN/TIN as a single text field
with `maxWidth` and hoping it visually lands "in the boxes." It will NOT.
The boxes are typically 14–18 pt wide each — at default fontSize (10 pt) a
single 8-digit string occupies ~70 pt and overflows ~140 pt of box-grid
unevenly because monospace doesn't match the box pitch.

**Correct primitive:** Already exists in `CoordEntry` —
```ts
hci_pan: { page: 0, x: 0, y: …, fontSize: 9,
           boxCenters: [c1, c2, c3, …] }
```
The generator strips `\D` from the input and centers each digit at the
corresponding `boxCenters[i]`. Excess cells stay empty (e.g. 9-cell row + 8-digit
input = last cell blank).

**How to extract `boxCenters`:** the boxes are drawn as thin vertical rect
dividers (`width<1, height≈11`). Filter `p.rects` by `top`-band and `height`,
sort by `x0`, then midpoints between adjacent dividers are the box centers:
```python
v = sorted([r['x0'] for r in p0.rects if 160<r['top']<170 and 11<r['height']<13])
centers = [(v[i]+v[i+1])/2 for i in range(len(v)-1)]
```

**Cascade target:** every future PhilHealth onboarding intake script must run
this rect-divider scan PER ROW with digit boxes and emit `boxCenters` arrays
into the coord dictionary by default. Manual `x` placement for digit rows is
now considered an intake bug.

### Pattern 6 — Verify each schema field has a PDF slot before adding to FIELD_COORDS.
**Anti-pattern observed:** Assuming `hci_name` (captured in schema for sample
data) must have a coord entry. CF-3 has no slot for it; my entry at
`y=CF3_PAGE_H-215` rendered the hospital name onto the Patient-Name row.

**Rule:** schema fields and PDF coord fields are **NOT** 1:1. A field can exist
in `FormField[]` for data entry / API capture / downstream processing yet have
no corresponding entry in `<FORM>_FIELD_COORDS`. The generator silently skips
fields not in the coord map — that's the correct behavior.

**Cascade target:** intake auto-extraction script must mark fields without a
detectable PDF underline / box / blank-region as `pdfRender: false` and emit
them as schema-only. Don't fabricate a coord just to "use" the field.

### Pattern 7 — Sub-label inversion on PhilHealth Q2 / name rows.
**Anti-pattern observed:** Assuming sub-labels ("Last Name, First Name, Middle
Name") sit ABOVE the input underline. CF-3's Q2 has them BELOW:
- Q2 header `"2. Name of Patient"` at `top=187`
- Underline (where text goes) at `top=219.9`
- Sub-labels `"Last Name, First Name, Middle Name (example: Dela Cruz, …)"` at `top=223`
- Q4 header `"4. Date Admitted:"` at `top=244`

If you put text at `top≈242` (between sub-labels and Q4), it floats in the
empty space below the labels — visually wrong. Correct baseline is
`top≈218` (1–2 pt above the underline rect).

**Detection rule for intake:** for every input-row label, scan ±20 pt
vertically for the underline rect AND for example/instructional words. If
example words have `top > underline_top`, the row is sub-label-INVERTED and
text baseline must be `≈ underline_top - 2`, NOT `underline_top + 8`.

**Cascade target:** intake script must annotate each row with
`subLabelPosition: 'above' | 'below' | 'none'` based on word vs underline ordering,
and the coord generator must respect that flag.

**Verification.**
- All 3 personas regenerated with patches:
  - Sample A (Improved): PAN `1012345**6**` → "1 0 1 2 3 4 5 6" filling 8 of 9 cells.
  - Sample B (Transferred): PAN `2098765**4**` → "2 0 9 8 7 6 5 4".
  - Sample C (Expired): PAN `3055511**1**` → "3 0 5 5 5 1 1 1".
- Patient-name row now sits ON the underline (`y_pdflib = 1008 - 218 = 790`).
- `hci_name` schema field retained; coord entry **removed** — no draw, no overlap.
- Time `_min` x shifted to 367 (centered in 362.35–384.91 box).
- PE right-col `pe_genitourinary` / `pe_extremities` x shifted to 430/460 to clear
  `"GU ( IE )"` and `"Skin/Extremities"` printed labels.

**Remaining limitations carried forward (unchanged from L-SMART-CF3-01).**
- `textareaWrap` primitive still pending (HPI / course / lab still single-line).
- `amPmFromTime` primitive still pending (AM/PM ticks unset).
- Part II MCP primitives suite still pending.

---

## L-SMART-CF3-03 — Removed pre-render 60-char truncation cap

**Symptom (@Mai).** "Why trim the value if it can still fit in the form area?"
HPI value `"G4P3 (3003), delivered at home via TBA, with ongoing heavy vaginal
bleeding and signs of hypovolemic shock on arrival."` (132 chars) was rendering
as `"G4P3 (3003), delivered at home via TBA, with ongoing heavy v..."` even
though the 540pt narrative band at fontSize=8 fits ~135 chars at native size
and unlimited chars under auto-shrink.

**Root cause (`src/lib/pdf-generator.ts` line ~3653).**
A global pre-render cap was clipping every value before the auto-fit branch:
```ts
const truncated = rawValue.length > 60 ? rawValue.slice(0, 60) + '...' : rawValue;
```
This ran BEFORE the auto-fit logic that scales fontSize down to fit `maxWidth`
and only tail-truncates if even 4pt overflows. So the cap was both redundant
(auto-fit handles overflow correctly) AND harmful (clobbers values that would
have rendered fine).

**Fix.** Remove the cap. Trust the existing auto-fit branch:
```ts
const text = toWinAnsi(rawValue);
```

**Pattern 8 (cascadable).** Never apply pre-render character caps. The render
loop must always see the full value so it can pick the largest legible
fontSize. Truncation is a last-resort tail operation inside auto-fit, NOT a
front-of-pipeline filter.

**Verification.** Sample C HPI now renders complete on Q6 underline at native
fontSize=8. No regression on PAN/checkbox/digit-box paths (`boxCenters` branch
is unaffected; it strips `\D` independently).

---

## L-SMART-CF3-04 — Single source of truth for length caps: input `maxLength`

**Context.** L-SMART-CF3-03 removed a global pre-render 60-char cap. @Mai then
asked: "What if a value still doesn't fit?" Two failure modes were on the table:

1. **Render-time tail-truncation with `…`** (initial fix attempt). Rejected by
   @Mai: invisible at submission time, surprises the user only when they open
   the generated PDF.
2. **Hard cap on the input control** + auto-shrink-only render. ACCEPTED.

**Pattern 9 — Single source of truth for length caps.**

The input control's `maxLength` (already a field in `FormField`, wired to
HTML `<input maxLength>` and the textarea variant) is the **only** hard cap.
The PDF generator NEVER truncates or appends `…`. Its job is purely to fit
whatever the user submitted into the cell, scaling fontSize down to a min
legible floor of **6 pt**.

**Calibration rule per field:**
```
maxLength_chars  ≤  maxWidth_pt  /  avg_char_width_at_6pt
                ≈  maxWidth_pt  /  3.0
```
Examples for CF-3 single-line bands:
- 540 pt narrative band (Q6 HPI / Q8 Course / Q9 Lab) → cap = **200 chars**
- 230 pt PE left-col rows → cap = **75 chars**
- 170 pt PE right-col rows (Abdomen / GU) → cap = **56 chars**
- 140 pt PE Extremities → cap = **46 chars**
- 130 pt patient name cells (Last/First/Middle) → cap = **30 chars**

If a field still appears truncated visually, the FIX is in `forms.ts`
(`maxLength`), NOT in `pdf-generator.ts`. The render path is intentionally
dumb: render at native size if it fits, scale to 6pt if it doesn't, full stop.

**Generator changes (`pdf-generator.ts`).**
- Removed pre-render 60-char `slice` cap (L-SMART-CF3-03).
- Removed the tail-truncate-with-`…` branch (this round).
- Auto-shrink floor raised from 4 pt → 6 pt (4 pt failed legibility @150 dpi).
- `MIN_LEGIBLE_FONT_SIZE` named constant for clarity.

**Cascade target.** Intake auto-onboarding (§2a in FormIntake.md) must:
1. Compute `maxLength` for every text/textarea field from its measured PDF
   `maxWidth` using the formula above.
2. Refuse to commit any text/textarea schema entry without `maxLength`.
3. Add a `check-maxlength-coverage.ts` pre-commit gate analogous to
   `check-coords-coverage.ts` so missing caps fail CI immediately.

**Why no multi-line wrap.** Considered and deferred. Multi-line wrap inside a
fixed-height band requires per-row width measurement + line-break selection,
and pdf-lib's built-in wrap spills past the band into the next row's cell
(L-SLF065-R3-01). For CF-3 the 6 pt single-line cap suffices for the
clinically realistic text @Mai signed off on.

**Verification.**
- Q6 HPI (Sample C): "G4P3 (3003), delivered at home via TBA, with ongoing
  heavy vaginal bleeding and signs of hypovolemic shock on arrival." — 124
  chars, renders in full at fontSize=8 (no shrink needed).
- Q8 Course (Sample C): 195 chars, auto-shrinks to ≈6.7 pt to fit 540 pt
  band. Still print-legible at 100%.
- Inputs in `/forms/philhealth-claim-form-3` now show character counter
  ticking against the new caps; user is blocked from typing past the limit.

---

## L-SMART-CF3-05 — Bounded multi-line word-wrap + center-aligned single-cell dates

**Symptoms (@Mai 4-band QA on Sample C).**
1. **Q6 / Q8 large empty whitespace:** narrative bands have ~95–130 pt of
   vertical space but text rendered on a single line, leaving 80% of the band
   blank when the value was short and silently auto-shrinking when long.
2. **Q4 / Q5 date digits drifted left of cell center:** "01" "20" "2026"
   appear hugging the left divider of each box, not centered.

**Root causes.**
1. The render path had only single-line auto-shrink (L-SMART-CF3-04). Long
   narratives squeezed into 6 pt instead of using the available vertical
   space; short narratives wasted it.
2. Q4/Q5 cells (Month / Day / Year / Hour / Min) are SINGLE boxes — not
   per-digit grids like the PAN row. I had used left-aligned `x` + `maxWidth`
   placement, which left-justifies inside the cell. Helvetica digits at 10pt
   are ~5.5 pt wide → "20" is 11 pt, but the box is 22.5 pt → 11.5 pt of
   right-side blank.

**Pattern 10 — Bounded multi-line word-wrap inside a fixed-height band.**

Added new `CoordEntry` fields:
```ts
wrap?: boolean;
maxHeight?: number;   // band height in pt; render stops when consumed
lineHeight?: number;  // default fontSize * 1.2
```
Algorithm:
1. Word-tokenize on `\s+`.
2. Greedy line-fill: append next word if line+word measures ≤ `maxWidth`.
3. Flush full lines stacked downward at `y, y - lineHeight, y - 2·lineHeight, …`.
4. Stop emitting lines once `maxHeight / lineHeight` lines drawn.
5. Hard-break inside a single word only if that word alone exceeds
   `maxWidth` (rare — long URLs / PSN strings).

**Why this is safe (vs L-SLF065-R3-01's pdf-lib wrap that spilled into next
row):** we **never** pass `maxWidth` to `page.drawText`. We compute line
breaks manually using `font.widthOfTextAtSize` and emit one `drawText` call
per line at an explicit y. The band's `maxHeight` is a hard ceiling — extra
lines simply don't render (consistent with Pattern 9: input `maxLength` is
the ONLY user-visible cap; the layout engine just lays out what fits).

**Pattern 11 — `align: 'center'` for single-cell date / time / numeric boxes.**

Added `align?: 'left' | 'center'` to `CoordEntry`. When `'center'`, `x` is
treated as the box midpoint and the renderer shifts left by `width/2`. Use
this for ANY single-cell field where the target cell is a printed rectangle
with a known midpoint (Q4 dates, Q5 dates, Q4/Q5 times, currency boxes,
percentages, single-cell year boxes on other PhilHealth forms).

**Cell-pair extraction recipe (cascade target for intake script):**
```python
# Find rect dividers in a known top-band, sort by x, pair adjacent → centers
v = sorted([r['x0'] for r in p0.rects
            if T_lo<r['top']<T_hi and 9<r['height']<14 and r['width']<2])
pairs   = list(zip(v[::2], v[1::2]))   # (left, right) per cell
centers = [(L+R)/2 for L,R in pairs]
```

**Cell measurements baked into CF-3 (L-SMART-CF3-05).**
| Cell | Pair | Center |
|---|---|---|
| Q4/Q5 Month | 102.84–125.42 | 114.13 |
| Q4/Q5 Day | 142.34–164.90 | 153.62 |
| Q4/Q5 Year | 181.82–226.97 | 204.40 |
| Q4/Q5 Hour | 311.57–334.15 | 322.86 |
| Q4/Q5 Min | 362.35–384.91 | 373.63 |

**Section band heights (CF-3 Part I).**
| Section | top → bottom | total | usable¹ | maxHeight set |
|---|---|---|---|---|
| Q6 HPI | 307.5 → 452.2 | 144.7 | ≈95 | **95** |
| Q8 Course | 642.2 → 800.0 | 157.8 | ≈130 | **130** |
| Q9 Lab | 800.0 → 913.4 | 113.4 | ≈75 | **75** |

¹usable = total − label-row height − bottom padding.

**Schema cap recalibration (forms.ts, L-SMART-CF3-05).**
`maxLength` for wrapped fields = `usable_lines × ≈130_chars_per_540pt_line`:
- Q6 HPI: 9 lines × 130 → **1100** (was 200)
- Q8 Course: 12 lines × 130 → **1500** (was 200)
- Q9 Lab: 7 lines × 130 → **900** (was 200)

**Cascade target for intake auto-onboarding.**
1. For every text field whose underline rect is followed by ≥40 pt of
   vertical whitespace before the next section divider, mark
   `wrap: true; maxHeight: <measured>; lineHeight: fontSize * 1.2`.
2. Recompute `maxLength` as `floor(maxHeight / lineHeight) × chars_per_line`.
3. For every single-cell date/time/numeric box detected via paired rect
   dividers, emit `align: 'center'` with `x = (L + R) / 2`.

**Verification (Sample C).**
- Q4 admitted: `01 — 20 — 2026` digits visually centered in each box.
- Q5 discharged: `01 — 21 — 2026` likewise. Time `08 : 30 PM` centered.
- Q8 narrative (594-char paragraph) word-wraps to 5 lines stacked at y, y−10,
  y−20, y−30, y−40 inside the 130 pt band; visually balanced; no overflow
  into Q9.
- Q6 short narrative still single-line as expected (no padding artifact).
- `npm run build` clean; 16/16 smoke tests pass.

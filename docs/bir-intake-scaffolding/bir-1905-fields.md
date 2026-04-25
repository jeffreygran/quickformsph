# BIR 1905 — Field Dictionary (Gate 1/2 draft)

**Source PDF:** `public/forms/BIR - 1905 October 2025 ENCS Final.pdf`
**Size:** 612 × 936 pt · **Pages:** 4
**Audience:** Application for Registration Information Update / Correction / Cancellation
(existing taxpayers modifying their BIR registration).
**Slug (proposed):** `bir-1905`

> **Status: DRAFT — Gate 1/2 only.** Largest checkbox density of the four forms
> (2,373 gray rects; most are per-sub-section tick options). Many fields are
> **mutually-exclusive sections** keyed off top-level tick boxes — schema must
> enforce that only one applies at a time.

## Part I — Taxpayer Information

- 1 `tin` — 12+3 digit boxes, existing TIN
- 2 `rdo_code` — text (3)
- 3 `contact_number` — tel
- 4 `registered_name` — text (individual or non-individual)

## Part II — Reason/Details of Registration Info Update/Correction

### 5 Replacement/Cancellation of FORM/S
- 5A `cor_replace` — checkbox (Certificate of Registration)
- 5B `atp_replace` — checkbox (Authority to Print Receipts/Invoices)
- 5C `tcl_replace` — checkbox (Tax Clearance Certificate of Liabilities)
- 5D `tin_card_replace` — checkbox (TIN Card)
- 5E `other_replace` — checkbox + `other_replace_specify` text

### Reason/Details (middle column)
- Lost/Damaged
- Change of Accredited Printer as Requested by the taxpayer
- Correction/Change/Update of Registration Information
- Others (specify) + text

### 6 Other Updates (right column)
- Closure of Business (proceed to 8)
- Change of Civil Status (proceed to 9)
- Register/Update of Books of Accounts (proceed to 10)
- Avail of 8% Income Tax Rate Option
- Others (specify)

### 7 Correction/Change/Update of Registration Information
Each of the following is a top-level section checkbox that unlocks subfields:

- **A. Update Registered Name/Trade Name**: Change in Registered Name / Change in Trade Name / Additional Trade Name + Old / New text fields
- **B. Change in Registered Address**: Transfer within same RDO / Transfer to another RDO + From (Old RDO) / To (New RDO) + New Address (10 sub-fields: unit, building, lot, street, subdivision, barangay, town, city, province, zip)
- **C. Change in Accounting Period (Non-Individual)**: From Calendar to Fiscal / From Fiscal to Another Fiscal / From Fiscal to Calendar + Accounting Start Month (text) + Effectivity Date (MM/DD/YYYY digit boxes)
- **D. Change/Add Registered Activity/Line of Business**: New Activity text + Effectivity Date digit boxes
- **E. Change Facility Type/Details**: Facility Code column + Facility Type tick matrix (PP/SP/WH/SR/GG/BT/RP + Others specify) — repeating F rows
- Additional sections on pages 2-4 to enumerate: `Update of Contact Type / Contact Info / Authorized Representative / Books of Accounts / Stamping Of Books / Tax Type / Tax Incentive / Decision to avail 8% Option / Accredited Tax Agent Info / Documentary Requirements`
- **8 Closure of Business** details
- **9 Change of Civil Status** details (new civil status + spouse info when newly married)
- **10 Register/Update of Books** matrix

## Pages 3–4

- Documentary Requirements extensive checklist (per reason code)
- Signature blocks (taxpayer + authorized rep)
- For BIR Use Only stamp area

## Gate 1 stats

- 4 pages, 20,596 chars, 17,787 rects. Near-1901 complexity.
- Extremely high checkbox density (2,373 gray rects, mostly tick matrices for
  tax type and facility type changes).
- Rect-pair pattern identical to 1901/1904.
- Estimated user-fillable fields: **110–140**. Complex conditional logic — the
  form is effectively 8+ sub-forms multiplexed behind the Part II top-level
  reason picker.

## Implementation risk register

1. **Conditional rendering** — most of the form is invisible unless its
   parent reason is ticked. The HTML wizard must branch early off `reason`,
   and the coord map needs EVERY conditional field (empty = blank) to
   prevent regressions when a user ticks a rarely-used section.
2. **Facility Type table (section E)** — repeating rows with Facility Code
   column + tick-matrix (8 columns) per row. Same `rows[]` extension
   required for 1901 LOB table applies here.
3. **"Proceed to" navigation hints** — the form tells users to jump (e.g.
   "Closure of Business (proceed to Number 8)"). The wizard UX should honour
   these or we confuse the user.
4. Page 1 "Old / New" address rows share a single cell pair each — verify
   with classify-cells.py.

## Recommended step structure

Step 1: Taxpayer Info (Part I) →
Step 2: Reason picker (Part II) →
Steps 3-N: One step per selected sub-section (conditionally rendered) →
Step Final: Declaration & Signature.

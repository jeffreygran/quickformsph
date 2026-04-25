# BIR 1902 — Field Dictionary (Gate 1/2 draft)

**Source PDF:** `public/forms/BIR - 1902 October 2025 (ENCS) Final.pdf`
**Size:** 612 × 936 pt · **Pages:** 2 (page 1 fillable; page 2 is employer signature + docs)
**Audience:** Individuals Earning Purely Compensation Income (Local and Alien Employee).
**Slug (proposed):** `bir-1902`

> **Status: DRAFT — Gate 1/2 only.**

## Part I — Taxpayer / Employee Information

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| — | `dln` | DLN | agency | — | SKIP |
| 1 | `registration_date` | BIR Registration Date (MM/DD/YYYY) | date boxes | no | AGENCY. SKIP. |
| 2 | `philsys_pcn` | PhilSys Card Number (PCN) | text | no | |
| — | `new_tin_to_be_issued` | New TIN to be issued | digit boxes | no | AGENCY (trailing `0 0 0 0 0`). SKIP. |
| 3 | `tin` | Taxpayer Identification Number (TIN) | text (12 digit boxes + 5 trailing agency 0) | yes* | For taxpayer with existing TIN |
| 4 | `rdo_code` | RDO Code | text (3) | no | AGENCY. SKIP. |
| 5 | `taxpayer_type` | Taxpayer Type | radio | yes | `local` / `resident_alien` / `special_non_resident_alien` |
| 6-a..d | `last_name`, `first_name`, `middle_name`, `name_suffix` | Taxpayer's Name | 4 text fields | yes | Suffix optional |
| 7 | `gender` | Gender | radio | yes | `male`/`female` |
| 8 | `civil_status` | Civil Status | radio | yes | `single`/`married`/`widow`/`legally_separated` |
| 9 | `date_of_birth` | Date of Birth (MM/DD/YYYY) | 8 digit boxes | yes | |
| 10 | `place_of_birth` | Place of Birth | text | yes | |
| 11 | `mothers_maiden_name` | Mother's Maiden Name (First, Middle, Last, Suffix) | text | yes | |
| 12 | `fathers_name` | Father's Name | text | yes | |
| 13 | `citizenship` | Citizenship | text | yes | |
| 14 | `other_citizenship` | Other Citizenship (if applicable) | text | no | |

## Part I continued — Addresses & Tax Classification

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 15-a..j | `local_*` (unit, building, lot, street, subdivision, barangay, town, city, province, zip) | Local Residence Address | 10 text fields | yes | ZIP is 4 digits |
| 16 | `foreign_address` | Foreign Address | text | conditional | |
| 17 | `municipality_code` | Municipality Code | text | no | AGENCY. SKIP. |
| 18 | `tax_type` | Tax Type | text | pre-filled | Appears to show "INCOME TAX" as default; treat as static or allow override |
| 19 | `form_type` | Form Type | text | pre-filled | "BIR Form No. 1700" default |
| 20 | `atc` | ATC | text | pre-filled | "II 011" default |
| 21-a..f | `id_type`, `id_number`, `id_effectivity`, `id_expiry`, `id_issuer`, `id_place_issue` | Identification Details | 6 text fields | yes | |
| 22 | `preferred_contact_type` | Preferred Contact Type | checkbox-multi | yes | `landline` / `fax` / `mobile` / `email` (with value fields) |
| 22-a..d | `contact_landline`, `contact_fax`, `contact_mobile`, `contact_email` | Contact values | text | conditional | At least one required |

## Part II — Spouse Information (if applicable)

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 23 | `spouse_employment_status` | Employment Status of Spouse | radio | conditional | Same 4 options as 1904 |
| 24-a..d | `spouse_last_name`, etc. | Spouse Name | 4 text | conditional | |
| 25 | `spouse_tin` | Spouse TIN | digit boxes (12+5 agency) | conditional | |
| 26 | `spouse_employer_name` | Spouse Employer's Name | text | conditional | |
| 27 | `spouse_employer_tin` | Spouse Employer's TIN | digit boxes (12) | conditional | |

## Page 2 (not detailed yet — needs second QA pass)

Expected: Employer Information (name, TIN, address, registered address, employer RDO), declaration signatures, documentary requirements checklist. Draft to be expanded in follow-up.

## Gate 1 specific observations

- 1902 has fewer checkboxes than 1904 (417 gray rects) but more digit-box rows (~33 rows of 5+ boxed cells each = heavy rect count).
- The row for "18 Tax Type | 19 Form Type | 20 ATC" displays **pre-printed default values** ("INCOME TAX", "BIR Form No. 1700", "II 011"). These are system-rendered; our overlay should NOT redraw them. Either:
  - (a) Add to SKIP_VALUES with the default string; or
  - (b) Leave the field unfillable in the schema and let the PDF show its default.
- Spouse section on 1902 is mandatory only when civil_status == married.

**Total estimated user-fillable field count: 55–70.**

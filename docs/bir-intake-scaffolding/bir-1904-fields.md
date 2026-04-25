# BIR 1904 — Field Dictionary (Gate 1/2 draft)

**Source PDF:** `public/forms/BIR - 1904 October 2025 ENCS Final.pdf`
**Size:** 612 × 936 pt · **Pages:** 2 (1 fillable, 1 continuation + static docs)
**Audience:** One-time taxpayers, EO 98 registrants, estate/trust registrations.
**Slug (proposed):** `bir-1904`

> **Status: DRAFT — Gate 1/2 only.** No coord map, no schema, no generation code.
> See `/docs/bir-intake-scaffolding/README.md` for intake plan.

## Part I — Taxpayer Information

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 1 | `date_registration` | Date of Registration (MM/DD/YYYY) | text (8 digit boxes) | no | AGENCY-ONLY ("To be filled out by BIR"). Add to SKIP_VALUES. |
| 2 | `philsys_pcn` | PhilSys Card Number (PCN) | text (boxed digits, 16) | no | If applicable |
| 3 | `rdo_code` | RDO Code | text (3 boxes) | no | AGENCY-ONLY. SKIP. |
| — | `tin_to_be_issued` | TIN to be issued | digit boxes | no | AGENCY-ONLY. Pre-filled `0 0 0 0 0` in trailing cells. SKIP. |
| 4 | `taxpayer_type` | Taxpayer Type (radio) | radio | yes | 6 options: `eo98_filipino`, `eo98_foreign`, `ott_filipino`, `ott_foreign`, `passive_income`, `estate` |
| 5 | `foreign_tin` | Foreign TIN (if any) | text | no | |
| 6 | `country_of_residence` | Country of Residence | text | no | Only if `eo98_foreign` |
| 7A-1 | `last_name` | Last Name (if Individual) | text | yes* | Required when individual taxpayer |
| 7A-2 | `first_name` | First Name | text | yes* | |
| 7A-3 | `middle_name` | Middle Name | text | no | |
| 7A-4 | `name_suffix` | Suffix | text | no | |
| 7A-5 | `nickname` | Nickname | text | no | |
| 7B | `registered_name` | Registered Name (if Non-Individual) | text | conditional | For estate/trust entity |
| 7C | `estate_trust_name` | Estate/Trust name | text | conditional | `If ESTATE, ESTATE of (Name)` OR `If TRUST, FAO: (Name)` |
| 8 | `date_of_birth` | Date of Birth/Organization (MM/DD/YYYY) | text (8 digit boxes) | yes | |
| 9 | `place_of_birth` | Place of Birth | text | yes | |
| 10-a | `local_unit` | Unit/Room/Floor/Building No. | text | yes | |
| 10-b | `local_building` | Building Name/Tower | text | no | |
| 10-c | `local_lot` | Lot/Block/Phase/House No. | text | no | |
| 10-d | `local_street` | Street Name | text | yes | |
| 10-e | `local_subdivision` | Subdivision/Village/Zone | text | no | |
| 10-f | `local_barangay` | Barangay | text | yes | |
| 10-g | `local_town` | Town/District | text | no | |
| 10-h | `local_city` | Municipality/City | text | yes | |
| 10-i | `local_province` | Province | text | yes | |
| 10-j | `local_zip` | ZIP Code | text (4 digits) | yes | |
| 11 | `foreign_address` | Principal Foreign Address | text | conditional | Full address on one line |
| 12 | `municipality_code` | Municipality Code | text | no | AGENCY-ONLY. SKIP. |
| 13 | `date_of_arrival` | Date of Arrival in PH (MM/DD/YYYY) | text (8 digit boxes) | conditional | Foreign nationals only |
| 14 | `gender` | Gender | radio | yes | `male` / `female` |
| 15 | `civil_status` | Civil Status | radio | yes | `single` / `married` / `widow` / `legally_separated` |
| 16 | `contact_number` | Contact Number (Landline/Mobile) | tel | yes | |
| 17 | `email` | Official Email Address | email | yes | |
| 18 | `mothers_name` | Mother's Maiden Name (First, Middle, Last, Suffix) | text | yes | |
| 19 | `fathers_name` | Father's Name | text | yes | |
| 20-a..d | `id_type`, `id_number`, `id_effectivity`, `id_expiry` | Identification Details | 4 text fields | yes | Dates MM/DD/YYYY in digit boxes |

## Part II — Spouse Information

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 21 | `spouse_employment_status` | Employment Status of Spouse | radio | conditional | `unemployed` / `employed_local` / `employed_abroad` / `business` |
| 22 | `spouse_name` | Spouse Name (Last, First, Middle, Suffix) | text | conditional | |
| 23 | `spouse_tin` | Spouse TIN | text (boxed 12+5) | conditional | Trailing 5 boxes pre-filled `0` — agency field, SKIP those 5 |
| 24 | `spouse_employer_name` | Spouse Employer's Name | text | conditional | |
| 25 | `spouse_employer_tin` | Spouse Employer's TIN | text (boxed 12) | conditional | |

## Part III — Transaction Details

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 26 | `purpose_of_tin` | Purpose of TIN Application | checkbox-multi or radio | yes | 10 options A–J |
| 26-J-other | `purpose_other_specify` | Others (specify) | text | conditional | When option J selected |

Purpose options: `A dealings_banks`, `B dealings_gov`, `C tax_treaty_relief`, `D shares_of_stock`, `E real_property_capital`, `F real_property_ordinary`, `G donation_property`, `H transfer_by_succession`, `I first_time_jobseeker`, `J other`.

## Part IV — Withholding Agent / Accredited Tax Agent Information

| # | id | label | type | required | notes |
|---|----|-------|------|----------|-------|
| 27 | `wa_tin` | Withholding Agent TIN | text (boxed 12+3) | conditional | |
| 28 | `wa_rdo_code` | Withholding Agent RDO Code | text (3) | conditional | |
| 29 | `wa_name` | Withholding Agent/Tax Agent Name | text | conditional | |
| 30 | `wa_address` | Registered Address (Page 2) | text | conditional | |
| 30A | `wa_zip` | ZIP Code | text (4) | conditional | |
| 31 | `wa_contact` | Contact Number | tel | conditional | |
| 32 | `wa_email` | Official Email Address | email | conditional | |

## Signatures / system fields (NOT in schema)

- Taxpayer/Authorized Rep signature (Page 2) — system, never auto-filled.
- Title/Position of Signatory — text, may be fillable. Mark as optional.
- Stamp of BIR Receiving Office — agency-only.
- Documentary Requirements checklist checkboxes on page 2 — agency-only.

## SKIP_VALUES candidates

```
'date_registration', 'rdo_code', 'tin_to_be_issued', 'municipality_code',
'spouse_tin_agency_tail'  (5 trailing pre-filled 0 boxes),
# plus conditionals: foreign_tin, country_of_residence, date_of_arrival,
# spouse_*, wa_* that render blank when absent.
```

## Gate 1 rect-pattern notes specific to 1904

- Every text cell is rendered as an **outer bevel rect** (`h≈14-20`, `ns=0.749`) + **inner fill rect** (`h≈10`, `ns=0.749`). The outer rect is what to use for positioning; treat `cell_top = outer.top`, `cell_bottom = outer.bottom`.
- Digit boxes (single char) have `h≈10, w≈14`, ns=0.749 with 3-4pt vertical dividers between them.
- Pre-filled "agency only" digit cells have `ns=1.0` (pure white fill) and contain a literal `0` char at their centre — **these must go to SKIP_VALUES** and `cx` must not appear in any boxCenters array.
- Checkbox rects are `h≈10-13, w≈11-14`, ns=0.749. Radio and checkbox on this form share identical geometry.

**Total estimated user-fillable field count: 55–60** (including every address sub-cell and digit-group as one logical field).

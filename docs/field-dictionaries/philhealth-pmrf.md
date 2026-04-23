# Field Dictionary — PhilHealth Member Registration Form

> Authoritative reference for PMRF-012020. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | PhilHealth Member Registration Form |
| **Agency** | PhilHealth |
| **Form Code / Version** | PMRF-012020 (UHC v.1 January 2020) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-pmrf` |
| **Source PDF** | `public/forms/PhilHealth - pmrf_012020.pdf` |
| **API** | `POST /api/generate` body `{slug:"philhealth-pmrf", values:{…}}` |
| **Field Count** | 89 |
| **Steps / Sections** | 5 |

**Purpose:** Register as a new PhilHealth member or update your existing member record.
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
| S1 | Personal Info | 16 fields |
| S2 | Family Names | 6 fields |
| S3 | Address & Contact | 22 fields |
| S4 | Dependents | 40 fields |
| S5 | Member Type | 5 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `pin` | Personal Info | PhilHealth Identification Number (PIN) | Text | Yes | inputMode=numeric | — | e.g., 12-345-678-9012 |
| `purpose` | Personal Info | Purpose | Dropdown | Yes | 2 options | — |  |
| `konsulta_provider` | Personal Info | Preferred KonSulTa Provider | Text | No |  | — | e.g., 12-345-678-9012 |
| `last_name` | Personal Info | Last Name | Text | Yes | UPPERCASE | — | e.g., DELA CRUZ |
| `first_name` | Personal Info | First Name | Text | Yes | UPPERCASE | — | e.g., JUAN ANDRES |
| `middle_name` | Personal Info | Middle Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `name_ext` | Personal Info | Name Extension | Dropdown | No | 6 options | — |  |
| `dob_month` | Personal Info | Date of Birth — Month | Dropdown | Yes | 12 options | — |  |
| `dob_day` | Personal Info | Date of Birth — Day | Dropdown | Yes | 31 options | — |  |
| `dob_year` | Personal Info | Date of Birth — Year | Text | Yes | inputMode=numeric | 4 | e.g., 1990 |
| `place_of_birth` | Personal Info | Place of Birth | Text | Yes |  | — | e.g., Quezon City, Metro Manila |
| `sex` | Personal Info | Sex | Dropdown | Yes | 2 options | — |  |
| `civil_status` | Personal Info | Civil Status | Dropdown | Yes | 5 options | — |  |
| `citizenship` | Personal Info | Citizenship | Dropdown | Yes | 3 options | — |  |
| `philsys_id` | Personal Info | PhilSys ID Number | Text | No | inputMode=numeric | — | e.g., 1234-5678901-2 |
| `tin` | Personal Info | Tax Payer Identification Number (TIN) | Text | No | inputMode=numeric | — | e.g., 123-456-789-000 |
| `mother_last_name` | Family Names | Mother's Maiden Last Name | Text | Yes | UPPERCASE | — | e.g., REYES |
| `mother_first_name` | Family Names | Mother's First Name | Text | Yes | UPPERCASE | — | e.g., MARIA |
| `mother_middle_name` | Family Names | Mother's Middle Name | Text | No | UPPERCASE | — | e.g., GARCIA |
| `spouse_last_name` | Family Names | Spouse's Last Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `spouse_first_name` | Family Names | Spouse's First Name | Text | No | UPPERCASE | — | e.g., ANA |
| `spouse_middle_name` | Family Names | Spouse's Middle Name | Text | No | UPPERCASE | — | e.g., LIRA |
| `perm_unit` | Address & Contact | Unit/Room No./Floor | Text | No |  | — | e.g., Unit 4B |
| `perm_building` | Address & Contact | Building Name | Text | No |  | — | e.g., Sunrise Tower |
| `perm_lot` | Address & Contact | Lot/Block/Phase/House Number | Text | No |  | — | e.g., Lot 12 Block 5 |
| `perm_street` | Address & Contact | Street Name | Text | Yes |  | — | e.g., Rizal Street |
| `perm_subdivision` | Address & Contact | Subdivision | Text | No |  | — | e.g., Loyola Grand Villas |
| `perm_barangay` | Address & Contact | Barangay | Text | Yes |  | — | e.g., Brgy. San Jose |
| `perm_city` | Address & Contact | Municipality/City | Text | Yes |  | — | e.g., Quezon City |
| `perm_province` | Address & Contact | Province/State/Country | Dropdown | Yes | 84 options | — |  |
| `perm_zip` | Address & Contact | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `mobile` | Address & Contact | Mobile Number | Text (phone) | Yes | inputMode=tel | — | 09XX-XXX-XXXX |
| `home_phone` | Address & Contact | Home Phone Number | Text (phone) | No |  | — | (02) XXXX-XXXX |
| `email` | Address & Contact | Email Address | Text (email) | No |  | — | your@email.com |
| `mail_same_as_above` | Address & Contact | Mailing Address same as Permanent Address | Checkbox | No |  | — |  |
| `mail_unit` | Address & Contact | Mailing — Unit/Room No./Floor | Text | No |  | — | e.g., Unit 4B |
| `mail_building` | Address & Contact | Mailing — Building Name | Text | No |  | — | e.g., Sunrise Tower |
| `mail_lot` | Address & Contact | Mailing — Lot/Block/Phase/House Number | Text | No |  | — | e.g., Lot 12 Block 5 |
| `mail_street` | Address & Contact | Mailing — Street Name | Text | No |  | — | e.g., Rizal Street |
| `mail_subdivision` | Address & Contact | Mailing — Subdivision | Text | No |  | — | e.g., Loyola Grand Villas |
| `mail_barangay` | Address & Contact | Mailing — Barangay | Text | No |  | — | e.g., Brgy. San Jose |
| `mail_city` | Address & Contact | Mailing — Municipality/City | Text | No |  | — | e.g., Quezon City |
| `mail_province` | Address & Contact | Mailing — Province/State/Country | Text | No |  | — | e.g., Metro Manila or Abroad |
| `mail_zip` | Address & Contact | Mailing — ZIP Code | Text | No | inputMode=numeric | 4 | 1100 |
| `dep1_last_name` | Dependents | Dependent 1 — Last Name | Text | No |  | — | Last name |
| `dep1_first_name` | Dependents | Dependent 1 — First Name | Text | No |  | — | First name |
| `dep1_name_ext` | Dependents | Dependent 1 — Name Extension | Text | No |  | — | Jr./Sr./II |
| `dep1_middle_name` | Dependents | Dependent 1 — Middle Name | Text | No |  | — | Middle name |
| `dep1_relationship` | Dependents | Dependent 1 — Relationship | Text | No |  | — | e.g., Spouse, Child |
| `dep1_dob` | Dependents | Dependent 1 — Date of Birth | Text | No |  | — | mm-dd-yyyy |
| `dep1_citizenship` | Dependents | Dependent 1 — Citizenship | Text | No |  | — | e.g., Filipino |
| `dep1_no_middle_name` | Dependents | Dependent 1 — No Middle Name | Checkbox | No |  | — |  |
| `dep1_mononym` | Dependents | Dependent 1 — Mononym | Checkbox | No |  | — |  |
| `dep1_disability` | Dependents | Dependent 1 — Permanent Disability | Checkbox | No |  | — |  |
| `dep2_last_name` | Dependents | Dependent 2 — Last Name | Text | No |  | — | Last name |
| `dep2_first_name` | Dependents | Dependent 2 — First Name | Text | No |  | — | First name |
| `dep2_name_ext` | Dependents | Dependent 2 — Name Extension | Text | No |  | — | Jr./Sr./II |
| `dep2_middle_name` | Dependents | Dependent 2 — Middle Name | Text | No |  | — | Middle name |
| `dep2_relationship` | Dependents | Dependent 2 — Relationship | Text | No |  | — | e.g., Spouse, Child |
| `dep2_dob` | Dependents | Dependent 2 — Date of Birth | Text | No |  | — | mm-dd-yyyy |
| `dep2_citizenship` | Dependents | Dependent 2 — Citizenship | Text | No |  | — | e.g., Filipino |
| `dep2_no_middle_name` | Dependents | Dependent 2 — No Middle Name | Checkbox | No |  | — |  |
| `dep2_mononym` | Dependents | Dependent 2 — Mononym | Checkbox | No |  | — |  |
| `dep2_disability` | Dependents | Dependent 2 — Permanent Disability | Checkbox | No |  | — |  |
| `dep3_last_name` | Dependents | Dependent 3 — Last Name | Text | No |  | — | Last name |
| `dep3_first_name` | Dependents | Dependent 3 — First Name | Text | No |  | — | First name |
| `dep3_name_ext` | Dependents | Dependent 3 — Name Extension | Text | No |  | — | Jr./Sr./II |
| `dep3_middle_name` | Dependents | Dependent 3 — Middle Name | Text | No |  | — | Middle name |
| `dep3_relationship` | Dependents | Dependent 3 — Relationship | Text | No |  | — | e.g., Spouse, Child |
| `dep3_dob` | Dependents | Dependent 3 — Date of Birth | Text | No |  | — | mm-dd-yyyy |
| `dep3_citizenship` | Dependents | Dependent 3 — Citizenship | Text | No |  | — | e.g., Filipino |
| `dep3_no_middle_name` | Dependents | Dependent 3 — No Middle Name | Checkbox | No |  | — |  |
| `dep3_mononym` | Dependents | Dependent 3 — Mononym | Checkbox | No |  | — |  |
| `dep3_disability` | Dependents | Dependent 3 — Permanent Disability | Checkbox | No |  | — |  |
| `dep4_last_name` | Dependents | Dependent 4 — Last Name | Text | No |  | — | Last name |
| `dep4_first_name` | Dependents | Dependent 4 — First Name | Text | No |  | — | First name |
| `dep4_name_ext` | Dependents | Dependent 4 — Name Extension | Text | No |  | — | Jr./Sr./II |
| `dep4_middle_name` | Dependents | Dependent 4 — Middle Name | Text | No |  | — | Middle name |
| `dep4_relationship` | Dependents | Dependent 4 — Relationship | Text | No |  | — | e.g., Spouse, Child |
| `dep4_dob` | Dependents | Dependent 4 — Date of Birth | Text | No |  | — | mm-dd-yyyy |
| `dep4_citizenship` | Dependents | Dependent 4 — Citizenship | Text | No |  | — | e.g., Filipino |
| `dep4_no_middle_name` | Dependents | Dependent 4 — No Middle Name | Checkbox | No |  | — |  |
| `dep4_mononym` | Dependents | Dependent 4 — Mononym | Checkbox | No |  | — |  |
| `dep4_disability` | Dependents | Dependent 4 — Permanent Disability | Checkbox | No |  | — |  |
| `member_type` | Member Type | Direct Contributor | Dropdown | No | 12 options | — |  |
| `indirect_contributor` | Member Type | Indirect Contributor | Dropdown | No | 11 options | — |  |
| `profession` | Member Type | Profession | Text | No |  | — | e.g., Nurse, Engineer |
| `monthly_income` | Member Type | Monthly Income (PHP) | Number | No | inputMode=numeric | — | e.g., 15000 |
| `proof_of_income` | Member Type | Proof of Income | Text | No |  | — | e.g., Certificate of Employment |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`purpose` — Purpose** (dropdown)

| Option | Value |
|---|---|
| Registration | `Registration` |
| Updating/Amendment | `Updating/Amendment` |

**`name_ext` — Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`dob_month` — Date of Birth — Month** (dropdown)

| Option | Value |
|---|---|
| 01 | `01` |
| 02 | `02` |
| 03 | `03` |
| 04 | `04` |
| 05 | `05` |
| 06 | `06` |
| 07 | `07` |
| 08 | `08` |
| 09 | `09` |
| 10 | `10` |
| 11 | `11` |
| 12 | `12` |

**`dob_day` — Date of Birth — Day** (dropdown)

| Option | Value |
|---|---|
| 01 | `01` |
| 02 | `02` |
| 03 | `03` |
| 04 | `04` |
| 05 | `05` |
| 06 | `06` |
| 07 | `07` |
| 08 | `08` |
| 09 | `09` |
| 10 | `10` |
| 11 | `11` |
| 12 | `12` |
| 13 | `13` |
| 14 | `14` |
| 15 | `15` |
| 16 | `16` |
| 17 | `17` |
| 18 | `18` |
| 19 | `19` |
| 20 | `20` |
| 21 | `21` |
| 22 | `22` |
| 23 | `23` |
| 24 | `24` |
| 25 | `25` |
| 26 | `26` |
| 27 | `27` |
| 28 | `28` |
| 29 | `29` |
| 30 | `30` |
| 31 | `31` |

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
| Widow/er | `Widow/er` |
| Annulled | `Annulled` |
| Legally Separated | `Legally Separated` |

**`citizenship` — Citizenship** (dropdown)

| Option | Value |
|---|---|
| Filipino | `Filipino` |
| Dual Citizen | `Dual Citizen` |
| Foreign National | `Foreign National` |

**`perm_province` — Province/State/Country** (dropdown)

| Option | Value |
|---|---|
| Metro Manila (NCR) | `Metro Manila (NCR)` |
| Abra | `Abra` |
| Agusan del Norte | `Agusan del Norte` |
| Agusan del Sur | `Agusan del Sur` |
| Aklan | `Aklan` |
| Albay | `Albay` |
| Antique | `Antique` |
| Apayao | `Apayao` |
| Aurora | `Aurora` |
| Basilan | `Basilan` |
| Bataan | `Bataan` |
| Batanes | `Batanes` |
| Batangas | `Batangas` |
| Benguet | `Benguet` |
| Biliran | `Biliran` |
| Bohol | `Bohol` |
| Bukidnon | `Bukidnon` |
| Bulacan | `Bulacan` |
| Cagayan | `Cagayan` |
| Camarines Norte | `Camarines Norte` |
| Camarines Sur | `Camarines Sur` |
| Camiguin | `Camiguin` |
| Capiz | `Capiz` |
| Catanduanes | `Catanduanes` |
| Cavite | `Cavite` |
| Cebu | `Cebu` |
| Cotabato | `Cotabato` |
| Davao de Oro | `Davao de Oro` |
| Davao del Norte | `Davao del Norte` |
| Davao del Sur | `Davao del Sur` |
| Davao Occidental | `Davao Occidental` |
| Davao Oriental | `Davao Oriental` |
| Dinagat Islands | `Dinagat Islands` |
| Eastern Samar | `Eastern Samar` |
| Guimaras | `Guimaras` |
| Ifugao | `Ifugao` |
| Ilocos Norte | `Ilocos Norte` |
| Ilocos Sur | `Ilocos Sur` |
| Iloilo | `Iloilo` |
| Isabela | `Isabela` |
| Kalinga | `Kalinga` |
| La Union | `La Union` |
| Laguna | `Laguna` |
| Lanao del Norte | `Lanao del Norte` |
| Lanao del Sur | `Lanao del Sur` |
| Leyte | `Leyte` |
| Maguindanao del Norte | `Maguindanao del Norte` |
| Maguindanao del Sur | `Maguindanao del Sur` |
| Marinduque | `Marinduque` |
| Masbate | `Masbate` |
| Misamis Occidental | `Misamis Occidental` |
| Misamis Oriental | `Misamis Oriental` |
| Mountain Province | `Mountain Province` |
| Negros Occidental | `Negros Occidental` |
| Negros Oriental | `Negros Oriental` |
| Northern Samar | `Northern Samar` |
| Nueva Ecija | `Nueva Ecija` |
| Nueva Vizcaya | `Nueva Vizcaya` |
| Occidental Mindoro | `Occidental Mindoro` |
| Oriental Mindoro | `Oriental Mindoro` |
| Palawan | `Palawan` |
| Pampanga | `Pampanga` |
| Pangasinan | `Pangasinan` |
| Quezon | `Quezon` |
| Quirino | `Quirino` |
| Rizal | `Rizal` |
| Romblon | `Romblon` |
| Samar | `Samar` |
| Sarangani | `Sarangani` |
| Siquijor | `Siquijor` |
| Sorsogon | `Sorsogon` |
| South Cotabato | `South Cotabato` |
| Southern Leyte | `Southern Leyte` |
| Sultan Kudarat | `Sultan Kudarat` |
| Sulu | `Sulu` |
| Surigao del Norte | `Surigao del Norte` |
| Surigao del Sur | `Surigao del Sur` |
| Tarlac | `Tarlac` |
| Tawi-Tawi | `Tawi-Tawi` |
| Zambales | `Zambales` |
| Zamboanga del Norte | `Zamboanga del Norte` |
| Zamboanga del Sur | `Zamboanga del Sur` |
| Zamboanga Sibugay | `Zamboanga Sibugay` |
| Abroad | `Abroad` |

**`member_type` — Direct Contributor** (dropdown)

| Option | Value |
|---|---|
|  | `` |
| Employed Private | `Employed Private` |
| Employed Government | `Employed Government` |
| Professional Practitioner | `Professional Practitioner` |
| Self-Earning Individual | `Self-Earning Individual` |
| Kasambahay | `Kasambahay` |
| Family Driver | `Family Driver` |
| Migrant Worker (Land-Based) | `Migrant Worker (Land-Based)` |
| Migrant Worker (Sea-Based) | `Migrant Worker (Sea-Based)` |
| Lifetime Member | `Lifetime Member` |
| Filipinos with Dual Citizenship / Living Abroad | `Filipinos with Dual Citizenship / Living Abroad` |
| Foreign National | `Foreign National` |

**`indirect_contributor` — Indirect Contributor** (dropdown)

| Option | Value |
|---|---|
|  | `` |
| Listahanan | `Listahanan` |
| 4Ps/MCCT | `4Ps/MCCT` |
| Senior Citizen | `Senior Citizen` |
| PAMANA | `PAMANA` |
| KIA/KIPO | `KIA/KIPO` |
| Bangsamoro/Normalization | `Bangsamoro/Normalization` |
| LGU-sponsored | `LGU-sponsored` |
| NGA-sponsored | `NGA-sponsored` |
| Private-sponsored | `Private-sponsored` |
| Person with Disability | `Person with Disability` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 19

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `dep1_citizenship` | 0 | 461 | 274.00 | 7 | 32 | ✓ |
| `dep1_dob` | 0 | 416 | 274.00 | 7 | 41 | ✓ |
| `dep1_first_name` | 0 | 123 | 274.00 | 8 | 109 | ✓ |
| `dep1_last_name` | 0 | 20 | 274.00 | 8 | 101 | ✓ |
| `dep1_middle_name` | 0 | 267 | 274.00 | 8 | 100 | ✓ |
| `dep1_name_ext` | 0 | 236 | 274.00 | 7 | 27 | ✓ |
| `dep1_relationship` | 0 | 371 | 274.00 | 7 | 41 | ✓ |
| `dep2_citizenship` | 0 | 461 | 256.00 | 7 | 32 | ✓ |
| `dep2_dob` | 0 | 416 | 256.00 | 7 | 41 | ✓ |
| `dep2_first_name` | 0 | 123 | 256.00 | 8 | 109 | ✓ |
| `dep2_last_name` | 0 | 20 | 256.00 | 8 | 101 | ✓ |
| `dep2_middle_name` | 0 | 267 | 256.00 | 8 | 100 | ✓ |
| `dep2_name_ext` | 0 | 236 | 256.00 | 7 | 27 | ✓ |
| `dep2_relationship` | 0 | 371 | 256.00 | 7 | 41 | ✓ |
| `dep3_citizenship` | 0 | 461 | 238.00 | 7 | 32 | ✓ |
| `dep3_dob` | 0 | 416 | 238.00 | 7 | 41 | ✓ |
| `dep3_first_name` | 0 | 123 | 238.00 | 8 | 109 | ✓ |
| `dep3_last_name` | 0 | 20 | 238.00 | 8 | 101 | ✓ |
| `dep3_middle_name` | 0 | 267 | 238.00 | 8 | 100 | ✓ |
| `dep3_name_ext` | 0 | 236 | 238.00 | 7 | 27 | ✓ |
| `dep3_relationship` | 0 | 371 | 238.00 | 7 | 41 | ✓ |
| `dep4_citizenship` | 0 | 461 | 220.00 | 7 | 32 | ✓ |
| `dep4_dob` | 0 | 416 | 220.00 | 7 | 41 | ✓ |
| `dep4_first_name` | 0 | 123 | 220.00 | 8 | 109 | ✓ |
| `dep4_last_name` | 0 | 20 | 220.00 | 8 | 101 | ✓ |
| `dep4_middle_name` | 0 | 267 | 220.00 | 8 | 100 | ✓ |
| `dep4_name_ext` | 0 | 236 | 220.00 | 7 | 27 | ✓ |
| `dep4_relationship` | 0 | 371 | 220.00 | 7 | 41 | ✓ |
| `dob_day` | 0 | 0 | 547.00 | 11 | — | ✓ |
| `dob_month` | 0 | 0 | 547.00 | 11 | — | ✓ |
| `dob_year` | 0 | 0 | 547.00 | 11 | — | ✓ |
| `email` | 0 | 406 | 344.00 | undefined | 162 | ✓ |
| `first_name` | 0 | 220 | 624.00 | undefined | 122 | ✓ |
| `home_phone` | 0 | 406 | 437.00 | undefined | 162 | ✓ |
| `konsulta_provider` | 0 | 357 | 686.00 | undefined | 207 | ✓ |
| `last_name` | 0 | 90 | 624.00 | undefined | 122 | ✓ |
| `mail_barangay` | 0 | 88 | 351.00 | undefined | 63 | ✓ |
| `mail_building` | 0 | 99 | 370.00 | undefined | 57 | ✓ |
| `mail_city` | 0 | 157 | 351.00 | undefined | 62 | ✓ |
| `mail_lot` | 0 | 160 | 370.00 | undefined | 130 | ✓ |
| `mail_province` | 0 | 225 | 351.00 | undefined | 127 | ✓ |
| `mail_street` | 0 | 298 | 370.00 | undefined | 95 | ✓ |
| `mail_subdivision` | 0 | 22 | 351.00 | undefined | 60 | ✓ |
| `mail_unit` | 0 | 22 | 370.00 | undefined | 73 | ✓ |
| `mail_zip` | 0 | 359 | 351.00 | undefined | 33 | ✓ |
| `middle_name` | 0 | 392 | 624.00 | undefined | 120 | ✓ |
| `mobile` | 0 | 406 | 398.00 | undefined | 162 | ✓ |
| `monthly_income` | 0 | 197 | 40.00 | undefined | 82 | ✓ |
| `mother_first_name` | 0 | 220 | 602.00 | undefined | 122 | ✓ |
| `mother_last_name` | 0 | 90 | 602.00 | undefined | 122 | ✓ |
| `mother_middle_name` | 0 | 392 | 602.00 | undefined | 120 | ✓ |
| `name_ext` | 0 | 350 | 624.00 | undefined | 33 | ✓ |
| `perm_barangay` | 0 | 88 | 415.00 | undefined | 63 | ✓ |
| `perm_building` | 0 | 99 | 433.00 | undefined | 57 | ✓ |
| `perm_city` | 0 | 157 | 415.00 | undefined | 62 | ✓ |
| `perm_lot` | 0 | 160 | 433.00 | undefined | 130 | ✓ |
| `perm_province` | 0 | 225 | 415.00 | undefined | 127 | ✓ |
| `perm_street` | 0 | 298 | 433.00 | undefined | 95 | ✓ |
| `perm_subdivision` | 0 | 22 | 415.00 | undefined | 60 | ✓ |
| `perm_unit` | 0 | 22 | 433.00 | undefined | 73 | ✓ |
| `perm_zip` | 0 | 359 | 415.00 | undefined | 33 | ✓ |
| `philsys_id` | 0 | 0 | 540.00 | 9 | — | ✓ |
| `pin` | 0 | 0 | 762.00 | 9 | — | ✓ |
| `place_of_birth` | 0 | 163 | 547.00 | 10 | 192 | ✓ |
| `profession` | 0 | 22 | 40.00 | undefined | 168 | ✓ |
| `proof_of_income` | 0 | 287 | 40.00 | undefined | 87 | ✓ |
| `spouse_first_name` | 0 | 220 | 579.00 | undefined | 122 | ✓ |
| `spouse_last_name` | 0 | 90 | 579.00 | undefined | 122 | ✓ |
| `spouse_middle_name` | 0 | 392 | 579.00 | undefined | 120 | ✓ |
| `tin` | 0 | 0 | 500.00 | 9 | — | ✓ |

**Skip values (treated as blank):**

- `name_ext`: `N/A`
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

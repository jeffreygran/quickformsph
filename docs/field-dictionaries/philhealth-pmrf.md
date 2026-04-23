# Field Dictionary — PhilHealth Member Registration Form

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | PhilHealth Member Registration Form |
| **Agency** | PhilHealth |
| **Form Code / Version** | PMRF-012020 (UHC v.1 January 2020) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-pmrf` |
| **Source PDF Location** | `public/forms/PhilHealth - pmrf_012020.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"philhealth-pmrf", values:{…}}` |
| **Field Count** | 89 |
| **Steps / Sections** | 5 |

**Purpose:** Register as a new PhilHealth member or update your existing member record.

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
| S1 | Personal Info | — | step 1, 16 fields |
| S2 | Family Names | — | step 2, 6 fields |
| S3 | Address & Contact | — | step 3, 22 fields |
| S4 | Dependents | — | step 4, 40 fields |
| S5 | Member Type | — | step 5, 5 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| pin | Personal Info | PhilHealth Identification Number (PIN) | Text (short) | Yes | Yes | inputMode=numeric | — | Maybe | — | e.g., 12-345-678-9012 |  |
| purpose | Personal Info | Purpose | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| konsulta_provider | Personal Info | Preferred KonSulTa Provider | Text (short) | No | Yes |  | — | — | — | e.g., 12-345-678-9012 |  |
| last_name | Personal Info | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., DELA CRUZ |  |
| first_name | Personal Info | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., JUAN ANDRES |  |
| middle_name | Personal Info | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., SANTOS |  |
| name_ext | Personal Info | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| dob_month | Personal Info | Date of Birth — Month | Dropdown | Yes | Yes | options(12) | — | — | — |  |  |
| dob_day | Personal Info | Date of Birth — Day | Dropdown | Yes | Yes | options(31) | — | — | — |  |  |
| dob_year | Personal Info | Date of Birth — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | e.g., 1990 |  |
| place_of_birth | Personal Info | Place of Birth | Text (short) | Yes | Yes |  | — | — | — | e.g., Quezon City, Metro Manila |  |
| sex | Personal Info | Sex | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| civil_status | Personal Info | Civil Status | Dropdown | Yes | Yes | options(5) | — | — | — |  |  |
| citizenship | Personal Info | Citizenship | Dropdown | Yes | Yes | options(3) | — | — | — |  |  |
| philsys_id | Personal Info | PhilSys ID Number | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 1234-5678901-2 |  |
| tin | Personal Info | Tax Payer Identification Number (TIN) | Text (short) | No | Yes | inputMode=numeric | — | Maybe | — | e.g., 123-456-789-000 |  |
| mother_last_name | Family Names | Mother's Maiden Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., REYES |  |
| mother_first_name | Family Names | Mother's First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., MARIA |  |
| mother_middle_name | Family Names | Mother's Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., GARCIA |  |
| spouse_last_name | Family Names | Spouse's Last Name | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., SANTOS |  |
| spouse_first_name | Family Names | Spouse's First Name | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., ANA |  |
| spouse_middle_name | Family Names | Spouse's Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., LIRA |  |
| perm_unit | Address & Contact | Unit/Room No./Floor | Text (short) | No | Yes |  | — | — | — | e.g., Unit 4B |  |
| perm_building | Address & Contact | Building Name | Text (short) | No | Yes |  | — | — | — | e.g., Sunrise Tower |  |
| perm_lot | Address & Contact | Lot/Block/Phase/House Number | Text (short) | No | Yes |  | — | — | — | e.g., Lot 12 Block 5 |  |
| perm_street | Address & Contact | Street Name | Text (short) | Yes | Yes |  | — | — | — | e.g., Rizal Street |  |
| perm_subdivision | Address & Contact | Subdivision | Text (short) | No | Yes |  | — | — | — | e.g., Loyola Grand Villas |  |
| perm_barangay | Address & Contact | Barangay | Text (short) | Yes | Yes |  | — | — | — | e.g., Brgy. San Jose |  |
| perm_city | Address & Contact | Municipality/City | Text (short) | Yes | Yes |  | — | — | — | e.g., Quezon City |  |
| perm_province | Address & Contact | Province/State/Country | Dropdown | Yes | Yes | options(84) | — | — | — |  |  |
| perm_zip | Address & Contact | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| mobile | Address & Contact | Mobile Number | Text (phone) | Yes | Yes | inputMode=tel | — | — | — | 09XX-XXX-XXXX |  |
| home_phone | Address & Contact | Home Phone Number | Text (phone) | No | Yes |  | — | — | — | (02) XXXX-XXXX |  |
| email | Address & Contact | Email Address | Text (email) | No | Yes |  | — | — | — | your@email.com |  |
| mail_same_as_above | Address & Contact | Mailing Address same as Permanent Address | Checkbox | No | Yes |  | — | — | — |  |  |
| mail_unit | Address & Contact | Mailing — Unit/Room No./Floor | Text (short) | No | Yes |  | — | — | — | e.g., Unit 4B |  |
| mail_building | Address & Contact | Mailing — Building Name | Text (short) | No | Yes |  | — | — | — | e.g., Sunrise Tower |  |
| mail_lot | Address & Contact | Mailing — Lot/Block/Phase/House Number | Text (short) | No | Yes |  | — | — | — | e.g., Lot 12 Block 5 |  |
| mail_street | Address & Contact | Mailing — Street Name | Text (short) | No | Yes |  | — | — | — | e.g., Rizal Street |  |
| mail_subdivision | Address & Contact | Mailing — Subdivision | Text (short) | No | Yes |  | — | — | — | e.g., Loyola Grand Villas |  |
| mail_barangay | Address & Contact | Mailing — Barangay | Text (short) | No | Yes |  | — | — | — | e.g., Brgy. San Jose |  |
| mail_city | Address & Contact | Mailing — Municipality/City | Text (short) | No | Yes |  | — | — | — | e.g., Quezon City |  |
| mail_province | Address & Contact | Mailing — Province/State/Country | Text (short) | No | Yes |  | — | — | — | e.g., Metro Manila or Abroad |  |
| mail_zip | Address & Contact | Mailing — ZIP Code | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| dep1_last_name | Dependents | Dependent 1 — Last Name | Text (short) | No | Yes |  | — | — | — | Last name |  |
| dep1_first_name | Dependents | Dependent 1 — First Name | Text (short) | No | Yes |  | — | — | — | First name |  |
| dep1_name_ext | Dependents | Dependent 1 — Name Extension | Text (short) | No | Yes |  | — | — | — | Jr./Sr./II |  |
| dep1_middle_name | Dependents | Dependent 1 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — | Middle name |  |
| dep1_relationship | Dependents | Dependent 1 — Relationship | Text (short) | No | Yes |  | — | — | — | e.g., Spouse, Child |  |
| dep1_dob | Dependents | Dependent 1 — Date of Birth | Text (short) | No | Yes |  | — | — | — | mm-dd-yyyy |  |
| dep1_citizenship | Dependents | Dependent 1 — Citizenship | Text (short) | No | Yes |  | — | — | — | e.g., Filipino |  |
| dep1_no_middle_name | Dependents | Dependent 1 — No Middle Name | Checkbox | No | Yes |  | — | Maybe | — |  |  |
| dep1_mononym | Dependents | Dependent 1 — Mononym | Checkbox | No | Yes |  | — | — | — |  |  |
| dep1_disability | Dependents | Dependent 1 — Permanent Disability | Checkbox | No | Yes |  | — | — | — |  |  |
| dep2_last_name | Dependents | Dependent 2 — Last Name | Text (short) | No | Yes |  | — | — | — | Last name |  |
| dep2_first_name | Dependents | Dependent 2 — First Name | Text (short) | No | Yes |  | — | — | — | First name |  |
| dep2_name_ext | Dependents | Dependent 2 — Name Extension | Text (short) | No | Yes |  | — | — | — | Jr./Sr./II |  |
| dep2_middle_name | Dependents | Dependent 2 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — | Middle name |  |
| dep2_relationship | Dependents | Dependent 2 — Relationship | Text (short) | No | Yes |  | — | — | — | e.g., Spouse, Child |  |
| dep2_dob | Dependents | Dependent 2 — Date of Birth | Text (short) | No | Yes |  | — | — | — | mm-dd-yyyy |  |
| dep2_citizenship | Dependents | Dependent 2 — Citizenship | Text (short) | No | Yes |  | — | — | — | e.g., Filipino |  |
| dep2_no_middle_name | Dependents | Dependent 2 — No Middle Name | Checkbox | No | Yes |  | — | Maybe | — |  |  |
| dep2_mononym | Dependents | Dependent 2 — Mononym | Checkbox | No | Yes |  | — | — | — |  |  |
| dep2_disability | Dependents | Dependent 2 — Permanent Disability | Checkbox | No | Yes |  | — | — | — |  |  |
| dep3_last_name | Dependents | Dependent 3 — Last Name | Text (short) | No | Yes |  | — | — | — | Last name |  |
| dep3_first_name | Dependents | Dependent 3 — First Name | Text (short) | No | Yes |  | — | — | — | First name |  |
| dep3_name_ext | Dependents | Dependent 3 — Name Extension | Text (short) | No | Yes |  | — | — | — | Jr./Sr./II |  |
| dep3_middle_name | Dependents | Dependent 3 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — | Middle name |  |
| dep3_relationship | Dependents | Dependent 3 — Relationship | Text (short) | No | Yes |  | — | — | — | e.g., Spouse, Child |  |
| dep3_dob | Dependents | Dependent 3 — Date of Birth | Text (short) | No | Yes |  | — | — | — | mm-dd-yyyy |  |
| dep3_citizenship | Dependents | Dependent 3 — Citizenship | Text (short) | No | Yes |  | — | — | — | e.g., Filipino |  |
| dep3_no_middle_name | Dependents | Dependent 3 — No Middle Name | Checkbox | No | Yes |  | — | Maybe | — |  |  |
| dep3_mononym | Dependents | Dependent 3 — Mononym | Checkbox | No | Yes |  | — | — | — |  |  |
| dep3_disability | Dependents | Dependent 3 — Permanent Disability | Checkbox | No | Yes |  | — | — | — |  |  |
| dep4_last_name | Dependents | Dependent 4 — Last Name | Text (short) | No | Yes |  | — | — | — | Last name |  |
| dep4_first_name | Dependents | Dependent 4 — First Name | Text (short) | No | Yes |  | — | — | — | First name |  |
| dep4_name_ext | Dependents | Dependent 4 — Name Extension | Text (short) | No | Yes |  | — | — | — | Jr./Sr./II |  |
| dep4_middle_name | Dependents | Dependent 4 — Middle Name | Text (short) | No | Yes |  | — | Maybe | — | Middle name |  |
| dep4_relationship | Dependents | Dependent 4 — Relationship | Text (short) | No | Yes |  | — | — | — | e.g., Spouse, Child |  |
| dep4_dob | Dependents | Dependent 4 — Date of Birth | Text (short) | No | Yes |  | — | — | — | mm-dd-yyyy |  |
| dep4_citizenship | Dependents | Dependent 4 — Citizenship | Text (short) | No | Yes |  | — | — | — | e.g., Filipino |  |
| dep4_no_middle_name | Dependents | Dependent 4 — No Middle Name | Checkbox | No | Yes |  | — | Maybe | — |  |  |
| dep4_mononym | Dependents | Dependent 4 — Mononym | Checkbox | No | Yes |  | — | — | — |  |  |
| dep4_disability | Dependents | Dependent 4 — Permanent Disability | Checkbox | No | Yes |  | — | — | — |  |  |
| member_type | Member Type | Direct Contributor | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| indirect_contributor | Member Type | Indirect Contributor | Dropdown | No | Yes | options(11) | — | — | — |  |  |
| profession | Member Type | Profession | Text (short) | No | Yes |  | — | — | — | e.g., Nurse, Engineer |  |
| monthly_income | Member Type | Monthly Income (PHP) | Number | No | Yes | inputMode=numeric | — | — | — | e.g., 15000 |  |
| proof_of_income | Member Type | Proof of Income | Text (short) | No | Yes |  | — | — | — | e.g., Certificate of Employment |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `purpose` — Purpose  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Registration | Registration | No |
| Updating/Amendment | Updating/Amendment | No |

**Field Group:** `name_ext` — Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `dob_month` — Date of Birth — Month  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| 01 | 01 | No |
| 02 | 02 | No |
| 03 | 03 | No |
| 04 | 04 | No |
| 05 | 05 | No |
| 06 | 06 | No |
| 07 | 07 | No |
| 08 | 08 | No |
| 09 | 09 | No |
| 10 | 10 | No |
| 11 | 11 | No |
| 12 | 12 | No |

**Field Group:** `dob_day` — Date of Birth — Day  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| 01 | 01 | No |
| 02 | 02 | No |
| 03 | 03 | No |
| 04 | 04 | No |
| 05 | 05 | No |
| 06 | 06 | No |
| 07 | 07 | No |
| 08 | 08 | No |
| 09 | 09 | No |
| 10 | 10 | No |
| 11 | 11 | No |
| 12 | 12 | No |
| 13 | 13 | No |
| 14 | 14 | No |
| 15 | 15 | No |
| 16 | 16 | No |
| 17 | 17 | No |
| 18 | 18 | No |
| 19 | 19 | No |
| 20 | 20 | No |
| 21 | 21 | No |
| 22 | 22 | No |
| 23 | 23 | No |
| 24 | 24 | No |
| 25 | 25 | No |
| 26 | 26 | No |
| 27 | 27 | No |
| 28 | 28 | No |
| 29 | 29 | No |
| 30 | 30 | No |
| 31 | 31 | No |

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
| Widow/er | Widow/er | No |
| Annulled | Annulled | No |
| Legally Separated | Legally Separated | No |

**Field Group:** `citizenship` — Citizenship  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Filipino | Filipino | No |
| Dual Citizen | Dual Citizen | No |
| Foreign National | Foreign National | No |

**Field Group:** `perm_province` — Province/State/Country  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Metro Manila (NCR) | Metro Manila (NCR) | No |
| Abra | Abra | No |
| Agusan del Norte | Agusan del Norte | No |
| Agusan del Sur | Agusan del Sur | No |
| Aklan | Aklan | No |
| Albay | Albay | No |
| Antique | Antique | No |
| Apayao | Apayao | No |
| Aurora | Aurora | No |
| Basilan | Basilan | No |
| Bataan | Bataan | No |
| Batanes | Batanes | No |
| Batangas | Batangas | No |
| Benguet | Benguet | No |
| Biliran | Biliran | No |
| Bohol | Bohol | No |
| Bukidnon | Bukidnon | No |
| Bulacan | Bulacan | No |
| Cagayan | Cagayan | No |
| Camarines Norte | Camarines Norte | No |
| Camarines Sur | Camarines Sur | No |
| Camiguin | Camiguin | No |
| Capiz | Capiz | No |
| Catanduanes | Catanduanes | No |
| Cavite | Cavite | No |
| Cebu | Cebu | No |
| Cotabato | Cotabato | No |
| Davao de Oro | Davao de Oro | No |
| Davao del Norte | Davao del Norte | No |
| Davao del Sur | Davao del Sur | No |
| Davao Occidental | Davao Occidental | No |
| Davao Oriental | Davao Oriental | No |
| Dinagat Islands | Dinagat Islands | No |
| Eastern Samar | Eastern Samar | No |
| Guimaras | Guimaras | No |
| Ifugao | Ifugao | No |
| Ilocos Norte | Ilocos Norte | No |
| Ilocos Sur | Ilocos Sur | No |
| Iloilo | Iloilo | No |
| Isabela | Isabela | No |
| Kalinga | Kalinga | No |
| La Union | La Union | No |
| Laguna | Laguna | No |
| Lanao del Norte | Lanao del Norte | No |
| Lanao del Sur | Lanao del Sur | No |
| Leyte | Leyte | No |
| Maguindanao del Norte | Maguindanao del Norte | No |
| Maguindanao del Sur | Maguindanao del Sur | No |
| Marinduque | Marinduque | No |
| Masbate | Masbate | No |
| Misamis Occidental | Misamis Occidental | No |
| Misamis Oriental | Misamis Oriental | No |
| Mountain Province | Mountain Province | No |
| Negros Occidental | Negros Occidental | No |
| Negros Oriental | Negros Oriental | No |
| Northern Samar | Northern Samar | No |
| Nueva Ecija | Nueva Ecija | No |
| Nueva Vizcaya | Nueva Vizcaya | No |
| Occidental Mindoro | Occidental Mindoro | No |
| Oriental Mindoro | Oriental Mindoro | No |
| Palawan | Palawan | No |
| Pampanga | Pampanga | No |
| Pangasinan | Pangasinan | No |
| Quezon | Quezon | No |
| Quirino | Quirino | No |
| Rizal | Rizal | No |
| Romblon | Romblon | No |
| Samar | Samar | No |
| Sarangani | Sarangani | No |
| Siquijor | Siquijor | No |
| Sorsogon | Sorsogon | No |
| South Cotabato | South Cotabato | No |
| Southern Leyte | Southern Leyte | No |
| Sultan Kudarat | Sultan Kudarat | No |
| Sulu | Sulu | No |
| Surigao del Norte | Surigao del Norte | No |
| Surigao del Sur | Surigao del Sur | No |
| Tarlac | Tarlac | No |
| Tawi-Tawi | Tawi-Tawi | No |
| Zambales | Zambales | No |
| Zamboanga del Norte | Zamboanga del Norte | No |
| Zamboanga del Sur | Zamboanga del Sur | No |
| Zamboanga Sibugay | Zamboanga Sibugay | No |
| Abroad | Abroad | No |

**Field Group:** `member_type` — Direct Contributor  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
|  |  | No |
| Employed Private | Employed Private | No |
| Employed Government | Employed Government | No |
| Professional Practitioner | Professional Practitioner | No |
| Self-Earning Individual | Self-Earning Individual | No |
| Kasambahay | Kasambahay | No |
| Family Driver | Family Driver | No |
| Migrant Worker (Land-Based) | Migrant Worker (Land-Based) | No |
| Migrant Worker (Sea-Based) | Migrant Worker (Sea-Based) | No |
| Lifetime Member | Lifetime Member | No |
| Filipinos with Dual Citizenship / Living Abroad | Filipinos with Dual Citizenship / Living Abroad | No |
| Foreign National | Foreign National | No |

**Field Group:** `indirect_contributor` — Indirect Contributor  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
|  |  | No |
| Listahanan | Listahanan | No |
| 4Ps/MCCT | 4Ps/MCCT | No |
| Senior Citizen | Senior Citizen | No |
| PAMANA | PAMANA | No |
| KIA/KIPO | KIA/KIPO | No |
| Bangsamoro/Normalization | Bangsamoro/Normalization | No |
| LGU-sponsored | LGU-sponsored | No |
| NGA-sponsored | NGA-sponsored | No |
| Private-sponsored | Private-sponsored | No |
| Person with Disability | Person with Disability | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PHILHEALTH_PMRF_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

_Generated: 2026-04-23T17:02:26.385Z_

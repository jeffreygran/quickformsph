# Field Dictionary — PhilHealth Claim Form 1

> Authoritative reference for CF-1. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Form 1 |
| **Agency** | PhilHealth |
| **Form Code / Version** | CF-1 (Revised September 2018) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-claim-form-1` |
| **Source PDF** | `public/forms/PhilHealth - ClaimForm1_092018.pdf` |
| **API** | `POST /api/generate` body `{slug:"philhealth-claim-form-1", values:{…}}` |
| **Field Count** | 36 |
| **Steps / Sections** | 5 |

**Purpose:** Required PhilHealth claim form for inpatient/hospital availment. Submit to the hospital billing section together with other supporting documents.
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
| S2 | Mailing Address | 10 fields |
| S3 | Contact & Patient | 4 fields |
| S4 | Dependent Info | 10 fields |
| S5 | Employer Cert | 3 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `member_pin` | Member Info | PhilHealth Identification Number (PIN) of Member | Text | Yes | inputMode=numeric | — | e.g., 12-345678901-2 |
| `member_last_name` | Member Info | Last Name | Text | Yes | UPPERCASE | — | e.g., DELA CRUZ |
| `member_first_name` | Member Info | First Name | Text | Yes | UPPERCASE | — | e.g., JUAN ANDRES |
| `member_name_ext` | Member Info | Name Extension | Dropdown | No | 6 options | — |  |
| `member_middle_name` | Member Info | Middle Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `member_dob_month` | Member Info | Date of Birth — Month | Dropdown | Yes | 12 options | — |  |
| `member_dob_day` | Member Info | Date of Birth — Day | Dropdown | Yes | 31 options | — |  |
| `member_dob_year` | Member Info | Date of Birth — Year | Text | Yes | inputMode=numeric | 4 | e.g., 1990 |
| `member_sex` | Member Info | Sex | Dropdown | Yes | 2 options | — |  |
| `addr_unit` | Mailing Address | Unit/Room No./Floor | Text | No |  | — | e.g., Unit 4B |
| `addr_building` | Mailing Address | Building Name | Text | No |  | — | e.g., Sunrise Tower |
| `addr_lot` | Mailing Address | Lot/Block/House/Building No. | Text | No |  | — | e.g., Lot 12 Block 5 |
| `addr_street` | Mailing Address | Street | Text | Yes |  | — | e.g., Rizal Street |
| `addr_subdivision` | Mailing Address | Subdivision/Village | Text | No |  | — | e.g., Loyola Grand Villas |
| `addr_barangay` | Mailing Address | Barangay | Text | Yes |  | — | e.g., Brgy. San Jose |
| `addr_city` | Mailing Address | City/Municipality | Text | Yes |  | — | e.g., Quezon City |
| `addr_province` | Mailing Address | Province | Dropdown | Yes | 84 options | — |  |
| `addr_country` | Mailing Address | Country | Dropdown | Yes | 2 options | — |  |
| `addr_zip` | Mailing Address | ZIP Code | Text | Yes | inputMode=numeric | 4 | 1100 |
| `contact_landline` | Contact & Patient | Landline No. (Area Code + Tel. No.) | Text (phone) | No |  | — | (02) 1234-5678 |
| `contact_mobile` | Contact & Patient | Mobile No. | Text (phone) | Yes | inputMode=tel | — | 09XX-XXX-XXXX |
| `contact_email` | Contact & Patient | Email Address | Text (email) | No |  | — | your@email.com |
| `patient_is_member` | Contact & Patient | Is the Patient the PhilHealth Member? | Dropdown | Yes | 2 options | — |  |
| `patient_pin` | Dependent Info | Dependent's PhilHealth PIN | Text | No | inputMode=numeric | — | e.g., 12-345678901-2 |
| `patient_last_name` | Dependent Info | Patient's Last Name | Text | No | UPPERCASE | — | e.g., DELA CRUZ |
| `patient_first_name` | Dependent Info | Patient's First Name | Text | No | UPPERCASE | — | e.g., MARIA |
| `patient_name_ext` | Dependent Info | Patient's Name Extension | Dropdown | No | 6 options | — |  |
| `patient_middle_name` | Dependent Info | Patient's Middle Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `patient_dob_month` | Dependent Info | Patient's Date of Birth — Month | Dropdown | No | 12 options | — |  |
| `patient_dob_day` | Dependent Info | Patient's Date of Birth — Day | Dropdown | No | 31 options | — |  |
| `patient_dob_year` | Dependent Info | Patient's Date of Birth — Year | Text | No | inputMode=numeric | 4 | e.g., 1990 |
| `patient_relationship` | Dependent Info | Relationship to Member | Dropdown | No | 3 options | — |  |
| `patient_sex` | Dependent Info | Patient's Sex | Dropdown | No | 2 options | — |  |
| `employer_pen` | Employer Cert | PhilHealth Employer Number (PEN) | Text | No | inputMode=numeric | — | e.g., 17-123456789-0 |
| `employer_contact` | Employer Cert | Employer Contact No. | Text (phone) | No |  | — | (02) 1234-5678 |
| `employer_business_name` | Employer Cert | Business Name of Employer | Text | No | UPPERCASE | — | e.g., ABC Company, Inc. |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`member_name_ext` — Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`member_dob_month` — Date of Birth — Month** (dropdown)

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

**`member_dob_day` — Date of Birth — Day** (dropdown)

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

**`member_sex` — Sex** (dropdown)

| Option | Value |
|---|---|
| Male | `Male` |
| Female | `Female` |

**`addr_province` — Province** (dropdown)

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
| N/A (Abroad) | `N/A (Abroad)` |

**`addr_country` — Country** (dropdown)

| Option | Value |
|---|---|
| Philippines | `Philippines` |
| Abroad | `Abroad` |

**`patient_is_member` — Is the Patient the PhilHealth Member?** (dropdown)

| Option | Value |
|---|---|
| Yes — I am the Patient | `Yes — I am the Patient` |
| No — Patient is a Dependent | `No — Patient is a Dependent` |

**`patient_name_ext` — Patient's Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`patient_dob_month` — Patient's Date of Birth — Month** (dropdown)

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

**`patient_dob_day` — Patient's Date of Birth — Day** (dropdown)

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

**`patient_relationship` — Relationship to Member** (dropdown)

| Option | Value |
|---|---|
| Child | `Child` |
| Spouse | `Spouse` |
| Parent | `Parent` |

**`patient_sex` — Patient's Sex** (dropdown)

| Option | Value |
|---|---|
| Male | `Male` |
| Female | `Female` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 4

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `addr_barangay` | 0 | 27 | 596.00 | undefined | 97 | ✓ |
| `addr_building` | 0 | 137 | 627.00 | undefined | 97 | ✓ |
| `addr_city` | 0 | 137 | 596.00 | undefined | 97 | ✓ |
| `addr_country` | 0 | 357 | 596.00 | undefined | 80 | ✓ |
| `addr_lot` | 0 | 247 | 627.00 | undefined | 97 | ✓ |
| `addr_province` | 0 | 247 | 596.00 | 8 | 97 | ✓ |
| `addr_street` | 0 | 357 | 627.00 | undefined | 80 | ✓ |
| `addr_subdivision` | 0 | 452 | 627.00 | undefined | 133 | ✓ |
| `addr_unit` | 0 | 27 | 627.00 | undefined | 97 | ✓ |
| `addr_zip` | 0 | 452 | 596.00 | undefined | 130 | ✓ |
| `contact_email` | 0 | 397 | 551.00 | undefined | 190 | ✓ |
| `contact_landline` | 0 | 25 | 551.00 | undefined | 187 | ✓ |
| `contact_mobile` | 0 | 224 | 551.00 | undefined | 160 | ✓ |
| `employer_business_name` | 0 | 71 | 182.00 | undefined | 470 | ✓ |
| `employer_contact` | 0 | 460 | 217.00 | undefined | 127 | ✓ |
| `employer_pen` | 0 | 0 | 213.00 | 9 | — | ✓ |
| `member_dob_day` | 0 | 0 | 683.00 | 9 | — | ✓ |
| `member_dob_month` | 0 | 0 | 683.00 | 9 | — | ✓ |
| `member_dob_year` | 0 | 0 | 683.00 | 9 | — | ✓ |
| `member_first_name` | 0 | 137 | 684.00 | undefined | 97 | ✓ |
| `member_last_name` | 0 | 27 | 684.00 | undefined | 97 | ✓ |
| `member_middle_name` | 0 | 357 | 684.00 | undefined | 80 | ✓ |
| `member_name_ext` | 0 | 247 | 684.00 | undefined | 97 | ✓ |
| `member_pin` | 0 | 0 | 712.00 | 9 | — | ✓ |
| `patient_dob_day` | 0 | 0 | 451.00 | 9 | — | ✓ |
| `patient_dob_month` | 0 | 0 | 451.00 | 9 | — | ✓ |
| `patient_dob_year` | 0 | 0 | 451.00 | 9 | — | ✓ |
| `patient_first_name` | 0 | 137 | 452.00 | undefined | 97 | ✓ |
| `patient_last_name` | 0 | 27 | 452.00 | undefined | 97 | ✓ |
| `patient_middle_name` | 0 | 357 | 452.00 | undefined | 80 | ✓ |
| `patient_name_ext` | 0 | 247 | 452.00 | undefined | 97 | ✓ |
| `patient_pin` | 0 | 0 | 481.00 | 9 | — | ✓ |

**Skip values (treated as blank):**

- `member_name_ext`: `N/A`
- `patient_name_ext`: `N/A`
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

# Field Dictionary — PhilHealth Claim Form 1

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Form 1 |
| **Agency** | PhilHealth |
| **Form Code / Version** | CF-1 (Revised September 2018) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-claim-form-1` |
| **Source PDF Location** | `public/forms/PhilHealth - ClaimForm1_092018.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"philhealth-claim-form-1", values:{…}}` |
| **Field Count** | 36 |
| **Steps / Sections** | 5 |

**Purpose:** Required PhilHealth claim form for inpatient/hospital availment. Submit to the hospital billing section together with other supporting documents.

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
| S1 | Member Info | — | step 1, 9 fields |
| S2 | Mailing Address | — | step 2, 10 fields |
| S3 | Contact & Patient | — | step 3, 4 fields |
| S4 | Dependent Info | — | step 4, 10 fields |
| S5 | Employer Cert | — | step 5, 3 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| member_pin | Member Info | PhilHealth Identification Number (PIN) of Member | Text (short) | Yes | Yes | inputMode=numeric | — | Maybe | — | e.g., 12-345678901-2 |  |
| member_last_name | Member Info | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., DELA CRUZ |  |
| member_first_name | Member Info | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., JUAN ANDRES |  |
| member_name_ext | Member Info | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| member_middle_name | Member Info | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., SANTOS |  |
| member_dob_month | Member Info | Date of Birth — Month | Dropdown | Yes | Yes | options(12) | — | — | — |  |  |
| member_dob_day | Member Info | Date of Birth — Day | Dropdown | Yes | Yes | options(31) | — | — | — |  |  |
| member_dob_year | Member Info | Date of Birth — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | e.g., 1990 |  |
| member_sex | Member Info | Sex | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| addr_unit | Mailing Address | Unit/Room No./Floor | Text (short) | No | Yes |  | — | — | — | e.g., Unit 4B |  |
| addr_building | Mailing Address | Building Name | Text (short) | No | Yes |  | — | — | — | e.g., Sunrise Tower |  |
| addr_lot | Mailing Address | Lot/Block/House/Building No. | Text (short) | No | Yes |  | — | — | — | e.g., Lot 12 Block 5 |  |
| addr_street | Mailing Address | Street | Text (short) | Yes | Yes |  | — | — | — | e.g., Rizal Street |  |
| addr_subdivision | Mailing Address | Subdivision/Village | Text (short) | No | Yes |  | — | — | — | e.g., Loyola Grand Villas |  |
| addr_barangay | Mailing Address | Barangay | Text (short) | Yes | Yes |  | — | — | — | e.g., Brgy. San Jose |  |
| addr_city | Mailing Address | City/Municipality | Text (short) | Yes | Yes |  | — | — | — | e.g., Quezon City |  |
| addr_province | Mailing Address | Province | Dropdown | Yes | Yes | options(84) | — | — | — |  |  |
| addr_country | Mailing Address | Country | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| addr_zip | Mailing Address | ZIP Code | Text (short) | Yes | Yes | inputMode=numeric | 4 | Maybe | — | 1100 |  |
| contact_landline | Contact & Patient | Landline No. (Area Code + Tel. No.) | Text (phone) | No | Yes |  | — | — | — | (02) 1234-5678 |  |
| contact_mobile | Contact & Patient | Mobile No. | Text (phone) | Yes | Yes | inputMode=tel | — | — | — | 09XX-XXX-XXXX |  |
| contact_email | Contact & Patient | Email Address | Text (email) | No | Yes |  | — | — | — | your@email.com |  |
| patient_is_member | Contact & Patient | Is the Patient the PhilHealth Member? | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| patient_pin | Dependent Info | Dependent's PhilHealth PIN | Text (short) | No | Yes | inputMode=numeric | — | Maybe | — | e.g., 12-345678901-2 |  |
| patient_last_name | Dependent Info | Patient's Last Name | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., DELA CRUZ |  |
| patient_first_name | Dependent Info | Patient's First Name | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., MARIA |  |
| patient_name_ext | Dependent Info | Patient's Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| patient_middle_name | Dependent Info | Patient's Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., SANTOS |  |
| patient_dob_month | Dependent Info | Patient's Date of Birth — Month | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| patient_dob_day | Dependent Info | Patient's Date of Birth — Day | Dropdown | No | Yes | options(31) | — | — | — |  |  |
| patient_dob_year | Dependent Info | Patient's Date of Birth — Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | e.g., 1990 |  |
| patient_relationship | Dependent Info | Relationship to Member | Dropdown | No | Yes | options(3) | — | — | — |  |  |
| patient_sex | Dependent Info | Patient's Sex | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| employer_pen | Employer Cert | PhilHealth Employer Number (PEN) | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 17-123456789-0 |  |
| employer_contact | Employer Cert | Employer Contact No. | Text (phone) | No | Yes |  | — | — | — | (02) 1234-5678 |  |
| employer_business_name | Employer Cert | Business Name of Employer | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., ABC Company, Inc. |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `member_name_ext` — Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `member_dob_month` — Date of Birth — Month  
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

**Field Group:** `member_dob_day` — Date of Birth — Day  
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

**Field Group:** `member_sex` — Sex  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Male | Male | No |
| Female | Female | No |

**Field Group:** `addr_province` — Province  
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
| N/A (Abroad) | N/A (Abroad) | No |

**Field Group:** `addr_country` — Country  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Philippines | Philippines | No |
| Abroad | Abroad | No |

**Field Group:** `patient_is_member` — Is the Patient the PhilHealth Member?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Yes — I am the Patient | Yes — I am the Patient | No |
| No — Patient is a Dependent | No — Patient is a Dependent | No |

**Field Group:** `patient_name_ext` — Patient's Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `patient_dob_month` — Patient's Date of Birth — Month  
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

**Field Group:** `patient_dob_day` — Patient's Date of Birth — Day  
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

**Field Group:** `patient_relationship` — Relationship to Member  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Child | Child | No |
| Spouse | Spouse | No |
| Parent | Parent | No |

**Field Group:** `patient_sex` — Patient's Sex  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Male | Male | No |
| Female | Female | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PHILHEALTH_CLAIM_FORM_1_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

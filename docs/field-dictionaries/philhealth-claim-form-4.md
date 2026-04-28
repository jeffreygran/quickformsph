# CF-4 Field Dictionary — `philhealth-claim-form-4`

> **PhilHealth Claim Form 4** — Patient's Clinical Record (Feb 2020 revision).
> 2 pages, 612 × 936 pt (US Letter Long). 49 schema fields across 5 wizard steps.
> **Phase 1 v0** — onboarded 2026-04-28 (L-SMART-CF4-V0).

---

## Step 1 — HCI & Patient (11 fields)

| Field id | Label (PDF #) | Type | Smart Assist | Notes |
|---|---|---|---|---|
| `series_no` | Series # (top-right) | text | — | 13-cell pre-printed serial; v0 renders as single string. |
| `hci_name` | 1. Name of HCI | text | autocomplete (24 HCIs) | Auto-fills `hci_pan` on selection. |
| `hci_pan` | 2. Accreditation Number | text | mask `hciPan` (HCI-NN-NNNNNN) | Eligibility: 8 digits. |
| `hci_address` | 3. Address of HCI | text | maxLength 140 | Single-line; building/street/brgy/city/province/zip. |
| `patient_last_name` | 1. Patient's Last Name | text | autoUppercase | maxLength 30. |
| `patient_first_name` | First Name | text | autoUppercase | maxLength 30. |
| `patient_name_ext` | Name Extension | dropdown | N/A skip | `skipValues:['N/A']`. |
| `patient_middle_name` | Middle Name | text | autoUppercase | maxLength 30. |
| `patient_pin` | 2. PIN | text | mask `pin` (12 digits) | Eligibility: 12 digits. |
| `patient_age` | 3. Age | text | numeric | maxLength 3. |
| `patient_sex` | 4. Sex | dropdown → checkbox | renders to Male/Female squares | CF4_CHECKBOX_COORDS. |

## Step 2 — Admission & Diagnosis (9 fields)

| Field id | Label (PDF #) | Type | Smart Assist | Notes |
|---|---|---|---|---|
| `chief_complaint` | 5. Chief Complaint | textarea | maxLength 100 | Single-line band on PDF. |
| `admitting_diagnosis` | 6. Admitting Diagnosis | textarea | maxLength 120 | |
| `discharge_diagnosis` | 7. Discharge Diagnosis | textarea | maxLength 120 | |
| `case_rate_code_1` | 8a. 1st Case Rate Code | text | autocomplete (25 codes) | autoUppercase. |
| `case_rate_code_2` | 8b. 2nd Case Rate Code | text | autocomplete | Optional. |
| `date_admitted` | 9a. Date Admitted | date | combined → `_month/_day/_year` | `expandCombinedDates()`. |
| `time_admitted` | 9b. Time Admitted | text | mask `time` → `_hour/_min/_ampm` | `expandCombinedTimes()`. AM/PM checkbox = Phase 2 (`amPmFromTime`). |
| `date_discharged` | 10a. Date Discharged | date | combined | Eligibility: ≥ admit. |
| `time_discharged` | 10b. Time Discharged | text | mask `time` | |

## Step 3 — Reason for Admission (6 fields)

| Field id | Label (PDF #) | Type | Smart Assist | Notes |
|---|---|---|---|---|
| `history_of_present_illness` | III.1 HPI | textarea | wrap 78pt × 9pt × 8pt | maxLength 1000. |
| `pertinent_past_medical_history` | III.2a Past Medical | textarea | wrap 30pt × 9pt × 8pt | maxLength 350. |
| `obgyn_history` | III.2b OB/GYN (G P A LMP) | textarea | wrap 22pt × 9pt × 8pt | maxLength 200; skip if male/peds. |
| `referred_from_hci` | III.4 Referred from another HCI? | dropdown | visibleWhen=Yes gates name+reason | Renders to No/Yes checkbox. |
| `referring_hci_name` | Name of Originating HCI | text | visibleWhen `referred_from_hci='Yes'` | autoUppercase. |
| `referring_reason` | Reason for Referral | textarea | visibleWhen | maxLength 200. |

> **Phase 2 backlog:** 32-cell sign/symptom checkbox grid (Altered mental sensorium, Diarrhea, Hematemesis, Palpitations, Abdominal cramp/pain, …). v0 captures ticks in UI but does not yet render to the PDF.

## Step 4 — Physical Exam & Course (16 fields)

| Field id | Label | Type | Notes |
|---|---|---|---|
| `pe_height_cm` | Height (cm) | text | numeric. |
| `pe_weight_kg` | Weight (kg) | text | |
| `pe_general_survey` | General Survey | textarea | maxLength 80. |
| `vs_blood_pressure` | BP | text | placeholder `120/80`. |
| `vs_heart_rate` | HR (bpm) | text | numeric. |
| `vs_respiratory_rate` | RR (cpm) | text | numeric. |
| `vs_temperature` | Temp (°C) | text | maxLength 5. |
| `pe_heent_others` | HEENT — Others | textarea | maxLength 90. Per-system "Others" line. |
| `pe_chest_lungs_others` | Chest/Lungs — Others | textarea | maxLength 90. |
| `pe_cvs_others` | CVS — Others | textarea | maxLength 90. |
| `pe_abdomen_others` | Abdomen — Others | textarea | maxLength 90. |
| `pe_genitourinary_others` | GU/IE — Others | textarea | maxLength 90. |
| `pe_skin_extremities_others` | Skin/Extremities — Others | textarea | maxLength 90. |
| `pe_neuro_others` | Neuro — Others | textarea | maxLength 90. |
| `course_in_the_ward` | IV. Course in the Ward | textarea | wrap 88pt × 9pt × 8pt; maxLength 1400. |
| `surgical_procedure_rvs` | Surgical Procedure / RVS | text | autoUppercase; maxLength 60. |
| `drugs_medicines_summary` | V. Drugs/Medicines | textarea | wrap 78pt × 9pt × 7pt; maxLength 700. |

> **Phase 2 backlog:** per-system PE checklist primitive (`peChecklistGrid`) — 28 boxes across HEENT/Chest/CVS/Abdomen/GU/Skin/Neuro/Lab; structured Drugs grid primitive (`drugsGrid`) — N rows × 3 cols (Generic / Qty-Dose-Route-Freq / Total Cost).

## Step 5 — Outcome & Certification (6 fields)

| Field id | Label (PDF #) | Type | Smart Assist | Notes |
|---|---|---|---|---|
| `patient_disposition` | VI. Outcome | dropdown → checkbox | 6-way (IMPROVED/RECOVERED/HAMA/EXPIRED/ABSCONDED/TRANSFERRED) | CF4_CHECKBOX_COORDS. |
| `transferred_hci_name` | Receiving HCI / Specify Reason | text | visibleWhen = TRANSFERRED | autoUppercase. |
| `expired_date` | Date of Expiration | date | visibleWhen = EXPIRED, combined | |
| `attending_physician_name` | Attending HCP — Printed Name | text | autoUppercase | maxLength 50. |
| `attending_physician_prc` | PRC License No. | text | numeric | Eligibility: 7 digits. |
| `attending_physician_date_signed` | Date Signed | date | combined | Eligibility: ≥ discharge. |

---

## Eligibility rules (6)

1. `digits-eq` — `hci_pan` 8 digits.
2. `digits-eq` — `patient_pin` 12 digits.
3. `digits-eq` — `attending_physician_prc` 7 digits.
4. `date-not-before` — `date_discharged` ≥ `date_admitted`.
5. `date-not-before` — `attending_physician_date_signed` ≥ `date_discharged`.
6. `days-since-max` — `date_discharged` within 60-day filing window.

## Cascades reused (zero net-new primitives in v0)

- **L-SMART-04** — `expandCombinedDates()` (admit/discharge/expired/signed → 4 splits).
- **L-SMART-CF2-01a** — `expandCombinedTimes()` (admit/discharge → 2 splits).
- **L-SMART-CSF-01** — `mask:'hciPan'`, `mask:'pin'`.
- **L-SMART-CF1-01a/b** — synthetic-id boolean→checkbox bridge (used for `patient_sex`, `referred_from_hci`).
- **L-SMART-CF2-01c** — direct boolean→label normalizer (used for `referred_from_hci`).
- **L-SMART-CF3-04** — input `maxLength` is the single source of truth (no truncation in PDF generator).
- **L-SMART-CF3-05** — bounded multi-line word-wrap (HPI / PMH / OB-GYN / Course / Drugs).

## Phase 2 calibration backlog

| Priority | Item | Notes |
|---|---|---|
| **HIGH** | Coord re-calibration after @Mai 4-band 150 dpi sweep | v0 fields land within ±20pt of target cells; tighten to ±2pt. |
| HIGH | `signSymptomGrid` primitive | 32 named checkboxes; single `coordMap[label]` convention. |
| HIGH | `peChecklistGrid` primitive | per-system checklist sets. |
| MED | `drugsGrid` primitive | structured 3-col table for drugs/dosage/cost. |
| MED | `amPmFromTime` primitive | auto-tick AM/PM (shared with CF-3). |
| LOW | `series_no` per-cell render | 13 cells, ≈3.2pt each — needs special boxCenters spacing. |

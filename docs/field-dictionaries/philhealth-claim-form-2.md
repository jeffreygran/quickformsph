# Field Dictionary — PhilHealth Claim Form 2

> Authoritative reference for CF-2. Auto-generated sections are wrapped
> in `<!-- AUTOGEN -->` markers. **Edit anything outside markers freely** — your
> changes survive regeneration. Run `npm run docs:dictionaries` to refresh.

---

## 1) Form Metadata

<!-- AUTOGEN:START name="metadata" -->
| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Form 2 |
| **Agency** | PhilHealth |
| **Form Code / Version** | CF-2 (Revised September 2018) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-claim-form-2` |
| **Source PDF** | `public/forms/PhilHealth - ClaimForm2_092018.pdf` |
| **API** | `POST /api/generate` body `{slug:"philhealth-claim-form-2", values:{…}}` |
| **Field Count** | 137 |
| **Steps / Sections** | 8 |

**Purpose:** PhilHealth Claim Form 2 — submitted by the Health Care Institution (HCI). Contains HCI info, patient confinement details, diagnoses, procedures, special considerations, HCP fees, and certification of benefits consumption.
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
| S1 | HCI Information | 5 fields |
| S2 | Patient Information | 4 fields |
| S3 | Referral & Confinement | 18 fields |
| S4 | Disposition & Accommodation | 14 fields |
| S5 | Diagnoses & Procedures | 38 fields |
| S6 | Special Considerations | 24 fields |
| S7 | HCP Accreditation & Fees | 15 fields |
| S8 | Certification of Benefits | 19 fields |
<!-- AUTOGEN:END name="sections" -->

---

## 4) Field Inventory

<!-- AUTOGEN:START name="fields" -->
| Field ID | Section | Label | Type | Required | Validation | Max Len | Example |
|---|---|---|---|---|---|---|---|
| `hci_pan` | HCI Information | PhilHealth Accreditation Number (PAN) of Health Care Institution | Text | Yes |  | — | e.g., HCI-123456 |
| `hci_name` | HCI Information | Name of Health Care Institution | Text | Yes | UPPERCASE | — | e.g., ST. LUKE'S MEDICAL CENTER |
| `hci_bldg_street` | HCI Information | Building Number and Street Name | Text | Yes |  | — | e.g., 279 E. Rodriguez Sr. Blvd. |
| `hci_city` | HCI Information | City/Municipality | Text | Yes |  | — | e.g., Quezon City |
| `hci_province` | HCI Information | Province | Dropdown | Yes | 83 options | — |  |
| `patient_last_name` | Patient Information | Last Name | Text | Yes | UPPERCASE | — | e.g., DELA CRUZ |
| `patient_first_name` | Patient Information | First Name | Text | Yes | UPPERCASE | — | e.g., JUAN ANDRES |
| `patient_name_ext` | Patient Information | Name Extension | Dropdown | No | 6 options | — |  |
| `patient_middle_name` | Patient Information | Middle Name | Text | No | UPPERCASE | — | e.g., SANTOS |
| `referred_by_hci` | Referral & Confinement | Was patient referred by another Health Care Institution? | Dropdown | Yes | 2 options | — |  |
| `referring_hci_name` | Referral & Confinement | Name of Referring Health Care Institution | Text | No | UPPERCASE | — | e.g., HEALTH CENTER MANILA |
| `referring_hci_bldg_street` | Referral & Confinement | Building Number and Street Name (Referring HCI) | Text | No |  | — | e.g., 123 Rizal Ave. |
| `referring_hci_city` | Referral & Confinement | City/Municipality (Referring HCI) | Text | No |  | — | e.g., Manila |
| `referring_hci_province` | Referral & Confinement | Province (Referring HCI) | Text | No |  | — | e.g., Metro Manila |
| `referring_hci_zip` | Referral & Confinement | ZIP Code (Referring HCI) | Text | No | inputMode=numeric | 4 | 1000 |
| `date_admitted_month` | Referral & Confinement | Date Admitted — Month | Dropdown | Yes | 12 options | — |  |
| `date_admitted_day` | Referral & Confinement | Date Admitted — Day | Dropdown | Yes | 31 options | — |  |
| `date_admitted_year` | Referral & Confinement | Date Admitted — Year | Text | Yes | inputMode=numeric | 4 | e.g., 2024 |
| `time_admitted_hour` | Referral & Confinement | Time Admitted — Hour | Text | No | inputMode=numeric | 2 | e.g., 08 |
| `time_admitted_min` | Referral & Confinement | Time Admitted — Minutes | Text | No | inputMode=numeric | 2 | e.g., 30 |
| `time_admitted_ampm` | Referral & Confinement | Time Admitted — AM/PM | Dropdown | No | 2 options | — |  |
| `date_discharged_month` | Referral & Confinement | Date Discharged — Month | Dropdown | Yes | 12 options | — |  |
| `date_discharged_day` | Referral & Confinement | Date Discharged — Day | Dropdown | Yes | 31 options | — |  |
| `date_discharged_year` | Referral & Confinement | Date Discharged — Year | Text | Yes | inputMode=numeric | 4 | e.g., 2024 |
| `time_discharged_hour` | Referral & Confinement | Time Discharged — Hour | Text | No | inputMode=numeric | 2 | e.g., 02 |
| `time_discharged_min` | Referral & Confinement | Time Discharged — Minutes | Text | No | inputMode=numeric | 2 | e.g., 00 |
| `time_discharged_ampm` | Referral & Confinement | Time Discharged — AM/PM | Dropdown | No | 2 options | — |  |
| `patient_disposition` | Disposition & Accommodation | Patient Disposition | Dropdown | Yes | 6 options | — |  |
| `expired_month` | Disposition & Accommodation | Date/Time Expired — Month | Dropdown | No | 12 options | — |  |
| `expired_day` | Disposition & Accommodation | Date/Time Expired — Day | Dropdown | No | 31 options | — |  |
| `expired_year` | Disposition & Accommodation | Date/Time Expired — Year | Text | No | inputMode=numeric | 4 | e.g., 2024 |
| `expired_hour` | Disposition & Accommodation | Time Expired — Hour | Text | No | inputMode=numeric | 2 | e.g., 03 |
| `expired_min` | Disposition & Accommodation | Time Expired — Minutes | Text | No | inputMode=numeric | 2 | e.g., 45 |
| `expired_ampm` | Disposition & Accommodation | Time Expired — AM/PM | Dropdown | No | 2 options | — |  |
| `transferred_hci_name` | Disposition & Accommodation | Name of Referral Health Care Institution | Text | No | UPPERCASE | — | e.g., PHILIPPINE GENERAL HOSPITAL |
| `transferred_hci_bldg_street` | Disposition & Accommodation | Building Number and Street Name (Transfer HCI) | Text | No |  | — | e.g., Taft Ave. |
| `transferred_hci_city` | Disposition & Accommodation | City/Municipality (Transfer HCI) | Text | No |  | — | e.g., Manila |
| `transferred_hci_province` | Disposition & Accommodation | Province (Transfer HCI) | Text | No |  | — | e.g., Metro Manila |
| `transferred_hci_zip` | Disposition & Accommodation | ZIP Code (Transfer HCI) | Text | No | inputMode=numeric | 4 | 1000 |
| `reason_for_referral` | Disposition & Accommodation | Reason/s for Referral/Transfer | Text | No |  | — | e.g., Needs specialist care |
| `accommodation_type` | Disposition & Accommodation | Type of Accommodation | Dropdown | Yes | 2 options | — |  |
| `admission_diagnosis_1` | Diagnoses & Procedures | Admission Diagnosis 1 | Text | Yes | UPPERCASE | — | e.g., COMMUNITY-ACQUIRED PNEUMONIA |
| `admission_diagnosis_2` | Diagnoses & Procedures | Admission Diagnosis 2 | Text | No | UPPERCASE | — | e.g., HYPERTENSION |
| `discharge_diagnosis_1` | Diagnoses & Procedures | Discharge Diagnosis i. | Text | Yes | UPPERCASE | — | e.g., PNEUMONIA, UNSPECIFIED |
| `discharge_icd10_1` | Diagnoses & Procedures | ICD-10 Code i. | Text | No |  | — | e.g., J18.9 |
| `discharge_procedure_1` | Diagnoses & Procedures | Related Procedure i. | Text | No | UPPERCASE | — | e.g., CHEST X-RAY |
| `discharge_rvs_1` | Diagnoses & Procedures | RVS Code i. | Text | No |  | — | e.g., 71046 |
| `discharge_procedure_date_1` | Diagnoses & Procedures | Date of Procedure i. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-15-2024 |
| `discharge_laterality_1` | Diagnoses & Procedures | Laterality i. | Dropdown | No | 4 options | — |  |
| `discharge_diagnosis_2` | Diagnoses & Procedures | Discharge Diagnosis ii. | Text | No | UPPERCASE | — | e.g., HYPERTENSION |
| `discharge_icd10_2` | Diagnoses & Procedures | ICD-10 Code ii. | Text | No |  | — | e.g., I10 |
| `discharge_procedure_2` | Diagnoses & Procedures | Related Procedure ii. | Text | No | UPPERCASE | — | e.g., ECG |
| `discharge_rvs_2` | Diagnoses & Procedures | RVS Code ii. | Text | No |  | — | e.g., 93000 |
| `discharge_procedure_date_2` | Diagnoses & Procedures | Date of Procedure ii. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-15-2024 |
| `discharge_laterality_2` | Diagnoses & Procedures | Laterality ii. | Dropdown | No | 4 options | — |  |
| `discharge_diagnosis_3` | Diagnoses & Procedures | Discharge Diagnosis iii. | Text | No | UPPERCASE | — | e.g., DIABETES MELLITUS TYPE 2 |
| `discharge_icd10_3` | Diagnoses & Procedures | ICD-10 Code iii. | Text | No |  | — | e.g., E11 |
| `discharge_procedure_3` | Diagnoses & Procedures | Related Procedure iii. | Text | No | UPPERCASE | — | e.g., BLOOD GLUCOSE MONITORING |
| `discharge_rvs_3` | Diagnoses & Procedures | RVS Code iii. | Text | No |  | — | e.g., 82962 |
| `discharge_procedure_date_3` | Diagnoses & Procedures | Date of Procedure iii. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-16-2024 |
| `discharge_laterality_3` | Diagnoses & Procedures | Laterality iii. | Dropdown | No | 4 options | — |  |
| `discharge_diagnosis_4` | Diagnoses & Procedures | Discharge Diagnosis iv. | Text | No | UPPERCASE | — |  |
| `discharge_icd10_4` | Diagnoses & Procedures | ICD-10 Code iv. | Text | No |  | — |  |
| `discharge_procedure_4` | Diagnoses & Procedures | Related Procedure iv. | Text | No | UPPERCASE | — |  |
| `discharge_rvs_4` | Diagnoses & Procedures | RVS Code iv. | Text | No |  | — |  |
| `discharge_procedure_date_4` | Diagnoses & Procedures | Date of Procedure iv. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-16-2024 |
| `discharge_laterality_4` | Diagnoses & Procedures | Laterality iv. | Dropdown | No | 4 options | — |  |
| `discharge_diagnosis_5` | Diagnoses & Procedures | Discharge Diagnosis v. | Text | No | UPPERCASE | — |  |
| `discharge_icd10_5` | Diagnoses & Procedures | ICD-10 Code v. | Text | No |  | — |  |
| `discharge_procedure_5` | Diagnoses & Procedures | Related Procedure v. | Text | No | UPPERCASE | — |  |
| `discharge_rvs_5` | Diagnoses & Procedures | RVS Code v. | Text | No |  | — |  |
| `discharge_procedure_date_5` | Diagnoses & Procedures | Date of Procedure v. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-17-2024 |
| `discharge_laterality_5` | Diagnoses & Procedures | Laterality v. | Dropdown | No | 4 options | — |  |
| `discharge_diagnosis_6` | Diagnoses & Procedures | Discharge Diagnosis vi. | Text | No | UPPERCASE | — |  |
| `discharge_icd10_6` | Diagnoses & Procedures | ICD-10 Code vi. | Text | No |  | — |  |
| `discharge_procedure_6` | Diagnoses & Procedures | Related Procedure vi. | Text | No | UPPERCASE | — |  |
| `discharge_rvs_6` | Diagnoses & Procedures | RVS Code vi. | Text | No |  | — |  |
| `discharge_procedure_date_6` | Diagnoses & Procedures | Date of Procedure vi. (mm-dd-yyyy) | Text | No |  | — | e.g., 01-17-2024 |
| `discharge_laterality_6` | Diagnoses & Procedures | Laterality vi. | Dropdown | No | 4 options | — |  |
| `special_hemodialysis` | Special Considerations | Hemodialysis — applicable? | Dropdown | No | 2 options | — |  |
| `special_peritoneal_dialysis` | Special Considerations | Peritoneal Dialysis — applicable? | Dropdown | No | 2 options | — |  |
| `special_radiotherapy_linac` | Special Considerations | Radiotherapy (LINAC) — applicable? | Dropdown | No | 2 options | — |  |
| `special_radiotherapy_cobalt` | Special Considerations | Radiotherapy (COBALT) — applicable? | Dropdown | No | 2 options | — |  |
| `special_blood_transfusion` | Special Considerations | Blood Transfusion — applicable? | Dropdown | No | 2 options | — |  |
| `special_brachytherapy` | Special Considerations | Brachytherapy — applicable? | Dropdown | No | 2 options | — |  |
| `special_chemotherapy` | Special Considerations | Chemotherapy — applicable? | Dropdown | No | 2 options | — |  |
| `special_simple_debridement` | Special Considerations | Simple Debridement — applicable? | Dropdown | No | 2 options | — |  |
| `zbenefit_package_code` | Special Considerations | Z-Benefit Package Code | Text | No |  | — | e.g., ZBP-001 |
| `mcp_dates` | Special Considerations | MCP Package — 4 Pre-natal Check-up Dates (mm-dd-yyyy) | Text | No |  | — | e.g., 06-01-2024, 07-01-2024, 08-01-2024, 09-01-2024 |
| `tbdots_intensive_phase` | Special Considerations | TB DOTS — Intensive Phase Dates | Text | No |  | — | e.g., 01-01-2024 to 02-28-2024 |
| `tbdots_maintenance_phase` | Special Considerations | TB DOTS — Maintenance Phase Dates | Text | No |  | — | e.g., 03-01-2024 to 06-30-2024 |
| `animal_bite_arv_day1` | Special Considerations | Animal Bite — ARV Day 1 Date (mm-dd-yyyy) | Text | No |  | — | e.g., 01-10-2024 |
| `animal_bite_arv_day2` | Special Considerations | Animal Bite — ARV Day 2 Date (mm-dd-yyyy) | Text | No |  | — | e.g., 01-13-2024 |
| `animal_bite_arv_day3` | Special Considerations | Animal Bite — ARV Day 3 Date (mm-dd-yyyy) | Text | No |  | — | e.g., 01-27-2024 |
| `animal_bite_rig` | Special Considerations | Animal Bite — RIG Date (mm-dd-yyyy) | Text | No |  | — | e.g., 01-10-2024 |
| `animal_bite_others` | Special Considerations | Animal Bite — Others (Specify) | Text | No |  | — |  |
| `newborn_essential_care` | Special Considerations | Newborn Care — Essential Newborn Care (check if done) | Dropdown | No | 2 options | — |  |
| `newborn_hearing_screening` | Special Considerations | Newborn Care — Hearing Screening Test (check if done) | Dropdown | No | 2 options | — |  |
| `newborn_screening_test` | Special Considerations | Newborn Care — Newborn Screening Test (check if done) | Dropdown | No | 2 options | — |  |
| `hiv_lab_number` | Special Considerations | HIV/AIDS — Laboratory Number | Text | No |  | — | e.g., LAB-20240101 |
| `philhealth_benefit_first_case_rate` | Special Considerations | PhilHealth Benefits — First Case Rate Amount | Text | No | inputMode=numeric | — | e.g., 32000 |
| `philhealth_benefit_second_case_rate` | Special Considerations | PhilHealth Benefits — Second Case Rate Amount | Text | No | inputMode=numeric | — | e.g., 16000 |
| `philhealth_benefit_icd_rvs_code` | Special Considerations | PhilHealth Benefits — ICD/RVS Code | Text | No |  | — | e.g., J18.9 |
| `hcp1_accreditation_no` | HCP Accreditation & Fees | HCP 1 — Accreditation No. | Text | No |  | — | e.g., HCP-123456 |
| `hcp1_date_signed_month` | HCP Accreditation & Fees | HCP 1 — Date Signed Month | Dropdown | No | 12 options | — |  |
| `hcp1_date_signed_day` | HCP Accreditation & Fees | HCP 1 — Date Signed Day | Dropdown | No | 31 options | — |  |
| `hcp1_date_signed_year` | HCP Accreditation & Fees | HCP 1 — Date Signed Year | Text | No | inputMode=numeric | 4 | e.g., 2024 |
| `hcp1_copay` | HCP Accreditation & Fees | HCP 1 — Co-pay | Dropdown | No | 2 options | — |  |
| `hcp2_accreditation_no` | HCP Accreditation & Fees | HCP 2 — Accreditation No. | Text | No |  | — | e.g., HCP-234567 |
| `hcp2_date_signed_month` | HCP Accreditation & Fees | HCP 2 — Date Signed Month | Dropdown | No | 12 options | — |  |
| `hcp2_date_signed_day` | HCP Accreditation & Fees | HCP 2 — Date Signed Day | Dropdown | No | 31 options | — |  |
| `hcp2_date_signed_year` | HCP Accreditation & Fees | HCP 2 — Date Signed Year | Text | No | inputMode=numeric | 4 | e.g., 2024 |
| `hcp2_copay` | HCP Accreditation & Fees | HCP 2 — Co-pay | Dropdown | No | 2 options | — |  |
| `hcp3_accreditation_no` | HCP Accreditation & Fees | HCP 3 — Accreditation No. | Text | No |  | — | e.g., HCP-345678 |
| `hcp3_date_signed_month` | HCP Accreditation & Fees | HCP 3 — Date Signed Month | Dropdown | No | 12 options | — |  |
| `hcp3_date_signed_day` | HCP Accreditation & Fees | HCP 3 — Date Signed Day | Dropdown | No | 31 options | — |  |
| `hcp3_date_signed_year` | HCP Accreditation & Fees | HCP 3 — Date Signed Year | Text | No | inputMode=numeric | 4 | e.g., 2024 |
| `hcp3_copay` | HCP Accreditation & Fees | HCP 3 — Co-pay | Dropdown | No | 2 options | — |  |
| `total_hci_fees` | Certification of Benefits | Total Health Care Institution Fees | Text | No | inputMode=numeric | — | e.g., 45000.00 |
| `total_professional_fees` | Certification of Benefits | Total Professional Fees | Text | No | inputMode=numeric | — | e.g., 10000.00 |
| `grand_total` | Certification of Benefits | Grand Total | Text | No | inputMode=numeric | — | e.g., 55000.00 |
| `total_actual_charges` | Certification of Benefits | Total Actual Charges (after discount) | Text | No | inputMode=numeric | — | e.g., 50000.00 |
| `discount_amount` | Certification of Benefits | Discount Amount (personal, Senior Citizen/PWD) | Text | No | inputMode=numeric | — | e.g., 5000.00 |
| `philhealth_benefit_amount` | Certification of Benefits | PhilHealth Benefit Amount | Text | No | inputMode=numeric | — | e.g., 32000.00 |
| `amount_after_philhealth` | Certification of Benefits | Amount After PhilHealth Deduction | Text | No | inputMode=numeric | — | e.g., 18000.00 |
| `hci_amount_paid_by` | Certification of Benefits | HCI Fees — Amount Paid | Text | No | inputMode=numeric | — | e.g., 35000.00 |
| `hci_paid_member_patient` | Certification of Benefits | HCI Fees — Paid by Member/Patient? | Dropdown | No | 2 options | — |  |
| `hci_paid_hmo` | Certification of Benefits | HCI Fees — Paid by HMO? | Dropdown | No | 2 options | — |  |
| `hci_paid_others` | Certification of Benefits | HCI Fees — Paid by Others (PCSO, Promissory Note, etc.)? | Dropdown | No | 2 options | — |  |
| `pf_amount_paid_by` | Certification of Benefits | Professional Fees — Amount Paid | Text | No | inputMode=numeric | — | e.g., 10000.00 |
| `pf_paid_member_patient` | Certification of Benefits | Professional Fees — Paid by Member/Patient? | Dropdown | No | 2 options | — |  |
| `pf_paid_hmo` | Certification of Benefits | Professional Fees — Paid by HMO? | Dropdown | No | 2 options | — |  |
| `pf_paid_others` | Certification of Benefits | Professional Fees — Paid by Others (PCSO, Promissory Note, etc.)? | Dropdown | No | 2 options | — |  |
| `drug_purchase_none` | Certification of Benefits | Drug/Medicine Purchase — None? | Dropdown | No | 2 options | — |  |
| `drug_purchase_total_amount` | Certification of Benefits | Drug/Medicine Purchase — Total Amount | Text | No | inputMode=numeric | — | e.g., 2500.00 |
| `diagnostic_purchase_none` | Certification of Benefits | Diagnostic/Laboratory Examination — None? | Dropdown | No | 2 options | — |  |
| `diagnostic_purchase_total_amount` | Certification of Benefits | Diagnostic/Laboratory Examination — Total Amount | Text | No | inputMode=numeric | — | e.g., 1800.00 |
<!-- AUTOGEN:END name="fields" -->

---

## 5) Checkbox & Radio Logic

<!-- AUTOGEN:START name="choices" -->
**`hci_province` — Province** (dropdown)

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

**`patient_name_ext` — Name Extension** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| Jr. | `Jr.` |
| Sr. | `Sr.` |
| II | `II` |
| III | `III` |
| IV | `IV` |

**`referred_by_hci` — Was patient referred by another Health Care Institution?** (dropdown)

| Option | Value |
|---|---|
| NO | `NO` |
| YES | `YES` |

**`date_admitted_month` — Date Admitted — Month** (dropdown)

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

**`date_admitted_day` — Date Admitted — Day** (dropdown)

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

**`time_admitted_ampm` — Time Admitted — AM/PM** (dropdown)

| Option | Value |
|---|---|
| AM | `AM` |
| PM | `PM` |

**`date_discharged_month` — Date Discharged — Month** (dropdown)

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

**`date_discharged_day` — Date Discharged — Day** (dropdown)

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

**`time_discharged_ampm` — Time Discharged — AM/PM** (dropdown)

| Option | Value |
|---|---|
| AM | `AM` |
| PM | `PM` |

**`patient_disposition` — Patient Disposition** (dropdown)

| Option | Value |
|---|---|
| Improved | `Improved` |
| Recovered | `Recovered` |
| Expired | `Expired` |
| Transferred/Referred | `Transferred/Referred` |
| Home/Discharged Against Medical Advise | `Home/Discharged Against Medical Advise` |
| Absconded | `Absconded` |

**`expired_month` — Date/Time Expired — Month** (dropdown)

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

**`expired_day` — Date/Time Expired — Day** (dropdown)

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

**`expired_ampm` — Time Expired — AM/PM** (dropdown)

| Option | Value |
|---|---|
| AM | `AM` |
| PM | `PM` |

**`accommodation_type` — Type of Accommodation** (dropdown)

| Option | Value |
|---|---|
| Private | `Private` |
| Non-Private (Charity/Service) | `Non-Private (Charity/Service)` |

**`discharge_laterality_1` — Laterality i.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`discharge_laterality_2` — Laterality ii.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`discharge_laterality_3` — Laterality iii.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`discharge_laterality_4` — Laterality iv.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`discharge_laterality_5` — Laterality v.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`discharge_laterality_6` — Laterality vi.** (dropdown)

| Option | Value |
|---|---|
| N/A | `N/A` |
| left | `left` |
| right | `right` |
| both | `both` |

**`special_hemodialysis` — Hemodialysis — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_peritoneal_dialysis` — Peritoneal Dialysis — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_radiotherapy_linac` — Radiotherapy (LINAC) — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_radiotherapy_cobalt` — Radiotherapy (COBALT) — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_blood_transfusion` — Blood Transfusion — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_brachytherapy` — Brachytherapy — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_chemotherapy` — Chemotherapy — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`special_simple_debridement` — Simple Debridement — applicable?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`newborn_essential_care` — Newborn Care — Essential Newborn Care (check if done)** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`newborn_hearing_screening` — Newborn Care — Hearing Screening Test (check if done)** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`newborn_screening_test` — Newborn Care — Newborn Screening Test (check if done)** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`hcp1_date_signed_month` — HCP 1 — Date Signed Month** (dropdown)

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

**`hcp1_date_signed_day` — HCP 1 — Date Signed Day** (dropdown)

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

**`hcp1_copay` — HCP 1 — Co-pay** (dropdown)

| Option | Value |
|---|---|
| No co-pay on top of PhilHealth Benefit | `No co-pay on top of PhilHealth Benefit` |
| With co-pay on top of PhilHealth Benefit | `With co-pay on top of PhilHealth Benefit` |

**`hcp2_date_signed_month` — HCP 2 — Date Signed Month** (dropdown)

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

**`hcp2_date_signed_day` — HCP 2 — Date Signed Day** (dropdown)

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

**`hcp2_copay` — HCP 2 — Co-pay** (dropdown)

| Option | Value |
|---|---|
| No co-pay on top of PhilHealth Benefit | `No co-pay on top of PhilHealth Benefit` |
| With co-pay on top of PhilHealth Benefit | `With co-pay on top of PhilHealth Benefit` |

**`hcp3_date_signed_month` — HCP 3 — Date Signed Month** (dropdown)

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

**`hcp3_date_signed_day` — HCP 3 — Date Signed Day** (dropdown)

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

**`hcp3_copay` — HCP 3 — Co-pay** (dropdown)

| Option | Value |
|---|---|
| No co-pay on top of PhilHealth Benefit | `No co-pay on top of PhilHealth Benefit` |
| With co-pay on top of PhilHealth Benefit | `With co-pay on top of PhilHealth Benefit` |

**`hci_paid_member_patient` — HCI Fees — Paid by Member/Patient?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`hci_paid_hmo` — HCI Fees — Paid by HMO?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`hci_paid_others` — HCI Fees — Paid by Others (PCSO, Promissory Note, etc.)?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`pf_paid_member_patient` — Professional Fees — Paid by Member/Patient?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`pf_paid_hmo` — Professional Fees — Paid by HMO?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`pf_paid_others` — Professional Fees — Paid by Others (PCSO, Promissory Note, etc.)?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes | `Yes` |

**`drug_purchase_none` — Drug/Medicine Purchase — None?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes — None | `Yes — None` |

**`diagnostic_purchase_none` — Diagnostic/Laboratory Examination — None?** (dropdown)

| Option | Value |
|---|---|
| No | `No` |
| Yes — None | `Yes — None` |
<!-- AUTOGEN:END name="choices" -->

---

## 6) Layout & Position Mapping

<!-- AUTOGEN:START name="layout" -->
**Coord origin:** pdf-lib (bottom-left). Use `<form>Y(nextRowTop) = pageH - nextRowTop + 3` to convert pdfplumber row tops.

**Copy Y offsets:** 0
**Checkbox coord groups:** 34

| Field ID | Page | X | Y | Font | MaxWidth | Schema |
|---|---|---|---|---|---|---|
| `admission_diagnosis_1` | 0 | 34 | 442.00 | undefined | 570 | ✓ |
| `admission_diagnosis_2` | 0 | 34 | 427.00 | undefined | 570 | ✓ |
| `amount_after_philhealth` | 1 | 426 | 452.00 | undefined | 170 | ✓ |
| `animal_bite_arv_day1` | 0 | 63 | 121.00 | 7 | 83 | ✓ |
| `animal_bite_arv_day2` | 0 | 172 | 121.00 | 7 | 96 | ✓ |
| `animal_bite_arv_day3` | 0 | 293 | 121.00 | 7 | 80 | ✓ |
| `animal_bite_others` | 0 | 495 | 121.00 | 7 | 100 | ✓ |
| `animal_bite_rig` | 0 | 376 | 121.00 | 7 | 92 | ✓ |
| `date_admitted_day` | 0 | 236 | 562.00 | undefined | 34 | ✓ |
| `date_admitted_month` | 0 | 200 | 562.00 | undefined | 34 | ✓ |
| `date_admitted_year` | 0 | 272 | 562.00 | undefined | 50 | ✓ |
| `date_discharged_day` | 0 | 236 | 546.00 | undefined | 34 | ✓ |
| `date_discharged_month` | 0 | 200 | 546.00 | undefined | 34 | ✓ |
| `date_discharged_year` | 0 | 272 | 546.00 | undefined | 50 | ✓ |
| `diagnostic_purchase_total_amount` | 1 | 437 | 313.00 | undefined | 160 | ✓ |
| `discharge_diagnosis_1` | 0 | 55 | 382.00 | 8 | 74 | ✓ |
| `discharge_diagnosis_2` | 0 | 55 | 368.00 | 8 | 74 | ✓ |
| `discharge_diagnosis_3` | 0 | 55 | 354.00 | 8 | 74 | ✓ |
| `discharge_diagnosis_4` | 0 | 55 | 340.00 | 8 | 74 | ✓ |
| `discharge_diagnosis_5` | 0 | 55 | 327.00 | 8 | 74 | ✓ |
| `discharge_diagnosis_6` | 0 | 55 | 313.00 | 8 | 74 | ✓ |
| `discharge_icd10_1` | 0 | 132 | 382.00 | 8 | 65 | ✓ |
| `discharge_icd10_2` | 0 | 132 | 368.00 | 8 | 65 | ✓ |
| `discharge_icd10_3` | 0 | 132 | 354.00 | 8 | 65 | ✓ |
| `discharge_icd10_4` | 0 | 132 | 340.00 | 8 | 65 | ✓ |
| `discharge_icd10_5` | 0 | 132 | 327.00 | 8 | 65 | ✓ |
| `discharge_icd10_6` | 0 | 132 | 313.00 | 8 | 65 | ✓ |
| `discharge_procedure_1` | 0 | 200 | 382.00 | 8 | 139 | ✓ |
| `discharge_procedure_2` | 0 | 200 | 368.00 | 8 | 139 | ✓ |
| `discharge_procedure_3` | 0 | 200 | 354.00 | 8 | 139 | ✓ |
| `discharge_procedure_4` | 0 | 200 | 340.00 | 8 | 139 | ✓ |
| `discharge_procedure_5` | 0 | 200 | 327.00 | 8 | 139 | ✓ |
| `discharge_procedure_6` | 0 | 200 | 313.00 | 8 | 139 | ✓ |
| `discharge_procedure_date_1` | 0 | 399 | 382.00 | 7 | 78 | ✓ |
| `discharge_procedure_date_2` | 0 | 399 | 368.00 | 7 | 78 | ✓ |
| `discharge_procedure_date_3` | 0 | 399 | 354.00 | 7 | 78 | ✓ |
| `discharge_procedure_date_4` | 0 | 399 | 340.00 | 7 | 78 | ✓ |
| `discharge_procedure_date_5` | 0 | 399 | 327.00 | 7 | 78 | ✓ |
| `discharge_procedure_date_6` | 0 | 399 | 313.00 | 7 | 78 | ✓ |
| `discharge_rvs_1` | 0 | 341 | 382.00 | 8 | 57 | ✓ |
| `discharge_rvs_2` | 0 | 341 | 368.00 | 8 | 57 | ✓ |
| `discharge_rvs_3` | 0 | 341 | 354.00 | 8 | 57 | ✓ |
| `discharge_rvs_4` | 0 | 341 | 340.00 | 8 | 57 | ✓ |
| `discharge_rvs_5` | 0 | 341 | 327.00 | 8 | 57 | ✓ |
| `discharge_rvs_6` | 0 | 341 | 313.00 | 8 | 57 | ✓ |
| `discount_amount` | 1 | 222 | 467.00 | undefined | 105 | ✓ |
| `drug_purchase_total_amount` | 1 | 437 | 338.00 | undefined | 160 | ✓ |
| `expired_day` | 0 | 297 | 513.00 | undefined | 34 | ✓ |
| `expired_hour` | 0 | 425 | 513.00 | undefined | 30 | ✓ |
| `expired_min` | 0 | 459 | 513.00 | undefined | 30 | ✓ |
| `expired_month` | 0 | 261 | 513.00 | undefined | 34 | ✓ |
| `expired_year` | 0 | 333 | 513.00 | undefined | 48 | ✓ |
| `grand_total` | 1 | 62 | 550.00 | undefined | 135 | ✓ |
| `hci_amount_paid_by` | 1 | 426 | 490.00 | undefined | 170 | ✓ |
| `hci_bldg_street` | 0 | 128 | 692.00 | undefined | 208 | ✓ |
| `hci_city` | 0 | 338 | 692.00 | undefined | 162 | ✓ |
| `hci_name` | 0 | 34 | 713.00 | undefined | 570 | ✓ |
| `hci_pan` | 0 | 310 | 729.00 | undefined | 280 | ✓ |
| `hci_province` | 0 | 504 | 692.00 | 8 | 100 | ✓ |
| `hcp1_accreditation_no` | 1 | 107 | 866.00 | undefined | 380 | ✓ |
| `hcp1_date_signed_day` | 1 | 164 | 817.00 | undefined | 34 | ✓ |
| `hcp1_date_signed_month` | 1 | 128 | 817.00 | undefined | 34 | ✓ |
| `hcp1_date_signed_year` | 1 | 208 | 817.00 | undefined | 50 | ✓ |
| `hcp2_accreditation_no` | 1 | 107 | 797.00 | undefined | 380 | ✓ |
| `hcp2_date_signed_day` | 1 | 164 | 751.00 | undefined | 34 | ✓ |
| `hcp2_date_signed_month` | 1 | 128 | 751.00 | undefined | 34 | ✓ |
| `hcp2_date_signed_year` | 1 | 208 | 751.00 | undefined | 50 | ✓ |
| `hcp3_accreditation_no` | 1 | 107 | 732.00 | undefined | 380 | ✓ |
| `hcp3_date_signed_day` | 1 | 164 | 689.00 | undefined | 34 | ✓ |
| `hcp3_date_signed_month` | 1 | 128 | 689.00 | undefined | 34 | ✓ |
| `hcp3_date_signed_year` | 1 | 208 | 689.00 | undefined | 50 | ✓ |
| `hiv_lab_number` | 0 | 286 | 52.00 | 8 | 300 | ✓ |
| `mcp_dates` | 0 | 100 | 167.00 | 8 | 490 | ✓ |
| `patient_first_name` | 0 | 290 | 633.00 | undefined | 97 | ✓ |
| `patient_last_name` | 0 | 164 | 633.00 | undefined | 122 | ✓ |
| `patient_middle_name` | 0 | 510 | 633.00 | undefined | 82 | ✓ |
| `patient_name_ext` | 0 | 391 | 633.00 | undefined | 115 | ✓ |
| `pf_amount_paid_by` | 1 | 426 | 438.00 | undefined | 170 | ✓ |
| `philhealth_benefit_amount` | 1 | 341 | 480.00 | undefined | 180 | ✓ |
| `philhealth_benefit_first_case_rate` | 0 | 122 | 22.00 | 8 | 238 | ✓ |
| `philhealth_benefit_icd_rvs_code` | 0 | 87 | 16.00 | 8 | 170 | ✓ |
| `philhealth_benefit_second_case_rate` | 0 | 366 | 22.00 | 8 | 228 | ✓ |
| `reason_for_referral` | 0 | 308 | 464.00 | undefined | 286 | ✓ |
| `referring_hci_bldg_street` | 0 | 271 | 582.00 | undefined | 98 | ✓ |
| `referring_hci_city` | 0 | 400 | 582.00 | undefined | 90 | ✓ |
| `referring_hci_name` | 0 | 122 | 582.00 | undefined | 145 | ✓ |
| `referring_hci_province` | 0 | 492 | 582.00 | 8 | 72 | ✓ |
| `referring_hci_zip` | 0 | 566 | 582.00 | undefined | 28 | ✓ |
| `tbdots_intensive_phase` | 0 | 200 | 153.00 | 8 | 110 | ✓ |
| `tbdots_maintenance_phase` | 0 | 310 | 153.00 | 8 | 180 | ✓ |
| `time_admitted_hour` | 0 | 394 | 562.00 | undefined | 30 | ✓ |
| `time_admitted_min` | 0 | 427 | 562.00 | undefined | 30 | ✓ |
| `time_discharged_hour` | 0 | 394 | 546.00 | undefined | 30 | ✓ |
| `time_discharged_min` | 0 | 427 | 546.00 | undefined | 30 | ✓ |
| `total_actual_charges` | 1 | 415 | 595.00 | undefined | 180 | ✓ |
| `total_hci_fees` | 1 | 62 | 580.00 | undefined | 135 | ✓ |
| `total_professional_fees` | 1 | 62 | 565.00 | undefined | 135 | ✓ |
| `transferred_hci_bldg_street` | 0 | 279 | 481.00 | undefined | 98 | ✓ |
| `transferred_hci_city` | 0 | 400 | 481.00 | undefined | 88 | ✓ |
| `transferred_hci_name` | 0 | 370 | 498.00 | undefined | 224 | ✓ |
| `transferred_hci_province` | 0 | 490 | 481.00 | 8 | 67 | ✓ |
| `transferred_hci_zip` | 0 | 558 | 481.00 | undefined | 36 | ✓ |
| `zbenefit_package_code` | 0 | 285 | 196.00 | 8 | 120 | ✓ |

**Skip values (treated as blank):**

- `patient_name_ext`: `N/A`
- `discharge_laterality_1`: `N/A`
- `discharge_laterality_2`: `N/A`
- `discharge_laterality_3`: `N/A`
- `discharge_laterality_4`: `N/A`
- `discharge_laterality_5`: `N/A`
- `discharge_laterality_6`: `N/A`
- `special_hemodialysis`: `No`
- `special_peritoneal_dialysis`: `No`
- `special_radiotherapy_linac`: `No`
- `special_radiotherapy_cobalt`: `No`
- `special_blood_transfusion`: `No`
- `special_brachytherapy`: `No`
- `special_chemotherapy`: `No`
- `special_simple_debridement`: `No`
- `newborn_essential_care`: `No`
- `newborn_hearing_screening`: `No`
- `newborn_screening_test`: `No`
- `hci_paid_member_patient`: `No`
- `hci_paid_hmo`: `No`
- `hci_paid_others`: `No`
- `pf_paid_member_patient`: `No`
- `pf_paid_hmo`: `No`
- `pf_paid_others`: `No`
- `drug_purchase_none`: `No`
- `diagnostic_purchase_none`: `No`
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

# Field Dictionary — PhilHealth Claim Form 2

> Auto-generated from `src/data/forms.ts` by `scripts/generate-field-dictionaries.ts`.
> Sections marked **TODO** require human curation; the rest mirror the live schema.

---

## 1) Form Metadata

| Field | Value |
|---|---|
| **Form Name** | PhilHealth Claim Form 2 |
| **Agency** | PhilHealth |
| **Form Code / Version** | CF-2 (Revised September 2018) |
| **Category** | Health Insurance |
| **Slug** | `philhealth-claim-form-2` |
| **Source PDF Location** | `public/forms/PhilHealth - ClaimForm2_092018.pdf` |
| **Output API** | `POST /api/generate` body `{slug:"philhealth-claim-form-2", values:{…}}` |
| **Field Count** | 137 |
| **Steps / Sections** | 8 |

**Purpose:** PhilHealth Claim Form 2 — submitted by the Health Care Institution (HCI). Contains HCI info, patient confinement details, diagnoses, procedures, special considerations, HCP fees, and certification of benefits consumption.

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
| S1 | HCI Information | — | step 1, 5 fields |
| S2 | Patient Information | — | step 2, 4 fields |
| S3 | Referral & Confinement | — | step 3, 18 fields |
| S4 | Disposition & Accommodation | — | step 4, 14 fields |
| S5 | Diagnoses & Procedures | — | step 5, 38 fields |
| S6 | Special Considerations | — | step 6, 24 fields |
| S7 | HCP Accreditation & Fees | — | step 7, 15 fields |
| S8 | Certification of Benefits | — | step 8, 19 fields |

---

## 4) Field Inventory

| Field ID | Section | Label | Type | Required | User Fills | Validation | Max Len | Boxed? | Conditional | Example | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| hci_pan | HCI Information | PhilHealth Accreditation Number (PAN) of Health Care Institution | Text (short) | Yes | Yes |  | — | — | — | e.g., HCI-123456 |  |
| hci_name | HCI Information | Name of Health Care Institution | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., ST. LUKE'S MEDICAL CENTER |  |
| hci_bldg_street | HCI Information | Building Number and Street Name | Text (short) | Yes | Yes |  | — | — | — | e.g., 279 E. Rodriguez Sr. Blvd. |  |
| hci_city | HCI Information | City/Municipality | Text (short) | Yes | Yes |  | — | — | — | e.g., Quezon City |  |
| hci_province | HCI Information | Province | Dropdown | Yes | Yes | options(83) | — | — | — |  |  |
| patient_last_name | Patient Information | Last Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., DELA CRUZ |  |
| patient_first_name | Patient Information | First Name | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., JUAN ANDRES |  |
| patient_name_ext | Patient Information | Name Extension | Dropdown | No | Yes | options(6) | — | — | — |  |  |
| patient_middle_name | Patient Information | Middle Name | Text (short) | No | Yes | UPPERCASE | — | Maybe | — | e.g., SANTOS |  |
| referred_by_hci | Referral & Confinement | Was patient referred by another Health Care Institution? | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| referring_hci_name | Referral & Confinement | Name of Referring Health Care Institution | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., HEALTH CENTER MANILA |  |
| referring_hci_bldg_street | Referral & Confinement | Building Number and Street Name (Referring HCI) | Text (short) | No | Yes |  | — | — | — | e.g., 123 Rizal Ave. |  |
| referring_hci_city | Referral & Confinement | City/Municipality (Referring HCI) | Text (short) | No | Yes |  | — | — | — | e.g., Manila |  |
| referring_hci_province | Referral & Confinement | Province (Referring HCI) | Text (short) | No | Yes |  | — | — | — | e.g., Metro Manila |  |
| referring_hci_zip | Referral & Confinement | ZIP Code (Referring HCI) | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — | 1000 |  |
| date_admitted_month | Referral & Confinement | Date Admitted — Month | Dropdown | Yes | Yes | options(12) | — | — | — |  |  |
| date_admitted_day | Referral & Confinement | Date Admitted — Day | Dropdown | Yes | Yes | options(31) | — | — | — |  |  |
| date_admitted_year | Referral & Confinement | Date Admitted — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| time_admitted_hour | Referral & Confinement | Time Admitted — Hour | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 08 |  |
| time_admitted_min | Referral & Confinement | Time Admitted — Minutes | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 30 |  |
| time_admitted_ampm | Referral & Confinement | Time Admitted — AM/PM | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| date_discharged_month | Referral & Confinement | Date Discharged — Month | Dropdown | Yes | Yes | options(12) | — | — | — |  |  |
| date_discharged_day | Referral & Confinement | Date Discharged — Day | Dropdown | Yes | Yes | options(31) | — | — | — |  |  |
| date_discharged_year | Referral & Confinement | Date Discharged — Year | Text (short) | Yes | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| time_discharged_hour | Referral & Confinement | Time Discharged — Hour | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 02 |  |
| time_discharged_min | Referral & Confinement | Time Discharged — Minutes | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 00 |  |
| time_discharged_ampm | Referral & Confinement | Time Discharged — AM/PM | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| patient_disposition | Disposition & Accommodation | Patient Disposition | Dropdown | Yes | Yes | options(6) | — | — | — |  |  |
| expired_month | Disposition & Accommodation | Date/Time Expired — Month | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| expired_day | Disposition & Accommodation | Date/Time Expired — Day | Dropdown | No | Yes | options(31) | — | — | — |  |  |
| expired_year | Disposition & Accommodation | Date/Time Expired — Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| expired_hour | Disposition & Accommodation | Time Expired — Hour | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 03 |  |
| expired_min | Disposition & Accommodation | Time Expired — Minutes | Text (short) | No | Yes | inputMode=numeric | 2 | — | — | e.g., 45 |  |
| expired_ampm | Disposition & Accommodation | Time Expired — AM/PM | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| transferred_hci_name | Disposition & Accommodation | Name of Referral Health Care Institution | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., PHILIPPINE GENERAL HOSPITAL |  |
| transferred_hci_bldg_street | Disposition & Accommodation | Building Number and Street Name (Transfer HCI) | Text (short) | No | Yes |  | — | — | — | e.g., Taft Ave. |  |
| transferred_hci_city | Disposition & Accommodation | City/Municipality (Transfer HCI) | Text (short) | No | Yes |  | — | — | — | e.g., Manila |  |
| transferred_hci_province | Disposition & Accommodation | Province (Transfer HCI) | Text (short) | No | Yes |  | — | — | — | e.g., Metro Manila |  |
| transferred_hci_zip | Disposition & Accommodation | ZIP Code (Transfer HCI) | Text (short) | No | Yes | inputMode=numeric | 4 | Maybe | — | 1000 |  |
| reason_for_referral | Disposition & Accommodation | Reason/s for Referral/Transfer | Text (short) | No | Yes |  | — | — | — | e.g., Needs specialist care |  |
| accommodation_type | Disposition & Accommodation | Type of Accommodation | Dropdown | Yes | Yes | options(2) | — | — | — |  |  |
| admission_diagnosis_1 | Diagnoses & Procedures | Admission Diagnosis 1 | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., COMMUNITY-ACQUIRED PNEUMONIA |  |
| admission_diagnosis_2 | Diagnoses & Procedures | Admission Diagnosis 2 | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., HYPERTENSION |  |
| discharge_diagnosis_1 | Diagnoses & Procedures | Discharge Diagnosis i. | Text (short) | Yes | Yes | UPPERCASE | — | — | — | e.g., PNEUMONIA, UNSPECIFIED |  |
| discharge_icd10_1 | Diagnoses & Procedures | ICD-10 Code i. | Text (short) | No | Yes |  | — | — | — | e.g., J18.9 |  |
| discharge_procedure_1 | Diagnoses & Procedures | Related Procedure i. | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., CHEST X-RAY |  |
| discharge_rvs_1 | Diagnoses & Procedures | RVS Code i. | Text (short) | No | Yes |  | — | — | — | e.g., 71046 |  |
| discharge_procedure_date_1 | Diagnoses & Procedures | Date of Procedure i. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-15-2024 |  |
| discharge_laterality_1 | Diagnoses & Procedures | Laterality i. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| discharge_diagnosis_2 | Diagnoses & Procedures | Discharge Diagnosis ii. | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., HYPERTENSION |  |
| discharge_icd10_2 | Diagnoses & Procedures | ICD-10 Code ii. | Text (short) | No | Yes |  | — | — | — | e.g., I10 |  |
| discharge_procedure_2 | Diagnoses & Procedures | Related Procedure ii. | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., ECG |  |
| discharge_rvs_2 | Diagnoses & Procedures | RVS Code ii. | Text (short) | No | Yes |  | — | — | — | e.g., 93000 |  |
| discharge_procedure_date_2 | Diagnoses & Procedures | Date of Procedure ii. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-15-2024 |  |
| discharge_laterality_2 | Diagnoses & Procedures | Laterality ii. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| discharge_diagnosis_3 | Diagnoses & Procedures | Discharge Diagnosis iii. | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., DIABETES MELLITUS TYPE 2 |  |
| discharge_icd10_3 | Diagnoses & Procedures | ICD-10 Code iii. | Text (short) | No | Yes |  | — | — | — | e.g., E11 |  |
| discharge_procedure_3 | Diagnoses & Procedures | Related Procedure iii. | Text (short) | No | Yes | UPPERCASE | — | — | — | e.g., BLOOD GLUCOSE MONITORING |  |
| discharge_rvs_3 | Diagnoses & Procedures | RVS Code iii. | Text (short) | No | Yes |  | — | — | — | e.g., 82962 |  |
| discharge_procedure_date_3 | Diagnoses & Procedures | Date of Procedure iii. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-16-2024 |  |
| discharge_laterality_3 | Diagnoses & Procedures | Laterality iii. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| discharge_diagnosis_4 | Diagnoses & Procedures | Discharge Diagnosis iv. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_icd10_4 | Diagnoses & Procedures | ICD-10 Code iv. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_4 | Diagnoses & Procedures | Related Procedure iv. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_rvs_4 | Diagnoses & Procedures | RVS Code iv. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_date_4 | Diagnoses & Procedures | Date of Procedure iv. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-16-2024 |  |
| discharge_laterality_4 | Diagnoses & Procedures | Laterality iv. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| discharge_diagnosis_5 | Diagnoses & Procedures | Discharge Diagnosis v. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_icd10_5 | Diagnoses & Procedures | ICD-10 Code v. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_5 | Diagnoses & Procedures | Related Procedure v. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_rvs_5 | Diagnoses & Procedures | RVS Code v. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_date_5 | Diagnoses & Procedures | Date of Procedure v. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-17-2024 |  |
| discharge_laterality_5 | Diagnoses & Procedures | Laterality v. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| discharge_diagnosis_6 | Diagnoses & Procedures | Discharge Diagnosis vi. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_icd10_6 | Diagnoses & Procedures | ICD-10 Code vi. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_6 | Diagnoses & Procedures | Related Procedure vi. | Text (short) | No | Yes | UPPERCASE | — | — | — |  |  |
| discharge_rvs_6 | Diagnoses & Procedures | RVS Code vi. | Text (short) | No | Yes |  | — | — | — |  |  |
| discharge_procedure_date_6 | Diagnoses & Procedures | Date of Procedure vi. (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-17-2024 |  |
| discharge_laterality_6 | Diagnoses & Procedures | Laterality vi. | Dropdown | No | Yes | options(4) | — | — | — |  |  |
| special_hemodialysis | Special Considerations | Hemodialysis — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_peritoneal_dialysis | Special Considerations | Peritoneal Dialysis — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_radiotherapy_linac | Special Considerations | Radiotherapy (LINAC) — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_radiotherapy_cobalt | Special Considerations | Radiotherapy (COBALT) — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_blood_transfusion | Special Considerations | Blood Transfusion — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_brachytherapy | Special Considerations | Brachytherapy — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_chemotherapy | Special Considerations | Chemotherapy — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| special_simple_debridement | Special Considerations | Simple Debridement — applicable? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| zbenefit_package_code | Special Considerations | Z-Benefit Package Code | Text (short) | No | Yes |  | — | — | — | e.g., ZBP-001 |  |
| mcp_dates | Special Considerations | MCP Package — 4 Pre-natal Check-up Dates (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 06-01-2024, 07-01-2024, 08-01-2024, 09-01-2024 |  |
| tbdots_intensive_phase | Special Considerations | TB DOTS — Intensive Phase Dates | Text (short) | No | Yes |  | — | — | — | e.g., 01-01-2024 to 02-28-2024 |  |
| tbdots_maintenance_phase | Special Considerations | TB DOTS — Maintenance Phase Dates | Text (short) | No | Yes |  | — | — | — | e.g., 03-01-2024 to 06-30-2024 |  |
| animal_bite_arv_day1 | Special Considerations | Animal Bite — ARV Day 1 Date (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-10-2024 |  |
| animal_bite_arv_day2 | Special Considerations | Animal Bite — ARV Day 2 Date (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-13-2024 |  |
| animal_bite_arv_day3 | Special Considerations | Animal Bite — ARV Day 3 Date (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-27-2024 |  |
| animal_bite_rig | Special Considerations | Animal Bite — RIG Date (mm-dd-yyyy) | Text (short) | No | Yes |  | — | — | — | e.g., 01-10-2024 |  |
| animal_bite_others | Special Considerations | Animal Bite — Others (Specify) | Text (short) | No | Yes |  | — | — | — |  |  |
| newborn_essential_care | Special Considerations | Newborn Care — Essential Newborn Care (check if done) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| newborn_hearing_screening | Special Considerations | Newborn Care — Hearing Screening Test (check if done) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| newborn_screening_test | Special Considerations | Newborn Care — Newborn Screening Test (check if done) | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| hiv_lab_number | Special Considerations | HIV/AIDS — Laboratory Number | Text (short) | No | Yes |  | — | — | — | e.g., LAB-20240101 |  |
| philhealth_benefit_first_case_rate | Special Considerations | PhilHealth Benefits — First Case Rate Amount | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 32000 |  |
| philhealth_benefit_second_case_rate | Special Considerations | PhilHealth Benefits — Second Case Rate Amount | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 16000 |  |
| philhealth_benefit_icd_rvs_code | Special Considerations | PhilHealth Benefits — ICD/RVS Code | Text (short) | No | Yes |  | — | — | — | e.g., J18.9 |  |
| hcp1_accreditation_no | HCP Accreditation & Fees | HCP 1 — Accreditation No. | Text (short) | No | Yes |  | — | — | — | e.g., HCP-123456 |  |
| hcp1_date_signed_month | HCP Accreditation & Fees | HCP 1 — Date Signed Month | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| hcp1_date_signed_day | HCP Accreditation & Fees | HCP 1 — Date Signed Day | Dropdown | No | Yes | options(31) | — | — | — |  |  |
| hcp1_date_signed_year | HCP Accreditation & Fees | HCP 1 — Date Signed Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| hcp1_copay | HCP Accreditation & Fees | HCP 1 — Co-pay | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| hcp2_accreditation_no | HCP Accreditation & Fees | HCP 2 — Accreditation No. | Text (short) | No | Yes |  | — | — | — | e.g., HCP-234567 |  |
| hcp2_date_signed_month | HCP Accreditation & Fees | HCP 2 — Date Signed Month | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| hcp2_date_signed_day | HCP Accreditation & Fees | HCP 2 — Date Signed Day | Dropdown | No | Yes | options(31) | — | — | — |  |  |
| hcp2_date_signed_year | HCP Accreditation & Fees | HCP 2 — Date Signed Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| hcp2_copay | HCP Accreditation & Fees | HCP 2 — Co-pay | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| hcp3_accreditation_no | HCP Accreditation & Fees | HCP 3 — Accreditation No. | Text (short) | No | Yes |  | — | — | — | e.g., HCP-345678 |  |
| hcp3_date_signed_month | HCP Accreditation & Fees | HCP 3 — Date Signed Month | Dropdown | No | Yes | options(12) | — | — | — |  |  |
| hcp3_date_signed_day | HCP Accreditation & Fees | HCP 3 — Date Signed Day | Dropdown | No | Yes | options(31) | — | — | — |  |  |
| hcp3_date_signed_year | HCP Accreditation & Fees | HCP 3 — Date Signed Year | Text (short) | No | Yes | inputMode=numeric | 4 | — | — | e.g., 2024 |  |
| hcp3_copay | HCP Accreditation & Fees | HCP 3 — Co-pay | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| total_hci_fees | Certification of Benefits | Total Health Care Institution Fees | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 45000.00 |  |
| total_professional_fees | Certification of Benefits | Total Professional Fees | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 10000.00 |  |
| grand_total | Certification of Benefits | Grand Total | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 55000.00 |  |
| total_actual_charges | Certification of Benefits | Total Actual Charges (after discount) | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 50000.00 |  |
| discount_amount | Certification of Benefits | Discount Amount (personal, Senior Citizen/PWD) | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 5000.00 |  |
| philhealth_benefit_amount | Certification of Benefits | PhilHealth Benefit Amount | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 32000.00 |  |
| amount_after_philhealth | Certification of Benefits | Amount After PhilHealth Deduction | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 18000.00 |  |
| hci_amount_paid_by | Certification of Benefits | HCI Fees — Amount Paid | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 35000.00 |  |
| hci_paid_member_patient | Certification of Benefits | HCI Fees — Paid by Member/Patient? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| hci_paid_hmo | Certification of Benefits | HCI Fees — Paid by HMO? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| hci_paid_others | Certification of Benefits | HCI Fees — Paid by Others (PCSO, Promissory Note, etc.)? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| pf_amount_paid_by | Certification of Benefits | Professional Fees — Amount Paid | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 10000.00 |  |
| pf_paid_member_patient | Certification of Benefits | Professional Fees — Paid by Member/Patient? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| pf_paid_hmo | Certification of Benefits | Professional Fees — Paid by HMO? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| pf_paid_others | Certification of Benefits | Professional Fees — Paid by Others (PCSO, Promissory Note, etc.)? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| drug_purchase_none | Certification of Benefits | Drug/Medicine Purchase — None? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| drug_purchase_total_amount | Certification of Benefits | Drug/Medicine Purchase — Total Amount | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 2500.00 |  |
| diagnostic_purchase_none | Certification of Benefits | Diagnostic/Laboratory Examination — None? | Dropdown | No | Yes | options(2) | — | — | — |  |  |
| diagnostic_purchase_total_amount | Certification of Benefits | Diagnostic/Laboratory Examination — Total Amount | Text (short) | No | Yes | inputMode=numeric | — | — | — | e.g., 1800.00 |  |

---

## 5) Checkbox & Radio Logic

**Field Group:** `hci_province` — Province  
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

**Field Group:** `patient_name_ext` — Name Extension  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| Jr. | Jr. | No |
| Sr. | Sr. | No |
| II | II | No |
| III | III | No |
| IV | IV | No |

**Field Group:** `referred_by_hci` — Was patient referred by another Health Care Institution?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| NO | NO | No |
| YES | YES | No |

**Field Group:** `date_admitted_month` — Date Admitted — Month  
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

**Field Group:** `date_admitted_day` — Date Admitted — Day  
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

**Field Group:** `time_admitted_ampm` — Time Admitted — AM/PM  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| AM | AM | No |
| PM | PM | No |

**Field Group:** `date_discharged_month` — Date Discharged — Month  
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

**Field Group:** `date_discharged_day` — Date Discharged — Day  
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

**Field Group:** `time_discharged_ampm` — Time Discharged — AM/PM  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| AM | AM | No |
| PM | PM | No |

**Field Group:** `patient_disposition` — Patient Disposition  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Improved | Improved | No |
| Recovered | Recovered | No |
| Expired | Expired | No |
| Transferred/Referred | Transferred/Referred | No |
| Home/Discharged Against Medical Advise | Home/Discharged Against Medical Advise | No |
| Absconded | Absconded | No |

**Field Group:** `expired_month` — Date/Time Expired — Month  
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

**Field Group:** `expired_day` — Date/Time Expired — Day  
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

**Field Group:** `expired_ampm` — Time Expired — AM/PM  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| AM | AM | No |
| PM | PM | No |

**Field Group:** `accommodation_type` — Type of Accommodation  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| Private | Private | No |
| Non-Private (Charity/Service) | Non-Private (Charity/Service) | No |

**Field Group:** `discharge_laterality_1` — Laterality i.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `discharge_laterality_2` — Laterality ii.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `discharge_laterality_3` — Laterality iii.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `discharge_laterality_4` — Laterality iv.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `discharge_laterality_5` — Laterality v.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `discharge_laterality_6` — Laterality vi.  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| N/A | N/A | No |
| left | left | No |
| right | right | No |
| both | both | No |

**Field Group:** `special_hemodialysis` — Hemodialysis — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_peritoneal_dialysis` — Peritoneal Dialysis — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_radiotherapy_linac` — Radiotherapy (LINAC) — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_radiotherapy_cobalt` — Radiotherapy (COBALT) — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_blood_transfusion` — Blood Transfusion — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_brachytherapy` — Brachytherapy — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_chemotherapy` — Chemotherapy — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `special_simple_debridement` — Simple Debridement — applicable?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `newborn_essential_care` — Newborn Care — Essential Newborn Care (check if done)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `newborn_hearing_screening` — Newborn Care — Hearing Screening Test (check if done)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `newborn_screening_test` — Newborn Care — Newborn Screening Test (check if done)  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `hcp1_date_signed_month` — HCP 1 — Date Signed Month  
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

**Field Group:** `hcp1_date_signed_day` — HCP 1 — Date Signed Day  
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

**Field Group:** `hcp1_copay` — HCP 1 — Co-pay  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No co-pay on top of PhilHealth Benefit | No co-pay on top of PhilHealth Benefit | No |
| With co-pay on top of PhilHealth Benefit | With co-pay on top of PhilHealth Benefit | No |

**Field Group:** `hcp2_date_signed_month` — HCP 2 — Date Signed Month  
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

**Field Group:** `hcp2_date_signed_day` — HCP 2 — Date Signed Day  
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

**Field Group:** `hcp2_copay` — HCP 2 — Co-pay  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No co-pay on top of PhilHealth Benefit | No co-pay on top of PhilHealth Benefit | No |
| With co-pay on top of PhilHealth Benefit | With co-pay on top of PhilHealth Benefit | No |

**Field Group:** `hcp3_date_signed_month` — HCP 3 — Date Signed Month  
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

**Field Group:** `hcp3_date_signed_day` — HCP 3 — Date Signed Day  
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

**Field Group:** `hcp3_copay` — HCP 3 — Co-pay  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No co-pay on top of PhilHealth Benefit | No co-pay on top of PhilHealth Benefit | No |
| With co-pay on top of PhilHealth Benefit | With co-pay on top of PhilHealth Benefit | No |

**Field Group:** `hci_paid_member_patient` — HCI Fees — Paid by Member/Patient?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `hci_paid_hmo` — HCI Fees — Paid by HMO?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `hci_paid_others` — HCI Fees — Paid by Others (PCSO, Promissory Note, etc.)?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `pf_paid_member_patient` — Professional Fees — Paid by Member/Patient?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `pf_paid_hmo` — Professional Fees — Paid by HMO?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `pf_paid_others` — Professional Fees — Paid by Others (PCSO, Promissory Note, etc.)?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes | Yes | No |

**Field Group:** `drug_purchase_none` — Drug/Medicine Purchase — None?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes — None | Yes — None | No |

**Field Group:** `diagnostic_purchase_none` — Diagnostic/Laboratory Examination — None?  
**Selection Type:** Dropdown

| Option Label | Value | Default |
|---|---|---|
| No | No | No |
| Yes — None | Yes — None | No |


---

## 6) Layout & Position Mapping

See `src/lib/pdf-generator.ts` constant `PHILHEALTH_CLAIM_FORM_2_FIELD_COORDS` (or matching `*_FIELD_COORDS`).
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

_Generated: 2026-04-23T17:02:26.387Z_

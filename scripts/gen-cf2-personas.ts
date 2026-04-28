#!/usr/bin/env tsx
/**
 * CF-2 (PhilHealth Claim Form 2) persona generator.
 * Builds sample-A/B/C/D.pdf into .qa-output/cf-2/ for Mai's zoom-band QA
 * after L-SMART-CF2-01 (combined dates + combined times + boolean toggle +
 * visibleWhen branches + currency masks + HCI/HCP PAN auto-format).
 *
 * Personas exercise:
 *   A — direct admission, no referral, simple appendectomy, 1 HCP
 *   B — referred-in (referring-HCI block populated), 1 HCP, 2-dx CAP
 *   C — Transferred-out (Transferred/Referred branch + 3 HCPs + special
 *       considerations: HD + transfusion, Senior Citizen discount, multi-payer)
 *   D — Paediatric, transferred-out, no co-pay (zero member balance)
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  // ── Sample A — Standard appendicitis admission, 1 HCP, no referral. ──
  {
    hci_pan: 'HCI-10-123456', hci_name: 'MAKATI MEDICAL CENTER',
    hci_bldg_street: '2 AMORSOLO ST', hci_city: 'MAKATI CITY',
    hci_province: 'Metro Manila (NCR)',
    patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN',
    patient_name_ext: 'N/A', patient_middle_name: 'SANTOS',
    referred_by_hci: '',
    date_admitted:    '04 / 10 / 2026', time_admitted:    '08 : 30 AM',
    date_discharged:  '04 / 15 / 2026', time_discharged:  '02 : 00 PM',
    patient_disposition: 'Recovered',
    accommodation_type: 'Non-Private (Charity/Service)',
    admission_diagnosis_1: 'ACUTE APPENDICITIS',
    admission_diagnosis_2: 'GENERALIZED ABDOMINAL PAIN',
    discharge_diagnosis_1: 'APPENDICITIS', discharge_icd10_1: 'K37',
    discharge_procedure_1: 'APPENDECTOMY', discharge_rvs_1: '10060',
    discharge_procedure_date_1: '04 / 11 / 2026', discharge_laterality_1: 'N/A',
    discharge_laterality_2: 'N/A', discharge_laterality_3: 'N/A',
    discharge_laterality_4: 'N/A', discharge_laterality_5: 'N/A', discharge_laterality_6: 'N/A',
    special_hemodialysis: 'No', special_peritoneal_dialysis: 'No',
    special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No',
    special_blood_transfusion: 'No', special_brachytherapy: 'No',
    special_chemotherapy: 'No', special_simple_debridement: 'No',
    philhealth_benefit_first_case_rate: '24,000',
    philhealth_benefit_icd_rvs_code: 'K37 / 10060',
    hcp1_accreditation_no: 'HCP-20-012345',
    hcp1_date_signed: '04 / 15 / 2026',
    hcp1_copay: 'No co-pay on top of PhilHealth Benefit',
    total_hci_fees: '35,000', total_professional_fees: '8,000', grand_total: '43,000',
    total_actual_charges: '43,000', discount_amount: '0',
    philhealth_benefit_amount: '18,000', amount_after_philhealth: '25,000',
    hci_amount_paid_by: '25,000',
    hci_paid_member_patient: 'Yes', hci_paid_hmo: 'No', hci_paid_others: 'No',
    pf_amount_paid_by: '8,000',
    pf_paid_member_patient: 'Yes', pf_paid_hmo: 'No', pf_paid_others: 'No',
    drug_purchase_total_amount: '2,500',
    diagnostic_purchase_total_amount: '3,500',
  },
  // ── Sample B — Referred-in CAP admission, 2 dx, 1 HCP. ──
  {
    hci_pan: 'HCI-20-987654', hci_name: 'PHILIPPINE GENERAL HOSPITAL',
    hci_bldg_street: 'TAFT AVENUE', hci_city: 'MANILA', hci_province: 'Metro Manila (NCR)',
    patient_last_name: 'SANTOS', patient_first_name: 'ANNA MARIE',
    patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
    referred_by_hci: 'true',
    referring_hci_name: 'CITY HEALTH CENTER MALATE',
    referring_hci_bldg_street: 'ADRIATICO ST',
    referring_hci_city: 'MANILA',
    referring_hci_province: 'METRO MANILA',
    referring_hci_zip: '1004',
    date_admitted:   '03 / 22 / 2026', time_admitted:   '11 : 45 AM',
    date_discharged: '03 / 28 / 2026', time_discharged: '10 : 00 AM',
    patient_disposition: 'Improved',
    accommodation_type: 'Non-Private (Charity/Service)',
    admission_diagnosis_1: 'COMMUNITY ACQUIRED PNEUMONIA',
    admission_diagnosis_2: 'HYPERTENSION',
    discharge_diagnosis_1: 'CAP-MODERATE RISK', discharge_icd10_1: 'J18.9',
    discharge_procedure_1: 'SUPPORTIVE MANAGEMENT', discharge_laterality_1: 'N/A',
    discharge_diagnosis_2: 'HYPERTENSION STAGE 2', discharge_icd10_2: 'I10',
    discharge_laterality_2: 'N/A',
    discharge_laterality_3: 'N/A', discharge_laterality_4: 'N/A',
    discharge_laterality_5: 'N/A', discharge_laterality_6: 'N/A',
    special_hemodialysis: 'No', special_peritoneal_dialysis: 'No',
    special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No',
    special_blood_transfusion: 'No', special_brachytherapy: 'No',
    special_chemotherapy: 'No', special_simple_debridement: 'No',
    zbenefit_package_code: 'CAP-MR',
    philhealth_benefit_first_case_rate: '15,000',
    philhealth_benefit_second_case_rate: '7,500',
    philhealth_benefit_icd_rvs_code: 'J18.9 / I10',
    hcp1_accreditation_no: 'HCP-21-098765',
    hcp1_date_signed: '03 / 28 / 2026',
    hcp1_copay: 'No co-pay on top of PhilHealth Benefit',
    total_hci_fees: '28,000', total_professional_fees: '6,000', grand_total: '34,000',
    total_actual_charges: '34,000', discount_amount: '0',
    philhealth_benefit_amount: '16,000', amount_after_philhealth: '18,000',
    hci_amount_paid_by: '18,000',
    hci_paid_member_patient: 'Yes', hci_paid_hmo: 'No', hci_paid_others: 'No',
    pf_amount_paid_by: '6,000',
    pf_paid_member_patient: 'Yes', pf_paid_hmo: 'No', pf_paid_others: 'No',
    drug_purchase_total_amount: '4,500',
    diagnostic_purchase_total_amount: '2,200',
  },
  // ── Sample C — ESRD/HD with Transferred/Referred branch + 3 HCPs. ──
  {
    hci_pan: 'HCI-33-111122', hci_name: "ST. LUKE'S MEDICAL CENTER",
    hci_bldg_street: 'E. RODRIGUEZ SR. BLVD',
    hci_city: 'QUEZON CITY', hci_province: 'Metro Manila (NCR)',
    patient_last_name: 'REYES', patient_first_name: 'CARLOS MIGUEL',
    patient_name_ext: 'Jr.', patient_middle_name: 'VILLANUEVA',
    referred_by_hci: 'true',
    referring_hci_name: 'QUEZON CITY GENERAL HOSPITAL',
    referring_hci_bldg_street: 'SEMINARY RD',
    referring_hci_city: 'QUEZON CITY',
    referring_hci_province: 'METRO MANILA',
    referring_hci_zip: '1100',
    date_admitted:   '02 / 14 / 2026', time_admitted:   '09 : 15 AM',
    date_discharged: '02 / 28 / 2026', time_discharged: '03 : 30 PM',
    patient_disposition: 'Transferred/Referred',
    transferred_hci_name: 'NATIONAL KIDNEY INSTITUTE',
    transferred_hci_bldg_street: 'EAST AVE',
    transferred_hci_city: 'QUEZON CITY',
    transferred_hci_province: 'METRO MANILA',
    transferred_hci_zip: '1101',
    reason_for_referral: 'Requires dialysis management',
    accommodation_type: 'Private',
    admission_diagnosis_1: 'END STAGE RENAL DISEASE',
    admission_diagnosis_2: 'DIABETES MELLITUS TYPE 2',
    discharge_diagnosis_1: 'ESRD ON HEMODIALYSIS', discharge_icd10_1: 'N18.6',
    discharge_procedure_1: 'HEMODIALYSIS', discharge_rvs_1: '90935',
    discharge_procedure_date_1: '02 / 16 / 2026', discharge_laterality_1: 'N/A',
    discharge_diagnosis_2: 'DM TYPE 2 UNCONTROLLED', discharge_icd10_2: 'E11.9',
    discharge_procedure_2: 'INSULIN THERAPY', discharge_laterality_2: 'N/A',
    discharge_diagnosis_3: 'HYPERTENSION', discharge_icd10_3: 'I10',
    discharge_procedure_3: 'ANTIHYPERTENSIVE MEDS', discharge_laterality_3: 'N/A',
    discharge_diagnosis_4: 'ANEMIA OF CKD', discharge_icd10_4: 'D63.1',
    discharge_procedure_4: 'BLOOD TRANSFUSION', discharge_rvs_4: '86950',
    discharge_procedure_date_4: '02 / 18 / 2026', discharge_laterality_4: 'N/A',
    discharge_laterality_5: 'N/A', discharge_laterality_6: 'N/A',
    special_hemodialysis: 'Yes', special_peritoneal_dialysis: 'No',
    special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No',
    special_blood_transfusion: 'Yes', special_brachytherapy: 'No',
    special_chemotherapy: 'No', special_simple_debridement: 'No',
    zbenefit_package_code: 'Z03',
    philhealth_benefit_first_case_rate: '32,000',
    philhealth_benefit_second_case_rate: '13,000',
    philhealth_benefit_icd_rvs_code: 'N18.6 / 90935',
    hcp1_accreditation_no: 'HCP-25-111111',
    hcp1_date_signed: '02 / 28 / 2026',
    hcp1_copay: 'With co-pay on top of PhilHealth Benefit',
    hcp2_accreditation_no: 'HCP-25-222222',
    hcp2_date_signed: '02 / 28 / 2026',
    hcp2_copay: 'With co-pay on top of PhilHealth Benefit',
    hcp3_accreditation_no: 'HCP-25-333333',
    hcp3_date_signed: '02 / 28 / 2026',
    hcp3_copay: 'With co-pay on top of PhilHealth Benefit',
    total_hci_fees: '95,000', total_professional_fees: '18,000', grand_total: '113,000',
    total_actual_charges: '113,000', discount_amount: '5,000',
    philhealth_benefit_amount: '45,000', amount_after_philhealth: '63,000',
    hci_amount_paid_by: '63,000',
    hci_paid_member_patient: 'Yes', hci_paid_hmo: 'Yes', hci_paid_others: 'Yes',
    pf_amount_paid_by: '18,000',
    pf_paid_member_patient: 'Yes', pf_paid_hmo: 'Yes', pf_paid_others: 'No',
    drug_purchase_total_amount: '12,500',
    diagnostic_purchase_total_amount: '8,700',
  },
  // ── Sample D — Paediatric, transferred-out, zero member balance. ──
  {
    hci_pan: 'HCI-40-222233', hci_name: 'CALAMBA MEDICAL CENTER',
    hci_bldg_street: '12 NATIONAL HIGHWAY',
    hci_city: 'CALAMBA CITY', hci_province: 'LAGUNA',
    patient_last_name: 'NAVARRO', patient_first_name: 'LIAM',
    patient_name_ext: 'N/A', patient_middle_name: 'AQUINO',
    referred_by_hci: '',
    date_admitted:   '05 / 08 / 2026', time_admitted:   '06 : 15 PM',
    date_discharged: '05 / 11 / 2026', time_discharged: '11 : 00 AM',
    patient_disposition: 'Transferred/Referred',
    transferred_hci_name: 'PHILIPPINE CHILDRENS MEDICAL CENTER',
    transferred_hci_bldg_street: 'QUEZON AVE',
    transferred_hci_city: 'QUEZON CITY',
    transferred_hci_province: 'METRO MANILA (NCR)',
    transferred_hci_zip: '1101',
    reason_for_referral: 'Paediatric ICU bed required for further evaluation',
    accommodation_type: 'Non-Private (Charity/Service)',
    admission_diagnosis_1: 'ACUTE GASTROENTERITIS WITH MODERATE DEHYDRATION',
    admission_diagnosis_2: 'FEBRILE SEIZURE',
    discharge_diagnosis_1: 'AGE - RESOLVED', discharge_icd10_1: 'A09',
    discharge_procedure_1: 'IV HYDRATION',
    discharge_procedure_date_1: '05 / 09 / 2026', discharge_laterality_1: 'N/A',
    discharge_diagnosis_2: 'FEBRILE SEIZURE', discharge_icd10_2: 'R56.0',
    discharge_procedure_2: 'EEG MONITORING', discharge_rvs_2: '95816',
    discharge_procedure_date_2: '05 / 10 / 2026', discharge_laterality_2: 'N/A',
    discharge_laterality_3: 'N/A', discharge_laterality_4: 'N/A',
    discharge_laterality_5: 'N/A', discharge_laterality_6: 'N/A',
    special_hemodialysis: 'No', special_peritoneal_dialysis: 'No',
    special_radiotherapy_linac: 'No', special_radiotherapy_cobalt: 'No',
    special_blood_transfusion: 'No', special_brachytherapy: 'No',
    special_chemotherapy: 'No', special_simple_debridement: 'No',
    philhealth_benefit_first_case_rate: '11,000',
    philhealth_benefit_second_case_rate: '5,500',
    philhealth_benefit_icd_rvs_code: 'A09 / R56.0',
    hcp1_accreditation_no: 'HCP-25-444555',
    hcp1_date_signed: '05 / 11 / 2026',
    hcp1_copay: 'No co-pay on top of PhilHealth Benefit',
    total_hci_fees: '18,000', total_professional_fees: '4,500', grand_total: '22,500',
    total_actual_charges: '22,500', discount_amount: '0',
    philhealth_benefit_amount: '22,500', amount_after_philhealth: '0',
    hci_amount_paid_by: '0',
    hci_paid_member_patient: 'No', hci_paid_hmo: 'No', hci_paid_others: 'No',
    pf_amount_paid_by: '0',
    pf_paid_member_patient: 'No', pf_paid_hmo: 'No', pf_paid_others: 'No',
    drug_purchase_none: 'Yes — None', drug_purchase_total_amount: '0',
    diagnostic_purchase_none: 'Yes — None', diagnostic_purchase_total_amount: '0',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-claim-form-2');
  if (!form) throw new Error('CF-2 schema not found');
  const tplPath = path.join(__dirname, '..', 'public', 'forms', form.pdfPath);
  const tpl = new Uint8Array(await fs.readFile(tplPath));
  const outDir = path.join(__dirname, '..', '.qa-output', 'cf-2');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const bytes = await generatePDF(form, PERSONAS[i], tpl, false);
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

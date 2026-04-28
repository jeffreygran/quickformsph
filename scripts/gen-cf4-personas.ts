#!/usr/bin/env tsx
/**
 * CF-4 (PhilHealth Claim Form 4 — Patient's Clinical Record, Feb 2020) persona
 * generator. Builds sample-A/B/C.pdf into .qa-output/cf-4/ for Mai's zoom-band
 * QA per L-SMART-CF4-V0 onboarding (combined dates ×3 + combined times ×2 +
 * 6-way disposition + visibleWhen-gated Transferred-HCI / Expired-date /
 * Referring-HCI).
 *
 * Personas exercise:
 *   A — IMPROVED disposition, adult medical case (community-acquired pneumonia).
 *   B — TRANSFERRED disposition, surgical case referred to higher-level center
 *       (acute appendicitis with peritonitis → tertiary hospital). Referring +
 *       Transferred branches both active.
 *   C — EXPIRED disposition, septic shock decompensation. Tests Expired-date
 *       branch + the "RECOVERED" alternate disposition is exercised in B's
 *       course narrative.
 *
 * Page geometry: 612 × 936 pt (US Letter Long, same as CF-1/CF-2 — different
 * from CF-3's 1008 pt).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  // ── Sample A — IMPROVED (community-acquired pneumonia, moderate risk) ──
  {
    series_no: '0000123456789',
    hci_name: 'MAKATI MEDICAL CENTER',
    hci_pan: 'HCI-10-123456',
    hci_address: '#2 AMORSOLO ST., LEGASPI VILLAGE, MAKATI CITY, METRO MANILA, 1229',
    patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN',
    patient_name_ext: 'N/A', patient_middle_name: 'SANTOS',
    patient_pin: '01-234567890-1', patient_age: '56', patient_sex: 'Male',
    chief_complaint: 'Productive cough x 5 days, fever, dyspnea on exertion',
    signs_symptoms: 'Fever, Dyspnea, Body weakness, Chest pain/discomfort, Anorexia, Cough',
    admitting_diagnosis: 'Community-acquired pneumonia, moderate risk',
    discharge_diagnosis: 'Community-acquired pneumonia, moderate risk — resolved',
    case_rate_code_1: 'RVS J18.9',
    case_rate_code_2: '',
    date_admitted:   '03 / 18 / 2026', time_admitted:   '08 : 45 PM',
    date_discharged: '03 / 23 / 2026', time_discharged: '10 : 30 AM',
    history_of_present_illness:
      'A 56-year-old hypertensive male, non-diabetic, presented with 5-day history of productive cough with yellowish sputum, undocumented fever, and progressive dyspnea on exertion. Self-medicated with paracetamol and over-the-counter mucolytic with no relief. No hemoptysis, no chest pain. Sought consult at OPD where chest x-ray showed right lower lobe consolidation; admitted for IV antibiotics and oxygen support.',
    pertinent_past_medical_history:
      'Hypertensive 8 years on losartan 50 mg OD; non-diabetic; no known asthma; no allergies; non-smoker for 5 years (15 pack-years); occasional alcohol.',
    obgyn_history: 'N/A — male patient',
    referred_from_hci: 'No',
    referring_hci_name: '', referring_reason: '',
    pe_height_cm: '168', pe_weight_kg: '72',
    pe_general_survey: 'Conscious, coherent, dyspneic on exertion, NICRD',
    vs_blood_pressure: '130/80', vs_heart_rate: '102',
    vs_respiratory_rate: '24', vs_temperature: '38.4',
    pe_heent_others: 'No cervical lymphadenopathy; throat mildly erythematous',
    pe_chest_lungs_others: 'Crackles right lower lung field; no wheezes',
    pe_cvs_others: 'Tachycardic; regular rhythm; no murmurs',
    pe_abdomen_others: 'Soft, non-tender, normoactive bowel sounds',
    pe_genitourinary_others: 'Unremarkable',
    pe_skin_extremities_others: 'No edema; full and equal pulses; no cyanosis',
    pe_neuro_others: 'GCS 15; no focal deficits',
    course_in_the_ward:
      'On admission, patient was started on ceftriaxone 2 g IV q24h + azithromycin 500 mg PO OD per CAP-MR pathway. Oxygen via nasal cannula 2 LPM titrated to SpO2 ≥ 95%. Day 2: defervesced; cough productive with decreasing volume of sputum. Day 3: weaned off oxygen, ambulated without dyspnea. Day 4: shifted to PO cefuroxime; observed for 24 h. Day 5: discharged improved on cefuroxime 500 mg BID for 7 more days, paracetamol PRN, salbutamol nebulization PRN. Follow-up at OPD in 1 week with repeat CXR.',
    surgical_procedure_rvs: '',
    drugs_medicines_summary:
      'Ceftriaxone 2g IV q24h x 4d — ₱3,200; Azithromycin 500mg PO OD x 5d — ₱520; Cefuroxime 500mg BID x 7d (TTOH) — ₱680; Paracetamol 500mg q4h PRN — ₱120; Salbutamol neb 1neb q6h PRN — ₱340; D5NSS 1L x 3 — ₱270.',
    patient_disposition: 'IMPROVED',
    transferred_hci_name: '', expired_date: '',
    attending_physician_name: 'JUAN P. DELA CRUZ, MD',
    attending_physician_prc: '0123456',
    attending_physician_date_signed: '03 / 23 / 2026',
  },
  // ── Sample B — TRANSFERRED (surgical referral) ──
  {
    series_no: '0000987654321',
    hci_name: 'PROVINCIAL DISTRICT HOSPITAL — BATANGAS',
    hci_pan: 'HCI-15-456789',
    hci_address: 'POBLACION, LIPA CITY, BATANGAS, 4217',
    patient_last_name: 'REYES', patient_first_name: 'ANNA MARIE',
    patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
    patient_pin: '01-987654321-2', patient_age: '34', patient_sex: 'Female',
    chief_complaint: 'Severe right lower quadrant abdominal pain x 18 hours',
    signs_symptoms: 'Abdominal cramp/pain, Vomiting, Fever, Anorexia',
    admitting_diagnosis: 'Acute appendicitis r/o perforation',
    discharge_diagnosis: 'Acute appendicitis with localized peritonitis — referred',
    case_rate_code_1: 'RVS K35.80',
    case_rate_code_2: 'RVS 44970',
    date_admitted:   '02 / 12 / 2026', time_admitted:   '02 : 15 AM',
    date_discharged: '02 / 12 / 2026', time_discharged: '11 : 30 AM',
    history_of_present_illness:
      'A 34-year-old previously well female presented with periumbilical pain that migrated to the right lower quadrant over 18 hours, associated with nausea, two episodes of non-bilious vomiting, and low-grade fever. No prior similar episodes. LMP 2 weeks ago, regular cycle. Self-medicated with hyoscine with partial relief. Consult at this hospital ER showed peritoneal signs (rebound tenderness at McBurney point, Rovsing sign positive); leukocytosis 16.4 with left shift. Surgical service referred to tertiary center due to lack of available surgical OR slot tonight.',
    pertinent_past_medical_history:
      'No known co-morbidities; no prior surgeries; no allergies; G2P2 (2002).',
    obgyn_history: 'G2P2 (2-0-0-2) LMP 01/29/2026, regular cycles. No active OB issue.',
    referred_from_hci: 'No',
    referring_hci_name: '', referring_reason: '',
    pe_height_cm: '160', pe_weight_kg: '54',
    pe_general_survey: 'Conscious, in moderate distress due to pain',
    vs_blood_pressure: '110/70', vs_heart_rate: '108',
    vs_respiratory_rate: '20', vs_temperature: '37.9',
    pe_heent_others: 'Anicteric sclerae; pink palpebral conjunctivae',
    pe_chest_lungs_others: 'Symmetric chest expansion; clear breath sounds',
    pe_cvs_others: 'Tachycardic; no murmurs',
    pe_abdomen_others:
      'Tender RLQ with guarding and rebound; Rovsing sign (+); psoas sign (+); no palpable mass; bowel sounds hypoactive',
    pe_genitourinary_others: 'No CVA tenderness',
    pe_skin_extremities_others: 'Warm extremities; full pulses',
    pe_neuro_others: 'GCS 15; intact',
    course_in_the_ward:
      'Patient kept on NPO; started on D5LR + cefoxitin 2 g IV loading + ketorolac 30 mg IV q6h. Surgical service evaluated and recommended emergency appendectomy; however, OR was occupied by an ongoing trauma case with no other available slot until next day. Given peritoneal signs and rising WBC, decision was made to TRANSFER to a tertiary center capable of immediate surgical intervention. Patient and family briefed; vitals stable at transfer; pain pharmacologically controlled.',
    surgical_procedure_rvs: 'Appendectomy planned at receiving HCI — RVS 44970',
    drugs_medicines_summary:
      'Cefoxitin 2g IV loading — ₱950; Ketorolac 30mg IV q6h x 1 — ₱120; D5LR 1L x 1 — ₱110; Hyoscine 20mg IV q8h PRN x 1 — ₱85.',
    patient_disposition: 'TRANSFERRED',
    transferred_hci_name: 'BATANGAS MEDICAL CENTER (BatMC) — SURGERY',
    expired_date: '',
    attending_physician_name: 'MA. CRISTINA REYES, MD',
    attending_physician_prc: '0234567',
    attending_physician_date_signed: '02 / 12 / 2026',
  },
  // ── Sample C — EXPIRED (septic shock decompensation; referred case) ──
  {
    series_no: '0000555111222',
    hci_name: 'JOSE B. LINGAD MEMORIAL HOSPITAL',
    hci_pan: 'HCI-30-555111',
    hci_address: 'CITY OF SAN FERNANDO, PAMPANGA, 2000',
    patient_last_name: 'BAUTISTA', patient_first_name: 'PEDRO',
    patient_name_ext: 'SR.', patient_middle_name: 'TORRES',
    patient_pin: '01-555111222-3', patient_age: '78', patient_sex: 'Male',
    chief_complaint: 'Decreased sensorium, fever, hypotension',
    signs_symptoms: 'Altered mental sensorium, Fever, Body weakness, Lower extremity edema, Dyspnea, Vomiting',
    admitting_diagnosis: 'Septic shock probable urosepsis; AKI; T2DM; HCVD',
    discharge_diagnosis: 'Septic shock 2° to E. coli urosepsis; MODS; expired',
    case_rate_code_1: 'RVS A41.51',
    case_rate_code_2: 'RVS R65.21',
    date_admitted:   '01 / 25 / 2026', time_admitted:   '11 : 50 PM',
    date_discharged: '01 / 27 / 2026', time_discharged: '04 : 15 AM',
    history_of_present_illness:
      'A 78-year-old male, hypertensive and diabetic, was referred from a primary HCI with 2-day history of fever, dysuria, and progressive change in sensorium. On arrival at the ER, BP 70/40, HR 142, RR 32, T 39.1, GCS 11. Initial labs showed leukocytosis 22.6, lactate 6.8, urinalysis with TNTC pus cells, BUN/crea elevated. Started on early goal-directed sepsis bundle and admitted to MICU.',
    pertinent_past_medical_history:
      'Hypertensive 20y on amlodipine + losartan; T2DM 12y on metformin + glimepiride; HCVD with EF 45% (2024 2D-echo); chronic kidney disease stage 3a baseline crea 1.8.',
    obgyn_history: 'N/A — male patient',
    referred_from_hci: 'Yes',
    referring_hci_name: 'STA. RITA RURAL HEALTH UNIT — PAMPANGA',
    referring_reason: 'No ICU; no vasopressor capability; required tertiary-level sepsis care.',
    pe_height_cm: '165', pe_weight_kg: '60',
    pe_general_survey: 'Drowsy; pale; cold clammy extremities; mottled skin',
    vs_blood_pressure: '70/40', vs_heart_rate: '142',
    vs_respiratory_rate: '32', vs_temperature: '39.1',
    pe_heent_others: 'Pale conjunctivae; dry mucous membranes; sunken eyeballs',
    pe_chest_lungs_others: 'Tachypneic; bibasilar crackles; no wheezes',
    pe_cvs_others: 'Tachycardic; thready pulses; muffled heart sounds',
    pe_abdomen_others: 'Soft; mild suprapubic tenderness; bowel sounds present',
    pe_genitourinary_others: 'Foley catheter draining cloudy yellow urine, low output',
    pe_skin_extremities_others: 'Cold and clammy; mottled; capillary refill > 4 sec',
    pe_neuro_others: 'GCS 11 (E2 V3 M6); no focal deficits noted',
    course_in_the_ward:
      'Resuscitated with 30 mL/kg crystalloid bolus and started on norepinephrine drip titrated to MAP ≥ 65. Empiric IV piperacillin-tazobactam 4.5 g q6h + amikacin 15 mg/kg OD initiated after blood and urine cultures. Despite escalation to dual vasopressor (norepinephrine + vasopressin), patient developed worsening lactic acidosis and acute kidney injury requiring CRRT. Day 2: developed acute respiratory failure requiring mechanical ventilation; ARDS picture on CXR. Day 2 PM: progressive hypotension unresponsive to maximal vasopressors. Family informed and opted for DNR. Patient developed bradyarrhythmia then asystole at 04:00H on 01/27/2026. CPR not initiated per family wishes; pronounced expired at 04:15H. Blood culture later grew E. coli ESBL+, sensitive to meropenem.',
    surgical_procedure_rvs: '',
    drugs_medicines_summary:
      'Norepinephrine drip — ₱4,800; Vasopressin drip — ₱3,200; Piperacillin-tazobactam 4.5g q6h x 2d — ₱5,400; Amikacin 1g IV OD x 2 — ₱1,200; Hydrocortisone 50mg IV q6h x 2d — ₱880; CRRT consumables — ₱22,500; Mechanical ventilator rental x 1d — ₱8,000.',
    patient_disposition: 'EXPIRED',
    transferred_hci_name: '',
    expired_date: '01 / 27 / 2026',
    attending_physician_name: 'PEDRO M. SANTOS, MD',
    attending_physician_prc: '0345678',
    attending_physician_date_signed: '01 / 27 / 2026',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-claim-form-4');
  if (!form) throw new Error('CF-4 schema not found');
  const tplPath = path.join(__dirname, '..', 'public', 'forms', form.pdfPath);
  const tpl = new Uint8Array(await fs.readFile(tplPath));
  const outDir = path.join(__dirname, '..', '.qa-output', 'cf-4');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const bytes = await generatePDF(form, PERSONAS[i], tpl, false);
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

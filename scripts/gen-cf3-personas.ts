#!/usr/bin/env tsx
/**
 * CF-3 (PhilHealth Claim Form 3 — Patient's Clinical Record + MCP) persona
 * generator. Builds sample-A/B/C.pdf into .qa-output/cf-3/ for Mai's zoom-band
 * QA per L-SMART-CF3-V0 onboarding (combined dates + combined times +
 * 5-way disposition + visibleWhen-gated Transferred-HCI / Expired-date).
 *
 * Personas exercise:
 *   A — Improved disposition, NSD term, 1 HCP, no Transferred/Expired branches.
 *   B — Transferred disposition (preeclampsia → PGH NICU). Transferred-HCI
 *       branch active.
 *   C — Expired disposition (postpartum hemorrhage). Expired-date branch
 *       active; tests font rendering on small mm/dd/yyyy split fields.
 *
 * Page geometry: 612 × 1008 pt (US Legal long — first such form in catalog,
 * vs CF-1/CF-2 936 pt).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  // ── Sample A — Improved (NSD term, routine MCP) ──
  {
    hci_pan: 'HCI-10-123456', hci_name: 'MAKATI MEDICAL CENTER',
    patient_last_name: 'DELA CRUZ', patient_first_name: 'MARIA CLARA',
    patient_name_ext: 'N/A', patient_middle_name: 'SANTOS',
    chief_complaint: 'Labor pains, gravida 2 para 1, 39 weeks AOG',
    date_admitted:   '03 / 15 / 2026', time_admitted:   '06 : 30 AM',
    date_discharged: '03 / 17 / 2026', time_discharged: '10 : 00 AM',
    history_of_present_illness:
      'G2P1 (1001), 39 weeks AOG by LMP, presented with regular uterine contractions every 5 minutes since 0200H. BOW intact, no vaginal bleeding. Prenatal at this institution since 12 weeks AOG, unremarkable.',
    pe_general_survey: 'Conscious, coherent, ambulatory, NICRD',
    vs_blood_pressure: '120/80', vs_cardiac_rate: '82',
    vs_respiratory_rate: '18', vs_temperature: '36.8',
    pe_heent: 'PERRLA, anicteric sclerae, no cervical lymphadenopathy',
    pe_chest_lungs: 'Symmetric chest expansion, clear breath sounds',
    pe_cvs: 'Adynamic precordium, regular rhythm, no murmurs',
    pe_abdomen: 'Gravid uterus, FH 32 cm, FHT 142 bpm, cephalic, LOA',
    pe_genitourinary: 'Cervix 4 cm dilated, 80% effaced, station 0',
    pe_extremities: 'No edema, full and equal pulses',
    course_in_the_ward:
      'Patient progressed in active labor and delivered a live baby boy via NSD on 03/15/2026 at 1130H, BW 3.2 kg, AS 9/9. Postpartum course unremarkable. Routine postpartum care + breastfeeding counselling were initiated. Lochia rubra moderate, fundus well-contracted at level of umbilicus on day 1, descending 1 fingerbreadth daily. No signs of infection. Patient ambulated without difficulty by day 2. Discharged improved on hospital day 3 with iron supplementation, paracetamol PRN for after-pains, and follow-up at OB-OPD in 1 week.',
    pertinent_lab_findings: 'CBC: Hgb 11.8 g/dL, WBC 9.2; UA: normal; HBsAg negative',
    patient_disposition: 'Improved',
    transferred_hci_name: '', expired_date: '',
    admitting_diagnosis: 'G2P1 PU 39 weeks AOG cephalic in active labor',
    final_diagnosis: 'G2P2 (2002) delivered live baby boy via NSD',
    attending_physician_name: 'JUAN P. DELA CRUZ, MD',
    attending_physician_prc: '0123456',
    attending_physician_date_signed: '03 / 17 / 2026',
  },
  // ── Sample B — Transferred (preeclampsia → higher-level NICU) ──
  {
    hci_pan: 'HCI-20-987654', hci_name: 'PHILIPPINE GENERAL HOSPITAL',
    patient_last_name: 'REYES', patient_first_name: 'ANNA MARIE',
    patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
    chief_complaint: 'Severe preeclampsia at 32 weeks AOG',
    date_admitted:   '02 / 08 / 2026', time_admitted:   '02 : 15 PM',
    date_discharged: '02 / 14 / 2026', time_discharged: '11 : 30 AM',
    history_of_present_illness:
      'G1P0, 32 weeks AOG, BP 170/110 noted on prenatal check with severe headache and blurring of vision. Admitted for stabilization and emergency CS due to severe preeclampsia with impending eclampsia.',
    pe_general_survey: 'Conscious but anxious, coherent, mild hyperreflexia',
    vs_blood_pressure: '170/110', vs_cardiac_rate: '96',
    vs_respiratory_rate: '20', vs_temperature: '37.1',
    pe_heent: 'PERRLA, mild facial edema, no neck stiffness',
    pe_chest_lungs: 'Clear breath sounds, no rales',
    pe_cvs: 'Tachycardic, regular rhythm, no murmurs',
    pe_abdomen: 'Gravid uterus 30 cm FH, FHT 148 bpm',
    pe_genitourinary: 'Cervix closed, soft, posterior',
    pe_extremities: '+2 bipedal pitting edema, brisk DTRs',
    course_in_the_ward:
      'Started on MgSO4 loading + maintenance and antihypertensives. Underwent emergency LSCS 02/09/2026 0810H delivering preterm baby girl 1.6 kg AS 6/8; transferred to PGH NICU Level 3 for higher care.',
    pertinent_lab_findings:
      'Hgb 10.4; platelets 145; ALT/AST elevated 2x normal; proteinuria 3+; ' +
      'CXR clear; cord arterial pH 7.21',
    patient_disposition: 'Transferred',
    transferred_hci_name: 'PGH NICU LEVEL 3',
    expired_date: '',
    admitting_diagnosis: 'G1P0 PU 32 weeks AOG severe preeclampsia',
    final_diagnosis: 'G1P1 (1001 preterm) s/p LSCS + severe preeclampsia',
    attending_physician_name: 'MA. CRISTINA REYES, MD',
    attending_physician_prc: '0234567',
    attending_physician_date_signed: '02 / 14 / 2026',
  },
  // ── Sample C — Expired (postpartum hemorrhage) ──
  {
    hci_pan: 'HCI-30-555111', hci_name: 'JOSE B. LINGAD MEMORIAL HOSPITAL',
    patient_last_name: 'BAUTISTA', patient_first_name: 'LIWAYWAY',
    patient_name_ext: 'N/A', patient_middle_name: 'TORRES',
    chief_complaint: 'Profuse vaginal bleeding 4 hours postpartum',
    date_admitted:   '01 / 20 / 2026', time_admitted:   '11 : 45 PM',
    date_discharged: '01 / 21 / 2026', time_discharged: '08 : 30 AM',
    history_of_present_illness:
      'G4P3 (3003), delivered at home via TBA, with ongoing heavy vaginal bleeding and signs of hypovolemic shock on arrival.',
    pe_general_survey: 'Drowsy, pale, cold clammy extremities',
    vs_blood_pressure: '70/40', vs_cardiac_rate: '142',
    vs_respiratory_rate: '32', vs_temperature: '35.4',
    pe_heent: 'Pale conjunctivae, dry lips',
    pe_chest_lungs: 'Tachypneic, clear bilaterally',
    pe_cvs: 'Tachycardic, thready pulses',
    pe_abdomen: 'Boggy uterus, soft, fundus at umbilicus',
    pe_genitourinary: 'Profuse fresh vaginal bleeding, retained placental fragments',
    pe_extremities: 'Cold and clammy, capillary refill > 4 sec',
    course_in_the_ward:
      'Resuscitated with crystalloids and blood products (4u PRBC, 2u FFP, 1u platelet concentrate). Manual removal of retained placental tissue performed under sedation. Despite aggressive resuscitation and uterotonics (oxytocin drip, methergine, carbetocin), patient developed disseminated intravascular coagulation. Bleeding remained uncontrolled. Patient went into cardiac arrest at 0745H. CPR performed for 30 minutes per ACLS protocol with epinephrine and bicarbonate; no return of spontaneous circulation. Patient pronounced expired at 0815H on 01/21/2026. Family informed; remains released to mortuary per family request.',
    pertinent_lab_findings:
      'Hgb 4.2 g/dL; PT/PTT prolonged; platelets 45; lactate 8.4',
    patient_disposition: 'Expired',
    transferred_hci_name: '',
    expired_date: '01 / 21 / 2026',
    admitting_diagnosis: 'Postpartum hemorrhage, hypovolemic shock',
    final_diagnosis: 'Postpartum hemorrhage 2° to retained POC; DIC; expired',
    attending_physician_name: 'PEDRO M. SANTOS, MD',
    attending_physician_prc: '0345678',
    attending_physician_date_signed: '01 / 21 / 2026',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-claim-form-3');
  if (!form) throw new Error('CF-3 schema not found');
  const tplPath = path.join(__dirname, '..', 'public', 'forms', form.pdfPath);
  const tpl = new Uint8Array(await fs.readFile(tplPath));
  const outDir = path.join(__dirname, '..', '.qa-output', 'cf-3');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const bytes = await generatePDF(form, PERSONAS[i], tpl, false);
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

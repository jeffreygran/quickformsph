#!/usr/bin/env tsx
/**
 * CF-1 (PhilHealth Claim Form 1) persona generator.
 * Builds sample-A/B/C.pdf into .qa-output/cf-1/ for Mai's zoom-band QA
 * after L-SMART-CF1-01 (combined dates + masks + visibleWhen branches).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  {
    // ── Sample A: Member is the patient (employed) ──
    member_pin: '12-345678901-2',
    member_last_name: 'DELA CRUZ', member_first_name: 'JUAN ANDRES',
    member_name_ext: 'Jr.', member_middle_name: 'SANTOS',
    member_dob: '03 / 15 / 1990',
    member_sex: 'Male',
    addr_unit: 'Unit 4B', addr_building: 'SUNRISE TOWER', addr_lot: 'LOT 12 BLK 3',
    addr_street: 'KATIPUNAN AVENUE', addr_subdivision: 'LOYOLA GRAND VILLAS',
    addr_barangay: 'BRGY. BATASAN HILLS', addr_city: 'QUEZON CITY',
    addr_province: 'Metro Manila (NCR)', addr_country: 'Philippines', addr_zip: '1126',
    contact_landline: '(02) 8123-4567', contact_mobile: '0917 123 4567',
    contact_email: 'juan.delacruz@gmail.com',
    patient_is_member: 'true',
    has_employer: 'true',
    employer_pen: '17-123456789-0', employer_contact: '(02) 8888-9999',
    employer_business_name: 'ABC COMPANY INC',
  },
  {
    // ── Sample B: Dependent (Child) is the patient, self-employed ──
    member_pin: '09-876543210-9',
    member_last_name: 'SANTOS', member_first_name: 'ANNA MARIE',
    member_name_ext: 'N/A', member_middle_name: 'GARCIA',
    member_dob: '07 / 22 / 1985',
    member_sex: 'Female',
    addr_unit: 'Unit 3A', addr_building: 'GREENFIELD RESIDENCES', addr_lot: 'BLK 5 LOT 7',
    addr_street: 'MABINI STREET', addr_subdivision: 'GREENFIELD VILLAGE',
    addr_barangay: 'BRGY. POBLACION', addr_city: 'MAKATI CITY',
    addr_province: 'Metro Manila (NCR)', addr_country: 'Philippines', addr_zip: '1210',
    contact_landline: '(02) 8765-4321', contact_mobile: '0928 123 4567',
    contact_email: 'anna.santos@gmail.com',
    patient_is_member: '',
    patient_pin: '11-223344556-6',
    patient_last_name: 'SANTOS', patient_first_name: 'CLAIRE ANNE',
    patient_name_ext: 'N/A', patient_middle_name: 'GARCIA',
    patient_dob: '11 / 02 / 2010',
    patient_relationship: 'Child', patient_sex: 'Female',
    has_employer: '',
  },
  {
    // ── Sample C: Spouse is the patient, employed (OFW abroad) ──
    member_pin: '34-567890123-4',
    member_last_name: 'REYES', member_first_name: 'CARLO MIGUEL',
    member_name_ext: 'III', member_middle_name: 'BAUTISTA',
    member_dob: '05 / 08 / 1978',
    member_sex: 'Male',
    addr_unit: 'Unit 2204', addr_building: 'TOWERS RESIDENCE', addr_lot: 'BLK 1 LOT 1',
    addr_street: 'AYALA AVENUE', addr_subdivision: 'GLOBAL VILLAGE',
    addr_barangay: 'BRGY. BEL-AIR', addr_city: 'MAKATI CITY',
    addr_province: 'Metro Manila (NCR)', addr_country: 'Singapore', addr_zip: '1209',
    contact_landline: '(02) 8911-2233', contact_mobile: '0939 555 7777',
    contact_email: 'carlo.reyes@ofw.example.com',
    patient_is_member: '',
    patient_pin: '55-667788990-0',
    patient_last_name: 'REYES', patient_first_name: 'MARIA CLARA',
    patient_name_ext: 'N/A', patient_middle_name: 'CRUZ',
    patient_dob: '12 / 30 / 1980',
    patient_relationship: 'Spouse', patient_sex: 'Female',
    has_employer: 'true',
    employer_pen: '88-998877665-5', employer_contact: '(02) 8456-7890',
    employer_business_name: 'GLOBAL OFW STAFFING CORP',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-claim-form-1');
  if (!form) throw new Error('CF-1 schema not found');
  const tplPath = path.join(__dirname, '..', 'public', 'forms', form.pdfPath);
  const tpl = new Uint8Array(await fs.readFile(tplPath));
  const outDir = path.join(__dirname, '..', '.qa-output', 'cf-1');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const bytes = await generatePDF(form, PERSONAS[i], tpl, false);
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

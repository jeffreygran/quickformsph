#!/usr/bin/env tsx
/**
 * One-off generator: builds CSF-2018 sample PDFs from the in-app personas
 * (with the new Smart Assistance combined-date schema) so we can QA coord
 * alignment after L-SMART-CSF-01 without running the UI.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  {
    series_no: '2026-001-00123',
    member_pin: '12-345678901-2', member_last_name: 'DELA CRUZ', member_first_name: 'JUAN ANDRES',
    member_ext_name: 'JR.', member_middle_name: 'SANTOS',
    member_dob: '03 / 15 / 1990',
    patient_is_self: 'true',
    dependent_pin: '12-345678901-2',
    patient_last_name: 'DELA CRUZ', patient_first_name: 'JUAN ANDRES',
    patient_ext_name: 'JR.', patient_middle_name: 'SANTOS',
    relationship_to_member: 'Self',
    date_admitted: '04 / 10 / 2026',
    date_discharged: '04 / 15 / 2026',
    patient_dob: '03 / 15 / 1990',
    has_employer: 'true',
    employer_pen: '17-123456789-0', employer_contact_no: '0288 889 999',
    business_name: 'ABC COMPANY INC',
    employer_date_signed: '04 / 16 / 2026',
    consent_date_signed: '04 / 16 / 2026',
  },
  {
    series_no: '2026-001-00456',
    member_pin: '09-876543210-9', member_last_name: 'SANTOS', member_first_name: 'ANNA MARIE',
    member_ext_name: '', member_middle_name: 'GARCIA',
    member_dob: '07 / 22 / 1985',
    patient_is_self: '',
    dependent_pin: '11-223344556-6',
    patient_last_name: 'SANTOS', patient_first_name: 'CLAIRE ANNE',
    patient_ext_name: '', patient_middle_name: 'GARCIA',
    relationship_to_member: 'Child',
    date_admitted: '03 / 22 / 2026',
    date_discharged: '03 / 28 / 2026',
    patient_dob: '11 / 02 / 2010',
    has_employer: 'true',
    employer_pen: '17-987654321-0', employer_contact_no: '0281 239 876',
    business_name: 'ANNA M. SANTOS DESIGN STUDIO',
    employer_date_signed: '03 / 28 / 2026',
    consent_date_signed: '03 / 28 / 2026',
  },
  {
    series_no: '2026-001-00789',
    member_pin: '55-667788990-0', member_last_name: 'REYES', member_first_name: 'PEDRO JOSE',
    member_ext_name: 'SR.', member_middle_name: 'VILLANUEVA',
    member_dob: '05 / 10 / 1978',
    patient_is_self: '',
    dependent_pin: '44-556677889-9',
    patient_last_name: 'REYES', patient_first_name: 'PEDRO MIGUEL',
    patient_ext_name: 'JR.', patient_middle_name: 'VILLANUEVA',
    relationship_to_member: 'Child',
    date_admitted: '02 / 01 / 2026',
    date_discharged: '02 / 10 / 2026',
    patient_dob: '08 / 25 / 2005',
    has_employer: 'true',
    employer_pen: '33-987654321-0', employer_contact_no: '0277 778 888',
    business_name: 'XYZ CORPORATION',
    employer_date_signed: '02 / 11 / 2026',
    consent_date_signed: '02 / 11 / 2026',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-claim-signature-form');
  if (!form) throw new Error('CSF schema not found');
  const tplPath = path.join(__dirname, '..', 'public', 'forms', form.pdfPath);
  const tpl = new Uint8Array(await fs.readFile(tplPath));
  const outDir = path.join(__dirname, '..', '.qa-output', 'csf-2018');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const bytes = await generatePDF(form, PERSONAS[i], tpl, false);
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env tsx
/**
 * PMRF persona generator — produces 2 sample PDFs to QA coord alignment
 * after the Smart Assistance schema migration (combined dob, masks, etc.).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const PERSONAS: Record<string, string>[] = [
  {
    pin: '12-345678901-2',
    purpose: 'Registration',
    konsulta_provider: '01-001-009-000 — Quezon City General Hospital (Quezon City)',
    last_name: 'DELA CRUZ', first_name: 'JUAN ANDRES', middle_name: 'REYES', name_ext: 'Jr.',
    dob: '03 / 15 / 1990',
    place_of_birth: 'QUEZON CITY, METRO MANILA',
    sex: 'Male', civil_status: 'Single', citizenship: 'Filipino',
    philsys_id: '1234-5678-9012', tin: '123-456-789-000',
    mother_last_name: 'REYES', mother_first_name: 'MARIA', mother_middle_name: 'SANTOS',
    perm_unit: 'Unit 4B', perm_building: 'SUNRISE TOWER', perm_lot: 'LOT 12 BLK 3',
    perm_street: 'KATIPUNAN AVENUE', perm_subdivision: 'LOYOLA GRAND VILLAS',
    perm_barangay: 'BRGY. BATASAN HILLS', perm_city: 'QUEZON CITY',
    perm_province: 'Metro Manila (NCR)', perm_zip: '1126',
    mail_same_as_above: 'true',
    mail_unit: 'Unit 4B', mail_building: 'SUNRISE TOWER', mail_lot: 'LOT 12 BLK 3',
    mail_street: 'KATIPUNAN AVENUE', mail_subdivision: 'LOYOLA GRAND VILLAS',
    mail_barangay: 'BRGY. BATASAN HILLS', mail_city: 'QUEZON CITY',
    mail_province: 'Metro Manila (NCR)', mail_zip: '1126',
    mobile: '0917 123 4567', home_phone: '028123-4567', email: 'juan.delacruz@gmail.com',
    member_type: 'Employed Private', indirect_contributor: '',
    profession: 'Civil Engineer', monthly_income: '55,000',
    proof_of_income: 'Certificate of Employment (COE)',
  },
  {
    pin: '09-876543210-9',
    purpose: 'Updating/Amendment',
    konsulta_provider: '04-007-014-000 — Cebu City Medical Center (Cebu City)',
    last_name: 'SANTOS', first_name: 'ANNA MARIE', middle_name: 'GARCIA', name_ext: 'N/A',
    dob: '07 / 22 / 1985',
    place_of_birth: 'CEBU CITY, CEBU',
    sex: 'Female', civil_status: 'Married', citizenship: 'Filipino',
    philsys_id: '9876-5432-1098', tin: '987-654-321-000',
    mother_last_name: 'GARCIA', mother_first_name: 'LUCIA', mother_middle_name: 'VIDAL',
    spouse_last_name: 'SANTOS', spouse_first_name: 'PEDRO', spouse_middle_name: 'LIM',
    perm_unit: 'Unit 3A', perm_building: 'GREENFIELD RESIDENCES', perm_lot: 'BLK 5 LOT 7',
    perm_street: 'MABINI STREET', perm_subdivision: 'GREENFIELD VILLAGE',
    perm_barangay: 'BRGY. POBLACION', perm_city: 'MAKATI CITY',
    perm_province: 'Metro Manila (NCR)', perm_zip: '1210',
    mail_same_as_above: 'true',
    mail_unit: 'Unit 3A', mail_building: 'GREENFIELD RESIDENCES', mail_lot: 'BLK 5 LOT 7',
    mail_street: 'MABINI STREET', mail_subdivision: 'GREENFIELD VILLAGE',
    mail_barangay: 'BRGY. POBLACION', mail_city: 'MAKATI CITY',
    mail_province: 'Metro Manila (NCR)', mail_zip: '1210',
    mobile: '0928 123 4567', home_phone: '028765-4321', email: 'anna.santos@gmail.com',
    member_type: 'Self-Earning Individual', indirect_contributor: '',
    profession: 'Freelance Designer', monthly_income: '25,000',
    proof_of_income: 'Notarized Affidavit of Income',
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-pmrf')!;
  const outDir = path.join('public', 'generated');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const out = path.join(outDir, `philhealth-pmrf--${String.fromCharCode(65 + i)}.pdf`);
    const bytes = await generatePDF(form, PERSONAS[i]);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${out} ${bytes.length} bytes`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env tsx
/**
 * PMRF-FN persona generator — produces 3 sample PDFs to QA coord alignment
 * after the L-SMART-PMRF-FN-01 Smart Assistance migration (combined dob,
 * documentation_type gate, is_mononymous toggle, phPhone mask, 6-dep grid).
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

const today = (() => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm} / ${dd} / ${d.getFullYear()}`;
})();

const PERSONAS: Record<string, string>[] = [
  // A — American expat, ACR I-Card only, married + 2 kids
  {
    philhealth_number: '22-0000001234',
    documentation_type: 'ACR I-Card',
    acr_icard_number: 'A12345678', pra_srrv_number: '',
    is_mononymous: '',
    last_name: 'SMITH', first_name: 'JOHN WILLIAM', middle_name: 'ANDERSON',
    sex: 'Male', nationality: 'American',
    dob: '09 / 14 / 1982',
    civil_status: 'Married',
    philippine_address_line1: '88 LEGASPI ST, LEGASPI VILLAGE',
    philippine_address_line2: 'MAKATI CITY, METRO MANILA 1229',
    contact_phone: '+63 917 100 2020', email: 'j.smith@company.com.ph',
    dep1_last: 'SMITH', dep1_first: 'EMILY ROSE', dep1_middle: 'JOHNSON',
    dep1_sex: 'F', dep1_relationship: 'Spouse', dep1_dob: '11 / 22 / 1985', dep1_nationality: 'American',
    dep2_last: 'SMITH', dep2_first: 'NATHAN JAMES', dep2_middle: 'ANDERSON',
    dep2_sex: 'M', dep2_relationship: 'Child', dep2_dob: '05 / 18 / 2015', dep2_nationality: 'American',
    signature_printed_name: 'JOHN WILLIAM ANDERSON SMITH', signature_date: today,
  },
  // B — Japanese retiree, PRA SRRV only, no PIN, landline contact, no deps
  {
    philhealth_number: '',
    documentation_type: 'PRA SRRV',
    acr_icard_number: '', pra_srrv_number: 'SRRV-2022-00123',
    is_mononymous: '',
    last_name: 'TANAKA', first_name: 'HIROSHI', middle_name: '',
    sex: 'Male', nationality: 'Japanese',
    dob: '03 / 22 / 1955',
    civil_status: 'Widowed',
    philippine_address_line1: 'UNIT 12F, ONE BONIFACIO HIGH STREET',
    philippine_address_line2: 'BGC, TAGUIG, METRO MANILA 1634',
    contact_phone: '(02) 8888-1234', email: 'h.tanaka@retire.ph',
    signature_printed_name: 'HIROSHI TANAKA', signature_date: today,
  },
  // C — FULL: Spanish national, Both docs, all 6 dep rows populated
  {
    philhealth_number: '22-9999888777',
    documentation_type: 'Both',
    acr_icard_number: 'C11223344', pra_srrv_number: 'SRRV-2023-00456',
    is_mononymous: '',
    last_name: 'GARCIA', first_name: 'MARIA ELENA', middle_name: 'RODRIGUEZ',
    sex: 'Female', nationality: 'Spanish',
    dob: '06 / 15 / 1988',
    civil_status: 'Single',
    philippine_address_line1: '32 ESCOLTA STREET, BINONDO',
    philippine_address_line2: 'MANILA, METRO MANILA 1006',
    contact_phone: '+63 917 123 4567', email: 'maria.garcia@eu-company.ph',
    dep1_last: 'GARCIA', dep1_first: 'CARLOS ANTONIO', dep1_middle: 'MARTINEZ',
    dep1_sex: 'M', dep1_relationship: 'Parent', dep1_dob: '02 / 10 / 1955', dep1_nationality: 'Spanish',
    dep2_last: 'RODRIGUEZ', dep2_first: 'ISABEL CARMEN', dep2_middle: 'LOPEZ',
    dep2_sex: 'F', dep2_relationship: 'Parent', dep2_dob: '08 / 25 / 1958', dep2_nationality: 'Spanish',
    dep3_last: 'GARCIA', dep3_first: 'JAVIER LUIS', dep3_middle: 'RODRIGUEZ',
    dep3_sex: 'M', dep3_relationship: 'Sibling', dep3_dob: '12 / 03 / 1990', dep3_nationality: 'Spanish',
    dep4_last: 'GARCIA', dep4_first: 'PILAR SOFIA', dep4_middle: 'RODRIGUEZ',
    dep4_sex: 'F', dep4_relationship: 'Sibling', dep4_dob: '04 / 18 / 1993', dep4_nationality: 'Spanish',
    dep5_last: 'MARTIN', dep5_first: 'DIEGO', dep5_middle: 'GARCIA',
    dep5_sex: 'M', dep5_relationship: 'Nephew', dep5_dob: '06 / 22 / 2018', dep5_nationality: 'Spanish',
    dep6_last: 'MARTIN', dep6_first: 'LUCIA INES', dep6_middle: 'GARCIA',
    dep6_sex: 'F', dep6_relationship: 'Niece', dep6_dob: '11 / 09 / 2020', dep6_nationality: 'Spanish',
    signature_printed_name: 'MARIA ELENA RODRIGUEZ GARCIA', signature_date: today,
  },
  // D — Mononymous Indonesian student (single legal name, ACR I-Card only,
  //     no PIN, no spouse, 1 child)
  {
    philhealth_number: '',
    documentation_type: 'ACR I-Card',
    acr_icard_number: 'D55667788', pra_srrv_number: '',
    is_mononymous: 'true',
    last_name: 'SUKARNO', first_name: '', middle_name: '',
    sex: 'Male', nationality: 'Indonesian',
    dob: '02 / 28 / 2000',
    civil_status: 'Single',
    philippine_address_line1: 'BLOCK 5 LOT 12, UP CAMPUS DORMITORY',
    philippine_address_line2: 'DILIMAN, QUEZON CITY 1101',
    contact_phone: '+63 905 999 1234', email: 'sukarno@up.edu.ph',
    dep1_last: 'WIDODO', dep1_first: '', dep1_middle: '',
    dep1_sex: 'F', dep1_relationship: 'Child', dep1_dob: '07 / 04 / 2023', dep1_nationality: 'Indonesian',
    signature_printed_name: 'SUKARNO', signature_date: today,
  },
];

async function main() {
  const form = FORMS.find((f) => f.slug === 'philhealth-pmrf-foreign-natl')!;
  const outDir = path.join('.qa-output', 'pmrf-fn');
  await fs.mkdir(outDir, { recursive: true });
  for (let i = 0; i < PERSONAS.length; i++) {
    const out = path.join(outDir, `sample-${String.fromCharCode(65 + i)}.pdf`);
    const bytes = await generatePDF(form, PERSONAS[i]);
    await fs.writeFile(out, bytes);
    console.log(`wrote ${path.resolve(out)}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });

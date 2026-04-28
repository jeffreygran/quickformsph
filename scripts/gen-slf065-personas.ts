#!/usr/bin/env tsx
/**
 * One-off generator: builds SLF-065 sample PDFs from the in-app persona
 * literals so we can visually QA coord alignment without running the UI.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { FORMS } from '../src/data/forms';
import { generatePDF } from '../src/lib/pdf-generator';

function todayMaskedDate(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm} / ${dd} / ${d.getFullYear()}`;
}

const SLF065_PERSONAS: Record<string, string>[] = [
  {
    mid_no: '5555-6666-7777', application_no: '',
    last_name: 'GARCIA', first_name: 'PATRICIA ANN', ext_name: 'N/A', middle_name: 'REYES', no_maiden_middle_name: '',
    dob: '03 / 18 / 1992', place_of_birth: 'QUEZON CITY, METRO MANILA', mothers_maiden_name: 'REYES, LINDA SANTOS',
    nationality: 'FILIPINO', sex: 'Female', marital_status: 'Single/Unmarried', citizenship: 'FILIPINO',
    email: 'p.garcia@work.com',
    perm_unit: 'Unit 2A', perm_cell_phone: '0916 222 3333', perm_home_tel: '028123-4567',
    perm_street: 'AURORA BLVD', perm_subdivision: 'CUBAO COMMERCIAL CENTER', perm_barangay: 'BRGY. CUBAO',
    perm_city: 'QUEZON CITY', perm_province: 'METRO MANILA (NCR)', perm_zip: '1109',
    perm_tin: '789-012-345-000', perm_sss_gsis: '11-2345678-9',
    pres_unit: '15F BDO Corporate Center', pres_business_tel: '028840-7000',
    pres_nature_of_work: 'Branch Manager — Retail Banking',
    pres_street: 'ORTIGAS CENTER', pres_subdivision: 'ORTIGAS BUSINESS DISTRICT', pres_barangay: 'BRGY. SAN ANTONIO',
    pres_city: 'PASIG', pres_province: 'METRO MANILA (NCR)', pres_zip: '1605',
    loan_term: 'Two (2) Years', desired_loan_amount: '80,000',
    employer_name: 'BDO UNIBANK INC.', loan_purpose: 'Health & wellness',
    employer_address_line: 'BDO CORPORATE CENTER, ORTIGAS', employer_subdivision: 'ORTIGAS CENTER',
    employer_barangay: 'BRGY. SAN ANTONIO', employer_city: 'PASIG', employer_province: 'METRO MANILA (NCR)', employer_zip: '1605',
    employee_id_no: 'BD-2023-9876', date_of_employment: '01 / 15 / 2019',
    source_of_fund: 'Salary', payroll_bank_name: 'BDO Unibank — Ortigas Branch',
    signature_date: todayMaskedDate(),
    source_of_referral: 'Employer/Fund Coordinator',
  },
  {
    mid_no: '8888-9999-0001', application_no: 'APP-2026-011234',
    last_name: 'TORRES', first_name: 'MARIO JOSE', ext_name: 'N/A', middle_name: 'DELA VEGA', no_maiden_middle_name: '',
    dob: '09 / 25 / 1985', place_of_birth: 'CEBU CITY, CEBU', mothers_maiden_name: 'DELA VEGA, CARLA SANTOS',
    nationality: 'FILIPINO', sex: 'Male', marital_status: 'Married', citizenship: 'FILIPINO',
    email: 'mario.torres@cebu.ph',
    perm_unit: 'House 3 Lot 15', perm_cell_phone: '0922 111 2222', perm_home_tel: '0322345678',
    perm_street: '12 SAMPAGUITA ST', perm_subdivision: 'CEBU VILLAGE', perm_barangay: 'BRGY. CAMPUTHAW',
    perm_city: 'CEBU CITY', perm_province: 'CEBU', perm_zip: '6000',
    perm_tin: '654-321-098-000', perm_sss_gsis: '34-9876543-2',
    pres_unit: 'Unit 12B Crew Quarters', pres_business_tel: '0322234567',
    pres_nature_of_work: 'First Officer (Commercial Pilot) — A320 Fleet',
    pres_street: 'JONES AVE', pres_subdivision: 'KAMPUTHAW DISTRICT', pres_barangay: 'BRGY. KAMPUTHAW',
    pres_city: 'CEBU CITY', pres_province: 'CEBU', pres_zip: '6000',
    loan_term: 'Three (3) Years', desired_loan_amount: '120,000',
    employer_name: 'CEBU PACIFIC AIR', loan_purpose: 'Vacation / travel',
    employer_address_line: 'MIA ROAD, PASAY CITY', employer_subdivision: 'NAIA COMPLEX',
    employer_barangay: 'BRGY. 183', employer_city: 'PASAY', employer_province: 'METRO MANILA (NCR)', employer_zip: '1300',
    employee_id_no: 'CEB-2018-4567', date_of_employment: '06 / 01 / 2018',
    source_of_fund: 'Salary', payroll_bank_name: 'BPI — Cebu City Branch',
    signature_date: todayMaskedDate(),
    source_of_referral: 'Pag-IBIG Fund Website',
  },
];

(async () => {
  const form = FORMS.find((f: { slug: string }) => f.slug === 'pagibig-slf-065');
  if (!form) throw new Error('SLF-065 schema not found');
  for (let i = 0; i < SLF065_PERSONAS.length; i++) {
    const persona = SLF065_PERSONAS[i];
    const pdfBytes = await generatePDF(form, persona);
    const out = path.join('public/generated', `pagibig-slf-065--${String.fromCharCode(65 + i)}.pdf`);
    await fs.writeFile(out, pdfBytes);
    console.log('wrote', out, pdfBytes.byteLength, 'bytes');
  }
})();

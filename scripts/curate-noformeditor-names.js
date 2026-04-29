// Curate readable form_name + form_code + agency for NoFormEditor PDFs.
// Run: node scripts/curate-noformeditor-names.js
const Database = require('better-sqlite3');
const db = new Database('/tmp/qfph/qfph.db');

const updates = {
  // slug → { agency, code, name }
  'bir-1901-october-2025-encs-final': {
    agency: 'BIR', code: 'BIR 1901',
    name: 'Application for Registration — Self-Employed and Mixed Income Individuals (Oct 2025 ENCS)',
  },
  'bir-1902-october-2025-encs-final': {
    agency: 'BIR', code: 'BIR 1902',
    name: 'Application for Registration — Individuals Earning Purely Compensation Income (Oct 2025 ENCS)',
  },
  'bir-1904-october-2025-encs-final': {
    agency: 'BIR', code: 'BIR 1904',
    name: 'Application for Registration — One-Time Taxpayer & Person Registering under E.O. 98 (Oct 2025 ENCS)',
  },
  'bir-1905-october-2025-encs-final': {
    agency: 'BIR', code: 'BIR 1905',
    name: 'Application for Registration Information Update / Correction / Cancellation (Oct 2025 ENCS)',
  },
  'unknown-bir-2316': {
    agency: 'BIR', code: 'BIR 2316',
    name: 'Certificate of Compensation Payment / Tax Withheld',
  },
  'unknown-csf-2018': {
    agency: 'PhilHealth', code: 'CSF-2018',
    name: 'PhilHealth Claim Signature Form (2018)',
  },
  'dfa-affidavit-of-loss-philippine-passport': {
    agency: 'Department of Foreign Affairs', code: 'DFA Affidavit',
    name: 'Affidavit of Loss — Philippine Passport',
  },
  'gsis-20240507-application-for-retirement-under-ra7699-portability-law': {
    agency: 'GSIS', code: 'GSIS RA 7699',
    name: 'Application for Retirement under RA 7699 (Portability Law)',
  },
  'gsis-20240725-emergency-loan-active': {
    agency: 'GSIS', code: 'GSIS Emergency Loan',
    name: 'Emergency Loan Application (Active Members)',
  },
  'gsis-fm-gsis-ops-rmc-01-application-for-retirement-separation-life-insurance-ben-rev1-10may2024': {
    agency: 'GSIS', code: 'FM-GSIS-OPS-RMC-01',
    name: 'Application for Retirement / Separation / Life Insurance Benefits (Rev. 1, May 2024)',
  },
  'pagibig-pff226-modifiedpagibigiienrollmentform': {
    agency: 'Pag-IBIG', code: 'PFF 226',
    name: 'Modified Pag-IBIG II (MP2) Enrollment Form',
  },
  'sss-mlp-01287': {
    agency: 'SSS', code: 'MLP-01287',
    name: 'SSS Member Loan Program Application',
  },
};

const upd = db.prepare(
  'UPDATE forms SET agency = ?, form_code = ?, form_name = ?, updated_at = ? WHERE slug = ?'
);
let count = 0;
for (const [slug, u] of Object.entries(updates)) {
  const r = upd.run(u.agency, u.code, u.name, Date.now(), slug);
  if (r.changes) count++;
  else console.log(`! no row for ${slug}`);
}
console.log(`updated ${count}/${Object.keys(updates).length} rows`);

// Backfill human-readable form_name and standardized form_code (HQP-XXX-NNN)
// for every Pag-IBIG row in the catalog.
import { getDB } from '../src/lib/db';

interface Patch {
  form_code: string; // canonical "HQP-HLF-001" style
  form_name: string;
}

const PATCHES: Record<string, Patch> = {
  // Housing Loans (HLF)
  'pagibig-hlf001-loanrestructuringapplication': {
    form_code: 'HQP-HLF-001',
    form_name: 'Pag-IBIG Application for Loan Restructuring',
  },
  'pagibig-hlf068-housingloanapplication': {
    form_code: 'HQP-HLF-068',
    form_name: 'Pag-IBIG Housing Loan Application',
  },
  'pagibig-hlf1096-nonlifeinsuranceclaim': {
    form_code: 'HQP-HLF-1096',
    form_name: 'Pag-IBIG Application for Non-Life Insurance Claim',
  },
  'pagibig-hlf1122-moratoriumcalamitiesapplication': {
    form_code: 'HQP-HLF-1122',
    form_name: 'Pag-IBIG Application for Moratorium on Housing Loan (Calamities)',
  },
  'pagibig-hlf1230-stlhomeimprovementapplication': {
    form_code: 'HQP-HLF-1230',
    form_name: 'Pag-IBIG Short-Term Loan for Home Improvement Application',
  },
  'pagibig-hlf165-offertosettle': {
    form_code: 'HQP-HLF-165',
    form_name: 'Pag-IBIG Offer to Settle',
  },
  'pagibig-hlf169-housingloanrevaluationnparp': {
    form_code: 'HQP-HLF-169',
    form_name: 'Pag-IBIG Application for Housing Loan Revaluation (NPARP)',
  },
  'pagibig-hlf201-letterofintentnparp': {
    form_code: 'HQP-HLF-201',
    form_name: 'Pag-IBIG Letter of Intent (NPARP)',
  },
  'pagibig-hlf502-planofpaymentapplication': {
    form_code: 'HQP-HLF-502',
    form_name: 'Pag-IBIG Application for Plan of Payment',
  },
  'pagibig-hlf540-penaltycondonationapplication': {
    form_code: 'HQP-HLF-540',
    form_name: 'Pag-IBIG Application for Condonation of Penalties / Additional Interests',
  },
  'pagibig-hlf858-applicationhomeequityappreciationloan': {
    form_code: 'HQP-HLF-858',
    form_name: 'Pag-IBIG Home Equity Appreciation Loan Application',
  },
  'pagibig-hlf868-applicationhomeequityappreciationloan-co-borrower': {
    form_code: 'HQP-HLF-868',
    form_name: 'Pag-IBIG Home Equity Appreciation Loan Application (Co-Borrower)',
  },

  // Provident / Membership (PFF)
  'pagibig-pff002-employersdataform': {
    form_code: 'HQP-PFF-002',
    form_name: "Pag-IBIG Employer's Data Form (EDF)",
  },
  'pagibig-pff049-memberschangeinformationform': {
    form_code: 'HQP-PFF-049',
    form_name: "Pag-IBIG Member's Change of Information Form",
  },
  'pagibig-pff093-consolidationofmembersrecords': {
    form_code: 'HQP-PFF-093',
    form_name: "Pag-IBIG Request for Consolidation/Merging of Member's Records",
  },
  'pagibig-pff108-loyaltycardplusapplication': {
    form_code: 'HQP-PFF-108',
    form_name: 'Pag-IBIG Loyalty Card Plus Application',
  },
  'pagibig-pff226-modifiedpagibigiienrollmentform': {
    form_code: 'HQP-PFF-226',
    form_name: 'Modified Pag-IBIG II (MP2) Enrollment Form',
  },
  'pagibig-pff285-providentbenefitsclaimapplication': {
    form_code: 'HQP-PFF-285',
    form_name: 'Pag-IBIG Application for Provident Benefits Claim',
  },
  'unknown-hqp-pff-356': {
    form_code: 'HQP-PFF-356',
    form_name: 'Pag-IBIG Application for the Release of MP2 Annual Dividends',
  },

  // Short-Term Loans (SLF)
  'pagibig-slf065-multipurposeloanapplicationform': {
    form_code: 'HQP-SLF-065',
    form_name: 'Pag-IBIG Multi-Purpose Loan Application',
  },
  'pagibig-slf066-calamityloanapplication': {
    form_code: 'HQP-SLF-066',
    form_name: 'Pag-IBIG Calamity Loan Application',
  },
  'pagibig-slf089-pagibighelpsapplicationform': {
    form_code: 'HQP-SLF-089',
    form_name: 'Pag-IBIG HELPs (Health & Education) Application',
  },

  // Other
  'pagibig-hdmf-stlandprovidentbenefitsclaim': {
    form_code: 'HDMF-STL-PB-CLAIM',
    form_name: 'Pag-IBIG Short-Term Loan & Provident Benefits Claim',
  },
};

const db = getDB();
const stmt = db.prepare(
  'UPDATE forms SET form_code = ?, form_name = ?, updated_at = ? WHERE slug = ?',
);
const now = Date.now();
let updated = 0;
const missing: string[] = [];
for (const [slug, p] of Object.entries(PATCHES)) {
  // form_code has a UNIQUE constraint, so check if another row already owns it
  const owner = db
    .prepare('SELECT slug FROM forms WHERE form_code = ? AND slug != ?')
    .get(p.form_code, slug) as { slug: string } | undefined;
  if (owner) {
    console.log(`SKIP ${slug}: form_code "${p.form_code}" already owned by ${owner.slug}`);
    continue;
  }
  const r = stmt.run(p.form_code, p.form_name, now, slug);
  if (r.changes > 0) updated++;
  else missing.push(slug);
}
console.log(`updated ${updated}/${Object.keys(PATCHES).length}`);
if (missing.length) console.log('missing slugs:', missing);

console.log('\n--- after ---');
db.prepare(
  "SELECT form_code, form_name FROM forms WHERE agency='Pag-IBIG' AND deleted_at IS NULL ORDER BY form_code",
)
  .all()
  .forEach((r: any) => console.log(r.form_code.padEnd(20), '|', r.form_name));

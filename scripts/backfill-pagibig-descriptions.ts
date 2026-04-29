// One-off: backfill description for the 16 NoFormEditor Pag-IBIG rows
// (and trigger the new ALTER TABLE migration via getDB()).
import { getDB } from '../src/lib/db';

const DESCRIPTIONS: Record<string, string> = {
  'pagibig-hlf001-loanrestructuringapplication':
    "Restructure your delinquent Pag-IBIG housing loan (HQP-HLF-001) — pick a new loan term, repricing period, and mode of payment to bring your account current under R.A. 9679.",
  'pagibig-hlf1096-nonlifeinsuranceclaim':
    "File a non-life insurance claim (HQP-HLF-1096) on your Pag-IBIG-financed property damaged by fire, flood, typhoon, lightning, or earthquake.",
  'pagibig-hlf1122-moratoriumcalamitiesapplication':
    "Apply for a moratorium on your Pag-IBIG housing loan amortization (HQP-HLF-1122) if your mortgaged property was affected by a calamity.",
  'pagibig-hlf1230-stlhomeimprovementapplication':
    "Apply for a Pag-IBIG Short-Term Loan for Home Improvement (HQP-HLF-1230) — repair works or minor construction, payable up to 5 years.",
  'pagibig-hlf165-offertosettle':
    "Submit an Offer to Settle (HQP-HLF-165) for your past-due Pag-IBIG housing loan account.",
  'pagibig-hlf169-housingloanrevaluationnparp':
    "Apply for revaluation of your Pag-IBIG housing loan (HQP-HLF-169) under the Non-Performing Asset Resolution Program (NPARP).",
  'pagibig-hlf201-letterofintentnparp':
    "Letter of Intent (HQP-HLF-201) declaring your intention to settle a Pag-IBIG housing loan account through the NPARP — cash, installment, or a new housing loan.",
  'pagibig-hlf502-planofpaymentapplication':
    "Apply for a Plan of Payment (HQP-HLF-502) on your Pag-IBIG housing loan — one-time payment or installment, with optional post-dated checks.",
  'pagibig-hlf540-penaltycondonationapplication':
    "Apply for condonation of penalties and additional interests (HQP-HLF-540) on your Pag-IBIG housing loan, for full payment or full updating of the account.",
  'pagibig-pff002-employersdataform':
    "Employer's Data Form (HQP-PFF-002) — register your business as a Pag-IBIG employer or update your employer record (name, address, contact, industry).",
  'pagibig-pff093-consolidationofmembersrecords':
    "Request consolidation/merging (HQP-PFF-093) of your multiple Pag-IBIG MID numbers into a single member's record.",
  'pagibig-pff108-loyaltycardplusapplication':
    "Apply for the Pag-IBIG Loyalty Card Plus (HQP-PFF-108) — a member ID and prepaid debit card issued through partner banks.",
  'pagibig-pff226-modifiedpagibigiienrollmentform':
    "Enroll in the Modified Pag-IBIG II (MP2) Savings program (HQP-PFF-226) — the higher-yield, tax-free, 5-year voluntary savings option for Pag-IBIG members.",
  'pagibig-pff285-providentbenefitsclaimapplication':
    "Application for Provident Benefits Claim (HQP-PFF-285) — withdraw your Pag-IBIG I and/or MP2 savings on membership maturity, retirement, disability, death, expatriation, or other qualifying reasons.",
  'pagibig-slf066-calamityloanapplication':
    "Calamity Loan Application Form (HQP-SLF-066) — apply for a Pag-IBIG Calamity Loan if you reside or work in an area declared under a state of calamity.",
  'pagibig-hdmf-stlandprovidentbenefitsclaim':
    "HDMF Short-Term Loan and Provident Benefits Claim — combined Pag-IBIG STL application and provident benefits withdrawal form.",
};

const db = getDB();
const stmt = db.prepare('UPDATE forms SET description = ?, updated_at = ? WHERE slug = ?');
const now = Date.now();
let updated = 0;
let missing: string[] = [];
for (const [slug, desc] of Object.entries(DESCRIPTIONS)) {
  const r = stmt.run(desc, now, slug);
  if (r.changes > 0) updated++; else missing.push(slug);
}
console.log(`Updated ${updated}/${Object.keys(DESCRIPTIONS).length} rows`);
if (missing.length) console.log('Missing slugs:', missing);

// Show result
const rows = db.prepare(
  "SELECT slug, substr(description,1,80) AS preview FROM forms WHERE LOWER(agency) LIKE 'pagibig%' AND has_form_editor = 0 ORDER BY slug"
).all();
for (const r of rows as { slug: string; preview: string }[]) {
  console.log(`  ${r.slug.padEnd(55)} ${r.preview ?? '(null)'}`);
}

/**
 * scripts/scan-forms.ts
 *
 * CLI entry that walks public/forms/ + public/forms/NoFormEditor/ and upserts
 * the SQLite `forms` table. Run with:
 *
 *     npx tsx scripts/scan-forms.ts
 *
 * No HTTP / no auth — talks to the same better-sqlite3 file the server uses.
 */

import { runScan } from '../src/lib/forms-scan';

(async () => {
  try {
    const result = await runScan();
    console.log(`Scanned ${result.scanned} PDFs`);
    console.log(`  inserted   : ${result.inserted}`);
    console.log(`  updated    : ${result.updated}`);
    console.log(`  soft-deleted: ${result.softDeleted}`);
    console.log('');
    for (const r of result.rows) {
      const flag = r.has_form_editor ? '✓' : '·';
      console.log(`  ${flag}  ${r.action.padEnd(8)}  ${r.slug.padEnd(40)}  ${r.agency} / ${r.form_code}`);
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();

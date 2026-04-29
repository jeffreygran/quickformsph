/**
 * Resync forms.has_form_editor against the authoritative list of wired
 * schemas in src/data/forms.ts.
 *
 * Truth source: a DB row has an editor iff some FORMS[i].pdfPath matches
 * the row's pdf_path (compared by basename — schema pdfPaths are stored
 * relative to /public/forms/ but DB rows may be either root or NoFormEditor).
 */
import path from 'node:path';
import Database from 'better-sqlite3';
import { FORMS } from '../src/data/forms';

const DB_PATH = '/tmp/qfph/qfph.db';

const wiredBasenames = new Set(FORMS.map((f) => path.basename(f.pdfPath)));
console.log(`[*] Wired schemas in src/data/forms.ts: ${wiredBasenames.size}`);

const db = new Database(DB_PATH);
const rows = db
  .prepare("SELECT id, slug, agency, pdf_path, has_form_editor FROM forms WHERE deleted_at IS NULL")
  .all() as Array<{ id: number; slug: string; agency: string; pdf_path: string; has_form_editor: 0 | 1 }>;

console.log(`[*] Active DB rows: ${rows.length}`);

let toEnable = 0,
  toDisable = 0,
  alreadyOk = 0;
const upd = db.prepare('UPDATE forms SET has_form_editor = ?, updated_at = ? WHERE id = ?');
const now = Date.now();
const changes: Array<{ slug: string; from: number; to: number; pdf_path: string }> = [];

for (const r of rows) {
  const base = path.basename(r.pdf_path);
  const wantEditor = wiredBasenames.has(base) ? 1 : 0;
  if (wantEditor !== r.has_form_editor) {
    upd.run(wantEditor, now, r.id);
    changes.push({ slug: r.slug, from: r.has_form_editor, to: wantEditor, pdf_path: r.pdf_path });
    if (wantEditor) toEnable++;
    else toDisable++;
  } else {
    alreadyOk++;
  }
}

console.log(`[*] Changes: enabled=${toEnable}, disabled=${toDisable}, unchanged=${alreadyOk}`);
console.log();
for (const c of changes) {
  const arrow = c.to === 1 ? '0 → 1 (ENABLE)' : '1 → 0 (DISABLE)';
  console.log(`  ${arrow}  ${c.slug.padEnd(50)}  ${c.pdf_path}`);
}

// Final summary by agency
console.log('\n--- Final state by agency (has_form_editor = 1) ---');
const byAgency = db
  .prepare(
    "SELECT agency, COUNT(*) AS total, SUM(has_form_editor) AS with_editor FROM forms WHERE deleted_at IS NULL GROUP BY agency ORDER BY agency",
  )
  .all() as Array<{ agency: string; total: number; with_editor: number }>;
for (const a of byAgency) {
  console.log(`  ${a.agency.padEnd(15)} ${a.with_editor}/${a.total} wired`);
}

// Detect schemas that have NO matching DB row (orphan schemas)
const dbBasenames = new Set(rows.map((r) => path.basename(r.pdf_path)));
const orphanSchemas = FORMS.filter((f) => !dbBasenames.has(path.basename(f.pdfPath)));
if (orphanSchemas.length) {
  console.log('\n--- WARNING: schemas with no matching DB row ---');
  for (const f of orphanSchemas) {
    console.log(`  schema slug=${f.slug}  pdfPath=${f.pdfPath}`);
  }
}

db.close();

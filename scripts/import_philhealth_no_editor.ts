/**
 * Import all PhilHealth member-fillout PDFs from
 * Forms-Research/PHILHEALTH/pdf/ into:
 *   1) public/forms/NoFormEditor/  (filename already has "PhilHealth - " prefix)
 *   2) qfph.db forms table         (idempotent upsert by slug)
 *
 * Skips codes whose interactive editor is already wired in QFPH.
 *
 * Usage:
 *   npx tsx scripts/import_philhealth_no_editor.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const SRC_DIR = '/home/skouzen/projects/quickformsph/Forms-Research/PHILHEALTH/pdf';
const DEST_DIR = '/home/skouzen/projects/quickformsph-dev/public/forms/NoFormEditor';
const CATALOG_JSON =
  '/home/skouzen/projects/quickformsph/Forms-Research/PHILHEALTH/philhealth_forms.json';
const DB_PATH = '/tmp/qfph/qfph.db';

// Skip codes whose interactive editor is already wired in QFPH (none new yet)
const SKIP_CODES = new Set<string>([]);

interface CatalogEntry {
  category: string;
  code: string;
  name: string;
  description: string;
  downloads: string[];
  pdfFile: string; // full destination filename including "PhilHealth - " prefix
}

function slugify(code: string): string {
  return ('philhealth-' + code.toLowerCase())
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function main() {
  if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });

  const catalog: CatalogEntry[] = JSON.parse(fs.readFileSync(CATALOG_JSON, 'utf8'));
  const onDisk = new Set(fs.readdirSync(SRC_DIR));

  const tasks: Array<{ entry: CatalogEntry; srcFile: string; destFile: string }> = [];
  for (const e of catalog) {
    if (SKIP_CODES.has(e.code)) continue;
    if (!onDisk.has(e.pdfFile)) {
      console.warn(`[skip] ${e.code}: source PDF missing on disk (${e.pdfFile})`);
      continue;
    }
    tasks.push({
      entry: e,
      srcFile: path.join(SRC_DIR, e.pdfFile),
      destFile: path.join(DEST_DIR, e.pdfFile),
    });
  }

  console.log(`[*] ${tasks.length} PhilHealth PDF forms to import`);

  // 1) Copy files
  let copied = 0,
    already = 0;
  for (const t of tasks) {
    if (fs.existsSync(t.destFile)) already++;
    else {
      fs.copyFileSync(t.srcFile, t.destFile);
      copied++;
    }
  }
  console.log(`[*] Files: copied=${copied}, already_present=${already}`);

  // 2) Upsert DB rows
  const db = new Database(DB_PATH);
  const now = Date.now();
  const findStmt = db.prepare('SELECT id FROM forms WHERE slug = ?');
  const updateStmt = db.prepare(`
    UPDATE forms
       SET form_code = @form_code, form_name = @form_name, agency = @agency,
           pdf_path = @pdf_path, source_url = COALESCE(@source_url, source_url),
           has_form_editor = 0,
           description = COALESCE(@description, description),
           updated_at = @updated_at, deleted_at = NULL
     WHERE slug = @slug
  `);
  const insertStmt = db.prepare(`
    INSERT INTO forms
      (slug, form_code, form_name, agency, pdf_path, source_url,
       has_form_editor, is_old_form_reported, up_vote, is_paid,
       description, created_at, updated_at, deleted_at)
    VALUES
      (@slug, @form_code, @form_name, 'PhilHealth', @pdf_path, @source_url,
       0, 0, 0, 0,
       @description, @created_at, @updated_at, NULL)
  `);

  let inserted = 0,
    updated = 0;
  for (const t of tasks) {
    const e = t.entry;
    const srcUrl = e.downloads[0];
    const slug = slugify(e.code);
    const formName = `PhilHealth — ${e.name.trim()}`;
    const pdfPath = `NoFormEditor/${path.basename(t.destFile)}`;
    const description =
      (e.description && e.description.trim()) ||
      `Official PhilHealth ${e.name.trim()}.`;

    const params = {
      slug,
      form_code: e.code,
      form_name: formName,
      agency: 'PhilHealth',
      pdf_path: pdfPath,
      source_url: srcUrl,
      description,
      updated_at: now,
      created_at: now,
    };

    const exists = findStmt.get(slug) as { id: number } | undefined;
    if (exists) {
      updateStmt.run(params);
      updated++;
    } else {
      insertStmt.run(params);
      inserted++;
    }
  }
  console.log(`[*] DB rows: inserted=${inserted}, updated=${updated}`);

  const total = db
    .prepare("SELECT COUNT(*) AS n FROM forms WHERE agency='PhilHealth' AND deleted_at IS NULL")
    .get() as { n: number };
  console.log(`[*] Total PhilHealth rows in DB now: ${total.n}`);
  db.close();
}

main();

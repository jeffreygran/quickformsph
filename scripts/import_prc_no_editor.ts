/**
 * Import PRC PDFs from a curated list into:
 *   1) public/forms/NoFormEditor/  (renamed with "PRC - " prefix)
 *   2) qfph.db forms table         (idempotent upsert by slug)
 *
 * Source list: /tmp/prc_forms_to_ingest.json
 *   [{file, title, url, pages, acro}, ...]
 *
 * Usage: npx tsx scripts/import_prc_no_editor.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const SRC_DIR = '/home/skouzen/projects/quickformsph/Forms-Research/PRC/pdf';
const DEST_DIR = '/home/skouzen/projects/quickformsph-dev/public/forms/NoFormEditor';
const TASK_JSON = '/tmp/prc_forms_to_ingest.json';
const DB_PATH = '/tmp/qfph/qfph.db';

interface Task {
  file: string;
  title: string;
  url: string;
  pages: number;
  acro: boolean;
}

function deriveCode(file: string): string {
  let base = file.replace(/\.[Pp][Dd][Ff]$/, '');
  base = base.replace(/^prc-/i, '');
  return base.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function slugify(s: string): string {
  return ('prc-' + s.toLowerCase())
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function destFilename(srcFile: string): string {
  const cleaned = srcFile.replace(/^prc[- _]+/i, '');
  return `PRC - ${cleaned}`;
}

function main() {
  if (!fs.existsSync(DEST_DIR)) fs.mkdirSync(DEST_DIR, { recursive: true });
  const tasks: Task[] = JSON.parse(fs.readFileSync(TASK_JSON, 'utf8'));
  const onDisk = new Set(fs.readdirSync(SRC_DIR));

  const ready: Array<{ t: Task; src: string; dst: string; code: string; slug: string }> = [];
  for (const t of tasks) {
    if (!onDisk.has(t.file)) {
      console.warn(`[skip] missing on disk: ${t.file}`);
      continue;
    }
    const code = deriveCode(t.file);
    const slug = slugify(code);
    const dst = path.join(DEST_DIR, destFilename(t.file));
    ready.push({ t, src: path.join(SRC_DIR, t.file), dst, code, slug });
  }
  const seen = new Map<string, string>();
  for (const r of ready) {
    if (seen.has(r.slug)) {
      console.error(`[collision] slug=${r.slug}  files: ${seen.get(r.slug)}  AND  ${r.t.file}`);
    } else {
      seen.set(r.slug, r.t.file);
    }
  }
  console.log(`[*] ${ready.length} PRC PDFs to import`);

  let copied = 0, already = 0;
  for (const r of ready) {
    if (fs.existsSync(r.dst)) already++;
    else { fs.copyFileSync(r.src, r.dst); copied++; }
  }
  console.log(`[*] Files: copied=${copied}, already_present=${already}`);

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
      (@slug, @form_code, @form_name, 'PRC', @pdf_path, @source_url,
       0, 0, 0, 0,
       @description, @created_at, @updated_at, NULL)
  `);

  let inserted = 0, updated = 0;
  for (const r of ready) {
    const title = (r.t.title && r.t.title.trim()) || r.code;
    const formName = `PRC — ${title}`;
    const pdfPath = `NoFormEditor/${path.basename(r.dst)}`;
    const desc = `Official PRC (Professional Regulation Commission) form: ${title}.`;
    const params = {
      slug: r.slug, form_code: r.code, form_name: formName, agency: 'PRC',
      pdf_path: pdfPath, source_url: r.t.url || null, description: desc,
      updated_at: now, created_at: now,
    };
    const exists = findStmt.get(r.slug) as { id: number } | undefined;
    if (exists) { updateStmt.run(params); updated++; }
    else { insertStmt.run(params); inserted++; }
  }
  console.log(`[*] DB rows: inserted=${inserted}, updated=${updated}`);
  const total = db.prepare("SELECT COUNT(*) AS n FROM forms WHERE agency='PRC' AND deleted_at IS NULL").get() as { n: number };
  console.log(`[*] Total PRC rows in DB now: ${total.n}`);
  db.close();
}

main();

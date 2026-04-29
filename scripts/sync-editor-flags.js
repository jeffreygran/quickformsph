const Database = require('better-sqlite3');
const fs = require('fs');

const src = fs.readFileSync('src/data/forms.ts', 'utf8');
// Extract every (slug, pdfPath) pair using a simple sliding regex.
const pairs = [];
const slugRe = /slug:\s*'([^']+)'[^]*?pdfPath:\s*'([^']+)'/g;
let m;
while ((m = slugRe.exec(src)) !== null) {
  pairs.push({ slug: m[1], pdfPath: m[2] });
}
const editorByPath = new Map(pairs.map((p) => [p.pdfPath, p.slug]));

const db = new Database('/tmp/qfph/qfph.db');
const all = db.prepare('SELECT slug, pdf_path, has_form_editor FROM forms WHERE deleted_at IS NULL').all();

const upd = db.prepare('UPDATE forms SET has_form_editor = ?, updated_at = ? WHERE slug = ?');
let fixed = 0;
const issues = [];
for (const r of all) {
  const expectedHasEditor = editorByPath.has(r.pdf_path) ? 1 : 0;
  if (r.has_form_editor !== expectedHasEditor) {
    issues.push({
      slug: r.slug,
      pdf_path: r.pdf_path,
      db_flag: r.has_form_editor,
      should_be: expectedHasEditor,
      schema_slug: editorByPath.get(r.pdf_path) ?? null,
    });
    upd.run(expectedHasEditor, Date.now(), r.slug);
    fixed++;
  }
}
console.log(JSON.stringify({ schema_count: pairs.length, db_count: all.length, fixed, issues }, null, 2));

const Database = require('better-sqlite3');
const fs = require('fs');

const src = fs.readFileSync('src/data/forms.ts', 'utf8');
const pairs = [];
const re = /slug:\s*'([^']+)'[^]*?pdfPath:\s*'([^']+)'/g;
let m;
while ((m = re.exec(src)) !== null) pairs.push({ slug: m[1], pdfPath: m[2] });
const schemaSlugs = new Set(pairs.map(p => p.slug));
const schemaByPath = new Map(pairs.map(p => [p.pdfPath, p.slug]));

const db = new Database('/tmp/qfph/qfph.db');
const all = db.prepare('SELECT slug, pdf_path, has_form_editor, form_name FROM forms WHERE deleted_at IS NULL').all();

console.log('SCHEMA SLUGS:', [...schemaSlugs].sort().join(', '));
console.log('\nDB rows where has_form_editor=1:');
const broken = [];
for (const r of all) {
  if (r.has_form_editor) {
    const ok = schemaSlugs.has(r.slug);
    console.log(`  ${ok ? '✅' : '❌'} ${r.slug}  (pdf: ${r.pdf_path})  schemaForPath=${schemaByPath.get(r.pdf_path) ?? '—'}`);
    if (!ok) broken.push(r);
  }
}
console.log(`\nbroken count: ${broken.length}`);

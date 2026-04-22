/**
 * Coords-coverage CI check.
 *
 * Ensures every field declared in a FormSchema either has a `fieldCoords` entry
 * OR a `checkboxCoords` entry OR is listed in `skipValues` (intentionally blank).
 *
 * Run: `npx tsx scripts/check-coords-coverage.ts` (or `ts-node`).
 * Exits non-zero on any coverage gap. Wire into the release pipeline.
 */
import { FORMS } from '../src/data/forms';

// Tree-shake-safe import: re-read the raw pdf-generator source and extract the
// keys of each FIELD_COORDS / CHECKBOX_COORDS map via a lightweight regex scan.
// (The config objects are not exported — we avoid introducing a new public API.)
import * as fs from 'fs';
import * as path from 'path';

const GEN_PATH = path.join(__dirname, '..', 'src', 'lib', 'pdf-generator.ts');
const src = fs.readFileSync(GEN_PATH, 'utf8');

// Extract slug → { fieldCoordsVar, checkboxCoordsVar, skipValuesInline } from
// the FORM_PDF_CONFIGS block. We parse permissively by slug literal.
function extractConfigBlock(slug: string): string | null {
  const re = new RegExp(
    `'${slug.replace(/[-/]/g, '\\$&')}'\\s*:\\s*\\{([\\s\\S]*?)\\n  \\},`,
    'm'
  );
  const m = src.match(re);
  return m ? m[1] : null;
}

function collectObjectKeys(varName: string, valuePrefix = '\\{'): Set<string> {
  const re = new RegExp(
    `(?:const|let)\\s+${varName}[^=]*=\\s*\\{([\\s\\S]*?)\\n\\};`,
    'm'
  );
  const m = src.match(re);
  if (!m) return new Set();
  const body = m[1];
  const keys = new Set<string>();
  const lineRe = new RegExp(`^\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*:\\s*${valuePrefix}`);
  for (const line of body.split('\n')) {
    const km = line.match(lineRe);
    if (km) keys.add(km[1]);
  }
  return keys;
}

let failures = 0;
for (const form of FORMS) {
  const block = extractConfigBlock(form.slug);
  if (!block) {
    console.error(`✗ [${form.slug}] not registered in FORM_PDF_CONFIGS`);
    failures++;
    continue;
  }

  const fcMatch = block.match(/fieldCoords:\s*([A-Z_][A-Z0-9_]*)/);
  const ccMatch = block.match(/checkboxCoords:\s*([A-Z_][A-Z0-9_]*)/);
  const svInlineMatch = block.match(/skipValues:\s*\{([\s\S]*?)\n\s*\}/);
  const svRefMatch = block.match(/skipValues:\s*([A-Z_][A-Z0-9_]*)/);

  const fieldCoordKeys = fcMatch ? collectObjectKeys(fcMatch[1]) : new Set<string>();
  const checkboxCoordKeys = ccMatch ? collectObjectKeys(ccMatch[1]) : new Set<string>();
  const skipValueKeys = new Set<string>();
  if (svInlineMatch) {
    for (const line of svInlineMatch[1].split('\n')) {
      const km = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
      if (km) skipValueKeys.add(km[1]);
    }
  } else if (svRefMatch) {
    for (const k of collectObjectKeys(svRefMatch[1], '\\[')) skipValueKeys.add(k);
  }

  const missing: string[] = [];
  for (const f of form.fields) {
    if (fieldCoordKeys.has(f.id)) continue;
    if (checkboxCoordKeys.has(f.id)) continue;
    if (skipValueKeys.has(f.id)) continue;
    missing.push(f.id);
  }

  if (missing.length) {
    failures++;
    console.error(`✗ [${form.slug}] ${missing.length} field(s) have no coords and no skip entry:`);
    for (const id of missing) console.error(`    - ${id}`);
  } else {
    console.log(`✓ [${form.slug}] all ${form.fields.length} fields have coords or skip entries`);
  }
}

if (failures > 0) {
  console.error(`\nFAILED: ${failures} form(s) have missing coord coverage.`);
  process.exit(1);
}
console.log('\nAll forms have complete coord coverage.');

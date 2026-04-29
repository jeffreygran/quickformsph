/**
 * src/lib/forms-scan.ts
 *
 * Stateful scanner: walks public/forms/ and public/forms/NoFormEditor/, then
 * upserts the SQLite `forms` table. Lives in /lib (not /api) because Next.js
 * route files may only export HTTP verbs.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  upsertFormCatalog,
  softDeleteFormCatalog,
  listActiveFormSlugs,
} from '@/lib/db';
import { parsePdfFilename } from '@/lib/forms-scanner';

const PUBLIC_FORMS_DIR = path.join(process.cwd(), 'public', 'forms');
const NO_EDITOR_DIR    = path.join(PUBLIC_FORMS_DIR, 'NoFormEditor');

/**
 * Filenames to ignore during scan. Used for orphan PDFs that were removed
 * from the repo but may still linger on Azure App Service /home/site/wwwroot
 * because zip-deploy uses rsync WITHOUT --delete by default. Listing them
 * here keeps their slugs out of seenSlugs so the soft-delete pass below
 * cleanly removes the corresponding catalog rows.
 *
 * Each entry is the exact basename (case-sensitive) of the PDF file.
 */
const DENY_FILENAMES = new Set<string>([
  'BIR 2316.pdf',         // duplicate of canonical BIR-2316_Certificate...pdf
  'CSF-2018.pdf',         // legacy BIR-1901 copy; real CSF is philhealth-claim-signature-form
]);

export interface ScanResult {
  scanned: number;
  inserted: number;
  updated: number;
  softDeleted: number;
  rows: Array<{
    slug: string;
    agency: string;
    form_code: string;
    form_name: string;
    has_form_editor: 0 | 1;
    action: 'inserted' | 'updated';
  }>;
}

async function listPdfs(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.pdf'))
      .filter((e) => !DENY_FILENAMES.has(e.name))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function runScan(): Promise<ScanResult> {
  const result: ScanResult = {
    scanned: 0, inserted: 0, updated: 0, softDeleted: 0, rows: [],
  };

  const seenSlugs = new Set<string>();

  // 1. Top-level PDFs → has_form_editor = 1
  const topPdfs = await listPdfs(PUBLIC_FORMS_DIR);
  for (const filename of topPdfs) {
    const meta = parsePdfFilename(filename);
    const { inserted } = upsertFormCatalog({
      slug:           meta.slug,
      form_code:      meta.formCode,
      form_name:      meta.formName,
      agency:         meta.agency,
      pdf_path:       filename,
      has_form_editor: 1,
    });
    seenSlugs.add(meta.slug);
    result.scanned++;
    if (inserted) result.inserted++; else result.updated++;
    result.rows.push({
      slug: meta.slug, agency: meta.agency, form_code: meta.formCode,
      form_name: meta.formName, has_form_editor: 1,
      action: inserted ? 'inserted' : 'updated',
    });
  }

  // 2. NoFormEditor PDFs → has_form_editor = 0
  const placeholderPdfs = await listPdfs(NO_EDITOR_DIR);
  for (const filename of placeholderPdfs) {
    const meta = parsePdfFilename(filename);
    const { inserted } = upsertFormCatalog({
      slug:           meta.slug,
      form_code:      meta.formCode,
      form_name:      meta.formName,
      agency:         meta.agency,
      pdf_path:       path.posix.join('NoFormEditor', filename),
      has_form_editor: 0,
    });
    seenSlugs.add(meta.slug);
    result.scanned++;
    if (inserted) result.inserted++; else result.updated++;
    result.rows.push({
      slug: meta.slug, agency: meta.agency, form_code: meta.formCode,
      form_name: meta.formName, has_form_editor: 0,
      action: inserted ? 'inserted' : 'updated',
    });
  }

  // 3. Soft-delete any active row whose PDF is no longer on disk.
  for (const slug of listActiveFormSlugs()) {
    if (!seenSlugs.has(slug)) {
      if (softDeleteFormCatalog(slug)) result.softDeleted++;
    }
  }

  return result;
}

export { NO_EDITOR_DIR, PUBLIC_FORMS_DIR };

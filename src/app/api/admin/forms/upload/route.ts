/**
 * POST /api/admin/forms/upload
 *
 * Multipart form upload of one PDF. The file is saved to
 *   public/forms/NoFormEditor/<sanitized filename>.pdf
 * and an idempotent re-scan is run so the new row appears in the catalog
 * with `has_form_editor = 0` ("Soon").
 *
 * Auth: requires the `qfph_admin` cookie.
 * Limits: 25 MB, must be a real PDF (magic bytes %PDF-).
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { runScan, NO_EDITOR_DIR } from '@/lib/forms-scan';

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('qfph_admin')?.value);
}

/**
 * Keep the user's intended filename (so the scanner derives a clean slug
 * from "Agency - Code.pdf"), but strip path separators and anything weird.
 */
function safeFilename(raw: string): string {
  const base = path.basename(raw); // strip any directory components
  // Allow letters, digits, spaces, dots, dashes, underscores, parens.
  const cleaned = base
    .replace(/[^A-Za-z0-9 .\-_()]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned.toLowerCase().endsWith('.pdf')) return cleaned + '.pdf';
  return cleaned;
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided (field name "file")' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'Empty file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` },
      { status: 413 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  // Magic bytes: a real PDF starts with "%PDF-".
  if (buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    return NextResponse.json({ error: 'Not a PDF (bad magic bytes)' }, { status: 400 });
  }

  const filename = safeFilename(file.name);
  const dest     = path.join(NO_EDITOR_DIR, filename);

  await fs.mkdir(NO_EDITOR_DIR, { recursive: true });

  // Refuse to clobber: if the same name already exists in NoFormEditor,
  // append a numeric suffix.
  let finalDest = dest;
  let finalName = filename;
  let n = 1;
  // Avoid an unbounded loop in pathological cases.
  while (await fileExists(finalDest)) {
    const ext  = path.extname(filename);
    const stem = filename.slice(0, filename.length - ext.length);
    finalName  = `${stem} (${n})${ext}`;
    finalDest  = path.join(NO_EDITOR_DIR, finalName);
    if (++n > 50) {
      return NextResponse.json({ error: 'Too many conflicting filenames' }, { status: 409 });
    }
  }

  await fs.writeFile(finalDest, buf);

  // Re-scan so the row is upserted with has_form_editor=0.
  const scan = await runScan();

  return NextResponse.json({
    ok: true,
    filename: finalName,
    path: path.posix.join('NoFormEditor', finalName),
    bytes: buf.length,
    scan,
  });
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

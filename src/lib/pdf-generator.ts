/**
 * PDF Generator — coordinate overlay strategy for flat PDFs (no AcroForm fields).
 *
 * Strategy: Load the original PDF from /public/forms/{pdfPath}, then draw
 * each field value as a text overlay at the pre-configured coordinates.
 *
 * TODO: Replace FIELD_COORDS with actual coordinates extracted via
 * Azure Document Intelligence (prebuilt-layout) or manual calibration.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';
import { FormSchema } from '@/data/forms';

// ── HQP-PFF-356 calibrated coordinates ──────────────────────────────────────
// Page: 612.1 × 936.1 pts (legal size, 1 page)
// Derived from pdfplumber text extraction: pdf_lib_y = 936.1 - pdfplumber_bottom + offset
// x = start of fill area (just after label text)

// Values to skip (treated as empty on the PDF)
const SKIP_VALUES: Record<string, string[]> = {
  name_ext: ['N/A'],         // no extension = leave blank
  bank_name: ['', 'Other'], // no separate bank name field on this form
};

const FIELD_COORDS: Record<
  string,
  { page: number; x: number; y: number; maxWidth?: number; fontSize?: number }
> = {
  // Grid lines confirmed from rect extraction (pdf-lib Y, y=0 at bottom):
  //   y=836.0 top border | y=812.5 | y=786.9 | y=771.2 | y=745.8 | y=722.3
  // Text baseline = cell_bottom_Y + 4

  // ── MP2 Account Number (right column, cell y=812.5–836.0) ────────────────
  mp2_account_no:  { page: 0, x: 403, y: 817, maxWidth: 175 },

  // ── Names row (cell y=786.9–812.5) ───────────────────────────────────────
  // Column splits inferred from label x: ~116, ~196, ~328, ~398
  last_name:       { page: 0, x:  37, y: 791, maxWidth:  75 },
  first_name:      { page: 0, x: 120, y: 791, maxWidth:  72 },
  name_ext:        { page: 0, x: 200, y: 791, maxWidth: 124 },
  middle_name:     { page: 0, x: 332, y: 791, maxWidth:  62 },
  mid_no:          { page: 0, x: 403, y: 791, maxWidth: 175 },

  // ── Address section ───────────────────────────────────────────────────────
  // Left column (x=31–265) is a TALL box spanning y=722.3–771.7 (h≈49).
  // "COMPLETE MAILING ADDRESS" label baseline is at y=762 — fill lines start BELOW it.
  // Three evenly-spaced fill lines (≈13 pts apart) below the label:
  street:          { page: 0, x:  37, y: 752, maxWidth: 225 },
  barangay:        { page: 0, x:  37, y: 740, maxWidth: 225 },
  city:            { page: 0, x:  37, y: 728, maxWidth:  88 },
  province:        { page: 0, x: 130, y: 728, maxWidth: 100 },
  zip:             { page: 0, x: 235, y: 728, maxWidth:  27 },
  // Middle column (x=265–398), top row (y=745.8–771.2): cellphone
  cellphone:       { page: 0, x: 271, y: 751, maxWidth: 123 },
  // Right column (x=398–582), top row (y=745.8–771.2): email
  email:           { page: 0, x: 403, y: 751, maxWidth: 175 },
  // Middle column, bottom row (y=722.3–745.8): home tel
  home_tel:        { page: 0, x: 271, y: 727, maxWidth: 123 },
  // Right column, bottom row (y=722.3–745.8): biz tel
  biz_tel:         { page: 0, x: 403, y: 727, maxWidth: 175 },

  // ── Bank section (authorization underlines) ───────────────────────────────
  // Text sits just above each underline (underline pdflibY + 2)
  bank_account_no: { page: 0, x: 131, y: 678, maxWidth: 135 },
  bank_branch:     { page: 0, x:  97, y: 663, maxWidth: 170 },
  bank_address:    { page: 0, x: 100, y: 648, maxWidth: 168 },

  // ── Date (right underline of signature section, x0=392.1) ────────────────
  date:            { page: 0, x: 393, y: 591, maxWidth:  90 },
};

const DEFAULT_FONT_SIZE = 8;
const PUBLIC_FORMS_DIR = path.join(process.cwd(), 'public', 'forms');

// The PDF contains two identical copies of the form stacked vertically.
// Copy 2 starts exactly 449.4 pts below copy 1 (measured from pdfplumber word positions).
const COPY2_Y_OFFSET = 449.4;

// Strip characters outside WinAnsi (latin-1 range 0x00–0xFF) so Helvetica never throws.
function toWinAnsi(str: string): string {
  return str
    .replace(/\u2192/g, '->')   // →
    .replace(/\u2190/g, '<-')   // ←
    .replace(/\u2026/g, '...')  // …
    .replace(/\u2013/g, '-')    // –
    .replace(/\u2014/g, '--')   // —
    .replace(/[\u0100-\uFFFF]/g, '?'); // everything else outside latin-1
}

export async function generatePDF(
  form: FormSchema,
  values: Record<string, string>
): Promise<Uint8Array> {
  // ── Load source PDF ────────────────────────────────────────────────────────
  const pdfPath = path.join(PUBLIC_FORMS_DIR, form.pdfPath);
  let existingPdfBytes: Uint8Array;

  try {
    const buf = await fs.readFile(pdfPath);
    existingPdfBytes = new Uint8Array(buf);
  } catch {
    // If the source PDF doesn't exist yet, create a blank placeholder PDF
    existingPdfBytes = await createBlankPdf(form.name, form.code);
  }

  const pdfDoc = await PDFDocument.load(existingPdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();

  // ── Draw field values on both copies ──────────────────────────────────────
  const yOffsets = [0, -COPY2_Y_OFFSET]; // copy 1 and copy 2

  for (const field of form.fields) {
    const rawValue = (values[field.id] ?? '').trim();
    if (!rawValue) continue;

    // Skip placeholder/N/A values that shouldn't appear on the PDF
    const skipList = SKIP_VALUES[field.id];
    if (skipList?.includes(rawValue)) continue;

    const coords = FIELD_COORDS[field.id];
    if (!coords) continue;

    const page = pages[coords.page];
    if (!page) continue;

    const fontSize = coords.fontSize ?? DEFAULT_FONT_SIZE;
    const truncated = rawValue.length > 60 ? rawValue.slice(0, 60) + '...' : rawValue;
    const text = toWinAnsi(truncated);

    for (const yOff of yOffsets) {
      page.drawText(text, {
        x: coords.x,
        y: coords.y + yOff,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: coords.maxWidth,
      });
    }
  }

  return pdfDoc.save();
}

// ── Blank placeholder PDF ─────────────────────────────────────────────────────
async function createBlankPdf(name: string, code: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 936]);   // legal size (matches HQP-PFF-356)
  const font = await doc.embedFont(StandardFonts.Helvetica);

  page.drawText(`[PLACEHOLDER — SOURCE PDF NOT UPLOADED]`, {
    x: 50, y: 700, size: 10, font, color: rgb(0.8, 0.1, 0.1),
  });
  page.drawText(code, { x: 50, y: 680, size: 14, font, color: rgb(0, 0, 0) });
  page.drawText(name, { x: 50, y: 660, size: 9, font, color: rgb(0.3, 0.3, 0.3), maxWidth: 500 });
  page.drawText(
    'Upload the actual PDF via the Admin Portal -> Form Catalog.',
    { x: 50, y: 630, size: 8, font, color: rgb(0.4, 0.4, 0.4) }
  );

  return doc.save();
}

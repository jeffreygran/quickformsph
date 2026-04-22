/**
 * PDF Generator — coordinate overlay strategy for flat PDFs (no AcroForm fields).
 *
 * Strategy: Load the original PDF from /public/forms/{pdfPath}, then draw
 * each field value as a text overlay at the pre-configured coordinates.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import path from 'path';
import fs from 'fs/promises';
import { FormSchema } from '@/data/forms';

type CoordEntry = { page: number; x: number; y: number; maxWidth?: number; fontSize?: number };
type CoordsMap = Record<string, CoordEntry>;

interface FormPdfConfig {
  /** Field id → overlay coordinate (pdf-lib coords, y=0 at bottom). */
  fieldCoords: CoordsMap;
  /** Field values to treat as blank (not drawn). */
  skipValues?: Record<string, string[]>;
  /**
   * If the PDF has N identical copies of the form stacked vertically,
   * provide the Y-offsets (in pts) for each copy relative to copy 1.
   * Copy 1 is always offset 0; include 0 as the first element plus each
   * additional negative offset (pdf-lib Y decreases downward).
   */
  copyYOffsets?: number[];
  /**
   * For checkbox / radio-button fields: maps fieldId → value → (x,y) where
   * to print "X". Takes priority over fieldCoords for the same field id.
   */
  checkboxCoords?: Record<string, Record<string, { x: number; y: number }>>;
}

// ── HQP-PFF-356 calibrated coordinates ──────────────────────────────────────
// Page: 612.1 × 936.1 pts (legal size, 1 page)
// Derived from pdfplumber text extraction: pdf_lib_y = 936.1 - pdfplumber_bottom + offset
// x = start of fill area (just after label text)

// Values to skip (treated as empty on the PDF)
const SKIP_VALUES: Record<string, string[]> = {
  name_ext: ['N/A'],         // no extension = leave blank
  bank_name: ['', 'Other'], // no separate bank name field on this form
};

const FIELD_COORDS: CoordsMap = {
  // Grid lines confirmed from rect extraction (pdf-lib Y, y=0 at bottom):
  //   y=836.0 top border | y=812.5 | y=786.9 | y=771.2 | y=745.8 | y=722.3
  // Text baseline = cell_bottom_Y + 4

  // ── MP2 Account Number (right column, cell y=812.5–836.0) ────────────────
  mp2_account_no:  { page: 0, x: 403, y: 817, maxWidth: 175 },

  // ── Pag-IBIG Branch (fill line at pdfplumber top=64.6, pdf-lib y=874) ─────
  // Underline spans x0=251.1–368.1 (117 pts wide)
  branch:          { page: 0, x: 252, y: 874, maxWidth: 115 },

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

// The Pag-IBIG PDF contains two identical copies of the form stacked vertically.
// Copy 2 starts exactly 449.4 pts below copy 1 (measured from pdfplumber word positions).
const HQP_COPY2_Y_OFFSET = 449.4;

// ── PhilHealth PMRF calibrated coordinates ───────────────────────────────────
// Page: 594.8 × 841.5 pts (A4 size, 2 pages)
// Derived from pdfplumber: pdf_lib_y = 841.5 - pdfplumber_bottom
// Page 0 contains sections I–IV; Page 1 is Section V (Updating) — we skip it
// All fill areas are in blank rows below section labels.
const PMRF_FIELD_COORDS: CoordsMap = {
  // ── PIN (top-right digit row, immediately below PIN label bot=96.3) ─────────
  // PIN label bottom = pdfplumber 96.3; PURPOSE: label top = 103.4
  // Place baseline just above PURPOSE: → pdf_lib_y = 841.5 - 97 - 3(nudge) = 741
  // x starts at 388 (right column, below "PHILHEALTH IDENTIFICATION..." label)
  pin:                 { page: 0, x: 388, y: 741, maxWidth: 175 },

  // ── Preferred KonSulTa Provider (fill box: pdfplumber top=140.5 bot=158.5) ──
  // pdf_lib_y = 841.5 - 158.5 + 4 = 687
  konsulta_provider:   { page: 0, x: 357, y: 686, maxWidth: 207 },

  // ── Section I: Personal Details ──
  // Column boundaries from PDF rects (page 0, name rows):
  //   LAST NAME  col: x=85.5–216.0
  //   FIRST NAME col: x=216.0–346.5
  //   EXTENSION  col: x=346.5–387.0
  //   MIDDLE NAME col: x=387.0–517.5
  // MEMBER row: pdfplumber top≈204-220 → pdf_lib_y=624
  last_name:           { page: 0, x:  90, y: 624, maxWidth: 122 },
  first_name:          { page: 0, x: 220, y: 624, maxWidth: 122 },
  name_ext:            { page: 0, x: 350, y: 624, maxWidth:  33 },
  middle_name:         { page: 0, x: 392, y: 624, maxWidth: 120 },

  // MOTHER's MAIDEN NAME row: pdfplumber top≈222-244 → pdf_lib_y=602
  mother_last_name:    { page: 0, x:  90, y: 602, maxWidth: 122 },
  mother_first_name:   { page: 0, x: 220, y: 602, maxWidth: 122 },
  mother_middle_name:  { page: 0, x: 392, y: 602, maxWidth: 120 },

  // SPOUSE row: pdfplumber top=242.7 bot=265.9 → pdf_lib_y = 841.5-265.9+4 = 579.6
  spouse_last_name:    { page: 0, x:  90, y: 579, maxWidth: 122 },
  spouse_first_name:   { page: 0, x: 220, y: 579, maxWidth: 122 },
  spouse_middle_name:  { page: 0, x: 392, y: 579, maxWidth: 120 },

  // DATE OF BIRTH: fill area between DATE header (bottom≈278) and mm/dd/yy guides (top≈300)
  // Place text at y=547 so it appears in the boxes at the guide level
  dob_month:           { page: 0, x:  28, y: 547, maxWidth: 18 },  // mm
  dob_day:             { page: 0, x:  62, y: 547, maxWidth: 18 },  // dd
  dob_year:            { page: 0, x:  98, y: 547, maxWidth: 40 },  // yyyy

  // PLACE OF BIRTH: same row right of DOB (x starts ≈163)
  place_of_birth:      { page: 0, x: 163, y: 547, maxWidth: 192 },

  // SEX / CIVIL STATUS / CITIZENSHIP: handled via checkboxCoords below.

  // ── Section II: Address and Contact ──
  // ADDRESS ROW 1 box: pdfplumber top=378.4–411.9 → pdf_lib 429.6–463.1
  // Sub-labels (Unit/Room…Street) are at pdfplumber top=389 → fill is below at y=433
  // Col boundaries from word positions:
  //   Unit/Room x0=19.8 | Building x0=97.3 | Lot/Block x0=158 | Street x0=295.9 | end≈395
  perm_unit:           { page: 0, x:  22, y: 433, maxWidth:  73 },
  perm_building:       { page: 0, x:  99, y: 433, maxWidth:  57 },
  perm_lot:            { page: 0, x: 160, y: 433, maxWidth: 130 },
  perm_street:         { page: 0, x: 298, y: 433, maxWidth:  95 },

  // ADDRESS ROW 2 box: pdfplumber top=410.8–438.9 → pdf_lib y=415
  // Col boundaries: Subdivision x0=19.8 | Barangay x0=86.4 | City x0=155.3 | Province x0=222.9 | ZIP x0=356.3 | end≈395
  perm_subdivision:    { page: 0, x:  22, y: 415, maxWidth:  60 },
  perm_barangay:       { page: 0, x:  88, y: 415, maxWidth:  63 },
  perm_city:           { page: 0, x: 157, y: 415, maxWidth:  62 },
  perm_province:       { page: 0, x: 225, y: 415, maxWidth: 127 },
  perm_zip:            { page: 0, x: 359, y: 415, maxWidth:  33 },

  // RIGHT COLUMN – exact fill-box underlines (from PDF rects):
  // Home Phone underline: pdfplumber top=390.0–406.0 → pdf_lib bottom=435.5 → text baseline y=437
  home_phone:          { page: 0, x: 406, y: 437, maxWidth: 162 },
  // Mobile underline:    pdfplumber top=428.6–444.6 → pdf_lib bottom=396.9 → text baseline y=398
  mobile:              { page: 0, x: 406, y: 398, maxWidth: 162 },
  // Email underline:     pdfplumber top=483.6–499.6 → pdf_lib bottom=341.9 → text baseline y=344
  email:               { page: 0, x: 406, y: 344, maxWidth: 162 },

  // ── Section IV: Member Type handled via checkboxCoords ──
  // Bottom row cells: Profession x0=18-193.5 | Monthly Income x0=193.5-283.5 | Proof of Income x0=283.5-378
  // Cell box pdfplumb top=767.7 bottom=803.6.
  // Label text occupies top=770.5–784.7 (two lines ending at pdfplumb bottom≈784.7).
  // Fill area: pdfplumb top≈793.5 (blank below label) → pdf_lib y = 841.5 - 793.5 - 8 ≈ 40
  profession:          { page: 0, x:  22, y: 40, maxWidth: 168 },
  monthly_income:      { page: 0, x: 197, y: 40, maxWidth:  82 },
  proof_of_income:     { page: 0, x: 287, y: 40, maxWidth:  87 },
};

// ── PhilHealth PMRF checkbox coordinate map ───────────────────────────────────
// Each entry: fieldId → value → {x, y} where to print "X" (pdf-lib coords, y=0 at bottom)
// x is just left of the printed label, at the checkbox square
// y = 841.5 - pdfplumber_top + small fudge to center in checkbox row
const PMRF_CHECKBOX_COORDS: Record<string, Record<string, { x: number; y: number }>> = {
  // ── Sex (checkboxes at x≈20-28, label at x≈32) ────────────────────────────
  sex: {
    'Male':   { x: 22, y: 513 },  // top≈328.6 → y=841.5-328.6=512.9
    'Female': { x: 22, y: 500 },  // top≈341.3 → y=841.5-341.3=500.2
  },

  // ── Civil Status (checkboxes at x≈65-75 and x≈113-122) ───────────────────
  civil_status: {
    'Single':           { x: 67, y: 515 },  // top≈326.8 → y=514.7
    'Married':          { x: 67, y: 502 },  // top≈338.6 → y=502.9
    'Widow/er':         { x: 113, y: 503 }, // top≈337.7 → y=503.8
    'Annulled':         { x: 113, y: 514 }, // top≈326.9 → y=514.6
    'Legally Separated':{ x: 67,  y: 492 }, // top≈349.1 → y=492.4
  },

  // ── Citizenship (checkboxes at x≈183-189 and x≈269-277) ──────────────────
  citizenship: {
    'Filipino':         { x: 183, y: 512 }, // top≈329.2 → y=512.3
    'Dual Citizen':     { x: 183, y: 497 }, // top≈344.2 → y=497.3
    'Foreign National': { x: 270, y: 512 }, // top≈329.5 → y=512.0
  },

  // ── Member Type (Section IV) ──────────────────────────────────────────────
  // Direct Contributors — left column (x≈22)
  member_type: {
    'Employed Private':                         { x: 22, y: 178 }, // top=663.4 → 178.1
    'Employed Government':                      { x: 22, y: 166 }, // top=675.3 → 166.2
    'Professional Practitioner':                { x: 22, y: 153 }, // top=688.8 → 152.7
    'Self-Earning Individual':                  { x: 22, y: 140 }, // top=700.8 → 140.7
    // Middle-left sub-column (x≈166-178)
    'Kasambahay':                               { x: 166, y: 178 }, // top=663.7 → 177.8
    'Migrant Worker (Land-Based)':              { x: 178, y: 153 }, // top=687.8 → 153.7
    'Migrant Worker (Sea-Based)':               { x: 258, y: 153 }, // top=688.1 → 153.4
    'Lifetime Member':                          { x: 166, y: 141 }, // top=700.1 → 141.4
    'Filipinos with Dual Citizenship / Living Abroad': { x: 166, y: 129 }, // top=712.4 → 129.1
    'Foreign National':                         { x: 166, y: 115 }, // top=725.9 → 115.6
    // Family Driver (next to Kasambahay)
    'Family Driver':                            { x: 258, y: 178 }, // top=663.7 → 177.8
    // Indirect Contributors — right area (x≈385)
    'Listahanan':                               { x: 385, y: 172 }, // top=668.9 → 172.6
    '4Ps/MCCT':                                 { x: 385, y: 159 }, // top=682.1 → 159.4
    'Senior Citizen':                           { x: 385, y: 146 }, // top=695.7 → 145.8
    'PAMANA':                                   { x: 385, y: 132 }, // top=709.6 → 131.9
    'KIA/KIPO':                                 { x: 385, y: 119 }, // top=722.5 → 119.0
    'Bangsamoro/Normalization':                 { x: 385, y: 104 }, // top=737.2 → 104.3
    // Indirect — rightmost column (x≈462)
    'LGU-sponsored':                            { x: 462, y: 172 }, // top=669.2 → 172.3
    'NGA-sponsored':                            { x: 462, y: 159 }, // top=682.3 → 159.2
    'Private-sponsored':                        { x: 462, y: 146 }, // top=695.4 → 146.1
    'Person with Disability':                   { x: 462, y: 132 }, // top=709.6 → 131.9
  },
};

// ── Per-form PDF config registry ─────────────────────────────────────────────
const FORM_PDF_CONFIGS: Record<string, FormPdfConfig> = {
  'hqp-pff-356': {
    fieldCoords: FIELD_COORDS,
    skipValues: SKIP_VALUES,
    copyYOffsets: [0, -HQP_COPY2_Y_OFFSET],
  },
  'philhealth-pmrf': {
    fieldCoords: PMRF_FIELD_COORDS,
    skipValues: { name_ext: ['N/A'] },
    copyYOffsets: [0],
    checkboxCoords: PMRF_CHECKBOX_COORDS,
  },
};

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

  // ── Look up per-form config, fall back to legacy HQP config ───────────────
  const config = FORM_PDF_CONFIGS[form.slug] ?? {
    fieldCoords: FIELD_COORDS,
    skipValues: SKIP_VALUES,
    copyYOffsets: [0, -HQP_COPY2_Y_OFFSET],
  };

  const { fieldCoords, skipValues = {}, copyYOffsets = [0], checkboxCoords = {} } = config;

  // ── Draw field values ─────────────────────────────────────────────────────
  for (const field of form.fields) {
    const rawValue = (values[field.id] ?? '').trim();
    if (!rawValue) continue;

    // Skip placeholder values that shouldn't appear on the PDF
    const skipList = skipValues[field.id];
    if (skipList?.includes(rawValue)) continue;

    // ── Checkbox / radio-button fields ────────────────────────────────────
    const checkboxEntry = checkboxCoords[field.id]?.[rawValue];
    if (checkboxEntry) {
      for (const yOff of copyYOffsets) {
        pages[0].drawText('X', {
          x: checkboxEntry.x,
          y: checkboxEntry.y + yOff,
          size: 7,
          font,
          color: rgb(0, 0, 0),
        });
      }
      continue; // skip regular text overlay for this field
    }

    const coords = fieldCoords[field.id];
    if (!coords) continue;

    const page = pages[coords.page];
    if (!page) continue;

    const fontSize = coords.fontSize ?? DEFAULT_FONT_SIZE;
    const truncated = rawValue.length > 60 ? rawValue.slice(0, 60) + '...' : rawValue;
    const text = toWinAnsi(truncated);

    for (const yOff of copyYOffsets) {
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

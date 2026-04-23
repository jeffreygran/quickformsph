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

type CoordEntry = {
  page: number;
  x: number;
  y: number;
  maxWidth?: number;
  fontSize?: number;
  /** If set, render one character per box, centered at each x-coordinate listed here. */
  boxCenters?: number[];
};
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
   * For checkbox / radio-button fields: maps fieldId → value → (x,y,page) where
   * to print the checkmark. page defaults to 0 if omitted.
   * Takes priority over fieldCoords for the same field id.
   */
  checkboxCoords?: Record<string, Record<string, { x: number; y: number; page?: number }>>;
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

const DEFAULT_FONT_SIZE = 9;
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
  // ── PIN (12 digit-box images; detected as image objects via pdfplumber)
  // Boxes span pdfplumb top=63.38 bottom=89.50 → pdf_lib y_bottom=752.0, box_height=26.12
  // y=762 centers 9pt cap-height (5.96pt) vertically: 752.0 + (26.12-5.96)/2 = 762
  // boxCenters = image cx values from pdfplumber, sorted by x; strip dashes from input
  pin: {
    page: 0, x: 0, y: 762, fontSize: 9,
    boxCenters: [389.82, 404.82, 420.48, 435.48, 453.93, 468.93, 484.60, 499.60, 518.07, 533.07, 548.73, 563.73],
  },

  // ── Preferred KonSulTa Provider (fill box: pdfplumber top=140.5 bot=158.5) ──
  // pdf_lib_y = 841.5 - 158.5 + 4 = 687
  konsulta_provider:   { page: 0, x: 357, y: 686, maxWidth: 207 },

  // ── PHILSYS ID and TIN (right column, image digit boxes) ──
  // PHILSYS: 12 boxes in 3 groups of 4. Images top≈284.74 bot≈310.88 (h≈26.12)
  // y = y_lib_bottom + (box_h - cap_h_9pt) / 2 = 530.62 + (26.12-6.51)/2 = 540
  // TIN: 9 boxes in 3 groups of 3. Images top=324.94 bot=351.06 (h=26.12)
  // y = 490.44 + (26.12-6.51)/2 = 500
  philsys_id: {
    page: 0, x: 0, y: 540, fontSize: 9,
    boxCenters: [390.61, 405.28, 420.28, 435.61, 455.26, 469.92, 484.92, 500.63, 519.24, 533.91, 548.91, 564.24],
  },
  tin: {
    page: 0, x: 0, y: 500, fontSize: 9,
    boxCenters: [390.56, 405.22, 420.22, 439.68, 454.35, 469.35, 488.43, 503.10, 518.10],
  },

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

  // DATE OF BIRTH: 8 digit-box images (top=277.69 bottom=303.81 → pdf_lib 537.69-563.81)
  // y=547 centers 11pt cap-height (7.28pt) vertically: 537.69 + (26.12-7.28)/2 ≈ 547
  // Groups: mm=boxes1-2 | dd=boxes3-4 | yyyy=boxes5-8
  dob_month: { page: 0, x: 0, y: 547, fontSize: 11, boxCenters: [30.85, 45.85] },
  dob_day:   { page: 0, x: 0, y: 547, fontSize: 11, boxCenters: [65.85, 80.69] },
  dob_year:  { page: 0, x: 0, y: 547, fontSize: 11, boxCenters: [101.04, 116.04, 130.71, 145.71] },

  // PLACE OF BIRTH: same row right of DOB (x starts ≈163)
  place_of_birth:      { page: 0, x: 163, y: 547, maxWidth: 192, fontSize: 10 },

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

  // ── Mailing Address (rows below perm address) ──
  // Row 1 box: pdfplumb top=438.94 bot=474.94 → y_lib(bot)=366.56, same delta(+3.44) as perm row1 → y=370
  // Col x same as perm row 1
  mail_unit:           { page: 0, x:  22, y: 370, maxWidth:  73 },
  mail_building:       { page: 0, x:  99, y: 370, maxWidth:  57 },
  mail_lot:            { page: 0, x: 160, y: 370, maxWidth: 130 },
  mail_street:         { page: 0, x: 298, y: 370, maxWidth:  95 },
  // Row 2 box: pdfplumb top=474.94 bot=505.99 → y_lib=335.51; label at top=477.1, offset 15.7 from box top → y=351
  mail_subdivision:    { page: 0, x:  22, y: 351, maxWidth:  60 },
  mail_barangay:       { page: 0, x:  88, y: 351, maxWidth:  63 },
  mail_city:           { page: 0, x: 157, y: 351, maxWidth:  62 },
  mail_province:       { page: 0, x: 225, y: 351, maxWidth: 127 },
  mail_zip:            { page: 0, x: 359, y: 351, maxWidth:  33 },

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

  // ── Section III: Declaration of Dependents ────────────────────────────────
  // Column x values: last_name=20, first_name=123, name_ext=236, middle_name=267,
  //                  relationship=371, dob=416, citizenship=461
  // Row y values (pdf_lib = 841.5 - row_bottom + 4):
  //   Row 1: bot=571.9 → y=274   Row 2: bot=589.9 → y=256
  //   Row 3: bot=607.9 → y=238   Row 4: bot=626.0 → y=220
  dep1_last_name:    { page: 0, x:  20, y: 274, maxWidth: 101, fontSize: 8 },
  dep1_first_name:   { page: 0, x: 123, y: 274, maxWidth: 109, fontSize: 8 },
  dep1_name_ext:     { page: 0, x: 236, y: 274, maxWidth:  27, fontSize: 7 },
  dep1_middle_name:  { page: 0, x: 267, y: 274, maxWidth: 100, fontSize: 8 },
  dep1_relationship: { page: 0, x: 371, y: 274, maxWidth:  41, fontSize: 7 },
  dep1_dob:          { page: 0, x: 416, y: 274, maxWidth:  41, fontSize: 7 },
  dep1_citizenship:  { page: 0, x: 461, y: 274, maxWidth:  32, fontSize: 7 },

  dep2_last_name:    { page: 0, x:  20, y: 256, maxWidth: 101, fontSize: 8 },
  dep2_first_name:   { page: 0, x: 123, y: 256, maxWidth: 109, fontSize: 8 },
  dep2_name_ext:     { page: 0, x: 236, y: 256, maxWidth:  27, fontSize: 7 },
  dep2_middle_name:  { page: 0, x: 267, y: 256, maxWidth: 100, fontSize: 8 },
  dep2_relationship: { page: 0, x: 371, y: 256, maxWidth:  41, fontSize: 7 },
  dep2_dob:          { page: 0, x: 416, y: 256, maxWidth:  41, fontSize: 7 },
  dep2_citizenship:  { page: 0, x: 461, y: 256, maxWidth:  32, fontSize: 7 },

  dep3_last_name:    { page: 0, x:  20, y: 238, maxWidth: 101, fontSize: 8 },
  dep3_first_name:   { page: 0, x: 123, y: 238, maxWidth: 109, fontSize: 8 },
  dep3_name_ext:     { page: 0, x: 236, y: 238, maxWidth:  27, fontSize: 7 },
  dep3_middle_name:  { page: 0, x: 267, y: 238, maxWidth: 100, fontSize: 8 },
  dep3_relationship: { page: 0, x: 371, y: 238, maxWidth:  41, fontSize: 7 },
  dep3_dob:          { page: 0, x: 416, y: 238, maxWidth:  41, fontSize: 7 },
  dep3_citizenship:  { page: 0, x: 461, y: 238, maxWidth:  32, fontSize: 7 },

  dep4_last_name:    { page: 0, x:  20, y: 220, maxWidth: 101, fontSize: 8 },
  dep4_first_name:   { page: 0, x: 123, y: 220, maxWidth: 109, fontSize: 8 },
  dep4_name_ext:     { page: 0, x: 236, y: 220, maxWidth:  27, fontSize: 7 },
  dep4_middle_name:  { page: 0, x: 267, y: 220, maxWidth: 100, fontSize: 8 },
  dep4_relationship: { page: 0, x: 371, y: 220, maxWidth:  41, fontSize: 7 },
  dep4_dob:          { page: 0, x: 416, y: 220, maxWidth:  41, fontSize: 7 },
  dep4_citizenship:  { page: 0, x: 461, y: 220, maxWidth:  32, fontSize: 7 },
};

// ── PhilHealth PMRF checkbox coordinate map ───────────────────────────────────
// Each entry: fieldId → value → {x, y} where to print "X" (pdf-lib coords, y=0 at bottom)
// x is just left of the printed label, at the checkbox square
// y = 841.5 - pdfplumber_top + small fudge to center in checkbox row
const PMRF_CHECKBOX_COORDS: Record<string, Record<string, { x: number; y: number; page?: number }>> = {
  // ── Mailing Address "Same as Above" checkbox ──
  // Rect: x0=115.87 x1=123.75 top=441.78 bot=448.96 → y = 841.5 - 448.96 - 2.31 = 390.23
  mail_same_as_above: {
    'true': { x: 116, y: 390 },
  },

  // ── Purpose (checkboxes: REGISTRATION x0=354.6, UPDATING x0=444.2; top=115.4 bot=124.5)
  // y = 841.5 - 124.45 - 2.31 = 714.74 → 715
  purpose: {
    'Registration':        { x: 355, y: 715 }, // box cx=358.3, plumb_ctr=119.9 → lib_ctr=721.6 → base=715
    'Updating/Amendment':  { x: 444, y: 715 }, // box cx=447.9, plumb_ctr=119.9 → lib_ctr=721.6 → base=715
  },

  // ── Sex (checkboxes at x≈20-28, label at x≈32) ────────────────────────────
  // Box rects measured from pdfplumber; y = 841.5 - box_center_top - 2.5 to center X in cell
  sex: {
    'Male':   { x: 22, y: 507 },  // box top=327.1–336.1, center=331.6 → y=507
    'Female': { x: 22, y: 495 },  // box top=339.9–348.9, center=344.4 → y=495
  },

  // ── Civil Status (checkboxes at x≈65-75 and x≈113-122) ───────────────────
  civil_status: {
    'Single':           { x: 67,  y: 509 }, // box top=325.0–334.1, center=329.6 → y=509
    'Married':          { x: 67,  y: 498 }, // box top=336.1–345.2, center=340.7 → y=498
    'Widow/er':         { x: 113, y: 498 }, // box top=336.2–345.3, center=340.8 → y=498
    'Annulled':         { x: 113, y: 509 }, // box top=325.0–334.1, center=329.6 → y=509
    'Legally Separated':{ x: 67,  y: 487 }, // box top=347.8–356.9, center=352.4 → y=487
  },

  // ── Citizenship (checkboxes at x≈178-186 and x≈265-273) ──────────────────
  citizenship: {
    'Filipino':         { x: 179, y: 507 }, // box top=327.1–337.4, center=332.3 → y=507
    'Dual Citizen':     { x: 179, y: 492 }, // box top=342.3–352.6, center=347.5 → y=492
    'Foreign National': { x: 266, y: 507 }, // box top=326.8–337.2, center=332.0 → y=507
  },

  // ── Member Type (Section IV) ──────────────────────────────────────────────
  // Coordinates computed from pdfplumber rect centers:
  //   y = 841.5 - box_ctr_pdfplumb - (7pt_cap_height/2=2.31) to center X in box
  member_type: {
    // Direct Contributors — left column (box x0≈22-23, cx≈27)
    'Employed Private':                         { x: 23, y: 173 }, // box ctr plumb=666.2 → lib_ctr=175.3 → base=173
    'Employed Government':                      { x: 23, y: 161 }, // box ctr plumb=678.3 → lib_ctr=163.2 → base=161
    'Professional Practitioner':                { x: 23, y: 148 }, // box ctr plumb=691.1 → lib_ctr=150.4 → base=148
    'Self-Earning Individual':                  { x: 23, y: 135 }, // box ctr plumb=704.6 → lib_ctr=136.9 → base=135
    // Middle-left column (box x0≈165-166, cx≈169)
    'Kasambahay':                               { x: 166, y: 173 }, // box ctr plumb=666.4 → lib_ctr=175.1 → base=173
    'Migrant Worker (Land-Based)':              { x: 180, y: 148 }, // box ctr plumb=690.9 → lib_ctr=150.6 → base=148
    'Migrant Worker (Sea-Based)':               { x: 258, y: 149 }, // box ctr plumb=690.4 → lib_ctr=151.1 → base=149
    'Lifetime Member':                          { x: 166, y: 136 }, // box ctr plumb=703.4 → lib_ctr=138.1 → base=136
    'Filipinos with Dual Citizenship / Living Abroad': { x: 166, y: 123 }, // box ctr plumb=715.9 → lib_ctr=125.6 → base=123
    'Foreign National':                         { x: 166, y: 110 }, // box ctr plumb=729.1 → lib_ctr=112.4 → base=110
    // Family Driver (x0≈257, cx≈261)
    'Family Driver':                            { x: 258, y: 173 }, // box ctr plumb=666.4 → lib_ctr=175.1 → base=173
  },

  // ── Indirect Contributor (Section IV, right columns) ──────────────────────
  indirect_contributor: {
    // Right area (box x0≈385, cx≈389)
    'Listahanan':                               { x: 386, y: 168 }, // box ctr plumb=671.6 → lib_ctr=169.9 → base=168
    '4Ps/MCCT':                                 { x: 386, y: 154 }, // box ctr plumb=685.7 → lib_ctr=155.8 → base=154
    'Senior Citizen':                           { x: 386, y: 140 }, // box ctr plumb=699.1 → lib_ctr=142.4 → base=140
    'PAMANA':                                   { x: 386, y: 127 }, // box ctr plumb=711.8 → lib_ctr=129.7 → base=127
    'KIA/KIPO':                                 { x: 386, y: 114 }, // box ctr plumb=725.5 → lib_ctr=116.0 → base=114
    'Bangsamoro/Normalization':                 { x: 388, y: 100 }, // box ctr plumb=739.5 → lib_ctr=102.0 → base=100
    // Rightmost column (box x0≈459, cx≈463)
    'LGU-sponsored':                            { x: 460, y: 168 }, // box ctr plumb=671.6 → lib_ctr=169.9 → base=168
    'NGA-sponsored':                            { x: 460, y: 155 }, // box ctr plumb=684.6 → lib_ctr=156.9 → base=155
    'Private-sponsored':                        { x: 460, y: 142 }, // box ctr plumb=697.0 → lib_ctr=144.5 → base=142
    'Person with Disability':                   { x: 460, y: 129 }, // box ctr plumb=710.5 → lib_ctr=131.1 → base=129
  },

  // ── Declaration of Dependents checkboxes (Section III) ────────────────────
  // Checkbox columns: No Middle Name x0=504.4, Mononym x0=531.6, Disability x0=558.6
  // Row centers (pdfplumb): row1=565.1, row2=583.15, row3=601.2, row4=616.7
  // y = 841.5 - row_ctr - 2.31
  dep1_no_middle_name: { 'true': { x: 505, y: 274 } },
  dep1_mononym:        { 'true': { x: 532, y: 274 } },
  dep1_disability:     { 'true': { x: 559, y: 274 } },
  dep2_no_middle_name: { 'true': { x: 505, y: 256 } },
  dep2_mononym:        { 'true': { x: 532, y: 256 } },
  dep2_disability:     { 'true': { x: 559, y: 256 } },
  dep3_no_middle_name: { 'true': { x: 505, y: 238 } },
  dep3_mononym:        { 'true': { x: 532, y: 238 } },
  dep3_disability:     { 'true': { x: 559, y: 238 } },
  dep4_no_middle_name: { 'true': { x: 505, y: 223 } },
  dep4_mononym:        { 'true': { x: 532, y: 223 } },
  dep4_disability:     { 'true': { x: 559, y: 223 } },
};

// ── PhilHealth Claim Form 1 calibrated coordinates ────────────────────────────
// Page: 612.0 × 936.0 pts (legal size, 1 page)
// Derived from pdfplumber extraction: pdf_lib_y = 936 - pdfplumber_bottom + offset
//
// Key layout structure (pdfplumber tops/bottoms):
//   Member PIN boxes:   top=214.5  bot=226.8  (12 boxes, right of label, x=259–421)
//   Member Name line:   top=248.1  bot=255.1  (underline, x=25–438, 4 columns)
//   Member DOB boxes:   top=243.5  bot=255.8  (8 boxes, x=458–570, same row as names)
//   Member Sex boxes:   top=283.2  bot=295.5  (2 checkboxes, x=482/518)
//   Address Row 1:      top=305.2  bot=312.2  (5-col underline, x=25–587)
//   Address Row 2:      top=335.9  bot=342.9  (5-col underline, x=25–587)
//   Contact Info:       top=380.9  bot=387.9  (3-col underline: landline/mobile/email)
//   Patient-is-member:  top=408.6  bot=420.9  (2 checkboxes Yes/No, x=139/232)
//   Patient PIN boxes:  top=445.6  bot=457.8  (12 boxes, x=271–433)
//   Patient Name line:  top=479.8  bot=486.8  (4-col underline, same x as member)
//   Patient DOB boxes:  top=476.3  bot=488.5  (8 boxes, same x as member DOB)
//   Patient Relation:   top=511.2  bot=523.5  (3 checkboxes Child/Spouse/Parent)
//   Patient Sex boxes:  top=511.7  bot=524.0  (2 checkboxes, x=482/518)
//   Employer PEN:       row at top=714–724 (fill right of label, x≈193)
//   Employer Contact:   underline top=715.4 bot=722.4 (x=458–589)
//   Business Name:      underline top=750.3 bot=757.3 (x=69–543)

const CF1_FIELD_COORDS: CoordsMap = {
  // ── Part I: Member PIN ──
  // 12 digit boxes at pdfplumber top=214.5 bot=226.8; box_height=12.3
  // y = 936 - 226.8 + (12.3 - 5.96)/2 = 712
  // boxCenters are cx of each box, sorted left→right; gap after box 2 and box 11 = PIN separators
  member_pin: {
    page: 0, x: 0, y: 712, fontSize: 9,
    boxCenters: [265.55, 277.85, 297.95, 310.25, 322.45, 334.75, 347.05, 359.35, 371.55, 383.85, 396.1, 415.5],
  },

  // ── Member Name row (underline top=248.1 bot=255.1) ──
  // y = 936 - 255.1 + 3 = 683.9 ≈ 684
  // Columns: Last x0=25.2–124.7 | First x0=135.9–235.5 | Ext x0=245.4–344.9 | Middle x0=355.8–438.2
  member_last_name:   { page: 0, x:  27, y: 684, maxWidth:  97 },
  member_first_name:  { page: 0, x: 137, y: 684, maxWidth:  97 },
  member_name_ext:    { page: 0, x: 247, y: 684, maxWidth:  97 },
  member_middle_name: { page: 0, x: 357, y: 684, maxWidth:  80 },

  // ── Member Date of Birth (8 digit boxes top=243.5 bot=255.8, same row as name) ──
  // y = 936 - 255.8 + (12.3 - 5.96)/2 = 683
  // Box groups: mm=[464.35,476.6] | dd=[496.05,508.35] | yyyy=[527.75,540.0,552.25,564.6]
  member_dob_month: { page: 0, x: 0, y: 683, fontSize: 9, boxCenters: [464.35, 476.6] },
  member_dob_day:   { page: 0, x: 0, y: 683, fontSize: 9, boxCenters: [496.05, 508.35] },
  member_dob_year:  { page: 0, x: 0, y: 683, fontSize: 9, boxCenters: [527.75, 540.0, 552.25, 564.6] },

  // ── Mailing Address Row 1 (underline top=305.2 bot=312.2) ──
  // y = 936 - 312.2 + 3 = 626.8 ≈ 627
  // Cols: Unit x0=25.2 | Bldg x0=135.9 | Lot x0=245.4 | Street x0=355.8 | Subdiv x0=450.2
  addr_unit:        { page: 0, x:  27, y: 627, maxWidth:  97 },
  addr_building:    { page: 0, x: 137, y: 627, maxWidth:  97 },
  addr_lot:         { page: 0, x: 247, y: 627, maxWidth:  97 },
  addr_street:      { page: 0, x: 357, y: 627, maxWidth:  80 },
  addr_subdivision: { page: 0, x: 452, y: 627, maxWidth: 133 },

  // ── Mailing Address Row 2 (underline top=335.9 bot=342.9) ──
  // y = 936 - 342.9 + 3 = 596.1 ≈ 596
  // Cols: Barangay x0=25.2 | City x0=135.9 | Province x0=245.4 | Country x0=355.8 | ZIP x0=450.2
  addr_barangay: { page: 0, x:  27, y: 596, maxWidth:  97 },
  addr_city:     { page: 0, x: 137, y: 596, maxWidth:  97 },
  addr_province: { page: 0, x: 247, y: 596, maxWidth:  97, fontSize: 8 },
  addr_country:  { page: 0, x: 357, y: 596, maxWidth:  80 },
  addr_zip:      { page: 0, x: 452, y: 596, maxWidth: 130 },

  // ── Contact Information (underline top=380.9 bot=387.9) ──
  // y = 936 - 387.9 + 3 = 551.1 ≈ 551
  // Cols: Landline x0=23.7–212.5 | Mobile x0=222.8–384.1 | Email x0=395.5–587.7
  contact_landline: { page: 0, x:  25, y: 551, maxWidth: 187 },
  contact_mobile:   { page: 0, x: 224, y: 551, maxWidth: 160 },
  contact_email:    { page: 0, x: 397, y: 551, maxWidth: 190 },

  // ── Part II: Patient/Dependent PIN ──
  // 12 digit boxes at pdfplumber top=445.6 bot=457.8; box_height=12.3
  // y = 936 - 457.8 + (12.3 - 5.96)/2 = 481
  // Pin groups: [2 + gap + 9 + gap + 1] matching XX-XXXXXXXXX-X format
  patient_pin: {
    page: 0, x: 0, y: 481, fontSize: 9,
    boxCenters: [277.1, 289.4, 309.45, 321.75, 334.0, 346.3, 358.55, 370.85, 383.1, 395.35, 407.65, 427.05],
  },

  // ── Patient Name row (underline top=479.8 bot=486.8) ──
  // y = 936 - 486.8 + 3 = 452.2 ≈ 452
  // Same column x-positions as member name row
  patient_last_name:   { page: 0, x:  27, y: 452, maxWidth:  97 },
  patient_first_name:  { page: 0, x: 137, y: 452, maxWidth:  97 },
  patient_name_ext:    { page: 0, x: 247, y: 452, maxWidth:  97 },
  patient_middle_name: { page: 0, x: 357, y: 452, maxWidth:  80 },

  // ── Patient Date of Birth (8 digit boxes top=476.3 bot=488.5) ──
  // y = 936 - 488.5 + (12.3 - 5.96)/2 = 451
  // Same x-positions as member DOB boxes (right-column, same physical column)
  patient_dob_month: { page: 0, x: 0, y: 451, fontSize: 9, boxCenters: [464.3, 476.6] },
  patient_dob_day:   { page: 0, x: 0, y: 451, fontSize: 9, boxCenters: [496.0, 508.35] },
  patient_dob_year:  { page: 0, x: 0, y: 451, fontSize: 9, boxCenters: [527.7, 540.0, 552.25, 564.6] },

  // ── Part IV: Employer PEN ──
  // 12 digit boxes at pdfplumber top=714.04 bot=726.32; box_h=12.28, y_lib_bot=209.68
  // y = 209.68 + (12.28 - 6.51)/2 = 209.68 + 2.89 ≈ 213
  // Groups (separated by ~8pt gaps): [2 digits] | [9 digits] | [1 digit]
  employer_pen: {
    page: 0, x: 0, y: 213, fontSize: 9,
    boxCenters: [202.73, 215.03, 235.10, 247.39, 259.64, 271.94, 284.18, 296.48, 308.73, 321.02, 333.27, 352.65],
  },

  // ── Employer Contact No. (underline top=715.4 bot=722.4; x0=458.6–589.0) ──
  // y = 936 - 722.4 + 3 = 216.6 ≈ 217
  employer_contact: { page: 0, x: 460, y: 217, maxWidth: 127 },

  // ── Employer Business Name (underline top=750.3 bot=757.3; x0=69.6–543.0) ──
  // y = 936 - 757.3 + 3 = 181.7 ≈ 182
  employer_business_name: { page: 0, x: 71, y: 182, maxWidth: 470 },
};

// ── PhilHealth ClaimForm1 checkbox coordinate map ──────────────────────────────
// Each entry: fieldId → value → {x, y} where to print "X"
const CF1_CHECKBOX_COORDS: Record<string, Record<string, { x: number; y: number; page?: number }>> = {
  // ── Member Sex (2 checkboxes; boxes top=283.2 bot=295.5, pdflibY_bottom=640.5) ──
  // y = 936 - 295.5 + (12.3 - 7)/2 = 643; Male: x0=482.8, Female: x0=518.5
  member_sex: {
    'Male':   { x: 485, y: 643 },
    'Female': { x: 521, y: 643 },
  },

  // ── Is patient the member? (2 checkboxes; boxes top=408.6 bot=420.9) ──
  // y = 936 - 420.9 + (12.3 - 7)/2 = 518; Yes: x0=139.8, No: x0=232.6
  patient_is_member: {
    'Yes — I am the Patient':     { x: 142, y: 518 },
    'No — Patient is a Dependent': { x: 235, y: 518 },
  },

  // ── Relationship to Member (3 checkboxes; boxes top=511.2 bot=523.5) ──
  // y = 936 - 523.5 + (12.3 - 7)/2 = 415; Child: x0=145.7, Parent: x0=184.6, Spouse: x0=228.4
  patient_relationship: {
    'Child':  { x: 148, y: 415 },
    'Parent': { x: 187, y: 415 },
    'Spouse': { x: 231, y: 415 },
  },

  // ── Patient Sex (2 checkboxes; boxes top=511.7 bot=524.0) ──
  // y = 936 - 524.0 + (12.3 - 7)/2 = 415; Male: x0=482.8, Female: x0=518.5
  patient_sex: {
    'Male':   { x: 485, y: 415 },
    'Female': { x: 521, y: 415 },
  },
};

// ── PhilHealth Claim Form 2 calibrated coordinates ───────────────────────────
// Page 1: 612.0 × 936.0 pts (legal size). Page 2: 612.0 × 936.0 pts.
// Derived from pdfplumber extraction: pdf_lib_y = 936 - pdfplumber_bottom + offset
//
// Key layout (pdfplumber tops/bottoms):
//   HCI PAN fill line:        underline top≈203  bot≈210  → y=729
//   HCI Name fill line:       underline top≈219  bot≈226  → y=713
//   HCI Address lines:        underline top≈236  bot≈243  → y=696
//   Patient Name row:         underline top≈300  bot≈306  → y=633
//   Referral: NO box  top=329  bot=342  | YES box same row
//   Referring HCI Name:       top≈343  → y=585
//   Date Admitted row:        underlines top≈369  bot≈376 → y=563
//   Date Discharged row:      underlines top≈385  bot≈392 → y=547
//   Patient Disposition rows: checkboxes at ~407-456
//   Accommodation checkboxes: top≈407
//   Admission Diagnosis 1:    underline top≈482  bot≈497 → y=442
//   Admission Diagnosis 2:    underline top≈500  bot≈515 → y=424
//   Discharge Diag rows:      top≈540  each row ~13.5pt
//   Special considerations checkboxes: ~664-860
//   PhilHealth Benefits row:  underline top≈886  bot≈893 → y=46
//
// Page 2:
//   HCP rows:   each row is 15pt tall, first row top≈47
//   Cert section lines: top≈328, ~343, ~363, ~378, etc.

const CF2_FIELD_COORDS: CoordsMap = {
  // ── Part I: HCI Information ──
  // PAN fill line: underline top=202.9 bot=210.0 → y=936-210+3=729
  hci_pan:          { page: 0, x: 310, y: 729, maxWidth: 280 },
  // HCI Name fill line: underline top=219.4 bot=226.4 → y=936-226.4+3=712.6≈713
  hci_name:         { page: 0, x:  34, y: 713, maxWidth: 570 },
  // Address: "Building Number and Street" section, underline top=240.5 bot=247.5
  // Cols: bldg_street x0≈127, city/mun x0≈338, province x0≈503
  // y = 936-247.5+3=691.5≈692
  hci_bldg_street:  { page: 0, x: 128, y: 692, maxWidth: 208 },
  hci_city:         { page: 0, x: 338, y: 692, maxWidth: 162 },
  hci_province:     { page: 0, x: 504, y: 692, maxWidth: 100, fontSize: 8 },

  // ── Part II: Patient Name ──
  // Name row underline top=300.5 bot=306.7 → y=636-306.7+3=632≈633
  // 4 columns: Last x0≈163, First x0≈288, Ext x0≈390, Middle x0≈509
  patient_last_name:   { page: 0, x: 164, y: 633, maxWidth: 122 },
  patient_first_name:  { page: 0, x: 290, y: 633, maxWidth:  97 },
  patient_name_ext:    { page: 0, x: 391, y: 633, maxWidth: 115 },
  patient_middle_name: { page: 0, x: 510, y: 633, maxWidth:  82 },

  // ── Referring HCI (visible when YES) ──
  // Referring HCI Name underline top=350.6 bot=356.7 → y=936-356.7+3=582≈582
  // "Building Number and Street" + City/Mun + Province + Zip on same line
  referring_hci_name:       { page: 0, x: 122, y: 582, maxWidth: 145 },
  referring_hci_bldg_street:{ page: 0, x: 271, y: 582, maxWidth:  98 },
  referring_hci_city:       { page: 0, x: 400, y: 582, maxWidth:  90 },
  referring_hci_province:   { page: 0, x: 492, y: 582, maxWidth:  72, fontSize: 8 },
  referring_hci_zip:        { page: 0, x: 566, y: 582, maxWidth:  28 },

  // ── Confinement Period: Date Admitted ──
  // Underlines: month/day/year at top≈369 bot≈377 → y=936-377+3=562
  // hour/min at top≈370 bot≈377
  // month label x0≈200, day x0≈236, year x0≈280 (from words map)
  // AM/PM checkboxes at x≈490 and x≈531
  date_admitted_month: { page: 0, x: 200, y: 562, maxWidth: 34 },
  date_admitted_day:   { page: 0, x: 236, y: 562, maxWidth: 34 },
  date_admitted_year:  { page: 0, x: 272, y: 562, maxWidth: 50 },
  time_admitted_hour:  { page: 0, x: 394, y: 562, maxWidth: 30 },
  time_admitted_min:   { page: 0, x: 427, y: 562, maxWidth: 30 },

  // ── Confinement Period: Date Discharged ──
  // Underlines: top≈385 bot≈393 → y=936-393+3=546
  date_discharged_month: { page: 0, x: 200, y: 546, maxWidth: 34 },
  date_discharged_day:   { page: 0, x: 236, y: 546, maxWidth: 34 },
  date_discharged_year:  { page: 0, x: 272, y: 546, maxWidth: 50 },
  time_discharged_hour:  { page: 0, x: 394, y: 546, maxWidth: 30 },
  time_discharged_min:   { page: 0, x: 427, y: 546, maxWidth: 30 },

  // ── Expired date/time ──
  // Date/time Expired underlines top≈413 bot≈420 → y=936-420+3=519
  // month x≈261, day x≈297, year x≈341
  expired_month: { page: 0, x: 261, y: 513, maxWidth: 34 },
  expired_day:   { page: 0, x: 297, y: 513, maxWidth: 34 },
  expired_year:  { page: 0, x: 333, y: 513, maxWidth: 48 },
  expired_hour:  { page: 0, x: 425, y: 513, maxWidth: 30 },
  expired_min:   { page: 0, x: 459, y: 513, maxWidth: 30 },

  // ── Transferred/Referred HCI ──
  // Name of Referral HCI underline top≈434 bot≈441 → y=936-441+3=498
  // Bldg/Street + City + Province + Zip on line top≈451 bot≈458 → y=936-458+3=481
  transferred_hci_name:       { page: 0, x: 370, y: 498, maxWidth: 224 },
  transferred_hci_bldg_street:{ page: 0, x: 279, y: 481, maxWidth:  98 },
  transferred_hci_city:       { page: 0, x: 400, y: 481, maxWidth:  88 },
  transferred_hci_province:   { page: 0, x: 490, y: 481, maxWidth:  67, fontSize: 8 },
  transferred_hci_zip:        { page: 0, x: 558, y: 481, maxWidth:  36 },

  // Reason for referral: underline top≈461 bot≈467 → y=936-467+3=472
  reason_for_referral: { page: 0, x: 308, y: 464, maxWidth: 286 },

  // ── Admission Diagnoses ──
  // 2 underlines in section, top≈495 and top≈511 → y≈443 and y≈428
  admission_diagnosis_1: { page: 0, x:  34, y: 442, maxWidth: 570 },
  admission_diagnosis_2: { page: 0, x:  34, y: 427, maxWidth: 570 },

  // ── Discharge Diagnoses rows (6 rows starting at top≈540, each ~13.5pt) ──
  // Row 1 top=540.4, bottom of row line: use top+4 for text start
  // Cols: Diagnosis x0≈54 w≈75 | ICD-10 x0≈131 w≈67 | Procedure x0≈199 w≈130
  //       RVS x0≈341 w≈55 | Date x0≈400 w≈75 | Laterality checkboxes x0≈480-590
  // y formula: 936 - row_top_pdfplumb - 4 (text baseline above label line)
  // Row i   top≈550 → y≈382;  Row ii  top≈563.8 → y≈369
  // Row iii top≈577  → y≈355;  Row iv  top≈590.8 → y≈341
  // (These are the fill rows, labels are in header row at top≈540)
  discharge_diagnosis_1:        { page: 0, x:  55, y: 382, maxWidth:  74, fontSize: 8 },
  discharge_icd10_1:            { page: 0, x: 132, y: 382, maxWidth:  65, fontSize: 8 },
  discharge_procedure_1:        { page: 0, x: 200, y: 382, maxWidth: 139, fontSize: 8 },
  discharge_rvs_1:              { page: 0, x: 341, y: 382, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_1:   { page: 0, x: 399, y: 382, maxWidth:  78, fontSize: 7 },

  discharge_diagnosis_2:        { page: 0, x:  55, y: 368, maxWidth:  74, fontSize: 8 },
  discharge_icd10_2:            { page: 0, x: 132, y: 368, maxWidth:  65, fontSize: 8 },
  discharge_procedure_2:        { page: 0, x: 200, y: 368, maxWidth: 139, fontSize: 8 },
  discharge_rvs_2:              { page: 0, x: 341, y: 368, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_2:   { page: 0, x: 399, y: 368, maxWidth:  78, fontSize: 7 },

  discharge_diagnosis_3:        { page: 0, x:  55, y: 354, maxWidth:  74, fontSize: 8 },
  discharge_icd10_3:            { page: 0, x: 132, y: 354, maxWidth:  65, fontSize: 8 },
  discharge_procedure_3:        { page: 0, x: 200, y: 354, maxWidth: 139, fontSize: 8 },
  discharge_rvs_3:              { page: 0, x: 341, y: 354, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_3:   { page: 0, x: 399, y: 354, maxWidth:  78, fontSize: 7 },

  discharge_diagnosis_4:        { page: 0, x:  55, y: 340, maxWidth:  74, fontSize: 8 },
  discharge_icd10_4:            { page: 0, x: 132, y: 340, maxWidth:  65, fontSize: 8 },
  discharge_procedure_4:        { page: 0, x: 200, y: 340, maxWidth: 139, fontSize: 8 },
  discharge_rvs_4:              { page: 0, x: 341, y: 340, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_4:   { page: 0, x: 399, y: 340, maxWidth:  78, fontSize: 7 },

  discharge_diagnosis_5:        { page: 0, x:  55, y: 327, maxWidth:  74, fontSize: 8 },
  discharge_icd10_5:            { page: 0, x: 132, y: 327, maxWidth:  65, fontSize: 8 },
  discharge_procedure_5:        { page: 0, x: 200, y: 327, maxWidth: 139, fontSize: 8 },
  discharge_rvs_5:              { page: 0, x: 341, y: 327, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_5:   { page: 0, x: 399, y: 327, maxWidth:  78, fontSize: 7 },

  discharge_diagnosis_6:        { page: 0, x:  55, y: 313, maxWidth:  74, fontSize: 8 },
  discharge_icd10_6:            { page: 0, x: 132, y: 313, maxWidth:  65, fontSize: 8 },
  discharge_procedure_6:        { page: 0, x: 200, y: 313, maxWidth: 139, fontSize: 8 },
  discharge_rvs_6:              { page: 0, x: 341, y: 313, maxWidth:  57, fontSize: 8 },
  discharge_procedure_date_6:   { page: 0, x: 399, y: 313, maxWidth:  78, fontSize: 7 },

  // ── Z-Benefit Package Code ──
  // top≈728 bot≈736 → y≈936-736+3=203
  zbenefit_package_code: { page: 0, x: 285, y: 196, maxWidth: 120, fontSize: 8 },

  // ── MCP Dates ──
  // Section below "MCP Package" label at top≈742, fill area spans to bottom ~775
  // y=936-770+3=169 (wide single line below 4 prenatal entries area)
  mcp_dates: { page: 0, x: 100, y: 167, maxWidth: 490, fontSize: 8 },

  // ── TB DOTS ──
  // Intensive Phase checkbox area top≈772 → text right of checkbox
  tbdots_intensive_phase:   { page: 0, x: 200, y: 153, maxWidth: 110, fontSize: 8 },
  tbdots_maintenance_phase: { page: 0, x: 310, y: 153, maxWidth: 180, fontSize: 8 },

  // ── Animal Bite ──
  // Day ARV rows: top≈803 → y≈936-812+3=127
  // Row: Day1 x≈41, Day2 x≈150, Day3 x≈271, RIG x≈375, Others x≈470
  animal_bite_arv_day1: { page: 0, x:  63, y: 121, maxWidth:  83, fontSize: 7 },
  animal_bite_arv_day2: { page: 0, x: 172, y: 121, maxWidth:  96, fontSize: 7 },
  animal_bite_arv_day3: { page: 0, x: 293, y: 121, maxWidth:  80, fontSize: 7 },
  animal_bite_rig:      { page: 0, x: 376, y: 121, maxWidth:  92, fontSize: 7 },
  animal_bite_others:   { page: 0, x: 495, y: 121, maxWidth: 100, fontSize: 7 },

  // ── HIV Lab Number ──
  // top≈877 → y≈936-885+3=54
  hiv_lab_number: { page: 0, x: 286, y: 52, maxWidth: 300, fontSize: 8 },

  // ── PhilHealth Benefits ──
  // First Case Rate and Second Case Rate underlines at bottom of page
  // top≈907 → y≈936-915+3=24 (right section)
  philhealth_benefit_first_case_rate:  { page: 0, x: 122, y: 22, maxWidth: 238, fontSize: 8 },
  philhealth_benefit_second_case_rate: { page: 0, x: 366, y: 22, maxWidth: 228, fontSize: 8 },
  philhealth_benefit_icd_rvs_code:     { page: 0, x:  87, y: 16, maxWidth: 170, fontSize: 8 },

  // ── Page 2: HCP Accreditation rows ──
  // 3 HCP blocks. Each block: accred no, date signed (month/day/year), co-pay
  // Block 1: accred no. row top≈67 bot≈73 → y=936-73+3=866
  //   Date signed row top≈113 bot≈121 → y=936-121+3=818
  // Block 2: accred no top≈134 bot≈142 → y=797; date top≈175 bot≈183 → y=756
  // Block 3: accred no top≈196 bot≈204 → y=735; date top≈237 bot≈244 → y=695
  hcp1_accreditation_no:    { page: 1, x: 107, y: 866, maxWidth: 380 },
  hcp1_date_signed_month:   { page: 1, x: 128, y: 817, maxWidth:  34 },
  hcp1_date_signed_day:     { page: 1, x: 164, y: 817, maxWidth:  34 },
  hcp1_date_signed_year:    { page: 1, x: 208, y: 817, maxWidth:  50 },

  hcp2_accreditation_no:    { page: 1, x: 107, y: 797, maxWidth: 380 },
  hcp2_date_signed_month:   { page: 1, x: 128, y: 751, maxWidth:  34 },
  hcp2_date_signed_day:     { page: 1, x: 164, y: 751, maxWidth:  34 },
  hcp2_date_signed_year:    { page: 1, x: 208, y: 751, maxWidth:  50 },

  hcp3_accreditation_no:    { page: 1, x: 107, y: 732, maxWidth: 380 },
  hcp3_date_signed_month:   { page: 1, x: 128, y: 689, maxWidth:  34 },
  hcp3_date_signed_day:     { page: 1, x: 164, y: 689, maxWidth:  34 },
  hcp3_date_signed_year:    { page: 1, x: 208, y: 689, maxWidth:  50 },

  // ── Page 2: Certification of Benefits — amounts ──
  // "Total HCI Fees" row top≈348 bot≈356 → y=936-356+3=583
  // "Total Prof Fees" top≈363 → y=936-371+3=568
  // "Grand Total"     top≈378 → y=936-386+3=553
  // Total Actual Charges (after discount) right col top≈333 → y=936-341+3=598
  // Discount amount right col same row (under "Amount after Application of Discount")
  // PhilHealth Benefit Amount right col top≈446 → y=936-456+3=483
  // Amount after PhilHealth right col top≈474 → y=936-484+3=455
  total_hci_fees:          { page: 1, x:  62, y: 580, maxWidth: 135 },
  total_professional_fees: { page: 1, x:  62, y: 565, maxWidth: 135 },
  grand_total:             { page: 1, x:  62, y: 550, maxWidth: 135 },
  total_actual_charges:    { page: 1, x: 415, y: 595, maxWidth: 180 },
  discount_amount:         { page: 1, x: 222, y: 467, maxWidth: 105 },
  philhealth_benefit_amount: { page: 1, x: 341, y: 480, maxWidth: 180 },
  amount_after_philhealth:   { page: 1, x: 426, y: 452, maxWidth: 170 },

  // HCI Amount Paid top≈474 → same row right col
  hci_amount_paid_by: { page: 1, x: 426, y: 490, maxWidth: 170 },
  // PF Amount Paid row top≈522 → y=936-531+3=408
  pf_amount_paid_by:  { page: 1, x: 426, y: 438, maxWidth: 170 },

  // Drug purchase amount top≈590 → y=936-600+3=339
  drug_purchase_total_amount:       { page: 1, x: 437, y: 338, maxWidth: 160 },
  // Diagnostic purchase amount top≈615 → y=936-625+3=314
  diagnostic_purchase_total_amount: { page: 1, x: 437, y: 313, maxWidth: 160 },
};

// ── PhilHealth Claim Form 2 checkbox coordinate map ──────────────────────────
const CF2_CHECKBOX_COORDS: Record<string, Record<string, { x: number; y: number; page?: number }>> = {
  // ── Was patient referred? ──
  // NO box: small rect x0=32.5, top=329.4 bot=341.7 → y=936-341.7+(12.3-7)/2=596.9≈597
  // YES box: x0=70.3, same row
  referred_by_hci: {
    'NO':  { x: 35, y: 597 },
    'YES': { x: 73, y: 597 },
  },

  // ── Time Admitted AM/PM ──
  // AM box: small rect x0=471.1 top=360.4 bot=372.6 → y=936-372.6+(12.3-7)/2=566
  // PM box: x0=513.2, same row
  time_admitted_ampm: {
    'AM': { x: 474, y: 566 },
    'PM': { x: 516, y: 566 },
  },

  // ── Time Discharged AM/PM ──
  // same x positions, row top=375.5 bot=387.8 → y=936-387.8+(12.3-7)/2=551
  time_discharged_ampm: {
    'AM': { x: 474, y: 551 },
    'PM': { x: 516, y: 551 },
  },

  // ── Patient Disposition ──
  // Improved:    x0=32.5 top=407.4 bot=419.7 → y=936-419.7+(12.3-7)/2=519
  // Recovered:   x0=32.5 top=422.5 → y=504
  // Expired:     x0=190.5 top=407.4 → y=519  (2nd column)
  // Transferred: x0=190.5 top=422.5 → y=504
  // Home/DAMA:   x0=32.5 top=437.5 → y=489 (same x0, 3rd row)
  // Absconded:   x0=32.5 top=452.6 → y=474
  patient_disposition: {
    'Improved':                               { x: 35, y: 519 },
    'Recovered':                              { x: 35, y: 504 },
    'Expired':                                { x: 193, y: 519 },
    'Transferred/Referred':                   { x: 193, y: 504 },
    'Home/Discharged Against Medical Advise': { x: 35, y: 489 },
    'Absconded':                              { x: 35, y: 474 },
  },

  // ── Expired AM/PM ──
  // AM: x0=493.6 top=407.5 → y=519; PM: x0=525.3
  expired_ampm: {
    'AM': { x: 497, y: 519 },
    'PM': { x: 528, y: 519 },
  },

  // ── Accommodation ──
  // Private: small rect top=407.4... but accommodation checkboxes are at top≈472
  // x0=144.0 top=468.0 bot=480.3 → y=936-480.3+(12.3-7)/2=458.4≈458
  // Non-Private: x0=198.5, same row
  accommodation_type: {
    'Private':                  { x: 147, y: 458 },
    'Non-Private (Charity/Service)': { x: 201, y: 458 },
  },

  // ── Discharge Laterality rows (left/right/both checkboxes) ──
  // Row i   top≈550.2 bot≈562.5 → y=936-562.5+(12.3-7)/2=376.2≈376
  // Row ii  top≈563.8 bot≈576.0 → y=962.7≈363
  // Row iii top≈577.2 bot≈589.5 → y=349
  // Row iv  top≈590.8 bot≈603.0 → y=335.7≈336
  // Row v   top≈604.2 bot≈616.5 → y=322.2≈322
  // Row vi  top≈617.6 bot≈629.9 → y=308.8≈309
  // left cx=479.47  right cx=515.05  both cx=554.18
  discharge_laterality_1: {
    'left':  { x: 476, y: 376 }, 'right': { x: 512, y: 376 }, 'both': { x: 551, y: 376 },
  },
  discharge_laterality_2: {
    'left':  { x: 476, y: 362 }, 'right': { x: 512, y: 362 }, 'both': { x: 551, y: 362 },
  },
  discharge_laterality_3: {
    'left':  { x: 476, y: 349 }, 'right': { x: 512, y: 349 }, 'both': { x: 551, y: 349 },
  },
  discharge_laterality_4: {
    'left':  { x: 476, y: 335 }, 'right': { x: 512, y: 335 }, 'both': { x: 551, y: 335 },
  },
  discharge_laterality_5: {
    'left':  { x: 476, y: 322 }, 'right': { x: 512, y: 322 }, 'both': { x: 551, y: 322 },
  },
  discharge_laterality_6: {
    'left':  { x: 476, y: 308 }, 'right': { x: 512, y: 308 }, 'both': { x: 551, y: 308 },
  },

  // ── Special considerations checkboxes (left col x0≈41.8, right col x0≈317.9) ──
  // Rows (pdfplumb top → bot):
  // Hemodialysis:        top≈664.2  bot≈676.5 → y=936-676.5+(12.3-7)/2=262
  // Peritoneal Dialysis: top≈679.3  bot≈691.6 → y=247
  // Radiotherapy LINAC:  top≈694.4  bot≈706.7 → y=232
  // Radiotherapy COBALT: top≈709.6  bot≈721.8 → y=217
  // Blood Transfusion:   right col same rows as hemodialysis x≈317.9
  // Brachytherapy:       right col same row as peritoneal
  // Chemotherapy:        right col same row as radiotherapy LINAC
  // Simple Debridement:  right col same row as radiotherapy COBALT
  special_hemodialysis: {
    'Yes': { x: 45, y: 262 },
  },
  special_peritoneal_dialysis: {
    'Yes': { x: 45, y: 247 },
  },
  special_radiotherapy_linac: {
    'Yes': { x: 45, y: 232 },
  },
  special_radiotherapy_cobalt: {
    'Yes': { x: 45, y: 217 },
  },
  special_blood_transfusion: {
    'Yes': { x: 321, y: 262 },
  },
  special_brachytherapy: {
    'Yes': { x: 321, y: 247 },
  },
  special_chemotherapy: {
    'Yes': { x: 321, y: 232 },
  },
  special_simple_debridement: {
    'Yes': { x: 321, y: 217 },
  },

  // ── Newborn Care checkboxes ──
  // Essential Newborn Care: x0=130.1 top=769.3 bot=781.6 → y=936-781.6+(12.3-7)/2=157
  // Newborn Hearing Screening: x0=225.5, same row
  newborn_essential_care: {
    'Yes': { x: 133, y: 157 },
  },
  newborn_hearing_screening: {
    'Yes': { x: 228, y: 157 },
  },

  // ── Newborn Screening Test ──
  // Newborn Screening Test checkbox: top≈814 → y≈936-826+3=113
  // x0=149.4 top=814.0 bot=826.2 → y=936-826.2+(12.3-7)/2=112.4≈112
  newborn_screening_test: {
    'Yes': { x: 152, y: 112 },
  },

  // ── Animal Bite — ARV/RIG checkboxes ──
  // top≈844.7 bot≈857.0 → y=936-857+(12.3-7)/2=82
  // cx positions: 47.90, 168.94, 270.54, 382.78, 477.46
  // These are the "Day" checkboxes; we render check next to each day's date text

  // ── HCP Co-pay (page 2) ──
  // Block 1: No co-pay x0=332.5 top=82.9 bot=95.2 → y=936-95.2+(12.3-7)/2=843.4≈843
  //          With co-pay x0=332.5 top=97.3 → y=936-109.6+(12.3-7)/2=829
  hcp1_copay: {
    'No co-pay on top of PhilHealth Benefit':   { page: 1, x: 336, y: 843 },
    'With co-pay on top of PhilHealth Benefit': { page: 1, x: 336, y: 829 },
  },
  // Block 2: top=145.6 → y=792.9≈793; top=160.0 → y=778
  hcp2_copay: {
    'No co-pay on top of PhilHealth Benefit':   { page: 1, x: 336, y: 793 },
    'With co-pay on top of PhilHealth Benefit': { page: 1, x: 336, y: 778 },
  },
  // Block 3: top=207.1 → y=730.5≈731; top=221.5 → y=717
  hcp3_copay: {
    'No co-pay on top of PhilHealth Benefit':   { page: 1, x: 336, y: 731 },
    'With co-pay on top of PhilHealth Benefit': { page: 1, x: 336, y: 717 },
  },

  // ── Certification: "benefit is enough to cover" (page 2 top≈308) ──
  // x0=34.2 top=308.1 bot=320.4 → y=936-320.4+(12.3-7)/2=618.3≈618
  // This is for "PhilHealth benefit is enough" vs "not completely consumed"
  // Not a user-facing checkbox but mapping here for completeness
  // (We skip rendering as these are HCI-certified fields)

  // ── HCI/PF paid by checkboxes ──
  // Page 2: hci_paid_member_patient: x0=424 top=494.1 → y=936-506.4+(12.3-7)/2=432.2≈432
  //         hci_paid_hmo: x0=498.5, same row
  //         hci_paid_others: x0=424 top=504.7 → y=936-517+(12.3-7)/2=421.7≈422
  hci_paid_member_patient: {
    'Yes': { page: 1, x: 427, y: 432 },
  },
  hci_paid_hmo: {
    'Yes': { page: 1, x: 501, y: 432 },
  },
  hci_paid_others: {
    'Yes': { page: 1, x: 427, y: 422 },
  },
  // PF paid by: x0=424 top=541.6 → y=936-553.9+(12.3-7)/2=384.7≈385
  //             x0=498.5 same row; x0=424 top=552.2 → y=936-564.5+(12.3-7)/2=374.1≈374
  pf_paid_member_patient: {
    'Yes': { page: 1, x: 427, y: 385 },
  },
  pf_paid_hmo: {
    'Yes': { page: 1, x: 501, y: 385 },
  },
  pf_paid_others: {
    'Yes': { page: 1, x: 427, y: 374 },
  },

  // ── Drug purchase "None" checkbox ──
  // x0=359.9 top=589.1 bot=601.4 → y=936-601.4+(12.3-7)/2=337.2≈337
  drug_purchase_none: {
    'Yes — None': { page: 1, x: 363, y: 337 },
  },
  // Diagnostic "None" checkbox x0=419.8, same row top=589.1
  diagnostic_purchase_none: {
    'Yes — None': { page: 1, x: 422, y: 337 },
  },
};

// ── Per-form PDF config registry ─────────────────────────────────────────────

// ── PhilHealth PMRF Foreign National calibrated coordinates ──────────────────
// Page: 595.3 × 841.9 pts (A4, 1 page). Simple underline-based layout, no digit
// boxes. Sex is the only checkbox (2 rects at x0=82.4 and x0=150.1, top=342.2,
// w=h=14.8). DOB is three separate underline fields (no per-char boxes).
// All text y = page_height - pdfplumber_top - 2 (baseline sits above underline).
const PMRF_FN_PAGE_H = 841.9;
const PMRF_FN_FIELD_COORDS: CoordsMap = {
  // Row top=218.4 — PhilHealth Number
  philhealth_number: { page: 0, x: 123, y: PMRF_FN_PAGE_H - 218.4 - 2, maxWidth: 180 },
  // Row top=243.9 — ACR I-card
  acr_icard_number:  { page: 0, x: 122, y: PMRF_FN_PAGE_H - 243.9 - 2, maxWidth: 176 },
  // Row top=269.4 — PRA SRRV
  pra_srrv_number:   { page: 0, x: 120, y: PMRF_FN_PAGE_H - 269.4 - 2, maxWidth: 180 },
  // Names row top=297.9 — three columns split by label positions (116, 307, 462)
  last_name:         { page: 0, x:  42, y: PMRF_FN_PAGE_H - 297.9 - 2, maxWidth: 190 },
  first_name:        { page: 0, x: 245, y: PMRF_FN_PAGE_H - 297.9 - 2, maxWidth: 165 },
  middle_name:       { page: 0, x: 424, y: PMRF_FN_PAGE_H - 297.9 - 2, maxWidth: 127 },
  // Nationality top=346.7, underline x0=395.9
  nationality:       { page: 0, x: 397, y: PMRF_FN_PAGE_H - 346.7 - 2, maxWidth: 156 },
  // DOB row top=367.7 — three columns
  dob_month:         { page: 0, x: 140, y: PMRF_FN_PAGE_H - 367.7 - 2, maxWidth:  55, fontSize: 10 },
  dob_day:           { page: 0, x: 220, y: PMRF_FN_PAGE_H - 367.7 - 2, maxWidth:  40, fontSize: 10 },
  dob_year:          { page: 0, x: 275, y: PMRF_FN_PAGE_H - 367.7 - 2, maxWidth:  65, fontSize: 10 },
  // Civil Status top=367.7, underline x0=395.6
  civil_status:      { page: 0, x: 397, y: PMRF_FN_PAGE_H - 367.7 - 2, maxWidth: 156 },
  // Philippine Address — two underline rows
  philippine_address_line1: { page: 0, x: 132, y: PMRF_FN_PAGE_H - 400.7 - 2, maxWidth: 420 },
  philippine_address_line2: { page: 0, x: 132, y: PMRF_FN_PAGE_H - 417.2 - 2, maxWidth: 420 },
  // Contact / Email row top=436.7
  contact_phone:     { page: 0, x: 132, y: PMRF_FN_PAGE_H - 436.7 - 2, maxWidth: 205 },
  email:             { page: 0, x: 408, y: PMRF_FN_PAGE_H - 436.7 - 2, maxWidth: 145 },
  // Dependent rows at top=555.9, 576.9, 597.9 — 7 columns (from underline x-splits)
  // Col x0 values: last=47.6, first=131.0, middle=221.0, sex=311.0, rel=346.7, dob=423.1, nat=490.9
  dep1_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 73, fontSize: 8 },
  dep1_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 78, fontSize: 8 },
  dep1_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 78, fontSize: 8 },
  dep1_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 24, fontSize: 8 },
  dep1_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 63, fontSize: 8 },
  dep1_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 54, fontSize: 8 },
  dep1_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 555.9 - 2, maxWidth: 58, fontSize: 8 },
  dep2_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 73, fontSize: 8 },
  dep2_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 78, fontSize: 8 },
  dep2_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 78, fontSize: 8 },
  dep2_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 24, fontSize: 8 },
  dep2_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 63, fontSize: 8 },
  dep2_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 54, fontSize: 8 },
  dep2_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 576.9 - 2, maxWidth: 58, fontSize: 8 },
  dep3_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 73, fontSize: 8 },
  dep3_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 78, fontSize: 8 },
  dep3_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 78, fontSize: 8 },
  dep3_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 24, fontSize: 8 },
  dep3_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 63, fontSize: 8 },
  dep3_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 54, fontSize: 8 },
  dep3_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 597.9 - 2, maxWidth: 58, fontSize: 8 },
  // Signature row top=743.4
  signature_printed_name: { page: 0, x:  42, y: PMRF_FN_PAGE_H - 743.4 - 2, maxWidth: 215 },
  signature_date:         { page: 0, x: 270, y: PMRF_FN_PAGE_H - 743.4 - 2, maxWidth: 102 },
};
// Sex checkbox rects:
//   Male  : x0=82.4,  top=342.2, x1=97.2,  bottom=357.0 → center y_lib = 841.9-349.6-2.31 = 489.99
//   Female: x0=150.1, top=342.2, x1=164.9, bottom=357.0 → same y
const PMRF_FN_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  sex: {
    'Male':   { x: 83.5, y: 490 },
    'Female': { x: 151, y: 490 },
  },
};

// ── PhilHealth Claim Signature Form (CSF_2018) — calibrated coords ──────────
// Page: 612 × 936 pts (Legal, 1 page). Box rows have h=12.3, fontSize 9 → offset
// +(12.3-6.51)/2 = 2.895. Formula: y_box = 936 - row_top - 12.3 + 2.895
// Checkbox (ZapfDingbats ✓) y = 936 - (row_top + 12.3) + 5
const CSF_PAGE_H = 936.0;
const csfBoxY = (rowTop: number) => CSF_PAGE_H - rowTop - 12.3 + 2.895;
const csfCheckY = (rowTop: number) => CSF_PAGE_H - rowTop - 12.3 + 5;

const CSF_FIELD_COORDS: CoordsMap = {
  // Series # boxes at top=101, h=11.8
  series_no: {
    page: 0, y: 936 - 101 - 11.8 + (11.8 - 6.51) / 2, x: 0, fontSize: 9,
    boxCenters: [438.8, 450.7, 462.5, 474.3, 486.2, 498.0, 510.0, 521.9, 533.7, 545.7, 557.5, 569.4, 581.4],
  },
  // ── Step 1: Member ──
  member_pin: {
    page: 0, y: csfBoxY(163), x: 0, fontSize: 9,
    boxCenters: [265.6, 277.9, 297.9, 310.2, 322.5, 334.8, 347.0, 359.3, 371.6, 383.9, 396.1, 415.5],
  },
  // Name underlines at top=196, y = 936 - 196 - 2 = 738
  member_last_name:   { page: 0, x:  28, y: 738, maxWidth:  95, fontSize: 9 },
  member_first_name:  { page: 0, x: 139, y: 738, maxWidth:  95, fontSize: 9 },
  member_ext_name:    { page: 0, x: 248, y: 738, maxWidth:  95, fontSize: 9 },
  member_middle_name: { page: 0, x: 358, y: 738, maxWidth:  78, fontSize: 9 },
  member_dob_month: { page: 0, y: csfBoxY(194), x: 0, fontSize: 9, boxCenters: [464.3, 476.6] },
  member_dob_day:   { page: 0, y: csfBoxY(194), x: 0, fontSize: 9, boxCenters: [496.0, 508.3] },
  member_dob_year:  { page: 0, y: csfBoxY(194), x: 0, fontSize: 9, boxCenters: [527.7, 540.0, 552.3, 564.6] },
  // ── Step 2: Patient ──
  dependent_pin: {
    page: 0, y: csfBoxY(229), x: 0, fontSize: 9,
    boxCenters: [276.9, 289.2, 309.3, 321.6, 333.8, 346.1, 358.4, 370.7, 382.9, 395.2, 407.5, 426.8],
  },
  // Patient name underlines at top=261, y = 936 - 261 - 2 = 673
  patient_last_name:   { page: 0, x:  28, y: 673, maxWidth:  95, fontSize: 9 },
  patient_first_name:  { page: 0, x: 139, y: 673, maxWidth:  95, fontSize: 9 },
  patient_ext_name:    { page: 0, x: 248, y: 673, maxWidth:  95, fontSize: 9 },
  patient_middle_name: { page: 0, x: 358, y: 673, maxWidth:  78, fontSize: 9 },
  date_admitted_month:   { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [ 95.7, 108.0] },
  date_admitted_day:     { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [127.4, 139.7] },
  date_admitted_year:    { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [159.0, 171.4, 183.6, 196.0] },
  date_discharged_month: { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [299.4, 311.7] },
  date_discharged_day:   { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [331.1, 343.4] },
  date_discharged_year:  { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [362.8, 375.1, 387.4, 399.7] },
  patient_dob_month:     { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [464.3, 476.6] },
  patient_dob_day:       { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [496.0, 508.3] },
  patient_dob_year:      { page: 0, y: csfBoxY(307), x: 0, fontSize: 9, boxCenters: [527.7, 540.0, 552.3, 564.6] },
  // ── Step 3: Employer ──
  employer_pen: {
    page: 0, y: csfBoxY(483), x: 0, fontSize: 9,
    boxCenters: [200.6, 212.8, 232.9, 245.2, 257.5, 269.8, 282.0, 294.3, 306.5, 318.8, 331.1, 350.5],
  },
  employer_contact_no: { page: 0, x: 460, y: 449, maxWidth: 127, fontSize: 9 },
  business_name:       { page: 0, x: 125, y: 434, maxWidth: 460, fontSize: 9 },
  employer_date_signed_month: { page: 0, y: csfBoxY(573), x: 0, fontSize: 9, boxCenters: [473.7, 486.0] },
  employer_date_signed_day:   { page: 0, y: csfBoxY(573), x: 0, fontSize: 9, boxCenters: [505.4, 517.7] },
  employer_date_signed_year:  { page: 0, y: csfBoxY(573), x: 0, fontSize: 9, boxCenters: [537.0, 549.4, 561.6, 574.0] },
  // ── Step 4: Consent Date Signed ──
  consent_date_signed_month: { page: 0, y: csfBoxY(655), x: 0, fontSize: 9, boxCenters: [406.0, 418.3] },
  consent_date_signed_day:   { page: 0, y: csfBoxY(655), x: 0, fontSize: 9, boxCenters: [437.7, 450.0] },
  consent_date_signed_year:  { page: 0, y: csfBoxY(655), x: 0, fontSize: 9, boxCenters: [469.4, 481.7, 494.0, 506.3] },
};

// Relationship row top=258; cx [454.3, 496.2, 541.4] = [child, parent, spouse]
const CSF_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  relationship_to_member: {
    'Child':  { x: 450.5, y: csfCheckY(258) },
    'Parent': { x: 492.3, y: csfCheckY(258) },
    'Spouse': { x: 537.5, y: csfCheckY(258) },
    // 'Self' → no checkbox (member IS the patient)
  },
};

const CSF_SKIP_VALUES: Record<string, string[]> = {
  member_ext_name: ['', 'N/A'],
  patient_ext_name: ['', 'N/A'],
  series_no: [''],
  dependent_pin: [''],
  employer_pen: [''],
  employer_contact_no: [''],
  business_name: [''],
  employer_date_signed_month: [''],
  employer_date_signed_day: [''],
  employer_date_signed_year: [''],
  relationship_to_member: ['Self'],
};

// ── Pag-IBIG PFF-049 (MCIF) — calibrated coords (612×936, 1-page overlay) ───
// pdfplumber top→PDF y: y = 936 - top. Text baseline typically sits ~2pt above
// the printed underline, so value y ≈ 936 - (label_top + ~14).
const PFF049_PAGE_H = 936.0;
const pff049Y = (rowTop: number) => PFF049_PAGE_H - rowTop;

const PFF049_FIELD_COORDS: CoordsMap = {
  // Header (top-right block): MID underline ~top=66, Housing underline ~top=101
  mid_no:              { page: 0, x: 424, y: pff049Y(66),  maxWidth: 165, fontSize: 10 },
  housing_account_no:  { page: 0, x: 424, y: pff049Y(101), maxWidth: 165, fontSize: 10 },
  loyalty_partner_bank:{ page: 0, x: 424, y: pff049Y(149), maxWidth: 165, fontSize: 9 },

  // Current full name row — column headers at top=207, values on underline ~top=220
  current_last_name:   { page: 0, x:  28, y: pff049Y(220), maxWidth: 120, fontSize: 9 },
  current_first_name:  { page: 0, x: 152, y: pff049Y(220), maxWidth: 135, fontSize: 9 },
  current_ext_name:    { page: 0, x: 292, y: pff049Y(220), maxWidth: 165, fontSize: 9 },
  current_middle_name: { page: 0, x: 465, y: pff049Y(220), maxWidth: 120, fontSize: 9 },

  // Section 1 FROM/TO at top=242 → value line top≈258
  category_from:       { page: 0, x:  28, y: pff049Y(258), maxWidth: 265, fontSize: 9 },
  category_to:         { page: 0, x: 302, y: pff049Y(258), maxWidth: 285, fontSize: 9 },

  // Section 2 Name Change — FROM/TO labels at top=277; 4 subcols on each side
  // Half-width 286 split as Last/First/Ext/Middle ≈ 28-125/128-195/200-250/255-296 for FROM,
  // and for TO mirror starting x=302: 302-396/399-465/467-515/517-588
  name_from_last:      { page: 0, x:  28, y: pff049Y(292), maxWidth:  90, fontSize: 9 },
  name_from_first:     { page: 0, x: 121, y: pff049Y(292), maxWidth:  70, fontSize: 9 },
  name_from_ext:       { page: 0, x: 196, y: pff049Y(292), maxWidth:  45, fontSize: 9 },
  name_from_middle:    { page: 0, x: 244, y: pff049Y(292), maxWidth:  50, fontSize: 9 },
  name_to_last:        { page: 0, x: 302, y: pff049Y(292), maxWidth:  90, fontSize: 9 },
  name_to_first:       { page: 0, x: 395, y: pff049Y(292), maxWidth:  70, fontSize: 9 },
  name_to_ext:         { page: 0, x: 470, y: pff049Y(292), maxWidth:  45, fontSize: 9 },
  name_to_middle:      { page: 0, x: 518, y: pff049Y(292), maxWidth:  70, fontSize: 9 },

  // Section 3 DOB — FROM/TO labels top=311, value line top≈326
  dob_from:            { page: 0, x:  28, y: pff049Y(326), maxWidth: 265, fontSize: 10 },
  dob_to:              { page: 0, x: 302, y: pff049Y(326), maxWidth: 285, fontSize: 10 },

  // Section 4 Marital Status — Spouse name row at top=397 → value line top≈410
  spouse_last_name:    { page: 0, x:  90, y: pff049Y(410), maxWidth: 100, fontSize: 9 },
  spouse_first_name:   { page: 0, x: 195, y: pff049Y(410), maxWidth:  95, fontSize: 9 },
  spouse_ext_name:     { page: 0, x: 295, y: pff049Y(410), maxWidth:  95, fontSize: 9 },
  spouse_middle_name:  { page: 0, x: 395, y: pff049Y(410), maxWidth:  95, fontSize: 9 },

  // Section 5 Address — Present Home Address block (labels at top=498/533)
  // Line 1 (Unit/Floor/Bldg/Lot/...): underline ~top=515 → full-width single field
  new_address_line:    { page: 0, x:  28, y: pff049Y(515), maxWidth: 395, fontSize: 9 },
  // Barangay / City / Province / Zip row at top=533 → underline top≈546
  new_barangay:        { page: 0, x:  28, y: pff049Y(546), maxWidth:  70, fontSize: 9 },
  new_city:            { page: 0, x: 102, y: pff049Y(546), maxWidth:  85, fontSize: 9 },
  new_province:        { page: 0, x: 192, y: pff049Y(546), maxWidth: 160, fontSize: 9 },
  new_zip:             { page: 0, x: 355, y: pff049Y(546), maxWidth:  60, fontSize: 9 },

  // Contact channels (right column, underlines start ~x=492)
  new_cell_phone:      { page: 0, x: 492, y: pff049Y(477), maxWidth: 115, fontSize: 9 },
  new_email:           { page: 0, x: 492, y: pff049Y(501), maxWidth: 115, fontSize: 9 },

  // Section 8 Others — FROM at top=758 left, TO at top=758 right → values top≈772
  others_from:         { page: 0, x:  28, y: pff049Y(772), maxWidth: 270, fontSize: 9 },
  others_to:           { page: 0, x: 302, y: pff049Y(772), maxWidth: 285, fontSize: 9 },

  // Certification — Signature line top≈847, Date line right side
  signature_date:      { page: 0, x: 395, y: pff049Y(855), maxWidth: 160, fontSize: 10 },
};

// Checkbox cx values from pdfplumber RECT ROWS analysis
// Loyalty Card Holder: top=67 (Yes) / top=96 (No), cx=[476.7 label, 537.6 label]
// Preferred Mailing: top=575-576, cx Present=32.5 | Permanent=175.9 | Employer=305.8
// Marital checkboxes inferred from empty glyph positions (see analysis file):
//   Row 1 (top≈354): Single FROM cx=32, LegSep FROM cx=119, Divorced FROM cx=232,
//                    Single TO cx=306, LegSep TO cx=396, Divorced TO cx=509
//   Row 2 (top≈364): Married FROM cx=32, Annulled FROM cx=119, Widowed FROM cx=232,
//                    Married TO cx=306, Annulled TO cx=396, Widowed TO cx=509
const pff049CheckY = (rowTop: number) => PFF049_PAGE_H - rowTop - 4;

const PFF049_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  loyalty_card_holder: {
    'Yes': { x: 473, y: pff049CheckY(70) },
    'No':  { x: 534, y: pff049CheckY(70) },
  },
  marital_from: {
    'Single':             { x:  30, y: pff049CheckY(354) },
    'Married':            { x:  30, y: pff049CheckY(364) },
    'Legally Separated':  { x: 117, y: pff049CheckY(354) },
    'Annulled/Nullified': { x: 117, y: pff049CheckY(364) },
    'Divorced':           { x: 230, y: pff049CheckY(354) },
    'Widowed':            { x: 230, y: pff049CheckY(364) },
  },
  marital_to: {
    'Single':             { x: 304, y: pff049CheckY(354) },
    'Married':            { x: 304, y: pff049CheckY(364) },
    'Legally Separated':  { x: 394, y: pff049CheckY(354) },
    'Annulled/Nullified': { x: 394, y: pff049CheckY(364) },
    'Divorced':           { x: 507, y: pff049CheckY(354) },
    'Widowed':            { x: 507, y: pff049CheckY(364) },
  },
  preferred_mailing: {
    'Present Home Address':      { x:  31, y: pff049CheckY(578) },
    'Permanent Home Address':    { x: 174, y: pff049CheckY(578) },
    'Employer/Business Address': { x: 304, y: pff049CheckY(578) },
  },
};

const PFF049_SKIP_VALUES: Record<string, string[]> = {
  current_ext_name: ['', 'N/A'],
  name_from_ext: ['', 'N/A'],
  name_to_ext: ['', 'N/A'],
  spouse_ext_name: ['', 'N/A'],
  housing_account_no: [''],
  loyalty_partner_bank: [''],
  loyalty_card_holder: ['', 'No'],     // Only mark Yes checkbox
  category_from: [''],
  category_to: [''],
  name_from_last: [''],
  name_from_first: [''],
  name_from_middle: [''],
  name_to_last: [''],
  name_to_first: [''],
  name_to_middle: [''],
  dob_from: [''],
  dob_to: [''],
  marital_from: ['', 'N/A'],
  marital_to: ['', 'N/A'],
  spouse_last_name: [''],
  spouse_first_name: [''],
  spouse_middle_name: [''],
  new_address_line: [''],
  new_barangay: [''],
  new_city: [''],
  new_province: [''],
  new_zip: [''],
  new_cell_phone: [''],
  new_email: [''],
  preferred_mailing: ['', 'N/A'],
  others_from: [''],
  others_to: [''],
};

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
  'philhealth-claim-form-1': {
    fieldCoords: CF1_FIELD_COORDS,
    skipValues: { member_name_ext: ['N/A'], patient_name_ext: ['N/A'] },
    copyYOffsets: [0],
    checkboxCoords: CF1_CHECKBOX_COORDS,
  },
  'philhealth-claim-form-2': {
    fieldCoords: CF2_FIELD_COORDS,
    skipValues: {
      patient_name_ext: ['N/A'],
      discharge_laterality_1: ['N/A'],
      discharge_laterality_2: ['N/A'],
      discharge_laterality_3: ['N/A'],
      discharge_laterality_4: ['N/A'],
      discharge_laterality_5: ['N/A'],
      discharge_laterality_6: ['N/A'],
      special_hemodialysis: ['No'],
      special_peritoneal_dialysis: ['No'],
      special_radiotherapy_linac: ['No'],
      special_radiotherapy_cobalt: ['No'],
      special_blood_transfusion: ['No'],
      special_brachytherapy: ['No'],
      special_chemotherapy: ['No'],
      special_simple_debridement: ['No'],
      newborn_essential_care: ['No'],
      newborn_hearing_screening: ['No'],
      newborn_screening_test: ['No'],
      hci_paid_member_patient: ['No'],
      hci_paid_hmo: ['No'],
      hci_paid_others: ['No'],
      pf_paid_member_patient: ['No'],
      pf_paid_hmo: ['No'],
      pf_paid_others: ['No'],
      drug_purchase_none: ['No'],
      diagnostic_purchase_none: ['No'],
    },
    copyYOffsets: [0],
    checkboxCoords: CF2_CHECKBOX_COORDS,
  },
  'philhealth-pmrf-foreign-natl': {
    fieldCoords: PMRF_FN_FIELD_COORDS,
    skipValues: {},
    copyYOffsets: [0],
    checkboxCoords: PMRF_FN_CHECKBOX_COORDS,
  },
  'philhealth-claim-signature-form': {
    fieldCoords: CSF_FIELD_COORDS,
    skipValues: CSF_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: CSF_CHECKBOX_COORDS,
  },
  'pagibig-pff-049': {
    fieldCoords: PFF049_FIELD_COORDS,
    skipValues: PFF049_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: PFF049_CHECKBOX_COORDS,
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
  const checkFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
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
      const checkboxPage = pages[checkboxEntry.page ?? 0];
      for (const yOff of copyYOffsets) {
        checkboxPage.drawText('\u2714', {
          x: checkboxEntry.x,
          y: checkboxEntry.y + yOff,
          size: 9,
          font: checkFont,
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

    // ── Per-character box rendering (PIN, DOB digit boxes) ─────────────────
    if (coords.boxCenters) {
      const digits = text.replace(/\D/g, ''); // strip dashes and non-digit chars
      for (let i = 0; i < Math.min(digits.length, coords.boxCenters.length); i++) {
        const ch = digits[i];
        const charWidth = font.widthOfTextAtSize(ch, fontSize);
        const cx = coords.boxCenters[i];
        for (const yOff of copyYOffsets) {
          page.drawText(ch, {
            x: cx - charWidth / 2,
            y: coords.y + yOff,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
      continue;
    }

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

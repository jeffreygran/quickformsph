/**
 * PDF Generator — coordinate overlay strategy for flat PDFs (no AcroForm fields).
 *
 * Strategy: Load the original PDF from /public/forms/{pdfPath}, then draw
 * each field value as a text overlay at the pre-configured coordinates.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { FormSchema } from '@/data/forms';

// Node-only modules are loaded lazily inside generatePDF when running on the server.
// This file is safe to import from browser code (e.g. Local Mode v2.0).

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

export type { CoordEntry, CoordsMap };

export interface FormPdfConfig {
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
  profession:          { page: 0, x:  22, y: 40, maxWidth: 168, fontSize: 8 },
  monthly_income:      { page: 0, x: 197, y: 40, maxWidth:  82, fontSize: 8 },
  proof_of_income:     { page: 0, x: 287, y: 40, maxWidth:  87, fontSize: 6 },

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
  // y = 936 - 420.9 + (12.3 - 7)/2 = 518; Yes: x0=139.8, No: x0=232.6.
  // CF-1 schema uses a boolean checkbox `patient_is_member` ('true' | '').
  // The synthetic `patient_is_member_choice` key (populated in generatePDF
  // before draw) maps the boolean to the printed labels so BOTH the Yes box
  // (when ticked) and the No box (when unticked) get drawn correctly.
  patient_is_member_choice: {
    'Yes':     { x: 142, y: 518 },
    'No':      { x: 235, y: 518 },
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
  // ── Calibrated 2026-04-28 from ClaimForm2_092018.pdf via pdfplumber.
  // Method: extract underscore underline runs + per-digit box rects;
  // text-baseline y = pageHeight(936) - underline_bot + 2.
  //
  // ── Part I: HCI Information ──
  // PAN per-digit boxes: 9 cells at top=192.6 bot=204.9, x∈[330..440].
  // The "HCI-" prefix is pre-printed; only the 9-char "NN-NNNNNN" tail is
  // entered. The CF-2 normalizer strips "HCI-" before render.
  hci_pan:           { page: 0, x: 330, y: 733, maxWidth: 110, fontSize: 10 },
  // HCI Name single underline top=214.0 bot=220.9 → y=717
  // Underline starts at x=174 (after the "2. Name of Health Care Institution:" label)
  hci_name:          { page: 0, x: 175, y: 717, maxWidth: 415 },
  // Address row (3 segs at bot=237.4 → y=701)
  // bldg/street x=81-287, city x=296-440, province x=452-589
  hci_bldg_street:   { page: 0, x:  82, y: 701, maxWidth: 205 },
  hci_city:          { page: 0, x: 297, y: 701, maxWidth: 143 },
  hci_province:      { page: 0, x: 453, y: 701, maxWidth: 137 },

  // ── Part II: Patient Name ──
  // 4 segs at bot=283.9/285.0 → y=653
  patient_last_name:    { page: 0, x: 126, y: 653, maxWidth: 109 },
  patient_first_name:   { page: 0, x: 248, y: 653, maxWidth: 119 },
  patient_name_ext:     { page: 0, x: 377, y: 653, maxWidth:  81 },
  patient_middle_name:  { page: 0, x: 471, y: 653, maxWidth: 119 },

  // ── Referring HCI (visible when referred_by_hci=YES) ──
  // 5 segs at bot=339.9 → y=598
  referring_hci_name:        { page: 0, x: 113, y: 598, maxWidth: 147, fontSize: 8 },
  referring_hci_bldg_street: { page: 0, x: 272, y: 598, maxWidth: 113, fontSize: 8 },
  referring_hci_city:        { page: 0, x: 397, y: 598, maxWidth:  64, fontSize: 8 },
  referring_hci_province:    { page: 0, x: 471, y: 598, maxWidth:  71, fontSize: 8 },
  referring_hci_zip:         { page: 0, x: 552, y: 598, maxWidth:  37, fontSize: 8 },

  // ── Confinement Period: Date Admitted ──
  // Per-digit boxes at top=363.8 bot=369.6 → y=569 (text baseline above box)
  // Month: x=198,210.3 (2 boxes); Day: x=229.7,242 (2); Year: x=261.4..298.3 (4)
  // Time: Hour x=391.3,403.6; Min x=423,435.4
  date_admitted_month: { page: 0, x: 199, y: 568, maxWidth: 24, fontSize: 9 },
  date_admitted_day:   { page: 0, x: 231, y: 568, maxWidth: 24, fontSize: 9 },
  date_admitted_year:  { page: 0, x: 262, y: 568, maxWidth: 49, fontSize: 9 },
  time_admitted_hour:  { page: 0, x: 392, y: 568, maxWidth: 24, fontSize: 9 },
  time_admitted_min:   { page: 0, x: 424, y: 568, maxWidth: 24, fontSize: 9 },

  // ── Confinement Period: Date Discharged ──
  // Boxes at top=379.6 bot=385.5 → y=553
  date_discharged_month: { page: 0, x: 199, y: 552, maxWidth: 24, fontSize: 9 },
  date_discharged_day:   { page: 0, x: 231, y: 552, maxWidth: 24, fontSize: 9 },
  date_discharged_year:  { page: 0, x: 262, y: 552, maxWidth: 49, fontSize: 9 },
  time_discharged_hour:  { page: 0, x: 392, y: 552, maxWidth: 24, fontSize: 9 },
  time_discharged_min:   { page: 0, x: 424, y: 552, maxWidth: 24, fontSize: 9 },

  // ── Expired date/time ──
  // Boxes at top=410.2 bot=416.0 → y=520
  // Month: x=259,271.4; Day: x=290.8,303.1; Year: x=322.4,334.8,347,359.3
  // Time: Hour x=420,432.3; Min x=451.7,464
  expired_date_month: { page: 0, x: 260, y: 520, maxWidth: 24, fontSize: 9 },
  expired_date_day:   { page: 0, x: 291, y: 520, maxWidth: 24, fontSize: 9 },
  expired_date_year:  { page: 0, x: 323, y: 520, maxWidth: 49, fontSize: 9 },
  expired_time_hour:  { page: 0, x: 421, y: 520, maxWidth: 24, fontSize: 9 },
  expired_time_min:   { page: 0, x: 452, y: 520, maxWidth: 24, fontSize: 9 },

  // ── Transferred/Referred HCI ──
  // Name single seg at bot=433.9 → y=504 (x=292-586)
  transferred_hci_name:        { page: 0, x: 293, y: 504, maxWidth: 293, fontSize: 8 },
  // Address row 4 segs at bot=448.9 → y=489
  transferred_hci_bldg_street: { page: 0, x: 272, y: 489, maxWidth: 113, fontSize: 8 },
  transferred_hci_city:        { page: 0, x: 397, y: 489, maxWidth:  62, fontSize: 8 },
  transferred_hci_province:    { page: 0, x: 471, y: 489, maxWidth:  70, fontSize: 8 },
  transferred_hci_zip:         { page: 0, x: 552, y: 489, maxWidth:  35, fontSize: 8 },
  // Reason single seg at bot=469.2 → y=469
  reason_for_referral:         { page: 0, x: 320, y: 469, maxWidth: 265, fontSize: 8 },

  // ── Admission Diagnoses ──
  // Section between "Admission Diagnosis/es:" label (y=488) and
  // "Discharge Diagnosis/es" header bar (y=525). 2 fill rows ~13pt each.
  // Place row 1 baseline at y_top≈506 → pdf_y=433; row 2 at y_top≈519 → pdf_y=420
  admission_diagnosis_1: { page: 0, x:  35, y: 433, maxWidth: 555, fontSize: 9 },
  admission_diagnosis_2: { page: 0, x:  35, y: 420, maxWidth: 555, fontSize: 9 },

  // ── Discharge Diagnoses 6 rows ──
  // Underline bottoms at 562.7, 576.2, 589.7, 603.2, 616.7, 629.9
  // → pdf_y = 375, 362, 348, 335, 321, 308
  // Cols (from underscore runs at y=555):
  //   Diagnosis x=43-114 (w=71) | ICD-10 x=125-180 (w=55)
  //   Procedure x=201-315 (w=114) | RVS x=326-385 (w=59)
  //   Date x=396-459 (w=63)  | Laterality boxes x=473.3,508.9,548 (left/right/both)
  discharge_diagnosis_1:      { page: 0, x:  44, y: 375, maxWidth: 70, fontSize: 7 },
  discharge_icd10_1:          { page: 0, x: 126, y: 375, maxWidth: 54, fontSize: 7 },
  discharge_procedure_1:      { page: 0, x: 202, y: 375, maxWidth: 113, fontSize: 7 },
  discharge_rvs_1:            { page: 0, x: 327, y: 375, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_1: { page: 0, x: 397, y: 375, maxWidth: 62, fontSize: 7 },

  discharge_diagnosis_2:      { page: 0, x:  44, y: 362, maxWidth: 70, fontSize: 7 },
  discharge_icd10_2:          { page: 0, x: 126, y: 362, maxWidth: 54, fontSize: 7 },
  discharge_procedure_2:      { page: 0, x: 202, y: 362, maxWidth: 113, fontSize: 7 },
  discharge_rvs_2:            { page: 0, x: 327, y: 362, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_2: { page: 0, x: 397, y: 362, maxWidth: 62, fontSize: 7 },

  discharge_diagnosis_3:      { page: 0, x:  44, y: 348, maxWidth: 70, fontSize: 7 },
  discharge_icd10_3:          { page: 0, x: 126, y: 348, maxWidth: 54, fontSize: 7 },
  discharge_procedure_3:      { page: 0, x: 202, y: 348, maxWidth: 113, fontSize: 7 },
  discharge_rvs_3:            { page: 0, x: 327, y: 348, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_3: { page: 0, x: 397, y: 348, maxWidth: 62, fontSize: 7 },

  discharge_diagnosis_4:      { page: 0, x:  44, y: 335, maxWidth: 70, fontSize: 7 },
  discharge_icd10_4:          { page: 0, x: 126, y: 335, maxWidth: 54, fontSize: 7 },
  discharge_procedure_4:      { page: 0, x: 202, y: 335, maxWidth: 113, fontSize: 7 },
  discharge_rvs_4:            { page: 0, x: 327, y: 335, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_4: { page: 0, x: 397, y: 335, maxWidth: 62, fontSize: 7 },

  discharge_diagnosis_5:      { page: 0, x:  44, y: 321, maxWidth: 70, fontSize: 7 },
  discharge_icd10_5:          { page: 0, x: 126, y: 321, maxWidth: 54, fontSize: 7 },
  discharge_procedure_5:      { page: 0, x: 202, y: 321, maxWidth: 113, fontSize: 7 },
  discharge_rvs_5:            { page: 0, x: 327, y: 321, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_5: { page: 0, x: 397, y: 321, maxWidth: 62, fontSize: 7 },

  discharge_diagnosis_6:      { page: 0, x:  44, y: 308, maxWidth: 70, fontSize: 7 },
  discharge_icd10_6:          { page: 0, x: 126, y: 308, maxWidth: 54, fontSize: 7 },
  discharge_procedure_6:      { page: 0, x: 202, y: 308, maxWidth: 113, fontSize: 7 },
  discharge_rvs_6:            { page: 0, x: 327, y: 308, maxWidth: 58, fontSize: 7 },
  discharge_procedure_date_6: { page: 0, x: 397, y: 308, maxWidth: 62, fontSize: 7 },

  // ── Z-Benefit Package Code ──
  // Underscore at bot=735.9 → y=202 (x=277-438)
  zbenefit_package_code: { page: 0, x: 278, y: 202, maxWidth: 160, fontSize: 8 },

  // ── MCP Dates: 4 segs at bot=765.9 → y=172 ──
  mcp_dates: { page: 0, x: 51, y: 172, maxWidth: 535, fontSize: 7 },

  // ── Animal Bite ARV (5 segs at bot=810.9 → y=127) ──
  animal_bite_arv_day1: { page: 0, x:  81, y: 127, maxWidth:  58, fontSize: 7 },
  animal_bite_arv_day2: { page: 0, x: 190, y: 127, maxWidth:  70, fontSize: 7 },
  animal_bite_arv_day3: { page: 0, x: 311, y: 127, maxWidth:  54, fontSize: 7 },
  animal_bite_rig:      { page: 0, x: 394, y: 127, maxWidth:  65, fontSize: 7 },
  animal_bite_others:   { page: 0, x: 531, y: 127, maxWidth:  58, fontSize: 7 },

  // ── HIV Lab Number (bot=884.4 → y=54) ──
  hiv_lab_number: { page: 0, x: 292, y: 54, maxWidth: 140, fontSize: 8 },

  // ── PhilHealth Benefits row at bottom (bot=915.9 → y=22) ──
  // First Case: x=172-344, Second Case: x=426-591
  philhealth_benefit_first_case_rate:  { page: 0, x: 173, y: 22, maxWidth: 170, fontSize: 8 },
  philhealth_benefit_second_case_rate: { page: 0, x: 427, y: 22, maxWidth: 163, fontSize: 8 },
  philhealth_benefit_icd_rvs_code:     { page: 0, x:  87, y: 22, maxWidth:  85, fontSize: 7 },

  // ── Page 2: HCP Accreditation rows ──
  // HCP1: 12 boxes at top=67.1 bot=75.0 → pdf_y=861, x=99.7..261.4
  //       Date Signed boxes at top=113.8 bot=119.6 → pdf_y=820, x=125.5..238.1
  // HCP2: 12 boxes at top=134.8 bot=142.7 → pdf_y=793
  //       Date Signed boxes at bot=181.0 → pdf_y=758
  // HCP3: 12 boxes at top=196.2 bot=204.1 → pdf_y=732
  //       Date Signed boxes at bot=242.5 → pdf_y=697
  // The "HCP-" prefix is pre-printed; only post-prefix portion enters boxes.
  hcp1_accreditation_no:    { page: 1, x: 100, y: 861, maxWidth: 162, fontSize: 9 },
  hcp1_date_signed_month:   { page: 1, x: 126, y: 820, maxWidth:  24, fontSize: 9 },
  hcp1_date_signed_day:     { page: 1, x: 158, y: 820, maxWidth:  24, fontSize: 9 },
  hcp1_date_signed_year:    { page: 1, x: 189, y: 820, maxWidth:  49, fontSize: 9 },

  hcp2_accreditation_no:    { page: 1, x: 100, y: 793, maxWidth: 162, fontSize: 9 },
  hcp2_date_signed_month:   { page: 1, x: 126, y: 758, maxWidth:  24, fontSize: 9 },
  hcp2_date_signed_day:     { page: 1, x: 158, y: 758, maxWidth:  24, fontSize: 9 },
  hcp2_date_signed_year:    { page: 1, x: 189, y: 758, maxWidth:  49, fontSize: 9 },

  hcp3_accreditation_no:    { page: 1, x: 100, y: 732, maxWidth: 162, fontSize: 9 },
  hcp3_date_signed_month:   { page: 1, x: 126, y: 697, maxWidth:  24, fontSize: 9 },
  hcp3_date_signed_day:     { page: 1, x: 158, y: 697, maxWidth:  24, fontSize: 9 },
  hcp3_date_signed_year:    { page: 1, x: 189, y: 697, maxWidth:  49, fontSize: 9 },

  // ── Page 2: Certification of Benefits ──
  // Top section: "Total Actual Charges*" is a SINGLE right-side value column.
  // Labels (y_top) at 348/363/378 → pdf_y=585/570/555. Value col x≈460-580.
  total_hci_fees:            { page: 1, x: 462, y: 585, maxWidth: 115, fontSize: 9 },
  total_professional_fees:   { page: 1, x: 462, y: 570, maxWidth: 115, fontSize: 9 },
  grand_total:               { page: 1, x: 462, y: 555, maxWidth: 115, fontSize: 9 },
  // Bottom section table (a.) — 4 cols × 2 rows.
  // Row 1 = HCI Fees. Row-1 cells y_top ≈ 486 → pdf_y=446 (free-form cells).
  // Row 2 = PF Fees.  Row-2 cells y_top ≈ 524 → pdf_y=408.
  // Right col has "Amount P ___" underline: HCI bot=482.5 → pdf_y=456;
  // PF bot=530.5 → pdf_y=408.
  total_actual_charges:      { page: 1, x: 145, y: 446, maxWidth:  80, fontSize: 8 },
  discount_amount:           { page: 1, x: 232, y: 446, maxWidth:  90, fontSize: 8 },
  philhealth_benefit_amount: { page: 1, x: 345, y: 446, maxWidth:  80, fontSize: 8 },
  amount_after_philhealth:   { page: 1, x: 470, y: 460, maxWidth:  85, fontSize: 8 },
  // "Amount paid by" is the row-2 (PF row) underline
  hci_amount_paid_by:        { page: 1, x: 470, y: 460, maxWidth:  85, fontSize: 8 },
  pf_amount_paid_by:         { page: 1, x: 470, y: 408, maxWidth:  85, fontSize: 8 },

  // Drug & Diag purchases: right-side underlines at bot=598.5/623.5
  drug_purchase_total_amount:       { page: 1, x: 500, y: 340, maxWidth: 55, fontSize: 8 },
  diagnostic_purchase_total_amount: { page: 1, x: 500, y: 315, maxWidth: 55, fontSize: 8 },
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
  expired_time_ampm: {
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
  // Block 2: No top=145.6 bot=157.9 → y=936-157.9+(12.3-7)/2=780.8
  //          With top=160.0 bot=172.3 → y=936-172.3+(12.3-7)/2=766.4
  hcp2_copay: {
    'No co-pay on top of PhilHealth Benefit':   { page: 1, x: 336, y: 781 },
    'With co-pay on top of PhilHealth Benefit': { page: 1, x: 336, y: 766 },
  },
  // Block 3: No top=207.1 bot=219.4 → y=936-219.4+(12.3-7)/2=719.3
  //          With top=221.5 bot=233.8 → y=936-233.8+(12.3-7)/2=704.9
  hcp3_copay: {
    'No co-pay on top of PhilHealth Benefit':   { page: 1, x: 336, y: 719 },
    'With co-pay on top of PhilHealth Benefit': { page: 1, x: 336, y: 705 },
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

// ── PhilHealth Claim Form 3 calibrated coordinates (v0 ONBOARDING) ───────────
// Page 1 & 2: 612.0 × 1008.0 pts (US Legal long). pdf_lib_y = 1008 - pdfplumber_bottom.
//
// v0 SCOPE: Part I narrative + admission/discharge + disposition + certification
// (~35 fields). Coordinates calibrated from pdfplumber word-position pass on
// 2026-04-28. Part II (MCP) coords = follow-up sprint per L-SMART-CF3-V0.
//
// Calibration anchors (pdfplumber tops, page 1):
//   PAN row underline ........... top≈170 → y=838
//   Patient Name row ............ top≈218 → y=790
//   Chief Complaint ............. top≈245 → y=763
//   Date Admitted (mm/dd/yyyy) .. top≈258 → y=750
//   Date Discharged ............. top≈288 → y=720
//   History block ............... top≈325 → y=683
//   PE General Survey ........... top≈476 → y=532
//   Vital signs row ............. top≈501 → y=507
//   Course in Ward .............. top≈700 → y=308
//   Lab Findings ................ top≈808 → y=200
//   Disposition checkboxes row .. top≈939 → y=69
//
// Page 2 anchors:
//   Final Diagnosis ............. top≈80  → y=928
//   Attending Physician name .... top≈881 → y=127
//   PRC + Date Signed ........... top≈881 → y=127
const CF3_PAGE_H = 1008.0;
const CF3_FIELD_COORDS: CoordsMap = {
  // ── Q1 PAN: 9 cells (top=162.6, bottom=173.8). Centers measured from
  //   pdfplumber rect dividers; using boxCenters splits the value digit-by-digit.
  //   Input may include 'HCI-NN-XXXXXX' prefix — generator strips non-digits before
  //   per-cell render. The form has NO separate HCI-Name slot on this row, so
  //   `hci_name` is captured in schema for sample data only and is NOT drawn here.
  hci_pan: {
    page: 0, x: 0, y: CF3_PAGE_H - 173, fontSize: 9,
    boxCenters: [291.83, 308.75, 325.68, 342.61, 359.53, 376.45, 393.37, 410.29, 427.23],
  },

  // ── Q2 Patient Name row (Last, First, Middle, Ext) ──
  // CF-3 quirk: underline is at top=219.9 ABOVE the sub-labels at top=223. Text
  //   must render ON the underline (above the descriptive labels), NOT below.
  //   y_pdflib = 1008 - 218 = 790.
  patient_last_name:         { page: 0, x:  60, y: CF3_PAGE_H - 218, maxWidth: 130 },
  patient_first_name:        { page: 0, x: 200, y: CF3_PAGE_H - 218, maxWidth: 130 },
  patient_middle_name:       { page: 0, x: 340, y: CF3_PAGE_H - 218, maxWidth: 130 },
  patient_name_ext:          { page: 0, x: 480, y: CF3_PAGE_H - 218, maxWidth:  40 },

  // ── Q3 Chief Complaint (right-side boxed area, top-right of header band) ──
  // Box top≈215 right column; box height ~40. Render at top of box.
  chief_complaint:           { page: 0, x: 432, y: CF3_PAGE_H - 230, maxWidth: 165, fontSize: 7 },

  // ── Q4 Date Admitted: split mm/dd/yyyy + Time hh:mm AM/PM ──
  // Labels at top=258 ("Month Day Year" caption); underlines at top≈266.
  // Boxes appear to end ≈275; baseline = 1008 - 273 = 735.
  date_admitted_month:       { page: 0, x: 113, y: CF3_PAGE_H - 252, maxWidth:  20 },
  date_admitted_day:         { page: 0, x: 156, y: CF3_PAGE_H - 252, maxWidth:  20 },
  date_admitted_year:        { page: 0, x: 198, y: CF3_PAGE_H - 252, maxWidth:  35 },
  time_admitted_hour:        { page: 0, x: 317, y: CF3_PAGE_H - 252, maxWidth:  16 },
  time_admitted_min:         { page: 0, x: 367, y: CF3_PAGE_H - 252, maxWidth:  16 },

  // ── Q5 Date Discharged + Time discharged ──
  // Underlines at top≈296; baseline = 1008 - 303 = 705.
  date_discharged_month:     { page: 0, x: 113, y: CF3_PAGE_H - 282, maxWidth:  20 },
  date_discharged_day:       { page: 0, x: 156, y: CF3_PAGE_H - 282, maxWidth:  20 },
  date_discharged_year:      { page: 0, x: 198, y: CF3_PAGE_H - 282, maxWidth:  35 },
  time_discharged_hour:      { page: 0, x: 317, y: CF3_PAGE_H - 282, maxWidth:  16 },
  time_discharged_min:       { page: 0, x: 367, y: CF3_PAGE_H - 282, maxWidth:  16 },

  // ── Q6 Brief History of Present Illness / OB History ──
  // Label at top=314 → baseline ≈322. Empty narrative band below.
  // First line of free-text starts ≈10pt below label baseline.
  history_of_present_illness:{ page: 0, x:  60, y: CF3_PAGE_H - 350, maxWidth: 540, fontSize: 8 },

  // ── Q7 Physical Examination block ──
  // Section header at top≈459. Sub-rows below.
  pe_general_survey:         { page: 0, x: 100, y: CF3_PAGE_H - 489, maxWidth: 250, fontSize: 8 },
  // Vital Signs strip — labels "BP:" "CR:" "RR:" "Temperature:" at tops≈501.
  // Underlines just below labels at top≈506; baseline = 1008 - 511 = 497.
  vs_blood_pressure:         { page: 0, x: 122, y: CF3_PAGE_H - 511, maxWidth:  55 },
  vs_cardiac_rate:           { page: 0, x: 178, y: CF3_PAGE_H - 511, maxWidth:  35 },
  vs_respiratory_rate:       { page: 0, x: 232, y: CF3_PAGE_H - 511, maxWidth:  35 },
  vs_temperature:            { page: 0, x: 320, y: CF3_PAGE_H - 511, maxWidth:  40 },
  // PE detail rows (HEENT, Chest/Lungs, CVS on left col @ x=100; Abdomen/GU/Ext on right col @ x=415)
  // Row tops: HEENT≈530, Chest≈558, CVS≈585; Abdomen≈501, GU≈530, Ext≈558.
  pe_heent:                  { page: 0, x: 100, y: CF3_PAGE_H - 540, maxWidth: 230, fontSize: 8 },
  pe_chest_lungs:            { page: 0, x: 100, y: CF3_PAGE_H - 568, maxWidth: 230, fontSize: 8 },
  pe_cvs:                    { page: 0, x: 100, y: CF3_PAGE_H - 595, maxWidth: 230, fontSize: 8 },
  pe_abdomen:                { page: 0, x: 430, y: CF3_PAGE_H - 511, maxWidth: 170, fontSize: 8 },
  pe_genitourinary:          { page: 0, x: 430, y: CF3_PAGE_H - 540, maxWidth: 170, fontSize: 8 },
  pe_extremities:            { page: 0, x: 460, y: CF3_PAGE_H - 568, maxWidth: 140, fontSize: 8 },

  // ── Q8 Course in the Wards ──
  // Label "8. Course in the Wards" at top≈680. Empty narrative band below.
  course_in_the_ward:        { page: 0, x:  60, y: CF3_PAGE_H - 700, maxWidth: 540, fontSize: 8 },

  // ── Q9 Pertinent Laboratory and Diagnostic Findings ──
  // Label at top=808. First narrative line starts ≈12pt below.
  pertinent_lab_findings:    { page: 0, x:  60, y: CF3_PAGE_H - 825, maxWidth: 540, fontSize: 8 },

  // ── Q10 Disposition: Transferred-HCI text + Expired-date (when applicable) ──
  // Disposition label at top=940; checkboxes top≈939; conditional text fields
  // appear inline-right of the boxes for Transferred ("to ___") and Expired ("on ___").
  transferred_hci_name:      { page: 0, x: 270, y: CF3_PAGE_H - 970, maxWidth: 200, fontSize: 7 },
  expired_date_month:        { page: 0, x: 525, y: CF3_PAGE_H - 970, maxWidth:  18 },
  expired_date_day:          { page: 0, x: 548, y: CF3_PAGE_H - 970, maxWidth:  18 },
  expired_date_year:         { page: 0, x: 571, y: CF3_PAGE_H - 970, maxWidth:  30 },

  // ── Q11/Q12 Diagnoses (Part I bottom band, between Q9 Lab and Q10 Disposition) ──
  admitting_diagnosis:       { page: 0, x: 180, y: CF3_PAGE_H - 905, maxWidth: 420, fontSize: 8 },
  final_diagnosis:           { page: 0, x: 180, y: CF3_PAGE_H - 925, maxWidth: 420, fontSize: 8 },

  // ── Q19 Certification of Attending Physician/Midwife (Page 2 footer) ──
  // Cert header at top≈816; signature row at top≈881 ("Date Signed (Month/Day/Year)").
  // Name line ~30pt above the date label.
  attending_physician_name:  { page: 1, x:  60, y: CF3_PAGE_H - 875, maxWidth: 200 },
  attending_physician_prc:   { page: 1, x: 270, y: CF3_PAGE_H - 875, maxWidth:  80 },
  attending_physician_date_signed_month: { page: 1, x: 365, y: CF3_PAGE_H - 875, maxWidth: 18 },
  attending_physician_date_signed_day:   { page: 1, x: 388, y: CF3_PAGE_H - 875, maxWidth: 18 },
  attending_physician_date_signed_year:  { page: 1, x: 411, y: CF3_PAGE_H - 875, maxWidth: 35 },
};

// ── CF-3 disposition checkboxes (5-way: Improved | Transferred | HAMA | Absconded | Expired) ──
// Checkbox squares pdfplumber tops≈938-948; printed labels at top=939.
// Squares are ~10pt wide. Tick should center inside the square at y_pdflib ≈ 1008 - 945 + 3 = 66.
const CF3_CHECKBOX_COORDS: Record<string, Record<string, { x: number; y: number; page?: number }>> = {
  patient_disposition: {
    'Improved':    { page: 0, x: 142, y: 64 },
    'Transferred': { page: 0, x: 226, y: 64 },
    'HAMA':        { page: 0, x: 316, y: 64 },
    'Absconded':   { page: 0, x: 402, y: 64 },
    'Expired':     { page: 0, x: 475, y: 64 },
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
  // Dep rows 4-6 (added per L-SMART-PMRF-FN-01 — schema previously had only 3,
  // but the printed PDF has 6 rows. Δy = 21pt — measured from underline tops).
  dep4_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 73, fontSize: 8 },
  dep4_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 78, fontSize: 8 },
  dep4_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 78, fontSize: 8 },
  dep4_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 24, fontSize: 8 },
  dep4_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 63, fontSize: 8 },
  dep4_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 54, fontSize: 8 },
  dep4_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 618.9 - 2, maxWidth: 58, fontSize: 8 },
  dep5_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 73, fontSize: 8 },
  dep5_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 78, fontSize: 8 },
  dep5_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 78, fontSize: 8 },
  dep5_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 24, fontSize: 8 },
  dep5_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 63, fontSize: 8 },
  dep5_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 54, fontSize: 8 },
  dep5_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 639.9 - 2, maxWidth: 58, fontSize: 8 },
  dep6_last:         { page: 0, x:  48, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 73, fontSize: 8 },
  dep6_first:        { page: 0, x: 132, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 78, fontSize: 8 },
  dep6_middle:       { page: 0, x: 222, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 78, fontSize: 8 },
  dep6_sex:          { page: 0, x: 312, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 24, fontSize: 8 },
  dep6_relationship: { page: 0, x: 347, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 63, fontSize: 8 },
  dep6_dob:          { page: 0, x: 424, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 54, fontSize: 8 },
  dep6_nationality:  { page: 0, x: 492, y: PMRF_FN_PAGE_H - 660.9 - 2, maxWidth: 58, fontSize: 8 },
  // Signature row top=743.4
  signature_printed_name: { page: 0, x:  42, y: PMRF_FN_PAGE_H - 743.4 - 2, maxWidth: 215 },
  signature_date:         { page: 0, x: 270, y: PMRF_FN_PAGE_H - 743.4 - 2, maxWidth: 102 },
};
// Sex checkbox rects:
//   Male  : x0=82.4,  top=342.2, x1=97.2,  bottom=357.0 → center y_lib = 841.9-349.6-2.31 = 489.99
//   Female: x0=150.1, top=342.2, x1=164.9, bottom=357.0 → same y
const PMRF_FN_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  sex: {
    // Calibrated 2026-04: +2.7 x / -2.2 y to center on printed box.
    'Male':   { x: 86.2, y: 487.8 },
    'Female': { x: 153.7, y: 487.8 },
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
  // Empty array [] = UI-only / split-parent field (renders via sub-coords or drives UI only).
  member_dob: [],            // split into _month/_day/_year sub-coords
  patient_dob: [],           // split into _month/_day/_year sub-coords
  date_admitted: [],         // split into _month/_day/_year sub-coords
  date_discharged: [],       // split into _month/_day/_year sub-coords
  employer_date_signed: [],  // split into _month/_day/_year sub-coords
  consent_date_signed: [],   // split into _month/_day/_year sub-coords
  patient_is_self: [],       // UI-only toggle
  has_employer: [],          // UI-only toggle
};

// ── Pag-IBIG PFF-049 (MCIF) — calibrated coords (612×936, 1-page overlay) ───
// pdfplumber top→PDF y: y = 936 - top. Text baseline typically sits ~2pt above
// the printed underline, so value y ≈ 936 - (label_top + ~14).
const PFF049_PAGE_H = 936.0;
const pff049Y = (rowTop: number) => PFF049_PAGE_H - rowTop;

const PFF049_FIELD_COORDS: CoordsMap = {
  // ── Header digit boxes — one char per box ───────────────────────────────
  // MID row: 14 box cells at top=66.48 / bottom=84.12 / h=17.6 (15 vertical rules).
  //   Pag-IBIG MID format = 4-4-4 (12 digits + 2 dash separators). Cells 4 and 9
  //   hold pre-printed dashes; digits occupy cells 0-3, 5-8, 10-13 (12 centers).
  //   Baseline y = 936 - 66.48 - 17.6 + (17.6-6.51)/2 ≈ 857.5 for 9pt Helvetica.
  mid_no: {
    page: 0, x: 0, y: 857.5, fontSize: 9,
    boxCenters: [
      427.9, 439.95, 452.05, 464.2,           // digits 1-4
      488.55, 500.75, 512.95, 525.1,          // digits 5-8 (skip dash cell idx 4)
      549.55, 561.7, 573.75, 585.95,          // digits 9-12 (skip dash cell idx 9)
    ],
  },
  // Housing Account row: 14 box cells at top=95.90 / bottom=113.54 / h=17.64.
  //   No known separator pattern — use all 14 centers for free-form account numbers.
  //   Baseline y = 936 - 95.9 - 17.64 + (17.64-6.51)/2 ≈ 828.0.
  housing_account_no: {
    page: 0, x: 0, y: 828.0, fontSize: 9,
    boxCenters: [
      427.9, 439.95, 452.05, 464.2, 476.4, 488.55, 500.75,
      512.95, 525.1, 537.35, 549.55, 561.7, 573.85, 586.0,
    ],
  },
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
  new_barangay:        { page: 0, x:  28, y: pff049Y(546), maxWidth:  95, fontSize: 9 },
  new_city:            { page: 0, x: 127, y: pff049Y(546), maxWidth:  90, fontSize: 9 },
  new_province:        { page: 0, x: 220, y: pff049Y(546), maxWidth: 165, fontSize: 9 },
  new_zip:             { page: 0, x: 390, y: pff049Y(546), maxWidth:  35, fontSize: 9 },

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
// Calibrated 2026-04: helper -4 → -8 (shift tick down ~4pt) and each x -2pt.
const pff049CheckY = (rowTop: number) => PFF049_PAGE_H - rowTop - 8;

const PFF049_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // NOTE: The original form has no Yes/No checkbox for loyalty_card_holder —
  // a bank name in `loyalty_partner_bank` is the sole indicator. Skip drawing.
  marital_from: {
    'Single':             { x:  28, y: pff049CheckY(354) },
    'Married':            { x:  28, y: pff049CheckY(364) },
    'Legally Separated':  { x: 115, y: pff049CheckY(354) },
    'Annulled/Nullified': { x: 115, y: pff049CheckY(364) },
    'Divorced':           { x: 228, y: pff049CheckY(354) },
    'Widowed':            { x: 228, y: pff049CheckY(364) },
  },
  marital_to: {
    'Single':             { x: 302, y: pff049CheckY(354) },
    'Married':            { x: 302, y: pff049CheckY(364) },
    'Legally Separated':  { x: 392, y: pff049CheckY(354) },
    'Annulled/Nullified': { x: 392, y: pff049CheckY(364) },
    'Divorced':           { x: 505, y: pff049CheckY(354) },
    'Widowed':            { x: 505, y: pff049CheckY(364) },
  },
  preferred_mailing: {
    'Present Home Address':      { x:  29, y: pff049CheckY(578) },
    'Permanent Home Address':    { x: 172, y: pff049CheckY(578) },
    'Employer/Business Address': { x: 302, y: pff049CheckY(578) },
  },
};

const PFF049_SKIP_VALUES: Record<string, string[]> = {
  current_ext_name: ['', 'N/A'],
  name_from_ext: ['', 'N/A'],
  name_to_ext: ['', 'N/A'],
  spouse_ext_name: ['', 'N/A'],
  housing_account_no: [''],
  loyalty_partner_bank: [''],
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
  loyalty_card_holder: ['', 'No', 'Yes'],  // no checkbox in original form — skip always
  preferred_mailing: ['', 'N/A'],
  others_from: [''],
  others_to: [''],
};

// ── Pag-IBIG SLF-089 (HELPs) — calibrated coords (612×936, page 0 only) ──────
// pdfplumber row tops: 61, 84, 105, 130, 152, 175, 198, 218, 241, 265, 286, 314.
// V-column rules at x ≈ 22, 180, 223, 235, 280, 313, 402, 492, 544, 593.
// Whole-cell text fills (NO per-digit boxes on this form). Value baseline sits
// ~3pt above the next H-line: y_lib = 936 - next_row_top + 3.
const SLF089_PAGE_H = 936.0;
const slf089Y = (nextRowTop: number) => SLF089_PAGE_H - nextRowTop + 3;

// Y baselines per row
const SLF_Y_HEADER  = slf089Y(84);   // 855  — MID / App No
const SLF_Y_NAMES   = slf089Y(105);  // 834  — Last/First/Ext/Middle/NoMaiden/DOB/POB
const SLF_Y_PERSON  = slf089Y(130);  // 809  — Mother/Sex/Marital/Citizen/Nat'l
const SLF_Y_PERM1   = slf089Y(152);  // 787  — Permanent address row 1
const SLF_Y_PERM2   = slf089Y(175);  // 764  — Permanent address row 2
const SLF_Y_PRES1   = slf089Y(198);  // 741  — Present address row 1
const SLF_Y_PRES2   = slf089Y(218);  // 721  — Present address row 2
const SLF_Y_EMP1    = slf089Y(241);  // 698  — Employer / DOE / Loan amount
const SLF_Y_EMP2    = slf089Y(265);  // 674  — Source of fund / Employer addr 1
const SLF_Y_EMP3    = slf089Y(286);  // 653  — Employer addr 2 / Loan purpose
const SLF_Y_LOAN    = slf089Y(314);  // 625  — Beneficiary / Student# / Loan term

const SLF089_FIELD_COORDS: CoordsMap = {
  // Header — MID and Application No (whole-cell text, not digit-boxed)
  mid_no:          { page: 0, x: 406, y: SLF_Y_HEADER, fontSize: 9, maxWidth: 84 },
  application_no:  { page: 0, x: 496, y: SLF_Y_HEADER, fontSize: 9, maxWidth: 95 },

  // Names row (top=84-105)
  last_name:                { page: 0, x: 24,  y: SLF_Y_NAMES, fontSize: 8, maxWidth: 80 },
  first_name:               { page: 0, x: 108, y: SLF_Y_NAMES, fontSize: 8, maxWidth: 70 },
  ext_name:                 { page: 0, x: 182, y: SLF_Y_NAMES, fontSize: 8, maxWidth: 38 },
  middle_name:              { page: 0, x: 224, y: SLF_Y_NAMES, fontSize: 8, maxWidth: 70 },
  no_maiden_middle_name:    { page: 0, x: 298, y: SLF_Y_NAMES, fontSize: 8, maxWidth: 100 },
  dob:                      { page: 0, x: 406, y: SLF_Y_NAMES, fontSize: 9, maxWidth: 84 },
  place_of_birth:           { page: 0, x: 496, y: SLF_Y_NAMES, fontSize: 8, maxWidth: 95 },

  // Personal info row (top=105-130) — sex/marital have checkboxes
  mothers_maiden_name:      { page: 0, x: 24,  y: SLF_Y_PERSON, fontSize: 8, maxWidth: 154 },
  citizenship:              { page: 0, x: 406, y: SLF_Y_PERSON, fontSize: 8, maxWidth: 84 },
  nationality:              { page: 0, x: 496, y: SLF_Y_PERSON, fontSize: 8, maxWidth: 95 },

  // Permanent address row 1 (top=130-152)
  perm_unit:                { page: 0, x: 24,  y: SLF_Y_PERM1, fontSize: 7.5, maxWidth: 200 },
  perm_street:              { page: 0, x: 226, y: SLF_Y_PERM1, fontSize: 8, maxWidth: 175 },
  perm_cell_phone:          { page: 0, x: 406, y: SLF_Y_PERM1, fontSize: 9, maxWidth: 84 },
  perm_home_tel:            { page: 0, x: 496, y: SLF_Y_PERM1, fontSize: 9, maxWidth: 95 },

  // Permanent address row 2 (top=152-175)
  perm_subdivision:         { page: 0, x: 24,  y: SLF_Y_PERM2, fontSize: 8, maxWidth: 90 },
  perm_barangay:            { page: 0, x: 116, y: SLF_Y_PERM2, fontSize: 8, maxWidth: 60 },
  perm_city:                { page: 0, x: 178, y: SLF_Y_PERM2, fontSize: 8, maxWidth: 60 },
  perm_province:            { page: 0, x: 240, y: SLF_Y_PERM2, fontSize: 8, maxWidth: 75 },
  perm_zip:                 { page: 0, x: 320, y: SLF_Y_PERM2, fontSize: 9, maxWidth: 35 },
  perm_email:               { page: 0, x: 358, y: SLF_Y_PERM2, fontSize: 7.5, maxWidth: 130 },
  perm_tin:                 { page: 0, x: 496, y: SLF_Y_PERM2, fontSize: 9, maxWidth: 95 },

  // Present address row 1 (top=175-198)
  pres_unit:                { page: 0, x: 24,  y: SLF_Y_PRES1, fontSize: 7.5, maxWidth: 200 },
  pres_street:              { page: 0, x: 226, y: SLF_Y_PRES1, fontSize: 8, maxWidth: 86 },
  pres_employee_id:         { page: 0, x: 314, y: SLF_Y_PRES1, fontSize: 8, maxWidth: 88 },
  pres_nature_of_work:      { page: 0, x: 406, y: SLF_Y_PRES1, fontSize: 8, maxWidth: 185 },

  // Present address row 2 (top=198-218)
  pres_subdivision:         { page: 0, x: 24,  y: SLF_Y_PRES2, fontSize: 8, maxWidth: 90 },
  pres_barangay:            { page: 0, x: 116, y: SLF_Y_PRES2, fontSize: 8, maxWidth: 60 },
  pres_city:                { page: 0, x: 178, y: SLF_Y_PRES2, fontSize: 8, maxWidth: 60 },
  pres_province:            { page: 0, x: 240, y: SLF_Y_PRES2, fontSize: 8, maxWidth: 75 },
  pres_zip:                 { page: 0, x: 320, y: SLF_Y_PRES2, fontSize: 9, maxWidth: 80 },
  pres_sss_gsis:            { page: 0, x: 406, y: SLF_Y_PRES2, fontSize: 9, maxWidth: 84 },
  pres_business_tel:        { page: 0, x: 496, y: SLF_Y_PRES2, fontSize: 9, maxWidth: 95 },

  // Employer / Loan amount (top=218-241)
  employer_name:            { page: 0, x: 24,  y: SLF_Y_EMP1, fontSize: 8, maxWidth: 200 },
  date_of_employment:       { page: 0, x: 226, y: SLF_Y_EMP1, fontSize: 9, maxWidth: 86 },
  desired_loan_amount:      { page: 0, x: 314, y: SLF_Y_EMP1, fontSize: 9, maxWidth: 88 },

  // Source of fund / Employer address row 1 (top=241-265)
  source_of_fund:           { page: 0, x: 314, y: SLF_Y_EMP2, fontSize: 8, maxWidth: 88 },
  employer_address_line:    { page: 0, x: 24,  y: SLF_Y_EMP2, fontSize: 7.5, maxWidth: 285 },

  // Employer address row 2 / Loan purpose (top=265-286)
  employer_subdivision:     { page: 0, x: 24,  y: SLF_Y_EMP3, fontSize: 8, maxWidth: 90 },
  employer_barangay:        { page: 0, x: 116, y: SLF_Y_EMP3, fontSize: 8, maxWidth: 60 },
  employer_city:            { page: 0, x: 178, y: SLF_Y_EMP3, fontSize: 8, maxWidth: 60 },
  employer_province:        { page: 0, x: 240, y: SLF_Y_EMP3, fontSize: 8, maxWidth: 75 },
  employer_zip:             { page: 0, x: 320, y: SLF_Y_EMP3, fontSize: 9, maxWidth: 80 },

  // Beneficiary / Student# / Loan term (top=286-314)
  beneficiary_last:         { page: 0, x: 24,  y: SLF_Y_LOAN, fontSize: 8, maxWidth: 80 },
  beneficiary_first:        { page: 0, x: 108, y: SLF_Y_LOAN, fontSize: 8, maxWidth: 70 },
  beneficiary_ext:          { page: 0, x: 182, y: SLF_Y_LOAN, fontSize: 8, maxWidth: 38 },
  beneficiary_middle:       { page: 0, x: 224, y: SLF_Y_LOAN, fontSize: 8, maxWidth: 90 },
  student_id_no:            { page: 0, x: 314, y: SLF_Y_LOAN, fontSize: 8, maxWidth: 88 },

  // Signature date — bottom of page near signature block (approx y=120 in lib coords)
  signature_date:           { page: 0, x: 470, y: 110, fontSize: 9, maxWidth: 110 },

  // ── Previous Employment Details table (3 rows × 4 cols) ─────────────────
  // Cell rects (pdfplumber tops/bottoms):
  //   Row 1: top=334.7 bot=342.9 → y_lib = 936 - 342.9 + 2 = 595
  //   Row 2: top=343.4 bot=351.4 → y_lib = 586
  //   Row 3: top=351.9 bot=359.9 → y_lib = 578
  // Columns (x0..x1): NAME 22.7-223 | ADDRESS 223.5-492 | FROM 492.5-544.3 | TO 544.8-592.7
  prev_emp1_name:    { page: 0, x:  25, y: 595, fontSize: 7, maxWidth: 195 },
  prev_emp1_address: { page: 0, x: 226, y: 595, fontSize: 7, maxWidth: 263 },
  prev_emp1_from:    { page: 0, x: 495, y: 595, fontSize: 7, maxWidth:  47 },
  prev_emp1_to:      { page: 0, x: 548, y: 595, fontSize: 7, maxWidth:  43 },
  prev_emp2_name:    { page: 0, x:  25, y: 586, fontSize: 7, maxWidth: 195 },
  prev_emp2_address: { page: 0, x: 226, y: 586, fontSize: 7, maxWidth: 263 },
  prev_emp2_from:    { page: 0, x: 495, y: 586, fontSize: 7, maxWidth:  47 },
  prev_emp2_to:      { page: 0, x: 548, y: 586, fontSize: 7, maxWidth:  43 },
  prev_emp3_name:    { page: 0, x:  25, y: 578, fontSize: 7, maxWidth: 195 },
  prev_emp3_address: { page: 0, x: 226, y: 578, fontSize: 7, maxWidth: 263 },
  prev_emp3_from:    { page: 0, x: 495, y: 578, fontSize: 7, maxWidth:  47 },
  prev_emp3_to:      { page: 0, x: 548, y: 578, fontSize: 7, maxWidth:  43 },
};

// Checkbox coords for sex / marital / loan_purpose / loan_term will be added
// in iteration 2 after visual calibration. MVP iteration 1 = text fields only.

const SLF089_SKIP_VALUES: Record<string, string[]> = {
  application_no: [''],
  ext_name: ['', 'N/A'],
  middle_name: [''],
  no_maiden_middle_name: [''],
  perm_subdivision: [''],
  perm_home_tel: [''],
  pres_unit: [''],
  pres_street: [''],
  pres_employee_id: [''],
  pres_subdivision: [''],
  pres_barangay: [''],
  pres_city: [''],
  pres_province: [''],
  pres_zip: [''],
  pres_sss_gsis: [''],
  pres_business_tel: [''],
  employer_subdivision: [''],
  employer_zip: [''],
  beneficiary_ext: ['', 'N/A'],
  beneficiary_middle: [''],
  student_id_no: [''],
  // Iteration 2: sex/marital/loan_purpose/loan_term/loan_amount_type are now checkboxes.
  sex: ['', 'N/A'],
  marital_status: ['', 'N/A'],
  loan_amount_type: ['', 'N/A'],
  loan_purpose: ['', 'N/A'],
  loan_term: ['', 'N/A'],
};

// ── SLF-089 checkbox coords (Iteration 2) ────────────────────────────────
// \uf0a8 glyph positions (page 0, h=936). Same formula as HLF-068:
//   y_lib = 936 - glyph_top - 7 ; x = cx - 4
const slf089CheckY = (top: number) => SLF089_PAGE_H - top - 7;
const SLF089_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // SEX (top=113.2 Male / 120.2 Female, cx=185.21)
  sex: {
    'Male':   { page: 0, x: 181, y: slf089CheckY(113.2) },
    'Female': { page: 0, x: 181, y: slf089CheckY(120.2) },
  },
  // MARITAL STATUS — row1 top=113.2 (Single=239.72 / Widower=306.80 / Annulled=368.86)
  //                  row2 top=120.2 (Married=239.72 / Legally Separated=307.16)
  marital_status: {
    'Single/Unmarried':  { page: 0, x: 236, y: slf089CheckY(113.2) },
    'Widower':           { page: 0, x: 303, y: slf089CheckY(113.2) },
    'Annulled':          { page: 0, x: 365, y: slf089CheckY(113.2) },
    'Married':           { page: 0, x: 236, y: slf089CheckY(120.2) },
    'Legally Separated': { page: 0, x: 303, y: slf089CheckY(120.2) },
  },
  // LOAN AMOUNT TYPE — cx=496.69, top=226.7 Maximum / 233.7 Others
  loan_amount_type: {
    'Maximum Loan Amount':                 { page: 0, x: 493, y: slf089CheckY(226.7) },
    'Others (specify in Desired Amount)':  { page: 0, x: 493, y: slf089CheckY(233.7) },
  },
  // LOAN PURPOSE — top=273.0 (Educational=407, Healthcare=496), top=279.9 (Medical=407)
  loan_purpose: {
    'Educational Expenses':               { page: 0, x: 403, y: slf089CheckY(273.0) },
    'Healthcare Plan from accredited HMO':{ page: 0, x: 493, y: slf089CheckY(273.0) },
    'Medical Expenses':                   { page: 0, x: 403, y: slf089CheckY(279.9) },
  },
  // LOAN TERM — top=294.2 (Six=407, Twenty-four=496), top=301.2 (Twelve=407, Thirty-six=496)
  loan_term: {
    'Six (6) Months':         { page: 0, x: 403, y: slf089CheckY(294.2) },
    'Twenty-four (24) Months':{ page: 0, x: 493, y: slf089CheckY(294.2) },
    'Twelve (12) Months':     { page: 0, x: 403, y: slf089CheckY(301.2) },
    'Thirty-six (36) Months': { page: 0, x: 493, y: slf089CheckY(301.2) },
  },
};

// ── Pag-IBIG SLF-065 (MPL) — calibrated coords (612×936, page 0 only) ────────
// pdfplumber row tops: 44, 67, 88, 109, 129, 151, 172, 193, 214, 235, 259, 280.
// V-cols: 18, 146, 199, 234, 264, 319, 393, 497, 596 (combined cells in some rows).
// Whole-cell text fills (no per-digit boxes).
const SLF065_PAGE_H = 936.0;
const slf065Y = (nextRowTop: number) => SLF065_PAGE_H - nextRowTop + 3;

const SLF_065_Y_HEADER  = slf065Y(67);   // 872  — MID / App No
const SLF_065_Y_NAMES   = slf065Y(88);   // 851  — Names row
const SLF_065_Y_PERSON  = slf065Y(109);  // 830  — Mother/Nat'l/Sex/Marital/Citizen/Email
const SLF_065_Y_PERM1   = slf065Y(129);  // 810  — Permanent address row 1
const SLF_065_Y_PERM2   = slf065Y(151);  // 788  — Permanent address row 2
const SLF_065_Y_PRES1   = slf065Y(172);  // 767  — Present address row 1
const SLF_065_Y_PRES2   = slf065Y(193);  // 746  — Present address row 2
const SLF_065_Y_EMP1    = slf065Y(214);  // 725  — Employer name
const SLF_065_Y_EMP2    = slf065Y(235);  // 704  — Employer address row 1
const SLF_065_Y_EMP3    = slf065Y(259);  // 680  — Employer address row 2
const SLF_065_Y_EMP4    = slf065Y(280);  // 659  — Employee ID / DOE / Source of fund

const SLF065_FIELD_COORDS: CoordsMap = {
  // Header — MID and Application No
  mid_no:          { page: 0, x: 397, y: SLF_065_Y_HEADER, fontSize: 9, maxWidth: 98 },
  application_no:  { page: 0, x: 499, y: SLF_065_Y_HEADER, fontSize: 9, maxWidth: 95 },

  // Names row (top=67-88) — V-cols 18,146,199,234,264,319,393,497
  last_name:                { page: 0, x: 23,  y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 53 },
  first_name:               { page: 0, x: 78,  y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 55 },
  ext_name:                 { page: 0, x: 137, y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 60 },
  middle_name:              { page: 0, x: 204, y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 50 },
  no_maiden_middle_name:    { page: 0, x: 257, y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 67 },
  dob:                      { page: 0, x: 397, y: SLF_065_Y_NAMES, fontSize: 9, maxWidth: 98 },
  place_of_birth:           { page: 0, x: 499, y: SLF_065_Y_NAMES, fontSize: 8, maxWidth: 95 },

  // Personal info (top=88-109)
  mothers_maiden_name:      { page: 0, x: 22,  y: SLF_065_Y_PERSON, fontSize: 8, maxWidth: 122 },
  nationality:              { page: 0, x: 148, y: SLF_065_Y_PERSON, fontSize: 8, maxWidth: 48 },
  citizenship:              { page: 0, x: 397, y: SLF_065_Y_PERSON, fontSize: 8, maxWidth: 98 },
  email:                    { page: 0, x: 499, y: SLF_065_Y_PERSON, fontSize: 7.5, maxWidth: 95 },

  // Permanent address row 1 (top=109-129)
  perm_unit:                { page: 0, x: 22,  y: SLF_065_Y_PERM1, fontSize: 7.5, maxWidth: 368 },
  perm_cell_phone:          { page: 0, x: 397, y: SLF_065_Y_PERM1, fontSize: 9, maxWidth: 98 },
  perm_home_tel:            { page: 0, x: 499, y: SLF_065_Y_PERM1, fontSize: 9, maxWidth: 95 },

  // Permanent address row 2 (top=129-151)
  perm_street:              { page: 0, x: 22,  y: SLF_065_Y_PERM2, fontSize: 8, maxWidth: 56 },
  perm_subdivision:         { page: 0, x: 80,  y: SLF_065_Y_PERM2, fontSize: 8, maxWidth: 47 },
  perm_barangay:            { page: 0, x: 130, y: SLF_065_Y_PERM2, fontSize: 8, maxWidth: 45 },
  perm_city:                { page: 0, x: 178, y: SLF_065_Y_PERM2, fontSize: 8, maxWidth: 56 },
  perm_province:            { page: 0, x: 238, y: SLF_065_Y_PERM2, fontSize: 8, maxWidth: 108 },
  perm_zip:                 { page: 0, x: 350, y: SLF_065_Y_PERM2, fontSize: 9, maxWidth: 38 },
  perm_tin:                 { page: 0, x: 397, y: SLF_065_Y_PERM2, fontSize: 9, maxWidth: 98 },
  perm_sss_gsis:            { page: 0, x: 499, y: SLF_065_Y_PERM2, fontSize: 9, maxWidth: 95 },

  // Present address row 1 (top=151-172)
  pres_unit:                { page: 0, x: 22,  y: SLF_065_Y_PRES1, fontSize: 7.5, maxWidth: 368 },
  pres_business_tel:        { page: 0, x: 397, y: SLF_065_Y_PRES1, fontSize: 9, maxWidth: 98 },
  pres_nature_of_work:      { page: 0, x: 499, y: SLF_065_Y_PRES1, fontSize: 8, maxWidth: 95 },

  // Present address row 2 (top=172-193)
  pres_street:              { page: 0, x: 22,  y: SLF_065_Y_PRES2, fontSize: 8, maxWidth: 56 },
  pres_subdivision:         { page: 0, x: 80,  y: SLF_065_Y_PRES2, fontSize: 8, maxWidth: 47 },
  pres_barangay:            { page: 0, x: 130, y: SLF_065_Y_PRES2, fontSize: 8, maxWidth: 45 },
  pres_city:                { page: 0, x: 178, y: SLF_065_Y_PRES2, fontSize: 8, maxWidth: 56 },
  pres_province:            { page: 0, x: 238, y: SLF_065_Y_PRES2, fontSize: 8, maxWidth: 108 },
  pres_zip:                 { page: 0, x: 350, y: SLF_065_Y_PRES2, fontSize: 9, maxWidth: 38 },
  // DESIRED LOAN AMOUNT cell has two checkbox options (Maximum / Others) plus an
  // 'Others, specify: ______' fill-in line at x=550.7-589.3, top≈187.8.
  // Render the numeric amount ON that underline. See L-SLF065-R3-03.
  desired_loan_amount:      { page: 0, x: 552, y: 741, fontSize: 8, maxWidth: 38 },

  // Employer name (top=193-214)
  employer_name:            { page: 0, x: 22,  y: SLF_065_Y_EMP1, fontSize: 8, maxWidth: 368 },

  // Employer address row 1 (top=214-235)
  employer_address_line:    { page: 0, x: 22,  y: SLF_065_Y_EMP2, fontSize: 7.5, maxWidth: 368 },

  // Employer address row 2 (top=235-259)
  employer_subdivision:     { page: 0, x: 22,  y: SLF_065_Y_EMP3, fontSize: 8, maxWidth: 46 },
  employer_barangay:        { page: 0, x: 70,  y: SLF_065_Y_EMP3, fontSize: 8, maxWidth: 46 },
  employer_city:            { page: 0, x: 118, y: SLF_065_Y_EMP3, fontSize: 8, maxWidth: 60 },
  employer_province:        { page: 0, x: 180, y: SLF_065_Y_EMP3, fontSize: 8, maxWidth: 160 },
  employer_zip:             { page: 0, x: 344, y: SLF_065_Y_EMP3, fontSize: 9, maxWidth: 46 },

  // Employment info (top=259-280)
  employee_id_no:           { page: 0, x: 22,  y: SLF_065_Y_EMP4, fontSize: 8, maxWidth: 124 },
  date_of_employment:       { page: 0, x: 148, y: SLF_065_Y_EMP4, fontSize: 9, maxWidth: 115 },
  source_of_fund:           { page: 0, x: 265, y: SLF_065_Y_EMP4, fontSize: 8, maxWidth: 124 },

  // Bank/Branch label is at row top=352, fields below it. y_lib ≈ 936 - 365 = 571
  payroll_bank_name:        { page: 0, x: 470, y: 571, fontSize: 9, maxWidth: 120 },

  // Signature date — bottom signature block, around top=816 → y ≈ 117
  signature_date:           { page: 0, x: 470, y: 110, fontSize: 9, maxWidth: 110 },
};

const SLF065_SKIP_VALUES: Record<string, string[]> = {
  application_no: [''],
  ext_name: ['', 'N/A'],
  middle_name: [''],
  no_maiden_middle_name: [''],
  same_as_permanent: [], // UI-only mirror toggle (drives perm→pres copy; not rendered to PDF)
  perm_subdivision: [''],
  perm_home_tel: [''],
  perm_sss_gsis: [''],
  pres_unit: [''],
  pres_street: [''],
  pres_subdivision: [''],
  pres_barangay: [''],
  pres_city: [''],
  pres_province: [''],
  pres_zip: [''],
  pres_business_tel: [''],
  employer_subdivision: [''],
  employer_zip: [''],
  employee_id_no: [''],
  payroll_bank_name: [''],
  // Iteration 2: sex / marital / loan_purpose / loan_term are now checkboxes.
  sex: ['', 'N/A'],
  marital_status: ['', 'N/A'],
  loan_term: ['', 'N/A'],
  loan_purpose: ['', 'N/A'],
  // Iteration 3
  source_of_referral: ['', 'N/A'],
};

// ── SLF-065 checkbox coords (Iteration 2) ────────────────────────────────
// \uf0a8 glyph (page 0, h=936). Formula: y_lib = 936 - top - 7; x = cx - 4.
const slf065CheckY = (top: number) => SLF065_PAGE_H - top - 7;
const SLF065_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // SEX — top=96.4 Male / 103.4 Female, cx=203.36
  sex: {
    'Male':   { page: 0, x: 199, y: slf065CheckY(96.4) },
    'Female': { page: 0, x: 199, y: slf065CheckY(103.4) },
  },
  // MARITAL STATUS — row1 top=96.4 (Single=238.67 / Widow/er=309.59 / Annulled=366.25)
  //                  row2 top=103.2 (Married=238.67 / Legally Separated=309.59)
  marital_status: {
    'Single/Unmarried':  { page: 0, x: 235, y: slf065CheckY(96.4) },
    'Widow/er':          { page: 0, x: 306, y: slf065CheckY(96.4) },
    'Annulled':          { page: 0, x: 362, y: slf065CheckY(96.4) },
    'Married':           { page: 0, x: 235, y: slf065CheckY(103.2) },
    'Legally Separated': { page: 0, x: 306, y: slf065CheckY(103.2) },
  },
  // LOAN TERM — top=180.1 (One=397.90 / Three=449.74 / Maximum=501.13)
  //             top=187.0 (Two=397.90 / Others=501.13)
  loan_term: {
    'One (1) Year':        { page: 0, x: 394, y: slf065CheckY(180.1) },
    'Three (3) Years':     { page: 0, x: 446, y: slf065CheckY(180.1) },
    'Maximum Loan Amount': { page: 0, x: 497, y: slf065CheckY(180.1) },
    'Two (2) Years':       { page: 0, x: 394, y: slf065CheckY(187.0) },
    'Others':              { page: 0, x: 497, y: slf065CheckY(187.0) },
  },
  // LOAN PURPOSE — left column cx=398.12 / right column cx=528.35
  loan_purpose: {
    'Livelihood / additional capital in small business': { page: 0, x: 394, y: slf065CheckY(211.7) },
    'Vacation / travel':                                 { page: 0, x: 524, y: slf065CheckY(212.9) },
    'Special events':                                    { page: 0, x: 524, y: slf065CheckY(220.3) },
    'Tuition / Educational Expenses':                    { page: 0, x: 394, y: slf065CheckY(226.7) },
    'Car repair':                                        { page: 0, x: 524, y: slf065CheckY(227.8) },
    'Payment of utility / credit card bills':            { page: 0, x: 394, y: slf065CheckY(234.1) },
    'Health & wellness':                                 { page: 0, x: 524, y: slf065CheckY(235.3) },
    'Purchase of appliance & furniture / electronic gadgets': { page: 0, x: 394, y: slf065CheckY(241.6) },
    'Minor home improvement / home renovation / upgrades':    { page: 0, x: 394, y: slf065CheckY(264.1) },
    'Others':                                            { page: 0, x: 524, y: slf065CheckY(257.8) },
  },
  // SOURCE OF REFERRAL / "How did you hear about us?" (bottom of page 0)
  // Row tops 798.9 / 805.7 ; cols cx≈24 / 110 / 176 / 294 / 382 / 489
  // Page 0, h=936, \uf0a8 Wingdings (-7 offset)
  // Calibrated 2026-04: +3 x to center ticks on printed source-of-referral boxes.
  source_of_referral: {
    'Pag-IBIG Fund Website':        { page: 0, x:  23, y: slf065CheckY(798.9) },
    'Social media':                 { page: 0, x:  23, y: slf065CheckY(805.7) },
    'Radio':                        { page: 0, x: 109, y: slf065CheckY(798.9) },
    'Television':                   { page: 0, x: 109, y: slf065CheckY(805.7) },
    'Streaming Service Ad':         { page: 0, x: 175, y: slf065CheckY(798.9) },
    'Newspaper/Online Newspaper':   { page: 0, x: 175, y: slf065CheckY(805.7) },
    'Billboard':                    { page: 0, x: 293, y: slf065CheckY(798.9) },
    'Word of Mouth':                { page: 0, x: 293, y: slf065CheckY(805.7) },
    'Referral':                     { page: 0, x: 381, y: slf065CheckY(798.9) },
    'Employer/Fund Coordinator':    { page: 0, x: 381, y: slf065CheckY(805.7) },
    'Others':                       { page: 0, x: 488, y: slf065CheckY(798.9) },
  },
};

// ── Pag-IBIG HLF-868 (HEAL Co-Borrower) — coords (612×792, page 0 only) ──────
// pdfplumber row tops (page 0): 88, 107, 120, 125, 129, 147, 178, 217, 248, 275,
//   307, 336, 348, 365, 398, 419, 451, 483, 513, 594, 612, 641, 669, 701, 737, 767.
// Whole-cell text fills. y_lib = 792 - next_row_top + 3.
const HLF868_PAGE_H = 792.0;
const hlf868Y = (nextRowTop: number) => HLF868_PAGE_H - nextRowTop + 3;

const HLF_868_Y_HEADER  = hlf868Y(147);  // ~648  — header row (MID/Housing) extends to names label
const HLF_868_Y_NAMES   = hlf868Y(178);  // ~617  — Names
const HLF_868_Y_PERSON  = hlf868Y(217);  // ~578  — DOB/Citizenship/Sex/Marital
const HLF_868_Y_PERM1   = hlf868Y(248);  // ~547  — Permanent address row 1
const HLF_868_Y_PERM2   = hlf868Y(275);  // ~520  — Permanent address row 2
const HLF_868_Y_PRES1   = hlf868Y(307);  // ~488  — Present address row 1
const HLF_868_Y_PRES2   = hlf868Y(336);  // ~459  — Present address row 2
const HLF_868_Y_HOME    = hlf868Y(365);  // ~430  — Home ownership / years / email
const HLF_868_Y_OCC     = hlf868Y(398);  // ~397  — Occupation / TIN / SSS / Employer tel
const HLF_868_Y_EMP1    = hlf868Y(419);  // ~376  — Employer name
const HLF_868_Y_EMP2    = hlf868Y(451);  // ~344  — Employer addr row 1 / email
const HLF_868_Y_EMP3    = hlf868Y(483);  // ~312  — Employer addr row 2
const HLF_868_Y_POS     = hlf868Y(513);  // ~282  — Position / time / place / years / dependents

const HLF868_FIELD_COORDS: CoordsMap = {
  // Header (top=120-147, MID and Housing labels at top=88+107)
  // Cells fill below labels: y = 792-147+3 = 648
  mid_no:                { page: 0, x: 240, y: HLF_868_Y_HEADER, fontSize: 9, maxWidth: 175 },
  housing_account_no:    { page: 0, x: 420, y: HLF_868_Y_HEADER, fontSize: 9, maxWidth: 168 },

  // Co-borrower names (top=147-178)
  // V-cols around 27, 219, 296, 388, 525 (last col reserved for ID PHOTO 1x1)
  last_name:             { page: 0, x: 30,  y: HLF_868_Y_NAMES, fontSize: 8, maxWidth: 95 },
  first_name:            { page: 0, x: 130, y: HLF_868_Y_NAMES, fontSize: 8, maxWidth: 85 },
  ext_name:              { page: 0, x: 220, y: HLF_868_Y_NAMES, fontSize: 8, maxWidth: 70 },
  middle_name:           { page: 0, x: 297, y: HLF_868_Y_NAMES, fontSize: 8, maxWidth: 86 },
  maiden_middle_name:    { page: 0, x: 388, y: HLF_868_Y_NAMES, fontSize: 8, maxWidth: 130 },

  // Personal/DOB row (top=178-217) — sex/relation/marital are checkbox clusters (skip)
  proportionate_share:   { page: 0, x: 30,  y: HLF_868_Y_PERSON, fontSize: 9, maxWidth: 60 },
  dob:                   { page: 0, x: 93,  y: HLF_868_Y_PERSON, fontSize: 9, maxWidth: 65 },
  citizenship:           { page: 0, x: 162, y: HLF_868_Y_PERSON, fontSize: 8, maxWidth: 55 },

  // Permanent Address row 1 (top=228-248)
  perm_unit:             { page: 0, x: 30,  y: HLF_868_Y_PERM1, fontSize: 7.5, maxWidth: 395 },
  perm_country_tel:      { page: 0, x: 449, y: HLF_868_Y_PERM1, fontSize: 9, maxWidth: 138 },

  // Permanent Address row 2 (top=251-275)
  perm_street:           { page: 0, x: 30,  y: HLF_868_Y_PERM2, fontSize: 8, maxWidth: 60 },
  perm_subdivision:      { page: 0, x: 92,  y: HLF_868_Y_PERM2, fontSize: 8, maxWidth: 30 },
  perm_barangay:         { page: 0, x: 124, y: HLF_868_Y_PERM2, fontSize: 8, maxWidth: 70 },
  perm_city:             { page: 0, x: 196, y: HLF_868_Y_PERM2, fontSize: 8, maxWidth: 75 },
  perm_province:         { page: 0, x: 273, y: HLF_868_Y_PERM2, fontSize: 8, maxWidth: 120 },
  perm_zip:              { page: 0, x: 395, y: HLF_868_Y_PERM2, fontSize: 9, maxWidth: 50 },
  perm_home_tel:         { page: 0, x: 449, y: HLF_868_Y_PERM2, fontSize: 9, maxWidth: 138 },

  // Present Address row 1 (top=287-307)
  pres_unit:             { page: 0, x: 30,  y: HLF_868_Y_PRES1, fontSize: 7.5, maxWidth: 395 },
  pres_business_tel:     { page: 0, x: 449, y: HLF_868_Y_PRES1, fontSize: 9, maxWidth: 138 },

  // Present Address row 2 (top=310-336)
  pres_street:           { page: 0, x: 30,  y: HLF_868_Y_PRES2, fontSize: 8, maxWidth: 60 },
  pres_subdivision:      { page: 0, x: 92,  y: HLF_868_Y_PRES2, fontSize: 8, maxWidth: 30 },
  pres_barangay:         { page: 0, x: 124, y: HLF_868_Y_PRES2, fontSize: 8, maxWidth: 70 },
  pres_city:             { page: 0, x: 196, y: HLF_868_Y_PRES2, fontSize: 8, maxWidth: 75 },
  pres_province:         { page: 0, x: 273, y: HLF_868_Y_PRES2, fontSize: 8, maxWidth: 120 },
  pres_zip:              { page: 0, x: 395, y: HLF_868_Y_PRES2, fontSize: 9, maxWidth: 50 },
  pres_cellphone:        { page: 0, x: 449, y: HLF_868_Y_PRES2, fontSize: 9, maxWidth: 138 },

  // Home Ownership / Years stay / Email (top=336-365)
  years_stay_present:    { page: 0, x: 320, y: HLF_868_Y_HOME, fontSize: 9, maxWidth: 70 },
  email_address:         { page: 0, x: 449, y: HLF_868_Y_HOME, fontSize: 7.5, maxWidth: 138 },

  // Occupation / TIN / SSS / Employer business tel (top=365-398)
  occupation:            { page: 0, x: 30,  y: HLF_868_Y_OCC, fontSize: 8, maxWidth: 124 },
  tin:                   { page: 0, x: 156, y: HLF_868_Y_OCC, fontSize: 9, maxWidth: 140 },
  sss_gsis:              { page: 0, x: 298, y: HLF_868_Y_OCC, fontSize: 9, maxWidth: 145 },
  employer_business_tel: { page: 0, x: 449, y: HLF_868_Y_OCC, fontSize: 9, maxWidth: 138 },

  // Employer name (top=402-419)
  employer_name:         { page: 0, x: 30,  y: HLF_868_Y_EMP1, fontSize: 8, maxWidth: 395 },

  // Employer address row 1 + email (top=426-451)
  employer_address_line: { page: 0, x: 30,  y: HLF_868_Y_EMP2, fontSize: 7.5, maxWidth: 395 },
  employer_email:        { page: 0, x: 449, y: HLF_868_Y_EMP2, fontSize: 7.5, maxWidth: 138 },

  // Employer address row 2 (top=453-483)
  employer_subdivision:  { page: 0, x: 30,  y: HLF_868_Y_EMP3, fontSize: 8, maxWidth: 90 },
  employer_barangay:     { page: 0, x: 124, y: HLF_868_Y_EMP3, fontSize: 8, maxWidth: 70 },
  employer_city:         { page: 0, x: 196, y: HLF_868_Y_EMP3, fontSize: 8, maxWidth: 75 },
  employer_province:     { page: 0, x: 273, y: HLF_868_Y_EMP3, fontSize: 8, maxWidth: 120 },
  employer_zip:          { page: 0, x: 395, y: HLF_868_Y_EMP3, fontSize: 9, maxWidth: 50 },

  // Position / Preferred time / Place / Years / Dependents (top=485-513)
  position_dept:         { page: 0, x: 30,  y: HLF_868_Y_POS, fontSize: 8, maxWidth: 115 },
  preferred_time_contact:{ page: 0, x: 147, y: HLF_868_Y_POS, fontSize: 8, maxWidth: 110 },
  place_assignment:      { page: 0, x: 258, y: HLF_868_Y_POS, fontSize: 8, maxWidth: 118 },
  years_employment:      { page: 0, x: 378, y: HLF_868_Y_POS, fontSize: 9, maxWidth: 80 },
  no_dependents:         { page: 0, x: 460, y: HLF_868_Y_POS, fontSize: 9, maxWidth: 130 },

  // Signature date — page 1 (Letter, h=792). DATE label at top=496 → y_lib ≈ 290
  signature_date:        { page: 1, x: 100, y: 285, fontSize: 9, maxWidth: 130 },
};

const HLF868_SKIP_VALUES: Record<string, string[]> = {
  housing_account_no: [''],
  ext_name: ['', 'N/A'],
  middle_name: [''],
  maiden_middle_name: [''],
  perm_subdivision: [''],
  perm_country_tel: [''],
  perm_home_tel: [''],
  pres_unit: [''],
  pres_street: [''],
  pres_subdivision: [''],
  pres_barangay: [''],
  pres_city: [''],
  pres_province: [''],
  pres_zip: [''],
  pres_business_tel: [''],
  years_stay_present: [''],
  sss_gsis: [''],
  employer_subdivision: [''],
  employer_zip: [''],
  employer_business_tel: [''],
  employer_email: [''],
  preferred_time_contact: [''],
  place_assignment: [''],
  // Iteration 2 checkbox fields
  sex: ['', 'N/A'],
  marital_status: ['', 'N/A'],
  relationship_to_principal: ['', 'N/A'],
  home_ownership: ['', 'N/A'],
  employment_type: ['', 'N/A'],
  mailing_preference: ['', 'N/A'],
  // Iteration 3
  industry_category: ['', 'N/A'],
};

// ── HLF-868 checkbox coords (Iteration 2) ────────────────────────────────
// \uf071 Wingdings 'q' glyph (smaller box). Page 0, h=792.
// Formula: y_lib = 792 - top - 6 (smaller glyph than \uf0a8 — use -6 offset).
const hlf868CheckY = (top: number) => HLF868_PAGE_H - top - 6;
const HLF868_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // SEX — top=189.7 Male / 198.6 Female, cx=225.51
  sex: {
    'Male':   { page: 0, x: 221, y: hlf868CheckY(189.7) },
    'Female': { page: 0, x: 221, y: hlf868CheckY(198.6) },
  },
  // MARITAL STATUS — row1 top=189.8 (Single=398.02, Legally Separated=454.78)
  //                  row2 top=196.7 (Married=398.02, Annulled=455.50)
  //                  row3 top=203.6 (Widow/er=398.02)
  marital_status: {
    'Single/Unmarried':   { page: 0, x: 394, y: hlf868CheckY(189.8) },
    'Legally Separated':  { page: 0, x: 451, y: hlf868CheckY(189.8) },
    'Married':            { page: 0, x: 394, y: hlf868CheckY(196.7) },
    'Annulled/Nullified': { page: 0, x: 451, y: hlf868CheckY(196.7) },
    'Widow/er':           { page: 0, x: 394, y: hlf868CheckY(203.6) },
  },
  // RELATIONSHIP TO PRINCIPAL — row1 top=195.5 (Spouse=270.92, Parent=323.96)
  //                              row2 top=202.5 (Son/Daughter=270.92, Other=323.36)
  //                              row3 top=209.3 (Brother/Sister=270.92)
  relationship_to_principal: {
    'Spouse':           { page: 0, x: 267, y: hlf868CheckY(195.5) },
    'Parent':           { page: 0, x: 320, y: hlf868CheckY(195.5) },
    'Son/Daughter':     { page: 0, x: 267, y: hlf868CheckY(202.5) },
    'Other':            { page: 0, x: 320, y: hlf868CheckY(202.5) },
    'Brother/Sister':   { page: 0, x: 267, y: hlf868CheckY(209.3) },
  },
  // HOME OWNERSHIP — row1 top=345.4 (Owned=33.70, Company=110.88, Living=219.87)
  //                  row2 top=354.4 (Mortgaged=33.22, Rented=110.40)
  home_ownership: {
    'Owned':                         { page: 0, x:  30, y: hlf868CheckY(345.4) },
    'Company-Provided':              { page: 0, x: 107, y: hlf868CheckY(345.4) },
    'Living with relatives/parents': { page: 0, x: 216, y: hlf868CheckY(345.4) },
    'Mortgaged':                     { page: 0, x:  30, y: hlf868CheckY(354.4) },
    'Rented':                        { page: 0, x: 107, y: hlf868CheckY(354.4) },
  },
  // EMPLOYMENT TYPE — col cx=33.70 at tops 374.6 / 382.6 / 390.6
  employment_type: {
    'Locally Employed':           { page: 0, x: 30, y: hlf868CheckY(374.6) },
    'Self-Employed':              { page: 0, x: 30, y: hlf868CheckY(382.6) },
    'Overseas Filipino Worker':   { page: 0, x: 30, y: hlf868CheckY(390.6) },
  },
  // MAILING PREFERENCE — cx=454.76 at tops 460.6 / 468.1 / 475.6
  mailing_preference: {
    'Permanent Home Address':    { page: 0, x: 451, y: hlf868CheckY(460.6) },
    'Present Home Address':      { page: 0, x: 451, y: hlf868CheckY(468.1) },
    'Employer/Business Address': { page: 0, x: 451, y: hlf868CheckY(475.6) },
  },
  // INDUSTRY / NATURE OF BUSINESS — 4-col × 8-row grid (\uf0a8 Wingdings)
  // Columns cx: 28.80 / 168.86 / 313.13 / 415.39 ; page 0, h=792 (-7 offset)
  // Calibrated 2026-04: each column x +3 to align tick with box center.
  industry_category: {
    'Accounting':                                   { page: 0, x:  28, y: hlf868CheckY(522.7) },
    'Activities of Private Households as Employers':{ page: 0, x:  28, y: hlf868CheckY(530.7) },
    'Agriculture, Hunting, Forestry & Fishing':     { page: 0, x:  28, y: hlf868CheckY(562.9) },
    'Basic Materials':                              { page: 0, x:  28, y: hlf868CheckY(570.9) },
    'Construction':                                 { page: 0, x:  28, y: hlf868CheckY(578.9) },
    'Business Process Outsourcing (BPO)':           { page: 0, x: 168, y: hlf868CheckY(522.7) },
    'Education & Training':                         { page: 0, x: 168, y: hlf868CheckY(530.7) },
    'Electricity, Gas and Water Supply':            { page: 0, x: 168, y: hlf868CheckY(538.7) },
    'Extra-Territorial Organization & Bodies':      { page: 0, x: 168, y: hlf868CheckY(546.8) },
    'Financial Services/Intermediation':            { page: 0, x: 168, y: hlf868CheckY(554.8) },
    'HR/Recruitment':                               { page: 0, x: 168, y: hlf868CheckY(562.9) },
    'Life Sciences':                                { page: 0, x: 168, y: hlf868CheckY(570.9) },
    'Health and Social Work':                       { page: 0, x: 312, y: hlf868CheckY(522.7) },
    'Health and Medical Services':                  { page: 0, x: 312, y: hlf868CheckY(530.7) },
    'Management':                                   { page: 0, x: 312, y: hlf868CheckY(546.8) },
    'Manufacturing':                                { page: 0, x: 312, y: hlf868CheckY(554.8) },
    'Media':                                        { page: 0, x: 312, y: hlf868CheckY(562.9) },
    'Mining and Quarrying':                         { page: 0, x: 312, y: hlf868CheckY(570.9) },
    'Technology':                                   { page: 0, x: 312, y: hlf868CheckY(578.9) },
    'Other Community, Social & Personal Service Activities': { page: 0, x: 415, y: hlf868CheckY(522.7) },
    'Public Administration & Defense':              { page: 0, x: 415, y: hlf868CheckY(538.7) },
    'Social Security':                              { page: 0, x: 415, y: hlf868CheckY(546.8) },
    'Transport, Storage and Communications':        { page: 0, x: 415, y: hlf868CheckY(554.8) },
    'Travel and Leisure':                           { page: 0, x: 415, y: hlf868CheckY(562.9) },
    'Wholesale & Retail Trade':                     { page: 0, x: 415, y: hlf868CheckY(570.9) },
  },
};

// ── Pag-IBIG HLF-858 (HEAL Principal) — coords (612×792, page 0 only) ────────
// pdfplumber row tops (page 0): 75, 94, 107, 112, 118, 136, 168, 177, 213, 239,
//   265, 282, 315, 349, 380, 403, 436, 466, 484, 503, 540, 569, 605, 642, 677, 748.
// Layout: top has LOAN PARTICULARS section (mostly checkboxes); PRINCIPAL
// BORROWER'S DATA starts at top=271. Same structural pattern as HLF-868.
const HLF858_PAGE_H = 792.0;
const hlf858Y = (nextRowTop: number) => HLF858_PAGE_H - nextRowTop + 3;

const HLF_858_Y_HEADER  = hlf858Y(136);  // Header MID/Housing label row 94→136
const HLF_858_Y_LOAN    = hlf858Y(168);  // Desired Loan Amount cell (top=147→168)
const HLF_858_Y_NAMES   = hlf858Y(315);  // Names (top=287→315)
const HLF_858_Y_PERSON  = hlf858Y(349);  // DOB/Citizenship/Marital/No.Dep (top=318→349)
const HLF_858_Y_PERM1   = hlf858Y(380);  // Permanent address row 1
const HLF_858_Y_PERM2   = hlf858Y(403);  // Permanent address row 2
const HLF_858_Y_PRES1   = hlf858Y(436);  // Present address row 1
const HLF_858_Y_PRES2   = hlf858Y(466);  // Present address row 2
const HLF_858_Y_HOME    = hlf858Y(503);  // Home ownership / years / email
const HLF_858_Y_OCC     = hlf858Y(540);  // Occupation / TIN / SSS / Employer tel
const HLF_858_Y_EMP1    = hlf858Y(569);  // Employer name + email
const HLF_858_Y_EMP2    = hlf858Y(605);  // Employer addr row 1
const HLF_858_Y_EMP3    = hlf858Y(642);  // Employer addr row 2
const HLF_858_Y_POS     = hlf858Y(677);  // Position / time / place / years

const HLF858_FIELD_COORDS: CoordsMap = {
  // Header digit boxes — MID (14 cells) and Housing (14 cells) at top=94.5-107.1.
  //   baseline y = 792 - 107.1 + (12.6-6.3)/2 ≈ 687.75
  // MID / HOUSING: 4-4-4 format with pre-printed dash cells (gray) at source indices 4 and 9.
  // Only provide 12 boxCenters (digit cells only, skipping the 2 dash cells).
  mid_no: {
    page: 0, x: 0, y: 687.75, fontSize: 9,
    boxCenters: [
      253.43, 264.83, 276.05, 287.15,          // digits 1-4
      309.35, 320.45, 331.55, 342.67,          // digits 5-8  (skip dash cell cx=298.25)
      364.87, 375.97, 387.55, 399.07,          // digits 9-12 (skip dash cell cx=353.77)
    ],
  },
  housing_account_no: {
    page: 0, x: 0, y: 687.75, fontSize: 9,
    boxCenters: [
      432.85, 444.25, 455.47, 466.58,          // digits 1-4
      488.80, 499.90, 511.00, 522.10,          // digits 5-8  (skip gray dash cell cx=477.70)
      544.30, 555.40, 566.98, 578.50,          // digits 9-12 (skip gray dash cell cx=533.20)
    ],
  },

  // Loan particulars — only filling Desired Loan Amount text field (rest are checkboxes)
  desired_loan_amount:   { page: 0, x: 190, y: HLF_858_Y_LOAN, fontSize: 9, maxWidth: 130 },

  // Names row (top=287-315)
  last_name:             { page: 0, x: 30,  y: HLF_858_Y_NAMES, fontSize: 8, maxWidth: 105 },
  first_name:            { page: 0, x: 140, y: HLF_858_Y_NAMES, fontSize: 8, maxWidth: 105 },
  ext_name:              { page: 0, x: 250, y: HLF_858_Y_NAMES, fontSize: 8, maxWidth: 125 },
  middle_name:           { page: 0, x: 380, y: HLF_858_Y_NAMES, fontSize: 8, maxWidth: 130 },
  maiden_middle_name:    { page: 0, x: 515, y: HLF_858_Y_NAMES, fontSize: 8, maxWidth: 73 },

  // Personal/DOB row (top=318-349)
  dob:                   { page: 0, x: 30,  y: HLF_858_Y_PERSON, fontSize: 9, maxWidth: 165 },
  citizenship:           { page: 0, x: 200, y: HLF_858_Y_PERSON, fontSize: 8, maxWidth: 80 },
  no_dependents:         { page: 0, x: 490, y: HLF_858_Y_PERSON, fontSize: 9, maxWidth: 95 },

  // Permanent Address row 1 (top=362-380)
  perm_unit:             { page: 0, x: 30,  y: HLF_858_Y_PERM1, fontSize: 7.5, maxWidth: 395 },
  // Contact Details column — 3 stacked rows below their labels:
  //   HOME TEL     label top=378.8 → cell 387.8–400.6 → y=395 (country x=446, phone x=482)
  //   BUSINESS TEL label top=406.4 → cell 413.4–426.1 → y=369
  //   CELLPHONE    label top=431.7 → cell 438.2–451.0 → y=344 (phone slot only)
  //   E-MAIL       label top=459.9 → cell 467.7–480.4 → y=315 (wide single cell)
  perm_country_tel:      { page: 0, x: 446, y: 395, fontSize: 8, maxWidth: 29 },
  perm_home_tel:         { page: 0, x: 482, y: 395, fontSize: 9, maxWidth: 85 },
  perm_business_tel:     { page: 0, x: 482, y: 369, fontSize: 9, maxWidth: 85 },

  // Permanent Address row 2 (top=383-403) — left address subdiv→zip
  perm_street:           { page: 0, x: 30,  y: HLF_858_Y_PERM2, fontSize: 7, maxWidth: 60 },
  perm_subdivision:      { page: 0, x: 92,  y: HLF_858_Y_PERM2, fontSize: 5.5, maxWidth: 53 },
  perm_barangay:         { page: 0, x: 146, y: HLF_858_Y_PERM2, fontSize: 7, maxWidth: 48 },
  perm_city:             { page: 0, x: 196, y: HLF_858_Y_PERM2, fontSize: 8, maxWidth: 75 },
  perm_province:         { page: 0, x: 273, y: HLF_858_Y_PERM2, fontSize: 8, maxWidth: 120 },
  perm_zip:              { page: 0, x: 395, y: HLF_858_Y_PERM2, fontSize: 9, maxWidth: 50 },

  // Present Address row 1 (top=415-436)
  pres_unit:             { page: 0, x: 30,  y: HLF_858_Y_PRES1, fontSize: 7.5, maxWidth: 395 },
  // CELLPHONE NO (REQUIRED) cell: top=438.2–451.0 (phone slot) → y=344
  pres_cellphone:        { page: 0, x: 482, y: 344, fontSize: 9, maxWidth: 85 },

  // Present Address row 2 (top=438-466)
  pres_street:           { page: 0, x: 30,  y: HLF_858_Y_PRES2, fontSize: 7, maxWidth: 60 },
  pres_subdivision:      { page: 0, x: 92,  y: HLF_858_Y_PRES2, fontSize: 5.5, maxWidth: 53 },
  pres_barangay:         { page: 0, x: 146, y: HLF_858_Y_PRES2, fontSize: 7, maxWidth: 48 },
  pres_city:             { page: 0, x: 196, y: HLF_858_Y_PRES2, fontSize: 8, maxWidth: 75 },
  pres_province:         { page: 0, x: 273, y: HLF_858_Y_PRES2, fontSize: 8, maxWidth: 120 },
  pres_zip:              { page: 0, x: 395, y: HLF_858_Y_PRES2, fontSize: 9, maxWidth: 50 },
  // E-MAIL ADDRESS (REQUIRED) cell: top=467.7–480.4 → y=315
  email_address:         { page: 0, x: 445, y: 315, fontSize: 7.5, maxWidth: 138 },

  // Home ownership / years stay (top=466-503)
  years_stay_present:    { page: 0, x: 320, y: HLF_858_Y_HOME, fontSize: 9, maxWidth: 100 },

  // Occupation / TIN / SSS (top=503-540). Occupation text overlays the radio
  // column space; position at bottom-left of cell with small font to avoid
  // overlapping the employment-type radio labels (Locally/Self/OFW at top=514–532).
  occupation:            { page: 0, x: 30,  y: 248, fontSize: 6.5, maxWidth: 122 },
  tin:                   { page: 0, x: 156, y: HLF_858_Y_OCC, fontSize: 9, maxWidth: 145 },
  sss_gsis:              { page: 0, x: 305, y: HLF_858_Y_OCC, fontSize: 9, maxWidth: 138 },
  // Employer Contact Details (right side, separate section)
  //   Direct Line phone cell: top=575.3-589.6 → baseline y = 792-589.6+2.85 ≈ 205
  employer_business_tel: { page: 0, x: 475, y: 205, fontSize: 9, maxWidth: 88 },

  // Employer name (top=545-569)
  employer_name:         { page: 0, x: 30,  y: HLF_858_Y_EMP1, fontSize: 8, maxWidth: 395 },
  //   Employer Email cell: top=625.2-637.1 → baseline top 630 → y=159
  employer_email:        { page: 0, x: 442, y: 159, fontSize: 7.5, maxWidth: 120 },

  // Employer address row 1 (top=581-605)
  employer_address_line: { page: 0, x: 30,  y: HLF_858_Y_EMP2, fontSize: 7.5, maxWidth: 395 },

  // Employer address row 2 (top=605-642)
  employer_subdivision:  { page: 0, x: 30,  y: HLF_858_Y_EMP3, fontSize: 8, maxWidth: 90 },
  employer_barangay:     { page: 0, x: 124, y: HLF_858_Y_EMP3, fontSize: 8, maxWidth: 70 },
  employer_city:         { page: 0, x: 196, y: HLF_858_Y_EMP3, fontSize: 8, maxWidth: 75 },
  employer_province:     { page: 0, x: 273, y: HLF_858_Y_EMP3, fontSize: 8, maxWidth: 120 },
  employer_zip:          { page: 0, x: 395, y: HLF_858_Y_EMP3, fontSize: 9, maxWidth: 50 },

  // Position / Preferred time / Place / Years (top=644-678)
  position_dept:         { page: 0, x: 27,  y: HLF_858_Y_POS, fontSize: 8, maxWidth: 138 },
  preferred_time_contact:{ page: 0, x: 168, y: HLF_858_Y_POS, fontSize: 8, maxWidth: 110 },
  place_assignment:      { page: 0, x: 280, y: HLF_858_Y_POS, fontSize: 8, maxWidth: 130 },
  years_employment:      { page: 0, x: 415, y: HLF_858_Y_POS, fontSize: 9, maxWidth: 175 },

  // Signature date — page 2, on DATE underline below BORROWER signature (top~714 → y=75)
  signature_date:        { page: 1, x: 90, y: 75, fontSize: 9, maxWidth: 100 },

  // ── PAGE 2: Spouse's Personal Data (optional, populated when marital=Married)
  //   page size 612×792; labels at tops 60.7/91.7/127.5/159.9/194.3
  //   baselines ≈ label_top + 16 → y_pdf = 792 − (label_top + 16)
  //   Row 1 names (label top=60.7 → value top≈77 → y=715)
  spouse_last_name:      { page: 1, x: 30,  y: 715, fontSize: 8, maxWidth: 135 },
  spouse_first_name:     { page: 1, x: 170, y: 715, fontSize: 8, maxWidth: 135 },
  spouse_ext_name:       { page: 1, x: 312, y: 715, fontSize: 8, maxWidth: 150 },
  spouse_middle_name:    { page: 1, x: 468, y: 715, fontSize: 8, maxWidth: 120 },
  //   Row 2 DOB/Citizenship/TIN/Occupation (label top=91.7 → value y=684)
  spouse_dob:            { page: 1, x: 30,  y: 684, fontSize: 9, maxWidth: 135 },
  spouse_citizenship:    { page: 1, x: 170, y: 684, fontSize: 8, maxWidth: 135 },
  spouse_tin:            { page: 1, x: 312, y: 684, fontSize: 9, maxWidth: 120 },
  spouse_occupation:     { page: 1, x: 438, y: 665, fontSize: 6, maxWidth: 148 },
  //   Row 3 Employer name / Place / Years (label top=127.5 → value y=649)
  spouse_employer_name:  { page: 1, x: 30,  y: 649, fontSize: 8, maxWidth: 278 },
  spouse_place_assignment:{ page: 1, x: 312, y: 649, fontSize: 8, maxWidth: 120 },
  spouse_years_employment:{ page: 1, x: 438, y: 649, fontSize: 9, maxWidth: 148 },
  //   Row 4 Employer addr line + Position (label top=162.1 → value y=600)
  spouse_employer_address_line: { page: 1, x: 30, y: 600, fontSize: 7.5, maxWidth: 395 },
  spouse_position_dept:  { page: 1, x: 438, y: 614, fontSize: 8, maxWidth: 148 },
  //   Row 5 Employer subdiv/barangay/city/prov/zip + Business Tel (label top=194.3 → y=581)
  spouse_employer_subdivision: { page: 1, x: 30,  y: 581, fontSize: 7, maxWidth: 90 },
  spouse_employer_barangay:    { page: 1, x: 146, y: 581, fontSize: 6, maxWidth: 48 },
  spouse_employer_city:        { page: 1, x: 196, y: 581, fontSize: 8, maxWidth: 75 },
  spouse_employer_province:    { page: 1, x: 273, y: 581, fontSize: 8, maxWidth: 120 },
  spouse_employer_zip:         { page: 1, x: 395, y: 581, fontSize: 9, maxWidth: 40 },
  spouse_business_tel:         { page: 1, x: 438, y: 581, fontSize: 9, maxWidth: 148 },
};

const HLF858_SKIP_VALUES: Record<string, string[]> = {
  housing_account_no: [''],
  ext_name: ['', 'N/A'],
  middle_name: [''],
  maiden_middle_name: [''],
  // Spouse fields — all optional, skip when blank or N/A
  spouse_last_name: [''],
  spouse_first_name: [''],
  spouse_ext_name: ['', 'N/A'],
  spouse_middle_name: [''],
  spouse_dob: [''],
  spouse_citizenship: [''],
  spouse_tin: [''],
  spouse_occupation: [''],
  spouse_employer_name: [''],
  spouse_place_assignment: [''],
  spouse_years_employment: [''],
  spouse_employer_address_line: [''],
  spouse_position_dept: [''],
  spouse_employer_subdivision: [''],
  spouse_employer_barangay: [''],
  spouse_employer_city: [''],
  spouse_employer_province: [''],
  spouse_employer_zip: [''],
  spouse_business_tel: [''],
  perm_subdivision: [''],
  perm_country_tel: [''],
  perm_home_tel: [''],
  perm_business_tel: [''],
  pres_unit: [''],
  pres_street: [''],
  pres_subdivision: [''],
  pres_barangay: [''],
  pres_city: [''],
  pres_province: [''],
  pres_zip: [''],
  years_stay_present: [''],
  sss_gsis: [''],
  employer_subdivision: [''],
  employer_zip: [''],
  employer_business_tel: [''],
  employer_email: [''],
  preferred_time_contact: [''],
  place_assignment: [''],
  // Iteration 2 checkbox fields
  sex: ['', 'N/A'],
  marital_status: ['', 'N/A'],
  loan_purpose: ['', 'N/A'],
  loan_term: ['', 'N/A'],
  mode_of_payment: ['', 'N/A'],
  request_for_reinspection: ['', 'N/A'],
  home_ownership: ['', 'N/A'],
  employment_type: ['', 'N/A'],
  mailing_preference: ['', 'N/A'],
  // Iteration 3
  industry_category: ['', 'N/A'],
};

// ── HLF-858 checkbox coords (Iteration 2) ────────────────────────────────
// \uf071 Wingdings 'q' glyph. Page 0, h=792. Formula: y_lib = 792 - top - 6.
const hlf858CheckY = (top: number) => HLF858_PAGE_H - top - 6;
const HLF858_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // LOAN PURPOSE — left column cx=33.85
  loan_purpose: {
    'Home Improvement':                       { page: 0, x: 30, y: hlf858CheckY(146.2) },
    'Livelihood/additional capital for business': { page: 0, x: 30, y: hlf858CheckY(154.8) },
    'Educational expenses':                   { page: 0, x: 30, y: hlf858CheckY(163.4) },
    'Health and wellness':                    { page: 0, x: 30, y: hlf858CheckY(172.0) },
    'Travel and leisure':                     { page: 0, x: 30, y: hlf858CheckY(180.6) },
    'Special Events':                         { page: 0, x: 30, y: hlf858CheckY(189.2) },
    'Car Repair':                             { page: 0, x: 30, y: hlf858CheckY(197.9) },
    'Purchase of appliance/electronic gadgets': { page: 0, x: 30, y: hlf858CheckY(206.5) },
    'Purchase of memorial lot or columbary':  { page: 0, x: 30, y: hlf858CheckY(223.8) },
    'Payment of utilities/credit card bills': { page: 0, x: 30, y: hlf858CheckY(241.0) },
    'Others':                                 { page: 0, x: 30, y: hlf858CheckY(249.6) },
  },
  // LOAN TERM (years) — cx 334.14 / 374.24 / 414.32 at tops 186.4 / 195.0 / 203.6
  loan_term: {
    '1':  { page: 0, x: 330, y: hlf858CheckY(186.4) },
    '10': { page: 0, x: 370, y: hlf858CheckY(186.4) },
    '25': { page: 0, x: 410, y: hlf858CheckY(186.4) },
    '3':  { page: 0, x: 330, y: hlf858CheckY(195.0) },
    '15': { page: 0, x: 370, y: hlf858CheckY(195.0) },
    '30': { page: 0, x: 410, y: hlf858CheckY(195.0) },
    '5':  { page: 0, x: 330, y: hlf858CheckY(203.6) },
    '20': { page: 0, x: 370, y: hlf858CheckY(203.6) },
  },
  // MODE OF PAYMENT — right column
  mode_of_payment: {
    'Salary deduction':              { page: 0, x: 470, y: hlf858CheckY(179.5) },
    'Over-the-Counter':              { page: 0, x: 470, y: hlf858CheckY(188.0) },
    'Post-Dated Checks':             { page: 0, x: 480, y: hlf858CheckY(196.7) },
    'Cash/Check':                    { page: 0, x: 480, y: hlf858CheckY(205.3) },
    'Collecting Agent':              { page: 0, x: 470, y: hlf858CheckY(214.0) },
    'Bank':                          { page: 0, x: 480, y: hlf858CheckY(222.6) },
    'Credit to Disbursement Card':   { page: 0, x: 190, y: hlf858CheckY(229.4) },
    'Collection Partner':            { page: 0, x: 480, y: hlf858CheckY(231.2) },
    'Check Disbursement':            { page: 0, x: 190, y: hlf858CheckY(246.6) },
  },
  // REQUEST FOR RE-INSPECTION — top=199.0 YES=194.67 / NO=229.02
  request_for_reinspection: {
    'Yes': { page: 0, x: 191, y: hlf858CheckY(199.0) },
    'No':  { page: 0, x: 225, y: hlf858CheckY(199.0) },
  },
  // SEX — top=329.3 Male / 339.1 Female, cx=155.88
  sex: {
    'Male':   { page: 0, x: 152, y: hlf858CheckY(329.3) },
    'Female': { page: 0, x: 152, y: hlf858CheckY(339.1) },
  },
  // MARITAL STATUS — row1 top=326.9 (Single=290.79 / Annulled=367.25 / Widow/er=442.37)
  //                  row2 top=335.8 (Married=290.55 / Legally Separated=366.65)
  marital_status: {
    'Single/Unmarried':   { page: 0, x: 287, y: hlf858CheckY(326.9) },
    'Annulled':           { page: 0, x: 363, y: hlf858CheckY(326.9) },
    'Widow/er':           { page: 0, x: 438, y: hlf858CheckY(326.9) },
    'Married':            { page: 0, x: 287, y: hlf858CheckY(335.8) },
    'Legally Separated':  { page: 0, x: 363, y: hlf858CheckY(335.8) },
  },
  // HOME OWNERSHIP — row1 top=480.2 (Owned=31.78 / Company=109.20 / Living=218.43)
  //                  row2 top=489.2 (Mortgaged=31.30 / Rented=108.72)
  home_ownership: {
    'Owned':                         { page: 0, x:  28, y: hlf858CheckY(480.2) },
    'Company-Provided':              { page: 0, x: 105, y: hlf858CheckY(480.2) },
    'Living with relatives/parents': { page: 0, x: 215, y: hlf858CheckY(480.2) },
    'Mortgaged':                     { page: 0, x:  28, y: hlf858CheckY(489.2) },
    'Rented':                        { page: 0, x: 105, y: hlf858CheckY(489.2) },
  },
  // EMPLOYMENT TYPE — cx=32.26 at tops 514.2 / 523.1 / 532.0
  employment_type: {
    'Locally Employed':           { page: 0, x: 28, y: hlf858CheckY(514.2) },
    'Self-Employed':              { page: 0, x: 28, y: hlf858CheckY(523.1) },
    'Overseas Filipino Worker':   { page: 0, x: 28, y: hlf858CheckY(532.0) },
  },
  // MAILING PREFERENCE — cx=443.45 at tops 500.6 / 512.9 / 525.3
  mailing_preference: {
    'Permanent Home Address':    { page: 0, x: 440, y: hlf858CheckY(500.6) },
    'Present Home Address':      { page: 0, x: 440, y: hlf858CheckY(512.9) },
    'Employer/Business Address': { page: 0, x: 440, y: hlf858CheckY(525.3) },
  },
  // INDUSTRY / NATURE OF BUSINESS — 4-col × 7-row grid (\uf0a8 Wingdings)
  // Columns cx: 26.88 / 175.58 / 307 / 413.23 ; page 0, h=792 (-7 offset)
  // Calibrated 2026-04: each column x +3 to align tick with box center.
  industry_category: {
    'Accounting':                                   { page: 0, x:  26, y: hlf858CheckY(691.4) },
    'Activities of Private Households as Employers':{ page: 0, x:  26, y: hlf858CheckY(698.9) },
    'Agriculture, Hunting, Forestry & Fishing':     { page: 0, x:  26, y: hlf858CheckY(721.3) },
    'Basic Materials':                              { page: 0, x:  26, y: hlf858CheckY(728.7) },
    'Construction':                                 { page: 0, x:  26, y: hlf858CheckY(736.3) },
    'Business Process Outsourcing (BPO)':           { page: 0, x: 175, y: hlf858CheckY(691.4) },
    'Education & Training':                         { page: 0, x: 175, y: hlf858CheckY(698.9) },
    'Electricity, Gas and Water Supply':            { page: 0, x: 175, y: hlf858CheckY(706.3) },
    'Extra-Territorial Organization & Bodies':      { page: 0, x: 175, y: hlf858CheckY(713.9) },
    'Financial Services/Intermediation':            { page: 0, x: 175, y: hlf858CheckY(721.3) },
    'HR/Recruitment':                               { page: 0, x: 175, y: hlf858CheckY(728.7) },
    'Life Sciences':                                { page: 0, x: 175, y: hlf858CheckY(736.3) },
    'Health and Social Work':                       { page: 0, x: 306, y: hlf858CheckY(691.4) },
    'Management':                                   { page: 0, x: 306, y: hlf858CheckY(706.3) },
    'Manufacturing':                                { page: 0, x: 306, y: hlf858CheckY(713.9) },
    'Media':                                        { page: 0, x: 306, y: hlf858CheckY(721.3) },
    'Mining and Quarrying':                         { page: 0, x: 306, y: hlf858CheckY(728.7) },
    'Technology':                                   { page: 0, x: 306, y: hlf858CheckY(736.3) },
    'Other Community, Social & Personal Service Activities': { page: 0, x: 413, y: hlf858CheckY(691.4) },
    'Public Administration & Defense':              { page: 0, x: 413, y: hlf858CheckY(698.9) },
    'Transport, Storage and Communications':        { page: 0, x: 413, y: hlf858CheckY(713.9) },
    'Travel and Leisure':                           { page: 0, x: 413, y: hlf858CheckY(721.3) },
    'Wholesale & Retail Trade':                     { page: 0, x: 413, y: hlf858CheckY(728.7) },
  },
};

// ── Pag-IBIG HLF-068 (Housing Loan Application) — coords (612×936, page 0) ───
// pdfplumber row tops (page 0): 51, 61, 73, 76, 80, 95, 125, 155, 174, 214, 221,
//   237, 266, 288, 308, 337, 357, 369, 394, 434, 464, 500, 527, 544, 563, 583,
//   615, 643, 672, 717, 779, 793, 814, 835, 862, 892, 918.
// MVP fills BORROWER'S DATA section (rows 357-779).
const HLF068_PAGE_H = 936.0;
const hlf068Y = (nextRowTop: number) => HLF068_PAGE_H - nextRowTop + 3;

const HLF_068_Y_HEADER = hlf068Y(73);  // per-digit box row baseline (box row top ≈ 63, text baseline ≈ 73)
const HLF_068_Y_LOAN   = hlf068Y(148); // ₱ value line of DESIRED LOAN AMOUNT cell
const HLF_068_Y_NAMES  = hlf068Y(394);
const HLF_068_Y_PERM1  = hlf068Y(434);
const HLF_068_Y_PERM2  = hlf068Y(464);
const HLF_068_Y_PRES1  = hlf068Y(500);
const HLF_068_Y_PRES2  = hlf068Y(527);
const HLF_068_Y_HOME   = hlf068Y(563);
const HLF_068_Y_EMP1   = hlf068Y(583);
const HLF_068_Y_EMP2   = hlf068Y(615);
const HLF_068_Y_EMP3   = hlf068Y(643);
const HLF_068_Y_POS    = hlf068Y(779);

const HLF068_FIELD_COORDS: CoordsMap = {
  // mid_no / housing_account_no: 4-4-4 format with pre-printed dashes at cell indices 4 and 9.
  // Only provide 12 boxCenters (digit cells only, skipping the 2 dash cells).
  mid_no: {
    page: 0, x: 0, y: 865.8, fontSize: 9,
    boxCenters: [
      216.83, 228.89, 240.95, 253.07,   // digits 1-4
      277.19, 289.31, 301.43, 313.56,   // digits 5-8  (skip dash cell at source idx 4)
      337.75, 349.81, 361.93, 374.05,   // digits 9-12 (skip dash cell at source idx 9)
    ],
  },
  housing_account_no: {
    page: 0, x: 0, y: 865.4, fontSize: 9,
    boxCenters: [
      405.61, 418.93, 432.25, 445.54,   // digits 1-4
      472.24, 485.56, 498.88, 512.26,   // digits 5-8  (skip dash cell at source idx 4)
      538.96, 552.28, 565.67, 579.06,   // digits 9-12 (skip dash cell at source idx 9)
    ],
  },
  desired_loan_amount:   { page: 0, x: 475, y: HLF_068_Y_LOAN, fontSize: 9, maxWidth: 100 },

  last_name:             { page: 0, x: 30,  y: HLF_068_Y_NAMES, fontSize: 8, maxWidth: 70 },
  first_name:            { page: 0, x: 102, y: HLF_068_Y_NAMES, fontSize: 8, maxWidth: 75 },
  ext_name:              { page: 0, x: 180, y: HLF_068_Y_NAMES, fontSize: 8, maxWidth: 95 },
  middle_name:           { page: 0, x: 278, y: HLF_068_Y_NAMES, fontSize: 8, maxWidth: 65 },
  citizenship:           { page: 0, x: 346, y: HLF_068_Y_NAMES, fontSize: 8, maxWidth: 60 },
  dob:                   { page: 0, x: 410, y: HLF_068_Y_NAMES, fontSize: 9, maxWidth: 110 },

  // perm row 1: unit/room fills the left block; street name goes in the Street Name column (x=363)
  perm_unit:             { page: 0, x: 30,  y: HLF_068_Y_PERM1, fontSize: 7.5, maxWidth: 330 },
  perm_street:           { page: 0, x: 363, y: HLF_068_Y_PERM1, fontSize: 8,   maxWidth: 225 },

  // perm row 2: follow form column labels — Subdivision(30) | Barangay(101) | City(157) | Province(227) | ZIP(360)
  perm_subdivision:      { page: 0, x: 30,  y: HLF_068_Y_PERM2, fontSize: 8, maxWidth: 68 },
  perm_barangay:         { page: 0, x: 101, y: HLF_068_Y_PERM2, fontSize: 8, maxWidth: 54 },
  perm_city:             { page: 0, x: 157, y: HLF_068_Y_PERM2, fontSize: 8, maxWidth: 68 },
  perm_province:         { page: 0, x: 227, y: HLF_068_Y_PERM2, fontSize: 8, maxWidth: 130 },
  perm_zip:              { page: 0, x: 360, y: HLF_068_Y_PERM2, fontSize: 9, maxWidth: 48 },

  // pres row 1: unit fills left block; street name at x=363 (47pt wide — contact col starts at x=410)
  pres_unit:             { page: 0, x: 30,  y: HLF_068_Y_PRES1, fontSize: 7.5, maxWidth: 330 },
  pres_street:           { page: 0, x: 363, y: HLF_068_Y_PRES1, fontSize: 7.5, maxWidth: 47 },
  pres_cellphone:        { page: 0, x: 412, y: HLF_068_Y_PRES1, fontSize: 9,   maxWidth: 175 },

  // pres row 2: same column positions as perm row 2
  pres_subdivision:      { page: 0, x: 30,  y: HLF_068_Y_PRES2, fontSize: 8, maxWidth: 68 },
  pres_barangay:         { page: 0, x: 101, y: HLF_068_Y_PRES2, fontSize: 8, maxWidth: 54 },
  pres_city:             { page: 0, x: 157, y: HLF_068_Y_PRES2, fontSize: 8, maxWidth: 68 },
  pres_province:         { page: 0, x: 227, y: HLF_068_Y_PRES2, fontSize: 8, maxWidth: 130 },
  pres_zip:              { page: 0, x: 360, y: HLF_068_Y_PRES2, fontSize: 9, maxWidth: 48 },
  email_address:         { page: 0, x: 412, y: HLF_068_Y_PRES2, fontSize: 7.5, maxWidth: 175 },

  years_stay_present:    { page: 0, x: 220, y: HLF_068_Y_HOME, fontSize: 9, maxWidth: 75 },
  sss_gsis:              { page: 0, x: 305, y: HLF_068_Y_HOME, fontSize: 9, maxWidth: 100 },

  employer_name:         { page: 0, x: 30,  y: HLF_068_Y_EMP1, fontSize: 8, maxWidth: 265 },
  tin:                   { page: 0, x: 296, y: HLF_068_Y_EMP1, fontSize: 9, maxWidth: 110 },

  employer_address_line: { page: 0, x: 30,  y: HLF_068_Y_EMP2, fontSize: 7.5, maxWidth: 265 },
  // occupation goes to the right of the pre-printed ❑ Employed / ❑ Self-Employed checkboxes
  // (checkboxes occupy x=300-370 at Y_EMP2; place text after them)
  occupation:            { page: 0, x: 370, y: HLF_068_Y_EMP2, fontSize: 8,   maxWidth: 222 },

  // emp row 3: same column positions as perm/pres address row 2
  employer_subdivision:  { page: 0, x: 30,  y: HLF_068_Y_EMP3, fontSize: 8, maxWidth: 68 },
  employer_barangay:     { page: 0, x: 101, y: HLF_068_Y_EMP3, fontSize: 8, maxWidth: 54 },
  employer_city:         { page: 0, x: 157, y: HLF_068_Y_EMP3, fontSize: 8, maxWidth: 68 },
  employer_province:     { page: 0, x: 227, y: HLF_068_Y_EMP3, fontSize: 8, maxWidth: 130 },
  employer_zip:          { page: 0, x: 360, y: HLF_068_Y_EMP3, fontSize: 9, maxWidth: 48 },

  position_dept:         { page: 0, x: 412, y: HLF_068_Y_POS, fontSize: 8, maxWidth: 110 },
  years_employment:      { page: 0, x: 525, y: HLF_068_Y_POS, fontSize: 9, maxWidth: 65 },

  signature_date:        { page: 2, x: 100, y: 555, fontSize: 9, maxWidth: 130 },
};

const HLF068_SKIP_VALUES: Record<string, string[]> = {
  housing_account_no: [''],
  ext_name: ['', 'N/A'],
  middle_name: [''],
  perm_subdivision: [''],
  pres_unit: [''],
  pres_street: [''],
  pres_subdivision: [''],
  pres_barangay: [''],
  pres_city: [''],
  pres_province: [''],
  pres_zip: [''],
  years_stay_present: [''],
  sss_gsis: [''],
  employer_subdivision: [''],
  employer_zip: [''],
  existing_housing_application: ['', 'N/A'],
  loan_purpose: ['', 'N/A'],
  loan_term: ['', 'N/A'],
  mode_of_payment: ['', 'N/A'],
  sex: ['', 'N/A'],
  marital_status: ['', 'N/A'],
  home_ownership: ['', 'N/A'],
  employment_type: ['', 'N/A'],
  property_type: ['', 'N/A'],
  property_mortgaged: ['', 'N/A'],
  offsite_collateral: ['', 'N/A'],
};

// ── HLF-068 checkbox coords (Iteration 2) ────────────────────────────────
// Glyph metrics (pdfplumber): ❑ size 8 h≈8.1; \uf0a8 size 9 h≈9. Page h=936.
// Center the size-9 ✓ inside the printed ❑ / \uf0a8 glyph:
//   y_lib = 929 - glyph_top   (≈ pageH - (glyphTop + glyphH) + 1)
//   x     = glyph_cx - 4      (visual centering of ✓ baseline)
const hlf068CheckY = (glyphTop: number) => HLF068_PAGE_H - glyphTop - 7;

const HLF068_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // "WITH EXISTING HOUSING APPLICATION" row (page 0, top≈105.3)
  existing_housing_application: {
    'Yes': { page: 0, x: 334, y: hlf068CheckY(105.3) },
    'No':  { page: 0, x: 377, y: hlf068CheckY(105.3) },
  },
  // PURPOSE OF LOAN — \uf0a8 glyphs at cx=37.01, various tops (page 0)
  loan_purpose: {
    'Purchase of fully developed residential lot':        { page: 0, x: 33, y: hlf068CheckY(110.7) },
    'Purchase of a residential house and lot/townhouse':  { page: 0, x: 33, y: hlf068CheckY(121.0) },
    'Construction or completion of a residential unit':   { page: 0, x: 33, y: hlf068CheckY(141.7) },
    'Home improvement':                                   { page: 0, x: 33, y: hlf068CheckY(152.1) },
    'Refinancing of an existing housing loan':            { page: 0, x: 33, y: hlf068CheckY(162.4) },
    'Purchase of a parking slot':                         { page: 0, x: 33, y: hlf068CheckY(172.7) },
    'Purchase of residential lot plus cost of transfer':  { page: 0, x: 33, y: hlf068CheckY(183.1) },
    'Purchase of residential unit plus cost of transfer': { page: 0, x: 33, y: hlf068CheckY(193.5) },
  },
  // DESIRED LOAN TERM (years) — ❑ row at top=165.7 (page 0)
  loan_term: {
    '1':  { page: 0, x: 334, y: hlf068CheckY(165.7) },
    '3':  { page: 0, x: 365, y: hlf068CheckY(165.7) },
    '5':  { page: 0, x: 396, y: hlf068CheckY(165.7) },
    '10': { page: 0, x: 428, y: hlf068CheckY(165.7) },
    '15': { page: 0, x: 464, y: hlf068CheckY(165.7) },
    '20': { page: 0, x: 500, y: hlf068CheckY(165.7) },
    '25': { page: 0, x: 536, y: hlf068CheckY(165.7) },
    '30': { page: 0, x: 570, y: hlf068CheckY(165.7) },
  },
  // MODE OF PAYMENT — ❑ column pairs on tops 185.3 / 194.4 / 203.6 / 212.9 (page 0)
  mode_of_payment: {
    'Salary deduction':  { page: 0, x: 334, y: hlf068CheckY(185.3) },
    'Collecting Agent':  { page: 0, x: 474, y: hlf068CheckY(185.3) },
    'Over-the-Counter':  { page: 0, x: 334, y: hlf068CheckY(194.4) },
    'Bank':              { page: 0, x: 483, y: hlf068CheckY(194.4) },
    'Post-Dated Checks': { page: 0, x: 343, y: hlf068CheckY(203.6) },
    'Developer':         { page: 0, x: 483, y: hlf068CheckY(203.6) },
    'Cash/Check':        { page: 0, x: 343, y: hlf068CheckY(212.9) },
    'Remittance Center': { page: 0, x: 483, y: hlf068CheckY(212.9) },
  },
  // TYPE OF PROPERTY — \uf0a8 grid at tops 248.0 / 256.3 (page 0)
  property_type: {
    'Rowhouse':        { page: 0, x: 389, y: hlf068CheckY(248.0) },
    'Single Detached': { page: 0, x: 463, y: hlf068CheckY(248.0) },
    'Townhouse':       { page: 0, x: 538, y: hlf068CheckY(248.0) },
    'Single Attached': { page: 0, x: 389, y: hlf068CheckY(256.3) },
    'Condominium':     { page: 0, x: 463, y: hlf068CheckY(256.3) },
    'Duplex':          { page: 0, x: 538, y: hlf068CheckY(256.3) },
  },
  // IS PROPERTY PRESENTLY MORTGAGED? — ❑ at top=329.1 (page 0)
  property_mortgaged: {
    'Yes': { page: 0, x: 33, y: hlf068CheckY(329.1) },
    'No':  { page: 0, x: 96, y: hlf068CheckY(329.1) },
  },
  // IS PROPERTY AN OFFSITE COLLATERAL? — ❑ at top=339.7 (page 0)
  offsite_collateral: {
    'Yes': { page: 0, x: 194, y: hlf068CheckY(339.7) },
    'No':  { page: 0, x: 224, y: hlf068CheckY(339.7) },
  },
  // SEX — ❑ at top=385.8 (page 0)
  sex: {
    'Male':   { page: 0, x: 537, y: hlf068CheckY(385.8) },
    'Female': { page: 0, x: 557, y: hlf068CheckY(385.8) },
  },
  // MARITAL STATUS — ❑ 5 options across tops 407.7 / 416.5 / 425.4 (page 0)
  marital_status: {
    'Single':            { page: 0, x: 413, y: hlf068CheckY(407.7) },
    'Annulled':          { page: 0, x: 482, y: hlf068CheckY(407.7) },
    'Married':           { page: 0, x: 413, y: hlf068CheckY(416.5) },
    'Widow/er':          { page: 0, x: 483, y: hlf068CheckY(416.5) },
    'Legally Separated': { page: 0, x: 413, y: hlf068CheckY(425.4) },
  },
  // HOME OWNERSHIP — ❑ at tops 537.7 / 546.3 (page 0)
  home_ownership: {
    'Owned':                         { page: 0, x:  30, y: hlf068CheckY(537.7) },
    'Company-Provided':              { page: 0, x:  80, y: hlf068CheckY(537.7) },
    'Living with relatives/parents': { page: 0, x: 131, y: hlf068CheckY(537.7) },
    'Mortgaged':                     { page: 0, x:  30, y: hlf068CheckY(546.3) },
    'Rented':                        { page: 0, x:  80, y: hlf068CheckY(546.3) },
  },
  // EMPLOYMENT TYPE — ❑ stacked at top=593.4 / 602.7 (page 0)
  employment_type: {
    'Employed':      { page: 0, x: 300, y: hlf068CheckY(593.4) },
    'Self-Employed': { page: 0, x: 300, y: hlf068CheckY(602.7) },
  },
};

// ── BIR 2316 — Certificate of Compensation Payment/Tax Withheld (612×936) ────
// All coordinates derived via pdfplumber rect extraction (QuickFormsPH-NewForm Gate 4).
// Every y_pdf computed as: y_pdf = 936 - rect.bottom + (rect.h - fontSize*0.7)/2
// Amount cells: right column x=483.84-585.58 (w=101.74), h=15 → x=488, maxWidth=96.
// TIN cells: 4 segments per TIN at x=86.24/135.88/185.55/235.22, h=15 → fontSize=9.
const BIR2316_PAGE_H = 936.0;
const BIR2316_FIELD_COORDS: CoordsMap = {
  // ── R9 (2026-04-26): Pixel-truth scan reveals visible sub-cell tick marks on
  // year/period/TIN/ZIP/RDO/DOB/Contact/Date Signed boxes. All converted to boxCenters
  // per L-BIR1904-R8-01 (visible gridlines → digit-boxes regardless of width fit).

  // Row pdf_y_bot=822 cell_h≈20. Year — 4 cells.
  year: {
    page: 0, x: 0, y: 822 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [133.55, 151.25, 169.25, 186.95],
  },
  // Period MM/DD — 4 cells each (same row as year)
  period_from: {
    page: 0, x: 0, y: 822 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [395.60, 413.00, 431.15, 448.55],
  },
  period_to: {
    page: 0, x: 0, y: 822 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [521.05, 538.45, 556.75, 574.00],
  },

  // Row pdf_y_bot=793 cell_h≈20. Employee TIN — each segment has 3 sub-cells; branch has 5.
  emp_tin_1: {
    page: 0, x: 0, y: 793 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [92.65, 105.25, 118.00],
  },
  emp_tin_2: {
    page: 0, x: 0, y: 793 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [142.30, 155.05, 167.65],
  },
  emp_tin_3: {
    page: 0, x: 0, y: 793 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [191.95, 204.55, 217.30],
  },
  emp_tin_branch: {
    page: 0, x: 0, y: 793 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [242.20, 256.45, 271.30, 286.00, 299.65],
  },

  // Row pdf_y_bot=768 cell_h≈20. Name (free text) + RDO (3 sub-cells).
  emp_name:            { page: 0, x: 45,  y: 776.87, fontSize: 9, maxWidth: 205 },
  emp_rdo: {
    page: 0, x: 0, y: 768 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [270.65, 283.10, 296.15],
  },

  // Row pdf_y_bot=740 cell_h≈20. Reg address (text) + ZIP (4 sub-cells).
  emp_reg_address:     { page: 0, x: 45,  y: 748.83, fontSize: 7, maxWidth: 205 },
  emp_reg_zip: {
    page: 0, x: 0, y: 740 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [267.15, 279.45, 292.35, 304.05],
  },

  // Row pdf_y_bot=715 cell_h≈20. Local address (text) + ZIP (4 sub-cells).
  emp_local_address:   { page: 0, x: 45,  y: 723.57, fontSize: 7, maxWidth: 205 },
  emp_local_zip: {
    page: 0, x: 0, y: 715 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [267.35, 279.65, 292.55, 304.25],
  },

  // Row top=227 y_pdf≈698.0 — foreign address is free text (single box).
  emp_foreign_address: { page: 0, x: 45,  y: 697.97, fontSize: 7, maxWidth: 260 },

  // Row pdf_y_bot=660 cell_h≈20. DOB (8 sub-cells MMDDYYYY) + Contact (11 sub-cells).
  emp_dob: {
    page: 0, x: 0, y: 660 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [54.65, 65.75, 78.95, 91.40, 103.55, 116.15, 129.20, 141.80],
  },
  emp_contact: {
    page: 0, x: 0, y: 660 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [174.00, 186.90, 199.65, 214.50, 226.20, 238.95, 251.10, 263.55, 276.15, 289.05, 301.05],
  },

  // Min wage (row top=272,291 y_pdf≈653/635, x=209.88, w=98.74)
  min_wage_per_day:    { page: 0, x: 213, y: 653.15, fontSize: 9, maxWidth: 93 },
  min_wage_per_month:  { page: 0, x: 213, y: 634.70, fontSize: 9, maxWidth: 93 },

  // Present Employer — TIN row pdf_y_bot=580 cell_h≈20 (same sub-cell layout as emp TIN).
  pres_emp_tin_1: {
    page: 0, x: 0, y: 580 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [92.65, 105.25, 118.00],
  },
  pres_emp_tin_2: {
    page: 0, x: 0, y: 580 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [142.30, 155.05, 167.65],
  },
  pres_emp_tin_3: {
    page: 0, x: 0, y: 580 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [191.95, 204.55, 217.30],
  },
  pres_emp_tin_branch: {
    page: 0, x: 0, y: 580 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [242.20, 256.45, 271.30, 286.00, 299.65],
  },

  // Row top=361 y_pdf≈564.4: Employer Name (wider single)
  pres_emp_name:       { page: 0, x: 45,  y: 564.37, fontSize: 9, maxWidth: 260 },

  // Row pdf_y_bot=525 cell_h≈20: Registered Address (text) + ZIP (4 sub-cells).
  pres_emp_address:    { page: 0, x: 45,  y: 538.18, fontSize: 7, maxWidth: 205 },
  pres_emp_zip: {
    page: 0, x: 0, y: 525 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [265.05, 277.35, 290.25, 301.95],
  },

  // Previous Employer — TIN row pdf_y_bot=484 cell_h≈20.
  prev_emp_tin_1: {
    page: 0, x: 0, y: 484 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [92.65, 105.25, 118.00],
  },
  prev_emp_tin_2: {
    page: 0, x: 0, y: 484 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [142.30, 155.05, 167.65],
  },
  prev_emp_tin_3: {
    page: 0, x: 0, y: 484 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [191.95, 204.55, 217.30],
  },
  prev_emp_tin_branch: {
    page: 0, x: 0, y: 484 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [242.20, 256.45, 271.30, 286.00, 299.65],
  },

  // Row top=457 y_pdf≈468.3: Employer Name
  prev_emp_name:       { page: 0, x: 45,  y: 468.25, fontSize: 9, maxWidth: 260 },

  // Row pdf_y_bot=430 cell_h≈20: Address (text) + ZIP (4 sub-cells).
  prev_emp_address:    { page: 0, x: 46,  y: 441.41, fontSize: 7, maxWidth: 205 },
  prev_emp_zip: {
    page: 0, x: 0, y: 430 + (20 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [265.65, 277.80, 290.55, 302.25],
  },

  // ── Part IVA Summary — amounts at x=207.45 (w=101.77) ──
  gross_compensation:       { page: 0, x: 211, y: 412.94, fontSize: 8, maxWidth: 96 },
  less_non_taxable:         { page: 0, x: 211, y: 393.50, fontSize: 8, maxWidth: 96 },
  taxable_present:          { page: 0, x: 211, y: 374.06, fontSize: 8, maxWidth: 96 },
  taxable_previous:         { page: 0, x: 211, y: 354.62, fontSize: 8, maxWidth: 96 },
  gross_taxable:            { page: 0, x: 211, y: 335.57, fontSize: 8, maxWidth: 96 },
  tax_due:                  { page: 0, x: 211, y: 316.13, fontSize: 8, maxWidth: 96 },
  taxes_withheld_present:   { page: 0, x: 211, y: 296.69, fontSize: 8, maxWidth: 96 },
  taxes_withheld_previous:  { page: 0, x: 211, y: 276.86, fontSize: 8, maxWidth: 96 },
  total_withheld_adjusted:  { page: 0, x: 211, y: 257.20, fontSize: 8, maxWidth: 96 },
  tax_credit_pera:          { page: 0, x: 211, y: 237.34, fontSize: 8, maxWidth: 96 },
  total_taxes_withheld:     { page: 0, x: 211, y: 217.84, fontSize: 8, maxWidth: 96 },

  // ── Part IV-B A (Non-taxable) — right column amounts x=483.84 (w=101.74) ──
  basic_salary_mwe:     { page: 0, x: 488, y: 783.82, fontSize: 8, maxWidth: 96 },
  holiday_pay_mwe:      { page: 0, x: 488, y: 764.84, fontSize: 8, maxWidth: 96 },
  overtime_pay_mwe:     { page: 0, x: 488, y: 744.98, fontSize: 8, maxWidth: 96 },
  night_shift_mwe:      { page: 0, x: 488, y: 724.84, fontSize: 8, maxWidth: 96 },
  hazard_pay_mwe:       { page: 0, x: 488, y: 704.74, fontSize: 8, maxWidth: 96 },
  thirteenth_month:     { page: 0, x: 488, y: 685.35, fontSize: 8, maxWidth: 96 },
  de_minimis:           { page: 0, x: 488, y: 666.43, fontSize: 8, maxWidth: 96 },
  sss_gsis_phic_hdmf:   { page: 0, x: 488, y: 647.08, fontSize: 8, maxWidth: 96 },
  salaries_other:       { page: 0, x: 488, y: 627.75, fontSize: 8, maxWidth: 96 },
  total_non_taxable:    { page: 0, x: 488, y: 608.58, fontSize: 8, maxWidth: 96 },

  // ── Part IV-B B (Taxable) — right column amounts (continuation) ──
  basic_salary:         { page: 0, x: 488, y: 570.82, fontSize: 8, maxWidth: 96 },
  representation:       { page: 0, x: 488, y: 551.43, fontSize: 8, maxWidth: 96 },
  transportation:       { page: 0, x: 488, y: 532.30, fontSize: 8, maxWidth: 96 },
  cola:                 { page: 0, x: 488, y: 512.87, fontSize: 8, maxWidth: 96 },
  fixed_housing:        { page: 0, x: 488, y: 493.73, fontSize: 8, maxWidth: 96 },

  // 44A / 44B: label at x=341.89 (w=133) + amount at x=483.84
  others_a_label:       { page: 0, x: 345, y: 466.34, fontSize: 8, maxWidth: 127 },
  others_a_amount:      { page: 0, x: 488, y: 466.34, fontSize: 8, maxWidth: 96 },
  others_b_label:       { page: 0, x: 346, y: 447.98, fontSize: 8, maxWidth: 127 },
  others_b_amount:      { page: 0, x: 488, y: 448.37, fontSize: 8, maxWidth: 96 },

  // Supplementary
  commission:           { page: 0, x: 488, y: 422.36, fontSize: 8, maxWidth: 96 },
  profit_sharing:       { page: 0, x: 488, y: 403.22, fontSize: 8, maxWidth: 96 },
  fees_director:        { page: 0, x: 488, y: 383.78, fontSize: 8, maxWidth: 96 },
  taxable_13th_benefits:{ page: 0, x: 488, y: 364.34, fontSize: 8, maxWidth: 96 },
  supp_hazard:          { page: 0, x: 488, y: 344.90, fontSize: 8, maxWidth: 96 },
  supp_overtime:        { page: 0, x: 488, y: 325.46, fontSize: 8, maxWidth: 96 },

  // 51A / 51B: label at x=341.4/342.38 (w=135) + amount at x=483.84
  others_51a_label:     { page: 0, x: 345, y: 296.30, fontSize: 8, maxWidth: 130 },
  others_51a_amount:    { page: 0, x: 488, y: 296.30, fontSize: 8, maxWidth: 96 },
  others_51b_label:     { page: 0, x: 346, y: 276.86, fontSize: 8, maxWidth: 130 },
  others_51b_amount:    { page: 0, x: 488, y: 276.86, fontSize: 8, maxWidth: 96 },
  // Note: item 51 "Others (specify)" parent label has NO dedicated cell in the
  // source PDF — only 51A and 51B do. `others_supp_label` is therefore skipped.

  total_taxable_compensation: { page: 0, x: 488, y: 258.32, fontSize: 8, maxWidth: 96 },

  // ── Signatures / CTC row ──
  // R9: Pixel-truth scan reveals each Date Signed/Issued box is 8 sub-cells (MMDDYYYY).
  present_emp_date_signed: {
    page: 0, x: 0, y: 158 + (20 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [421.90, 434.65, 447.70, 460.30, 472.45, 485.05, 498.10, 510.70],
  },
  employee_date_signed: {
    page: 0, x: 0, y: 128 + (22 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [422.35, 434.95, 448.00, 460.60, 472.90, 485.50, 498.55, 511.15],
  },
  // CTC No / Place — single free-text boxes; Amount free text. Date Issued is 8 sub-cells.
  ctc_no:                  { page: 0, x: 100, y: 113.04, fontSize: 9, maxWidth: 96 },
  ctc_place:               { page: 0, x: 249, y: 113.42, fontSize: 9, maxWidth: 96 },
  ctc_date_issued: {
    page: 0, x: 0, y: 100 + (22 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [422.80, 435.55, 448.60, 461.20, 473.35, 485.95, 499.00, 511.60],
  },
  ctc_amount:              { page: 0, x: 543, y: 112.66, fontSize: 9, maxWidth: 33 },
};

const BIR2316_SKIP_VALUES: Record<string, string[]> = {
  // Optional fields render blank when empty
  emp_tin_branch: [''],
  emp_local_address: [''],
  emp_local_zip: [''],
  emp_foreign_address: [''],
  min_wage_per_day: [''],
  min_wage_per_month: [''],
  pres_emp_tin_branch: [''],
  prev_emp_tin_1: [''],
  prev_emp_tin_2: [''],
  prev_emp_tin_3: [''],
  prev_emp_tin_branch: [''],
  prev_emp_name: [''],
  prev_emp_address: [''],
  prev_emp_zip: [''],
  less_non_taxable: [''],
  taxable_previous: [''],
  taxes_withheld_previous: [''],
  tax_credit_pera: [''],
  basic_salary_mwe: [''],
  holiday_pay_mwe: [''],
  overtime_pay_mwe: [''],
  night_shift_mwe: [''],
  hazard_pay_mwe: [''],
  thirteenth_month: [''],
  de_minimis: [''],
  sss_gsis_phic_hdmf: [''],
  salaries_other: [''],
  total_non_taxable: [''],
  representation: [''],
  transportation: [''],
  cola: [''],
  fixed_housing: [''],
  others_a_label: [''],
  others_a_amount: [''],
  others_b_label: [''],
  others_b_amount: [''],
  commission: [''],
  profit_sharing: [''],
  fees_director: [''],
  taxable_13th_benefits: [''],
  supp_hazard: [''],
  supp_overtime: [''],
  others_supp_label: [''],
  others_51a_label: [''],
  others_51a_amount: [''],
  others_51b_label: [''],
  others_51b_amount: [''],
  ctc_no: [''],
  ctc_place: [''],
  ctc_date_issued: [''],
  ctc_amount: [''],
};
// suppress unused warning for page-height constant
void BIR2316_PAGE_H;

// ── BIR 1904 — Application for Registration (One-Time Taxpayer / E.O. 98) ───
// Page: 612 × 936 (2 pages). Layout extracted via pdfplumber Gate 4 analysis:
//   • Cell-bottom anchors taken from gray divider rect rows (ns=0.749).
//   • DOB digit cells: row top=285.5 bot=295.9 — wait, that's 7A names row.
//     Actual DOB digit cells are inside the Q8/Q9 cell (top=360.5 bot=378.7).
//   • Checkboxes (h=10.5, w=11.4, ns=1.0): tops 193.5 / 208.3 / 221.7 (taxpayer
//     type), 530 (gender/civil-status), 657 (spouse employment).
//   • Page 1 (h=936): Reg Address (top=50), ZIP (top=82), Contact/Email (top=97).
const BIR1904_PAGE_H = 936.0;
const bir1904Y = (cellBottom: number) => BIR1904_PAGE_H - cellBottom + 3;
const bir1904CheckY = (top: number) => BIR1904_PAGE_H - top - 7;

const BIR1904_FIELD_COORDS: CoordsMap = {
  // ── Q1 Date of Registration (8 digit boxes, MMDDYYYY) ─────────────────
  // R8: Pixel-truth cells y=152-168 in source; 8 white cells centered.
  date_of_registration: {
    page: 0, x: 0, y: 936 - 168.3 + (16.5 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [53.10, 67.20, 81.45, 95.85, 109.95, 124.35, 138.75, 153.15],
  },

  // ── Q3 RDO Code (3 digit boxes) ───────────────────────────────────────
  // "(To be filled out by BIR)" — pixel-truth cells y=152-168 right side.
  rdo_code: {
    page: 0, x: 0, y: 936 - 168.3 + (16.5 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [514.20, 528.75, 543.30],
  },

  // ── Q2 PhilSys PCN (16 digits) — single wide white data cell ──────────
  // Round 6 (Mai/Irwin): R1 shipped x=260 was actually wrong — extracted text
  // confirmed value rendered at x=260-349 which is OUTSIDE the white data box
  // (actual cell x=406.2-593.7) and ON TOP of the printed label "(If Applicable)".
  // Source-PDF rect: white data cell x=406.2-593.7, top=151.1-168.3 (h=17.2).
  // 16 chars at fontSize 10 ≈ 96pt; cell width=187.5pt. Centered x = 406 + 46 = 452.
  philsys_pcn:        { page: 0, x: 278, y: bir1904Y(168.3) + 4, fontSize: 10, maxWidth: 156 },

  // ── Q5 Foreign TIN / Q6 Country of Residence ──────────────────────────
  // Cell rows: top=246.6 bot=264.3 → y = 674.7
  foreign_tin:           { page: 0, x:  26, y: bir1904Y(264.3), fontSize: 9, maxWidth: 275 },
  country_of_residence:  { page: 0, x: 308, y: bir1904Y(264.3), fontSize: 9, maxWidth: 280 },

  // ── Q7A Names row (5 text columns) — cell bot=303.3 → y=635.7 ────────────
  last_name:    { page: 0, x:  34, y: bir1904Y(303.3), fontSize: 10, maxWidth: 140 },
  first_name:   { page: 0, x: 193, y: bir1904Y(303.3), fontSize: 10, maxWidth: 140 },
  middle_name:  { page: 0, x: 352, y: bir1904Y(303.3), fontSize: 10, maxWidth: 124 },
  name_suffix:  { page: 0, x: 496, y: bir1904Y(303.3), fontSize: 10, maxWidth:  24 },
  nickname:     { page: 0, x: 539, y: bir1904Y(303.3), fontSize: 10, maxWidth:  40 },

  // ── Q7B Registered Name (non-individual) — cell bot=331.9 → y=607 ───────
  registered_name:    { page: 0, x:  34, y: bir1904Y(331.9), fontSize: 10, maxWidth: 545 },

  // ── Q7C Estate / Trust name — cell bot=360.5 → y=579 ───────────────────
  estate_trust_name:  { page: 0, x:  34, y: bir1904Y(360.5), fontSize: 9, maxWidth: 545 },

  // ── Q8 Date of Birth (8 digit boxes inside Q8/Q9 row) ─────────────────
  // The DOB sub-cells are sub-elements of the Q8/Q9 row (top=360.5 bot=378.7).
  // Approximate cxs based on image: 8 boxes centered around x=255-360 (estimate).
  // Since precise rects could not be isolated, render as text fallback in a
  // single mini cell (8 digits as MM/DD/YYYY string fits ~50pt wide).
  // BOXCENTERS: Date of Birth — 8 cells (top=360.5 bot=378.2 h=17.7)
  date_of_birth: {
    page: 0, x: 0, y: 936 - 378.2 + (17.7 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [198.0, 212.5, 227.1, 241.6, 255.9, 270.3, 284.7, 299.1],
  },
  // ── Q9 Place of Birth (text right of DOB) ─────────────────────────────
  place_of_birth:  { page: 0, x: 396, y: bir1904Y(378.7) - 1, fontSize: 9, maxWidth: 180 },

  // ── Q10 Local Residence Address — 3 sub-rows ─────────────────────────
  // Sub-row 1: Unit / Building / Lot / Street (cell bot ≈ 416.6 → y=522.4)
  local_unit:        { page: 0, x:  34, y: bir1904Y(416.6), fontSize: 8, maxWidth:  82 },
  local_building:    { page: 0, x: 135, y: bir1904Y(416.6), fontSize: 8, maxWidth: 154 },
  local_lot:         { page: 0, x: 309, y: bir1904Y(416.6), fontSize: 8, maxWidth:  95 },
  local_street:      { page: 0, x: 424, y: bir1904Y(416.6), fontSize: 8, maxWidth: 153 },
  // Sub-row 2: Subdivision / Barangay / Town (cell bot ≈ 443.9 → y=495)
  local_subdivision: { page: 0, x:  34, y: bir1904Y(443.9), fontSize: 8, maxWidth: 169 },
  local_barangay:    { page: 0, x: 222, y: bir1904Y(443.9), fontSize: 8, maxWidth: 168 },
  local_town:        { page: 0, x: 410, y: bir1904Y(443.9), fontSize: 8, maxWidth: 167 },
  // Sub-row 3: City / Province / ZIP (cell bot ≈ 471.4 → y=467.6)
  local_city:        { page: 0, x:  34, y: bir1904Y(471.4), fontSize: 8, maxWidth: 226 },
  local_province:    { page: 0, x: 280, y: bir1904Y(471.4), fontSize: 8, maxWidth: 211 },
  local_zip:         { page: 0, x: 510, y: bir1904Y(471.4), fontSize: 9, maxWidth:  67 },

  // ── Q11 Foreign Address (cell bot ≈ 508.1 → y=430.9) ─────────────────
  foreign_address:   { page: 0, x:  34, y: bir1904Y(508.1), fontSize: 8, maxWidth: 442 },

  // ── Q12 Municipality Code (5 digit boxes) — "(To be filled out by BIR)" ──
  // R8: Pixel-truth cells y=491-507 inside right-side BIR-only band.
  municipality_code: {
    page: 0, x: 0, y: 936 - 507.6 + (16.5 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [514.65, 529.05, 543.60, 558.15, 572.55],
  },

  // ── Q13 Date of Arrival / Q14 Gender / Q15 Civil Status ──────────────
  // Cell row at top=527.5 bot=540.5 → y=398.5; date_of_arrival is text on left
  // BOXCENTERS: Date of Arrival — first 8 of 12 cells (top=527.5 bot=537.8 h=10.3)
  date_of_arrival: {
    page: 0, x: 0, y: 936 - 537.8 + (10.3 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [25.0, 39.2, 53.3, 67.9, 82.0, 96.6, 110.9, 125.4],
  },

  // ── Q16 Contact / Q17 Email (cell bot ≈ 574.2 → y=364.8) ─────────────
  contact_number:    { page: 0, x:  34, y: bir1904Y(574.2), fontSize: 9, maxWidth: 154 },
  email:             { page: 0, x: 222, y: bir1904Y(574.2), fontSize: 9, maxWidth: 355 },

  // ── Q18 Mother's / Q19 Father's name (cell bot ≈ 602.9 → y=336.1) ────
  mothers_name:      { page: 0, x:  30, y: bir1904Y(602.9), fontSize: 9, maxWidth: 274 },
  fathers_name:      { page: 0, x: 311, y: bir1904Y(602.9), fontSize: 9, maxWidth: 280 },

  // ── Q20 Identification (Type / Number / Effectivity / Expiry) ────────
  // Round 6 (Mai/Irwin): R1 had id_effectivity x=355 and id_expiry x=470 which
  // rendered text BEFORE the left edge of those columns. Source-PDF rects
  // (Q20 data row top=624.5-641.9, h=17.4):
  //   Type col          x=18.4-190.4   (left-align, x=27 + margin)
  //   Number col        x=190.4-363.5  (left-align, x=195)
  //   Effectivity col   x=363.5-478.7  (115 wide; "01/15/2023"≈50pt → x≈396 centered)
  //   Expiry col        x=478.7-593.6  (115 wide; centered x≈511)
  id_type:           { page: 0, x:  27, y: bir1904Y(641.9), fontSize: 8, maxWidth: 160 },
  id_number:         { page: 0, x: 195, y: bir1904Y(641.9), fontSize: 8, maxWidth: 165 },
  // R8: Effectivity & Expiry are 8-digit-box rows (MMDDYYYY), not free text.
  id_effectivity: {
    page: 0, x: 0, y: 936 - 641.9 + (17.4 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [370.80, 385.20, 399.45, 414.00, 428.40, 442.95, 457.20, 471.60],
  },
  id_expiry: {
    page: 0, x: 0, y: 936 - 641.9 + (17.4 - 9 * 0.7) / 2, fontSize: 9,
    boxCenters: [485.85, 500.25, 514.65, 529.05, 543.60, 558.15, 572.55, 586.80],
  },

  // ── Q22 Spouse Name / Q23 Spouse TIN ─────────────────────────────────
  // Spouse name: cell bot ≈ 700.3 → y=238.7 (text)
  // Spouse TIN: digit cells at top≈682-692 - render as text in right cell
  spouse_name:       { page: 0, x:  27, y: bir1904Y(700.3), fontSize: 9, maxWidth: 320 },
  // BOXCENTERS: Spouse TIN — 16 cells (top=682.0 bot=699.8 h=17.8)
  // R8: Skip gray dash cells (idx 2,6,10) AND preprinted "0" cells (idx 11-15).
  // 8 user-fillable cells (TIN format XXX-XXX-XXX with 5 trailing zeros preprint).
  spouse_tin: {
    page: 0, x: 0, y: 936 - 699.8 + (17.8 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [371.2, 385.6, 414.3, 428.9, 443.2, 472.0, 486.4, 500.7],
  },

  // ── Q24 Spouse Employer Name / Q25 Spouse Employer TIN ──────────────
  // Cell bot ≈ 739.5 → y=199.5
  spouse_employer_name: { page: 0, x:  27, y: bir1904Y(739.5), fontSize: 9, maxWidth: 320 },
  // BOXCENTERS: Spouse Employer TIN — 16 cells (top=720.3 bot=738.0 h=17.7)
  // R8: Skip gray dash cells (idx 2,6,10). Last 5 cells are blank (no preprint).
  spouse_employer_tin: {
    page: 0, x: 0, y: 936 - 738.0 + (17.7 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [371.2, 385.6, 414.2, 428.9, 443.2, 471.8, 486.4, 500.7, 529.4, 544.0, 558.6, 573.0, 587.0],
  },

  // ── Q26-J Other purpose specify (when J selected) ────────────────────
  // Inline with row I/J at top=805 — write text after "Others (specify)"
  purpose_other_specify: { page: 0, x: 320, y: bir1904Y(817.6), fontSize: 8, maxWidth: 270 },

  // ── Q27 WA TIN / Q28 RDO Code (cell bot ≈ 847.7 → y=91.3) ────────────
  // BOXCENTERS: WA TIN — 17 cells (top=829.5 bot=847.2 h=17.7)
  // R8: Skip gray dash cells (idx 3,7,11) of the 17-cell layout.
  wa_tin: {
    page: 0, x: 0, y: 936 - 847.2 + (17.7 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [242.2, 256.7, 270.9, 299.8, 314.2, 328.4, 357.2, 371.7, 386.0, 414.7, 429.4, 443.8, 458.1, 472.4],
  },
  // BOXCENTERS: WA RDO Code — 3 cells (same row)
  wa_rdo_code: {
    page: 0, x: 0, y: 936 - 847.2 + (17.7 - 10 * 0.7) / 2, fontSize: 10,
    boxCenters: [558.9, 573.5, 587.5],
  },

  // ── Q29 WA Name (page 0 bottom row, cell bot ≈ 875 → y=64) ───────────
  wa_name:           { page: 0, x:  27, y: 64, fontSize: 9, maxWidth: 562 },

  // ── PAGE 2 fields (page index 1) ──────────────────────────────────────
  // Q30 Registered Address (label top=50): fill row top≈63 bot≈82 → y=856.7
  wa_address:        { page: 1, x:  27, y: 861, fontSize: 8, maxWidth: 440 },
  // Q30A ZIP (label top=82): fill row bot≈110 → y=828.7
  wa_zip:            { page: 1, x: 540, y: 843, fontSize: 9, maxWidth: 50 },
  // Q31 Contact / Q32 Email (label top=97): fill bot≈125 → y=813.7
  wa_contact:        { page: 1, x:  27, y: 815, fontSize: 9, maxWidth: 160 },
  wa_email:          { page: 1, x: 200, y: 815, fontSize: 9, maxWidth: 380 },
  // Q33 Title/Position (signature line top=205, right side)
  wa_title:          { page: 1, x: 380, y: 728, fontSize: 9, maxWidth: 200 },
};

const BIR1904_CHECKBOX_COORDS: FormPdfConfig['checkboxCoords'] = {
  // ── Q4 Taxpayer Type (3 rows × 2 cols of checkboxes) ─────────────────
  // Box rects (ns=1.0, w=11.4): cx=38.5 (left col) / cx=326.3 (right col)
  // Row 1 top=193.5 / Row 2 top=208.3 / Row 3 top=221.7
  taxpayer_type: {
    'E.O. 98 — Filipino Citizen':        { page: 0, x: 35, y: bir1904CheckY(193.9) },
    'One-Time Taxpayer — Foreign National': { page: 0, x: 322, y: bir1904CheckY(193.5) },
    'E.O. 98 — Foreign National':        { page: 0, x: 35, y: bir1904CheckY(208.3) },
    'Persons Registering under Passive Income (excluding dividends/interest)': { page: 0, x: 322, y: bir1904CheckY(208.4) },
    'One-Time Taxpayer — Filipino Citizen': { page: 0, x: 35, y: bir1904CheckY(221.7) },
    'Estate / Trust':                    { page: 0, x: 322, y: bir1904CheckY(221.8) },
  },
  // ── Q14 Gender ─────────────────────────────────────────────────────
  // Box rects at top=530.1 cx=[182.85 Male, 241.05 Female]
  gender: {
    'Male':   { page: 0, x: 179, y: bir1904CheckY(530.1) },
    'Female': { page: 0, x: 237, y: bir1904CheckY(530.1) },
  },
  // ── Q15 Civil Status ───────────────────────────────────────────────
  // top=530.1 cxs=[313.2, 370.5, 428.05, 499.65]
  civil_status: {
    'Single':            { page: 0, x: 309, y: bir1904CheckY(530.1) },
    'Married':           { page: 0, x: 367, y: bir1904CheckY(530.0) },
    'Widow/er':          { page: 0, x: 424, y: bir1904CheckY(530.1) },
    'Legally Separated': { page: 0, x: 496, y: bir1904CheckY(530.3) },
  },
  // ── Q21 Spouse Employment Status ───────────────────────────────────
  // top=657.4-657.6 cxs=[183.6, 270.15, 355.5, 444.7]
  spouse_employment_status: {
    'Unemployed':                  { page: 0, x: 180, y: bir1904CheckY(657.6) },
    'Employed in the Philippines': { page: 0, x: 266, y: bir1904CheckY(657.6) },
    'Employed Abroad':             { page: 0, x: 352, y: bir1904CheckY(657.4) },
    'Engaged in Business':         { page: 0, x: 441, y: bir1904CheckY(657.6) },
  },
  // ── Q26 Purpose of TIN — 10 options A-J in 4 rows ─────────────────
  // Row layout from labels:
  //   Row 1 top=767: A Banks (cx≈25), B Govt (cx≈155), C Tax Treaty (cx≈335), D Shares (cx≈480)
  //   Row 2 top=793: E Real Capital (cx≈25), F Real Ordinary (cx≈155), G Transfer Succession (cx≈335), H Donation (cx≈480)
  //   Row 3 top=805: I First-Time Jobseeker (cx≈25), J Others (cx≈155)
  // All checkbox squares are at ABCDEFGHIJ marker x positions.
  // From rect data: top=762.2-771.4 has cells at cxs=[25, 60.5, 176.5, 205, 335, 363.7, 450.1, 522.3]
  // We use a coarse mapping; fine-tune in iteration 2.
  purpose_of_tin: {
    'A. Dealings with banks, financial institutions, insurance companies': { page: 0, x:  22, y: bir1904CheckY(762.2) },
    'B. Dealings with government offices (e.g. LTO, DFA, NBI)': { page: 0, x: 180, y: bir1904CheckY(762.2) },
    'C. Tax treaty relief applications': { page: 0, x: 340, y: bir1904CheckY(762.2) },
    'D. Shares of stock / bonds':        { page: 0, x: 439, y: bir1904CheckY(762.2) },
    'E. Real property — capital asset':  { page: 0, x:  22, y: bir1904CheckY(783.7) },
    'F. Real property — ordinary asset': { page: 0, x: 180, y: bir1904CheckY(783.7) },
    'G. Donation of property':           { page: 0, x: 439, y: bir1904CheckY(783.7) },
    'H. Transfer by succession (estate)': { page: 0, x: 340, y: bir1904CheckY(783.7) },
    'I. First-time jobseeker (RA 11261)': { page: 0, x:  22, y: bir1904CheckY(803.0) },
    'J. Other (specify below)':           { page: 0, x: 180, y: bir1904CheckY(803.0) },
  },
};

const BIR1904_SKIP_VALUES: Record<string, string[]> = {
  // Optional / conditional fields — render blank when empty
  date_of_registration: [''],
  rdo_code: [''],
  municipality_code: [''],
  philsys_pcn: [''],
  foreign_tin: [''],
  country_of_residence: [''],
  // Individual vs non-individual: only one of (last/first/middle/suffix/nickname) OR registered_name OR estate_trust_name
  last_name: [''],
  first_name: [''],
  middle_name: [''],
  name_suffix: ['', 'N/A'],
  nickname: [''],
  registered_name: [''],
  estate_trust_name: [''],
  // Q11/Q13 — foreign nationals only
  foreign_address: [''],
  date_of_arrival: [''],
  // Q20 ID effectivity/expiry optional
  id_effectivity: [''],
  id_expiry: [''],
  // Q21-Q25 — spouse fields, only when civil_status=Married
  spouse_employment_status: ['', 'N/A'],
  spouse_name: [''],
  spouse_tin: [''],
  spouse_employer_name: [''],
  spouse_employer_tin: [''],
  // Q26-J specifier
  purpose_other_specify: [''],
  // Q27-Q33 — withholding agent (rarely used)
  wa_tin: [''],
  wa_rdo_code: [''],
  wa_name: [''],
  wa_address: [''],
  wa_zip: [''],
  wa_contact: [''],
  wa_email: [''],
  wa_title: [''],
};
void BIR1904_PAGE_H;

// ─── BIR-1902 — Individuals Earning Purely Compensation (R10 v5) ─────────────
// BIR Oct-2025: each item has a gray label-strip + white DATA area. For
// free-text fields we baseline near the bottom of the data area (just before
// the next label-strip). For chevron / checkbox items (5, 7, 8, 22 preferred,
// 23) we use BIR1902_CHECKBOX_COORDS to place an X mark at the chosen option.
const BIR1902_PAGE_H = 936.0;
const yBeforeNext = (nextLabelTop: number) => BIR1902_PAGE_H - (nextLabelTop - 4);
const yAt = (baselineTop: number) => BIR1902_PAGE_H - baselineTop;

const BIR1902_FIELD_COORDS: CoordsMap = {
  // Item 2 — PCN (label_top=142.4 x0=282; next item 3 at 171.5).
  // PCN data area is to the RIGHT of the bold "2 PhilSys..." label; renders inline.
  // Drop y to yAt(165) so text-top sits in the white area below the gray label-strip
  // (was yAt(154) which overlapped the label text).
  philsys_pcn:        { page: 0, x: 460, y: yAt(152), fontSize: 6, maxWidth: 130 },

  // Item 3 — TIN: 12 digits with last 5 reserved (pre-printed gray "00000" at top=192.6).
  // User-entered 12 digits go in the digit-box row at top≈199. Render via boxCenters
  // for digit-by-digit placement (was freeform; digits were overflowing separators).
  // Empirical cell centers from 300dpi vertical-edge detection of blank form
  // (12 cells, uniform ~14.3pt spacing from x=39 to x=198). See L-BIR1902-R11-01.
  tin:                { page: 0, x: 0, y: yAt(202), fontSize: 9,
                        boxCenters: [39, 53.1, 67.7, 82.5, 96.8, 111.2, 125.6, 140.1, 154.4, 168.8, 183.2, 197.8] },

  // Item 6 — Last/First names (label-strip top=209.1, captions at top=219).
  last_name:          { page: 0, x: 24,  y: yAt(243), fontSize: 10, maxWidth: 263 },
  first_name:         { page: 0, x: 308, y: yAt(243), fontSize: 10, maxWidth: 280 },

  // Item 7 sub-row — Middle/Suffix (label-strip top=248.1).
  middle_name:        { page: 0, x: 24,  y: yBeforeNext(280), fontSize: 10, maxWidth: 263 },
  name_suffix:        { page: 0, x: 308, y: yBeforeNext(280), fontSize: 10, maxWidth: 38  },

  // Item 9 — DOB MM/DD/YYYY (label_top=295.4; 10 grid-cells with pre-printed
  // slashes in cells 3 and 6 → 8 user-digit cells (MM, DD, YYYY).
  // Empirical cell centers from 300dpi rect extraction (uniform 14.3pt grid from x=25).
  // Skips slash cells at cx≈53 and cx≈96. See L-BIR1902-R11-01.
  date_of_birth:      { page: 0, x: 0, y: yAt(322), fontSize: 10,
                        boxCenters: [25, 39.1, 67.7, 81.7, 110.5, 124.8, 139, 153.4] },
  // Item 10 — Place of Birth (same row, freeform after digit-box area).
  place_of_birth:     { page: 0, x: 175, y: yAt(322), fontSize: 9,  maxWidth: 415 },

  // Item 11 — Mother. Label 324. Next (12) at 352.6.
  mothers_maiden_name:{ page: 0, x: 24,  y: yBeforeNext(352), fontSize: 9,  maxWidth: 560 },
  // Item 12 — Father. Label 352.6. Next (13) at 381.2.
  fathers_name:       { page: 0, x: 24,  y: yBeforeNext(381), fontSize: 9,  maxWidth: 560 },

  // Item 13/14 — Citizenship. Label 381.2. Next (15) at 409.8.
  citizenship:        { page: 0, x: 24,  y: yBeforeNext(409), fontSize: 9,  maxWidth: 280 },
  other_citizenship:  { page: 0, x: 312, y: yBeforeNext(409), fontSize: 9,  maxWidth: 280 },

  // Item 15 — Local Address (5 sub-rows).
  local_unit:         { page: 0, x: 24,  y: yBeforeNext(448), fontSize: 9,  maxWidth: 165 },
  local_building:     { page: 0, x: 209, y: yBeforeNext(448), fontSize: 9,  maxWidth: 380 },
  local_lot:          { page: 0, x: 24,  y: yBeforeNext(476), fontSize: 9,  maxWidth: 165 },
  local_street:       { page: 0, x: 209, y: yBeforeNext(476), fontSize: 9,  maxWidth: 380 },
  local_subdivision:  { page: 0, x: 24,  y: yBeforeNext(505), fontSize: 9,  maxWidth: 265 },
  local_barangay:     { page: 0, x: 310, y: yBeforeNext(505), fontSize: 9,  maxWidth: 280 },
  local_town:         { page: 0, x: 24,  y: yBeforeNext(533), fontSize: 9,  maxWidth: 265 },
  local_city:         { page: 0, x: 310, y: yBeforeNext(533), fontSize: 9,  maxWidth: 280 },
  local_province:     { page: 0, x: 24,  y: yBeforeNext(563), fontSize: 9,  maxWidth: 495 },
  local_zip:          { page: 0, x: 540, y: yBeforeNext(563), fontSize: 10, maxWidth: 50  },

  // Item 16 — Foreign Address. Label 563.7. Next at 592.3.
  foreign_address:    { page: 0, x: 24,  y: yBeforeNext(592), fontSize: 9,  maxWidth: 565 },

  // Item 21 — ID details (label_top=611.2; data row top≈632, sub-row Issuer at 649).
  id_type:            { page: 0, x: 24,  y: yAt(645), fontSize: 9,  maxWidth: 165 },
  id_number:          { page: 0, x: 195, y: yAt(645), fontSize: 9,  maxWidth: 165 },
  // Effectivity/Expiry are MM/DD/YYYY 8-digit boxes. Renderer strips slashes.
  id_effectivity:     { page: 0, x: 0, y: yAt(645), fontSize: 9,
                        boxCenters: [375, 389, 407, 421, 439, 453, 467, 481] },
  id_expiry:          { page: 0, x: 0, y: yAt(645), fontSize: 9,
                        boxCenters: [490, 504, 522, 536, 554, 568, 582, 596] },

  // Item 21 cont. Issuer/Place. Sub-row top=649.4 with italic caption at 657.
  // Render value below caption (top ~665).
  id_issuer:          { page: 0, x: 80,  y: yAt(665), fontSize: 9, maxWidth: 195 },
  id_place_issue:     { page: 0, x: 282, y: yAt(666), fontSize: 9, maxWidth: 110 },

  // Item 22 — Landline/Fax/Mobile (sub-row top=683 with italic captions on same strip).
  // Email row label-strip ~top=697. Value baseline below caption row.
  contact_landline:   { page: 0, x: 24,  y: yAt(706), fontSize: 9, maxWidth: 178 },
  contact_fax:        { page: 0, x: 212, y: yAt(706), fontSize: 9, maxWidth: 178 },
  contact_mobile:     { page: 0, x: 400, y: yAt(706), fontSize: 9, maxWidth: 192 },
  // Email value (label "Email Address" at top=712 left cell with checkbox; value box right).
  contact_email:      { page: 0, x: 168, y: yAt(723), fontSize: 9, maxWidth: 422 },

  // Item 24 — Spouse Last/First. Label-strip top=768.4. Next sub at 805.9.
  spouse_last_name:   { page: 0, x: 24,  y: yAt(800), fontSize: 10, maxWidth: 250 },
  spouse_first_name:  { page: 0, x: 296, y: yAt(800), fontSize: 10, maxWidth: 295 },

  // Item 24/25 — Spouse Middle/Suffix/SpouseTIN. Label-strip top=805.9. Next (26) at 837.2.
  spouse_middle_name: { page: 0, x: 24,  y: yBeforeNext(837), fontSize: 10, maxWidth: 250 },
  spouse_suffix:      { page: 0, x: 296, y: yBeforeNext(837), fontSize: 10, maxWidth: 38  },
  // Item 25 Spouse TIN — 12 digits with last 5 reserved (pre-printed "00000" at top=819).
  // User-input 12 digit-boxes from x≈400..566 (~14pt spacing).
  spouse_tin:         { page: 0, x: 0, y: yAt(829), fontSize: 9,
                        boxCenters: [388, 402, 416, 434, 448, 462, 480, 494, 508, 526, 540, 554] },

  // Item 26 — Spouse Employer Name. Label 837.2. Next (27) at 868.8.
  spouse_employer_name: { page: 0, x: 24,  y: yBeforeNext(868), fontSize: 9,  maxWidth: 565 },

  // Item 27 — Spouse Employer TIN (label_top=868.8 x0=239.3).
  // Data row top≈877; 12 digit-boxes from x≈368..534.
  spouse_employer_tin:{ page: 0, x: 0, y: yAt(883), fontSize: 9,
                        boxCenters: [358, 372, 386, 404, 418, 432, 450, 464, 478, 496, 510, 524] },
};

// Per-value chevron / checkbox coords. Each value places a check mark at the
// corresponding chevron square. y values are pdf-lib baselines (bottom-up).
const BIR1902_CHECKBOX_COORDS: Record<string, Record<string, { page?: number; x: number; y: number }>> = {
  taxpayer_type: {
    'Local Employee':         { x: 369, y: yAt(203) },
    'Resident Alien':         { x: 425, y: yAt(203) },
    'Special Non-Resident Alien': { x: 497, y: yAt(203) },
  },
  gender: {
    'Male':   { x: 426, y: yAt(257) },
    'Female': { x: 521, y: yAt(257) },
  },
  civil_status: {
    'Single':            { x: 126, y: yAt(289) },
    'Married':           { x: 198, y: yAt(289) },
    'Widow/er':          { x: 285, y: yAt(289) },
    'Legally Separated': { x: 388, y: yAt(289) },
  },
  preferred_contact_type: {
    'Landline': { x: 30,  y: yAt(691) },
    'Fax':      { x: 218, y: yAt(691) },
    'Mobile':   { x: 405, y: yAt(691) },
    'Email':    { x: 30,  y: yAt(720) },
  },
  spouse_employment_status: {
    'Unemployed':                   { x: 167, y: yAt(760) },
    'Employed in the Philippines':  { x: 239, y: yAt(760) },
    'Employed Abroad':              { x: 325, y: yAt(760) },
    'Engaged in Business':          { x: 428, y: yAt(760) },
  },
};

const BIR1902_SKIP_VALUES: Record<string, string[]> = {
  philsys_pcn: [''],
  middle_name: [''],
  name_suffix: ['', 'N/A'],
  other_citizenship: [''],
  local_unit: [''],
  local_building: [''],
  local_lot: [''],
  local_subdivision: [''],
  local_town: [''],
  foreign_address: [''],
  id_effectivity: [''],
  id_expiry: [''],
  id_place_issue: [''],
  contact_landline: [''],
  contact_fax: [''],
  contact_mobile: [''],
  contact_email: [''],
  spouse_employment_status: ['', 'N/A'],
  spouse_last_name: [''],
  spouse_first_name: [''],
  spouse_middle_name: [''],
  spouse_suffix: ['', 'N/A'],
  spouse_tin: [''],
  spouse_employer_name: [''],
  spouse_employer_tin: [''],
};
void BIR1902_PAGE_H;


export const FORM_PDF_CONFIGS: Record<string, FormPdfConfig> = {
  'hqp-pff-356': {
    fieldCoords: FIELD_COORDS,
    skipValues: SKIP_VALUES,
    copyYOffsets: [0, -HQP_COPY2_Y_OFFSET],
  },
  'philhealth-pmrf': {
    fieldCoords: PMRF_FIELD_COORDS,
    // Note: empty array [] = UI-only / split-parent field (renders via sub-coords like dob_month/day/year).
    skipValues: {
      name_ext: ['N/A'],
      dob: [],
    },
    copyYOffsets: [0],
    checkboxCoords: PMRF_CHECKBOX_COORDS,
  },
  'philhealth-claim-form-1': {
    fieldCoords: CF1_FIELD_COORDS,
    // Note: empty array [] = UI-only / split-parent field.
    skipValues: {
      member_name_ext: ['N/A'],
      patient_name_ext: ['N/A'],
      member_dob: [],          // split into _month/_day/_year sub-coords
      patient_dob: [],         // split into _month/_day/_year sub-coords
      patient_is_member: [],   // UI-only toggle
      has_employer: [],        // UI-only toggle
    },
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
      // UI-only / split-parent fields (render via _month/_day/_year/_hour/_min sub-coords):
      date_admitted: [],
      time_admitted: [],
      date_discharged: [],
      time_discharged: [],
      expired_date: [],
      expired_time: [],
      tbdots_intensive_phase: [],
      tbdots_maintenance_phase: [],
      hcp1_date_signed: [],
      hcp2_date_signed: [],
      hcp3_date_signed: [],
    },
    copyYOffsets: [0],
    checkboxCoords: CF2_CHECKBOX_COORDS,
  },
  'philhealth-claim-form-3': {
    fieldCoords: CF3_FIELD_COORDS,
    skipValues: {
      patient_name_ext: ['N/A'],
      // Schema-only field — captured for sample data / API but the CF-3 form has
      //   no PDF slot for the HCI provider name (PAN row ends at x=435 then the
      //   chief-complaint box starts at x=430). See L-SMART-CF3-02 Pattern 6.
      hci_name: [],
      // UI-only / split-parent fields (render via _month/_day/_year/_hour/_min sub-coords):
      date_admitted: [],
      time_admitted: [],
      date_discharged: [],
      time_discharged: [],
      expired_date: [],
      attending_physician_date_signed: [],
      // visibleWhen-gated fields render as blank when not applicable:
      transferred_hci_name: [''],
    },
    copyYOffsets: [0],
    checkboxCoords: CF3_CHECKBOX_COORDS,
  },
  'philhealth-pmrf-foreign-natl': {
    fieldCoords: PMRF_FN_FIELD_COORDS,
    // Note: empty array [] = UI-only / split-parent field.
    skipValues: {
      dob: [],                // split into _month/_day/_year
      documentation_type: [], // UI-only (gates ACR/SRRV visibility)
      is_mononymous: [],      // UI-only toggle
    },
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
  'pagibig-slf-089': {
    fieldCoords: SLF089_FIELD_COORDS,
    skipValues: SLF089_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: SLF089_CHECKBOX_COORDS,
  },
  'pagibig-slf-065': {
    fieldCoords: SLF065_FIELD_COORDS,
    skipValues: SLF065_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: SLF065_CHECKBOX_COORDS,
  },
  'pagibig-hlf-868': {
    fieldCoords: HLF868_FIELD_COORDS,
    skipValues: HLF868_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: HLF868_CHECKBOX_COORDS,
  },
  'pagibig-hlf-858': {
    fieldCoords: HLF858_FIELD_COORDS,
    skipValues: HLF858_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: HLF858_CHECKBOX_COORDS,
  },
  'pagibig-hlf-068': {
    fieldCoords: HLF068_FIELD_COORDS,
    skipValues: HLF068_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: HLF068_CHECKBOX_COORDS,
  },
  'bir-2316': {
    fieldCoords: BIR2316_FIELD_COORDS,
    skipValues: BIR2316_SKIP_VALUES,
    copyYOffsets: [0],
  },
  'bir-1904': {
    fieldCoords: BIR1904_FIELD_COORDS,
    skipValues: BIR1904_SKIP_VALUES,
    copyYOffsets: [0],
    checkboxCoords: BIR1904_CHECKBOX_COORDS,
  },
  'bir-1902': {
    fieldCoords: BIR1902_FIELD_COORDS,
    skipValues: BIR1902_SKIP_VALUES,
    checkboxCoords: BIR1902_CHECKBOX_COORDS,
    copyYOffsets: [0],
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

/**
 * Generate a filled PDF from form values.
 *
 * @param form          Form schema (fields, slug, pdfPath, etc.)
 * @param values        Field id -> value map
 * @param sourceBytes   OPTIONAL pre-loaded source PDF bytes. When provided
 *                      (e.g. from a browser fetch in Local Mode), no Node
 *                      filesystem APIs are touched. When omitted (server flow)
 *                      the file is read from public/forms via fs/promises.
 */

// ── Site-wide: split combined `mm / dd / yyyy` masked dates into _month/_day/_year siblings ──
// Only writes siblings when:
//   • combined value parses cleanly to mm/dd/yyyy
//   • the corresponding sibling key is not already populated (preserves user override)

// ── Strip "CODE — Facility (City)" datalist suffixes ──────────────────────
// User picks "01-001-009-000 — Quezon City General Hospital (Quezon City)"
// in the UI but the PDF cell is sized for just the PIN code. We split on
// " — " (em-dash with spaces) or " -- " (double-dash) and keep the prefix.
function stripDatalistSuffix(values: Record<string, string>, ids: string[]): Record<string, string> {
  const out: Record<string, string> = { ...values };
  for (const id of ids) {
    const v = out[id];
    if (!v) continue;
    const m = v.match(/^(.+?)\s+(?:—|--)\s+/);
    if (m) out[id] = m[1].trim();
  }
  return out;
}

function expandCombinedDates(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...values };
  const re = /^\s*(\d{2})\s*\/\s*(\d{2})\s*\/\s*(\d{4})\s*$/;
  for (const key of Object.keys(values)) {
    if (key.endsWith('_month') || key.endsWith('_day') || key.endsWith('_year')) continue;
    const m = (values[key] || '').match(re);
    if (!m) continue;
    const monthKey = key + '_month';
    const dayKey   = key + '_day';
    const yearKey  = key + '_year';
    if (!out[monthKey]) out[monthKey] = m[1];
    if (!out[dayKey])   out[dayKey]   = m[2];
    if (!out[yearKey])  out[yearKey]  = m[3];
  }
  return out;
}

// L-SMART-CF2-01 — expandCombinedTimes() — mirror of expandCombinedDates() for
// 12-hour clock fields. Splits a single masked time "HH : MM AM/PM" into
// `<id>_hour`, `<id>_min`, `<id>_ampm` so existing per-prefix coord maps
// keep working without per-form changes. Cascadable to any form whose
// schema uses a combined `'time'` mask field.
function expandCombinedTimes(values: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = { ...values };
  const re = /^\s*(\d{1,2})\s*:\s*(\d{2})\s+(AM|PM)\s*$/i;
  for (const key of Object.keys(values)) {
    if (key.endsWith('_hour') || key.endsWith('_min') || key.endsWith('_ampm')) continue;
    const m = (values[key] || '').match(re);
    if (!m) continue;
    const hourKey = key + '_hour';
    const minKey  = key + '_min';
    const ampmKey = key + '_ampm';
    if (!out[hourKey]) out[hourKey] = m[1].padStart(2, '0');
    if (!out[minKey])  out[minKey]  = m[2];
    if (!out[ampmKey]) out[ampmKey] = m[3].toUpperCase();
  }
  return out;
}

export async function generatePDF(
  form: FormSchema,
  values: Record<string, string>,
  sourceBytes?: Uint8Array,
  isDemo = false
): Promise<Uint8Array> {
  // ── Load source PDF ────────────────────────────────────────────────────────
  let existingPdfBytes: Uint8Array;

  if (sourceBytes) {
    // Browser / Local Mode path — bytes already fetched by the caller.
    existingPdfBytes = sourceBytes;
  } else {
    // Server path — lazy-load Node modules so this file stays browser-safe.
    try {
      const [{ default: fs }, { default: path }] = await Promise.all([
        import('fs/promises'),
        import('path'),
      ]);
      const PUBLIC_FORMS_DIR = path.join(process.cwd(), 'public', 'forms');
      const pdfPath = path.join(PUBLIC_FORMS_DIR, form.pdfPath);
      const buf = await fs.readFile(pdfPath);
      existingPdfBytes = new Uint8Array(buf);
    } catch {
      // If the source PDF doesn't exist yet, create a blank placeholder PDF
      existingPdfBytes = await createBlankPdf(form.name, form.code);
    }
  }

  // ── Smart Assistance: auto-split combined date fields into mm/dd/yyyy ────
  // Site-wide rule: when the schema uses a single masked `dob`/`*_dob` field
  // but the PDF coords expect separate `*_dob_month / _day / _year` boxes
  // (e.g. PMRF-012020), expand the combined value here so per-digit box
  // rendering still works without touching every form's coord map.
  // See L-SMART-04 in QuickFormsPH-PDFGenerationLearnings.md.
  values = expandCombinedDates(values);
  values = expandCombinedTimes(values);
  // Strip free-form datalist suffixes ("CODE — Facility Name (City)" → "CODE")
  // so PDFs receive just the canonical code in tightly-spaced cells.
  // See L-SMART-05.
  values = stripDatalistSuffix(values, ['konsulta_provider']);

  // ── CF-1 boolean → label normalization ─────────────────────────────────
  // Schema uses a boolean checkbox `patient_is_member` ('true' | '') but the
  // printed CF-1 has paired Yes/No tickboxes. Emit a synthetic
  // `patient_is_member_choice` field that the PDF coord map keys off. See
  // L-SMART-CF1-01 in QuickFormsPH-PDFGenerationLearnings.md.
  if (form.slug === 'philhealth-claim-form-1' && !values.patient_is_member_choice) {
    values.patient_is_member_choice = values.patient_is_member === 'true' ? 'Yes' : 'No';
  }

  // ── CF-2 boolean → YES/NO normalization (L-SMART-CF2-01) ─────────────────
  // Schema uses a boolean checkbox `referred_by_hci` ('true' | '') while the
  // CF-2 PDF has paired NO/YES tickboxes. CF2_CHECKBOX_COORDS already keys
  // on those exact strings, so we map directly without a synthetic id.
  // Also strip the "HCI-"/"HCP-" prefix from PAN values: the printed boxes on
  // the form only hold the post-prefix portion (9 boxes for "NN-NNNNNN"); the
  // "HCI-"/"HCP-" portion is already pre-printed as a label.
  if (form.slug === 'philhealth-claim-form-2') {
    values.referred_by_hci = values.referred_by_hci === 'true' ? 'YES' : 'NO';
    for (const k of ['hci_pan', 'hcp1_accreditation_no', 'hcp2_accreditation_no', 'hcp3_accreditation_no']) {
      const v = values[k];
      if (typeof v === 'string') values[k] = v.replace(/^HC[IP]-/i, '');
    }
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

  // ── Build the iteration list: schema fields + any "synthetic" coord-only
  //    keys (e.g. dob_month/dob_day/dob_year that come from expandCombinedDates).
  //    This lets a schema use a single masked `dob` field while the source PDF
  //    still has separate per-digit boxes, without re-adding hidden schema fields.
  //    See L-SMART-04 in QuickFormsPH-PDFGenerationLearnings.md.
  const schemaIds = new Set(form.fields.map((f) => f.id));
  const syntheticIds = [
    ...Object.keys(fieldCoords).filter((id) => !schemaIds.has(id)),
    // Also include checkbox-only synthetic keys (e.g. CF-1's
    // `patient_is_member_choice` populated from a boolean schema field).
    ...Object.keys(checkboxCoords).filter(
      (id) => !schemaIds.has(id) && !(id in fieldCoords),
    ),
  ];
  type IterField = { id: string };
  const iterFields: IterField[] = [
    ...form.fields,
    ...syntheticIds.map((id) => ({ id } as IterField)),
  ];

  // ── Draw field values ─────────────────────────────────────────────────────
  for (const field of iterFields) {
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
    // No global character cap: long narratives (e.g. CF-3 history / course /
    //   lab findings, maxWidth=540 fontSize=8) must reach the auto-fit branch
    //   below, which scales down to fit and only tail-truncates if even 4pt
    //   overflows. A pre-render slice(0,60) clobbered values that would have
    //   fit the underline at the configured size. See L-SMART-CF3-03.
    const text = toWinAnsi(rawValue);

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
      // Auto-fit horizontally:
      //   1. If text overflows `maxWidth` at the configured fontSize, scale
      //      down (min 4pt, still legible on print).
      //   2. If even 4pt is too wide, truncate from the right until it fits.
      // We deliberately DO NOT pass `maxWidth` to `page.drawText` because
      // pdf-lib then wraps onto a second line that spills DOWN into the next
      // row's cell (root cause of SLF-065 R3 visual chaos).
      // See L-SLF065-R3-01 in QuickFormsPH-PDFGenerationLearnings.md.
      let drawSize = fontSize;
      let drawTextStr = text;
      if (coords.maxWidth) {
        let measured = font.widthOfTextAtSize(drawTextStr, drawSize);
        if (measured > coords.maxWidth) {
          const scaled = (drawSize * coords.maxWidth) / measured;
          drawSize = Math.max(4, scaled);
          measured = font.widthOfTextAtSize(drawTextStr, drawSize);
          while (measured > coords.maxWidth && drawTextStr.length > 1) {
            drawTextStr = drawTextStr.slice(0, -1);
            measured = font.widthOfTextAtSize(drawTextStr, drawSize);
          }
        }
      }
      page.drawText(drawTextStr, {
        x: coords.x,
        y: coords.y + yOff,
        size: drawSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }

  // ── Demo watermark (tiled diagonal overlay on every page) ─────────────────
  if (isDemo) {
    const allPages = pdfDoc.getPages();
    for (const page of allPages) {
      const { width, height } = page.getSize();
      const fSize = Math.max(18, Math.round(width / 11));
      const gapY  = fSize * 3.8;
      const gapX  = width * 0.55;
      for (let row = -1; row * gapY < height + gapY; row++) {
        for (let col = -1; col * gapX < width + gapX; col++) {
          const x = col * gapX + (row % 2 === 0 ? 0 : gapX / 2);
          const y = row * gapY;
          page.drawText('QuickFormsPH', {
            x, y, size: fSize, font,
            color: rgb(0.114, 0.306, 0.847),
            opacity: 0.10,
            rotate: degrees(-30),
          });
          page.drawText('DEMO', {
            x, y: y + fSize * 1.1,
            size: Math.round(fSize * 0.65), font,
            color: rgb(0.114, 0.306, 0.847),
            opacity: 0.10,
            rotate: degrees(-30),
          });
        }
      }
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

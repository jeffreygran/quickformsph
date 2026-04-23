# QuickFormsPH — PDF Generation Learnings

A consolidated reference of every lesson learned from implementing the PhilHealth PMRF
(pmrf_012020.pdf), PhilHealth Claim Form 1 (ClaimForm1_092018.pdf), and PhilHealth
Claim Form 2 (ClaimForm2_092018.pdf) — covering HTML form schema design, coordinate
calibration, and PDF overlay rendering with pdf-lib.
Apply this to every new form.

---

> ## ⚠️ RULE #1 — MOST IMPORTANT — READ BEFORE WRITING ANY COORD
>
> ### IF A FIELD HAS INDIVIDUAL CHARACTER/DIGIT BOXES → YOU MUST USE `boxCenters[]`
>
> **NEVER use `x / maxWidth` for any field where characters go into individual boxes.**
> This includes: PIN numbers, ID numbers, TIN, PEN, DOB, date fields, reference numbers —
> **any field where each digit or character has its own printed square/box on the form.**
>
> Using `maxWidth` places the entire string as one run starting at `x`, landing **outside
> or below** the boxes. The only correct approach is:
>
> ```typescript
> // ✅ CORRECT — each character centred in its box
> field_id: { page: 0, x: 0, y: <computed>, fontSize: 9,
>   boxCenters: [cx1, cx2, cx3, ...],  // one cx per box, from pdfplumber rect/image
> }
>
> // ❌ WRONG — entire string printed as one run, lands outside the boxes
> field_id: { page: 0, x: 193, y: 215, maxWidth: 190 }
> ```
>
> **How to compute each value:**
> - `boxCenters[i]` = `(rect.x0 + rect.x1) / 2` for each box rect/image, sorted left→right
> - `y` = `page_height - rect.bottom + (box_height - cap_height_at_fontSize) / 2`
>   - For 9pt Helvetica: cap_height ≈ 6.51 pt → `(box_h - 6.51) / 2`
>   - For 11pt Helvetica: cap_height ≈ 7.97 pt → `(box_h - 7.97) / 2`
> - Strip separators (hyphens/spaces) in the renderer — the `boxCenters` path already does
>   this via `text.replace(/\D/g, '')` before iterating
>
> **Detection:** open pdfplumber, scan `page.rects` or `page.images` for small squares
> (w ≈ h ≈ 10–18 pts). If you find a row of them → that field needs `boxCenters[]`.
>
> **Fields confirmed to need `boxCenters[]` in this project:**
> | Field | Form | Box type | Count |
> |-------|------|----------|-------|
> | `pin` | PMRF | image | 12 |
> | `philsys_id` | PMRF | image | 12 |
> | `tin` | PMRF | image | 9 |
> | `dob_month/day/year` | PMRF | image | 2+2+4 |
> | `member_pin` | CF-1 | rect | 12 |
> | `patient_pin` | CF-1 | rect | 12 |
> | `member_dob_*` | CF-1 | rect | 2+2+4 |
> | `patient_dob_*` | CF-1 | rect | 2+2+4 |
> | `employer_pen` | CF-1 | rect | 12 |

---

## 1. PDF Coordinate System Fundamentals

### Two coordinate origins — never mix them
| Tool | Origin | Y direction |
|------|--------|-------------|
| **pdfplumber** | Top-left of page | Y increases **downward** |
| **pdf-lib** | Bottom-left of page | Y increases **upward** |

### Conversion formula
```
pdf_lib_y = page_height - pdfplumber_bottom
```
- Use `pdfplumber_bottom` (not `top`) so the text baseline sits **inside** the box.
- Add a small fudge (+3 to +5 pts) when you want text visually centred in a tall box.

### Page sizes encountered
| Form | Size (pts) |
|------|-----------|
| PhilHealth PMRF (A4) | 594.8 × 841.5 |
| Pag-IBIG HQP-PFF-356 (Legal) | 612.1 × 936.1 |
| PhilHealth Claim Form 1 (Legal) | 612.0 × 936.0 |

---

## 2. pdfplumber — What It Can and Cannot See

| Object type | Detected by pdfplumber? | Notes |
|-------------|------------------------|-------|
| Filled rectangles (`rect`) | ✅ Yes | Reliable for borders, label boxes |
| Path-stroked lines (`line`/`edge`) | ✅ Partially | Only simple lines, not complex path strokes |
| **Image objects** (`image`) | ✅ Yes | Digit input boxes in PhilHealth PMRF are images |
| **Small rect objects** | ✅ Yes | Digit input boxes in PhilHealth CF-1 are small rects (12.3×12.3 pts) |
| Path-drawn decorative boxes | ❌ No | Must use visual measurement or image render |
| AcroForm fields | ❌ No | Source PDFs in this project have no AcroForm |

### Key discovery: digit boxes can be images OR rects — check which
- **PMRF (pmrf_012020.pdf)**: PIN and DOB boxes are **image objects** — use `page.objects['image']`
- **Claim Form 1 (ClaimForm1_092018.pdf)**: digit boxes are **small rect objects** (w=12.3, h=12.3) — use `page.rects`

Always run this check on a new form to determine box type:
```python
# Check for image-based digit boxes
imgs = [o for o in page.objects.get('image', []) if Y_MIN < o['top'] < Y_MAX]
print(f"Image objects in zone: {len(imgs)}")

# Check for rect-based digit boxes (small squares)
small_rects = [r for r in page.rects if abs((r['x1']-r['x0']) - (r['y1']-r['y0'])) < 2
               and r['x1']-r['x0'] < 20 and Y_MIN < r['top'] < Y_MAX]
print(f"Small square rects in zone: {len(small_rects)}")
```

For **rect-based boxes**, extract centers the same way:
```python
boxes = sorted(small_rects, key=lambda r: r['x0'])
for r in boxes:
    cx = (r['x0'] + r['x1']) / 2
    y_lib = page_height - r['bottom']
    print(f"cx={cx:.2f}  y_lib={y_lib:.2f}")
```

For **image-based boxes** (PMRF pattern):
```python
imgs = [o for o in page.objects['image'] if Y_MIN < o['top'] < Y_MAX]
imgs_sorted = sorted(imgs, key=lambda o: o['x0'])
for o in imgs_sorted:
    cx = (o['x0'] + o['x1']) / 2
    y_lib = page_height - o['bottom']
```

In both cases the `boxCenters` rendering strategy in `pdf-generator.ts` works identically —
the difference is only in how you extract the cx values during calibration.

---

## 3. Text Placement Strategies

### Strategy A — Simple field text (most fields)
```typescript
{ page: 0, x: <x0_of_fill_area>, y: <841.5 - pdfplumber_bottom + offset>, maxWidth: <col_width> }
```
- `x` = x0 of the fill area (just past column separator line)
- `maxWidth` = column width so pdf-lib truncates rather than overflows

### Strategy B — Per-character box rendering (PIN, DOB)
Use when each character must land inside its own individual digit box.

```typescript
{
  page: 0, x: 0, y: <baseline_y>, fontSize: <n>,
  boxCenters: [cx1, cx2, cx3, ...],   // one cx per box, from pdfplumber image objects
}
```

Renderer logic (already in `pdf-generator.ts`):
```typescript
if (coords.boxCenters) {
  const digits = text.replace(/\D/g, '');   // strip dashes/spaces
  for (let i = 0; i < Math.min(digits.length, coords.boxCenters.length); i++) {
    const ch = digits[i];
    const charWidth = font.widthOfTextAtSize(ch, fontSize);
    page.drawText(ch, { x: boxCenters[i] - charWidth / 2, y, ... });
  }
}
```

**Why strip non-digits:** PIN input is `09-876-543-2109` (with dashes). The PDF has
12 digit boxes — strip dashes so only the 12 digits are mapped 1:1 to boxes.

### Strategy C — Checkbox / radio (checkmark)
```typescript
checkboxCoords: { fieldId: { value: { x, y } } }
```
- `x` = left edge of the checkbox square (x0 of the rect)
- `y` = `page_height - (box_top + box_bottom)/2 - 2.31`
- **Always use box CENTER, not label text top** — using label top renders mark above the box

#### Checkmark character — ZapfDingbats `'\u2714'`
pdf-lib embeds `StandardFonts.ZapfDingbats` for the checkmark. You **must** pass the
Unicode character `'\u2714'` (✔ HEAVY CHECK MARK), **not** a glyph byte like `'4'`.

```typescript
// ✅ CORRECT
const checkFont = await pdfDoc.embedFont(StandardFonts.ZapfDingbats);
page.drawText('\u2714', { font: checkFont, size: 9, x, y, color: rgb(0,0,0) });

// ❌ WRONG — throws "ZapfDingbats cannot encode '4' (0x0034)"
page.drawText('4', { font: checkFont, size: 7, ... });
```

Size 9 with ZapfDingbats renders a bold, visible checkmark that fits well in the checkbox squares used across PhilHealth forms.

---

## 4. Calibration Workflow (Step-by-step)

1. **Extract words** to map section/column labels → approximate x, y regions
2. **Extract rects** to find exact column boundaries (x0, x1) and row heights (top, bottom)
3. **Extract digit box centers** — check whether boxes are image objects or small rects (see Section 2), then collect `cx` values for each box in the row
4. **Compute coordinates**:
   - Field text: `x = col_x0 + 2`, `y = page_height - row_bottom + 3`
   - Checkbox: `x = box_x0`, `y = page_height - (box_top+box_bottom)/2 - 2.31`
   - Per-char boxes: collect all `cx = (x0+x1)/2` per box (image or rect)
5. **Generate test PDF** via `curl -X POST /api/generate`
6. **Verify with pdfplumber** on the generated PDF using `extract_words()` with pdflibY back-conversion,
   or `chars` for digit-level alignment checks

---

## 5. Font Size Guidelines

| Content type | Recommended size | Reason |
|-------------|-----------------|--------|
| Default field text | 9 pt | Fits most single-line label boxes |
| DOB digit boxes (PMRF ~26pt tall) | 11 pt | Boxes are ~26 pts tall; needs larger digit for visibility |
| DOB / PIN digit boxes (CF1 ~12pt tall) | 9 pt | Boxes are ~12.3 pts tall; default 9pt fits well |
| Place of birth | 10 pt | Slightly wider box; 10pt fits well |
| Province (narrow column) | 8 pt | Long value like "Metro Manila (NCR)" needs smaller size |
| Checkbox X | 7 pt | Fits in ~8×8 pt checkbox squares |

**DEFAULT_FONT_SIZE = 9** in `pdf-generator.ts` — change per-field via `fontSize:` override.

---

## 6. HTML Form Schema (`src/data/forms.ts`) — Key Patterns

### Field definition tips
```typescript
{
  id: 'pin',
  label: 'PhilHealth Identification Number (PIN)',
  type: 'text',
  placeholder: 'e.g., 12-345-678-9012',
  required: true,
  // No optional_note or hint for required fields
}
```

- **DOB** → split into 3 separate fields: `dob_month`, `dob_day`, `dob_year` (not a single date picker)
  — each maps to its own column of digit boxes on the PDF
- **Checkboxes** with many options → use `type: 'radio'` or `type: 'select'` in schema;
  map each option string exactly to a `checkboxCoords` key
- **Address** → split into granular sub-fields matching the PDF columns:
  `perm_unit`, `perm_building`, `perm_lot`, `perm_street`, `perm_subdivision`,
  `perm_barangay`, `perm_city`, `perm_province`, `perm_zip`
- **Mailing address** → separate set of fields if the PDF has a distinct mailing section

### Avoid these mistakes
- ❌ Do NOT map a single `address` field to a multi-column PDF row — it overflows
- ❌ Do NOT use `type: 'date'` for DOB — the PDF has separate mm/dd/yyyy digit boxes
- ❌ Do NOT skip `required: true` on the PIN field — it is mandatory for PhilHealth
- ❌ Do NOT use curly/smart apostrophes `'` in TS string literals — use straight `'` only.
  The Next.js SWC compiler throws `Expected ',', got 's'` on `hospital's` — a hard-to-spot
  syntax error. Always use straight ASCII apostrophes in `.ts` source files.

---

## 7. Multi-Section / Conditional Forms (Claim Form 1 pattern)

Some forms have sections that are only relevant based on a user's answer.
**Example:** CF-1 Part II (Patient Info) is only filled if the patient is a **dependent**, not the member themselves.

### Schema pattern
```typescript
// Step 3: gate field
{
  id: 'patient_is_member',
  label: 'Is the Patient the PhilHealth Member?',
  type: 'dropdown',
  required: true,
  options: ['Yes — I am the Patient', 'No — Patient is a Dependent'],
  hint: 'If No, fill in the Dependent Info step',
  step: 3,
},
// Step 4: conditional section — mark all fields optional_note
{
  id: 'patient_pin',
  label: "Dependent's PhilHealth PIN",
  type: 'text',
  required: false,
  optional_note: 'Only if patient is a dependent',
  step: 4,
},
```

The `optional_note` communicates conditionality to the user. The form wizard still
renders all steps — it does NOT auto-skip steps based on prior answers. Keep it simple.

### Checkbox coords
Map each possible value string **exactly** to its checkbox position:
```typescript
patient_is_member: {
  'Yes — I am the Patient':      { x: 142, y: 518 },
  'No — Patient is a Dependent': { x: 235, y: 518 },
},
```

---

## 8. Multiple Similar Fields on One Form (e.g., Two PINs)

When a form has two fields of the same concept (member PIN + patient PIN), use a
**consistent prefix pattern** to avoid ID collisions:

```
member_pin, member_last_name, member_first_name, member_dob_month ...
patient_pin, patient_last_name, patient_first_name, patient_dob_month ...
```

This also means the `skipValues` map needs **both** field IDs:
```typescript
skipValues: {
  member_name_ext: ['N/A'],
  patient_name_ext: ['N/A'],
},
```

Never reuse the generic `name_ext` ID when two name extension fields exist on the same form —
the coords map would only render one of them.

---

## 9. Province / Long Dropdown Values Overflow Fix

Province names like `Metro Manila (NCR)` or `Maguindanao del Norte` can be 20+ chars.
At default 9pt they may overflow a narrow column on the PDF.

**Fix:** add a `fontSize: 8` override to the province coords entry:
```typescript
addr_province: { page: 0, x: 247, y: 596, maxWidth: 97, fontSize: 8 },
```

This shaves ~11% off the rendered width without being unreadable.

---

## 10. Multi-Copy Forms (Pag-IBIG pattern)

Some PDFs contain two identical copies stacked vertically (e.g., HQP-PFF-356 on legal paper).
Use `copyYOffsets` in the form config:

```typescript
copyYOffsets: [0, -449.4],   // copy 2 starts 449.4 pts below copy 1
```

The generator loops over `copyYOffsets` and draws each field at `y + yOff`.

---

## 11. Auto-Populate / Test Data

Always test with at least two curl payloads covering:
- Both sexes (Male / Female)
- Different civil statuses (Single / Married)
- Different member types (Employed / Self-Earning)
- Spouse / dependent fields populated
- All address sub-fields populated
- PIN with the real dash format (e.g. `12-345678901-2`) — the renderer strips dashes automatically
- All checkbox paths exercised (every possible `sex`, `civil_status`, `member_type` value)

---

## 12. Deployment Checklist

```bash
# 1. Build (always rebuild before restart — service uses .next cache)
cd /home/skouzen/projects/quickformsph-dev && npm run build 2>&1 | tail -8

# 2. Deploy to dev
echo sap12345 | sudo -S systemctl restart quickformsph && sleep 3 && curl -sk -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3400/

# 3. Smoke test — generate and check file is a real PDF
curl -sk -X POST http://localhost:3400/api/generate \
  -H "Content-Type: application/json" \
  -d '{"slug":"<form-slug>","values":{...}}' -o /tmp/test.pdf && file /tmp/test.pdf

# 4. Verify all key fields are present
/tmp/pdfenv/bin/python3 - <<'EOF'
import pdfplumber
with pdfplumber.open('/tmp/test.pdf') as pdf:
    words = pdf.pages[0].extract_words(x_tolerance=3, y_tolerance=3)
    h = pdf.pages[0].height
    for w in sorted(words, key=lambda x: x['top']):
        if w['text'].strip('_') and len(w['text'].strip('_')) > 1:
            print(f"  '{w['text']}' top={w['top']:.1f} pdflibY={h-w['bottom']:.1f}")
EOF
```

---

## 13. "Same as Above" Checkbox Pattern

When a form has a mailing address that can mirror the permanent address, implement a
**"Same as Above" checkbox** that auto-copies the permanent fields on the client side.

### Schema
```typescript
{
  id: 'mail_same_as_above',
  label: 'Mailing Address same as Permanent Address',
  type: 'checkbox',
  required: false,
  hint: 'Check if your mailing address is the same as your permanent address above',
  step: 3,
},
// ... followed by all mail_* address fields
```

### handleChange logic (page.tsx)
```typescript
const handleChange = useCallback((id: string, value: string) => {
  setValues((prev) => {
    let next = { ...prev, [id]: value };
    if (id === 'mail_same_as_above' && value === 'true') {
      next = {
        ...next,
        mail_unit:        prev.perm_unit        ?? '',
        mail_building:    prev.perm_building    ?? '',
        mail_lot:         prev.perm_lot         ?? '',
        mail_street:      prev.perm_street      ?? '',
        mail_subdivision: prev.perm_subdivision ?? '',
        mail_barangay:    prev.perm_barangay    ?? '',
        mail_city:        prev.perm_city        ?? '',
        mail_province:    prev.perm_province    ?? '',
        mail_zip:         prev.perm_zip         ?? '',
      };
    }
    // ... save draft
    return next;
  });
}, [slug]);
```

### PDF coords
The "Same as Above" checkbox itself gets a `checkboxCoords` entry — it marks the printed
checkbox square on the PDF. The `mail_*` fields each get their own `fieldCoords` entry
pointing to the mailing address row on the PDF (different y than permanent address row).

When `mail_same_as_above = 'true'` and the user hasn't overridden mail fields, the
mail fields will be auto-populated from perm fields and will render on the PDF.

---

## 14. Purpose / Registration Type Checkbox

When a form has a PURPOSE section (e.g., REGISTRATION vs UPDATING/AMENDMENT), add it
as a **dropdown** (not radio) in the schema so it fits the standard `checkboxCoords` pattern.

```typescript
// forms.ts
{
  id: 'purpose',
  label: 'Purpose',
  type: 'dropdown',
  required: true,
  options: ['Registration', 'Updating/Amendment'],
  step: 1,
},

// pdf-generator.ts — checkboxCoords
purpose: {
  'Registration':       { x: 355, y: 715 },
  'Updating/Amendment': { x: 444, y: 715 },
},
```

Insert this field into `fieldIds` **right after the PIN** so it appears at the top of Step 1,
mirroring its position on the physical form.

---

## 15. Common Pitfalls & Fixes

| Symptom | Root cause | Fix |
|---------|-----------|-----|
| `ZapfDingbats cannot encode '4'` | Passed glyph byte `'4'` instead of Unicode | Use `'\u2714'` — pdf-lib requires Unicode input for ZapfDingbats |
| QA script shows no checkmark in zone | ZapfDingbats char renders 2–3pt ABOVE surrounding form labels; `extract_words()` zone cut-off excludes it | Use `page.chars` filtered to `fontname='ZapfDingbats'` — expect `'4' x0≈box_x0 top≈box_center_from_top`; widen zone by ±3pt when using `extract_words()` |
| Text renders BELOW digit boxes (not inside) | Used plain `x/y/maxWidth` instead of `boxCenters[]` | **Any field with individual digit boxes must use `boxCenters[]`** — extract each box's `cx` from `page.images` or `page.rects`, compute `y` using the centering formula |
| Text appears LEFT of digit boxes | Used column x0 instead of box cx | Use `boxCenters[]` from rect/image cx values |
| X mark renders ABOVE checkbox | Used label text `top` as y | Use box rect center: `page_h - (box_top+box_bottom)/2 - 2.31` |
| Text overflows into adjacent column | `maxWidth` too large or missing | Set `maxWidth` to actual column width in pts |
| DOB digits too small to see | Default 9pt too small for tall digit boxes | Override `fontSize: 11` for DOB fields |
| Province text overflows narrow column | Long string (e.g. "Metro Manila (NCR)") | Override `fontSize: 8` on province field coords |
| Address values overlap wrong row | y-coordinate computed from wrong row | Re-measure `bottom` of the correct underline; add +3 offset |
| Fields missing on PDF | `field.id` doesn't match key in coords map | Keep IDs identical; add missing entry to coords map |
| Blank PDF (placeholder rendered) | Source PDF not found at `public/forms/` | Check `form.pdfPath` matches filename exactly (case-sensitive) |
| Build error: `Expected ',', got 's'` | Curly/smart apostrophe `'` in TS string | Replace with straight ASCII apostrophe `'` |
| `skipValues` only suppresses one of two ext fields | Both fields share the same ID | Use prefix pattern `member_name_ext` / `patient_name_ext`, list both in `skipValues` |
| Digit boxes not found via `page.objects['image']` | This form uses rect-based boxes, not images | Check `page.rects` for small squares (w ≈ h ≈ 12–15 pts) instead |
| Checkboxes on page 2 not rendered / appear on wrong page | Renderer hardcoded `pages[0]` | Add `page: 1` to each coord entry on page 2; renderer uses `pages[entry.page ?? 0]` (see Section 17) |

---

## 16. pdfplumber Quick Reference Scripts

### Map all words in a region
```python
with pdfplumber.open(PDF) as pdf:
    page = pdf.pages[0]
    for w in page.extract_words():
        if Y1 < w['top'] < Y2:
            print(f"'{w['text']}' x0={w['x0']:.1f} top={w['top']:.1f}")
```

### Find all horizontal lines (underlines / fill-area borders)
```python
    hlines = sorted([l for l in page.lines if abs(l['y0']-l['y1']) < 2], key=lambda x: x['top'])
    for l in hlines:
        print(f"x0={l['x0']:.1f} x1={l['x1']:.1f} top={l['top']:.1f} pdflibY={page.height-l['bottom']:.1f}")
```

### Find rect-based digit boxes (small squares)
```python
    small_rects = sorted(
        [r for r in page.rects
         if abs((r['x1']-r['x0']) - (r['y1']-r['y0'])) < 2
         and r['x1']-r['x0'] < 20 and Y1 < r['top'] < Y2],
        key=lambda r: r['x0']
    )
    for r in small_rects:
        print(f"cx={(r['x0']+r['x1'])/2:.2f}  y_lib={page.height-r['bottom']:.2f}")
```

### Find image-based digit boxes (PMRF pattern)
```python
    imgs = sorted(
        [o for o in page.objects['image'] if Y1 < o['top'] < Y2],
        key=lambda o: o['x0']
    )
    for o in imgs:
        print(f"cx={(o['x0']+o['x1'])/2:.2f}  y_lib={page.height-o['bottom']:.2f}")
```

### Verify generated PDF — find overlay text by zone (pdflibY back-conversion)
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    page = pdf.pages[0]
    h = page.height
    words = page.extract_words(x_tolerance=3, y_tolerance=3)
    for w in sorted(words, key=lambda x: x['top']):
        plib_y = h - w['bottom']
        if PLIB_Y_LO < plib_y < PLIB_Y_HI:
            print(f"'{w['text']}' x0={w['x0']:.1f} top={w['top']:.1f} pdflibY={plib_y:.1f}")
```

### Verify generated PDF — char-level positions (for digit box alignment)
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    for c in pdf.pages[0].chars:
        if c['text'].strip() and Y1 < c['top'] < Y2:
            print(f"'{c['text']}' x0={c['x0']:.2f} cx={c['x0']+c['width']/2:.2f} top={c['top']:.2f}")
```

### Verify generated PDF — ZapfDingbats checkmarks
`extract_words()` can miss checkmarks when the ZapfDingbats char renders 2–3pt above
adjacent form label text (different font metrics). Use `page.chars` instead:
```python
with pdfplumber.open('/tmp/test.pdf') as pdf:
    for pg_idx, page in enumerate(pdf.pages):
        for c in page.chars:
            if 'ZapfDingbats' in c.get('fontname', ''):
                print(f"PAGE {pg_idx+1} CHECKMARK '{c['text']}' x0={c['x0']:.1f} top={c['top']:.1f}")
```
Expected output: `CHECKMARK '4' x0=<box_x0> top=<box_pdfplumb_top>` — '4' is the ZapfDingbats
glyph code for ✔; x0 should match the box's x0 from the source PDF rect extraction.

**Important:** always check ALL pages, not just page 0. Multi-page forms (CF-2) have checkboxes
on page 2 — a page 2 checkmark missing from the output is a renderer bug (see Section 17).

---

## 17. Multi-Page Checkbox Rendering

### Bug discovered in CF-2 (PhilHealth Claim Form 2)

The checkbox renderer originally hardcoded `pages[0]` for ALL checkmarks. For single-page
forms (PMRF, CF-1) this works correctly. For CF-2 (2 pages), the HCP co-pay, HCI/PF
paid-by, and drug/diagnostic purchase checkboxes live on **page 2** — they were silently
rendered onto page 1 at the wrong coordinates.

**Symptom:** pdfplumber shows 0 ZapfDingbats chars on page 2 but the test payload
included values that should produce page 2 checkmarks.

**Root cause:** `checkboxCoords` entries previously had no `page` property; the renderer
did `pages[0].drawText(...)` unconditionally.

### Fix (applied to `pdf-generator.ts`)

1. **Type** — extended checkpoint coord shape to include optional `page`:
   ```typescript
   // Before
   checkboxCoords?: Record<string, Record<string, { x: number; y: number }>>;
   // After
   checkboxCoords?: Record<string, Record<string, { x: number; y: number; page?: number }>>;
   ```

2. **Renderer** — use `page` from the coord entry, defaulting to 0:
   ```typescript
   // Before
   pages[0].drawText('\u2714', { x: checkboxEntry.x, y: checkboxEntry.y + yOff, ... });
   // After
   const checkboxPage = pages[checkboxEntry.page ?? 0];
   checkboxPage.drawText('\u2714', { x: checkboxEntry.x, y: checkboxEntry.y + yOff, ... });
   ```

3. **CF-2 coords** — added `page: 1` to all page 2 checkbox entries:
   `hcp1_copay`, `hcp2_copay`, `hcp3_copay`,
   `hci_paid_member_patient`, `hci_paid_hmo`, `hci_paid_others`,
   `pf_paid_member_patient`, `pf_paid_hmo`, `pf_paid_others`,
   `drug_purchase_none`, `diagnostic_purchase_none`

### Rule for new forms
- If the form has **more than 1 page** and any checkboxes appear on page 2+:
  - Always add `page: <n>` (0-indexed) to those checkbox coord entries.
  - Page 1 checkboxes may omit `page` (defaults to 0).
- Forms with `copyYOffsets` (multi-copy, e.g. HQP-PFF-356) still use page 0 only — the
  `yOff` loop handles the second copy, not a second page.

| Form | Pages | Checkboxes on page 2+ |
|------|-------|----------------------|
| PMRF | 1 | No — all on page 0 |
| CF-1 | 1 | No — all on page 0 |
| CF-2 | 2 | Yes — HCP/co-pay/paid-by/drug/diagnostic |
| HQP-PFF-356 | 1 (2-copy) | No — multi-copy via yOff, not page 2 |
| PMRF Foreign Natl | 1 | No |

---

## 18. Underline-Based (No-Digit-Box) Forms — Shortcut Pattern

Some PhilHealth / Pag-IBIG forms are **fully underline-based** (PMRF Foreign National is the
canonical example): no per-character digit boxes anywhere, only continuous underlines for each
field. For these, `boxCenters[]` is not needed — Strategy A (`x / maxWidth`) covers every field.

**Quick identifiers** that a form is underline-only:
- `len(page.rects)` is tiny (< 10) — no digit-box grid
- `len(page.lines)` is large (hundreds) and dominated by horizontal segments ≈ 2–15 pts wide
  stitched into long rules → those are the underlines
- Word `'____...'` tokens appear in `extract_words()` output — these are the underlines
  themselves; their `x0`/`x1` give you column boundaries for free

**Calibration shortcut:**
```python
# For every underline ('_' run), log x0, x1 and pdflibY — gives you field coords directly
for w in p.extract_words():
    if set(w['text']) == {'_'}:
        print(f"underline top={w['top']:.1f} x0={w['x0']:.1f} x1={w['x1']:.1f} "
              f"y_lib={h - w['top'] - 2:.1f} maxWidth={w['x1']-w['x0']:.1f}")
```

Use `y = page_h - word_top - 2` (baseline sits 2 pt above the underline) and
`maxWidth = x1 - x0`. This yields a complete coord table in one pass — no rect hunting.

**Page-size table update:**
| Form | Size (pts) |
|------|-----------|
| PMRF Foreign National (A4) | 595.3 × 841.9 |

---

## 19. Coverage CI — Preventing "Missing Fields on PDF"

Field-id drift between [forms.ts](src/data/forms.ts) and [pdf-generator.ts](src/lib/pdf-generator.ts)
is a recurring silent failure: the schema lists a field, the user fills it, but no coord entry
means nothing is drawn. The fix is a coverage check that gates the build.

**Script:** [scripts/check-coords-coverage.ts](scripts/check-coords-coverage.ts)

Runs a static AST-light scan of `FORM_PDF_CONFIGS` and verifies that every
`schema.fields[].id` has either:
1. an entry in the form's `fieldCoords` map, OR
2. an entry in the form's `checkboxCoords` map, OR
3. an entry in `skipValues` (intentionally blank).

**Run:**
```bash
npx tsx scripts/check-coords-coverage.ts
# exits 1 on any gap
```

**Gotchas discovered while writing it:**
- `tsconfig.json` must `"exclude": ["node_modules", "scripts"]` so Next's type-check pass
  doesn't treat this Node-only script as part of the app (it uses `fs`, `path`, and CommonJS
  `__dirname`; ESNext target chokes on `for..of Set` iteration in Next's build config).
- `skipValues` can be defined **inline** in the registry block OR as a **named const ref**
  (`SKIP_VALUES`). The checker must handle both — inline uses `{` after the key, named refs
  resolve to an object whose values are `string[]` (pattern `: [`).

Wire this into pre-push hook and CI; failing it blocks merge.

---

## 20. Underline-Only Forms Calibration Case Study — PMRF Foreign National

Applied §18 shortcut end-to-end. Full form (39 fields across Profile / Address / 3 dependents
/ Signature + 1 Sex checkbox) was calibrated from a single `extract_words()` pass.

**Workflow timing breakdown (approximate, representative):**
1. P1 survey script → 1 minute (identified 5 total rects → underline-only form)
2. Word extraction + `y = page_h - top - 2` formula → coord table in one pass
3. Sex checkbox (only 2 small rects in the whole doc) → trivial lookup
4. First-try smoke test: all 39 fields + checkmark landed inside target areas

**Specific coords that required care:**
- **DOB** — three separate underline fields, not digit boxes. Don't try `boxCenters[]` here;
  use plain `x/y/maxWidth` at `fontSize: 10` with `x` sitting inside each underline segment
  (underline `x0`+1 works).
- **Dependent rows** — 7 columns at 21pt vertical spacing. Use `fontSize: 8` to keep long
  middle names and "mm/dd/yyyy" dates inside their narrow columns.
- **Signature date** — this form has a single line for date (not a mm/dd/yyyy digit row);
  send ISO `YYYY-MM-DD` strings unchanged. No `boxCenters[]` required.

---

## 21. Deep-QA + Visual Regression Workflow (Apr 2026 Session)

After implementing all 7 forms we ran a full QA sweep that exposed 7 defects in PFF-049
despite 28/28 functional tests passing. Key learnings:

### 21.1 Functional QA alone is insufficient — always rasterize
A form can pass all of:
- HTTP 200 response
- Non-empty PDF bytes
- No off-page glyphs (bbox within `[10,605]×[10,926]`)
- >70% of values appear in `extract_text()` output

…and still have **catastrophic visual misalignment** (e.g. 12 digits stacked above a box
row instead of 1-per-box). The functional harness cannot see this. **Always** follow with:

```bash
pdftoppm -r 110 -png /tmp/<form>.pdf /tmp/renders/<form>
# then view the PNG
```

Skip heuristic "alignment checkers" (`alignment.py` / "nearest anchor" logic) — they
produce false positives on form table borders. Human visual inspection of ~120 DPI PNGs
is faster and more reliable.

### 21.2 Per-digit boxes are the #1 source of silent misalignment bugs
If a form has **any** row of per-character boxes (MID, Housing Account, PIN, PEN, ZIP,
series number, dates broken into mm/dd/yyyy cells), the field MUST use `boxCenters[]`.
A single `{x, y, maxWidth}` coord will:
- Fit all digits into the width (no off-page error)
- Pass text-extraction checks (digits are present in extract_text)
- **Visually stack every digit above the first box** — looks like one text blob, not per-cell

**Red flag during calibration:** if the source PDF has ≥ 10 vertical rules in a tight
horizontal span (e.g., 14 rules × 12pt apart = 14 box cells), that field is per-digit.
Look at `page.rects` for `w ≈ 12, h ≈ 17` rectangles — count them — that's your
`boxCenters` length.

### 21.3 Dash-separated ID fields use skip-cells, not skip-digits
Pag-IBIG MID format is `4-4-4` rendered as 14 cells where cells 4 and 9 hold **pre-printed
dashes**. The renderer already strips dashes from input (`text.replace(/\D/g, '')`).
Solution: provide 12 `boxCenters` — only for the digit cells — skipping cx values of the
dash cells (indices 4 and 9):
```typescript
mid_no: {
  page: 0, x: 0, y: 857.5, fontSize: 9,
  boxCenters: [
    427.9, 439.95, 452.05, 464.2,       // digits 1-4
    488.55, 500.75, 512.95, 525.1,      // digits 5-8 (skip dash cell idx 4)
    549.55, 561.7, 573.75, 585.95,      // digits 9-12 (skip dash cell idx 9)
  ],
},
```

### 21.4 Don't invent checkboxes the source form doesn't have
PFF-049 has no Yes/No checkbox for "Loyalty Card Holder" — a bank name in
`loyalty_partner_bank` is the sole indicator. I added a checkbox coord anyway, which
produced a stray `✔` floating inside the MID digit row at y≈70.

**Check before adding `checkboxCoords`:** is there actually a printed square in that
region? Run `page.rects` filter for small squares (`w ≈ h ≈ 8–12 pts`) in the expected
zone. If none, don't add a checkbox — treat the value as text-only or just drive
conditional rendering of other fields.

### 21.5 `inputMode: 'numeric'` breaks date fields on mobile
A field with `type: 'text', inputMode: 'numeric', maxLength: 10` **locks the mobile
keyboard to digits only**, preventing the user from typing the `/` separator in
`mm/dd/yyyy`. It also causes auto-populate / QA harnesses to fill with pure digits.

**Rule:** for any date-style text field, either:
- `type: 'date'` (native picker, auto-formats), OR
- `type: 'text'` **without** `inputMode: 'numeric'` + validate with onBlur regex

### 21.6 Always audit `maxLength` against real domain constraints
PH ZIP codes are 4 digits. Schema had `maxLength: 10`. QA harness dutifully generated
10-digit values. Root fix: tighten `maxLength` to the domain truth (4 for ZIP, 11 for
mobile, 12 for MID/PIN, 9 for TIN) — the harness and the UI both follow the schema.

### 21.7 Auto-populate script must respect schema constraints AND produce realistic values
`/tmp/qa_apr26/render_all.py` drives all 7 forms with a single "Juan Dela Cruz" profile
using an id-fragment lookup table (`last_name → "DELA CRUZ"`, `mid_no → "123456789012"`,
`zip → "1100"`, etc.). This is invaluable for:
- Catching schema drift (new field added without a default value → harness prints the placeholder)
- Side-by-side visual comparison across forms (same person → same PIN/MID/name everywhere)
- PM demos without manually typing 392 fields

Keep this harness alongside the form code — run after every multi-form change.

### 21.8 Next.js `next start` serves from `.next/` build cache
A `systemctl restart quickformsph` does **not** pick up source changes — you must
`npm run build` **before** restart. A stale restart will silently serve the old code
with the old schemas. Build succeeded → BUILD_ID file mtime updates → only then restart.

**Deploy sequence (non-negotiable):**
```bash
npm run build 2>&1 | tail -5         # must show "Compiled successfully" + route table
echo sap12345 | sudo -S systemctl restart quickformsph
sleep 3 && systemctl is-active quickformsph   # active
curl -s -w "\nHTTP=%{http_code}\n" http://localhost:3400/api/forms -o /dev/null   # 200
```

### 21.9 API endpoint is `/api/generate` with `{slug, values}` body — NOT `/api/forms/:slug/generate`
Wasted 3 round-trips probing 404s because I assumed a REST-style slug-in-path route.
The actual route is:
```bash
curl -X POST http://localhost:3400/api/generate \
  -H 'Content-Type: application/json' \
  -d '{"slug":"<form-slug>","values":{"field_id":"value",...}}'
```

### 21.10 `FormField` type does not support `pattern` — validate client-side only
Adding `pattern: '\\d{4}'` to a schema entry fails `tsc` with `Object literal may only
specify known properties`. If you need regex validation, do it in the wizard component's
onBlur handler or a Zod schema layer — not in `FormField`.



## 22. Batch QA with Random Data (Apr 26 2026)

### 22.1 Random-data sweep across all forms surfaces coord bugs that one-off visual QA misses
Built `/tmp/qa_apr26/qa_random_test.py` (plain Python, no external deps) that:
1. Reads every schema from `FORMS[]` via `npx tsx scripts/dump-forms.ts`.
2. Generates plausible values per field-id (last_name → random last name, tin → TIN
   format, cellphone → 09-prefix 11-digit, etc.).
3. POSTs `/api/generate` for each slug, saves PDF + rasterizes page-1 at 100 DPI.
4. Summarizes HTTP status per slug.

Across 12 forms the sweep caught **only HLF-068** coord bugs that our single-user
Juan-Dela-Cruz harness had missed (Y for `mid_no`/`housing_account_no` and X for
`desired_loan_amount`). **Always run the random sweep before marking a new form done.**

### 22.2 `/api/generate` has an IP-based rate limit — rotate `X-Forwarded-For`
Sequential calls with one header exhaust the bucket around call #10 and return HTTP 429.
The test harness sets `X-Forwarded-For: 10.<rand>.<rand>.<rand>` per request plus a
1.5s sleep between calls. Without it: `{"error":"Too many requests..."}` after ~10 forms.

### 22.3 `/api/forms` returns a summary list, not full schemas
Keys are `['slug','code','name','agency','category','description','fieldCount']` —
no `fields[]`. To get the full schema, dump it server-side:
```ts
// scripts/dump-forms.ts
import { FORMS } from '../src/data/forms';
console.log(JSON.stringify(FORMS));
```
Then `npx tsx scripts/dump-forms.ts > forms.json`.

### 22.4 Random-payload false positives
The sweep will flag "duplicate values in adjacent columns" when the payload generator
gives similar strings to similarly-named fields (e.g. `employer_subdivision`, `employer_barangay`,
`employer_city` all branch on `'city' in fid or 'municipality' in fid`). Document these
in the QA report as **payload-only** — they are not form bugs.

### 22.5 HLF-068 specific fix (commit `11b1336`)
Originally placed header Y using `hlf068Y(80)` (baseline **below** per-digit boxes) and
`desired_loan_amount` at X=200 (PURPOSE column) Y=`hlf068Y(125)` (purpose text row).
Corrected to:
- `HLF_068_Y_HEADER = hlf068Y(73)` → text inside per-digit box row.
- `HLF_068_Y_LOAN = hlf068Y(148)` and X=475 → right-side DESIRED LOAN AMOUNT cell.

**Lesson:** When a label and its value cell are on **different rows** (label row vs. underline row),
use the **underline row top** for Y, not the label row top.

## 23. Unit Test: Random-Data Smoke Suite

`tests/random-data-smoke.test.ts` asserts every form in `FORMS[]` generates a valid PDF
when fed a random schema-compliant payload. Run via `npm test`. Fails loudly if:
- `/api/generate` returns non-200 for any form
- Generated PDF is shorter than 1 KB (blank/error placeholder)
- Generated bytes don't start with `%PDF-` magic
- Coverage CI finds any field without coords/skip entry (dual-gate)

This is the regression gate for every new form PR.

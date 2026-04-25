# Learnings Addendum — BIR October 2025 (ENCS) form-family rect patterns

*Discovered during Gate 1 intake of BIR 1901/1902/1904/1905 on 2026-04-24.*
*Append to `QuickFormsPH-PDFGenerationLearnings.md` before the next intake.*

## New finding — BIR rect colour convention

All four BIR October 2025 forms use a **different colour convention** for
fillable cells than PhilHealth / Pag-IBIG / HQP-PFF forms. Failing to account
for this will cause a "no fillable rects found" false-negative during Gate 4.

| Agency | User-fillable cell `non_stroking_color` | Agency-only cell `non_stroking_color` |
|--------|---|---|
| Pag-IBIG (legacy) | `None` or `1.0` (white) | `~0.698` (gray) |
| PhilHealth (legacy) | `None` or `1.0` (white) | `~0.698` (gray) |
| **BIR October 2025** | **`0.749`** (light gray bevel) | **`1.0`** (white) with pre-printed `0` |

The BIR PDFs render EVERY text cell, digit box and checkbox as a gray-bevelled
rect pair (outer `h≈14-20` + inner `h≈10`, both `ns=0.749`). What looks "white"
visually is the bevel fill, not a white rect. The **truly white** rects on a
BIR form are the **pre-filled `0 0 0 0 0` agency-only cells** (e.g. "TIN to be
issued", "Municipality Code", trailing 5 digits of a TIN). These contain a
literal `0` character at their centre and must be added to `SKIP_VALUES`.

**Practical rule**: when adding a new BIR form, the `is_fillable(rect)` predicate
must be:

```python
def is_bir_fillable(rect):
    ns = rect.get('non_stroking_color')
    if ns is None: return False
    v = ns[0] if isinstance(ns, (list, tuple)) else ns
    return 0.6 < float(v) < 0.8   # the 0.749 family
```

And `is_agency_prefilled(rect, chars)` must detect `ns ≈ 1.0` + a `0` char
inside.

## New finding — Digit-box geometry

On BIR forms, a digit box is `w ≈ 13-16, h ≈ 9-11` (NOT 14-22 like some
prior forms). The dense-row of digits has thin vertical dividers (`w ≈ 3-5`,
same ns) between each box. When extracting `boxCenters[]`, filter:

```python
is_digit_box = 13 <= rect['w'] <= 17 and 9 <= rect['h'] <= 11 and is_bir_fillable(rect)
```

and **exclude the dividers** (`w < 6`) that sit between them.

## New finding — Rect-pair deduplication

Every cell is rendered as **two rects at the same `top`**: an outer bevel +
an inner shadow. To get one entry per logical cell, dedup by
`(round(top), round(x0))` keeping the `max(h)` of the pair.

## New finding — Row-divider separators

Full-width `w ≈ 575 h ≈ 9-10 ns=0.749` rects are **row dividers**, not
cells. Exclude any rect with `w > 500` from fillable candidates.

## New finding — Pre-printed default values

BIR 1902 row 18-20 shows pre-printed values: `"INCOME TAX"`, `"BIR Form No. 1700"`,
`"II 011"`. These are drawn as actual chars on the source PDF — our overlay
must not redraw them. Two acceptable strategies:

1. Leave the field out of the schema (user cannot edit the default).
2. Add the default to `SKIP_VALUES` so the user-supplied value renders only
   when different from the default.

## Implementation checklist delta for future BIR forms

- [ ] Run `docs/bir-intake-scaffolding/classify-cells.py <slug>` FIRST before
      writing any coord map. It will emit every fillable rect with its
      `y_pdf` already computed.
- [ ] Verify every pre-filled `0`-agency cell is in `<SLUG>_SKIP_VALUES` with `['']`.
- [ ] Verify every digit-row's `boxCenters[]` excludes agency-prefilled cx
      values AND divider rects.
- [ ] If the form has a repeating-row section (LOB for 1901, Facility Type
      for 1905), extend `CoordsMap` with a `rows[]` variant BEFORE starting
      Gate 4 — don't try to shoehorn fixed y-offsets into separate fields.

## Cross-reference

Scaffolding folder: `docs/bir-intake-scaffolding/`
Extracts (gzipped): `docs/bir-intake-scaffolding/extracts/`
Field dictionaries: `docs/bir-intake-scaffolding/bir-190{1,2,4,5}-fields.md`
Preview PNGs: `docs/bir-intake-scaffolding/previews/`

---

*Added by: Irwin, 2026-04-24. To be merged into the main learnings file by the
next maintainer.*

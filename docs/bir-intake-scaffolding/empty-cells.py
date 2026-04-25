#!/usr/bin/env python3
"""Refined cell extractor for BIR forms.

Distinguishes EMPTY fillable rects (user-input cells, digit boxes, checkboxes)
from DECORATIVE label-background rects (contain pre-printed label chars).

Usage:  python3 empty-cells.py bir-1904 [page_num_0based]
"""
import json, gzip, sys, os
from collections import defaultdict

slug = sys.argv[1]
page_filter = int(sys.argv[2]) if len(sys.argv) > 2 else None
here = os.path.dirname(__file__)
data = json.loads(gzip.open(os.path.join(here, 'extracts', f'{slug}_extract.json.gz'), 'rt').read())

def ns_val(r):
    ns = r.get('ns')
    if ns is None: return None
    try:
        v = ns[0] if isinstance(ns, (list, tuple)) else ns
        return float(v)
    except Exception:
        return None

def is_bir_fillable(r):
    v = ns_val(r)
    return v is not None and 0.6 < v < 0.8

def is_pure_white(r):
    v = ns_val(r)
    return v is not None and v > 0.95

def rect_contains_char(r, c, pad=1.0):
    return (r['x0'] - pad <= c['x0'] and c['x1'] <= r['x1'] + pad
            and r['top'] - pad <= c['top'] and c['bottom'] <= r['bottom'] + pad)

def classify(r, chars_in):
    w, h = r['w'], r['h']
    if w < 5 or h < 5: return None
    if w > 500: return None                # full-width separator
    # checkbox: square-ish 9-14
    if 9 <= w <= 15 and 9 <= h <= 15:
        kind = 'checkbox'
    elif 13 <= w <= 18 and 9 <= h <= 11:
        kind = 'digit_box'
    elif w >= 25 and 11 <= h <= 22:
        kind = 'text_cell'
    else:
        return None
    # Exclude anything with pre-printed label chars inside
    label_chars = [c for c in chars_in if c['text'].strip()]
    if label_chars:
        return None  # this is a label container, not a fillable cell
    # Only keep BIR-gray-bevel cells
    if not is_bir_fillable(r):
        # But ALSO keep pure-white agency-prefilled cells tagged separately
        if is_pure_white(r) and kind == 'digit_box':
            # is there a '0' char exactly at centre?  Already excluded above because chars_in has '0'.
            return None
        return None
    return kind

for pi, pg in enumerate(data):
    if page_filter is not None and pi != page_filter: continue
    PH = pg['h']
    # Pre-bucket chars by y for faster rect-char intersection
    chars = pg['chars']
    # For each rect, find chars inside
    keep = []
    for r in pg['rects']:
        cs = [c for c in chars
              if r['x0'] - 0.5 <= c['x0'] and c['x1'] <= r['x1'] + 0.5
              and r['top'] - 0.5 <= c['top'] and c['bottom'] <= r['bottom'] + 0.5]
        k = classify(r, cs)
        if k:
            r2 = dict(r); r2['_kind'] = k
            keep.append(r2)
    # Dedup by (round(top), round(x0)) keep max height (outer bevel)
    seen = {}
    for r in keep:
        key = (round(r['top']), round(r['x0']), r['_kind'])
        if key not in seen or r['h'] > seen[key]['h']:
            seen[key] = r
    by_kind = defaultdict(list)
    for r in seen.values():
        by_kind[r['_kind']].append(r)

    print(f'\n===== PAGE {pi+1} (empty/fillable only) =====')
    for kind in ['text_cell', 'digit_box', 'checkbox']:
        items = sorted(by_kind[kind], key=lambda r: (r['top'], r['x0']))
        if not items: continue
        print(f'\n-- {kind} ({len(items)}) --')
        for r in items:
            cx = (r['x0']+r['x1'])/2
            print(f'  top={r["top"]:6.1f} x0={r["x0"]:6.1f} x1={r["x1"]:6.1f} '
                  f'cx={cx:6.1f} w={r["w"]:5.1f} h={r["h"]:5.1f} '
                  f'y_pdf={PH - r["bottom"]:6.1f}')

#!/usr/bin/env python3
"""Classify every rect on a BIR form page into:
  - digit_box   (w 13-16, h 9-11, ns=0.749)  — per-char input boxes
  - checkbox    (w 9-14, h 9-14, ns=0.749)   — tick/radio box
  - text_cell   (w >= 25, h 13-22, ns=0.749) — text input cell (OUTER bevel)
  - agency_prefilled (w 13-16, h 9-11, ns=1.0 + "0" char inside) — BIR-use-only
  - separator   (full-width ns=0.749 row-divider)

Emits a JSON summary per slug + prints table. Run from repo root.
Usage:   python3 classify-cells.py bir-1904
"""
import json, gzip, sys, os
from collections import defaultdict

slug = sys.argv[1]
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

def is_bir_gray(r):
    v = ns_val(r)
    return v is not None and 0.6 < v < 0.8

def is_pure_white(r):
    v = ns_val(r)
    return v is not None and v > 0.95

def classify(r, chars):
    if not is_bir_gray(r) and not is_pure_white(r): return None
    w, h = r['w'], r['h']
    if w < 5 or h < 5: return None
    if w > 500: return 'separator'
    if 9 <= w <= 14 and 9 <= h <= 14: return 'checkbox'
    if 13 <= w <= 17 and 9 <= h <= 11:
        # Check for pre-filled '0' inside
        if is_pure_white(r):
            cx = (r['x0']+r['x1'])/2; cy = (r['top']+r['bottom'])/2
            for c in chars:
                if abs((c['x0']+c['x1'])/2 - cx) < 4 and abs((c['top']+c['bottom'])/2 - cy) < 6 \
                   and c['text'] == '0':
                    return 'agency_prefilled'
        return 'digit_box'
    if w >= 25 and 12 <= h <= 22:
        return 'text_cell'
    return None

for pi, pg in enumerate(data):
    PH = pg['h']
    chars = pg['chars']
    print(f'\n===== PAGE {pi+1} =====')
    groups = defaultdict(list)
    # dedup on (round(top), round(x0)) keeping max-h (outer bevel)
    seen = {}
    for r in pg['rects']:
        k = classify(r, chars)
        if k is None: continue
        key = (round(r['top']), round(r['x0']), k)
        if key not in seen or r['h'] > seen[key]['h']:
            seen[key] = r
            seen[key]['_kind'] = k
    for r in seen.values():
        groups[r['_kind']].append(r)
    for kind in ['text_cell','digit_box','checkbox','agency_prefilled']:
        items = sorted(groups[kind], key=lambda r: (r['top'], r['x0']))
        if not items: continue
        print(f'\n-- {kind} ({len(items)}) --')
        for r in items:
            cx = (r['x0']+r['x1'])/2
            print(f'  top={r["top"]:6.1f} x0={r["x0"]:6.1f} x1={r["x1"]:6.1f} '
                  f'cx={cx:6.1f} w={r["w"]:5.1f} h={r["h"]:5.1f} '
                  f'y_pdf={PH - r["bottom"]:6.1f}')

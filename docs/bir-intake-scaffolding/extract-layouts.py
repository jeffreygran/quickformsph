#!/usr/bin/env python3
"""Gate 1 extraction for BIR 1901/1902/1904/1905.

Dumps full pdfplumber layout per page to docs/bir-intake-scaffolding/extracts/
<slug>_extract.json and prints summary stats. Run from repo root.

Note: output is compressed (gzip) in the checked-in extracts folder; this
script writes uncompressed JSON, compress afterwards.
"""
import pdfplumber, json, os, sys

FORMS = {
    'bir-1901': 'BIR - 1901 October 2025 ENCS Final.pdf',
    'bir-1902': 'BIR - 1902 October 2025 (ENCS) Final.pdf',
    'bir-1904': 'BIR - 1904 October 2025 ENCS Final.pdf',
    'bir-1905': 'BIR - 1905 October 2025 ENCS Final.pdf',
}
BASE = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'forms')
OUT  = os.path.join(os.path.dirname(__file__), 'extracts')
os.makedirs(OUT, exist_ok=True)

for slug, fname in FORMS.items():
    path = os.path.join(BASE, fname)
    with pdfplumber.open(path) as pdf:
        pages_out = []
        for pi, p in enumerate(pdf.pages):
            chars = [{'x0': c['x0'], 'top': c['top'], 'x1': c['x1'], 'bottom': c['bottom'],
                      'text': c['text'], 'size': c.get('size'), 'fontname': c.get('fontname')}
                     for c in p.chars]
            rects = [{'x0': r['x0'], 'top': r['top'], 'x1': r['x1'], 'bottom': r['bottom'],
                      'w': r['width'], 'h': r['height'],
                      'ns': r.get('non_stroking_color'), 's': r.get('stroking_color')}
                     for r in p.rects]
            lines = [{'x0': l['x0'], 'top': l['top'], 'x1': l['x1'], 'bottom': l['bottom']}
                     for l in p.lines]
            pages_out.append({'page': pi, 'w': p.width, 'h': p.height,
                              'chars': chars, 'rects': rects, 'lines': lines})
        out_path = os.path.join(OUT, f'{slug}_extract.json')
        with open(out_path, 'w') as f:
            json.dump(pages_out, f)
        print(f'{slug}: pages={len(pages_out)} -> {out_path}')

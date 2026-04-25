#!/usr/bin/env python3
"""Convert a gzipped extract into a human-readable line-by-line digest.
Usage:  python3 digest.py bir-1904
"""
import json, gzip, sys, os
from collections import defaultdict

slug = sys.argv[1]
here = os.path.dirname(__file__)
path = os.path.join(here, 'extracts', f'{slug}_extract.json.gz')
if os.path.exists(path):
    data = json.loads(gzip.open(path, 'rt').read())
else:
    data = json.loads(open(path.replace('.gz',''), 'r').read())

def cluster_lines(chars, y_tol=2.5):
    buckets = defaultdict(list)
    for c in chars:
        buckets[round(c['top'] / y_tol) * y_tol].append(c)
    out = []
    for key in sorted(buckets):
        chs = sorted(buckets[key], key=lambda c: c['x0'])
        text, last_x1 = '', None
        for c in chs:
            if last_x1 is not None and c['x0'] - last_x1 > 2.5:
                text += ' '
            text += c['text']
            last_x1 = c['x1']
        out.append((key, chs[0]['x0'], text.strip()))
    return out

for pi, pg in enumerate(data):
    print(f'\n===== PAGE {pi+1} ({pg["w"]}x{pg["h"]}) '
          f'chars={len(pg["chars"])} rects={len(pg["rects"])} =====')
    for top, x0, txt in cluster_lines(pg['chars']):
        if txt:
            print(f'  [top={top:6.1f} x0={x0:5.1f}] {txt[:140]}')

"""Crawl BIR forms across all categories, extract every PDF/XLS download link."""
from playwright.sync_api import sync_playwright
import re, json, sys
from pathlib import Path

CATEGORIES = {
    "Application Forms":            "BIR1901",
    "Certificates":                 "BIR2316",
    "Documentary Stamp Tax Return":  "BIR2000",
    "Excise Tax Return":             "BIR2200-A",
    "Income Tax Return":             "BIR1700",
    "Legal Forms":                   "BIR0217",
    "Other Forms":                   "BIR1945",
    "Payment/Remittance Forms":      "BIR0605",
    "Transfer Tax Return":           "BIR1800",
    "VAT/Percentage Tax Returns":    "BIR2550M",
}

OUT = []

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, executable_path="/snap/bin/chromium",
                          args=["--no-sandbox","--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width":1400,"height":900})
    page = ctx.new_page()
    for cat, idtag in CATEGORIES.items():
        from urllib.parse import quote
        url = f"https://www.bir.gov.ph/bir-forms?tab={quote(cat)}&idTag={idtag}&datasetCode=3381"
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            page.wait_for_timeout(6000)
        except Exception as e:
            print(f"NAV FAIL {cat}: {e}", file=sys.stderr)
            continue
        html = page.content()
        # Find each card: BIR Form No. <code> - <name> ... href="<pdf>" ... View BIR Form No. <code> pdf|xls
        # Extract each form card block by splitting on "BIR Form No."
        # Use regex to pair (code, name, hrefs)
        cards = re.findall(
            r'BIR Form No\.\s*([\w\-/]+)\s*[-–\s]\s*([^<]+?)</div>(.*?)(?=BIR Form No\.\s*[\w\-/]+\s*[-–\s]|$)',
            html, re.S)
        for code, name, body in cards:
            # All hrefs in this card
            hrefs = re.findall(r'href="(https://bir-cdn\.bir\.gov\.ph/[^"]+\.(?:pdf|xlsx?|docx?|zip))"', body)
            # Description: between "Description</strong></p>" and next strong/p block
            desc_m = re.search(r'Description</strong></p>\s*<p>(.*?)</p>', body, re.S)
            desc = re.sub(r'<[^>]+>', '', desc_m.group(1)).strip() if desc_m else ""
            OUT.append({
                "category": cat,
                "code": code.strip(),
                "name": name.strip(),
                "description": desc[:1000],
                "downloads": hrefs,
            })
        print(f"  [{cat}] cards={len(cards)}", file=sys.stderr)
    b.close()

# Dedupe by code (keep entry with most downloads)
by_code = {}
for e in OUT:
    k = e["code"]
    if k not in by_code or len(e["downloads"]) > len(by_code[k]["downloads"]):
        by_code[k] = e
final = sorted(by_code.values(), key=lambda x: x["code"])

print(json.dumps(final, indent=2))
print(f"\n[*] Total unique form codes: {len(final)}", file=sys.stderr)
print(f"[*] With downloads: {sum(1 for e in final if e['downloads'])}", file=sys.stderr)

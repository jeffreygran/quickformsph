"""Download all BIR forms in catalog to Forms-Research/BIR/pdf/."""
import json, os, re
from pathlib import Path
from urllib.parse import urlsplit, unquote, quote
from playwright.sync_api import sync_playwright

ROOT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "BIR"
PDF_DIR = ROOT / "pdf"
CATALOG = Path("/tmp/bir_catalog.json")

PDF_DIR.mkdir(parents=True, exist_ok=True)

def encode_url(url: str) -> str:
    parts = urlsplit(url)
    path = "/".join(quote(unquote(seg), safe="") for seg in parts.path.split("/"))
    return f"{parts.scheme}://{parts.netloc}{path}" + (f"?{parts.query}" if parts.query else "")

def is_valid(body: bytes) -> bool:
    return body[:4] == b"%PDF" or body[:4] == b"\xd0\xcf\x11\xe0" or body[:4] == b"PK\x03\x04"

catalog = json.loads(CATALOG.read_text())
existing = set(os.listdir(PDF_DIR))

# Build (code, url, fname) tasks
tasks = []
for entry in catalog:
    for url in entry["downloads"]:
        fname = unquote(os.path.basename(urlsplit(url).path))
        tasks.append((entry["code"], url, fname))

print(f"[*] {len(tasks)} download tasks; {len(existing)} already present")

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, executable_path="/snap/bin/chromium",
                          args=["--no-sandbox","--disable-dev-shm-usage"])
    ctx = b.new_context(viewport={"width":1400,"height":900})
    # Warm-up: visit BIR site once so request context inherits any tokens
    pg = ctx.new_page()
    try:
        pg.goto("https://www.bir.gov.ph/bir-forms?tab=Application%20Forms&idTag=BIR1901&datasetCode=3381",
                wait_until="domcontentloaded", timeout=30000)
        pg.wait_for_timeout(2000)
    except Exception as e:
        print(f"[warn] warmup nav: {e}")

    ok = skip = fail = 0
    for code, url, fname in tasks:
        if fname in existing:
            skip += 1
            continue
        enc = encode_url(url)
        try:
            r = ctx.request.get(enc, headers={"Referer":"https://www.bir.gov.ph/bir-forms"}, timeout=60000)
            body = r.body()
            ct = r.headers.get("content-type","")
            if r.ok and is_valid(body):
                (PDF_DIR / fname).write_bytes(body)
                print(f"  OK   [{code:8}] {fname}  ({len(body)} bytes ct={ct})")
                ok += 1; existing.add(fname)
            else:
                print(f"  FAIL [{code:8}] {fname}  (status={r.status} size={len(body)} ct={ct} head={body[:40]!r})")
                fail += 1
        except Exception as e:
            print(f"  FAIL [{code:8}] {fname}  ({type(e).__name__}: {str(e)[:120]})")
            fail += 1
    print(f"\n[*] OK={ok} SKIP={skip} FAIL={fail}")
    b.close()

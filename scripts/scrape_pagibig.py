#!/usr/bin/env python3
"""
Pag-IBIG forms scraper using Playwright with a visible Chromium window.

Why visible: pagibigfund.gov.ph is fronted by Google reCAPTCHA. You solve the
challenge once interactively, then the script discovers all PDF links on the
"Downloadables" / Forms page(s) and downloads each PDF using the same
authenticated browser context (so Cloudflare/reCAPTCHA cookies are reused).

Output:
  - HTML snapshots of visited pages : ~/projects/quickformsph/Forms-Research/PAGIBIG/_snapshots/
  - Catalog JSON                    : ~/projects/quickformsph/Forms-Research/PAGIBIG/catalog.json
  - PDFs                            : ~/projects/quickformsph/Forms-Research/PAGIBIG/pdf/
  - Comparison report               : printed to stdout (existing forms in
                                      ~/projects/quickformsph-dev/public/forms/
                                      vs. discovered PDFs)

Usage:
  ~/playwright-env/bin/python ~/projects/quickformsph-dev/scripts/scrape_pagibig.py

After launching, a Chromium window opens to the Pag-IBIG home page.
1. Solve the reCAPTCHA challenge if prompted.
2. Navigate to the Downloadables / Forms page (or just press Enter in the
   terminal if it's already loaded — script will let you confirm).
3. Press Enter in the terminal when ready; the script enumerates and downloads.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright, Page, BrowserContext

OUT_ROOT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "PAGIBIG"
PDF_DIR = OUT_ROOT / "pdf"
SNAP_DIR = OUT_ROOT / "_snapshots"
CATALOG_PATH = OUT_ROOT / "catalog.json"

EXISTING_DIR = Path.home() / "projects/quickformsph-dev/public/forms"

START_URL = "https://www.pagibigfund.gov.ph/"

# Candidate paths to try once a session is established
CANDIDATE_PATHS = [
    "Downloadables.html",
    "Downloads.html",
    "Forms.html",
    "DLForms.html",
    "Forms/Downloadables.html",
    "MemberServices.html",
    "About.html",
]


def ensure_dirs() -> None:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    SNAP_DIR.mkdir(parents=True, exist_ok=True)


def is_pdf_url(href: str) -> bool:
    if not href:
        return False
    p = urlparse(href).path.lower()
    return p.endswith(".pdf")


def collect_pdf_links(page: Page, base_url: str) -> list[dict]:
    """Return list of {url, text} for every PDF anchor on the current page."""
    anchors = page.eval_on_selector_all(
        "a[href]",
        "els => els.map(e => ({href: e.getAttribute('href') || '', text: (e.textContent || '').trim()}))",
    )
    out, seen = [], set()
    for a in anchors:
        href = a["href"].strip()
        if not is_pdf_url(href):
            continue
        full = urljoin(base_url, href)
        if full in seen:
            continue
        seen.add(full)
        out.append({"url": full, "text": a["text"][:200]})
    return out


def safe_filename(url: str) -> str:
    name = os.path.basename(urlparse(url).path) or "file.pdf"
    name = re.sub(r"[^A-Za-z0-9._\-]+", "_", name)
    if not name.lower().endswith(".pdf"):
        name += ".pdf"
    return name


def download_pdf(context: BrowserContext, url: str, dest: Path) -> tuple[bool, int, str]:
    """Download a PDF using the browser's request context (uses cookies)."""
    try:
        resp = context.request.get(url, timeout=45000)
        if not resp.ok:
            return False, resp.status, f"HTTP {resp.status}"
        body = resp.body()
        # Sanity: must look like a PDF
        if not body.startswith(b"%PDF"):
            return False, resp.status, f"not-a-pdf (head={body[:8]!r})"
        dest.write_bytes(body)
        return True, resp.status, ""
    except Exception as e:  # pragma: no cover
        return False, 0, str(e)


def existing_pagibig_forms() -> list[str]:
    if not EXISTING_DIR.exists():
        return []
    out = []
    for p in EXISTING_DIR.iterdir():
        n = p.name.lower()
        if any(k in n for k in ("pagibig", "hdmf", "hqp")):
            out.append(p.name)
    return sorted(out)


def extract_codes(text: str) -> set[str]:
    """Extract HQP-style codes from filename or label (e.g. HQP-PFF-039, PFF049, HLF-068)."""
    s = text.upper().replace(" ", "")
    codes = set()
    for m in re.finditer(r"HQP-?(PFF|HLF|SLF|EDF|MSRF|MDF)-?(\d{2,4})", s):
        codes.add(f"HQP-{m.group(1)}-{m.group(2).zfill(3)}")
    for m in re.finditer(r"\b(PFF|HLF|SLF)-?(\d{2,4})\b", s):
        codes.add(f"HQP-{m.group(1)}-{m.group(2).zfill(3)}")
    return codes


def main() -> int:
    ensure_dirs()
    print(f"[*] Output dir : {OUT_ROOT}")
    print(f"[*] Existing   : {EXISTING_DIR}")
    print()

    with sync_playwright() as pw:
        browser = pw.chromium.launch(
            headless=False,
            args=["--start-maximized"],
        )
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport=None,
            accept_downloads=True,
        )
        page = context.new_page()

        print(f"[1] Opening {START_URL}")
        page.goto(START_URL, wait_until="domcontentloaded", timeout=60000)

        print()
        print("====================================================================")
        print(" Solve any reCAPTCHA / consent challenge in the browser.")
        print(" Then navigate to the Downloadables / Forms page if needed.")
        print(" When the page that LISTS the PDF forms is loaded, come back here")
        print(" and press <Enter>.")
        print("====================================================================")
        try:
            input("[?] Press Enter when the forms list page is loaded... ")
        except EOFError:
            print("(no TTY; sleeping 60s instead)")
            time.sleep(60)

        # Snapshot whatever page is currently loaded
        current_url = page.url
        print(f"[2] Current URL: {current_url}")
        snap = SNAP_DIR / "main.html"
        snap.write_text(page.content(), encoding="utf-8")
        print(f"    saved snapshot -> {snap}")

        all_links: list[dict] = []
        all_links.extend(collect_pdf_links(page, current_url))

        # Also try candidate paths in case the user landed somewhere else
        base = "https://www.pagibigfund.gov.ph/"
        for path in CANDIDATE_PATHS:
            url = urljoin(base, path)
            if url == current_url:
                continue
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=30000)
                if resp and resp.ok:
                    title = (page.title() or "").lower()
                    if "404" in title or "not found" in title:
                        continue
                    snap = SNAP_DIR / (re.sub(r"[^A-Za-z0-9]+", "_", path) + ".html")
                    snap.write_text(page.content(), encoding="utf-8")
                    found = collect_pdf_links(page, url)
                    if found:
                        print(f"    {path}: +{len(found)} pdf links")
                        all_links.extend(found)
            except Exception:
                continue

        # Dedup
        dedup, seen = [], set()
        for a in all_links:
            if a["url"] in seen:
                continue
            seen.add(a["url"])
            dedup.append(a)
        all_links = dedup
        print(f"[3] Discovered {len(all_links)} unique PDF links")

        # Download each
        results = []
        for i, item in enumerate(all_links, 1):
            url = item["url"]
            dest = PDF_DIR / safe_filename(url)
            if dest.exists() and dest.stat().st_size > 1024:
                results.append({**item, "local": str(dest), "status": "exists",
                                "size": dest.stat().st_size})
                print(f"  [{i:>3}/{len(all_links)}] EXISTS  {dest.name}")
                continue
            ok, code, err = download_pdf(context, url, dest)
            size = dest.stat().st_size if dest.exists() else 0
            status = "ok" if ok else f"FAIL({code}:{err})"
            results.append({**item, "local": str(dest), "status": status, "size": size})
            print(f"  [{i:>3}/{len(all_links)}] {status:<20} {size:>8}  {dest.name}")
            time.sleep(0.4)

        CATALOG_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")
        print(f"[4] Catalog -> {CATALOG_PATH}")

        # Comparison report
        existing = existing_pagibig_forms()
        existing_codes: set[str] = set()
        for n in existing:
            existing_codes |= extract_codes(n)

        downloaded_codes: set[str] = set()
        for r in results:
            downloaded_codes |= extract_codes(r["local"])
            downloaded_codes |= extract_codes(r["text"])

        print()
        print("================== COMPARISON REPORT ==================")
        print(f"Existing in QuickFormsPH ({len(existing)} files):")
        for n in existing:
            print(f"  - {n}   codes={sorted(extract_codes(n))}")

        missing = sorted(downloaded_codes - existing_codes)
        print()
        print(f"Codes on Pag-IBIG site NOT in QuickFormsPH ({len(missing)}):")
        for c in missing:
            # find one URL that matches
            sample = next((r for r in results if c in extract_codes(r["local"]) or c in extract_codes(r["text"])), None)
            if sample:
                print(f"  - {c}  {sample['text'] or sample['url']}")
                print(f"      {sample['url']}")
            else:
                print(f"  - {c}")
        print("=======================================================")

        try:
            input("[?] Done. Press Enter to close the browser... ")
        except EOFError:
            time.sleep(5)
        context.close()
        browser.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

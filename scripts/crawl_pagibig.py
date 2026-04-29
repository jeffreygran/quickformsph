#!/usr/bin/env python3
"""Crawl pagibigfund.gov.ph (using captcha-solved persistent profile) and
download every reachable PDF under the same domain.

Strategy:
  - Reuse ~/projects/quickformsph/Forms-Research/PAGIBIG/_chrome_profile (the visible Chromium session that
    already passed the reCAPTCHA wall must be CLOSED before running this).
  - BFS crawl from the home page. Follow only same-host HTML links up to a
    given depth. Collect every .pdf URL encountered.
  - Download each PDF via the browser's request context (uses cookies).
  - Print a comparison report against existing ~/projects/quickformsph-dev/public/forms/.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag

from playwright.sync_api import sync_playwright

ROOT = "https://www.pagibigfund.gov.ph/"
HOST = urlparse(ROOT).netloc

OUT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "PAGIBIG"
PDF_DIR = OUT / "pdf"
SNAP_DIR = OUT / "_snapshots"
PROFILE = OUT / "_chrome_profile"
CATALOG = OUT / "catalog.json"
EXISTING = Path.home() / "projects/quickformsph-dev/public/forms"

MAX_DEPTH = 3
MAX_PAGES = 80


def is_pdf(href: str) -> bool:
    return urlparse(href).path.lower().endswith(".pdf")


def same_host(href: str) -> bool:
    try:
        h = urlparse(href).netloc.lower()
    except Exception:
        return False
    return h == "" or h.endswith(HOST)


def normalize(url: str) -> str:
    url, _ = urldefrag(url)
    return url.rstrip("/")


def safe_filename(url: str) -> str:
    name = os.path.basename(urlparse(url).path) or "file.pdf"
    name = re.sub(r"[^A-Za-z0-9._\-]+", "_", name)
    return name if name.lower().endswith(".pdf") else name + ".pdf"


def existing_pi_forms() -> list[str]:
    if not EXISTING.exists():
        return []
    out = []
    for p in EXISTING.iterdir():
        n = p.name.lower()
        if any(k in n for k in ("pagibig", "hdmf", "hqp")):
            out.append(p.name)
    return sorted(out)


def extract_codes(text: str) -> set[str]:
    s = text.upper().replace(" ", "")
    codes = set()
    for m in re.finditer(r"HQP-?(PFF|HLF|SLF|EDF|MSRF|MDF)-?(\d{2,4})", s):
        codes.add(f"HQP-{m.group(1)}-{m.group(2).zfill(3)}")
    for m in re.finditer(r"\b(PFF|HLF|SLF)-?(\d{2,4})\b", s):
        codes.add(f"HQP-{m.group(1)}-{m.group(2).zfill(3)}")
    return codes


def main() -> int:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    SNAP_DIR.mkdir(parents=True, exist_ok=True)
    if not PROFILE.exists():
        print("[!] Profile missing — start VNC + solve captcha first.")
        return 2

    with sync_playwright() as pw:
        # Reuse the snap Chromium binary that created the profile (same version
        # as captcha-solving session). Playwright's bundled Chromium cannot read
        # the profile schema from a different build.
        snap_chromium = "/snap/bin/chromium"
        headless = os.environ.get("HEADLESS", "0") == "1"
        ctx = pw.chromium.launch_persistent_context(
            str(PROFILE),
            executable_path=snap_chromium,
            headless=headless,
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
            viewport={"width": 1400, "height": 900},
            accept_downloads=True,
            ignore_https_errors=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        visited: set[str] = set()
        pdf_urls: dict[str, dict] = {}  # url -> {url, text, found_on}
        queue: deque[tuple[str, int]] = deque([(normalize(ROOT), 0)])
        page_count = 0

        while queue and page_count < MAX_PAGES:
            url, depth = queue.popleft()
            if url in visited:
                continue
            visited.add(url)
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=45000)
            except Exception as e:
                print(f"  [d={depth}] ERR  {url}  ({e})")
                continue
            if not resp:
                continue
            ct = (resp.headers.get("content-type") or "").lower()
            if "html" not in ct:
                continue
            page_count += 1
            html = page.content()
            if "recaptcha" in html.lower()[:2000] and "pagibigfund" not in page.url:
                # captcha redirect — skip
                continue
            anchors = page.eval_on_selector_all(
                "a[href]",
                "els => els.map(e => ({href: e.getAttribute('href') || '', text: (e.textContent||'').trim()}))",
            )
            page_pdfs = 0
            new_links = 0
            for a in anchors:
                href = a["href"].strip()
                if not href or href.startswith(("javascript:", "mailto:", "tel:")):
                    continue
                full = normalize(urljoin(url, href))
                if not same_host(full):
                    continue
                if is_pdf(full):
                    if full not in pdf_urls:
                        pdf_urls[full] = {"url": full, "text": a["text"][:200], "found_on": url}
                        page_pdfs += 1
                else:
                    if full not in visited and depth + 1 <= MAX_DEPTH:
                        queue.append((full, depth + 1))
                        new_links += 1
            print(f"  [d={depth} p={page_count:>2}] {url}  +{page_pdfs} pdfs, +{new_links} links")

            # Snapshot pages that yielded PDFs
            if page_pdfs:
                snap_name = re.sub(r"[^A-Za-z0-9]+", "_", url.replace(ROOT, ""))[:80] or "home"
                (SNAP_DIR / f"{snap_name}.html").write_text(html, encoding="utf-8")

        print(f"\n[+] Crawled {page_count} pages, found {len(pdf_urls)} PDFs")

        # Download
        results = []
        items = sorted(pdf_urls.values(), key=lambda x: x["url"])
        for i, item in enumerate(items, 1):
            url = item["url"]
            dest = PDF_DIR / safe_filename(url)
            if dest.exists() and dest.stat().st_size > 1024:
                results.append({**item, "local": str(dest), "status": "exists",
                                "size": dest.stat().st_size})
                print(f"  [{i:>3}/{len(items)}] EXISTS  {dest.name}")
                continue
            try:
                r = ctx.request.get(url, timeout=60000)
                if not r.ok:
                    raise RuntimeError(f"HTTP {r.status}")
                body = r.body()
                if not body.startswith(b"%PDF"):
                    raise RuntimeError(f"not-pdf head={body[:8]!r}")
                dest.write_bytes(body)
                size = dest.stat().st_size
                print(f"  [{i:>3}/{len(items)}] OK     {size:>9}  {dest.name}")
                results.append({**item, "local": str(dest), "status": "ok", "size": size})
            except Exception as e:
                print(f"  [{i:>3}/{len(items)}] FAIL   {e}  {url}")
                results.append({**item, "local": "", "status": f"fail:{e}", "size": 0})
            time.sleep(0.25)

        CATALOG.write_text(json.dumps(results, indent=2), encoding="utf-8")

        # Comparison report
        existing = existing_pi_forms()
        existing_codes: set[str] = set()
        for n in existing:
            existing_codes |= extract_codes(n)
        downloaded_codes: set[str] = set()
        downloaded_files = [r for r in results if r["status"] in ("ok", "exists")]
        for r in downloaded_files:
            downloaded_codes |= extract_codes(r["local"])
            downloaded_codes |= extract_codes(r["text"])

        print()
        print("================== COMPARISON REPORT ==================")
        print(f"Existing in QuickFormsPH ({len(existing)}):")
        for n in existing:
            print(f"  - {n}    codes={sorted(extract_codes(n))}")
        print()
        print(f"Successfully downloaded ({len(downloaded_files)}):")
        for r in downloaded_files:
            print(f"  - {os.path.basename(r['local'])}    codes={sorted(extract_codes(r['local']) | extract_codes(r['text']))}")

        missing_codes = sorted(downloaded_codes - existing_codes)
        print()
        print(f"Pag-IBIG codes NOT yet in QuickFormsPH ({len(missing_codes)}):")
        for c in missing_codes:
            sample = next((r for r in downloaded_files
                           if c in extract_codes(r["local"]) or c in extract_codes(r["text"])), None)
            label = (sample["text"] if sample else "") or c
            url = sample["url"] if sample else ""
            print(f"  - {c:<18} {label}")
            if url: print(f"      {url}")

        # Files with no recognizable code (still might be useful)
        uncoded = [r for r in downloaded_files
                   if not (extract_codes(r["local"]) | extract_codes(r["text"]))]
        if uncoded:
            print()
            print(f"Other downloaded PDFs (no HQP code in name) ({len(uncoded)}):")
            for r in uncoded:
                print(f"  - {os.path.basename(r['local'])}  ({r['text'][:60]})")
        print("=======================================================")
        print(f"PDFs:    {PDF_DIR}")
        print(f"Catalog: {CATALOG}")
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

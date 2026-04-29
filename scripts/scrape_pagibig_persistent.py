#!/usr/bin/env python3
"""
Pag-IBIG forms scraper — uses a PERSISTENT Chromium profile that already
solved the reCAPTCHA challenge in a separate VNC session.

Workflow:
  1. Run start_pagibig_vnc.sh once — it starts Xvfb + x11vnc + noVNC and
     opens Chromium against pagibigfund.gov.ph in a profile dir at
     ~/projects/quickformsph/Forms-Research/PAGIBIG/_chrome_profile/
  2. Solve the reCAPTCHA + navigate to the Forms / Downloadables page in noVNC.
  3. Close that Chromium window (or leave it; this script will reuse the
     profile via launch_persistent_context, which requires the profile to be
     not currently locked by another Chromium process — kill it first if so).
  4. Run this script. It opens the same profile headless, scrapes PDF links
     from the page you left open + a few candidate paths, downloads them,
     and prints a comparison report against existing QuickFormsPH forms.

Output: ~/projects/quickformsph/Forms-Research/PAGIBIG/{pdf, _snapshots, catalog.json}
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse

from playwright.sync_api import sync_playwright

OUT_ROOT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "PAGIBIG"
PDF_DIR = OUT_ROOT / "pdf"
SNAP_DIR = OUT_ROOT / "_snapshots"
CATALOG_PATH = OUT_ROOT / "catalog.json"
PROFILE_DIR = OUT_ROOT / "_chrome_profile"

EXISTING_DIR = Path.home() / "projects/quickformsph-dev/public/forms"

# After captcha is solved we'll attempt these paths to find the forms list.
CANDIDATE_PATHS = [
    "",  # the home page itself (might already be the forms page)
    "Downloadables.html",
    "Downloads.html",
    "Forms.html",
    "DLForms.html",
    "Forms/Downloadables.html",
    "MemberServices.html",
    "About.html",
    "AboutUs.html",
]


def is_pdf_url(href: str) -> bool:
    if not href:
        return False
    return urlparse(href).path.lower().endswith(".pdf")


def collect_pdf_links(page, base_url: str) -> list[dict]:
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

    if not PROFILE_DIR.exists():
        print(f"[!] Profile not found at {PROFILE_DIR}")
        print("    Run start_pagibig_vnc.sh first and solve the captcha there.")
        return 2

    with sync_playwright() as pw:
        # Headless reuse of the persistent profile.
        ctx = pw.chromium.launch_persistent_context(
            str(PROFILE_DIR),
            headless=True,
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
            ),
            viewport={"width": 1400, "height": 900},
            accept_downloads=True,
        )

        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        all_links: list[dict] = []
        base = "https://www.pagibigfund.gov.ph/"

        for path in CANDIDATE_PATHS:
            url = urljoin(base, path) if path else base
            try:
                resp = page.goto(url, wait_until="domcontentloaded", timeout=45000)
                if not resp:
                    continue
                title = (page.title() or "").lower()
                # Detect captcha or 404 page
                content_head = page.content()[:1000].lower()
                if "recaptcha" in content_head or "checking your browser" in content_head:
                    print(f"  {url}: still captcha — solve it in the VNC session first.")
                    continue
                if resp.status == 404 or "404" in title or "not found" in title:
                    continue
                snap_name = (re.sub(r"[^A-Za-z0-9]+", "_", path) or "home") + ".html"
                (SNAP_DIR / snap_name).write_text(page.content(), encoding="utf-8")
                found = collect_pdf_links(page, url)
                if found:
                    print(f"  [{len(found):>3} pdf] {url}")
                    all_links.extend(found)
                else:
                    print(f"  [  0 pdf] {url}")
            except Exception as e:
                print(f"  ERR {url}: {e}")

        # Dedup
        seen, dedup = set(), []
        for a in all_links:
            if a["url"] in seen:
                continue
            seen.add(a["url"])
            dedup.append(a)
        all_links = dedup
        print(f"\n[+] Total unique PDF links: {len(all_links)}")

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
            try:
                r = ctx.request.get(url, timeout=60000)
                if not r.ok:
                    raise RuntimeError(f"HTTP {r.status}")
                body = r.body()
                if not body.startswith(b"%PDF"):
                    raise RuntimeError(f"not-pdf head={body[:8]!r}")
                dest.write_bytes(body)
                size = dest.stat().st_size
                print(f"  [{i:>3}/{len(all_links)}] OK      {size:>8}  {dest.name}")
                results.append({**item, "local": str(dest), "status": "ok", "size": size})
            except Exception as e:
                print(f"  [{i:>3}/{len(all_links)}] FAIL    {e}  {url}")
                results.append({**item, "local": "", "status": f"fail:{e}", "size": 0})
            time.sleep(0.3)

        CATALOG_PATH.write_text(json.dumps(results, indent=2), encoding="utf-8")

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
        print(f"Existing in QuickFormsPH ({len(existing)}):")
        for n in existing:
            print(f"  - {n}    codes={sorted(extract_codes(n))}")
        missing = sorted(downloaded_codes - existing_codes)
        print()
        print(f"Pag-IBIG codes NOT yet in QuickFormsPH ({len(missing)}):")
        for c in missing:
            sample = next((r for r in results if c in extract_codes(r["local"]) or c in extract_codes(r["text"])), None)
            label = (sample["text"] if sample else "") or c
            url = sample["url"] if sample else ""
            print(f"  - {c:<18} {label}")
            if url: print(f"      {url}")
        print("=======================================================")
        print(f"Catalog: {CATALOG_PATH}")
        print(f"PDFs:    {PDF_DIR}")
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

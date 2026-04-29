#!/usr/bin/env python3
"""Targeted downloader: read previously crawled snapshots, extract form-like
PDF URLs (HQP/PFF/HLF/SLF in name OR /forms/ in path OR keywords like
Application/Enrollment/Registration/Withdrawal), and download them via the
captcha-solved persistent profile.

Run after crawl_pagibig.py has produced ~/projects/quickformsph/Forms-Research/PAGIBIG/_snapshots/ pages.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag

from playwright.sync_api import sync_playwright

ROOT = "https://www.pagibigfund.gov.ph/"
OUT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "PAGIBIG"
PDF_DIR = OUT / "pdf"
SNAP_DIR = OUT / "_snapshots"
PROFILE = OUT / "_chrome_profile"
CATALOG = OUT / "catalog_forms.json"
EXISTING = Path.home() / "projects/quickformsph-dev/public/forms"

# Match form-like PDFs only (skip annual reports, scorecards, etc.)
FORM_KEYWORDS = re.compile(
    r"(HQP|PFF|HLF|SLF|MDF|MSRF|EDF|Application|Enrollment|Registration|"
    r"Withdrawal|Claim|Authorization|MembersData|MembersChange|MultiPurpose|"
    r"HousingLoan|EmergencyLoan|CalamityLoan|HELPs|EquityAppreciation|"
    r"Restructuring|/forms/|MP2|RetirementClaim|DeathClaim|Disability|"
    r"DataInformation|ChangeOfInformation|Spouse|Beneficiary|Salary)",
    re.IGNORECASE,
)
# Skip these (governance docs)
SKIP_KEYWORDS = re.compile(
    r"(Scorecard|Performance|Accomplishment|Annual|Procurement|PhilGEPS|"
    r"Report|Charter|Audit|Statement|Notice|Resolution|Circular|Minutes|"
    r"Strategy|Strat_map|COB\.|GAD|GenderandDevelopment|CSR|Bid|Acquired|"
    r"Asset|Posting|Calendar|Compliance|Disclosure|Whistleblowing|Anti-?red|"
    r"Citizen|Charter|Manual|Guideline|Policy|MTPDP|Office_Order|Approved|"
    r"Compendium|2020_PMR|2021_PMR|2022_PMR|2023_PMR|2024_PMR|2025_PMR|"
    r"PBB|HDMF.*FS|Major_Program|Targets|TAS_NCR|Audit|RGA)",
    re.IGNORECASE,
)


def normalize(url: str) -> str:
    url, _ = urldefrag(url)
    return url


def safe_filename(url: str) -> str:
    name = os.path.basename(urlparse(url).path) or "file.pdf"
    name = re.sub(r"[^A-Za-z0-9._\-]+", "_", name)
    return name if name.lower().endswith(".pdf") else name + ".pdf"


def collect_form_urls() -> list[dict]:
    """Walk snapshot HTML files; collect all .pdf hrefs that match FORM_KEYWORDS
    and don't match SKIP_KEYWORDS. Resolve relative to ROOT."""
    seen: dict[str, dict] = {}
    href_re = re.compile(r'href="([^"]+\.[Pp][Dd][Ff])"')
    text_re = re.compile(r'<a[^>]*href="([^"]+\.[Pp][Dd][Ff])"[^>]*>([^<]+)</a>',
                         re.IGNORECASE)
    for snap in SNAP_DIR.glob("*.html"):
        html = snap.read_text(errors="ignore")
        for m in text_re.finditer(html):
            href = m.group(1).strip()
            text = re.sub(r"\s+", " ", m.group(2)).strip()
            full = normalize(urljoin(ROOT, href))
            full_lc = full.lower() + " " + text.lower()
            if SKIP_KEYWORDS.search(full_lc):
                continue
            if not FORM_KEYWORDS.search(full_lc):
                continue
            if full not in seen:
                seen[full] = {"url": full, "text": text[:200], "found_on": snap.name}
        # Also pick up href-only matches (in case <a> inner text was odd)
        for m in href_re.finditer(html):
            href = m.group(1).strip()
            full = normalize(urljoin(ROOT, href))
            full_lc = full.lower()
            if SKIP_KEYWORDS.search(full_lc):
                continue
            if not FORM_KEYWORDS.search(full_lc):
                continue
            if full not in seen:
                seen[full] = {"url": full, "text": "", "found_on": snap.name}
    return sorted(seen.values(), key=lambda x: x["url"])


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
    items = collect_form_urls()
    print(f"[+] Form-like PDF URLs collected from snapshots: {len(items)}")

    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(
            str(PROFILE),
            executable_path="/snap/bin/chromium",
            headless=os.environ.get("HEADLESS", "0") == "1",
            user_agent=("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"),
            viewport={"width": 1400, "height": 900},
            accept_downloads=True,
            ignore_https_errors=True,
            args=["--no-sandbox", "--disable-dev-shm-usage"],
        )

        results = []
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
            time.sleep(0.2)

        CATALOG.write_text(json.dumps(results, indent=2), encoding="utf-8")

        existing = existing_pi_forms()
        existing_codes: set[str] = set()
        for n in existing:
            existing_codes |= extract_codes(n)
        downloaded = [r for r in results if r["status"] in ("ok", "exists")]
        downloaded_codes: set[str] = set()
        for r in downloaded:
            downloaded_codes |= extract_codes(r["local"]) | extract_codes(r["text"])

        print()
        print("================== COMPARISON REPORT ==================")
        print(f"Existing in QuickFormsPH ({len(existing)}):")
        for n in existing:
            print(f"  - {n}    codes={sorted(extract_codes(n))}")
        print()
        print(f"Successfully downloaded forms ({len(downloaded)}):")
        for r in downloaded:
            codes = sorted(extract_codes(r["local"]) | extract_codes(r["text"]))
            label = (r["text"] or os.path.basename(r["local"]))[:80]
            print(f"  - {os.path.basename(r['local'])}  codes={codes}  -- {label}")
        missing = sorted(downloaded_codes - existing_codes)
        print()
        print(f"Pag-IBIG codes NOT yet in QuickFormsPH ({len(missing)}):")
        for c in missing:
            sample = next((r for r in downloaded
                           if c in extract_codes(r["local"]) or c in extract_codes(r["text"])), None)
            label = (sample["text"] if sample else "") or c
            url = sample["url"] if sample else ""
            print(f"  - {c:<18} {label}")
            if url: print(f"      {url}")
        uncoded = [r for r in downloaded if not (extract_codes(r["local"]) | extract_codes(r["text"]))]
        if uncoded:
            print()
            print(f"Other form-like PDFs (no HQP code) ({len(uncoded)}):")
            for r in uncoded:
                print(f"  - {os.path.basename(r['local'])}  {r['text'][:70]}")
        print("=======================================================")
        print(f"Catalog: {CATALOG}")
        print(f"PDFs:    {PDF_DIR}")
        ctx.close()
    return 0


if __name__ == "__main__":
    sys.exit(main())

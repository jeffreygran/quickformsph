#!/usr/bin/env python3
"""
Download the 9 missing GSIS forms (URLs with unencoded spaces) by reusing the
visible Chromium profile from start_gsis_vnc.sh.

Why this works when curl/wget get a "Request Rejected" page from F5 ASM:
  - launch_persistent_context() reuses the same TLS fingerprint, cookies,
    Accept-Language, JS challenge results, etc. that the user established
    inside the visible Chromium session.
  - page.context.request.get(url) inherits all of that, so GSIS's WAF treats
    the download as a continuation of a trusted browser session.

Run from the host (NOT inside VNC) — the Playwright Chromium just talks to
the same profile dir on disk:

    ~/playwright-env/bin/python \\
      ~/projects/quickformsph-dev/scripts/download_gsis_missing.py
"""
import json
import os
import sys
import urllib.parse
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "GSIS"
PROFILE_DIR = ROOT / "_chrome_profile"
PDF_DIR = ROOT / "pdf"
CATALOG = ROOT / "gsis_forms.json"

HEADLESS = os.environ.get("HEADLESS", "0") == "1"


def encode_url(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    path = "/".join(
        urllib.parse.quote(urllib.parse.unquote(seg), safe="") for seg in parts.path.split("/")
    )
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))


def is_valid(body: bytes) -> bool:
    return (
        body[:4] == b"%PDF"
        or body[:4] == b"\xd0\xcf\x11\xe0"  # OLE (legacy .doc)
        or body[:5] == b"PK\x03\x04"        # docx/zip
    )


def main() -> int:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    if not CATALOG.exists():
        print(f"[ERR] catalog missing: {CATALOG}", file=sys.stderr)
        return 1

    catalog = json.loads(CATALOG.read_text())
    existing = set(os.listdir(PDF_DIR))
    missing = []
    for entry in catalog:
        url = entry["sourceURL"]
        fname = urllib.parse.unquote(os.path.basename(url))
        if fname not in existing:
            missing.append((fname, url))

    print(f"[*] Missing: {len(missing)}")
    if not missing:
        print("[*] Nothing to do.")
        return 0

    # Cleanup stale profile lock so persistent_context can attach
    for lock in ("SingletonLock", "SingletonCookie", "SingletonSocket"):
        p = PROFILE_DIR / lock
        if p.exists() or p.is_symlink():
            try:
                p.unlink()
            except OSError:
                pass

    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(PROFILE_DIR),
            headless=HEADLESS,
            executable_path="/snap/bin/chromium",
            viewport={"width": 1400, "height": 900},
            args=["--no-first-run", "--no-default-browser-check"],
        )
        # Warm up the WAF: load the index page once so the request context
        # carries fresh cookies / TS challenge tokens.
        page = ctx.new_page()
        page.goto("https://www.gsis.gov.ph/downloadable-forms/", wait_until="domcontentloaded", timeout=45000)
        page.wait_for_timeout(2000)

        ok_count = 0
        for fname, url in missing:
            dest = PDF_DIR / fname
            enc = encode_url(url)
            try:
                r = ctx.request.get(
                    enc,
                    headers={"Referer": "https://www.gsis.gov.ph/downloadable-forms/"},
                    timeout=60000,
                )
                body = r.body()
                ct = r.headers.get("content-type", "")
                ok = r.ok and is_valid(body)
                if ok:
                    dest.write_bytes(body)
                    print(f"  OK   {fname}  ({r.status} {len(body)} bytes ct={ct})")
                    ok_count += 1
                else:
                    head_preview = body[:80] if body else b""
                    print(f"  FAIL {fname}  ({r.status} {len(body)} bytes ct={ct} head={head_preview!r})")
            except Exception as e:
                print(f"  FAIL {fname}  (exception: {type(e).__name__}: {e})")

        print(f"\n[*] Downloaded {ok_count}/{len(missing)}")
        ctx.close()
        return 0 if ok_count == len(missing) else 2


if __name__ == "__main__":
    sys.exit(main())

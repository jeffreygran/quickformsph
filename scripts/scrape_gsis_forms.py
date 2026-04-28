#!/usr/bin/env python3
"""
scripts/scrape_gsis_forms.py

Scrape https://www.gsis.gov.ph/downloadable-forms/ for every PDF link, group
them by category (the page's own H2/H3 headings), and emit a JSON catalog:

  [
    {
      "category":   "Membership",
      "form_name":  "GSIS Information Update Form (GIUF)",
      "source_url": "https://www.gsis.gov.ph/downloads/forms/GIUF.pdf",
      "filename":   "GSIS - GIUF.pdf"
    },
    ...
  ]

Run with the existing scrapling-env:

    /home/skouzen/scrapling-env/bin/python scripts/scrape_gsis_forms.py \
        > /tmp/gsis-forms.json
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import urljoin, unquote

from scrapling.fetchers import DynamicFetcher
from scrapling.parser import Adaptor

URL  = "https://www.gsis.gov.ph/downloadable-forms/"
HOST = "https://www.gsis.gov.ph"
CACHE_HTML = Path("/tmp/gsis-page.html")

# Code-prefix → friendly agency code embedded in the saved filename.
# All forms here are GSIS but we still produce the "Agency - Code.pdf"
# convention the scanner expects.
def derive_filename(form_name: str, href: str) -> str:
    """Build a clean 'GSIS - <name>.pdf' filename."""
    base = unquote(href.rsplit("/", 1)[-1])
    if not base.lower().endswith(".pdf"):
        base += ".pdf"
    # Prefer the link text when it's a sensible, short, ASCII string.
    name = (form_name or base).strip()
    name = re.sub(r"\s+", " ", name)
    name = re.sub(r"[^A-Za-z0-9 .\-_()]", "", name)
    name = name.strip(" .-_")
    if not name:
        name = base[:-4]
    if name.lower().startswith("gsis"):
        name = name[4:].lstrip(" -_")
    return f"GSIS - {name}.pdf"


def main() -> int:
    ap = argparse.ArgumentParser(description="Scrape GSIS downloadable-forms catalog.")
    ap.add_argument(
        "--from-file",
        metavar="HTML_PATH",
        help="Parse a previously-saved HTML file instead of fetching. "
             "Useful when the GSIS WAF has IP-blocked the server: open the page "
             "in your browser, View Source → save → pass the path here.",
    )
    ap.add_argument(
        "--cache", action="store_true",
        help="Save the fetched HTML to /tmp/gsis-page.html for re-parsing later.",
    )
    args = ap.parse_args()

    # ── Acquire HTML ──
    if args.from_file:
        html = Path(args.from_file).read_text(encoding="utf-8", errors="ignore")
        if len(html) < 5000:
            print(f"# Warning: {args.from_file} is only {len(html)} bytes — "
                  "likely the WAF challenge stub, not the real page.",
                  file=sys.stderr)
        page = Adaptor(content=html, url=URL, encoding="utf-8")
    else:
        # GSIS sits behind an F5 BIG-IP TSPD JS challenge — only a real
        # browser (DynamicFetcher = Playwright) can execute the bobcmn shim
        # and obtain the session cookie that unlocks the real HTML. After a
        # few requests the WAF will IP-ban the server and return a 254-byte
        # "Request Rejected" stub for every URL, including the homepage.
        resp = DynamicFetcher.fetch(
            URL,
            headless=True,
            network_idle=True,
            wait=4000,
            humanize=True,
        )
        if resp.status != 200:
            print(f"# HTTP {resp.status} from {URL}", file=sys.stderr)
            return 1
        if len(resp.html_content) < 5000:
            print(
                "# WAF blocked: GSIS returned only "
                f"{len(resp.html_content)} bytes (likely 'Request Rejected'). "
                "Open the URL in your own browser, save View-Source as HTML, "
                "then re-run with --from-file <path>.",
                file=sys.stderr,
            )
            return 3
        if args.cache:
            CACHE_HTML.write_text(resp.html_content, encoding="utf-8")
            print(f"# cached HTML → {CACHE_HTML}", file=sys.stderr)
        page = resp

    items: list[dict] = []
    seen: set[str] = set()
    current_category = "Uncategorized"

    # Walk every node in DOM order — when we hit an H2/H3/H4 we update the
    # active category; when we hit a PDF link we emit a row.
    # NOTE: scrapling's css() does NOT support comma-separated selector
    # lists reliably — use xpath which gives us a single ordered nodeset.
    nodes = page.xpath(
        "//*[self::h1 or self::h2 or self::h3 or self::h4 or self::a]"
    )
    if not nodes:
        print("# No headings/links found on page", file=sys.stderr)
        return 2

    for node in nodes:
        tag = (node.tag or "").lower()
        if tag in {"h1", "h2", "h3", "h4"}:
            text = " ".join(node.text.split())
            if text:
                current_category = text
            continue

        href = node.attrib.get("href", "")
        if not href.lower().endswith(".pdf"):
            continue
        absolute = urljoin(HOST, href)
        if absolute in seen:
            continue
        seen.add(absolute)

        link_text = " ".join(node.text.split()) if node.text else ""
        if not link_text:
            link_text = unquote(href.rsplit("/", 1)[-1]).rsplit(".", 1)[0]

        items.append({
            "category":   current_category,
            "form_name":  link_text,
            "source_url": absolute,
            "filename":   derive_filename(link_text, href),
        })

    json.dump(items, sys.stdout, indent=2, ensure_ascii=False)
    sys.stdout.write("\n")
    print(f"# scraped {len(items)} PDF links", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())

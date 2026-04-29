#!/usr/bin/env python3
"""Retry download of GSIS forms via curl (browser headers) + Wayback fallback."""
import json
import os
import re
import subprocess
import urllib.parse
from pathlib import Path

OUT_DIR = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "GSIS" / "pdf"
CATALOG = Path.home() / "projects" / "quickformsph" / "Forms-Research" / "GSIS" / "gsis_forms.json"

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

def encode_url(url: str) -> str:
    parts = urllib.parse.urlsplit(url)
    path = "/".join(urllib.parse.quote(urllib.parse.unquote(seg), safe="") for seg in parts.path.split("/"))
    return urllib.parse.urlunsplit((parts.scheme, parts.netloc, path, parts.query, parts.fragment))

def is_valid(body: bytes) -> bool:
    return body[:4] == b"%PDF" or body[:4] == b"\xd0\xcf\x11\xe0" or body[:5] == b"PK\x03\x04"

def curl_download(url: str, dest: Path) -> tuple[bool, str]:
    cmd = [
        "curl", "-sSL", "--max-time", "45",
        "-A", UA,
        "-H", "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
        "-H", "Accept-Language: en-US,en;q=0.9",
        "-H", "Sec-Fetch-Dest: document",
        "-H", "Sec-Fetch-Mode: navigate",
        "-H", "Sec-Fetch-Site: same-origin",
        "-H", "Upgrade-Insecure-Requests: 1",
        "-e", "https://www.gsis.gov.ph/downloadable-forms/",
        "--compressed",
        "-o", str(dest),
        "-w", "%{http_code}|%{size_download}",
        url,
    ]
    try:
        out = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        info = out.stdout.strip()
        if dest.exists() and dest.stat().st_size > 0:
            head = dest.read_bytes()[:8]
            if is_valid(head):
                return True, f"http={info}"
            return False, f"http={info} bad head={head!r}"
        return False, f"http={info} no/empty file"
    except Exception as e:
        return False, f"ERR {e}"

def wayback_lookup(url: str) -> str | None:
    api = "http://archive.org/wayback/available?url=" + urllib.parse.quote(url, safe="")
    try:
        out = subprocess.run(["curl", "-sS", "--max-time", "20", api], capture_output=True, text=True, timeout=25)
        data = json.loads(out.stdout)
        snap = data.get("archived_snapshots", {}).get("closest")
        if snap and snap.get("available"):
            return snap["url"]
    except Exception:
        pass
    return None

def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    catalog = json.loads(CATALOG.read_text())
    existing = set(os.listdir(OUT_DIR))
    missing = []
    for entry in catalog:
        url = entry["sourceURL"]
        fname = urllib.parse.unquote(os.path.basename(url))
        if fname not in existing:
            missing.append((fname, url))
    print(f"Missing: {len(missing)}")
    ok_count = 0
    for fname, url in missing:
        dest = OUT_DIR / fname
        enc = encode_url(url)
        ok, msg = curl_download(enc, dest)
        if not ok:
            if dest.exists():
                dest.unlink()
            wb = wayback_lookup(url)
            if wb:
                wb_raw = re.sub(r"/web/(\d+)/", r"/web/\1if_/", wb)
                ok2, msg2 = curl_download(wb_raw, dest)
                msg = f"DIRECT={msg} | WAYBACK={msg2}\n        WB_URL={wb_raw}"
                ok = ok2
            else:
                msg = f"DIRECT={msg} | no wayback snapshot"
        flag = "OK  " if ok else "FAIL"
        print(f"  {flag} {fname}\n        {msg}")
        if ok:
            ok_count += 1
    print(f"\nDownloaded {ok_count}/{len(missing)}")

if __name__ == "__main__":
    main()

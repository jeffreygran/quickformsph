/**
 * POST /api/admin/forms/import-url
 *
 * Body: { url: string, filename?: string }
 *
 * Downloads a PDF from the given URL, saves it under
 *   public/forms/NoFormEditor/<filename>.pdf
 * runs an idempotent re-scan, and patches `source_url` on the resulting row
 * so the official URL is preserved.
 *
 * Auth: `qfph_admin` cookie.
 * Limits: 25 MB, must respond with PDF magic bytes (%PDF-),
 *         only http(s) URLs accepted (no file://, no localhost / private IPs).
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { runScan, NO_EDITOR_DIR } from '@/lib/forms-scan';
import { parsePdfFilename } from '@/lib/forms-scanner';
import { updateFormCatalog } from '@/lib/db';

const MAX_BYTES   = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('qfph_admin')?.value);
}

/** Block private/loopback hosts to avoid SSRF. */
function isPublicHttpUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try { url = new URL(raw); } catch { return { ok: false, reason: 'Invalid URL' }; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'Only http(s) URLs are allowed' };
  }
  const host = url.hostname.toLowerCase();
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.localhost') ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    /^fc[0-9a-f]{2}:/i.test(host) ||
    /^fe80:/i.test(host)
  ) {
    return { ok: false, reason: 'URL host is private/loopback' };
  }
  return { ok: true, url };
}

function safeFilename(raw: string): string {
  const base = path.basename(raw);
  const cleaned = base
    .replace(/[^A-Za-z0-9 .\-_()]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'imported.pdf';
  if (!cleaned.toLowerCase().endsWith('.pdf')) return cleaned + '.pdf';
  return cleaned;
}

async function fileExists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { url?: unknown; filename?: unknown };
  try { body = await req.json() as { url?: unknown; filename?: unknown }; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : '';
  if (!rawUrl) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  const check = isPublicHttpUrl(rawUrl);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });
  const url = check.url;

  // ── 1. Fetch the PDF ──
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let buf: Buffer;
  let contentType = '';
  try {
    const resp = await fetch(url.toString(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        // Browser-like headers — many .gov.ph sites 403 on default fetch UA
        // and some sit behind F5/Cloudflare bot challenges.
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/pdf,application/octet-stream,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fil;q=0.8',
        'Accept-Encoding': 'identity',
      },
    });
    if (!resp.ok) {
      return NextResponse.json({ error: `Source returned HTTP ${resp.status}` }, { status: 502 });
    }
    contentType = resp.headers.get('content-type') ?? '';
    const len = Number(resp.headers.get('content-length') ?? '0');
    if (len && len > MAX_BYTES) {
      return NextResponse.json({ error: `Source file too large (${len} bytes, max ${MAX_BYTES})` }, { status: 413 });
    }
    const ab  = await resp.arrayBuffer();
    buf       = Buffer.from(ab);
    if (buf.length === 0) {
      return NextResponse.json({ error: 'Empty download' }, { status: 502 });
    }
    if (buf.length > MAX_BYTES) {
      return NextResponse.json({ error: `Downloaded file too large (${buf.length} bytes)` }, { status: 413 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'fetch failed';
    return NextResponse.json({ error: `Could not fetch URL: ${msg}` }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }

  if (buf.subarray(0, 5).toString('ascii') !== '%PDF-') {
    // Diagnose common failure modes so the admin knows what to do next.
    const head = buf.subarray(0, 256).toString('utf8').toLowerCase();
    const isHtml =
      contentType.toLowerCase().includes('text/html') ||
      head.includes('<!doctype html') ||
      head.includes('<html');
    const looksLikeWaf =
      head.includes('bobcmn') ||                 // F5 BIG-IP TSPD JS challenge
      head.includes('tspd_') ||
      head.includes('cloudflare') ||
      head.includes('cf-ray') ||
      head.includes('access denied') ||
      head.includes('request rejected') ||
      head.includes('captcha');

    if (looksLikeWaf) {
      return NextResponse.json(
        {
          error:
            'The source site is protected by a bot/WAF challenge ' +
            '(e.g. F5 BIG-IP, Cloudflare) that requires a real browser. ' +
            'Open the URL in your browser, save the PDF, then use the ' +
            '"Upload Government PDF" card instead.',
          diagnostics: {
            received_content_type: contentType || 'unknown',
            received_bytes: buf.length,
            head_snippet: buf.subarray(0, 80).toString('utf8'),
          },
        },
        { status: 415 },
      );
    }
    if (isHtml) {
      return NextResponse.json(
        {
          error:
            `The URL returned an HTML page instead of a PDF ` +
            `(content-type: ${contentType || 'unknown'}). ` +
            `It may be a download-page link rather than a direct PDF.`,
          diagnostics: {
            received_content_type: contentType,
            received_bytes: buf.length,
            head_snippet: buf.subarray(0, 80).toString('utf8'),
          },
        },
        { status: 415 },
      );
    }
    return NextResponse.json(
      {
        error: 'Downloaded resource is not a PDF (bad magic bytes).',
        diagnostics: {
          received_content_type: contentType || 'unknown',
          received_bytes: buf.length,
          first_bytes_hex: buf.subarray(0, 16).toString('hex'),
        },
      },
      { status: 415 },
    );
  }

  // ── 2. Choose a filename ──
  // Priority: explicit body.filename → URL pathname tail → "imported.pdf"
  const proposed =
    typeof body.filename === 'string' && body.filename.trim()
      ? body.filename.trim()
      : decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? 'imported.pdf');
  const filename = safeFilename(proposed);

  // ── 3. Save (avoid clobber) ──
  await fs.mkdir(NO_EDITOR_DIR, { recursive: true });
  let finalName = filename;
  let finalDest = path.join(NO_EDITOR_DIR, finalName);
  let n = 1;
  while (await fileExists(finalDest)) {
    const ext  = path.extname(filename);
    const stem = filename.slice(0, filename.length - ext.length);
    finalName  = `${stem} (${n})${ext}`;
    finalDest  = path.join(NO_EDITOR_DIR, finalName);
    if (++n > 50) {
      return NextResponse.json({ error: 'Too many conflicting filenames' }, { status: 409 });
    }
  }
  await fs.writeFile(finalDest, buf);

  // ── 4. Rescan to upsert the row ──
  const scan = await runScan();

  // ── 5. Patch source_url on the new/updated row ──
  // Slug is derived deterministically from the filename.
  const meta = parsePdfFilename(finalName);
  updateFormCatalog(meta.slug, { source_url: url.toString() });

  return NextResponse.json({
    ok: true,
    filename: finalName,
    path: path.posix.join('NoFormEditor', finalName),
    bytes: buf.length,
    sourceUrl: url.toString(),
    slug: meta.slug,
    agency: meta.agency,
    formCode: meta.formCode,
    scan,
  });
}

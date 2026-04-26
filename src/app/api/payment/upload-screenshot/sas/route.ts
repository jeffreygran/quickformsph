import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { isBlocked } from '@/lib/ip-blocklist';
import { readGCashSettings } from '@/lib/gcash-settings';
import { generateSasUrl } from '@/lib/screenshot-storage';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const EXT_MAP: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png',
  'image/webp': '.webp', 'image/gif': '.gif',
};

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

/**
 * GET /api/payment/upload-screenshot/sas?mimeType=image/jpeg
 *
 * Returns a short-lived SAS URL for direct browser → Azure Blob upload.
 * If storage backend is local, returns { backend: 'local' } so the client
 * falls back to the proxy upload at /api/payment/upload-screenshot.
 *
 * Only active when payment_mode === 'upload_only'.
 */
export async function GET(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
  }

  const settings = readGCashSettings();
  if (settings.payment_mode !== 'upload_only') {
    return NextResponse.json({ ok: false, error: 'Upload-only mode is not active' }, { status: 400 });
  }

  const rl = checkRateLimit(ip, 'upload-screenshot-sas', { max: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const mimeType = req.nextUrl.searchParams.get('mimeType') ?? 'image/jpeg';
  if (!ALLOWED_MIMES.has(mimeType)) {
    return NextResponse.json({ ok: false, error: 'Invalid file type' }, { status: 400 });
  }

  const ext = EXT_MAP[mimeType] ?? '.jpg';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;

  const sasUrl = generateSasUrl(filename, mimeType);
  if (!sasUrl) {
    // Local backend — tell client to fall back to proxy upload
    return NextResponse.json({ ok: true, backend: 'local' });
  }

  return NextResponse.json({ ok: true, backend: 'azure', sasUrl, filename });
}

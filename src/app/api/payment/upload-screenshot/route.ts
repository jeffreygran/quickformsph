import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { isBlocked } from '@/lib/ip-blocklist';
import { auditLog } from '@/lib/audit-log';
import { isPdfBuffer, MAX_UPLOAD_BYTES } from '@/lib/sanitize';
import { issueAccessToken } from '@/lib/access-token';
import { readGCashSettings } from '@/lib/gcash-settings';
import { uploadScreenshot } from '@/lib/screenshot-storage';

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
 * POST /api/payment/upload-screenshot
 * Upload-only mode: saves screenshot without OCR validation, issues access token.
 * Only active when payment_mode === 'upload_only'.
 */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted upload-screenshot');
    return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
  }

  // Guard: only active in upload_only mode
  const settings = readGCashSettings();
  if (settings.payment_mode !== 'upload_only') {
    return NextResponse.json({ ok: false, error: 'Upload-only mode is not active' }, { status: 400 });
  }

  // Rate limit: 10 uploads / 5 min per IP
  const rl = checkRateLimit(ip, 'upload-screenshot', { max: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let formData: FormData;
  try { formData = await req.formData(); } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request format' }, { status: 400 });
  }

  const file = formData.get('screenshot') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ ok: false, error: 'No screenshot file provided' }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: 'File too large (max 5MB)' }, { status: 400 });
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json({ ok: false, error: 'Must be an image file (JPEG, PNG, or WebP)' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (isPdfBuffer(buffer)) {
    return NextResponse.json({ ok: false, error: 'Invalid file type' }, { status: 400 });
  }

  // Save screenshot (local filesystem or Azure Blob depending on storage config)
  const ext = EXT_MAP[file.type] ?? '.jpg';
  const filename = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  await uploadScreenshot(filename, buffer, file.type);

  auditLog('upload_attempt', ip, `Screenshot saved: ${filename}`);

  // Issue a synthetic access token (no ref no — use upload ID)
  const rawAmount = parseFloat((formData.get('amount') as string) ?? '5');
  const amount = isNaN(rawAmount) || rawAmount < 5 ? 5 : rawAmount;
  const fakeRef = `UPL-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`;

  try {
    const issued = await issueAccessToken(fakeRef, amount);
    return NextResponse.json({
      ok: true,
      filename,
      token: issued.token,
      tokenExpiresAt: issued.expiresAt,
      refNo: fakeRef,
      amount,
    });
  } catch (err) {
    console.error('[upload-screenshot] token error:', err);
    return NextResponse.json({ ok: false, error: 'Could not issue access token' }, { status: 500 });
  }
}

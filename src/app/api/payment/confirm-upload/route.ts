import { NextRequest, NextResponse } from 'next/server';
import { isBlocked } from '@/lib/ip-blocklist';
import { auditLog } from '@/lib/audit-log';
import { issueAccessToken } from '@/lib/access-token';
import { verifyBlobExists } from '@/lib/screenshot-storage';

const FILENAME_RE = /^[\w-]+\.(jpg|jpeg|png|webp|gif)$/i;

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

/**
 * POST /api/payment/confirm-upload
 * Body: { filename: string, amount: number }
 *
 * Called by the client after a direct SAS upload to Azure Blob.
 * Verifies the blob actually exists, then issues a JWT access token.
 * This prevents token farming without a real upload.
 */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted confirm-upload');
    return NextResponse.json({ ok: false, error: 'Access denied' }, { status: 403 });
  }

  let body: { filename?: unknown; amount?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }

  const { filename, amount: rawAmount } = body;

  if (typeof filename !== 'string' || !FILENAME_RE.test(filename)) {
    return NextResponse.json({ ok: false, error: 'Invalid filename' }, { status: 400 });
  }

  const amount = typeof rawAmount === 'number' && rawAmount >= 5 ? rawAmount : 5;

  // Verify the blob exists — prevents issuing tokens without a real upload
  const exists = await verifyBlobExists(filename);
  if (!exists) {
    return NextResponse.json(
      { ok: false, error: 'Screenshot not found. Please try uploading again.' },
      { status: 404 },
    );
  }

  const fakeRef = `UPL-${filename.replace(/[^A-Z0-9]/gi, '').slice(0, 10).toUpperCase()}`;

  try {
    const issued = await issueAccessToken(fakeRef, amount);
    auditLog('upload_attempt', ip, `SAS direct upload confirmed: ${filename}`);
    return NextResponse.json({
      ok: true,
      filename,
      token: issued.token,
      tokenExpiresAt: issued.expiresAt,
      refNo: fakeRef,
      amount,
    });
  } catch (err) {
    console.error('[confirm-upload] token error:', err);
    return NextResponse.json({ ok: false, error: 'Could not issue access token' }, { status: 500 });
  }
}

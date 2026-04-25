import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { isBlocked } from '@/lib/ip-blocklist';
import { issueAccessToken } from '@/lib/access-token';
import { getLicenseKey, markLicenseKeyUsed } from '@/lib/db';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

/**
 * POST /api/payment/redeem-key
 * Body: { keyCode: string }
 *
 * Validates a license key and, if valid and unused, marks it consumed
 * and returns a signed 48h access token — same as a GCash payment.
 */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted license key redemption');
    return NextResponse.json({ valid: false, error: 'Access denied' }, { status: 403 });
  }

  // Rate limit: 8 attempts per 5 min to slow brute-force guessing
  const rl = checkRateLimit(ip, 'redeem-key', { max: 8, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'License key redemption rate limit exceeded');
    return NextResponse.json(
      { valid: false, error: 'Too many attempts. Please try again later.' },
      { status: 429 },
    );
  }

  let body: { keyCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid request' }, { status: 400 });
  }

  const rawKey = (body.keyCode ?? '').trim().toUpperCase();
  if (!rawKey) {
    return NextResponse.json({ valid: false, error: 'License key is required' }, { status: 400 });
  }

  // Lookup the key
  const keyRow = getLicenseKey(rawKey);
  if (!keyRow) {
    auditLog('license_key_invalid', ip, `Unknown license key attempt: ${rawKey}`);
    return NextResponse.json({ valid: false, error: 'Invalid license key' }, { status: 200 });
  }

  if (keyRow.used_at !== null) {
    auditLog('license_key_already_used', ip, `Already-used key attempt: ${rawKey}`);
    return NextResponse.json({ valid: false, error: 'This license key has already been used' }, { status: 200 });
  }

  // Atomically mark as used
  const claimed = markLicenseKeyUsed(rawKey, ip);
  if (!claimed) {
    // Race condition — another request claimed it first
    return NextResponse.json({ valid: false, error: 'This license key has already been used' }, { status: 200 });
  }

  const { token, expiresAt } = await issueAccessToken(`KEY:${rawKey}`, 0);
  auditLog('license_key_redeemed', ip, `License key redeemed: ${rawKey} (label: ${keyRow.label})`);

  return NextResponse.json({ valid: true, token, expiresAt, refNo: `KEY:${rawKey}` });
}

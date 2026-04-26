import { NextRequest, NextResponse } from 'next/server';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { isBlocked } from '@/lib/ip-blocklist';
import { issueAccessToken } from '@/lib/access-token';
import { insertAnalyticsEvent } from '@/lib/db';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

const USED_REFS_DIR = join(tmpdir(), 'qfph', 'used-refs');

async function isRefUsed(ref: string): Promise<boolean> {
  await mkdir(USED_REFS_DIR, { recursive: true });
  try {
    await readFile(join(USED_REFS_DIR, `${ref}.json`));
    return true;
  } catch {
    return false;
  }
}

async function markRefUsed(ref: string): Promise<void> {
  await mkdir(USED_REFS_DIR, { recursive: true });
  await writeFile(
    join(USED_REFS_DIR, `${ref}.json`),
    JSON.stringify({ ref, usedAt: new Date().toISOString(), source: 'manual' }),
    'utf8',
  );
}

/**
 * POST /api/payment/validate-ref
 * Body: { refNo: string }  — expected format "XXXX-XXX-XXXXXX" (4-3-6 with dashes)
 *
 * Validates format, checks uniqueness, and if valid marks the ref as used.
 */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted ref validation');
    return NextResponse.json({ valid: false, error: 'Access denied' }, { status: 403 });
  }

  // Strict rate limit to prevent brute-force ref guessing: 10 per 5 min
  const rl = checkRateLimit(ip, 'validate-ref', { max: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Ref validation rate limit exceeded');
    return NextResponse.json(
      { valid: false, error: 'Too many attempts. Please try again later.' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({})) as { refNo?: unknown };
  const raw = typeof body.refNo === 'string' ? body.refNo.trim() : '';

  if (!raw) {
    return NextResponse.json({ valid: false, error: 'Reference number is required.' }, { status: 400 });
  }

  // Accept both dashed (XXXX-XXX-XXXXXX) and plain 13-digit formats
  const normalized = raw.replace(/-/g, '');
  const isDashedFormat = /^\d{4}-\d{3}-\d{6}$/.test(raw);
  const isPlainFormat  = /^\d{13}$/.test(raw);

  if (!isDashedFormat && !isPlainFormat) {
    return NextResponse.json(
      { valid: false, error: 'Invalid format. Use XXXX-XXX-XXXXXX (13 digits with dashes).' },
      { status: 400 },
    );
  }

  if (normalized.length !== 13) {
    return NextResponse.json(
      { valid: false, error: 'Reference number must be exactly 13 digits.' },
      { status: 400 },
    );
  }

  if (await isRefUsed(normalized)) {
    auditLog('admin_action', ip, `Duplicate manual ref attempted: ${normalized}`);
    return NextResponse.json(
      { valid: false, error: 'This reference number has already been used for a previous payment.' },
      { status: 409 },
    );
  }

  await markRefUsed(normalized);
  auditLog('admin_action', ip, `Manual ref validated and accepted: ${normalized}`);

  // Record payment success analytics
  try {
    insertAnalyticsEvent({
      event_type: 'payment_success',
      slug: '',
      session_id: '',
      ip_hash: '',
      created_at: Date.now(),
    });
  } catch { /* swallow */ }

  // Issue an access token (v2.0) so the client can unlock local PDF download
  // without sending any form data to the server.
  let token: string | null = null;
  let tokenExpiresAt: number | null = null;
  try {
    const issued = await issueAccessToken(normalized, 5);
    token = issued.token;
    tokenExpiresAt = issued.expiresAt;
  } catch (err) {
    console.error('[validate-ref] token issue error:', err);
  }

  return NextResponse.json({ valid: true, refNo: normalized, token, tokenExpiresAt });
}

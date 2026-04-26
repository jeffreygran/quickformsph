import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getReferralUserByToken,
  insertReferralEvent,
  getReferralCount,
  getReferralConfig,
  insertReferralUser,
  insertLicenseKey,
} from '@/lib/db';

/**
 * POST /api/referral/join
 * Body: { ref_token: string; email: string }
 *
 * Records the referral event and, if the referrer has hit the threshold
 * (on any milestone multiple of required_referrals), auto-issues a promo code.
 */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0';

  let body: { ref_token?: string; email?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const ref_token     = (body.ref_token ?? '').trim();
  const referred_email = (body.email ?? '').trim().toLowerCase();

  if (!ref_token || !referred_email) {
    return NextResponse.json({ error: 'ref_token and email are required' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referred_email)) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400 });
  }

  const referrer = getReferralUserByToken(ref_token);
  if (!referrer) {
    return NextResponse.json({ error: 'Invalid referral link' }, { status: 404 });
  }

  // Self-referral guard
  if (referrer.email === referred_email) {
    return NextResponse.json({ error: 'You cannot refer yourself' }, { status: 400 });
  }

  // Auto-register the referred user if not already registered (they get their own ref link)
  const theirToken = crypto.randomBytes(8).toString('hex');
  insertReferralUser(referred_email, theirToken);

  // Record the event (handles duplicate email + duplicate IP guards)
  const recorded = insertReferralEvent(referrer.email, referred_email, ip);

  const config  = getReferralConfig();
  const count   = getReferralCount(referrer.email);

  // Check if a new milestone was just hit (every N referrals)
  let newPromoCode: string | null = null;
  if (recorded && count > 0 && count % config.required_referrals === 0) {
    // Generate a 5-char alphanumeric promo code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    const bytes = crypto.randomBytes(5);
    for (let i = 0; i < 5; i++) code += chars[bytes[i] % chars.length];

    const expires_at = Date.now() + config.promo_expiry_hours * 3_600_000;
    insertLicenseKey(code, `referral:${referrer.email}:${count}`, expires_at);
    newPromoCode = code;
  }

  return NextResponse.json({
    success: true,
    recorded,
    referrer_email: referrer.email,
    count,
    required: config.required_referrals,
    new_promo_code: newPromoCode,
  });
}

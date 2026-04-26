import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralUserByEmail,
  getReferralCount,
  getReferralConfig,
  getAllLicenseKeys,
} from '@/lib/db';

/**
 * GET /api/referral/status?email=<email>
 * Returns referral progress and any earned promo codes for this user.
 */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? '').trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  const user = getReferralUserByEmail(email);
  if (!user) {
    return NextResponse.json({ registered: false });
  }

  const config = getReferralConfig();
  const count  = getReferralCount(email);

  // Find promo codes earned by this user (unused ones still valid)
  const allKeys = getAllLicenseKeys();
  const now = Date.now();
  const earnedCodes = allKeys
    .filter((k) => k.label.startsWith(`referral:${email}:`))
    .map((k) => ({
      key_code:   k.key_code,
      used:       k.used_at !== null,
      expired:    k.expires_at !== null && k.expires_at < now,
      expires_at: k.expires_at,
    }));

  return NextResponse.json({
    registered: true,
    email: user.email,
    ref_token: user.ref_token,
    count,
    required: config.required_referrals,
    promo_expiry_hours: config.promo_expiry_hours,
    earned_codes: earnedCodes,
  });
}

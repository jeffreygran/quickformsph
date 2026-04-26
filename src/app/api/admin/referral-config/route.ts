import { NextRequest, NextResponse } from 'next/server';
import { getReferralConfig, setReferralConfig } from '@/lib/db';

function isAdmin(req: NextRequest) {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/referral-config — returns current config */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getReferralConfig(), { headers: { 'Cache-Control': 'no-store' } });
}

/** POST /api/admin/referral-config — updates config */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { required_referrals?: number; promo_expiry_hours?: number };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const required_referrals = Number(body.required_referrals);
  const promo_expiry_hours  = Number(body.promo_expiry_hours);
  if (!Number.isInteger(required_referrals) || required_referrals < 1 ||
      !Number.isInteger(promo_expiry_hours)  || promo_expiry_hours  < 1) {
    return NextResponse.json({ error: 'Both fields must be positive integers' }, { status: 400 });
  }
  setReferralConfig({ required_referrals, promo_expiry_hours });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  insertReferralUser,
  getReferralUserByEmail,
} from '@/lib/db';

/**
 * POST /api/referral/register
 * Body: { email: string }
 * Returns: { token: string } — the referral token for generating /join?ref=<token>
 */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email address required' }, { status: 400 });
  }

  // Reuse existing token if already registered
  const existing = getReferralUserByEmail(email);
  if (existing) {
    return NextResponse.json({ token: existing.ref_token, already_registered: true });
  }

  const ref_token = crypto.randomBytes(8).toString('hex'); // 16-char hex token
  const user = insertReferralUser(email, ref_token);
  return NextResponse.json({ token: user.ref_token, already_registered: false });
}

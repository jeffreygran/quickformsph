import { NextRequest, NextResponse } from 'next/server';
import { getReferralStats } from '@/lib/db';

function isAdmin(req: NextRequest) {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/referral-stats */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getReferralStats(), { headers: { 'Cache-Control': 'no-store' } });
}

/**
 * GET /api/admin/analytics?period=day|week|month
 *
 * Returns aggregated analytics stats for the admin dashboard.
 * Requires admin cookie (qfph_admin).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDashboardStats } from '@/lib/db';

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!req.cookies.get('qfph_admin')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get('period') ?? 'week';
  const period = (['day', 'week', 'month'] as const).includes(raw as 'day' | 'week' | 'month')
    ? (raw as 'day' | 'week' | 'month')
    : 'week';

  const stats = getDashboardStats(period);

  return NextResponse.json(stats, {
    headers: { 'Cache-Control': 'no-store' },
  });
}

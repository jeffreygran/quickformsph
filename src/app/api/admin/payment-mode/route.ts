import { NextRequest, NextResponse } from 'next/server';
import { readGCashSettings, writeGCashSettings } from '@/lib/gcash-settings';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/payment-mode — returns current payment_mode */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const settings = readGCashSettings();
  return NextResponse.json({ payment_mode: settings.payment_mode ?? 'process' });
}

/** POST /api/admin/payment-mode — update payment_mode */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { payment_mode?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body.payment_mode !== 'process' && body.payment_mode !== 'upload_only') {
    return NextResponse.json({ error: 'payment_mode must be "process" or "upload_only"' }, { status: 400 });
  }
  const current = readGCashSettings();
  writeGCashSettings({ ...current, payment_mode: body.payment_mode });
  return NextResponse.json({ ok: true, payment_mode: body.payment_mode });
}

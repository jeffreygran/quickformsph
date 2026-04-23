import { NextRequest, NextResponse } from 'next/server';
import { readGCashSettings, writeGCashSettings } from '@/lib/gcash-settings';
import type { GCashSettings } from '@/lib/gcash-settings';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/gcash-settings — public (used by form page at runtime) */
export async function GET() {
  return NextResponse.json(readGCashSettings());
}

/** POST /api/admin/gcash-settings — admin only, update name/number/qr_url */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Partial<GCashSettings>;
  try {
    body = await req.json() as Partial<GCashSettings>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const current = readGCashSettings();
  const updated: GCashSettings = {
    gcash_number: typeof body.gcash_number === 'string' ? body.gcash_number.trim() : current.gcash_number,
    gcash_name:   typeof body.gcash_name   === 'string' ? body.gcash_name.trim()   : current.gcash_name,
    qr_url:       body.qr_url !== undefined              ? body.qr_url              : current.qr_url,
  };

  writeGCashSettings(updated);
  return NextResponse.json({ ok: true, settings: updated });
}

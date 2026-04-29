/**
 * POST /api/admin/forms/scan
 *
 * Auth: requires the `qfph_admin` cookie (set by /mc/login).
 * Returns: ScanResult (see src/lib/forms-scan.ts).
 */

import { NextRequest, NextResponse } from 'next/server';
import { runScan } from '@/lib/forms-scan';

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('qfph_admin')?.value);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runScan();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[forms/scan]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'scan failed' },
      { status: 500 },
    );
  }
}

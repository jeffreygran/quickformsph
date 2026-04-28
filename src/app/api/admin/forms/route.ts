/**
 * GET /api/admin/forms
 *
 * Lists every form catalog row. Use ?includeDeleted=1 to also surface
 * soft-deleted entries (so they can be restored).
 *
 * Auth: `mc_auth` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listFormCatalog } from '@/lib/db';

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('mc_auth')?.value);
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const includeDeleted = req.nextUrl.searchParams.get('includeDeleted') === '1';
  const rows = listFormCatalog({ includeDeleted });
  return NextResponse.json({ ok: true, rows });
}

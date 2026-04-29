/**
 * POST /api/admin/forms/[slug]/restore — clear deleted_at (undo soft delete).
 * Auth: `qfph_admin` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import { restoreFormCatalog } from '@/lib/db';

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('qfph_admin')?.value);
}

interface Ctx { params: { slug: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ok = restoreFormCatalog(params.slug);
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

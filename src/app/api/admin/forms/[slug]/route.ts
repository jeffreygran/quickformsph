/**
 * GET    /api/admin/forms/[slug]   — fetch a single form row
 * PATCH  /api/admin/forms/[slug]   — partial update (form_name, agency,
 *                                    source_url, has_form_editor,
 *                                    is_old_form_reported, is_paid, up_vote)
 * DELETE /api/admin/forms/[slug]   — soft delete (preserves up_vote history)
 *
 * Auth: `mc_auth` cookie.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getFormCatalogBySlug,
  updateFormCatalog,
  softDeleteFormCatalog,
} from '@/lib/db';

function isAuthed(req: NextRequest): boolean {
  return Boolean(req.cookies.get('mc_auth')?.value);
}

interface Ctx { params: { slug: string } }

export async function GET(req: NextRequest, { params }: Ctx) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const row = getFormCatalogBySlug(params.slug);
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true, row });
}

const ALLOWED_FIELDS = [
  'form_name',
  'agency',
  'source_url',
  'has_form_editor',
  'is_old_form_reported',
  'is_paid',
  'up_vote',
] as const;
type EditableField = typeof ALLOWED_FIELDS[number];

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const existing = getFormCatalogBySlug(params.slug);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let body: Record<string, unknown>;
  try { body = await req.json() as Record<string, unknown>; }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const patch: Record<string, unknown> = {};
  for (const k of ALLOWED_FIELDS as readonly EditableField[]) {
    if (!(k in body)) continue;
    const v = body[k];
    if (k === 'has_form_editor' || k === 'is_old_form_reported' || k === 'is_paid') {
      patch[k] = v ? 1 : 0;
    } else if (k === 'up_vote') {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) {
        return NextResponse.json({ error: 'up_vote must be a non-negative number' }, { status: 400 });
      }
      patch[k] = Math.floor(n);
    } else if (k === 'source_url') {
      patch[k] = v == null || v === '' ? null : String(v).trim();
    } else if (k === 'form_name' || k === 'agency') {
      const s = String(v ?? '').trim();
      if (!s) return NextResponse.json({ error: `${k} cannot be empty` }, { status: 400 });
      patch[k] = s;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No editable fields supplied' }, { status: 400 });
  }

  updateFormCatalog(params.slug, patch);
  return NextResponse.json({ ok: true, row: getFormCatalogBySlug(params.slug) });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const ok = softDeleteFormCatalog(params.slug);
  if (!ok) return NextResponse.json({ error: 'Not found or already deleted' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

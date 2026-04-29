import { NextResponse } from 'next/server';
import { incrementFormUpvote, getFormCatalogBySlug } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { slug: string } },
) {
  const row = getFormCatalogBySlug(params.slug);
  if (!row || row.deleted_at) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }
  const upVote = incrementFormUpvote(params.slug);
  return NextResponse.json({ ok: true, slug: params.slug, upVote });
}

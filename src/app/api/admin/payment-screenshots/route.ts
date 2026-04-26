import { NextRequest, NextResponse } from 'next/server';
import { listScreenshots, deleteScreenshot } from '@/lib/screenshot-storage';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/payment-screenshots — list all uploaded screenshots */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const screenshots = await listScreenshots();
  return NextResponse.json({ screenshots });
}

/** DELETE /api/admin/payment-screenshots — delete one screenshot
 *  Body: { filename: string }
 */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { filename?: string };
  if (!body.filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });
  const removed = await deleteScreenshot(body.filename);
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { getScreenshot } from '@/lib/screenshot-storage';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { filename } = await params;
  const safe = path.basename(decodeURIComponent(filename));
  const result = await getScreenshot(safe);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return new NextResponse(new Uint8Array(result.buffer), {
    headers: {
      'Content-Type': result.mimeType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

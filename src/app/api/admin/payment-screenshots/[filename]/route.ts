import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SCREENSHOT_DIR = path.join(
  process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph'),
  'paymentscreenshot',
);

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { filename } = await params;
  const safe = path.basename(decodeURIComponent(filename));
  const fullPath = path.join(SCREENSHOT_DIR, safe);

  if (!fullPath.startsWith(SCREENSHOT_DIR) || !fs.existsSync(fullPath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const ext = path.extname(safe).toLowerCase();
  const mime = MIME[ext] ?? 'application/octet-stream';
  const buffer = fs.readFileSync(fullPath);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

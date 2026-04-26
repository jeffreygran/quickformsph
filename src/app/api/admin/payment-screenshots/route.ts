import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const SCREENSHOT_DIR = path.join(
  process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph'),
  'paymentscreenshot',
);

function ensureDir() {
  if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/payment-screenshots — list all uploaded screenshots */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  ensureDir();
  const allowed = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  const files = fs.readdirSync(SCREENSHOT_DIR)
    .filter((f) => allowed.has(path.extname(f).toLowerCase()))
    .map((f) => {
      const stat = fs.statSync(path.join(SCREENSHOT_DIR, f));
      return {
        filename: f,
        size: stat.size,
        uploadedAt: stat.mtime.toISOString(),
        url: `/api/admin/payment-screenshots/${encodeURIComponent(f)}`,
      };
    })
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  return NextResponse.json({ screenshots: files, dir: SCREENSHOT_DIR });
}

/** DELETE /api/admin/payment-screenshots — delete one screenshot
 *  Body: { filename: string }
 */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({})) as { filename?: string };
  if (!body.filename) return NextResponse.json({ error: 'filename required' }, { status: 400 });

  // Path traversal guard
  const safe = path.basename(body.filename);
  const fullPath = path.join(SCREENSHOT_DIR, safe);
  if (!fullPath.startsWith(SCREENSHOT_DIR + path.sep) && fullPath !== SCREENSHOT_DIR) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
  }
  if (!fs.existsSync(fullPath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  fs.unlinkSync(fullPath);
  return NextResponse.json({ ok: true });
}

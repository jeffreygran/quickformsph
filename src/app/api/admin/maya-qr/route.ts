import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readGCashSettings, writeGCashSettings, SETTINGS_DIR } from '@/lib/gcash-settings';

const QR_DIR = SETTINGS_DIR;

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

function findMayaQRFile(): { filePath: string; mimeType: string } | null {
  if (!fs.existsSync(QR_DIR)) return null;
  const extToMime: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif: 'image/gif',
  };
  for (const name of fs.readdirSync(QR_DIR)) {
    if (name.startsWith('maya-qr.')) {
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      return { filePath: path.join(QR_DIR, name), mimeType: extToMime[ext] ?? 'image/png' };
    }
  }
  return null;
}

/** GET /api/admin/maya-qr — serve the stored Maya QR image */
export async function GET() {
  const found = findMayaQRFile();
  if (!found) {
    return NextResponse.json({ error: 'No Maya QR code uploaded' }, { status: 404 });
  }
  const buf = fs.readFileSync(found.filePath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': found.mimeType,
      'Cache-Control': 'no-store',
    },
  });
}

/** POST /api/admin/maya-qr — upload Maya QR image (admin only) */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('qr') as File | null;
  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPEG, WEBP or GIF allowed' }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 });
  }

  fs.mkdirSync(QR_DIR, { recursive: true });
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'gif';
  const dest = path.join(QR_DIR, `maya-qr.${ext}`);

  for (const name of fs.readdirSync(QR_DIR)) {
    if (name.startsWith('maya-qr.')) fs.unlinkSync(path.join(QR_DIR, name));
  }
  fs.writeFileSync(dest, buf);

  const current = readGCashSettings();
  writeGCashSettings({ ...current, maya_qr_url: '/api/admin/maya-qr' });

  return NextResponse.json({ ok: true, maya_qr_url: '/api/admin/maya-qr' });
}

/** DELETE /api/admin/maya-qr — remove the Maya QR image (admin only) */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let removed = false;
  for (const name of fs.existsSync(QR_DIR) ? fs.readdirSync(QR_DIR) : []) {
    if (name.startsWith('maya-qr.')) {
      fs.unlinkSync(path.join(QR_DIR, name));
      removed = true;
    }
  }
  const current = readGCashSettings();
  writeGCashSettings({ ...current, maya_qr_url: null });

  return NextResponse.json({ ok: true, removed });
}

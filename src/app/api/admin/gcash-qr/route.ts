import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { readGCashSettings, writeGCashSettings, SETTINGS_DIR } from '@/lib/gcash-settings';

const QR_DIR  = SETTINGS_DIR;

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

function findQRFile(): { filePath: string; mimeType: string } | null {
  if (!fs.existsSync(QR_DIR)) return null;
  const extToMime: Record<string, string> = {
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    webp: 'image/webp', gif: 'image/gif',
  };
  for (const name of fs.readdirSync(QR_DIR)) {
    if (name.startsWith('gcash-qr.')) {
      const ext = name.split('.').pop()?.toLowerCase() ?? '';
      return { filePath: path.join(QR_DIR, name), mimeType: extToMime[ext] ?? 'image/png' };
    }
  }
  return null;
}

/** GET /api/admin/gcash-qr — serve the stored QR image */
export async function GET() {
  const found = findQRFile();
  if (!found) {
    return NextResponse.json({ error: 'No QR code uploaded' }, { status: 404 });
  }
  const buf = fs.readFileSync(found.filePath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': found.mimeType,
      'Cache-Control': 'no-store',
    },
  });
}

/** POST /api/admin/gcash-qr — upload QR image (admin only), saves and updates settings qr_url */
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
  // Use extension matching actual type
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/webp' ? 'webp' : 'gif';
  const dest = path.join(QR_DIR, `gcash-qr.${ext}`);

  // Remove any old QR files
  for (const name of fs.readdirSync(QR_DIR)) {
    if (name.startsWith('gcash-qr.')) fs.unlinkSync(path.join(QR_DIR, name));
  }
  fs.writeFileSync(dest, buf);

  // Update settings with the new QR url
  const current = readGCashSettings();
  writeGCashSettings({ ...current, qr_url: '/api/admin/gcash-qr' });

  return NextResponse.json({ ok: true, qr_url: '/api/admin/gcash-qr' });
}

/** DELETE /api/admin/gcash-qr — remove the QR image (admin only) */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dir = QR_DIR;
  let removed = false;
  for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
    if (name.startsWith('gcash-qr.')) {
      fs.unlinkSync(path.join(dir, name));
      removed = true;
    }
  }
  // Clear qr_url in settings
  const current = readGCashSettings();
  writeGCashSettings({ ...current, qr_url: null });

  return NextResponse.json({ ok: true, removed });
}

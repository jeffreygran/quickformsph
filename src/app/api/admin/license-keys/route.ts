import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import {
  getAllLicenseKeys,
  insertLicenseKey,
  deleteLicenseKey,
} from '@/lib/db';

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

function generateKey(): string {
  // Format: XXXX-XXXX-XXXX-XXXX  (uppercase alphanumeric, easy to read)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous I/O/0/1
  const segment = () =>
    Array.from({ length: 4 }, () => chars[randomBytes(1)[0] % chars.length]).join('');
  return `${segment()}-${segment()}-${segment()}-${segment()}`;
}

/** GET /api/admin/license-keys — list all keys */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return NextResponse.json({ keys: getAllLicenseKeys() });
}

/** POST /api/admin/license-keys — generate one or more new keys
 *  Body: { count?: number (1–50), label?: string }
 */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: { count?: number; label?: string } = {};
  try { body = await req.json(); } catch { /* empty body ok */ }

  const count = Math.min(Math.max(Number(body.count ?? 1), 1), 50);
  const label = (body.label ?? '').trim().slice(0, 100);

  const created: string[] = [];
  for (let i = 0; i < count; i++) {
    const key = generateKey();
    insertLicenseKey(key, label);
    created.push(key);
  }
  return NextResponse.json({ created });
}

/** DELETE /api/admin/license-keys?id=<id> — delete a key by id */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = Number(req.nextUrl.searchParams.get('id') ?? '');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const ok = deleteLicenseKey(id);
  return NextResponse.json({ deleted: ok });
}

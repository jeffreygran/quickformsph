import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const REFS_DIR = path.join(os.tmpdir(), 'qfph', 'used-refs');

function ensureDir() {
  if (!fs.existsSync(REFS_DIR)) fs.mkdirSync(REFS_DIR, { recursive: true });
}

function requireAdmin(req: NextRequest): boolean {
  return !!req.cookies.get('qfph_admin')?.value;
}

/** GET /api/admin/payment-refs — list all used ref numbers */
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ensureDir();
  const files = fs.readdirSync(REFS_DIR).filter((f) => f.endsWith('.json'));
  const refs = files.map((f) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(REFS_DIR, f), 'utf8')) as {
        ref: string;
        usedAt: string;
      };
      return { ref: data.ref, usedAt: data.usedAt };
    } catch {
      return { ref: f.replace('.json', ''), usedAt: null };
    }
  });
  // Sort newest first
  refs.sort((a, b) => {
    if (!a.usedAt) return 1;
    if (!b.usedAt) return -1;
    return new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime();
  });
  return NextResponse.json({ refs, dir: REFS_DIR });
}

/** DELETE /api/admin/payment-refs — delete one or all refs
 *  Body: { ref: string }  → delete single ref
 *  Body: { all: true }    → flush all
 */
export async function DELETE(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ensureDir();
  const body = await req.json().catch(() => ({})) as { ref?: string; all?: boolean };

  if (body.all) {
    const files = fs.readdirSync(REFS_DIR).filter((f) => f.endsWith('.json'));
    files.forEach((f) => fs.unlinkSync(path.join(REFS_DIR, f)));
    return NextResponse.json({ deleted: files.length });
  }

  if (body.ref) {
    const filePath = path.join(REFS_DIR, `${body.ref}.json`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Ref not found' }, { status: 404 });
    }
    fs.unlinkSync(filePath);
    return NextResponse.json({ deleted: 1 });
  }

  return NextResponse.json({ error: 'Provide ref or all:true' }, { status: 400 });
}

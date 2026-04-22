import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'codes')
  : path.join(os.tmpdir(), 'qfph', 'codes');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isAdmin(req: NextRequest) {
  const cookie = req.cookies.get('qfph_admin');
  return !!cookie?.value;
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  ensureDir(DATA_DIR);

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  const entries = files.map((file) => {
    const code = file.replace('.json', '');
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      return {
        code,
        name: raw.name ?? '—',
        formName: raw.formName ?? '—',
        formCode: raw.formCode ?? '—',
        agency: raw.agency ?? '—',
        slug: raw.slug ?? '',
        created_at: raw.created_at ?? null,
        expires_at: raw.expires_at ?? null,
        expired: raw.expires_at ? Date.now() > raw.expires_at : false,
      };
    } catch {
      return { code, name: '—', formName: '—', formCode: '—', agency: '—', slug: '', created_at: null, expires_at: null, expired: false };
    }
  });

  // Sort newest first
  entries.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));

  return NextResponse.json({ entries, dir: DATA_DIR });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { code?: string; all?: boolean; expired?: boolean };
  ensureDir(DATA_DIR);

  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));

  if (body.all) {
    let deleted = 0;
    for (const file of files) {
      try { fs.unlinkSync(path.join(DATA_DIR, file)); deleted++; } catch { /* ignore */ }
    }
    return NextResponse.json({ deleted });
  }

  if (body.expired) {
    let deleted = 0;
    for (const file of files) {
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
        if (raw.expires_at && Date.now() > raw.expires_at) {
          fs.unlinkSync(path.join(DATA_DIR, file));
          deleted++;
        }
      } catch { /* ignore */ }
    }
    return NextResponse.json({ deleted });
  }

  if (body.code) {
    const safe = body.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const filePath = path.join(DATA_DIR, `${safe}.json`);
    if (!fs.existsSync(filePath)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    fs.unlinkSync(filePath);
    return NextResponse.json({ deleted: 1 });
  }

  return NextResponse.json({ error: 'Specify code, all, or expired' }, { status: 400 });
}

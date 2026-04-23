import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  getAllPDFRecords,
  deletePDFRecord,
  deleteExpiredPDFRecords,
  deleteAllPDFRecords,
  insertPDFRecord,
  insertPaymentRef,
} from '@/lib/db';

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

/** Backfill: import JSON-only entries into SQLite that aren't already there */
function backfillFromJSON(existingCodes: Set<string>) {
  ensureDir(DATA_DIR);
  const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    const code = file.replace('.json', '');
    if (existingCodes.has(code)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      const now = Date.now();
      insertPDFRecord({
        code,
        slug:       raw.slug       ?? '',
        form_name:  raw.formName   ?? '—',
        form_code:  raw.formCode   ?? '—',
        agency:     raw.agency     ?? '—',
        full_name:  raw.name       ?? '—',
        created_at: raw.created_at ?? now,
        expires_at: raw.expires_at ?? (now + 48 * 60 * 60 * 1000),
      });
      if (raw.refNo != null || raw.amount != null) {
        insertPaymentRef({
          code,
          ref_no:     raw.refNo  ?? null,
          amount:     raw.amount ?? null,
          created_at: raw.created_at ?? now,
        });
      }
    } catch { /* skip invalid files */ }
  }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  ensureDir(DATA_DIR);
  const existing = getAllPDFRecords();
  const existingCodes = new Set(existing.map((e) => e.code));
  backfillFromJSON(existingCodes);

  const entries = getAllPDFRecords();
  return NextResponse.json({ entries, dir: DATA_DIR });
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as { code?: string; all?: boolean; expired?: boolean };
  ensureDir(DATA_DIR);

  if (body.all) {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
    let deleted = 0;
    for (const file of files) {
      try { fs.unlinkSync(path.join(DATA_DIR, file)); deleted++; } catch { /* ignore */ }
    }
    deleteAllPDFRecords();
    return NextResponse.json({ deleted });
  }

  if (body.expired) {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json'));
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
    deleteExpiredPDFRecords();
    return NextResponse.json({ deleted });
  }

  if (body.code) {
    const safe = body.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const filePath = path.join(DATA_DIR, `${safe}.json`);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    }
    deletePDFRecord(safe);
    return NextResponse.json({ deleted: 1 });
  }

  return NextResponse.json({ error: 'Specify code, all, or expired' }, { status: 400 });
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'suggestions')
  : path.join(os.tmpdir(), 'qfph', 'suggestions');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/** POST /api/suggestions — public, submit a suggestion */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

  // Rate limit: 5 suggestions / hour per IP
  const rl = checkRateLimit(ip, 'suggestions', { max: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Suggestions rate limit exceeded');
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = await req.json().catch(() => ({})) as {
    name?: string;
    email?: string;
    suggestion?: string;
  };

  const suggestion = sanitizeText(body.suggestion ?? '', 2000);
  if (suggestion.length < 3) {
    return NextResponse.json({ error: 'Suggestion is too short' }, { status: 400 });
  }

  ensureDir(DATA_DIR);

  const id  = crypto.randomBytes(8).toString('hex');
  const now = Date.now();

  const entry = {
    id,
    name:       sanitizeText(body.name  ?? '', 100),
    email:      sanitizeEmail(body.email ?? ''),
    suggestion,
    created_at: now,
    status:     'pending' as const,
  };

  fs.writeFileSync(
    path.join(DATA_DIR, `${now}-${id}.json`),
    JSON.stringify(entry, null, 2),
    'utf-8',
  );

  return NextResponse.json({ success: true, id });
}

/** GET /api/suggestions — admin only */
export async function GET(req: NextRequest) {
  const auth = req.cookies.get('qfph_admin')?.value;
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  ensureDir(DATA_DIR);

  const files = fs.readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .reverse();

  const suggestions = files
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  return NextResponse.json({ suggestions });
}

/** DELETE /api/suggestions — admin only */
export async function DELETE(req: NextRequest) {
  const auth = req.cookies.get('qfph_admin')?.value;
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { id?: string };
  const id   = (body.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  ensureDir(DATA_DIR);

  const files = fs.readdirSync(DATA_DIR)
    .filter((f) => f.includes(id) && f.endsWith('.json'));

  files.forEach((f) => {
    try { fs.unlinkSync(path.join(DATA_DIR, f)); } catch { /* ignore */ }
  });

  return NextResponse.json({ success: true });
}

/** PATCH /api/suggestions — admin only, mark status */
export async function PATCH(req: NextRequest) {
  const auth = req.cookies.get('qfph_admin')?.value;
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { id?: string; status?: string };
  const id     = (body.id ?? '').trim();
  const status = (body.status ?? '').trim();
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  ensureDir(DATA_DIR);

  const files = fs.readdirSync(DATA_DIR)
    .filter((f) => f.includes(id) && f.endsWith('.json'));

  for (const f of files) {
    const fp = path.join(DATA_DIR, f);
    try {
      const entry = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      entry.status = status;
      fs.writeFileSync(fp, JSON.stringify(entry, null, 2), 'utf-8');
    } catch { /* ignore */ }
  }

  return NextResponse.json({ success: true });
}

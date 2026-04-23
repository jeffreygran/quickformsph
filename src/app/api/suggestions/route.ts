import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { sanitizeText, sanitizeEmail } from '@/lib/sanitize';
import {
  insertSuggestion,
  getAllSuggestions,
  deleteSuggestion,
  deleteAllSuggestions,
  updateSuggestionStatus,
  type Suggestion,
} from '@/lib/db';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

const JSON_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'suggestions')
  : path.join(os.tmpdir(), 'qfph', 'suggestions');

/** One-time backfill from legacy JSON files into SQLite */
function backfillFromJSON(existingIds: Set<string>) {
  if (!fs.existsSync(JSON_DIR)) return;
  const files = fs.readdirSync(JSON_DIR).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(JSON_DIR, file), 'utf-8')) as Partial<Suggestion>;
      if (!raw.id || existingIds.has(raw.id)) continue;
      insertSuggestion({
        id:         raw.id,
        name:       raw.name       ?? '',
        email:      raw.email      ?? '',
        suggestion: raw.suggestion ?? '',
        status:     (raw.status as Suggestion['status']) ?? 'pending',
        created_at: raw.created_at ?? Date.now(),
      });
    } catch { /* skip invalid */ }
  }
}

/** POST /api/suggestions — public, submit a suggestion */
export async function POST(req: NextRequest) {
  const ip = getIP(req);

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

  const id  = crypto.randomBytes(8).toString('hex');
  const now = Date.now();

  const entry: Suggestion = {
    id,
    name:       sanitizeText(body.name  ?? '', 100),
    email:      sanitizeEmail(body.email ?? ''),
    suggestion,
    created_at: now,
    status:     'pending',
  };

  insertSuggestion(entry);

  return NextResponse.json({ success: true, id });
}

/** GET /api/suggestions — admin only */
export async function GET(req: NextRequest) {
  if (!req.cookies.get('qfph_admin')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Backfill any legacy JSON-file suggestions on first load
  const existing    = getAllSuggestions();
  const existingIds = new Set(existing.map((s) => s.id));
  backfillFromJSON(existingIds);

  const suggestions = getAllSuggestions();
  return NextResponse.json({ suggestions });
}

/** DELETE /api/suggestions — admin only */
export async function DELETE(req: NextRequest) {
  if (!req.cookies.get('qfph_admin')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { id?: string; all?: boolean };

  if (body.all) {
    const deleted = deleteAllSuggestions();
    // Also remove legacy JSON files
    if (fs.existsSync(JSON_DIR)) {
      fs.readdirSync(JSON_DIR)
        .filter((f) => f.endsWith('.json'))
        .forEach((f) => { try { fs.unlinkSync(path.join(JSON_DIR, f)); } catch { /* ignore */ } });
    }
    return NextResponse.json({ success: true, deleted });
  }

  const id = (body.id ?? '').trim();
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  deleteSuggestion(id);

  // Also remove matching legacy JSON file if present
  if (fs.existsSync(JSON_DIR)) {
    fs.readdirSync(JSON_DIR)
      .filter((f) => f.includes(id) && f.endsWith('.json'))
      .forEach((f) => { try { fs.unlinkSync(path.join(JSON_DIR, f)); } catch { /* ignore */ } });
  }

  return NextResponse.json({ success: true });
}

/** PATCH /api/suggestions — admin only, mark status */
export async function PATCH(req: NextRequest) {
  if (!req.cookies.get('qfph_admin')?.value) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { id?: string; status?: string };
  const id     = (body.id     ?? '').trim();
  const status = (body.status ?? '').trim();
  if (!id || !status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  updateSuggestionStatus(id, status);

  return NextResponse.json({ success: true });
}


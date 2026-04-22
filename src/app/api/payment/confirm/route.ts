import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug, FORMS } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { isBlocked } from '@/lib/ip-blocklist';
import { sanitizeSlug, sanitizeText, isValidSlug } from '@/lib/sanitize';
import { encryptValues } from '@/lib/encrypt';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'codes')
  : path.join(os.tmpdir(), 'qfph', 'codes');

const CODE_TTL_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I ambiguity

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function generateCode(): string {
  let code = '';
  const bytes = crypto.randomBytes(5);
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted payment confirm');
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limit: 20 confirms / 5 min per IP
  const rl = checkRateLimit(ip, 'payment-confirm', { max: 20, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Payment confirm rate limit exceeded');
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const rawSlug = body?.slug;
  const rawValues = body?.values;

  const slug = sanitizeSlug(rawSlug);
  if (!slug || !rawValues || typeof rawValues !== 'object') {
    return NextResponse.json({ error: 'Missing slug or values' }, { status: 400 });
  }

  const knownSlugs = FORMS.map((f) => f.slug);
  if (!isValidSlug(slug, knownSlugs)) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawValues as Record<string, unknown>)) {
    values[sanitizeText(k, 100)] = sanitizeText(v, 500);
  }

  const form = getFormBySlug(slug);
  if (!form) {
    return NextResponse.json({ error: 'Form not found' }, { status: 404 });
  }

  try {
    const pdfBytes = await generatePDF(form, values);
    ensureDir(DATA_DIR);

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (fs.existsSync(path.join(DATA_DIR, `${code}.json`)) && attempts < 20) {
      code = generateCode();
      attempts++;
    }

    const firstName = (values.first_name ?? '').trim();
    const lastName  = (values.last_name  ?? '').trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
    const now       = Date.now();

    // Encrypt form values before writing to disk (DPA RA 10173 — security safeguards).
    // Non-identifying metadata (slug, agency, timestamps) stays in plaintext so expiry
    // checks and housekeeping can run without decryption.
    const encryptedValues = encryptValues(values);

    const entry = {
      slug,
      encryptedValues,
      name: fullName,
      formName: form.name,
      formCode: form.code,
      agency: form.agency,
      created_at: now,
      expires_at: now + CODE_TTL_MS,
    };

    fs.writeFileSync(
      path.join(DATA_DIR, `${code}.json`),
      JSON.stringify(entry, null, 2),
      'utf-8',
    );

    const safeName = fullName
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    const filename = `${safeName} - ${form.agency} - ${form.code}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Download-Code': code,
        'Access-Control-Expose-Headers': 'X-Download-Code',
      },
    });
  } catch (err) {
    console.error('[payment/confirm] Error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

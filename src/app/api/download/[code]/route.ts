import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { decryptValues, EncryptedBlob } from '@/lib/encrypt';
import fs from 'fs';
import path from 'path';
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

interface CodeEntry {
  slug: string;
  /** Encrypted form values — see src/lib/encrypt.ts */
  encryptedValues: EncryptedBlob;
  /** Legacy plain-text values from pre-encryption records (will be absent on new records) */
  values?: Record<string, string>;
  name: string;
  formCode: string;
  agency: string;
  created_at: number;
  expires_at: number;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  const ip = getIP(req);

  // Rate limit: 30 downloads / 5 min per IP (prevents code enumeration)
  const rl = checkRateLimit(ip, 'download', { max: 30, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Download rate limit exceeded');
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  const raw  = params.code ?? '';
  const code = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();

  if (!code || code.length !== 5) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  const filePath = path.join(DATA_DIR, `${code}.json`);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Code not found or already expired' }, { status: 404 });
  }

  let entry: CodeEntry;
  try {
    entry = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as CodeEntry;
  } catch {
    return NextResponse.json({ error: 'Invalid code data' }, { status: 500 });
  }

  if (Date.now() > entry.expires_at) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
    return NextResponse.json({ error: 'This download code has expired' }, { status: 410 });
  }

  const form = getFormBySlug(entry.slug);
  if (!form) {
    return NextResponse.json({ error: 'Form template not found' }, { status: 404 });
  }

  // Decrypt form values. Supports legacy plain-text records (created before encryption was added).
  let values: Record<string, string>;
  try {
    if (entry.encryptedValues) {
      values = decryptValues(entry.encryptedValues);
    } else if (entry.values) {
      // Legacy record — plain text (will phase out naturally within 48h TTL)
      values = entry.values;
    } else {
      return NextResponse.json({ error: 'Invalid code data' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Could not read form data' }, { status: 500 });
  }

  try {
    const pdfBytes = await generatePDF(form, values);
    const safeName = entry.name
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
    const filename = `${safeName} - ${entry.agency} - ${entry.formCode}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

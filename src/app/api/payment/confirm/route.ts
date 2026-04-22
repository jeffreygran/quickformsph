import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import os from 'os';

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
  const body = await req.json().catch(() => ({}));
  const { slug, values } = body as { slug?: string; values?: Record<string, string> };

  if (!slug || !values) {
    return NextResponse.json({ error: 'Missing slug or values' }, { status: 400 });
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

    const entry = {
      slug,
      values,
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

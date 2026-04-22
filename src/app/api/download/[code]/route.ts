import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = process.env.DATA_DIR
  ? path.join(process.env.DATA_DIR, 'codes')
  : path.join(os.tmpdir(), 'qfph', 'codes');

interface CodeEntry {
  slug: string;
  values: Record<string, string>;
  name: string;
  formCode: string;
  agency: string;
  created_at: number;
  expires_at: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { code: string } },
) {
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

  try {
    const pdfBytes = await generatePDF(form, entry.values);
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

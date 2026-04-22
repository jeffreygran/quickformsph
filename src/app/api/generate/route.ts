import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug, FORMS } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { isBlocked } from '@/lib/ip-blocklist';
import { sanitizeText, sanitizeSlug, isValidSlug } from '@/lib/sanitize';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted PDF generation');
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limit: 10 PDF generations / hour per IP
  const rl = checkRateLimit(ip, 'generate', { max: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'PDF generate rate limit exceeded');
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

  // Validate slug is a known form (prevents path traversal / enumeration)
  const knownSlugs = FORMS.map((f) => f.slug);
  if (!isValidSlug(slug, knownSlugs)) {
    return NextResponse.json({ error: `Form not found: ${slug}` }, { status: 404 });
  }

  // Sanitize all user-supplied field values
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawValues as Record<string, unknown>)) {
    values[sanitizeText(k, 100)] = sanitizeText(v, 500);
  }

  const form = getFormBySlug(slug);
  if (!form) {
    return NextResponse.json({ error: `Form not found: ${slug}` }, { status: 404 });
  }

  try {
    const pdfBytes = await generatePDF(form, values);

    const firstName = (values.first_name ?? '').trim();
    const lastName  = (values.last_name  ?? '').trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
    const safeName  = fullName.replace(/[^\w\s\-]/g, '').replace(/\s+/g, ' ').trim();
    const filename  = `${safeName} - ${form.agency} - ${form.code}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('[generate] PDF generation error:', err);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}

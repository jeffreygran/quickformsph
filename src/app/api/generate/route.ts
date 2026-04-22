import { NextRequest, NextResponse } from 'next/server';
import { getFormBySlug } from '@/data/forms';
import { generatePDF } from '@/lib/pdf-generator';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { slug, values } = body as { slug?: string; values?: Record<string, string> };

  if (!slug || !values) {
    return NextResponse.json({ error: 'Missing slug or values' }, { status: 400 });
  }

  const form = getFormBySlug(slug);
  if (!form) {
    return NextResponse.json({ error: `Form not found: ${slug}` }, { status: 404 });
  }

  try {
    const pdfBytes = await generatePDF(form, values);

    // Build filename: "JUAN DELA CRUZ - Pag-IBIG Fund HQP-PFF-356.pdf"
    const firstName = ((values as Record<string, string>).first_name ?? '').trim();
    const lastName  = ((values as Record<string, string>).last_name  ?? '').trim();
    const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'Applicant';
    // Sanitize: keep letters, digits, spaces, hyphens only
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

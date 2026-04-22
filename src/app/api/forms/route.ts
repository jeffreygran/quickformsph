import { NextResponse } from 'next/server';
import { FORMS } from '@/data/forms';

export async function GET() {
  const catalog = FORMS.map((f) => ({
    slug: f.slug,
    code: f.code,
    name: f.name,
    agency: f.agency,
    category: f.category,
    description: f.description,
    fieldCount: f.fields.length,
  }));
  return NextResponse.json(catalog);
}

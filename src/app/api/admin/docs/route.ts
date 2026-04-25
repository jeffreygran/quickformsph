import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import fs from 'fs';
import path from 'path';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-jwt-secret-32chars'
);

const DOCS_DIR = process.env.DOCS_DIR ?? '/home/skouzen/mcp-dashboard/docs/quickformsph';

// List of docs to expose in the dropdown (label → filename)
const DOC_MANIFEST: { label: string; file: string }[] = [
  { label: 'Field Data Dictionary',         file: 'QuickFormsPH-FieldDataDictionary.md' },
  { label: 'Architecture',                  file: 'ARCHITECTURE.md' },
  { label: 'Deployment',                    file: 'DEPLOYMENT.md' },
  { label: 'PDF Generation Learnings',      file: 'QuickFormsPH-PDFGenerationLearnings.md' },
  { label: 'Payment Screenshot Learnings',  file: 'QuickForms-PaymentScreenshotLearnings.md' },
  { label: 'New Form Guide',                file: 'QuickFormsPH-NewForm.md' },
  { label: 'Secure LocalStorage',           file: 'SECURE-LOCALSTORAGE.md' },
  { label: 'HA Strategy',                   file: 'HA-STRATEGY.md' },
  { label: 'Legal Compliance Checklist',    file: 'QuickFormsPH - Legal Compliance Check List.md' },
];

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('qfph_admin')?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

/** GET /api/admin/docs?file=QuickFormsPH-FieldDataDictionary.md */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file');

  // Return manifest when no file param
  if (!fileName) {
    return NextResponse.json({ docs: DOC_MANIFEST });
  }

  // Validate against manifest to prevent path traversal
  const allowed = DOC_MANIFEST.find((d) => d.file === fileName);
  if (!allowed) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Extra guard: ensure resolved path stays within DOCS_DIR
  const resolved = path.resolve(DOCS_DIR, fileName);
  if (!resolved.startsWith(path.resolve(DOCS_DIR) + path.sep) &&
      resolved !== path.resolve(DOCS_DIR)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const content = fs.readFileSync(resolved, 'utf-8');
    return NextResponse.json({ label: allowed.label, content });
  } catch {
    return NextResponse.json({ error: 'Could not read file' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir, readFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { isBlocked } from '@/lib/ip-blocklist';
import { isPdfBuffer, MAX_UPLOAD_BYTES } from '@/lib/sanitize';

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

const execFileAsync = promisify(execFile);

// OCR-based GCash payment screenshot verification using system tesseract binary
// Based on template GCashPayment-Template-Jeff.jpg:
//   Name:   JE••••Y JO•N G.   (masked with bullet dots)
//   Phone:  +63 917 551 4822
//   Amount: ₱5.00  (label: "Total Amount Sent")
//   Date:   e.g. "Apr 22, 2026 4:50 PM"  (variable)
//   Ref No: 0040 047 436595  (4-3-6 digit groups, 13 digits total, must be unique)

const USED_REFS_DIR = join(tmpdir(), 'qfph', 'used-refs');

async function isRefUsed(ref: string): Promise<boolean> {
  await mkdir(USED_REFS_DIR, { recursive: true });
  const refFile = join(USED_REFS_DIR, `${ref}.json`);
  try {
    await readFile(refFile);
    return true;
  } catch {
    return false;
  }
}

async function markRefUsed(ref: string): Promise<void> {
  await mkdir(USED_REFS_DIR, { recursive: true });
  const refFile = join(USED_REFS_DIR, `${ref}.json`);
  await writeFile(refFile, JSON.stringify({ ref, usedAt: new Date().toISOString() }), 'utf8');
}

const MONTH_MAP: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

function parseGCashDate(text: string): Date | null {
  // Pattern: "Apr 22, 2026 4:50 PM"
  const m = text.match(/([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)/i);
  if (!m) return null;
  const [, mon, day, year, hr12, min, ampm] = m;
  const monthNum = MONTH_MAP[mon.toLowerCase()];
  if (monthNum === undefined) return null;
  let hour = parseInt(hr12, 10);
  if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
  if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return new Date(parseInt(year), monthNum, parseInt(day), hour, parseInt(min));
}

function extractRefNo(text: string): string | null {
  // GCash Ref No. format: "Ref No. 0040 047 436595" (4-3-6 groups = 13 digits)
  // OCR may or may not preserve spaces within the number
  const m = text.match(/ref\s*no\.?\s+(\d[\d\s]{10,17}\d)/i);
  if (!m) return null;
  // Normalize: strip spaces to get raw 13-digit string
  return m[1].replace(/\s+/g, '');
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);

  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted screenshot verify');
    return NextResponse.json({ valid: false, errors: ['Access denied'] }, { status: 403 });
  }

  // Rate limit: 10 screenshot verifications / 5 min per IP
  const rl = checkRateLimit(ip, 'verify-screenshot', { max: 10, windowMs: 5 * 60 * 1000 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Screenshot verify rate limit exceeded');
    return NextResponse.json(
      { valid: false, errors: ['Too many requests. Please try again later.'] },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ valid: false, errors: ['Invalid request format'] }, { status: 400 });
  }

  const file = formData.get('screenshot') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json({ valid: false, errors: ['No screenshot file provided'] }, { status: 400 });
  }

  // Amount requested by the user (minimum ₱5 enforced client-side, double-checked here)
  const rawAmount = parseFloat((formData.get('amount') as string) ?? '5');
  const expectedAmount = isNaN(rawAmount) || rawAmount < 5 ? 5 : rawAmount;

  // File size guard
  if (file.size > MAX_UPLOAD_BYTES) {
    auditLog('upload_attempt', ip, `Screenshot too large: ${file.size} bytes`);
    return NextResponse.json({ valid: false, errors: ['Screenshot file too large (max 10MB)'] }, { status: 400 });
  }

  // MIME type validation: must be image, not PDF or other binary
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedMimes.includes(file.type)) {
    auditLog('upload_attempt', ip, `Invalid screenshot MIME type: ${file.type}`);
    return NextResponse.json({ valid: false, errors: ['Screenshot must be an image file (JPEG, PNG, or WebP)'] }, { status: 400 });
  }

  let text = '';
  const tmpIn = join(tmpdir(), `qfph-ocr-${randomUUID()}.png`);
  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extra guard: reject if magic bytes say it's a PDF
    if (isPdfBuffer(buffer)) {
      auditLog('upload_attempt', ip, 'Screenshot upload rejected: PDF magic bytes detected');
      return NextResponse.json({ valid: false, errors: ['Invalid file type. Please upload a real screenshot.'] }, { status: 400 });
    }

    await writeFile(tmpIn, buffer);
    const { stdout } = await execFileAsync('tesseract', [tmpIn, 'stdout', '-l', 'eng'], {
      timeout: 30_000,
    });
    text = stdout;
  } catch (err) {
    console.error('[verify-screenshot] OCR error:', err);
    return NextResponse.json(
      { valid: false, errors: ['Could not read the screenshot. Please upload a clearer image.'] },
      { status: 422 },
    );
  } finally {
    unlink(tmpIn).catch(() => {});
  }

  const errors: string[] = [];

  // ── 1. Mobile number ──────────────────────────────────────────────────────
  const phoneOk = /(?:\+63|0)\s*917[\s.-]*551[\s.-]*4822/.test(text);
  if (!phoneOk) {
    errors.push('Mobile number does not match (expected: +63 917 551 4822)');
  }

  // ── 2. Amount — must be >= expectedAmount ─────────────────────────────────
  // OCR may render ₱ as P, £, or omit it. Accept integer or decimal form.
  const amountMatch = text.match(/(?:[₱P£]\s*)(\d+(?:\.\d+)?)/);
  const ocrAmount = amountMatch ? parseFloat(amountMatch[1]) : null;
  if (ocrAmount === null) {
    errors.push('Amount not found in screenshot');
  } else if (ocrAmount < expectedAmount) {
    errors.push(`Amount ₱${ocrAmount.toFixed(2)} is less than the required ₱${expectedAmount.toFixed(2)}`);
  }

  // ── 3. Ref No. — present and not previously used ──────────────────────────
  const refNo = extractRefNo(text);
  if (!refNo) {
    errors.push('Reference number (Ref No.) not found in screenshot');
  } else {
    const alreadyUsed = await isRefUsed(refNo);
    if (alreadyUsed) {
      errors.push(`Reference number ${refNo} has already been used for a previous payment`);
    }
  }

  // Mark ref as used only when all checks pass
  if (errors.length === 0 && refNo) {
    await markRefUsed(refNo);
  }

  return NextResponse.json({ valid: errors.length === 0, errors });
}


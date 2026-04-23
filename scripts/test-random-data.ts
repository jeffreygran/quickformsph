#!/usr/bin/env tsx
/**
 * Random-Data Smoke Test — QA regression gate for every form in FORMS[].
 *
 * Runs in two modes:
 *   1. In-process (default): imports `generatePDF` directly, no server needed.
 *      Fastest and most reliable for CI.
 *   2. HTTP mode (--http): posts to a running dev server at $BASE_URL
 *      (default http://localhost:3400). Use this to smoke-test the live API
 *      including rate limiting, middleware, etc.
 *
 * Usage:
 *   npx tsx scripts/test-random-data.ts             # in-process
 *   npx tsx scripts/test-random-data.ts --http      # hit live API
 *   BASE_URL=http://localhost:3400 npx tsx scripts/test-random-data.ts --http
 *
 * Exit code 0 = all forms pass, non-zero = one or more failures.
 */

import { FORMS } from '../src/data/forms';
import type { FormSchema, FormField } from '../src/data/forms';

// ─── Deterministic RNG so CI runs are reproducible ──────────────────────────
let rngState = 0x12345678;
function rand(): number {
  rngState = (rngState * 1103515245 + 12345) & 0x7fffffff;
  return rngState / 0x7fffffff;
}
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(rand() * arr.length)]; }
function randInt(lo: number, hi: number): number { return lo + Math.floor(rand() * (hi - lo + 1)); }
function digits(n: number): string { return Array.from({ length: n }, () => randInt(0, 9)).join(''); }

const FIRSTS = ['JUAN', 'MARIA', 'JOSE', 'CARMEN', 'ANGELO', 'SOFIA', 'LUIS'];
const LASTS  = ['DELA CRUZ', 'SANTOS', 'REYES', 'GARCIA', 'MENDOZA', 'BAUTISTA'];
const MIDS   = ['REYES', 'TORRES', 'LIM', 'CHUA', 'VILLANUEVA'];
const STREETS = ['EDSA', 'Taft Ave', 'Ayala Ave', 'C5 Rd', 'Roxas Blvd'];
const CITIES  = ['Makati', 'Quezon City', 'Mandaluyong', 'Taguig', 'Pasig'];
const BRGYS   = ['Poblacion', 'San Antonio', 'BGC', 'Wack-Wack'];
const PROVS   = ['Metro Manila', 'Cebu', 'Laguna', 'Cavite'];

// ─── Value generator ────────────────────────────────────────────────────────
function generateValue(field: FormField, ctx: Record<string, string>): string {
  const id = field.id;
  const label = (field.label || '').toLowerCase();
  const ph = field.placeholder || '';
  const type = field.type;
  const opts = (field as any).options as string[] | undefined;

  // Dropdown — skip N/A when real options exist
  if (opts && opts.length) {
    const real = opts.filter(o => o && o.toUpperCase() !== 'N/A');
    return real.length ? pick(real) : opts[0];
  }

  // Date-ish
  const dateLike = /date|dob|birth/i.test(id) && !/place/i.test(id);
  if (dateLike || /mm\/dd/.test(ph)) {
    return `${String(randInt(1, 12)).padStart(2, '0')}/${String(randInt(1, 28)).padStart(2, '0')}/${randInt(1970, 2005)}`;
  }

  if (/last.*name/i.test(id)) return ctx.ln;
  if (/first.*name/i.test(id)) return ctx.fn;
  if (/middle.*name/i.test(id)) return ctx.mn;
  if (/ext|suffix/i.test(id)) return 'Jr.';
  if (/mother/i.test(id)) return `MARIA ${pick(LASTS)}`;
  if (/spouse.*name/i.test(id)) return `${pick(FIRSTS)} ${pick(LASTS)}`;
  if (/father/i.test(id)) return `${pick(FIRSTS)} ${ctx.ln}`;
  if (/email/i.test(id)) return ctx.email;
  if (type === 'tel' || /cell|mobile|phone/i.test(id)) return '0917' + digits(7);
  if (/^tin$|_tin/i.test(id)) return `${digits(3)}-${digits(3)}-${digits(3)}-000`;
  if (/mid.*no|mid_no/i.test(id)) return `${digits(4)}-${digits(4)}-${digits(4)}`;
  if (/pin|philhealth/i.test(id)) return digits(12);
  if (/sss|gsis/i.test(id)) return `${digits(2)}-${digits(7)}-${digits(1)}`;
  if (/zip|postal/i.test(id)) return digits(4);
  if (/amount|salary|income/i.test(id) || (/loan/i.test(id) && /desired|requested/i.test(id))) {
    return String(randInt(10_000, 2_000_000));
  }
  if (/occupation|profession/i.test(id)) return 'Software Engineer';
  if (/employer.*name|business.*name/i.test(id)) return ctx.employer;
  if (/position|department|dept/i.test(id)) return 'Senior Engineer / IT';
  if (/years|duration/i.test(id)) return String(randInt(1, 30));
  if (/citizen|nationality/i.test(id)) return 'Filipino';
  if (/religion/i.test(id)) return 'Roman Catholic';
  if (/sex|gender/i.test(id)) return 'Male';
  if (/civil|marital/i.test(id)) return 'Single';
  if (/unit|house|bldg|building|address_line/i.test(id)) {
    return `Unit ${randInt(1, 50)}-${pick(['A', 'B', 'C', 'D'])} ${pick(['Skyline', 'Horizon', 'Grand'])} Tower`;
  }
  if (/street/i.test(id)) return pick(STREETS);
  if (/subdivision/i.test(id)) return pick(['Ortigas', 'Loyola Grand Villas', 'BF Homes']);
  if (/barangay/i.test(id)) return pick(BRGYS);
  if (/city|municipality/i.test(id)) return pick(CITIES);
  if (/province|state/i.test(id)) return pick(PROVS);
  if (/country/i.test(id)) return 'Philippines';
  if (/height/i.test(id)) return String(randInt(150, 190));
  if (/weight/i.test(id)) return String(randInt(45, 100));
  if (/age/i.test(id)) return String(randInt(18, 65));
  if (/place.*birth/i.test(id)) return pick(CITIES);
  if (/diagnos|illness|condition/i.test(id)) return 'Hypertension';
  if (/hospital|hci.*name/i.test(id)) return 'Philippine General Hospital';
  if (/accred/i.test(id)) return digits(9);
  if (/license|prc/i.test(id)) return digits(7);
  if (/member.*type|membership/i.test(id)) return 'Employed Private';

  // Apply maxLength clamp if specified
  const fallback = 'Sample Value';
  const ml = field.maxLength;
  return ml && ml < fallback.length ? fallback.slice(0, ml) : fallback;
}

function buildPayload(form: FormSchema): Record<string, string> {
  const ctx = {
    fn: pick(FIRSTS),
    ln: pick(LASTS),
    mn: pick(MIDS),
    employer: 'Acme Corporation Philippines Inc.',
    email: '',
  };
  ctx.email = `${ctx.fn.toLowerCase().split(' ')[0]}@example.com`;
  const values: Record<string, string> = {};
  for (const field of form.fields) values[field.id] = generateValue(field, ctx);
  return values;
}

// ─── Assertions ─────────────────────────────────────────────────────────────
type Result = { slug: string; pass: boolean; bytes: number; error?: string };

function assertPdf(slug: string, buf: Uint8Array): Result {
  if (buf.length < 1024) return { slug, pass: false, bytes: buf.length, error: `too small (${buf.length}B)` };
  const head = new TextDecoder().decode(buf.slice(0, 5));
  if (head !== '%PDF-') return { slug, pass: false, bytes: buf.length, error: `magic=${JSON.stringify(head)}` };
  return { slug, pass: true, bytes: buf.length };
}

// ─── In-process mode ────────────────────────────────────────────────────────
async function runInProcess(form: FormSchema): Promise<Result> {
  try {
    const mod = await import('../src/lib/pdf-generator');
    const values = buildPayload(form);
    const buf = await mod.generatePDF(form, values);
    return assertPdf(form.slug, buf);
  } catch (e) {
    return { slug: form.slug, pass: false, bytes: 0, error: (e as Error).message };
  }
}

// ─── HTTP mode ──────────────────────────────────────────────────────────────
async function runHttp(form: FormSchema, baseUrl: string): Promise<Result> {
  const values = buildPayload(form);
  const ip = `10.${randInt(1, 250)}.${randInt(1, 250)}.${randInt(1, 250)}`;
  try {
    const res = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': ip,
      },
      body: JSON.stringify({ slug: form.slug, values }),
    });
    if (!res.ok) {
      const txt = (await res.text()).slice(0, 200);
      return { slug: form.slug, pass: false, bytes: 0, error: `HTTP ${res.status}: ${txt}` };
    }
    const buf = new Uint8Array(await res.arrayBuffer());
    return assertPdf(form.slug, buf);
  } catch (e) {
    return { slug: form.slug, pass: false, bytes: 0, error: (e as Error).message };
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  const useHttp = process.argv.includes('--http');
  const baseUrl = process.env.BASE_URL || 'http://localhost:3400';

  console.log(`\n  Random-Data Smoke Test — ${FORMS.length} forms (mode: ${useHttp ? `HTTP ${baseUrl}` : 'in-process'})\n`);

  const results: Result[] = [];
  for (const form of FORMS) {
    const r = useHttp ? await runHttp(form, baseUrl) : await runInProcess(form);
    results.push(r);
    const icon = r.pass ? '✓' : '✗';
    const detail = r.pass ? `${r.bytes} bytes` : r.error;
    console.log(`  ${icon} ${form.slug.padEnd(38)} ${detail}`);
    // Rate-limit friendly in HTTP mode
    if (useHttp) await new Promise(r => setTimeout(r, 1200));
  }

  const fail = results.filter(r => !r.pass);
  console.log(`\n  ${results.length - fail.length}/${results.length} passed`);

  if (fail.length) {
    console.error(`\n  FAILURES:`);
    for (const f of fail) console.error(`    ${f.slug}: ${f.error}`);
    process.exit(1);
  }
  console.log('  ALL SMOKE TESTS PASSED.\n');
}

main().catch(e => { console.error(e); process.exit(1); });

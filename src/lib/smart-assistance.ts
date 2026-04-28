// Smart Assistance — site-wide utilities.
// All functions are PURE and run OFFLINE (no fetch, no API).
// New forms can opt-in by setting field.mask, field.optionHints,
// field.mirrorFrom, and form.smartAssistance — see FormField/FormSchema.

export type FieldMask = 'mid' | 'tin' | 'date' | 'time' | 'currency' | 'mobile' | 'zip' | 'pin' | 'psn' | 'pen' | 'landline' | 'phPhone' | 'hciPan' | 'hcpPan';

export function applyMask(mask: FieldMask, raw: string): string {
  switch (mask) {
    case 'mid':      return maskMid(raw);
    case 'tin':      return maskTin(raw);
    case 'date':     return maskDate(raw);
    case 'time':     return maskTime(raw);
    case 'currency': return maskCurrency(raw);
    case 'mobile':   return maskMobile(raw);
    case 'zip':      return maskZip(raw);
    case 'pin':      return maskPin(raw);
    case 'psn':      return maskPsn(raw);
    case 'pen':      return maskPen(raw);
    case 'landline': return maskLandline(raw);
    case 'phPhone':  return maskPhPhone(raw);
    case 'hciPan':   return maskHciPan(raw);
    case 'hcpPan':   return maskHcpPan(raw);
    default:         return raw;
  }
}

// ── Pag-IBIG MID No. → XXXX-XXXX-XXXX (12 digits) ──────────────────────────
function maskMid(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

// ── BIR TIN → XXX-XXX-XXX-XXX (12 digits) ──────────────────────────────────
function maskTin(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 9)}-${d.slice(9)}`;
}

// ── PhilHealth PIN → XX-XXXXXXXXX-X (12 digits) ────────────────────────────
function maskPin(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 2) return d;
  if (d.length <= 11) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 11)}-${d.slice(11)}`;
}

// ── PhilHealth PEN (Employer No.) → XX-XXXXXXXXX-X (12 digits, member-PIN-like) ─
function maskPen(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 2) return d;
  if (d.length <= 11) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 11)}-${d.slice(11)}`;
}

// ── PhilSys PCN → XXXX-XXXX-XXXX (12 digits) ───────────────────────────────
function maskPsn(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 12);
  if (d.length <= 4) return d;
  if (d.length <= 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 8)}-${d.slice(8)}`;
}

// ── Date → mm / dd / yyyy (site-wide rule) ─────────────────────────────────
function maskDate(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)} / ${d.slice(2)}`;
  return `${d.slice(0, 2)} / ${d.slice(2, 4)} / ${d.slice(4)}`;
}

// ── Time → hh : mm AM/PM (12-hour clock) ───────────────────────────────────
// Accepts trailing 'a' / 'p' (case-insensitive) to set AM / PM. Used by
// CF-2 admit/discharge/expired times. Splits into _hour/_min/_ampm at
// PDF write-time via expandCombinedTimes().
function maskTime(raw: string): string {
  const m = raw.match(/^(\d{0,4})\s*([apAP])?[mM]?/);
  const digits = (m ? m[1] : '').replace(/\D/g, '').slice(0, 4);
  const ap = m && m[2] ? m[2].toUpperCase() : '';
  if (digits.length === 0) return ap ? ap + 'M' : '';
  if (digits.length <= 2) return digits + (ap ? ' ' + ap + 'M' : '');
  return `${digits.slice(0, 2)} : ${digits.slice(2, 4)}` + (ap ? ' ' + ap + 'M' : '');
}

// ── PhilHealth HCI Accreditation No. → HCI-NN-NNNNNN (8 digits) ────────────
function maskHciPan(raw: string): string {
  const cleaned = raw.replace(/[^0-9A-Za-z]/g, '').replace(/^HCI/i, '');
  const d = cleaned.replace(/\D/g, '').slice(0, 8);
  if (d.length === 0) return '';
  if (d.length <= 2) return `HCI-${d}`;
  return `HCI-${d.slice(0, 2)}-${d.slice(2)}`;
}

// ── PhilHealth HCP Accreditation No. → HCP-NN-NNNNNN (8 digits) ────────────
function maskHcpPan(raw: string): string {
  const cleaned = raw.replace(/[^0-9A-Za-z]/g, '').replace(/^HCP/i, '');
  const d = cleaned.replace(/\D/g, '').slice(0, 8);
  if (d.length === 0) return '';
  if (d.length <= 2) return `HCP-${d}`;
  return `HCP-${d.slice(0, 2)}-${d.slice(2)}`;
}

// ── Currency → comma thousands, integer only ───────────────────────────────
function maskCurrency(raw: string): string {
  const d = raw.replace(/\D/g, '');
  return d ? Number(d).toLocaleString('en-PH') : '';
}

// ── PH mobile → 09XX XXX XXXX (11 digits) ──────────────────────────────────
function maskMobile(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
}

// ── PH ZIP → 4 digits ──────────────────────────────────────────────────────
function maskZip(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4);
}

// ── PH phone (combined mobile/landline) ─────────────────────────────────────
// Auto-detects intent from leading digits AFTER stripping +63 / leading 0:
//   • starts with '9' AND ≥10d → mobile  → '+63 9XX XXX XXXX'
//   • otherwise (≥6d)            → landline → '(NN) NNNN-NNNN'
// Used by PMRF-FN `contact_phone` and any future single "contact number"
// field that must accept either type. Cascade pattern (L-SMART-PMRF-FN-01).
function maskPhPhone(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('63')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  // Mobile path — leading 9 with a sane length.
  if (d.startsWith('9') && d.length >= 4) {
    d = d.slice(0, 10);
    if (d.length <= 3) return `+63 ${d}`;
    if (d.length <= 6) return `+63 ${d.slice(0, 3)} ${d.slice(3)}`;
    return `+63 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`;
  }
  // Landline path — anything else, up to 10 digits.
  d = d.slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

// ── PH landline → (NN) NNNN-NNNN  (2-digit area code + 8-digit number) ────
// Tolerates 6 to 11 digits; partial input formats incrementally as the user
// types so it never feels "stuck". Used by CF-1 contact_landline,
// employer_contact, and any future landline field site-wide.
function maskLandline(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

// ─── Date helpers ─────────────────────────────────────────────────────────
export function parseMaskedDate(s: string): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{2}) \/ (\d{2}) \/ (\d{4})$/);
  if (!m) return null;
  const d = new Date(+m[3], +m[1] - 1, +m[2]);
  return isNaN(d.getTime()) ? null : d;
}

// Parse a masked time "HH : MM AM/PM" → { hour, min, ampm } or null when invalid.
export function parseMaskedTime(s: string): { hour: string; min: string; ampm: 'AM' | 'PM' } | null {
  if (!s) return null;
  const m = s.match(/^\s*(\d{1,2})\s*:\s*(\d{2})\s+(AM|PM)\s*$/i);
  if (!m) return null;
  const hh = m[1].padStart(2, '0');
  return { hour: hh, min: m[2], ampm: m[3].toUpperCase() as 'AM' | 'PM' };
}

export function ageFrom(dob: Date, ref: Date = new Date()): number {
  let age = ref.getFullYear() - dob.getFullYear();
  const beforeBirthday =
    ref.getMonth() < dob.getMonth() ||
    (ref.getMonth() === dob.getMonth() && ref.getDate() < dob.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

// Days between two dates (b - a), floor.
export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

// Days elapsed since a date (today - date). Negative if the date is future.
export function daysSince(d: Date, ref: Date = new Date()): number {
  return daysBetween(d, ref);
}

// ─── Amortization (offline calculator) ─────────────────────────────────────
// Standard amortizing-loan formula:  M = P · r / (1 − (1 + r)^−n)
// rate = annual decimal (e.g. 0.055 for 5.5%); months = total term in months.
export function amortize(
  principal: number,
  annualRate: number,
  months: number,
): { monthly: number; totalInterest: number; totalRepayment: number } | null {
  if (!principal || !months || annualRate <= 0) return null;
  const r = annualRate / 12;
  const monthly = (principal * r) / (1 - Math.pow(1 + r, -months));
  const totalRepayment = monthly * months;
  const totalInterest = totalRepayment - principal;
  return { monthly, totalInterest, totalRepayment };
}

export function fmtPHP(n: number): string {
  return '₱' + n.toLocaleString('en-PH', { maximumFractionDigits: 0 });
}

// ─── PhilHealth premium calculator (offline) ───────────────────────────────
// Computes monthly premium under the UHC schedule:
//   premium = clamp(monthlyIncome, floor, ceiling) * rate
// Defaults: rate=0.05 (2024-onwards), floor=10000, ceiling=100000.
// `share` returns the breakdown for Employed (50/50 with employer).
export interface PhilHealthPremium {
  monthly: number;
  memberShare: number;
  employerShare: number;
  rate: number;
  basis: number;            // capped income used as basis
}
export function philhealthPremium(
  monthlyIncome: number,
  opts?: { rate?: number; floor?: number; ceiling?: number; employed?: boolean }
): PhilHealthPremium | null {
  const rate    = opts?.rate    ?? 0.05;
  const floor   = opts?.floor   ?? 10000;
  const ceiling = opts?.ceiling ?? 100000;
  const employed = opts?.employed ?? true;
  if (!monthlyIncome || monthlyIncome <= 0) return null;
  const basis = Math.min(Math.max(monthlyIncome, floor), ceiling);
  const monthly = basis * rate;
  const memberShare   = employed ? monthly / 2 : monthly;
  const employerShare = employed ? monthly / 2 : 0;
  return { monthly, memberShare, employerShare, rate, basis };
}

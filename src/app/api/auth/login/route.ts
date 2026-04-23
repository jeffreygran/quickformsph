import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { checkRateLimit, recordFailedLogin, clearLoginLockout } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { blockIP, isBlocked } from '@/lib/ip-blocklist';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'skouzen';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'QuickForms@2026!';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-jwt-secret-32chars'
);

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);

  // IP blocklist check
  if (isBlocked(ip)) {
    auditLog('request_blocked', ip, 'Blocked IP attempted login');
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  // Rate limit: 10 attempts / 15 min
  const rl = checkRateLimit(ip, 'login', { max: 10, windowMs: 15 * 60 * 1000, maxFails: 5 });
  if (!rl.allowed) {
    auditLog('rate_limit_hit', ip, 'Login rate limit exceeded');
    const retryAfterSec = Math.ceil((rl.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: rl.lockedUntil ? 'Too many failed attempts. Try again later.' : 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    const lockoutResult = recordFailedLogin(ip);
    if (lockoutResult.locked) {
      auditLog('login_lockout', ip, `Account locked after repeated failures (user: ${username ?? '?'})`);
      // Auto-block IP after 3 lockout episodes in an hour
      if ((lockoutResult.lockoutHitCount ?? 0) >= 3) {
        blockIP(ip, 'Auto-blocked: 3 login lockout episodes within 1 hour', 'auto');
        auditLog('ip_blocked', ip, 'Auto-blocked: 3 login lockout episodes');
      }
    } else {
      auditLog('login_fail', ip, `Failed login attempt (user: ${username ?? '?'})`);
    }
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  clearLoginLockout(ip);
  auditLog('login_success', ip, `Admin login successful (user: ${username})`);

  const token = await new SignJWT({ sub: username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('qfph_admin', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });
  return response;
}

export async function DELETE(req: NextRequest) {
  const ip = getIP(req);
  auditLog('logout', ip, 'Admin logout');
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('qfph_admin');
  return response;
}

/** GET /api/auth/login — verify current session */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('qfph_admin')?.value;
  if (!token) return NextResponse.json({ authenticated: false }, { status: 401 });
  try {
    const { jwtVerify } = await import('jose');
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}

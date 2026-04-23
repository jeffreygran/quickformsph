import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { checkRateLimit, recordFailedLogin, clearLoginLockout } from '@/lib/rate-limit';
import { auditLog } from '@/lib/audit-log';
import { blockIP, isBlocked } from '@/lib/ip-blocklist';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'skouzen';
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD ?? 'QuickForms@2026!';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-jwt-secret-32chars'
);

// ── Password override file (survives restarts, takes precedence over env var) ─
const DATA_DIR = process.env.DATA_DIR ?? path.join(os.tmpdir(), 'qfph');
const PW_FILE  = path.join(DATA_DIR, 'admin-password.json');

function getStoredPassword(): string {
  try {
    if (fs.existsSync(PW_FILE)) {
      const { hash, salt } = JSON.parse(fs.readFileSync(PW_FILE, 'utf-8')) as { hash: string; salt: string };
      return JSON.stringify({ hash, salt }); // sentinel: return the whole object as string
    }
  } catch { /* fall through */ }
  return DEFAULT_PASSWORD;
}

function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

function verifyPassword(input: string): boolean {
  try {
    if (fs.existsSync(PW_FILE)) {
      const { hash, salt } = JSON.parse(fs.readFileSync(PW_FILE, 'utf-8')) as { hash: string; salt: string };
      return crypto.timingSafeEqual(
        Buffer.from(hashPassword(input, salt), 'hex'),
        Buffer.from(hash, 'hex'),
      );
    }
  } catch { /* fall through */ }
  // No override file — compare against env var
  return input === DEFAULT_PASSWORD;
}

function savePassword(newPassword: string): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = hashPassword(newPassword, salt);
  fs.writeFileSync(PW_FILE, JSON.stringify({ hash, salt }, null, 2), 'utf-8');
}

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
    auditLog('request_blocked', ip, 'Blocked IP attempted login');
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

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

  if (username !== ADMIN_USERNAME || !password || !verifyPassword(password)) {
    const lockoutResult = recordFailedLogin(ip);
    if (lockoutResult.locked) {
      auditLog('login_lockout', ip, `Account locked after repeated failures (user: ${username ?? '?'})`);
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
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    path: '/',
    maxAge: 30 * 24 * 60 * 60,
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

/** PUT /api/auth/login — change admin password (admin only) */
export async function PUT(req: NextRequest) {
  const token = req.cookies.get('qfph_admin')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { jwtVerify } = await import('jose');
    await jwtVerify(token, JWT_SECRET);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as {
    currentPassword?: string;
    newPassword?: string;
  };

  const { currentPassword, newPassword } = body;
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  if (!verifyPassword(currentPassword)) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }

  savePassword(newPassword);
  const ip = getIP(req);
  auditLog('password_changed', ip, 'Admin password changed');

  return NextResponse.json({ ok: true });
}


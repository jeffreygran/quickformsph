import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'skouzen';
const ADMIN_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD ?? 'QuickForms@2026!';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'change-me-in-production-jwt-secret-32chars'
);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await new SignJWT({ sub: username, role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(JWT_SECRET);

  const response = NextResponse.json({ ok: true });
  response.cookies.set('qfph_admin', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 8 * 60 * 60,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('qfph_admin');
  return response;
}

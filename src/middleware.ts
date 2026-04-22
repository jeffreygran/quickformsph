/**
 * Next.js Middleware — Edge Runtime (no Node.js built-ins allowed).
 * Only lightweight checks here; IP blocklist is enforced in API route handlers
 * (Node.js runtime) since they have access to fs.
 */
import { NextRequest, NextResponse } from 'next/server';

export function middleware(_req: NextRequest) {
  // Pass through — security checks (rate limit, IP block) happen in route handlers.
  // Security response headers are set globally via next.config.js headers().
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/mc/:path*', '/forms/:path*'],
};


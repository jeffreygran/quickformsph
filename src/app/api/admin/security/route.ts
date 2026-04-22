/**
 * GET  /api/admin/security — stats, blocklist, audit log
 * POST /api/admin/security — block an IP
 * DELETE /api/admin/security — unblock an IP
 */
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getBlockList, blockIP, unblockIP, getBlockedIPCount } from '@/lib/ip-blocklist';
import { getRecentEvents, getSecurityStats } from '@/lib/audit-log';
import { auditLog } from '@/lib/audit-log';

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

/** GET /api/admin/security */
export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stats = getSecurityStats();
  const blocklist = getBlockList();
  const events = getRecentEvents(200);

  return NextResponse.json({
    stats: {
      blockedIPCount: getBlockedIPCount(),
      rateLimitHits24h: stats.rateLimitHits24h,
      failedLogins24h: stats.failedLogins24h,
      lastEventTs: stats.lastEventTs,
    },
    blocklist,
    events,
  });
}

/** POST /api/admin/security — manually block an IP */
export async function POST(req: NextRequest) {
  const adminIP = getIP(req);
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { ip?: string; reason?: string };
  const ip = (body.ip ?? '').trim();
  const reason = (body.reason ?? 'Manual block by admin').trim().slice(0, 200);

  // Basic IPv4/IPv6 pattern validation
  if (!ip || !/^[\d.:a-fA-F]+$/.test(ip) || ip.length > 45) {
    return NextResponse.json({ error: 'Invalid IP address' }, { status: 400 });
  }

  blockIP(ip, reason, 'manual');
  auditLog('ip_blocked', ip, `Manual block by admin from ${adminIP}: ${reason}`);

  return NextResponse.json({ ok: true });
}

/** DELETE /api/admin/security — unblock an IP */
export async function DELETE(req: NextRequest) {
  const adminIP = getIP(req);
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({})) as { ip?: string };
  const ip = (body.ip ?? '').trim();

  if (!ip) {
    return NextResponse.json({ error: 'IP is required' }, { status: 400 });
  }

  const removed = unblockIP(ip);
  if (removed) {
    auditLog('ip_unblocked', ip, `Unblocked by admin from ${adminIP}`);
  }

  return NextResponse.json({ ok: true, removed });
}

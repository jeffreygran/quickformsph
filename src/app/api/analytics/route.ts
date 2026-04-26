/**
 * POST /api/analytics
 *
 * Fire-and-forget analytics beacon endpoint.
 * Accepts JSON body: { event_type, slug, session_id }
 *
 * - IP is SHA-256 hashed with a daily salt (never stored raw)
 * - Returns 204 always (even on bad input) so the client never blocks
 * - Designed to be called via navigator.sendBeacon() — zero UX impact
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { insertAnalyticsEvent, type AnalyticsEventType } from '@/lib/db';
import { isBlocked } from '@/lib/ip-blocklist';

const VALID_EVENTS = new Set<AnalyticsEventType>(['form_view', 'demo_click', 'payment_success']);
const SLUG_RE = /^[a-z0-9-]{1,80}$/;

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '0.0.0.0'
  );
}

/** Hash IP with a daily salt so it can't be reversed but deduplication works within a day. */
function hashIP(ip: string): string {
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return createHash('sha256').update(`${ip}::${day}`).digest('hex').slice(0, 16);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const ip = getIP(req);
    if (isBlocked(ip)) return new NextResponse(null, { status: 204 });

    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    const event_type = body.event_type as string;
    const slug       = typeof body.slug === 'string' ? body.slug.trim() : '';
    const session_id = typeof body.session_id === 'string' ? body.session_id.slice(0, 64) : '';

    if (!VALID_EVENTS.has(event_type as AnalyticsEventType)) {
      return new NextResponse(null, { status: 204 });
    }
    // slug can be empty for aggregated events (e.g. payment_success fired server-side)
    if (slug && !SLUG_RE.test(slug)) {
      return new NextResponse(null, { status: 204 });
    }

    insertAnalyticsEvent({
      event_type: event_type as AnalyticsEventType,
      slug,
      session_id,
      ip_hash: hashIP(ip),
      created_at: Date.now(),
    });
  } catch {
    // Swallow all errors — telemetry must never impact main flow
  }

  return new NextResponse(null, { status: 204 });
}

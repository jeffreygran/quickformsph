/**
 * src/lib/ai-rate-limit.ts (server-only)
 *
 * Lightweight in-memory token-bucket limiter for the Kuya Quim chat endpoint.
 * Limits per IP:
 *   - 30 requests per rolling 60 seconds
 *   - 200 requests per rolling 3600 seconds
 *
 * State resets when the Next.js process restarts (acceptable for a single-node
 * deployment). For multi-node, swap for Redis later.
 */

import 'server-only';

interface Bucket {
  minuteHits: number[];  // ms timestamps within last 60s
  hourHits: number[];    // ms timestamps within last 3600s
}

const STATE = new Map<string, Bucket>();
const MIN_WINDOW = 60_000;
const HOUR_WINDOW = 3_600_000;
const MIN_LIMIT = 30;
const HOUR_LIMIT = 200;

export interface RateLimitResult {
  ok: boolean;
  retryAfterSec?: number;
  reason?: 'minute' | 'hour';
}

export function checkRateLimit(ip: string): RateLimitResult {
  const now = Date.now();
  let bucket = STATE.get(ip);
  if (!bucket) {
    bucket = { minuteHits: [], hourHits: [] };
    STATE.set(ip, bucket);
  }
  bucket.minuteHits = bucket.minuteHits.filter((t) => now - t < MIN_WINDOW);
  bucket.hourHits = bucket.hourHits.filter((t) => now - t < HOUR_WINDOW);

  if (bucket.minuteHits.length >= MIN_LIMIT) {
    const oldest = bucket.minuteHits[0];
    return { ok: false, retryAfterSec: Math.ceil((MIN_WINDOW - (now - oldest)) / 1000), reason: 'minute' };
  }
  if (bucket.hourHits.length >= HOUR_LIMIT) {
    const oldest = bucket.hourHits[0];
    return { ok: false, retryAfterSec: Math.ceil((HOUR_WINDOW - (now - oldest)) / 1000), reason: 'hour' };
  }

  bucket.minuteHits.push(now);
  bucket.hourHits.push(now);
  return { ok: true };
}

/** Periodic GC so the Map doesn't grow unbounded. */
function gc() {
  const now = Date.now();
  STATE.forEach((b, ip) => {
    if (b.hourHits.length === 0 || now - b.hourHits[b.hourHits.length - 1] > HOUR_WINDOW) {
      STATE.delete(ip);
    }
  });
}
if (typeof setInterval !== 'undefined') {
  // Don't keep the event loop alive just for GC.
  const t = setInterval(gc, 5 * 60_000);
  if (typeof t === 'object' && t && 'unref' in t) (t as { unref: () => void }).unref();
}

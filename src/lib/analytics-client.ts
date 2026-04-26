/**
 * src/lib/analytics-client.ts
 *
 * Fire-and-forget analytics beacon for client-side use.
 * Uses navigator.sendBeacon when available, falls back to fetch keepalive.
 * Never throws — telemetry must never break user flow.
 */

import type { AnalyticsEventType } from './db';

/** Get or create an anonymous session ID (resets per browser tab session). */
function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return '';
  let id = sessionStorage.getItem('qfph_sid');
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    sessionStorage.setItem('qfph_sid', id);
  }
  return id;
}

export function trackEvent(event_type: AnalyticsEventType, slug = ''): void {
  try {
    const payload = JSON.stringify({ event_type, slug, session_id: getSessionId() });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/analytics', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // swallow
  }
}

/**
 * Local Mode (v2.0) helpers.
 *
 * Coordinates the service worker registration, form template pre-cache, and
 * the per-form "ready" state used by the LocalModeOverlay component.
 */

export type LocalModeStep = 'engine' | 'template' | 'verify';
export type LocalModeStatus = 'pending' | 'in-progress' | 'done' | 'error';
export type LocalModeProgress = Record<LocalModeStep, LocalModeStatus>;

export const INITIAL_PROGRESS: LocalModeProgress = {
  engine: 'pending',
  template: 'pending',
  verify: 'pending',
};

const READY_KEY_PREFIX = 'qfph_local_ready_';
const PRIVACY_ACK_KEY = 'qfph_local_privacy_ack';

export function isLocalModeReady(slug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(READY_KEY_PREFIX + slug) === '1';
  } catch {
    return false;
  }
}

export function markLocalModeReady(slug: string): void {
  try {
    localStorage.setItem(READY_KEY_PREFIX + slug, '1');
  } catch {
    /* ignore */
  }
}

export function hasPrivacyAck(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(PRIVACY_ACK_KEY) === '1';
  } catch {
    return false;
  }
}

export function setPrivacyAck(): void {
  try {
    localStorage.setItem(PRIVACY_ACK_KEY, '1');
  } catch {
    /* ignore */
  }
}

/** Register the service worker if supported. Returns the registration or null. */
export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const reg =
      (await navigator.serviceWorker.getRegistration('/sw.js')) ??
      (await navigator.serviceWorker.register('/sw.js', { scope: '/' }));
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn('[local-mode] SW registration failed:', err);
    return null;
  }
}

/** Pre-cache a specific form template PDF via the service worker. */
export async function precacheFormTemplate(pdfPath: string): Promise<boolean> {
  const url = `/forms/${pdfPath}`;

  // Directly write into the Cache API so it's available offline regardless
  // of whether the SW is controlling the page yet.
  try {
    const cacheVersion = 'qfph-v2-3';
    const cache = await caches.open('qfph-forms-' + cacheVersion);
    const existing = await cache.match(url);
    if (!existing) {
      const res = await fetch(url);
      if (!res.ok) return false;
      await cache.put(url, res.clone());
      await res.arrayBuffer(); // drain
    }
  } catch {
    // caches API may not be available (e.g. insecure context); fall through to SW path
    try {
      const res = await fetch(url);
      if (!res.ok) return false;
      await res.arrayBuffer();
    } catch {
      return false;
    }
  }

  // Also send an explicit message so the SW pre-caches even if the fetch
  // bypassed it (e.g. very first registration race).
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'PRECACHE_FORM', url });
  }
  return true;
}

/**
 * Fetch a form template's bytes from cache (or network if not cached yet).
 * Used by the browser-side PDF generator in Local Mode.
 *
 * Strategy:
 *   1. Try Cache API directly (works offline, no SW needed).
 *   2. Try fetch with cache: 'force-cache' (let SW/browser cache serve it).
 *   3. Fall back to network with 15s timeout.
 */
export async function fetchFormTemplateBytes(pdfPath: string): Promise<Uint8Array> {
  const url = `/forms/${pdfPath}`;

  // 1. Direct Cache API lookup — fastest and works fully offline.
  try {
    const cacheVersion = 'qfph-v2-3';
    const cache = await caches.open('qfph-forms-' + cacheVersion);
    const cached = await cache.match(url);
    if (cached) {
      const buf = await cached.arrayBuffer();
      return new Uint8Array(buf);
    }
  } catch {
    // caches API unavailable; continue to fetch
  }

  // 2. fetch with force-cache so browser/SW cache is preferred.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // 15 s timeout
  try {
    const res = await fetch(url, { cache: 'force-cache', signal: controller.signal });
    if (!res.ok) throw new Error(`Failed to load form template: ${pdfPath}`);
    const buf = await res.arrayBuffer();
    return new Uint8Array(buf);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Network timeout — please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

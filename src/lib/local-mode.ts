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
  // Best-effort fetch (browser cache or SW) so the PDF lands in cache regardless
  // of whether the SW is fully ready (e.g. first visit).
  try {
    const res = await fetch(url, { cache: 'reload' });
    if (!res.ok) return false;
    // Buffer it once so the SW intercepts and stores it.
    await res.arrayBuffer();
  } catch {
    return false;
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
 */
export async function fetchFormTemplateBytes(pdfPath: string): Promise<Uint8Array> {
  const url = `/forms/${pdfPath}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000); // 15 s timeout
  try {
    const res = await fetch(url, { signal: controller.signal });
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

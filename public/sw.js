/**
 * QuickFormsPH v3.0 — Offline-First Service Worker
 *
 * Caching strategy:
 *
 *  /_next/static/**   → cache-first (ASSETS_CACHE)
 *    Content-addressed filenames (hash in URL) make these immutable.
 *    JS chunks, CSS, fonts, and the pdfjs worker all live here.
 *    Caching them means the app works fully offline after one online visit.
 *
 *  /logos/**          → cache-first (ASSETS_CACHE)
 *  /*.png|jpg|svg     → cache-first (ASSETS_CACHE)
 *
 *  /forms/*.pdf       → cache-first (FORMS_CACHE, persistent)
 *
 *  HTML app pages     → network-first with cache fallback (APP_CACHE)
 *    Fresh content when online; last-good cached copy when offline.
 *
 *  /_next/data/**     → pass-through (RSC page data, always dynamic)
 *  /_next/image/**    → pass-through (on-demand image optimisation)
 *  /api/**            → pass-through
 *
 * Bumping CACHE_VERSION purges all previous caches on activation.
 */

const CACHE_VERSION = 'qfph-v3-0';
const FORMS_CACHE  = 'qfph-forms-'  + CACHE_VERSION;
const ASSETS_CACHE = 'qfph-assets-' + CACHE_VERSION;
const APP_CACHE    = 'qfph-app-'    + CACHE_VERSION;

// Public static assets to warm during SW install (logos + wordmark).
const PRECACHE_PUBLIC = [
  '/logos/bir.png',
  '/logos/pagibig.png',
  '/logos/philhealth.png',
  '/quickformsph-logo-transparent-slogan.png',
  '/quickformsph-logo-transparent.png',
  '/quickformsph-logo.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(ASSETS_CACHE).then(async (cache) => {
      // Pre-warm logos and wordmarks; ignore individual failures.
      await Promise.allSettled(
        PRECACHE_PUBLIC.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((r) => { if (r.ok) cache.put(url, r); })
            .catch(() => {}),
        ),
      );
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== FORMS_CACHE && k !== ASSETS_CACHE && k !== APP_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Always pass through: API routes, RSC payloads, on-demand image optimisation.
  if (
    url.pathname.startsWith('/api/') ||
    url.search.includes('_rsc=') ||
    url.pathname.startsWith('/_next/data/') ||
    url.pathname.startsWith('/_next/image')
  ) {
    return;
  }

  // /_next/static/** — immutable content-addressed assets.
  // Includes JS chunks, CSS, fonts, and the bundled pdfjs worker.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(ASSETS_CACHE, req));
    return;
  }

  // Form template PDFs — cache-first, persistent.
  if (url.pathname.startsWith('/forms/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(cacheFirst(FORMS_CACHE, req));
    return;
  }

  // Logos and public images — cache-first.
  if (
    url.pathname.startsWith('/logos/') ||
    /\.(png|jpg|jpeg|svg|webp|ico)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(ASSETS_CACHE, req));
    return;
  }

  // App shell HTML — network-first with offline fallback.
  if (
    url.pathname === '/' ||
    url.pathname.startsWith('/forms') ||
    url.pathname.startsWith('/about') ||
    url.pathname.startsWith('/privacy')
  ) {
    event.respondWith(networkFirst(APP_CACHE, req));
    return;
  }
});

// ─── Cache helpers ────────────────────────────────────────────────────────────

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (err) {
    // Network unavailable and not in cache — propagate the error.
    throw err;
  }
}

async function networkFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch {
    const hit = await cache.match(req);
    if (hit) return hit;
    // Nothing in cache and offline — let the browser show its error.
    throw new Error('Offline and no cached response for ' + req.url);
  }
}

// ─── Message: explicit form template precache ─────────────────────────────────
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || typeof data !== 'object') return;

  if (data.type === 'PRECACHE_FORM' && typeof data.url === 'string') {
    event.waitUntil(
      caches.open(FORMS_CACHE).then(async (cache) => {
        try {
          const res = await fetch(data.url, { cache: 'reload' });
          if (res.ok) await cache.put(data.url, res.clone());
          if (event.source) event.source.postMessage({ type: 'PRECACHE_DONE', url: data.url, ok: res.ok });
        } catch (err) {
          if (event.source) event.source.postMessage({ type: 'PRECACHE_DONE', url: data.url, ok: false, error: String(err) });
        }
      }),
    );
  }
});

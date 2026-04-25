/**
 * QuickFormsPH v2.0 — Local Mode Service Worker
 *
 * SAFE strategy:
 *   • Only intercept assets we KNOW are immutable:
 *       - Form template PDFs   (/forms/*.pdf)
 *       - pdfjs worker         (/pdf.worker.min.js)
 *   • Everything else (HTML, JS chunks, RSC payloads, /_next/*, /api/*)
 *     is left to the browser. Touching Next.js chunks breaks client-side
 *     navigation: chunk hashes change between builds, so cache-first
 *     would serve a stale or missing file → blank page.
 *
 * Bumping CACHE_VERSION purges all old caches on activation.
 */

const CACHE_VERSION = 'qfph-v2-3';
const FORMS_CACHE = 'qfph-forms-' + CACHE_VERSION;
const ASSETS_CACHE = 'qfph-assets-' + CACHE_VERSION;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== FORMS_CACHE && k !== ASSETS_CACHE)
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

  // Never touch Next.js internals, RSC payloads, or API routes.
  if (
    url.pathname.startsWith('/_next/') ||
    url.search.includes('_rsc=') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Form template PDFs — cache-first, persistent.
  if (url.pathname.startsWith('/forms/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(cacheFirst(FORMS_CACHE, req));
    return;
  }

  // pdfjs worker — cache-first.
  if (url.pathname === '/pdf.worker.min.js') {
    event.respondWith(cacheFirst(ASSETS_CACHE, req));
    return;
  }
});

async function cacheFirst(cacheName, req) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok && res.type === 'basic') {
    cache.put(req, res.clone()).catch(() => {});
  }
  return res;
}

// Allow the page to explicitly request a form template be cached.
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

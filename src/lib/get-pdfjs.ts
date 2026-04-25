/**
 * Returns the pdfjs-dist library with the worker pre-configured.
 *
 * WHY BLOB URL (not just workerSrc string):
 *   On iOS Safari, `new Worker(url)` bypasses the service worker entirely —
 *   it goes directly to the network, skipping the SW cache. This means even
 *   though /_next/static/media/pdf.worker.min.*.js is cached by the SW, Safari
 *   can't load it offline when PDF.js tries `new Worker(workerSrc)`.
 *
 *   The fix: fetch the worker bytes ourselves via `fetch()` (which DOES go
 *   through the SW and is served from ASSETS_CACHE offline), then convert to a
 *   blob: URL. `new Worker(blobUrl)` loads from memory — no network needed.
 *
 * Call this instead of `await import('pdfjs-dist')` anywhere PDF rendering is
 * needed in the browser.
 */

let _ready: Promise<typeof import('pdfjs-dist')> | null = null;

export function getPdfjsLib(): Promise<typeof import('pdfjs-dist')> {
  if (_ready) return _ready;

  // webpack 5 transforms `new URL('…', import.meta.url)` into a static asset
  // reference and emits the file to /_next/static/ with a content-hash name.
  const workerUrl = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();

  _ready = Promise.all([
    import('pdfjs-dist'),
    // Fetch through the SW cache, then wrap in a blob: URL so that
    // `new Worker(blobUrl)` works offline on iOS Safari.
    fetch(workerUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch pdf worker: ${r.status}`);
        return r.blob();
      })
      .then((blob) => URL.createObjectURL(blob)),
  ]).then(([lib, blobUrl]) => {
    lib.GlobalWorkerOptions.workerSrc = blobUrl;
    return lib;
  });

  return _ready;
}

/**
 * Returns the pdfjs-dist library with the worker pre-configured.
 *
 * Using `new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url)` lets
 * webpack 5 copy the worker file into /_next/static/ at build time and gives us
 * a guaranteed same-origin URL — no separate /public/pdf.worker.min.js fetch
 * needed, and no CSP / service-worker complications.
 *
 * Call this instead of `await import('pdfjs-dist')` anywhere PDF rendering is
 * needed in the browser.
 */

let _ready: Promise<typeof import('pdfjs-dist')> | null = null;

export function getPdfjsLib(): Promise<typeof import('pdfjs-dist')> {
  if (_ready) return _ready;

  // webpack 5 transforms `new URL('…', import.meta.url)` into a static asset
  // reference and emits the file to /_next/static/ with a content-hash name.
  const workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url,
  ).toString();

  _ready = import('pdfjs-dist').then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = workerSrc;
    return lib;
  });

  return _ready;
}

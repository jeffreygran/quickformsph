/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for production deployment (includes only needed node_modules)
  output: 'standalone',
  // Keep tesseract.js in Node.js land (not bundled by webpack)
  serverExternalPackages: ['tesseract.js', 'better-sqlite3'],
  webpack: (config, { isServer }) => {
    // pdfjs-dist optionally requires 'canvas' for Node.js — not needed in browser
    config.resolve.alias['canvas'] = false;
    // Local Mode v2.0: pdf-generator.ts uses dynamic imports of fs/path on the
    // server side only. Stub them in the client bundle so webpack never tries
    // to bundle Node built-ins for the browser.
    if (!isServer) {
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        fs: false,
        'fs/promises': false,
        path: false,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "connect-src 'self'",
              "worker-src 'self' blob:",  // Local Mode v2.0: service worker for offline cache
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

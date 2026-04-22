/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for production deployment (includes only needed node_modules)
  output: 'standalone',
  webpack: (config) => {
    // pdfjs-dist optionally requires 'canvas' for Node.js — not needed in browser
    config.resolve.alias['canvas'] = false;
    return config;
  },
};

module.exports = nextConfig;

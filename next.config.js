/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist optionally requires 'canvas' for Node.js — not needed in browser
    config.resolve.alias['canvas'] = false;
    return config;
  },
};

module.exports = nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  },
  output: 'standalone',
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required to make pdfjs work
    if (dev) {
      config.cache = false; // Disable webpack caching in development
    }
    return config;
  },
};

module.exports = nextConfig;
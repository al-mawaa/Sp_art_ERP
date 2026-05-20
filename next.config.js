/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Cold / on-demand compilation can exceed the default chunk load timeout in dev (ChunkLoadError on app/layout.js).
  webpack: (config, { dev }) => {
    if (dev) {
      config.output = config.output || {};
      config.output.chunkLoadTimeout = 300000; // 5 minutes (default is often 120s)
    }
    return config;
  },
};

module.exports = nextConfig;

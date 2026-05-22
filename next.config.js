/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/admin/leaves/senior-teacher",
        destination: "/admin/leaves",
        permanent: false,
      },
      {
        source: "/admin/leaves/senior-teacher/:path*",
        destination: "/admin/leaves",
        permanent: false,
      },
    ];
  },
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

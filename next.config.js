/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.output.chunkLoadTimeout = 300000;
    }
    return config;
  },
};

module.exports = nextConfig;

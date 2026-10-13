import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emit a self-contained server bundle in .next/standalone for container images.
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    const apiProxyTarget = process.env.API_PROXY_TARGET ?? 'http://localhost:3000';

    return [
      {
        source: '/api/:path*',
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;

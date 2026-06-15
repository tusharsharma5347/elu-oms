import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow API routes to run longer for AI prediction calls
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;

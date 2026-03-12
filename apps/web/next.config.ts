import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.cloudfront.net',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },
  // Transpile workspace packages
  transpilePackages: ['@snaptik/ui', '@snaptik/types'],
};

export default nextConfig;

import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/~offline', revision: 'offline-v1' }],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
};

export default withSerwist(nextConfig);

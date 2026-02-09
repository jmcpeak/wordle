import type { NextConfig } from 'next';
import nextPwa from 'next-pwa';
import runtimeCaching from 'next-pwa/cache';

const withPwa = nextPwa({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

const isDevelopment = process.env.NODE_ENV === 'development';

export default isDevelopment ? nextConfig : withPwa(nextConfig);

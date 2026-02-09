declare module 'next-pwa' {
  import type { NextConfig } from 'next';

  type PwaConfig = {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    runtimeCaching?: unknown[];
  };

  export default function nextPwa(
    config: PwaConfig,
  ): (nextConfig: NextConfig) => NextConfig;
}

declare module 'next-pwa/cache' {
  const runtimeCaching: unknown[];
  export default runtimeCaching;
}

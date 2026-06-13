import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

function getBuildLabel(): string {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  const v = `v${pkg.version}`;
  return sha ? `${v} · ${sha}` : v;
}

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/~offline', revision: 'offline-v1' }],
  // iOS PWA startup can stutter while SW install precaches many non-UI chunks.
  // Filter server-only/API and internal test route bundles from final manifest.
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.filter(
        (entry) =>
          !entry.url.includes('/_next/static/chunks/app/api/') &&
          !entry.url.includes('/_next/static/chunks/app/test/'),
      ),
      warnings: [],
    }),
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: {},
  env: {
    NEXT_PUBLIC_BUILD_LABEL: getBuildLabel(),
  },
};

export default withSerwist(nextConfig);

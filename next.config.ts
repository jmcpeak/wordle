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

/** Human-readable UTC date when this build was produced (e.g. "Jul 19, 2026"). */
function getBuildDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
  additionalPrecacheEntries: [{ url: '/~offline', revision: 'offline-v1' }],
  // iOS PWA startup can stutter while SW install precaches many non-UI chunks.
  // Keep the install manifest to the shell + game; runtime-cache the rest.
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.filter((entry) => {
        const { url } = entry;
        if (url.includes('/_next/static/chunks/app/api/')) return false;
        if (url.includes('/_next/static/chunks/app/test/')) return false;
        if (url.includes('/_next/static/chunks/app/privacy/')) return false;
        if (url.includes('/_next/static/chunks/app/terms/')) return false;
        if (url.includes('/_next/static/chunks/app/@modal/')) return false;
        if (url.includes('/_next/static/chunks/app/how-to-play/')) return false;
        if (url.includes('/_next/static/chunks/app/stats/')) return false;
        return true;
      }),
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
    NEXT_PUBLIC_BUILD_DATE: getBuildDate(),
  },
};

export default withSerwist(nextConfig);

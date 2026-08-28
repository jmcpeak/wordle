import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

function git(command: string): string | undefined {
  try {
    const value = execSync(command, { encoding: 'utf8' }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function getGitSha(): string | undefined {
  return process.env.VERCEL_GIT_COMMIT_SHA ?? git('git rev-parse HEAD');
}

function getBuildLabel(): string {
  const pkgPath = join(process.cwd(), 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { version: string };
  const sha = getGitSha()?.slice(0, 7);
  const v = `v${pkg.version}`;
  return sha ? `${v} · ${sha}` : v;
}

/** Commit date (UTC), not clock time, so client bundles stay cache-stable. */
function getBuildDate(): string {
  const iso = git('git log -1 --format=%cI');
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
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
  generateBuildId: async () => getGitSha() ?? 'dev',
  env: {
    NEXT_PUBLIC_BUILD_LABEL: getBuildLabel(),
    NEXT_PUBLIC_BUILD_DATE: getBuildDate(),
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);

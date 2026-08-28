import { defaultCache } from '@serwist/next/worker';
import type {
  PrecacheEntry,
  RuntimeCaching,
  SerwistGlobalConfig,
} from 'serwist';
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkOnly,
  Serwist,
  StaleWhileRevalidate,
} from 'serwist';

const YEAR_SECONDS = 365 * 24 * 60 * 60;

const LONG_LIVED = {
  maxEntries: 128,
  maxAgeSeconds: YEAR_SECONDS,
  maxAgeFrom: 'last-used' as const,
};

/** Dropped on activate so a new deploy never serves HTML that points at old chunks. */
const PAGE_RUNTIME_CACHES = new Set([
  'pages',
  'pages-rsc',
  'pages-rsc-prefetch',
  'others',
]);

const pageShellHandler = new StaleWhileRevalidate({
  cacheName: 'pages',
  plugins: [new ExpirationPlugin(LONG_LIVED)],
});

const rscHandler = new StaleWhileRevalidate({
  cacheName: 'pages-rsc',
  plugins: [new ExpirationPlugin(LONG_LIVED)],
});

const hashedAssetHandler = new CacheFirst({
  cacheName: 'next-static-js-assets',
  plugins: [new ExpirationPlugin(LONG_LIVED)],
});

/**
 * Routes registered first win. Keep game APIs off the default NetworkFirst API
 * cache, serve the document/RSC shell stale-while-revalidate, and pin hashed
 * Next assets for a year (Serwist's default expires them after 24h).
 */
const runtimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ url, sameOrigin }) =>
      sameOrigin &&
      (url.pathname === '/api/word' || url.pathname === '/api/partial-game'),
    method: 'GET',
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      !url.pathname.startsWith('/api/') &&
      (request.mode === 'navigate' || request.destination === 'document'),
    handler: pageShellHandler,
  },
  {
    matcher: ({ request, url, sameOrigin }) =>
      sameOrigin &&
      !url.pathname.startsWith('/api/') &&
      request.headers.get('RSC') === '1',
    handler: rscHandler,
  },
  {
    matcher: /\/_next\/static.+\.(?:js|css)$/i,
    handler: hashedAssetHandler,
  },
  ...defaultCache,
];

declare global {
  // Interface merge — augments Serwist's worker global, not an app-level type.
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => PAGE_RUNTIME_CACHES.has(key))
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});

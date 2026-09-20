import { describe, expect, it } from 'vitest';
import {
  isAuthApiPath,
  isAuthDocumentPath,
  shouldDropDefaultCacheEntry,
} from '@/utils/serviceWorkerRuntimeCache';

describe('service worker auth routes', () => {
  it('treats home and sign-in as session-dependent documents', () => {
    expect(isAuthDocumentPath('/')).toBe(true);
    expect(isAuthDocumentPath('/signin')).toBe(true);
    expect(isAuthDocumentPath('/stats')).toBe(false);
  });

  it('identifies NextAuth API paths', () => {
    expect(isAuthApiPath('/api/auth/csrf')).toBe(true);
    expect(isAuthApiPath('/api/auth/callback/github')).toBe(true);
    expect(isAuthApiPath('/api/word')).toBe(false);
  });

  it('drops Serwist rules that would intercept /api/auth', () => {
    expect(shouldDropDefaultCacheEntry({ matcher: /\/api\/auth\/.*/ })).toBe(
      true,
    );
    expect(shouldDropDefaultCacheEntry({ matcher: /.*/i })).toBe(true);
    expect(
      shouldDropDefaultCacheEntry({
        method: 'GET',
        matcher: ({
          sameOrigin,
          url: { pathname },
        }: {
          sameOrigin: boolean;
          url: { pathname: string };
        }) => sameOrigin && pathname.startsWith('/api/'),
      }),
    ).toBe(true);
  });

  it('keeps page and non-auth API matchers', () => {
    expect(
      shouldDropDefaultCacheEntry({
        matcher: ({
          sameOrigin,
          url: { pathname },
        }: {
          sameOrigin: boolean;
          url: { pathname: string };
        }) => sameOrigin && !pathname.startsWith('/api/'),
      }),
    ).toBe(false);
    expect(
      shouldDropDefaultCacheEntry({ matcher: /\/_next\/static.+\.js$/i }),
    ).toBe(false);
  });
});

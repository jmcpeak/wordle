/**
 * Auth HTML depends on the session cookie. Stale-while-revalidate would replay
 * a logged-out `/` redirect after GitHub returns, which looks like a no-op flash.
 */
export function isAuthDocumentPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/signin';
}

export function isAuthApiPath(pathname: string): boolean {
  return pathname.startsWith('/api/auth');
}

/**
 * Serwist's defaultCache still *intercepts* `/api/auth/*` (NetworkOnly / catch-all).
 * Intercepting OAuth can drop `Set-Cookie` (CSRF, PKCE, session). Drop those
 * rules so the browser handles auth natively; we re-add a non-auth `/api/` cache.
 */
export function shouldDropDefaultCacheEntry(entry: {
  matcher: unknown;
  method?: string;
}): boolean {
  const { matcher } = entry;
  if (matcher instanceof RegExp) {
    return matcher.source.includes('api\\/auth') || matcher.source === '.*';
  }
  if (typeof matcher === 'function' && entry.method === 'GET') {
    const source = matcher.toString();
    return (
      source.includes('pathname.startsWith("/api/")') &&
      !source.includes('!pathname.startsWith("/api/")')
    );
  }
  return false;
}

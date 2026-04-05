import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/** Base64 CSP nonce (Edge-safe; avoids Node `Buffer` in middleware). */
function cspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...Array.from(bytes)));
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|json|woff2)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const nonce = cspNonce();
  const isDev = process.env.NODE_ENV === 'development';

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    'https://vercel.live',
    'https://*.vercel-insights.com',
    'https://va.vercel-scripts.com',
    ...(isDev ? ["'unsafe-eval'"] : []),
  ].join(' ');

  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    `connect-src 'self' https://*.vercel-insights.com https://va.vercel-scripts.com`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  // Next.js extracts the nonce from the *request* CSP header for App Router scripts.
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

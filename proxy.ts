import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDev = process.env.NODE_ENV === 'development';

  // Forward nonce via request headers so Server Components can read it with headers()
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
    `connect-src 'self' https://api.dictionaryapi.dev https://random-word-api.herokuapp.com https://*.vercel-insights.com https://va.vercel-scripts.com`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
  ].join('; ');

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('Content-Security-Policy', csp);

  return response;
}

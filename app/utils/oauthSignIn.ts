const RETRYABLE_OAUTH_ERRORS = new Set(['MissingCSRF', 'Csrf']);

export type OAuthStartResult = {
  error?: string | null;
  url?: string | null;
};

export type ResolvedOAuthStart =
  | { ok: true; url: string }
  | { ok: false; error: string; retryable: boolean };

/** Auth.js bounced OAuth back to our app instead of GitHub/Google/Facebook. */
export function getSameOriginSignInError(
  url: string,
  origin: string,
): string | null {
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== origin) return null;
    const { pathname } = parsed;
    if (pathname === '/signin' || pathname.startsWith('/api/auth')) {
      return parsed.searchParams.get('error') ?? 'SignIn';
    }
    return null;
  } catch {
    return 'SignIn';
  }
}

export function isRetryableOAuthStartError(error: string): boolean {
  return RETRYABLE_OAUTH_ERRORS.has(error) || error === 'SignIn';
}

/**
 * Decide whether client `signIn(..., { redirect: false })` produced an IdP URL.
 * A same-origin bounce (typical MissingCSRF after logout) is not a success.
 */
export function resolveOAuthRedirectUrl(
  result: OAuthStartResult | undefined,
  origin: string,
): ResolvedOAuthStart {
  if (!result) {
    return { ok: false, error: 'SignIn', retryable: true };
  }
  if (result.error) {
    return {
      ok: false,
      error: result.error,
      retryable: isRetryableOAuthStartError(result.error),
    };
  }
  const url = result.url;
  if (!url) {
    return { ok: false, error: 'SignIn', retryable: true };
  }
  const bounceError = getSameOriginSignInError(url, origin);
  if (bounceError) {
    return {
      ok: false,
      error: bounceError,
      retryable: isRetryableOAuthStartError(bounceError),
    };
  }
  return { ok: true, url };
}

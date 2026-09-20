import { describe, expect, it } from 'vitest';
import { resolveOAuthRedirectUrl } from '@/utils/oauthSignIn';

const ORIGIN = 'https://wordle.example';
const GITHUB =
  'https://github.com/login/oauth/authorize?client_id=abc&state=xyz';

describe('resolveOAuthRedirectUrl', () => {
  it('accepts an identity-provider URL', () => {
    expect(resolveOAuthRedirectUrl({ url: GITHUB }, ORIGIN)).toEqual({
      ok: true,
      url: GITHUB,
    });
  });

  it('retries a MissingCSRF bounce after logout', () => {
    expect(
      resolveOAuthRedirectUrl({ error: 'MissingCSRF', url: null }, ORIGIN),
    ).toEqual({
      ok: false,
      error: 'MissingCSRF',
      retryable: true,
    });
  });

  it('retries when Auth.js returns the custom sign-in page', () => {
    expect(
      resolveOAuthRedirectUrl(
        { url: `${ORIGIN}/signin?error=MissingCSRF` },
        ORIGIN,
      ),
    ).toEqual({
      ok: false,
      error: 'MissingCSRF',
      retryable: true,
    });
  });

  it('does not retry a real OAuth denial', () => {
    expect(
      resolveOAuthRedirectUrl({ error: 'AccessDenied', url: null }, ORIGIN),
    ).toEqual({
      ok: false,
      error: 'AccessDenied',
      retryable: false,
    });
  });

  it('treats a missing result as a retryable start failure', () => {
    expect(resolveOAuthRedirectUrl(undefined, ORIGIN)).toEqual({
      ok: false,
      error: 'SignIn',
      retryable: true,
    });
  });
});

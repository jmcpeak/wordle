import { fireEvent, screen, waitFor } from '@testing-library/react';
import { getCsrfToken, signIn } from 'next-auth/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SignInPage from '@/signin/page';
import { useI18nStore } from '@/store/i18nStore';
import { useToastStore } from '@/store/toastStore';
import { renderWithTheme } from '@/testUtils/renderWithTheme';
import { LAST_AUTH_PROVIDER_STORAGE_KEY } from '@/utils/lastAuthProviderStorage';

const GITHUB_OAUTH =
  'https://github.com/login/oauth/authorize?client_id=test&state=1';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  getCsrfToken: vi.fn(),
}));

describe('SignInPage', () => {
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    vi.mocked(signIn).mockReset();
    vi.mocked(getCsrfToken).mockResolvedValue('csrf');
    useI18nStore.setState({
      locale: 'en-US',
      translations: {
        'auth.signIn': 'Sign In To Wordle',
        'auth.signInWithGithub': 'Sign in with GitHub',
        'auth.signInWithGoogle': 'Sign in with Google',
        'auth.signInWithFacebook': 'Sign in with Facebook',
        'auth.lastUsed': 'Last used',
        'auth.signInFailed': 'Sign-in failed. Please try again.',
      },
    });
    useToastStore.setState({ message: null, severity: 'info' });
    window.localStorage.removeItem(LAST_AUTH_PROVIDER_STORAGE_KEY);
    vi.stubGlobal('location', {
      origin: 'http://localhost:3000',
      href: 'http://localhost:3000/signin',
      assign,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('navigates to GitHub on the first successful OAuth start', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: undefined,
      url: GITHUB_OAUTH,
      ok: true,
      status: 200,
      code: undefined,
    });

    renderWithTheme(<SignInPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign in with GitHub' }),
    );

    await waitFor(() => expect(assign).toHaveBeenCalledWith(GITHUB_OAUTH));
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn).toHaveBeenCalledWith('github', {
      callbackUrl: '/',
      redirect: false,
    });
    expect(useToastStore.getState().message).toBeNull();
  });

  it('retries once when the first start fails with MissingCSRF', async () => {
    vi.mocked(signIn)
      .mockResolvedValueOnce({
        error: 'MissingCSRF',
        url: null,
        ok: true,
        status: 200,
        code: undefined,
      })
      .mockResolvedValueOnce({
        error: undefined,
        url: GITHUB_OAUTH,
        ok: true,
        status: 200,
        code: undefined,
      });

    renderWithTheme(<SignInPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign in with GitHub' }),
    );

    await waitFor(() => expect(assign).toHaveBeenCalledWith(GITHUB_OAUTH));
    expect(signIn).toHaveBeenCalledTimes(2);
    expect(useToastStore.getState().message).toBeNull();
  });

  it('shows an error and stays on the page after a non-retryable failure', async () => {
    vi.mocked(signIn).mockResolvedValue({
      error: 'AccessDenied',
      url: null,
      ok: false,
      status: 403,
      code: undefined,
    });

    renderWithTheme(<SignInPage />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Sign in with GitHub' }),
    );

    await waitFor(() =>
      expect(useToastStore.getState().message).toBe(
        'Sign-in failed. Please try again.',
      ),
    );
    expect(assign).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Sign in with GitHub' }),
    ).toHaveProperty('disabled', false);
  });
});

import { AUTH_PROVIDERS } from '@/constants';

export const LAST_AUTH_PROVIDER_STORAGE_KEY = 'wordle-last-auth-provider';

export type AuthProviderId =
  (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];

const VALID_PROVIDERS = new Set<string>(Object.values(AUTH_PROVIDERS));

function isAuthProviderId(value: string): value is AuthProviderId {
  return VALID_PROVIDERS.has(value);
}

export function loadLastAuthProvider(): AuthProviderId | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LAST_AUTH_PROVIDER_STORAGE_KEY);
    if (!raw || !isAuthProviderId(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}

export function saveLastAuthProvider(provider: AuthProviderId): void {
  if (typeof window === 'undefined') return;
  if (!isAuthProviderId(provider)) return;

  try {
    window.localStorage.setItem(LAST_AUTH_PROVIDER_STORAGE_KEY, provider);
  } catch {
    // Quota / private mode — ignore.
  }
}

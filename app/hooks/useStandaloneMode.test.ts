import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStandaloneMode } from '@/hooks/useStandaloneMode';

describe('useStandaloneMode', () => {
  const listeners = new Set<() => void>();
  let standaloneValue = false;
  let displayModeMatches = false;

  beforeEach(() => {
    listeners.clear();
    standaloneValue = false;
    displayModeMatches = false;

    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: standaloneValue,
    });

    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query.includes('standalone') && displayModeMatches,
        media: query,
        addEventListener: (_event: string, listener: () => void) => {
          listeners.add(listener);
        },
        removeEventListener: (_event: string, listener: () => void) => {
          listeners.delete(listener);
        },
      })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(navigator, 'standalone');
  });

  it('returns true when navigator.standalone is true (iOS PWA)', async () => {
    standaloneValue = true;
    Object.defineProperty(navigator, 'standalone', {
      configurable: true,
      value: true,
    });

    const { result } = renderHook(() => useStandaloneMode());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns true when display-mode standalone matches (macOS PWA)', async () => {
    displayModeMatches = true;

    const { result } = renderHook(() => useStandaloneMode());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false in a regular browser', async () => {
    const { result } = renderHook(() => useStandaloneMode());
    await waitFor(() => expect(result.current).toBe(false));
  });
});

import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isIosDevice, useStandaloneMode } from '@/hooks/useStandaloneMode';

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

  it('updates when the display-mode media query changes', async () => {
    const { result } = renderHook(() => useStandaloneMode());
    expect(result.current).toBe(false);

    act(() => {
      displayModeMatches = true;
      for (const listener of listeners) listener();
    });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('hydrates without a markup mismatch when already standalone', async () => {
    displayModeMatches = true;

    function Probe() {
      return createElement('div', null, String(useStandaloneMode()));
    }

    // The server can only ever emit `false`.
    const serverHtml = renderToString(createElement(Probe));
    expect(serverHtml).toContain('false');

    const container = document.createElement('div');
    container.innerHTML = serverHtml;
    document.body.appendChild(container);

    const errors: unknown[] = [];
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation((...args) => errors.push(args));

    const root = await act(async () =>
      hydrateRoot(container, createElement(Probe)),
    );

    // No "hydration failed"/"did not match" warnings, and the live value wins.
    expect(errors).toEqual([]);
    expect(container.textContent).toBe('true');

    consoleError.mockRestore();
    await act(async () => root.unmount());
    container.remove();
  });
});

describe('isIosDevice', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('detects iPhone user agents', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });

    expect(isIosDevice()).toBe(true);
  });

  it('returns false for macOS desktop', () => {
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      platform: 'MacIntel',
      maxTouchPoints: 0,
    });

    expect(isIosDevice()).toBe(false);
  });
});

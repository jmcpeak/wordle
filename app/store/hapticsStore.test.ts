import { HapticsProvider } from '@haptics/react';
import { act, render } from '@testing-library/react';
import { createElement, Fragment } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HAPTICS_STORAGE_KEY, useHapticsStore } from '@/store/hapticsStore';

function HapticsHarness() {
  const enabled = useHapticsStore((s) => s.enabled);
  return createElement(
    Fragment,
    null,
    enabled ? createElement(HapticsProvider, null, null) : null,
    createElement(
      'button',
      { type: 'button', 'data-haptic': 'selection' },
      'A',
    ),
  );
}

describe('hapticsStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useHapticsStore.setState({ enabled: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to enabled when no preference has been stored', () => {
    useHapticsStore.getState().initialize();

    expect(useHapticsStore.getState().enabled).toBe(true);
  });

  it('restores a disabled preference', () => {
    window.localStorage.setItem(HAPTICS_STORAGE_KEY, 'false');

    useHapticsStore.getState().initialize();

    expect(useHapticsStore.getState().enabled).toBe(false);
  });

  it('persists preference changes', () => {
    useHapticsStore.getState().setEnabled(false);

    expect(useHapticsStore.getState().enabled).toBe(false);
    expect(window.localStorage.getItem(HAPTICS_STORAGE_KEY)).toBe('false');
  });

  it('removes iOS switch overlays when HapticsProvider unmounts on disable', async () => {
    const { resetDetection } = await import('@haptics/core');
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
      platform: 'iPhone',
      maxTouchPoints: 5,
    });
    resetDetection();

    const { container } = render(createElement(HapticsHarness));
    expect(container.querySelector('[data-haptic-overlay]')).not.toBeNull();

    act(() => {
      useHapticsStore.getState().setEnabled(false);
    });
    expect(container.querySelector('[data-haptic-overlay]')).toBeNull();

    act(() => {
      useHapticsStore.getState().setEnabled(true);
    });
    expect(container.querySelector('[data-haptic-overlay]')).not.toBeNull();
  });
});

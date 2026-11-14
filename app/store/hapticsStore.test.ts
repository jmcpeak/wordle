import { beforeEach, describe, expect, it } from 'vitest';
import { HAPTICS_STORAGE_KEY, useHapticsStore } from '@/store/hapticsStore';

describe('hapticsStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useHapticsStore.setState({ enabled: true });
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
});

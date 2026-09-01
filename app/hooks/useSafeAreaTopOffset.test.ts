import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSafeAreaTopOffset } from '@/hooks/useSafeAreaTopOffset';

describe('useSafeAreaTopOffset', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('adds extra padding to the measured safe-area inset', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '47px',
    } as CSSStyleDeclaration);

    const { result } = renderHook(() => useSafeAreaTopOffset(8, 0));

    expect(result.current).toBe(55);
  });

  it('uses the minimum inset when env reads 0 on iOS PWA', () => {
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '0px',
    } as CSSStyleDeclaration);

    const { result } = renderHook(() => useSafeAreaTopOffset(8, 52));

    expect(result.current).toBe(60);
  });
});

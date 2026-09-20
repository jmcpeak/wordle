import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useShake } from '@/hooks/useShake';

describe('useShake', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts idle', () => {
    const { result } = renderHook(() => useShake(500));

    expect(result.current.shakeToken).toBe(0);
  });

  it('marks the row as shaking when triggered', () => {
    const { result } = renderHook(() => useShake(500));

    act(() => result.current.triggerShake());

    expect(result.current.shakeToken).toBeGreaterThan(0);
  });

  it('changes the token on a second shake inside the window so the animation restarts', () => {
    const { result } = renderHook(() => useShake(500));

    act(() => result.current.triggerShake());
    const first = result.current.shakeToken;

    act(() => {
      vi.advanceTimersByTime(200);
      result.current.triggerShake();
    });

    expect(result.current.shakeToken).not.toBe(first);
    // Parity must flip so LetterRow swaps animation-name and replays.
    expect(result.current.shakeToken % 2).not.toBe(first % 2);
  });

  it('resets to idle after the duration elapses', () => {
    const { result } = renderHook(() => useShake(500));

    act(() => result.current.triggerShake());
    act(() => vi.advanceTimersByTime(500));

    expect(result.current.shakeToken).toBe(0);
  });

  it('extends the window when re-triggered rather than clearing early', () => {
    const { result } = renderHook(() => useShake(500));

    act(() => result.current.triggerShake());
    act(() => {
      vi.advanceTimersByTime(400);
      result.current.triggerShake();
    });

    // The original 500ms timer was cancelled, so it must still be shaking.
    act(() => vi.advanceTimersByTime(200));
    expect(result.current.shakeToken).toBeGreaterThan(0);

    act(() => vi.advanceTimersByTime(300));
    expect(result.current.shakeToken).toBe(0);
  });
});

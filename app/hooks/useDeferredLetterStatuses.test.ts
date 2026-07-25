import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { getRevealColorSwapDelayMs } from '@/constants';
import { useDeferredLetterStatuses } from '@/hooks/useDeferredLetterStatuses';
import type { LetterStatus } from '@/types';
import { rebuildLetterStatuses } from '@/utils/gameLogic';

describe('useDeferredLetterStatuses', () => {
  it('shows store statuses immediately on initial render', () => {
    const letterStatuses: Record<string, LetterStatus> = {
      A: 'correct',
      B: 'present',
    };

    const { result } = renderHook(() =>
      useDeferredLetterStatuses(letterStatuses, ['ABACK'], 'CRANE'),
    );

    expect(result.current).toEqual(letterStatuses);
  });

  it('defers each key until the matching tile reveal fold finishes', () => {
    vi.useFakeTimers();

    const solution = 'CRANE';
    const priorGuesses = ['WORDS'];
    const priorStatuses = rebuildLetterStatuses(priorGuesses, solution);
    // POETS vs CRANE: P absent, O absent, E present, T absent, S absent
    const nextGuess = 'POETS';
    const allGuesses = [...priorGuesses, nextGuess];
    const nextStatuses = rebuildLetterStatuses(allGuesses, solution);

    const { result, rerender } = renderHook(
      ({ letterStatuses, guesses }) =>
        useDeferredLetterStatuses(letterStatuses, guesses, solution),
      {
        initialProps: {
          letterStatuses: priorStatuses,
          guesses: priorGuesses,
        },
      },
    );

    expect(result.current).toEqual(priorStatuses);

    rerender({ letterStatuses: nextStatuses, guesses: allGuesses });

    // Immediately after submit, keyboard still shows prior statuses.
    expect(result.current).toEqual(priorStatuses);

    act(() => {
      vi.advanceTimersByTime(getRevealColorSwapDelayMs(0) - 1);
    });
    expect(result.current).toEqual(priorStatuses);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.P).toBe('absent');
    expect(result.current.E).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(
        getRevealColorSwapDelayMs(2) - getRevealColorSwapDelayMs(0),
      );
    });
    expect(result.current.P).toBe('absent');
    expect(result.current.O).toBe('absent');
    expect(result.current.E).toBe('present');
    expect(result.current.T).toBeUndefined();

    act(() => {
      vi.advanceTimersByTime(
        getRevealColorSwapDelayMs(4) - getRevealColorSwapDelayMs(2),
      );
    });
    expect(result.current).toEqual(nextStatuses);

    vi.useRealTimers();
  });

  it('promotes a letter from present to correct when that tile reveals', () => {
    vi.useFakeTimers();

    const solution = 'CRANE';
    // STARE: S absent, T absent, A correct, R present, E present
    const priorGuesses = ['STARE'];
    const priorStatuses = rebuildLetterStatuses(priorGuesses, solution);
    expect(priorStatuses.R).toBe('present');

    // BRINE: B absent, R correct, I absent, N present, E present
    const nextGuess = 'BRINE';
    const allGuesses = [...priorGuesses, nextGuess];
    const nextStatuses = rebuildLetterStatuses(allGuesses, solution);
    expect(nextStatuses.R).toBe('correct');

    const { result, rerender } = renderHook(
      ({ letterStatuses, guesses }) =>
        useDeferredLetterStatuses(letterStatuses, guesses, solution),
      {
        initialProps: {
          letterStatuses: priorStatuses,
          guesses: priorGuesses,
        },
      },
    );

    rerender({ letterStatuses: nextStatuses, guesses: allGuesses });

    // Before R's tile (index 1) fold finishes, key stays present.
    act(() => {
      vi.advanceTimersByTime(getRevealColorSwapDelayMs(1) - 1);
    });
    expect(result.current.R).toBe('present');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.R).toBe('correct');

    act(() => {
      vi.advanceTimersByTime(
        getRevealColorSwapDelayMs(4) - getRevealColorSwapDelayMs(1),
      );
    });
    expect(result.current).toEqual(nextStatuses);

    vi.useRealTimers();
  });

  it('resets immediately when the game restarts', () => {
    const solution = 'CRANE';
    const guesses = ['WORDS'];
    const letterStatuses = rebuildLetterStatuses(guesses, solution);

    const { result, rerender } = renderHook(
      ({ letterStatuses, guesses, solution }) =>
        useDeferredLetterStatuses(letterStatuses, guesses, solution),
      {
        initialProps: { letterStatuses, guesses, solution },
      },
    );

    expect(result.current).toEqual(letterStatuses);

    rerender({ letterStatuses: {}, guesses: [], solution: 'PLANT' });
    expect(result.current).toEqual({});
  });
});

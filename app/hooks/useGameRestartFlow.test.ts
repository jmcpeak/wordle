import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  RESTART_SPLIT_FLAP_DURATION_MS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { useGameRestartFlow } from '@/hooks/useGameRestartFlow';

describe('useGameRestartFlow', () => {
  it('shows the play again button after the win animation', () => {
    vi.useFakeTimers();
    const onRestart = vi.fn();

    const { result } = renderHook(() =>
      useGameRestartFlow({
        gameState: GAME_STATE.WON,
        onRestart,
      }),
    );

    expect(result.current.restartPhase).toBe('idle');

    act(() => {
      vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    });

    expect(result.current.restartPhase).toBe('showButton');
    vi.useRealTimers();
  });

  it('shows the play again button after the loss animation', () => {
    vi.useFakeTimers();
    const onRestart = vi.fn();

    const { result } = renderHook(() =>
      useGameRestartFlow({
        gameState: GAME_STATE.LOST,
        onRestart,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(LOSS_ANIMATION_DURATION_MS);
    });

    expect(result.current.restartPhase).toBe('showButton');
    vi.useRealTimers();
  });

  it('restarts after the exit and restart delay', () => {
    vi.useFakeTimers();
    const onRestart = vi.fn();

    const { result } = renderHook(() =>
      useGameRestartFlow({
        gameState: GAME_STATE.LOST,
        onRestart,
      }),
    );

    act(() => {
      result.current.startRestartExit();
    });
    expect(result.current.restartPhase).toBe('exiting');

    act(() => {
      result.current.markRestarting();
    });
    expect(result.current.restartPhase).toBe('restarting');

    act(() => {
      vi.advanceTimersByTime(RESTART_SPLIT_FLAP_DURATION_MS);
    });

    expect(onRestart).toHaveBeenCalledTimes(1);
    expect(result.current.restartPhase).toBe('idle');
    vi.useRealTimers();
  });
});

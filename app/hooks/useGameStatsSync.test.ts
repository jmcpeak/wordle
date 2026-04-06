import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GAME_STATE } from '@/constants';
import { useGameStatsSync } from '@/hooks/useGameStatsSync';

describe('useGameStatsSync', () => {
  it('records a win once and clears messages', async () => {
    const clearMessage = vi.fn();
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ gameState, guessCount }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          clearMessage,
          addWin,
          addLoss,
        }),
      {
        initialProps: {
          gameState: GAME_STATE.PLAYING,
          guessCount: 0,
        },
      },
    );

    rerender({ gameState: GAME_STATE.WON, guessCount: 3 });
    rerender({ gameState: GAME_STATE.WON, guessCount: 3 });

    expect(clearMessage).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledWith(3);
    expect(addLoss).not.toHaveBeenCalled();
  });

  it('resets after a new round and can record another result', () => {
    const clearMessage = vi.fn();
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ gameState, guessCount }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          clearMessage,
          addWin,
          addLoss,
        }),
      {
        initialProps: {
          gameState: GAME_STATE.WON,
          guessCount: 2,
        },
      },
    );

    rerender({ gameState: GAME_STATE.PLAYING, guessCount: 0 });
    rerender({ gameState: GAME_STATE.LOST, guessCount: 6 });

    expect(addWin).toHaveBeenCalledTimes(1);
    expect(addLoss).toHaveBeenCalledTimes(1);
    expect(clearMessage).toHaveBeenCalledTimes(2);
  });
});

import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GAME_STATE } from '@/constants';
import { useGameStatsSync } from '@/hooks/useGameStatsSync';
import type { GameState } from '@/types';

type HookProps = {
  gameState: GameState;
  guessCount: number;
  solution: string;
};

describe('useGameStatsSync', () => {
  it('records a win once', async () => {
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);
    const deletePartialGame = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook<void, HookProps>(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          deletePartialGame,
          addWin,
          addLoss,
        }),
      {
        initialProps: {
          gameState: GAME_STATE.PLAYING,
          guessCount: 0,
          solution: 'CRANE',
        },
      },
    );

    rerender({ gameState: GAME_STATE.WON, guessCount: 3, solution: 'CRANE' });
    rerender({ gameState: GAME_STATE.WON, guessCount: 3, solution: 'CRANE' });

    expect(addWin).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledWith(3, 'CRANE');
    expect(addLoss).not.toHaveBeenCalled();
  });

  it('resets after a new round and can record another result', () => {
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);
    const deletePartialGame = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook<void, HookProps>(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          deletePartialGame,
          addWin,
          addLoss,
        }),
      {
        initialProps: {
          gameState: GAME_STATE.WON,
          guessCount: 2,
          solution: 'CRANE',
        },
      },
    );

    rerender({
      gameState: GAME_STATE.PLAYING,
      guessCount: 0,
      solution: 'SLATE',
    });
    rerender({ gameState: GAME_STATE.LOST, guessCount: 6, solution: 'SLATE' });

    expect(addWin).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledWith(2, 'CRANE');
    expect(addLoss).toHaveBeenCalledTimes(1);
    expect(addLoss).toHaveBeenCalledWith('SLATE');
  });

  it('deletes partial game on win', () => {
    const deletePartialGame = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook<void, HookProps>(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          deletePartialGame,
          addWin: vi.fn().mockResolvedValue(undefined),
          addLoss: vi.fn().mockResolvedValue(undefined),
        }),
      {
        initialProps: {
          gameState: GAME_STATE.PLAYING,
          guessCount: 0,
          solution: 'CRANE',
        },
      },
    );

    rerender({ gameState: GAME_STATE.WON, guessCount: 3, solution: 'CRANE' });

    expect(deletePartialGame).toHaveBeenCalledTimes(1);
  });

  it('deletes partial game on loss', () => {
    const deletePartialGame = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook<void, HookProps>(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          deletePartialGame,
          addWin: vi.fn().mockResolvedValue(undefined),
          addLoss: vi.fn().mockResolvedValue(undefined),
        }),
      {
        initialProps: {
          gameState: GAME_STATE.PLAYING,
          guessCount: 0,
          solution: 'CRANE',
        },
      },
    );

    rerender({ gameState: GAME_STATE.LOST, guessCount: 6, solution: 'CRANE' });

    expect(deletePartialGame).toHaveBeenCalledTimes(1);
  });
});

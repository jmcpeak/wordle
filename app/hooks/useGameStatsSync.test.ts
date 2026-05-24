import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GAME_STATE } from '@/constants';
import { useGameStatsSync } from '@/hooks/useGameStatsSync';
import * as gameActions from '@/store/gameActions';

vi.spyOn(gameActions, 'deletePartialGameOnServer').mockImplementation(() => {});

describe('useGameStatsSync', () => {
  it('records a win once and clears messages', async () => {
    const clearMessage = vi.fn();
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          clearMessage,
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

    expect(clearMessage).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledTimes(1);
    expect(addWin).toHaveBeenCalledWith(3, 'CRANE');
    expect(addLoss).not.toHaveBeenCalled();
  });

  it('resets after a new round and can record another result', () => {
    const clearMessage = vi.fn();
    const addWin = vi.fn().mockResolvedValue(undefined);
    const addLoss = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          clearMessage,
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
    expect(clearMessage).toHaveBeenCalledTimes(2);
  });

  it('deletes partial game on win', () => {
    const deletePartialSpy = vi.mocked(gameActions.deletePartialGameOnServer);
    deletePartialSpy.mockClear();

    const { rerender } = renderHook(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          clearMessage: vi.fn(),
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

    expect(deletePartialSpy).toHaveBeenCalledTimes(1);
  });

  it('deletes partial game on loss', () => {
    const deletePartialSpy = vi.mocked(gameActions.deletePartialGameOnServer);
    deletePartialSpy.mockClear();

    const { rerender } = renderHook(
      ({ gameState, guessCount, solution }) =>
        useGameStatsSync({
          gameState,
          guessCount,
          solution,
          clearMessage: vi.fn(),
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

    expect(deletePartialSpy).toHaveBeenCalledTimes(1);
  });
});

'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import { GAME_STATE } from '@/constants';
import type { GameState } from '@/types';

type UseGameStatsSyncOptions = {
  gameState: GameState;
  guessCount: number;
  solution: string;
  deletePartialGame: () => Promise<void>;
  addWin: (guessCount: number, word: string) => Promise<void>;
  addLoss: (word: string) => Promise<void>;
};

export function useGameStatsSync({
  gameState,
  guessCount,
  solution,
  deletePartialGame,
  addWin,
  addLoss,
}: UseGameStatsSyncOptions) {
  const statsUpdatedRef = useRef(false);

  const syncOutcome = useEffectEvent((won: boolean) => {
    void deletePartialGame();

    if (won) {
      addWin(guessCount, solution).catch((error) =>
        console.error('Failed to update win stats:', error),
      );
      return;
    }

    addLoss(solution).catch((error) =>
      console.error('Failed to update loss stats:', error),
    );
  });

  useEffect(() => {
    const gameOver =
      gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;

    if (!gameOver) {
      statsUpdatedRef.current = false;
      return;
    }

    if (statsUpdatedRef.current) return;

    statsUpdatedRef.current = true;
    syncOutcome(gameState === GAME_STATE.WON);
  }, [gameState]);
}

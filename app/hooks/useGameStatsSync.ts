'use client';

import { useEffect, useRef } from 'react';
import { GAME_STATE } from '@/constants';
import { deletePartialGameOnServer } from '@/store/gameActions';
import type { GameState } from '@/types';

type UseGameStatsSyncOptions = {
  gameState: GameState;
  guessCount: number;
  clearMessage: () => void;
  addWin: (guessCount: number) => Promise<void>;
  addLoss: () => Promise<void>;
};

export function useGameStatsSync({
  gameState,
  guessCount,
  clearMessage,
  addWin,
  addLoss,
}: UseGameStatsSyncOptions) {
  const statsUpdatedRef = useRef(false);

  useEffect(() => {
    const gameOver =
      gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;

    if (!gameOver) {
      statsUpdatedRef.current = false;
      return;
    }

    if (statsUpdatedRef.current) return;

    statsUpdatedRef.current = true;
    clearMessage();
    deletePartialGameOnServer();

    if (gameState === GAME_STATE.WON) {
      addWin(guessCount).catch((error) =>
        console.error('Failed to update win stats:', error),
      );
      return;
    }

    addLoss().catch((error) =>
      console.error('Failed to update loss stats:', error),
    );
  }, [gameState, guessCount, addWin, addLoss, clearMessage]);
}

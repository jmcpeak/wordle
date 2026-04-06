'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  LOSS_PHASE2_DELAY_MS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import type { GameState } from '@/types';

export type RestartPhase = 'idle' | 'showButton' | 'exiting' | 'restarting';

type UseGameRestartFlowOptions = {
  gameState: GameState;
  onRestart: () => void;
};

export function useGameRestartFlow({
  gameState,
  onRestart,
}: UseGameRestartFlowOptions) {
  const [restartPhase, setRestartPhase] = useState<RestartPhase>('idle');

  useEffect(() => {
    if (gameState === GAME_STATE.WON) {
      setRestartPhase('idle');
      const timeoutId = setTimeout(
        () => setRestartPhase('showButton'),
        WIN_ANIMATION_DURATION_MS,
      );
      return () => clearTimeout(timeoutId);
    }
    if (gameState === GAME_STATE.LOST) {
      setRestartPhase('idle');
      const timeoutId = setTimeout(
        () => setRestartPhase('showButton'),
        LOSS_ANIMATION_DURATION_MS,
      );
      return () => clearTimeout(timeoutId);
    }
    setRestartPhase('idle');
  }, [gameState]);

  const startRestartExit = useCallback(() => {
    setRestartPhase('exiting');
  }, []);

  const markRestarting = useCallback(() => {
    setRestartPhase('restarting');
  }, []);

  useEffect(() => {
    if (restartPhase !== 'restarting') return;
    const timeoutId = setTimeout(() => {
      onRestart();
      setRestartPhase('idle');
    }, LOSS_PHASE2_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [restartPhase, onRestart]);

  return {
    restartPhase,
    startRestartExit,
    markRestarting,
  };
}

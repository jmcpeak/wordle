'use client';

import { useEffect, useState } from 'react';
import { LOSS_PHASE2_DELAY_MS } from '@/constants';
import type { LossPhase } from '@/utils/guessGridLossCells';

export function useLossPhase(isLost: boolean): LossPhase {
  const [lossPhase, setLossPhase] = useState<LossPhase>('flipToEmpty');

  useEffect(() => {
    if (!isLost) {
      setLossPhase('flipToEmpty');
      return;
    }
    setLossPhase('flipToEmpty');
    const timeoutId = setTimeout(() => {
      setLossPhase('flipToSolution');
    }, LOSS_PHASE2_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isLost]);

  return lossPhase;
}

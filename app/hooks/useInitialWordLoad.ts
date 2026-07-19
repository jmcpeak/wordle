'use client';

import { useEffect, useRef } from 'react';
import type { InitialGameSeed } from '@/types';

const LOAD_OFFLINE_TIMEOUT_MS = 8 * 1000;

type UseInitialWordLoadOptions = {
  fetchWord: (seed?: InitialGameSeed) => Promise<void>;
  initialGame?: InitialGameSeed;
};

export function useInitialWordLoad({
  fetchWord,
  initialGame,
}: UseInitialWordLoadOptions) {
  // Capture RSC seed for the mount-once load; avoid re-fetching if the prop identity changes.
  const seedRef = useRef(initialGame);
  seedRef.current = initialGame;

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        window.location.href = '/~offline';
      }
    }, LOAD_OFFLINE_TIMEOUT_MS);

    fetchWord(seedRef.current).finally(() => {
      if (!cancelled) clearTimeout(timeoutId);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchWord]);
}

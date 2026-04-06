'use client';

import { useEffect } from 'react';

const LOAD_OFFLINE_TIMEOUT_MS = 90 * 1000;

type UseInitialWordLoadOptions = {
  fetchWord: () => Promise<void>;
};

export function useInitialWordLoad({ fetchWord }: UseInitialWordLoadOptions) {
  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        window.location.href = '/~offline';
      }
    }, LOAD_OFFLINE_TIMEOUT_MS);

    fetchWord().finally(() => {
      if (!cancelled) clearTimeout(timeoutId);
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchWord]);
}

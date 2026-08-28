'use client';

import { useEffect } from 'react';

const LOAD_OFFLINE_TIMEOUT_MS = 8 * 1000;

type UseInitialWordLoadOptions = {
  fetchWord: () => Promise<void>;
  /** Skip the fetch until auth (or anything else) is ready. */
  enabled?: boolean;
};

export function useInitialWordLoad({
  fetchWord,
  enabled = true,
}: UseInitialWordLoadOptions) {
  useEffect(() => {
    if (!enabled) return;

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
  }, [fetchWord, enabled]);
}

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SHAKE_DURATION_MS } from '@/constants';

/**
 * Drives the invalid-guess shake.
 *
 * `shakeToken` increments on every trigger (0 = not shaking). Consumers key the
 * CSS animation off the token's parity so a second shake inside the window
 * restarts the animation — a plain boolean stays `true` and the row sits still.
 */
export function useShake(durationMs = SHAKE_DURATION_MS) {
  const [shakeToken, setShakeToken] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShakeToken((token) => token + 1);
    timeoutRef.current = setTimeout(() => {
      setShakeToken(0);
      timeoutRef.current = null;
    }, durationMs);
  }, [durationMs]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  return { shakeToken, triggerShake };
}

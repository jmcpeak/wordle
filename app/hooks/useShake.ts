'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useShake(durationMs = 500) {
  const [shake, setShake] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerShake = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShake(true);
    timeoutRef.current = setTimeout(() => {
      setShake(false);
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

  return { shake, triggerShake };
}

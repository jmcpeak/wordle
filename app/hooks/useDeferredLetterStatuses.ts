'use client';

import { useEffect, useRef, useState } from 'react';
import { getRevealColorSwapDelayMs } from '@/constants';
import type { LetterStatus } from '@/types';
import {
  checkGuess,
  promoteLetterStatus,
  rebuildLetterStatuses,
} from '@/utils/gameLogic';

function clearTimeouts(timers: ReturnType<typeof setTimeout>[]) {
  for (const timer of timers) {
    clearTimeout(timer);
  }
}

/**
 * Defers keyboard letter-status coloring so each key updates when its matching
 * tile flips to its status color, not when the store commits the guess.
 */
export function useDeferredLetterStatuses(
  letterStatuses: Record<string, LetterStatus>,
  guesses: string[],
  solution: string,
): Record<string, LetterStatus> {
  const [displayed, setDisplayed] = useState(letterStatuses);
  const prevGuessCount = useRef(guesses.length);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    // Restart / cleared game — reset immediately.
    if (guesses.length === 0 && Object.keys(letterStatuses).length === 0) {
      clearTimeouts(timersRef.current);
      timersRef.current = [];
      setDisplayed({});
      prevGuessCount.current = 0;
      return;
    }

    // New guess submitted — seed prior statuses, then promote per letter on flip mid-point.
    if (guesses.length > prevGuessCount.current) {
      const latestGuess = guesses[guesses.length - 1];
      if (!latestGuess) {
        prevGuessCount.current = guesses.length;
        return;
      }

      clearTimeouts(timersRef.current);
      timersRef.current = [];
      const priorStatuses = rebuildLetterStatuses(
        guesses.slice(0, -1),
        solution,
      );
      setDisplayed(priorStatuses);
      prevGuessCount.current = guesses.length;

      const guessStatuses = checkGuess(latestGuess, solution);
      const working: Record<string, LetterStatus> = { ...priorStatuses };
      const targetStatuses = letterStatuses;

      for (let i = 0; i < latestGuess.length; i++) {
        const letter = latestGuess[i];
        const incoming = guessStatuses[i];
        if (!letter || !incoming) continue;

        const isLast = i === latestGuess.length - 1;
        const timer = setTimeout(() => {
          working[letter] = promoteLetterStatus(working[letter], incoming);
          // Snap to store map on the last letter so display stays in sync.
          setDisplayed(isLast ? targetStatuses : { ...working });
          if (isLast) {
            timersRef.current = [];
          }
        }, getRevealColorSwapDelayMs(i));
        timersRef.current.push(timer);
      }

      return () => {
        clearTimeouts(timersRef.current);
        timersRef.current = [];
      };
    }

    // Initial mount, restore, or non-reveal updates — show store statuses.
    if (timersRef.current.length === 0) {
      setDisplayed(letterStatuses);
    }
    prevGuessCount.current = guesses.length;
  }, [letterStatuses, guesses, solution]);

  useEffect(
    () => () => {
      clearTimeouts(timersRef.current);
      timersRef.current = [];
    },
    [],
  );

  return displayed;
}

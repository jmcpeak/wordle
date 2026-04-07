import { WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';

/**
 * Promote a single letter's status using correct > present > absent precedence.
 * Returns the new status for the letter.
 */
export function promoteLetterStatus(
  current: LetterStatus | undefined,
  incoming: LetterStatus,
): LetterStatus {
  if (incoming === 'correct') return 'correct';
  if (incoming === 'present' && current !== 'correct') return 'present';
  if (incoming === 'absent' && current !== 'correct' && current !== 'present')
    return 'absent';
  return current ?? 'empty';
}

/**
 * Accumulate a single guess's statuses into an existing letter-status map (mutates in place).
 */
export function accumulateGuessStatuses(
  letterStatuses: Record<string, LetterStatus>,
  guess: string,
  guessStatuses: LetterStatus[],
): void {
  guess.split('').forEach((letter, i) => {
    const incoming = guessStatuses[i];
    if (incoming) {
      letterStatuses[letter] = promoteLetterStatus(
        letterStatuses[letter],
        incoming,
      );
    }
  });
}

/**
 * Replay a list of guesses against a solution to reconstruct the cumulative
 * keyboard letter-status map (the same logic used in handleInput after each guess).
 */
export function rebuildLetterStatuses(
  guesses: string[],
  solution: string,
): Record<string, LetterStatus> {
  const letterStatuses: Record<string, LetterStatus> = {};
  for (const guess of guesses) {
    accumulateGuessStatuses(letterStatuses, guess, checkGuess(guess, solution));
  }
  return letterStatuses;
}

export function checkGuess(guess: string, solution: string): LetterStatus[] {
  const statuses: LetterStatus[] = Array.from(
    { length: WORD_LENGTH },
    (): LetterStatus => 'absent',
  );
  const solutionLetterCounts: Record<string, number> = {};

  // Count letters in the solution
  for (const char of solution) {
    solutionLetterCounts[char] = (solutionLetterCounts[char] ?? 0) + 1;
  }

  // First pass: check for correct letters (i is in range 0..WORD_LENGTH-1)
  for (let i = 0; i < WORD_LENGTH; i++) {
    const g = guess[i];
    const s = solution[i];
    if (g !== undefined && s !== undefined && g === s) {
      statuses[i] = 'correct';
      solutionLetterCounts[g] = (solutionLetterCounts[g] ?? 0) - 1;
    }
  }

  // Second pass: check for present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    const g = guess[i];
    if (g === undefined) continue;
    const status = statuses[i];
    if (status !== 'correct' && (solutionLetterCounts[g] ?? 0) > 0) {
      statuses[i] = 'present';
      solutionLetterCounts[g] = (solutionLetterCounts[g] ?? 0) - 1;
    }
  }

  return statuses;
}

import { WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';

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
    const statuses = checkGuess(guess, solution);
    guess.split('').forEach((letter, i) => {
      const status = statuses[i];
      const current = letterStatuses[letter];
      if (status === 'correct') {
        letterStatuses[letter] = 'correct';
      } else if (status === 'present' && current !== 'correct') {
        letterStatuses[letter] = 'present';
      } else if (
        status === 'absent' &&
        current !== 'correct' &&
        current !== 'present'
      ) {
        letterStatuses[letter] = 'absent';
      }
    });
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

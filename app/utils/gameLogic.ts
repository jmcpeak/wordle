import { WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';

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

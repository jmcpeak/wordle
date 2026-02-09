import { WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';

export function checkGuess(guess: string, solution: string): LetterStatus[] {
  const statuses: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
  const solutionLetterCounts: Record<string, number> = {};

  // Count letters in the solution
  for (const char of solution) {
    solutionLetterCounts[char] = (solutionLetterCounts[char] || 0) + 1;
  }

  // First pass: check for correct letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === solution[i]) {
      statuses[i] = 'correct';
      solutionLetterCounts[guess[i]]--;
    }
  }

  // Second pass: check for present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (statuses[i] !== 'correct' && (solutionLetterCounts[guess[i]] || 0) > 0) {
      statuses[i] = 'present';
      solutionLetterCounts[guess[i]]--;
    }
  }

  return statuses;
}

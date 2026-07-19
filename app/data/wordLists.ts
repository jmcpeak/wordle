import { all } from './wordle-allowed.mjs';
import { answers } from './wordle-answers.mjs';

const solutionsUpper = answers.map((w) => w.toUpperCase());

let allowedGuessesSet: Set<string> | null = null;

/** All acceptable guesses (solutions ∪ additional guess words), uppercase. */
export function getAllowedGuessesSet(): Set<string> {
  if (!allowedGuessesSet) {
    allowedGuessesSet = new Set(all.map((w) => w.toUpperCase()));
  }
  return allowedGuessesSet;
}

/**
 * Unbiased index in `[0, max)` using Web Crypto (Node + Edge).
 */
function randomIndex(max: number): number {
  if (max <= 0) throw new Error('wordlist: empty solutions');
  const maxUnbiased = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let x = 0;
  do {
    crypto.getRandomValues(buf);
    x = buf[0] ?? 0;
  } while (x >= maxUnbiased);
  return x % max;
}

/** Random solution for a new game (no external network). */
export function pickRandomSolution(): string {
  const word = solutionsUpper[randomIndex(solutionsUpper.length)];
  if (!word) {
    throw new Error('wordlist: empty solutions');
  }
  return word;
}

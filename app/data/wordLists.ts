import { randomInt } from 'node:crypto';
import { all, answers } from './wordle-words.mjs';

const solutionsUpper = answers.map((w) => w.toUpperCase());

let allowedGuessesSet: Set<string> | null = null;

/** All acceptable guesses (solutions ∪ additional guess words), uppercase. */
export function getAllowedGuessesSet(): Set<string> {
  if (!allowedGuessesSet) {
    allowedGuessesSet = new Set(all.map((w) => w.toUpperCase()));
  }
  return allowedGuessesSet;
}

/** Random solution for a new game (no external network). */
export function pickRandomSolution(): string {
  const i = randomInt(0, solutionsUpper.length);
  const word = solutionsUpper[i];
  if (!word) {
    throw new Error('wordlist: empty solutions');
  }
  return word;
}

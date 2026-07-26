import {
  SPLIT_FLAP_RANDOM_CLEAR_MAX_STEPS,
  SPLIT_FLAP_RANDOM_CLEAR_MIN_STEPS,
  WIN_COUNT_UP_STEPS,
} from '@/constants';

/** Alphabet order on the drum (blank is adjacent just before A / after Z). */
export const SPLIT_FLAP_DRUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function pickRandomLetterExcluding(
  exclude: string,
  random: () => number,
): string {
  const candidates = SPLIT_FLAP_DRUM.replace(exclude, '');
  const index = Math.floor(random() * candidates.length);
  return candidates[index] ?? 'A';
}

/**
 * Landing sequence from the current letter to clear via the shorter direction:
 * - Down toward A then blank: C → B → A → clear
 * - Up toward Z then blank:   W → X → Y → Z → clear
 */
export function getSplitFlapClearPath(letter: string): string[] {
  const ch = letter.trim().toUpperCase();
  if (!ch) return [];

  const letterIndex = SPLIT_FLAP_DRUM.indexOf(ch);
  if (letterIndex < 0) {
    return [''];
  }

  /** C(2) → B, A, clear = 3 folds */
  const stepsDownToClear = letterIndex + 1;
  /** C(2) → D…Z, clear = 24 folds */
  const stepsUpToClear = SPLIT_FLAP_DRUM.length - letterIndex;

  if (stepsDownToClear <= stepsUpToClear) {
    const path: string[] = [];
    for (let i = letterIndex - 1; i >= 0; i -= 1) {
      const step = SPLIT_FLAP_DRUM[i];
      if (step != null) path.push(step);
    }
    path.push('');
    return path;
  }

  const path: string[] = [];
  for (let i = letterIndex + 1; i < SPLIT_FLAP_DRUM.length; i += 1) {
    const step = SPLIT_FLAP_DRUM[i];
    if (step != null) path.push(step);
  }
  path.push('');
  return path;
}

export function getSplitFlapClearStepCount(letter: string): number {
  return getSplitFlapClearPath(letter).length;
}

/**
 * Play Again clear: random 2–4 flips from the current letter to blank.
 * Intermediate landings are random A–Z (not alphabetical neighbors).
 * Example: 'D' with 3 flips → ['Y', 'P', ''] (D → Y → P → blank).
 *
 * `random` returns [0, 1) and is injectable for tests.
 */
export function getSplitFlapRandomClearPath(
  letter: string,
  random: () => number = Math.random,
): string[] {
  const ch = letter.trim().toUpperCase();
  if (!ch) return [];

  if (SPLIT_FLAP_DRUM.indexOf(ch) < 0) {
    return [''];
  }

  const span =
    SPLIT_FLAP_RANDOM_CLEAR_MAX_STEPS - SPLIT_FLAP_RANDOM_CLEAR_MIN_STEPS + 1;
  const flipCount =
    SPLIT_FLAP_RANDOM_CLEAR_MIN_STEPS + Math.floor(random() * span);

  const path: string[] = [];
  let current = ch;
  for (let i = 0; i < flipCount - 1; i += 1) {
    const next = pickRandomLetterExcluding(current, random);
    path.push(next);
    current = next;
  }
  path.push('');
  return path;
}

/**
 * Landing sequence from clear to the target letter — reverse of the clear path.
 * Example: 'C' → ['A', 'B', 'C']; 'A' → ['A']; 'W' → ['Z', 'Y', 'X', 'W'].
 *
 * When `maxSteps` is set (e.g. 2 while the user types ahead), keep only the
 * last N landings so the tile does one short hop then lands on the letter.
 */
export function getSplitFlapRevealPath(
  letter: string,
  maxSteps?: number,
): string[] {
  const ch = letter.trim().toUpperCase();
  if (!ch) return [];

  const clearPath = getSplitFlapClearPath(ch);
  const intermediates = clearPath.filter((step) => step !== '');
  const full = [...intermediates.reverse(), ch];
  if (maxSteps == null || full.length <= maxSteps) return full;
  return full.slice(-maxSteps);
}

/** Letter enter: clear → letter → letter (instant land + clack). */
export function getSplitFlapLetterEnterPath(letter: string): string[] {
  const ch = letter.trim().toUpperCase();
  if (!ch) return [];
  return [ch, ch];
}

/**
 * Win count-up settle: last N landings of the approach drum.
 * Example: 'C' with 3 steps → ['A', 'B', 'C'].
 */
export function getSplitFlapCountUpPath(
  letter: string,
  steps: number = WIN_COUNT_UP_STEPS,
): string[] {
  return getSplitFlapRevealPath(letter, steps);
}

/**
 * Character shown before the first count-up fold.
 * Blank when the path starts at the clear-side edge (e.g. A → A).
 */
export function getSplitFlapCountUpStartChar(
  letter: string,
  steps: number = WIN_COUNT_UP_STEPS,
): string {
  const path = getSplitFlapCountUpPath(letter, steps);
  if (path.length === 0) return '';

  const fullPath = getSplitFlapRevealPath(letter);
  const firstLanding = path[0];
  if (firstLanding == null) return '';

  const indexInFull = fullPath.indexOf(firstLanding);
  if (indexInFull <= 0) return '';
  return fullPath[indexInFull - 1] ?? '';
}

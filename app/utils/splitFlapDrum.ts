/** Alphabet order on the drum (blank is adjacent just before A / after Z). */
export const SPLIT_FLAP_DRUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

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
      path.push(SPLIT_FLAP_DRUM[i]);
    }
    path.push('');
    return path;
  }

  const path: string[] = [];
  for (let i = letterIndex + 1; i < SPLIT_FLAP_DRUM.length; i += 1) {
    path.push(SPLIT_FLAP_DRUM[i]);
  }
  path.push('');
  return path;
}

export function getSplitFlapClearStepCount(letter: string): number {
  return getSplitFlapClearPath(letter).length;
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

/**
 * One-landing win shutter fold: same letter, one mid-seam clack.
 * Used in sync across the whole winning row.
 * Example: 'C' → ['C'] (start C → land C).
 */
export function getSplitFlapShutterPath(letter: string): string[] {
  const ch = letter.trim().toUpperCase();
  if (!ch) return [];
  if (SPLIT_FLAP_DRUM.indexOf(ch) < 0) return [];
  return [ch];
}

import { describe, expect, it } from 'vitest';
import {
  SPLIT_FLAP_MAX_CLEAR_STEPS,
  SPLIT_FLAP_RANDOM_CLEAR_MAX_STEPS,
  SPLIT_FLAP_RANDOM_CLEAR_MIN_STEPS,
} from '@/constants';
import {
  getSplitFlapClearPath,
  getSplitFlapClearStepCount,
  getSplitFlapCountUpPath,
  getSplitFlapCountUpStartChar,
  getSplitFlapLetterEnterPath,
  getSplitFlapRandomClearPath,
  getSplitFlapRevealPath,
  SPLIT_FLAP_DRUM,
} from '@/utils/splitFlapDrum';

function randomFromSequence(values: number[]): () => number {
  let i = 0;
  return () => {
    const value = values[i] ?? 0;
    i += 1;
    return value;
  };
}

describe('getSplitFlapClearPath', () => {
  it('clears A in one step down to blank', () => {
    expect(getSplitFlapClearPath('A')).toEqual(['']);
  });

  it('clears B as B → A → clear', () => {
    expect(getSplitFlapClearPath('B')).toEqual(['A', '']);
  });

  it('clears C as C → B → A → clear (not C → D → E)', () => {
    expect(getSplitFlapClearPath('C')).toEqual(['B', 'A', '']);
    expect(getSplitFlapClearPath('C')).not.toEqual(
      expect.arrayContaining(['D', 'E']),
    );
    expect(getSplitFlapClearPath('C')[0]).toBe('B');
  });

  it('clears W upward when that is shorter', () => {
    expect(getSplitFlapClearPath('W')).toEqual(['X', 'Y', 'Z', '']);
  });

  it('clears Z in one step up to blank', () => {
    expect(getSplitFlapClearPath('Z')).toEqual(['']);
  });

  it('never exceeds SPLIT_FLAP_MAX_CLEAR_STEPS', () => {
    for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
      expect(getSplitFlapClearStepCount(ch)).toBeLessThanOrEqual(
        SPLIT_FLAP_MAX_CLEAR_STEPS,
      );
    }
  });

  it('returns an empty path when already clear', () => {
    expect(getSplitFlapClearPath('')).toEqual([]);
  });
});

describe('getSplitFlapRandomClearPath', () => {
  it('returns an empty path when already clear', () => {
    expect(getSplitFlapRandomClearPath('')).toEqual([]);
  });

  it('clears D as D → Y → P → blank for a fixed random sequence', () => {
    // flipCount 3, then Y (excl. D), then P (excl. Y)
    const random = randomFromSequence([0.5, 0.93, 0.61]);
    expect(getSplitFlapRandomClearPath('D', random)).toEqual(['Y', 'P', '']);
  });

  it('uses 2–4 flips ending in blank with random A–Z intermediates', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      let n = seed * 0.17;
      const random = () => {
        n = (n * 1.7 + 0.13) % 1;
        return n;
      };
      const path = getSplitFlapRandomClearPath('M', random);
      expect(path.length).toBeGreaterThanOrEqual(
        SPLIT_FLAP_RANDOM_CLEAR_MIN_STEPS,
      );
      expect(path.length).toBeLessThanOrEqual(
        SPLIT_FLAP_RANDOM_CLEAR_MAX_STEPS,
      );
      expect(path.at(-1)).toBe('');
      const intermediates = path.slice(0, -1);
      let previous = 'M';
      for (const step of intermediates) {
        expect(SPLIT_FLAP_DRUM).toContain(step);
        expect(step).not.toBe(previous);
        previous = step;
      }
    }
  });
});

describe('getSplitFlapRevealPath', () => {
  it('reveals A in one step from clear', () => {
    expect(getSplitFlapRevealPath('A')).toEqual(['A']);
  });

  it('reveals C as clear → A → B → C', () => {
    expect(getSplitFlapRevealPath('C')).toEqual(['A', 'B', 'C']);
  });

  it('reveals W as the reverse of its clear path', () => {
    expect(getSplitFlapRevealPath('W')).toEqual(['Z', 'Y', 'X', 'W']);
  });

  it('reveals T via Z (shorter) not via A', () => {
    expect(getSplitFlapRevealPath('T')).toEqual([
      'Z',
      'Y',
      'X',
      'W',
      'V',
      'U',
      'T',
    ]);
  });

  it('caps reveal path when maxSteps is set (rush typing)', () => {
    expect(getSplitFlapRevealPath('C', 2)).toEqual(['B', 'C']);
    expect(getSplitFlapRevealPath('T', 2)).toEqual(['U', 'T']);
    expect(getSplitFlapRevealPath('A', 2)).toEqual(['A']);
  });
});

describe('getSplitFlapLetterEnterPath', () => {
  it('enters D as D → D', () => {
    expect(getSplitFlapLetterEnterPath('D')).toEqual(['D', 'D']);
  });

  it('returns an empty path when clear', () => {
    expect(getSplitFlapLetterEnterPath('')).toEqual([]);
  });
});

describe('getSplitFlapCountUpPath', () => {
  it('counts up C as A → B → C', () => {
    expect(getSplitFlapCountUpPath('C')).toEqual(['A', 'B', 'C']);
  });

  it('counts up A as A only', () => {
    expect(getSplitFlapCountUpPath('A')).toEqual(['A']);
  });

  it('counts up W with last three Z-side landings', () => {
    expect(getSplitFlapCountUpPath('W')).toEqual(['Y', 'X', 'W']);
  });

  it('returns an empty path when clear', () => {
    expect(getSplitFlapCountUpPath('')).toEqual([]);
  });
});

describe('getSplitFlapCountUpStartChar', () => {
  it('starts C count-up from clear', () => {
    expect(getSplitFlapCountUpStartChar('C')).toBe('');
  });

  it('starts A count-up from clear', () => {
    expect(getSplitFlapCountUpStartChar('A')).toBe('');
  });

  it('starts W count-up from Z', () => {
    expect(getSplitFlapCountUpStartChar('W')).toBe('Z');
  });

  it('starts E count-up from B (display idle is still E)', () => {
    expect(getSplitFlapCountUpStartChar('E')).toBe('B');
  });
});

import { describe, expect, it } from 'vitest';
import { SPLIT_FLAP_MAX_CLEAR_STEPS } from '@/constants';
import {
  getSplitFlapClearPath,
  getSplitFlapClearStepCount,
  getSplitFlapRevealPath,
  getSplitFlapShutterPath,
} from '@/utils/splitFlapDrum';

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

describe('getSplitFlapShutterPath', () => {
  it('shutters C with one fold onto C', () => {
    expect(getSplitFlapShutterPath('C')).toEqual(['C']);
  });

  it('shutters A with one fold onto A', () => {
    expect(getSplitFlapShutterPath('A')).toEqual(['A']);
  });

  it('returns an empty path when clear', () => {
    expect(getSplitFlapShutterPath('')).toEqual([]);
  });
});

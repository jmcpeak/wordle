import { describe, expect, it } from 'vitest';
import { createLossRevealRows } from '@/utils/guessGridLossCells';

describe('createLossRevealRows', () => {
  it('centers short words in a 5-cell row', () => {
    const rows = createLossRevealRows('THE', 'WORD', 'WAS');
    expect(rows.the).toEqual(['', 'T', 'H', 'E', '']);
    expect(rows.word).toEqual(['W', 'O', 'R', 'D', '']);
    expect(rows.was).toEqual(['', 'W', 'A', 'S', '']);
  });

  it('preserves non-Latin letters and strips spaces', () => {
    const rows = createLossRevealRows('這 是', '單字', '是');
    expect(rows.the).toEqual(['', '這', '是', '', '']);
    expect(rows.word).toEqual(['', '單', '字', '', '']);
    expect(rows.was).toEqual(['', '', '是', '', '']);
  });
});

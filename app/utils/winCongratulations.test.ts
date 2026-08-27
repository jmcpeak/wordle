import { describe, expect, it } from 'vitest';
import { EN_US_FALLBACK_TRANSLATIONS } from '@/store/enUsFallbackTranslations';
import { getWinCongratulationsMessage } from '@/utils/winCongratulations';

describe('getWinCongratulationsMessage', () => {
  it.each([
    [1, 'Genius!'],
    [2, 'Magnificent!'],
    [3, 'Impressive!'],
    [4, 'Splendid!'],
    [5, 'Great!'],
    [6, 'Phew!'],
  ] as const)('returns the copy for %i guesses', (guessCount, message) => {
    expect(getWinCongratulationsMessage(guessCount)).toBe(message);
    expect(EN_US_FALLBACK_TRANSLATIONS[`message.win.${guessCount}`]).toBe(
      message,
    );
  });

  it('clamps out-of-range guess counts', () => {
    expect(getWinCongratulationsMessage(0)).toBe('Genius!');
    expect(getWinCongratulationsMessage(7)).toBe('Phew!');
  });
});

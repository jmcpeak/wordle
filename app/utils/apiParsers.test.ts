import { describe, expect, it } from 'vitest';
import {
  parsePartialGameResponse,
  parseValidateResponse,
  parseWordResponse,
} from '@/utils/apiParsers';

describe('parsePartialGameResponse', () => {
  it('accepts a well-formed in-progress game', () => {
    const parsed = parsePartialGameResponse({
      game: { solution: 'CRANE', guesses: ['SLATE', 'BRINE'] },
    });

    expect(parsed).toEqual({
      game: { solution: 'CRANE', guesses: ['SLATE', 'BRINE'] },
    });
  });

  it('rejects a guesses array containing non-strings', () => {
    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: ['SLATE', 42] },
      }),
    ).toBeNull();

    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: [null] },
      }),
    ).toBeNull();

    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: [{ guess: 'SLATE' }] },
      }),
    ).toBeNull();
  });

  it('rejects malformed or already-completed partial games', () => {
    expect(
      parsePartialGameResponse({
        game: { solution: 'crane', guesses: ['SLATE'] },
      }),
    ).toBeNull();
    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: ['TOO'] },
      }),
    ).toBeNull();
    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: ['SLATE', 'SLATE'] },
      }),
    ).toBeNull();
    expect(
      parsePartialGameResponse({
        game: { solution: 'CRANE', guesses: ['SLATE', 'CRANE'] },
      }),
    ).toBeNull();
    expect(
      parsePartialGameResponse({
        game: {
          solution: 'CRANE',
          guesses: ['SLATE', 'BRINE', 'APPLE', 'WORDS', 'MUSIC', 'DANCE'],
        },
      }),
    ).toBeNull();
  });

  it('returns null for a missing or empty game', () => {
    expect(parsePartialGameResponse({ game: null })).toEqual({ game: null });
    expect(parsePartialGameResponse({})).toBeNull();
    expect(parsePartialGameResponse(undefined)).toBeNull();
    expect(
      parsePartialGameResponse({ game: { solution: 'CRANE', guesses: [] } }),
    ).toBeNull();
  });
});

describe('parseWordResponse', () => {
  it('accepts an uppercase word of the configured length', () => {
    expect(parseWordResponse({ word: 'CRANE' })).toEqual({ word: 'CRANE' });
  });

  it('rejects malformed payloads', () => {
    expect(parseWordResponse({ word: '' })).toBeNull();
    expect(parseWordResponse({ word: 'TOO' })).toBeNull();
    expect(parseWordResponse({ word: 'crane' })).toBeNull();
    expect(parseWordResponse({ word: 'CRAN3' })).toBeNull();
    expect(parseWordResponse({ word: 5 })).toBeNull();
    expect(parseWordResponse(null)).toBeNull();
  });
});

describe('parseValidateResponse', () => {
  it('only treats a literal true as valid', () => {
    expect(parseValidateResponse({ isValid: true })).toEqual({ isValid: true });
    expect(parseValidateResponse({ isValid: 'true' })).toEqual({
      isValid: false,
    });
    expect(parseValidateResponse({})).toEqual({ isValid: false });
  });
});

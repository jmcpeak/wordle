import { MAX_GUESSES, WORD_LENGTH } from '@/constants';
import type {
  PartialGameApiResponse,
  ValidateApiResponse,
  WordApiResponse,
} from '@/types';

const WORD_RE = new RegExp(`^[A-Z]{${WORD_LENGTH}}$`);

function isWord(value: unknown): value is string {
  return typeof value === 'string' && WORD_RE.test(value);
}

export function parseWordResponse(data: unknown): WordApiResponse | null {
  if (data && typeof data === 'object' && 'word' in data) {
    const w = (data as { word: unknown }).word;
    if (isWord(w)) return { word: w };
  }
  return null;
}

export function parseValidateResponse(data: unknown): ValidateApiResponse {
  if (data && typeof data === 'object' && 'isValid' in data) {
    return { isValid: (data as { isValid: unknown }).isValid === true };
  }
  return { isValid: false };
}

export function parsePartialGameResponse(
  data: unknown,
): PartialGameApiResponse | null {
  if (data && typeof data === 'object' && 'game' in data) {
    const game = (data as { game: unknown }).game;
    if (game === null) return { game: null };
    if (
      game &&
      typeof game === 'object' &&
      'solution' in game &&
      'guesses' in game
    ) {
      const g = game as { solution: unknown; guesses: unknown };
      if (
        isWord(g.solution) &&
        Array.isArray(g.guesses) &&
        g.guesses.length > 0 &&
        g.guesses.length < MAX_GUESSES &&
        g.guesses.every(isWord) &&
        new Set(g.guesses).size === g.guesses.length &&
        !g.guesses.includes(g.solution)
      ) {
        return { game: { solution: g.solution, guesses: g.guesses } };
      }
    }
  }
  return null;
}

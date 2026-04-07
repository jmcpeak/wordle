import type {
  PartialGameApiResponse,
  ValidateApiResponse,
  WordApiResponse,
} from '@/types';

export function parseWordResponse(data: unknown): WordApiResponse | null {
  if (data && typeof data === 'object' && 'word' in data) {
    const w = (data as { word: unknown }).word;
    if (typeof w === 'string' && w.length > 0) return { word: w };
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
    if (
      game &&
      typeof game === 'object' &&
      'solution' in game &&
      'guesses' in game
    ) {
      const g = game as { solution: unknown; guesses: unknown };
      if (
        typeof g.solution === 'string' &&
        g.solution.length > 0 &&
        Array.isArray(g.guesses) &&
        g.guesses.length > 0
      ) {
        return {
          game: { solution: g.solution, guesses: g.guesses as string[] },
        };
      }
    }
  }
  return null;
}

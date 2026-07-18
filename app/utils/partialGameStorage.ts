import { MAX_GUESSES, WORD_LENGTH } from '@/constants';

export const PARTIAL_GAME_STORAGE_KEY = 'wordle-partial-game';

export type StoredPartialGame = {
  solution: string;
  guesses: string[];
};

const WORD_RE = new RegExp(`^[A-Z]{${WORD_LENGTH}}$`);

function isValidGuessList(
  guesses: unknown,
  solution: string,
): guesses is string[] {
  if (!Array.isArray(guesses) || guesses.length > MAX_GUESSES) return false;
  if (guesses.some((g) => typeof g !== 'string' || !WORD_RE.test(g))) {
    return false;
  }
  // A completed win shouldn't linger in storage.
  if (guesses.includes(solution)) return false;
  return true;
}

export function loadPartialGameFromStorage(): StoredPartialGame | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(PARTIAL_GAME_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;

    const { solution, guesses } = parsed as {
      solution?: unknown;
      guesses?: unknown;
    };

    if (typeof solution !== 'string' || !WORD_RE.test(solution)) return null;
    if (!isValidGuessList(guesses, solution)) return null;

    return { solution, guesses };
  } catch {
    return null;
  }
}

export function savePartialGameToStorage(
  solution: string,
  guesses: string[],
): void {
  if (typeof window === 'undefined') return;
  if (!WORD_RE.test(solution) || !isValidGuessList(guesses, solution)) return;

  try {
    const payload: StoredPartialGame = { solution, guesses };
    window.localStorage.setItem(
      PARTIAL_GAME_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Quota / private mode — ignore; server remains source of truth.
  }
}

export function clearPartialGameFromStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PARTIAL_GAME_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** True when local guesses start with the server guesses (offline progress). */
export function localGuessesExtendServer(
  localGuesses: string[],
  serverGuesses: string[],
): boolean {
  if (localGuesses.length <= serverGuesses.length) return false;
  return serverGuesses.every((guess, i) => localGuesses[i] === guess);
}

import type { AlertColor } from '@mui/material';
import type { StoreApi } from 'zustand';
import {
  GAME_STATE,
  MAX_GUESSES,
  PLACEHOLDER_CHAR,
  SUBMISSION_STATUS,
  WORD_LENGTH,
} from '@/constants';
import { t } from '@/store/i18nStore';
import type {
  GameState,
  InitialGameSeed,
  LetterStatus,
  RetryAction,
  SubmissionStatus,
} from '@/types';
import {
  parsePartialGameResponse,
  parseValidateResponse,
  parseWordResponse,
} from '@/utils/apiParsers';
import { fetchJson } from '@/utils/fetchJson';
import {
  accumulateGuessStatuses,
  checkGuess,
  rebuildLetterStatuses,
} from '@/utils/gameLogic';
import {
  clearPartialGameFromStorage,
  loadPartialGameFromStorage,
  localGuessesExtendServer,
  savePartialGameToStorage,
} from '@/utils/partialGameStorage';
import { getWinCongratulationsMessage } from '@/utils/winCongratulations';

function savePartialGame(solution: string, guesses: string[]): void {
  savePartialGameToStorage(solution, guesses);
  fetchJson('/api/partial-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ solution, guesses }),
  }).catch((err) => console.warn('Failed to save partial game:', err));
}

export function deletePartialGameOnServer(): void {
  clearPartialGameFromStorage();
  fetchJson('/api/partial-game', { method: 'DELETE' }).catch((err) =>
    console.warn('Failed to delete partial game:', err),
  );
}

export interface GameSliceState {
  solution: string;
  guesses: string[];
  currentGuess: string;
  gameState: GameState;
  hasInitialized: boolean;
  message: string;
  messageSeverity: AlertColor;
  retryAction: RetryAction;
  letterStatuses: Record<string, LetterStatus>;
  submissionStatus: SubmissionStatus;
  isSubmitting: boolean;
}

export interface GameActions {
  /** Optional RSC seed skips the client partial-game → word waterfall. */
  fetchWord: (seed?: InitialGameSeed) => Promise<void>;
  handleInput: (key: string) => Promise<void>;
  handleRestart: () => void;
  clearMessage: () => void;
}

export type GameStore = GameSliceState & GameActions;

const MAX_FETCH_RETRIES = 10;

function applyPlayingGame(
  set: StoreApi<GameStore>['setState'],
  solution: string,
  guesses: string[],
): void {
  set({
    solution,
    guesses,
    letterStatuses: rebuildLetterStatuses(guesses, solution),
    gameState: GAME_STATE.PLAYING,
    hasInitialized: true,
  });
}

function applyServerSeed(
  set: StoreApi<GameStore>['setState'],
  seed: InitialGameSeed,
): void {
  const cached = loadPartialGameFromStorage();
  let { solution, guesses } = seed;

  if (guesses.length === 0) {
    // Fresh server-picked word — drop any stale local board.
    clearPartialGameFromStorage();
    applyPlayingGame(set, solution, []);
    savePartialGameToStorage(solution, []);
    return;
  }

  // Prefer offline-local progress when it extends the same server game.
  if (
    cached &&
    cached.solution === solution &&
    localGuessesExtendServer(cached.guesses, guesses)
  ) {
    guesses = cached.guesses;
    savePartialGame(solution, guesses);
  } else {
    savePartialGameToStorage(solution, guesses);
  }

  applyPlayingGame(set, solution, guesses);
}

export const createGameActions = (
  set: StoreApi<GameStore>['setState'],
  get: StoreApi<GameStore>['getState'],
): GameActions => ({
  fetchWord: async (seed?: InitialGameSeed) => {
    if (seed?.solution) {
      applyServerSeed(set, seed);
      return;
    }

    const cached = loadPartialGameFromStorage();
    // Only paint early when there are guesses — an empty cached word may be
    // stale after another device finished, so wait for the server in that case.
    const instantCache = cached && cached.guesses.length > 0 ? cached : null;

    if (instantCache) {
      applyPlayingGame(set, instantCache.solution, instantCache.guesses);
    } else {
      set({ gameState: GAME_STATE.LOADING });
    }

    let serverReached = false;

    try {
      const { response, data } = await fetchJson('/api/partial-game');
      if (response.ok) {
        serverReached = true;
        const parsed = parsePartialGameResponse(data);
        if (parsed?.game) {
          let { solution, guesses } = parsed.game;

          // Prefer offline-local progress when it extends the same server game.
          if (
            cached &&
            cached.solution === solution &&
            localGuessesExtendServer(cached.guesses, guesses)
          ) {
            guesses = cached.guesses;
            savePartialGame(solution, guesses);
          } else {
            savePartialGameToStorage(solution, guesses);
          }

          applyPlayingGame(set, solution, guesses);
          return;
        }

        // Server has no in-progress game — drop any stale local copy.
        clearPartialGameFromStorage();
      }
    } catch {
      // Network error — keep / restore the cached game if we have one.
      if (cached) {
        applyPlayingGame(set, cached.solution, cached.guesses);
        return;
      }
    }

    // Offline (or request failed) with a cached game: stay playable.
    if (!serverReached && cached) {
      applyPlayingGame(set, cached.solution, cached.guesses);
      return;
    }

    const wordApiUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/api/word`
        : '/api/word';

    for (let retries = 0; retries < MAX_FETCH_RETRIES; retries++) {
      try {
        const { response: wordResponse, data: wordData } = await fetchJson(
          wordApiUrl,
          { cache: 'no-store' },
        );
        if (!wordResponse.ok) {
          await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
          continue;
        }

        const parsed = parseWordResponse(wordData);

        if (parsed) {
          applyPlayingGame(set, parsed.word, []);
          savePartialGameToStorage(parsed.word, []);
          return;
        }
      } catch (error) {
        const isNetworkError =
          error instanceof TypeError &&
          (error.message === 'Failed to fetch' ||
            error.message.includes('NetworkError'));
        if (isNetworkError && retries < MAX_FETCH_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
          continue;
        }
        console.error('Error fetching word:', error);
        // Don't clobber a board we already painted from cache.
        if (get().hasInitialized && get().solution) return;
        set({
          message: t('message.errorFetching'),
          messageSeverity: 'error',
          retryAction: null,
          gameState: GAME_STATE.ERROR,
        });
        return;
      }
    }

    if (get().hasInitialized && get().solution) return;

    set({
      message: t('message.noValidWord'),
      messageSeverity: 'error',
      retryAction: null,
      gameState: GAME_STATE.ERROR,
    });
  },

  handleRestart: () => {
    deletePartialGameOnServer();
    set({
      solution: '',
      guesses: [],
      currentGuess: '',
      message: '',
      messageSeverity: 'info',
      retryAction: null,
      letterStatuses: {},
      submissionStatus: SUBMISSION_STATUS.IDLE,
      isSubmitting: false,
      gameState: GAME_STATE.LOADING,
      hasInitialized: false,
    });
    get().fetchWord();
  },

  clearMessage: () => {
    set({ message: '', messageSeverity: 'info', retryAction: null });
  },

  handleInput: async (key: string) => {
    const { gameState, currentGuess, solution, guesses, isSubmitting } = get();
    if (gameState !== GAME_STATE.PLAYING) return;

    if (isSubmitting) return;

    set({
      submissionStatus: SUBMISSION_STATUS.IDLE,
      retryAction: null,
    });

    if (key === 'ENTER') {
      if (currentGuess.includes(PLACEHOLDER_CHAR)) {
        set({
          message: t('message.hasPlaceholders'),
          messageSeverity: 'warning',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.ERROR,
        });
        return;
      }

      if (currentGuess.length !== WORD_LENGTH) {
        set({
          message: t('message.notEnoughLetters'),
          messageSeverity: 'warning',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.ERROR,
        });
        return;
      }

      if (guesses.includes(currentGuess)) {
        set({
          message: t('message.alreadyGuessed'),
          messageSeverity: 'warning',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.ERROR,
        });
        return;
      }

      set({ isSubmitting: true });
      try {
        let response: Response;
        let data: unknown;
        try {
          const result = await fetchJson(
            `/api/validate?word=${encodeURIComponent(currentGuess)}`,
            undefined,
            { parseJsonWhenNotOk: true },
          );
          response = result.response;
          data = result.data;
        } catch {
          set({
            message: t('message.couldNotValidateWord'),
            messageSeverity: 'error',
            retryAction: 'submitGuess',
            submissionStatus: SUBMISSION_STATUS.ERROR,
          });
          return;
        }

        const parsed = parseValidateResponse(data);

        if (!response.ok) {
          set({
            message: t('message.couldNotValidateWord'),
            messageSeverity: 'error',
            retryAction: 'submitGuess',
            submissionStatus: SUBMISSION_STATUS.ERROR,
          });
          return;
        }

        if (!parsed.isValid) {
          set({
            message: t('message.notValidWord'),
            messageSeverity: 'warning',
            retryAction: null,
            submissionStatus: SUBMISSION_STATUS.ERROR,
          });
          return;
        }

        const newGuesses = [...guesses, currentGuess];
        const isWin = currentGuess === solution;
        const isLoss = newGuesses.length >= MAX_GUESSES;

        const guessStatuses = checkGuess(currentGuess, solution);
        const newLetterStatuses = { ...get().letterStatuses };
        accumulateGuessStatuses(newLetterStatuses, currentGuess, guessStatuses);

        const newGameState = isWin
          ? GAME_STATE.WON
          : isLoss
            ? GAME_STATE.LOST
            : GAME_STATE.PLAYING;

        set({
          guesses: newGuesses,
          currentGuess: '',
          letterStatuses: newLetterStatuses,
          gameState: newGameState,
          message: isWin ? getWinCongratulationsMessage(newGuesses.length) : '',
          messageSeverity: 'info',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.SUCCESS,
        });

        if (newGameState === GAME_STATE.PLAYING) {
          savePartialGame(solution, newGuesses);
        }
      } finally {
        set({ isSubmitting: false });
      }
    } else if (key === 'BACKSPACE') {
      set({ currentGuess: currentGuess.slice(0, -1) });
    } else if (key === 'PLACEHOLDER') {
      if (currentGuess.length < WORD_LENGTH) {
        set({ currentGuess: currentGuess + PLACEHOLDER_CHAR });
      }
    } else if (/^[A-Z]$/.test(key) && key.length === 1) {
      if (currentGuess.length < WORD_LENGTH) {
        set({ currentGuess: currentGuess + key });
      }
    }
  },
});

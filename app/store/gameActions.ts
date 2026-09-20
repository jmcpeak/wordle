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

type SavePartialGame = (solution: string, guesses: string[]) => void;
type PartialGameSaver = {
  save: SavePartialGame;
  flush: () => Promise<void>;
};

function createPartialGameSaver(): PartialGameSaver {
  let queue = Promise.resolve();
  return {
    save: (solution, guesses) => {
      savePartialGameToStorage(solution, guesses);
      // Preserve submission order. Otherwise a slower one-guess POST can land
      // after the two-guess POST and regress another device's server board.
      queue = queue
        .then(async () => {
          const { response } = await fetchJson('/api/partial-game', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ solution, guesses }),
          });
          if (!response.ok) {
            throw new Error(`Partial-game save failed: ${response.status}`);
          }
        })
        .catch((error) => console.warn('Failed to save partial game:', error));
    },
    flush: () => queue,
  };
}

async function deletePartialGameOnServer(): Promise<void> {
  clearPartialGameFromStorage();
  try {
    const { response } = await fetchJson('/api/partial-game', {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Partial-game delete failed: ${response.status}`);
    }
  } catch (error) {
    console.warn('Failed to delete partial game:', error);
  }
}

export type GameSliceState = {
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
  /** Monotonic event signal; unlike status, consecutive errors cannot collapse. */
  submissionErrorCount: number;
  isSubmitting: boolean;
};

export type GameActions = {
  /** Optional RSC seed skips the client partial-game → word waterfall. */
  fetchWord: (seed?: InitialGameSeed) => Promise<void>;
  handleInput: (key: string) => Promise<void>;
  handleRestart: () => Promise<void>;
  deletePartialGame: () => Promise<void>;
  clearMessage: () => void;
};

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
    message: '',
    messageSeverity: 'info',
    retryAction: null,
    submissionStatus: SUBMISSION_STATUS.IDLE,
    submissionErrorCount: 0,
    isSubmitting: false,
  });
}

function applyServerSeed(
  set: StoreApi<GameStore>['setState'],
  seed: InitialGameSeed,
  savePartialGame: SavePartialGame,
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
): GameActions => {
  let fetchInFlight: Promise<void> | null = null;
  const partialGameSaver = createPartialGameSaver();
  const savePartialGame = partialGameSaver.save;

  const deletePartialGame = async () => {
    await partialGameSaver.flush();
    await deletePartialGameOnServer();
  };

  const runFetchWord = async (seed?: InitialGameSeed) => {
    if (seed?.solution) {
      applyServerSeed(set, seed, savePartialGame);
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
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          window.location.replace('/signin');
        }
        return;
      }
      if (!response.ok) {
        if (cached) {
          applyPlayingGame(set, cached.solution, cached.guesses);
        } else {
          set({
            message: t('message.errorFetching'),
            messageSeverity: 'error',
            retryAction: null,
            gameState: GAME_STATE.ERROR,
          });
        }
        return;
      }
      if (response.ok) {
        serverReached = true;
        const parsed = parsePartialGameResponse(data);
        if (!parsed) {
          set({
            message: t('message.errorFetching'),
            messageSeverity: 'error',
            retryAction: null,
            gameState: GAME_STATE.ERROR,
          });
          return;
        }
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
          if (retries < MAX_FETCH_RETRIES - 1) {
            await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
          }
          continue;
        }

        const parsed = parseWordResponse(wordData);

        if (parsed) {
          applyPlayingGame(set, parsed.word, []);
          savePartialGameToStorage(parsed.word, []);
          return;
        }
        if (retries < MAX_FETCH_RETRIES - 1) {
          await new Promise((r) => setTimeout(r, 500 * (retries + 1)));
        }
      } catch (error) {
        const isNetworkError =
          (error instanceof TypeError &&
            (error.message === 'Failed to fetch' ||
              error.message.includes('NetworkError'))) ||
          (error instanceof DOMException &&
            (error.name === 'AbortError' || error.name === 'TimeoutError'));
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
  };

  const fetchWord = (seed?: InitialGameSeed): Promise<void> => {
    // React Strict Mode remounts effects in development. Share the request so
    // two initial effects cannot race two independently selected words.
    if (!seed && fetchInFlight) return fetchInFlight;

    const request = runFetchWord(seed);
    fetchInFlight = request;
    void request.then(
      () => {
        if (fetchInFlight === request) fetchInFlight = null;
      },
      () => {
        if (fetchInFlight === request) fetchInFlight = null;
      },
    );
    return request;
  };

  return {
    fetchWord,
    deletePartialGame,
    handleRestart: async () => {
      // Start the delete first, paint the loading state immediately, then wait
      // before GET /api/partial-game. Without ordering these requests, the GET
      // can restore the game the user just asked to clear.
      const deletion = deletePartialGame();
      set({
        solution: '',
        guesses: [],
        currentGuess: '',
        message: '',
        messageSeverity: 'info',
        retryAction: null,
        letterStatuses: {},
        submissionStatus: SUBMISSION_STATUS.IDLE,
        submissionErrorCount: 0,
        isSubmitting: false,
        gameState: GAME_STATE.LOADING,
        hasInitialized: false,
      });
      await deletion;
      await get().fetchWord();
    },

    clearMessage: () => {
      set({ message: '', messageSeverity: 'info', retryAction: null });
    },

    handleInput: async (key: string) => {
      const { gameState, currentGuess, solution, guesses, isSubmitting } =
        get();
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
            submissionErrorCount: get().submissionErrorCount + 1,
          });
          return;
        }

        if (currentGuess.length !== WORD_LENGTH) {
          set({
            message: t('message.notEnoughLetters'),
            messageSeverity: 'warning',
            retryAction: null,
            submissionStatus: SUBMISSION_STATUS.ERROR,
            submissionErrorCount: get().submissionErrorCount + 1,
          });
          return;
        }

        if (guesses.includes(currentGuess)) {
          set({
            message: t('message.alreadyGuessed'),
            messageSeverity: 'warning',
            retryAction: null,
            submissionStatus: SUBMISSION_STATUS.ERROR,
            submissionErrorCount: get().submissionErrorCount + 1,
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
              submissionErrorCount: get().submissionErrorCount + 1,
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
              submissionErrorCount: get().submissionErrorCount + 1,
            });
            return;
          }

          if (!parsed.isValid) {
            set({
              message: t('message.notValidWord'),
              messageSeverity: 'warning',
              retryAction: null,
              submissionStatus: SUBMISSION_STATUS.ERROR,
              submissionErrorCount: get().submissionErrorCount + 1,
            });
            return;
          }

          const newGuesses = [...guesses, currentGuess];
          const isWin = currentGuess === solution;
          const isLoss = newGuesses.length >= MAX_GUESSES;

          const guessStatuses = checkGuess(currentGuess, solution);
          const newLetterStatuses = { ...get().letterStatuses };
          accumulateGuessStatuses(
            newLetterStatuses,
            currentGuess,
            guessStatuses,
          );

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
            message: isWin
              ? getWinCongratulationsMessage(newGuesses.length)
              : '',
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
  };
};

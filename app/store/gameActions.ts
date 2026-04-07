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

function savePartialGameToServer(solution: string, guesses: string[]): void {
  fetchJson('/api/partial-game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ solution, guesses }),
  }).catch((err) => console.warn('Failed to save partial game:', err));
}

export function deletePartialGameOnServer(): void {
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
  fetchWord: () => Promise<void>;
  handleInput: (key: string) => Promise<void>;
  handleRestart: () => void;
  clearMessage: () => void;
}

export type GameStore = GameSliceState & GameActions;

const MAX_FETCH_RETRIES = 10;

export const createGameActions = (
  set: StoreApi<GameStore>['setState'],
  get: StoreApi<GameStore>['getState'],
): GameActions => ({
  fetchWord: async () => {
    set({ gameState: GAME_STATE.LOADING });

    try {
      const { response, data } = await fetchJson('/api/partial-game');
      if (response.ok) {
        const parsed = parsePartialGameResponse(data);
        if (parsed?.game) {
          const { solution, guesses } = parsed.game;
          set({
            solution,
            guesses,
            letterStatuses: rebuildLetterStatuses(guesses, solution),
            gameState: GAME_STATE.PLAYING,
            hasInitialized: true,
          });
          return;
        }
      }
    } catch {
      // Not authenticated or network error — fall through to fetch a new word
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
          set({
            solution: parsed.word,
            gameState: GAME_STATE.PLAYING,
            hasInitialized: true,
          });
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
        set({
          message: t('message.errorFetching'),
          messageSeverity: 'error',
          retryAction: null,
          gameState: GAME_STATE.ERROR,
        });
        return;
      }
    }

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
          message: '',
          messageSeverity: 'info',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.SUCCESS,
        });

        if (newGameState === GAME_STATE.PLAYING) {
          savePartialGameToServer(solution, newGuesses);
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

import type { AlertColor } from '@mui/material';
import type { StoreApi } from 'zustand';
import {
  GAME_STATE,
  MAX_GUESSES,
  SUBMISSION_STATUS,
  WORD_LENGTH,
} from '@/constants';
import { t } from '@/store/i18nStore';
import type {
  GameState,
  LetterStatus,
  RetryAction,
  SubmissionStatus,
  ValidateApiResponse,
  WordApiResponse,
} from '@/types';
import { fetchJson } from '@/utils/fetchJson';
import { checkGuess } from '@/utils/gameLogic';

function parseWordResponse(data: unknown): WordApiResponse | null {
  if (data && typeof data === 'object' && 'word' in data) {
    const w = (data as { word: unknown }).word;
    if (typeof w === 'string' && w.length > 0) return { word: w };
  }
  return null;
}

function parseValidateResponse(data: unknown): ValidateApiResponse {
  if (data && typeof data === 'object' && 'isValid' in data) {
    return { isValid: (data as { isValid: unknown }).isValid === true };
  }
  return { isValid: false };
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
        currentGuess.split('').forEach((letter, i) => {
          const status = guessStatuses[i];
          const currentStatus = newLetterStatuses[letter];

          if (status === 'correct') {
            newLetterStatuses[letter] = 'correct';
          } else if (status === 'present' && currentStatus !== 'correct') {
            newLetterStatuses[letter] = 'present';
          } else if (
            status === 'absent' &&
            currentStatus !== 'correct' &&
            currentStatus !== 'present'
          ) {
            newLetterStatuses[letter] = 'absent';
          }
        });

        set({
          guesses: newGuesses,
          currentGuess: '',
          letterStatuses: newLetterStatuses,
          gameState: isWin
            ? GAME_STATE.WON
            : isLoss
              ? GAME_STATE.LOST
              : GAME_STATE.PLAYING,
          message: '',
          messageSeverity: 'info',
          retryAction: null,
          submissionStatus: SUBMISSION_STATUS.SUCCESS,
        });
      } finally {
        set({ isSubmitting: false });
      }
    } else if (key === 'BACKSPACE') {
      set({ currentGuess: currentGuess.slice(0, -1) });
    } else if (/^[A-Z]$/.test(key) && key.length === 1) {
      if (currentGuess.length < WORD_LENGTH) {
        set({ currentGuess: currentGuess + key });
      }
    }
  },
});

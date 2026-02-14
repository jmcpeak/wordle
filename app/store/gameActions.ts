import type { AlertColor } from '@mui/material';
import type { StoreApi } from 'zustand';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  MAX_GUESSES,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
  WORD_LENGTH,
} from '@/constants';
import { t } from '@/store/i18nStore';
import type { GameState, LetterStatus, SubmissionStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

export interface GameSliceState {
  solution: string;
  guesses: string[];
  currentGuess: string;
  gameState: GameState;
  hasInitialized: boolean;
  message: string;
  messageSeverity: AlertColor;
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
    for (let retries = 0; retries < MAX_FETCH_RETRIES; retries++) {
      try {
        const wordResponse = await fetch('/api/word');
        if (!wordResponse.ok) continue;

        const { word } = (await wordResponse.json()) as { word?: string };

        if (word) {
          set({
            solution: word,
            gameState: GAME_STATE.PLAYING,
            hasInitialized: true,
          });
          return;
        }
      } catch (error) {
        console.error('Error fetching word:', error);
        set({
          message: t('message.errorFetching'),
          messageSeverity: 'error',
          gameState: GAME_STATE.ERROR,
        });
        return;
      }
    }

    set({
      message: t('message.noValidWord'),
      messageSeverity: 'error',
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
      letterStatuses: {},
      submissionStatus: SUBMISSION_STATUS.IDLE,
      isSubmitting: false,
    });
    // fetchWord sets gameState to LOADING, then PLAYING once a word is found.
    // No need to set gameState here — let fetchWord own the transition.
    get().fetchWord();
  },

  clearMessage: () => {
    set({ message: '', messageSeverity: 'info' });
  },

  handleInput: async (key: string) => {
    const { gameState, currentGuess, solution, guesses, isSubmitting } = get();
    if (gameState !== GAME_STATE.PLAYING) return;

    // Block all input while a submission is in progress
    if (isSubmitting) return;

    set({ submissionStatus: SUBMISSION_STATUS.IDLE });

    if (key === 'ENTER') {
      if (currentGuess.length !== WORD_LENGTH) {
        set({
          message: t('message.notEnoughLetters'),
          messageSeverity: 'warning',
          submissionStatus: SUBMISSION_STATUS.ERROR,
        });
        return;
      }

      if (guesses.includes(currentGuess)) {
        set({
          message: t('message.alreadyGuessed'),
          messageSeverity: 'warning',
          submissionStatus: SUBMISSION_STATUS.ERROR,
        });
        return;
      }

      set({ isSubmitting: true });
      try {
        const response = await fetch(`/api/validate?word=${currentGuess}`);
        const { isValid } = await response.json();

        if (!isValid) {
          set({
            message: t('message.notValidWord'),
            messageSeverity: 'warning',
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

        const newMessage = isWin
          ? t('message.youWon')
          : isLoss
            ? t('message.gameOver', { solution })
            : '';

        const newSeverity: AlertColor = isWin
          ? 'success'
          : isLoss
            ? 'error'
            : 'info';

        set({
          guesses: newGuesses,
          currentGuess: '',
          letterStatuses: newLetterStatuses,
          gameState: isWin
            ? GAME_STATE.WON
            : isLoss
              ? GAME_STATE.LOST
              : GAME_STATE.PLAYING,
          // Delay the win/loss message so it appears after the animation.
          message: isWin || isLoss ? '' : newMessage,
          messageSeverity: newSeverity,
          submissionStatus: SUBMISSION_STATUS.SUCCESS,
        });

        if (isWin) {
          setTimeout(() => {
            // Only show if the game hasn't been restarted in the meantime.
            if (get().gameState === GAME_STATE.WON) {
              set({ message: newMessage, messageSeverity: newSeverity });
            }
          }, WIN_ANIMATION_DURATION_MS);
        }

        if (isLoss) {
          setTimeout(() => {
            // Only show if the game hasn't been restarted in the meantime.
            if (get().gameState === GAME_STATE.LOST) {
              set({ message: newMessage, messageSeverity: newSeverity });
            }
          }, LOSS_ANIMATION_DURATION_MS);
        }
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

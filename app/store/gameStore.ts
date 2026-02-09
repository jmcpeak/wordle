import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { GAME_STATE, SUBMISSION_STATUS } from '@/constants';
import { createGameActions, type GameStore } from '@/store/gameActions';

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      solution: '',
      guesses: [],
      currentGuess: '',
      gameState: GAME_STATE.LOADING,
      hasInitialized: false,
      message: '',
      messageSeverity: 'info',
      letterStatuses: {},
      submissionStatus: SUBMISSION_STATUS.IDLE,
      isSubmitting: false,
      ...createGameActions(set, get),
    }),
    { name: 'GameStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

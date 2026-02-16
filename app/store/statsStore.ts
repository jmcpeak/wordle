import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STATS_ACTIONS } from '@/constants';
import { useToastStore } from '@/store/toastStore';
import type { StatsApiResponse } from '@/types';

type StatsData = StatsApiResponse;

const TOAST_SAVE_FAILED = 'Failed to save statistics. Try again when online.';
const TOAST_RESET_FAILED = 'Failed to reset statistics. Try again when online.';

type StatsState = StatsData & {
  isLoaded: boolean;
  loadStats: () => Promise<void>;
  addWin: (guesses: number) => Promise<void>;
  addLoss: () => Promise<void>;
  resetStats: () => Promise<void>;
  setStats: (stats: StatsData) => void;
  /** Normalize and set from raw API response. Use for any stats API response. */
  setFromApiResponse: (data: unknown) => void;
  /** Clear stats (e.g. on sign-out). */
  clearStats: () => void;
};

/** Parse and validate stats API response; defensively default invalid/missing fields. */
function parseStatsResponse(data: unknown): StatsData {
  if (
    data &&
    typeof data === 'object' &&
    'gamesWon' in data &&
    'gamesLost' in data &&
    'guessDistribution' in data
  ) {
    const o = data as Record<string, unknown>;
    const gamesWon = typeof o.gamesWon === 'number' ? o.gamesWon : 0;
    const gamesLost = typeof o.gamesLost === 'number' ? o.gamesLost : 0;
    const guessDistribution =
      o.guessDistribution && typeof o.guessDistribution === 'object'
        ? (o.guessDistribution as Record<number, number>)
        : {};
    return { gamesWon, gamesLost, guessDistribution };
  }
  return { gamesWon: 0, gamesLost: 0, guessDistribution: {} };
}

export const useStatsStore = create<StatsState>()(
  devtools(
    (set) => ({
      gamesWon: 0,
      gamesLost: 0,
      guessDistribution: {},
      isLoaded: false,
      loadStats: async () => {
        const response = await fetch('/api/stats');
        if (!response.ok) {
          throw new Error(`Failed to load stats: ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        set({ ...parseStatsResponse(data), isLoaded: true });
      },
      addWin: async (guesses: number) => {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: STATS_ACTIONS.ADD_WIN, guesses }),
        });
        if (!response.ok) {
          useToastStore.getState().showToast(TOAST_SAVE_FAILED);
          throw new Error(`Failed to save win stats: ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        set({ ...parseStatsResponse(data), isLoaded: true });
      },
      addLoss: async () => {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: STATS_ACTIONS.ADD_LOSS }),
        });
        if (!response.ok) {
          useToastStore.getState().showToast(TOAST_SAVE_FAILED);
          throw new Error(`Failed to save loss stats: ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        set({ ...parseStatsResponse(data), isLoaded: true });
      },
      resetStats: async () => {
        const response = await fetch('/api/stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: STATS_ACTIONS.RESET }),
        });
        if (!response.ok) {
          useToastStore.getState().showToast(TOAST_RESET_FAILED);
          throw new Error(`Failed to reset stats: ${response.status}`);
        }
        const data = (await response.json()) as unknown;
        set({ ...parseStatsResponse(data), isLoaded: true });
      },
      setStats: ({ gamesWon, gamesLost, guessDistribution }) =>
        set({ gamesWon, gamesLost, guessDistribution, isLoaded: true }),
      setFromApiResponse: (data) =>
        set({ ...parseStatsResponse(data), isLoaded: true }),
      clearStats: () =>
        set({
          gamesWon: 0,
          gamesLost: 0,
          guessDistribution: {},
          isLoaded: false,
        }),
    }),
    { name: 'StatsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

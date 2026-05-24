import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STATS_ACTIONS } from '@/constants';
import { useToastStore } from '@/store/toastStore';
import type { RecentGame, StatsApiResponse } from '@/types';
import { fetchJson } from '@/utils/fetchJson';

type StatsData = StatsApiResponse;

const TOAST_SAVE_FAILED = 'Failed to save statistics. Try again when online.';
const TOAST_RESET_FAILED = 'Failed to reset statistics. Try again when online.';

type StatsState = StatsData & {
  isLoaded: boolean;
  loadStats: () => Promise<void>;
  addWin: (guesses: number, word: string) => Promise<void>;
  addLoss: (word: string) => Promise<void>;
  resetStats: () => Promise<void>;
  setStats: (stats: StatsData) => void;
  /** Normalize and set from raw API response. Use for any stats API response. */
  setFromApiResponse: (data: unknown) => void;
  /** Clear stats (e.g. on sign-out). */
  clearStats: () => void;
};

function parseRecentGames(value: unknown): RecentGame[] {
  if (!Array.isArray(value)) return [];
  const result: RecentGame[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    if (typeof o.word !== 'string') continue;
    if (typeof o.won !== 'boolean') continue;
    if (typeof o.id !== 'number') continue;
    const guesses = typeof o.guesses === 'number' ? o.guesses : 0;
    result.push({ id: o.id, word: o.word, won: o.won, guesses });
  }
  return result;
}

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
    const recentGames = parseRecentGames(o.recentGames);
    return { gamesWon, gamesLost, guessDistribution, recentGames };
  }
  return {
    gamesWon: 0,
    gamesLost: 0,
    guessDistribution: {},
    recentGames: [],
  };
}

export const useStatsStore = create<StatsState>()(
  devtools(
    (set) => {
      let loadInFlight: Promise<void> | null = null;
      return {
        gamesWon: 0,
        gamesLost: 0,
        guessDistribution: {},
        recentGames: [],
        isLoaded: false,
        loadStats: async () => {
          if (loadInFlight) return loadInFlight;
          loadInFlight = (async () => {
            try {
              const { response, data } = await fetchJson('/api/stats');
              if (!response.ok) {
                throw new Error(`Failed to load stats: ${response.status}`);
              }
              set({ ...parseStatsResponse(data), isLoaded: true });
            } finally {
              loadInFlight = null;
            }
          })();
          return loadInFlight;
        },
        addWin: async (guesses: number, word: string) => {
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: STATS_ACTIONS.ADD_WIN,
              guesses,
              word,
            }),
          });
          if (!response.ok) {
            useToastStore.getState().showToast(TOAST_SAVE_FAILED);
            throw new Error(`Failed to save win stats: ${response.status}`);
          }
          set({ ...parseStatsResponse(data), isLoaded: true });
        },
        addLoss: async (word: string) => {
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: STATS_ACTIONS.ADD_LOSS, word }),
          });
          if (!response.ok) {
            useToastStore.getState().showToast(TOAST_SAVE_FAILED);
            throw new Error(`Failed to save loss stats: ${response.status}`);
          }
          set({ ...parseStatsResponse(data), isLoaded: true });
        },
        resetStats: async () => {
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: STATS_ACTIONS.RESET }),
          });
          if (!response.ok) {
            useToastStore.getState().showToast(TOAST_RESET_FAILED);
            throw new Error(`Failed to reset stats: ${response.status}`);
          }
          set({ ...parseStatsResponse(data), isLoaded: true });
        },
        setStats: ({ gamesWon, gamesLost, guessDistribution, recentGames }) =>
          set({
            gamesWon,
            gamesLost,
            guessDistribution,
            recentGames,
            isLoaded: true,
          }),
        setFromApiResponse: (data) =>
          set({ ...parseStatsResponse(data), isLoaded: true }),
        clearStats: () =>
          set({
            gamesWon: 0,
            gamesLost: 0,
            guessDistribution: {},
            recentGames: [],
            isLoaded: false,
          }),
      };
    },
    { name: 'StatsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

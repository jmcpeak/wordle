import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { MAX_GUESSES, STATS_ACTIONS, WORD_LENGTH } from '@/constants';
import { useToastStore } from '@/store/toastStore';
import type { RecentGame, StatsApiResponse } from '@/types';
import { fetchJson } from '@/utils/fetchJson';

type StatsData = StatsApiResponse;

const TOAST_SAVE_FAILED = 'Failed to save statistics. Try again when online.';
const TOAST_RESET_FAILED = 'Failed to reset statistics. Try again when online.';
const WORD_RE = new RegExp(`^[A-Z]{${WORD_LENGTH}}$`);

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
    if (typeof o.word !== 'string' || !WORD_RE.test(o.word)) continue;
    if (typeof o.won !== 'boolean') continue;
    if (typeof o.id !== 'number' || !Number.isSafeInteger(o.id) || o.id < 0) {
      continue;
    }
    const guesses =
      typeof o.guesses === 'number' &&
      Number.isInteger(o.guesses) &&
      o.guesses >= 0 &&
      o.guesses <= MAX_GUESSES
        ? o.guesses
        : 0;
    result.push({ id: o.id, word: o.word, won: o.won, guesses });
  }
  return result;
}

function parseCount(value: unknown): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function parseGuessDistribution(value: unknown): Record<number, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const distribution: Record<number, number> = {};
  for (const [rawGuessCount, rawCount] of Object.entries(value)) {
    const guessCount = Number(rawGuessCount);
    if (
      !Number.isInteger(guessCount) ||
      guessCount < 1 ||
      guessCount > MAX_GUESSES
    ) {
      continue;
    }
    distribution[guessCount] = parseCount(rawCount);
  }
  return distribution;
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
    const gamesWon = parseCount(o.gamesWon);
    const gamesLost = parseCount(o.gamesLost);
    const guessDistribution = parseGuessDistribution(o.guessDistribution);
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
      let requestEpoch = 0;

      const beginMutation = () => {
        requestEpoch += 1;
        loadInFlight = null;
        return requestEpoch;
      };

      return {
        gamesWon: 0,
        gamesLost: 0,
        guessDistribution: {},
        recentGames: [],
        isLoaded: false,
        loadStats: async () => {
          if (loadInFlight) return loadInFlight;
          const epoch = requestEpoch;
          const request = (async () => {
            const { response, data } = await fetchJson('/api/stats');
            if (!response.ok) {
              throw new Error(`Failed to load stats: ${response.status}`);
            }
            if (epoch === requestEpoch) {
              set({ ...parseStatsResponse(data), isLoaded: true });
            }
          })();
          loadInFlight = request;
          try {
            await request;
          } finally {
            if (loadInFlight === request) {
              loadInFlight = null;
            }
          }
        },
        addWin: async (guesses: number, word: string) => {
          const epoch = beginMutation();
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: STATS_ACTIONS.ADD_WIN,
              guesses,
              word,
            }),
          });
          if (epoch !== requestEpoch) return;
          if (!response.ok) {
            useToastStore.getState().showToast(TOAST_SAVE_FAILED);
            throw new Error(`Failed to save win stats: ${response.status}`);
          }
          set({ ...parseStatsResponse(data), isLoaded: true });
        },
        addLoss: async (word: string) => {
          const epoch = beginMutation();
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: STATS_ACTIONS.ADD_LOSS, word }),
          });
          if (epoch !== requestEpoch) return;
          if (!response.ok) {
            useToastStore.getState().showToast(TOAST_SAVE_FAILED);
            throw new Error(`Failed to save loss stats: ${response.status}`);
          }
          set({ ...parseStatsResponse(data), isLoaded: true });
        },
        resetStats: async () => {
          const epoch = beginMutation();
          const { response, data } = await fetchJson('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: STATS_ACTIONS.RESET }),
          });
          if (epoch !== requestEpoch) return;
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
        clearStats: () => {
          requestEpoch += 1;
          loadInFlight = null;
          set({
            gamesWon: 0,
            gamesLost: 0,
            guessDistribution: {},
            recentGames: [],
            isLoaded: false,
          });
        },
      };
    },
    { name: 'StatsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

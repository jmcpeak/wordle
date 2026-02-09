import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { STATS_ACTIONS } from '@/constants';

type StatsData = {
  gamesWon: number;
  gamesLost: number;
  guessDistribution: Record<number, number>;
};

type StatsState = StatsData & {
  isLoaded: boolean;
  loadStats: () => Promise<void>;
  addWin: (guesses: number) => Promise<void>;
  addLoss: () => Promise<void>;
  resetStats: () => Promise<void>;
  setStats: (stats: StatsData) => void;
};

/** Pick only the known data fields from an API response, ignoring unexpected keys. */
function pickStatsData(data: Record<string, unknown>): StatsData {
  return {
    gamesWon: (data.gamesWon as number) ?? 0,
    gamesLost: (data.gamesLost as number) ?? 0,
    guessDistribution: (data.guessDistribution as Record<number, number>) ?? {},
  };
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
        const data = await response.json();
        set({ ...pickStatsData(data), isLoaded: true });
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
          throw new Error(`Failed to save win stats: ${response.status}`);
        }
        const data = await response.json();
        set({ ...pickStatsData(data), isLoaded: true });
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
          throw new Error(`Failed to save loss stats: ${response.status}`);
        }
        const data = await response.json();
        set({ ...pickStatsData(data), isLoaded: true });
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
          throw new Error(`Failed to reset stats: ${response.status}`);
        }
        const data = await response.json();
        set({ ...pickStatsData(data), isLoaded: true });
      },
      setStats: ({ gamesWon, gamesLost, guessDistribution }) =>
        set({ gamesWon, gamesLost, guessDistribution, isLoaded: true }),
    }),
    { name: 'StatsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

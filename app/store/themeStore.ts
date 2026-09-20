import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { THEME_MODES } from '@/constants';
import { useToastStore } from '@/store/toastStore';
import { fetchJson } from '@/utils/fetchJson';

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];

type ThemeState = {
  mode: ThemeMode;
  initializeMode: (mode: ThemeMode) => void;
  setMode: (mode: ThemeMode) => Promise<void>;
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    (set, get) => {
      let persistedMode: ThemeMode = THEME_MODES.SYSTEM;
      let persistQueue = Promise.resolve();

      return {
        mode: THEME_MODES.SYSTEM,
        initializeMode: (mode) => {
          persistedMode = mode;
          set({ mode });
        },
        setMode: async (mode) => {
          set({ mode });

          // Serialize writes so a slower earlier request cannot overwrite the
          // user's latest selection on the server.
          const persistence = persistQueue.then(async () => {
            const { response } = await fetchJson('/api/theme', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ theme: mode }),
            });
            if (!response.ok) {
              throw new Error(`Failed to persist theme: ${response.status}`);
            }
            persistedMode = mode;
          });
          persistQueue = persistence.catch(() => undefined);

          try {
            await persistence;
          } catch (error) {
            console.error('Failed to save theme preference, reverting:', error);
            // Do not roll back a newer optimistic selection. If this is still
            // the latest selection, return to the last confirmed server mode.
            if (get().mode === mode) {
              set({ mode: persistedMode });
            }
            useToastStore
              .getState()
              .showToast(
                'Failed to save theme preference. Try again when online.',
              );
          }
        },
      };
    },
    { name: 'ThemeStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

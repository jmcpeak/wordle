import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { THEME_MODES } from '@/constants';
import { useToastStore } from '@/store/toastStore';

export type ThemeMode = (typeof THEME_MODES)[keyof typeof THEME_MODES];

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    (set, get) => ({
      mode: THEME_MODES.SYSTEM,
      setMode: async (mode) => {
        const previousMode = get().mode;
        set({ mode });
        try {
          const response = await fetch('/api/theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ theme: mode }),
          });
          if (!response.ok) {
            throw new Error(`Failed to persist theme: ${response.status}`);
          }
        } catch (error) {
          console.error('Failed to save theme preference, reverting:', error);
          set({ mode: previousMode });
          useToastStore
            .getState()
            .showToast(
              'Failed to save theme preference. Try again when online.',
            );
        }
      },
    }),
    { name: 'ThemeStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

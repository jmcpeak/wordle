import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const HAPTICS_STORAGE_KEY = 'wordle:haptics-enabled';

type HapticsState = {
  enabled: boolean;
  initialize: () => void;
  setEnabled: (enabled: boolean) => void;
};

function readStoredPreference(): boolean {
  try {
    const stored = window.localStorage.getItem(HAPTICS_STORAGE_KEY);
    return stored !== 'false';
  } catch {
    return true;
  }
}

function storePreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(HAPTICS_STORAGE_KEY, String(enabled));
  } catch {
    // The preference still applies for this session when storage is blocked.
  }
}

export const useHapticsStore = create<HapticsState>()(
  devtools(
    (set) => ({
      enabled: true,
      initialize: () => set({ enabled: readStoredPreference() }),
      setEnabled: (enabled) => {
        set({ enabled });
        storePreference(enabled);
      },
    }),
    { name: 'HapticsStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);

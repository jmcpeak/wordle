export const WORD_LENGTH = 5;
export const DIFFICULTY_LEVEL = 1;
export const MAX_GUESSES = 6;
export const API_FETCH_TIMEOUT_MS = 8000;
export const WORD_API_MAX_ATTEMPTS = 6;

export const GAME_STATE = {
  LOADING: 'loading',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
  ERROR: 'error',
} as const;

export const SUBMISSION_STATUS = {
  IDLE: 'idle',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const STATS_ACTIONS = {
  ADD_WIN: 'addWin',
  ADD_LOSS: 'addLoss',
  RESET: 'reset',
} as const;

export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

export const AUTH_PROVIDERS = {
  GITHUB: 'github',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
} as const;

/** Keyboard layout used by the on-screen keyboard. */
export const KEYBOARD_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
] as const;

/** Cell size expressed as theme.spacing multipliers for letter cells. */
export const CELL_SPACING = { xs: 7.44, sm: 6 } as const;

/** Cell margin expressed as a theme.spacing multiplier. */
export const CELL_MARGIN = 0.25;

/**
 * Duration (ms) of the winning-row animation (flip + staggered jump).
 * Last tile (index 4): jump starts at 1.0s, lasts 0.5s → 1.5s total.
 */
export const WIN_ANIMATION_DURATION_MS = 1500;

/**
 * Duration (ms) of the loss animation (gray wash / desaturate).
 * 300ms initial delay + 1200ms animation = 1500ms total.
 */
export const LOSS_ANIMATION_DURATION_MS = 1500;

/** Keyboard key layout constants (theme.spacing multipliers). */
export const KEY_SIZING = {
  minWidth: 3.6,
  padding: { y: 1.2, x: 0.72 },
  paddingXs: { y: 1.2, x: 0.54 },
  margin: 0.25,
  marginXs: 0.3,
} as const;

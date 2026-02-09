export const DB_FILE = './stats.db';

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

export const GAME_STATE = {
  LOADING: 'loading',
  PLAYING: 'playing',
  WON: 'won',
  LOST: 'lost',
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
  CREDENTIALS: 'credentials',
} as const;

/** Keyboard layout — shared between Keyboard and LoadingIndicator. */
export const KEYBOARD_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
] as const;

/** Cell size expressed as theme.spacing multipliers — shared between LetterBox and LoadingIndicator. */
export const CELL_SPACING = { xs: 4.8, sm: 6 } as const;

/** Cell margin expressed as a theme.spacing multiplier — shared between LetterBox and LoadingIndicator. */
export const CELL_MARGIN = 0.25;

/**
 * Keyboard key layout constants (theme.spacing multipliers) — shared between
 * KeyButton (Keyboard.tsx) and LoadingIndicator.
 */
export const KEY_SIZING = {
  minWidth: 3.6,
  padding: { y: 1.2, x: 0.72 },
  paddingXs: { y: 0.9, x: 0.54 },
  margin: 0.25,
} as const;

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
 * Duration (ms) of each tile's flip in the loss "flip to empty" phase.
 */
export const LOSS_FLIP_TO_EMPTY_DURATION_MS = 600;

/**
 * Duration (ms) of each tile's split-flap flip (flip to empty on loss / Play Again).
 * Short so each flap feels like a mechanical "clack".
 */
export const SPLIT_FLAP_FLIP_DURATION_MS = 380;

/**
 * Stagger delay (ms) between rows in the loss flip-to-empty phase.
 * Slowed by 20% for more visible cascade effect.
 */
export const LOSS_FLIP_ROW_STAGGER_MS = 120;

/**
 * Stagger delay (ms) between cells within a row for split-flap cascade (left to right).
 */
export const LOSS_FLIP_COL_STAGGER_MS = 55;

/**
 * Phase 1 total: last cell start delay + flip duration. After this, phase 2 (reveal solution on row 3) starts.
 */
const SPLIT_FLAP_LAST_ROW_INDEX = MAX_GUESSES - 1;
const SPLIT_FLAP_LAST_COL_INDEX = WORD_LENGTH - 1;
export const LOSS_PHASE2_DELAY_MS =
  SPLIT_FLAP_LAST_ROW_INDEX * LOSS_FLIP_ROW_STAGGER_MS +
  SPLIT_FLAP_LAST_COL_INDEX * LOSS_FLIP_COL_STAGGER_MS +
  SPLIT_FLAP_FLIP_DURATION_MS;

/**
 * Total duration (ms) of loss phase 2 reveal:
 * row+cell stagger for the final row ("LOSE!") plus split-flap flip duration.
 */
const LOSS_PHASE2_LAST_REVEAL_ROW_INDEX = MAX_GUESSES - 2;
const LOSS_PHASE2_DURATION_MS =
  LOSS_PHASE2_LAST_REVEAL_ROW_INDEX * LOSS_FLIP_ROW_STAGGER_MS +
  (WORD_LENGTH - 1) * LOSS_FLIP_COL_STAGGER_MS +
  SPLIT_FLAP_FLIP_DURATION_MS;
export const LOSS_ANIMATION_DURATION_MS =
  LOSS_PHASE2_DELAY_MS + LOSS_PHASE2_DURATION_MS;

/** Keyboard key layout constants (theme.spacing multipliers). */
export const KEY_SIZING = {
  minWidth: 3.6,
  padding: { y: 1.2, x: 0.72 },
  paddingXs: { y: 1.2, x: 0.54 },
  margin: 0.25,
  marginXs: 0.3,
} as const;

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

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

/** Internal character stored in currentGuess for unknown letter positions. */
export const PLACEHOLDER_CHAR = '.';

/** Display character rendered in the tile for placeholder positions. */
export const PLACEHOLDER_DISPLAY = '\u00B7';

/** Keyboard layout used by the on-screen keyboard. */
export const KEYBOARD_KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['PLACEHOLDER', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
] as const;

/** Cell size expressed as theme.spacing multipliers for letter cells. */
export const CELL_SPACING = { xs: 8.25, sm: 6.25 } as const;

/** Cell margin expressed as a theme.spacing multiplier. */
export const CELL_MARGIN = 0.25;

/** Stagger (s) between successive tiles in status reveal flips. */
export const REVEAL_FLIP_STAGGER_S = 0.2;

/**
 * Duration (ms) of one split-flap fold (one drum step).
 */
export const SPLIT_FLAP_FLIP_DURATION_MS = 320;

/**
 * Status-color reveal fold duration (ms) — same as one drum step for smoother flaps.
 */
export const REVEAL_STATUS_FLIP_DURATION_MS = SPLIT_FLAP_FLIP_DURATION_MS;

/**
 * Delay (ms) until the keyboard key for column `i` takes its new status color.
 * Waits until that tile’s reveal fold has fully finished:
 * index * stagger + statusFlipDuration
 */
export function getRevealColorSwapDelayMs(index: number): number {
  return index * REVEAL_FLIP_STAGGER_S * 1000 + REVEAL_STATUS_FLIP_DURATION_MS;
}

/**
 * Total time (ms) for the reveal flip to finish on the last tile.
 * (WORD_LENGTH - 1) * stagger + statusFlipDuration
 */
export const REVEAL_TOTAL_DURATION_MS =
  (WORD_LENGTH - 1) * REVEAL_FLIP_STAGGER_S * 1000 +
  REVEAL_STATUS_FLIP_DURATION_MS;

/**
 * Duration (ms) of the winning row shutter alone:
 * one synchronized mid-seam fold across the whole row.
 */
export const WIN_SHUTTER_DURATION_MS = SPLIT_FLAP_FLIP_DURATION_MS;

/**
 * Full win celebration: green reveal, then synchronized row shutter.
 */
export const WIN_ANIMATION_DURATION_MS =
  REVEAL_TOTAL_DURATION_MS + WIN_SHUTTER_DURATION_MS;

/**
 * Duration (ms) of each tile's flip in the loss "flip to empty" phase.
 */
export const LOSS_FLIP_TO_EMPTY_DURATION_MS = 600;

/**
 * Stagger delay (ms) between rows in the loss flip-to-empty phase.
 */
export const LOSS_FLIP_ROW_STAGGER_MS = 200;

/**
 * Stagger delay (ms) between cells within a row for split-flap cascade (left to right).
 */
export const LOSS_FLIP_COL_STAGGER_MS = 110;

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
 * Play Again clear: stagger for the last cell to start, then worst-case
 * shortest-path drum walk (half of blank+A–Z = 13 folds).
 */
export const SPLIT_FLAP_MAX_CLEAR_STEPS = 13;

export const RESTART_SPLIT_FLAP_DURATION_MS =
  SPLIT_FLAP_LAST_ROW_INDEX * LOSS_FLIP_ROW_STAGGER_MS +
  SPLIT_FLAP_LAST_COL_INDEX * LOSS_FLIP_COL_STAGGER_MS +
  SPLIT_FLAP_MAX_CLEAR_STEPS * SPLIT_FLAP_FLIP_DURATION_MS;

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
  minWidth: 4.5,
  padding: { y: 1.5, x: 1 },
  paddingXs: { y: 1.75, x: 0.54 },
  margin: 0.25,
  marginXs: 0.2,
  rowGap: 0.75,
} as const;

import type { Theme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import type { CSSProperties } from 'react';
import {
  REVEAL_FLIP_STAGGER_S,
  REVEAL_STATUS_FLIP_DURATION_MS,
  SPLIT_FLAP_FLIP_DURATION_MS,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';

/** Opaque typed-tile fill (matches letterEnter settled cards). */
export function typedTileFill(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? theme.palette.grey[300]
    : theme.palette.common.white;
}

export function typedTileText(theme: Theme): string {
  return theme.palette.mode === 'dark'
    ? theme.palette.common.white
    : theme.palette.text.primary;
}

export type SplitFlapFaces = {
  startBackground: string;
  endBackground: string;
  startText: string;
  endText: string;
  borderColor: string;
  delayMs: number;
  /** True when the fold starts on a blank/clear flap (opaque card, delayed new-top). */
  fromBlank: boolean;
  /** Typed → status color: keep start fill on new-top until fold midpoint. */
  colorChange?: boolean;
};

/**
 * Front of the top flap (hinged at mid-seam): folds toward the viewer to
 * edge-on, then hides. Does not rely on backface-visibility.
 */
const flapFrontFold = keyframes`
  0% {
    transform: rotateX(0deg);
    opacity: 1;
  }
  50% {
    transform: rotateX(-90deg);
    opacity: 1;
  }
  50.01%,
  100% {
    transform: rotateX(-90deg);
    opacity: 0;
  }
`;

/**
 * Next letter’s panel (hinged at mid-seam from the bottom half): starts edge-on
 * at the seam, then falls down into the bottom slot — the painted “underside”
 * you see covering the old bottom half.
 */
const flapBackFold = keyframes`
  0%,
  49.99% {
    transform: rotateX(90deg);
    opacity: 0;
  }
  50% {
    transform: rotateX(90deg);
    opacity: 1;
  }
  100% {
    transform: rotateX(0deg);
    opacity: 1;
  }
`;

const SPLIT_FLAP_EASING = 'cubic-bezier(0.4, 0.0, 0.55, 0.35)';

/**
 * Opaque card for folds that need a visible blank face (e.g. loss reveal).
 * Theme-aware: dark palette has no grey[200], so MUI’s default reads as white.
 */
function emptyFlapBackground(theme: Theme): string {
  if (theme.palette.mode === 'dark') {
    return theme.palette.grey[300];
  }
  return theme.palette.grey[200];
}

function statusBackground(theme: Theme, status?: LetterStatus): string {
  if (!status || status === 'empty') return 'transparent';
  return theme.palette.game[status];
}

/**
 * Stable mid-fold color swap. Colors come from CSS variables so a parent
 * re-render cannot rename the animation and snap the flap to its 0% pose.
 */
const newTopRevealFold = keyframes`
  0%, 49.9% {
    background-color: var(--split-flap-start-bg);
    color: var(--split-flap-start-text);
  }
  50%, 100% {
    background-color: var(--split-flap-end-bg);
    color: var(--split-flap-end-text);
  }
`;

export function getNewTopRevealCssVars(faces: SplitFlapFaces): CSSProperties {
  return {
    '--split-flap-start-bg': faces.startBackground,
    '--split-flap-start-text': faces.startText,
    '--split-flap-end-bg': faces.endBackground,
    '--split-flap-end-text': faces.endText,
  } as CSSProperties;
}

type DrumStepFaceOptions = {
  /**
   * When true, unevaluated (typed) letters use opaque flap cards so folds read
   * like the lab / evaluated tiles. Settled typed cells should pass false so
   * they match normal empty Wordle cells (transparent).
   */
  solidUnevaluated?: boolean;
};

/** Faces for one drum step from `fromChar` → `toChar` ('' = clear). */
export function getDrumStepFaces(
  theme: Theme,
  status: LetterStatus | undefined,
  fromChar: string,
  toChar: string,
  delayMs = 0,
  options?: DrumStepFaceOptions,
): SplitFlapFaces {
  const borderColor = theme.palette.grey[300];
  const white = theme.palette.common.white;
  const fromBlank = !fromChar;
  const toBlank = !toChar;
  const evaluated =
    status === 'correct' || status === 'present' || status === 'absent';
  const solidTyped = Boolean(options?.solidUnevaluated);
  // Evaluated: status color. Typed + solid: opaque cards (lab-like folds).
  // Typed settled: transparent like a normal empty cell with a letter.
  const filled = evaluated
    ? statusBackground(theme, status)
    : solidTyped
      ? typedTileFill(theme)
      : 'transparent';
  const glyph = evaluated
    ? white
    : solidTyped
      ? typedTileText(theme)
      : theme.palette.text.primary;
  // Unevaluated clear → letter: transparent start (empty cell). Evaluated
  // blank-start (win count-up) keeps the status fill so the tile never holes.
  // Landing on blank always clears — Play Again must not stay green/yellow.
  const startBlankTransparent = fromBlank && !evaluated;

  return {
    startBackground: startBlankTransparent ? 'transparent' : filled,
    endBackground: toBlank ? 'transparent' : filled,
    startText: startBlankTransparent ? 'transparent' : glyph,
    endText: toBlank ? 'transparent' : glyph,
    borderColor,
    delayMs,
    fromBlank: startBlankTransparent,
    colorChange: false,
  };
}

export function getSplitFlapFaces(
  animation: CellAnimation,
  theme: Theme,
  status?: LetterStatus,
): SplitFlapFaces | null {
  const delayMs = 'delay' in animation ? animation.delay : 0;
  const borderColor = theme.palette.grey[300];
  const white = theme.palette.common.white;
  const statusBg = statusBackground(theme, status);
  const lossRed = theme.palette.error.main;

  switch (animation.type) {
    case 'reveal': {
      // Mid-seam fold: typed card → green/yellow (not whole-tile center rotate).
      const staggerMs = animation.index * REVEAL_FLIP_STAGGER_S * 1000;
      return {
        startBackground: typedTileFill(theme),
        endBackground: statusBg,
        startText: typedTileText(theme),
        endText: white,
        borderColor,
        delayMs: staggerMs,
        fromBlank: false,
        colorChange: true,
      };
    }
    case 'lossFlipToEmpty':
      return {
        startBackground: statusBg,
        endBackground: 'transparent',
        startText: status && status !== 'empty' ? white : 'transparent',
        endText: 'transparent',
        borderColor,
        delayMs,
        fromBlank: false,
        colorChange: true,
      };
    case 'lossReveal':
      return {
        startBackground: emptyFlapBackground(theme),
        endBackground: lossRed,
        startText: 'transparent',
        endText: white,
        borderColor,
        delayMs,
        fromBlank: true,
        colorChange: false,
      };
    case 'lossPhase2Reveal': {
      const hasLetter = Boolean(status && status !== 'empty');
      return {
        startBackground: emptyFlapBackground(theme),
        endBackground: statusBg,
        startText: 'transparent',
        endText: hasLetter ? white : 'transparent',
        borderColor,
        delayMs,
        fromBlank: true,
        colorChange: false,
      };
    }
    case 'restartFlipToEmpty':
    case 'letterEnter':
    case 'winning':
      // Handled by drum cycling in SplitFlapLetterBox.
      return null;
    default:
      return null;
  }
}

/** One-fold duration for status reveal (keeps stagger/total timing in sync). */
export const REVEAL_SPLIT_FLAP_DURATION_MS = REVEAL_STATUS_FLIP_DURATION_MS;

export function getSplitFlapAnimations(
  faces: SplitFlapFaces,
  flipDurationMs: number = SPLIT_FLAP_FLIP_DURATION_MS,
) {
  // `both` = backwards (apply 0% during stagger delay) + forwards (hold 100%).
  // Without backwards, the green/yellow back flap sits fully visible before the
  // fold starts — that was the bottom-half color flash.
  const duration = `${flipDurationMs}ms ${SPLIT_FLAP_EASING} both`;
  const deferNewTop = faces.fromBlank || Boolean(faces.colorChange);
  return {
    frontAnimation: `${flapFrontFold} ${duration}`,
    backAnimation: `${flapBackFold} ${duration}`,
    /** Defer end face on new-top until fold midpoint (blank enter / color change). */
    newTopAnimation: deferNewTop ? `${newTopRevealFold} ${duration}` : 'none',
    animationDelay: `${faces.delayMs}ms`,
  };
}

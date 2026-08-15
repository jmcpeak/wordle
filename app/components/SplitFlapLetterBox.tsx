'use client';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  CELL_MARGIN,
  CELL_SPACING,
  SPLIT_FLAP_FLIP_DURATION_MS,
  WIN_COUNT_UP_STAGGER_MS,
  WIN_COUNT_UP_STEPS,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';
import { LETTER_CELL_SEAM_LINE } from '@/utils/letterCellSeam';
import {
  getSplitFlapCountUpPath,
  getSplitFlapLetterEnterPath,
  getSplitFlapRandomClearPath,
} from '@/utils/splitFlapDrum';
import {
  getDrumStepFaces,
  getNewTopRevealCssVars,
  getSplitFlapAnimations,
  getSplitFlapFaces,
  REVEAL_SPLIT_FLAP_DURATION_MS,
  type SplitFlapFaces,
} from '@/utils/splitFlapStyles';

type SplitFlapLetterBoxProps = {
  'aria-label': string;
  animation: CellAnimation;
  children?: ReactNode;
  /** Preferred over children when set — the character on the drum. */
  letter?: string;
  disabled?: boolean;
  status?: LetterStatus;
  /** Override one-fold duration (ms). Defaults to SPLIT_FLAP_FLIP_DURATION_MS. */
  flipDurationMs?: number;
  /** Fires once when a drum walk finishes (clear or letter enter). */
  onDrumComplete?: () => void;
  /** Tile size multiplier (lab). Avoid CSS `scale()` — it flattens 3D and hides the back face. */
  sizeScale?: number;
  /**
   * When false with a drum walk, show the end letter statically (lab idle).
   */
  drumActive?: boolean;
  /** Optional precomputed drum landings. When set, overrides drum lookup. */
  drumPath?: string[];
  /**
   * Character before the first fold.
   * Defaults: '' for `letterEnter`, otherwise `letter` (clear walks).
   */
  drumStartChar?: string;
};

function resolveLetter(
  letter: string | undefined,
  children: ReactNode,
): string {
  if (letter != null && letter !== '') {
    return letter.trim().toUpperCase();
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children).trim().toUpperCase();
  }
  return '';
}

const HALF_TOP_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: '50%',
  overflow: 'hidden',
} as const;

const HALF_BOTTOM_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '50%',
  overflow: 'hidden',
} as const;

const GLYPH_FROM_TOP_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  height: '200%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const GLYPH_FROM_BOTTOM_SX = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '200%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
} as const;

const FLAP_FRONT_SX = {
  ...HALF_TOP_SX,
  overflow: 'hidden',
  transformOrigin: '50% 100%',
  borderBottom: '1px solid rgba(0, 0, 0, 0.45)',
} as const;

const FLAP_BACK_SX = {
  ...HALF_BOTTOM_SX,
  overflow: 'hidden',
  transformOrigin: '50% 0%',
  borderTop: '1px solid rgba(0, 0, 0, 0.45)',
} as const;

type FlapUnitProps = {
  ariaLabel: string;
  disabled?: boolean;
  faces: SplitFlapFaces;
  fromChar: string;
  toChar: string;
  animate: boolean;
  flipDurationMs: number;
  sizeScale: number;
};

function SplitFlapUnit({
  ariaLabel,
  disabled,
  faces,
  fromChar,
  toChar,
  animate,
  flipDurationMs,
  sizeScale,
}: FlapUnitProps) {
  const theme = useTheme();
  const size = `calc(${theme.spacing(CELL_SPACING.xs)} * ${sizeScale})`;
  const { frontAnimation, backAnimation, newTopAnimation, animationDelay } =
    animate
      ? getSplitFlapAnimations(faces, flipDurationMs)
      : {
          frontAnimation: 'none',
          backAnimation: 'none',
          newTopAnimation: 'none',
          animationDelay: '0ms',
        };

  const bottomChar = animate ? fromChar : toChar;
  const bottomBackground = animate
    ? faces.fromBlank && faces.startBackground === 'transparent'
      ? 'transparent'
      : faces.startBackground
    : faces.endBackground;
  const bottomText = animate ? faces.startText : faces.endText;

  /**
   * Underside card must stay opaque. When clearing, endBackground is transparent
   * (empty cell) — keep the start fill so the painted back doesn’t vanish.
   */
  const flapBackBackground =
    faces.endBackground === 'transparent'
      ? faces.startBackground
      : faces.endBackground;
  const flapBackText =
    faces.endBackground === 'transparent' ? faces.startText : faces.endText;

  return (
    <Box
      aria-label={ariaLabel}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        m: CELL_MARGIN,
        border: '2px solid',
        borderColor: faces.borderColor,
        boxSizing: 'border-box',
        perspective: `${280 * sizeScale}px`,
        perspectiveOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
        overflow: 'visible',
        isolation: 'isolate',
        zIndex: 0,
        backgroundColor: animate ? faces.startBackground : faces.endBackground,
        color: animate ? faces.startText : faces.endText,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        ...theme.typography.letterCell,
        fontSize:
          sizeScale === 1
            ? theme.typography.letterCell.fontSize
            : `calc(${String(theme.typography.letterCell.fontSize ?? '1.8rem')} * ${sizeScale})`,
        [theme.breakpoints.down('sm')]: {
          fontSize: sizeScale === 1 ? '2.2rem' : `${2.2 * sizeScale}rem`,
        },
        '@media (prefers-reduced-motion: reduce)': {
          '& [data-split-flap-front], & [data-split-flap-back]': {
            animation: 'none !important',
            visibility: 'hidden !important',
          },
          '& [data-split-flap-bottom], & [data-split-flap-new-top]': {
            backgroundColor: `${faces.endBackground} !important`,
            color: `${faces.endText} !important`,
          },
        },
      }}
    >
      <Box
        data-split-flap-bottom
        sx={{
          ...HALF_BOTTOM_SX,
          backgroundColor: bottomBackground,
          color: bottomText,
          zIndex: 1,
        }}
      >
        <Box sx={GLYPH_FROM_BOTTOM_SX}>{bottomChar}</Box>
      </Box>

      <Box
        data-split-flap-new-top
        style={
          animate && newTopAnimation !== 'none'
            ? getNewTopRevealCssVars(faces)
            : undefined
        }
        sx={{
          ...HALF_TOP_SX,
          // Settled (!animate): always end face. While folding, keep start fill
          // until midpoint when entering from blank or changing status color.
          backgroundColor:
            animate && (faces.fromBlank || faces.colorChange)
              ? faces.startBackground
              : faces.endBackground,
          color:
            animate && (faces.fromBlank || faces.colorChange)
              ? faces.startText
              : faces.endText,
          zIndex: 1,
          ...(animate && newTopAnimation !== 'none'
            ? {
                animation: newTopAnimation,
                animationDelay,
              }
            : null),
        }}
      >
        <Box sx={GLYPH_FROM_TOP_SX}>{toChar}</Box>
      </Box>

      <Box
        data-split-flap-front
        sx={{
          ...FLAP_FRONT_SX,
          backgroundColor: faces.startBackground,
          color: faces.startText,
          zIndex: 4,
          transformStyle: 'preserve-3d',
          willChange: animate ? 'transform' : 'auto',
          ...(animate
            ? {
                animation: frontAnimation,
                animationDelay,
              }
            : { visibility: 'hidden' }),
        }}
      >
        <Box sx={GLYPH_FROM_TOP_SX}>{fromChar}</Box>
      </Box>

      <Box
        data-split-flap-back
        sx={{
          ...FLAP_BACK_SX,
          backgroundColor: flapBackBackground,
          color: flapBackText,
          zIndex: 5,
          transformStyle: 'preserve-3d',
          willChange: animate ? 'transform, opacity' : 'auto',
          // Match 0% keyframe so a delayed animation can’t flash the end color.
          ...(animate
            ? {
                transform: 'rotateX(90deg)',
                opacity: 0,
                animation: backAnimation,
                animationDelay,
              }
            : { visibility: 'hidden' }),
        }}
      >
        <Box sx={GLYPH_FROM_BOTTOM_SX}>{toChar}</Box>
      </Box>

      <Box sx={LETTER_CELL_SEAM_LINE} />
    </Box>
  );
}

/**
 * Solari cell.
 * - `restartFlipToEmpty`: shorter path letter → clear (Play Again)
 * - `letterEnter`: clear → letter → letter (instant land + clack)
 * - `winning`: count-up settle (short drum approach, after green reveal)
 */
export default function SplitFlapLetterBox({
  'aria-label': ariaLabel,
  animation,
  children,
  letter,
  disabled,
  status,
  flipDurationMs = SPLIT_FLAP_FLIP_DURATION_MS,
  onDrumComplete,
  sizeScale = 1,
  drumActive = true,
  drumPath,
  drumStartChar,
}: SplitFlapLetterBoxProps) {
  const theme = useTheme();
  const startLetter = resolveLetter(letter, children);

  const isWinning = animation.type === 'winning';
  const isDrumWalk =
    animation.type === 'restartFlipToEmpty' ||
    animation.type === 'letterEnter' ||
    isWinning;
  const isLetterEnter = animation.type === 'letterEnter';

  const walkPath = useMemo(() => {
    if (!isDrumWalk) return null;
    if (drumPath !== undefined) return drumPath;
    if (isWinning)
      return getSplitFlapCountUpPath(startLetter, WIN_COUNT_UP_STEPS);
    if (isLetterEnter) return getSplitFlapLetterEnterPath(startLetter);
    return getSplitFlapRandomClearPath(startLetter);
  }, [isDrumWalk, isWinning, isLetterEnter, startLetter, drumPath]);

  /** Stable effect key — avoids restarting the walk when a new array instance is passed. */
  const walkPathKey = walkPath ? walkPath.join('\u0001') : '';

  const walkStartChar = drumStartChar ?? (isLetterEnter ? '' : startLetter);
  const walkEndChar: string =
    walkPath && walkPath.length > 0
      ? (walkPath.at(-1) ?? walkStartChar)
      : walkStartChar;
  const foldStartChar =
    isWinning && walkStartChar === '' ? walkEndChar : walkStartChar;

  const animationDelayMs =
    'delay' in animation
      ? animation.delay
      : isWinning
        ? animation.index * WIN_COUNT_UP_STAGGER_MS
        : 0;

  /**
   * Start on the first fold immediately when a walk is active (and undelayed)
   * so the first paint is already animating. Delayed walks stay idle on the
   * start char until the stagger timer fires.
   */
  const [stepIndex, setStepIndex] = useState(() =>
    drumActive && walkPath && walkPath.length > 0 && animationDelayMs === 0
      ? 0
      : -1,
  );
  const flipDurationMsRef = useRef(flipDurationMs);
  flipDurationMsRef.current = flipDurationMs;
  const onDrumCompleteRef = useRef(onDrumComplete);
  onDrumCompleteRef.current = onDrumComplete;
  const walkPathRef = useRef(walkPath);
  walkPathRef.current = walkPath;

  useEffect(() => {
    // Depend on walkPathKey (content) so a new array instance with the same
    // landings does not restart mid-walk.
    const activePath =
      walkPathKey.length > 0
        ? walkPathKey.split('\u0001')
        : walkPathRef.current;
    if (!activePath || !drumActive) {
      setStepIndex(-1);
      return;
    }

    if (activePath.length === 0) {
      setStepIndex(0);
      onDrumCompleteRef.current?.();
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const pathSnapshot = activePath;

    // Ensure first fold is showing (covers remounts / delay > 0).
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setStepIndex(0);

        let index = 0;
        const scheduleNext = () => {
          timers.push(
            setTimeout(() => {
              if (cancelled) return;
              index += 1;
              setStepIndex(index);
              if (index < pathSnapshot.length) {
                scheduleNext();
              } else {
                onDrumCompleteRef.current?.();
              }
            }, flipDurationMsRef.current),
          );
        };

        scheduleNext();
      }, animationDelayMs),
    );

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [walkPathKey, animationDelayMs, drumActive]);

  if (isDrumWalk && walkPath) {
    /**
     * letterEnter (and typed idle) uses opaque flap cards so folds match the
     * lab. Evaluated statuses already have solid fills.
     */
    const typedSolid =
      isLetterEnter || status === 'empty' || status === undefined
        ? ({ solidUnevaluated: true } as const)
        : undefined;

    if (!drumActive || stepIndex < 0) {
      const idleChar = !drumActive || isWinning ? walkEndChar : walkStartChar;
      const faces = getDrumStepFaces(
        theme,
        status,
        idleChar,
        idleChar,
        0,
        idleChar ? typedSolid : undefined,
      );
      return (
        <SplitFlapUnit
          ariaLabel={ariaLabel}
          disabled={disabled}
          faces={faces}
          fromChar={idleChar}
          toChar={idleChar}
          animate={false}
          flipDurationMs={flipDurationMs}
          sizeScale={sizeScale}
        />
      );
    }

    if (walkPath.length === 0 || stepIndex >= walkPath.length) {
      const faces = getDrumStepFaces(
        theme,
        status,
        walkEndChar,
        walkEndChar,
        0,
        walkEndChar ? typedSolid : undefined,
      );
      return (
        <SplitFlapUnit
          ariaLabel={ariaLabel}
          disabled={disabled}
          faces={faces}
          fromChar={walkEndChar}
          toChar={walkEndChar}
          animate={false}
          flipDurationMs={flipDurationMs}
          sizeScale={sizeScale}
        />
      );
    }

    const fromChar: string =
      stepIndex === 0
        ? foldStartChar
        : (walkPath[stepIndex - 1] ?? foldStartChar);
    const toChar: string = walkPath[stepIndex] ?? walkEndChar;
    const faces = getDrumStepFaces(
      theme,
      status,
      fromChar,
      toChar,
      0,
      typedSolid,
    );

    return (
      <SplitFlapUnit
        key={`drum-${stepIndex}-${fromChar}-${toChar}`}
        ariaLabel={ariaLabel}
        disabled={disabled}
        faces={faces}
        fromChar={fromChar}
        toChar={toChar}
        animate
        flipDurationMs={flipDurationMs}
        sizeScale={sizeScale}
      />
    );
  }

  const faces = getSplitFlapFaces(animation, theme, status);
  if (!faces) {
    return null;
  }

  const singleLetter = startLetter;
  const fromChar =
    animation.type === 'lossReveal' || animation.type === 'lossPhase2Reveal'
      ? ''
      : singleLetter;
  const toChar = animation.type === 'lossFlipToEmpty' ? '' : singleLetter;
  const oneFoldMs =
    animation.type === 'reveal'
      ? REVEAL_SPLIT_FLAP_DURATION_MS
      : flipDurationMs;

  return (
    <SplitFlapUnit
      ariaLabel={ariaLabel}
      disabled={disabled}
      faces={faces}
      fromChar={fromChar}
      toChar={toChar}
      animate
      flipDurationMs={oneFoldMs}
      sizeScale={sizeScale}
    />
  );
}

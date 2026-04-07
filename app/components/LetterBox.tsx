import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import {
  CELL_MARGIN,
  CELL_SPACING,
  SPLIT_FLAP_FLIP_DURATION_MS,
  WORD_LENGTH,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';

/** Reuse keyframe objects when color tuples repeat (reduces Emotion keyframe churn). */
const flipAnimationCache = new Map<string, ReturnType<typeof keyframes>>();
const splitFlapAnimationCache = new Map<string, ReturnType<typeof keyframes>>();

function getCachedFlipAnimation(
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
) {
  const key = `${startColor}|${endColor}|${startTextColor}|${endTextColor}`;
  let cached = flipAnimationCache.get(key);
  if (!cached) {
    cached = createFlipAnimation(
      startColor,
      endColor,
      startTextColor,
      endTextColor,
    );
    flipAnimationCache.set(key, cached);
  }
  return cached;
}

function getCachedSplitFlapAnimation(
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
  borderColor: string,
) {
  const key = `${startColor}|${endColor}|${startTextColor}|${endTextColor}|${borderColor}`;
  let cached = splitFlapAnimationCache.get(key);
  if (!cached) {
    cached = createSplitFlapAnimation(
      startColor,
      endColor,
      startTextColor,
      endTextColor,
      borderColor,
    );
    splitFlapAnimationCache.set(key, cached);
  }
  return cached;
}

const createFlipAnimation = (
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
) => keyframes`
  0% {
    transform: rotateX(0);
    background-color: ${startColor};
    color: ${startTextColor};
  }
  50% {
    transform: rotateX(-90deg);
    background-color: ${startColor};
    color: ${startTextColor};
  }
  51% {
    background-color: ${endColor};
    color: ${endTextColor};
  }
  100% {
    transform: rotateX(0);
    background-color: ${endColor};
    color: ${endTextColor};
  }
`;

/**
 * Split-flap: hinge at top, flap drops forward (rotateX 0→90deg), swap at 50%, then new face rotates up.
 * Easing: fast start, sharp stop at 50% and 100% for a mechanical "clack".
 */
const createSplitFlapAnimation = (
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
  borderColor: string,
) => keyframes`
  0% {
    transform: rotateX(0);
    background-color: ${startColor};
    color: ${startTextColor};
    border-color: ${borderColor};
  }
  50% {
    transform: rotateX(90deg);
    background-color: ${startColor};
    color: ${startTextColor};
    border-color: ${borderColor};
  }
  51% {
    background-color: ${endColor};
    color: ${endTextColor};
    border-color: ${borderColor};
  }
  100% {
    transform: rotateX(0);
    background-color: ${endColor};
    color: ${endTextColor};
    border-color: ${borderColor};
  }
`;

/** Mechanical snap: quick deceleration at the end of each half of the flip. */
const SPLIT_FLAP_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

const jump = keyframes`
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const LetterBox = styled(Box, {
  shouldForwardProp: (prop) =>
    prop !== 'status' &&
    prop !== 'isFocused' &&
    prop !== 'disabled' &&
    prop !== 'animation' &&
    prop !== 'isPlaceholder',
})<{
  status?: LetterStatus;
  isFocused?: boolean;
  disabled?: boolean;
  animation: CellAnimation;
  isPlaceholder?: boolean;
}>(({ theme, status, isFocused, disabled, animation, isPlaceholder }) => {
  const isWinning = animation.type === 'winning';
  const index = animation.type === 'winning' ? animation.index : 0;
  const isLossFlipToEmpty = animation.type === 'lossFlipToEmpty';
  const isRestartFlipToEmpty = animation.type === 'restartFlipToEmpty';
  const isLossReveal = animation.type === 'lossReveal';
  const isLossPhase2SplitFlapReveal = animation.type === 'lossPhase2Reveal';
  const isFlipToEmpty = isLossFlipToEmpty || isRestartFlipToEmpty;
  const lossAnimationDelay = 'delay' in animation ? animation.delay : 0;
  const defaultBorderColor = theme.palette.grey[300];
  const focusBorderColor = theme.palette.text.primary;

  const colors = {
    correct: theme.palette.game.correct,
    present: theme.palette.game.present,
    absent: theme.palette.game.absent,
    empty: 'transparent',
  };

  const endColor = colors[status || 'empty'];
  const startColor = 'transparent';
  const startTextColor = theme.palette.text.primary;
  const endTextColor = theme.palette.common.white;
  const phase2EndTextColor =
    status === 'empty' || !status ? 'transparent' : endTextColor;
  const lossRed = theme.palette.error.main;
  const baseTextColor =
    isWinning || !status || status === 'empty' ? startTextColor : endTextColor;
  const baseBackgroundColor =
    isWinning || isLossPhase2SplitFlapReveal || isLossReveal
      ? 'transparent'
      : endColor;
  const baseBorderColor = isFocused
    ? focusBorderColor
    : isLossReveal || isFlipToEmpty || !status || status === 'empty'
      ? defaultBorderColor
      : 'transparent';
  const isAnimated =
    isFlipToEmpty || isLossReveal || isLossPhase2SplitFlapReveal;
  const animatedBackgroundColor =
    isLossReveal || isLossPhase2SplitFlapReveal ? 'transparent' : endColor;
  const animatedTextColor =
    isLossReveal || isLossPhase2SplitFlapReveal ? 'transparent' : endTextColor;

  let flipAnimation = 'none';
  let animationDelay = '0s';
  let jumpAnimation = 'none';
  let jumpDelay = '0s';
  let reducedMotionStyles = {};

  switch (animation.type) {
    case 'winning': {
      const flipDuration = 0.6;
      const flipStagger = 0.2;
      const jumpStagger = 0.1;
      const lastFlipCompleteTime =
        (WORD_LENGTH - 1) * flipStagger + flipDuration;
      flipAnimation = `${getCachedFlipAnimation(
        startColor,
        endColor,
        startTextColor,
        endTextColor,
      )} ${flipDuration}s ease-in-out`;
      jumpAnimation = `${jump} 0.5s ease-in-out`;
      animationDelay = `${index * flipStagger}s`;
      jumpDelay = `${lastFlipCompleteTime + index * jumpStagger}s`;
      reducedMotionStyles = {
        backgroundColor: endColor,
        color: endTextColor,
        borderColor: 'transparent',
      };
      break;
    }
    case 'lossFlipToEmpty':
    case 'restartFlipToEmpty':
      flipAnimation = `${getCachedSplitFlapAnimation(
        endColor,
        'transparent',
        endTextColor,
        'transparent',
        defaultBorderColor,
      )} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      animationDelay = `${lossAnimationDelay}ms`;
      reducedMotionStyles = {
        backgroundColor: 'transparent',
        color: 'transparent',
        borderColor: defaultBorderColor,
      };
      break;
    case 'lossReveal':
      flipAnimation = `${getCachedSplitFlapAnimation(
        'transparent',
        lossRed,
        'transparent',
        endTextColor,
        defaultBorderColor,
      )} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      animationDelay = `${lossAnimationDelay}ms`;
      reducedMotionStyles = {
        backgroundColor: lossRed,
        color: endTextColor,
        borderColor: defaultBorderColor,
      };
      break;
    case 'lossPhase2Reveal':
      flipAnimation = `${getCachedSplitFlapAnimation(
        'transparent',
        endColor,
        'transparent',
        phase2EndTextColor,
        defaultBorderColor,
      )} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      animationDelay = `${lossAnimationDelay}ms`;
      reducedMotionStyles = {
        backgroundColor: endColor,
        color: phase2EndTextColor,
        borderColor: defaultBorderColor,
      };
      break;
    default:
      break;
  }

  return {
    width: theme.spacing(CELL_SPACING.sm),
    height: theme.spacing(CELL_SPACING.sm),
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing(CELL_SPACING.xs),
      height: theme.spacing(CELL_SPACING.xs),
      fontSize: '1.44rem',
    },
    border: '2px solid',
    borderColor: baseBorderColor,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.typography.letterCell,
    margin: theme.spacing(CELL_MARGIN),
    backgroundColor: baseBackgroundColor,
    color: baseTextColor,
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'border-color 0.1s ease-in-out, opacity 0.2s ease-in-out',
    ...(isAnimated && {
      transformOrigin: '50% 0%',
      transformStyle: 'preserve-3d',
      backfaceVisibility: 'hidden',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      willChange: 'transform, background-color',
      backgroundColor: animatedBackgroundColor,
      color: animatedTextColor,
      border: '2px solid',
      borderColor: defaultBorderColor,
    }),
    animation: `${flipAnimation}, ${jumpAnimation}`,
    animationDelay: `${animationDelay}, ${jumpDelay}`,
    animationFillMode: 'forwards',
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
      transition: 'none',
      ...reducedMotionStyles,
    },
    ...(isPlaceholder && {
      backgroundColor: theme.palette.grey[300],
      borderColor: theme.palette.grey[300],
      color: theme.palette.text.disabled,
    }),
  };
});

export default LetterBox;

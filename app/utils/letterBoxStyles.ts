import type { Theme } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import {
  CELL_MARGIN,
  CELL_SPACING,
  REVEAL_FLIP_DURATION_S,
  REVEAL_FLIP_STAGGER_S,
  SPLIT_FLAP_FLIP_DURATION_MS,
  WORD_LENGTH,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';

export type LetterBoxStyleProps = {
  theme: Theme;
  status?: LetterStatus;
  isFocused?: boolean;
  disabled?: boolean;
  animation: CellAnimation;
  isPlaceholder?: boolean;
};

const animationCache = new Map<string, ReturnType<typeof keyframes>>();

function getCachedKeyframes(
  cacheKey: string,
  factory: () => ReturnType<typeof keyframes>,
): ReturnType<typeof keyframes> {
  let cached = animationCache.get(cacheKey);
  if (!cached) {
    cached = factory();
    animationCache.set(cacheKey, cached);
  }
  return cached;
}

function createFlipKeyframes(
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
  borderColor?: string,
) {
  const borderProps = borderColor ? `border-color: ${borderColor};` : '';
  const rotateAngle = borderColor ? '90deg' : '-90deg';
  return keyframes`
    0% {
      transform: rotateX(0);
      background-color: ${startColor};
      color: ${startTextColor};
      ${borderProps}
    }
    50% {
      transform: rotateX(${rotateAngle});
      background-color: ${startColor};
      color: ${startTextColor};
      ${borderProps}
    }
    51% {
      background-color: ${endColor};
      color: ${endTextColor};
      ${borderProps}
    }
    100% {
      transform: rotateX(0);
      background-color: ${endColor};
      color: ${endTextColor};
      ${borderProps}
    }
  `;
}

const SPLIT_FLAP_EASING = 'cubic-bezier(0.33, 1, 0.68, 1)';

const jump = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

type AnimationResult = {
  flipAnimation: string;
  animationDelay: string;
  jumpAnimation: string;
  jumpDelay: string;
  reducedMotionStyles: Record<string, string>;
};

function getFlip(
  startColor: string,
  endColor: string,
  startTextColor: string,
  endTextColor: string,
  borderColor?: string,
): ReturnType<typeof keyframes> {
  const key = `${startColor}|${endColor}|${startTextColor}|${endTextColor}|${borderColor ?? ''}`;
  return getCachedKeyframes(key, () =>
    createFlipKeyframes(
      startColor,
      endColor,
      startTextColor,
      endTextColor,
      borderColor,
    ),
  );
}

function computeAnimations(
  animation: CellAnimation,
  endColor: string,
  endTextColor: string,
  startColor: string,
  startTextColor: string,
  phase2EndTextColor: string,
  lossRed: string,
  defaultBorderColor: string,
): AnimationResult {
  const result: AnimationResult = {
    flipAnimation: 'none',
    animationDelay: '0s',
    jumpAnimation: 'none',
    jumpDelay: '0s',
    reducedMotionStyles: {},
  };

  const delay = 'delay' in animation ? animation.delay : 0;

  switch (animation.type) {
    case 'winning': {
      const jumpStagger = 0.1;
      const lastFlipComplete =
        (WORD_LENGTH - 1) * REVEAL_FLIP_STAGGER_S + REVEAL_FLIP_DURATION_S;
      result.flipAnimation = `${getFlip(startColor, endColor, startTextColor, endTextColor)} ${REVEAL_FLIP_DURATION_S}s ease-in-out`;
      result.jumpAnimation = `${jump} 0.5s ease-in-out`;
      result.animationDelay = `${animation.index * REVEAL_FLIP_STAGGER_S}s`;
      result.jumpDelay = `${lastFlipComplete + animation.index * jumpStagger}s`;
      result.reducedMotionStyles = {
        backgroundColor: endColor,
        color: endTextColor,
        borderColor: 'transparent',
      };
      break;
    }
    case 'reveal': {
      result.flipAnimation = `${getFlip(startColor, endColor, startTextColor, endTextColor)} ${REVEAL_FLIP_DURATION_S}s ease-in-out`;
      result.animationDelay = `${animation.index * REVEAL_FLIP_STAGGER_S}s`;
      result.reducedMotionStyles = {
        backgroundColor: endColor,
        color: endTextColor,
        borderColor: 'transparent',
      };
      break;
    }
    case 'lossFlipToEmpty':
    case 'restartFlipToEmpty':
      result.flipAnimation = `${getFlip(endColor, 'transparent', endTextColor, 'transparent', defaultBorderColor)} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      result.animationDelay = `${delay}ms`;
      result.reducedMotionStyles = {
        backgroundColor: 'transparent',
        color: 'transparent',
        borderColor: defaultBorderColor,
      };
      break;
    case 'lossReveal':
      result.flipAnimation = `${getFlip('transparent', lossRed, 'transparent', endTextColor, defaultBorderColor)} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      result.animationDelay = `${delay}ms`;
      result.reducedMotionStyles = {
        backgroundColor: lossRed,
        color: endTextColor,
        borderColor: defaultBorderColor,
      };
      break;
    case 'lossPhase2Reveal':
      result.flipAnimation = `${getFlip('transparent', endColor, 'transparent', phase2EndTextColor, defaultBorderColor)} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      result.animationDelay = `${delay}ms`;
      result.reducedMotionStyles = {
        backgroundColor: endColor,
        color: phase2EndTextColor,
        borderColor: defaultBorderColor,
      };
      break;
    default:
      break;
  }

  return result;
}

export function computeCellStyles({
  theme,
  status,
  isFocused,
  disabled,
  animation,
  isPlaceholder,
}: LetterBoxStyleProps) {
  const isWinning = animation.type === 'winning';
  const isRevealing = animation.type === 'reveal';
  const isLossReveal = animation.type === 'lossReveal';
  const isLossPhase2 = animation.type === 'lossPhase2Reveal';
  const isFlipToEmpty =
    animation.type === 'lossFlipToEmpty' ||
    animation.type === 'restartFlipToEmpty';
  const isAnimated = isFlipToEmpty || isLossReveal || isLossPhase2;

  const defaultBorderColor = theme.palette.grey[300];
  const colors: Record<string, string> = {
    correct: theme.palette.game.correct,
    present: theme.palette.game.present,
    absent: theme.palette.game.absent,
    empty: 'transparent',
  };

  const endColor = colors[status || 'empty'] ?? 'transparent';
  const startColor = 'transparent';
  const startTextColor = theme.palette.text.primary;
  const endTextColor = theme.palette.common.white;
  const phase2EndTextColor =
    status === 'empty' || !status ? 'transparent' : endTextColor;
  const lossRed = theme.palette.error.main;

  const baseTextColor =
    isWinning || isRevealing || !status || status === 'empty'
      ? startTextColor
      : endTextColor;
  const baseBackgroundColor =
    isWinning || isRevealing || isLossPhase2 || isLossReveal
      ? 'transparent'
      : endColor;
  const baseBorderColor = isFocused
    ? theme.palette.text.primary
    : isLossReveal || isFlipToEmpty || !status || status === 'empty'
      ? defaultBorderColor
      : 'transparent';

  const animatedBackgroundColor =
    isLossReveal || isLossPhase2 ? 'transparent' : endColor;
  const animatedTextColor =
    isLossReveal || isLossPhase2 ? 'transparent' : endTextColor;

  const {
    flipAnimation,
    animationDelay,
    jumpAnimation,
    jumpDelay,
    reducedMotionStyles,
  } = computeAnimations(
    animation,
    endColor,
    endTextColor,
    startColor,
    startTextColor,
    phase2EndTextColor,
    lossRed,
    defaultBorderColor,
  );

  return {
    width: theme.spacing(CELL_SPACING.sm),
    height: theme.spacing(CELL_SPACING.sm),
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing(CELL_SPACING.xs),
      height: theme.spacing(CELL_SPACING.xs),
      fontSize: '2.2rem',
    },
    border: '2px solid',
    borderColor: baseBorderColor,
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    ...theme.typography.letterCell,
    margin: theme.spacing(CELL_MARGIN),
    backgroundColor: baseBackgroundColor,
    color: baseTextColor,
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? ('none' as const) : ('auto' as const),
    transition: 'border-color 0.1s ease-in-out, opacity 0.2s ease-in-out',
    ...(isAnimated && {
      transformOrigin: '50% 0%' as const,
      transformStyle: 'preserve-3d' as const,
      backfaceVisibility: 'hidden' as const,
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      willChange: 'transform, background-color',
      backgroundColor: animatedBackgroundColor,
      color: animatedTextColor,
      border: '2px solid',
      borderColor: defaultBorderColor,
    }),
    animation: `${flipAnimation}, ${jumpAnimation}`,
    animationDelay: `${animationDelay}, ${jumpDelay}`,
    animationFillMode: 'forwards' as const,
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
}

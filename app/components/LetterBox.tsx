import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import {
  CELL_MARGIN,
  CELL_SPACING,
  SPLIT_FLAP_FLIP_DURATION_MS,
} from '@/constants';
import type { LetterStatus } from '@/types';

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
) => keyframes`
  0% {
    transform: rotateX(0);
    background-color: ${startColor};
    color: ${startTextColor};
  }
  50% {
    transform: rotateX(90deg);
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
    prop !== 'isWinning' &&
    prop !== 'disabled' &&
    prop !== 'isLossFlipToEmpty' &&
    prop !== 'isLossReveal' &&
    prop !== 'isRestartFlipToEmpty' &&
    prop !== 'lossAnimationDelay',
})<{
  status?: LetterStatus;
  isFocused?: boolean;
  isWinning?: boolean;
  disabled?: boolean;
  index: number;
  isLossFlipToEmpty?: boolean;
  isLossReveal?: boolean;
  isRestartFlipToEmpty?: boolean;
  lossAnimationDelay?: number;
}>(
  ({
    theme,
    status,
    isFocused,
    isWinning,
    disabled,
    index,
    isLossFlipToEmpty,
    isLossReveal,
    isRestartFlipToEmpty,
    lossAnimationDelay = 0,
  }) => {
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

    const lossRed = theme.palette.error.main;

    let flipAnimation = 'none';
    let animationDelay = '0s';
    let jumpAnimation = 'none';
    let jumpDelay = '0s';

    if (isWinning) {
      flipAnimation = `${createFlipAnimation(
        startColor,
        endColor,
        startTextColor,
        endTextColor,
      )} 0.6s ease-in-out`;
      jumpAnimation = `${jump} 0.5s ease-in-out`;
      animationDelay = `${index * 0.2}s`;
      jumpDelay = `${index * 0.1 + 0.6}s`;
    } else if (isLossFlipToEmpty || isRestartFlipToEmpty) {
      const lossStartColor = endColor;
      const lossEndColor = 'transparent';
      const lossStartText = endTextColor;
      const lossEndText = 'transparent';
      flipAnimation = `${createSplitFlapAnimation(
        lossStartColor,
        lossEndColor,
        lossStartText,
        lossEndText,
      )} ${SPLIT_FLAP_FLIP_DURATION_MS}ms ${SPLIT_FLAP_EASING}`;
      animationDelay = `${lossAnimationDelay}ms`;
    } else if (isLossReveal) {
      flipAnimation = `${createFlipAnimation(
        'transparent',
        lossRed,
        'transparent',
        theme.palette.common.white,
      )} 0.6s ease-in-out`;
      animationDelay = `${lossAnimationDelay}ms`;
    }

    const isFlipToEmpty = isLossFlipToEmpty || isRestartFlipToEmpty;
    const getFinalTextColor = () => {
      if (isWinning) return startTextColor;
      if (isLossReveal) return theme.palette.common.white;
      if (isFlipToEmpty) return 'transparent';
      if (status && status !== 'empty') return endTextColor;
      return startTextColor;
    };

    const getBackgroundColor = () => {
      if (isWinning) return 'transparent';
      if (isLossReveal) return lossRed;
      if (isFlipToEmpty) return 'transparent';
      return endColor;
    };

    const getBorderColor = () => {
      if (isFocused) return theme.palette.text.primary;
      if (isLossReveal) return 'transparent';
      if (isFlipToEmpty) return theme.palette.grey[300];
      if (status === 'empty' || !status) return theme.palette.grey[300];
      return 'transparent';
    };

    return {
      width: theme.spacing(CELL_SPACING.sm),
      height: theme.spacing(CELL_SPACING.sm),
      [theme.breakpoints.down('sm')]: {
        width: theme.spacing(CELL_SPACING.xs),
        height: theme.spacing(CELL_SPACING.xs),
        fontSize: '1.44rem',
      },
      border: '2px solid',
      borderColor: getBorderColor(),
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      ...theme.typography.letterCell,
      margin: theme.spacing(CELL_MARGIN),
      backgroundColor: getBackgroundColor(),
      color: getFinalTextColor(),
      opacity: disabled ? 0.5 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
      transition: 'border-color 0.1s ease-in-out, opacity 0.2s ease-in-out',
      ...(isFlipToEmpty && {
        transformOrigin: '50% 0%',
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }),
      animation: `${flipAnimation}, ${jumpAnimation}`,
      animationDelay: `${animationDelay}, ${jumpDelay}`,
      animationFillMode: 'forwards',
      '@media (prefers-reduced-motion: reduce)': {
        animation: 'none',
        transition: 'none',
      },
    };
  },
);

export default LetterBox;

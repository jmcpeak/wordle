import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { keyframes } from '@mui/system';
import { CELL_MARGIN, CELL_SPACING } from '@/constants';
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
    prop !== 'disabled',
})<{
  status?: LetterStatus;
  isFocused?: boolean;
  isWinning?: boolean;
  disabled?: boolean;
  index: number;
}>(({ theme, status, isFocused, isWinning, disabled, index }) => {
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

  const flipAnimation = isWinning
    ? `${createFlipAnimation(
        startColor,
        endColor,
        startTextColor,
        endTextColor,
      )} 0.6s ease-in-out`
    : 'none';
  const jumpAnimation = isWinning ? `${jump} 0.5s ease-in-out` : 'none';
  const animationDelay = isWinning ? `${index * 0.2}s` : '0s';
  const jumpDelay = isWinning ? `${index * 0.1 + 0.6}s` : '0s'; // Stagger jump after flip

  const getFinalTextColor = () => {
    if (isWinning) return startTextColor;
    if (status && status !== 'empty') return endTextColor;
    return startTextColor;
  };

  return {
    width: theme.spacing(CELL_SPACING.sm),
    height: theme.spacing(CELL_SPACING.sm),
    [theme.breakpoints.down('sm')]: {
      width: theme.spacing(CELL_SPACING.xs),
      height: theme.spacing(CELL_SPACING.xs),
      fontSize: '1.2rem',
    },
    border: '2px solid',
    borderColor: isFocused
      ? theme.palette.text.primary
      : status === 'empty' || !status
        ? theme.palette.grey[300]
        : 'transparent',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.typography.letterCell,
    margin: theme.spacing(CELL_MARGIN),
    backgroundColor: isWinning ? 'transparent' : endColor,
    color: getFinalTextColor(),
    opacity: disabled ? 0.5 : 1,
    pointerEvents: disabled ? 'none' : 'auto',
    transition: 'border-color 0.1s ease-in-out, opacity 0.2s ease-in-out',
    animation: `${flipAnimation}, ${jumpAnimation}`,
    animationDelay: `${animationDelay}, ${jumpDelay}`,
    animationFillMode: 'forwards',
  };
});

export default LetterBox;

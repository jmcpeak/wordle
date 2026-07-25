import type { Theme } from '@mui/material/styles';
import { CELL_MARGIN, CELL_SPACING } from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';
import { LETTER_CELL_SEAM_PSEUDO } from '@/utils/letterCellSeam';
import { typedTileText } from '@/utils/splitFlapStyles';

export type LetterBoxStyleProps = {
  theme: Theme;
  status?: LetterStatus;
  isFocused?: boolean;
  disabled?: boolean;
  animation: CellAnimation;
  isPlaceholder?: boolean;
};

export function computeCellStyles({
  theme,
  status,
  isFocused,
  disabled,
  isPlaceholder,
}: LetterBoxStyleProps) {
  const defaultBorderColor = theme.palette.grey[300];
  const colors: Record<string, string> = {
    correct: theme.palette.game.correct,
    present: theme.palette.game.present,
    absent: theme.palette.game.absent,
    empty: 'transparent',
  };

  const endColor = colors[status || 'empty'] ?? 'transparent';
  const endTextColor = theme.palette.common.white;
  const emptyTextColor = typedTileText(theme);

  const baseTextColor =
    !status || status === 'empty' ? emptyTextColor : endTextColor;
  const baseBackgroundColor = endColor;
  const baseBorderColor = isFocused
    ? theme.palette.text.primary
    : !status || status === 'empty'
      ? defaultBorderColor
      : 'transparent';

  return {
    position: 'relative' as const,
    width: theme.spacing(CELL_SPACING.xs),
    height: theme.spacing(CELL_SPACING.xs),
    [theme.breakpoints.down('sm')]: {
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
    '&::after': LETTER_CELL_SEAM_PSEUDO,
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
    ...(isPlaceholder && {
      backgroundColor: theme.palette.grey[300],
      borderColor: theme.palette.grey[300],
      color: theme.palette.text.disabled,
    }),
  };
}

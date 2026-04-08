import { memo } from 'react';
import LetterBox from '@/components/LetterBox';
import {
  LOSS_FLIP_COL_STAGGER_MS,
  LOSS_FLIP_ROW_STAGGER_MS,
  PLACEHOLDER_CHAR,
  PLACEHOLDER_DISPLAY,
  WORD_LENGTH,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';
import {
  type LossRowFlags,
  lossRowHasPhase2SplitFlap,
} from '@/utils/guessGridLossCells';

type GridCellProps = {
  ariaLabel: string;
  colIndex: number;
  disabled?: boolean;
  gameOver: boolean;
  isCurrentRow: boolean;
  isLossFlipToEmpty: boolean;
  isRestartFlipToEmpty: boolean;
  isRevealingRow: boolean;
  isWinningRow: boolean;
  letter: string;
  lossFlags: LossRowFlags;
  rowIndex: number;
  status: LetterStatus;
  currentGuessLength: number;
};

function getCellDelay(
  rowIndex: number,
  colIndex: number,
  shouldAnimate: boolean,
): number {
  if (!shouldAnimate) return 0;
  return (
    rowIndex * LOSS_FLIP_ROW_STAGGER_MS + colIndex * LOSS_FLIP_COL_STAGGER_MS
  );
}

function getCellAnimation(
  rowIndex: number,
  colIndex: number,
  isWinningRow: boolean,
  isRevealingRow: boolean,
  isLossFlipToEmpty: boolean,
  isRestartFlipToEmpty: boolean,
  lossFlags: LossRowFlags,
): CellAnimation {
  const isRevealCell = lossFlags.isLossRevealRow;
  const isPhase2SplitFlap = lossRowHasPhase2SplitFlap(lossFlags);
  const delay = getCellDelay(
    rowIndex,
    colIndex,
    isLossFlipToEmpty || isRestartFlipToEmpty || isPhase2SplitFlap,
  );

  if (isWinningRow) return { type: 'winning', index: colIndex };
  if (isRevealingRow) return { type: 'reveal', index: colIndex };
  if (isLossFlipToEmpty) return { type: 'lossFlipToEmpty', delay };
  if (isRestartFlipToEmpty) return { type: 'restartFlipToEmpty', delay };
  if (isRevealCell) return { type: 'lossReveal', delay };
  if (isPhase2SplitFlap) return { type: 'lossPhase2Reveal', delay };
  return { type: 'none' };
}

function isCellFocused(
  gameOver: boolean,
  isCurrentRow: boolean,
  colIndex: number,
  currentGuessLength: number,
): boolean {
  return (
    !gameOver &&
    isCurrentRow &&
    (colIndex === currentGuessLength ||
      (currentGuessLength === WORD_LENGTH && colIndex === WORD_LENGTH - 1))
  );
}

export default memo(function GridCell({
  ariaLabel,
  colIndex,
  disabled,
  gameOver,
  isCurrentRow,
  isLossFlipToEmpty,
  isRestartFlipToEmpty,
  isRevealingRow,
  isWinningRow,
  letter,
  lossFlags,
  rowIndex,
  status,
  currentGuessLength,
}: GridCellProps) {
  const isRevealCell = lossFlags.isLossRevealRow;
  const animation = getCellAnimation(
    rowIndex,
    colIndex,
    isWinningRow,
    isRevealingRow,
    isLossFlipToEmpty,
    isRestartFlipToEmpty,
    lossFlags,
  );

  const cellIsPlaceholder = isCurrentRow && letter === PLACEHOLDER_CHAR;
  const displayLetter = cellIsPlaceholder ? PLACEHOLDER_DISPLAY : letter;

  return (
    <LetterBox
      aria-label={ariaLabel}
      animation={animation}
      disabled={disabled}
      isFocused={isCellFocused(
        gameOver,
        isCurrentRow,
        colIndex,
        currentGuessLength,
      )}
      isPlaceholder={cellIsPlaceholder}
      status={isRevealCell ? undefined : status}
    >
      {displayLetter}
    </LetterBox>
  );
});

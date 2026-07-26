import { memo, useMemo } from 'react';
import LetterBox from '@/components/LetterBox';
import SplitFlapLetterBox from '@/components/SplitFlapLetterBox';
import {
  LOSS_FLIP_COL_STAGGER_MS,
  LOSS_FLIP_ROW_STAGGER_MS,
  PLACEHOLDER_CHAR,
  PLACEHOLDER_DISPLAY,
  WIN_COUNT_UP_STEPS,
  WORD_LENGTH,
} from '@/constants';
import type { CellAnimation, LetterStatus } from '@/types';
import {
  type LossRowFlags,
  lossRowHasPhase2SplitFlap,
} from '@/utils/guessGridLossCells';
import {
  getSplitFlapCountUpPath,
  getSplitFlapCountUpStartChar,
  getSplitFlapLetterEnterPath,
} from '@/utils/splitFlapDrum';

const LETTER_ENTER_ANIMATION = {
  type: 'letterEnter' as const,
  delay: 0,
};

function isSplitFlapAnimation(animation: CellAnimation): boolean {
  return (
    animation.type === 'reveal' ||
    animation.type === 'winning' ||
    animation.type === 'lossFlipToEmpty' ||
    animation.type === 'restartFlipToEmpty' ||
    animation.type === 'letterEnter' ||
    animation.type === 'lossReveal' ||
    animation.type === 'lossPhase2Reveal'
  );
}

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
  isCurrentRow: boolean,
  letter: string,
  status: LetterStatus,
): CellAnimation {
  const isRevealCell = lossFlags.isLossRevealRow;
  const isPhase2SplitFlap = lossRowHasPhase2SplitFlap(lossFlags);
  const delay = getCellDelay(
    rowIndex,
    colIndex,
    isLossFlipToEmpty || isRestartFlipToEmpty || isPhase2SplitFlap,
  );

  if (isWinningRow) return { type: 'winning', index: colIndex };
  // Enter reveal: only green (correct) and yellow (present) flip to color.
  // Absent tiles keep their typed look / settle without a status flip.
  if (isRevealingRow) {
    if (status === 'correct' || status === 'present') {
      return { type: 'reveal', index: colIndex };
    }
    return { type: 'none' };
  }
  if (isLossFlipToEmpty) return { type: 'lossFlipToEmpty', delay };
  if (isRestartFlipToEmpty) return { type: 'restartFlipToEmpty', delay };
  if (isRevealCell) return { type: 'lossReveal', delay };
  if (isPhase2SplitFlap) return { type: 'lossPhase2Reveal', delay };
  // Typed guess letter — same `letterEnter` drum as `/test/click-clack-lab`.
  if (isCurrentRow && letter && letter !== PLACEHOLDER_CHAR) {
    return LETTER_ENTER_ANIMATION;
  }
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
    isCurrentRow,
    letter,
    status,
  );

  const cellIsPlaceholder = isCurrentRow && letter === PLACEHOLDER_CHAR;
  const displayLetter = cellIsPlaceholder ? PLACEHOLDER_DISPLAY : letter;
  const cellStatus = isRevealCell ? undefined : status;

  const drumPath = useMemo(() => {
    if (animation.type === 'winning' && displayLetter) {
      return getSplitFlapCountUpPath(displayLetter, WIN_COUNT_UP_STEPS);
    }
    if (animation.type !== 'letterEnter' || !displayLetter) return undefined;
    return getSplitFlapLetterEnterPath(displayLetter);
  }, [animation.type, displayLetter]);

  if (isSplitFlapAnimation(animation)) {
    const isWinning = animation.type === 'winning';
    return (
      <SplitFlapLetterBox
        // Remount on letter change; stable across letterEnter → status reveal.
        // Remount on winning so count-up settle starts after green reveal.
        key={
          animation.type === 'letterEnter' || animation.type === 'reveal'
            ? `typed-${displayLetter}`
            : isWinning
              ? `winning-${displayLetter}`
              : 'split-flap'
        }
        aria-label={ariaLabel}
        animation={animation}
        disabled={disabled}
        letter={displayLetter}
        status={cellStatus}
        drumPath={drumPath}
        drumStartChar={
          animation.type === 'letterEnter'
            ? ''
            : isWinning
              ? getSplitFlapCountUpStartChar(displayLetter, WIN_COUNT_UP_STEPS)
              : undefined
        }
      >
        {displayLetter}
      </SplitFlapLetterBox>
    );
  }

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
      status={cellStatus}
    >
      {displayLetter}
    </LetterBox>
  );
});

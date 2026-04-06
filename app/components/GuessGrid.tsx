'use client';

import Stack from '@mui/material/Stack';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import LetterBox from '@/components/LetterBox';
import LetterRow from '@/components/LetterRow';
import {
  LOSS_FLIP_COL_STAGGER_MS,
  LOSS_FLIP_ROW_STAGGER_MS,
  LOSS_PHASE2_DELAY_MS,
  MAX_GUESSES,
  WORD_LENGTH,
} from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import type { CellAnimation, LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';
import {
  createLossRevealRows,
  getLossGridCellLetter,
  getLossGridCellStatus,
  getLossRowFlags,
  type LossPhase,
  type LossRowFlags,
  lossRowHasPhase2SplitFlap,
} from '@/utils/guessGridLossCells';

type GuessGridProps = {
  currentGuess: string;
  disabled?: boolean;
  gameOver: boolean;
  guesses: string[];
  isLost: boolean;
  isRestarting?: boolean;
  shake: boolean;
  solution: string;
};

const ROW_INDICES = Array.from({ length: MAX_GUESSES }, (_, index) => index);
const COLUMN_INDICES = Array.from({ length: WORD_LENGTH }, (_, index) => index);
const EMPTY_ROW_STATUSES: LetterStatus[] = Array.from(
  { length: WORD_LENGTH },
  () => 'empty',
);

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
  isLossFlipToEmpty: boolean,
  isRestartFlipToEmpty: boolean,
  lossFlags: LossRowFlags,
): CellAnimation {
  const isRevealCell = lossFlags.isLossRevealRow;
  const isLossPhase2SplitFlapRow = lossRowHasPhase2SplitFlap(lossFlags);
  const delay = getCellDelay(
    rowIndex,
    colIndex,
    isLossFlipToEmpty || isRestartFlipToEmpty || isLossPhase2SplitFlapRow,
  );

  if (isWinningRow) return { type: 'winning', index: colIndex };
  if (isLossFlipToEmpty) return { type: 'lossFlipToEmpty', delay };
  if (isRestartFlipToEmpty) return { type: 'restartFlipToEmpty', delay };
  if (isRevealCell) return { type: 'lossReveal', delay };
  if (isLossPhase2SplitFlapRow) return { type: 'lossPhase2Reveal', delay };
  return { type: 'none' };
}

export default memo(function GuessGrid({
  currentGuess,
  disabled,
  gameOver,
  guesses,
  isLost,
  isRestarting = false,
  shake,
  solution,
}: GuessGridProps) {
  const { t } = useTranslation();
  const [lossPhase, setLossPhase] = useState<LossPhase>('flipToEmpty');

  const completedRowStatuses = useMemo(
    () => guesses.map((guess) => checkGuess(guess, solution)),
    [guesses, solution],
  );

  useEffect(() => {
    if (!isLost) {
      setLossPhase('flipToEmpty');
      return;
    }
    setLossPhase('flipToEmpty');
    const timeoutId = setTimeout(() => {
      setLossPhase('flipToSolution');
    }, LOSS_PHASE2_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isLost]);

  const splitFlapActive =
    (isLost &&
      (lossPhase === 'flipToEmpty' || lossPhase === 'flipToSolution')) ||
    isRestarting;
  const statusLabels = useMemo(
    () => ({
      correct: t('game.status.correct'),
      present: t('game.status.present'),
      absent: t('game.status.absent'),
      empty: t('game.status.empty'),
      revealed: t('game.status.revealed'),
    }),
    [t],
  );
  const lossRevealRows = useMemo(
    () =>
      createLossRevealRows(
        t('game.lossReveal.the'),
        t('game.lossReveal.word'),
        t('game.lossReveal.was'),
      ),
    [t],
  );

  const getStatusLabel = useCallback(
    (status: LetterStatus) => statusLabels[status],
    [statusLabels],
  );

  return (
    <Stack
      role="group"
      aria-label={t('game.guessGrid')}
      alignItems="center"
      spacing={0}
      sx={{
        mb: 4,
        ...(splitFlapActive && { perspective: '400px' }),
      }}
    >
      {ROW_INDICES.map((rowIndex) => {
        const guess =
          guesses[rowIndex] ||
          (rowIndex === guesses.length ? currentGuess : '');
        const isCompleted = rowIndex < guesses.length;
        const isCurrentRow = rowIndex === guesses.length;
        const rowStatuses = isCompleted
          ? completedRowStatuses[rowIndex]
          : EMPTY_ROW_STATUSES;
        const shouldShake = isCurrentRow && shake;
        const isWinningRow =
          !isLost &&
          !isRestarting &&
          !splitFlapActive &&
          gameOver &&
          isCompleted &&
          guesses[rowIndex] === solution;

        const isLossFlipToEmpty = isLost && lossPhase === 'flipToEmpty';
        const isRestartFlipToEmpty = isRestarting;
        const lossFlags = getLossRowFlags(isLost, lossPhase, rowIndex);

        return (
          <LetterRow key={`row-${rowIndex}`} shake={shouldShake}>
            {COLUMN_INDICES.map((colIndex) => {
              const letter = getLossGridCellLetter(
                isLost,
                lossPhase,
                lossFlags,
                lossRevealRows,
                colIndex,
                guess,
                solution,
              );
              const status = getLossGridCellStatus(
                isLost,
                lossPhase,
                lossRevealRows,
                colIndex,
                rowStatuses,
                lossFlags,
              );

              const isRevealCell = lossFlags.isLossRevealRow;
              const statusLabel = isRevealCell
                ? statusLabels.revealed
                : getStatusLabel(status);
              const ariaLabel = letter
                ? t('game.gridCell.filled', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                    letter,
                    status: statusLabel,
                  })
                : t('game.gridCell.empty', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                  });
              const animation = getCellAnimation(
                rowIndex,
                colIndex,
                isWinningRow,
                isLossFlipToEmpty,
                isRestartFlipToEmpty,
                lossFlags,
              );

              return (
                <LetterBox
                  aria-label={ariaLabel}
                  animation={animation}
                  disabled={disabled}
                  isFocused={isCellFocused(
                    gameOver,
                    isCurrentRow,
                    colIndex,
                    currentGuess.length,
                  )}
                  key={`col-${colIndex}`}
                  status={isRevealCell ? undefined : status}
                >
                  {letter}
                </LetterBox>
              );
            })}
          </LetterRow>
        );
      })}
    </Stack>
  );
});

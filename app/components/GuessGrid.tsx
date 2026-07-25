'use client';

import Stack from '@mui/material/Stack';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GridCell from '@/components/GridCell';
import LetterRow from '@/components/LetterRow';
import {
  MAX_GUESSES,
  REVEAL_TOTAL_DURATION_MS,
  WORD_LENGTH,
} from '@/constants';
import { useLossPhase } from '@/hooks/useLossPhase';
import { useTranslation } from '@/store/i18nStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';
import {
  createLossRevealRows,
  getLossGridCellLetter,
  getLossGridCellStatus,
  getLossRowFlags,
} from '@/utils/guessGridLossCells';

type GuessGridProps = {
  compactLayout?: boolean;
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

export default memo(function GuessGrid({
  compactLayout = false,
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
  const lossPhase = useLossPhase(isLost);

  const prevGuessCount = useRef(guesses.length);
  const [revealingRowIndex, setRevealingRowIndex] = useState<number | null>(
    null,
  );

  // Derive the revealing row during render when guesses grow so the first paint
  // already uses the flip animation (useEffect would flash final colors for a frame).
  let activeRevealingRowIndex = revealingRowIndex;
  if (guesses.length > prevGuessCount.current) {
    activeRevealingRowIndex = guesses.length - 1;
    prevGuessCount.current = guesses.length;
    if (revealingRowIndex !== activeRevealingRowIndex) {
      setRevealingRowIndex(activeRevealingRowIndex);
    }
  } else if (guesses.length < prevGuessCount.current) {
    prevGuessCount.current = guesses.length;
    activeRevealingRowIndex = null;
    if (revealingRowIndex !== null) {
      setRevealingRowIndex(null);
    }
  }

  useEffect(() => {
    if (revealingRowIndex === null) return;
    const timer = setTimeout(
      () => setRevealingRowIndex(null),
      REVEAL_TOTAL_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [revealingRowIndex]);

  const completedRowStatuses = useMemo(
    () => guesses.map((guess) => checkGuess(guess, solution)),
    [guesses, solution],
  );

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
      spacing={0}
      sx={{
        alignItems: 'center',
        mt: compactLayout ? 0 : { xs: 0, sm: 3 },
        mb: compactLayout ? 1 : 4,
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
        // Reveal runs first on a win; row shutter starts only after reveal clears.
        const isWinningRow =
          !isLost &&
          !isRestarting &&
          !splitFlapActive &&
          gameOver &&
          isCompleted &&
          guesses[rowIndex] === solution &&
          activeRevealingRowIndex === null;

        const isRevealingRow = activeRevealingRowIndex === rowIndex;

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

              return (
                <GridCell
                  key={`col-${colIndex}`}
                  ariaLabel={ariaLabel}
                  colIndex={colIndex}
                  disabled={disabled}
                  gameOver={gameOver}
                  isCurrentRow={isCurrentRow}
                  isLossFlipToEmpty={isLossFlipToEmpty}
                  isRestartFlipToEmpty={isRestartFlipToEmpty}
                  isRevealingRow={isRevealingRow}
                  isWinningRow={isWinningRow}
                  letter={letter}
                  lossFlags={lossFlags}
                  rowIndex={rowIndex}
                  status={status}
                  currentGuessLength={currentGuess.length}
                />
              );
            })}
          </LetterRow>
        );
      })}
    </Stack>
  );
});

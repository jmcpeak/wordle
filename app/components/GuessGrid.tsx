'use client';

import Stack from '@mui/material/Stack';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
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
  /** Increments per invalid guess; 0 = not shaking. See `useShake`. */
  shakeToken: number;
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
  shakeToken,
  solution,
}: GuessGridProps) {
  const { t } = useTranslation();
  const lossPhase = useLossPhase(isLost);

  const [revealState, setRevealState] = useState<{
    guessCount: number;
    rowIndex: number | null;
  }>(() => ({ guessCount: guesses.length, rowIndex: null }));

  // Derive the revealing row during render when guesses grow so the first paint
  // already uses the flip animation (useEffect would flash final colors for a frame).
  let activeRevealingRowIndex = revealState.rowIndex;
  if (guesses.length > revealState.guessCount) {
    activeRevealingRowIndex = guesses.length - 1;
    setRevealState({
      guessCount: guesses.length,
      rowIndex: activeRevealingRowIndex,
    });
  } else if (guesses.length < revealState.guessCount) {
    activeRevealingRowIndex = null;
    setRevealState({ guessCount: guesses.length, rowIndex: null });
  }

  useEffect(() => {
    if (revealState.rowIndex === null) return;
    const timer = setTimeout(
      () =>
        setRevealState((current) => ({
          ...current,
          rowIndex: null,
        })),
      REVEAL_TOTAL_DURATION_MS,
    );
    return () => clearTimeout(timer);
  }, [revealState.rowIndex]);

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

  const lossRowFlags = useMemo(
    () =>
      ROW_INDICES.map((rowIndex) =>
        getLossRowFlags(isLost, lossPhase, rowIndex),
      ),
    [isLost, lossPhase],
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
        const rowShakeToken = isCurrentRow ? shakeToken : 0;
        // Reveal runs first on a win; count-up settle starts only after reveal clears.
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
        const lossFlags = lossRowFlags[rowIndex];
        if (!lossFlags) return null;

        return (
          <LetterRow key={`row-${rowIndex}`} shakeToken={rowShakeToken}>
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
                  currentGuessLength={isCurrentRow ? currentGuess.length : -1}
                />
              );
            })}
          </LetterRow>
        );
      })}
    </Stack>
  );
});

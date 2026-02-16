'use client';

import { Stack } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import LetterBox from '@/components/LetterBox';
import { LetterRow } from '@/components/LetterRow';
import {
  LOSS_FLIP_COL_STAGGER_MS,
  LOSS_FLIP_ROW_STAGGER_MS,
  LOSS_PHASE2_DELAY_MS,
  MAX_GUESSES,
  WORD_LENGTH,
} from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

const SOLUTION_REVEAL_ROW_INDEX = 2;
const LOSS_YOU_ROW_INDEX = 0;
const LOSS_LOSE_ROW_INDEX = 4;
/** Centered "YOU" in 5 cells: empty, Y, O, U, empty */
const LOSS_YOU_LETTERS: (string | undefined)[] = ['', 'Y', 'O', 'U', ''];
/** "LOSE!" fills row 5 */
const LOSS_LOSE_LETTERS = ['L', 'O', 'S', 'E', '!'];

type LossPhase = 'flipToEmpty' | 'flipToSolution';

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

export default function GuessGrid({
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

  const getStatusLabel = (status: LetterStatus) => {
    if (status === 'correct') return t('game.status.correct');
    if (status === 'present') return t('game.status.present');
    if (status === 'absent') return t('game.status.absent');
    return t('game.status.empty');
  };

  const splitFlapActive =
    (isLost && lossPhase === 'flipToEmpty') || isRestarting;

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
      {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
        const guess =
          guesses[rowIndex] ||
          (rowIndex === guesses.length ? currentGuess : '');
        const isCompleted = rowIndex < guesses.length;
        const isCurrentRow = rowIndex === guesses.length;
        const rowStatuses = isCompleted
          ? completedRowStatuses[rowIndex]
          : Array(WORD_LENGTH).fill('empty');
        const shouldShake = isCurrentRow && shake;
        const isWinningRow =
          gameOver && isCompleted && guesses[rowIndex] === solution;

        const isLossFlipToEmpty = isLost && lossPhase === 'flipToEmpty';
        const isRestartFlipToEmpty = isRestarting;
        const isLossRevealRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === SOLUTION_REVEAL_ROW_INDEX;
        const isLossYouRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === LOSS_YOU_ROW_INDEX;
        const isLossLoseRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === LOSS_LOSE_ROW_INDEX;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
          <LetterRow key={`row-${rowIndex}`} shake={shouldShake}>
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
              const isRevealCell = isLossRevealRow;
              const youLetter = LOSS_YOU_LETTERS[colIndex] ?? '';
              const loseLetter = LOSS_LOSE_LETTERS[colIndex] ?? '';
              const letter = isRevealCell
                ? (solution[colIndex] ?? '')
                : isLossYouRow
                  ? youLetter
                  : isLossLoseRow
                    ? loseLetter
                    : isLost && lossPhase === 'flipToSolution'
                      ? ''
                      : guess[colIndex] || '';
              const status = isLossYouRow
                ? youLetter
                  ? ('absent' as LetterStatus)
                  : ('empty' as LetterStatus)
                : isLossLoseRow
                  ? ('absent' as LetterStatus)
                  : isLost && lossPhase === 'flipToSolution' && !isRevealCell
                    ? ('empty' as LetterStatus)
                    : ((rowStatuses?.[colIndex] ?? 'empty') as LetterStatus);

              const isFocused =
                !gameOver &&
                isCurrentRow &&
                (colIndex === currentGuess.length ||
                  (currentGuess.length === WORD_LENGTH &&
                    colIndex === WORD_LENGTH - 1));

              const displayStatus = isRevealCell ? 'correct' : status;
              const ariaLabel = letter
                ? t('game.gridCell.filled', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                    letter,
                    status: getStatusLabel(displayStatus),
                  })
                : t('game.gridCell.empty', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                  });

              const lossAnimationDelay =
                isLossFlipToEmpty || isRestartFlipToEmpty
                  ? rowIndex * LOSS_FLIP_ROW_STAGGER_MS +
                    colIndex * LOSS_FLIP_COL_STAGGER_MS
                  : isRevealCell
                    ? colIndex * 100
                    : undefined;

              return (
                <LetterBox
                  aria-label={ariaLabel}
                  disabled={disabled}
                  isFocused={isFocused}
                  // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
                  key={`col-${colIndex}`}
                  status={isRevealCell ? undefined : status}
                  isWinning={isWinningRow}
                  index={colIndex}
                  isLossFlipToEmpty={isLossFlipToEmpty}
                  isRestartFlipToEmpty={isRestartFlipToEmpty}
                  isLossReveal={isRevealCell}
                  lossAnimationDelay={lossAnimationDelay}
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
}

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

const SOLUTION_REVEAL_ROW_INDEX = 3;
const LOSS_THE_ROW_INDEX = 0;
const LOSS_WORD_ROW_INDEX = 1;
const LOSS_WAS_ROW_INDEX = 2;
/** " THE " centered in row 0: empty, T, H, E, empty */
const LOSS_THE_LETTERS: (string | undefined)[] = ['', 'T', 'H', 'E', ''];
/** "WORD" fills row 1 */
const LOSS_WORD_LETTERS = ['W', 'O', 'R', 'D', ''];
/** " WAS " centered in row 2: empty, W, A, S, empty */
const LOSS_WAS_LETTERS: (string | undefined)[] = ['', 'W', 'A', 'S', ''];

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
    (isLost &&
      (lossPhase === 'flipToEmpty' || lossPhase === 'flipToSolution')) ||
    isRestarting;

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
          !isLost &&
          !isRestarting &&
          !splitFlapActive &&
          gameOver &&
          isCompleted &&
          guesses[rowIndex] === solution;

        const isLossFlipToEmpty = isLost && lossPhase === 'flipToEmpty';
        const isRestartFlipToEmpty = isRestarting;
        const isLossRevealRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === SOLUTION_REVEAL_ROW_INDEX;
        const isLossTheRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === LOSS_THE_ROW_INDEX;
        const isLossWordRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === LOSS_WORD_ROW_INDEX;
        const isLossWasRow =
          isLost &&
          lossPhase === 'flipToSolution' &&
          rowIndex === LOSS_WAS_ROW_INDEX;
        const isLossPhase2SplitFlapRow =
          isLossRevealRow || isLossTheRow || isLossWordRow || isLossWasRow;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
          <LetterRow key={`row-${rowIndex}`} shake={shouldShake}>
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
              const isRevealCell = isLossRevealRow;
              const theLetter = LOSS_THE_LETTERS[colIndex] ?? '';
              const wordLetter = LOSS_WORD_LETTERS[colIndex] ?? '';
              const wasLetter = LOSS_WAS_LETTERS[colIndex] ?? '';
              const letter = isRevealCell
                ? (solution[colIndex] ?? '')
                : isLossTheRow
                  ? theLetter
                  : isLossWordRow
                    ? wordLetter
                    : isLossWasRow
                      ? wasLetter
                      : isLost && lossPhase === 'flipToSolution'
                        ? ''
                        : guess[colIndex] || '';
              const status = isLossTheRow
                ? theLetter
                  ? ('absent' as LetterStatus)
                  : ('empty' as LetterStatus)
                : isLossWordRow
                  ? wordLetter
                    ? ('absent' as LetterStatus)
                    : ('empty' as LetterStatus)
                  : isLossWasRow
                    ? wasLetter
                      ? ('absent' as LetterStatus)
                      : ('empty' as LetterStatus)
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
                  : isLossPhase2SplitFlapRow
                    ? rowIndex * LOSS_FLIP_ROW_STAGGER_MS +
                      colIndex * LOSS_FLIP_COL_STAGGER_MS
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
                  isLossPhase2SplitFlapReveal={isLossPhase2SplitFlapRow}
                  forceBorder={isLossTheRow || isLossWordRow || isLossWasRow}
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

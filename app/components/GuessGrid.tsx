'use client';

import { Stack } from '@mui/material';
import { keyframes } from '@mui/system';
import { useMemo } from 'react';
import LetterBox from '@/components/LetterBox';
import { LetterRow } from '@/components/LetterRow';
import { MAX_GUESSES, WORD_LENGTH } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

const grayWash = keyframes`
  0% {
    filter: saturate(1) brightness(1);
    opacity: 1;
  }
  100% {
    filter: saturate(0.15) brightness(0.6);
    opacity: 0.7;
  }
`;

type GuessGridProps = {
  currentGuess: string;
  disabled?: boolean;
  gameOver: boolean;
  guesses: string[];
  isLost: boolean;
  shake: boolean;
  solution: string;
};

export default function GuessGrid({
  currentGuess,
  disabled,
  gameOver,
  guesses,
  isLost,
  shake,
  solution,
}: GuessGridProps) {
  const { t } = useTranslation();
  const completedRowStatuses = useMemo(
    () => guesses.map((guess) => checkGuess(guess, solution)),
    [guesses, solution],
  );

  const getStatusLabel = (status: LetterStatus) => {
    if (status === 'correct') return t('game.status.correct');
    if (status === 'present') return t('game.status.present');
    if (status === 'absent') return t('game.status.absent');
    return t('game.status.empty');
  };

  return (
    <Stack
      role="group"
      aria-label={t('game.guessGrid')}
      alignItems="center"
      spacing={0}
      sx={{
        mb: 4,
        ...(isLost && {
          animation: `${grayWash} 1.2s ease forwards`,
          animationDelay: '0.3s',
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none',
          },
        }),
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

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
          <LetterRow key={`row-${rowIndex}`} shake={shouldShake}>
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => {
              const letter = guess[colIndex] || '';
              const status = rowStatuses[colIndex] as LetterStatus;

              const isFocused =
                !gameOver &&
                isCurrentRow &&
                (colIndex === currentGuess.length ||
                  (currentGuess.length === WORD_LENGTH &&
                    colIndex === WORD_LENGTH - 1));

              const ariaLabel = letter
                ? t('game.gridCell.filled', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                    letter,
                    status: getStatusLabel(status),
                  })
                : t('game.gridCell.empty', {
                    row: String(rowIndex + 1),
                    col: String(colIndex + 1),
                  });

              return (
                <LetterBox
                  aria-label={ariaLabel}
                  disabled={disabled}
                  isFocused={isFocused}
                  // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
                  key={`col-${colIndex}`}
                  status={status}
                  isWinning={isWinningRow}
                  index={colIndex}
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

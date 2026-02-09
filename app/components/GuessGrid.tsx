import { Stack } from '@mui/material';
import LetterBox from '@/components/LetterBox';
import { LetterRow } from '@/components/LetterRow';
import { MAX_GUESSES, WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

type GuessGridProps = {
  currentGuess: string;
  disabled?: boolean;
  gameOver: boolean;
  guesses: string[];
  shake: boolean;
  solution: string;
};

export default function GuessGrid({
  currentGuess,
  disabled,
  gameOver,
  guesses,
  shake,
  solution,
}: GuessGridProps) {
  return (
    <Stack
      role="grid"
      aria-label="Guess grid"
      alignItems="center"
      spacing={0}
      sx={{ mb: 4 }}
    >
      {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
        const guess =
          guesses[rowIndex] ||
          (rowIndex === guesses.length ? currentGuess : '');
        const isCompleted = rowIndex < guesses.length;
        const isCurrentRow = rowIndex === guesses.length;
        const rowStatuses = isCompleted
          ? checkGuess(guess, solution)
          : Array(WORD_LENGTH).fill('empty');
        const shouldShake = isCurrentRow && shake;
        const isWinningRow =
          gameOver && isCompleted && guesses[rowIndex] === solution;

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: The grid is a fixed size and will not reorder, so using the index is safe.
          <LetterRow key={`row-${rowIndex}`} role="row" shake={shouldShake}>
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
                ? `Row ${rowIndex + 1}, Letter ${colIndex + 1}: ${letter}, ${status}`
                : `Row ${rowIndex + 1}, Letter ${colIndex + 1}: empty`;

              return (
                <LetterBox
                  role="gridcell"
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

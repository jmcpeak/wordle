import { WORD_LENGTH } from '@/constants';
import type { LetterStatus } from '@/types';

export type LossPhase = 'flipToEmpty' | 'flipToSolution';

export const SOLUTION_REVEAL_ROW_INDEX = 3;
export const LOSS_THE_ROW_INDEX = 0;
export const LOSS_WORD_ROW_INDEX = 1;
export const LOSS_WAS_ROW_INDEX = 2;

export type LossRevealRows = {
  the: string[];
  word: string[];
  was: string[];
};

function buildCenteredRow(value: string): string[] {
  const letters = value.replace(/\s+/gu, '');
  const glyphs = Array.from(letters).slice(0, WORD_LENGTH);
  const row = Array.from({ length: WORD_LENGTH }, () => '');
  const startIndex = Math.floor((WORD_LENGTH - glyphs.length) / 2);
  glyphs.forEach((letter, index) => {
    const targetIndex = startIndex + index;
    if (targetIndex >= 0 && targetIndex < WORD_LENGTH) {
      row[targetIndex] = letter;
    }
  });
  return row;
}

export function createLossRevealRows(
  rowThe: string,
  rowWord: string,
  rowWas: string,
): LossRevealRows {
  return {
    the: buildCenteredRow(rowThe),
    word: buildCenteredRow(rowWord),
    was: buildCenteredRow(rowWas),
  };
}

export type LossRowFlags = {
  isLossRevealRow: boolean;
  isLossTheRow: boolean;
  isLossWordRow: boolean;
  isLossWasRow: boolean;
};

export function getLossRowFlags(
  isLost: boolean,
  lossPhase: LossPhase,
  rowIndex: number,
): LossRowFlags {
  return {
    isLossRevealRow:
      isLost &&
      lossPhase === 'flipToSolution' &&
      rowIndex === SOLUTION_REVEAL_ROW_INDEX,
    isLossTheRow:
      isLost &&
      lossPhase === 'flipToSolution' &&
      rowIndex === LOSS_THE_ROW_INDEX,
    isLossWordRow:
      isLost &&
      lossPhase === 'flipToSolution' &&
      rowIndex === LOSS_WORD_ROW_INDEX,
    isLossWasRow:
      isLost &&
      lossPhase === 'flipToSolution' &&
      rowIndex === LOSS_WAS_ROW_INDEX,
  };
}

export function getLossGridCellLetter(
  isLost: boolean,
  lossPhase: LossPhase,
  flags: LossRowFlags,
  lossRows: LossRevealRows,
  colIndex: number,
  guess: string,
  solution: string,
): string {
  const { isLossRevealRow, isLossTheRow, isLossWordRow, isLossWasRow } = flags;
  const { the, word, was } = lossRows;
  if (isLossRevealRow) return solution[colIndex] ?? '';
  if (isLossTheRow) return the[colIndex] ?? '';
  if (isLossWordRow) return word[colIndex] ?? '';
  if (isLossWasRow) return was[colIndex] ?? '';
  if (isLost && lossPhase === 'flipToSolution') return '';
  return guess[colIndex] || '';
}

export function getLossGridCellStatus(
  isLost: boolean,
  lossPhase: LossPhase,
  lossRows: LossRevealRows,
  colIndex: number,
  rowStatuses: LetterStatus[] | undefined,
  flags: LossRowFlags,
): LetterStatus {
  const { isLossRevealRow, isLossTheRow, isLossWordRow, isLossWasRow } = flags;
  const theLetter = lossRows.the[colIndex] ?? '';
  const wordLetter = lossRows.word[colIndex] ?? '';
  const wasLetter = lossRows.was[colIndex] ?? '';

  if (isLossTheRow) return theLetter ? 'absent' : 'empty';
  if (isLossWordRow) return wordLetter ? 'absent' : 'empty';
  if (isLossWasRow) return wasLetter ? 'absent' : 'empty';
  if (isLost && lossPhase === 'flipToSolution' && !isLossRevealRow)
    return 'empty';
  return (rowStatuses?.[colIndex] ?? 'empty') as LetterStatus;
}

/** True when this row uses the phase-2 split-flap treatment (reveal / THE / WORD / WAS). */
export function lossRowHasPhase2SplitFlap(flags: LossRowFlags): boolean {
  const { isLossRevealRow, isLossTheRow, isLossWordRow, isLossWasRow } = flags;
  return isLossRevealRow || isLossTheRow || isLossWordRow || isLossWasRow;
}

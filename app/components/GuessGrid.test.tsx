'use client';

import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GuessGrid from '@/components/GuessGrid';
import { LOSS_PHASE2_DELAY_MS } from '@/constants';
import { useI18nStore } from '@/store/i18nStore';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('GuessGrid', () => {
  beforeEach(() => {
    act(() => {
      useI18nStore.setState({
        locale: 'en-US',
        translations: {
          'game.guessGrid': 'Guess grid',
          'game.status.correct': 'correct',
          'game.status.present': 'in wrong position',
          'game.status.absent': 'not in word',
          'game.status.empty': 'empty',
          'game.gridCell.filled': 'Row {row}, Letter {col}: {letter}, {status}',
          'game.gridCell.empty': 'Row {row}, Letter {col}: empty',
        },
      });
    });
  });

  afterEach(() => {
    act(() => {
      useI18nStore.setState({ locale: 'en-US', translations: {} });
    });
  });

  it('renders localized aria labels for filled cells', () => {
    renderWithTheme(
      <GuessGrid
        currentGuess=""
        gameOver={false}
        guesses={['CRANE']}
        isLost={false}
        shake={false}
        solution="REACT"
      />,
    );

    expect(
      screen.getByLabelText('Row 1, Letter 1: C, in wrong position'),
    ).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Guess grid' })).toBeTruthy();
  });

  it('when isLost, after phase 2 the 3rd row shows the solution with correct status', () => {
    vi.useFakeTimers();
    renderWithTheme(
      <GuessGrid
        currentGuess=""
        gameOver={true}
        guesses={['CRANE', 'ROAST']}
        isLost={true}
        shake={false}
        solution="REACT"
      />,
    );

    act(() => {
      vi.advanceTimersByTime(LOSS_PHASE2_DELAY_MS);
    });

    expect(screen.getByLabelText('Row 3, Letter 1: R, correct')).toBeTruthy();
    expect(screen.getByLabelText('Row 3, Letter 2: E, correct')).toBeTruthy();
    expect(screen.getByLabelText('Row 3, Letter 3: A, correct')).toBeTruthy();
    expect(screen.getByLabelText('Row 3, Letter 4: C, correct')).toBeTruthy();
    expect(screen.getByLabelText('Row 3, Letter 5: T, correct')).toBeTruthy();

    vi.useRealTimers();
  });
});

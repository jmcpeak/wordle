'use client';

import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import GuessGrid from '@/components/GuessGrid';
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
        shake={false}
        solution="REACT"
      />,
    );

    expect(
      screen.getByLabelText('Row 1, Letter 1: C, in wrong position'),
    ).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Guess grid' })).toBeTruthy();
  });
});

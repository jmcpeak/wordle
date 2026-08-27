import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_STATE, WIN_ANIMATION_DURATION_MS } from '@/constants';
import { useGameStore } from '@/store/gameStore';
import { useI18nStore } from '@/store/i18nStore';
import TestWinPage from '@/test/win/page';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('TestWinPage', () => {
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
          'game.status.revealed': 'revealed answer',
          'game.lossReveal.the': 'THE',
          'game.lossReveal.word': 'WORD',
          'game.lossReveal.was': 'WAS',
          'game.gridCell.filled': 'Row {row}, Letter {col}: {letter}, {status}',
          'game.gridCell.empty': 'Row {row}, Letter {col}: empty',
        },
      });
    });
  });

  afterEach(() => {
    act(() => {
      useGameStore.setState({
        currentGuess: '',
        gameState: GAME_STATE.LOADING,
        guesses: [],
        hasInitialized: false,
        message: '',
        messageSeverity: 'info',
      });
      useI18nStore.setState({ locale: 'en-US', translations: {} });
    });
    vi.useRealTimers();
  });

  it('shows congratulations after the win animation', () => {
    vi.useFakeTimers();
    renderWithTheme(<TestWinPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Play win' }));
    expect(screen.queryByText('Impressive!')).toBeNull();

    act(() => {
      vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    });

    expect(screen.getByText('Impressive!')).toBeTruthy();
  });

  it('uses different copy for a first-guess win', () => {
    vi.useFakeTimers();
    renderWithTheme(<TestWinPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Win in 1 guess' }));
    fireEvent.click(screen.getByRole('button', { name: 'Play win' }));

    act(() => {
      vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    });

    expect(screen.getByText('Genius!')).toBeTruthy();
  });
});

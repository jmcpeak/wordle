import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_STATE, LOSS_ANIMATION_DURATION_MS } from '@/constants';
import { useGameStore } from '@/store/gameStore';
import { useI18nStore } from '@/store/i18nStore';
import TestLosePage from '@/test/lose/page';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { name: 'Test User' } },
    status: 'authenticated',
  }),
  signOut: vi.fn(),
}));

vi.mock('@/hooks/useStandaloneMode', () => ({
  useStandaloneMode: () => false,
  isIosDevice: () => false,
}));

describe('TestLosePage', () => {
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
          'game.playAgain': 'Play Again',
          'definition.tooltip': 'Definition',
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

  it('exposes play again and definition after the loss animation', () => {
    vi.useFakeTimers();
    renderWithTheme(<TestLosePage />);

    expect(screen.queryByRole('button', { name: 'Definition' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Play Again' })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(LOSS_ANIMATION_DURATION_MS);
    });

    expect(screen.getByRole('button', { name: 'Definition' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy();
  });

  it('hides the definition button when the game errors', () => {
    vi.useFakeTimers();
    renderWithTheme(<TestLosePage />);

    act(() => {
      vi.advanceTimersByTime(LOSS_ANIMATION_DURATION_MS);
    });
    expect(screen.getByRole('button', { name: 'Definition' })).toBeTruthy();

    act(() => {
      useGameStore.setState({ gameState: GAME_STATE.ERROR });
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(screen.queryByRole('button', { name: 'Definition' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Play Again' })).toBeTruthy();
  });
});

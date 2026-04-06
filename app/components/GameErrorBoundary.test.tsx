import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import { GAME_STATE } from '@/constants';
import { useGameStore } from '@/store/gameStore';
import { useI18nStore } from '@/store/i18nStore';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

function ThrowError() {
  throw new Error('boom');
}

function CrashWhileLoading() {
  const gameState = useGameStore((s) => s.gameState);
  if (gameState === GAME_STATE.LOADING) {
    throw new Error('boom');
  }
  return <div>Recovered child</div>;
}

describe('GameErrorBoundary', () => {
  beforeEach(() => {
    act(() => {
      useGameStore.setState({
        currentGuess: '',
        gameState: GAME_STATE.LOADING,
        guesses: [],
        hasInitialized: false,
      });
      useI18nStore.setState({
        locale: 'en-US',
        translations: {
          'game.errorBoundary.title': 'Something went wrong',
          'game.errorBoundary.description':
            'An unexpected error occurred. Please reload the page.',
          'game.errorBoundary.reload': 'Reload',
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
      });
      useI18nStore.setState({ locale: 'en-US', translations: {} });
    });
    vi.restoreAllMocks();
  });

  it('renders its children when no error occurs', () => {
    renderWithTheme(
      <GameErrorBoundary>
        <div>Healthy child</div>
      </GameErrorBoundary>,
    );

    expect(screen.getByText('Healthy child')).toBeTruthy();
  });

  it('updates fallback copy when the locale changes', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderWithTheme(
      <GameErrorBoundary>
        <ThrowError />
      </GameErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    act(() => {
      useI18nStore.setState({
        locale: 'es-ES',
        translations: {
          'game.errorBoundary.title': 'Algo salio mal',
          'game.errorBoundary.description':
            'Ocurrio un error inesperado. Recarga la pagina.',
          'game.errorBoundary.reload': 'Recargar',
        },
      });
    });

    expect(screen.getByText('Algo salio mal')).toBeTruthy();
    expect(screen.getByText('Recargar')).toBeTruthy();

    consoleErrorSpy.mockRestore();
  });

  it('recovers when game state changes after a transient render error', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    renderWithTheme(
      <GameErrorBoundary>
        <CrashWhileLoading />
      </GameErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    act(() => {
      useGameStore.setState({
        currentGuess: '',
        gameState: GAME_STATE.PLAYING,
        guesses: [],
        hasInitialized: true,
      });
    });

    expect(screen.getByText('Recovered child')).toBeTruthy();
    consoleErrorSpy.mockRestore();
  });
});

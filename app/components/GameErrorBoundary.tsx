'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/store/gameStore';
import { useTranslation } from '@/store/i18nStore';

const ERROR_BOX_SX = { textAlign: 'center', mt: 8, px: 2 } as const;

const DESCRIPTION_SX = {
  color: 'text.secondary',
  mb: 3,
} as const;

type Props = {
  children: ReactNode;
  description: string;
  reloadLabel: string;
  resetKey: string;
  title: string;
};
type State = { hasError: boolean };

class GameErrorBoundaryInner extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Game render error:', error, info);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={ERROR_BOX_SX}>
          <Typography variant="h5" gutterBottom>
            {this.props.title}
          </Typography>
          <Typography variant="body1" sx={DESCRIPTION_SX}>
            {this.props.description}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            {this.props.reloadLabel}
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default function GameErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  const { locale, t } = useTranslation();
  const { currentGuess, gameState, guessCount, hasInitialized } = useGameStore(
    useShallow((s) => ({
      currentGuess: s.currentGuess,
      gameState: s.gameState,
      guessCount: s.guesses.length,
      hasInitialized: s.hasInitialized,
    })),
  );
  const resetKey = [
    locale,
    gameState,
    hasInitialized ? '1' : '0',
    String(guessCount),
    String(currentGuess.length),
  ].join(':');

  return (
    <GameErrorBoundaryInner
      description={t('game.errorBoundary.description')}
      reloadLabel={t('game.errorBoundary.reload')}
      resetKey={resetKey}
      title={t('game.errorBoundary.title')}
    >
      {children}
    </GameErrorBoundaryInner>
  );
}

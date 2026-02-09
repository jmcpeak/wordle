'use client';

import { Container } from '@mui/material';
import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard from '@/components/Keyboard';
import { useShake } from '@/components/LetterRow';
import PlayAgainButton from '@/components/PlayAgainButton';
import { GAME_STATE, SUBMISSION_STATUS } from '@/constants';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useGameStore } from '@/store/gameStore';
import { useStatsStore } from '@/store/statsStore';

const SKELETON_SX = {
  '@keyframes skeletonPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.4 },
  },
  animation: 'skeletonPulse 2s ease-in-out 0.5s infinite',
  // Hide all text and icon content while preserving element sizes
  '& .MuiTypography-root': {
    color: 'transparent',
    backgroundColor: 'action.hover',
    borderRadius: 1,
  },
  '& .MuiButton-root': { color: 'transparent' },
  '& .MuiIconButton-root': {
    backgroundColor: 'action.hover',
    borderRadius: '50%',
  },
  '& .MuiSvgIcon-root': { visibility: 'hidden' },
} as const;

const EMPTY_SX = {} as const;

export default function GamePage() {
  const {
    solution,
    guesses,
    currentGuess,
    gameState,
    hasInitialized,
    message,
    messageSeverity,
    letterStatuses,
    submissionStatus,
    isSubmitting,
  } = useGameStore(
    useShallow((s) => ({
      solution: s.solution,
      guesses: s.guesses,
      currentGuess: s.currentGuess,
      gameState: s.gameState,
      hasInitialized: s.hasInitialized,
      message: s.message,
      messageSeverity: s.messageSeverity,
      letterStatuses: s.letterStatuses,
      submissionStatus: s.submissionStatus,
      isSubmitting: s.isSubmitting,
    })),
  );

  // Actions are stable references — select individually to avoid re-renders
  const fetchWord = useGameStore((s) => s.fetchWord);
  const handleInput = useGameStore((s) => s.handleInput);
  const handleRestart = useGameStore((s) => s.handleRestart);
  const addWin = useStatsStore((s) => s.addWin);
  const addLoss = useStatsStore((s) => s.addLoss);
  const { shake, triggerShake } = useShake();

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;

  // The real components render at all times so the layout is pixel-accurate.
  // While the word is loading, a CSS treatment hides text / icons and adds a
  // skeleton-style pulse so the shapes look like placeholders. Once the word
  // is validated the treatment is removed — zero layout shift because the
  // exact same DOM elements stay in place.
  const skeletonSx = hasInitialized ? EMPTY_SX : SKELETON_SX;

  useEffect(() => {
    fetchWord();
  }, [fetchWord]);
  useEffect(() => {
    // Update stats when the game ends — keeps game store decoupled from stats store
    if (gameState === GAME_STATE.WON) {
      addWin(guesses.length).catch((error) =>
        console.error('Failed to update win stats:', error),
      );
    } else if (gameState === GAME_STATE.LOST) {
      addLoss().catch((error) =>
        console.error('Failed to update loss stats:', error),
      );
    }
  }, [gameState, guesses.length, addWin, addLoss]);
  useEffect(() => {
    if (submissionStatus === SUBMISSION_STATUS.ERROR) {
      triggerShake();
    }
  }, [submissionStatus, triggerShake]);

  useKeyboard(handleInput);

  return (
    <Container sx={{ mt: 4, textAlign: 'center', ...skeletonSx }}>
      <GameTitle />
      <GuessGrid
        currentGuess={currentGuess}
        disabled={isSubmitting || !hasInitialized}
        gameOver={gameOver}
        guesses={guesses}
        shake={shake}
        solution={solution}
      />
      <Keyboard
        disabled={isSubmitting || !hasInitialized}
        letterStatuses={letterStatuses}
        onKeyPress={handleInput}
      />
      {gameOver && <PlayAgainButton onClick={handleRestart} />}
      <GameSnackbar
        message={message}
        severity={messageSeverity}
        onClose={() => useGameStore.setState({ message: '' })}
      />
    </Container>
  );
}

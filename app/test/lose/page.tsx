'use client';

import { Container } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard from '@/components/Keyboard';
import PlayAgainButton from '@/components/PlayAgainButton';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  LOSS_PHASE2_DELAY_MS,
  MAX_GUESSES,
  SUBMISSION_STATUS,
} from '@/constants';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { useGameStore } from '@/store/gameStore';
import { checkGuess } from '@/utils/gameLogic';

/**
 * Test page for lose animation.
 * Sets up a game state where the user loses after MAX_GUESSES incorrect guesses.
 * Includes rows with colored backgrounds (red for incorrect, yellow for present).
 * No database updates are made.
 */
export default function TestLosePage() {
  const {
    solution,
    guesses,
    currentGuess,
    gameState,
    hasInitialized,
    message,
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
      letterStatuses: s.letterStatuses,
      submissionStatus: s.submissionStatus,
      isSubmitting: s.isSubmitting,
    })),
  );

  const handleInput = useGameStore((s) => s.handleInput);
  const handleRestart = useGameStore((s) => s.handleRestart);
  const clearMessage = useGameStore((s) => s.clearMessage);
  const { shake, triggerShake } = useShake();
  const [playAgainVisible, setPlayAgainVisible] = useState(false);
  const [playAgainExiting, setPlayAgainExiting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Set up lose state on mount with various colored rows
  useEffect(() => {
    const testSolution = 'CRANE';
    // Mix of incorrect (red), present (yellow), and correct (green) guesses
    // This tests the split-flap animation on rows with different colored backgrounds
    const testGuesses = [
      'WORDS', // All absent (red) - tests red row animation
      'PLANT', // Mix: P absent, L absent, A present, N present, T absent
      'STARE', // Mix: S absent, T absent, A correct, R present, E present
      'CRATE', // Mix: C correct, R correct, A correct, T absent, E correct
      'CRANE', // All correct (green) - tests green row animation
      'BRAVE', // Mix: B absent, R correct, A correct, V absent, E correct
    ];

    // Calculate letter statuses from guesses
    const newLetterStatuses: Record<string, string> = {};
    testGuesses.forEach((guess) => {
      const guessStatuses = checkGuess(guess, testSolution);
      guess.split('').forEach((letter, i) => {
        const status = guessStatuses[i];
        const currentStatus = newLetterStatuses[letter];

        if (status === 'correct') {
          newLetterStatuses[letter] = 'correct';
        } else if (status === 'present' && currentStatus !== 'correct') {
          newLetterStatuses[letter] = 'present';
        } else if (
          status === 'absent' &&
          currentStatus !== 'correct' &&
          currentStatus !== 'present'
        ) {
          newLetterStatuses[letter] = 'absent';
        }
      });
    });

    useGameStore.setState({
      solution: testSolution,
      guesses: testGuesses.slice(0, MAX_GUESSES), // Use all guesses to trigger loss
      currentGuess: '',
      gameState: GAME_STATE.LOST,
      hasInitialized: true,
      message: `Game Over! The word was ${testSolution}`,
      messageSeverity: 'error',
      letterStatuses: newLetterStatuses,
      submissionStatus: SUBMISSION_STATUS.IDLE,
      isSubmitting: false,
    });
  }, []);

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const showPlayAgain = gameOver || gameState === GAME_STATE.ERROR;

  useEffect(() => {
    if (gameState === GAME_STATE.WON || gameState === GAME_STATE.ERROR) {
      setPlayAgainVisible(true);
      return;
    }
    if (gameState === GAME_STATE.LOST) {
      setPlayAgainVisible(false);
      const timeoutId = setTimeout(() => {
        setPlayAgainVisible(true);
      }, LOSS_ANIMATION_DURATION_MS);
      return () => clearTimeout(timeoutId);
    }
    setPlayAgainVisible(false);
  }, [gameState]);

  const handleRestartAndReset = useCallback(() => {
    setPlayAgainExiting(true);
  }, []);

  const handlePlayAgainExited = useCallback(() => {
    setPlayAgainExiting(false);
    setIsRestarting(true);
  }, []);

  useEffect(() => {
    if (!isRestarting) return;
    const timeoutId = setTimeout(() => {
      handleRestart();
      setIsRestarting(false);
    }, LOSS_PHASE2_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [isRestarting, handleRestart]);

  useEffect(() => {
    if (submissionStatus === SUBMISSION_STATUS.ERROR) {
      triggerShake();
    }
  }, [submissionStatus, triggerShake]);

  useKeyboard(handleInput);

  const handleSnackbarClose = useCallback(() => {
    clearMessage();
  }, [clearMessage]);

  return (
    <Container
      component="main"
      id="main-content"
      sx={{ mt: 4, textAlign: 'center' }}
    >
      <GameTitle />
      <GuessGrid
        currentGuess={currentGuess}
        disabled={isSubmitting || !hasInitialized}
        gameOver={gameOver}
        guesses={guesses}
        isLost={gameState === GAME_STATE.LOST}
        isRestarting={isRestarting}
        shake={shake}
        solution={solution}
      />
      <Keyboard
        disabled={isSubmitting || !hasInitialized}
        letterStatuses={letterStatuses}
        onKeyPress={handleInput}
      />
      {((showPlayAgain && playAgainVisible && !isRestarting) ||
        playAgainExiting) && (
        <PlayAgainButton
          in={
            showPlayAgain &&
            playAgainVisible &&
            !playAgainExiting &&
            !isRestarting
          }
          onClick={handleRestartAndReset}
          onExited={handlePlayAgainExited}
        />
      )}
      <GameSnackbar message={message} onClose={handleSnackbarClose} />
    </Container>
  );
}

'use client';

import { Container, Stack } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import DefinitionButton from '@/components/DefinitionButton';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard from '@/components/Keyboard';
import PlayAgainButton from '@/components/PlayAgainButton';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  MAX_GUESSES,
  RESTART_SPLIT_FLAP_DURATION_MS,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { useDeferredLetterStatuses } from '@/hooks/useDeferredLetterStatuses';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { useGameStore } from '@/store/gameStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

const TEST_SOLUTION = 'CRANE';

const MAIN_SX = { mt: 4, textAlign: 'center' } as const;

const ACTION_STACK_SX = {
  alignItems: 'center',
  justifyContent: 'center',
} as const;

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
    message,
    messageSeverity,
    letterStatuses,
    submissionErrorCount,
    isSubmitting,
  } = useGameStore(
    useShallow((s) => ({
      solution: s.solution,
      guesses: s.guesses,
      currentGuess: s.currentGuess,
      gameState: s.gameState,
      message: s.message,
      messageSeverity: s.messageSeverity,
      letterStatuses: s.letterStatuses,
      submissionErrorCount: s.submissionErrorCount,
      isSubmitting: s.isSubmitting,
    })),
  );

  const handleInput = useGameStore((s) => s.handleInput);
  const handleRestart = useGameStore((s) => s.handleRestart);
  const clearMessage = useGameStore((s) => s.clearMessage);
  const displayedLetterStatuses = useDeferredLetterStatuses(
    letterStatuses,
    guesses,
    solution,
  );
  const { shakeToken, triggerShake } = useShake();
  const [playAgainVisible, setPlayAgainVisible] = useState(false);
  const [playAgainExiting, setPlayAgainExiting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  // Set up lose state on mount with various colored rows
  useEffect(() => {
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
    const newLetterStatuses: Record<string, LetterStatus> = {};
    testGuesses.forEach((guess) => {
      const guessStatuses = checkGuess(guess, TEST_SOLUTION);
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
      solution: TEST_SOLUTION,
      guesses: testGuesses.slice(0, MAX_GUESSES), // Use all guesses to trigger loss
      currentGuess: '',
      gameState: GAME_STATE.LOST,
      hasInitialized: true,
      message: '', // No snackbar message for losses
      messageSeverity: 'error',
      retryAction: null,
      letterStatuses: newLetterStatuses,
      submissionStatus: SUBMISSION_STATUS.IDLE,
      submissionErrorCount: 0,
      isSubmitting: false,
    });
  }, []);

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const inputDisabled = isSubmitting || gameState !== GAME_STATE.PLAYING;
  const showEndActions =
    (gameOver || gameState === GAME_STATE.ERROR) &&
    playAgainVisible &&
    !playAgainExiting &&
    !isRestarting;

  useEffect(() => {
    if (gameState === GAME_STATE.WON) {
      setPlayAgainVisible(false);
      // Show button after win animation completes
      const timeoutId = setTimeout(() => {
        setPlayAgainVisible(true);
      }, WIN_ANIMATION_DURATION_MS);
      return () => clearTimeout(timeoutId);
    }
    if (gameState === GAME_STATE.ERROR) {
      setPlayAgainVisible(true);
      return;
    }
    if (gameState === GAME_STATE.LOST) {
      setPlayAgainVisible(false);
      // Show button after loss animation completes
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
    }, RESTART_SPLIT_FLAP_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isRestarting, handleRestart]);

  useEffect(() => {
    if (submissionErrorCount > 0) {
      triggerShake();
    }
  }, [submissionErrorCount, triggerShake]);

  useKeyboard(handleInput, inputDisabled);

  const handleSnackbarClose = useCallback(() => {
    clearMessage();
  }, [clearMessage]);

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <GameTitle />
      <GuessGrid
        currentGuess={currentGuess}
        disabled={inputDisabled}
        gameOver={gameOver}
        guesses={guesses}
        isLost={gameState === GAME_STATE.LOST}
        isRestarting={isRestarting}
        shakeToken={shakeToken}
        solution={solution}
      />
      <Stack direction="row" spacing={1.5} sx={ACTION_STACK_SX}>
        <PlayAgainButton
          visible={showEndActions}
          onClick={handleRestartAndReset}
          onExited={handlePlayAgainExited}
        />
        <DefinitionButton
          visible={showEndActions && gameOver}
          word={solution}
        />
      </Stack>
      <Keyboard
        disabled={inputDisabled}
        letterStatuses={displayedLetterStatuses}
        onKeyPress={handleInput}
      />
      <GameSnackbar
        message={message}
        onClose={handleSnackbarClose}
        severity={messageSeverity}
      />
    </Container>
  );
}

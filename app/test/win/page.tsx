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
  SUBMISSION_STATUS,
} from '@/constants';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { useGameStore } from '@/store/gameStore';
import { checkGuess } from '@/utils/gameLogic';

/**
 * Test page for win animation.
 * Sets up a game state where the user wins on their 3rd guess.
 * No database updates are made.
 */
export default function TestWinPage() {
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

  // Set up win state on mount
  useEffect(() => {
    const testSolution = 'CRANE';
    const testGuesses = ['WORDS', 'PLANT', 'CRANE']; // Win on 3rd guess

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
      guesses: testGuesses,
      currentGuess: '',
      gameState: GAME_STATE.WON,
      hasInitialized: true,
      message: 'You won!',
      messageSeverity: 'success',
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

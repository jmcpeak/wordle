'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard from '@/components/Keyboard';
import PlayAgainButton from '@/components/PlayAgainButton';
import ValidationLoadingOverlay from '@/components/ValidationLoadingOverlay';
import WordLoadErrorDialog from '@/components/WordLoadErrorDialog';
import {
  GAME_STATE,
  LOSS_ANIMATION_DURATION_MS,
  LOSS_PHASE2_DELAY_MS,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { useGameStore } from '@/store/gameStore';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';

const SKELETON_SX = {
  '@keyframes skeletonPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.4 },
  },
  animation: 'skeletonPulse 2s ease-in-out 0.5s infinite',
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
  },
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

  // Actions are stable references — select individually to avoid re-renders
  const fetchWord = useGameStore((s) => s.fetchWord);
  const handleInput = useGameStore((s) => s.handleInput);
  const handleRestart = useGameStore((s) => s.handleRestart);
  const clearMessage = useGameStore((s) => s.clearMessage);
  const addWin = useStatsStore((s) => s.addWin);
  const addLoss = useStatsStore((s) => s.addLoss);
  const { shake, triggerShake } = useShake();
  const { t } = useTranslation();
  const statsUpdatedRef = useRef(false);

  const validateErrorMessage = t('message.couldNotValidateWord');
  const showValidateRetry = !!message && message === validateErrorMessage;

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const showPlayAgain = gameOver;
  const [playAgainVisible, setPlayAgainVisible] = useState(false);
  const [playAgainExiting, setPlayAgainExiting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  useEffect(() => {
    if (gameState === GAME_STATE.WON) {
      setPlayAgainVisible(false);
      // Show button after win animation completes
      const timeoutId = setTimeout(() => {
        setPlayAgainVisible(true);
      }, WIN_ANIMATION_DURATION_MS);
      return () => clearTimeout(timeoutId);
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
    statsUpdatedRef.current = false;
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

  // The real components render at all times so the layout is pixel-accurate.
  // While the word is loading, a CSS treatment hides text / icons and adds a
  // skeleton-style pulse so the shapes look like placeholders. Once the word
  // is validated the treatment is removed — zero layout shift because the
  // exact same DOM elements stay in place.
  const skeletonSx = hasInitialized ? EMPTY_SX : SKELETON_SX;
  const handleSnackbarClose = useCallback(() => {
    clearMessage();
  }, [clearMessage]);

  /** Only navigate to offline page when the browser reports offline after a long wait — slow LTE stays on the game shell. */
  const LOAD_OFFLINE_TIMEOUT_MS = 90 * 1000;

  useEffect(() => {
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        window.location.href = '/~offline';
      }
    }, LOAD_OFFLINE_TIMEOUT_MS);
    fetchWord().finally(() => {
      if (!cancelled) clearTimeout(timeoutId);
    });
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [fetchWord]);
  useEffect(() => {
    // Update stats when the game ends — keeps game store decoupled from stats store.
    // Guard with a ref to prevent duplicate updates (e.g. React strict mode).
    if (statsUpdatedRef.current) return;
    if (gameState === GAME_STATE.WON) {
      statsUpdatedRef.current = true;
      // Clear win message so snackbar doesn't show
      clearMessage();
      addWin(guesses.length).catch((error) =>
        console.error('Failed to update win stats:', error),
      );
    } else if (gameState === GAME_STATE.LOST) {
      statsUpdatedRef.current = true;
      // Clear loss message so snackbar doesn't show
      clearMessage();
      addLoss().catch((error) =>
        console.error('Failed to update loss stats:', error),
      );
    }
  }, [gameState, guesses.length, addWin, addLoss, clearMessage]);
  useEffect(() => {
    if (submissionStatus === SUBMISSION_STATUS.ERROR) {
      triggerShake();
    }
  }, [submissionStatus, triggerShake]);

  const handleSnackbarRetry = useCallback(() => {
    void handleInput('ENTER');
  }, [handleInput]);

  useKeyboard(handleInput, gameOver);

  const showValidationOverlay =
    isSubmitting && gameState === GAME_STATE.PLAYING && hasInitialized;

  return (
    <Box
      sx={{
        position: 'relative',
        mt: 4,
        textAlign: 'center',
        ...skeletonSx,
      }}
    >
      <ValidationLoadingOverlay visible={showValidationOverlay} />
      <Container
        component="main"
        id="main-content"
        aria-busy={showValidationOverlay}
        sx={{ textAlign: 'center' }}
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
        <Keyboard
          disabled={isSubmitting || !hasInitialized || gameOver}
          letterStatuses={letterStatuses}
          onKeyPress={handleInput}
        />
        {gameState !== GAME_STATE.WON &&
          gameState !== GAME_STATE.LOST &&
          gameState !== GAME_STATE.ERROR && (
            <GameSnackbar
              message={message}
              onClose={handleSnackbarClose}
              onRetry={showValidateRetry ? handleSnackbarRetry : undefined}
            />
          )}
        <WordLoadErrorDialog
          open={gameState === GAME_STATE.ERROR}
          onRetry={fetchWord}
        />
      </Container>
    </Box>
  );
}

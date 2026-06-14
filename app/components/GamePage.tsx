'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import DefinitionButton from '@/components/DefinitionButton';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard, { type KeyboardHandle } from '@/components/Keyboard';
import PlayAgainButton from '@/components/PlayAgainButton';
import ValidationLoadingOverlay from '@/components/ValidationLoadingOverlay';
import WordLoadErrorDialog from '@/components/WordLoadErrorDialog';
import {
  GAME_STATE,
  PLACEHOLDER_CHAR,
  SUBMISSION_STATUS,
  WORD_LENGTH,
} from '@/constants';
import { useGameRestartFlow } from '@/hooks/useGameRestartFlow';
import { useGameStatsSync } from '@/hooks/useGameStatsSync';
import { useInitialWordLoad } from '@/hooks/useInitialWordLoad';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { useGameStore } from '@/store/gameStore';
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

/** Board wrapper: grid + keyboard share the same width. */
const BOARD_SX = {
  width: { xs: '100%', sm: 'fit-content' },
  maxWidth: '100%',
  mx: 'auto',
} as const;

/** Installed PWA: pin to the visible viewport (works on iOS + macOS). */
const STANDALONE_ROOT_SX = {
  '@media (display-mode: standalone)': {
    position: 'fixed',
    inset: 0,
    boxSizing: 'border-box',
    mt: 0,
    overflow: 'hidden',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
} as const;

/** Installed PWA: flex column so the keyboard sits at the bottom. */
const STANDALONE_MAIN_SX = {
  '@media (display-mode: standalone)': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minHeight: 0,
  },
} as const;

const STANDALONE_BOARD_AREA_SX = {
  '@media (display-mode: standalone)': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    alignItems: 'center',
    minHeight: 0,
    width: '100%',
  },
} as const;

const STANDALONE_BOARD_SX = {
  '@media (display-mode: standalone)': {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 0,
    width: { xs: '100%', sm: 'fit-content' },
    maxWidth: '100%',
    mx: { xs: 0, sm: 'auto' },
  },
} as const;

const STANDALONE_GRID_AREA_SX = {
  '@media (display-mode: standalone)': {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: 0,
  },
} as const;

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
    retryAction,
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
      retryAction: s.retryAction,
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

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const inputDisabled = isSubmitting || !hasInitialized || gameOver;
  const showValidateRetry = !!message && retryAction === 'submitGuess';

  const { restartPhase, startRestartExit, markRestarting } = useGameRestartFlow(
    {
      gameState,
      onRestart: handleRestart,
    },
  );

  // The real components render at all times so the layout is pixel-accurate.
  // While the word is loading, a CSS treatment hides text / icons and adds a
  // skeleton-style pulse so the shapes look like placeholders. Once the word
  // is validated the treatment is removed — zero layout shift because the
  // exact same DOM elements stay in place.
  const skeletonSx = hasInitialized ? EMPTY_SX : SKELETON_SX;

  useInitialWordLoad({ fetchWord });
  useGameStatsSync({
    gameState,
    guessCount: guesses.length,
    solution,
    clearMessage,
    addWin,
    addLoss,
  });

  useEffect(() => {
    if (submissionStatus === SUBMISSION_STATUS.ERROR) {
      triggerShake();
    }
  }, [submissionStatus, triggerShake]);

  const handleSnackbarRetry = useCallback(() => {
    void handleInput('ENTER');
  }, [handleInput]);

  const gridDisabled = inputDisabled && !gameOver;
  // Match Play Again: dim keyboard only after win/loss animations (restartPhase leaves idle).
  const keyboardVisuallyDisabled =
    inputDisabled && !(gameOver && restartPhase === 'idle');

  const keyboardRef = useRef<KeyboardHandle>(null);

  const handleKeyboardInput = useCallback(
    (key: string) => {
      keyboardRef.current?.flashKey(key);
      handleInput(key);
    },
    [handleInput],
  );

  useKeyboard(handleKeyboardInput, inputDisabled);

  const showValidationOverlay =
    isSubmitting && gameState === GAME_STATE.PLAYING && hasInitialized;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        mt: { xs: 0, sm: 4 },
        textAlign: 'center',
        ...skeletonSx,
        ...STANDALONE_ROOT_SX,
      }}
    >
      <ValidationLoadingOverlay visible={showValidationOverlay} />
      <Container
        component="main"
        id="main-content"
        aria-busy={showValidationOverlay}
        sx={{
          textAlign: 'center',
          ...STANDALONE_MAIN_SX,
        }}
      >
        <GameTitle />
        <Box sx={{ ...BOARD_SX, ...STANDALONE_BOARD_AREA_SX }}>
          <Box sx={{ ...BOARD_SX, ...STANDALONE_BOARD_SX }}>
            <Box sx={STANDALONE_GRID_AREA_SX}>
              <GuessGrid
                currentGuess={currentGuess}
                disabled={gridDisabled}
                gameOver={gameOver}
                guesses={guesses}
                isLost={gameState === GAME_STATE.LOST}
                isRestarting={restartPhase === 'restarting'}
                shake={shake}
                solution={solution}
              />
            </Box>
            <Keyboard
              ref={keyboardRef}
              disabled={inputDisabled}
              enterDisabled={
                currentGuess.length !== WORD_LENGTH ||
                currentGuess.includes(PLACEHOLDER_CHAR)
              }
              visuallyDisabled={keyboardVisuallyDisabled}
              letterStatuses={letterStatuses}
              onKeyPress={handleInput}
            />
          </Box>
        </Box>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <PlayAgainButton
            visible={restartPhase === 'showButton'}
            onClick={startRestartExit}
            onExited={markRestarting}
          />
          <DefinitionButton
            visible={restartPhase === 'showButton'}
            word={solution}
          />
        </Stack>
        {(gameState === GAME_STATE.PLAYING ||
          gameState === GAME_STATE.LOADING) && (
          <GameSnackbar
            message={message}
            onClose={clearMessage}
            severity={messageSeverity}
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

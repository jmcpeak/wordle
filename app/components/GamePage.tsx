'use client';

import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import DefinitionButton from '@/components/DefinitionButton';
import GameSnackbar from '@/components/GameSnackbar';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import Keyboard, { type KeyboardHandle } from '@/components/Keyboard';
import PlayAgainButton from '@/components/PlayAgainButton';
import ValidationLoadingOverlay from '@/components/ValidationLoadingOverlay';
import WinSnackbar from '@/components/WinSnackbar';
import WordLoadErrorDialog from '@/components/WordLoadErrorDialog';
import { GAME_STATE, PLACEHOLDER_CHAR, WORD_LENGTH } from '@/constants';
import { useDeferredLetterStatuses } from '@/hooks/useDeferredLetterStatuses';
import { useGameRestartFlow } from '@/hooks/useGameRestartFlow';
import { useGameStatsSync } from '@/hooks/useGameStatsSync';
import { useInitialWordLoad } from '@/hooks/useInitialWordLoad';
import { useKeyboard } from '@/hooks/useKeyboard';
import { useShake } from '@/hooks/useShake';
import { isIosDevice, useStandaloneMode } from '@/hooks/useStandaloneMode';
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

/** macOS PWA: inset with safe-area on all edges. */
const MAC_STANDALONE_ROOT_SX = {
  position: 'fixed',
  top: 'env(safe-area-inset-top, 0px)',
  right: 'env(safe-area-inset-right, 0px)',
  bottom: 'env(safe-area-inset-bottom, 0px)',
  left: 'env(safe-area-inset-left, 0px)',
  boxSizing: 'border-box',
  mt: 0,
  overflow: 'hidden',
} as const;

/** iOS PWA: fill the physical screen; keyboard row pads above the home indicator. */
const IOS_STANDALONE_ROOT_SX = {
  position: 'fixed',
  inset: 0,
  boxSizing: 'border-box',
  mt: 0,
  overflow: 'hidden',
} as const;

const CONTAINER_SX = { textAlign: 'center' } as const;

const STANDALONE_MAIN_SX = {
  ...CONTAINER_SX,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  height: '100%',
} as const;

const STANDALONE_BOARD_COLUMN_SX = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  width: '100%',
} as const;

/** Grows between the letter grid and keyboard in standalone PWA layout. */
const STANDALONE_BOARD_SPACER_SX = {
  flex: 1,
  minHeight: 0,
} as const;

const STANDALONE_KEYBOARD_SX = {
  flexShrink: 0,
  width: { xs: '100%', sm: 'fit-content' },
  maxWidth: '100%',
  mx: 'auto',
} as const;

/** iOS PWA keeps the keyboard tight to the bottom (no safe-area padding). */
const IOS_STANDALONE_KEYBOARD_SX = {
  ...STANDALONE_KEYBOARD_SX,
  paddingBottom: 0,
} as const;

const MAC_STANDALONE_KEYBOARD_SX = {
  ...STANDALONE_KEYBOARD_SX,
  paddingBottom: 1,
} as const;

/** Browser flow: the wrapper is a pass-through so the DOM shape matches PWA. */
const BROWSER_PASSTHROUGH_SX = {} as const;

/** The spacer only does work in the PWA flex column. */
const BROWSER_SPACER_SX = { display: 'none' } as const;

const BOARD_WRAPPER_SX = {
  flexShrink: 0,
  ...BOARD_SX,
} as const;

const BASE_ROOT_SX = {
  display: 'flex',
  flexDirection: 'column',
  textAlign: 'center',
} as const;

const BROWSER_ROOT_SX = {
  ...BASE_ROOT_SX,
  position: 'relative',
  mt: 0,
} as const;

const ACTION_STACK_SX = {
  alignItems: 'center',
  justifyContent: 'center',
} as const;

export default function GamePage() {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const standalone = useStandaloneMode();
  const iosStandalone = standalone && isIosDevice();
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
    submissionErrorCount,
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
      submissionErrorCount: s.submissionErrorCount,
      isSubmitting: s.isSubmitting,
    })),
  );

  // Actions are stable references — select individually to avoid re-renders
  const fetchWord = useGameStore((s) => s.fetchWord);
  const handleInput = useGameStore((s) => s.handleInput);
  const handleRestart = useGameStore((s) => s.handleRestart);
  const deletePartialGame = useGameStore((s) => s.deletePartialGame);
  const clearMessage = useGameStore((s) => s.clearMessage);
  const addWin = useStatsStore((s) => s.addWin);
  const addLoss = useStatsStore((s) => s.addLoss);
  const { shakeToken, triggerShake } = useShake();

  const displayedLetterStatuses = useDeferredLetterStatuses(
    letterStatuses,
    guesses,
    solution,
  );

  const gameOver =
    gameState === GAME_STATE.WON || gameState === GAME_STATE.LOST;
  const inputDisabled = isSubmitting || gameState !== GAME_STATE.PLAYING;
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

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.replace('/signin');
    }
  }, [authStatus, router]);

  useInitialWordLoad({
    fetchWord,
    enabled: authStatus === 'authenticated',
  });
  useGameStatsSync({
    gameState,
    guessCount: guesses.length,
    solution,
    deletePartialGame,
    addWin,
    addLoss,
  });

  useEffect(() => {
    if (submissionErrorCount > 0) {
      triggerShake();
    }
  }, [submissionErrorCount, triggerShake]);

  useEffect(() => {
    if (!standalone) return;
    const { documentElement: html, body } = document;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, [standalone]);

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
      void handleInput(key);
    },
    [handleInput],
  );

  useKeyboard(handleKeyboardInput, inputDisabled);

  const showValidationOverlay =
    isSubmitting && gameState === GAME_STATE.PLAYING && hasInitialized;

  const rootSx = useMemo(
    () => ({
      ...(standalone ? BASE_ROOT_SX : BROWSER_ROOT_SX),
      ...skeletonSx,
      ...(standalone
        ? iosStandalone
          ? IOS_STANDALONE_ROOT_SX
          : MAC_STANDALONE_ROOT_SX
        : null),
    }),
    [standalone, iosStandalone, skeletonSx],
  );

  const mainSx = standalone ? STANDALONE_MAIN_SX : CONTAINER_SX;
  const keyboardWrapperSx = !standalone
    ? BROWSER_PASSTHROUGH_SX
    : iosStandalone
      ? IOS_STANDALONE_KEYBOARD_SX
      : MAC_STANDALONE_KEYBOARD_SX;

  const enterDisabled =
    currentGuess.length !== WORD_LENGTH ||
    currentGuess.includes(PLACEHOLDER_CHAR);

  return (
    <Box sx={rootSx}>
      <ValidationLoadingOverlay visible={showValidationOverlay} />
      <Container
        component="main"
        id="main-content"
        aria-busy={showValidationOverlay}
        sx={mainSx}
      >
        <GameTitle />
        {/*
          One board tree for both targets — only the sx varies. Branching on
          `standalone` in JSX would unmount and remount the grid and keyboard
          (losing in-flight flip animations and key refs) the moment
          display-mode resolves after hydration.
        */}
        <Box sx={standalone ? STANDALONE_BOARD_COLUMN_SX : BOARD_SX}>
          <Box sx={standalone ? BOARD_WRAPPER_SX : BROWSER_PASSTHROUGH_SX}>
            <GuessGrid
              compactLayout
              currentGuess={currentGuess}
              disabled={gridDisabled}
              gameOver={gameOver}
              guesses={guesses}
              isLost={gameState === GAME_STATE.LOST}
              isRestarting={restartPhase === 'restarting'}
              shakeToken={shakeToken}
              solution={solution}
            />
          </Box>
          <Box
            aria-hidden
            sx={standalone ? STANDALONE_BOARD_SPACER_SX : BROWSER_SPACER_SX}
          />
          <Box sx={keyboardWrapperSx}>
            <Keyboard
              ref={keyboardRef}
              compactLayout
              disabled={inputDisabled}
              enterDisabled={enterDisabled}
              visuallyDisabled={keyboardVisuallyDisabled}
              letterStatuses={displayedLetterStatuses}
              onKeyPress={handleInput}
            />
          </Box>
        </Box>
        <Stack direction="row" spacing={1.5} sx={ACTION_STACK_SX}>
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
      {gameState === GAME_STATE.WON && restartPhase === 'showButton' && (
        <WinSnackbar message={message} onClose={clearMessage} />
      )}
    </Box>
  );
}

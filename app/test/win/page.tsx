'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import FormControlLabel from '@mui/material/FormControlLabel';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GuessGrid from '@/components/GuessGrid';
import WinSnackbar, {
  IOS_STANDALONE_MIN_INSET_PX,
} from '@/components/WinSnackbar';
import {
  GAME_STATE,
  MAX_GUESSES,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { useGameStore } from '@/store/gameStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';
import { getWinCongratulationsMessage } from '@/utils/winCongratulations';

const TEST_SOLUTION = 'CRANE';
const FILLER_GUESSES = ['WORDS', 'PLANT', 'STARE', 'CLOUD', 'MIGHT'] as const;
const DEFAULT_ATTEMPT_COUNT = 3;
const ATTEMPT_COUNTS = Array.from({ length: MAX_GUESSES }, (_, i) => i + 1);
const SNACKBAR_EXTRA_PX = 8;
const DYNAMIC_ISLAND_PREVIEW_HEIGHT_PX = 59;
const DEFAULT_SIMULATED_INSET_PX = IOS_STANDALONE_MIN_INSET_PX;

const PAGE_ROOT_SX = { position: 'relative', minHeight: '100dvh' } as const;
const IOS_SHELL_SX = {
  position: 'fixed',
  inset: 0,
  boxSizing: 'border-box',
  overflow: 'hidden',
  bgcolor: 'background.default',
} as const;
const DYNAMIC_ISLAND_PREVIEW_SX = {
  position: 'fixed',
  top: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: 126,
  height: DYNAMIC_ISLAND_PREVIEW_HEIGHT_PX,
  borderRadius: '0 0 20px 20px',
  bgcolor: '#000',
  opacity: 0.92,
  zIndex: 1401,
  pointerEvents: 'none',
} as const;
const MAIN_SX = {
  mt: 4,
  textAlign: 'center',
  position: 'relative',
  height: '100%',
  overflow: 'auto',
} as const;
const DESCRIPTION_SX = { mb: 2 } as const;
const CONTROLS_SX = {
  maxWidth: 420,
  mx: 'auto',
  mt: 3,
  px: 2,
  textAlign: 'left' as const,
};
const ATTEMPT_LABEL_SX = { mb: 1, textAlign: 'center' as const };
const ATTEMPT_ROW_SX = {
  flexDirection: 'row' as const,
  gap: 1,
  justifyContent: 'center',
  flexWrap: 'wrap' as const,
};
const ATTEMPT_BUTTON_SX = { minWidth: 40, px: 1 } as const;
const BUTTON_ROW_SX = {
  flexDirection: 'row' as const,
  gap: 1,
  justifyContent: 'center',
  flexWrap: 'wrap' as const,
  mt: 2,
};
const SIMULATOR_SX = {
  maxWidth: 420,
  mx: 'auto',
  mt: 2,
  px: 2,
  py: 1.5,
  borderRadius: 1,
  bgcolor: 'action.hover',
  textAlign: 'left' as const,
} as const;
const SIMULATOR_TITLE_SX = { mb: 0.5 } as const;
const SIMULATOR_HINT_SX = { display: 'block', mb: 1.5 } as const;
const OFFSET_READOUT_SX = { mt: 1 } as const;

function letterStatusesForGuesses(
  guesses: string[],
  solution: string,
): Record<string, LetterStatus> {
  const newLetterStatuses: Record<string, LetterStatus> = {};
  guesses.forEach((guess) => {
    const guessStatuses = checkGuess(guess, solution);
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
  return newLetterStatuses;
}

function guessesForAttempts(attemptCount: number, won: boolean): string[] {
  const fillers = FILLER_GUESSES.slice(0, Math.max(attemptCount - 1, 0));
  return won ? [...fillers, TEST_SOLUTION] : [...fillers];
}

function applyPreWinState(attemptCount: number) {
  const guesses = guessesForAttempts(attemptCount, false);
  useGameStore.setState({
    solution: TEST_SOLUTION,
    guesses,
    currentGuess: '',
    gameState: GAME_STATE.PLAYING,
    hasInitialized: true,
    message: '',
    messageSeverity: 'info',
    letterStatuses: letterStatusesForGuesses(guesses, TEST_SOLUTION),
    submissionStatus: SUBMISSION_STATUS.IDLE,
    isSubmitting: false,
  });
}

function applyWinState(attemptCount: number) {
  const guesses = guessesForAttempts(attemptCount, true);
  useGameStore.setState({
    solution: TEST_SOLUTION,
    guesses,
    currentGuess: '',
    gameState: GAME_STATE.WON,
    hasInitialized: true,
    message: getWinCongratulationsMessage(guesses.length),
    messageSeverity: 'info',
    letterStatuses: letterStatusesForGuesses(guesses, TEST_SOLUTION),
    submissionStatus: SUBMISSION_STATUS.SUCCESS,
    isSubmitting: false,
  });
}

/**
 * Replayable harness for the win celebration (green reveal + count-up settle)
 * and the attempt-based congratulations snackbar.
 *
 * Visit `/test/win` — no database writes.
 * Quick preview: `/test/win?snackbar=1` or `/test/win?snackbar=1&ios=1`
 */
export default function TestWinPage() {
  const { solution, guesses, currentGuess, gameState, message } = useGameStore(
    useShallow((s) => ({
      solution: s.solution,
      guesses: s.guesses,
      currentGuess: s.currentGuess,
      gameState: s.gameState,
      message: s.message,
    })),
  );
  const clearMessage = useGameStore((s) => s.clearMessage);

  const [attemptCount, setAttemptCount] = useState(DEFAULT_ATTEMPT_COUNT);
  const [animating, setAnimating] = useState(false);
  const [simulateIosPwa, setSimulateIosPwa] = useState(false);
  const [simulatedInsetPx, setSimulatedInsetPx] = useState(
    DEFAULT_SIMULATED_INSET_PX,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ios = params.get('ios') === '1';
    const snackbar = params.get('snackbar') === '1';
    setSimulateIosPwa(ios);
    applyPreWinState(DEFAULT_ATTEMPT_COUNT);
    if (snackbar) {
      applyWinState(DEFAULT_ATTEMPT_COUNT);
      setAnimating(false);
    }
  }, []);

  useEffect(() => {
    if (gameState !== GAME_STATE.WON) {
      setAnimating(false);
      return;
    }
    if (!animating) return;
    const timeoutId = setTimeout(() => {
      setAnimating(false);
    }, WIN_ANIMATION_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [animating, gameState]);

  const playWin = useCallback(() => {
    setAnimating(true);
    applyWinState(attemptCount);
  }, [attemptCount]);

  const showSnackbarNow = useCallback(() => {
    applyWinState(attemptCount);
    setAnimating(false);
  }, [attemptCount]);

  const replay = useCallback(() => {
    applyPreWinState(attemptCount);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true);
        applyWinState(attemptCount);
      });
    });
  }, [attemptCount]);

  const selectAttemptCount = useCallback((nextCount: number) => {
    setAttemptCount(nextCount);
    applyPreWinState(nextCount);
  }, []);

  const gameOver = gameState === GAME_STATE.WON;
  const canPlay = gameState === GAME_STATE.PLAYING && !animating;
  const canReplay = gameState === GAME_STATE.WON && !animating;
  const snackbarMessage = animating ? '' : message;
  const topPxOverride = simulateIosPwa
    ? simulatedInsetPx + SNACKBAR_EXTRA_PX
    : undefined;
  const resolvedTopPx =
    topPxOverride ??
    SNACKBAR_EXTRA_PX + (simulateIosPwa ? simulatedInsetPx : 0);

  return (
    <Box sx={simulateIosPwa ? IOS_SHELL_SX : PAGE_ROOT_SX}>
      {simulateIosPwa ? (
        <Box aria-hidden sx={DYNAMIC_ISLAND_PREVIEW_SX} />
      ) : null}
      <Container component="main" id="main-content" sx={MAIN_SX}>
        <Typography variant="h5" component="h1" gutterBottom>
          Win animation
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={DESCRIPTION_SX}>
          Reveal to green, then each tile counts up and settles left to right.
          Use <strong>Show snackbar</strong> to preview the congratulations
          toast instantly. Toggle <strong>Simulate iOS PWA</strong> to match the
          installed-app shell and Dynamic Island offset.
        </Typography>
        <GuessGrid
          currentGuess={currentGuess}
          disabled
          gameOver={gameOver}
          guesses={guesses}
          isLost={false}
          shake={false}
          solution={solution}
        />
        <Box sx={CONTROLS_SX}>
          <Typography variant="subtitle2" sx={ATTEMPT_LABEL_SX}>
            Guesses
          </Typography>
          <Stack sx={ATTEMPT_ROW_SX}>
            {ATTEMPT_COUNTS.map((count) => (
              <Button
                key={count}
                variant={attemptCount === count ? 'contained' : 'outlined'}
                sx={ATTEMPT_BUTTON_SX}
                onClick={() => selectAttemptCount(count)}
                disabled={animating}
                aria-pressed={attemptCount === count}
                aria-label={`Win in ${count} ${count === 1 ? 'guess' : 'guesses'}`}
              >
                {count}
              </Button>
            ))}
          </Stack>
          <Stack sx={BUTTON_ROW_SX}>
            <Button variant="contained" onClick={playWin} disabled={!canPlay}>
              Play win
            </Button>
            <Button variant="outlined" onClick={showSnackbarNow}>
              Show snackbar
            </Button>
            <Button variant="outlined" onClick={replay} disabled={!canReplay}>
              Replay
            </Button>
          </Stack>
        </Box>
        <Box sx={SIMULATOR_SX}>
          <Typography variant="subtitle2" sx={SIMULATOR_TITLE_SX}>
            Snackbar preview
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={SIMULATOR_HINT_SX}
          >
            Direct link: <code>/test/win?snackbar=1&amp;ios=1</code>
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={simulateIosPwa}
                onChange={(_, checked) => setSimulateIosPwa(checked)}
              />
            }
            label="Simulate iOS PWA"
          />
          {simulateIosPwa ? (
            <>
              <Typography id="safe-area-slider" gutterBottom>
                Safe area top: {simulatedInsetPx}px
              </Typography>
              <Slider
                aria-labelledby="safe-area-slider"
                value={simulatedInsetPx}
                min={0}
                max={80}
                step={1}
                onChange={(_, value) =>
                  setSimulatedInsetPx(
                    typeof value === 'number' ? value : value[0],
                  )
                }
              />
            </>
          ) : null}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={OFFSET_READOUT_SX}
          >
            Snackbar top offset: {resolvedTopPx}px
            {snackbarMessage ? ` · showing “${snackbarMessage}”` : ''}
          </Typography>
        </Box>
      </Container>
      <WinSnackbar
        message={snackbarMessage}
        onClose={clearMessage}
        simulateIosStandalone={simulateIosPwa}
        topPxOverride={topPxOverride}
      />
    </Box>
  );
}

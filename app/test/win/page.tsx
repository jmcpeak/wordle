'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GuessGrid from '@/components/GuessGrid';
import WinSnackbar from '@/components/WinSnackbar';
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

const MAIN_SX = { mt: 4, textAlign: 'center' } as const;
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
  mt: 2,
};

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
 * Visit `/test/win` — no database writes.
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

  useEffect(() => {
    applyPreWinState(DEFAULT_ATTEMPT_COUNT);
  }, []);

  useEffect(() => {
    if (gameState !== GAME_STATE.WON) {
      setAnimating(false);
      return;
    }
    setAnimating(true);
    const timeoutId = setTimeout(() => {
      setAnimating(false);
    }, WIN_ANIMATION_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [gameState]);

  const playWin = useCallback(() => {
    setAnimating(true);
    applyWinState(attemptCount);
  }, [attemptCount]);

  const replay = useCallback(() => {
    applyPreWinState(attemptCount);
    // Let GuessGrid observe the shrink before growing again (triggers reveal).
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

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <Typography variant="h5" component="h1" gutterBottom>
        Win animation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={DESCRIPTION_SX}>
        Reveal to green, then each tile counts up and settles left to right.
        After the animation, a short congratulations toast appears based on how
        many guesses it took.
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
          <Button variant="outlined" onClick={replay} disabled={!canReplay}>
            Replay
          </Button>
        </Stack>
      </Box>
      <WinSnackbar message={animating ? '' : message} onClose={clearMessage} />
    </Container>
  );
}

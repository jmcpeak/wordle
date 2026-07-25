'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import GuessGrid from '@/components/GuessGrid';
import {
  GAME_STATE,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { useGameStore } from '@/store/gameStore';
import type { LetterStatus } from '@/types';
import { checkGuess } from '@/utils/gameLogic';

const TEST_SOLUTION = 'CRANE';
const PRE_WIN_GUESSES = ['WORDS', 'PLANT'] as const;

const MAIN_SX = { mt: 4, textAlign: 'center' } as const;
const CONTROLS_SX = {
  maxWidth: 420,
  mx: 'auto',
  mt: 3,
  px: 2,
  textAlign: 'left' as const,
};
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

function applyPreWinState() {
  useGameStore.setState({
    solution: TEST_SOLUTION,
    guesses: [...PRE_WIN_GUESSES],
    currentGuess: '',
    gameState: GAME_STATE.PLAYING,
    hasInitialized: true,
    message: '',
    letterStatuses: letterStatusesForGuesses(
      [...PRE_WIN_GUESSES],
      TEST_SOLUTION,
    ),
    submissionStatus: SUBMISSION_STATUS.IDLE,
    isSubmitting: false,
  });
}

function applyWinState() {
  const guesses = [...PRE_WIN_GUESSES, TEST_SOLUTION];
  useGameStore.setState({
    solution: TEST_SOLUTION,
    guesses,
    currentGuess: '',
    gameState: GAME_STATE.WON,
    hasInitialized: true,
    message: '',
    letterStatuses: letterStatusesForGuesses(guesses, TEST_SOLUTION),
    submissionStatus: SUBMISSION_STATUS.SUCCESS,
    isSubmitting: false,
  });
}

/**
 * Replayable harness for the win celebration (green reveal + count-up settle).
 * Visit `/test/win` — no database writes.
 */
export default function TestWinPage() {
  const { solution, guesses, currentGuess, gameState } = useGameStore(
    useShallow((s) => ({
      solution: s.solution,
      guesses: s.guesses,
      currentGuess: s.currentGuess,
      gameState: s.gameState,
    })),
  );

  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    applyPreWinState();
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
    applyWinState();
  }, []);

  const replay = useCallback(() => {
    applyPreWinState();
    // Let GuessGrid observe the shrink before growing again (triggers reveal).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        applyWinState();
      });
    });
  }, []);

  const gameOver = gameState === GAME_STATE.WON;
  const canPlay = gameState === GAME_STATE.PLAYING && !animating;
  const canReplay = gameState === GAME_STATE.WON && !animating;

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <Typography variant="h5" component="h1" gutterBottom>
        Win animation
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Reveal to green, then each tile counts up and settles left to right.
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
        <Stack sx={BUTTON_ROW_SX}>
          <Button variant="contained" onClick={playWin} disabled={!canPlay}>
            Play win
          </Button>
          <Button variant="outlined" onClick={replay} disabled={!canReplay}>
            Replay
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

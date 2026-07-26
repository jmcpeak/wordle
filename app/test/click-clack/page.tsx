'use client';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import PlayAgainButton from '@/components/PlayAgainButton';
import { RESTART_SPLIT_FLAP_DURATION_MS } from '@/constants';

const MAIN_SX = { mt: 4, textAlign: 'center' } as const;
const CAPTION_SX = { mt: 2, color: 'text.secondary' } as const;

const SOLUTION = 'CRANE';
/** Four mixed-status rows — none is the solution, so no win jump animation. */
const GUESSES = ['WORDS', 'PLANT', 'STARE', 'CRATE'];

/**
 * Manual preview of the Play Again split-flap (click-clack) animation.
 * Visit `/test/click-clack` and press Play Again to run it; the board resets so you can press again.
 */
export default function TestClickClackPage() {
  const [isRestarting, setIsRestarting] = useState(false);
  const [playAgainVisible, setPlayAgainVisible] = useState(true);
  const [playAgainExiting, setPlayAgainExiting] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  const handleRestartAndReset = useCallback(() => {
    setPlayAgainExiting(true);
  }, []);

  const handlePlayAgainExited = useCallback(() => {
    setPlayAgainExiting(false);
    setPlayAgainVisible(false);
    setIsRestarting(true);
  }, []);

  useEffect(() => {
    if (!isRestarting) return;
    const timeoutId = setTimeout(() => {
      setIsRestarting(false);
      setBoardKey((key) => key + 1);
      setPlayAgainVisible(true);
    }, RESTART_SPLIT_FLAP_DURATION_MS);
    return () => clearTimeout(timeoutId);
  }, [isRestarting]);

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <GameTitle />
      <GuessGrid
        key={boardKey}
        currentGuess=""
        disabled
        gameOver
        guesses={GUESSES}
        isLost={false}
        isRestarting={isRestarting}
        shake={false}
        solution={SOLUTION}
      />
      <PlayAgainButton
        visible={playAgainVisible && !playAgainExiting && !isRestarting}
        onClick={handleRestartAndReset}
        onExited={handlePlayAgainExited}
      />
      <Typography variant="body2" sx={CAPTION_SX}>
        Press Play Again — each tile takes a random 2–4 hop path to clear. For a
        single-tile path label, see /test/random-clear
      </Typography>
    </Container>
  );
}

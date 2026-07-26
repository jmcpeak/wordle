'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useMemo, useState } from 'react';
import GameTitle from '@/components/GameTitle';
import GuessGrid from '@/components/GuessGrid';
import PlayAgainButton from '@/components/PlayAgainButton';
import SplitFlapLetterBox from '@/components/SplitFlapLetterBox';
import { RESTART_SPLIT_FLAP_DURATION_MS } from '@/constants';
import { getSplitFlapRandomClearPath } from '@/utils/splitFlapDrum';

const MAIN_SX = { mt: 4, textAlign: 'center', pb: 6 } as const;
const CAPTION_SX = { mt: 2, color: 'text.secondary' } as const;
const SECTION_SX = { mt: 6, textAlign: 'left' as const };
const SECTION_TITLE_SX = { mb: 1 } as const;
const STAGE_SX = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  my: 3,
  minHeight: 160,
} as const;
const LETTER_GROUP_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 0.5,
  mt: 2,
} as const;
const LETTER_BTN_SX = {
  minWidth: 36,
  px: 1,
} as const;
const PATH_LABEL_SX = {
  mt: 1,
  mb: 2,
  textAlign: 'center' as const,
  fontFamily: 'monospace',
  fontWeight: 700,
} as const;
const CLEAR_BUTTON_SX = { alignSelf: 'center', minWidth: 140 } as const;
const BOARD_WRAP_SX = { textAlign: 'center' as const };
const SINGLE_TILE_STACK_SX = { alignItems: 'center' } as const;

const SOLUTION = 'CRANE';
/** Mixed-status rows so every tile has a letter to clear. */
const GUESSES = ['WORDS', 'PLANT', 'STARE', 'CRATE'];

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEMO_SIZE_SCALE = 2;
const CLEAR_ANIMATION = { type: 'restartFlipToEmpty' as const, delay: 0 };

function formatPath(start: string, path: string[]): string {
  const steps = [
    start === '' ? 'clear' : start,
    ...path.map((ch) => (ch === '' ? 'clear' : ch)),
  ];
  return `${steps.join(' → ')} (${path.length} fold${path.length === 1 ? '' : 's'})`;
}

/**
 * Manual preview of Play Again random clear (2–4 random hops to blank).
 * Visit `/test/random-clear`
 */
export default function TestRandomClearPage() {
  const [isRestarting, setIsRestarting] = useState(false);
  const [playAgainVisible, setPlayAgainVisible] = useState(true);
  const [playAgainExiting, setPlayAgainExiting] = useState(false);
  const [boardKey, setBoardKey] = useState(0);

  const [demoLetter, setDemoLetter] = useState('D');
  const [tileRunId, setTileRunId] = useState(0);
  const [isTileClearing, setIsTileClearing] = useState(false);

  const clearPath = useMemo(() => {
    void tileRunId;
    return getSplitFlapRandomClearPath(demoLetter);
  }, [demoLetter, tileRunId]);

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

  const handlePickLetter = useCallback((ch: string) => {
    setDemoLetter(ch);
    setIsTileClearing(false);
    setTileRunId((id) => id + 1);
  }, []);

  const handleClearTile = useCallback(() => {
    setIsTileClearing(true);
    setTileRunId((id) => id + 1);
  }, []);

  const handleTileDrumComplete = useCallback(() => {
    setIsTileClearing(false);
    setTileRunId((id) => id + 1);
  }, []);

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <GameTitle />
      <Typography variant="h5" component="h1" gutterBottom>
        Random clear
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Play Again clear: each tile picks 2–4 random letter hops, then blank.
        Not alphabetical.
      </Typography>

      <Box sx={SECTION_SX}>
        <Typography variant="h6" component="h2" sx={SECTION_TITLE_SX}>
          Full board
        </Typography>
        <Box sx={BOARD_WRAP_SX}>
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
            Press Play Again — board restores so you can run it again
          </Typography>
        </Box>
      </Box>

      <Box sx={SECTION_SX}>
        <Typography variant="h6" component="h2" sx={SECTION_TITLE_SX}>
          Single tile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Pick a letter, then Clear to see one random path (label matches the
          walk). Tile restores after so you can Clear again.
        </Typography>

        <Box sx={STAGE_SX}>
          <SplitFlapLetterBox
            key={tileRunId}
            aria-label={`Demo letter ${demoLetter}`}
            letter={demoLetter}
            status="correct"
            animation={CLEAR_ANIMATION}
            drumPath={isTileClearing ? clearPath : [demoLetter]}
            drumActive={isTileClearing}
            onDrumComplete={handleTileDrumComplete}
            sizeScale={DEMO_SIZE_SCALE}
          />
        </Box>

        <Typography variant="body1" sx={PATH_LABEL_SX}>
          {isTileClearing
            ? formatPath(demoLetter, clearPath)
            : `${demoLetter} (idle — press Clear)`}
        </Typography>

        <Stack spacing={2} sx={SINGLE_TILE_STACK_SX}>
          <Box sx={LETTER_GROUP_SX}>
            {LETTERS.map((ch) => (
              <Button
                key={ch}
                size="small"
                variant={demoLetter === ch ? 'contained' : 'outlined'}
                aria-label={`Letter ${ch}`}
                onClick={() => handlePickLetter(ch)}
                disabled={isTileClearing}
                sx={LETTER_BTN_SX}
              >
                {ch}
              </Button>
            ))}
          </Box>
          <Button
            variant="contained"
            onClick={handleClearTile}
            disabled={isTileClearing}
            sx={CLEAR_BUTTON_SX}
          >
            Clear
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}

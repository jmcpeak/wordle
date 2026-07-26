'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useRef, useState } from 'react';
import SplitFlapLetterBox from '@/components/SplitFlapLetterBox';
import { SPLIT_FLAP_FLIP_DURATION_MS } from '@/constants';
import {
  getSplitFlapLetterEnterPath,
  getSplitFlapRandomClearPath,
} from '@/utils/splitFlapDrum';

const MAIN_SX = { mt: 4, textAlign: 'center' } as const;
const STAGE_SX = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  my: 6,
  minHeight: 200,
} as const;
const CONTROLS_SX = {
  maxWidth: 480,
  mx: 'auto',
  px: 2,
  textAlign: 'left',
} as const;
const TOGGLE_BUTTON_SX = {
  alignSelf: 'center',
  minWidth: 140,
} as const;
const LETTER_GROUP_SX = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  gap: 0.5,
} as const;
const LETTER_BTN_SX = {
  minWidth: 36,
  px: 1,
} as const;
const PATH_LABEL_SX = {
  mb: 2,
  fontFamily: 'monospace',
  fontWeight: 700,
} as const;
const SLIDER_MARKS = [
  { value: 0, label: 'Slow' },
  { value: 50, label: 'Current' },
  { value: 100, label: 'Fast' },
] as const;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DEMO_SIZE_SCALE = 2;
/** Same types the game board uses. */
const LETTER_ENTER_ANIMATION = { type: 'letterEnter' as const, delay: 0 };
const CLEAR_ANIMATION = { type: 'restartFlipToEmpty' as const, delay: 0 };

const FLIP_MS_SLOW = 1200;
const FLIP_MS_CURRENT = SPLIT_FLAP_FLIP_DURATION_MS;
const FLIP_MS_FAST = 100;

type LabMode = 'idle' | 'entering' | 'clearing';

/** Slider 0–100 with current app timing at 50. */
function sliderToFlipMs(value: number): number {
  if (value <= 50) {
    return Math.round(
      FLIP_MS_SLOW + (FLIP_MS_CURRENT - FLIP_MS_SLOW) * (value / 50),
    );
  }
  return Math.round(
    FLIP_MS_CURRENT + (FLIP_MS_FAST - FLIP_MS_CURRENT) * ((value - 50) / 50),
  );
}

function formatPath(start: string, path: string[]): string {
  const steps = [
    start === '' ? 'clear' : start,
    ...path.map((ch) => (ch === '' ? 'clear' : ch)),
  ];
  return `${steps.join(' → ')} (${path.length} fold${path.length === 1 ? '' : 's'})`;
}

/**
 * Lab: keyboard letter → flap in from clear (e.g. D: clear→D→D).
 * Start loops the Play Again clear path. Same SplitFlapLetterBox as the board.
 * Visit `/test/click-clack-lab`
 */
export default function TestClickClackLabPage() {
  const [demoLetter, setDemoLetter] = useState<string | null>(null);
  const [mode, setMode] = useState<LabMode>('idle');
  const [speedSlider, setSpeedSlider] = useState(50);
  const [runId, setRunId] = useState(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const flipDurationMs = useMemo(
    () => sliderToFlipMs(speedSlider),
    [speedSlider],
  );

  const enterPath = useMemo(
    () => (demoLetter ? getSplitFlapLetterEnterPath(demoLetter) : []),
    [demoLetter],
  );

  // Include runId so each Start / loop gets a fresh random path.
  const clearPath = useMemo(() => {
    void runId;
    return demoLetter ? getSplitFlapRandomClearPath(demoLetter) : [];
  }, [demoLetter, runId]);

  const pathLabel = useMemo(() => {
    if (!demoLetter) {
      return 'Pick a letter — e.g. D flaps clear → D → D';
    }
    if (mode === 'clearing') {
      return `Clear: ${formatPath(demoLetter, clearPath)}`;
    }
    return `Enter: ${formatPath('', enterPath)}`;
  }, [demoLetter, mode, clearPath, enterPath]);

  const animation =
    mode === 'clearing' ? CLEAR_ANIMATION : LETTER_ENTER_ANIMATION;

  const handleLetter = useCallback((ch: string) => {
    // Never blocked — remount starts a fresh enter walk.
    setDemoLetter(ch);
    setMode('entering');
    setRunId((id) => id + 1);
  }, []);

  const handleToggleClear = useCallback(() => {
    if (!demoLetter) return;
    if (modeRef.current === 'clearing') {
      setMode('idle');
      setRunId((id) => id + 1);
      return;
    }
    setMode('clearing');
    setRunId((id) => id + 1);
  }, [demoLetter]);

  const handleDrumComplete = useCallback(() => {
    if (modeRef.current === 'entering') {
      setMode('idle');
      return;
    }
    if (modeRef.current === 'clearing') {
      setRunId((id) => id + 1);
    }
  }, []);

  return (
    <Container component="main" id="main-content" sx={MAIN_SX}>
      <Typography variant="h5" component="h1" gutterBottom>
        Click-clack lab
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Click a letter to flap it in (clear → letter → letter). Start loops
        clear. Click another letter anytime — never blocked.
      </Typography>

      <Box sx={STAGE_SX}>
        <SplitFlapLetterBox
          key={runId}
          aria-label={
            demoLetter ? `Demo letter ${demoLetter}` : 'Empty demo tile'
          }
          letter={demoLetter ?? ''}
          // Match the game: typed enter uses empty; clear loop keeps status colors.
          status={mode === 'clearing' ? 'correct' : 'empty'}
          animation={animation}
          // Idle: hold letter. Enter/clear: pass path so the label matches the walk.
          drumPath={
            mode === 'idle'
              ? demoLetter
                ? [demoLetter]
                : ['']
              : mode === 'clearing'
                ? clearPath
                : enterPath
          }
          flipDurationMs={flipDurationMs}
          onDrumComplete={handleDrumComplete}
          sizeScale={DEMO_SIZE_SCALE}
          drumActive={mode === 'entering' || mode === 'clearing'}
        />
      </Box>

      <Typography variant="body1" sx={PATH_LABEL_SX}>
        {pathLabel}
      </Typography>

      <Stack spacing={3} sx={CONTROLS_SX}>
        <Box sx={LETTER_GROUP_SX}>
          {LETTERS.map((ch) => (
            <Button
              key={ch}
              size="small"
              variant={demoLetter === ch ? 'contained' : 'outlined'}
              aria-label={`Letter ${ch}`}
              onClick={() => handleLetter(ch)}
              sx={LETTER_BTN_SX}
            >
              {ch}
            </Button>
          ))}
        </Box>

        <Button
          variant="contained"
          onClick={handleToggleClear}
          disabled={!demoLetter}
          sx={TOGGLE_BUTTON_SX}
        >
          {mode === 'clearing' ? 'Stop' : 'Start clear loop'}
        </Button>

        <Box>
          <Typography id="flip-speed-label" gutterBottom>
            Speed · {flipDurationMs} ms per fold
          </Typography>
          <Slider
            aria-labelledby="flip-speed-label"
            value={speedSlider}
            min={0}
            max={100}
            step={1}
            marks={[...SLIDER_MARKS]}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${sliderToFlipMs(value)} ms`}
            onChange={(_, value) => {
              setSpeedSlider(typeof value === 'number' ? value : value[0]);
            }}
          />
        </Box>
      </Stack>
    </Container>
  );
}

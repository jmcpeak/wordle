'use client';

import { AppBar, Box, Container, Skeleton, Stack, Toolbar } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CELL_MARGIN,
  CELL_SPACING,
  KEY_SIZING,
  KEYBOARD_KEYS,
  MAX_GUESSES,
  WORD_LENGTH,
} from '@/constants';

/** Derived from the shared KEYBOARD_KEYS layout so skeleton rows stay in sync. */
const KEYBOARD_ROW_COUNTS = KEYBOARD_KEYS.map((row) => row.length);

/**
 * MUI's default IconButton (medium) renders at 40×40 px
 * (24 px icon + 8 px padding on each side).
 */
const ICON_BUTTON_SIZE = 40;

export default function LoadingIndicator() {
  const theme = useTheme();

  // --- Grid cell dimensions (mirrors LetterBox) ---
  const cellSize = {
    xs: theme.spacing(CELL_SPACING.xs),
    sm: theme.spacing(CELL_SPACING.sm),
  };
  const cellMargin = theme.spacing(CELL_MARGIN);

  // --- Keyboard key dimensions (mirrors KeyButton) ---
  // Width: minWidth drives the CSS min-width; content (single letter at
  // keyboardKey fontSize) adds roughly one padding.x worth of extra width.
  const keyWidth = {
    sm: theme.spacing(KEY_SIZING.minWidth + KEY_SIZING.padding.x),
    xs: theme.spacing(KEY_SIZING.minWidth),
  };
  // Height: line-height (1.75 × fontSize) + 2 × vertical padding.
  // keyboardKey fontSize is 1.25rem (sm) / 0.9rem (xs).
  const keyHeight = {
    sm: `calc(1.25rem * 1.75 + ${theme.spacing(KEY_SIZING.padding.y * 2)})`,
    xs: `calc(0.9rem * 1.75 + ${theme.spacing(KEY_SIZING.paddingXs.y * 2)})`,
  };
  const keyMargin = theme.spacing(KEY_SIZING.margin);

  return (
    // Mirrors GamePage: <Container sx={{ mt: 4, textAlign: 'center' }}>
    <Container sx={{ mt: 4, textAlign: 'center' }}>
      {/* Title bar — mirrors GameTitle wrapped in <Fade><div>...</div></Fade> */}
      <div>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar>
            <Skeleton
              variant="text"
              sx={{
                width: { xs: 140, sm: 180 },
                height: { xs: 36, sm: 44 },
                flexShrink: 0,
              }}
            />
            <Box sx={{ flexGrow: 1 }} />
            {/* Real title bar renders 3 IconButtons flush (no gap) */}
            <Stack direction="row">
              <Skeleton variant="circular" width={ICON_BUTTON_SIZE} height={ICON_BUTTON_SIZE} />
              <Skeleton variant="circular" width={ICON_BUTTON_SIZE} height={ICON_BUTTON_SIZE} />
              <Skeleton variant="circular" width={ICON_BUTTON_SIZE} height={ICON_BUTTON_SIZE} />
            </Stack>
          </Toolbar>
        </AppBar>
      </div>

      {/* Guess-grid — mirrors GuessGrid > LetterRow > LetterBox */}
      <Stack alignItems="center" spacing={0} sx={{ mb: 4 }}>
        {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => (
          <Box
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-size skeleton grid.
            key={`skeleton-row-${rowIndex}`}
            sx={{ display: 'flex' }}
          >
            {Array.from({ length: WORD_LENGTH }).map((_, colIndex) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-size skeleton grid.
                key={`skeleton-cell-${colIndex}`}
                variant="rectangular"
                sx={{
                  width: { xs: cellSize.xs, sm: cellSize.sm },
                  height: { xs: cellSize.xs, sm: cellSize.sm },
                  margin: cellMargin,
                  borderRadius: 0.5,
                }}
              />
            ))}
          </Box>
        ))}
      </Stack>

      {/* Keyboard — mirrors Keyboard > Stack rows > KeyButton */}
      <Stack alignItems="center" sx={{ mt: 4 }}>
        {KEYBOARD_ROW_COUNTS.map((keyCount, rowIndex) => (
          <Stack
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-size skeleton keyboard.
            key={`skeleton-kb-row-${rowIndex}`}
            direction="row"
            sx={{ mb: 1 }}
          >
            {Array.from({ length: keyCount }).map((_, keyIndex) => (
              <Skeleton
                // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-size skeleton keyboard.
                key={`skeleton-key-${keyIndex}`}
                variant="rectangular"
                sx={{
                  width: { xs: keyWidth.xs, sm: keyWidth.sm },
                  height: { xs: keyHeight.xs, sm: keyHeight.sm },
                  margin: keyMargin,
                  borderRadius: 0.5,
                }}
              />
            ))}
          </Stack>
        ))}
      </Stack>
    </Container>
  );
}

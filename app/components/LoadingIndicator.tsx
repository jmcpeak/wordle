'use client';

import {
  AppBar,
  Box,
  Container,
  Skeleton,
  Stack,
  Toolbar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  CELL_MARGIN,
  CELL_SPACING,
  KEY_SIZING,
  KEYBOARD_KEYS,
  MAX_GUESSES,
  WORD_LENGTH,
} from '@/constants';

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
  const keyWidth = theme.spacing(KEY_SIZING.minWidth + KEY_SIZING.padding.x);
  // Height: line-height (1.75 × fontSize) + 2 × vertical padding.
  // keyboardKey fontSize is 1.25rem (sm) / 1rem (xs).
  const keyHeight = {
    sm: `calc(1.25rem * 1.75 + ${theme.spacing(KEY_SIZING.padding.y * 2)})`,
    xs: `calc(1rem * 1.75 + ${theme.spacing(KEY_SIZING.paddingXs.y * 2)})`,
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
              <Skeleton
                variant="circular"
                width={ICON_BUTTON_SIZE}
                height={ICON_BUTTON_SIZE}
              />
              <Skeleton
                variant="circular"
                width={ICON_BUTTON_SIZE}
                height={ICON_BUTTON_SIZE}
              />
              <Skeleton
                variant="circular"
                width={ICON_BUTTON_SIZE}
                height={ICON_BUTTON_SIZE}
              />
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
        {KEYBOARD_KEYS.map((row, rowIndex) => (
          <Stack
            // biome-ignore lint/suspicious/noArrayIndexKey: Fixed-size skeleton keyboard.
            key={`skeleton-kb-row-${rowIndex}`}
            direction="row"
            sx={{ mb: 1, width: { xs: '100%', sm: 'auto' } }}
          >
            {row.map((key) => (
              <Skeleton
                key={`skeleton-key-${rowIndex}-${key}`}
                variant="rectangular"
                sx={{
                  width: { xs: 0, sm: keyWidth },
                  minWidth: { xs: 0, sm: keyWidth },
                  flex: {
                    xs: key === 'ENTER' || key === 'BACKSPACE' ? 1.5 : 1,
                    sm: '0 0 auto',
                  },
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

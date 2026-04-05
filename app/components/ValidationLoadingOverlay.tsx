'use client';

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

type Props = { visible: boolean };

/** Subtle dim while a guess is being validated (network round-trip). */
export default function ValidationLoadingOverlay({ visible }: Props) {
  if (!visible) return null;

  return (
    <Box
      aria-hidden
      sx={(theme) => ({
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        borderRadius: 1,
        bgcolor: alpha(
          theme.palette.common.black,
          theme.palette.mode === 'dark' ? 0.28 : 0.06,
        ),
        pointerEvents: 'none',
      })}
    />
  );
}

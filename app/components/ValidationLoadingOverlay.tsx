'use client';

import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

type Props = { visible: boolean };

export default function ValidationLoadingOverlay({ visible }: Props) {
  return (
    <Box
      aria-hidden={!visible}
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
        opacity: visible ? 1 : 0,
        transition: 'opacity 150ms ease-in',
      })}
    />
  );
}

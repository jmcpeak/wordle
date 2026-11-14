'use client';

import { Box } from '@mui/material';
import { alpha, type Theme } from '@mui/material/styles';
import { memo } from 'react';

type Props = { visible: boolean };

const BASE_OVERLAY_SX = (theme: Theme) => ({
  position: 'absolute',
  inset: 0,
  zIndex: 2,
  borderRadius: 1,
  bgcolor: alpha(
    theme.palette.common.black,
    theme.palette.mode === 'dark' ? 0.28 : 0.06,
  ),
  pointerEvents: 'none',
  transition: 'opacity 150ms ease-in',
});

const VISIBLE_OVERLAY_SX = [BASE_OVERLAY_SX, { opacity: 1 }] as const;
const HIDDEN_OVERLAY_SX = [BASE_OVERLAY_SX, { opacity: 0 }] as const;

export default memo(function ValidationLoadingOverlay({ visible }: Props) {
  return (
    <Box
      aria-hidden={!visible}
      sx={visible ? VISIBLE_OVERLAY_SX : HIDDEN_OVERLAY_SX}
    />
  );
});

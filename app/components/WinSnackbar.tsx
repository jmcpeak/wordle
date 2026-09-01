'use client';

import Slide from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';
import { memo } from 'react';

const AUTO_HIDE_DURATION_MS = 10_000;

const ANCHOR_ORIGIN = {
  vertical: 'top',
  horizontal: 'center',
} as const;

const SLOTS = { transition: Slide };

const SLOT_PROPS = {
  content: {
    sx: {
      justifyContent: 'center',
      minWidth: 'auto',
    },
  },
  transition: {
    direction: 'down',
  },
} as const;

/** Clear the notch / Dynamic Island on iOS PWA (and other safe-area devices). */
const SNACKBAR_SX = {
  top: 'calc(env(safe-area-inset-top, 0px) + 8px)',
} as const;

type WinSnackbarProps = {
  message: string;
  onClose: () => void;
};

export default memo(function WinSnackbar({
  message,
  onClose,
}: WinSnackbarProps) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={AUTO_HIDE_DURATION_MS}
      onClose={(_, reason) => {
        if (reason !== 'timeout') return;
        onClose();
      }}
      message={message}
      anchorOrigin={ANCHOR_ORIGIN}
      slots={SLOTS}
      slotProps={SLOT_PROPS}
      sx={SNACKBAR_SX}
    />
  );
});

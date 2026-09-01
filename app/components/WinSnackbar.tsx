'use client';

import Slide from '@mui/material/Slide';
import Snackbar from '@mui/material/Snackbar';
import type { SxProps, Theme } from '@mui/material/styles';
import type { SystemStyleObject } from '@mui/system';
import { memo } from 'react';
import { useSafeAreaTopOffset } from '@/hooks/useSafeAreaTopOffset';
import { isIosDevice, useStandaloneMode } from '@/hooks/useStandaloneMode';

const AUTO_HIDE_DURATION_MS = 5_000;

const ANCHOR_ORIGIN = {
  vertical: 'top',
  horizontal: 'center',
} as const;

const SLOTS = { transition: Slide };

const CONTENT_SX: SystemStyleObject<Theme> = {
  flexGrow: 0,
  width: 'fit-content',
  minWidth: 'unset',
  maxWidth: 'calc(100% - 32px)',
  justifyContent: 'center',
  padding: '16px 32px',
  '@media (min-width: 600px)': {
    minWidth: 'unset',
    flexGrow: 0,
  },
  '& .MuiSnackbarContent-message': {
    padding: 0,
  },
};

const SLOT_PROPS = {
  content: {
    sx: CONTENT_SX,
  },
  transition: {
    direction: 'down',
  },
} as const;

/** Dynamic Island fallback when env(safe-area-inset-top) reads 0 in iOS PWA. */
export const IOS_STANDALONE_MIN_INSET_PX = 52;

function getSnackbarSx(topPx: number): SxProps<Theme> {
  return {
    position: 'absolute',
    top: `${topPx}px`,
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translateX(-50%)',
    width: 'auto',
    maxWidth: 'none',
    display: 'flex',
    justifyContent: 'center',
    '& .MuiSnackbarContent-root': CONTENT_SX,
    '&&': {
      position: 'absolute',
      top: `${topPx}px`,
      left: '50%',
      right: 'auto',
    },
  };
}

type WinSnackbarProps = {
  message: string;
  onClose: () => void;
  /** Test harness: apply the iOS PWA minimum inset even off-device. */
  simulateIosStandalone?: boolean;
  /** Test harness: pin the snackbar at an explicit top offset (px). */
  topPxOverride?: number;
};

export default memo(function WinSnackbar({
  message,
  onClose,
  simulateIosStandalone = false,
  topPxOverride,
}: WinSnackbarProps) {
  const standalone = useStandaloneMode();
  const iosStandalone = simulateIosStandalone || (standalone && isIosDevice());
  const measuredTopPx = useSafeAreaTopOffset(
    8,
    iosStandalone ? IOS_STANDALONE_MIN_INSET_PX : 0,
  );
  const topPx = topPxOverride ?? measuredTopPx;

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
      sx={getSnackbarSx(topPx)}
    />
  );
});

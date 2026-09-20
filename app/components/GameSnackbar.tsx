'use client';

import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import type { Theme } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import BaseSnackbar from '@/components/BaseSnackbar';
import { useTranslation } from '@/store/i18nStore';

const AUTO_HIDE_WITH_RETRY_MS = 8000;
const AUTO_HIDE_MS = 2000;

/** Module scope: a new `sx` callback each render would defeat BaseSnackbar's memo. */
const SNACKBAR_SX = (theme: Theme) => ({
  [theme.breakpoints.down('sm')]: {
    top: '8%',
    bottom: 'auto',
    left: 0,
    right: 0,
    transform: 'none',
    width: '100%',
  },
});

type GameSnackbarProps = {
  message: string;
  onClose: () => void;
  severity?: AlertColor;
  onRetry?: () => void;
};

export default memo(function GameSnackbar({
  message,
  onClose,
  severity = 'info',
  onRetry,
}: GameSnackbarProps) {
  const { t } = useTranslation();
  const retryLabel = t('message.retryValidationAria');

  const action = useMemo(
    () =>
      onRetry ? (
        <IconButton
          size="small"
          aria-label={retryLabel}
          color="inherit"
          onClick={onRetry}
        >
          <ReplayIcon fontSize="small" />
        </IconButton>
      ) : undefined,
    [onRetry, retryLabel],
  );

  return (
    <BaseSnackbar
      action={action}
      autoHideDuration={onRetry ? AUTO_HIDE_WITH_RETRY_MS : AUTO_HIDE_MS}
      message={message}
      onClose={onClose}
      severity={severity}
      sx={SNACKBAR_SX}
    />
  );
});

'use client';

import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton } from '@mui/material';
import type { AlertColor } from '@mui/material/Alert';
import { memo } from 'react';
import BaseSnackbar from '@/components/BaseSnackbar';
import { useTranslation } from '@/store/i18nStore';

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
  const action = onRetry ? (
    <IconButton
      size="small"
      aria-label={t('message.retryValidationAria')}
      color="inherit"
      onClick={onRetry}
    >
      <ReplayIcon fontSize="small" />
    </IconButton>
  ) : undefined;

  return (
    <BaseSnackbar
      action={action}
      autoHideDuration={onRetry ? 8000 : 2000}
      message={message}
      onClose={onClose}
      severity={severity}
      sx={(theme) => ({
        [theme.breakpoints.down('sm')]: {
          top: '8%',
          bottom: 'auto',
          left: 0,
          right: 0,
          transform: 'none',
          width: '100%',
        },
      })}
    />
  );
});

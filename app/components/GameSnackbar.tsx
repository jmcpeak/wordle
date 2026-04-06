'use client';

import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton, Snackbar } from '@mui/material';
import Alert, { type AlertColor } from '@mui/material/Alert';
import { memo } from 'react';
import { useTranslation } from '@/store/i18nStore';

type GameSnackbarProps = {
  message: string;
  onClose: () => void;
  severity?: AlertColor;
  /** Shown as an icon button at the end (e.g. re-submit guess after validate failed). */
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
    <Snackbar
      autoHideDuration={onRetry ? 8000 : 2000}
      onClose={onClose}
      open={!!message}
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
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        action={action}
        sx={{ width: '100%', alignItems: 'center' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
});

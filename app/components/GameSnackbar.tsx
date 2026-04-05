'use client';

import ReplayIcon from '@mui/icons-material/Replay';
import { IconButton, Snackbar } from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

type GameSnackbarProps = {
  message: string;
  onClose: () => void;
  /** Shown as an icon button at the end (e.g. re-submit guess after validate failed). */
  onRetry?: () => void;
};

export default function GameSnackbar({
  message,
  onClose,
  onRetry,
}: GameSnackbarProps) {
  const { t } = useTranslation();

  return (
    <Snackbar
      autoHideDuration={onRetry ? 8000 : 2000}
      message={message}
      onClose={onClose}
      open={!!message}
      action={
        onRetry ? (
          <IconButton
            size="small"
            aria-label={t('dialog.wordLoadError.tryAgain')}
            color="inherit"
            onClick={onRetry}
          >
            <ReplayIcon fontSize="small" />
          </IconButton>
        ) : undefined
      }
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
}

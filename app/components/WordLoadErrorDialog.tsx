'use client';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

type Props = {
  open: boolean;
  onRetry: () => void;
};

export default function WordLoadErrorDialog({ open, onRetry }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      aria-labelledby="word-load-error-title"
      aria-describedby="word-load-error-desc"
    >
      <DialogTitle id="word-load-error-title">
        {t('dialog.wordLoadError.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="word-load-error-desc" component="span">
          {t('dialog.wordLoadError.description')}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onRetry} variant="contained" color="primary" autoFocus>
          {t('dialog.wordLoadError.tryAgain')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

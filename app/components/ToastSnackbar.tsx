'use client';

import { Alert, Snackbar } from '@mui/material';
import { useToastStore } from '@/store/toastStore';

export default function ToastSnackbar() {
  const { message, severity, hideToast } = useToastStore();

  return (
    <Snackbar
      autoHideDuration={6000}
      onClose={hideToast}
      open={!!message}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={hideToast} severity={severity} variant="filled">
        {message}
      </Alert>
    </Snackbar>
  );
}

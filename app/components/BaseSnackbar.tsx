'use client';

import Alert, { type AlertColor } from '@mui/material/Alert';
import Snackbar, { type SnackbarProps } from '@mui/material/Snackbar';
import { memo, type ReactNode } from 'react';

type BaseSnackbarProps = {
  action?: ReactNode;
  anchorOrigin?: SnackbarProps['anchorOrigin'];
  autoHideDuration?: number;
  message: string | null;
  onClose: () => void;
  severity?: AlertColor;
  sx?: SnackbarProps['sx'];
};

export default memo(function BaseSnackbar({
  action,
  anchorOrigin,
  autoHideDuration = 2000,
  message,
  onClose,
  severity = 'info',
  sx,
}: BaseSnackbarProps) {
  return (
    <Snackbar
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      open={!!message}
      anchorOrigin={anchorOrigin}
      sx={sx}
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

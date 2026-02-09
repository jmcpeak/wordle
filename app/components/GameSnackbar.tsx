import { Alert, type AlertColor, Snackbar } from '@mui/material';

type GameSnackbarProps = {
  message: string;
  severity?: AlertColor;
  onClose: () => void;
};

export default function GameSnackbar({
  message,
  severity = 'info',
  onClose,
}: GameSnackbarProps) {
  return (
    <Snackbar autoHideDuration={5000} onClose={onClose} open={!!message}>
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}

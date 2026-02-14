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
    <Snackbar
      autoHideDuration={5000}
      onClose={onClose}
      open={!!message}
      sx={(theme) => ({
        [theme.breakpoints.down('sm')]: {
          top: '50%',
          bottom: 'auto',
          left: '50%',
          right: 'auto',
          transform: 'translate(-50%, -50%)',
        },
      })}
    >
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

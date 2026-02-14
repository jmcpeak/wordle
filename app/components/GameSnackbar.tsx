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
      autoHideDuration={2000}
      onClose={onClose}
      open={!!message}
      sx={(theme) => ({
        [theme.breakpoints.down('sm')]: {
          top: '5%',
          bottom: 'auto',
          left: 0,
          right: 0,
          transform: 'none',
          width: '100%',
        },
      })}
    >
      <Alert severity={severity} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

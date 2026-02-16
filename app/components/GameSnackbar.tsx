import { Snackbar } from '@mui/material';

type GameSnackbarProps = {
  message: string;
  onClose: () => void;
};

export default function GameSnackbar({ message, onClose }: GameSnackbarProps) {
  return (
    <Snackbar
      autoHideDuration={2000}
      message={message}
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
    />
  );
}

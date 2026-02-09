import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import { Button, Stack } from '@mui/material';
import { darken, styled } from '@mui/material/styles';
import { KEY_SIZING, KEYBOARD_KEYS } from '@/constants';
import type { LetterStatus } from '@/types';

const KeyButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status?: LetterStatus }>(({ theme, status }) => ({
  minWidth: theme.spacing(KEY_SIZING.minWidth),
  padding: theme.spacing(KEY_SIZING.padding.y, KEY_SIZING.padding.x),
  margin: theme.spacing(KEY_SIZING.margin),
  ...theme.typography.keyboardKey,
  [theme.breakpoints.down('sm')]: {
    flex: 1,
    minWidth: 0,
    margin: theme.spacing(KEY_SIZING.marginXs),
    padding: theme.spacing(KEY_SIZING.paddingXs.y, KEY_SIZING.paddingXs.x),
    fontSize: '1rem',
  },
  backgroundColor:
    status === 'correct'
      ? theme.palette.game.correct
      : status === 'present'
        ? theme.palette.game.present
        : status === 'absent'
          ? theme.palette.game.absent
          : theme.palette.grey[300],
  color:
    status && status !== 'empty'
      ? theme.palette.common.white
      : theme.palette.text.primary,
  '&:hover': {
    backgroundColor:
      status === 'correct'
        ? darken(theme.palette.game.correct, 0.15)
        : status === 'present'
          ? darken(theme.palette.game.present, 0.15)
          : status === 'absent'
            ? darken(theme.palette.game.absent, 0.15)
            : darken(theme.palette.grey[300], 0.1),
  },
}));

type KeyboardProps = {
  disabled?: boolean;
  letterStatuses: Record<string, LetterStatus>;
  onKeyPress: (key: string) => void;
};

function getKeyAriaLabel(key: string, status?: LetterStatus): string {
  const label =
    key === 'BACKSPACE'
      ? 'Backspace'
      : key === 'ENTER'
        ? 'Enter'
        : `Key ${key}`;
  if (status && status !== 'empty') return `${label}, ${status}`;
  return label;
}

export default function Keyboard({
  disabled,
  letterStatuses,
  onKeyPress,
}: KeyboardProps) {
  return (
    <Stack
      role="group"
      aria-label="Keyboard"
      alignItems="center"
      sx={{
        mt: 4,
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {KEYBOARD_KEYS.map((row) => (
        <Stack
          key={`keyboard-row-${row.join('-')}`}
          direction="row"
          sx={{ mb: 1, width: { xs: '100%', sm: 'auto' } }}
        >
          {row.map((key) => {
            const status = letterStatuses[key];
            return (
              <KeyButton
                key={key}
                aria-label={getKeyAriaLabel(key, status)}
                onClick={() => onKeyPress(key)}
                status={status}
                sx={
                  key === 'ENTER' || key === 'BACKSPACE'
                    ? {
                        fontSize: { xs: '0.9rem', sm: '0.8rem' },
                        px: { xs: 1, sm: 2 },
                        flex: { xs: 1.5 },
                      }
                    : undefined
                }
                variant="contained"
              >
                {key === 'BACKSPACE' ? <BackspaceOutlinedIcon /> : key}
              </KeyButton>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

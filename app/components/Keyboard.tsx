import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { darken, styled } from '@mui/material/styles';
import { memo, useMemo } from 'react';
import { KEY_SIZING, KEYBOARD_KEYS } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import type { LetterStatus } from '@/types';

const WIDE_KEY_SX = {
  fontSize: { xs: '0.9rem', sm: '0.8rem' },
  px: { xs: 1, sm: 2 },
  flex: { xs: 1.5 },
} as const;

const KeyButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status?: LetterStatus }>(({ theme, status }) => {
  const defaultKeyColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[700]
      : theme.palette.grey[200];
  const isDarkAbsentKey = theme.palette.mode === 'dark' && status === 'absent';
  const isLightAbsentKey =
    theme.palette.mode === 'light' && status === 'absent';

  return {
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
            : defaultKeyColor,
    color:
      status && status !== 'empty'
        ? theme.palette.common.white
        : theme.palette.text.primary,
    border: isDarkAbsentKey
      ? `1px solid ${theme.palette.grey[700]}`
      : isLightAbsentKey
        ? `1px solid ${theme.palette.grey[400]}`
        : '1px solid transparent',
    '&:hover': {
      backgroundColor:
        status === 'correct'
          ? darken(theme.palette.game.correct, 0.15)
          : status === 'present'
            ? darken(theme.palette.game.present, 0.15)
            : status === 'absent'
              ? darken(theme.palette.game.absent, 0.15)
              : darken(defaultKeyColor, 0.1),
      borderColor: isDarkAbsentKey ? theme.palette.common.white : 'transparent',
    },
  };
});

type KeyboardProps = {
  disabled?: boolean;
  letterStatuses: Record<string, LetterStatus>;
  onKeyPress: (key: string) => void;
};

type KeyboardKeyModel = {
  key: string;
  ariaLabel: string;
  isWide: boolean;
  status?: LetterStatus;
};

function buildKeyAriaLabel(
  key: string,
  status: LetterStatus | undefined,
  keyLabels: Record<'backspace' | 'enter', string>,
  statusLabels: Record<Exclude<LetterStatus, 'empty'>, string>,
  letterKeyLabel: (letter: string) => string,
): string {
  let label: string;
  if (key === 'BACKSPACE') {
    label = keyLabels.backspace;
  } else if (key === 'ENTER') {
    label = keyLabels.enter;
  } else {
    label = letterKeyLabel(key);
  }
  if (status && status !== 'empty') {
    return `${label}, ${statusLabels[status]}`;
  }
  return label;
}

export default memo(function Keyboard({
  disabled,
  letterStatuses,
  onKeyPress,
}: KeyboardProps) {
  const { t } = useTranslation();

  const groupAriaLabel = t('game.keyboard.region');
  const keyLabels = useMemo(
    () => ({
      backspace: t('game.keyboard.ariaBackspace'),
      enter: t('game.keyboard.ariaEnter'),
    }),
    [t],
  );
  const statusLabels = useMemo(
    () => ({
      correct: t('game.status.correct'),
      present: t('game.status.present'),
      absent: t('game.status.absent'),
    }),
    [t],
  );
  const keyRows = useMemo<KeyboardKeyModel[][]>(
    () =>
      KEYBOARD_KEYS.map((row) =>
        row.map((key) => {
          const status = letterStatuses[key];
          return {
            key,
            status,
            isWide: key === 'ENTER' || key === 'BACKSPACE',
            ariaLabel: buildKeyAriaLabel(
              key,
              status,
              keyLabels,
              statusLabels,
              (letter) => t('game.keyboard.ariaKeyLetter', { letter }),
            ),
          };
        }),
      ),
    [letterStatuses, keyLabels, statusLabels, t],
  );

  return (
    <Stack
      role="group"
      aria-disabled={disabled || undefined}
      aria-label={groupAriaLabel}
      alignItems="center"
      sx={{
        mt: 4,
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {keyRows.map((row, rowIndex) => (
        <Stack
          // biome-ignore lint/suspicious/noArrayIndexKey: Keyboard layout is static and never reorders.
          key={rowIndex}
          direction="row"
          sx={{ mb: 1, width: { xs: '100%', sm: 'auto' } }}
        >
          {row.map(({ key, ariaLabel, isWide, status }) => {
            return (
              <KeyButton
                key={key}
                aria-label={ariaLabel}
                disabled={disabled}
                onClick={() => onKeyPress(key)}
                status={status}
                sx={isWide ? WIDE_KEY_SX : undefined}
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
});

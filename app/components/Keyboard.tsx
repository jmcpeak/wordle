import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { darken, styled } from '@mui/material/styles';
import {
  memo,
  type MouseEvent as ReactMouseEvent,
  type Ref,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { KEY_SIZING, KEYBOARD_KEYS, PLACEHOLDER_DISPLAY } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import type { LetterStatus } from '@/types';

/**
 * Maps a keyboard key to a haptic preset consumed by HapticsProvider via the
 * `data-haptic` attribute. PLACEHOLDER is a layout spacer and gets no haptic.
 */
function hapticForKey(key: string): string | undefined {
  if (key === 'PLACEHOLDER') return undefined;
  if (key === 'ENTER') return 'success';
  return 'selection';
}

export type KeyboardHandle = {
  flashKey: (key: string) => void;
};

const WIDE_KEY_SX = {
  fontSize: { xs: '1rem', sm: '0.95rem' },
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
    borderRadius: 4,
    minWidth: theme.spacing(KEY_SIZING.minWidth),
    padding: theme.spacing(KEY_SIZING.padding.y, KEY_SIZING.padding.x),
    margin: theme.spacing(KEY_SIZING.margin),
    ...theme.typography.keyboardKey,
    [theme.breakpoints.down('sm')]: {
      flex: 1,
      minWidth: 0,
      margin: theme.spacing(KEY_SIZING.marginXs),
      padding: theme.spacing(KEY_SIZING.paddingXs.y, KEY_SIZING.paddingXs.x),
      fontSize: '1.25rem',
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
  /** Disables only the Enter key (e.g. when the current guess is incomplete). */
  enterDisabled?: boolean;
  /** Controls the visual disabled appearance (opacity, button styling). Defaults to `disabled`. */
  visuallyDisabled?: boolean;
  letterStatuses: Record<string, LetterStatus>;
  onKeyPress: (key: string) => void;
  ref?: Ref<KeyboardHandle>;
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
  keyLabels: Record<'backspace' | 'enter' | 'placeholder', string>,
  statusLabels: Record<Exclude<LetterStatus, 'empty'>, string>,
  letterKeyLabel: (letter: string) => string,
): string {
  let label: string;
  if (key === 'BACKSPACE') {
    label = keyLabels.backspace;
  } else if (key === 'ENTER') {
    label = keyLabels.enter;
  } else if (key === 'PLACEHOLDER') {
    label = keyLabels.placeholder;
  } else {
    label = letterKeyLabel(key);
  }
  if (status && status !== 'empty') {
    return `${label}, ${statusLabels[status]}`;
  }
  return label;
}

const RIPPLE_DURATION_MS = 200;

function dispatchMouseEvent(el: HTMLElement, type: string) {
  const rect = el.getBoundingClientRect();
  el.dispatchEvent(
    new MouseEvent(type, {
      bubbles: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    }),
  );
}

export default memo(function Keyboard({
  disabled,
  enterDisabled,
  visuallyDisabled,
  letterStatuses,
  onKeyPress,
  ref,
}: KeyboardProps) {
  const showDisabled = visuallyDisabled ?? disabled;
  const { t } = useTranslation();
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  useImperativeHandle(ref, () => ({
    flashKey(key: string) {
      const button = buttonRefs.current.get(key);
      if (!button) return;
      dispatchMouseEvent(button, 'mousedown');
      setTimeout(() => {
        dispatchMouseEvent(button, 'mouseup');
        dispatchMouseEvent(button, 'mouseleave');
      }, RIPPLE_DURATION_MS);
    },
  }));

  const setButtonRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      if (el) buttonRefs.current.set(key, el);
      else buttonRefs.current.delete(key);
    },
    [],
  );

  const handleKeyClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const key = e.currentTarget.dataset.key;
      if (!key) return;
      onKeyPress(key);
    },
    [onKeyPress],
  );

  const groupAriaLabel = t('game.keyboard.region');
  const keyLabels = useMemo(
    () => ({
      backspace: t('game.keyboard.ariaBackspace'),
      enter: t('game.keyboard.ariaEnter'),
      placeholder: t('game.keyboard.ariaPlaceholder'),
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
          const status =
            key === 'PLACEHOLDER' ? undefined : letterStatuses[key];
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
      sx={{
        alignItems: { xs: 'stretch', sm: 'center' },
        mt: { xs: 0.5, sm: 2 },
        opacity: showDisabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      {keyRows.map((row, rowIndex) => (
        <Stack
          // biome-ignore lint/suspicious/noArrayIndexKey: Keyboard layout is static and never reorders.
          key={rowIndex}
          direction="row"
          sx={{ mb: KEY_SIZING.rowGap, width: { xs: '100%', sm: 'auto' } }}
        >
          {row.map(({ key, ariaLabel, isWide, status }) => {
            const keyDisabled =
              showDisabled || (key === 'ENTER' && enterDisabled);
            return (
              <KeyButton
                key={key}
                ref={setButtonRef(key)}
                aria-label={ariaLabel}
                data-key={key}
                data-haptic={hapticForKey(key)}
                disabled={keyDisabled}
                onClick={handleKeyClick}
                status={status}
                sx={isWide ? WIDE_KEY_SX : undefined}
                variant="contained"
              >
                {key === 'BACKSPACE' ? (
                  <BackspaceOutlinedIcon />
                ) : key === 'PLACEHOLDER' ? (
                  PLACEHOLDER_DISPLAY
                ) : (
                  key
                )}
              </KeyButton>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
});

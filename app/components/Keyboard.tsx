import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import { alpha, darken, keyframes, styled } from '@mui/material/styles';
import {
  memo,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  useCallback,
  useEffect,
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

const keyRipple = keyframes`
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 0.28;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0;
  }
`;

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
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    minWidth: theme.spacing(KEY_SIZING.minWidth),
    padding: theme.spacing(KEY_SIZING.padding.y, KEY_SIZING.padding.x),
    margin: theme.spacing(KEY_SIZING.margin),
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition:
      'transform 90ms ease-out, opacity 90ms ease-out, background-color 120ms ease-out, border-color 120ms ease-out',
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
    '&:active, &[data-pressed="true"]': {
      transform: 'scale(0.96)',
      opacity: 0.9,
    },
    // Custom ripple — MUI TouchRipple gets stuck when @haptics/react's iOS
    // overlay intercepts touch events, so we run our own one-shot animation.
    '&::after': {
      content: '""',
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '110%',
      aspectRatio: '1',
      borderRadius: '50%',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%) scale(0)',
      opacity: 0,
      backgroundColor: alpha(theme.palette.common.white, 0.35),
    },
    '&[data-ripple="true"]::after': {
      animation: `${keyRipple} 420ms ease-out forwards`,
    },
    '@media (prefers-reduced-motion: reduce)': {
      '&[data-ripple="true"]::after': {
        animation: 'none',
      },
    },
    // MUI TouchRipple can get stuck on iOS PWA when @haptics/react's overlay
    // intercepts touch events — disable it entirely on keyboard keys.
    '& .MuiTouchRipple-root': {
      display: 'none',
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

const KEY_FLASH_DURATION_MS = 120;
const KEY_RIPPLE_DURATION_MS = 420;

function spawnKeyRipple(button: HTMLButtonElement) {
  button.removeAttribute('data-ripple');
  void button.offsetWidth;
  button.setAttribute('data-ripple', 'true');
}

function clearKeyRipple(button: HTMLButtonElement) {
  button.removeAttribute('data-ripple');
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
  const flashTimeouts = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );
  const rippleTimeouts = useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  useEffect(
    () => () => {
      for (const timeoutId of flashTimeouts.current.values()) {
        clearTimeout(timeoutId);
      }
      flashTimeouts.current.clear();
      for (const timeoutId of rippleTimeouts.current.values()) {
        clearTimeout(timeoutId);
      }
      rippleTimeouts.current.clear();
    },
    [],
  );

  const scheduleRippleClear = useCallback(
    (key: string, button: HTMLButtonElement) => {
      const existingTimeout = rippleTimeouts.current.get(key);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeoutId = setTimeout(() => {
        clearKeyRipple(button);
        rippleTimeouts.current.delete(key);
      }, KEY_RIPPLE_DURATION_MS);

      rippleTimeouts.current.set(key, timeoutId);
    },
    [],
  );

  const triggerKeyFeedback = useCallback(
    (key: string, button: HTMLButtonElement) => {
      button.setAttribute('data-pressed', 'true');
      spawnKeyRipple(button);

      const existingFlashTimeout = flashTimeouts.current.get(key);
      if (existingFlashTimeout) clearTimeout(existingFlashTimeout);

      const flashTimeoutId = setTimeout(() => {
        button.removeAttribute('data-pressed');
        flashTimeouts.current.delete(key);
      }, KEY_FLASH_DURATION_MS);

      flashTimeouts.current.set(key, flashTimeoutId);
      scheduleRippleClear(key, button);
    },
    [scheduleRippleClear],
  );

  useImperativeHandle(ref, () => ({
    flashKey(key: string) {
      const button = buttonRefs.current.get(key);
      if (!button) return;
      triggerKeyFeedback(key, button);
    },
  }));

  const setButtonRef = useCallback(
    (key: string) => (el: HTMLButtonElement | null) => {
      if (el) buttonRefs.current.set(key, el);
      else buttonRefs.current.delete(key);
    },
    [],
  );

  const handleKeyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const key = e.currentTarget.dataset.key;
      if (!key || e.currentTarget.disabled) return;
      triggerKeyFeedback(key, e.currentTarget);
    },
    [triggerKeyFeedback],
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
                disableRipple
                disableTouchRipple
                onPointerDown={handleKeyPointerDown}
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

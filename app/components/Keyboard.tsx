import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
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
  flex: 1.5,
} as const;

const KEYBOARD_SX = {
  alignItems: 'stretch',
  flexShrink: 0,
  transition: 'opacity 0.2s ease-in-out',
} as const;

const KEYBOARD_ROW_SX = {
  width: '100%',
} as const;

const KEY_RIPPLE_CLASS = 'key-ripple';

const keyRipple = keyframes`
  0% {
    transform: scale(0);
    opacity: 0.45;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
`;

/**
 * Native `<button>`, not MUI Button. MUI ButtonBase sets `disabled` on the
 * client and omits it during SSR, which React 19 reports as a hydration mismatch.
 */
const KeyButton = styled('button', {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status?: LetterStatus }>(({ theme, status }) => {
  const defaultKeyColor =
    theme.palette.mode === 'dark'
      ? theme.palette.grey[700]
      : theme.palette.grey[200];
  const isDarkAbsentKey = theme.palette.mode === 'dark' && status === 'absent';
  const isLightAbsentKey =
    theme.palette.mode === 'light' && status === 'absent';
  const rippleColor =
    theme.palette.mode === 'dark' || (status && status !== 'empty')
      ? alpha(theme.palette.common.white, 0.5)
      : alpha(theme.palette.common.black, 0.22);

  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    appearance: 'none',
    WebkitAppearance: 'none',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 4,
    flex: 1,
    minWidth: 0,
    margin: theme.spacing(KEY_SIZING.marginXs),
    padding: theme.spacing(KEY_SIZING.paddingXs.y, KEY_SIZING.paddingXs.x),
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    transition:
      'transform 90ms ease-out, opacity 90ms ease-out, background-color 120ms ease-out, border-color 120ms ease-out',
    ...theme.typography.keyboardKey,
    fontSize: '1.25rem',
    [theme.breakpoints.up('sm')]: {
      // Match the grid cell margin so keyboard rows line up edge-to-edge.
      margin: theme.spacing(KEY_SIZING.margin),
      padding: theme.spacing(KEY_SIZING.padding.y, KEY_SIZING.padding.x),
      fontSize: theme.typography.keyboardKey.fontSize,
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
      transform: 'scale(0.97)',
    },
    [`& .${KEY_RIPPLE_CLASS}`]: {
      position: 'absolute',
      borderRadius: '50%',
      pointerEvents: 'none',
      transform: 'scale(0)',
      animation: `${keyRipple} 550ms cubic-bezier(0.4, 0, 0.2, 1) forwards`,
      backgroundColor: rippleColor,
      zIndex: 0,
    },
    '& > :not(.key-ripple)': {
      position: 'relative',
      zIndex: 1,
    },
    '@media (prefers-reduced-motion: reduce)': {
      [`& .${KEY_RIPPLE_CLASS}`]: {
        animation: 'none',
        display: 'none',
      },
    },
    '&[aria-disabled="true"]': {
      cursor: 'default',
    },
    '&[data-dimmed="true"]': {
      opacity: 0.5,
    },
  };
});

function isInertKey(target: HTMLButtonElement): boolean {
  return target.getAttribute('aria-disabled') === 'true';
}

type KeyboardProps = {
  compactLayout?: boolean;
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
const KEY_RIPPLE_DURATION_MS = 550;

type RippleOrigin = { x: number; y: number };

function spawnKeyRipple(button: HTMLButtonElement, origin?: RippleOrigin) {
  const rect = button.getBoundingClientRect();
  const diameter = Math.max(rect.width, rect.height) * 2.2;
  const left =
    origin !== undefined
      ? origin.x - rect.left - diameter / 2
      : rect.width / 2 - diameter / 2;
  const top =
    origin !== undefined
      ? origin.y - rect.top - diameter / 2
      : rect.height / 2 - diameter / 2;

  const ripple = document.createElement('span');
  ripple.className = KEY_RIPPLE_CLASS;
  ripple.style.width = `${diameter}px`;
  ripple.style.height = `${diameter}px`;
  ripple.style.left = `${left}px`;
  ripple.style.top = `${top}px`;

  const remove = () => ripple.remove();
  ripple.addEventListener('animationend', remove, { once: true });
  setTimeout(remove, KEY_RIPPLE_DURATION_MS + 50);

  button.appendChild(ripple);
}

export default memo(function Keyboard({
  compactLayout = false,
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

  useEffect(
    () => () => {
      for (const timeoutId of flashTimeouts.current.values()) {
        clearTimeout(timeoutId);
      }
      flashTimeouts.current.clear();
    },
    [],
  );

  const triggerKeyFeedback = useCallback(
    (key: string, button: HTMLButtonElement, origin?: RippleOrigin) => {
      button.setAttribute('data-pressed', 'true');
      spawnKeyRipple(button, origin);

      const existingFlashTimeout = flashTimeouts.current.get(key);
      if (existingFlashTimeout) clearTimeout(existingFlashTimeout);

      const flashTimeoutId = setTimeout(() => {
        button.removeAttribute('data-pressed');
        flashTimeouts.current.delete(key);
      }, KEY_FLASH_DURATION_MS);

      flashTimeouts.current.set(key, flashTimeoutId);
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      flashKey(key: string) {
        const button = buttonRefs.current.get(key);
        if (!button) return;
        triggerKeyFeedback(key, button);
      },
    }),
    [triggerKeyFeedback],
  );

  /**
   * One stable callback for every key, resolved through `data-key`. A curried
   * `setButtonRef(key)` would hand React a fresh closure on each render, making
   * it detach and reattach all 28 key refs on every keystroke.
   */
  const setButtonRef = useCallback((el: HTMLButtonElement | null) => {
    const key = el?.dataset.key;
    if (!el || !key) return;
    const refs = buttonRefs.current;
    refs.set(key, el);
    return () => {
      if (refs.get(key) === el) refs.delete(key);
    };
  }, []);

  const handleKeyPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      const key = e.currentTarget.dataset.key;
      if (!key || disabled || isInertKey(e.currentTarget)) return;
      triggerKeyFeedback(key, e.currentTarget, { x: e.clientX, y: e.clientY });
    },
    [disabled, triggerKeyFeedback],
  );

  const handleKeyClick = useCallback(
    (e: ReactMouseEvent<HTMLButtonElement>) => {
      const key = e.currentTarget.dataset.key;
      if (!key || disabled || isInertKey(e.currentTarget)) return;
      onKeyPress(key);
    },
    [disabled, onKeyPress],
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
        ...KEYBOARD_SX,
        mt: compactLayout ? 0 : { xs: 0.5, sm: 2 },
        opacity: showDisabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      {keyRows.map((row, rowIndex) => (
        <Stack
          // biome-ignore lint/suspicious/noArrayIndexKey: Keyboard layout is static and never reorders.
          key={rowIndex}
          direction="row"
          sx={{
            ...KEYBOARD_ROW_SX,
            mb: rowIndex === keyRows.length - 1 ? 0 : KEY_SIZING.rowGap,
          }}
        >
          {row.map(({ key, ariaLabel, isWide, status }) => {
            const enterKeyDisabled = key === 'ENTER' && enterDisabled;
            const keyDisabled = Boolean(disabled || enterKeyDisabled);
            // Preserve evaluated key colors during the post-game animation.
            // The group is still inert, aria-disabled, and removed from tab
            // order. Never set the native `disabled` attribute — it hydrates
            // as true on the client and null in SSR HTML.
            const dimmed =
              keyDisabled && Boolean(showDisabled || enterKeyDisabled);
            return (
              <KeyButton
                key={key}
                ref={setButtonRef}
                type="button"
                aria-label={ariaLabel}
                aria-disabled={keyDisabled || undefined}
                data-dimmed={dimmed ? 'true' : undefined}
                data-key={key}
                data-haptic={hapticForKey(key)}
                onPointerDown={handleKeyPointerDown}
                onClick={handleKeyClick}
                status={status}
                sx={isWide ? WIDE_KEY_SX : undefined}
                tabIndex={keyDisabled ? -1 : undefined}
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

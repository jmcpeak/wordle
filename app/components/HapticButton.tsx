'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import { forwardRef } from 'react';

/**
 * Haptic presets provided by `@haptics/react`'s built-in pattern set. The
 * `HapticsProvider` (mounted in ThemeRegistry) wires up any element carrying a
 * `data-haptic` attribute, firing real Taptic feedback on iOS via an invisible
 * `input[switch]` overlay and `navigator.vibrate` on Android.
 */
export type HapticStyle =
  | 'selection'
  | 'impact-light'
  | 'impact-medium'
  | 'impact-heavy'
  | 'success'
  | 'warning'
  | 'error';

export type HapticButtonProps = ButtonProps & {
  /**
   * Haptic preset to fire on press, or `false` to disable. Defaults to
   * `impact-light`.
   */
  haptic?: false | HapticStyle;
};

/**
 * MUI Button that opts into haptic feedback via the `data-haptic` attribute.
 *
 * Feedback is handled declaratively by HapticsProvider rather than in an
 * onClick handler, which is the only approach that reliably preserves the
 * user-gesture context iOS requires (including inside installed PWAs).
 */
const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  function HapticButton({ haptic = 'impact-light', ...rest }, ref) {
    return <Button ref={ref} data-haptic={haptic || undefined} {...rest} />;
  },
);

export default HapticButton;

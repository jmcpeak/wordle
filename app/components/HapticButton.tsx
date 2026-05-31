'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import {
  forwardRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { type HapticStyle, useHaptic } from '@/hooks/useHaptic';

export type HapticButtonProps = ButtonProps & {
  /**
   * Haptic preset to fire on press, or `false` to disable. Defaults to `nudge`.
   */
  haptic?: false | HapticStyle;
};

/**
 * MUI Button wrapper that fires a haptic pulse on press where supported.
 *
 * Haptics are triggered synchronously inside the click handler (before the
 * caller's onClick) so iOS retains the user-gesture context it requires.
 */
const HapticButton = forwardRef<HTMLButtonElement, HapticButtonProps>(
  function HapticButton(
    { haptic = 'nudge', onClick, onPointerDown, ...rest },
    ref,
  ) {
    const fire = useHaptic();

    return (
      <Button
        {...rest}
        ref={ref}
        onPointerDown={(event: ReactPointerEvent<HTMLButtonElement>) => {
          if (haptic) fire(haptic);
          onPointerDown?.(event);
        }}
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
          onClick?.(event);
        }}
      />
    );
  },
);

export default HapticButton;

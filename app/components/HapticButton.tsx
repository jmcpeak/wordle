'use client';

import Button, { type ButtonProps } from '@mui/material/Button';
import { forwardRef, type MouseEvent as ReactMouseEvent } from 'react';
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
  function HapticButton({ haptic = 'nudge', onClick, ...rest }, ref) {
    const fire = useHaptic();

    return (
      <Button
        ref={ref}
        onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
          if (haptic) fire(haptic);
          onClick?.(event);
        }}
        {...rest}
      />
    );
  },
);

export default HapticButton;

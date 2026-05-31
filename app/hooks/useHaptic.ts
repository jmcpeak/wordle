'use client';

import { useCallback } from 'react';
import { useWebHaptics } from 'web-haptics/react';

export type HapticStyle = 'nudge' | 'success' | 'error' | 'buzz';

/**
 * Returns a stable callback that fires a haptic pulse on supported devices.
 *
 * Call the returned function synchronously inside a user gesture (e.g. directly
 * in an onClick handler) so iOS keeps the gesture context required for haptics.
 */
export function useHaptic() {
  const { trigger } = useWebHaptics();

  return useCallback(
    (style: HapticStyle = 'nudge') => {
      void trigger(style);
    },
    [trigger],
  );
}

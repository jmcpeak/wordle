'use client';

import { useCallback } from 'react';
import { useWebHaptics } from 'web-haptics/react';

export type HapticStyle = 'nudge' | 'success' | 'error' | 'buzz';

let iosSwitchInput: HTMLInputElement | null = null;
let iosSwitchLabel: HTMLLabelElement | null = null;

function hasVibrationApi(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  );
}

function ensureIosSwitchLabel(): HTMLLabelElement | null {
  if (typeof document === 'undefined') return null;
  if (iosSwitchInput && iosSwitchLabel) return iosSwitchLabel;

  const id = '__wordle_haptic_switch__';
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('switch', '');
  input.id = id;
  input.setAttribute('aria-hidden', 'true');
  input.tabIndex = -1;
  input.style.cssText =
    'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.setAttribute('aria-hidden', 'true');
  label.style.cssText =
    'position:absolute;width:0;height:0;opacity:0;pointer-events:none;';

  document.body.append(input, label);
  iosSwitchInput = input;
  iosSwitchLabel = label;
  return label;
}

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
      if (hasVibrationApi()) {
        void trigger(style);
        return;
      }

      // iOS fallback: keep element hidden but not display:none for Safari.
      try {
        ensureIosSwitchLabel()?.click();
      } catch {
        // No-op when unsupported.
      }
    },
    [trigger],
  );
}

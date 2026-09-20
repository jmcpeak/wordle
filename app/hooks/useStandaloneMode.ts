'use client';

import { useSyncExternalStore } from 'react';

const STANDALONE_QUERY = '(display-mode: standalone)';

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia(STANDALONE_QUERY).matches;
}

/** Server and hydration both see `false`, so markup always matches. */
function getServerSnapshot(): boolean {
  return false;
}

function subscribe(onStoreChange: () => void): () => void {
  const media = window.matchMedia(STANDALONE_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

/** True for iPhone/iPad Safari (including iPadOS desktop UA). */
export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

/**
 * Detect installed PWA mode. iOS requires navigator.standalone; macOS uses
 * display-mode.
 *
 * Reading the real value during the first render would desync SSR markup from
 * hydration, so this goes through `useSyncExternalStore`: React renders the
 * server snapshot while hydrating, then re-renders with the live value.
 */
export function useStandaloneMode(): boolean {
  return useSyncExternalStore(subscribe, detectStandalone, getServerSnapshot);
}

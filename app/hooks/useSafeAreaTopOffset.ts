'use client';

import { useLayoutEffect, useState } from 'react';

function measureSafeAreaInsetTop(): number {
  if (typeof document === 'undefined') return 0;

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none;';
  document.documentElement.appendChild(probe);
  const measured = Number.parseFloat(getComputedStyle(probe).paddingTop) || 0;
  document.documentElement.removeChild(probe);
  return measured;
}

/**
 * Viewport offset (px) for top-anchored UI below the notch / Dynamic Island.
 * `minInsetPx` is used when env(safe-area-inset-top) reads 0 on iOS PWA.
 */
export function useSafeAreaTopOffset(extraPx = 8, minInsetPx = 0): number {
  const [offsetPx, setOffsetPx] = useState(extraPx + minInsetPx);

  useLayoutEffect(() => {
    const safeTop = measureSafeAreaInsetTop();
    setOffsetPx(Math.max(safeTop, minInsetPx) + extraPx);
  }, [extraPx, minInsetPx]);

  return offsetPx;
}

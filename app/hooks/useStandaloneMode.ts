'use client';

import { useEffect, useState } from 'react';

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );
}

/** Detect installed PWA mode. iOS requires navigator.standalone; macOS uses display-mode. */
export function useStandaloneMode(): boolean {
  const [standalone, setStandalone] = useState(detectStandalone);

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');
    const update = () => setStandalone(detectStandalone());
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return standalone;
}

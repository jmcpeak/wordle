'use client';

import { useEffect } from 'react';

/**
 * Reload once a new service worker takes control. skipWaiting + clientsClaim
 * activate immediately; the reload picks up HTML that matches the new precache
 * (runtime page caches are dropped on activate). Rebuilds of the same git
 * commit keep a stable sw.js, so this should only fire on real deploys.
 */
export default function PwaUpdateReload() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let hadController = Boolean(navigator.serviceWorker.controller);

    const onControllerChange = () => {
      if (hadController) {
        window.location.reload();
      } else {
        hadController = true;
      }
    };

    navigator.serviceWorker.addEventListener(
      'controllerchange',
      onControllerChange,
    );
    return () => {
      navigator.serviceWorker.removeEventListener(
        'controllerchange',
        onControllerChange,
      );
    };
  }, []);

  return null;
}

'use client';

import { useEffect } from 'react';

/**
 * When the PWA has an updated service worker, we use skipWaiting + clientsClaim
 * in the worker. This component reloads the page when a new worker takes control
 * so the user gets the latest app version (e.g. after installing as iOS shortcut).
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

'use client';

import { useEffect } from 'react';

/**
 * Filtre les rejections Promise avec une valeur `undefined` générées
 * par Next.js 16 / Turbopack (transitions de navigation annulées, HMR).
 * Ces rejections sont internes au framework et n'impactent pas l'application.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason === undefined || event.reason === null) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return null;
}

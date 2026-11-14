'use client';

import { useEffect } from 'react';

/**
 * Registers the PWA service worker in production browsers to enable
 * offline app-shell caching while keeping Next.js dev HMR untouched.
 */
export const PWARegister: React.FC = () => {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      process.env.NODE_ENV !== 'production' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed:', err);
    });
  }, []);

  return null;
};

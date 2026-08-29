// Service Worker Registration and Cache Utility

export interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
}

export function registerServiceWorker(config?: ServiceWorkerConfig): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js';

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log('[SW] ServiceWorker registration successful with scope: ', registration.scope);

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content is available and will be used when all tabs for this page are closed.
                  console.log('[SW] New content is available; please refresh.');
                  if (config && config.onUpdate) {
                    config.onUpdate(registration);
                  }
                } else {
                  // Content is cached for offline use.
                  console.log('[SW] Content is cached for offline use.');
                  if (config && config.onSuccess) {
                    config.onSuccess(registration);
                  }
                }
              }
            };
          };
        })
        .catch((error) => {
          console.warn('[SW] Error during service worker registration:', error);
        });
    });
  }
}

export function unregisterServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}

// Check cache storage size and status
export async function getCacheStatus(): Promise<{
  isSupported: boolean;
  cacheCount: number;
  isCached: boolean;
}> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { isSupported: false, cacheCount: 0, isCached: false };
  }

  try {
    const cacheNames = await caches.keys();
    let totalKeys = 0;
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      totalKeys += keys.length;
    }
    return {
      isSupported: true,
      cacheCount: totalKeys,
      isCached: totalKeys > 0
    };
  } catch (e) {
    console.error('Error querying caches:', e);
    return { isSupported: true, cacheCount: 0, isCached: false };
  }
}

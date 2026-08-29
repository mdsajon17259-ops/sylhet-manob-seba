import { useState, useEffect } from 'react';
import { getCacheStatus } from '../utils/serviceWorkerRegistration';

export interface OfflineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  isCacheReady: boolean;
  cacheItemCount: number;
  dismissToast: () => void;
  showToast: boolean;
}

export function useOfflineStatus(): OfflineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isCacheReady, setIsCacheReady] = useState<boolean>(false);
  const [cacheItemCount, setCacheItemCount] = useState<number>(0);

  useEffect(() => {
    const updateCacheInfo = async () => {
      const status = await getCacheStatus();
      setIsCacheReady(status.isCached);
      setCacheItemCount(status.cacheCount);
    };

    updateCacheInfo();

    const handleOnline = () => {
      setIsOnline(true);
      setShowToast(true);
      updateCacheInfo();
      // Auto dismiss online notice after 4 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowToast(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check if opened offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setWasOffline(true);
      setShowToast(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const dismissToast = () => {
    setShowToast(false);
  };

  return {
    isOnline,
    wasOffline,
    isCacheReady,
    cacheItemCount,
    dismissToast,
    showToast
  };
}

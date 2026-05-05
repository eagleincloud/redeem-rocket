import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/components/ui/utils';

interface OfflineIndicatorProps {
  className?: string;
  showInOnlineMode?: boolean;
}

/**
 * Offline status indicator
 * Shows when device is offline with helpful messaging
 */
export function OfflineIndicator({
  className,
  showInOnlineMode = false,
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showNotification && (isOnline && !showInOnlineMode)) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 transition-all duration-300',
        isOnline
          ? 'bg-green-500/90 text-white'
          : 'bg-yellow-500/90 text-white',
        className
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Back online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 flex-shrink-0 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium">You are offline</p>
            <p className="text-xs opacity-90">
              Changes will sync when you're back online
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Floating offline badge (smaller version)
 */
export function OfflineBadge({ className }: { className?: string }) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400',
        className
      )}
    >
      <WifiOff className="w-3 h-3" />
      <span className="text-xs font-medium">Offline</span>
    </div>
  );
}

/**
 * Hook to check online status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export default OfflineIndicator;

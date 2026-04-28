/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 5
 * Performance Optimization Hook - Caching & Memoization
 *
 * Provides:
 * - Deal data caching with TTL
 * - Manager profile caching
 * - AI suggestion caching
 * - Automatic cache invalidation
 */

import { useCallback, useRef, useState, useEffect } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheStore {
  [key: string]: CacheEntry<any>;
}

const CACHE_TTL = {
  DEAL: 5 * 60 * 1000, // 5 minutes
  MANAGER: 10 * 60 * 1000, // 10 minutes
  AI_SUGGESTIONS: 30 * 60 * 1000, // 30 minutes
  CONFIDENCE: 30 * 60 * 1000, // 30 minutes
};

export const useManagerCache = () => {
  const cacheRef = useRef<CacheStore>({});
  const [, setRefresh] = useState(0);

  // Check if cache entry is valid
  const isCacheValid = useCallback((entry: CacheEntry<any>): boolean => {
    const now = Date.now();
    return now - entry.timestamp < entry.ttl;
  }, []);

  // Get cached data
  const get = useCallback(
    <T,>(key: string): T | null => {
      const entry = cacheRef.current[key];
      if (!entry) return null;

      if (!isCacheValid(entry)) {
        delete cacheRef.current[key];
        return null;
      }

      return entry.data as T;
    },
    [isCacheValid]
  );

  // Set cache data
  const set = useCallback(
    <T,>(key: string, data: T, ttl: number = CACHE_TTL.DEAL): void => {
      cacheRef.current[key] = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      setRefresh((prev) => prev + 1);
    },
    []
  );

  // Invalidate specific cache key
  const invalidate = useCallback((key: string): void => {
    delete cacheRef.current[key];
    setRefresh((prev) => prev + 1);
  }, []);

  // Invalidate all cache matching pattern
  const invalidatePattern = useCallback((pattern: RegExp): void => {
    Object.keys(cacheRef.current).forEach((key) => {
      if (pattern.test(key)) {
        delete cacheRef.current[key];
      }
    });
    setRefresh((prev) => prev + 1);
  }, []);

  // Clear all cache
  const clear = useCallback((): void => {
    cacheRef.current = {};
    setRefresh((prev) => prev + 1);
  }, []);

  // Get cache size
  const getSize = useCallback((): number => {
    return Object.keys(cacheRef.current).length;
  }, []);

  // Cleanup expired entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      Object.keys(cacheRef.current).forEach((key) => {
        const entry = cacheRef.current[key];
        if (now - entry.timestamp > entry.ttl) {
          delete cacheRef.current[key];
        }
      });
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, []);

  return {
    get,
    set,
    invalidate,
    invalidatePattern,
    clear,
    getSize,
    CACHE_TTL,
  };
};

/**
 * Memoization helper for expensive computations
 */
export const useMemoizedValue = <T,>(
  value: T,
  dependencies: React.DependencyList
): T => {
  const prevRef = useRef<T>(value);
  const depsRef = useRef<React.DependencyList>(dependencies);

  // Check if dependencies changed
  const depsChanged =
    !depsRef.current ||
    depsRef.current.length !== dependencies.length ||
    depsRef.current.some((dep, i) => dep !== dependencies[i]);

  if (depsChanged) {
    prevRef.current = value;
    depsRef.current = dependencies;
  }

  return prevRef.current;
};

/**
 * Debounced async function
 */
export const useDebouncedAsync = <T, U>(
  asyncFn: (arg: T) => Promise<U>,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<U | null>(null);

  const execute = useCallback(
    (arg: T) => {
      setLoading(true);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        asyncFn(arg)
          .then((res) => {
            setResult(res);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Debounced async error:', err);
            setLoading(false);
          });
      }, delay);
    },
    [asyncFn, delay]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => cancel();
  }, [cancel]);

  return { execute, loading, result, cancel };
};

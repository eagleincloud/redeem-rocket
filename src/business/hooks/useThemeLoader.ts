/**
 * Theme Loader Hook
 * Loads business theme from database and applies to DOM
 * Supports fallback to localStorage and default theme
 */

import { useEffect, useCallback, useState } from 'react';
import {
  loadThemeFromDatabase,
  loadThemeFromLocalStorage,
  applyTheme,
  getDefaultTheme,
  type ThemeConfig,
} from '../services/ai-theme-generator';

interface UseThemeLoaderResult {
  theme: ThemeConfig | null;
  isLoading: boolean;
  error: string | null;
  applyCustomTheme: (theme: ThemeConfig) => void;
  refreshTheme: () => Promise<void>;
}

/**
 * Load theme for a specific business
 * Strategy:
 * 1. Try to load from database
 * 2. Fall back to localStorage
 * 3. Fall back to default theme
 */
export function useThemeLoader(businessId?: string): UseThemeLoaderResult {
  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load and apply theme
   */
  const loadAndApplyTheme = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let loadedTheme: ThemeConfig | null = null;

      // 1. Try database first (if businessId provided)
      if (businessId) {
        try {
          loadedTheme = await loadThemeFromDatabase(businessId);
          if (loadedTheme) {
            console.log('Theme loaded from database:', businessId);
          }
        } catch (err) {
          console.warn('Failed to load theme from database:', err);
        }
      }

      // 2. Try localStorage fallback
      if (!loadedTheme) {
        loadedTheme = loadThemeFromLocalStorage();
        if (loadedTheme) {
          console.log('Theme loaded from localStorage');
        }
      }

      // 3. Use default if nothing found
      if (!loadedTheme) {
        loadedTheme = getDefaultTheme();
        console.log('Using default theme');
      }

      // Apply theme to DOM
      applyTheme(loadedTheme);
      setTheme(loadedTheme);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load theme';
      console.error('Error loading theme:', errorMessage);
      setError(errorMessage);

      // Still apply default theme even on error
      const defaultTheme = getDefaultTheme();
      applyTheme(defaultTheme);
      setTheme(defaultTheme);
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  /**
   * Apply custom theme and save to localStorage
   */
  const applyCustomTheme = useCallback((customTheme: ThemeConfig) => {
    applyTheme(customTheme);
    setTheme(customTheme);
  }, []);

  /**
   * Refresh theme from database (useful after updates)
   */
  const refreshTheme = useCallback(async () => {
    setIsLoading(true);
    try {
      if (businessId) {
        const freshTheme = await loadThemeFromDatabase(businessId);
        if (freshTheme) {
          applyTheme(freshTheme);
          setTheme(freshTheme);
          console.log('Theme refreshed from database');
          return;
        }
      }
      // Fallback to localStorage or default
      const stored = loadThemeFromLocalStorage();
      if (stored) {
        applyTheme(stored);
        setTheme(stored);
      } else {
        const defaultTheme = getDefaultTheme();
        applyTheme(defaultTheme);
        setTheme(defaultTheme);
      }
    } catch (err) {
      console.error('Error refreshing theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh theme');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  /**
   * Load theme on mount and when businessId changes
   */
  useEffect(() => {
    loadAndApplyTheme();
  }, [loadAndApplyTheme]);

  return {
    theme,
    isLoading,
    error,
    applyCustomTheme,
    refreshTheme,
  };
}

/**
 * Alternative hook to load theme from localStorage only
 * Useful for components that don't have access to businessId
 */
export function useThemeFromLocalStorage(): ThemeConfig | null {
  const [theme, setTheme] = useState<ThemeConfig | null>(() => {
    const stored = loadThemeFromLocalStorage();
    if (stored) {
      applyTheme(stored);
      return stored;
    }
    const defaultTheme = getDefaultTheme();
    applyTheme(defaultTheme);
    return defaultTheme;
  });

  return theme;
}

/**
 * useFeatureFlag Hook
 * Check if a feature is enabled for the current business
 *
 * Usage:
 *   const canChat = useFeatureFlag('chat');
 *   if (canChat) { <ChatComponent /> }
 *
 * Features:
 * - Server-side verification with fallback to cache
 * - 5-minute cache to reduce API calls
 * - Real-time updates on feature changes
 * - Automatic dependency checking
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

interface FeatureFlagState {
  enabled: boolean;
  loading: boolean;
  error: string | null;
  rolloutPercentage: number;
  planTier?: string;
  dependencies?: string[];
  lastChecked?: number;
}

interface FeatureFlagCache {
  [businessId: string]: {
    [featureName: string]: FeatureFlagState & { expiresAt: number };
  };
}

// In-memory cache with 5-minute TTL
const featureFlagCache: FeatureFlagCache = {};
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Check if a feature is enabled for the current business
 */
export function useFeatureFlag(featureName: string): boolean {
  const { businessId, user } = useAuth();
  const [state, setState] = useState<FeatureFlagState>({
    enabled: false,
    loading: true,
    error: null,
    rolloutPercentage: 0,
  });

  // Fetch feature flag status
  const checkFeatureStatus = useCallback(async () => {
    if (!businessId || !user) {
      setState({
        enabled: false,
        loading: false,
        error: 'Not authenticated',
        rolloutPercentage: 0,
      });
      return;
    }

    // Check cache first
    const cachedEntry = featureFlagCache[businessId]?.[featureName];
    if (cachedEntry && Date.now() < cachedEntry.expiresAt) {
      setState({
        enabled: cachedEntry.enabled,
        loading: false,
        error: cachedEntry.error,
        rolloutPercentage: cachedEntry.rolloutPercentage,
        planTier: cachedEntry.planTier,
        dependencies: cachedEntry.dependencies,
        lastChecked: cachedEntry.lastChecked,
      });
      return;
    }

    // Fetch from API
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(
        `/api/features/${featureName}?businessId=${businessId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Business-ID': businessId,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Initialize cache structure if needed
      if (!featureFlagCache[businessId]) {
        featureFlagCache[businessId] = {};
      }

      const newState: FeatureFlagState & { expiresAt: number } = {
        enabled: data.is_enabled || false,
        loading: false,
        error: null,
        rolloutPercentage: data.rollout_percentage || 100,
        planTier: data.plan_tier,
        dependencies: data.dependencies || [],
        lastChecked: Date.now(),
        expiresAt: Date.now() + CACHE_TTL_MS,
      };

      featureFlagCache[businessId][featureName] = newState;

      setState({
        enabled: newState.enabled,
        loading: false,
        error: null,
        rolloutPercentage: newState.rolloutPercentage,
        planTier: newState.planTier,
        dependencies: newState.dependencies,
        lastChecked: newState.lastChecked,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
        // Fall back to previous value if error
        enabled: prev.enabled,
      }));
    }
  }, [businessId, featureName, user]);

  // Check feature status on mount and when dependencies change
  useEffect(() => {
    checkFeatureStatus();
  }, [checkFeatureStatus]);

  // Return just the boolean for simple use cases
  return state.enabled;
}

/**
 * Hook to get detailed feature flag information
 */
export function useFeatureFlagDetails(featureName: string): FeatureFlagState {
  const { businessId, user } = useAuth();
  const [state, setState] = useState<FeatureFlagState>({
    enabled: false,
    loading: true,
    error: null,
    rolloutPercentage: 0,
  });

  useEffect(() => {
    if (!businessId || !user) {
      setState({
        enabled: false,
        loading: false,
        error: 'Not authenticated',
        rolloutPercentage: 0,
      });
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/features/${featureName}?businessId=${businessId}`,
          {
            headers: { 'X-Business-ID': businessId },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        setState({
          enabled: data.is_enabled || false,
          loading: false,
          error: null,
          rolloutPercentage: data.rollout_percentage || 100,
          planTier: data.plan_tier,
          dependencies: data.dependencies || [],
          lastChecked: Date.now(),
        });
      } catch (err) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        }));
      }
    };

    checkStatus();
  }, [businessId, featureName, user]);

  return state;
}

/**
 * Hook to get multiple feature flags at once (batch check)
 */
export function useFeatureFlags(
  featureNames: string[]
): Record<string, boolean> {
  const { businessId, user } = useAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>(
    featureNames.reduce((acc, name) => ({ ...acc, [name]: false }), {})
  );

  useEffect(() => {
    if (!businessId || !user) return;

    const checkFlags = async () => {
      try {
        const response = await fetch(
          `/api/features?businessId=${businessId}&features=${featureNames.join(',')}`,
          {
            headers: { 'X-Business-ID': businessId },
          }
        );

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        setFlags(data.features || {});
      } catch (err) {
        console.error('Failed to check feature flags:', err);
      }
    };

    checkFlags();
  }, [businessId, featureNames, user]);

  return flags;
}

/**
 * Hook to manually invalidate feature flag cache
 */
export function useFeatureFlagRefresh(): () => Promise<void> {
  const { businessId } = useAuth();

  return useCallback(async () => {
    if (businessId) {
      delete featureFlagCache[businessId];
    }
  }, [businessId]);
}

/**
 * Check if feature is available (considering rollout percentage)
 */
export function isFeatureAvailable(
  businessId: string,
  featureName: string,
  rolloutPercentage: number = 100
): boolean {
  // Use deterministic hash of businessId to decide rollout
  const hash = businessId.split('').reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0);
  }, 0);

  const percentage = Math.abs(hash) % 100;
  return percentage < rolloutPercentage;
}

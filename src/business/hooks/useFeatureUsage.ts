/**
 * useFeatureUsage Hook
 * Manage feature enabling/disabling and usage tracking
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeatureUsage } from '@/business/types/marketplace';
import {
  enableFeatureForBusiness,
  disableFeatureForBusiness,
  trackFeatureUsage,
} from '@/business/services/marketplace/feature-catalog';

interface UseFeatureUsageState {
  usage: FeatureUsage | null;
  isLoading: boolean;
  error: string | null;
  isSaving: boolean;
}

export function useFeatureUsage(featureId: string, businessId: string, initialUsage?: FeatureUsage) {
  const [state, setState] = useState<UseFeatureUsageState>({
    usage: initialUsage || null,
    isLoading: !initialUsage,
    error: null,
    isSaving: false,
  });

  /**
   * Enable feature
   */
  const enable = useCallback(
    async (config: Record<string, unknown> = {}) => {
      setState((prev) => ({ ...prev, isSaving: true, error: null }));

      try {
        const usage = await enableFeatureForBusiness(featureId, businessId, config);
        setState((prev) => ({
          ...prev,
          usage,
          isSaving: false,
        }));
        return usage;
      } catch (err) {
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Failed to enable feature',
          isSaving: false,
        }));
        throw err;
      }
    },
    [featureId, businessId],
  );

  /**
   * Disable feature
   */
  const disable = useCallback(async () => {
    setState((prev) => ({ ...prev, isSaving: true, error: null }));

    try {
      const usage = await disableFeatureForBusiness(featureId, businessId);
      setState((prev) => ({
        ...prev,
        usage,
        isSaving: false,
      }));
      return usage;
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Failed to disable feature',
        isSaving: false,
      }));
      throw err;
    }
  }, [featureId, businessId]);

  /**
   * Track usage
   */
  const track = useCallback(async () => {
    try {
      await trackFeatureUsage(featureId, businessId);

      // Update local state
      setState((prev) => {
        if (!prev.usage) return prev;
        return {
          ...prev,
          usage: {
            ...prev.usage,
            usage_count: prev.usage.usage_count + 1,
            last_used_at: new Date().toISOString(),
          },
        };
      });
    } catch (err) {
      // Don't throw - usage tracking should not break feature functionality
      console.warn('Failed to track usage:', err);
    }
  }, [featureId, businessId]);

  /**
   * Derived state
   */
  const isEnabled = useMemo(() => state.usage?.is_enabled || false, [state.usage]);

  const usageStats = useMemo(
    () => ({
      count: state.usage?.usage_count || 0,
      lastUsed: state.usage?.last_used_at ? new Date(state.usage.last_used_at) : null,
      daysSinceLastUse: state.usage?.last_used_at
        ? Math.floor(
            (Date.now() - new Date(state.usage.last_used_at).getTime()) / (1000 * 60 * 60 * 24),
          )
        : null,
    }),
    [state.usage],
  );

  return useMemo(
    () => ({
      ...state,
      isEnabled,
      usageStats,
      enable,
      disable,
      track,
      toggle: async () => {
        if (isEnabled) {
          await disable();
        } else {
          await enable();
        }
      },
    }),
    [state, isEnabled, usageStats, enable, disable, track],
  );
}

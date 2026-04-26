/**
 * useFeaturePreferences Hook
 * Manage selected features for a business owner
 * Loads from database and updates in real-time
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

export interface FeaturePreferences {
  [key: string]: boolean;
}

export function useFeaturePreferences(businessId?: string | null) {
  const [preferences, setPreferences] = useState<FeaturePreferences>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load preferences from database
  useEffect(() => {
    if (!businessId || !supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('biz_users')
          .select('feature_preferences')
          .eq('id', businessId)
          .single();

        if (fetchError) throw fetchError;

        if (data?.feature_preferences) {
          setPreferences(data.feature_preferences);
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load feature preferences:', err);
        setError(err instanceof Error ? err.message : 'Failed to load preferences');
        // Set defaults if load fails
        setPreferences(getDefaultPreferences());
      } finally {
        setLoading(false);
      }
    })();
  }, [businessId]);

  // Update feature preference
  const toggleFeature = useCallback(
    async (featureKey: string, enabled: boolean) => {
      if (!businessId || !supabase) return;

      try {
        // Update local state optimistically
        const updated = { ...preferences, [featureKey]: enabled };
        setPreferences(updated);

        // Save to database
        const { error: updateError } = await supabase
          .from('biz_users')
          .update({ feature_preferences: updated })
          .eq('id', businessId);

        if (updateError) throw updateError;
      } catch (err) {
        console.error('Failed to update feature preference:', err);
        setError(err instanceof Error ? err.message : 'Failed to save');
        // Revert optimistic update on error
        setPreferences(prev => {
          const reverted = { ...prev };
          delete reverted[featureKey];
          return reverted;
        });
      }
    },
    [businessId, preferences]
  );

  // Get enabled features
  const getEnabledFeatures = useCallback(() => {
    return Object.entries(preferences)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }, [preferences]);

  return {
    preferences,
    loading,
    error,
    toggleFeature,
    getEnabledFeatures,
  };
}

/**
 * Default feature preferences based on business type
 */
export function getDefaultPreferences(businessType?: string): FeaturePreferences {
  const defaults: Record<string, FeaturePreferences> = {
    restaurant: {
      products: true,
      orders: true,
      offers: true,
      campaigns: true,
      automation: true,
    },
    ecommerce: {
      products: true,
      orders: true,
      offers: true,
      inventory: true,
      campaigns: true,
      automation: true,
    },
    saas: {
      leads: true,
      campaigns: true,
      automation: true,
    },
    service: {
      orders: true,
      leads: true,
      campaigns: true,
    },
    creative: {
      products: true,
      campaigns: true,
      social: true,
    },
    default: {
      products: true,
      orders: true,
      offers: true,
    },
  };

  return defaults[businessType?.toLowerCase() || 'default'] || defaults.default;
}

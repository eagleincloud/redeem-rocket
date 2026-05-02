/**
 * Hook: useFeaturePermissions
 * Manage feature-level permissions for team members
 */

import { useState, useCallback, useEffect } from 'react';
import type { Feature } from '@/business/types/team-management';
import { supabase } from '@/app/lib/supabase';

interface UseFeaturePermissionsResult {
  memberFeatures: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  toggleFeature: (feature: Feature, enabled: boolean) => Promise<boolean>;
  setFeatures: (features: Record<Feature, boolean>) => Promise<boolean>;
  isFeatureEnabled: (feature: Feature) => boolean;
}

export function useFeaturePermissions(
  businessId?: string,
  memberId?: string
): UseFeaturePermissionsResult {
  const [memberFeatures, setMemberFeatures] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load feature permissions
  useEffect(() => {
    if (!businessId || !memberId || !supabase) {
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('member_feature_permissions')
          .select('features')
          .eq('business_id', businessId)
          .eq('member_id', memberId)
          .single();

        if (err && err.code !== 'PGRST116') {
          // PGRST116 = no rows found, which is fine for new members
          throw err;
        }

        const features = data?.features || {};
        setMemberFeatures(features);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load feature permissions';
        setError(msg);
        console.error('[useFeaturePermissions] Error loading permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [businessId, memberId]);

  const toggleFeature = useCallback(async (feature: Feature, enabled: boolean) => {
    if (!businessId || !memberId || !supabase) {
      setError('Required parameters not available');
      return false;
    }

    try {
      const updated = { ...memberFeatures, [feature]: enabled };

      const { error: err } = await supabase
        .from('member_feature_permissions')
        .upsert({
          business_id: businessId,
          member_id: memberId,
          features: updated,
        });

      if (err) throw err;

      setMemberFeatures(updated);
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle feature';
      setError(msg);
      console.error('[useFeaturePermissions] Error toggling feature:', err);
      return false;
    }
  }, [businessId, memberId, memberFeatures]);

  const setFeatures = useCallback(async (features: Record<Feature, boolean>) => {
    if (!businessId || !memberId || !supabase) {
      setError('Required parameters not available');
      return false;
    }

    try {
      const { error: err } = await supabase
        .from('member_feature_permissions')
        .upsert({
          business_id: businessId,
          member_id: memberId,
          features,
        });

      if (err) throw err;

      setMemberFeatures(features);
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update features';
      setError(msg);
      console.error('[useFeaturePermissions] Error updating features:', err);
      return false;
    }
  }, [businessId, memberId]);

  const isFeatureEnabled = useCallback((feature: Feature) => {
    // Default to true if not explicitly disabled
    return memberFeatures[feature] !== false;
  }, [memberFeatures]);

  return {
    memberFeatures,
    loading,
    error,
    toggleFeature,
    setFeatures,
    isFeatureEnabled,
  };
}

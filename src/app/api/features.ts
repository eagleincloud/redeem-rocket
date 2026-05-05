/**
 * Feature Flag API Endpoints
 * Handles feature availability checks and admin management
 *
 * Endpoints:
 * - GET /api/features - List all features
 * - GET /api/features/:feature_name - Check single feature status
 * - POST /api/admin/features/:feature_name/enable - Admin only
 * - POST /api/admin/features/:feature_name/disable - Admin only
 * - GET /api/admin/features/usage - Feature adoption analytics
 * - POST /api/admin/features/:feature_name/rollout - Update rollout percentage
 */

import { createRouteHandler } from '@/lib/api-utils';
import { supabase } from '@/app/lib/supabase';
import type { FeatureFlagResponse, FeatureAnalytics } from '@/types/features';

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/features - List all features
// ═══════════════════════════════════════════════════════════════════════════

export const getFeatures = createRouteHandler(async (req) => {
  const businessId = req.headers.get('x-business-id') || req.query?.businessId;
  const features = req.query?.features?.split(',') || [];

  if (!businessId) {
    return { status: 400, data: { error: 'Missing businessId' } };
  }

  try {
    // Get all feature definitions
    const { data: definitions, error: defError } = await supabase
      .from('feature_definitions')
      .select('*')
      .eq('is_public', true)
      .eq('status', 'active');

    if (defError) throw defError;

    // Get business-specific overrides
    const { data: businessFeatures, error: bfError } = await supabase
      .from('business_features')
      .select('*')
      .eq('business_id', businessId);

    if (bfError) throw bfError;

    // Build response
    const featureMap: Record<string, FeatureFlagResponse> = {};

    for (const def of definitions || []) {
      const override = businessFeatures?.find(
        (bf) => bf.feature_name === def.feature_name
      );

      featureMap[def.feature_name] = {
        feature_name: def.feature_name,
        description: def.description,
        category: def.category,
        is_enabled: override?.is_enabled ?? def.min_plan_tier === 'starter',
        rollout_percentage: override?.rollout_percentage ?? 100,
        plan_tier: override?.plan_tier,
        dependencies: def.dependencies || [],
        min_plan_tier: def.min_plan_tier,
      };
    }

    // Filter to requested features if specified
    const response =
      features.length > 0
        ? Object.fromEntries(
            Object.entries(featureMap).filter(([name]) =>
              features.includes(name)
            )
          )
        : featureMap;

    return { status: 200, data: { features: response } };
  } catch (error) {
    console.error('Error fetching features:', error);
    return {
      status: 500,
      data: { error: 'Failed to fetch features' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/features/:feature_name - Check single feature status
// ═══════════════════════════════════════════════════════════════════════════

export const getFeatureStatus = createRouteHandler(async (req) => {
  const { feature_name } = req.params || {};
  const businessId = req.headers.get('x-business-id') || req.query?.businessId;

  if (!feature_name || !businessId) {
    return { status: 400, data: { error: 'Missing feature_name or businessId' } };
  }

  try {
    // Get feature definition
    const { data: definition, error: defError } = await supabase
      .from('feature_definitions')
      .select('*')
      .eq('feature_name', feature_name)
      .single();

    if (defError) {
      return { status: 404, data: { error: 'Feature not found' } };
    }

    // Get business-specific override
    const { data: override, error: overrideError } = await supabase
      .from('business_features')
      .select('*')
      .eq('business_id', businessId)
      .eq('feature_name', feature_name)
      .single();

    // Determine if feature is enabled
    const isEnabled = override?.is_enabled ?? definition?.min_plan_tier === 'starter';
    const rolloutPercentage = override?.rollout_percentage ?? 100;

    // Check if business qualifies based on rollout
    const qualifiesForRollout =
      rolloutPercentage >= 100 || isFeatureEligible(businessId, feature_name, rolloutPercentage);

    return {
      status: 200,
      data: {
        feature_name,
        description: definition?.description,
        category: definition?.category,
        is_enabled: isEnabled && qualifiesForRollout,
        rollout_percentage: rolloutPercentage,
        plan_tier: override?.plan_tier,
        dependencies: definition?.dependencies || [],
        min_plan_tier: definition?.min_plan_tier,
      } as FeatureFlagResponse,
    };
  } catch (error) {
    console.error('Error checking feature status:', error);
    return {
      status: 500,
      data: { error: 'Failed to check feature status' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/features/:feature_name/enable - Enable feature
// ═══════════════════════════════════════════════════════════════════════════

export const enableFeature = createRouteHandler(async (req) => {
  if (req.method !== 'POST') {
    return { status: 405, data: { error: 'Method not allowed' } };
  }

  const { feature_name } = req.params || {};
  const businessId = req.body?.businessId || req.headers.get('x-business-id');
  const userId = req.body?.userId;
  const reason = req.body?.reason;

  if (!feature_name || !businessId) {
    return { status: 400, data: { error: 'Missing feature_name or businessId' } };
  }

  try {
    // Check if user is admin
    const isAdmin = await checkAdminStatus(businessId, userId);
    if (!isAdmin) {
      return { status: 403, data: { error: 'Unauthorized' } };
    }

    // Get current state for audit log
    const { data: current } = await supabase
      .from('business_features')
      .select('*')
      .eq('business_id', businessId)
      .eq('feature_name', feature_name)
      .single();

    // Update or insert feature flag
    const { data, error } = await supabase
      .from('business_features')
      .upsert(
        {
          business_id: businessId,
          feature_name,
          is_enabled: true,
          enabled_by: userId,
          enabled_at: new Date().toISOString(),
          reason,
        },
        { onConflict: 'business_id,feature_name' }
      )
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('feature_audit_log').insert({
      business_id: businessId,
      feature_name,
      action: 'enabled',
      old_values: current,
      new_values: data?.[0],
      performed_by: userId,
      reason,
    });

    return { status: 200, data: { success: true, feature: data?.[0] } };
  } catch (error) {
    console.error('Error enabling feature:', error);
    return {
      status: 500,
      data: { error: 'Failed to enable feature' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/features/:feature_name/disable - Disable feature
// ═══════════════════════════════════════════════════════════════════════════

export const disableFeature = createRouteHandler(async (req) => {
  if (req.method !== 'POST') {
    return { status: 405, data: { error: 'Method not allowed' } };
  }

  const { feature_name } = req.params || {};
  const businessId = req.body?.businessId || req.headers.get('x-business-id');
  const userId = req.body?.userId;
  const reason = req.body?.reason;

  if (!feature_name || !businessId) {
    return { status: 400, data: { error: 'Missing feature_name or businessId' } };
  }

  try {
    // Check admin status
    const isAdmin = await checkAdminStatus(businessId, userId);
    if (!isAdmin) {
      return { status: 403, data: { error: 'Unauthorized' } };
    }

    // Get current state
    const { data: current } = await supabase
      .from('business_features')
      .select('*')
      .eq('business_id', businessId)
      .eq('feature_name', feature_name)
      .single();

    // Update feature flag
    const { data, error } = await supabase
      .from('business_features')
      .update({
        is_enabled: false,
        reason,
      })
      .eq('business_id', businessId)
      .eq('feature_name', feature_name)
      .select();

    if (error) throw error;

    // Log audit
    await supabase.from('feature_audit_log').insert({
      business_id: businessId,
      feature_name,
      action: 'disabled',
      old_values: current,
      new_values: data?.[0],
      performed_by: userId,
      reason,
    });

    return { status: 200, data: { success: true, feature: data?.[0] } };
  } catch (error) {
    console.error('Error disabling feature:', error);
    return {
      status: 500,
      data: { error: 'Failed to disable feature' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/features/:feature_name/rollout - Update rollout percentage
// ═══════════════════════════════════════════════════════════════════════════

export const updateRollout = createRouteHandler(async (req) => {
  if (req.method !== 'POST') {
    return { status: 405, data: { error: 'Method not allowed' } };
  }

  const { feature_name } = req.params || {};
  const businessId = req.body?.businessId;
  const userId = req.body?.userId;
  const rolloutPercentage = req.body?.rolloutPercentage;
  const scheduledFor = req.body?.scheduledFor;

  if (!feature_name || rolloutPercentage === undefined) {
    return { status: 400, data: { error: 'Missing required fields' } };
  }

  if (rolloutPercentage < 0 || rolloutPercentage > 100) {
    return {
      status: 400,
      data: { error: 'Rollout percentage must be between 0 and 100' },
    };
  }

  try {
    // Check admin status
    const isAdmin = await checkAdminStatus(businessId, userId);
    if (!isAdmin) {
      return { status: 403, data: { error: 'Unauthorized' } };
    }

    // Update business feature rollout
    const { data, error } = await supabase
      .from('business_features')
      .update({ rollout_percentage: rolloutPercentage })
      .eq('business_id', businessId)
      .eq('feature_name', feature_name)
      .select();

    if (error) throw error;

    // Create rollout record if scheduled
    if (scheduledFor) {
      await supabase.from('feature_rollout').insert({
        business_id: businessId,
        feature_name,
        target_percentage: rolloutPercentage,
        scheduled_for: scheduledFor,
        status: 'pending',
        created_by: userId,
      });
    }

    return { status: 200, data: { success: true, feature: data?.[0] } };
  } catch (error) {
    console.error('Error updating rollout:', error);
    return {
      status: 500,
      data: { error: 'Failed to update rollout' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/features/usage - Feature adoption analytics
// ═══════════════════════════════════════════════════════════════════════════

export const getFeatureAnalytics = createRouteHandler(async (req) => {
  const businessId = req.headers.get('x-business-id') || req.query?.businessId;
  const userId = req.query?.userId;

  if (!businessId || !userId) {
    return { status: 400, data: { error: 'Missing businessId or userId' } };
  }

  try {
    // Check admin status
    const isAdmin = await checkAdminStatus(businessId, userId);
    if (!isAdmin) {
      return { status: 403, data: { error: 'Unauthorized' } };
    }

    // Get analytics for the past 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: analytics, error } = await supabase
      .from('feature_analytics')
      .select('*')
      .eq('business_id', businessId)
      .gte('period_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('period_date', { ascending: false });

    if (error) throw error;

    // Aggregate analytics by feature
    const byFeature = (analytics || []).reduce(
      (acc, record) => {
        if (!acc[record.feature_name]) {
          acc[record.feature_name] = {
            feature_name: record.feature_name,
            total_usage: 0,
            total_users: 0,
            avg_activation_rate: 0,
            total_events: analytics.filter(
              (a) => a.feature_name === record.feature_name
            ).length,
          };
        }
        acc[record.feature_name].total_usage += record.usage_count || 0;
        acc[record.feature_name].total_users = Math.max(
          acc[record.feature_name].total_users,
          record.unique_users || 0
        );
        return acc;
      },
      {} as Record<string, FeatureAnalytics>
    );

    return {
      status: 200,
      data: {
        period: 'last_30_days',
        analytics: Object.values(byFeature),
      },
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      status: 500,
      data: { error: 'Failed to fetch analytics' },
    };
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Deterministically check if a business qualifies for feature rollout
 */
function isFeatureEligible(
  businessId: string,
  featureName: string,
  rolloutPercentage: number
): boolean {
  // Combine business ID and feature name for hash
  const combined = `${businessId}:${featureName}`;

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Map hash to 0-100 range
  const percentage = Math.abs(hash) % 100;
  return percentage < rolloutPercentage;
}

/**
 * Check if user is admin for business
 */
async function checkAdminStatus(
  businessId: string,
  userId?: string
): Promise<boolean> {
  if (!userId) return false;

  try {
    const { data, error } = await supabase
      .from('business_team_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .single();

    if (error) return false;

    return (
      data?.role === 'admin' ||
      data?.role === 'owner' ||
      data?.role === 'super_admin'
    );
  } catch {
    return false;
  }
}

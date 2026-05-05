/**
 * Feature Flag Utilities & Helpers
 * Convenience functions for working with feature flags
 */

import { supabase } from '@/app/lib/supabase';
import type {
  Feature,
  BusinessFeature,
  FeatureRollout,
  FeatureAuditLog,
} from '@/types/features';

// ═══════════════════════════════════════════════════════════════════════════
// Feature Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all features with their definitions and business status
 */
export async function getAllFeaturesWithStatus(
  businessId: string
): Promise<(Feature & { is_enabled: boolean; rollout_percentage: number })[]> {
  const { data: definitions } = await supabase
    .from('feature_definitions')
    .select('*');

  const { data: businessFeatures } = await supabase
    .from('business_features')
    .select('*')
    .eq('business_id', businessId);

  return (definitions || []).map((def) => {
    const override = businessFeatures?.find(
      (bf) => bf.feature_name === def.feature_name
    );

    return {
      ...def,
      is_enabled: override?.is_enabled ?? false,
      rollout_percentage: override?.rollout_percentage ?? 100,
    };
  });
}

/**
 * Enable multiple features at once
 */
export async function enableFeatures(
  businessId: string,
  featureNames: string[],
  userId?: string,
  reason?: string
): Promise<BusinessFeature[]> {
  const records = featureNames.map((featureName) => ({
    business_id: businessId,
    feature_name: featureName,
    is_enabled: true,
    enabled_by: userId,
    enabled_at: new Date().toISOString(),
    reason,
  }));

  const { data, error } = await supabase
    .from('business_features')
    .upsert(records, { onConflict: 'business_id,feature_name' })
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Disable multiple features at once
 */
export async function disableFeatures(
  businessId: string,
  featureNames: string[],
  userId?: string,
  reason?: string
): Promise<BusinessFeature[]> {
  const { data, error } = await supabase
    .from('business_features')
    .update({ is_enabled: false, reason })
    .eq('business_id', businessId)
    .in('feature_name', featureNames)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Enable features based on plan tier
 */
export async function enableFeaturesForPlan(
  businessId: string,
  planTier: 'starter' | 'professional' | 'enterprise'
): Promise<void> {
  const { data: features } = await supabase
    .from('feature_definitions')
    .select('feature_name')
    .lte('min_plan_tier', planTier); // This assumes alphabetical ordering: starter < professional < enterprise

  if (!features) return;

  const featureNames = features.map((f) => f.feature_name);

  await enableFeatures(businessId, featureNames, undefined, `Enabled for ${planTier} plan`);
}

// ═══════════════════════════════════════════════════════════════════════════
// Dependency Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if all dependencies are met for a feature
 */
export async function checkDependencies(
  businessId: string,
  featureName: string
): Promise<{ met: boolean; missing: string[] }> {
  // Get feature definition
  const { data: feature } = await supabase
    .from('feature_definitions')
    .select('dependencies')
    .eq('feature_name', featureName)
    .single();

  if (!feature?.dependencies || feature.dependencies.length === 0) {
    return { met: true, missing: [] };
  }

  // Check each dependency
  const missing: string[] = [];

  for (const dependency of feature.dependencies) {
    const { data: enabled } = await supabase
      .from('business_features')
      .select('is_enabled')
      .eq('business_id', businessId)
      .eq('feature_name', dependency)
      .single();

    if (!enabled?.is_enabled) {
      missing.push(dependency);
    }
  }

  return { met: missing.length === 0, missing };
}

/**
 * Auto-enable dependencies when enabling a feature
 */
export async function enableWithDependencies(
  businessId: string,
  featureName: string,
  userId?: string
): Promise<string[]> {
  const { met, missing } = await checkDependencies(businessId, featureName);

  const enabled: string[] = [];

  // Enable missing dependencies
  for (const dependency of missing) {
    await supabase.from('business_features').upsert(
      {
        business_id: businessId,
        feature_name: dependency,
        is_enabled: true,
        enabled_by: userId,
        enabled_at: new Date().toISOString(),
        reason: `Auto-enabled as dependency of ${featureName}`,
      },
      { onConflict: 'business_id,feature_name' }
    );
    enabled.push(dependency);
  }

  // Enable the feature itself
  await supabase.from('business_features').upsert(
    {
      business_id: businessId,
      feature_name: featureName,
      is_enabled: true,
      enabled_by: userId,
      enabled_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,feature_name' }
  );
  enabled.push(featureName);

  return enabled;
}

// ═══════════════════════════════════════════════════════════════════════════
// Rollout Management
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Schedule a gradual rollout
 */
export async function scheduleRollout(
  businessId: string,
  featureName: string,
  phases: { percentage: number; scheduledFor: Date }[],
  userId?: string
): Promise<FeatureRollout[]> {
  const records = phases.map((phase, index) => ({
    business_id: businessId,
    feature_name: featureName,
    target_percentage: phase.percentage,
    current_percentage: index === 0 ? phase.percentage : 0,
    scheduled_for: phase.scheduledFor.toISOString(),
    status: 'pending' as const,
    created_by: userId,
  }));

  const { data, error } = await supabase
    .from('feature_rollout')
    .insert(records)
    .select();

  if (error) throw error;
  return data || [];
}

/**
 * Get active rollouts
 */
export async function getActiveRollouts(
  businessId?: string
): Promise<FeatureRollout[]> {
  let query = supabase
    .from('feature_rollout')
    .select('*')
    .in('status', ['pending', 'in_progress']);

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Update rollout status (for cron jobs)
 */
export async function processScheduledRollouts(): Promise<number> {
  const now = new Date();

  // Get all pending rollouts that are due
  const { data: rollouts, error: fetchError } = await supabase
    .from('feature_rollout')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString());

  if (fetchError) throw fetchError;

  let processed = 0;

  for (const rollout of rollouts || []) {
    // Update business feature rollout percentage
    await supabase
      .from('business_features')
      .update({
        rollout_percentage: rollout.target_percentage,
      })
      .eq('business_id', rollout.business_id)
      .eq('feature_name', rollout.feature_name);

    // Update rollout status
    await supabase
      .from('feature_rollout')
      .update({
        status: 'in_progress',
        current_percentage: rollout.target_percentage,
      })
      .eq('id', rollout.id);

    processed++;
  }

  return processed;
}

// ═══════════════════════════════════════════════════════════════════════════
// Analytics & Reporting
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get feature adoption metrics
 */
export async function getAdoptionMetrics(businessId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('feature_analytics')
    .select('*')
    .eq('business_id', businessId)
    .gte('period_date', thirtyDaysAgo.toISOString().split('T')[0])
    .order('period_date', { ascending: false });

  if (error) throw error;

  // Group by feature
  const byFeature: Record<string, any> = {};

  (data || []).forEach((record) => {
    if (!byFeature[record.feature_name]) {
      byFeature[record.feature_name] = {
        feature_name: record.feature_name,
        total_usage: 0,
        total_users: 0,
        days_active: 0,
        avg_retention: 0,
      };
    }

    const feature = byFeature[record.feature_name];
    feature.total_usage += record.usage_count || 0;
    feature.total_users = Math.max(feature.total_users, record.unique_users || 0);
    feature.days_active += 1;
    feature.avg_retention =
      (feature.avg_retention * (feature.days_active - 1) +
        (record.feature_retention_rate || 0)) /
      feature.days_active;
  });

  return byFeature;
}

/**
 * Get audit trail for a feature
 */
export async function getAuditTrail(
  businessId: string,
  featureName?: string,
  limit = 50
): Promise<FeatureAuditLog[]> {
  let query = supabase
    .from('feature_audit_log')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (featureName) {
    query = query.eq('feature_name', featureName);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Export analytics as CSV
 */
export async function exportAnalyticsAsCSV(
  businessId: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  const { data, error } = await supabase
    .from('feature_analytics')
    .select('*')
    .eq('business_id', businessId)
    .gte('period_date', startDate.toISOString().split('T')[0])
    .lte('period_date', endDate.toISOString().split('T')[0])
    .order('period_date');

  if (error) throw error;

  // Convert to CSV
  const headers = [
    'Feature Name',
    'Date',
    'Usage Count',
    'Unique Users',
    'Activation Rate',
    'Daily Active Users',
    'Retention Rate',
    'Revenue Impact',
    'Error Rate',
  ];

  const rows = (data || []).map((record) => [
    record.feature_name,
    record.period_date,
    record.usage_count,
    record.unique_users,
    record.activation_rate,
    record.daily_active_users,
    record.feature_retention_rate,
    record.associated_revenue,
    record.error_rate,
  ]);

  const csv =
    [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell || ''}"`).join(','))
      .join('\n') + '\n';

  return csv;
}

// ═══════════════════════════════════════════════════════════════════════════
// Testing & Debugging
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test if a business would be included in rollout percentage
 */
export function testRolloutEligibility(
  businessId: string,
  featureName: string,
  rolloutPercentage: number
): boolean {
  const combined = `${businessId}:${featureName}`;
  let hash = 0;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  const percentage = Math.abs(hash) % 100;
  return percentage < rolloutPercentage;
}

/**
 * Debug feature state for a business
 */
export async function debugBusinessFeatures(
  businessId: string
): Promise<{
  features: any[];
  rollouts: any[];
  audit: any[];
}> {
  const [features, rollouts, audit] = await Promise.all([
    supabase
      .from('business_features')
      .select('*')
      .eq('business_id', businessId),
    supabase
      .from('feature_rollout')
      .select('*')
      .eq('business_id', businessId),
    supabase
      .from('feature_audit_log')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    features: features.data || [],
    rollouts: rollouts.data || [],
    audit: audit.data || [],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Bulk Operations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Enable feature for all businesses with a specific plan
 */
export async function enableFeatureForPlanTier(
  featureName: string,
  planTier: 'starter' | 'professional' | 'enterprise'
): Promise<number> {
  // Get all businesses with this plan
  const { data: businesses, error: fetchError } = await supabase
    .from('businesses')
    .select('id')
    .eq('plan_tier', planTier);

  if (fetchError) throw fetchError;

  let updated = 0;

  // Enable feature for each business
  for (const business of businesses || []) {
    await supabase
      .from('business_features')
      .upsert(
        {
          business_id: business.id,
          feature_name: featureName,
          is_enabled: true,
          reason: `Auto-enabled for ${planTier} plan`,
        },
        { onConflict: 'business_id,feature_name' }
      );
    updated++;
  }

  return updated;
}

/**
 * Rollback feature for all businesses
 */
export async function rollbackFeature(
  featureName: string,
  reason: string
): Promise<number> {
  const { data: rollouts, error: fetchError } = await supabase
    .from('feature_rollout')
    .select('business_id')
    .eq('feature_name', featureName)
    .in('status', ['in_progress', 'pending']);

  if (fetchError) throw fetchError;

  let updated = 0;

  for (const rollout of rollouts || []) {
    // Disable feature
    await supabase
      .from('business_features')
      .update({ is_enabled: false, reason })
      .eq('business_id', rollout.business_id)
      .eq('feature_name', featureName);

    // Update rollout status
    await supabase
      .from('feature_rollout')
      .update({ status: 'rolled_back', reason })
      .eq('business_id', rollout.business_id)
      .eq('feature_name', featureName);

    updated++;
  }

  return updated;
}

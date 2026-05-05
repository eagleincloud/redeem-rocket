/**
 * Feature Flags Admin Dashboard
 * Manage feature flags, rollouts, and analytics
 */

import React, { useEffect, useMemo, useState } from 'react';
import type { Feature, FeatureAnalytics } from '@/types/features';
import { supabase } from '@/app/lib/supabase';

interface FeatureRow extends Feature {
  usage_count?: number;
  activation_rate?: number;
  enabled_count?: number;
}

export const FeatureFlagsAdmin: React.FC<{ businessId: string }> = ({
  businessId,
}) => {
  const [features, setFeatures] = useState<FeatureRow[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, FeatureAnalytics>>({});
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [rolloutPercentages, setRolloutPercentages] = useState<
    Record<string, number>
  >({});

  // Fetch features and analytics
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch feature definitions
        const { data: definitions } = await supabase
          .from('feature_definitions')
          .select('*')
          .order('feature_name');

        // Fetch business feature status
        const { data: businessFeatures } = await supabase
          .from('business_features')
          .select('*')
          .eq('business_id', businessId);

        // Fetch analytics
        const { data: analyticsData } = await supabase
          .from('feature_analytics')
          .select('*')
          .eq('business_id', businessId)
          .order('period_date', { ascending: false })
          .limit(30);

        // Combine data
        const combined: FeatureRow[] = (definitions || []).map((def) => {
          const override = businessFeatures?.find(
            (bf) => bf.feature_name === def.feature_name
          );

          const featureAnalytics = analyticsData?.find(
            (a) => a.feature_name === def.feature_name
          );

          return {
            ...def,
            is_enabled: override?.is_enabled ?? false,
            rollout_percentage: override?.rollout_percentage ?? 100,
            usage_count: featureAnalytics?.usage_count || 0,
            activation_rate: featureAnalytics?.activation_rate || 0,
          };
        });

        setFeatures(combined);

        // Build analytics map
        const analyticsMap: Record<string, FeatureAnalytics> = {};
        analyticsData?.forEach((record) => {
          if (!analyticsMap[record.feature_name]) {
            analyticsMap[record.feature_name] = record;
          }
        });
        setAnalytics(analyticsMap);

        // Initialize rollout percentages
        const percentages: Record<string, number> = {};
        businessFeatures?.forEach((bf) => {
          percentages[bf.feature_name] = bf.rollout_percentage ?? 100;
        });
        setRolloutPercentages(percentages);
      } catch (error) {
        console.error('Error loading feature data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [businessId]);

  // Handle feature enable/disable
  const handleToggleFeature = async (
    featureName: string,
    shouldEnable: boolean
  ) => {
    try {
      const endpoint = shouldEnable
        ? `/api/admin/features/${featureName}/enable`
        : `/api/admin/features/${featureName}/disable`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Business-ID': businessId,
        },
        body: JSON.stringify({
          businessId,
          reason: shouldEnable ? 'Enabled from admin' : 'Disabled from admin',
        }),
      });

      if (response.ok) {
        setFeatures((prev) =>
          prev.map((f) =>
            f.feature_name === featureName
              ? { ...f, is_enabled: shouldEnable }
              : f
          )
        );
      }
    } catch (error) {
      console.error('Error toggling feature:', error);
    }
  };

  // Handle rollout percentage change
  const handleRolloutChange = async (
    featureName: string,
    percentage: number
  ) => {
    try {
      setRolloutPercentages((prev) => ({
        ...prev,
        [featureName]: percentage,
      }));

      const response = await fetch(
        `/api/admin/features/${featureName}/rollout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Business-ID': businessId,
          },
          body: JSON.stringify({
            businessId,
            rolloutPercentage: percentage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update rollout');
      }
    } catch (error) {
      console.error('Error updating rollout:', error);
      // Revert on error
      setRolloutPercentages((prev) => ({
        ...prev,
        [featureName]: prev[featureName],
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-1 text-gray-600">
            Manage feature availability and rollout for your business
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid gap-6">
        {features.map((feature) => (
          <div
            key={feature.feature_name}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.feature_name}
                </h3>
                <p className="mt-2 text-gray-600 text-sm">
                  {feature.description}
                </p>

                {/* Metadata */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {feature.category}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {feature.min_plan_tier}
                  </span>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      feature.status === 'beta'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {feature.status}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="space-y-4">
                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Enabled
                  </span>
                  <button
                    onClick={() =>
                      handleToggleFeature(
                        feature.feature_name,
                        !feature.is_enabled
                      )
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      feature.is_enabled
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        feature.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Rollout Percentage */}
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Rollout Percentage
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {rolloutPercentages[feature.feature_name] || 100}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={rolloutPercentages[feature.feature_name] || 100}
                    onChange={(e) =>
                      handleRolloutChange(
                        feature.feature_name,
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics Row */}
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Usage Count</div>
                <div className="text-lg font-semibold text-gray-900">
                  {feature.usage_count || 0}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Activation Rate</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(feature.activation_rate || 0).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Users Today</div>
                <div className="text-lg font-semibold text-gray-900">
                  {analytics[feature.feature_name]?.daily_active_users || 0}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Retention</div>
                <div className="text-lg font-semibold text-gray-900">
                  {(
                    analytics[feature.feature_name]?.feature_retention_rate || 0
                  ).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Bulk Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Export Analytics
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
            View Audit Log
          </button>
          <button className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium">
            Schedule Rollout
          </button>
        </div>
      </div>
    </div>
  );
};

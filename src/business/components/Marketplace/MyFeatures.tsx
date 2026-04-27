/**
 * MyFeatures Component
 * Shows installed features and user's feature requests
 */

import React, { memo, useEffect, useState } from 'react';
import { CheckCircle, MessageSquare, Loader, Zap } from 'lucide-react';
import { supabase } from '@/app/supabase';
import { FeatureRequestList } from './FeatureRequestList';

interface InstalledFeature {
  id: string;
  feature_id: string;
  feature_name: string;
  is_enabled: boolean;
  usage_count: number;
  last_used_at?: string;
}

interface MyFeaturesProps {
  businessId: string;
}

export const MyFeatures = memo(function MyFeatures({ businessId }: MyFeaturesProps) {
  const [installedFeatures, setInstalledFeatures] = useState<InstalledFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'installed' | 'requests'>('installed');

  useEffect(() => {
    const loadInstalledFeatures = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('feature_usage')
          .select(`
            id,
            feature_id,
            is_enabled,
            usage_count,
            last_used_at,
            marketplace_features!inner(feature_name)
          `)
          .eq('business_id', businessId)
          .eq('is_enabled', true);

        if (!error && data) {
          setInstalledFeatures(
            data.map((item: any) => ({
              id: item.id,
              feature_id: item.feature_id,
              feature_name: item.marketplace_features?.feature_name || 'Unknown',
              is_enabled: item.is_enabled,
              usage_count: item.usage_count || 0,
              last_used_at: item.last_used_at,
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load installed features:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInstalledFeatures();
  }, [businessId]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('installed')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'installed'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <CheckCircle className="mb-1 inline-block h-4 w-4" /> Installed Features
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="mb-1 inline-block h-4 w-4" /> My Requests
        </button>
      </div>

      {/* Installed Features Tab */}
      {activeTab === 'installed' && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : installedFeatures.length === 0 ? (
            <div className="rounded-lg bg-gray-50 p-8 text-center">
              <Zap className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <p className="text-gray-600">No features installed yet. Browse the marketplace to get started!</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {installedFeatures.map((feature) => (
                <div
                  key={feature.id}
                  className="rounded-lg border border-green-200 bg-green-50 p-4"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h4 className="font-semibold text-green-900">{feature.feature_name}</h4>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="space-y-2 text-sm text-green-700">
                    <p>
                      <strong>Usage:</strong> {feature.usage_count} times
                    </p>
                    {feature.last_used_at && (
                      <p>
                        <strong>Last used:</strong>{' '}
                        {new Date(feature.last_used_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <FeatureRequestList businessId={businessId} showOnlyUserRequests limit={50} />
      )}
    </div>
  );
});

/**
 * FeatureMarketplace Component
 * Main hub for feature discovery, browsing, and management
 */

import React, { memo, useCallback, useMemo, useState } from 'react';
import { Search, Grid3x3, List, Filter, Zap } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { FeatureDetailModal } from './FeatureDetailModal';
import { useMarketplaceFeatures } from '@/business/hooks/useMarketplaceFeatures';
import { useFeatureUsage } from '@/business/hooks/useFeatureUsage';
import type { FeatureCategory, FeatureStatus } from '@/business/types/marketplace';

interface FeatureMarketplaceProps {
  businessId: string;
}

const CATEGORIES: FeatureCategory[] = [
  'Automation',
  'Analytics',
  'Integrations',
  'CRM',
  'Engagement',
  'Administration',
  'Mobile',
  'AI Features',
  'Communication',
];

export const FeatureMarketplace = memo(function FeatureMarketplace({
  businessId,
}: FeatureMarketplaceProps) {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<FeatureCategory[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<FeatureStatus[]>(['available', 'beta']);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'trending' | 'highest_rated' | 'most_adopted'>(
    'trending',
  );

  // Hooks
  const marketplace = useMarketplaceFeatures(businessId, {
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    statuses: selectedStatuses,
    sortBy,
  });

  const selectedFeature = useMemo(
    () => marketplace.features.find((f) => f.id === selectedFeatureId),
    [marketplace.features, selectedFeatureId],
  );

  // Handlers
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setSearchQuery(query);

      if (query.trim()) {
        marketplace.search(query);
      } else {
        marketplace.loadFeatures(0);
      }
    },
    [marketplace],
  );

  const handleCategoryToggle = useCallback((category: FeatureCategory) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      return [...prev, category];
    });
  }, []);

  const handleStatusToggle = useCallback((status: FeatureStatus) => {
    setSelectedStatuses((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      }
      return [...prev, status];
    });
  }, []);

  const handleFeatureToggle = useCallback(
    async (featureId: string, enabled: boolean) => {
      try {
        if (enabled) {
          // Will implement actual enable/disable via hook
          console.log('Enabling feature:', featureId);
        } else {
          console.log('Disabling feature:', featureId);
        }
      } catch (error) {
        console.error('Failed to toggle feature:', error);
      }
    },
    [],
  );

  const handleLoadMore = useCallback(() => {
    marketplace.nextPage();
  }, [marketplace]);

  // Render
  return (
    <div className="flex h-full flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-6">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Feature Marketplace</h1>

        {/* Search Bar */}
        <div className="mb-4 flex gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={handleSearch}
              className="flex-1 bg-transparent outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Grid view"
            >
              <Grid3x3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`rounded-lg p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="List view"
            >
              <List className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Categories:</span>
          </div>

          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryToggle(category)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Features Grid/List */}
        <div className="flex-1 overflow-auto">
          {marketplace.isLoading && marketplace.features.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">Loading features...</p>
              </div>
            </div>
          ) : marketplace.features.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <Zap className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="text-gray-600">No features found</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid auto-rows-max gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                    : 'space-y-3'
                }
              >
                {marketplace.features.map((feature) => (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    onViewDetails={setSelectedFeatureId}
                    onToggle={handleFeatureToggle}
                    isLoading={marketplace.isLoading}
                  />
                ))}
              </div>

              {/* Load More */}
              {marketplace.hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={marketplace.isLoading}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                  >
                    Load More
                  </button>
                </div>
              )}

              {/* Page Info */}
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing {marketplace.features.length} of {marketplace.total} features
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Feature Detail Modal */}
      {selectedFeature && (
        <FeatureDetailModal
          feature={selectedFeature}
          businessId={businessId}
          onClose={() => setSelectedFeatureId(null)}
        />
      )}
    </div>
  );
});

/**
 * FeatureCard Component
 * Displays a single feature in grid/list view with rating and quick actions
 */

import React, { memo } from 'react';
import { Star, Download, Eye, Zap } from 'lucide-react';
import type { FeatureCard as FeatureCardType, FeatureStatus } from '@/business/types/marketplace';

interface FeatureCardProps {
  feature: FeatureCardType;
  onViewDetails: (featureId: string) => void;
  onToggle?: (featureId: string, enabled: boolean) => void;
  isLoading?: boolean;
}

export const FeatureCard = memo(function FeatureCard({
  feature,
  onViewDetails,
  onToggle,
  isLoading = false,
}: FeatureCardProps) {
  const getStatusColor = (status: FeatureStatus): string => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'beta':
        return 'bg-blue-100 text-blue-800';
      case 'coming_soon':
        return 'bg-purple-100 text-purple-800';
      case 'deprecated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: FeatureStatus): string => {
    return status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
      {/* Icon and Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
          {feature.icon_url ? (
            <img src={feature.icon_url} alt={feature.feature_name} className="h-6 w-6" />
          ) : (
            <Zap className="h-6 w-6 text-blue-600" />
          )}
        </div>

        <div className="flex gap-1">
          {feature.isEnabled && (
            <div className="inline-flex items-center rounded-full bg-green-100 px-2 py-1">
              <Download className="h-3 w-3 text-green-700" />
              <span className="ml-1 text-xs font-medium text-green-700">Enabled</span>
            </div>
          )}

          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(feature.status)}`}>
            {getStatusLabel(feature.status)}
          </span>
        </div>
      </div>

      {/* Name and Category */}
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.feature_name}</h3>

      <p className="mb-3 line-clamp-2 text-sm text-gray-600">{feature.description}</p>

      {/* Rating */}
      {feature.average_rating > 0 && (
        <div className="mb-3 flex items-center gap-1">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(feature.average_rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="ml-1 text-xs text-gray-600">
            {feature.average_rating.toFixed(1)} ({feature.total_ratings || 0})
          </span>
        </div>
      )}

      {/* Adoption Rate */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">Adoption</span>
          <span className="text-xs font-semibold text-gray-900">{feature.adoption_rate.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
            style={{ width: `${Math.min(feature.adoption_rate, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(feature.id)}
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-gray-100 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
          disabled={isLoading}
        >
          <Eye className="h-4 w-4" />
          Details
        </button>

        {onToggle && (
          <button
            onClick={() => onToggle(feature.id, !feature.isEnabled)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              feature.isEnabled
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
            disabled={isLoading}
          >
            <Download className="h-4 w-4" />
            {feature.isEnabled ? 'Disable' : 'Enable'}
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Phase 4: Insight Panel Component
 * Browse and drill down into AI-generated insights with filtering and search
 *
 * @module components/Dashboard/InsightPanel
 */

import React, { useMemo, useState } from 'react';
import { X, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import type { Insight, InsightType } from '../../types/dashboard';
import { useInsights, useDismissInsight } from '../../hooks/useDashboard';

// ═════════════════════════════════════════════════════════════════════════════
// INSIGHT TYPE BADGES
// ═════════════════════════════════════════════════════════════════════════════

const insightTypeConfig: Record<InsightType, { label: string; color: string; icon: React.ReactNode }> = {
  bottleneck: {
    label: 'Bottleneck',
    color: 'bg-orange-100 text-orange-800',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  performance: {
    label: 'Performance',
    color: 'bg-blue-100 text-blue-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  forecast: {
    label: 'Forecast',
    color: 'bg-purple-100 text-purple-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  anomaly: {
    label: 'Anomaly',
    color: 'bg-red-100 text-red-800',
    icon: <AlertCircle className="w-4 h-4" />,
  },
  trend: {
    label: 'Trend',
    color: 'bg-green-100 text-green-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  health: {
    label: 'Health',
    color: 'bg-indigo-100 text-indigo-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
  recommendation: {
    label: 'Recommendation',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <TrendingUp className="w-4 h-4" />,
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// INSIGHT CARD COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

interface InsightCardProps {
  insight: Insight;
  onClick?: () => void;
  onDismiss?: () => void;
}

const InsightCard: React.FC<InsightCardProps> = React.memo(
  ({ insight, onClick, onDismiss }) => {
    const config = insightTypeConfig[insight.insightType];

    return (
      <div
        className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        onClick={onClick}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                {config.icon}
                <span>{config.label}</span>
              </span>
              {insight.confidenceScore && (
                <span className="text-xs text-gray-500">
                  {Math.round(insight.confidenceScore * 100)}% confidence
                </span>
              )}
            </div>
            <h4 className="font-semibold text-gray-900 text-sm">{insight.title}</h4>
            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{insight.description}</p>
            {insight.rootCause && (
              <p className="text-xs text-gray-500 mt-2">
                <span className="font-medium">Root cause:</span> {insight.rootCause}
              </p>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss?.();
            }}
            className="ml-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {insight.impactScore && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Impact potential</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${insight.impactScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

InsightCard.displayName = 'InsightCard';

// ═════════════════════════════════════════════════════════════════════════════
// INSIGHT DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════════════

interface InsightDetailModalProps {
  insight: Insight | null;
  onClose: () => void;
}

const InsightDetailModal: React.FC<InsightDetailModalProps> = React.memo(
  ({ insight, onClose }) => {
    if (!insight) return null;

    const config = insightTypeConfig[insight.insightType];

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
            <div>
              <span
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium mb-2 ${config.color}`}
              >
                {config.icon}
                <span>{config.label}</span>
              </span>
              <h2 className="text-2xl font-bold text-gray-900 mt-2">{insight.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Analysis</h3>
              <p className="text-gray-700">{insight.description}</p>
            </div>

            {/* Root Cause */}
            {insight.rootCause && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Root Cause</h3>
                <p className="text-gray-700">{insight.rootCause}</p>
              </div>
            )}

            {/* Supporting Metrics */}
            {insight.supportingMetrics && insight.supportingMetrics.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Supporting Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  {insight.supportingMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600">{metric.label}</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {metric.value} {metric.unit}
                      </p>
                      {metric.change !== undefined && (
                        <p
                          className={`text-xs mt-1 ${
                            metric.change > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {metric.change > 0 ? '+' : ''}
                          {metric.change.toFixed(1)}% change
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Historical Context */}
            {insight.historicalContext && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">Historical Context</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {insight.historicalContext.averageValue !== undefined && (
                    <div>
                      <p className="text-gray-600">Historical Average</p>
                      <p className="font-semibold text-gray-900">
                        {insight.historicalContext.averageValue.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {insight.historicalContext.trendDuration && (
                    <div>
                      <p className="text-gray-600">Trend Duration</p>
                      <p className="font-semibold text-gray-900">
                        {insight.historicalContext.trendDuration}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confidence & Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4">
                {insight.confidenceScore && (
                  <div>
                    <p className="text-xs text-gray-600">Confidence</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Math.round(insight.confidenceScore * 100)}%
                    </p>
                  </div>
                )}
                {insight.impactScore && (
                  <div>
                    <p className="text-xs text-gray-600">Impact Potential</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Math.round(insight.impactScore * 100)}%
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600">Generated</p>
                  <p className="text-sm text-gray-900">
                    {insight.createdAt.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

InsightDetailModal.displayName = 'InsightDetailModal';

// ═════════════════════════════════════════════════════════════════════════════
// MAIN INSIGHT PANEL COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

interface InsightPanelProps {
  businessId: string;
}

/**
 * Panel for browsing and filtering insights
 */
export const InsightPanel: React.FC<InsightPanelProps> = React.memo(({ businessId }) => {
  const { data: insights = [] } = useInsights(businessId, 100);
  const dismissInsight = useDismissInsight();

  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [filterType, setFilterType] = useState<InsightType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      const typeMatch = filterType === 'all' || insight.insightType === filterType;
      const searchMatch =
        searchQuery === '' ||
        insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        insight.description.toLowerCase().includes(searchQuery.toLowerCase());
      return typeMatch && searchMatch && !insight.dismissed;
    });
  }, [insights, filterType, searchQuery]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Insights</h1>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search insights..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {['all', ...Object.keys(insightTypeConfig)].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type === 'all' ? 'All' : insightTypeConfig[type as InsightType].label}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600">
          {filteredInsights.length} insight{filteredInsights.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredInsights.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No insights match your search</p>
          </div>
        ) : (
          filteredInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onClick={() => setSelectedInsight(insight)}
              onDismiss={() => dismissInsight(insight.id, businessId)}
            />
          ))
        )}
      </div>

      {/* Detail Modal */}
      <InsightDetailModal insight={selectedInsight} onClose={() => setSelectedInsight(null)} />
    </div>
  );
});

InsightPanel.displayName = 'InsightPanel';

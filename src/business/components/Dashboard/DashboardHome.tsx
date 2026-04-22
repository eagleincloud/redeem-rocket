/**
 * Phase 4: Dashboard Home Component
 * Main dashboard view with KPI cards, insights, recommendations, and alerts
 *
 * @module components/Dashboard/DashboardHome
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import type { DashboardState, Metric, Insight, Recommendation } from '../../types/dashboard';
import { useDashboardState, useRefreshDashboard } from '../../hooks/useDashboard';

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: KPI CARD
// ═════════════════════════════════════════════════════════════════════════════

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: number;
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
}

/**
 * Reusable KPI card component
 */
const KPICard: React.FC<KPICardProps> = React.memo(
  ({ label, value, unit, trend, trendPercent, status, onClick }) => {
    const statusColor = {
      good: 'bg-green-50 border-green-200',
      warning: 'bg-yellow-50 border-yellow-200',
      critical: 'bg-red-50 border-red-200',
    }[status || 'good'];

    const textColor = {
      good: 'text-green-700',
      warning: 'text-yellow-700',
      critical: 'text-red-700',
    }[status || 'good'];

    return (
      <div
        onClick={onClick}
        className={`${statusColor} border rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow`}
      >
        <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-3xl font-bold text-gray-900">
              {value}
              {unit && <span className="text-xl ml-1">{unit}</span>}
            </p>
          </div>
          {trend && (
            <div className="flex items-center">
              {trend === 'up' && (
                <TrendingUp className={`${textColor} w-5 h-5`} />
              )}
              {trend === 'down' && (
                <TrendingDown className={`${textColor} w-5 h-5`} />
              )}
              {trendPercent !== undefined && (
                <span className={`ml-1 text-sm font-semibold ${textColor}`}>
                  {trendPercent > 0 ? '+' : ''}
                  {trendPercent.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

KPICard.displayName = 'KPICard';

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: HEALTH INDICATOR
// ═════════════════════════════════════════════════════════════════════════════

interface HealthIndicatorProps {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Pipeline health status indicator
 */
const HealthIndicator: React.FC<HealthIndicatorProps> = React.memo(({ score, status }) => {
  const statusConfig = {
    excellent: { color: 'text-green-600', bg: 'bg-green-100', label: 'Excellent' },
    good: { color: 'text-blue-600', bg: 'bg-blue-100', label: 'Good' },
    fair: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Fair' },
    poor: { color: 'text-red-600', bg: 'bg-red-100', label: 'Poor' },
  };

  const config = statusConfig[status];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Health</h3>
      <div className="flex items-center space-x-4">
        <div className={`w-20 h-20 rounded-full ${config.bg} flex items-center justify-center`}>
          <span className={`text-2xl font-bold ${config.color}`}>{score}%</span>
        </div>
        <div>
          <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
          <p className="text-sm text-gray-600 mt-1">Overall pipeline health status</p>
        </div>
      </div>
    </div>
  );
});

HealthIndicator.displayName = 'HealthIndicator';

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: RECENT INSIGHTS SECTION
// ═════════════════════════════════════════════════════════════════════════════

interface RecentInsightsSectionProps {
  insights: Insight[];
  onViewAll?: () => void;
}

/**
 * Display recent AI-generated insights
 */
const RecentInsightsSection: React.FC<RecentInsightsSectionProps> = React.memo(
  ({ insights, onViewAll }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Recent Insights</h3>
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>

        {insights.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No insights generated yet. Check back soon!
          </p>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight) => (
              <div
                key={insight.id}
                className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200"
              >
                <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                <p className="text-xs text-gray-700 mt-1 line-clamp-2">
                  {insight.description}
                </p>
                {insight.confidenceScore && (
                  <p className="text-xs text-gray-600 mt-2">
                    Confidence: {Math.round(insight.confidenceScore * 100)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

RecentInsightsSection.displayName = 'RecentInsightsSection';

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: RECOMMENDATIONS SECTION
// ═════════════════════════════════════════════════════════════════════════════

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
  onImplement?: (recommendationId: string) => void;
  onViewAll?: () => void;
}

/**
 * Display top recommendations
 */
const RecommendationsSection: React.FC<RecommendationsSectionProps> = React.memo(
  ({ recommendations, onImplement, onViewAll }) => {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">
            <Zap className="inline w-4 h-4 mr-2 text-yellow-500" />
            Recommended Actions
          </h3>
          <button
            onClick={onViewAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>

        {recommendations.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No recommendations at this time
          </p>
        ) : (
          <div className="space-y-3">
            {recommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                          rec.priority === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : rec.priority === 'high'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)}
                      </span>
                      {rec.confidenceScore && (
                        <span className="text-xs text-gray-600">
                          {Math.round(rec.confidenceScore * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  {onImplement && (
                    <button
                      onClick={() => onImplement(rec.id)}
                      className="ml-2 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      Implement
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

RecommendationsSection.displayName = 'RecommendationsSection';

// ═════════════════════════════════════════════════════════════════════════════
// COMPONENT: ALERTS SECTION
// ═════════════════════════════════════════════════════════════════════════════

interface AlertsSectionProps {
  anomalies: any[];
  onViewAll?: () => void;
}

/**
 * Display critical alerts and anomalies
 */
const AlertsSection: React.FC<AlertsSectionProps> = React.memo(
  ({ anomalies, onViewAll }) => {
    const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
    const highAnomalies = anomalies.filter((a) => a.severity === 'high');

    if (anomalies.length === 0) {
      return (
        <div className="bg-white rounded-lg border border-green-200 bg-green-50 p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <p className="text-sm font-medium text-green-800">No alerts detected</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {criticalAnomalies.concat(highAnomalies).map((anomaly) => (
          <div
            key={anomaly.id}
            className={`p-4 rounded-lg border ${
              anomaly.severity === 'critical'
                ? 'bg-red-50 border-red-200'
                : 'bg-orange-50 border-orange-200'
            }`}
          >
            <div className="flex items-start space-x-3">
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  anomaly.severity === 'critical' ? 'text-red-600' : 'text-orange-600'
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {anomaly.anomalyType}
                </p>
                <p className="text-sm text-gray-700 mt-1">{anomaly.description}</p>
              </div>
            </div>
          </div>
        ))}
        {anomalies.length > 2 && (
          <button
            onClick={onViewAll}
            className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All Alerts
          </button>
        )}
      </div>
    );
  }
);

AlertsSection.displayName = 'AlertsSection';

// ═════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD HOME COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

interface DashboardHomeProps {
  businessId: string;
  onNavigate?: (section: string) => void;
}

/**
 * Main dashboard home page with KPI summary and key insights
 */
export const DashboardHome: React.FC<DashboardHomeProps> = React.memo(
  ({ businessId, onNavigate }) => {
    const { data, isLoading, error } = useDashboardState(businessId);
    const refresh = useRefreshDashboard(businessId);

    const kpiCards = useMemo(() => {
      if (!data?.kpiSummary) return [];

      const { kpiSummary, health } = data;

      return [
        {
          label: 'Pipeline Value',
          value: `$${(kpiSummary.totalPipelineValue / 1000).toFixed(0)}K`,
          trend: kpiSummary.trend.pipelineValue,
          trendPercent: kpiSummary.previousPeriodComparison.pipelineValueChange,
          status:
            kpiSummary.totalPipelineValue > 0
              ? health.overallScore > 70
                ? 'good'
                : 'warning'
              : 'critical',
        },
        {
          label: 'Conversion Rate',
          value: `${kpiSummary.conversionRate.toFixed(1)}%`,
          trend: kpiSummary.trend.conversionRate,
          trendPercent: kpiSummary.previousPeriodComparison.conversionRateChange,
          status:
            kpiSummary.conversionRate > 20 ? 'good' : kpiSummary.conversionRate > 10 ? 'warning' : 'critical',
        },
        {
          label: 'Avg Deal Size',
          value: `$${(kpiSummary.averageDealSize / 1000).toFixed(1)}K`,
          trend: kpiSummary.trend.dealSize,
          trendPercent: kpiSummary.previousPeriodComparison.dealSizeChange,
          status: kpiSummary.averageDealSize > 5000 ? 'good' : 'warning',
        },
        {
          label: 'Sales Velocity',
          value: `${Math.round(kpiSummary.salesVelocity)}`,
          unit: 'days',
          trend: kpiSummary.trend.velocity === 'down' ? 'up' : 'down', // Lower is better
          trendPercent: -kpiSummary.previousPeriodComparison.velocityChange,
          status: kpiSummary.salesVelocity < 30 ? 'good' : 'warning',
        },
      ];
    }, [data]);

    if (isLoading) {
      return (
        <div className="p-8 text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-800 font-medium">Failed to load dashboard</p>
            <p className="text-red-700 text-sm mt-1">{error.message}</p>
            <button
              onClick={refresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              {data?.lastUpdated && `Last updated: ${data.lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiCards.map((card, idx) => (
            <KPICard key={idx} {...card} />
          ))}
        </div>

        {/* Health & Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {data?.health && (
            <HealthIndicator score={data.health.overallScore} status={data.health.status} />
          )}
          <div className="lg:col-span-2">
            <RecentInsightsSection
              insights={data?.recentInsights || []}
              onViewAll={() => onNavigate?.('insights')}
            />
          </div>
        </div>

        {/* Recommendations & Alerts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecommendationsSection
            recommendations={data?.activeRecommendations || []}
            onViewAll={() => onNavigate?.('recommendations')}
          />
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4">Critical Alerts</h3>
            <AlertsSection
              anomalies={data?.pendingAnomalies || []}
              onViewAll={() => onNavigate?.('alerts')}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Leads This Month', value: '24' },
            { label: 'Deals Closed', value: '8' },
            { label: 'Activity Rate', value: '87%' },
            { label: 'Forecast Accuracy', value: '94%' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4 text-center">
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

DashboardHome.displayName = 'DashboardHome';

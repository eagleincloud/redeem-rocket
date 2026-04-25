/**
 * Actionable Dashboard Component
 * Layer 5 - Real-time insights and AI recommendations
 * Displays intelligent business insights and actionable recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  getActiveInsights,
  getRecommendations,
  calculatePipelineMetrics,
  getGoalProgress,
  dismissInsight,
  updateRecommendationStatus,
  Insight,
  Recommendation,
} from '@/app/api/insights';

interface ActionableDashboardProps {
  businessId: string;
  pipelineId?: string;
  userId: string;
}

const ActionableDashboard = React.memo<ActionableDashboardProps>(function ActionableDashboard({
  businessId,
  pipelineId,
  userId,
}) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [goalProgress, setGoalProgress] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [loadedInsights, loadedRecs, progress] = await Promise.all([
          getActiveInsights(businessId, 10),
          getRecommendations(businessId, 'suggested', 10),
          getGoalProgress(businessId),
        ]);

        setInsights(loadedInsights);
        setRecommendations(loadedRecs);
        setGoalProgress(progress);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [businessId]);

  const handleDismissInsight = async (insightId: string) => {
    try {
      await dismissInsight(insightId, businessId, userId);
      setInsights(insights.filter(i => i.id !== insightId));
    } catch (err) {
      console.error('Failed to dismiss insight:', err);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      await updateRecommendationStatus(recommendationId, businessId, 'accepted', userId);
      setRecommendations(
        recommendations.map(r =>
          r.id === recommendationId ? { ...r, status: 'accepted' } : r
        )
      );
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600">Loading dashboard insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Business Insights & Recommendations</h1>
        <p className="text-gray-600 mt-2">AI-powered analysis to improve your sales performance</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Goal Progress Section */}
      {goalProgress && (
        <GoalProgressCard progress={goalProgress} />
      )}

      {/* Insights Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Active Insights</h2>
          <p className="text-sm text-gray-600 mt-1">Key findings and patterns detected in your sales data</p>
        </div>

        {insights.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No insights at the moment. Keep monitoring your pipeline!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {insights.map(insight => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={() => handleDismissInsight(insight.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Recommendations</h2>
          <p className="text-sm text-gray-600 mt-1">Suggested actions to improve your metrics</p>
        </div>

        {recommendations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">No recommendations yet. Your pipeline is running smoothly!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onAccept={() => handleAcceptRecommendation(rec.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});

interface GoalProgressCardProps {
  progress: any;
}

const GoalProgressCard = React.memo<GoalProgressCardProps>(function GoalProgressCard({ progress }) {
  const progressPercentage = Math.min(progress.progress_percentage, 100);
  const isOnTrack = progress.daily_pace_needed === 0 || progress.current_progress >= progress.monthly_goal;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Monthly Revenue Goal</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
          isOnTrack
            ? 'bg-green-100 text-green-700'
            : 'bg-yellow-100 text-yellow-700'
        }`}>
          {isOnTrack ? 'On Track' : 'Needs Acceleration'}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Current Progress</p>
          <p className="text-2xl font-bold text-gray-900">${(progress.current_progress / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Goal</p>
          <p className="text-2xl font-bold text-gray-900">${(progress.monthly_goal / 1000).toFixed(0)}K</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Days Remaining</p>
          <p className="text-2xl font-bold text-gray-900">{progress.days_remaining}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Daily Pace Needed</p>
          <p className="text-2xl font-bold text-gray-900">${(progress.daily_pace_needed / 1000).toFixed(1)}K</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="bg-blue-600 h-3 rounded-full transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-sm text-gray-600 mt-2">{progressPercentage.toFixed(1)}% of monthly goal achieved</p>
    </div>
  );
});

interface InsightCardProps {
  insight: Insight;
  onDismiss: () => void;
}

const InsightCard = React.memo<InsightCardProps>(function InsightCard({ insight, onDismiss }) {
  const getInsightColor = (type: string) => {
    switch (type) {
      case 'bottleneck':
        return { bg: 'bg-red-50', border: 'border-red-200', icon: '🚫' };
      case 'performance':
        return { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: '📊' };
      case 'forecast':
        return { bg: 'bg-blue-50', border: 'border-blue-200', icon: '🔮' };
      case 'health':
        return { bg: 'bg-green-50', border: 'border-green-200', icon: '💚' };
      default:
        return { bg: 'bg-gray-50', border: 'border-gray-200', icon: '💡' };
    }
  };

  const colors = getInsightColor(insight.insightType);

  return (
    <div className={`p-6 ${colors.bg} border-l-4 ${colors.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{colors.icon}</span>
          <div>
            <h4 className="font-bold text-gray-900">{insight.title}</h4>
            <span className="inline-block mt-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded capitalize">
              {insight.insightType}
            </span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 text-xl"
        >
          ✕
        </button>
      </div>

      <p className="text-gray-700 mb-3">{insight.description}</p>

      {insight.rootCause && (
        <p className="text-sm text-gray-600 mb-2">
          <strong>Root Cause:</strong> {insight.rootCause}
        </p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${insight.impactScore * 100}%` }}
            />
          </div>
          <span className="text-sm text-gray-600">
            Impact: {(insight.impactScore * 100).toFixed(0)}%
          </span>
        </div>
        {insight.confidenceScore && (
          <span className="text-sm text-gray-600">
            Confidence: {(insight.confidenceScore * 100).toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
});

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAccept: () => void;
}

const RecommendationCard = React.memo<RecommendationCardProps>(function RecommendationCard({
  recommendation,
  onAccept,
}) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-gray-900">{recommendation.title}</h4>
            <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${getPriorityColor(recommendation.priority)}`}>
              {recommendation.priority.toUpperCase()}
            </span>
          </div>
          <p className="text-gray-700 text-sm">{recommendation.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        {recommendation.expectedImpact && (
          <div>
            <p className="text-gray-600 text-xs">Expected Impact</p>
            <p className="text-gray-900 font-medium">{recommendation.expectedImpact}</p>
          </div>
        )}
        {recommendation.effortLevel && (
          <div>
            <p className="text-gray-600 text-xs">Effort Level</p>
            <p className="text-gray-900 font-medium capitalize">{recommendation.effortLevel}</p>
          </div>
        )}
      </div>

      {recommendation.reasoning && (
        <p className="text-xs text-gray-600 mb-4 italic">{recommendation.reasoning}</p>
      )}

      <div className="flex items-center justify-between">
        {recommendation.confidenceScore && (
          <div className="flex items-center gap-2">
            <div className="w-20 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-600 h-1.5 rounded-full"
                style={{ width: `${recommendation.confidenceScore * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-600">
              {(recommendation.confidenceScore * 100).toFixed(0)}% confidence
            </span>
          </div>
        )}
        {recommendation.status === 'suggested' && (
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Accept Recommendation
          </button>
        )}
        {recommendation.status === 'accepted' && (
          <span className="text-sm text-green-700 font-medium">Accepted</span>
        )}
      </div>
    </div>
  );
});

export default ActionableDashboard;

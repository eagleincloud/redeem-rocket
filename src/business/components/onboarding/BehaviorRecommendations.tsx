import React, { useState, useCallback } from 'react';
import {
  Lightbulb,
  TrendingUp,
  Target,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export type RecommendationType =
  | 'feature_discovery'
  | 'automation_suggestion'
  | 'template_suggestion'
  | 'setup_guidance'
  | 'warning';

export type PriorityLevel = 'high' | 'medium' | 'low';

export interface Recommendation {
  id: string;
  type: RecommendationType;
  title: string;
  description: string;
  priority: PriorityLevel;
  why?: string;
  impactMetrics?: {
    metric: string;
    expectedChange: string;
  };
  actionUrl?: string;
  actionLabel?: string;
}

export interface BehaviorRecommendationsProps {
  recommendations?: Recommendation[];
  onApply?: (id: string) => void | Promise<void>;
  loading?: boolean;
}

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'auto_assign_tasks',
    type: 'automation_suggestion',
    title: 'Enable Automatic Task Assignment',
    description:
      'Automatically assign tasks based on user skills and availability. This reduces manual work and improves team efficiency.',
    priority: 'high',
    why: 'Based on your team size and business type, automatic assignment can save 5-10 hours per week.',
    impactMetrics: {
      metric: 'Time Saved',
      expectedChange: '+8 hours/week',
    },
    actionLabel: 'Learn More',
  },
  {
    id: 'sync_with_email',
    type: 'feature_discovery',
    title: 'Sync with Email Platform',
    description:
      'Connect your email account to automatically capture customer interactions and update records in real-time.',
    priority: 'high',
    why: 'Email integration provides unified communication history and context for better customer service.',
    impactMetrics: {
      metric: 'Data Completeness',
      expectedChange: '+35% context',
    },
  },
  {
    id: 'advanced_analytics',
    type: 'feature_discovery',
    title: 'Unlock Advanced Analytics',
    description:
      'Gain deeper insights into business metrics, trends, and patterns. Monitor KPIs in real-time and make data-driven decisions.',
    priority: 'medium',
    why: 'Analytics helps you understand what is working and identify improvement opportunities.',
    impactMetrics: {
      metric: 'Decision Speed',
      expectedChange: '3x faster',
    },
    actionUrl: 'https://example.com/analytics',
    actionLabel: 'Explore Analytics',
  },
  {
    id: 'backup_strategy',
    type: 'setup_guidance',
    title: 'Set Up Data Backup Strategy',
    description:
      'Configure automated backups to protect your business data. Ensures business continuity and compliance.',
    priority: 'high',
    why: 'Data protection is critical for business continuity and regulatory compliance.',
    impactMetrics: {
      metric: 'Risk Reduction',
      expectedChange: '99.9% protected',
    },
  },
  {
    id: 'api_rate_limit',
    type: 'warning',
    title: 'API Rate Limit Warning',
    description:
      'You are approaching your API rate limit. Consider upgrading your plan or optimizing API usage.',
    priority: 'medium',
    why: 'Exceeding rate limits can cause service disruptions.',
    impactMetrics: {
      metric: 'Current Usage',
      expectedChange: '87% of limit',
    },
  },
];

const getRecommendationIcon = (type: RecommendationType) => {
  switch (type) {
    case 'feature_discovery':
      return <Lightbulb className="h-5 w-5" />;
    case 'automation_suggestion':
      return <TrendingUp className="h-5 w-5" />;
    case 'template_suggestion':
      return <Target className="h-5 w-5" />;
    case 'setup_guidance':
      return <CheckCircle2 className="h-5 w-5" />;
    case 'warning':
      return <AlertCircle className="h-5 w-5" />;
    default:
      return <Lightbulb className="h-5 w-5" />;
  }
};

const getRecommendationColor = (type: RecommendationType) => {
  switch (type) {
    case 'feature_discovery':
      return 'text-blue-400';
    case 'automation_suggestion':
      return 'text-purple-400';
    case 'template_suggestion':
      return 'text-cyan-400';
    case 'setup_guidance':
      return 'text-green-400';
    case 'warning':
      return 'text-orange-400';
    default:
      return 'text-slate-400';
  }
};

const getPriorityColor = (priority: PriorityLevel) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500/10 border-red-500/30 text-red-400';
    case 'medium':
      return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
    case 'low':
      return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    default:
      return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
  }
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  applied: boolean;
  onApply: (id: string) => void;
  loading: boolean;
  applyingId?: string;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  applied,
  onApply,
  loading,
  applyingId,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isApplying = applyingId === recommendation.id;

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg overflow-hidden hover:border-slate-500 transition-all duration-200">
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={`p-2.5 rounded-lg bg-slate-700 flex-shrink-0 ${getRecommendationColor(
              recommendation.type
            )}`}
          >
            {getRecommendationIcon(recommendation.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-white text-lg">
                  {recommendation.title}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {recommendation.description}
                </p>
              </div>

              {/* Priority Badge */}
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getPriorityColor(
                  recommendation.priority
                )}`}
              >
                {recommendation.priority.charAt(0).toUpperCase() +
                  recommendation.priority.slice(1)}{' '}
                Priority
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4">
              {applied ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Applied
                </div>
              ) : (
                <>
                  <button
                    onClick={() => onApply(recommendation.id)}
                    disabled={loading || isApplying}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApplying && <Loader2 className="h-4 w-4 animate-spin" />}
                    Apply
                  </button>

                  {recommendation.actionUrl && (
                    <a
                      href={recommendation.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-lg bg-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-500 hover:text-white transition-all duration-200 flex items-center gap-2"
                    >
                      {recommendation.actionLabel || 'Learn More'}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </>
              )}

              {/* Expand Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-slate-600 transition-all duration-200 ml-auto"
                aria-label="Toggle details"
              >
                <ChevronDown
                  className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-5 pt-5 border-t border-slate-600 space-y-4">
            {/* Why Section */}
            {recommendation.why && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Why This Recommendation
                </h4>
                <p className="text-sm text-slate-400">{recommendation.why}</p>
              </div>
            )}

            {/* Impact Metrics */}
            {recommendation.impactMetrics && (
              <div>
                <h4 className="text-sm font-semibold text-white mb-2">
                  Expected Impact
                </h4>
                <div className="bg-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">
                      {recommendation.impactMetrics.metric}
                    </span>
                    <span className="text-sm font-semibold text-green-400">
                      {recommendation.impactMetrics.expectedChange}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const BehaviorRecommendations: React.FC<BehaviorRecommendationsProps> = ({
  recommendations = MOCK_RECOMMENDATIONS,
  onApply,
  loading = false,
}) => {
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const handleApply = useCallback(
    async (id: string) => {
      try {
        setApplyingId(id);

        if (onApply) {
          await onApply(id);
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));

        setAppliedIds(prev => new Set([...prev, id]));
      } catch (err) {
        console.error('Failed to apply recommendation:', err);
      } finally {
        setApplyingId(null);
      }
    },
    [onApply]
  );

  const unappliedRecommendations = recommendations.filter(
    r => !appliedIds.has(r.id)
  );

  // If all recommendations are applied, show success state
  if (unappliedRecommendations.length === 0 && appliedIds.size > 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <div className="text-5xl mb-4">✨</div>
        <h2 className="text-2xl font-bold text-white mb-2">All Set!</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          You've applied all available recommendations. Your workspace is
          optimized for success.
        </p>
      </div>
    );
  }

  // If no recommendations yet
  if (recommendations.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
        <Lightbulb className="h-12 w-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">
          No Recommendations Yet
        </h2>
        <p className="text-slate-400">
          Check back later for personalized recommendations.
        </p>
      </div>
    );
  }

  // Sort recommendations by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Smart Recommendations
        </h2>
        <p className="text-slate-400">
          Personalized suggestions to optimize your workspace
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="grid gap-4">
        {sortedRecommendations.map(recommendation => (
          <RecommendationCard
            key={recommendation.id}
            recommendation={recommendation}
            applied={appliedIds.has(recommendation.id)}
            onApply={handleApply}
            loading={loading}
            applyingId={applyingId || undefined}
          />
        ))}
      </div>

      {/* Applied Count */}
      {appliedIds.size > 0 && unappliedRecommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 text-sm">
          {appliedIds.size} of {recommendations.length} recommendations applied
        </div>
      )}
    </div>
  );
};

export default BehaviorRecommendations;

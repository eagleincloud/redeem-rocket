/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * Manager Recommendations Component
 *
 * Displays AI-generated recommendations with:
 * - Priority levels (critical, high, medium, low)
 * - Action type and rationale
 * - Expected outcome
 * - One-click action buttons
 */

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
} from 'lucide-react';

interface ManagerRecommendation {
  id?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  estimatedOutcome: string;
  actionItems?: string[];
}

interface ManagerRecommendationsProps {
  recommendations: ManagerRecommendation[];
  onAccept?: (recommendation: ManagerRecommendation) => Promise<void>;
  onDismiss?: (id: string) => Promise<void>;
  loading?: boolean;
}

export const ManagerRecommendations: React.FC<ManagerRecommendationsProps> = ({
  recommendations = [],
  onAccept,
  onDismiss,
  loading = false,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(
    recommendations[0]?.id || null
  );
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'high':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      case 'medium':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'high':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100';
      default:
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
    }
  };

  const getPriorityLabel = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'CRITICAL';
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      default:
        return 'LOW';
    }
  };

  const getPriorityBgColor = (priority: string): string => {
    switch (priority) {
      case 'critical':
        return 'bg-red-600 text-red-50';
      case 'high':
        return 'bg-orange-600 text-orange-50';
      case 'medium':
        return 'bg-yellow-600 text-yellow-50';
      default:
        return 'bg-blue-600 text-blue-50';
    }
  };

  const getActionEmoji = (action: string): string => {
    const emojis: Record<string, string> = {
      send_outreach_email: '📧',
      send_proposal_follow_up: '📋',
      schedule_call: '📞',
      send_proposal: '📄',
      send_follow_up: '📬',
      accelerate_close: '🎯',
      escalate_or_reclaim: '⚠️',
      negotiate_terms: '🤝',
      gather_requirements: '📝',
      conduct_demo: '🎬',
      get_decision_maker: '👤',
      handle_objection: '💬',
    };
    return emojis[action] || '→';
  };

  const handleAccept = async (recommendation: ManagerRecommendation) => {
    if (onAccept) {
      setAcceptingId(recommendation.id || null);
      try {
        await onAccept(recommendation);
      } finally {
        setAcceptingId(null);
      }
    }
  };

  const handleDismiss = async (id: string) => {
    if (onDismiss) {
      await onDismiss(id);
    }
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations</h3>
        <p className="text-gray-600">
          All systems green. No immediate actions recommended for this deal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-indigo-600" />
        <h3 className="text-lg font-bold text-gray-900">AI-Powered Recommendations</h3>
        <span className="ml-auto text-sm font-semibold text-gray-600">
          {recommendations.length} {recommendations.length === 1 ? 'action' : 'actions'}
        </span>
      </div>

      {recommendations.map((rec, index) => {
        const id = rec.id || `rec-${index}`;
        const isExpanded = expandedId === id;

        return (
          <div
            key={id}
            className={`border-2 rounded-lg overflow-hidden transition-all ${getPriorityColor(rec.priority)}`}
          >
            {/* Header - Always visible */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:opacity-80 transition-opacity"
            >
              <div className="flex items-start gap-4 flex-1 text-left">
                {/* Priority icon and label */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getPriorityIcon(rec.priority)}
                  <span
                    className={`px-2 py-1 rounded font-bold text-xs ${getPriorityBgColor(rec.priority)}`}
                  >
                    {getPriorityLabel(rec.priority)}
                  </span>
                </div>

                {/* Action description */}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <span>{getActionEmoji(rec.action)}</span>
                    {rec.action
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </p>
                  <p className="text-sm text-gray-700 mt-1">{rec.rationale}</p>
                </div>
              </div>

              {/* Expand/collapse icon */}
              <div className="flex-shrink-0 ml-4">
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-current border-opacity-20 px-6 py-4 bg-opacity-50 space-y-4">
                {/* Expected Outcome */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-gray-700 opacity-70" />
                    <h4 className="font-semibold text-gray-900 text-sm">Expected Outcome</h4>
                  </div>
                  <p className="text-sm text-gray-800 ml-6">
                    {rec.estimatedOutcome}
                  </p>
                </div>

                {/* Action Items (if any) */}
                {rec.actionItems && rec.actionItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-700 opacity-70" />
                      <h4 className="font-semibold text-gray-900 text-sm">Action Steps</h4>
                    </div>
                    <ul className="ml-6 space-y-2">
                      {rec.actionItems.map((item, i) => (
                        <li key={i} className="text-sm text-gray-800 flex items-start gap-2">
                          <span className="text-gray-500 font-bold mt-0.5">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end pt-2 border-t border-current border-opacity-10">
                  <button
                    onClick={() => handleDismiss(id)}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-current border-opacity-30 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleAccept(rec)}
                    disabled={loading || acceptingId === id}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 ${
                      rec.priority === 'critical'
                        ? 'bg-red-600 hover:bg-red-700'
                        : rec.priority === 'high'
                          ? 'bg-orange-600 hover:bg-orange-700'
                          : rec.priority === 'medium'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {acceptingId === id ? 'Creating action...' : 'Accept & Create Action'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {recommendations.filter((r) => r.priority === 'critical').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-red-600">
              {recommendations.filter((r) => r.priority === 'critical').length}
            </p>
            <p className="text-xs text-red-700 font-semibold">Critical</p>
          </div>
        )}
        {recommendations.filter((r) => r.priority === 'high').length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {recommendations.filter((r) => r.priority === 'high').length}
            </p>
            <p className="text-xs text-orange-700 font-semibold">High</p>
          </div>
        )}
        {recommendations.filter((r) => r.priority === 'medium').length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {recommendations.filter((r) => r.priority === 'medium').length}
            </p>
            <p className="text-xs text-yellow-700 font-semibold">Medium</p>
          </div>
        )}
        {recommendations.filter((r) => r.priority === 'low').length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {recommendations.filter((r) => r.priority === 'low').length}
            </p>
            <p className="text-xs text-blue-700 font-semibold">Low</p>
          </div>
        )}
      </div>
    </div>
  );
};

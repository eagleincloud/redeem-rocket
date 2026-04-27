import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Zap, TrendingUp, ChevronRight, X, Clock } from 'lucide-react';

export interface Recommendation {
  id: string;
  type: 'action' | 'trend' | 'alert' | 'opportunity';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionStep: string;
  impact: string;
  entity?: { id: string; name: string; type: string; stage?: string };
}

interface RecommendationEngineProps {
  recommendations: Recommendation[];
  onImplement?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string, hours: number) => void;
  loading?: boolean;
  maxVisible?: number;
}

export const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  recommendations,
  onImplement,
  onDismiss,
  onSnooze,
  loading,
  maxVisible = 5,
}) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const visible = recommendations.filter((r) => !dismissed.has(r.id)).slice(0, maxVisible);

  const priorityConfig = {
    critical: { bgColor: 'bg-red-50', borderColor: 'border-red-200', badgeColor: 'bg-red-100 text-red-800', dotColor: 'bg-red-600' },
    high: { bgColor: 'bg-orange-50', borderColor: 'border-orange-200', badgeColor: 'bg-orange-100 text-orange-800', dotColor: 'bg-orange-600' },
    medium: { bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', badgeColor: 'bg-yellow-100 text-yellow-800', dotColor: 'bg-yellow-600' },
    low: { bgColor: 'bg-gray-50', borderColor: 'border-gray-200', badgeColor: 'bg-gray-100 text-gray-800', dotColor: 'bg-gray-600' },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recommendations</h3>
        {recommendations.length > 0 && (
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            {recommendations.length} total
          </span>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-gray-600">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((rec) => {
            const cfg = priorityConfig[rec.priority];
            const isExpanded = expandedId === rec.id;

            return (
              <div
                key={rec.id}
                className={`${cfg.bgColor} ${cfg.borderColor} border rounded-lg p-4 transition-all`}
              >
                <div className="flex items-start gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : rec.id)}>
                  <div className={`${cfg.dotColor} w-2 h-2 rounded-full mt-1.5 flex-shrink-0`} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{rec.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-1">{rec.description}</p>
                  </div>
                  <span className={`${cfg.badgeColor} text-xs font-semibold px-2 py-1 rounded`}>
                    {rec.priority}
                  </span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-1">Action Step</p>
                      <p className="text-sm text-gray-700">{rec.actionStep}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button onClick={() => { setDismissed(new Set(dismissed).add(rec.id)); onImplement?.(rec.id); }} className={`flex-1 ${cfg.badgeColor} hover:opacity-90 py-2 px-3 rounded font-semibold text-xs`}>
                        Implement
                      </button>
                      <button onClick={() => setDismissed(new Set(dismissed).add(rec.id))} className="p-2 hover:bg-gray-200 rounded">
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { AlertTriangle, Clock, TrendingDown } from 'lucide-react';

interface BottleneckData {
  stageId: string;
  stageName: string;
  avgTimeInDays: number;
  entityCount: number;
  severity: 'critical' | 'warning' | 'normal';
  reason: string;
}

interface TopBottleneckProps {
  bottleneck: BottleneckData | null;
  onClickAction?: () => void;
  loading?: boolean;
}

export const TopBottleneck: React.FC<TopBottleneckProps> = ({
  bottleneck,
  onClickAction,
  loading,
}) => {
  const severityConfig = {
    critical: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-800',
    },
    warning: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      badgeColor: 'bg-yellow-100 text-yellow-800',
    },
    normal: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Bottleneck</h3>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  if (!bottleneck) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Bottleneck</h3>
        <p className="text-gray-600 text-center py-8">No bottlenecks detected - pipeline flowing smoothly!</p>
      </div>
    );
  }

  const config = severityConfig[bottleneck.severity];

  return (
    <div className={`${config.bgColor} ${config.borderColor} rounded-lg p-6 border`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Bottleneck</h3>
        <AlertTriangle className={`w-5 h-5 ${config.color}`} />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-lg font-bold text-gray-900">{bottleneck.stageName}</p>
          <span className={`${config.badgeColor} text-xs font-semibold px-2 py-1 rounded-full`}>
            {bottleneck.severity.charAt(0).toUpperCase() + bottleneck.severity.slice(1)}
          </span>
        </div>
        <p className="text-sm text-gray-700 mb-3">{bottleneck.reason}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 py-3 border-t border-b">
        <div>
          <p className="text-xs text-gray-600">Avg Time</p>
          <p className="text-2xl font-bold text-gray-900">{bottleneck.avgTimeInDays.toFixed(1)}</p>
          <p className="text-xs text-gray-600">days</p>
        </div>
        <div>
          <p className="text-xs text-gray-600">Entities</p>
          <p className="text-2xl font-bold text-gray-900">{bottleneck.entityCount}</p>
          <p className="text-xs text-gray-600">stuck</p>
        </div>
      </div>

      {onClickAction && (
        <button
          onClick={onClickAction}
          className={`w-full ${config.badgeColor} hover:opacity-90 transition-opacity py-2 px-4 rounded font-semibold text-sm`}
        >
          Take Action
        </button>
      )}
    </div>
  );
};

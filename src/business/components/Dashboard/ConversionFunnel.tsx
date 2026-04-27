import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

interface FunnelStage {
  stageId: string;
  stageName: string;
  count: number;
  percentage: number;
  color?: string;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
  title?: string;
  loading?: boolean;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  stages,
  title = 'Conversion Funnel',
  loading,
}) => {
  const maxCount = useMemo(
    () => Math.max(...stages.map((s) => s.count), 1),
    [stages]
  );

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (stages.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="text-center py-12">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 border">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>

      <div className="space-y-4">
        {stages.map((stage, index) => {
          const width = (stage.count / maxCount) * 100;
          const color = stage.color || colors[index % colors.length];
          const dropOff = index > 0
            ? ((stages[index - 1].count - stage.count) / stages[index - 1].count) * 100
            : 0;

          return (
            <div key={stage.stageId}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">{stage.stageName}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {stage.count} ({stage.percentage.toFixed(1)}%)
                </p>
              </div>

              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  style={{ width: `${width}%`, backgroundColor: color }}
                  className="h-full transition-all duration-300 flex items-center px-3"
                >
                  {width > 30 && (
                    <span className="text-xs font-semibold text-white">{stage.count}</span>
                  )}
                </div>
              </div>

              {dropOff > 0 && index > 0 && (
                <p className="text-xs text-red-600 mt-1">↓ {dropOff.toFixed(1)}% drop-off</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

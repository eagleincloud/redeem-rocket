import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percent: number;
  };
  status?: 'good' | 'warning' | 'critical';
  onClick?: () => void;
  loading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtitle,
  trend,
  status = 'good',
  onClick,
  loading,
}) => {
  const statusColors = {
    good: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    critical: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div
      onClick={onClick}
      className={`${statusColors[status]} border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md' : ''
        } transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {label}
        </p>
        {status === 'critical' && (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
      </div>

      {loading ? (
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-1" />
      ) : (
        <div className="flex items-baseline gap-2 mb-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {unit && <span className="text-sm text-gray-600">{unit}</span>}
        </div>
      )}

      <div className="flex items-center justify-between">
        {subtitle && (
          <p className="text-xs text-gray-600">{subtitle}</p>
        )}

        {trend && !loading && (
          <div className="flex items-center gap-1 ml-auto">
            {trend.direction === 'up' && (
              <TrendingUp className="w-4 h-4 text-green-600" />
            )}
            {trend.direction === 'down' && (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className="text-xs font-medium text-gray-700">
              {trend.direction !== 'neutral' && (trend.percent > 0 ? '+' : '')}
              {trend.percent.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

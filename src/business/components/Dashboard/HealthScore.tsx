import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface HealthMetrics {
  conversion: number;
  velocity: number;
  followUp: number;
  health: number;
}

interface HealthScoreProps {
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  metrics: HealthMetrics;
  lastUpdated?: string;
  loading?: boolean;
}

export const HealthScore: React.FC<HealthScoreProps> = ({
  score,
  status,
  metrics,
  lastUpdated,
  loading,
}) => {
  const statusConfig = {
    excellent: { color: '#10B981', bgColor: 'bg-green-50', textColor: 'text-green-700', label: 'Excellent' },
    good: { color: '#3B82F6', bgColor: 'bg-blue-50', textColor: 'text-blue-700', label: 'Good' },
    fair: { color: '#F59E0B', bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', label: 'Fair' },
    poor: { color: '#EF4444', bgColor: 'bg-red-50', textColor: 'text-red-700', label: 'Poor' },
  };

  const config = statusConfig[status];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  if (loading) {
    return (
      <div className={`${config.bgColor} rounded-lg p-6 border`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Business Health</h3>
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 bg-gray-200 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} rounded-lg p-6 border`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Business Health</h3>
        {status === 'excellent' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
        {status === 'poor' && <AlertCircle className="w-5 h-5 text-red-600" />}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200" />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={config.color}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{score}</p>
              <p className={`text-xs font-semibold ${config.textColor}`}>{config.label}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-sm font-semibold text-gray-900">{Math.min(value, 100).toFixed(1)}%</p>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                style={{
                  width: `${Math.min(value, 100)}%`,
                  backgroundColor: config.color,
                }}
                className="h-full transition-all duration-300"
              />
            </div>
          </div>
        ))}
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-600 text-center">
          Updated {new Date(lastUpdated).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
};

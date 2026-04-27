import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

export interface PerformanceDataPoint {
  date: string;
  conversion?: number;
  velocity?: number;
  closeRate?: number;
}

interface PerformanceChartProps {
  data: PerformanceDataPoint[];
  metrics?: ('conversion' | 'velocity' | 'closeRate')[];
  title?: string;
  loading?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  data,
  metrics = ['conversion', 'velocity'],
  title = 'Performance Trend',
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
        <div className="h-48 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (data.length === 0) {
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
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="flex gap-4">
          {metrics.map((m) => (
            <div key={m} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-xs text-gray-600 capitalize">{m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-48 flex items-end justify-around gap-2">
        {data.map((point, i) => (
          <div
            key={i}
            className="flex-1 bg-blue-200 rounded-t hover:bg-blue-400 transition-colors"
            style={{
              height: `${Math.max((point.conversion || 0) / 30 * 100, 5)}%`,
              minWidth: '1px',
            }}
            title={`${point.date}: ${point.conversion?.toFixed(1)}%`}
          />
        ))}
      </div>

      <div className="flex justify-between mt-2 px-2 text-xs text-gray-600">
        {data.length > 0 && (
          <>
            <span>{data[0].date}</span>
            <span>{data[Math.floor(data.length / 2)]?.date || ''}</span>
            <span>{data[data.length - 1]?.date}</span>
          </>
        )}
      </div>
    </div>
  );
};

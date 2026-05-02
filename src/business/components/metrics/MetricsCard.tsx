import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from '@/business/components/base/GlassCard';

interface MetricsCardProps {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  percentageChange: number;
  status: 'beating' | 'on-track' | 'behind';
  onClick?: () => void;
}

export default function MetricsCard({
  name,
  current,
  target,
  unit,
  trend,
  percentageChange,
  status,
  onClick,
}: MetricsCardProps) {
  const bgClass = {
    beating: 'border-green-500/30 bg-green-500/5',
    'on-track': 'border-blue-500/30 bg-blue-500/5',
    behind: 'border-orange-500/30 bg-orange-500/5',
  }[status];

  const trendIcon = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingDown className="w-4 h-4 text-red-500" />,
    flat: <Minus className="w-4 h-4 text-gray-500" />,
  }[trend];

  const progress = Math.min((current / target) * 100, 100);

  return (
    <GlassCard
      className={`p-4 cursor-pointer transition-all hover:border-white/40 ${bgClass}`}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div>
          <p className="text-white/70 text-xs font-medium mb-1">{name}</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-white">
                {current.toLocaleString()}{unit}
              </p>
              <p className="text-xs text-white/60">Target: {target.toLocaleString()}{unit}</p>
            </div>
            {trendIcon}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span
                className={`text-xs font-medium ${
                  trend === 'up'
                    ? 'text-green-400'
                    : trend === 'down'
                      ? 'text-red-400'
                      : 'text-gray-400'
                }`}
              >
                {trend === 'up' ? '+' : trend === 'down' ? '' : '~'}
                {percentageChange}%
              </span>
            </div>
            <span
              className={`text-xs font-medium ${
                status === 'beating'
                  ? 'text-green-400'
                  : status === 'on-track'
                    ? 'text-blue-400'
                    : 'text-orange-400'
              }`}
            >
              {status === 'beating'
                ? '🎯 Beating target'
                : status === 'on-track'
                  ? '📍 On track'
                  : '⚠️ Behind target'}
            </span>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all rounded-full ${
                status === 'beating'
                  ? 'bg-green-500'
                  : status === 'on-track'
                    ? 'bg-blue-500'
                    : 'bg-orange-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

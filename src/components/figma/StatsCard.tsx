import React, { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  percentageChange?: number;
  comparison?: 'beating' | 'on-track' | 'behind';
  icon?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  label,
  value,
  unit = '',
  trend = 'flat',
  percentageChange = 0,
  comparison = 'on-track',
  icon,
  onClick,
  className = '',
}) => {
  const getTrendColor = () => {
    switch (comparison) {
      case 'beating':
        return '#10B981'; // green
      case 'behind':
        return '#EF4444'; // red
      default:
        return '#F59E0B'; // orange
    }
  };

  const getTrendLabel = () => {
    if (percentageChange > 0) return `+${percentageChange}%`;
    if (percentageChange < 0) return `${percentageChange}%`;
    return '0%';
  };

  const trendColor = getTrendColor();

  return (
    <div
      onClick={onClick}
      style={{
        padding: 'var(--space-16)',
        borderRadius: 'var(--radius-lg)',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all var(--transition-base)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-12)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.08)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.15)';
          (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
      className={className}
    >
      {/* Header with icon and label */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-medium)' }}>
          {label}
        </span>
        {icon && (
          <div
            style={{
              width: 'var(--space-10)',
              height: 'var(--space-10)',
              borderRadius: 'var(--radius-base)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--color-primary-500)',
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span
          style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
              fontWeight: 'var(--font-weight-medium)',
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Trend indicator */}
      {percentageChange !== 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-8)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: trendColor,
            }}
          >
            {trend === 'up' ? (
              <TrendingUp style={{ width: 'var(--space-4)', height: 'var(--space-4)' }} />
            ) : (
              <TrendingDown style={{ width: 'var(--space-4)', height: 'var(--space-4)' }} />
            )}
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-semibold)' }}>
              {getTrendLabel()}
            </span>
          </div>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            vs last period
          </span>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}

type ChartType = 'line' | 'bar' | 'area';

interface MetricsChartProps {
  data: ChartDataPoint[];
  type?: ChartType;
  dataKeys: Array<{
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
  }>;
  title?: string;
  subtitle?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({
  data,
  type = 'line',
  dataKeys,
  title,
  subtitle,
  height = 300,
  showLegend = true,
  showGrid = true,
  className = '',
}) => {
  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 0, bottom: 5 },
    };

    const chartContent = (
      <>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.1)"
            verticalPoints={[]}
          />
        )}
        <XAxis
          dataKey="name"
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: 'var(--font-size-xs)' }}
        />
        <YAxis
          stroke="var(--color-text-tertiary)"
          style={{ fontSize: 'var(--font-size-xs)' }}
        />
        <Tooltip
          contentStyle={{
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 'var(--radius-base)',
            color: 'var(--color-text-primary)',
          }}
          cursor={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          wrapperStyle={{ outline: 'none' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{
              paddingTop: 'var(--space-12)',
              color: 'var(--color-text-secondary)',
            }}
            iconType="circle"
          />
        )}
        {dataKeys.map((key) =>
          type === 'line' ? (
            <Line
              key={key.key}
              type="monotone"
              dataKey={key.key}
              stroke={key.color}
              name={key.name}
              strokeWidth={key.strokeWidth || 2}
              dot={{ fill: key.color, r: 4 }}
              activeDot={{ r: 6 }}
            />
          ) : type === 'bar' ? (
            <Bar
              key={key.key}
              dataKey={key.key}
              fill={key.color}
              name={key.name}
              radius={[8, 8, 0, 0]}
            />
          ) : (
            <Area
              key={key.key}
              type="monotone"
              dataKey={key.key}
              fill={key.color}
              stroke={key.color}
              name={key.name}
              fillOpacity={0.1}
              strokeWidth={key.strokeWidth || 2}
            />
          )
        )}
      </>
    );

    if (type === 'line') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart {...commonProps}>{chartContent}</LineChart>
        </ResponsiveContainer>
      );
    } else if (type === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart {...commonProps}>{chartContent}</BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart {...commonProps}>{chartContent}</AreaChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <div className={className}>
      {title && (
        <div style={{ marginBottom: 'var(--space-12)' }}>
          <h3
            style={{
              margin: '0 0 var(--space-2) 0',
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--color-text-primary)',
            }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          padding: 'var(--space-16)',
          borderRadius: 'var(--radius-lg)',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {renderChart()}
      </div>
    </div>
  );
};

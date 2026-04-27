/**
 * PipelineStats Component
 * Displays conversion metrics, average cycle time, and stage performance
 */

import React, { useMemo } from 'react';
import { PipelineMetrics, PipelineStage } from '../../types/pipeline';
import './PipelineStats.css';

interface PipelineStatsProps {
  metrics: PipelineMetrics | null;
  stages: PipelineStage[];
  loading?: boolean;
}

interface StageMetric {
  stageId: string;
  stageName: string;
  stageColor: string;
  entityCount: number;
  conversionRate: number;
  avgCycleDays: number;
}

const PipelineStats: React.FC<PipelineStatsProps> = ({
  metrics,
  stages,
  loading = false,
}) => {
  // Calculate stage-level metrics
  const stageMetrics = useMemo((): StageMetric[] => {
    if (!metrics?.stages) return [];

    return stages
      .map((stage) => {
        const stageData = metrics.stages[stage.id];
        return {
          stageId: stage.id,
          stageName: stage.name,
          stageColor: stage.color || '#9CA3AF',
          entityCount: stageData?.count || 0,
          conversionRate: stageData?.conversion_rate || 0,
          avgCycleDays: stageData?.avg_cycle_days || 0,
        };
      })
      .filter((m) => m.entityCount > 0 || m.conversionRate > 0);
  }, [metrics, stages]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totalEntities = stageMetrics.reduce((sum, m) => sum + m.entityCount, 0);
    const avgConversionRate =
      stageMetrics.length > 0
        ? stageMetrics.reduce((sum, m) => sum + m.conversionRate, 0) / stageMetrics.length
        : 0;
    const avgCycleDays =
      stageMetrics.length > 0
        ? stageMetrics.reduce((sum, m) => sum + m.avgCycleDays, 0) / stageMetrics.length
        : 0;

    return {
      totalEntities,
      avgConversionRate,
      avgCycleDays,
    };
  }, [stageMetrics]);

  if (loading) {
    return (
      <div className="pipeline-stats loading">
        <div className="stats-skeleton">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-stats">
      {/* Overall Metrics */}
      <div className="stats-container">
        <div className="stat-card overall">
          <div className="stat-content">
            <span className="stat-label">Total Entities</span>
            <span className="stat-value">{overallMetrics.totalEntities}</span>
          </div>
          <div className="stat-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20m0 0l-8-8m8 8l8-8" />
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Avg Conversion Rate</span>
            <span className="stat-value">{overallMetrics.avgConversionRate.toFixed(1)}%</span>
          </div>
          <div className="stat-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 17"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <span className="stat-label">Avg Cycle Time</span>
            <span className="stat-value">{overallMetrics.avgCycleDays.toFixed(1)}</span>
            <span className="stat-unit">days</span>
          </div>
          <div className="stat-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6v6l4 2"></polyline>
            </svg>
          </div>
        </div>
      </div>

      {/* Stage Breakdown */}
      {stageMetrics.length > 0 && (
        <div className="stage-breakdown">
          <h3 className="breakdown-title">Stage Breakdown</h3>
          <div className="stage-metrics">
            {stageMetrics.map((metric) => (
              <div key={metric.stageId} className="stage-metric-row">
                <div className="stage-name-col">
                  <span
                    className="stage-color-dot"
                    style={{ backgroundColor: metric.stageColor }}
                  ></span>
                  <span className="stage-name">{metric.stageName}</span>
                </div>

                <div className="metric-value">
                  <span className="label">Entities:</span>
                  <span className="value">{metric.entityCount}</span>
                </div>

                <div className="metric-value">
                  <span className="label">Conversion:</span>
                  <span className="value">{metric.conversionRate.toFixed(1)}%</span>
                </div>

                <div className="metric-value">
                  <span className="label">Cycle Time:</span>
                  <span className="value">{metric.avgCycleDays.toFixed(1)} days</span>
                </div>

                {/* Simple bar chart */}
                <div className="metric-bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${Math.min((metric.entityCount / (overallMetrics.totalEntities || 1)) * 100, 100)}%`,
                      backgroundColor: metric.stageColor,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stageMetrics.length === 0 && (
        <div className="empty-state">
          <p>No metrics available yet</p>
          <small>Add entities to your pipeline to see metrics</small>
        </div>
      )}
    </div>
  );
};

export default PipelineStats;

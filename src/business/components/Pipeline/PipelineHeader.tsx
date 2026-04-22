/**
 * PipelineHeader Component
 * Header with pipeline info, metrics, and actions
 */

import React from 'react';
import { Pipeline, PipelineMetrics } from '../../types/pipeline';
import './PipelineHeader.css';

interface PipelineHeaderProps {
  pipeline: Pipeline;
  metrics?: PipelineMetrics | null;
  loading?: boolean;
}

const PipelineHeader: React.FC<PipelineHeaderProps> = ({ pipeline, metrics, loading }) => {
  // Get health icon
  const getHealthIcon = (health: string) => {
    switch (health) {
      case 'excellent':
        return '✓✓';
      case 'good':
        return '✓';
      case 'fair':
        return '◐';
      case 'poor':
        return '✕';
      default:
        return '?';
    }
  };

  return (
    <div className="pipeline-header">
      <div className="header-left">
        <div className="pipeline-title">
          {pipeline.icon && <span className="pipeline-icon">{pipeline.icon}</span>}
          <h1>{pipeline.name}</h1>
        </div>
        {pipeline.description && <p className="pipeline-description">{pipeline.description}</p>}
      </div>

      <div className="header-right">
        {!loading && metrics ? (
          <div className="metrics-summary">
            <div className="metric-card">
              <div className="metric-value">{metrics.total_entities}</div>
              <div className="metric-label">Entities</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">${(metrics.total_value / 1000).toFixed(0)}k</div>
              <div className="metric-label">Total Value</div>
            </div>

            <div className="metric-card">
              <div className="metric-value">${(metrics.weighted_forecast / 1000).toFixed(0)}k</div>
              <div className="metric-label">Forecast</div>
            </div>

            <div className={`metric-card health ${metrics.pipeline_health}`}>
              <div className="metric-value">{getHealthIcon(metrics.pipeline_health)}</div>
              <div className="metric-label">{metrics.pipeline_health}</div>
            </div>
          </div>
        ) : loading ? (
          <div className="metrics-loading">Loading metrics...</div>
        ) : null}
      </div>
    </div>
  );
};

export default PipelineHeader;

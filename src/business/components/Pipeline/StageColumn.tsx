/**
 * StageColumn Component
 * Individual pipeline stage column with entities and metrics
 */

import React, { useState } from 'react';
import { PipelineStage, PipelineEntity, StageMetrics } from '../../types/pipeline';
import EntityCard from './EntityCard';
import './StageColumn.css';

interface StageColumnProps {
  stage: PipelineStage;
  entities: PipelineEntity[];
  metrics?: StageMetrics;
  stats?: { count: number; value: number };
  onEntityMove?: (entity: PipelineEntity) => void;
  onEntityClick?: (entityId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onAddEntity?: (stageId: string) => void;
  onStageSettings?: (stageId: string) => void;
}

const StageColumn: React.FC<StageColumnProps> = ({
  stage,
  entities,
  metrics,
  stats,
  onEntityMove,
  onEntityClick,
  onDragOver,
  onDrop,
  onAddEntity,
  onStageSettings,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div
      className="stage-column"
      style={{ borderTopColor: stage.color || '#E5E7EB' }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Stage Header */}
      <div className="stage-header">
        <div className="stage-info">
          <h3 className="stage-name">{stage.name}</h3>
          <div className="stage-meta">
            <span className="entity-count">{stats?.count || 0}</span>
            {stage.is_win_stage && <span className="win-badge">WIN</span>}
            {stage.is_terminal && <span className="terminal-badge">FINAL</span>}
          </div>
        </div>

        {stats?.value !== undefined && (
          <div className="stage-value">
            <small>${stats.value.toLocaleString()}</small>
          </div>
        )}

        <div className="stage-actions">
          <button
            className="stage-action-btn"
            onClick={() => onAddEntity?.(stage.id)}
            title="Add entity"
          >
            +
          </button>
          <button
            className="stage-action-btn"
            onClick={() => onStageSettings?.(stage.id)}
            title="Stage settings"
          >
            ⋯
          </button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className="stage-metrics">
          <div className="metric">
            <small>Avg Time</small>
            <strong>{Math.round(metrics.avg_time_in_stage)}d</strong>
          </div>
          <div className="metric">
            <small>Success Rate</small>
            <strong>{Math.round(metrics.conversion_rate)}%</strong>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div className="drop-zone">
        {/* Entities */}
        <div className="entities-list">
          {entities.length === 0 ? (
            <div className="empty-column">
              <p>No entities</p>
            </div>
          ) : (
            entities.map(entity => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={() => onEntityClick?.(entity.id)}
                onMove={() => onEntityMove?.(entity)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StageColumn;

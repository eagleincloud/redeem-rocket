/**
 * PipelineBoard Component
 * Main Kanban-style pipeline visualization with drag-and-drop support
 */

import React, { useState, useCallback, useMemo } from 'react';
import { usePipeline, usePipelineEntities, usePipelineMetrics } from '../../hooks/usePipeline';
import { PipelineEntity, PipelineStage } from '../../types/pipeline';
import { getStagesByPipeline } from '../../../app/api/pipeline';
import StageColumn from './StageColumn';
import EntityDetail from './EntityDetail';
import PipelineHeader from './PipelineHeader';
import './PipelineBoard.css';

interface PipelineBoardProps {
  pipelineId: string;
  onEntityClick?: (entityId: string) => void;
  onStageClick?: (stageId: string) => void;
}

interface StageWithMetrics {
  stage: PipelineStage;
  entityCount: number;
  totalValue: number;
}

const PipelineBoard: React.FC<PipelineBoardProps> = ({
  pipelineId,
  onEntityClick,
  onStageClick,
}) => {
  // State management
  const { pipeline, loading: pipelineLoading, error: pipelineError } = usePipeline(pipelineId);
  const { entities, loading: entitiesLoading, pagination, setPage } = usePipelineEntities(
    pipelineId,
    {},
    1
  );
  const { metrics, loading: metricsLoading } = usePipelineMetrics(pipelineId);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [draggedEntity, setDraggedEntity] = useState<PipelineEntity | null>(null);

  // Load stages on mount
  React.useEffect(() => {
    const loadStages = async () => {
      try {
        const data = await getStagesByPipeline(pipelineId);
        setStages(data);
      } catch (error) {
        console.error('Failed to load stages:', error);
      }
    };

    if (pipelineId) {
      loadStages();
    }
  }, [pipelineId]);

  // Group entities by stage
  const entitiesByStage = useMemo(() => {
    const grouped: Record<string, PipelineEntity[]> = {};
    stages.forEach(stage => {
      grouped[stage.id] = entities.filter(e => e.stage_id === stage.id);
    });
    return grouped;
  }, [entities, stages]);

  // Calculate stage stats
  const stageStats = useMemo(() => {
    const stats: Record<string, { count: number; value: number }> = {};
    stages.forEach(stage => {
      const stageEntities = entitiesByStage[stage.id] || [];
      stats[stage.id] = {
        count: stageEntities.length,
        value: stageEntities.reduce((sum, e) => sum + (e.value || 0), 0),
      };
    });
    return stats;
  }, [stages, entitiesByStage]);

  // Handle entity drag start
  const handleDragStart = (entity: PipelineEntity) => {
    setDraggedEntity(entity);
  };

  // Handle entity drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle entity drop
  const handleDrop = async (stageId: string) => {
    if (!draggedEntity) return;

    try {
      // Move entity - handled by parent or hook
      console.log(`Moving entity ${draggedEntity.id} to stage ${stageId}`);
      // TODO: Call moveEntity from API
    } catch (error) {
      console.error('Failed to move entity:', error);
    } finally {
      setDraggedEntity(null);
    }
  };

  // Loading state
  if (pipelineLoading) {
    return (
      <div className="pipeline-board loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading pipeline...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (pipelineError || !pipeline) {
    return (
      <div className="pipeline-board error">
        <div className="error-container">
          <h2>Failed to load pipeline</h2>
          <p>{pipelineError?.message || 'Pipeline not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pipeline-board">
      {/* Header */}
      <PipelineHeader
        pipeline={pipeline}
        metrics={metrics}
        loading={metricsLoading}
      />

      {/* Main Kanban */}
      <div className="pipeline-kanban">
        {/* Stages */}
        <div className="stages-container">
          {stages.length === 0 ? (
            <div className="empty-state">
              <p>No stages configured</p>
              <small>Create stages to start managing your pipeline</small>
            </div>
          ) : (
            stages.map(stage => (
              <StageColumn
                key={stage.id}
                stage={stage}
                entities={entitiesByStage[stage.id] || []}
                metrics={metrics?.stages[stage.id]}
                stats={stageStats[stage.id]}
                onEntityMove={handleDragStart}
                onEntityClick={setSelectedEntityId}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="pagination">
            <button
              onClick={() => setPage(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Previous
            </button>
            <span>{pagination.page}</span>
            <button
              onClick={() => setPage(pagination.page + 1)}
              disabled={pagination.page * pagination.limit >= pagination.total}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Entity Detail Modal */}
      {selectedEntityId && (
        <EntityDetail
          entityId={selectedEntityId}
          onClose={() => setSelectedEntityId(null)}
          pipelineId={pipelineId}
        />
      )}
    </div>
  );
};

export default PipelineBoard;

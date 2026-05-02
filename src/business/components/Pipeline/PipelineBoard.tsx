/**
 * PipelineBoard Component
 * Main Kanban-style pipeline visualization with drag-and-drop support
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { usePipeline, usePipelineEntities, usePipelineMetrics } from '../../hooks/usePipeline';
import { useViewport } from '../../hooks/useViewport';
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
  // Hooks
  const { isMobile, isTablet, isDesktop } = useViewport();

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

  // Touch/swipe state
  const touchStartRef = useRef<number>(0);
  const touchEntityRef = useRef<PipelineEntity | null>(null);

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

  // Handle touch start for swipe gesture
  const handleTouchStart = (e: React.TouchEvent, entity: PipelineEntity) => {
    touchStartRef.current = e.touches[0].clientX;
    touchEntityRef.current = entity;
  };

  // Handle touch end for swipe gesture
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchEntityRef.current || touchStartRef.current === 0) return;

    const touchEnd = e.changedTouches[0].clientX;
    const swipeDistance = touchStartRef.current - touchEnd;
    const MIN_SWIPE = 50; // Minimum swipe distance in pixels

    // Swipe left: move to next stage
    if (swipeDistance > MIN_SWIPE) {
      const currentStageIndex = stages.findIndex(s => s.id === touchEntityRef.current!.stage_id);
      if (currentStageIndex < stages.length - 1) {
        handleDrop(stages[currentStageIndex + 1].id);
      }
    }
    // Swipe right: move to previous stage
    else if (swipeDistance < -MIN_SWIPE) {
      const currentStageIndex = stages.findIndex(s => s.id === touchEntityRef.current!.stage_id);
      if (currentStageIndex > 0) {
        handleDrop(stages[currentStageIndex - 1].id);
      }
    }

    touchStartRef.current = 0;
    touchEntityRef.current = null;
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
    <div className={`pipeline-board ${isMobile ? 'mobile-view' : isTablet ? 'tablet-view' : 'desktop-view'}`}>
      {/* Header */}
      <PipelineHeader
        pipeline={pipeline}
        metrics={metrics}
        loading={metricsLoading}
      />

      {/* Main Kanban */}
      <div className="pipeline-kanban">
        {/* Mobile Card View: Stacked vertically */}
        {isMobile && (
          <div className="mobile-cards-container">
            {stages.length === 0 ? (
              <div className="empty-state">
                <p>No stages configured</p>
                <small>Create stages to start managing your pipeline</small>
              </div>
            ) : (
              entities.length === 0 ? (
                <div className="empty-state">
                  <p>No leads yet</p>
                  <small>Add leads to get started</small>
                </div>
              ) : (
                entities.map(entity => {
                  const stage = stages.find(s => s.id === entity.stage_id);
                  return (
                    <div
                      key={entity.id}
                      className="mobile-entity-card"
                      onTouchStart={(e) => handleTouchStart(e, entity)}
                      onTouchEnd={handleTouchEnd}
                      onClick={() => setSelectedEntityId(entity.id)}
                    >
                      <div className="card-header">
                        <h4 className="entity-name">{entity.name}</h4>
                        <span className="stage-badge" style={{ backgroundColor: stage?.color }}>
                          {stage?.name}
                        </span>
                      </div>
                      <div className="card-body">
                        <p className="entity-company">{entity.company_name}</p>
                        {entity.value && (
                          <p className="entity-value">${entity.value.toLocaleString()}</p>
                        )}
                      </div>
                      <div className="card-footer">
                        <small className="card-email">{entity.email}</small>
                      </div>
                    </div>
                  );
                })
              )
            )}
          </div>
        )}

        {/* Tablet/Desktop Grid View */}
        {!isMobile && (
          <div className={`stages-container grid-${isTablet ? '2-cols' : 'multi-cols'}`}>
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
        )}

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

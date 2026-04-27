/**
 * StageHeader Component
 * Header for each pipeline stage showing name, count, and actions
 */

import React from 'react';
import './StageHeader.css';

interface StageHeaderProps {
  stageId: number;
  stageName: string;
  stageColor: string;
  entityCount: number;
  loading?: boolean;
  onAddEntity?: (stageId: number) => void;
  onConfigureStage?: (stageId: number) => void;
  showActions?: boolean;
}

const StageHeader: React.FC<StageHeaderProps> = ({
  stageId,
  stageName,
  stageColor,
  entityCount,
  loading = false,
  onAddEntity,
  onConfigureStage,
  showActions = true,
}) => {
  return (
    <div className="stage-header">
      {/* Stage Title */}
      <div className="stage-title">
        <span
          className="stage-color"
          style={{ backgroundColor: stageColor }}
          title={`Stage color: ${stageColor}`}
        ></span>
        <h3 className="stage-name">{stageName}</h3>
        <span className="entity-count">{entityCount}</span>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="stage-actions">
          {onAddEntity && (
            <button
              className="action-btn add-entity"
              onClick={() => onAddEntity(stageId)}
              disabled={loading}
              title="Add entity to this stage"
              aria-label={`Add entity to ${stageName}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          )}

          {onConfigureStage && (
            <button
              className="action-btn configure"
              onClick={() => onConfigureStage(stageId)}
              disabled={loading}
              title="Configure this stage"
              aria-label={`Configure ${stageName}`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StageHeader;

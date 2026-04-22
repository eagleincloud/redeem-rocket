/**
 * EntityCard Component
 * Individual entity card in pipeline stage
 */

import React from 'react';
import { PipelineEntity } from '../../types/pipeline';
import './EntityCard.css';

interface EntityCardProps {
  entity: PipelineEntity;
  onClick?: () => void;
  onMove?: () => void;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity, onClick, onMove }) => {
  // Priority color mapping
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '#EF4444';
      case 'high':
        return '#F97316';
      case 'medium':
        return '#EAB308';
      case 'low':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  // Priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return '!!!';
      case 'high':
        return '!!';
      case 'medium':
        return '•';
      case 'low':
        return '°';
      default:
        return '○';
    }
  };

  // Type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lead':
        return '#3B82F6';
      case 'opportunity':
        return '#8B5CF6';
      case 'deal':
        return '#10B981';
      case 'customer':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <div
      className="entity-card"
      onClick={onClick}
      draggable
      onDragStart={onMove}
    >
      {/* Card Header */}
      <div className="card-header">
        <span
          className="type-badge"
          style={{ backgroundColor: getTypeColor(entity.entity_type) }}
          title={entity.entity_type}
        >
          {entity.entity_type[0].toUpperCase()}
        </span>
        <span
          className="priority-indicator"
          style={{ color: getPriorityColor(entity.priority) }}
          title={`Priority: ${entity.priority}`}
        >
          {getPriorityIcon(entity.priority)}
        </span>
      </div>

      {/* Card Body */}
      <div className="card-body">
        <h4 className="card-title" title={entity.name}>
          {entity.name.length > 30 ? entity.name.substring(0, 27) + '...' : entity.name}
        </h4>

        {entity.value !== undefined && entity.value !== null && (
          <div className="card-value">
            <strong>${entity.value.toLocaleString()}</strong>
            <span className="currency">{entity.currency}</span>
          </div>
        )}

        {entity.tags && entity.tags.length > 0 && (
          <div className="card-tags">
            {entity.tags.slice(0, 2).map((tag, idx) => (
              <span key={idx} className="tag">
                {tag}
              </span>
            ))}
            {entity.tags.length > 2 && <span className="tag-more">+{entity.tags.length - 2}</span>}
          </div>
        )}

        {entity.expected_close_date && (
          <div className="card-date">
            <small>{new Date(entity.expected_close_date).toLocaleDateString()}</small>
          </div>
        )}
      </div>

      {/* Card Footer */}
      {entity.assigned_to && (
        <div className="card-footer">
          <span className="assigned-icon">👤</span>
        </div>
      )}
    </div>
  );
};

export default EntityCard;

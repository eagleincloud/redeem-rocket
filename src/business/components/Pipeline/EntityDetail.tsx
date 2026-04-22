/**
 * EntityDetail Component
 * Full entity view with history, notes, and editing capabilities
 */

import React, { useState, useEffect } from 'react';
import { PipelineEntity, EntityHistory, UpdateEntityRequest } from '../../types/pipeline';
import { getEntity, getEntityHistory, updateEntity } from '../../../app/api/pipeline';
import './EntityDetail.css';

interface EntityDetailProps {
  entityId: string;
  pipelineId: string;
  onClose?: () => void;
  onUpdate?: (updates: UpdateEntityRequest) => Promise<void>;
}

const EntityDetail: React.FC<EntityDetailProps> = ({
  entityId,
  pipelineId,
  onClose,
  onUpdate,
}) => {
  const [entity, setEntity] = useState<PipelineEntity | null>(null);
  const [history, setHistory] = useState<EntityHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<UpdateEntityRequest>({});

  // Load entity and history
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [entityData, historyData] = await Promise.all([
          getEntity(entityId),
          getEntityHistory(entityId),
        ]);
        setEntity(entityData);
        setHistory(historyData);
        setEditData({
          name: entityData.name,
          value: entityData.value,
          priority: entityData.priority,
          status: entityData.status,
          notes: entityData.notes,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load entity');
      } finally {
        setLoading(false);
      }
    };

    if (entityId) {
      loadData();
    }
  }, [entityId]);

  // Handle save
  const handleSave = async () => {
    try {
      setLoading(true);
      await updateEntity(entityId, editData);
      setEntity(prev => prev ? { ...prev, ...editData } : null);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  if (!entity) {
    return (
      <div className="entity-detail-modal">
        <div className="modal-overlay" onClick={onClose} />
        <div className="modal-content">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : (
            <div className="not-found">Entity not found</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="entity-detail-modal">
      <div className="modal-overlay" onClick={onClose} />
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <h2>{entity.name}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {isEditing ? (
            // Edit Form
            <div className="edit-form">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Value</label>
                <input
                  type="number"
                  value={editData.value || ''}
                  onChange={e => setEditData(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  value={editData.priority || 'medium'}
                  onChange={e => setEditData(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={editData.status || 'active'}
                  onChange={e => setEditData(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <option value="active">Active</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="paused">Paused</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={e => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button className="btn-primary" onClick={handleSave} disabled={loading}>
                  Save
                </button>
                <button className="btn-secondary" onClick={() => setIsEditing(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <>
              {/* Info */}
              <div className="entity-info">
                <div className="info-group">
                  <label>Type</label>
                  <span className="value">{entity.entity_type}</span>
                </div>
                <div className="info-group">
                  <label>Priority</label>
                  <span className="value">{entity.priority}</span>
                </div>
                <div className="info-group">
                  <label>Status</label>
                  <span className="value">{entity.status}</span>
                </div>
                {entity.value && (
                  <div className="info-group">
                    <label>Value</label>
                    <span className="value">
                      {entity.currency} {entity.value.toLocaleString()}
                    </span>
                  </div>
                )}
                {entity.expected_close_date && (
                  <div className="info-group">
                    <label>Expected Close Date</label>
                    <span className="value">{new Date(entity.expected_close_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {/* History Timeline */}
              {history.length > 0 && (
                <div className="history-section">
                  <h3>Activity History</h3>
                  <div className="history-timeline">
                    {history.map(entry => (
                      <div key={entry.id} className="history-entry">
                        <div className="history-icon">
                          {entry.action === 'moved' && '→'}
                          {entry.action === 'created' && '+'}
                          {entry.action === 'updated' && '✎'}
                          {entry.action === 'deleted' && '✕'}
                          {entry.action === 'noted' && '📝'}
                        </div>
                        <div className="history-content">
                          <p className="history-action">{entry.action}</p>
                          {entry.change_reason && <small>{entry.change_reason}</small>}
                          <small className="history-date">
                            {new Date(entry.created_at).toLocaleString()}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {entity.notes && (
                <div className="notes-section">
                  <h3>Notes</h3>
                  <p>{entity.notes}</p>
                </div>
              )}

              {/* Tags */}
              {entity.tags && entity.tags.length > 0 && (
                <div className="tags-section">
                  <h3>Tags</h3>
                  <div className="tags-list">
                    {entity.tags.map((tag, idx) => (
                      <span key={idx} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button className="btn-primary" onClick={() => setIsEditing(true)}>
                  Edit
                </button>
                <button className="btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EntityDetail;

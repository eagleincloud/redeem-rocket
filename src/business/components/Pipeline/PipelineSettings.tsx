/**
 * PipelineSettings Component
 * Manage pipeline stages: add, edit, remove, reorder
 * Location: src/business/components/Pipeline/PipelineSettings.tsx
 */

import React, { useState, useCallback, useMemo } from 'react';
import { PipelineStage, CreateStageRequest, UpdateStageRequest } from '../../types/pipeline';
import {
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from '../../../app/api/pipeline';
import './PipelineSettings.css';

interface PipelineSettingsProps {
  pipelineId: string;
  stages: PipelineStage[];
  onStagesUpdated?: (stages: PipelineStage[]) => void;
  onClose?: () => void;
}

interface NewStageForm {
  name: string;
  color: string;
  description: string;
  isWinStage: boolean;
  isTerminal: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#10B981', // Green
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

const PipelineSettings: React.FC<PipelineSettingsProps> = ({
  pipelineId,
  stages,
  onStagesUpdated,
  onClose,
}) => {
  const [localStages, setLocalStages] = useState<PipelineStage[]>(stages);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newStageForm, setNewStageForm] = useState<NewStageForm>({
    name: '',
    color: DEFAULT_COLORS[0],
    description: '',
    isWinStage: false,
    isTerminal: false,
  });
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);

  const handleAddStage = useCallback(async () => {
    if (!newStageForm.name.trim()) {
      setError('Stage name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nextOrder = Math.max(...localStages.map(s => s.order_index), -1) + 1;

      const createRequest: CreateStageRequest = {
        name: newStageForm.name.trim(),
        color: newStageForm.color,
        description: newStageForm.description.trim(),
        is_win_stage: newStageForm.isWinStage,
        is_terminal: newStageForm.isTerminal,
        probability_weight: newStageForm.isWinStage ? 1 : 0.5,
      };

      const newStage = await createStage(pipelineId, createRequest);

      const updatedStages = [...localStages, newStage];
      setLocalStages(updatedStages);
      onStagesUpdated?.(updatedStages);

      setNewStageForm({
        name: '',
        color: DEFAULT_COLORS[0],
        description: '',
        isWinStage: false,
        isTerminal: false,
      });
      setIsAddingStage(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stage');
    } finally {
      setLoading(false);
    }
  }, [pipelineId, newStageForm, localStages, onStagesUpdated]);

  const handleUpdateStage = useCallback(
    async (stageId: string, updates: Partial<PipelineStage>) => {
      try {
        setLoading(true);
        setError(null);

        const updateRequest: UpdateStageRequest = {
          name: updates.name,
          color: updates.color,
          description: updates.description,
          is_win_stage: updates.is_win_stage,
          is_terminal: updates.is_terminal,
        };

        await updateStage(stageId, updateRequest);

        const updatedStages = localStages.map(s =>
          s.id === stageId ? { ...s, ...updates } : s
        );
        setLocalStages(updatedStages);
        onStagesUpdated?.(updatedStages);
        setEditingStageId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update stage');
      } finally {
        setLoading(false);
      }
    },
    [localStages, onStagesUpdated]
  );

  const handleDeleteStage = useCallback(
    async (stageId: string) => {
      if (!confirm('Delete this stage? Entities in this stage must be moved first.')) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        await deleteStage(stageId);

        const updatedStages = localStages.filter(s => s.id !== stageId);
        setLocalStages(updatedStages);
        onStagesUpdated?.(updatedStages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete stage');
      } finally {
        setLoading(false);
      }
    },
    [localStages, onStagesUpdated]
  );

  const handleDragStart = (stageId: string) => {
    setDraggedStageId(stageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (targetStageId: string) => {
    if (!draggedStageId || draggedStageId === targetStageId) {
      setDraggedStageId(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const draggedIndex = localStages.findIndex(s => s.id === draggedStageId);
      const targetIndex = localStages.findIndex(s => s.id === targetStageId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const newStages = [...localStages];
      const [movedStage] = newStages.splice(draggedIndex, 1);
      newStages.splice(targetIndex, 0, movedStage);

      const stagesWithUpdatedOrder = newStages.map((stage, idx) => ({
        ...stage,
        order_index: idx,
      }));

      const stageIds = stagesWithUpdatedOrder.map(s => s.id);
      await reorderStages(pipelineId, stageIds);

      setLocalStages(stagesWithUpdatedOrder);
      onStagesUpdated?.(stagesWithUpdatedOrder);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder stages');
    } finally {
      setLoading(false);
      setDraggedStageId(null);
    }
  };

  const sortedStages = useMemo(
    () => [...localStages].sort((a, b) => a.order_index - b.order_index),
    [localStages]
  );

  return (
    <div className="pipeline-settings">
      <div className="settings-header">
        <h2>Pipeline Configuration</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="stages-list">
        <h3>Pipeline Stages</h3>

        {sortedStages.length === 0 ? (
          <div className="empty-stages">
            <p>No stages configured. Add your first stage to get started.</p>
          </div>
        ) : (
          <div className="stages-reorderable">
            {sortedStages.map((stage) => (
              <div
                key={stage.id}
                className={`stage-row ${editingStageId === stage.id ? 'editing' : ''} ${
                  draggedStageId === stage.id ? 'dragging' : ''
                }`}
                draggable
                onDragStart={() => handleDragStart(stage.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage.id)}
              >
                <div className="drag-handle">⋮⋮</div>

                {editingStageId === stage.id ? (
                  <div className="stage-edit-form">
                    <input
                      type="text"
                      placeholder="Stage name"
                      value={stage.name}
                      onChange={e =>
                        handleUpdateStage(stage.id, { ...stage, name: e.target.value })
                      }
                      disabled={loading}
                    />
                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={stage.is_win_stage}
                          onChange={e =>
                            handleUpdateStage(stage.id, {
                              ...stage,
                              is_win_stage: e.target.checked,
                            })
                          }
                          disabled={loading}
                        />
                        <span>Win Stage</span>
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={stage.is_terminal}
                          onChange={e =>
                            handleUpdateStage(stage.id, {
                              ...stage,
                              is_terminal: e.target.checked,
                            })
                          }
                          disabled={loading}
                        />
                        <span>Final Stage</span>
                      </label>
                    </div>
                    <div className="edit-actions">
                      <button
                        className="btn-save"
                        onClick={() => setEditingStageId(null)}
                        disabled={loading}
                      >
                        Done
                      </button>
                      <button
                        className="btn-cancel"
                        onClick={() => setEditingStageId(null)}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="stage-view">
                    <div className="stage-visual">
                      <div
                        className="color-swatch"
                        style={{ backgroundColor: stage.color }}
                      ></div>
                      <div className="stage-info">
                        <h4>{stage.name}</h4>
                        <div className="stage-badges">
                          {stage.is_win_stage && <span className="badge win">WIN</span>}
                          {stage.is_terminal && <span className="badge terminal">FINAL</span>}
                        </div>
                      </div>
                    </div>

                    <div className="stage-actions">
                      <button
                        className="btn-icon"
                        onClick={() => setEditingStageId(stage.id)}
                        disabled={loading}
                        title="Edit stage"
                      >
                        ✎
                      </button>
                      <button
                        className="btn-icon danger"
                        onClick={() => handleDeleteStage(stage.id)}
                        disabled={loading}
                        title="Delete stage"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="add-stage-section">
        {!isAddingStage ? (
          <button
            className="btn-add-stage"
            onClick={() => setIsAddingStage(true)}
            disabled={loading}
          >
            + Add Stage
          </button>
        ) : (
          <div className="add-stage-form">
            <h3>New Stage</h3>

            <div className="form-group">
              <label htmlFor="stage-name">Stage Name*</label>
              <input
                id="stage-name"
                type="text"
                placeholder="e.g., Qualified, Proposal, Negotiation"
                value={newStageForm.name}
                onChange={e =>
                  setNewStageForm({ ...newStageForm, name: e.target.value })
                }
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="stage-color">Color</label>
              <div className="color-picker">
                {DEFAULT_COLORS.map(color => (
                  <button
                    key={color}
                    className={`color-option ${newStageForm.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewStageForm({ ...newStageForm, color })}
                    disabled={loading}
                    title={color}
                  ></button>
                ))}
              </div>
            </div>

            <div className="form-group checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={newStageForm.isWinStage}
                  onChange={e =>
                    setNewStageForm({ ...newStageForm, isWinStage: e.target.checked })
                  }
                  disabled={loading}
                />
                <span>This is a win stage</span>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={newStageForm.isTerminal}
                  onChange={e =>
                    setNewStageForm({ ...newStageForm, isTerminal: e.target.checked })
                  }
                  disabled={loading}
                />
                <span>This is a final stage</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                className="btn-primary"
                onClick={handleAddStage}
                disabled={loading || !newStageForm.name.trim()}
              >
                {loading ? 'Adding...' : 'Add Stage'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setIsAddingStage(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="settings-info">
        <p>
          <strong>Tip:</strong> Drag stages to reorder. Mark as Win/Final to track outcomes.
        </p>
      </div>
    </div>
  );
};

export default PipelineSettings;

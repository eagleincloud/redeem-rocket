/**
 * Pipeline Stage Editor Component
 * Layer 4 - Rename stages, change colors, reorder, set criteria
 * Part of Configurable System
 */

import React, { useState, useCallback } from 'react';
import { updatePipelineStages, PipelineStageConfig } from '@/app/api/configurable-system';

interface PipelineStageEditorProps {
  businessId: string;
  pipelineId: string;
  stages: PipelineStageConfig[];
  onSave?: (stages: PipelineStageConfig[]) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface StageFormData {
  stageName: string;
  stageColor: string;
  stageIcon?: string;
  description?: string;
  isTerminalStage: boolean;
  autoArchiveAfterDays?: number;
  warnAfterDays?: number;
  canSkipStage: boolean;
  requiredFieldsToAdvance?: string[];
}

const STAGE_COLORS = [
  '#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4', '#eab308', '#6366f1',
];

const PipelineStageEditor = React.memo<PipelineStageEditorProps>(function PipelineStageEditor({
  businessId,
  pipelineId,
  stages: initialStages,
  onSave,
  onCancel,
  isLoading = false,
}) {
  const [stages, setStages] = useState<any[]>(
    initialStages.map((s, idx) => ({
      id: s.id,
      stageName: s.stageName,
      stageColor: s.stageColor,
      stageIcon: s.stageIcon,
      description: s.description,
      isTerminalStage: s.isTerminalStage,
      autoArchiveAfterDays: s.autoArchiveAfterDays,
      warnAfterDays: s.warnAfterDays,
      canSkipStage: s.canSkipStage,
      requiredFieldsToAdvance: s.requiredFieldsToAdvance,
      stageOrder: idx,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingStage, setEditingStage] = useState<StageFormData | null>(null);

  const handleAddStage = useCallback(() => {
    const newStage = {
      stageName: `Stage ${stages.length + 1}`,
      stageColor: STAGE_COLORS[stages.length % STAGE_COLORS.length],
      isTerminalStage: false,
      canSkipStage: true,
      stageOrder: stages.length,
    };
    setStages([...stages, newStage]);
  }, [stages.length]);

  const handleRemoveStage = useCallback((index: number) => {
    if (stages.length <= 1) {
      setSaveError('Pipeline must have at least one stage');
      return;
    }
    const newStages = stages.filter((_, i) => i !== index);
    setStages(newStages.map((s, idx) => ({ ...s, stageOrder: idx })));
  }, [stages.length]);

  const handleStartEdit = useCallback((index: number) => {
    const stage = stages[index];
    setEditingIndex(index);
    setEditingStage({
      stageName: stage.stageName,
      stageColor: stage.stageColor,
      stageIcon: stage.stageIcon,
      description: stage.description,
      isTerminalStage: stage.isTerminalStage,
      autoArchiveAfterDays: stage.autoArchiveAfterDays,
      warnAfterDays: stage.warnAfterDays,
      canSkipStage: stage.canSkipStage,
      requiredFieldsToAdvance: stage.requiredFieldsToAdvance,
    });
  }, [stages]);

  const handleUpdateEditingStage = useCallback((field: keyof StageFormData, value: any) => {
    if (editingStage) {
      setEditingStage({ ...editingStage, [field]: value });
    }
  }, [editingStage]);

  const handleSaveEdit = useCallback(() => {
    if (!editingStage || editingIndex === null) return;
    if (!editingStage.stageName.trim()) {
      setSaveError('Stage name is required');
      return;
    }
    const newStages = [...stages];
    newStages[editingIndex] = { ...editingStage, stageOrder: editingIndex };
    setStages(newStages);
    setEditingIndex(null);
    setEditingStage(null);
    setSaveError(null);
  }, [editingStage, editingIndex, stages]);

  const handleSave = useCallback(async () => {
    if (editingIndex !== null) {
      setSaveError('Please save or cancel the current edit');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const stagesToUpdate = stages.map((stage, index) => ({
        stageName: stage.stageName,
        stageOrder: index,
        stageColor: stage.stageColor,
        stageIcon: stage.stageIcon,
        description: stage.description,
        isTerminalStage: stage.isTerminalStage,
        autoArchiveAfterDays: stage.autoArchiveAfterDays,
        warnAfterDays: stage.warnAfterDays,
        canSkipStage: stage.canSkipStage,
        requiredFieldsToAdvance: stage.requiredFieldsToAdvance,
      }));
      const updatedStages = await updatePipelineStages(
        businessId,
        pipelineId,
        stagesToUpdate as any
      );
      onSave?.(updatedStages);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save stages');
    } finally {
      setIsSaving(false);
    }
  }, [stages, businessId, pipelineId, onSave, editingIndex]);

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pipeline Stages</h2>
        <button
          onClick={handleAddStage}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          + Add Stage
        </button>
      </div>

      {saveError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{saveError}</p>
        </div>
      )}

      <div className="space-y-3">
        {stages.map((stage, index) => (
          <StageEditorRow
            key={index}
            index={index}
            stage={stage}
            isEditing={editingIndex === index}
            editingStage={editingStage}
            onStartEdit={() => handleStartEdit(index)}
            onUpdateField={handleUpdateEditingStage}
            onSaveEdit={handleSaveEdit}
            onRemove={() => handleRemoveStage(index)}
            onCancel={() => {
              setEditingIndex(null);
              setEditingStage(null);
            }}
          />
        ))}
      </div>

      <div className="flex gap-3 justify-end border-t pt-6">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || isLoading || editingIndex !== null}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Stages'}
        </button>
      </div>
    </div>
  );
});

interface StageEditorRowProps {
  index: number;
  stage: any;
  isEditing: boolean;
  editingStage: StageFormData | null;
  onStartEdit: () => void;
  onUpdateField: (field: keyof StageFormData, value: any) => void;
  onSaveEdit: () => void;
  onRemove: () => void;
  onCancel: () => void;
}

const StageEditorRow = React.memo<StageEditorRowProps>(function StageEditorRow({
  index,
  stage,
  isEditing,
  editingStage,
  onStartEdit,
  onUpdateField,
  onSaveEdit,
  onRemove,
  onCancel,
}) {
  if (isEditing) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage Name</label>
            <input
              type="text"
              value={editingStage?.stageName || ''}
              onChange={(e) => onUpdateField('stageName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={editingStage?.stageColor || '#f97316'}
              onChange={(e) => onUpdateField('stageColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={editingStage?.description || ''}
            onChange={(e) => onUpdateField('description', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe this stage..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editingStage?.isTerminalStage || false}
              onChange={(e) => onUpdateField('isTerminalStage', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Terminal Stage</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={editingStage?.canSkipStage ?? true}
              onChange={(e) => onUpdateField('canSkipStage', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Can Skip</span>
          </label>
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-gray-700 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSaveEdit}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-center gap-4 hover:bg-gray-100 transition">
      <div
        className="w-6 h-6 rounded flex-shrink-0"
        style={{ backgroundColor: stage.stageColor }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">{stage.stageName}</h3>
          {stage.isTerminalStage && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">Final</span>
          )}
        </div>
        {stage.description && (
          <p className="text-xs text-gray-600 mt-1">{stage.description}</p>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onStartEdit}
          className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200"
        >
          Edit
        </button>
        <button
          onClick={onRemove}
          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded border border-red-200"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

export default PipelineStageEditor;

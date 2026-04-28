/**
 * DragDropFieldBuilder Component
 * Advanced drag-drop interface for custom field configuration
 */

import React, { useState, useCallback } from 'react';
import { GripVertical, Plus, Trash2, Edit2, Eye, EyeOff, Copy, ChevronDown, ChevronUp } from 'lucide-react';

interface Field {
  id: string;
  fieldName: string;
  fieldSlug: string;
  fieldType: string;
  isRequired: boolean;
  showInForm?: boolean;
  helpText?: string;
  placeholderText?: string;
  defaultValue?: string;
  options?: any[];
  isSystem?: boolean;
  orderIndex?: number;
}

interface Props {
  fields: Field[];
  onFieldsReorder?: (fields: Field[]) => void;
  onFieldAdd?: () => void;
  onFieldEdit?: (field: Field) => void;
  onFieldDelete?: (fieldId: string) => void;
  onFieldDuplicate?: (field: Field) => void;
  onFieldVisibilityToggle?: (fieldId: string, visible: boolean) => void;
  isLoading?: boolean;
}

export const DragDropFieldBuilder: React.FC<Props> = ({
  fields,
  onFieldsReorder,
  onFieldAdd,
  onFieldEdit,
  onFieldDelete,
  onFieldDuplicate,
  onFieldVisibilityToggle,
  isLoading = false,
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedId(fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      return;
    }

    const draggedIdx = fields.findIndex(f => f.id === draggedId);
    const targetIdx = fields.findIndex(f => f.id === targetId);

    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newFields = [...fields];
      const [dragged] = newFields.splice(draggedIdx, 1);
      newFields.splice(targetIdx, 0, dragged);
      newFields.forEach((f, i) => f.orderIndex = i);
      onFieldsReorder?.(newFields);
    }
    setDraggedId(null);
  };

  const toggleSelection = (fieldId: string) => {
    const newSet = new Set(selectedIds);
    newSet.has(fieldId) ? newSet.delete(fieldId) : newSet.add(fieldId);
    setSelectedIds(newSet);
  };

  const stats = {
    total: fields.length,
    required: fields.filter(f => f.isRequired).length,
    hidden: fields.filter(f => !f.showInForm).length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} fields • {stats.required} required • {stats.hidden} hidden
          </p>
        </div>
        <button
          onClick={onFieldAdd}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus size={18} />
          Add Field
        </button>
      </div>

      {selectedIds.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-900">{selectedIds.size} selected</span>
          <button
            onClick={() => selectedIds.forEach(id => onFieldDelete?.(id))}
            className="text-sm px-3 py-1 bg-red-50 border border-red-200 text-red-700 rounded hover:bg-red-100"
          >
            <Trash2 size={16} className="inline mr-1" />
            Delete
          </button>
        </div>
      )}

      <div className="space-y-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
        {fields.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No custom fields yet</p>
          </div>
        ) : (
          fields.map(field => (
            <div
              key={field.id}
              draggable
              onDragStart={e => handleDragStart(e, field.id)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, field.id)}
              className={`border-b last:border-b-0 p-4 ${draggedId === field.id ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.has(field.id)}
                  onChange={() => toggleSelection(field.id)}
                  className="w-4 h-4"
                />
                <GripVertical size={18} className="text-gray-400" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{field.fieldName}</h4>
                  <p className="text-sm text-gray-500">{field.fieldSlug}</p>
                </div>
                <button onClick={() => onFieldVisibilityToggle?.(field.id, !field.showInForm)}>
                  {field.showInForm ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <button onClick={() => onFieldEdit?.(field)}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onFieldDuplicate?.(field)}>
                  <Copy size={18} />
                </button>
                <button onClick={() => onFieldDelete?.(field.id)}>
                  <Trash2 size={18} />
                </button>
                <button onClick={() => setExpandedId(expandedId === field.id ? null : field.id)}>
                  {expandedId === field.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {expandedId === field.id && (
                <div className="border-t mt-3 pt-3 text-sm text-gray-600 space-y-1">
                  {field.helpText && <p><strong>Help:</strong> {field.helpText}</p>}
                  {field.defaultValue && <p><strong>Default:</strong> {field.defaultValue}</p>}
                  {field.options && <p><strong>Options:</strong> {field.options.length} items</p>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DragDropFieldBuilder;

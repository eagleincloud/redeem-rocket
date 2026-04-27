/**
 * CustomFieldsManager Component
 * Phase 4: Complete UI for managing custom fields
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Edit2,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { FieldForm, FieldFormData, FieldType } from './FieldForm';
import { FieldPreview } from './FieldPreview';
import { FieldTypeSelector } from './FieldTypeSelector';

interface CustomField {
  id: string;
  field_name: string;
  field_slug: string;
  field_type: FieldType;
  description?: string;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

interface CustomFieldsManagerProps {
  businessId: string;
  onFieldsChange?: (fields: CustomField[]) => void;
}

type ManagerView = 'list' | 'create' | 'edit' | 'preview';

export const CustomFieldsManager: React.FC<CustomFieldsManagerProps> = ({
  businessId,
  onFieldsChange,
}) => {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [view, setView] = useState<ManagerView>('list');
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<FieldFormData | null>(null);

  // Load fields on mount
  useEffect(() => {
    loadFields();
  }, [businessId]);

  const loadFields = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const data = await fetchCustomFields(businessId);
      // setFields(data);
      setFields([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load fields');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateField = async (data: FieldFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // await createCustomField(businessId, data);
      const newField: CustomField = {
        id: Math.random().toString(36).substr(2, 9),
        field_name: data.field_name,
        field_slug: data.field_slug,
        field_type: data.field_type,
        description: data.description,
        is_required: data.is_required,
        order_index: fields.length,
        created_at: new Date().toISOString(),
      };

      setFields((prev) => [...prev, newField]);
      onFieldsChange?.([...fields, newField]);
      setSuccess('Field created successfully');
      setView('list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create field');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateField = async (data: FieldFormData) => {
    if (!selectedFieldId) return;

    setIsSaving(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // await updateCustomField(selectedFieldId, businessId, data);
      setFields((prev) =>
        prev.map((f) =>
          f.id === selectedFieldId
            ? {
                ...f,
                field_name: data.field_name,
                field_slug: data.field_slug,
                field_type: data.field_type,
                description: data.description,
                is_required: data.is_required,
              }
            : f
        )
      );
      setSuccess('Field updated successfully');
      setView('list');
      setSelectedFieldId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update field');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    setError(null);
    try {
      // TODO: Replace with actual API call
      // await deleteCustomField(fieldId, businessId);
      const updated = fields.filter((f) => f.id !== fieldId);
      setFields(updated);
      onFieldsChange?.(updated);
      setSuccess('Field deleted successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
    }
  };

  const handleReorderFields = async (draggedId: string, targetId: string) => {
    const draggedIndex = fields.findIndex((f) => f.id === draggedId);
    const targetIndex = fields.findIndex((f) => f.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedIndex, 1);
    newFields.splice(targetIndex, 0, draggedField);

    // Update order indices
    const updatedFields = newFields.map((f, i) => ({
      ...f,
      order_index: i,
    }));

    setFields(updatedFields);
    onFieldsChange?.(updatedFields);

    // TODO: Send reorder to API
    // await reorderCustomFields(businessId, orderMap);
  };

  const handlePreviewField = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      // Convert field to preview data
      const previewData: FieldFormData = {
        field_name: field.field_name,
        field_slug: field.field_slug,
        field_type: field.field_type,
        is_required: field.is_required,
        field_options: [],
        validation_rules: {},
        config: {
          showInForm: true,
          showInList: true,
          searchable: false,
          sortable: false,
        },
      };
      setPreviewData(previewData);
      setView('preview');
    }
  };

  const renderListView = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
          <p className="text-sm text-gray-600">
            {fields.length} field{fields.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedFieldId(null);
            setView('create');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Field
        </button>
      </div>

      {/* Fields List */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading fields...</div>
      ) : fields.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-600 mb-2">No custom fields yet</p>
          <p className="text-sm text-gray-500">
            Create your first field to get started
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => setDraggedId(field.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleReorderFields(draggedId!, field.id)}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 group"
            >
              <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />

              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{field.field_name}</div>
                <div className="text-sm text-gray-600">
                  {field.field_type}
                  {field.is_required && ' • Required'}
                </div>
              </div>

              {field.description && (
                <div className="hidden sm:block text-sm text-gray-600 max-w-xs truncate">
                  {field.description}
                </div>
              )}

              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handlePreviewField(field.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  title="Preview"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSelectedFieldId(field.id);
                    setView('edit');
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteField(field.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateView = () => (
    <div className="space-y-6">
      <button
        onClick={() => setView('list')}
        className="text-sm text-gray-600 hover:text-gray-900"
      >
        ← Back to Fields
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create New Field
          </h2>
          <FieldForm
            onSubmit={handleCreateField}
            onCancel={() => setView('list')}
            isLoading={isSaving}
            mode="create"
          />
        </div>

        {previewData && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <FieldPreview field={previewData} />
          </div>
        )}
      </div>
    </div>
  );

  const renderEditView = () => {
    const field = fields.find((f) => f.id === selectedFieldId);
    if (!field) return null;

    const initialData: FieldFormData = {
      field_name: field.field_name,
      field_slug: field.field_slug,
      field_type: field.field_type,
      description: field.description,
      is_required: field.is_required,
      field_options: [],
      validation_rules: {},
      config: {
        showInForm: true,
        showInList: true,
        searchable: false,
        sortable: false,
      },
    };

    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setView('list');
            setSelectedFieldId(null);
          }}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Fields
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Field
            </h2>
            <FieldForm
              initialData={initialData}
              onSubmit={handleUpdateField}
              onCancel={() => {
                setView('list');
                setSelectedFieldId(null);
              }}
              isLoading={isSaving}
              mode="edit"
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <FieldPreview field={initialData} />
          </div>
        </div>
      </div>
    );
  };

  const renderPreviewView = () => {
    if (!previewData) return null;

    return (
      <div className="space-y-6">
        <button
          onClick={() => setView('list')}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to Fields
        </button>

        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Field Preview: {previewData.field_name}
          </h2>
          <FieldPreview field={previewData} />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Content */}
      {view === 'list' && renderListView()}
      {view === 'create' && renderCreateView()}
      {view === 'edit' && renderEditView()}
      {view === 'preview' && renderPreviewView()}
    </div>
  );
};

CustomFieldsManager.displayName = 'CustomFieldsManager';

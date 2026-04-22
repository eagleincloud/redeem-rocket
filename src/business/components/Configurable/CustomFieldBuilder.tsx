/**
 * CustomFieldBuilder Component
 * Phase 3: Create and manage custom fields for pipelines
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';
import { CustomField, FieldType, FieldOption, ValidationRules } from '../../types/configurable';
import {
  createCustomField,
  updateCustomField,
  deleteCustomField,
  listCustomFields,
  bulkReorderCustomFields,
  CreateCustomFieldRequest,
} from '../../../app/api/configurable';

interface CustomFieldBuilderProps {
  businessId: string;
  onFieldsChange?: (fields: CustomField[]) => void;
}

interface FormField {
  field_name: string;
  field_type: FieldType;
  display_type: string;
  description: string;
  is_required: boolean;
  options: FieldOption[];
  validation_rules: ValidationRules;
}

export const CustomFieldBuilder = React.memo(function CustomFieldBuilder({
  businessId,
  onFieldsChange,
}: CustomFieldBuilderProps) {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormField>({
    field_name: '',
    field_type: FieldType.TEXT,
    display_type: 'text',
    description: '',
    is_required: false,
    options: [],
    validation_rules: {},
  });

  React.useEffect(() => {
    const loadFields = async () => {
      try {
        setIsLoading(true);
        const loadedFields = await listCustomFields(businessId);
        setFields(loadedFields);
        onFieldsChange?.(loadedFields);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fields');
      } finally {
        setIsLoading(false);
      }
    };

    loadFields();
  }, [businessId, onFieldsChange]);

  const resetForm = useCallback(() => {
    setFormData({
      field_name: '',
      field_type: FieldType.TEXT,
      display_type: 'text',
      description: '',
      is_required: false,
      options: [],
      validation_rules: {},
    });
    setEditingId(null);
    setShowNewFieldForm(false);
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!formData.field_name.trim()) {
      setError('Field name is required');
      return false;
    }

    if (
      (formData.field_type === FieldType.DROPDOWN || formData.field_type === FieldType.MULTISELECT) &&
      formData.options.length === 0
    ) {
      setError('At least one option is required for dropdowns/multiselect');
      return false;
    }

    return true;
  }, [formData]);

  const handleSaveField = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      const request: CreateCustomFieldRequest = {
        field_name: formData.field_name,
        field_type: formData.field_type,
        display_type: formData.display_type,
        description: formData.description,
        is_required: formData.is_required,
        config: {
          options: formData.options,
          validationRules: formData.validation_rules,
        },
      };

      if (editingId) {
        const updated = await updateCustomField(editingId, businessId, request);
        setFields((prev) =>
          prev.map((f) => (f.id === editingId ? updated : f))
        );
        setSuccess('Field updated successfully');
      } else {
        const created = await createCustomField(businessId, request);
        setFields((prev) => [...prev, created]);
        setSuccess('Field created successfully');
      }

      resetForm();
      onFieldsChange?.(fields);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save field');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      setError(null);
      await deleteCustomField(fieldId, businessId);
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      setSuccess('Field deleted successfully');
      onFieldsChange?.(fields.filter((f) => f.id !== fieldId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete field');
    }
  };

  const handleDragStart = (fieldId: string) => {
    setDraggedId(fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropAfter = async (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;

    try {
      const draggedIndex = fields.findIndex((f) => f.id === draggedId);
      const targetIndex = fields.findIndex((f) => f.id === targetId);

      if (draggedIndex === targetIndex) return;

      const newFields = [...fields];
      const [draggedField] = newFields.splice(draggedIndex, 1);
      newFields.splice(targetIndex, 0, draggedField);

      const orderMap = Object.fromEntries(
        newFields.map((f, i) => [f.id, i])
      );

      await bulkReorderCustomFields(businessId, orderMap);
      setFields(newFields);
      setDraggedId(null);
      setSuccess('Fields reordered successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder fields');
    }
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, { value: '', label: '' }],
    }));
  };

  const updateOption = (index: number, field: keyof FieldOption, value: string) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const fieldTypeOptions = useMemo(
    () => [
      { value: FieldType.TEXT, label: 'Text' },
      { value: FieldType.NUMBER, label: 'Number' },
      { value: FieldType.DATE, label: 'Date' },
      { value: FieldType.EMAIL, label: 'Email' },
      { value: FieldType.PHONE, label: 'Phone' },
      { value: FieldType.URL, label: 'URL' },
      { value: FieldType.CHECKBOX, label: 'Checkbox' },
      { value: FieldType.DROPDOWN, label: 'Dropdown' },
      { value: FieldType.MULTISELECT, label: 'Multi-Select' },
      { value: FieldType.RICH_TEXT, label: 'Rich Text' },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {showNewFieldForm && (
        <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Field' : 'Create New Field'}
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name *
              </label>
              <input
                type="text"
                value={formData.field_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, field_name: e.target.value }))
                }
                placeholder="e.g., Company Size"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type *
              </label>
              <select
                value={formData.field_type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    field_type: e.target.value as FieldType,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                {fieldTypeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="required"
              checked={formData.is_required}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, is_required: e.target.checked }))
              }
              className="w-4 h-4 rounded"
            />
            <label htmlFor="required" className="text-sm font-medium">
              Required field
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveField}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Field'}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!showNewFieldForm && (
        <button
          onClick={() => setShowNewFieldForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Custom Field
        </button>
      )}

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading fields...</div>
        ) : fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No custom fields yet. Create your first field above!
          </div>
        ) : (
          fields.map((field) => (
            <div
              key={field.id}
              draggable
              onDragStart={() => handleDragStart(field.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDropAfter(field.id)}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <GripVertical className="w-5 h-5 text-gray-400" />

              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{field.field_name}</div>
                <div className="text-sm text-gray-600">{field.field_type}</div>
              </div>

              <button
                onClick={() => handleDeleteField(field.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
});

CustomFieldBuilder.displayName = 'CustomFieldBuilder';

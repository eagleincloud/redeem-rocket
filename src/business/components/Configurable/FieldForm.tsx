/**
 * FieldForm Component
 * Phase 4: Create and edit custom fields with full configuration
 */

import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'phone';

export interface FieldOption {
  label: string;
  value: string;
  color?: string;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  customMessage?: string;
}

export interface FieldFormData {
  field_name: string;
  field_slug: string;
  field_type: FieldType;
  description?: string;
  is_required: boolean;
  default_value?: string;
  placeholder_text?: string;
  help_text?: string;
  field_options: FieldOption[];
  validation_rules: ValidationRules;
  config: {
    showInList: boolean;
    showInForm: boolean;
    searchable: boolean;
    sortable: boolean;
  };
}

interface FieldFormProps {
  initialData?: Partial<FieldFormData>;
  onSubmit: (data: FieldFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

const FIELD_TYPES: Array<{ value: FieldType; label: string; icon: string }> = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'select', label: 'Dropdown', icon: '📋' },
];

export const FieldForm: React.FC<FieldFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<FieldFormData>(
    initialData || {
      field_name: '',
      field_slug: '',
      field_type: 'text',
      description: '',
      is_required: false,
      default_value: '',
      placeholder_text: '',
      help_text: '',
      field_options: [],
      validation_rules: {},
      config: {
        showInList: true,
        showInForm: true,
        searchable: false,
        sortable: false,
      },
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'basic' | 'validation' | 'options'>('basic');

  // Generate slug from field name
  const updateFieldName = useCallback((name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    setFormData((prev) => ({
      ...prev,
      field_name: name,
      field_slug: slug,
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.field_name.trim()) {
      newErrors.field_name = 'Field name is required';
    }

    if (!formData.field_type) {
      newErrors.field_type = 'Field type is required';
    }

    if (
      (formData.field_type === 'select') &&
      formData.field_options.length === 0
    ) {
      newErrors.field_options = 'At least one option is required for dropdowns';
    }

    if (formData.field_type === 'email' && formData.default_value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.default_value)) {
        newErrors.default_value = 'Invalid email format';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      field_options: [...prev.field_options, { label: '', value: '' }],
    }));
  };

  const updateOption = (
    index: number,
    field: keyof FieldOption,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      field_options: prev.field_options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const removeOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      field_options: prev.field_options.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['basic', 'validation', 'options'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'basic'
              ? 'Basic'
              : tab === 'validation'
              ? 'Validation'
              : 'Options'}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Name *
            </label>
            <input
              type="text"
              value={formData.field_name}
              onChange={(e) => updateFieldName(e.target.value)}
              placeholder="e.g., Company Size"
              className={`w-full px-3 py-2 border rounded-lg ${
                errors.field_name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.field_name && (
              <p className="mt-1 text-sm text-red-600">{errors.field_name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Slug (auto-generated)
            </label>
            <input
              type="text"
              value={formData.field_slug}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Type *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      field_type: type.value,
                    }))
                  }
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    formData.field_type === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                </button>
              ))}
            </div>
            {errors.field_type && (
              <p className="mt-1 text-sm text-red-600">{errors.field_type}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe what this field is used for"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text
            </label>
            <input
              type="text"
              value={formData.help_text || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  help_text: e.target.value,
                }))
              }
              placeholder="Short hint for users"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {formData.field_type !== 'checkbox' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Placeholder Text
              </label>
              <input
                type="text"
                value={formData.placeholder_text || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    placeholder_text: e.target.value,
                  }))
                }
                placeholder="Text shown in empty field"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {formData.field_type !== 'checkbox' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default Value
              </label>
              <input
                type="text"
                value={formData.default_value || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    default_value: e.target.value,
                  }))
                }
                placeholder="Value shown by default"
                className={`w-full px-3 py-2 border rounded-lg ${
                  errors.default_value ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.default_value && (
                <p className="mt-1 text-sm text-red-600">{errors.default_value}</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required"
              checked={formData.is_required}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  is_required: e.target.checked,
                }))
              }
              className="w-4 h-4 rounded"
            />
            <label htmlFor="required" className="text-sm font-medium">
              This field is required
            </label>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Display Options</label>
            <div className="space-y-2">
              {['showInForm', 'showInList', 'searchable', 'sortable'].map((option) => (
                <div key={option} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={option}
                    checked={
                      formData.config[option as keyof typeof formData.config]
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          [option]: e.target.checked,
                        },
                      }))
                    }
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor={option} className="text-sm text-gray-600">
                    {option === 'showInForm'
                      ? 'Show in form'
                      : option === 'showInList'
                      ? 'Show in list'
                      : option === 'searchable'
                      ? 'Searchable'
                      : 'Sortable'}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Validation Tab */}
      {activeTab === 'validation' && (
        <div className="space-y-4">
          {(formData.field_type === 'number' ||
            formData.field_type === 'text') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum{' '}
                  {formData.field_type === 'text' ? 'Length' : 'Value'}
                </label>
                <input
                  type="number"
                  value={
                    formData.validation_rules[
                      formData.field_type === 'text'
                        ? 'minLength'
                        : 'min'
                    ] || ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validation_rules: {
                        ...prev.validation_rules,
                        [formData.field_type === 'text'
                          ? 'minLength'
                          : 'min']: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum{' '}
                  {formData.field_type === 'text' ? 'Length' : 'Value'}
                </label>
                <input
                  type="number"
                  value={
                    formData.validation_rules[
                      formData.field_type === 'text'
                        ? 'maxLength'
                        : 'max'
                    ] || ''
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      validation_rules: {
                        ...prev.validation_rules,
                        [formData.field_type === 'text'
                          ? 'maxLength'
                          : 'max']: e.target.value
                          ? parseInt(e.target.value)
                          : undefined,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}

          {formData.field_type === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Regex Pattern
              </label>
              <input
                type="text"
                value={formData.validation_rules.pattern || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validation_rules: {
                      ...prev.validation_rules,
                      pattern: e.target.value,
                    },
                  }))
                }
                placeholder="e.g., ^[A-Z0-9]*$"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Error Message
            </label>
            <input
              type="text"
              value={formData.validation_rules.customMessage || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  validation_rules: {
                    ...prev.validation_rules,
                    customMessage: e.target.value,
                  },
                }))
              }
              placeholder="Shown when validation fails"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Options Tab (for select fields) */}
      {activeTab === 'options' && (
        <div className="space-y-4">
          {formData.field_type === 'select' ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Options *
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  <Plus className="w-4 h-4" />
                  Add Option
                </button>
              </div>

              {errors.field_options && (
                <p className="text-sm text-red-600">{errors.field_options}</p>
              )}

              <div className="space-y-2">
                {formData.field_options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) =>
                        updateOption(index, 'label', e.target.value)
                      }
                      placeholder="Label (shown to user)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        updateOption(index, 'value', e.target.value)
                      }
                      placeholder="Value (stored)"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="color"
                      value={option.color || '#gray'}
                      onChange={(e) =>
                        updateOption(index, 'color', e.target.value)
                      }
                      className="w-10 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Options are only available for dropdown fields.
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-2 border-t border-gray-200 pt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Field' : 'Update Field'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

FieldForm.displayName = 'FieldForm';

/**
 * FieldPreview Component
 * Phase 4: Preview how custom fields will render in forms
 */

import React from 'react';
import { FieldFormData } from './FieldForm';

interface FieldPreviewProps {
  field: FieldFormData;
}

export const FieldPreview: React.FC<FieldPreviewProps> = ({ field }) => {
  const renderPreview = () => {
    const label = (
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {field.field_name}
        {field.is_required && <span className="text-red-600"> *</span>}
      </label>
    );

    const helpText = field.help_text && (
      <p className="text-xs text-gray-500 mt-1">{field.help_text}</p>
    );

    switch (field.field_type) {
      case 'text':
        return (
          <div>
            {label}
            <input
              type="text"
              placeholder={field.placeholder_text || 'Enter text'}
              value={field.default_value || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            {helpText}
          </div>
        );

      case 'number':
        return (
          <div>
            {label}
            <input
              type="number"
              placeholder={field.placeholder_text || 'Enter number'}
              value={field.default_value || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            {helpText}
          </div>
        );

      case 'email':
        return (
          <div>
            {label}
            <input
              type="email"
              placeholder={field.placeholder_text || 'Enter email'}
              value={field.default_value || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            {helpText}
          </div>
        );

      case 'phone':
        return (
          <div>
            {label}
            <input
              type="tel"
              placeholder={field.placeholder_text || '+1 (555) 000-0000'}
              value={field.default_value || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            {helpText}
          </div>
        );

      case 'date':
        return (
          <div>
            {label}
            <input
              type="date"
              value={field.default_value || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
            {helpText}
          </div>
        );

      case 'checkbox':
        return (
          <div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkbox-preview"
                disabled
                className="w-4 h-4 rounded"
              />
              <label htmlFor="checkbox-preview" className="text-sm font-medium text-gray-700">
                {field.field_name}
                {field.is_required && <span className="text-red-600"> *</span>}
              </label>
            </div>
            {helpText}
          </div>
        );

      case 'select':
        return (
          <div>
            {label}
            <select
              disabled
              defaultValue={field.default_value || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            >
              <option value="">
                {field.placeholder_text || 'Select an option'}
              </option>
              {field.field_options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {helpText}
          </div>
        );

      default:
        return <div className="text-gray-500">Unknown field type</div>;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Live Preview</h3>
      <div className="bg-gray-50 p-4 rounded-lg">
        {renderPreview()}
      </div>

      {/* Field Details */}
      <div className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-sm">
        <div>
          <span className="font-medium text-gray-700">Field ID:</span>
          <span className="ml-2 text-gray-600 font-mono">{field.field_slug}</span>
        </div>

        <div>
          <span className="font-medium text-gray-700">Type:</span>
          <span className="ml-2 text-gray-600">{field.field_type}</span>
        </div>

        <div>
          <span className="font-medium text-gray-700">Required:</span>
          <span className="ml-2 text-gray-600">
            {field.is_required ? 'Yes' : 'No'}
          </span>
        </div>

        {field.description && (
          <div>
            <span className="font-medium text-gray-700">Description:</span>
            <p className="ml-2 text-gray-600">{field.description}</p>
          </div>
        )}

        {(field.validation_rules.min ||
          field.validation_rules.max ||
          field.validation_rules.minLength ||
          field.validation_rules.maxLength) && (
          <div>
            <span className="font-medium text-gray-700">Validation:</span>
            <div className="ml-2 text-gray-600 text-xs space-y-1">
              {field.validation_rules.min && (
                <div>Minimum: {field.validation_rules.min}</div>
              )}
              {field.validation_rules.max && (
                <div>Maximum: {field.validation_rules.max}</div>
              )}
              {field.validation_rules.minLength && (
                <div>Min Length: {field.validation_rules.minLength}</div>
              )}
              {field.validation_rules.maxLength && (
                <div>Max Length: {field.validation_rules.maxLength}</div>
              )}
            </div>
          </div>
        )}

        <div>
          <span className="font-medium text-gray-700">Display:</span>
          <div className="ml-2 text-gray-600 text-xs space-y-1">
            {field.config.showInForm && <div>✓ Show in forms</div>}
            {field.config.showInList && <div>✓ Show in lists</div>}
            {field.config.searchable && <div>✓ Searchable</div>}
            {field.config.sortable && <div>✓ Sortable</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

FieldPreview.displayName = 'FieldPreview';

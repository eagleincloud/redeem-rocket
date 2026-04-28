/**
 * FieldValidationBuilder Component
 * Advanced validation rule configuration interface
 */

import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Check } from 'lucide-react';

interface ValidationRule {
  id?: string;
  ruleType: string;
  ruleValue?: any;
  errorMessage?: string;
  isActive: boolean;
}

interface Field {
  fieldType: string;
  fieldName: string;
}

interface Props {
  field: Field;
  rules: ValidationRule[];
  onRulesChange?: (rules: ValidationRule[]) => void;
  isLoading?: boolean;
}

const VALIDATION_TEMPLATES: Record<string, any> = {
  required: { label: 'Required', description: 'Field must have a value' },
  min_length: { label: 'Minimum Length', description: 'Minimum characters' },
  max_length: { label: 'Maximum Length', description: 'Maximum characters' },
  email_format: { label: 'Email Format', description: 'Must be valid email' },
  phone_format: { label: 'Phone Format', description: 'Must be valid phone' },
  pattern: { label: 'Pattern Match', description: 'Must match regex' },
};

export const FieldValidationBuilder: React.FC<Props> = ({
  field,
  rules,
  onRulesChange,
  isLoading = false,
}) => {
  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [ruleValue, setRuleValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAddRule = () => {
    if (!selectedRule) return;
    const newRule: ValidationRule = {
      id: Math.random().toString(36).substr(2, 9),
      ruleType: selectedRule,
      ruleValue: ruleValue || undefined,
      errorMessage: errorMessage || VALIDATION_TEMPLATES[selectedRule].label,
      isActive: true,
    };
    onRulesChange?.([...rules, newRule]);
    setSelectedRule(null);
    setRuleValue('');
    setErrorMessage('');
  };

  const handleRemoveRule = (ruleId?: string) => {
    onRulesChange?.(rules.filter(r => r.id !== ruleId));
  };

  const handleToggleActive = (ruleId?: string) => {
    onRulesChange?.(
      rules.map(r =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Active Rules</h4>
        {rules.length === 0 ? (
          <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">No rules</p>
        ) : (
          <div className="space-y-2">
            {rules.map(rule => (
              <div key={rule.id} className="flex items-start gap-3 p-3 bg-white border rounded-lg">
                <button
                  onClick={() => handleToggleActive(rule.id)}
                  className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                    rule.isActive ? 'border-green-500 bg-green-50' : 'border-gray-300'
                  }`}
                >
                  {rule.isActive && <Check size={16} className="text-green-600" />}
                </button>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {VALIDATION_TEMPLATES[rule.ruleType]?.label}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{rule.errorMessage}</p>
                </div>
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  className="text-red-600 hover:text-red-700 p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t pt-6">
        <h4 className="font-semibold text-gray-900 mb-4">Add New Rule</h4>
        <div className="space-y-3">
          <div>
            <select
              value={selectedRule || ''}
              onChange={e => setSelectedRule(e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select rule type...</option>
              {Object.entries(VALIDATION_TEMPLATES).map(([key, template]) => (
                <option key={key} value={key}>
                  {template.label}
                </option>
              ))}
            </select>
          </div>
          {selectedRule && (
            <>
              <input
                type="text"
                value={ruleValue}
                onChange={e => setRuleValue(e.target.value)}
                placeholder="Rule value..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="text"
                value={errorMessage}
                onChange={e => setErrorMessage(e.target.value)}
                placeholder="Error message..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={handleAddRule}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus size={18} className="inline mr-2" />
                Add Rule
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FieldValidationBuilder;

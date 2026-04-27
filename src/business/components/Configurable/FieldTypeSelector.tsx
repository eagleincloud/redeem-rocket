/**
 * FieldTypeSelector Component
 * Phase 4: Visual field type selection interface
 */

import React from 'react';
import {
  Type,
  Hash,
  Mail,
  Phone,
  Calendar,
  CheckSquare,
  List,
  HelpCircle,
} from 'lucide-react';

export type FieldType = 'text' | 'number' | 'select' | 'date' | 'checkbox' | 'email' | 'phone';

interface FieldTypeOption {
  value: FieldType;
  label: string;
  description: string;
  icon: React.ReactNode;
  examples: string[];
}

interface FieldTypeSelectorProps {
  selectedType?: FieldType;
  onSelect: (type: FieldType) => void;
  disabledTypes?: FieldType[];
}

const FIELD_TYPES: FieldTypeOption[] = [
  {
    value: 'text',
    label: 'Text',
    description: 'Single line text input',
    icon: <Type className="w-5 h-5" />,
    examples: ['Company name', 'Contact name'],
  },
  {
    value: 'number',
    label: 'Number',
    description: 'Numeric input with validation',
    icon: <Hash className="w-5 h-5" />,
    examples: ['Amount', 'Quantity', 'Score'],
  },
  {
    value: 'email',
    label: 'Email',
    description: 'Email address input',
    icon: <Mail className="w-5 h-5" />,
    examples: ['Email address', 'Contact email'],
  },
  {
    value: 'phone',
    label: 'Phone',
    description: 'Phone number input',
    icon: <Phone className="w-5 h-5" />,
    examples: ['Phone number', 'Mobile contact'],
  },
  {
    value: 'date',
    label: 'Date',
    description: 'Date picker input',
    icon: <Calendar className="w-5 h-5" />,
    examples: ['Due date', 'Birth date', 'Meeting date'],
  },
  {
    value: 'checkbox',
    label: 'Checkbox',
    description: 'Boolean yes/no toggle',
    icon: <CheckSquare className="w-5 h-5" />,
    examples: ['Is verified', 'Opt-in newsletter'],
  },
  {
    value: 'select',
    label: 'Dropdown',
    description: 'Choose from predefined options',
    icon: <List className="w-5 h-5" />,
    examples: ['Status', 'Priority', 'Industry'],
  },
];

export const FieldTypeSelector: React.FC<FieldTypeSelectorProps> = ({
  selectedType,
  onSelect,
  disabledTypes = [],
}) => {
  const isTypeDisabled = (type: FieldType) => disabledTypes.includes(type);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Select Field Type</label>
        <HelpCircle className="w-4 h-4 text-gray-400" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELD_TYPES.map((type) => {
          const isSelected = selectedType === type.value;
          const isDisabled = isTypeDisabled(type.value);

          return (
            <button
              key={type.value}
              onClick={() => !isDisabled && onSelect(type.value)}
              disabled={isDisabled}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : isDisabled
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-1 ${
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  }`}
                >
                  {type.icon}
                </div>
                <div className="flex-1">
                  <div
                    className={`font-medium text-sm ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}
                  >
                    {type.label}
                  </div>
                  <p className="text-xs text-gray-600">{type.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {type.examples.map((example) => (
                      <span
                        key={example}
                        className="inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

FieldTypeSelector.displayName = 'FieldTypeSelector';

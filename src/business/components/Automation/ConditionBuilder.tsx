/**
 * ConditionBuilder Component
 * Build AND/OR condition logic with field/operator/value rows
 */

import React, { useCallback, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type {
  Condition,
  ConditionOperator,
  LogicOperator,
  ValueType,
} from '../../types/automation';
import './ConditionBuilder.css';

interface ConditionBuilderProps {
  conditions: Condition[];
  onConditionsChange: (conditions: Condition[]) => void;
}

interface FieldOption {
  value: string;
  label: string;
  type: ValueType;
}

interface OperatorOption {
  value: ConditionOperator;
  label: string;
  valueInputType: 'text' | 'number' | 'date' | 'none';
}

const FIELD_OPTIONS: FieldOption[] = [
  { value: 'lead_status', label: 'Lead Status', type: 'string' },
  { value: 'priority', label: 'Priority', type: 'string' },
  { value: 'company', label: 'Company', type: 'string' },
  { value: 'product_interest', label: 'Product Interest', type: 'string' },
  { value: 'days_since_created', label: 'Days Since Created', type: 'number' },
  { value: 'revenue_potential', label: 'Revenue Potential', type: 'number' },
  { value: 'last_activity_date', label: 'Last Activity Date', type: 'date' },
  { value: 'custom_field_1', label: 'Custom Field 1', type: 'string' },
];

const STRING_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals', valueInputType: 'text' },
  { value: 'not_equals', label: 'Does Not Equal', valueInputType: 'text' },
  { value: 'contains', label: 'Contains', valueInputType: 'text' },
  { value: 'not_contains', label: 'Does Not Contain', valueInputType: 'text' },
  { value: 'starts_with', label: 'Starts With', valueInputType: 'text' },
  { value: 'ends_with', label: 'Ends With', valueInputType: 'text' },
  { value: 'is_empty', label: 'Is Empty', valueInputType: 'none' },
  { value: 'is_not_empty', label: 'Is Not Empty', valueInputType: 'none' },
];

const NUMBER_OPERATORS: OperatorOption[] = [
  { value: 'equals', label: 'Equals', valueInputType: 'number' },
  { value: 'not_equals', label: 'Does Not Equal', valueInputType: 'number' },
  { value: 'greater_than', label: 'Greater Than', valueInputType: 'number' },
  { value: 'less_than', label: 'Less Than', valueInputType: 'number' },
  { value: 'between', label: 'Between', valueInputType: 'text' },
  { value: 'is_empty', label: 'Is Empty', valueInputType: 'none' },
  { value: 'is_not_empty', label: 'Is Not Empty', valueInputType: 'none' },
];

const DATE_OPERATORS: OperatorOption[] = [
  { value: 'date_equals', label: 'Equals', valueInputType: 'date' },
  { value: 'date_after', label: 'After', valueInputType: 'date' },
  { value: 'date_before', label: 'Before', valueInputType: 'date' },
  { value: 'is_empty', label: 'Is Empty', valueInputType: 'none' },
  { value: 'is_not_empty', label: 'Is Not Empty', valueInputType: 'none' },
];

const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onConditionsChange,
}) => {
  // Get operators based on field type
  const getOperatorsForField = useCallback((fieldName: string): OperatorOption[] => {
    const field = FIELD_OPTIONS.find((f) => f.value === fieldName);
    if (!field) return STRING_OPERATORS;

    switch (field.type) {
      case 'number':
        return NUMBER_OPERATORS;
      case 'date':
        return DATE_OPERATORS;
      case 'string':
      default:
        return STRING_OPERATORS;
    }
  }, []);

  // Get field type
  const getFieldType = useCallback((fieldName: string): ValueType => {
    const field = FIELD_OPTIONS.find((f) => f.value === fieldName);
    return field?.type || 'string';
  }, []);

  // Add new condition
  const handleAddCondition = useCallback(() => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}`,
      rule_id: '',
      field_name: '',
      operator: 'equals' as ConditionOperator,
      value: '',
      value_type: 'string' as ValueType,
      logic_operator: conditions.length === 0 ? ('AND' as LogicOperator) : ('AND' as LogicOperator),
      order_index: conditions.length,
    };

    onConditionsChange([...conditions, newCondition]);
  }, [conditions, onConditionsChange]);

  // Remove condition
  const handleRemoveCondition = useCallback(
    (index: number) => {
      onConditionsChange(conditions.filter((_, i) => i !== index));
    },
    [conditions, onConditionsChange]
  );

  // Update condition field
  const handleFieldChange = useCallback(
    (index: number, fieldName: string) => {
      const updated = [...conditions];
      updated[index] = {
        ...updated[index],
        field_name: fieldName,
        operator: 'equals' as ConditionOperator,
        value: '',
        value_type: getFieldType(fieldName),
      };
      onConditionsChange(updated);
    },
    [conditions, onConditionsChange, getFieldType]
  );

  // Update condition operator
  const handleOperatorChange = useCallback(
    (index: number, operator: ConditionOperator) => {
      const updated = [...conditions];
      updated[index] = {
        ...updated[index],
        operator,
        value: ['is_empty', 'is_not_empty'].includes(operator) ? '' : updated[index].value,
      };
      onConditionsChange(updated);
    },
    [conditions, onConditionsChange]
  );

  // Update condition value
  const handleValueChange = useCallback(
    (index: number, value: string) => {
      const updated = [...conditions];
      updated[index] = {
        ...updated[index],
        value,
      };
      onConditionsChange(updated);
    },
    [conditions, onConditionsChange]
  );

  // Update logic operator (AND/OR between conditions)
  const handleLogicOperatorChange = useCallback(
    (index: number, logicOperator: LogicOperator) => {
      const updated = [...conditions];
      updated[index] = {
        ...updated[index],
        logic_operator: logicOperator,
      };
      onConditionsChange(updated);
    },
    [conditions, onConditionsChange]
  );

  const conditionRows = useMemo(() => {
    return conditions.map((condition, index) => {
      const operators = getOperatorsForField(condition.field_name);
      const selectedOperator = operators.find((op) => op.value === condition.operator);
      const fieldOption = FIELD_OPTIONS.find((f) => f.value === condition.field_name);
      const showValue =
        selectedOperator && selectedOperator.valueInputType !== 'none';

      return (
        <div key={condition.id} className="condition-row">
          {/* Logic Operator (before second+ conditions) */}
          {index > 0 && (
            <div className="logic-operator-group">
              <select
                className="logic-operator-select"
                value={condition.logic_operator}
                onChange={(e) =>
                  handleLogicOperatorChange(index, e.target.value as LogicOperator)
                }
                title="Logic operator"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          )}

          {/* Field Selector */}
          <div className="condition-cell field-cell">
            <select
              value={condition.field_name}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              className="condition-select"
              title="Select field"
            >
              <option value="">Select field...</option>
              {FIELD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {fieldOption && (
              <small className="field-type">({fieldOption.type})</small>
            )}
          </div>

          {/* Operator Selector */}
          <div className="condition-cell operator-cell">
            <select
              value={condition.operator}
              onChange={(e) =>
                handleOperatorChange(index, e.target.value as ConditionOperator)
              }
              className="condition-select"
              title="Select operator"
            >
              <option value="">Select operator...</option>
              {operators.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Value Input */}
          {showValue && (
            <div className="condition-cell value-cell">
              {selectedOperator?.valueInputType === 'number' ? (
                <input
                  type="number"
                  value={condition.value || ''}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder="Enter number"
                  className="condition-input"
                  title="Enter value"
                />
              ) : selectedOperator?.valueInputType === 'date' ? (
                <input
                  type="date"
                  value={condition.value || ''}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  className="condition-input"
                  title="Select date"
                />
              ) : (
                <input
                  type="text"
                  value={condition.value || ''}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  placeholder="Enter value"
                  className="condition-input"
                  title="Enter value"
                />
              )}
            </div>
          )}

          {/* Delete Button */}
          <div className="condition-cell action-cell">
            <button
              className="btn-delete"
              onClick={() => handleRemoveCondition(index)}
              title="Remove condition"
              aria-label="Remove condition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      );
    });
  }, [
    conditions,
    getOperatorsForField,
    handleFieldChange,
    handleOperatorChange,
    handleValueChange,
    handleLogicOperatorChange,
    handleRemoveCondition,
  ]);

  return (
    <div className="condition-builder-container">
      {conditions.length === 0 ? (
        <div className="empty-conditions">
          <p>No conditions added yet</p>
          <p className="empty-hint">Add conditions to refine when this rule executes</p>
        </div>
      ) : (
        <div className="conditions-list">{conditionRows}</div>
      )}

      {/* Add Condition Button */}
      <button
        className="btn btn-add-condition"
        onClick={handleAddCondition}
      >
        <Plus size={16} />
        Add Condition
      </button>

      {/* Info Section */}
      {conditions.length > 0 && (
        <div className="conditions-info">
          <p>
            <strong>Summary:</strong> Rule will execute when{' '}
            <span className="logic-summary">
              {conditions.length === 1
                ? 'this condition is met'
                : conditions
                    .map((c, i) => (i === 0 ? 'condition' : c.logic_operator.toLowerCase()))
                    .join(' ')}{' '}
              {conditions.length > 1 ? 'are met' : 'is met'}
            </span>
          </p>
        </div>
      )}
    </div>
  );
};

export const ConditionBuilder = React.memo(ConditionBuilder);

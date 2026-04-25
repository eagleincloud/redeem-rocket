/**
 * RuleBuilder Component
 * Multi-step wizard for creating/editing automation rules
 * Steps: (1) Rule Info, (2) Trigger, (3) Conditions, (4) Action
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, AlertCircle } from 'lucide-react';
import type {
  AutomationRule,
  Condition,
  Action,
  ValidationError,
  TriggerType,
  ActionType,
} from '../../types/automation';
import { TriggerSelector } from './TriggerSelector';
import { ConditionBuilder } from './ConditionBuilder';
import './RuleBuilder.css';

interface RuleBuilderProps {
  initialRule?: Partial<AutomationRule>;
  onSave: (rule: Partial<AutomationRule> & { conditions: Condition[]; actions: Action[] }) => Promise<void>;
  onCancel?: () => void;
}

interface FormData {
  name: string;
  description: string;
  triggerType: TriggerType | '';
  triggerConfig: Record<string, any>;
}

interface ActionFormData {
  actionType: ActionType | '';
  actionConfig: Record<string, any>;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({ initialRule, onSave, onCancel }) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    triggerType: (initialRule?.trigger_type as TriggerType) || '',
    triggerConfig: initialRule?.trigger_config || {},
  });

  const [conditions, setConditions] = useState<Condition[]>(initialRule?.conditions || []);
  const [actions, setActions] = useState<Action[]>(initialRule?.actions || []);
  const [actionFormData, setActionFormData] = useState<ActionFormData>({
    actionType: '',
    actionConfig: {},
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation for Step 1
  const validateStep1 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Rule name is required';
    }
    if (!formData.triggerType) {
      newErrors.triggerType = 'Trigger type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.name, formData.triggerType]);

  // Validation for Step 2
  const validateStep2 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.triggerType) {
      newErrors.trigger = 'Please select a trigger type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.triggerType]);

  // Validation for Step 3
  const validateStep3 = useCallback((): boolean => {
    // Conditions are optional but if present must be valid
    return true;
  }, []);

  // Validation for Step 4
  const validateStep4 = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (actions.length === 0) {
      newErrors.actions = 'At least one action is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [actions]);

  // Navigate to next step
  const handleNext = useCallback(() => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        return; // Last step
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4);
      setErrors({});
    }
  }, [currentStep, validateStep1, validateStep2, validateStep3]);

  // Navigate to previous step
  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4);
      setErrors({});
    }
  }, [currentStep]);

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validateStep4()) {
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...initialRule,
        name: formData.name,
        description: formData.description,
        trigger_type: formData.triggerType as TriggerType,
        trigger_config: formData.triggerConfig,
        conditions,
        actions,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save rule';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [initialRule, formData, conditions, actions, validateStep4, onSave]);

  // Add action
  const handleAddAction = useCallback(() => {
    if (!actionFormData.actionType) {
      setErrors((prev) => ({ ...prev, actionType: 'Please select an action type' }));
      return;
    }

    const newAction: Action = {
      id: `action-${Date.now()}`,
      rule_id: initialRule?.id || '',
      action_type: actionFormData.actionType as ActionType,
      action_config: actionFormData.actionConfig,
      order_index: actions.length,
    };

    setActions([...actions, newAction]);
    setActionFormData({ actionType: '', actionConfig: {} });
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.actionType;
      return newErrors;
    });
  }, [actionFormData, actions, initialRule?.id]);

  // Remove action
  const handleRemoveAction = useCallback((index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  }, [actions]);

  // Memoized step rendering
  const stepContent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return (
          <div className="rule-builder-step">
            <h3>Step 1: Rule Information</h3>
            <div className="form-group">
              <label htmlFor="rule-name">Rule Name *</label>
              <input
                id="rule-name"
                type="text"
                placeholder="e.g., Welcome New Leads"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={errors.name ? 'input-error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="rule-description">Description</label>
              <textarea
                id="rule-description"
                placeholder="Describe what this rule does..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="trigger-type">Trigger Type *</label>
              <select
                id="trigger-type"
                value={formData.triggerType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    triggerType: e.target.value as TriggerType,
                    triggerConfig: {},
                  })
                }
                className={errors.triggerType ? 'input-error' : ''}
              >
                <option value="">Select a trigger...</option>
                <option value="lead_added">Lead Added</option>
                <option value="email_opened">Email Opened</option>
                <option value="email_clicked">Email Clicked</option>
                <option value="stage_changed">Stage Changed</option>
                <option value="inactivity">Inactivity</option>
                <option value="milestone_reached">Milestone Reached</option>
              </select>
              {errors.triggerType && <span className="error-message">{errors.triggerType}</span>}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="rule-builder-step">
            <h3>Step 2: Trigger Configuration</h3>
            {errors.trigger && (
              <div className="error-alert">
                <AlertCircle size={16} />
                {errors.trigger}
              </div>
            )}
            <TriggerSelector
              selectedTrigger={formData.triggerType as TriggerType}
              onTriggerChange={(trigger) =>
                setFormData({ ...formData, triggerType: trigger })
              }
              config={formData.triggerConfig}
              onConfigChange={(config) =>
                setFormData({ ...formData, triggerConfig: config })
              }
            />
          </div>
        );

      case 3:
        return (
          <div className="rule-builder-step">
            <h3>Step 3: Conditions (Optional)</h3>
            <p className="step-description">
              Add conditions to refine when this rule should execute
            </p>
            <ConditionBuilder
              conditions={conditions}
              onConditionsChange={setConditions}
            />
          </div>
        );

      case 4:
        return (
          <div className="rule-builder-step">
            <h3>Step 4: Actions</h3>
            {errors.actions && (
              <div className="error-alert">
                <AlertCircle size={16} />
                {errors.actions}
              </div>
            )}

            <div className="actions-section">
              <h4>Add Action</h4>
              <div className="form-group">
                <label htmlFor="action-type">Action Type *</label>
                <select
                  id="action-type"
                  value={actionFormData.actionType}
                  onChange={(e) =>
                    setActionFormData({
                      actionType: e.target.value as ActionType,
                      actionConfig: {},
                    })
                  }
                  className={errors.actionType ? 'input-error' : ''}
                >
                  <option value="">Select an action...</option>
                  <option value="send_email">Send Email</option>
                  <option value="add_tag">Add Tag</option>
                  <option value="assign_user">Assign User</option>
                  <option value="create_task">Create Task</option>
                  <option value="update_field">Update Field</option>
                  <option value="webhook">Webhook</option>
                </select>
                {errors.actionType && <span className="error-message">{errors.actionType}</span>}
              </div>

              {actionFormData.actionType === 'send_email' && (
                <div className="form-group">
                  <label htmlFor="email-template">Email Template *</label>
                  <input
                    id="email-template"
                    type="text"
                    placeholder="Template ID or name"
                    value={actionFormData.actionConfig.template_id || ''}
                    onChange={(e) =>
                      setActionFormData({
                        ...actionFormData,
                        actionConfig: { ...actionFormData.actionConfig, template_id: e.target.value },
                      })
                    }
                  />
                </div>
              )}

              {actionFormData.actionType === 'add_tag' && (
                <div className="form-group">
                  <label htmlFor="tags">Tags (comma-separated) *</label>
                  <input
                    id="tags"
                    type="text"
                    placeholder="tag1, tag2, tag3"
                    value={(actionFormData.actionConfig.tags as string[])?.join(', ') || ''}
                    onChange={(e) =>
                      setActionFormData({
                        ...actionFormData,
                        actionConfig: {
                          ...actionFormData.actionConfig,
                          tags: e.target.value.split(',').map((t) => t.trim()),
                        },
                      })
                    }
                  />
                </div>
              )}

              {actionFormData.actionType === 'create_task' && (
                <>
                  <div className="form-group">
                    <label htmlFor="task-title">Task Title *</label>
                    <input
                      id="task-title"
                      type="text"
                      placeholder="Task title"
                      value={actionFormData.actionConfig.title || ''}
                      onChange={(e) =>
                        setActionFormData({
                          ...actionFormData,
                          actionConfig: { ...actionFormData.actionConfig, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="task-priority">Priority</label>
                    <select
                      id="task-priority"
                      value={actionFormData.actionConfig.priority || 'medium'}
                      onChange={(e) =>
                        setActionFormData({
                          ...actionFormData,
                          actionConfig: { ...actionFormData.actionConfig, priority: e.target.value },
                        })
                      }
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </>
              )}

              <button
                className="btn btn-primary"
                onClick={handleAddAction}
                disabled={!actionFormData.actionType}
              >
                Add Action
              </button>
            </div>

            {actions.length > 0 && (
              <div className="actions-list">
                <h4>Actions ({actions.length})</h4>
                {actions.map((action, index) => (
                  <div key={action.id} className="action-item">
                    <div className="action-content">
                      <span className="action-index">{index + 1}</span>
                      <span className="action-type">{getActionLabel(action.action_type)}</span>
                      <span className="action-config">
                        {JSON.stringify(action.action_config).substring(0, 50)}...
                      </span>
                    </div>
                    <button
                      className="btn-remove"
                      onClick={() => handleRemoveAction(index)}
                      title="Remove this action"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  }, [currentStep, formData, conditions, actions, actionFormData, errors]);

  return (
    <div className="rule-builder-container">
      {/* Step Indicator */}
      <div className="step-indicator">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`step-item ${step === currentStep ? 'active' : ''} ${
              step < currentStep ? 'completed' : ''
            }`}
          >
            <div className="step-number">{step}</div>
            <div className="step-label">
              {['Info', 'Trigger', 'Conditions', 'Actions'][step - 1]}
            </div>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="form-content">{stepContent}</div>

      {/* Navigation Buttons */}
      <div className="form-actions">
        <button
          className="btn btn-secondary"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        {currentStep < 4 && (
          <button className="btn btn-primary" onClick={handleNext}>
            Next
            <ChevronRight size={16} />
          </button>
        )}

        {currentStep === 4 && (
          <button
            className="btn btn-success"
            onClick={handleSave}
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Rule'}
          </button>
        )}

        {onCancel && (
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>

      {/* Global Error Message */}
      {errors.submit && (
        <div className="error-alert">
          <AlertCircle size={16} />
          {errors.submit}
        </div>
      )}
    </div>
  );
};

function getActionLabel(actionType: ActionType): string {
  const labels: Record<ActionType, string> = {
    send_email: '📧 Send Email',
    add_tag: '🏷️ Add Tag',
    assign_user: '👤 Assign User',
    create_task: '✓ Create Task',
    update_field: '⚙️ Update Field',
    webhook: '🪝 Webhook',
  };
  return labels[actionType] || actionType;
}


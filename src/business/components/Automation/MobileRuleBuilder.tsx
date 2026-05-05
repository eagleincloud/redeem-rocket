import React, { useState } from 'react';
import { useMobileView, useBottomSheet } from '../../hooks/useMobileView';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

interface RuleBuilderStep {
  number: number;
  title: string;
  description: string;
}

interface MobileRuleBuilderProps {
  onSave?: (rule: any) => void;
  onCancel?: () => void;
}

/**
 * Mobile-optimized rule builder using step-by-step wizard pattern
 * Each step is full-width and occupies entire screen
 */
export function MobileRuleBuilder({ onSave, onCancel }: MobileRuleBuilderProps) {
  const { isMobile } = useMobileView();
  const [currentStep, setCurrentStep] = useState(1);
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('');
  const [conditions, setConditions] = useState<any[]>([]);
  const [actionType, setActionType] = useState('');
  const [actionConfig, setActionConfig] = useState<any>({});

  const totalSteps = 4;

  const steps: RuleBuilderStep[] = [
    {
      number: 1,
      title: 'Rule Name & Trigger',
      description: 'Name your rule and select a trigger event',
    },
    {
      number: 2,
      title: 'Conditions',
      description: 'Add conditions that must be met',
    },
    {
      number: 3,
      title: 'Action',
      description: 'Choose what happens when triggered',
    },
    {
      number: 4,
      title: 'Review & Save',
      description: 'Review and save your rule',
    },
  ];

  const triggerOptions = [
    { value: 'lead_added', label: 'Lead Added' },
    { value: 'email_opened', label: 'Email Opened' },
    { value: 'email_clicked', label: 'Email Clicked' },
    { value: 'lead_qualified', label: 'Lead Qualified' },
    { value: 'inactivity_7d', label: 'Inactive 7 Days' },
    { value: 'inactivity_30d', label: 'Inactive 30 Days' },
  ];

  const actionOptions = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'update_field', label: 'Update Field' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'webhook', label: 'Send Webhook' },
  ];

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    const rule = {
      name: ruleName,
      trigger_type: triggerType,
      conditions,
      action_type: actionType,
      action_config: actionConfig,
    };
    onSave?.(rule);
  };

  if (!isMobile) {
    return (
      <div className="text-center text-muted-foreground">
        This component is optimized for mobile devices.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b border-border p-4 z-40">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onCancel}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
          <h1 className="font-semibold text-foreground">Create Rule</h1>
          <div className="w-6" />
        </div>

        {/* Progress Indicator */}
        <div className="flex gap-1">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`h-1 flex-1 rounded-full transition-all ${
                step.number <= currentStep ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Rule Name & Trigger */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Welcome New Leads"
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Trigger Event *
              </label>
              <div className="space-y-2">
                {triggerOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary transition-colors"
                  >
                    <input
                      type="radio"
                      name="trigger"
                      value={option.value}
                      checked={triggerType === option.value}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-foreground font-medium">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Conditions */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Conditions</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setConditions([...conditions, { field: '', operator: '', value: '' }])
                }
                className="h-8"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>

            {conditions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No conditions added yet. Rule will trigger for all leads.
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                        <option>Lead Stage</option>
                        <option>Lead Priority</option>
                        <option>Lead Source</option>
                        <option>Deal Value</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <select className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                        <option>=</option>
                        <option>&gt;</option>
                        <option>&lt;</option>
                        <option>contains</option>
                      </select>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setConditions(conditions.filter((_, i) => i !== index))
                      }
                      className="h-10 w-10 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Action */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Action Type *
            </label>
            <div className="space-y-2">
              {actionOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary transition-colors"
                >
                  <input
                    type="radio"
                    name="action"
                    value={option.value}
                    checked={actionType === option.value}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="text-foreground font-medium">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>

            {actionType === 'send_email' && (
              <div className="mt-4 space-y-3 pt-4 border-t border-border">
                <label className="block text-sm font-medium text-foreground">
                  Email Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g., Welcome to Redeem Rocket!"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}

            {actionType === 'add_tag' && (
              <div className="mt-4 space-y-3 pt-4 border-t border-border">
                <label className="block text-sm font-medium text-foreground">
                  Tag Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., welcome-sent"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Rule Name</p>
                  <p className="text-sm font-medium text-foreground">{ruleName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trigger</p>
                  <p className="text-sm font-medium text-foreground">
                    {triggerOptions.find((o) => o.value === triggerType)?.label}
                  </p>
                </div>
                {conditions.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground">Conditions</p>
                    <p className="text-sm font-medium text-foreground">
                      {conditions.length} condition(s)
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Action</p>
                  <p className="text-sm font-medium text-foreground">
                    {actionOptions.find((o) => o.value === actionType)?.label}
                  </p>
                </div>
              </div>
            </Card>

            <div className="text-sm text-muted-foreground bg-secondary/50 rounded-lg p-3">
              ✓ Your rule is ready to be activated. It will automatically run when triggered.
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="sticky bottom-0 border-t border-border bg-background p-4 flex gap-2">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handlePreviousStep}
            className="flex-1 h-11"
          >
            Back
          </Button>
        )}

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNextStep}
            disabled={
              (currentStep === 1 && (!ruleName || !triggerType)) ||
              (currentStep === 3 && !actionType)
            }
            className="flex-1 h-11"
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSave} className="flex-1 h-11">
            Create Rule
          </Button>
        )}
      </div>
    </div>
  );
}

export default MobileRuleBuilder;

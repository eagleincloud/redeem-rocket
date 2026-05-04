import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X, ArrowRight } from 'lucide-react';

interface Condition {
  id: string;
  field: string;
  operator: string;
  value: string;
}

interface RuleFormData {
  name: string;
  triggerType: string;
  conditions: Condition[];
  actionType: string;
  actionConfig: Record<string, string>;
  isActive: boolean;
}

const TRIGGER_OPTIONS = [
  { value: 'lead_added', label: '👤 Lead Added' },
  { value: 'email_opened', label: '📧 Email Opened' },
  { value: 'email_clicked', label: '🔗 Email Clicked' },
  { value: 'lead_qualified', label: '⭐ Lead Qualified' },
  { value: 'inactivity_30d', label: '⏰ 30 Days Inactive' },
  { value: 'stage_changed', label: '↔️ Stage Changed' },
  { value: 'deal_created', label: '💼 Deal Created' },
  { value: 'form_submitted', label: '📝 Form Submitted' },
];

const ACTION_OPTIONS = [
  { value: 'send_email', label: '📧 Send Email' },
  { value: 'add_tag', label: '🏷️ Add Tag' },
  { value: 'update_field', label: '✏️ Update Field' },
  { value: 'create_task', label: '✅ Create Task' },
  { value: 'webhook', label: '🔌 Webhook' },
  { value: 'assign_manager', label: '👨 Assign Manager' },
  { value: 'change_stage', label: '↔️ Change Stage' },
  { value: 'add_to_list', label: '📋 Add to List' },
];

const FIELD_OPTIONS = [
  { value: 'stage', label: 'Lead Stage' },
  { value: 'priority', label: 'Priority' },
  { value: 'source', label: 'Source' },
  { value: 'company', label: 'Company' },
  { value: 'email', label: 'Email' },
  { value: 'days_in_stage', label: 'Days in Stage' },
];

const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'equals' },
  { value: 'not_equals', label: 'not equals' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'greater than' },
  { value: 'less_than', label: 'less than' },
];

export const RuleBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<RuleFormData>({
    name: isEditMode ? 'Auto-qualify leads' : '',
    triggerType: 'lead_added',
    conditions: [],
    actionType: 'send_email',
    actionConfig: {},
    isActive: true,
  });

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      field: 'stage',
      operator: 'equals',
      value: '',
    };
    setFormData({
      ...formData,
      conditions: [...formData.conditions, newCondition],
    });
  };

  const handleRemoveCondition = (id: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((c) => c.id !== id),
    });
  };

  const handleUpdateCondition = (id: string, field: keyof Condition, value: string) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a rule name');
      return;
    }
    // Save rule
    navigate('/app/automation/rules');
  };

  const getTriggerLabel = () => {
    return TRIGGER_OPTIONS.find((t) => t.value === formData.triggerType)?.label || formData.triggerType;
  };

  const getActionLabel = () => {
    return ACTION_OPTIONS.find((a) => a.value === formData.actionType)?.label || formData.actionType;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? 'Edit Rule' : 'New Automation Rule'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create or modify your workflow automation
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/automation/rules')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Rule Info */}
        <Card>
          <CardHeader>
            <CardTitle>Rule Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Rule Name</Label>
              <Input
                id="name"
                placeholder="e.g., Auto-qualify high-value leads..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label className="text-sm text-muted-foreground">
                {formData.isActive ? 'Rule is Active' : 'Rule is Inactive'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Trigger */}
        <Card>
          <CardHeader>
            <CardTitle>When This Happens</CardTitle>
            <CardDescription>Select the trigger event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="trigger">Trigger Type</Label>
              <Select value={formData.triggerType} onValueChange={(value) => setFormData({ ...formData, triggerType: value })}>
                <SelectTrigger id="trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conditions */}
        {formData.conditions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>And If These Conditions Are True</CardTitle>
              <CardDescription>{formData.conditions.length} condition{formData.conditions.length !== 1 ? 's' : ''}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.conditions.map((condition, index) => (
                <div key={condition.id} className="p-4 rounded-lg bg-secondary border border-border space-y-4">
                  <div className="flex flex-wrap gap-2 items-end">
                    {index > 0 && (
                      <div className="text-xs text-muted-foreground font-semibold">
                        AND
                      </div>
                    )}
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs">Field</Label>
                      <Select value={condition.field} onValueChange={(value) => handleUpdateCondition(condition.id, 'field', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs">Operator</Label>
                      <Select value={condition.operator} onValueChange={(value) => handleUpdateCondition(condition.id, 'operator', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATOR_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs">Value</Label>
                      <Input
                        placeholder="Enter value..."
                        value={condition.value}
                        onChange={(e) => handleUpdateCondition(condition.id, 'value', e.target.value)}
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveCondition(condition.id)}
                      className="p-1 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddCondition}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Conditions */}
        {formData.conditions.length === 0 && (
          <Card>
            <CardContent className="p-5">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleAddCondition}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Conditions (Optional)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action */}
        <Card>
          <CardHeader>
            <CardTitle>Then Do This</CardTitle>
            <CardDescription>Select the action to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="action">Action Type</Label>
              <Select value={formData.actionType} onValueChange={(value) => setFormData({ ...formData, actionType: value })}>
                <SelectTrigger id="action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Config based on type */}
            {formData.actionType === 'send_email' && (
              <div className="space-y-2">
                <Label htmlFor="template">Email Template</Label>
                <Input
                  id="template"
                  placeholder="Select template..."
                  value={formData.actionConfig.template || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, template: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {formData.actionType === 'add_tag' && (
              <div className="space-y-2">
                <Label htmlFor="tag">Tag Name</Label>
                <Input
                  id="tag"
                  placeholder="e.g., high-value, interested..."
                  value={formData.actionConfig.tag || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, tag: e.target.value },
                    })
                  }
                />
              </div>
            )}

            {formData.actionType === 'assign_manager' && (
              <div className="space-y-2">
                <Label htmlFor="manager">Manager</Label>
                <Input
                  id="manager"
                  placeholder="Select manager..."
                  value={formData.actionConfig.manager || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      actionConfig: { ...formData.actionConfig, manager: e.target.value },
                    })
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visual Flow Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Rule Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 p-4 rounded-lg bg-secondary border border-border overflow-x-auto">
              <div className="flex-1 min-w-fit p-2 rounded bg-amber-500/10 border border-amber-500/30">
                <p className="m-0 text-sm font-semibold text-amber-600">
                  {getTriggerLabel()}
                </p>
              </div>
              <ArrowRight className="text-muted-foreground flex-shrink-0" />
              {formData.conditions.length > 0 && (
                <>
                  <div className="flex-1 min-w-fit p-2 rounded bg-purple-500/10 border border-purple-500/30">
                    <p className="m-0 text-sm font-semibold text-purple-600">
                      {formData.conditions.length} Condition{formData.conditions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground flex-shrink-0" />
                </>
              )}
              <div className="flex-1 min-w-fit p-2 rounded bg-blue-500/10 border border-blue-500/30">
                <p className="m-0 text-sm font-semibold text-blue-600">
                  {getActionLabel()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/app/automation/rules')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
          >
            {isEditMode ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RuleBuilder;

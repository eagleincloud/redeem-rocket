import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, X, Eye } from 'lucide-react';

interface EmailStep {
  id: string;
  delayDays: number;
  subject: string;
  body: string;
}

interface CampaignFormData {
  name: string;
  triggerType: string;
  description: string;
  steps: EmailStep[];
  isActive: boolean;
}

const TRIGGER_OPTIONS = [
  { value: 'signup', label: '📧 Signup - When user creates account' },
  { value: 'purchase', label: '💳 Purchase - After customer buys' },
  { value: 'abandoned_cart', label: '🛒 Abandoned Cart - Customer left items' },
  { value: 'manual', label: '👤 Manual - Send whenever you want' },
  { value: 'api', label: '🔌 API - Triggered from external system' },
  { value: 'follow_up', label: '⏰ Follow-up - Scheduled reminder' },
];

const VARIABLES = [
  { name: '{name}', description: 'Customer first name' },
  { name: '{email}', description: 'Customer email address' },
  { name: '{company}', description: 'Customer company name' },
  { name: '{product}', description: 'Product name' },
  { name: '{price}', description: 'Product price' },
];

export const CampaignBuilder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState<CampaignFormData>({
    name: isEditMode ? 'Welcome Series' : '',
    triggerType: 'signup',
    description: '',
    steps: [{ id: '1', delayDays: 0, subject: '', body: '' }],
    isActive: false,
  });

  const [previewStep, setPreviewStep] = useState<number | null>(null);

  const handleAddStep = () => {
    const newStep: EmailStep = {
      id: Date.now().toString(),
      delayDays: 1,
      subject: '',
      body: '',
    };
    setFormData({
      ...formData,
      steps: [...formData.steps, newStep],
    });
  };

  const handleRemoveStep = (id: string) => {
    if (formData.steps.length > 1) {
      setFormData({
        ...formData,
        steps: formData.steps.filter((s) => s.id !== id),
      });
    }
  };

  const handleUpdateStep = (id: string, field: keyof EmailStep, value: any) => {
    setFormData({
      ...formData,
      steps: formData.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a campaign name');
      return;
    }
    if (formData.steps.some((s) => !s.subject.trim() || !s.body.trim())) {
      alert('Please fill in all email subjects and bodies');
      return;
    }
    // Save campaign
    navigate('/app/campaigns');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isEditMode ? 'Edit Campaign' : 'New Campaign'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Create or modify your email campaign
              </p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Campaign Info */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign Name</Label>
              <Input
                id="name"
                placeholder="e.g., Welcome Series, Abandoned Cart..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Add notes about this campaign..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label className="text-sm text-muted-foreground">
                {formData.isActive ? 'Campaign is Active' : 'Campaign is Inactive'}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Email Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Email Steps</CardTitle>
            <CardDescription>
              {formData.steps.length} email{formData.steps.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.steps.map((step, index) => (
              <div key={step.id} className="p-4 rounded-lg bg-secondary border border-border space-y-4">
                {/* Step Header */}
                <div className="flex justify-between items-center">
                  <h4 className="m-0 text-base font-semibold text-foreground">
                    Step {index + 1}
                  </h4>
                  {formData.steps.length > 1 && (
                    <button
                      onClick={() => handleRemoveStep(step.id)}
                      className="p-0 bg-transparent border-none cursor-pointer text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Delay */}
                <div className="space-y-2">
                  <Label htmlFor={`delay-${step.id}`}>Send After (Days)</Label>
                  <Input
                    id={`delay-${step.id}`}
                    type="number"
                    min="0"
                    max="365"
                    value={step.delayDays.toString()}
                    onChange={(e) =>
                      handleUpdateStep(step.id, 'delayDays', parseInt(e.target.value) || 0)
                    }
                  />
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor={`subject-${step.id}`}>Email Subject</Label>
                  <Input
                    id={`subject-${step.id}`}
                    placeholder="e.g., Welcome to {company}!"
                    value={step.subject}
                    onChange={(e) => handleUpdateStep(step.id, 'subject', e.target.value)}
                  />
                </div>

                {/* Body */}
                <div className="space-y-2">
                  <Label htmlFor={`body-${step.id}`}>Email Body</Label>
                  <textarea
                    id={`body-${step.id}`}
                    value={step.body}
                    onChange={(e) => handleUpdateStep(step.id, 'body', e.target.value)}
                    placeholder="Hi {name}, welcome to our service..."
                    className="w-full min-h-[200px] p-3 rounded-md bg-background border border-border text-foreground font-mono text-sm resize-vertical"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Available variables: {VARIABLES.map((v) => v.name).join(', ')}
                  </p>
                </div>

                {/* Preview */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewStep(previewStep === index ? null : index)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewStep === index ? 'Hide Preview' : 'Preview'}
                </Button>

                {/* Preview Content */}
                {previewStep === index && step.subject && step.body && (
                  <div className="mt-4 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 space-y-2">
                    <p className="m-0 text-sm font-semibold text-foreground">
                      Subject: {step.subject}
                    </p>
                    <div className="p-2 rounded bg-background border border-border whitespace-pre-wrap break-words text-xs text-muted-foreground">
                      {step.body}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Step Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddStep}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Step
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate('/app/campaigns')}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
          >
            {isEditMode ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignBuilder;

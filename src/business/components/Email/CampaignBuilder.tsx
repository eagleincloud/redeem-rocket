/**
 * Campaign Builder Component
 * Create and edit multi-step email sequences with template support
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Save, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import {
  createCampaign,
  updateCampaign,
  getTemplates,
  EmailCampaign,
  EmailTemplate,
} from '@/app/api/email';

interface CampaignBuilderProps {
  businessId: string;
  campaign?: EmailCampaign;
  onSave?: (campaign: EmailCampaign) => void;
  onCancel?: () => void;
}

export const CampaignBuilder: React.FC<CampaignBuilderProps> = ({
  businessId,
  campaign,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<EmailCampaign>>({
    name: campaign?.name || '',
    description: campaign?.description || '',
    subject: campaign?.subject || '',
    body: campaign?.body || '',
    status: campaign?.status || 'draft',
    from_name: campaign?.from_name || '',
    reply_to: campaign?.reply_to || '',
    is_test: campaign?.is_test || false,
  });

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [businessId]);

  const loadTemplates = async () => {
    try {
      const { templates: data } = await getTemplates(businessId);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleApplyTemplate = (template: EmailTemplate) => {
    setFormData(prev => ({
      ...prev,
      subject: template.subject_template,
      body: template.body_html,
    }));
    setShowTemplates(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.subject || !formData.body) {
        setError('Name, subject, and body are required');
        return;
      }

      setLoading(true);
      setError(null);

      let savedCampaign: EmailCampaign;
      if (campaign?.id) {
        savedCampaign = await updateCampaign(campaign.id, formData);
      } else {
        savedCampaign = await createCampaign(businessId, {
          ...formData,
          name: formData.name!,
          subject: formData.subject!,
          body: formData.body!,
          status: 'draft',
          is_test: false,
          recipient_count: 0,
          sent_count: 0,
          delivered_count: 0,
          bounced_count: 0,
          open_count: 0,
          click_count: 0,
          conversion_count: 0,
          unsubscribe_count: 0,
          complaint_count: 0,
        });
      }

      onSave?.(savedCampaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900">
          {campaign ? 'Edit Campaign' : 'New Campaign'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border-b border-red-200 mx-6 mt-6 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="p-6 space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            placeholder="e.g., Welcome Series"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            placeholder="Campaign notes and details..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* From Name and Reply-to */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Name
            </label>
            <input
              type="text"
              name="from_name"
              value={formData.from_name || ''}
              onChange={handleInputChange}
              placeholder="Your Company"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reply-to Email
            </label>
            <input
              type="email"
              name="reply_to"
              value={formData.reply_to || ''}
              onChange={handleInputChange}
              placeholder="support@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Email Subject */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Subject *
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject || ''}
            onChange={handleInputChange}
            placeholder="Subject line for your email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Use {'{name}'}, {'{email}'}, {'{company}'} for personalization
          </p>
        </div>

        {/* Email Body */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Email Body *
            </label>
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Use Template
              {showTemplates ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showTemplates && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-medium text-gray-700 mb-3">Available Templates</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="w-full text-left p-3 hover:bg-white rounded-lg border border-gray-200 transition"
                  >
                    <p className="font-medium text-gray-900">{template.name}</p>
                    {template.description && (
                      <p className="text-xs text-gray-500">{template.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <textarea
            name="body"
            value={formData.body || ''}
            onChange={handleInputChange}
            placeholder="Email content in HTML or plain text"
            rows={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>

        {/* Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_test"
              checked={formData.is_test || false}
              onChange={handleInputChange}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Mark as test email</span>
          </label>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status || 'draft'}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4 inline mr-2" />
          {loading ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>
    </div>
  );
};

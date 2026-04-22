/**
 * EmailTemplateEditor Component
 * Create and edit email templates with preview, variable insertion, and testing
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  Send,
  Save,
  Trash2,
  Copy,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import type { EmailTemplate, TriggerType } from '../../types/automation';
import './EmailTemplateEditor.css';

interface EmailTemplateEditorProps {
  onSave: (template: Omit<EmailTemplate, 'id' | 'business_id' | 'created_by' | 'created_at' | 'updated_at'>) => Promise<void>;
  initialTemplate?: EmailTemplate;
  ruleContext?: TriggerType;
  existingTemplates?: EmailTemplate[];
  onDelete?: (templateId: string) => Promise<void>;
}

interface FormData {
  name: string;
  category: string;
  subject: string;
  body: string;
  bodyHtml: string;
  recipient_type: 'lead' | 'assigned_user' | 'custom_email_field';
  recipient_field?: string;
  trackOpens: boolean;
  trackClicks: boolean;
  includeAttachments: boolean;
}

interface PreviewData {
  [key: string]: string;
}

const AVAILABLE_VARIABLES = [
  { key: 'lead_name', description: 'Full name of the lead' },
  { key: 'lead_email', description: 'Email address of the lead' },
  { key: 'company', description: 'Company name' },
  { key: 'phone', description: 'Phone number' },
  { key: 'deal_value', description: 'Deal/opportunity value' },
  { key: 'days_in_stage', description: 'Days in current stage' },
  { key: 'last_activity', description: 'Last activity date' },
  { key: 'manager_name', description: 'Assigned manager name' },
  { key: 'manager_email', description: 'Assigned manager email' },
  { key: 'product_interest', description: 'Product of interest' },
  { key: 'status', description: 'Lead status' },
  { key: 'priority', description: 'Lead priority' },
];

const TEMPLATE_CATEGORIES = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'nurture', label: 'Nurture' },
  { value: 'custom', label: 'Custom' },
];

const SAMPLE_PREVIEW_DATA: PreviewData = {
  lead_name: 'John Smith',
  lead_email: 'john@example.com',
  company: 'Acme Corp',
  phone: '+1-555-123-4567',
  deal_value: '$50,000',
  days_in_stage: '5',
  last_activity: 'Today at 2:30 PM',
  manager_name: 'Sarah Johnson',
  manager_email: 'sarah@yourcompany.com',
  product_interest: 'Enterprise Plan',
  status: 'Qualified',
  priority: 'High',
};

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  onSave,
  initialTemplate,
  ruleContext,
  existingTemplates = [],
  onDelete,
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: initialTemplate?.name || '',
    category: initialTemplate?.category || 'custom',
    subject: initialTemplate?.subject || '',
    body: initialTemplate?.body || '',
    bodyHtml: initialTemplate?.body_html || '',
    recipient_type: initialTemplate?.recipient_type as any || 'lead',
    recipient_field: initialTemplate?.recipient_field,
    trackOpens: initialTemplate?.track_opens ?? true,
    trackClicks: initialTemplate?.track_clicks ?? true,
    includeAttachments: initialTemplate?.include_attachments ?? false,
  });

  const [showPreview, setShowPreview] = useState(false);
  const [showPlainText, setShowPlainText] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateName, setDuplicateName] = useState('');

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject line is required';
    }
    if (!formData.body.trim() && !formData.bodyHtml.trim()) {
      newErrors.body = 'Email body is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Render preview with variables replaced
  const renderedPreview = useMemo(() => {
    let rendered = formData.subject;
    AVAILABLE_VARIABLES.forEach((variable) => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      rendered = rendered.replace(regex, SAMPLE_PREVIEW_DATA[variable.key] || '');
    });
    return rendered;
  }, [formData.subject]);

  const bodyPreview = useMemo(() => {
    let rendered = formData.body || formData.bodyHtml;
    AVAILABLE_VARIABLES.forEach((variable) => {
      const regex = new RegExp(`{{${variable.key}}}`, 'g');
      rendered = rendered.replace(regex, SAMPLE_PREVIEW_DATA[variable.key] || '');
    });
    return rendered;
  }, [formData.body, formData.bodyHtml]);

  // Handle form changes
  const handleNameChange = useCallback((name: string) => {
    setFormData((prev) => ({ ...prev, name }));
    setErrors((prev) => ({ ...prev, name: '' }));
  }, []);

  const handleCategoryChange = useCallback((category: string) => {
    setFormData((prev) => ({ ...prev, category }));
  }, []);

  const handleSubjectChange = useCallback((subject: string) => {
    setFormData((prev) => ({ ...prev, subject }));
    setErrors((prev) => ({ ...prev, subject: '' }));
  }, []);

  const handleBodyChange = useCallback((body: string) => {
    setFormData((prev) => ({
      ...prev,
      body,
      bodyHtml: showPlainText ? '' : prev.bodyHtml,
    }));
    setErrors((prev) => ({ ...prev, body: '' }));
  }, [showPlainText]);

  const handleBodyHtmlChange = useCallback((bodyHtml: string) => {
    setFormData((prev) => ({
      ...prev,
      bodyHtml,
      body: showPlainText ? '' : prev.body,
    }));
    setErrors((prev) => ({ ...prev, body: '' }));
  }, [showPlainText]);

  const handleRecipientTypeChange = useCallback((recipientType: string) => {
    setFormData((prev) => ({
      ...prev,
      recipient_type: recipientType as any,
    }));
  }, []);

  const handleRecipientFieldChange = useCallback((field: string) => {
    setFormData((prev) => ({
      ...prev,
      recipient_field: field,
    }));
  }, []);

  // Insert variable into current position
  const insertVariable = useCallback(
    (variable: string, isSubject: boolean) => {
      const varText = `{{${variable}}}`;
      if (isSubject) {
        setFormData((prev) => ({
          ...prev,
          subject: prev.subject + varText,
        }));
      } else {
        if (showPlainText) {
          setFormData((prev) => ({
            ...prev,
            body: prev.body + varText,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            bodyHtml: prev.bodyHtml + varText,
          }));
        }
      }
    },
    [showPlainText]
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!validate()) {
      setMessage({ type: 'error', text: 'Please fix the errors above' });
      return;
    }

    setSaveLoading(true);
    try {
      await onSave({
        name: formData.name,
        category: formData.category,
        subject: formData.subject,
        body: formData.body,
        body_html: formData.bodyHtml,
        recipient_type: formData.recipient_type as any,
        recipient_field: formData.recipient_field,
        track_opens: formData.trackOpens,
        track_clicks: formData.trackClicks,
        include_attachments: formData.includeAttachments,
        is_system: false,
        variables: {},
      });
      setMessage({ type: 'success', text: 'Template saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to save template',
      });
    } finally {
      setSaveLoading(false);
    }
  }, [formData, validate, onSave]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!initialTemplate?.id || !onDelete) return;

    setDeleteLoading(true);
    try {
      await onDelete(initialTemplate.id);
      setMessage({ type: 'success', text: 'Template deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to delete template',
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  }, [initialTemplate?.id, onDelete]);

  // Handle duplicate
  const handleDuplicate = useCallback(async () => {
    if (!duplicateName.trim()) {
      setMessage({ type: 'error', text: 'Please enter a name for the duplicate template' });
      return;
    }

    setSaveLoading(true);
    try {
      await onSave({
        name: duplicateName,
        category: formData.category,
        subject: formData.subject,
        body: formData.body,
        body_html: formData.bodyHtml,
        recipient_type: formData.recipient_type as any,
        recipient_field: formData.recipient_field,
        track_opens: formData.trackOpens,
        track_clicks: formData.trackClicks,
        include_attachments: formData.includeAttachments,
        is_system: false,
        variables: {},
      });
      setMessage({ type: 'success', text: 'Template duplicated successfully!' });
      setDuplicateModalOpen(false);
      setDuplicateName('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to duplicate template',
      });
    } finally {
      setSaveLoading(false);
    }
  }, [duplicateName, formData, onSave]);

  // Handle test email
  const handleTestEmail = useCallback(async () => {
    if (!testEmail.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setTestLoading(true);
    try {
      // Simulate test email send
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({ type: 'success', text: `Test email sent to ${testEmail}` });
      setTestEmail('');
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send test email',
      });
    } finally {
      setTestLoading(false);
    }
  }, [testEmail]);

  return (
    <div className="email-template-editor">
      {/* Messages */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Template</h3>
            <p>Are you sure you want to delete this template? This action cannot be undone.</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Modal */}
      {duplicateModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Duplicate Template</h3>
            <input
              type="text"
              placeholder="New template name"
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="modal-input"
            />
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => {
                  setDuplicateModalOpen(false);
                  setDuplicateName('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleDuplicate}
                disabled={saveLoading}
              >
                {saveLoading ? 'Duplicating...' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="editor-wrapper">
        {/* Left Panel: Editor */}
        <div className="editor-panel">
          <h2>Email Template Editor</h2>

          {/* Template Name */}
          <div className="form-group">
            <label>Template Name</label>
            <input
              type="text"
              placeholder="e.g., Welcome to our service"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="form-select"
            >
              {TEMPLATE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Recipient Type */}
          <div className="form-group">
            <label>Send To</label>
            <select
              value={formData.recipient_type}
              onChange={(e) => handleRecipientTypeChange(e.target.value)}
              className="form-select"
            >
              <option value="lead">Lead Email</option>
              <option value="assigned_user">Assigned Manager</option>
              <option value="custom_email_field">Custom Email Field</option>
            </select>
          </div>

          {/* Custom Email Field */}
          {formData.recipient_type === 'custom_email_field' && (
            <div className="form-group">
              <label>Field Name</label>
              <input
                type="text"
                placeholder="e.g., secondary_contact_email"
                value={formData.recipient_field || ''}
                onChange={(e) => handleRecipientFieldChange(e.target.value)}
                className="form-input"
              />
            </div>
          )}

          {/* Subject Line */}
          <div className="form-group">
            <label>Subject Line</label>
            <div className="subject-row">
              <input
                type="text"
                placeholder="Email subject"
                value={formData.subject}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className={`form-input ${errors.subject ? 'error' : ''}`}
              />
              <button
                className="btn-var-toggle"
                onClick={() => insertVariable('lead_name', true)}
                title="Insert lead_name variable"
              >
                +{{
              </button>
            </div>
            {errors.subject && (
              <span className="error-message">{errors.subject}</span>
            )}
            <div className="preview-hint">
              Preview: {renderedPreview || 'Your subject here'}
            </div>
          </div>

          {/* Plain Text Toggle */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={showPlainText}
                onChange={(e) => setShowPlainText(e.target.checked)}
              />
              Use Plain Text (instead of HTML)
            </label>
          </div>

          {/* Email Body */}
          <div className="form-group full-width">
            <label>{showPlainText ? 'Email Body (Plain Text)' : 'Email Body (HTML)'}</label>
            <div className="editor-controls">
              <div className="variable-buttons">
                <span className="variables-label">Quick Insert:</span>
                {AVAILABLE_VARIABLES.slice(0, 5).map((var) => (
                  <button
                    key={var.key}
                    type="button"
                    className="btn-var"
                    onClick={() => insertVariable(var.key, false)}
                    title={var.description}
                  >
                    {{var.key}}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder={
                showPlainText
                  ? 'Enter plain text email body. Use {{variable}} syntax for dynamic content.'
                  : 'Enter HTML email body. Use {{variable}} syntax for dynamic content.'
              }
              value={showPlainText ? formData.body : formData.bodyHtml}
              onChange={(e) =>
                showPlainText
                  ? handleBodyChange(e.target.value)
                  : handleBodyHtmlChange(e.target.value)
              }
              className={`form-textarea ${errors.body ? 'error' : ''}`}
              rows={10}
            />
            {errors.body && <span className="error-message">{errors.body}</span>}
          </div>

          {/* Advanced Options */}
          <div className="advanced-section">
            <h4>Email Options</h4>
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.trackOpens}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, trackOpens: e.target.checked }))
                  }
                />
                Track Opens
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.trackClicks}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, trackClicks: e.target.checked }))
                  }
                />
                Track Clicks
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.includeAttachments}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, includeAttachments: e.target.checked }))
                  }
                />
                Include Attachments
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              className="btn-save"
              onClick={handleSave}
              disabled={saveLoading}
            >
              <Save size={16} /> {saveLoading ? 'Saving...' : 'Save Template'}
            </button>

            {initialTemplate && (
              <>
                <button
                  className="btn-duplicate"
                  onClick={() => setDuplicateModalOpen(true)}
                >
                  <Copy size={16} /> Duplicate
                </button>
                <button
                  className="btn-delete-action"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right Panel: Preview */}
        <div className="preview-panel">
          <div className="preview-toggle">
            <h3>Preview</h3>
            <button
              className={`btn-toggle ${showPreview ? 'active' : ''}`}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
          </div>

          {showPreview && (
            <>
              {/* Test Email Input */}
              <div className="test-section">
                <h4>Send Test Email</h4>
                <div className="test-input-row">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="form-input"
                  />
                  <button
                    className="btn-test"
                    onClick={handleTestEmail}
                    disabled={testLoading || !testEmail.trim()}
                  >
                    {testLoading ? (
                      'Sending...'
                    ) : (
                      <>
                        <Send size={14} /> Send
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Subject Preview */}
              <div className="preview-item">
                <div className="preview-label">Subject:</div>
                <div className="preview-box">
                  <strong>{renderedPreview || '(empty)'}</strong>
                </div>
              </div>

              {/* Body Preview */}
              <div className="preview-item full">
                <div className="preview-label">Preview:</div>
                <div className="preview-box body-preview">
                  {bodyPreview ? (
                    <div dangerouslySetInnerHTML={{ __html: bodyPreview }} />
                  ) : (
                    <em>(empty)</em>
                  )}
                </div>
              </div>

              {/* Available Variables */}
              <div className="variables-section">
                <h4>Available Variables</h4>
                <div className="variables-grid">
                  {AVAILABLE_VARIABLES.map((variable) => (
                    <div key={variable.key} className="variable-card">
                      <div className="variable-key">{{variable.key}}</div>
                      <div className="variable-desc">{variable.description}</div>
                      <div className="variable-example">
                        e.g. {SAMPLE_PREVIEW_DATA[variable.key]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {!showPreview && (
            <div className="empty-preview">
              <Eye size={32} />
              <p>Click the eye icon to see preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(EmailTemplateEditor);

/**
 * ActionBuilder Component
 * Configure automation actions with 6 action types
 * Types: send_email, add_tag, assign_manager, create_task, update_field, webhook
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Mail,
  Tag,
  Users,
  CheckSquare,
  Database,
  GitBranch,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  X,
  Eye,
} from 'lucide-react';
import type {
  ActionType,
  ActionConfig,
  EmailTemplate,
  Action,
} from '../../types/automation';
import './ActionBuilder.css';

interface ActionBuilderProps {
  selectedAction: ActionType | '';
  onActionChange: (action: ActionType) => void;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  existingTags?: string[];
  teamMembers?: Array<{ id: string; name: string; email: string }>;
  emailTemplates?: EmailTemplate[];
  leadFields?: Array<{ value: string; label: string; type: string }>;
  errors?: Record<string, string>;
}

type ActionSection = ActionType | '';

interface EmailTemplatePreview {
  id: string;
  subject: string;
  preview: string;
}

const ACTION_TYPES: Array<{ value: ActionType; label: string; icon: React.ReactNode; description: string }> = [
  {
    value: 'send_email',
    label: 'Send Email',
    icon: <Mail size={20} />,
    description: 'Send email to leads or team members',
  },
  {
    value: 'add_tag',
    label: 'Add Tag',
    icon: <Tag size={20} />,
    description: 'Add tags to leads for organization',
  },
  {
    value: 'assign_user',
    label: 'Assign Manager',
    icon: <Users size={20} />,
    description: 'Assign lead to team member',
  },
  {
    value: 'create_task',
    label: 'Create Task',
    icon: <CheckSquare size={20} />,
    description: 'Create tasks in your task system',
  },
  {
    value: 'update_field',
    label: 'Update Field',
    icon: <Database size={20} />,
    description: 'Update lead field values',
  },
  {
    value: 'webhook',
    label: 'Webhook',
    icon: <GitBranch size={20} />,
    description: 'Send data to external systems',
  },
];

const DEFAULT_STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

const ActionBuilder: React.FC<ActionBuilderProps> = ({
  selectedAction,
  onActionChange,
  config,
  onConfigChange,
  existingTags = [],
  teamMembers = [],
  emailTemplates = [],
  leadFields = [],
  errors = {},
}) => {
  const [expandedSection, setExpandedSection] = useState<ActionSection>(selectedAction);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [customEmailList, setCustomEmailList] = useState<string[]>(config.custom_emails || []);
  const [currentCustomEmail, setCurrentCustomEmail] = useState('');
  const [testWebhookLoading, setTestWebhookLoading] = useState(false);

  // Get selected email template for preview
  const selectedTemplate = useMemo(() => {
    if (!config.template_id || !emailTemplates) return null;
    return emailTemplates.find(t => t.id === config.template_id);
  }, [config.template_id, emailTemplates]);

  // Handle action selection
  const handleActionSelect = useCallback((action: ActionType) => {
    onActionChange(action);
    setExpandedSection(action);
    onConfigChange({});
  }, [onActionChange, onConfigChange]);

  // Handle section expand/collapse
  const toggleSection = useCallback((section: ActionSection) => {
    setExpandedSection(expandedSection === section ? '' : section);
  }, [expandedSection]);

  // ─────────────────────────────────────────────────────────────────────────────
  // SEND EMAIL HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleEmailTemplateChange = useCallback((templateId: string) => {
    onConfigChange({ ...config, template_id: templateId });
  }, [config, onConfigChange]);

  const handleEmailSubjectChange = useCallback((subject: string) => {
    onConfigChange({ ...config, custom_subject: subject });
  }, [config, onConfigChange]);

  const handleRecipientTypeChange = useCallback((recipientType: string) => {
    onConfigChange({ ...config, recipient_type: recipientType });
  }, [config, onConfigChange]);

  const handleAddCustomEmail = useCallback(() => {
    if (!currentCustomEmail.trim()) return;
    const newEmails = [...customEmailList, currentCustomEmail.trim()];
    setCustomEmailList(newEmails);
    onConfigChange({ ...config, custom_emails: newEmails });
    setCurrentCustomEmail('');
  }, [currentCustomEmail, customEmailList, config, onConfigChange]);

  const handleRemoveCustomEmail = useCallback((email: string) => {
    const newEmails = customEmailList.filter(e => e !== email);
    setCustomEmailList(newEmails);
    onConfigChange({ ...config, custom_emails: newEmails });
  }, [customEmailList, config, onConfigChange]);

  const handleDelayChange = useCallback((delay: number) => {
    onConfigChange({ ...config, delay_minutes: delay });
  }, [config, onConfigChange]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ADD TAG HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddTag = useCallback(() => {
    if (!tagInput.trim()) return;
    const newTags = [...(config.tags || []), tagInput.trim()];
    onConfigChange({ ...config, tags: newTags });
    setTagInput('');
  }, [tagInput, config, onConfigChange]);

  const handleRemoveTag = useCallback((tag: string) => {
    const newTags = (config.tags || []).filter((t: string) => t !== tag);
    onConfigChange({ ...config, tags: newTags });
  }, [config, onConfigChange]);

  const handleTagColorChange = useCallback((color: string) => {
    onConfigChange({ ...config, tag_color: color });
  }, [config, onConfigChange]);

  // ─────────────────────────────────────────────────────────────────────────────
  // ASSIGN MANAGER HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAssignManagerChange = useCallback((managerId: string) => {
    onConfigChange({ ...config, assigned_to: managerId });
  }, [config, onConfigChange]);

  const handleManagerMessageChange = useCallback((message: string) => {
    onConfigChange({ ...config, manager_message: message });
  }, [config, onConfigChange]);

  const handlePriorityChange = useCallback((priority: string) => {
    onConfigChange({ ...config, priority: priority });
  }, [config, onConfigChange]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CREATE TASK HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleTaskTitleChange = useCallback((title: string) => {
    onConfigChange({ ...config, title });
  }, [config, onConfigChange]);

  const handleTaskDescriptionChange = useCallback((description: string) => {
    onConfigChange({ ...config, description });
  }, [config, onConfigChange]);

  const handleTaskDueDateChange = useCallback((days: number) => {
    onConfigChange({ ...config, due_date_offset_days: days });
  }, [config, onConfigChange]);

  const handleTaskAssigneeChange = useCallback((assigneeId: string) => {
    onConfigChange({ ...config, assigned_to: assigneeId });
  }, [config, onConfigChange]);

  // ─────────────────────────────────────────────────────────────────────────────
  // UPDATE FIELD HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleFieldChange = useCallback((field: string) => {
    onConfigChange({ ...config, field_name: field, value: '' });
  }, [config, onConfigChange]);

  const handleFieldValueChange = useCallback((value: string | number | boolean) => {
    onConfigChange({ ...config, value });
  }, [config, onConfigChange]);

  // ─────────────────────────────────────────────────────────────────────────────
  // WEBHOOK HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleWebhookUrlChange = useCallback((url: string) => {
    onConfigChange({ ...config, url });
  }, [config, onConfigChange]);

  const handleWebhookMethodChange = useCallback((method: string) => {
    onConfigChange({ ...config, method: method as 'POST' | 'PUT' | 'PATCH' });
  }, [config, onConfigChange]);

  const handleWebhookPayloadChange = useCallback((payload: string) => {
    try {
      JSON.parse(payload);
      onConfigChange({ ...config, payload });
    } catch (e) {
      // Invalid JSON - don't update yet
    }
  }, [config, onConfigChange]);

  const handleWebhookHeadersChange = useCallback((headers: string) => {
    try {
      JSON.parse(headers);
      onConfigChange({ ...config, headers });
    } catch (e) {
      // Invalid JSON - don't update yet
    }
  }, [config, onConfigChange]);

  const handleTestWebhook = useCallback(async () => {
    if (!config.url) return;
    setTestWebhookLoading(true);
    try {
      const payload = config.payload ? JSON.parse(config.payload) : {};
      const headers = config.headers ? JSON.parse(config.headers) : {};

      const response = await fetch(config.url, {
        method: config.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Webhook test successful!');
      } else {
        alert(`Webhook test failed: ${response.status}`);
      }
    } catch (error) {
      alert(`Webhook test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestWebhookLoading(false);
    }
  }, [config]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER SECTIONS
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="action-builder-container">
      {/* Action Type Selection */}
      <div className="action-types-grid">
        {ACTION_TYPES.map((action) => (
          <button
            key={action.value}
            className={`action-type-button ${selectedAction === action.value ? 'selected' : ''}`}
            onClick={() => handleActionSelect(action.value)}
            type="button"
          >
            <div className="action-icon">{action.icon}</div>
            <div className="action-label">{action.label}</div>
            <div className="action-description">{action.description}</div>
          </button>
        ))}
      </div>

      {/* Action Configuration Sections */}
      <div className="action-sections">
        {/* SEND EMAIL SECTION */}
        {selectedAction === 'send_email' && (
          <div className="action-section send-email-section">
            <div
              className="section-header"
              onClick={() => toggleSection('send_email')}
            >
              <Mail size={20} />
              <h3>Email Configuration</h3>
              {expandedSection === 'send_email' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'send_email' && (
              <div className="section-content">
                {/* Email Template */}
                <div className="form-group">
                  <label>Email Template</label>
                  <select
                    value={config.template_id || ''}
                    onChange={(e) => handleEmailTemplateChange(e.target.value)}
                    className={`form-select ${errors.template_id ? 'error' : ''}`}
                  >
                    <option value="">Select a template...</option>
                    {emailTemplates?.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <button
                      type="button"
                      className="btn-preview"
                      onClick={() => setShowEmailPreview(!showEmailPreview)}
                    >
                      <Eye size={16} /> Preview Template
                    </button>
                  )}
                  {errors.template_id && <span className="error-message">{errors.template_id}</span>}
                </div>

                {/* Template Preview */}
                {showEmailPreview && selectedTemplate && (
                  <div className="template-preview">
                    <h4>Template Preview</h4>
                    <div className="preview-content">
                      <p><strong>Subject:</strong> {selectedTemplate.subject}</p>
                      <p><strong>Body:</strong> {selectedTemplate.body?.substring(0, 200)}...</p>
                    </div>
                  </div>
                )}

                {/* Custom Subject */}
                <div className="form-group">
                  <label>Custom Subject Line (Optional)</label>
                  <input
                    type="text"
                    placeholder="Optional - overrides template subject"
                    value={config.custom_subject || ''}
                    onChange={(e) => handleEmailSubjectChange(e.target.value)}
                    className="form-input"
                  />
                  <p className="field-hint">Leave blank to use template subject</p>
                </div>

                {/* Recipient Type */}
                <div className="form-group">
                  <label>Send To</label>
                  <select
                    value={config.recipient_type || 'lead'}
                    onChange={(e) => handleRecipientTypeChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="lead">Lead Email</option>
                    <option value="assigned_user">Manager Email</option>
                    <option value="custom">Custom Email List</option>
                  </select>
                </div>

                {/* Custom Email List */}
                {config.recipient_type === 'custom' && (
                  <div className="form-group">
                    <label>Custom Email List</label>
                    <div className="email-list-input">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        value={currentCustomEmail}
                        onChange={(e) => setCurrentCustomEmail(e.target.value)}
                        className="form-input"
                      />
                      <button
                        type="button"
                        className="btn-add"
                        onClick={handleAddCustomEmail}
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                    {customEmailList.length > 0 && (
                      <div className="email-chips">
                        {customEmailList.map((email) => (
                          <span key={email} className="email-chip">
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomEmail(email)}
                              className="btn-remove"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delay */}
                <div className="form-group">
                  <label>Delay Before Send</label>
                  <select
                    value={config.delay_minutes || 0}
                    onChange={(e) => handleDelayChange(Number(e.target.value))}
                    className="form-select"
                  >
                    <option value={0}>Send Immediately</option>
                    <option value={60}>After 1 hour</option>
                    <option value={1440}>After 1 day</option>
                    <option value={10080}>After 1 week</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADD TAG SECTION */}
        {selectedAction === 'add_tag' && (
          <div className="action-section add-tag-section">
            <div
              className="section-header"
              onClick={() => toggleSection('add_tag')}
            >
              <Tag size={20} />
              <h3>Tag Configuration</h3>
              {expandedSection === 'add_tag' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'add_tag' && (
              <div className="section-content">
                {/* Tag Input */}
                <div className="form-group">
                  <label>Add Tags</label>
                  <div className="tag-input-group">
                    <input
                      type="text"
                      placeholder="Enter tag name"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="btn-add"
                      onClick={handleAddTag}
                    >
                      <Plus size={16} /> Add
                    </button>
                  </div>
                </div>

                {/* Existing Tags Suggestions */}
                {existingTags && existingTags.length > 0 && (
                  <div className="form-group">
                    <label>Existing Tags</label>
                    <div className="tag-suggestions">
                      {existingTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          className="tag-suggestion"
                          onClick={() => {
                            setTagInput(tag);
                          }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Tags */}
                {(config.tags || []).length > 0 && (
                  <div className="form-group">
                    <label>Tags to Add</label>
                    <div className="tag-chips">
                      {(config.tags || []).map((tag: string) => (
                        <span key={tag} className="tag-chip">
                          {tag}
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="btn-remove"
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tag Color */}
                <div className="form-group">
                  <label>Tag Color</label>
                  <div className="color-picker-group">
                    {['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'gray'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`color-option color-${color} ${config.tag_color === color ? 'selected' : ''}`}
                        onClick={() => handleTagColorChange(color)}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ASSIGN MANAGER SECTION */}
        {selectedAction === 'assign_user' && (
          <div className="action-section assign-manager-section">
            <div
              className="section-header"
              onClick={() => toggleSection('assign_user')}
            >
              <Users size={20} />
              <h3>Assign Manager</h3>
              {expandedSection === 'assign_user' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'assign_user' && (
              <div className="section-content">
                {/* Manager Selection */}
                <div className="form-group">
                  <label>Select Manager</label>
                  <select
                    value={config.assigned_to || ''}
                    onChange={(e) => handleAssignManagerChange(e.target.value)}
                    className={`form-select ${errors.assigned_to ? 'error' : ''}`}
                  >
                    <option value="">Choose a manager...</option>
                    {teamMembers?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                  {errors.assigned_to && <span className="error-message">{errors.assigned_to}</span>}
                </div>

                {/* Priority */}
                <div className="form-group">
                  <label>Priority Level</label>
                  <select
                    value={config.priority || 'medium'}
                    onChange={(e) => handlePriorityChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Manager Message */}
                <div className="form-group">
                  <label>Message to Manager (Optional)</label>
                  <textarea
                    placeholder="Include any context or instructions for the manager..."
                    value={config.manager_message || ''}
                    onChange={(e) => handleManagerMessageChange(e.target.value)}
                    className="form-textarea"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CREATE TASK SECTION */}
        {selectedAction === 'create_task' && (
          <div className="action-section create-task-section">
            <div
              className="section-header"
              onClick={() => toggleSection('create_task')}
            >
              <CheckSquare size={20} />
              <h3>Create Task</h3>
              {expandedSection === 'create_task' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'create_task' && (
              <div className="section-content">
                {/* Task Title */}
                <div className="form-group">
                  <label>Task Title</label>
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={config.title || ''}
                    onChange={(e) => handleTaskTitleChange(e.target.value)}
                    className={`form-input ${errors.title ? 'error' : ''}`}
                  />
                  {errors.title && <span className="error-message">{errors.title}</span>}
                </div>

                {/* Task Description */}
                <div className="form-group">
                  <label>Task Description</label>
                  <textarea
                    placeholder="Enter task details"
                    value={config.description || ''}
                    onChange={(e) => handleTaskDescriptionChange(e.target.value)}
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                {/* Due Date */}
                <div className="form-group">
                  <label>Due Date (Days from now)</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    placeholder="0"
                    value={config.due_date_offset_days || 0}
                    onChange={(e) => handleTaskDueDateChange(Number(e.target.value))}
                    className="form-input"
                  />
                  <p className="field-hint">0 means due today, 7 means due in one week</p>
                </div>

                {/* Assignee */}
                <div className="form-group">
                  <label>Assign To</label>
                  <select
                    value={config.assigned_to || ''}
                    onChange={(e) => handleTaskAssigneeChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="">Not assigned</option>
                    {teamMembers?.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        {/* UPDATE FIELD SECTION */}
        {selectedAction === 'update_field' && (
          <div className="action-section update-field-section">
            <div
              className="section-header"
              onClick={() => toggleSection('update_field')}
            >
              <Database size={20} />
              <h3>Update Lead Field</h3>
              {expandedSection === 'update_field' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'update_field' && (
              <div className="section-content">
                {/* Field Selection */}
                <div className="form-group">
                  <label>Field to Update</label>
                  <select
                    value={config.field_name || ''}
                    onChange={(e) => handleFieldChange(e.target.value)}
                    className={`form-select ${errors.field_name ? 'error' : ''}`}
                  >
                    <option value="">Select a field...</option>
                    {leadFields?.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                  {errors.field_name && <span className="error-message">{errors.field_name}</span>}
                </div>

                {/* Value Input */}
                {config.field_name && (
                  <div className="form-group">
                    <label>New Value</label>
                    {config.field_name === 'status' ? (
                      <select
                        value={config.value || ''}
                        onChange={(e) => handleFieldValueChange(e.target.value)}
                        className="form-select"
                      >
                        <option value="">Select status...</option>
                        {DEFAULT_STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter new value"
                        value={config.value || ''}
                        onChange={(e) => handleFieldValueChange(e.target.value)}
                        className="form-input"
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* WEBHOOK SECTION */}
        {selectedAction === 'webhook' && (
          <div className="action-section webhook-section">
            <div
              className="section-header"
              onClick={() => toggleSection('webhook')}
            >
              <GitBranch size={20} />
              <h3>Webhook Configuration</h3>
              {expandedSection === 'webhook' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>

            {expandedSection === 'webhook' && (
              <div className="section-content">
                {/* Webhook URL */}
                <div className="form-group">
                  <label>Webhook URL</label>
                  <input
                    type="url"
                    placeholder="https://api.example.com/webhook"
                    value={config.url || ''}
                    onChange={(e) => handleWebhookUrlChange(e.target.value)}
                    className={`form-input ${errors.url ? 'error' : ''}`}
                  />
                  {errors.url && <span className="error-message">{errors.url}</span>}
                </div>

                {/* HTTP Method */}
                <div className="form-group">
                  <label>HTTP Method</label>
                  <select
                    value={config.method || 'POST'}
                    onChange={(e) => handleWebhookMethodChange(e.target.value)}
                    className="form-select"
                  >
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                {/* Headers */}
                <div className="form-group">
                  <label>Headers (JSON)</label>
                  <textarea
                    placeholder='{"Authorization": "Bearer token"}'
                    value={config.headers || ''}
                    onChange={(e) => handleWebhookHeadersChange(e.target.value)}
                    className="form-textarea"
                    rows={2}
                  />
                  <p className="field-hint">Optional - Enter valid JSON</p>
                </div>

                {/* Payload */}
                <div className="form-group">
                  <label>Payload Template (JSON)</label>
                  <textarea
                    placeholder='{"lead_id": "{{lead_id}}", "status": "{{status}}"}'
                    value={config.payload || ''}
                    onChange={(e) => handleWebhookPayloadChange(e.target.value)}
                    className={`form-textarea ${errors.payload ? 'error' : ''}`}
                    rows={4}
                  />
                  {errors.payload && <span className="error-message">{errors.payload}</span>}
                  <p className="field-hint">Use variables like {{lead_id}}, {{email}}, {{status}}</p>
                </div>

                {/* Test Button */}
                <div className="form-group">
                  <button
                    type="button"
                    className="btn-test-webhook"
                    onClick={handleTestWebhook}
                    disabled={!config.url || testWebhookLoading}
                  >
                    {testWebhookLoading ? 'Testing...' : 'Test Webhook'}
                  </button>
                  <p className="field-hint">Sends a test payload to your webhook URL</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Errors */}
      {Object.keys(errors).length > 0 && selectedAction && (
        <div className="action-errors">
          <AlertCircle size={16} />
          <span>Please fix the errors above before saving</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(ActionBuilder);

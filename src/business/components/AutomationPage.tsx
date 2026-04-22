import React, { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusiness } from '../context/BusinessContext';
import {
  fetchAutomationRules,
  createAutomationRule,
  updateAutomationRule,
  deleteAutomationRule,
} from '@/app/api/supabase-data';

interface AutomationRule {
  id: string;
  rule_name: string;
  trigger_type: string;
  action_type: string;
  is_active: boolean;
  run_count: number;
}

export const AutomationPage: React.FC = () => {
  const { isDark } = useTheme();
  const { businessId } = useBusiness();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [formData, setFormData] = useState({
    rule_name: '',
    trigger_type: 'lead_added',
    action_type: 'send_email',
    trigger_conditions: '',
    action_config: '',
  });

  const colors = {
    bg: isDark ? '#0b1220' : '#ffffff',
    card: isDark ? '#111827' : '#f9fafb',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.1)',
    text: isDark ? '#f1f5f9' : '#1f2937',
    textMuted: isDark ? '#6b7280' : '#6b7280',
    primary: '#6366f1',
    accent: '#F97316',
  };

  const triggerTypes = [
    { value: 'lead_added', label: 'Lead Added' },
    { value: 'email_opened', label: 'Email Opened' },
    { value: 'email_clicked', label: 'Email Clicked' },
    { value: 'lead_qualified', label: 'Lead Qualified' },
    { value: 'inactivity_30d', label: '30 Days Inactivity' },
  ];

  const actionTypes = [
    { value: 'send_email', label: 'Send Email' },
    { value: 'send_sms', label: 'Send SMS' },
    { value: 'create_task', label: 'Create Task' },
    { value: 'add_tag', label: 'Add Tag' },
    { value: 'update_field', label: 'Update Field' },
    { value: 'webhook', label: 'Webhook' },
  ];

  useEffect(() => {
    loadRules();
  }, [businessId]);

  const loadRules = async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await fetchAutomationRules(businessId);
      setRules(data as AutomationRule[]);
    } catch (err) {
      console.error('Load rules failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!businessId || !formData.rule_name) return;

    try {
      let triggerConditions: Record<string, any> = {};
      let actionConfig: Record<string, any> = {};

      try {
        if (formData.trigger_conditions) {
          triggerConditions = JSON.parse(formData.trigger_conditions);
        }
        if (formData.action_config) {
          actionConfig = JSON.parse(formData.action_config);
        }
      } catch {
        console.warn('Could not parse JSON configs, using defaults');
      }

      await createAutomationRule(businessId, {
        rule_name: formData.rule_name,
        trigger_type: formData.trigger_type,
        trigger_conditions: triggerConditions,
        action_type: formData.action_type,
        action_config: actionConfig,
      });

      setFormData({
        rule_name: '',
        trigger_type: 'lead_added',
        action_type: 'send_email',
        trigger_conditions: '',
        action_config: '',
      });
      setShowNewForm(false);
      await loadRules();
    } catch (err) {
      console.error('Add rule failed:', err);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteAutomationRule(ruleId);
      await loadRules();
    } catch (err) {
      console.error('Delete rule failed:', err);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      await updateAutomationRule(ruleId, { is_active: !isActive });
      await loadRules();
    } catch (err) {
      console.error('Toggle rule failed:', err);
    }
  };

  const getTriggerLabel = (trigger: string) => triggerTypes.find((t) => t.value === trigger)?.label || trigger;
  const getActionLabel = (action: string) => actionTypes.find((a) => a.value === action)?.label || action;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: colors.bg }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.text, margin: '0 0 8px 0' }}>
          Automation
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
          Create if/then rules to automate customer workflows
        </p>
      </div>

      {/* Add Button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          style={{
            padding: '10px 20px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          {showNewForm ? 'Cancel' : '+ Create Rule'}
        </button>
      </div>

      {/* New Rule Form */}
      {showNewForm && (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginTop: 0 }}>
            New Automation Rule
          </h3>

          {/* Rule Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Rule Name
            </label>
            <input
              type="text"
              placeholder="e.g., Welcome New Leads"
              value={formData.rule_name}
              onChange={(e) => setFormData({ ...formData, rule_name: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Trigger Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              When This Happens (Trigger)
            </label>
            <select
              value={formData.trigger_type}
              onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            >
              {triggerTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Conditions (Optional) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Trigger Conditions (JSON, optional)
            </label>
            <textarea
              placeholder='{"field": "status", "operator": "equals", "value": "hot"}'
              value={formData.trigger_conditions}
              onChange={(e) => setFormData({ ...formData, trigger_conditions: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '12px',
                boxSizing: 'border-box',
                minHeight: '80px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          {/* Action Type */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Then Do This (Action)
            </label>
            <select
              value={formData.action_type}
              onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
            >
              {actionTypes.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Config (Optional) */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: colors.text, marginBottom: '6px' }}>
              Action Configuration (JSON, optional)
            </label>
            <textarea
              placeholder='{"email_template_id": "...", "subject": "Welcome!"}'
              value={formData.action_config}
              onChange={(e) => setFormData({ ...formData, action_config: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: isDark ? 'rgba(255,255,255,0.02)' : '#f0f0f0',
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                color: colors.text,
                fontSize: '12px',
                boxSizing: 'border-box',
                minHeight: '80px',
                fontFamily: 'monospace',
              }}
            />
          </div>

          <button
            onClick={handleAddRule}
            style={{
              padding: '8px 16px',
              background: colors.accent,
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            Create Rule
          </button>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <p style={{ color: colors.textMuted }}>Loading rules...</p>
      ) : rules.length === 0 ? (
        <div
          style={{
            background: colors.card,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '48px 24px',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>🤖</p>
          <p style={{ color: colors.textMuted, margin: 0 }}>No automation rules yet. Create one to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                background: colors.card,
                border: `1px solid ${rule.is_active ? colors.primary : colors.border}`,
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: colors.text, margin: '0 0 8px 0' }}>
                    {rule.rule_name}
                  </h3>
                  <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 4px 0' }}>
                    <span style={{ fontWeight: '500', color: colors.text }}>If:</span> {getTriggerLabel(rule.trigger_type)}
                  </p>
                  <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 4px 0' }}>
                    <span style={{ fontWeight: '500', color: colors.text }}>Then:</span> {getActionLabel(rule.action_type)}
                  </p>
                  <p style={{ fontSize: '12px', color: colors.textMuted, margin: 0 }}>
                    Executed {rule.run_count} times
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.is_active)}
                    style={{
                      padding: '6px 12px',
                      background: rule.is_active ? colors.primary : 'transparent',
                      color: rule.is_active ? 'white' : colors.textMuted,
                      border: `1px solid ${rule.is_active ? colors.primary : colors.border}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    style={{
                      padding: '6px 12px',
                      background: 'transparent',
                      color: colors.accent,
                      border: `1px solid ${colors.accent}`,
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

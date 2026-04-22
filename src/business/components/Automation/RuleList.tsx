import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, Play, Eye, MoreVertical } from 'lucide-react';
import type { AutomationRule } from '../../types/automation';
import { useAutomation } from '../../hooks/useAutomation';
import './RuleList.css';

interface RuleListProps {
  onEditRule: (rule: AutomationRule) => void;
  onViewLogs: (ruleId: string) => void;
}

export const RuleList: React.FC<RuleListProps> = ({ onEditRule, onViewLogs }) => {
  const {
    rules,
    loading,
    error,
    fetchRules,
    deleteRule,
    toggleRuleActive,
    testRule,
  } = useAutomation();

  const [selectedRule, setSelectedRule] = useState<string | null>(null);
  const [testingRuleId, setTestingRuleId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'triggers' | 'active'>('name');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const filteredRules = rules.filter((rule) => {
    if (filterActive === 'active') return rule.is_active;
    if (filterActive === 'inactive') return !rule.is_active;
    return true;
  });

  const sortedRules = [...filteredRules].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'active') return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    return 0;
  });

  const handleTest = async (ruleId: string) => {
    setTestingRuleId(ruleId);
    try {
      await testRule(ruleId);
      alert('Rule test successful - check logs for details');
    } catch (err) {
      alert('Rule test failed - check logs for error details');
    } finally {
      setTestingRuleId(null);
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule? This action cannot be undone.')) {
      await deleteRule(ruleId);
      setSelectedRule(null);
    }
  };

  if (loading) {
    return <div className="rule-list-loading">Loading automation rules...</div>;
  }

  if (error) {
    return <div className="rule-list-error">Error loading rules: {error}</div>;
  }

  return (
    <div className="rule-list-container">
      <div className="rule-list-header">
        <h2>Automation Rules</h2>
        <div className="rule-list-controls">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
            className="rule-list-filter"
          >
            <option value="all">All Rules</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="rule-list-sort"
          >
            <option value="name">Sort by Name</option>
            <option value="triggers">Sort by Triggers</option>
            <option value="active">Sort by Status</option>
          </select>
        </div>
      </div>

      <div className="rule-list-stats">
        <div className="stat">
          <span className="stat-label">Total Rules</span>
          <span className="stat-value">{rules.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Active</span>
          <span className="stat-value stat-active">
            {rules.filter((r) => r.is_active).length}
          </span>
        </div>
        <div className="stat">
          <span className="stat-label">Executions (This Month)</span>
          <span className="stat-value">
            {rules.reduce((sum, r) => sum + (r.run_count || 0), 0)}
          </span>
        </div>
      </div>

      {sortedRules.length === 0 ? (
        <div className="rule-list-empty">
          <p>No automation rules created yet</p>
          <p className="rule-list-empty-hint">Click "Create Rule" to get started</p>
        </div>
      ) : (
        <div className="rule-list-table">
          <div className="rule-list-header-row">
            <div className="col-name">Rule Name</div>
            <div className="col-trigger">Trigger</div>
            <div className="col-action">Action</div>
            <div className="col-status">Status</div>
            <div className="col-executions">Executions</div>
            <div className="col-actions">Actions</div>
          </div>

          {sortedRules.map((rule) => (
            <div
              key={rule.id}
              className={`rule-list-row ${selectedRule === rule.id ? 'selected' : ''}`}
              onClick={() => setSelectedRule(rule.id)}
            >
              <div className="col-name">
                <span className="rule-name">{rule.name}</span>
                {rule.is_active && <span className="badge badge-active">Active</span>}
              </div>
              <div className="col-trigger">
                <span className="trigger-badge">
                  {getTriggerLabel(rule.trigger_type)}
                </span>
              </div>
              <div className="col-action">
                <span className="action-badge">{getActionLabel(rule.action_type)}</span>
              </div>
              <div className="col-status">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleRuleActive(rule.id, !rule.is_active);
                    }}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div className="col-executions">{rule.run_count || 0}</div>
              <div className="col-actions">
                <button
                  className="action-btn btn-test"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTest(rule.id);
                  }}
                  disabled={testingRuleId === rule.id}
                  title="Test this rule"
                >
                  <Play size={16} />
                </button>
                <button
                  className="action-btn btn-logs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLogs(rule.id);
                  }}
                  title="View execution logs"
                >
                  <Eye size={16} />
                </button>
                <button
                  className="action-btn btn-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditRule(rule);
                  }}
                  title="Edit this rule"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="action-btn btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(rule.id);
                  }}
                  title="Delete this rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function getTriggerLabel(trigger: string): string {
  const labels: Record<string, string> = {
    lead_added: '➕ Lead Added',
    email_opened: '📧 Email Opened',
    email_clicked: '🔗 Email Clicked',
    lead_qualified: '✓ Lead Qualified',
    inactivity_30d: '⏰ 30 Days Inactivity',
    stage_changed: '📊 Stage Changed',
    manual: '👤 Manual Trigger',
  };
  return labels[trigger] || trigger;
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    send_email: '📧 Send Email',
    add_tag: '🏷️ Add Tag',
    assign_manager: '👤 Assign Manager',
    create_task: '✓ Create Task',
    update_field: '⚙️ Update Field',
    webhook: '🪝 Webhook',
  };
  return labels[action] || action;
}

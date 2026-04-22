/**
 * RuleDebugger Component
 * Test and debug automation rules with dry-run and actual execution
 * Split-panel layout: Rule config on left, test results on right
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  Play,
  Loader,
  CheckCircle,
  AlertCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
} from 'lucide-react';
import type {
  AutomationRule,
  Condition,
  Action,
  ConditionEvaluationResult,
  DryRunResult,
  TriggerType,
} from '../../types/automation';
import './RuleDebugger.css';

interface RuleDebuggerProps {
  ruleId: string;
  rule: AutomationRule;
  availableLeads?: Array<{ id: string; name: string; email: string }>;
  onTestRun?: (result: DryRunResult) => void;
}

interface TestResults {
  dryRunResult?: DryRunResult;
  executionResult?: any;
  loading: boolean;
  error?: string;
  executionTime?: number;
  isDryRun: boolean;
}

interface ExpandedSections {
  [key: string]: boolean;
}

const TRIGGER_DESCRIPTIONS: Record<TriggerType, string> = {
  lead_added: 'Triggered when a new lead is created',
  stage_changed: 'Triggered when a lead moves to a different stage',
  inactivity: 'Triggered when a lead is inactive for specified days',
  email_opened: 'Triggered when a recipient opens an email',
  email_clicked: 'Triggered when a recipient clicks a link in an email',
  milestone_reached: 'Triggered when a custom milestone event occurs',
};

const RuleDebugger: React.FC<RuleDebuggerProps> = ({
  ruleId,
  rule,
  availableLeads = [],
  onTestRun,
}) => {
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    availableLeads.length > 0 ? availableLeads[0].id : ''
  );
  const [testResults, setTestResults] = useState<TestResults>({
    loading: false,
    isDryRun: true,
  });
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    trigger: true,
    conditions: true,
    actions: true,
    results: true,
  });
  const [showWarningConfirm, setShowWarningConfirm] = useState(false);

  const selectedLead = useMemo(
    () => availableLeads.find((l) => l.id === selectedLeadId),
    [selectedLeadId, availableLeads]
  );

  // Toggle section expansion
  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // Simulate test run
  const handleRunTest = useCallback(
    async (isDryRun: boolean) => {
      if (!selectedLead) {
        alert('Please select a lead to test against');
        return;
      }

      if (!isDryRun && !showWarningConfirm) {
        setShowWarningConfirm(true);
        return;
      }

      setTestResults((prev) => ({
        ...prev,
        loading: true,
        error: undefined,
      }));

      const startTime = performance.now();

      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock dry run result
        const mockResult: DryRunResult = {
          rule_id: ruleId,
          trigger_passed: true,
          trigger_details: {
            trigger_type: rule.trigger_type,
            passed: true,
            reason: 'Lead data matches trigger conditions',
          },
          condition_evaluations: (rule.conditions || []).map((cond, idx) => ({
            condition_id: cond.id,
            passed: Math.random() > 0.3,
            field_name: cond.field_name,
            operator: cond.operator,
            field_value: `Sample ${cond.field_name} value`,
            expected_value: cond.value,
          })),
          conditions_passed: true,
          action_simulations: (rule.actions || []).map((action, idx) => ({
            action_id: action.id,
            action_type: action.action_type,
            config: action.action_config,
            would_execute: true,
            reason: 'All conditions met',
            preview: `Action would: ${action.action_type}`,
          })),
          overall_result: 'PASS - All conditions met, actions would execute',
          estimated_execution_time_ms: Math.floor(Math.random() * 500) + 100,
          warnings: ['Email delivery may take up to 5 minutes'],
        };

        const endTime = performance.now();

        setTestResults({
          loading: false,
          isDryRun,
          dryRunResult: mockResult,
          executionTime: endTime - startTime,
        });

        onTestRun?.(mockResult);
        setShowWarningConfirm(false);
      } catch (error) {
        setTestResults((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error ? error.message : 'Test run failed',
        }));
      }
    },
    [selectedLead, ruleId, rule, showWarningConfirm, onTestRun]
  );

  // Copy condition result to clipboard
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  }, []);

  const hasResults = testResults.dryRunResult || testResults.executionResult;
  const resultSummary = testResults.dryRunResult?.overall_result;

  return (
    <div className="rule-debugger-container">
      {/* Warning Confirmation */}
      {showWarningConfirm && (
        <div className="warning-overlay">
          <div className="warning-dialog">
            <AlertTriangle size={32} color="#f59e0b" />
            <h3>Execute Rule on Lead</h3>
            <p>
              This will actually execute the rule and perform actions on the selected lead. Continue?
            </p>
            <div className="warning-actions">
              <button
                className="btn-cancel"
                onClick={() => setShowWarningConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => handleRunTest(false)}
              >
                Yes, Execute
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="debugger-content">
        {/* Left Panel: Rule Configuration */}
        <div className="left-panel">
          <h3 className="panel-title">Rule Configuration</h3>

          {/* Rule Header */}
          <div className="rule-header">
            <div className="rule-name">{rule.name}</div>
            <div className="rule-meta">
              <span className="rule-id">ID: {rule.id.substring(0, 8)}</span>
              <span className={`rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                {rule.enabled ? '✓ Enabled' : '✗ Disabled'}
              </span>
            </div>
          </div>

          {/* Trigger Section */}
          <div className="config-section">
            <div
              className="section-header"
              onClick={() => toggleSection('trigger')}
            >
              <h4>Trigger</h4>
              {expandedSections.trigger ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            {expandedSections.trigger && (
              <div className="section-body">
                <div className="config-item">
                  <span className="label">Type:</span>
                  <span className="value">{rule.trigger_type}</span>
                </div>
                <div className="config-item">
                  <span className="label">Description:</span>
                  <span className="value">
                    {TRIGGER_DESCRIPTIONS[rule.trigger_type]}
                  </span>
                </div>
                {Object.entries(rule.trigger_config || {}).map(([key, value]) => (
                  <div key={key} className="config-item">
                    <span className="label">{key}:</span>
                    <span className="value">{String(value)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions Section */}
          <div className="config-section">
            <div
              className="section-header"
              onClick={() => toggleSection('conditions')}
            >
              <h4>
                Conditions ({rule.conditions?.length || 0})
              </h4>
              {expandedSections.conditions ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            {expandedSections.conditions && (
              <div className="section-body">
                {rule.conditions && rule.conditions.length > 0 ? (
                  <div className="conditions-list">
                    {rule.conditions.map((cond, idx) => (
                      <div key={cond.id} className="condition-item">
                        <div className="condition-index">{idx + 1}</div>
                        <div className="condition-details">
                          <div className="condition-row">
                            <span className="field">{cond.field_name}</span>
                            <span className="operator">{cond.operator}</span>
                            <span className="value">{cond.value}</span>
                          </div>
                          <div className="condition-logic">
                            {cond.logic_operator}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">No conditions defined</div>
                )}
              </div>
            )}
          </div>

          {/* Actions Section */}
          <div className="config-section">
            <div
              className="section-header"
              onClick={() => toggleSection('actions')}
            >
              <h4>
                Actions ({rule.actions?.length || 0})
              </h4>
              {expandedSections.actions ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </div>
            {expandedSections.actions && (
              <div className="section-body">
                {rule.actions && rule.actions.length > 0 ? (
                  <div className="actions-list">
                    {rule.actions.map((action, idx) => (
                      <div key={action.id} className="action-item">
                        <div className="action-index">{idx + 1}</div>
                        <div className="action-details">
                          <div className="action-type">
                            {action.action_type}
                          </div>
                          {action.delay_seconds && (
                            <div className="action-delay">
                              Delay: {Math.floor(action.delay_seconds / 60)} min
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-message">No actions defined</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Test Results */}
        <div className="right-panel">
          <h3 className="panel-title">Test Execution</h3>

          {/* Test Lead Selection */}
          <div className="test-input-section">
            <label>Select Lead to Test Against</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="lead-select"
              disabled={testResults.loading}
            >
              <option value="">Choose a lead...</option>
              {availableLeads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.name} ({lead.email})
                </option>
              ))}
            </select>

            {selectedLead && (
              <div className="selected-lead-info">
                <div className="lead-detail">
                  <span className="label">Lead:</span>
                  <span className="value">{selectedLead.name}</span>
                </div>
                <div className="lead-detail">
                  <span className="label">Email:</span>
                  <span className="value">{selectedLead.email}</span>
                </div>
                <div className="lead-detail">
                  <span className="label">ID:</span>
                  <span className="value">{selectedLead.id}</span>
                </div>
              </div>
            )}
          </div>

          {/* Test Controls */}
          <div className="test-controls">
            <button
              className="btn-test btn-dryrun"
              onClick={() => handleRunTest(true)}
              disabled={!selectedLead || testResults.loading}
            >
              {testResults.loading && testResults.isDryRun ? (
                <>
                  <Loader size={16} className="spinner" /> Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} /> Dry Run
                </>
              )}
            </button>

            <button
              className="btn-test btn-execute"
              onClick={() => handleRunTest(false)}
              disabled={!selectedLead || testResults.loading}
            >
              {testResults.loading && !testResults.isDryRun ? (
                <>
                  <Loader size={16} className="spinner" /> Executing...
                </>
              ) : (
                <>
                  <Play size={16} /> Execute
                </>
              )}
            </button>
          </div>

          {testResults.error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{testResults.error}</span>
            </div>
          )}

          {/* Results Section */}
          {hasResults && (
            <div className="results-section">
              <div
                className="results-header"
                onClick={() => toggleSection('results')}
              >
                <h4>Test Results</h4>
                {expandedSections.results ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </div>

              {expandedSections.results && testResults.dryRunResult && (
                <div className="results-body">
                  {/* Overall Result */}
                  <div className="result-summary">
                    <div className={`result-badge ${testResults.dryRunResult.overall_result.includes('PASS') ? 'pass' : 'fail'}`}>
                      {testResults.dryRunResult.overall_result.includes('PASS') ? (
                        <CheckCircle size={20} />
                      ) : (
                        <AlertCircle size={20} />
                      )}
                      <span>{testResults.dryRunResult.overall_result}</span>
                    </div>
                    {testResults.executionTime && (
                      <div className="execution-time">
                        <Clock size={14} />
                        Execution time: {testResults.executionTime.toFixed(2)}ms
                      </div>
                    )}
                  </div>

                  {/* Trigger Evaluation */}
                  <div className="result-item">
                    <div className="result-label">
                      <span>Trigger Evaluation</span>
                      {testResults.dryRunResult.trigger_details.passed ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : (
                        <AlertCircle size={16} color="#ef4444" />
                      )}
                    </div>
                    <div className="result-value">
                      {testResults.dryRunResult.trigger_details.reason}
                    </div>
                  </div>

                  {/* Condition Evaluations */}
                  {testResults.dryRunResult.condition_evaluations.length > 0 && (
                    <div className="conditions-results">
                      <h5>Condition Evaluations</h5>
                      {testResults.dryRunResult.condition_evaluations.map((cond) => (
                        <div key={cond.condition_id} className="condition-result">
                          <div className="result-label">
                            <span>{cond.field_name}</span>
                            {cond.passed ? (
                              <CheckCircle size={14} color="#10b981" />
                            ) : (
                              <AlertCircle size={14} color="#ef4444" />
                            )}
                          </div>
                          <div className="condition-comparison">
                            <div className="value-item">
                              <span className="label">Field:</span>
                              <code>{String(cond.field_value)}</code>
                            </div>
                            <div className="operator-item">{cond.operator}</div>
                            <div className="value-item">
                              <span className="label">Expected:</span>
                              <code>{String(cond.expected_value)}</code>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions Would Execute */}
                  {testResults.dryRunResult.action_simulations.length > 0 && (
                    <div className="actions-results">
                      <h5>Actions Would Execute</h5>
                      {testResults.dryRunResult.action_simulations.map((sim) => (
                        <div
                          key={sim.action_id}
                          className={`action-result ${sim.would_execute ? 'would-execute' : 'would-skip'}`}
                        >
                          <div className="result-label">
                            <span>{sim.action_type}</span>
                            {sim.would_execute ? (
                              <CheckCircle size={14} color="#10b981" />
                            ) : (
                              <AlertCircle size={14} color="#f59e0b" />
                            )}
                          </div>
                          <div className="result-value">{sim.preview}</div>
                          {sim.reason && (
                            <div className="result-reason">{sim.reason}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Warnings */}
                  {testResults.dryRunResult.warnings &&
                    testResults.dryRunResult.warnings.length > 0 && (
                      <div className="warnings-section">
                        <h5>Warnings</h5>
                        {testResults.dryRunResult.warnings.map((warning, idx) => (
                          <div key={idx} className="warning-item">
                            <AlertTriangle size={14} />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

          {/* No Results Placeholder */}
          {!hasResults && !testResults.loading && (
            <div className="empty-results">
              <Clock size={32} />
              <p>Run a test to see results</p>
              <span className="hint">
                Select a lead and click "Dry Run" or "Execute" to test the rule
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RuleDebugger);

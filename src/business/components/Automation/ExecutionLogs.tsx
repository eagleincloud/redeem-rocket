/**
 * ExecutionLogs Component
 * Display rule execution history with filtering, sorting, and expansion
 * Shows execution status, timing, and error details
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  Filter,
  X,
  Search,
} from 'lucide-react';
import type {
  AutomationExecution,
  ExecutionLog,
  ExecutionStatus,
} from '../../types/automation';
import './ExecutionLogs.css';

interface ExecutionLogsProps {
  ruleId?: string;
  onSelectExecution?: (execution: AutomationExecution) => void;
  initialLogs?: AutomationExecution[];
  refreshInterval?: number;
}

interface Filters {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  rule: string;
  status: ExecutionStatus | 'all';
  searchTerm: string;
  successOnly: boolean;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  pending: '#f59e0b',
  running: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
  partial_failure: '#f59e0b',
};

const STATUS_LABELS: Record<ExecutionStatus, string> = {
  pending: 'Pending',
  running: 'Running',
  completed: 'Success',
  failed: 'Failed',
  partial_failure: 'Partial Failure',
};

const ITEMS_PER_PAGE = 50;

const ExecutionLogs: React.FC<ExecutionLogsProps> = ({
  ruleId,
  onSelectExecution,
  initialLogs = [],
  refreshInterval = 0,
}) => {
  const [executions, setExecutions] = useState<AutomationExecution[]>(initialLogs);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, ExecutionLog[]>>({});
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    total: initialLogs.length,
  });

  const [filters, setFilters] = useState<Filters>({
    dateRange: { start: null, end: null },
    rule: ruleId || 'all',
    status: 'all',
    searchTerm: '',
    successOnly: false,
  });

  const [sortBy, setSortBy] = useState<'date' | 'status' | 'rule'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Simulate real-time updates when refreshInterval is set
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const timer = setInterval(() => {
      // In real app, would fetch from API
      setExecutions((prev) => {
        if (prev.length > 0) {
          // Simulate adding new executions
          return prev;
        }
        return prev;
      });
    }, refreshInterval);

    return () => clearInterval(timer);
  }, [refreshInterval]);

  // Filter executions based on current filters
  const filteredExecutions = useMemo(() => {
    let filtered = executions.filter((execution) => {
      // Date range filter
      if (filters.dateRange.start) {
        const execDate = new Date(execution.started_at);
        if (execDate < filters.dateRange.start) return false;
      }
      if (filters.dateRange.end) {
        const execDate = new Date(execution.started_at);
        if (execDate > filters.dateRange.end) return false;
      }

      // Rule filter
      if (filters.rule !== 'all' && execution.rule_id !== filters.rule) {
        return false;
      }

      // Status filter
      if (filters.status !== 'all' && execution.status !== filters.status) {
        return false;
      }

      // Success only filter
      if (filters.successOnly && execution.status !== 'completed') {
        return false;
      }

      // Search filter
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        const matchesEntity = execution.entity_id?.toLowerCase().includes(search);
        const matchesRule = execution.rule_id.toLowerCase().includes(search);
        return matchesEntity || matchesRule;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (sortBy) {
        case 'date':
          aVal = new Date(a.started_at).getTime();
          bVal = new Date(b.started_at).getTime();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'rule':
          aVal = a.rule_id;
          bVal = b.rule_id;
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [executions, filters, sortBy, sortOrder]);

  // Paginate filtered executions
  const paginatedExecutions = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredExecutions.slice(start, end);
  }, [filteredExecutions, pagination]);

  // Update total count when filtered data changes
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      total: filteredExecutions.length,
      page: 1,
    }));
  }, [filteredExecutions]);

  // Handle row expansion
  const handleExpandRow = useCallback((executionId: string) => {
    setExpandedId(expandedId === executionId ? null : executionId);
    onSelectExecution?.(executions.find((e) => e.id === executionId)!);

    // Load execution logs if not already loaded
    if (!expandedLogs[executionId]) {
      // In real app, would fetch logs from API
      setExpandedLogs((prev) => ({
        ...prev,
        [executionId]: [],
      }));
    }
  }, [expandedId, executions, expandedLogs, onSelectExecution]);

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (ms?: number): string => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Handle sort change
  const handleSort = useCallback((column: 'date' | 'status' | 'rule') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Handle date range change
  const handleDateRangeChange = useCallback(
    (type: 'start' | 'end', date: string) => {
      const dateObj = date ? new Date(date) : null;
      setFilters((prev) => ({
        ...prev,
        dateRange: {
          ...prev.dateRange,
          [type]: dateObj,
        },
      }));
    },
    []
  );

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      dateRange: { start: null, end: null },
      rule: ruleId || 'all',
      status: 'all',
      searchTerm: '',
      successOnly: false,
    });
  }, [ruleId]);

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Rule ID', 'Status', 'Entity ID', 'Duration', 'Actions Executed', 'Error'];
    const rows = filteredExecutions.map((exec) => [
      new Date(exec.started_at).toISOString(),
      exec.rule_id,
      exec.status,
      exec.entity_id || '-',
      formatDuration(exec.duration_ms),
      exec.result.actions_executed,
      exec.result.errors?.join('; ') || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `execution-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, [filteredExecutions]);

  const hasActiveFilters =
    filters.dateRange.start ||
    filters.dateRange.end ||
    filters.rule !== 'all' ||
    filters.status !== 'all' ||
    filters.searchTerm ||
    filters.successOnly;

  return (
    <div className="execution-logs-container">
      {/* Header with Export */}
      <div className="logs-header">
        <h2>Execution History</h2>
        <button
          className="btn-export"
          onClick={handleExportCSV}
          disabled={filteredExecutions.length === 0}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <Filter size={16} />
          <input
            type="text"
            placeholder="Search by lead ID or rule..."
            value={filters.searchTerm}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                searchTerm: e.target.value,
              }))
            }
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          {/* Date Range */}
          <div className="filter-input-group">
            <input
              type="date"
              value={
                filters.dateRange.start
                  ? filters.dateRange.start.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="filter-input"
              placeholder="From"
            />
            <input
              type="date"
              value={
                filters.dateRange.end
                  ? filters.dateRange.end.toISOString().split('T')[0]
                  : ''
              }
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="filter-input"
              placeholder="To"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                status: e.target.value as ExecutionStatus | 'all',
              }))
            }
            className="filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="partial_failure">Partial Failure</option>
          </select>

          {/* Success Only */}
          <label className="filter-checkbox">
            <input
              type="checkbox"
              checked={filters.successOnly}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  successOnly: e.target.checked,
                }))
              }
            />
            Success Only
          </label>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              className="btn-clear-filters"
              onClick={handleClearFilters}
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing <strong>{paginatedExecutions.length}</strong> of{' '}
          <strong>{filteredExecutions.length}</strong> executions
          {hasActiveFilters && ' (filtered)'}
        </p>
      </div>

      {/* Table */}
      {paginatedExecutions.length > 0 ? (
        <div className="table-wrapper">
          <table className="execution-table">
            <thead>
              <tr>
                <th className="expand-col"></th>
                <th
                  className={`sortable ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => handleSort('date')}
                >
                  Timestamp{' '}
                  {sortBy === 'date' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className="rule-col">Rule ID</th>
                <th
                  className={`sortable ${sortBy === 'status' ? 'active' : ''}`}
                  onClick={() => handleSort('status')}
                >
                  Status{' '}
                  {sortBy === 'status' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th>Action Executed</th>
                <th>Entity ID</th>
                <th>Duration</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExecutions.map((execution, index) => (
                <React.Fragment key={execution.id}>
                  <tr
                    className={`execution-row ${index % 2 === 0 ? 'even' : 'odd'} ${
                      expandedId === execution.id ? 'expanded' : ''
                    }`}
                  >
                    <td className="expand-cell">
                      <button
                        className="btn-expand"
                        onClick={() => handleExpandRow(execution.id)}
                      >
                        {expandedId === execution.id ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>
                    </td>
                    <td className="timestamp-cell">
                      {formatRelativeTime(execution.started_at)}
                    </td>
                    <td className="rule-cell">{execution.rule_id}</td>
                    <td className="status-cell">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: STATUS_COLORS[execution.status],
                        }}
                      >
                        {STATUS_LABELS[execution.status]}
                      </span>
                    </td>
                    <td className="action-cell">
                      {execution.result.actions_executed > 0 ? (
                        <span className="action-count">
                          {execution.result.actions_executed} action{execution.result.actions_executed > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="no-action">-</span>
                      )}
                    </td>
                    <td className="entity-cell">{execution.entity_id || '-'}</td>
                    <td className="duration-cell">
                      {formatDuration(execution.duration_ms)}
                    </td>
                    <td className="result-cell">
                      {execution.status === 'completed' ? (
                        <CheckCircle size={16} color="#10b981" />
                      ) : execution.status === 'failed' ? (
                        <AlertCircle size={16} color="#ef4444" />
                      ) : execution.status === 'running' ? (
                        <Clock size={16} color="#3b82f6" />
                      ) : (
                        <Clock size={16} color="#f59e0b" />
                      )}
                    </td>
                  </tr>

                  {/* Expandable Details Row */}
                  {expandedId === execution.id && (
                    <tr className="details-row">
                      <td colSpan={8}>
                        <div className="execution-details">
                          <div className="details-grid">
                            <div className="detail-section">
                              <h4>Execution Details</h4>
                              <div className="detail-item">
                                <span className="label">Execution ID:</span>
                                <span className="value">{execution.id}</span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Started:</span>
                                <span className="value">
                                  {new Date(execution.started_at).toLocaleString()}
                                </span>
                              </div>
                              {execution.completed_at && (
                                <div className="detail-item">
                                  <span className="label">Completed:</span>
                                  <span className="value">
                                    {new Date(execution.completed_at).toLocaleString()}
                                  </span>
                                </div>
                              )}
                              <div className="detail-item">
                                <span className="label">Duration:</span>
                                <span className="value">
                                  {formatDuration(execution.duration_ms)}
                                </span>
                              </div>
                            </div>

                            <div className="detail-section">
                              <h4>Result</h4>
                              <div className="detail-item">
                                <span className="label">Trigger Passed:</span>
                                <span className="value">
                                  {execution.result.trigger_passed ? '✓ Yes' : '✗ No'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Conditions Passed:</span>
                                <span className="value">
                                  {execution.result.conditions_passed ? '✓ Yes' : '✗ No'}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Actions Executed:</span>
                                <span className="value">
                                  {execution.result.actions_executed} / {execution.result.actions_executed + execution.result.actions_failed}
                                </span>
                              </div>
                              <div className="detail-item">
                                <span className="label">Actions Failed:</span>
                                <span className="value">
                                  {execution.result.actions_failed}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Errors */}
                          {execution.result.errors && execution.result.errors.length > 0 && (
                            <div className="errors-section">
                              <h4>Errors</h4>
                              <div className="error-list">
                                {execution.result.errors.map((error, idx) => (
                                  <div key={idx} className="error-item">
                                    {error}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Logs */}
                          {expandedLogs[execution.id] && expandedLogs[execution.id].length > 0 && (
                            <div className="logs-section">
                              <h4>Execution Logs</h4>
                              <div className="logs-list">
                                {expandedLogs[execution.id].map((log) => (
                                  <div key={log.id} className="log-item">
                                    <span className="log-time">
                                      {new Date(log.created_at).toLocaleTimeString()}
                                    </span>
                                    <span className="log-type">[{log.log_type}]</span>
                                    <span className="log-message">{log.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <Clock size={32} />
          <p>No execution logs found</p>
          <span className="hint">
            {filters.searchTerm || hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Execution logs will appear here when rules run'}
          </span>
        </div>
      )}

      {/* Pagination */}
      {filteredExecutions.length > ITEMS_PER_PAGE && (
        <div className="pagination">
          <button
            className="btn-page"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
          >
            Previous
          </button>

          <div className="page-info">
            Page {pagination.page} of{' '}
            {Math.ceil(pagination.total / pagination.pageSize)}
          </div>

          <button
            className="btn-page"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(
                  Math.ceil(pagination.total / pagination.pageSize),
                  prev.page + 1
                ),
              }))
            }
            disabled={
              pagination.page >=
              Math.ceil(pagination.total / pagination.pageSize)
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExecutionLogs);

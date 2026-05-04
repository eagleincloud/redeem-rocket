import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Filter, Download } from 'lucide-react';

interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  triggerType: string;
  leadId: string;
  leadName: string;
  action: string;
  status: 'success' | 'failed' | 'pending';
  error?: string;
  details: Record<string, any>;
}

// Mock log data
const MOCK_LOGS: AutomationLog[] = [
  {
    id: '1',
    ruleId: '1',
    ruleName: 'Auto-qualify high-value leads',
    triggeredAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    triggerType: 'lead_added',
    leadId: '101',
    leadName: 'John Smith',
    action: 'change_stage',
    status: 'success',
    details: { from_stage: 'new', to_stage: 'qualified', condition_met: true },
  },
  {
    id: '2',
    ruleId: '2',
    ruleName: 'Send follow-up to opened emails',
    triggeredAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    triggerType: 'email_opened',
    leadId: '102',
    leadName: 'Jane Doe',
    action: 'send_email',
    status: 'success',
    details: { email_template: 'follow_up_1', recipient: 'jane@company.com' },
  },
  {
    id: '3',
    ruleId: '1',
    ruleName: 'Auto-qualify high-value leads',
    triggeredAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    triggerType: 'lead_added',
    leadId: '103',
    leadName: 'Bob Johnson',
    action: 'change_stage',
    status: 'failed',
    error: 'Stage not found in pipeline',
    details: { from_stage: 'new', to_stage: 'unknown_stage' },
  },
  {
    id: '4',
    ruleId: '3',
    ruleName: 'Assign stalled leads to manager',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    triggerType: 'inactivity_30d',
    leadId: '104',
    leadName: 'Alice Wilson',
    action: 'assign_manager',
    status: 'success',
    details: { assigned_to: 'manager@company.com', manager_name: 'Sarah' },
  },
  {
    id: '5',
    ruleId: '4',
    ruleName: 'Tag clicked leads for retargeting',
    triggeredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    triggerType: 'email_clicked',
    leadId: '105',
    leadName: 'Charlie Brown',
    action: 'add_tag',
    status: 'pending',
    details: { tag_name: 'clicked_email', tag_color: 'orange' },
  },
];

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'success':
      return '#10B981';
    case 'failed':
      return '#EF4444';
    case 'pending':
      return '#F59E0B';
    default:
      return '#6B7280';
  }
};

const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export const AutomationLogs: React.FC = () => {
  const navigate = useNavigate();
  const { ruleId } = useParams();
  const isRuleSpecific = Boolean(ruleId);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed' | 'pending'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = isRuleSpecific
      ? MOCK_LOGS.filter((log) => log.ruleId === ruleId)
      : MOCK_LOGS;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.ruleName.toLowerCase().includes(term) ||
          log.leadName.toLowerCase().includes(term) ||
          log.action.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((log) => log.status === statusFilter);
    }

    // Date range filter
    const now = Date.now();
    const rangeMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };

    if (dateRangeFilter !== 'all') {
      const cutoff = now - rangeMs[dateRangeFilter];
      result = result.filter((log) => new Date(log.triggeredAt).getTime() > cutoff);
    }

    return result;
  }, [searchTerm, statusFilter, dateRangeFilter, ruleId, isRuleSpecific]);

  // Calculate stats
  const stats = useMemo(() => {
    const filtered = isRuleSpecific
      ? MOCK_LOGS.filter((log) => log.ruleId === ruleId)
      : MOCK_LOGS;

    return {
      total: filtered.length,
      successful: filtered.filter((l) => l.status === 'success').length,
      failed: filtered.filter((l) => l.status === 'failed').length,
      pending: filtered.filter((l) => l.status === 'pending').length,
      successRate: filtered.length > 0
        ? Math.round((filtered.filter((l) => l.status === 'success').length / filtered.length) * 100)
        : 0,
    };
  }, [ruleId, isRuleSpecific]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {isRuleSpecific ? 'Rule Execution Logs' : 'Automation Logs'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isRuleSpecific
                  ? 'View execution history for this rule'
                  : 'All automation rule executions'}
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
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label: 'Total Executions', value: stats.total, color: 'text-blue-600' },
            { label: 'Successful', value: stats.successful, color: 'text-green-600' },
            { label: 'Failed', value: stats.failed, color: 'text-red-600' },
            { label: 'Pending', value: stats.pending, color: 'text-amber-600' },
            { label: 'Success Rate', value: `${stats.successRate}%`, color: 'text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`m-0 text-xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-5 space-y-4">
            {/* Search Bar */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary border border-border">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by rule, lead, or action..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none text-foreground text-sm outline-none"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-6">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Status:
                </span>
                <div className="flex gap-1">
                  {(['all', 'success', 'failed', 'pending'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        statusFilter === status
                          ? 'bg-primary text-primary-foreground border border-primary'
                          : 'bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Date:
                </span>
                <div className="flex gap-1">
                  {(['all', '24h', '7d', '30d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setDateRangeFilter(range)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                        dateRangeFilter === range
                          ? 'bg-primary text-primary-foreground border border-primary'
                          : 'bg-transparent border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
                      }`}
                    >
                      {range === 'all' ? 'All Time' : range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          {filteredLogs.length === 0 ? (
            <CardContent className="p-16">
              <div className="text-center text-muted-foreground">
                <Filter className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No logs found</p>
                <p className="text-sm mt-2">Try adjusting your filters</p>
              </div>
            </CardContent>
          ) : (
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Time
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Rule
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Lead
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Action
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-border hover:bg-secondary transition-colors"
                      >
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {relativeTime(log.triggeredAt)}
                        </td>
                        <td className="px-4 py-3 text-foreground font-semibold">
                          {log.ruleName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.leadName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.action.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.status === 'success'
                                ? 'default'
                                : log.status === 'failed'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {getStatusLabel(log.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {log.status === 'failed' && log.error ? (
                            <span className="text-red-600">
                              {log.error}
                            </span>
                          ) : (
                            <span>
                              {Object.entries(log.details)
                                .slice(0, 2)
                                .map(([key]) => key)
                                .join(', ')}
                              {Object.keys(log.details).length > 2 ? '...' : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Export Button */}
              <div className="flex justify-end p-4 border-t border-border">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Logs
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AutomationLogs;

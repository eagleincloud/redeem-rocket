import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RuleCard, type RuleCardData } from './RuleCard';
import { Plus, Zap } from 'lucide-react';

// Mock rule data
const MOCK_RULES: RuleCardData[] = [
  {
    id: '1',
    name: 'Auto-qualify high-value leads',
    triggerType: 'lead_added',
    actionType: 'change_stage',
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 342,
    lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    successRate: 98,
  },
  {
    id: '2',
    name: 'Send follow-up to opened emails',
    triggerType: 'email_opened',
    actionType: 'send_email',
    isActive: true,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 1240,
    lastRun: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    successRate: 95,
  },
  {
    id: '3',
    name: 'Assign stalled leads to manager',
    triggerType: 'inactivity_30d',
    actionType: 'assign_manager',
    isActive: true,
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 87,
    lastRun: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    successRate: 100,
  },
  {
    id: '4',
    name: 'Tag clicked leads for retargeting',
    triggerType: 'email_clicked',
    actionType: 'add_tag',
    isActive: true,
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 523,
    lastRun: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    successRate: 99,
  },
  {
    id: '5',
    name: 'Create task for qualified leads',
    triggerType: 'lead_qualified',
    actionType: 'create_task',
    isActive: false,
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 234,
    successRate: 96,
  },
  {
    id: '6',
    name: 'Webhook to CRM on stage change',
    triggerType: 'stage_changed',
    actionType: 'webhook',
    isActive: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    runCount: 456,
    lastRun: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    successRate: 92,
  },
];

type FilterStatus = 'all' | 'active' | 'inactive';

interface Stats {
  totalRules: number;
  active: number;
  totalRuns: number;
  avgSuccessRate: number;
}

export const AutomationRules: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  // Filter rules
  const filteredRules = useMemo(() => {
    if (statusFilter === 'all') return MOCK_RULES;
    return MOCK_RULES.filter((rule) => rule.isActive === (statusFilter === 'active'));
  }, [statusFilter]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    const activeRules = MOCK_RULES.filter((r) => r.isActive);
    const totalRuns = MOCK_RULES.reduce((sum, r) => sum + r.runCount, 0);
    const avgSuccessRate = Math.round(
      MOCK_RULES.reduce((sum, r) => sum + r.successRate, 0) / MOCK_RULES.length
    );

    return {
      totalRules: MOCK_RULES.length,
      active: activeRules.length,
      totalRuns,
      avgSuccessRate,
    };
  }, []);

  const handleRuleAction = (action: string, id: string) => {
    switch (action) {
      case 'edit':
        navigate(`/app/automation/rules/${id}/edit`);
        break;
      case 'logs':
        navigate(`/app/automation/logs/${id}`);
        break;
      case 'duplicate':
        // Handle duplicate
        break;
      case 'delete':
        // Handle delete
        break;
      case 'toggle':
        // Handle toggle status
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Automation Rules</h1>
              <p className="text-sm text-muted-foreground mt-1">{filteredRules.length} of {stats.totalRules} rules</p>
            </div>
            <Button onClick={() => navigate('/app/automation/rules/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Rules', value: stats.totalRules, color: 'text-amber-600' },
            { label: 'Active', value: stats.active, color: 'text-green-600' },
            { label: 'Total Runs', value: stats.totalRuns.toLocaleString(), color: 'text-blue-600' },
            { label: 'Avg Success Rate', value: `${stats.avgSuccessRate}%`, color: 'text-purple-600' },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="text-center">
                  <p className="m-0 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'inactive'].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter as FilterStatus)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

        {/* Rules Grid */}
        {filteredRules.length === 0 ? (
          <Card>
            <CardContent className="p-16">
              <div className="text-center text-muted-foreground">
                <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No rules found</p>
                <p className="text-sm mt-2">Create a new automation rule to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRules.map((rule) => (
              <RuleCard
                key={rule.id}
                {...rule}
                onEdit={() => handleRuleAction('edit', rule.id)}
                onViewLogs={() => handleRuleAction('logs', rule.id)}
                onDuplicate={() => handleRuleAction('duplicate', rule.id)}
                onDelete={() => handleRuleAction('delete', rule.id)}
                onToggleStatus={() => handleRuleAction('toggle', rule.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationRules;

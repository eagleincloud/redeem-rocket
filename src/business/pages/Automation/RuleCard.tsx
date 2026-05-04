import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, ToggleRight, ToggleLeft, Trash2, Copy, Eye } from 'lucide-react';

export interface RuleCardData {
  id: string;
  name: string;
  triggerType: string;
  actionType: string;
  isActive: boolean;
  createdAt: string;
  runCount: number;
  lastRun?: string;
  successRate: number;
  onEdit?: () => void;
  onViewLogs?: () => void;
  onToggleStatus?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  lead_added: '👤 Lead Added',
  email_opened: '📧 Email Opened',
  email_clicked: '🔗 Email Clicked',
  lead_qualified: '⭐ Lead Qualified',
  inactivity_30d: '⏰ 30 Days Inactive',
  stage_changed: '↔️ Stage Changed',
  deal_created: '💼 Deal Created',
  form_submitted: '📝 Form Submitted',
};

const ACTION_LABELS: Record<string, string> = {
  send_email: '📧 Send Email',
  add_tag: '🏷️ Add Tag',
  update_field: '✏️ Update Field',
  create_task: '✅ Create Task',
  webhook: '🔌 Webhook',
  assign_manager: '👨 Assign Manager',
  change_stage: '↔️ Change Stage',
  add_to_list: '📋 Add to List',
};

const relativeTime = (iso: string): string => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const RuleCard: React.FC<RuleCardData> = ({
  name,
  triggerType,
  actionType,
  isActive,
  createdAt,
  runCount,
  lastRun,
  successRate,
  onEdit,
  onViewLogs,
  onToggleStatus,
  onDuplicate,
  onDelete,
}) => {
  const getSuccessColor = (): string => {
    if (successRate >= 90) return '#10B981';
    if (successRate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getSuccessColorClass = (): string => {
    if (successRate >= 90) return 'text-green-600';
    if (successRate >= 70) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h4 className="m-0 text-base font-semibold text-foreground flex items-center gap-1">
                <Zap className="w-4 h-4 text-amber-500" />
                {name}
              </h4>
            </div>
            <div className={`flex items-center gap-2 px-2 py-1 rounded-sm ${isActive ? 'bg-green-100 dark:bg-green-950' : 'bg-gray-100 dark:bg-gray-800'}`}>
              {isActive ? (
                <ToggleRight className="w-4 h-4 text-green-600" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-gray-600" />
              )}
              <span className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Trigger → Action */}
          <div className="p-2 rounded-md bg-secondary border border-border">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                {TRIGGER_LABELS[triggerType] || triggerType}
              </span>
              <span className="text-muted-foreground">→</span>
              <span className="text-muted-foreground">
                {ACTION_LABELS[actionType] || actionType}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Run Count
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {runCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Success Rate
              </p>
              <p className={`mt-1 text-base font-semibold ${getSuccessColorClass()}`}>
                {successRate}%
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Last Run
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {lastRun ? relativeTime(lastRun) : 'Never'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Footer and Actions */}
          <div className="flex justify-between items-center gap-2">
            <p className="m-0 text-xs text-muted-foreground">
              Created {relativeTime(createdAt)}
            </p>

            {/* Action Buttons */}
            <div className="flex gap-1">
              {onToggleStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-red-600 transition-colors"
                  title={isActive ? 'Deactivate' : 'Activate'}
                >
                  {isActive ? (
                    <ToggleLeft className="w-4 h-4" />
                  ) : (
                    <ToggleRight className="w-4 h-4" />
                  )}
                </button>
              )}

              {onViewLogs && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLogs();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-purple-600 transition-colors"
                  title="View Logs"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}

              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Zap className="w-4 h-4" />
                </button>
              )}

              {onDuplicate && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-green-600 transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

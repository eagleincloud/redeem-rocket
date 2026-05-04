import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, BarChart3, Trash2, Copy, Play, Pause } from 'lucide-react';

export interface CampaignCardData {
  id: string;
  name: string;
  triggerType: string;
  stepCount: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  sentCount: number;
  openRate: number;
  clickRate: number;
  onEdit?: () => void;
  onViewAnalytics?: () => void;
  onToggleStatus?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const TRIGGER_LABELS: Record<string, string> = {
  signup: '📧 Signup',
  purchase: '💳 Purchase',
  abandoned_cart: '🛒 Abandoned Cart',
  manual: '👤 Manual',
  api: '🔌 API',
  follow_up: '⏰ Follow-up',
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

export const CampaignCard: React.FC<CampaignCardData> = ({
  name,
  triggerType,
  stepCount,
  status,
  createdAt,
  sentCount,
  openRate,
  clickRate,
  onEdit,
  onViewAnalytics,
  onToggleStatus,
  onDuplicate,
  onDelete,
}) => {
  const getStatusBadge = (): { bg: string; text: string } => {
    switch (status) {
      case 'active':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'inactive':
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'draft':
        return { bg: 'bg-amber-100', text: 'text-amber-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const getStatusLabel = (): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'draft':
        return 'Draft';
      default:
        return 'Unknown';
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <Card className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h4 className="m-0 text-base font-semibold text-foreground">
                {name}
              </h4>
              <p className="mt-1 text-xs text-muted-foreground">
                {TRIGGER_LABELS[triggerType] || triggerType} • {stepCount} step{stepCount !== 1 ? 's' : ''}
              </p>
            </div>
            <Badge variant="outline" className={statusBadge.text}>
              {getStatusLabel()}
            </Badge>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Sent
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">
                {sentCount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Open Rate
              </p>
              <p className="mt-1 text-base font-semibold text-blue-600">
                {openRate}%
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-muted-foreground">
                Click Rate
              </p>
              <p className="mt-1 text-base font-semibold text-purple-600">
                {clickRate}%
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
                  title={status === 'active' ? 'Deactivate' : 'Activate'}
                >
                  {status === 'active' ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
              )}

              {onViewAnalytics && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewAnalytics();
                  }}
                  className="p-1 rounded-sm bg-transparent border-none cursor-pointer text-muted-foreground hover:text-purple-600 transition-colors"
                  title="View Analytics"
                >
                  <BarChart3 className="w-4 h-4" />
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
                  <Mail className="w-4 h-4" />
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

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Building2, Flame, Clock, ArrowRight } from 'lucide-react';

export interface LeadCardData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  stage: string;
  priority: string;
  source: string;
  value?: number;
  createdAt: string;
  onClick?: () => void;
}

const STAGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'New' },
  contacted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Contacted' },
  qualified: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Qualified' },
  proposal: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Proposal' },
  negotiation: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Negotiation' },
  won: { bg: 'bg-green-100', text: 'text-green-700', label: 'Won' },
  lost: { bg: 'bg-red-100', text: 'text-red-700', label: 'Lost' },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-emerald-600',
  medium: 'text-amber-600',
  high: 'text-red-600',
  urgent: 'text-purple-600',
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

export const LeadCard: React.FC<LeadCardData> = ({
  name,
  email,
  phone,
  company,
  stage,
  priority,
  source,
  value,
  createdAt,
  onClick,
}) => {
  const stageInfo = STAGE_COLORS[stage] || STAGE_COLORS.new;

  return (
    <Card
      onClick={onClick}
      className={`h-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : 'cursor-default'}`}
    >
      <CardContent className="p-5">
        <div className="flex flex-col gap-3">
          {/* Header: Name and Stage */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1">
              <h4 className="m-0 text-base font-semibold text-foreground">
                {name}
              </h4>
              {company && (
                <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {company}
                </p>
              )}
            </div>
            <Badge variant="outline" className={stageInfo.text}>
              {stageInfo.label}
            </Badge>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-1.5">
            <a
              href={`mailto:${email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{email}</span>
            </a>
            {phone && (
              <a
                href={`tel:${phone}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-blue-500 transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                {phone}
              </a>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Metadata */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-1">
              {/* Priority */}
              <div className={`flex items-center gap-1 text-xs ${PRIORITY_COLORS[priority] || PRIORITY_COLORS.medium}`}>
                <Flame className="w-3 h-3" />
                <span>{priority.charAt(0).toUpperCase() + priority.slice(1)}</span>
              </div>

              {/* Time */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {relativeTime(createdAt)}
              </div>
            </div>

            {/* Arrow indicator */}
            <ArrowRight className="w-4 h-4 text-muted-foreground ml-2" />
          </div>

          {/* Value if present */}
          {value && (
            <div className="p-2 rounded-md bg-green-50 text-center">
              <p className="m-0 text-xs text-green-700 font-semibold">
                Value: ${value.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

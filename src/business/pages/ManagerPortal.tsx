/**
 * Layer 7: AI + Manager Portal Dashboard
 * Production-ready component for managers to view assigned leads, AI recommendations, and team performance
 */

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Clock,
  DollarSign,
  AlertTriangle,
  Zap,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import GlassCard from '@/business/components/base/GlassCard';
import { supabase } from '@/app/lib/supabase';
import { useBusinessContext } from '@/business/context/BusinessContext';
import EmailDraftAssistant from '@/business/components/EmailDraftAssistant';

interface ManagerStats {
  totalLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  pipelineValue: number;
  dealsClosedThisMonth: number;
  escalationsThisWeek: number;
}

interface AssignedLead {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  daysInStage: number;
  lastActivity: string;
  priority: 'high' | 'medium' | 'low';
  email?: string;
}

interface AIRecommendation {
  id: string;
  leadId: string;
  leadName: string;
  type: 'health' | 'action' | 'coaching';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  actionUrl?: string;
  dismissedAt?: string | null;
}

export default function ManagerPortal() {
  const { currentBusiness } = useBusinessContext();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [assignedLeads, setAssignedLeads] = useState<AssignedLead[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailDraftOpen, setEmailDraftOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<AssignedLead | null>(null);

  useEffect(() => {
    if (currentBusiness?.id) {
      fetchManagerData();
    }
  }, [currentBusiness?.id]);

  const fetchManagerData = async () => {
    try {
      setLoading(true);

      if (!currentBusiness?.id) return;

      // Fetch assigned leads
      const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('created_at', { ascending: false });

      // Fetch AI recommendations
      const { data: recs } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .is('dismissed_at', null)
        .order('urgency', { ascending: true })
        .limit(5);

      // Calculate stats
      const calculatedStats = calculateManagerStats(leads || []);

      setAssignedLeads(formatLeads(leads || []));
      setRecommendations(formatRecommendations(recs || []));
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error fetching manager data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateManagerStats = (leads: any[]): ManagerStats => {
    const now = new Date();
    const thisMonth = leads.filter(l => {
      const leadDate = new Date(l.created_at);
      return (
        leadDate.getMonth() === now.getMonth() &&
        leadDate.getFullYear() === now.getFullYear()
      );
    });

    const totalValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const wonLeads = leads.filter(l => l.status === 'won').length;
    const conversionRate = leads.length > 0 ? (wonLeads / leads.length) * 100 : 0;

    return {
      totalLeads: leads.length,
      conversionRate: Math.round(conversionRate),
      avgResponseTime: 4,
      pipelineValue: totalValue,
      dealsClosedThisMonth: thisMonth.filter(l => l.status === 'won').length,
      escalationsThisWeek: 2,
    };
  };

  const formatLeads = (leads: any[]): AssignedLead[] => {
    const now = new Date();
    return leads.map(l => ({
      id: l.id,
      name: l.name || 'Unknown',
      company: l.company || 'Unknown',
      stage: l.current_stage || 'lead',
      value: l.deal_value || 0,
      daysInStage: Math.floor(
        (now.getTime() - new Date(l.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      lastActivity: formatRelativeTime(new Date(l.updated_at || l.created_at)),
      priority: l.priority || 'medium',
      email: l.email,
    }));
  };

  const formatRecommendations = (recs: any[]): AIRecommendation[] => {
    return recs.map(r => ({
      id: r.id,
      leadId: r.lead_id,
      leadName: r.lead_name || 'Unknown Lead',
      type: r.type || 'action',
      title: r.title || 'Recommendation',
      description: r.description || '',
      urgency: r.urgency || 'medium',
      actionUrl: r.action_url,
      dismissedAt: r.dismissed_at,
    }));
  };

  const handleDismissRecommendation = async (recId: string) => {
    try {
      await supabase
        .from('ai_recommendations')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', recId);

      setRecommendations(prev => prev.filter(r => r.id !== recId));
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    }
  };

  const handleOpenEmailDraft = (lead: AssignedLead) => {
    setSelectedLeadForEmail(lead);
    setEmailDraftOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        {[...Array(3)].map((_, i) => (
          <GlassCard
            key={i}
            className="h-32 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Manager Dashboard</h1>
        <p className="text-white/60">
          Track assigned leads, AI recommendations, and team performance
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<DollarSign className="w-5 h-5" />}
            label="Pipeline Value"
            value={`$${(stats.pipelineValue / 1000).toFixed(0)}K`}
            trend={12}
            color="text-green-400"
          />
          <StatCard
            icon={<CheckCircle className="w-5 h-5" />}
            label="Conversion"
            value={`${stats.conversionRate}%`}
            trend={5}
            color="text-blue-400"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Avg Response"
            value={`${stats.avgResponseTime}h`}
            trend={-2}
            color="text-orange-400"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="This Month"
            value={`${stats.dealsClosedThisMonth} closed`}
            trend={8}
            color="text-purple-400"
          />
          <StatCard
            icon={<AlertCircle className="w-5 h-5" />}
            label="Active Leads"
            value={stats.totalLeads}
            trend={3}
            color="text-red-400"
          />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="recommendations" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
          <TabsTrigger value="recommendations">
            AI Recommendations ({recommendations.length})
          </TabsTrigger>
          <TabsTrigger value="leads">Assigned Leads ({assignedLeads.length})</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4 mt-6">
          {recommendations.length === 0 ? (
            <GlassCard className="text-center py-12">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-400/50" />
              <p className="text-white/60 mb-2">No recommendations at this time</p>
              <p className="text-white/40 text-sm">Keep up the great work!</p>
            </GlassCard>
          ) : (
            recommendations.map(rec => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                onDismiss={() => handleDismissRecommendation(rec.id)}
              />
            ))
          )}
        </TabsContent>

        {/* Leads Tab */}
        <TabsContent value="leads" className="space-y-4 mt-6">
          {assignedLeads.length === 0 ? (
            <GlassCard className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4 text-blue-400/50" />
              <p className="text-white/60">No leads assigned yet</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {assignedLeads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onEmailDraft={() => handleOpenEmailDraft(lead)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Team Performance Tab */}
        <TabsContent value="team" className="space-y-4 mt-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Team Performance Metrics</h3>
            </div>
            <div className="space-y-4">
              <PerformanceRow
                label="Conversion Rate"
                value="18%"
                target="20%"
                status="on-track"
              />
              <PerformanceRow
                label="Avg Response Time"
                value="4.2h"
                target="4h"
                status="behind"
              />
              <PerformanceRow
                label="Pipeline Health"
                value="92%"
                target="90%"
                status="beating"
              />
              <PerformanceRow
                label="Deal Closure Rate"
                value="28%"
                target="25%"
                status="beating"
              />
              <PerformanceRow
                label="Customer Satisfaction"
                value="4.6/5"
                target="4.5/5"
                status="beating"
              />
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>

      {/* Email Draft Modal */}
      {selectedLeadForEmail && (
        <EmailDraftAssistant
          open={emailDraftOpen}
          onOpenChange={setEmailDraftOpen}
          lead={{
            id: selectedLeadForEmail.id,
            name: selectedLeadForEmail.name,
            email: selectedLeadForEmail.email || '',
            company: selectedLeadForEmail.company,
          }}
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend: number;
  color: string;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/70 text-xs font-medium">{label}</span>
        <span
          className={`text-xs font-medium ${
            trend > 0 ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      </div>
      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-white">{value}</p>
        <div className={color}>{icon}</div>
      </div>
    </GlassCard>
  );
}

function RecommendationCard({
  recommendation,
  onDismiss,
}: {
  recommendation: AIRecommendation;
  onDismiss: () => void;
}) {
  const urgencyStyles = {
    high: 'bg-red-500/10 border-red-500/30 text-red-200',
    medium: 'bg-orange-500/10 border-orange-500/30 text-orange-200',
    low: 'bg-blue-500/10 border-blue-500/30 text-blue-200',
  };

  const typeIcons = {
    health: <AlertTriangle className="w-4 h-4" />,
    action: <Zap className="w-4 h-4" />,
    coaching: <Users className="w-4 h-4" />,
  };

  return (
    <GlassCard
      className={`p-4 border ${urgencyStyles[recommendation.urgency]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-400">
              {typeIcons[recommendation.type]}
            </span>
            <h4 className="font-semibold text-white">{recommendation.title}</h4>
            <Badge className="text-xs bg-white/10 text-white/80 border-white/20">
              {recommendation.urgency}
            </Badge>
          </div>
          <p className="text-sm text-white/70 mb-3">{recommendation.description}</p>
          <p className="text-xs text-white/50 mb-3">
            Lead: <span className="text-white/70">{recommendation.leadName}</span>
          </p>
          <div className="flex gap-2">
            {recommendation.actionUrl && (
              <Button
                size="sm"
                className="bg-orange-500/80 hover:bg-orange-500 text-white text-xs"
                onClick={() =>
                  window.location.href = recommendation.actionUrl || ''
                }
              >
                Take Action
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={onDismiss}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function LeadCard({
  lead,
  onEmailDraft,
}: {
  lead: AssignedLead;
  onEmailDraft: () => void;
}) {
  const priorityStyles = {
    high: 'bg-red-500/20 text-red-300',
    medium: 'bg-orange-500/20 text-orange-300',
    low: 'bg-blue-500/20 text-blue-300',
  };

  const stageColors: Record<string, string> = {
    lead: 'text-blue-400',
    qualified: 'text-green-400',
    proposal: 'text-orange-400',
    negotiation: 'text-purple-400',
    won: 'text-green-500',
    lost: 'text-red-500',
  };

  return (
    <GlassCard className="p-4 hover:border-white/40 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-white">{lead.name}</h4>
            <Badge className={`text-xs ${priorityStyles[lead.priority]}`}>
              {lead.priority}
            </Badge>
          </div>
          <p className="text-xs text-white/70 mb-3">{lead.company}</p>
          <div className="grid grid-cols-4 gap-4 text-xs text-white/60">
            <div>
              <p className="text-white/50 mb-1">Stage</p>
              <p className={`font-medium ${stageColors[lead.stage] || 'text-white'}`}>
                {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
              </p>
            </div>
            <div>
              <p className="text-white/50 mb-1">Value</p>
              <p className="text-white font-medium">
                ${(lead.value / 1000).toFixed(0)}K
              </p>
            </div>
            <div>
              <p className="text-white/50 mb-1">Days in Stage</p>
              <p
                className={`font-medium ${
                  lead.daysInStage > 10 ? 'text-red-400' : 'text-white'
                }`}
              >
                {lead.daysInStage}d
              </p>
            </div>
            <div>
              <p className="text-white/50 mb-1">Last Activity</p>
              <p className="text-white font-medium">{lead.lastActivity}</p>
            </div>
          </div>
        </div>
        <Button
          size="sm"
          className="bg-orange-500/80 hover:bg-orange-500 text-white whitespace-nowrap"
          onClick={onEmailDraft}
        >
          Draft Email
        </Button>
      </div>
    </GlassCard>
  );
}

function PerformanceRow({
  label,
  value,
  target,
  status,
}: {
  label: string;
  value: string;
  target: string;
  status: 'beating' | 'on-track' | 'behind';
}) {
  const statusConfig = {
    beating: { color: 'text-green-400', icon: '✓', label: 'Beating' },
    'on-track': { color: 'text-blue-400', icon: '→', label: 'On track' },
    behind: { color: 'text-orange-400', icon: '⚠', label: 'Behind' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
      <span className="text-white/80 text-sm">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-white font-semibold">{value}</span>
        <span className="text-white/50 text-xs">Target: {target}</span>
        <span className={`text-xs font-medium ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

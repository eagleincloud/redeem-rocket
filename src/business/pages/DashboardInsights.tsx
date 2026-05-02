import React, { useEffect, useState, useContext } from 'react';
import { AlertCircle, TrendingUp, Trophy, Zap } from 'lucide-react';
import { GlassCard } from '@/business/components/base/GlassCard';
import { BusinessContext } from '@/business/context/BusinessContext';
import { supabase } from '@/app/lib/supabase';

interface Insight {
  id: string;
  type: 'alert' | 'recommendation' | 'celebration' | 'metric';
  title: string;
  description: string;
  severity?: 'high' | 'medium' | 'low';
  icon?: React.ReactNode;
  actionUrl?: string;
  actionLabel?: string;
  data?: Record<string, any>;
}

interface DashboardInsightsProps {
  businessId?: string;
}

export default function DashboardInsights({ businessId: providedBusinessId }: DashboardInsightsProps) {
  // Get businessId from context if not provided
  const context = useContext(BusinessContext);
  const businessId = providedBusinessId || context?.businessId || '';

  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchInsights();
    }
  }, [businessId]);

  const fetchInsights = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setInsights([]);
        return;
      }

      // Fetch pipeline data
      const { data: pipelines } = await supabase
        .from('business_pipelines')
        .select('*')
        .eq('business_id', businessId);

      // Fetch leads grouped by stage
      const { data: leads } = await supabase
        .from('leads')
        .select('id, current_stage, created_at, deal_value')
        .eq('business_id', businessId);

      // Fetch automation metrics
      const { data: automations } = await supabase
        .from('automation_rules')
        .select('id, name, run_count, is_active')
        .eq('business_id', businessId);

      const generatedInsights = generateInsights(pipelines, leads, automations);
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (pipelines: any[], leads: any[], automations: any[]) => {
    const insights: Insight[] = [];

    // ALERT: Leads stuck in stage
    if (leads && leads.length > 0) {
      const now = new Date();
      const stuckLeads = leads.filter(l => {
        const daysInStage = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
        return daysInStage > 10;
      });

      if (stuckLeads.length > 0) {
        insights.push({
          id: 'stuck-leads',
          type: 'alert',
          severity: 'high',
          title: `${stuckLeads.length} leads stuck in negotiation`,
          description: `${stuckLeads.length} leads have been in the same stage for 10+ days. Consider sending a follow-up or reassigning to a manager.`,
          icon: <AlertCircle className="w-5 h-5 text-red-500" />,
          actionUrl: '/app/automation/rules/new?trigger=stuck_stage',
          actionLabel: 'Create automation',
        });
      }
    }

    // RECOMMENDATION: Performance improvement
    if (leads && leads.length >= 10) {
      const totalValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
      const avgDeal = totalValue / leads.length;
      insights.push({
        id: 'avg-deal-size',
        type: 'metric',
        title: `Average deal size: $${avgDeal.toFixed(0)}`,
        description: 'Track this metric over time to identify growth opportunities.',
        icon: <TrendingUp className="w-5 h-5 text-orange-500" />,
        data: { value: avgDeal, currency: 'USD' },
      });
    }

    // CELEBRATION: Automation success
    if (automations && automations.some(a => a.run_count > 100)) {
      const topAutomation = automations.reduce((best, current) =>
        (current.run_count || 0) > (best.run_count || 0) ? current : best
      );
      insights.push({
        id: 'automation-success',
        type: 'celebration',
        title: '🎉 Automation working hard!',
        description: `Your "${topAutomation.name}" automation has run ${topAutomation.run_count} times. Great job automating!`,
        icon: <Trophy className="w-5 h-5 text-green-500" />,
      });
    }

    // RECOMMENDATION: Enable more automations
    if (automations && automations.filter(a => a.is_active).length < 3) {
      insights.push({
        id: 'more-automations',
        type: 'recommendation',
        title: 'Unlock more automation potential',
        description: 'You have fewer than 3 active automations. Try creating workflows for common tasks like welcome emails or lead scoring.',
        icon: <Zap className="w-5 h-5 text-orange-500" />,
        actionUrl: '/app/automation/rules/new',
        actionLabel: 'Create automation',
      });
    }

    return insights.sort((a, b) => {
      // Sort by severity: high > medium > low, then by type priority
      const severityOrder = { high: 0, medium: 1, low: 2 };
      return (severityOrder[a.severity as keyof typeof severityOrder] ?? 3) -
        (severityOrder[b.severity as keyof typeof severityOrder] ?? 3);
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <GlassCard key={i} className="h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      {insights.length === 0 ? (
        <GlassCard className="text-center py-8">
          <p className="text-white/60">No insights yet. Keep working on your pipelines!</p>
        </GlassCard>
      ) : (
        insights.map(insight => (
          <InsightCard key={insight.id} insight={insight} />
        ))
      )}
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const bgClass = {
    alert: 'border-red-500/20 bg-red-500/5',
    recommendation: 'border-orange-500/20 bg-orange-500/5',
    celebration: 'border-green-500/20 bg-green-500/5',
    metric: 'border-blue-500/20 bg-blue-500/5',
  }[insight.type];

  return (
    <GlassCard className={`p-4 border ${bgClass}`}>
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">{insight.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm mb-1">{insight.title}</h3>
          <p className="text-white/70 text-sm mb-3">{insight.description}</p>
          {insight.actionUrl && (
            <a
              href={insight.actionUrl}
              className="inline-block px-3 py-1.5 text-xs font-medium rounded
                bg-orange-500/80 hover:bg-orange-500 text-white transition-colors"
            >
              {insight.actionLabel || 'Take action'}
            </a>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

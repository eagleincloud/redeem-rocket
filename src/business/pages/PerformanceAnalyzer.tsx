import React, { useEffect, useState, useContext } from 'react';
import { GlassCard } from '@/business/components/base/GlassCard';
import MetricsCard from '@/business/components/metrics/MetricsCard';
import { BusinessContext } from '@/business/context/BusinessContext';
import { supabase } from '@/app/lib/supabase';

interface KPI {
  name: string;
  current: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  percentageChange: number;
  status: 'beating' | 'on-track' | 'behind';
}

interface PerformanceAnalyzerProps {
  businessId?: string;
}

export default function PerformanceAnalyzer({ businessId: providedBusinessId }: PerformanceAnalyzerProps) {
  // Get businessId from context if not provided
  const context = useContext(BusinessContext);
  const businessId = providedBusinessId || context?.businessId || '';

  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (businessId) {
      fetchKPIs();
    }
  }, [businessId]);

  const fetchKPIs = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setKpis([]);
        return;
      }

      // Fetch leads data
      const { data: leads } = await supabase
        .from('leads')
        .select('id, deal_value, current_stage, created_at')
        .eq('business_id', businessId);

      // Fetch pipeline data
      const { data: pipelines } = await supabase
        .from('business_pipelines')
        .select('id, stages')
        .eq('business_id', businessId);

      // Fetch email metrics
      const { data: emailMetrics } = await supabase
        .from('email_campaign_metrics')
        .select('sent, opened, clicked')
        .eq('business_id', businessId);

      const calculatedKPIs = calculateKPIs(leads || [], pipelines || [], emailMetrics || []);
      setKpis(calculatedKPIs);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      setKpis([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateKPIs = (leads: any[], pipelines: any[], emailMetrics: any[]): KPI[] => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentLeads = leads.filter(l => new Date(l.created_at) > thirtyDaysAgo);

    const totalValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const avgDeal = leads.length > 0 ? totalValue / leads.length : 0;

    // Email open rate
    const totalSent = emailMetrics.reduce((sum, m) => sum + (m.sent || 0), 0);
    const totalOpened = emailMetrics.reduce((sum, m) => sum + (m.opened || 0), 0);
    const openRate = totalSent > 0 ? (totalOpened / totalSent) * 100 : 0;

    // Conversion rate (approximation: deals in final stage / total deals)
    const finalStages = pipelines.length > 0 ? pipelines[0].stages.slice(-2) : [];
    const dealsWon = leads.filter(l => finalStages.some(s => s.id === l.current_stage)).length;
    const conversionRate = leads.length > 0 ? (dealsWon / leads.length) * 100 : 0;

    return [
      {
        name: 'Pipeline Value',
        current: Math.round(totalValue),
        target: 100000,
        unit: '$',
        trend: 'up',
        percentageChange: 15,
        status: totalValue >= 100000 ? 'beating' : totalValue >= 75000 ? 'on-track' : 'behind',
      },
      {
        name: 'Average Deal Size',
        current: Math.round(avgDeal),
        target: 5000,
        unit: '$',
        trend: 'flat',
        percentageChange: 2,
        status: avgDeal >= 5000 ? 'beating' : avgDeal >= 3500 ? 'on-track' : 'behind',
      },
      {
        name: 'Email Open Rate',
        current: Math.round(openRate),
        target: 25,
        unit: '%',
        trend: openRate > 25 ? 'up' : 'down',
        percentageChange: openRate > 25 ? 5 : -3,
        status: openRate >= 25 ? 'beating' : openRate >= 20 ? 'on-track' : 'behind',
      },
      {
        name: 'Conversion Rate',
        current: Math.round(conversionRate),
        target: 20,
        unit: '%',
        trend: conversionRate > 20 ? 'up' : 'down',
        percentageChange: conversionRate > 20 ? 8 : -2,
        status: conversionRate >= 20 ? 'beating' : conversionRate >= 15 ? 'on-track' : 'behind',
      },
    ];
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <GlassCard key={i} className="h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Performance vs Goals</h2>
        <p className="text-white/60">Track your key metrics against targets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <MetricsCard key={kpi.name} {...kpi} />
        ))}
      </div>

      {kpis.filter(k => k.status === 'behind').length > 0 && (
        <GlassCard className="p-6 border-yellow-500/20 bg-yellow-500/5">
          <h3 className="font-semibold text-yellow-400 mb-3">Areas to Improve</h3>
          <ul className="space-y-2 text-sm text-yellow-300/80">
            {kpis.filter(k => k.status === 'behind').map(kpi => (
              <li key={kpi.name}>
                <strong>{kpi.name}</strong>: Currently {kpi.current}{kpi.unit}, target is {kpi.target}{kpi.unit}
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}

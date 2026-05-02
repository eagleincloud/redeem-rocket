import React, { useEffect, useState, useContext } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { GlassCard } from '@/business/components/base/GlassCard';
import { BusinessContext } from '@/business/context/BusinessContext';
import { supabase } from '@/app/lib/supabase';

interface StageMetric {
  stageName: string;
  leadsEntered: number;
  leadsExited: number;
  conversionRate: number;
  avgDaysInStage: number;
  isBottleneck: boolean;
}

interface BottleneckDetectionProps {
  businessId?: string;
}

export default function BottleneckDetection({ businessId: providedBusinessId }: BottleneckDetectionProps) {
  // Get businessId from context if not provided
  const context = useContext(BusinessContext);
  const businessId = providedBusinessId || context?.businessId || '';

  const [metrics, setMetrics] = useState<StageMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  useEffect(() => {
    if (businessId) {
      fetchBottlenecks();
    }
  }, [businessId]);

  const fetchBottlenecks = async () => {
    try {
      setLoading(true);

      if (!supabase) {
        setMetrics([]);
        return;
      }

      // Fetch all leads with stage and dates
      const { data: leads } = await supabase
        .from('leads')
        .select('id, current_stage, created_at, updated_at')
        .eq('business_id', businessId);

      // Fetch pipeline stages
      const { data: pipelines } = await supabase
        .from('business_pipelines')
        .select('stages')
        .eq('business_id', businessId)
        .limit(1);

      const stages = pipelines?.[0]?.stages || [];
      const bottleneckMetrics = calculateBottlenecks(leads || [], stages);
      setMetrics(bottleneckMetrics);
    } catch (error) {
      console.error('Error fetching bottleneck data:', error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateBottlenecks = (leads: any[], stages: any[]) => {
    const metrics: StageMetric[] = [];
    const now = new Date();

    stages.forEach((stage: any) => {
      const stageLeads = leads.filter(l => l.current_stage === stage.id);
      const exited = leads.filter(l =>
        l.updated_at && new Date(l.updated_at) > new Date(l.created_at)
      ).length;

      const avgDays = stageLeads.length > 0
        ? stageLeads.reduce((sum, l) => {
          const days = (now.getTime() - new Date(l.created_at).getTime()) / (1000 * 60 * 60 * 24);
          return sum + days;
        }, 0) / stageLeads.length
        : 0;

      const conversionRate = stageLeads.length > 0 ? (exited / stageLeads.length) * 100 : 0;
      const isBottleneck = avgDays > 7 && conversionRate < 50; // Stuck if >7 days AND low conversion

      metrics.push({
        stageName: stage.name,
        leadsEntered: stageLeads.length,
        leadsExited: exited,
        conversionRate,
        avgDaysInStage: Math.round(avgDays * 10) / 10,
        isBottleneck,
      });
    });

    return metrics;
  };

  const chartData = metrics.map(m => ({
    stage: m.stageName,
    'Entered': m.leadsEntered,
    'Exited': m.leadsExited,
    isBottleneck: m.isBottleneck,
  }));

  if (loading) {
    return <GlassCard className="h-96 animate-pulse" />;
  }

  return (
    <GlassCard className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Pipeline Bottleneck Analysis</h2>
        <p className="text-white/60 text-sm">
          Red stages indicate bottlenecks: high time-in-stage + low conversion rate
        </p>
      </div>

      {metrics.some(m => m.isBottleneck) && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm font-medium">
            ⚠️ {metrics.filter(m => m.isBottleneck).length} bottleneck(s) detected
          </p>
          <p className="text-red-300/80 text-xs mt-1">
            Consider creating automations to move stuck leads or assigning to managers
          </p>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="stage" stroke="rgba(255,255,255,0.6)" />
          <YAxis stroke="rgba(255,255,255,0.6)" />
          <Tooltip
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Bar dataKey="Entered" fill="#FF9E64" />
          <Bar dataKey="Exited" fill="#10B981" />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(metric => (
          <div
            key={metric.stageName}
            className={`p-4 rounded-lg cursor-pointer transition-colors ${
              metric.isBottleneck
                ? 'bg-red-500/10 border border-red-500/30'
                : 'bg-white/5 border border-white/10'
            }`}
            onClick={() => setSelectedStage(metric.stageName)}
          >
            <h3 className="font-semibold text-white mb-2">{metric.stageName}</h3>
            <div className="space-y-1 text-xs text-white/70">
              <p>Leads: {metric.leadsEntered} entered, {metric.leadsExited} exited</p>
              <p>Conversion: {metric.conversionRate.toFixed(0)}%</p>
              <p>Avg Time: {metric.avgDaysInStage} days</p>
              {metric.isBottleneck && (
                <p className="text-red-400 font-medium mt-2">🔴 Bottleneck detected</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export interface DailyMetric {
  business_id: string;
  metric_date: string;
  leads_count: number;
  pipeline_value: number;
  conversion_rate: number;
  avg_deal_size: number;
  email_open_rate: number;
  automation_runs: number;
}

export function useActionableDashboard(businessId: string) {
  const [metrics, setMetrics] = useState<DailyMetric[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, [businessId]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setMetrics(null);
        return;
      }

      // Fetch daily metrics
      const { data: dailyMetrics, error: metricsError } = await supabase
        .from('dashboard_daily_metrics')
        .select('*')
        .eq('business_id', businessId)
        .order('metric_date', { ascending: false })
        .limit(30);

      if (metricsError) throw metricsError;

      setMetrics(dailyMetrics);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
      setError(errorMessage);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  return { metrics, loading, error, refetch: fetchMetrics };
}

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';
import type {
  DashboardInsight,
  SmartRecommendation,
  PerformanceGoal,
  StageBottleneck,
} from '../types/actionable-dashboard';

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

// Hook to fetch dashboard insights
export function useDashboardInsights(businessId: string) {
  const [insights, setInsights] = useState<DashboardInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (!supabase) {
        setError('Supabase client not initialized');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('dashboard_insights')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInsights(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return { insights, loading, error, refetch: fetchInsights };
}

// Hook to fetch smart recommendations
export function useSmartRecommendations(businessId: string) {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (!supabase) {
        setError('Supabase client not initialized');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('smart_recommendations')
        .select('*')
        .eq('business_id', businessId)
        .is('dismissed_at', null)
        .order('impact_score', { ascending: false });

      if (fetchError) throw fetchError;
      setRecommendations(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  const dismissRecommendation = useCallback(
    async (id: string) => {
      try {
        if (!supabase) throw new Error('Supabase client not initialized');

        const { error } = await supabase
          .from('smart_recommendations')
          .update({ dismissed_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        setRecommendations((prev) => prev.filter((r) => r.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to dismiss recommendation');
      }
    },
    []
  );

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  return { recommendations, loading, error, dismiss: dismissRecommendation, refetch: fetchRecommendations };
}

// Hook to fetch performance goals
export function usePerformanceGoals(businessId: string) {
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!businessId) return;

    setLoading(true);
    try {
      if (!supabase) {
        setError('Supabase client not initialized');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('performance_goals')
        .select('*')
        .eq('business_id', businessId);

      if (fetchError) throw fetchError;
      setGoals(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return { goals, loading, error, refetch: fetchGoals };
}

// Hook to fetch bottleneck analysis
export function useBottleneckAnalysis(pipelineId: string) {
  const [bottlenecks, setBottlenecks] = useState<StageBottleneck[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBottlenecks = useCallback(async () => {
    if (!pipelineId) return;

    setLoading(true);
    try {
      if (!supabase) {
        setError('Supabase client not initialized');
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('stage_bottlenecks')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('calculated_date', { ascending: false });

      if (fetchError) throw fetchError;
      setBottlenecks(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bottleneck analysis');
    } finally {
      setLoading(false);
    }
  }, [pipelineId]);

  useEffect(() => {
    fetchBottlenecks();
  }, [fetchBottlenecks]);

  return { bottlenecks, loading, error, refetch: fetchBottlenecks };
}

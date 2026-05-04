import { useEffect, useState } from 'react';
import { supabase } from '@/app/lib/supabase';
import {
  TrendAnalysis,
  Forecast,
  RevenueForecast,
  DealProbability,
  CohortAnalysis,
  FunnelAnalysis,
  AttributionAnalysis,
  ChurnPrediction,
  SegmentAnalysis,
} from '../types/advanced-analytics';

interface UseAdvancedAnalyticsOptions {
  businessId: string;
  metricName?: string;
  pipelineId?: string;
  period?: 'weekly' | 'monthly' | 'quarterly';
}

/**
 * Fetch trend analysis data
 */
export function useTrendAnalysis(businessId: string, metricName?: string) {
  const [trends, setTrends] = useState<TrendAnalysis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrends();
  }, [businessId, metricName]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setTrends(null);
        return;
      }

      let query = supabase
        .from('trend_analysis')
        .select('*')
        .eq('business_id', businessId);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error: queryError } = await query.order('created_at', {
        ascending: false,
      });

      if (queryError) throw queryError;

      setTrends(data as TrendAnalysis[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch trends';
      setError(errorMessage);
      setTrends(null);
    } finally {
      setLoading(false);
    }
  };

  return { trends, loading, error, refetch: fetchTrends };
}

/**
 * Fetch forecast data
 */
export function useForecasts(businessId: string, metricName?: string) {
  const [forecasts, setForecasts] = useState<Forecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecasts();
  }, [businessId, metricName]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setForecasts(null);
        return;
      }

      let query = supabase
        .from('forecasts')
        .select('*')
        .eq('business_id', businessId)
        .gte('forecast_date', new Date().toISOString().split('T')[0]);

      if (metricName) {
        query = query.eq('metric_name', metricName);
      }

      const { data, error: queryError } = await query.order('forecast_date', {
        ascending: true,
      });

      if (queryError) throw queryError;

      setForecasts(data as Forecast[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch forecasts';
      setError(errorMessage);
      setForecasts(null);
    } finally {
      setLoading(false);
    }
  };

  return { forecasts, loading, error, refetch: fetchForecasts };
}

/**
 * Fetch revenue forecasts
 */
export function useRevenueForecasts(
  businessId: string,
  period?: 'weekly' | 'monthly' | 'quarterly'
) {
  const [forecasts, setForecasts] = useState<RevenueForecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchForecasts();
  }, [businessId, period]);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setForecasts(null);
        return;
      }

      let query = supabase
        .from('revenue_forecasts')
        .select('*')
        .eq('business_id', businessId);

      if (period) {
        query = query.eq('period', period);
      }

      const { data, error: queryError } = await query.order('forecast_date', {
        ascending: true,
      });

      if (queryError) throw queryError;

      setForecasts(data as RevenueForecast[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch revenue forecasts';
      setError(errorMessage);
      setForecasts(null);
    } finally {
      setLoading(false);
    }
  };

  return { forecasts, loading, error, refetch: fetchForecasts };
}

/**
 * Fetch deal probability scores for leads
 */
export function useDealProbabilities(businessId: string) {
  const [scores, setScores] = useState<DealProbability[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchScores();
  }, [businessId]);

  const fetchScores = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setScores(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('deal_probability_scores')
        .select('*')
        .eq('business_id', businessId)
        .order('close_probability', { ascending: false });

      if (queryError) throw queryError;

      setScores(data as DealProbability[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch deal scores';
      setError(errorMessage);
      setScores(null);
    } finally {
      setLoading(false);
    }
  };

  return { scores, loading, error, refetch: fetchScores };
}

/**
 * Fetch cohort analysis data
 */
export function useCohortAnalysis(businessId: string) {
  const [cohorts, setCohorts] = useState<CohortAnalysis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCohorts();
  }, [businessId]);

  const fetchCohorts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setCohorts(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('cohort_analysis')
        .select('*')
        .eq('business_id', businessId)
        .order('period_start', { ascending: false });

      if (queryError) throw queryError;

      setCohorts(data as CohortAnalysis[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch cohort analysis';
      setError(errorMessage);
      setCohorts(null);
    } finally {
      setLoading(false);
    }
  };

  return { cohorts, loading, error, refetch: fetchCohorts };
}

/**
 * Fetch funnel analysis for pipelines
 */
export function useFunnelAnalysis(businessId: string, pipelineId?: string) {
  const [funnels, setFunnels] = useState<FunnelAnalysis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFunnels();
  }, [businessId, pipelineId]);

  const fetchFunnels = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setFunnels(null);
        return;
      }

      let query = supabase
        .from('funnel_analysis')
        .select('*')
        .eq('business_id', businessId);

      if (pipelineId) {
        query = query.eq('pipeline_id', pipelineId);
      }

      const { data, error: queryError } = await query.order('calculated_at', {
        ascending: false,
      });

      if (queryError) throw queryError;

      setFunnels(data as FunnelAnalysis[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch funnel analysis';
      setError(errorMessage);
      setFunnels(null);
    } finally {
      setLoading(false);
    }
  };

  return { funnels, loading, error, refetch: fetchFunnels };
}

/**
 * Fetch attribution analysis
 */
export function useAttributionAnalysis(
  businessId: string,
  period?: 'weekly' | 'monthly' | 'quarterly'
) {
  const [attribution, setAttribution] = useState<AttributionAnalysis[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttribution();
  }, [businessId, period]);

  const fetchAttribution = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setAttribution(null);
        return;
      }

      let query = supabase
        .from('attribution_analysis')
        .select('*')
        .eq('business_id', businessId);

      if (period) {
        query = query.eq('period', period);
      }

      const { data, error: queryError } = await query.order('calculated_at', {
        ascending: false,
      });

      if (queryError) throw queryError;

      setAttribution(data as AttributionAnalysis[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch attribution analysis';
      setError(errorMessage);
      setAttribution(null);
    } finally {
      setLoading(false);
    }
  };

  return { attribution, loading, error, refetch: fetchAttribution };
}

/**
 * Fetch churn predictions
 */
export function useChurnPredictions(businessId: string) {
  const [predictions, setPredictions] = useState<ChurnPrediction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPredictions();
  }, [businessId]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setPredictions(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('churn_prediction')
        .select('*')
        .eq('business_id', businessId)
        .order('churn_probability', { ascending: false });

      if (queryError) throw queryError;

      setPredictions(data as ChurnPrediction[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch churn predictions';
      setError(errorMessage);
      setPredictions(null);
    } finally {
      setLoading(false);
    }
  };

  return { predictions, loading, error, refetch: fetchPredictions };
}

/**
 * Fetch segment analysis
 */
export function useSegmentAnalysis(businessId: string) {
  const [segments, setSegments] = useState<SegmentAnalysis[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSegments();
  }, [businessId]);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supabase) {
        setError('Supabase client not initialized');
        setSegments(null);
        return;
      }

      const { data, error: queryError } = await supabase
        .from('segment_analysis')
        .select('*')
        .eq('business_id', businessId)
        .order('size', { ascending: false });

      if (queryError) throw queryError;

      setSegments(data as SegmentAnalysis[]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch segment analysis';
      setError(errorMessage);
      setSegments(null);
    } finally {
      setLoading(false);
    }
  };

  return { segments, loading, error, refetch: fetchSegments };
}

/**
 * Combined hook to fetch all analytics data at once
 */
export function useAllAnalytics(businessId: string) {
  const trends = useTrendAnalysis(businessId);
  const forecasts = useForecasts(businessId);
  const revForecasts = useRevenueForecasts(businessId);
  const dealProbs = useDealProbabilities(businessId);
  const cohorts = useCohortAnalysis(businessId);
  const funnels = useFunnelAnalysis(businessId);
  const attribution = useAttributionAnalysis(businessId);
  const churnPreds = useChurnPredictions(businessId);
  const segments = useSegmentAnalysis(businessId);

  const loading =
    trends.loading ||
    forecasts.loading ||
    revForecasts.loading ||
    dealProbs.loading ||
    cohorts.loading ||
    funnels.loading ||
    attribution.loading ||
    churnPreds.loading ||
    segments.loading;

  const error =
    trends.error ||
    forecasts.error ||
    revForecasts.error ||
    dealProbs.error ||
    cohorts.error ||
    funnels.error ||
    attribution.error ||
    churnPreds.error ||
    segments.error;

  const refetchAll = () => {
    trends.refetch();
    forecasts.refetch();
    revForecasts.refetch();
    dealProbs.refetch();
    cohorts.refetch();
    funnels.refetch();
    attribution.refetch();
    churnPreds.refetch();
    segments.refetch();
  };

  return {
    trends: trends.trends,
    forecasts: forecasts.forecasts,
    revForecasts: revForecasts.forecasts,
    dealProbabilities: dealProbs.scores,
    cohortAnalysis: cohorts.cohorts,
    funnelAnalysis: funnels.funnels,
    attributionAnalysis: attribution.attribution,
    churnPredictions: churnPreds.predictions,
    segmentAnalysis: segments.segments,
    loading,
    error,
    refetch: refetchAll,
  };
}

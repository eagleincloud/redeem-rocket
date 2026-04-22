/**
 * Phase 4: Dashboard Custom Hooks
 * React hooks for dashboard data fetching, caching, and real-time updates
 *
 * @module hooks/useDashboard
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import type {
  DashboardState,
  DashboardKPISummary,
  DashboardHealth,
  Insight,
  Recommendation,
  Anomaly,
  Forecast,
  Metric,
  InsightType,
  RecommendationStatus,
  Priority,
} from '../types/dashboard';

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const QUERY_STALE_TIME = 5 * 60 * 1000; // 5 minutes
const QUERY_GC_TIME = 30 * 60 * 1000; // 30 minutes
const REAL_TIME_UPDATE_INTERVAL = 15 * 60 * 1000; // 15 minutes

// ═════════════════════════════════════════════════════════════════════════════
// API HELPER FUNCTIONS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Fetch KPI summary from API
 */
async function fetchKPISummary(businessId: string): Promise<DashboardKPISummary> {
  const response = await fetch(`/api/dashboard/kpi?businessId=${businessId}`);
  if (!response.ok) throw new Error('Failed to fetch KPI summary');
  return response.json();
}

/**
 * Fetch dashboard health status
 */
async function fetchDashboardHealth(businessId: string): Promise<DashboardHealth> {
  const response = await fetch(`/api/dashboard/health?businessId=${businessId}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard health');
  return response.json();
}

/**
 * Fetch recent insights
 */
async function fetchRecentInsights(
  businessId: string,
  limit: number = 5
): Promise<Insight[]> {
  const response = await fetch(
    `/api/dashboard/insights?businessId=${businessId}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
}

/**
 * Fetch recommendations
 */
async function fetchRecommendations(
  businessId: string,
  status?: RecommendationStatus,
  limit: number = 5
): Promise<Recommendation[]> {
  let url = `/api/dashboard/recommendations?businessId=${businessId}&limit=${limit}`;
  if (status) url += `&status=${status}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch recommendations');
  return response.json();
}

/**
 * Fetch pending anomalies
 */
async function fetchAnomalies(
  businessId: string,
  limit: number = 5
): Promise<Anomaly[]> {
  const response = await fetch(
    `/api/dashboard/anomalies?businessId=${businessId}&limit=${limit}`
  );
  if (!response.ok) throw new Error('Failed to fetch anomalies');
  return response.json();
}

/**
 * Fetch forecasts
 */
async function fetchForecasts(businessId: string): Promise<Forecast[]> {
  const response = await fetch(`/api/dashboard/forecasts?businessId=${businessId}`);
  if (!response.ok) throw new Error('Failed to fetch forecasts');
  return response.json();
}

/**
 * Fetch all metrics
 */
async function fetchMetrics(businessId: string): Promise<Metric[]> {
  const response = await fetch(`/api/dashboard/metrics?businessId=${businessId}`);
  if (!response.ok) throw new Error('Failed to fetch metrics');
  return response.json();
}

/**
 * Generate new insights via AI
 */
async function generateInsights(businessId: string): Promise<Insight[]> {
  const response = await fetch('/api/dashboard/generate-insights', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId }),
  });
  if (!response.ok) throw new Error('Failed to generate insights');
  return response.json();
}

/**
 * Generate recommendations via AI
 */
async function generateRecommendations(businessId: string): Promise<Recommendation[]> {
  const response = await fetch('/api/dashboard/generate-recommendations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ businessId }),
  });
  if (!response.ok) throw new Error('Failed to generate recommendations');
  return response.json();
}

/**
 * Dismiss an insight
 */
async function dismissInsight(insightId: string): Promise<void> {
  const response = await fetch(`/api/dashboard/insights/${insightId}/dismiss`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to dismiss insight');
}

/**
 * Implement a recommendation
 */
async function implementRecommendation(
  recommendationId: string,
  feedback?: { score: number; comment?: string }
): Promise<void> {
  const response = await fetch(
    `/api/dashboard/recommendations/${recommendationId}/implement`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback }),
    }
  );
  if (!response.ok) throw new Error('Failed to implement recommendation');
}

// ═════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Hook: Fetch all dashboard metrics
 */
export function useDashboardMetrics(businessId: string) {
  return useQuery({
    queryKey: ['dashboard', 'metrics', businessId],
    queryFn: () => fetchMetrics(businessId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch AI-generated insights
 */
export function useInsights(businessId: string, limit: number = 5) {
  return useQuery({
    queryKey: ['dashboard', 'insights', businessId, limit],
    queryFn: () => fetchRecentInsights(businessId, limit),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch actionable recommendations
 */
export function useRecommendations(
  businessId: string,
  status?: RecommendationStatus,
  limit: number = 5
) {
  return useQuery({
    queryKey: ['dashboard', 'recommendations', businessId, status, limit],
    queryFn: () => fetchRecommendations(businessId, status, limit),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch real-time anomalies
 */
export function useAnomalies(businessId: string, limit: number = 5) {
  return useQuery({
    queryKey: ['dashboard', 'anomalies', businessId, limit],
    queryFn: () => fetchAnomalies(businessId, limit),
    staleTime: 2 * 60 * 1000, // More frequent updates for anomalies
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch forecasted metrics
 */
export function useForecasts(businessId: string) {
  return useQuery({
    queryKey: ['dashboard', 'forecasts', businessId],
    queryFn: () => fetchForecasts(businessId),
    staleTime: 60 * 60 * 1000, // 1 hour (forecasts don't change as frequently)
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch dashboard KPI summary
 */
export function useKPISummary(businessId: string) {
  return useQuery({
    queryKey: ['dashboard', 'kpi', businessId],
    queryFn: () => fetchKPISummary(businessId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch dashboard health status
 */
export function useDashboardHealth(businessId: string) {
  return useQuery({
    queryKey: ['dashboard', 'health', businessId],
    queryFn: () => fetchDashboardHealth(businessId),
    staleTime: QUERY_STALE_TIME,
    gcTime: QUERY_GC_TIME,
    enabled: !!businessId,
  });
}

/**
 * Hook: Fetch all dashboard data at once
 */
export function useDashboardState(businessId: string): {
  data?: DashboardState;
  isLoading: boolean;
  error?: Error;
} {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error>();

  const results = useQueries({
    queries: [
      {
        queryKey: ['dashboard', 'kpi', businessId],
        queryFn: () => fetchKPISummary(businessId),
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'health', businessId],
        queryFn: () => fetchDashboardHealth(businessId),
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'insights', businessId, 5],
        queryFn: () => fetchRecentInsights(businessId, 5),
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'recommendations', businessId, undefined, 5],
        queryFn: () => fetchRecommendations(businessId, undefined, 5),
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'anomalies', businessId, 5],
        queryFn: () => fetchAnomalies(businessId, 5),
        staleTime: 2 * 60 * 1000,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'forecasts', businessId],
        queryFn: () => fetchForecasts(businessId),
        staleTime: 60 * 60 * 1000,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
      {
        queryKey: ['dashboard', 'metrics', businessId],
        queryFn: () => fetchMetrics(businessId),
        staleTime: QUERY_STALE_TIME,
        gcTime: QUERY_GC_TIME,
        enabled: !!businessId,
      },
    ],
  });

  useEffect(() => {
    const isLoaded = results.every((result) => !result.isLoading);
    setIsLoading(!isLoaded);

    const hasError = results.find((result) => result.error);
    if (hasError) {
      setError(hasError.error as Error);
    }
  }, [results]);

  const data: DashboardState | undefined = results.every((r) => r.data)
    ? {
        kpiSummary: results[0].data as DashboardKPISummary,
        health: results[1].data as DashboardHealth,
        recentInsights: results[2].data as Insight[],
        activeRecommendations: results[3].data as Recommendation[],
        pendingAnomalies: results[4].data as Anomaly[],
        forecasts: results[5].data as Forecast[],
        metrics: results[6].data as Metric[],
        isLoading: false,
        lastUpdated: new Date(),
      }
    : undefined;

  return { data, isLoading, error };
}

/**
 * Hook: Subscribe to real-time metric updates
 */
export function useMetricSubscription(businessId: string) {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!businessId) return;

    // Set up polling interval
    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'metrics', businessId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard', 'anomalies', businessId],
      });
    }, REAL_TIME_UPDATE_INTERVAL);

    return () => {
      clearInterval(interval);
      subscriptionRef.current?.();
    };
  }, [businessId, queryClient]);
}

/**
 * Hook: Generate new insights
 */
export function useGenerateInsights(businessId: string) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error>();

  const generate = useCallback(async () => {
    if (!businessId) return;

    try {
      setIsGenerating(true);
      setError(undefined);
      await generateInsights(businessId);

      // Invalidate insights cache to refetch
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'insights', businessId],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate insights'));
    } finally {
      setIsGenerating(false);
    }
  }, [businessId, queryClient]);

  return { generate, isGenerating, error };
}

/**
 * Hook: Generate recommendations
 */
export function useGenerateRecommendations(businessId: string) {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error>();

  const generate = useCallback(async () => {
    if (!businessId) return;

    try {
      setIsGenerating(true);
      setError(undefined);
      await generateRecommendations(businessId);

      // Invalidate recommendations cache
      await queryClient.invalidateQueries({
        queryKey: ['dashboard', 'recommendations', businessId],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate recommendations'));
    } finally {
      setIsGenerating(false);
    }
  }, [businessId, queryClient]);

  return { generate, isGenerating, error };
}

/**
 * Hook: Dismiss an insight
 */
export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useCallback(
    async (insightId: string, businessId: string) => {
      try {
        await dismissInsight(insightId);

        // Invalidate insights cache
        await queryClient.invalidateQueries({
          queryKey: ['dashboard', 'insights', businessId],
        });
      } catch (error) {
        console.error('Failed to dismiss insight:', error);
        throw error;
      }
    },
    [queryClient]
  );
}

/**
 * Hook: Implement a recommendation
 */
export function useImplementRecommendation() {
  const queryClient = useQueryClient();

  return useCallback(
    async (
      recommendationId: string,
      businessId: string,
      feedback?: { score: number; comment?: string }
    ) => {
      try {
        await implementRecommendation(recommendationId, feedback);

        // Invalidate recommendations cache
        await queryClient.invalidateQueries({
          queryKey: ['dashboard', 'recommendations', businessId],
        });
      } catch (error) {
        console.error('Failed to implement recommendation:', error);
        throw error;
      }
    },
    [queryClient]
  );
}

/**
 * Hook: Refetch all dashboard data
 */
export function useRefreshDashboard(businessId: string) {
  const queryClient = useQueryClient();

  return useCallback(() => {
    if (!businessId) return;

    queryClient.invalidateQueries({
      queryKey: ['dashboard', , businessId],
    });
  }, [businessId, queryClient]);
}

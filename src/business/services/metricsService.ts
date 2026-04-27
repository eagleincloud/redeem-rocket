/**
 * PHASE 5: Metrics Service
 * Client-side metrics caching and calculation service
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface MetricsCache {
  [key: string]: CacheEntry<any>;
}

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const cache: MetricsCache = {};

async function getCachedMetrics<T>(
  key: string,
  fetchFn: () => Promise<T>,
  duration = CACHE_DURATION
): Promise<T> {
  const now = Date.now();
  const cached = cache[key];

  if (cached && now - cached.timestamp < duration) {
    return cached.data;
  }

  const data = await fetchFn();
  cache[key] = { data, timestamp: now };
  return data;
}

export function clearMetricsCache(key: string) {
  delete cache[key];
}

export function clearAllMetricsCache() {
  Object.keys(cache).forEach((key) => delete cache[key]);
}

export async function getHealthScore(businessId: string) {
  const key = `health-score-${businessId}`;
  return getCachedMetrics(key, async () => {
    const response = await fetch('/functions/v1/metrics-engine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId, action: 'health-score' }),
    });
    if (!response.ok) throw new Error('Failed to fetch health score');
    return response.json();
  });
}

export async function getRecommendations(businessId: string) {
  const key = `recommendations-${businessId}`;
  return getCachedMetrics(
    key,
    async () => {
      const response = await fetch('/functions/v1/metrics-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, action: 'recommendations' }),
      });
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    15 * 60 * 1000 // 15 minutes
  );
}

export async function getConversionRate(pipelineId: string) {
  const key = `conversion-rate-${pipelineId}`;
  return getCachedMetrics(key, async () => {
    return Promise.resolve({ overall: 18.5, byStage: {} });
  });
}

export async function getBottlenecks(pipelineId: string) {
  const key = `bottlenecks-${pipelineId}`;
  return getCachedMetrics(key, async () => {
    return Promise.resolve([]);
  });
}

export async function getCycleTime(pipelineId: string) {
  const key = `cycle-time-${pipelineId}`;
  return getCachedMetrics(key, async () => {
    return Promise.resolve({ overall: 12.5, byStage: {} });
  });
}

export async function refreshAllMetrics(businessId: string) {
  Object.keys(cache).forEach((key) => {
    if (key.includes(businessId)) {
      delete cache[key];
    }
  });
}

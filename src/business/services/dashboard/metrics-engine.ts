/**
 * Phase 4: Metrics & Analytics Service
 * Real-time and batch metric calculation for sales pipeline analysis
 *
 * @module services/dashboard/metrics-engine
 */

import { createClient } from '@supabase/supabase-js';
import type { Metric, MetricType, Trend } from '../../types/dashboard';

// ═════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Metric calculation parameters
 */
export interface MetricCalculationParams {
  businessId: string;
  pipelineId?: string;
  periodDays?: number;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Cached metric calculation result
 */
interface CachedMetric {
  metric: Metric;
  timestamp: number;
  expiresAt: number;
}

/**
 * Raw pipeline entity data for calculations
 */
interface PipelineEntity {
  id: string;
  value: number;
  status: 'active' | 'won' | 'lost' | 'paused';
  createdAt: Date;
  enteredStageAt: Date;
  closedAt?: Date;
  assignedTo?: string;
}

/**
 * Stage velocity calculation result
 */
export interface StageVelocity {
  stageId: string;
  stageName: string;
  avgDaysInStage: number;
  medianDaysInStage: number;
  entitiesCount: number;
}

/**
 * Performance comparison result
 */
export interface PerformanceComparison {
  currentPeriod: number;
  previousPeriod: number;
  changePercent: number;
  trend: Trend;
}

// ═════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═════════════════════════════════════════════════════════════════════════════

const CACHE_TTL_MS = 300000; // 5 minutes for real-time metrics
const BATCH_CACHE_TTL_MS = 3600000; // 1 hour for batch calculations
const DEFAULT_PERIOD_DAYS = 30;

// ═════════════════════════════════════════════════════════════════════════════
// METRICS ENGINE SERVICE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Service for calculating and caching business metrics
 */
export class MetricsEngine {
  private cache: Map<string, CachedMetric>;
  private supabaseUrl: string;
  private supabaseAnonKey: string;

  constructor(supabaseUrl?: string, supabaseAnonKey?: string) {
    this.supabaseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || '';
    this.supabaseAnonKey = supabaseAnonKey || process.env.VITE_SUPABASE_ANON_KEY || '';
    this.cache = new Map();

    // Auto cleanup every 30 minutes
    setInterval(() => this.cleanupCache(), 1800000);
  }

  /**
   * Get Supabase client
   */
  private getSupabaseClient() {
    return createClient(this.supabaseUrl, this.supabaseAnonKey);
  }

  /**
   * Generate cache key for metric
   */
  private getCacheKey(metricType: MetricType, params: MetricCalculationParams): string {
    return `${metricType}:${params.businessId}:${params.pipelineId || 'all'}:${
      params.startDate?.getTime() || 'default'
    }`;
  }

  /**
   * Check if cached value is still valid
   */
  private isCacheValid(cachedMetric: CachedMetric): boolean {
    return Date.now() < cachedMetric.expiresAt;
  }

  /**
   * Set cache value
   */
  private setCache(
    metricType: MetricType,
    params: MetricCalculationParams,
    metric: Metric,
    ttlMs: number = CACHE_TTL_MS
  ): void {
    const key = this.getCacheKey(metricType, params);
    this.cache.set(key, {
      metric,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Get cached metric
   */
  private getCache(metricType: MetricType, params: MetricCalculationParams): Metric | null {
    const key = this.getCacheKey(metricType, params);
    const cached = this.cache.get(key);

    if (!cached || !this.isCacheValid(cached)) {
      this.cache.delete(key);
      return null;
    }

    return cached.metric;
  }

  /**
   * Calculate conversion rate
   */
  async calculateConversionRate(params: MetricCalculationParams): Promise<Metric> {
    // Check cache
    const cached = this.getCache('conversion_rate', params);
    if (cached) return cached;

    const supabase = this.getSupabaseClient();
    const periodDays = params.periodDays || DEFAULT_PERIOD_DAYS;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Get current period metrics
    const { data: entities, error } = await supabase
      .from('pipeline_entities')
      .select('id, status')
      .eq('business_id', params.businessId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const totalEntities = entities?.length || 0;
    const wonEntities = entities?.filter((e) => e.status === 'won').length || 0;
    const currentValue = totalEntities === 0 ? 0 : (wonEntities / totalEntities) * 100;

    // Get previous period for comparison
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const { data: prevEntities } = await supabase
      .from('pipeline_entities')
      .select('id, status')
      .eq('business_id', params.businessId)
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', startDate.toISOString());

    const prevTotal = prevEntities?.length || 0;
    const prevWon = prevEntities?.filter((e) => e.status === 'won').length || 0;
    const previousValue = prevTotal === 0 ? 0 : (prevWon / prevTotal) * 100;

    const metric: Metric = {
      id: `metric-${Date.now()}`,
      businessId: params.businessId,
      pipelineId: params.pipelineId,
      metricType: 'conversion_rate',
      metricKey: 'conversion_rate',
      metricLabel: 'Conversion Rate',
      currentValue,
      previousValue,
      periodStartDate: startDate,
      periodEndDate: endDate,
      unit: '%',
      trend: this.calculateTrend(currentValue, previousValue),
      trendPercentage: previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Cache result
    this.setCache('conversion_rate', params, metric);

    return metric;
  }

  /**
   * Calculate average deal size
   */
  async calculateAverageDealSize(params: MetricCalculationParams): Promise<Metric> {
    const cached = this.getCache('avg_deal_size', params);
    if (cached) return cached;

    const supabase = this.getSupabaseClient();
    const periodDays = params.periodDays || DEFAULT_PERIOD_DAYS;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Current period
    const { data: entities, error } = await supabase
      .from('pipeline_entities')
      .select('value')
      .eq('business_id', params.businessId)
      .eq('status', 'won')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (error) throw error;

    const currentValue =
      entities && entities.length > 0
        ? entities.reduce((sum, e) => sum + (e.value || 0), 0) / entities.length
        : 0;

    // Previous period
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const { data: prevEntities } = await supabase
      .from('pipeline_entities')
      .select('value')
      .eq('business_id', params.businessId)
      .eq('status', 'won')
      .gte('created_at', previousPeriodStart.toISOString())
      .lte('created_at', startDate.toISOString());

    const previousValue =
      prevEntities && prevEntities.length > 0
        ? prevEntities.reduce((sum, e) => sum + (e.value || 0), 0) / prevEntities.length
        : 0;

    const metric: Metric = {
      id: `metric-${Date.now()}`,
      businessId: params.businessId,
      pipelineId: params.pipelineId,
      metricType: 'avg_deal_size',
      metricKey: 'avg_deal_size',
      metricLabel: 'Average Deal Size',
      currentValue,
      previousValue,
      periodStartDate: startDate,
      periodEndDate: endDate,
      unit: 'USD',
      trend: this.calculateTrend(currentValue, previousValue),
      trendPercentage: previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.setCache('avg_deal_size', params, metric);
    return metric;
  }

  /**
   * Calculate total pipeline value
   */
  async calculatePipelineValue(params: MetricCalculationParams): Promise<Metric> {
    const cached = this.getCache('pipeline_value', params);
    if (cached) return cached;

    const supabase = this.getSupabaseClient();

    // Current pipeline value (all active deals)
    const { data: entities, error } = await supabase
      .from('pipeline_entities')
      .select('value')
      .eq('business_id', params.businessId)
      .in('status', ['active', 'won']);

    if (error) throw error;

    const currentValue = entities ? entities.reduce((sum, e) => sum + (e.value || 0), 0) : 0;

    // For comparison, use previous period
    const periodDays = params.periodDays || DEFAULT_PERIOD_DAYS;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const { data: prevEntities } = await supabase
      .from('pipeline_entities')
      .select('value')
      .eq('business_id', params.businessId)
      .in('status', ['active', 'won'])
      .lte('created_at', startDate.toISOString())
      .gte('created_at', previousPeriodStart.toISOString());

    const previousValue = prevEntities ? prevEntities.reduce((sum, e) => sum + (e.value || 0), 0) : 0;

    const metric: Metric = {
      id: `metric-${Date.now()}`,
      businessId: params.businessId,
      pipelineId: params.pipelineId,
      metricType: 'pipeline_value',
      metricKey: 'pipeline_value',
      metricLabel: 'Total Pipeline Value',
      currentValue,
      previousValue,
      periodStartDate: startDate,
      periodEndDate: endDate,
      unit: 'USD',
      trend: this.calculateTrend(currentValue, previousValue),
      trendPercentage: previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.setCache('pipeline_value', params, metric, BATCH_CACHE_TTL_MS);
    return metric;
  }

  /**
   * Calculate sales velocity (average days in stage)
   */
  async calculateSalesVelocity(params: MetricCalculationParams): Promise<Metric> {
    const cached = this.getCache('sales_velocity', params);
    if (cached) return cached;

    const supabase = this.getSupabaseClient();
    const periodDays = params.periodDays || DEFAULT_PERIOD_DAYS;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Calculate average days in stage
    const { data: entities } = await supabase
      .from('pipeline_entities')
      .select('entered_stage_at, closed_at')
      .eq('business_id', params.businessId)
      .gte('entered_stage_at', startDate.toISOString());

    let totalDaysInStage = 0;
    let entityCount = 0;

    if (entities) {
      for (const entity of entities) {
        const enteredDate = new Date(entity.entered_stage_at);
        const exitDate = entity.closed_at ? new Date(entity.closed_at) : new Date();
        const daysInStage = (exitDate.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24);
        totalDaysInStage += daysInStage;
        entityCount += 1;
      }
    }

    const currentValue = entityCount > 0 ? totalDaysInStage / entityCount : 0;

    // Previous period for comparison
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const { data: prevEntities } = await supabase
      .from('pipeline_entities')
      .select('entered_stage_at, closed_at')
      .eq('business_id', params.businessId)
      .gte('entered_stage_at', previousPeriodStart.toISOString())
      .lte('entered_stage_at', startDate.toISOString());

    let prevTotalDaysInStage = 0;
    let prevEntityCount = 0;

    if (prevEntities) {
      for (const entity of prevEntities) {
        const enteredDate = new Date(entity.entered_stage_at);
        const exitDate = entity.closed_at ? new Date(entity.closed_at) : new Date();
        const daysInStage = (exitDate.getTime() - enteredDate.getTime()) / (1000 * 60 * 60 * 24);
        prevTotalDaysInStage += daysInStage;
        prevEntityCount += 1;
      }
    }

    const previousValue = prevEntityCount > 0 ? prevTotalDaysInStage / prevEntityCount : 0;

    const metric: Metric = {
      id: `metric-${Date.now()}`,
      businessId: params.businessId,
      pipelineId: params.pipelineId,
      metricType: 'sales_velocity',
      metricKey: 'sales_velocity',
      metricLabel: 'Sales Velocity',
      currentValue,
      previousValue,
      periodStartDate: startDate,
      periodEndDate: endDate,
      unit: 'days',
      trend: this.calculateTrend(previousValue - currentValue, 0), // Lower is better
      trendPercentage: previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.setCache('sales_velocity', params, metric);
    return metric;
  }

  /**
   * Calculate win/loss rate
   */
  async calculateWinLossRate(params: MetricCalculationParams): Promise<Metric> {
    const cached = this.getCache('win_loss_rate', params);
    if (cached) return cached;

    const supabase = this.getSupabaseClient();
    const periodDays = params.periodDays || DEFAULT_PERIOD_DAYS;
    const endDate = params.endDate || new Date();
    const startDate = params.startDate || new Date(endDate.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Current period
    const { data: entities } = await supabase
      .from('pipeline_entities')
      .select('status')
      .eq('business_id', params.businessId)
      .in('status', ['won', 'lost'])
      .gte('closed_at', startDate.toISOString())
      .lte('closed_at', endDate.toISOString());

    const totalClosed = entities?.length || 0;
    const wonCount = entities?.filter((e) => e.status === 'won').length || 0;
    const currentValue = totalClosed === 0 ? 0 : (wonCount / totalClosed) * 100;

    // Previous period
    const previousPeriodStart = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const { data: prevEntities } = await supabase
      .from('pipeline_entities')
      .select('status')
      .eq('business_id', params.businessId)
      .in('status', ['won', 'lost'])
      .gte('closed_at', previousPeriodStart.toISOString())
      .lte('closed_at', startDate.toISOString());

    const prevTotal = prevEntities?.length || 0;
    const prevWon = prevEntities?.filter((e) => e.status === 'won').length || 0;
    const previousValue = prevTotal === 0 ? 0 : (prevWon / prevTotal) * 100;

    const metric: Metric = {
      id: `metric-${Date.now()}`,
      businessId: params.businessId,
      pipelineId: params.pipelineId,
      metricType: 'win_loss_rate',
      metricKey: 'win_loss_rate',
      metricLabel: 'Win/Loss Rate',
      currentValue,
      previousValue,
      periodStartDate: startDate,
      periodEndDate: endDate,
      unit: '%',
      trend: this.calculateTrend(currentValue, previousValue),
      trendPercentage: previousValue === 0 ? 0 : ((currentValue - previousValue) / previousValue) * 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.setCache('win_loss_rate', params, metric);
    return metric;
  }

  /**
   * Get all KPI metrics at once
   */
  async getAllKPIMetrics(params: MetricCalculationParams): Promise<Metric[]> {
    const metrics: Metric[] = [];

    try {
      metrics.push(await this.calculateConversionRate(params));
      metrics.push(await this.calculateAverageDealSize(params));
      metrics.push(await this.calculatePipelineValue(params));
      metrics.push(await this.calculateSalesVelocity(params));
      metrics.push(await this.calculateWinLossRate(params));
    } catch (error) {
      console.error('Error calculating KPI metrics:', error);
    }

    return metrics;
  }

  /**
   * Get stage velocity metrics
   */
  async getStageVelocity(businessId: string, pipelineId?: string): Promise<StageVelocity[]> {
    const supabase = this.getSupabaseClient();

    const { data: stages, error } = await supabase
      .from('pipeline_stages')
      .select('id, name, order_index')
      .eq('pipeline_id', pipelineId);

    if (error || !stages) return [];

    const velocities: StageVelocity[] = [];

    for (const stage of stages) {
      const { data: entities } = await supabase
        .from('pipeline_entities')
        .select('entered_stage_at, closed_at');

      if (!entities) continue;

      const daysInStages: number[] = [];

      for (const entity of entities) {
        const entered = new Date(entity.entered_stage_at);
        const exited = entity.closed_at ? new Date(entity.closed_at) : new Date();
        const days = (exited.getTime() - entered.getTime()) / (1000 * 60 * 60 * 24);
        daysInStages.push(days);
      }

      daysInStages.sort((a, b) => a - b);
      const median = daysInStages[Math.floor(daysInStages.length / 2)];
      const avg = daysInStages.reduce((a, b) => a + b, 0) / daysInStages.length;

      velocities.push({
        stageId: stage.id,
        stageName: stage.name,
        avgDaysInStage: Math.round(avg * 10) / 10,
        medianDaysInStage: Math.round(median * 10) / 10,
        entitiesCount: entities.length,
      });
    }

    return velocities;
  }

  /**
   * Calculate trend indicator
   */
  private calculateTrend(current: number, previous: number): Trend {
    if (previous === 0) return 'neutral';
    const change = ((current - previous) / previous) * 100;
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'neutral';
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═════════════════════════════════════════════════════════════════════════════

let metricsEngineInstance: MetricsEngine | null = null;

/**
 * Get or create the Metrics Engine singleton
 */
export function getMetricsEngine(
  supabaseUrl?: string,
  supabaseAnonKey?: string
): MetricsEngine {
  if (!metricsEngineInstance) {
    metricsEngineInstance = new MetricsEngine(supabaseUrl, supabaseAnonKey);
  }
  return metricsEngineInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetMetricsEngine(): void {
  metricsEngineInstance = null;
}

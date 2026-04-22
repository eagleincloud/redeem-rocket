/**
 * Phase 4: AI Insights Service
 * Claude API integration for intelligent analysis of business metrics
 *
 * @module services/dashboard/ai-insights
 */

import { Anthropic } from '@anthropic-ai/sdk';
import type {
  Insight,
  InsightType,
  Recommendation,
  Anomaly,
  Metric,
  ActionType,
  Priority,
  InsightHistoricalContext,
} from '../../types/dashboard';

// ═════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════

const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022';
const API_TIMEOUT_MS = 30000;
const CACHE_TTL_MS = 3600000; // 1 hour
const RATE_LIMIT_CALLS_PER_MINUTE = 10;

// ═════════════════════════════════════════════════════════════════════════════
// TYPES
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Cache entry for AI-generated content
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Context for AI analysis
 */
export interface AnalysisContext {
  businessId: string;
  pipelineId?: string;
  periodDays?: number;
  includeHistoricalContext?: boolean;
}

/**
 * Metrics data for analysis
 */
export interface MetricsData {
  metrics: Metric[];
  historicalMetrics?: Metric[];
  targets?: Record<string, number>;
  previousPeriodMetrics?: Metric[];
}

/**
 * Raw AI response for parsing
 */
interface AIAnalysisResponse {
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impactScore?: number;
    confidence?: number;
    rootCause?: string;
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    actionType: string;
    priority: string;
    expectedImpact?: string;
    confidence?: number;
    reasoning?: string;
  }>;
}

// ═════════════════════════════════════════════════════════════════════════════
// RATE LIMITER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Simple rate limiter using token bucket algorithm
 */
class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per ms

  constructor(callsPerMinute: number) {
    this.maxTokens = callsPerMinute;
    this.tokens = callsPerMinute;
    this.lastRefill = Date.now();
    this.refillRate = callsPerMinute / 60000; // per millisecond
  }

  /**
   * Check if request is allowed
   */
  isAllowed(): boolean {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get wait time in milliseconds
   */
  getWaitTime(): number {
    if (this.tokens >= 1) return 0;
    return Math.ceil((1 - this.tokens) / this.refillRate);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CACHE MANAGER
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Simple in-memory cache with TTL
 */
class CacheManager {
  private cache: Map<string, CacheEntry<unknown>>;

  constructor() {
    this.cache = new Map();
  }

  /**
   * Generate cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, unknown>): string {
    return `${prefix}:${JSON.stringify(params)}`;
  }

  /**
   * Get cached value
   */
  get<T>(prefix: string, params: Record<string, unknown>): T | null {
    const key = this.generateKey(prefix, params);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cache value
   */
  set<T>(
    prefix: string,
    params: Record<string, unknown>,
    data: T,
    ttlMs: number = CACHE_TTL_MS
  ): void {
    const key = this.generateKey(prefix, params);
    const timestamp = Date.now();

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt: timestamp + ttlMs,
    });
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear old entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// AI INSIGHTS SERVICE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Service for AI-powered insights and recommendations
 */
export class AIInsightsService {
  private client: Anthropic;
  private cache: CacheManager;
  private rateLimiter: RateLimiter;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
      timeout: API_TIMEOUT_MS,
    });

    this.cache = new CacheManager();
    this.rateLimiter = new RateLimiter(RATE_LIMIT_CALLS_PER_MINUTE);

    // Run cleanup every 10 minutes
    setInterval(() => this.cache.cleanup(), 600000);
  }

  /**
   * Sanitize business data before sending to Claude
   * Removes sensitive information and generalizes values
   */
  private sanitizeMetricsData(data: MetricsData): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {
      metrics: data.metrics.map((m) => ({
        type: m.metricType,
        currentValue: m.currentValue > 1000000 ? '$1M+' : m.currentValue,
        trend: m.trend,
        unit: m.unit,
      })),
    };

    if (data.targets) {
      sanitized.targets = Object.entries(data.targets).reduce(
        (acc, [key, val]) => {
          acc[key] = val > 1000000 ? '$1M+' : val;
          return acc;
        },
        {} as Record<string, unknown>
      );
    }

    return sanitized;
  }

  /**
   * Wait for rate limit if needed
   */
  private async checkRateLimit(): Promise<void> {
    while (!this.rateLimiter.isAllowed()) {
      const waitTime = this.rateLimiter.getWaitTime();
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Generate insights from metrics data
   */
  async generateInsight(
    metricsData: MetricsData,
    context: AnalysisContext
  ): Promise<Insight | null> {
    try {
      // Check cache first
      const cacheKey = { businessId: context.businessId, type: 'insight' };
      const cached = this.cache.get<Insight>('insight', cacheKey);
      if (cached) return cached;

      // Rate limit check
      await this.checkRateLimit();

      // Prepare prompt
      const sanitized = this.sanitizeMetricsData(metricsData);
      const prompt = this.buildInsightPrompt(sanitized, context);

      // Call Claude API
      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') return null;

      const insight = this.parseInsightResponse(content.text, context);

      // Cache result
      if (insight) {
        this.cache.set('insight', cacheKey, insight);
      }

      return insight;
    } catch (error) {
      console.error('Error generating insight:', error);
      return null;
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  async generateRecommendations(
    metricsData: MetricsData,
    context: AnalysisContext
  ): Promise<Recommendation[]> {
    try {
      // Check cache
      const cacheKey = { businessId: context.businessId, type: 'recommendations' };
      const cached = this.cache.get<Recommendation[]>('recommendations', cacheKey);
      if (cached) return cached;

      // Rate limit
      await this.checkRateLimit();

      // Prepare prompt
      const sanitized = this.sanitizeMetricsData(metricsData);
      const prompt = this.buildRecommendationPrompt(sanitized, context);

      // Call Claude
      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      // Parse response
      const content = response.content[0];
      if (content.type !== 'text') return [];

      const recommendations = this.parseRecommendationsResponse(
        content.text,
        context
      );

      // Cache results
      if (recommendations.length > 0) {
        this.cache.set('recommendations', cacheKey, recommendations);
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Detect anomalies in time series data
   */
  async detectAnomalies(
    timeseries: Array<{ date: Date; value: number }>,
    baseline: number,
    threshold: number = 2.0
  ): Promise<Anomaly[]> {
    try {
      if (timeseries.length < 5) return [];

      // Calculate statistics
      const values = timeseries.map((p) => p.value);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Identify anomalies
      const anomalies: Anomaly[] = [];

      for (let i = 0; i < timeseries.length; i++) {
        const point = timeseries[i];
        const zScore = stdDev === 0 ? 0 : Math.abs(point.value - mean) / stdDev;

        if (zScore > threshold) {
          anomalies.push({
            id: `anomaly-${i}`,
            businessId: '',
            anomalyType: 'spike',
            affectedMetric: 'metric',
            description: `Unusual spike detected: ${point.value}`,
            severity: zScore > 3 ? 'critical' : zScore > 2.5 ? 'high' : 'medium',
            baselineValue: baseline,
            detectedValue: point.value,
            deviationPercent: ((point.value - baseline) / baseline) * 100,
            detectionMethod: 'statistical',
            standardDeviations: zScore,
            confidenceScore: Math.min(zScore / 4, 1),
            resolution: {
              acknowledged: false,
              resolved: false,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }

      return anomalies;
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      return [];
    }
  }

  /**
   * Forecast future metric values
   */
  async forecastMetrics(
    historicalData: Array<{ date: Date; value: number }>,
    periodsAhead: number = 4
  ): Promise<Array<{ date: Date; predicted: number; confidence: number }>> {
    try {
      if (historicalData.length < 3) return [];

      // Simple exponential smoothing
      const alpha = 0.3;
      const values = historicalData.map((p) => p.value);

      let smoothed = values[0];
      for (let i = 1; i < values.length; i++) {
        smoothed = alpha * values[i] + (1 - alpha) * smoothed;
      }

      // Generate forecasts
      const forecasts: Array<{ date: Date; predicted: number; confidence: number }> = [];
      const lastDate = historicalData[historicalData.length - 1].date;

      for (let i = 1; i <= periodsAhead; i++) {
        const forecastDate = new Date(lastDate);
        forecastDate.setDate(forecastDate.getDate() + 30 * i);

        forecasts.push({
          date: forecastDate,
          predicted: Math.round(smoothed * 100) / 100,
          confidence: Math.max(0.5, 1 - (i * 0.1)),
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error forecasting metrics:', error);
      return [];
    }
  }

  /**
   * Analyze trends in metric data
   */
  async analyzeTrends(
    metricsData: MetricsData,
    period: string
  ): Promise<{ direction: 'up' | 'down' | 'neutral'; description: string }> {
    try {
      if (!metricsData.metrics.length) {
        return { direction: 'neutral', description: 'Insufficient data' };
      }

      const current = metricsData.metrics[0].currentValue;
      const previous = metricsData.metrics[0].previousValue ?? current;

      const change = current - previous;
      const percentChange = previous !== 0 ? (change / previous) * 100 : 0;

      let direction: 'up' | 'down' | 'neutral' = 'neutral';
      if (percentChange > 5) direction = 'up';
      else if (percentChange < -5) direction = 'down';

      const description = `${metricsData.metrics[0].metricLabel} is ${
        direction === 'up' ? 'increasing' : direction === 'down' ? 'decreasing' : 'stable'
      } over the ${period}`;

      return { direction, description };
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return { direction: 'neutral', description: 'Error analyzing trends' };
    }
  }

  /**
   * Suggest actions based on problems
   */
  async suggestActions(
    problems: string[],
    capabilities: string[]
  ): Promise<Array<{ action: string; effort: 'low' | 'medium' | 'high' }>> {
    try {
      // Rate limit
      await this.checkRateLimit();

      const prompt = `
Given these business problems and available capabilities, suggest specific actions:

Problems:
${problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Capabilities:
${capabilities.map((c, i) => `${i + 1}. ${c}`).join('\n')}

Respond with a JSON array of actions, each with "action" (string) and "effort" (low/medium/high):
[{"action": "...", "effort": "low"}, ...]
`;

      const response = await this.client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') return [];

      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch {
        // Return default actions if parsing fails
      }

      return [
        { action: 'Review pipeline health', effort: 'low' },
        { action: 'Schedule follow-up calls', effort: 'medium' },
        { action: 'Analyze deal velocity', effort: 'medium' },
      ];
    } catch (error) {
      console.error('Error suggesting actions:', error);
      return [];
    }
  }

  /**
   * Build prompt for insight generation
   */
  private buildInsightPrompt(
    sanitized: Record<string, unknown>,
    context: AnalysisContext
  ): string {
    return `
Analyze the following business metrics and provide a single key insight:

${JSON.stringify(sanitized, null, 2)}

Generate a JSON response with this structure:
{
  "type": "insight_type",
  "title": "Brief title",
  "description": "Detailed description",
  "impactScore": 0.0-1.0,
  "confidence": 0.0-1.0,
  "rootCause": "Likely root cause if applicable"
}

Focus on actionable insights that drive business decisions.
`;
  }

  /**
   * Build prompt for recommendations
   */
  private buildRecommendationPrompt(
    sanitized: Record<string, unknown>,
    context: AnalysisContext
  ): string {
    return `
Based on these business metrics, provide 2-3 specific, actionable recommendations:

${JSON.stringify(sanitized, null, 2)}

Generate a JSON response with this structure:
{
  "recommendations": [
    {
      "title": "Action title",
      "description": "How to implement",
      "actionType": "follow_up_call|send_email|reassign_lead|etc",
      "priority": "low|medium|high|critical",
      "expectedImpact": "What will improve",
      "confidence": 0.0-1.0,
      "reasoning": "Why this recommendation"
    }
  ]
}

Prioritize recommendations by impact potential.
`;
  }

  /**
   * Parse insight from Claude response
   */
  private parseInsightResponse(
    text: string,
    context: AnalysisContext
  ): Insight | null {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisResponse['insights'][0];

      const now = new Date();
      return {
        id: `insight-${Date.now()}`,
        businessId: context.businessId,
        pipelineId: context.pipelineId,
        insightType: (parsed.type || 'performance') as InsightType,
        title: parsed.title,
        description: parsed.description,
        impactScore: parsed.impactScore ?? 0.5,
        data: {},
        rootCause: parsed.rootCause,
        aiGenerated: true,
        aiModel: CLAUDE_MODEL,
        confidenceScore: parsed.confidence ?? 0.8,
        dismissed: false,
        actionTaken: false,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error parsing insight response:', error);
      return null;
    }
  }

  /**
   * Parse recommendations from Claude response
   */
  private parseRecommendationsResponse(
    text: string,
    context: AnalysisContext
  ): Recommendation[] {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]) as AIAnalysisResponse;
      const now = new Date();

      return (parsed.recommendations || []).map((rec) => ({
        id: `rec-${Date.now()}-${Math.random()}`,
        businessId: context.businessId,
        title: rec.title,
        description: rec.description,
        actionType: (rec.actionType || 'investigate') as ActionType,
        priority: (rec.priority || 'medium') as Priority,
        expectedImpact: rec.expectedImpact,
        confidenceScore: rec.confidence ?? 0.8,
        reasoning: rec.reasoning,
        implementation: {
          status: 'suggested' as const,
        },
        createdAt: now,
        updatedAt: now,
      }));
    } catch (error) {
      console.error('Error parsing recommendations response:', error);
      return [];
    }
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═════════════════════════════════════════════════════════════════════════════

let aiInsightsInstance: AIInsightsService | null = null;

/**
 * Get or create the AI Insights Service singleton
 */
export function getAIInsightsService(apiKey?: string): AIInsightsService {
  if (!aiInsightsInstance) {
    aiInsightsInstance = new AIInsightsService(apiKey);
  }
  return aiInsightsInstance;
}

/**
 * Reset the singleton (useful for testing)
 */
export function resetAIInsightsService(): void {
  aiInsightsInstance = null;
}

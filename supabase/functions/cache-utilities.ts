/**
 * Caching Utilities for Edge Functions
 * Provides consistent caching strategies across all functions
 */

export interface CacheConfig {
  maxAge: number;      // Cache duration in seconds
  sMaxAge?: number;    // Shared cache (CDN) duration in seconds
  public?: boolean;    // Allow public caching
  private?: boolean;   // Cache only for authenticated users
  revalidate?: boolean; // Allow stale-while-revalidate
}

// ═══════════════════════════════════════════════════════════════════════════
// CACHE STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

export const CACHE_STRATEGIES = {
  // Business settings - cache 5 minutes (moderate change frequency)
  businessSettings: {
    maxAge: 300,
    sMaxAge: 300,
    public: false,
  } as CacheConfig,

  // Pipeline stages - cache 10 minutes (low change frequency)
  pipelineStages: {
    maxAge: 600,
    sMaxAge: 600,
    public: false,
  } as CacheConfig,

  // Feature preferences - cache 1 hour (rarely change)
  featurePreferences: {
    maxAge: 3600,
    sMaxAge: 3600,
    public: false,
  } as CacheConfig,

  // Public lists (products, services) - cache 30 minutes
  publicLists: {
    maxAge: 1800,
    sMaxAge: 1800,
    public: true,
  } as CacheConfig,

  // Analytics data - cache 5 minutes (needs freshness)
  analytics: {
    maxAge: 300,
    sMaxAge: 300,
    public: false,
  } as CacheConfig,

  // Health checks - no caching
  health: {
    maxAge: 0,
    public: true,
  } as CacheConfig,

  // Real-time data (leads, messages) - short cache 30 seconds
  realtime: {
    maxAge: 30,
    sMaxAge: 0,
    public: false,
  } as CacheConfig,
};

/**
 * Generate Cache-Control header value
 */
export function generateCacheHeader(config: CacheConfig): string {
  const parts: string[] = [];

  if (config.public) {
    parts.push('public');
  } else if (config.private !== false) {
    parts.push('private');
  }

  parts.push(`max-age=${config.maxAge}`);

  if (config.sMaxAge !== undefined) {
    parts.push(`s-maxage=${config.sMaxAge}`);
  }

  if (config.revalidate) {
    parts.push('stale-while-revalidate=86400'); // Allow stale for 24 hours
  }

  return parts.join(', ');
}

/**
 * Create response with caching headers
 */
export function createCachedResponse(
  data: any,
  cacheConfig: CacheConfig,
  additionalHeaders?: Record<string, string>
): Response {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': generateCacheHeader(cacheConfig),
    'Vary': 'Authorization, Accept-Encoding',
    ...additionalHeaders,
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers,
  });
}

/**
 * Add cache headers to error responses
 */
export function createCachedErrorResponse(
  error: any,
  statusCode: number = 500,
  cacheConfig?: CacheConfig
): Response {
  const config = cacheConfig || CACHE_STRATEGIES.health; // Don't cache errors by default
  
  return createCachedResponse(
    { error: error.message || error },
    config,
    { 'X-Error': 'true' }
  );
}

/**
 * Extract cache key from request
 * Used for manual caching implementations
 */
export function generateCacheKey(
  endpoint: string,
  businessId: string,
  params: Record<string, any> = {}
): string {
  const paramStr = JSON.stringify(params);
  return `${endpoint}:${businessId}:${btoa(paramStr)}`;
}

/**
 * Feature Gate Middleware
 * Checks feature availability before executing API routes
 *
 * Usage:
 *   export const POST = withFeatureGate(['chat'])(async (req) => {
 *     // Only runs if chat feature is enabled
 *   });
 */

import { supabase } from '@/app/lib/supabase';

export interface FeatureGateContext {
  businessId: string;
  userId?: string;
  features: Record<string, boolean>;
  featureAvailable: (featureName: string) => boolean;
}

/**
 * Middleware factory for feature gating
 */
export function withFeatureGate(requiredFeatures: string[]) {
  return (
    handler: (
      req: Request,
      context: FeatureGateContext
    ) => Promise<Response>
  ) => {
    return async (req: Request): Promise<Response> => {
      try {
        // Extract business ID from headers or body
        const businessId =
          req.headers.get('X-Business-ID') ||
          req.headers.get('x-business-id');

        if (!businessId) {
          return new Response(JSON.stringify({ error: 'Missing businessId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Check all required features
        const featureStates: Record<string, boolean> = {};
        const allFeaturesEnabled = true;

        for (const featureName of requiredFeatures) {
          const isEnabled = await checkFeatureEnabled(
            businessId,
            featureName
          );
          featureStates[featureName] = isEnabled;

          if (!isEnabled) {
            return new Response(
              JSON.stringify({
                error: `Feature '${featureName}' is not enabled for this business`,
                feature: featureName,
                status: 'feature_not_available',
              }),
              {
                status: 402, // Payment Required - feature not available
                headers: { 'Content-Type': 'application/json' },
              }
            );
          }
        }

        // Create feature gate context
        const context: FeatureGateContext = {
          businessId,
          features: featureStates,
          featureAvailable: (featureName: string) => featureStates[featureName],
        };

        // Call the actual handler
        return await handler(req, context);
      } catch (error) {
        console.error('Feature gate error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    };
  };
}

/**
 * Middleware for optional feature logging
 */
export function withFeatureLogging(
  handler: (req: Request) => Promise<Response>
) {
  return async (req: Request): Promise<Response> => {
    const businessId = req.headers.get('X-Business-ID');
    const startTime = Date.now();

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;

      // Log feature access (fire and forget)
      if (businessId) {
        logFeatureAccess(businessId, req, 'success', duration).catch(
          console.error
        );
      }

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      if (businessId) {
        logFeatureAccess(
          businessId,
          req,
          'error',
          duration,
          error instanceof Error ? error.message : 'Unknown error'
        ).catch(console.error);
      }

      throw error;
    }
  };
}

/**
 * Check if a feature is enabled for a business
 */
export async function checkFeatureEnabled(
  businessId: string,
  featureName: string
): Promise<boolean> {
  try {
    // Get business feature status
    const { data: businessFeature, error } = await supabase
      .from('business_features')
      .select('is_enabled, rollout_percentage')
      .eq('business_id', businessId)
      .eq('feature_name', featureName)
      .single();

    // If no override exists, default to enabled
    if (error && error.code === 'PGRST116') {
      return true;
    }

    if (error) {
      console.error('Error checking feature status:', error);
      return false;
    }

    // Check if feature is enabled
    if (!businessFeature?.is_enabled) {
      return false;
    }

    // Check rollout percentage
    const rolloutPercentage = businessFeature.rollout_percentage ?? 100;
    if (rolloutPercentage < 100) {
      return isEligibleForRollout(businessId, featureName, rolloutPercentage);
    }

    return true;
  } catch (error) {
    console.error('Error in checkFeatureEnabled:', error);
    return false;
  }
}

/**
 * Deterministically check if business is eligible for feature rollout
 */
export function isEligibleForRollout(
  businessId: string,
  featureName: string,
  rolloutPercentage: number
): boolean {
  // Combine business ID and feature name
  const combined = `${businessId}:${featureName}`;

  // Simple hash function (deterministic)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Map to 0-100 range
  const percentage = Math.abs(hash) % 100;
  return percentage < rolloutPercentage;
}

/**
 * Log feature access attempt
 */
async function logFeatureAccess(
  businessId: string,
  req: Request,
  status: 'success' | 'error',
  duration: number,
  errorMessage?: string
): Promise<void> {
  try {
    const feature = extractFeatureFromRequest(req);
    if (!feature) return;

    await supabase.from('feature_usage_events').insert({
      business_id: businessId,
      feature_name: feature,
      event_type: status === 'success' ? 'accessed' : 'error',
      event_data: {
        endpoint: req.url,
        method: req.method,
        duration_ms: duration,
      },
      error_message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error logging feature access:', error);
  }
}

/**
 * Extract feature name from request URL
 */
function extractFeatureFromRequest(req: Request): string | null {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const featureIndex = pathParts.indexOf('features');
    if (featureIndex >= 0 && featureIndex + 1 < pathParts.length) {
      return pathParts[featureIndex + 1];
    }
  } catch (error) {
    console.error('Error extracting feature from request:', error);
  }
  return null;
}

/**
 * Rate limiting for feature-gated endpoints
 */
export function withRateLimit(
  handler: (req: Request) => Promise<Response>,
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const requestCounts = new Map<string, number[]>();

  return async (req: Request): Promise<Response> => {
    const businessId = req.headers.get('X-Business-ID');
    if (!businessId) {
      return new Response(JSON.stringify({ error: 'Missing businessId' }), {
        status: 400,
      });
    }

    const now = Date.now();
    const requests = requestCounts.get(businessId) || [];

    // Clean old requests outside window
    const recentRequests = requests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= maxRequests) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: windowMs / 1000,
        }),
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
          },
        }
      );
    }

    recentRequests.push(now);
    requestCounts.set(businessId, recentRequests);

    return await handler(req);
  };
}

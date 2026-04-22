/**
 * Feature Catalog Service
 * Provides core functionality for browsing, searching, and managing features
 */

import { supabase } from '@/app/lib/supabase';
import type {
  MarketplaceFeature,
  FeatureCard,
  FeatureBrowseFilters,
  FeatureSearchResult,
  FeatureRating,
  FeatureReview,
  FeatureRequest,
  FeatureUsage,
  FeatureAnalytics,
  RecommendedFeature,
  FeatureRecommendations,
  RatingStats,
} from '@/business/types/marketplace';

/**
 * Get all available features for the marketplace
 */
export async function getFeatures(
  businessId: string,
  filters?: FeatureBrowseFilters,
): Promise<FeatureSearchResult> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    let query = supabase
      .from('marketplace_features')
      .select('*', { count: 'exact' })
      .eq('is_available', true);

    // Apply category filter
    if (filters?.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    // Apply status filter
    if (filters?.statuses && filters.statuses.length > 0) {
      query = query.in('status', filters.statuses);
    }

    // Apply search query with full-text search
    if (filters?.searchQuery) {
      query = query.or(
        `feature_name.ilike.%${filters.searchQuery}%,description.ilike.%${filters.searchQuery}%`,
      );
    }

    // Apply sorting
    const sortField =
      filters?.sortBy === 'trending'
        ? 'adoption_rate'
        : filters?.sortBy === 'highest_rated'
          ? 'average_rating'
          : filters?.sortBy === 'most_adopted'
            ? 'adoption_rate'
            : 'created_at';

    const sortOrder = filters?.sortBy?.includes('most_adopted') ? 'desc' : 'desc';
    query = query.order(sortField, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const pageSize = filters?.pageSize || 12;
    const page = filters?.page || 0;
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    // Fetch user's ratings and reviews for these features
    const featureIds = (data || []).map((f) => f.id);
    const userRatings = await getUserRatings(businessId, featureIds);
    const userReviews = await getUserReviews(businessId, featureIds);
    const userUsage = await getUserFeatureUsage(businessId, featureIds);

    // Combine data
    const features: FeatureCard[] = (data || []).map((feature) => ({
      ...feature,
      isEnabled: userUsage[feature.id]?.is_enabled || false,
      userRating: userRatings[feature.id]?.rating_value,
      userReviewCount: userReviews[feature.id] ? 1 : 0,
    }));

    return {
      features,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > (page + 1) * pageSize,
    };
  } catch (error) {
    console.error('Error fetching features:', error);
    throw error;
  }
}

/**
 * Search features with full-text search
 */
export async function searchFeatures(
  query: string,
  businessId: string,
  limit: number = 20,
): Promise<FeatureCard[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('is_available', true)
      .or(`feature_name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('adoption_rate', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Fetch additional user data
    const featureIds = (data || []).map((f) => f.id);
    const userUsage = await getUserFeatureUsage(businessId, featureIds);

    return (data || []).map((feature) => ({
      ...feature,
      isEnabled: userUsage[feature.id]?.is_enabled || false,
    }));
  } catch (error) {
    console.error('Error searching features:', error);
    throw error;
  }
}

/**
 * Get features by category
 */
export async function getFeaturesByCategory(
  category: string,
  businessId: string,
): Promise<FeatureCard[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('category', category)
      .eq('is_available', true)
      .order('adoption_rate', { ascending: false });

    if (error) throw error;

    // Fetch user usage data
    const featureIds = (data || []).map((f) => f.id);
    const userUsage = await getUserFeatureUsage(businessId, featureIds);

    return (data || []).map((feature) => ({
      ...feature,
      isEnabled: userUsage[feature.id]?.is_enabled || false,
    }));
  } catch (error) {
    console.error('Error fetching features by category:', error);
    throw error;
  }
}

/**
 * Get trending features (top by adoption and rating)
 */
export async function getTrendingFeatures(
  businessId: string,
  limit: number = 5,
): Promise<FeatureCard[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('is_available', true)
      .order('adoption_rate', { ascending: false })
      .order('average_rating', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const featureIds = (data || []).map((f) => f.id);
    const userUsage = await getUserFeatureUsage(businessId, featureIds);

    return (data || []).map((feature) => ({
      ...feature,
      isEnabled: userUsage[feature.id]?.is_enabled || false,
    }));
  } catch (error) {
    console.error('Error fetching trending features:', error);
    throw error;
  }
}

/**
 * Get recommended features for a business (AI-powered or rule-based)
 */
export async function getRecommendedFeatures(
  businessId: string,
): Promise<FeatureRecommendations> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Get all available features
    const { data: features, error } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('is_available', true);

    if (error) throw error;

    // Get user's current enabled features
    const { data: userFeatures } = await supabase
      .from('feature_usage')
      .select('feature_id')
      .eq('business_id', businessId)
      .eq('is_enabled', true);

    const enabledFeatureIds = new Set((userFeatures || []).map((f) => f.feature_id));

    // Calculate relevance scores based on adoption and rating
    const recommended: RecommendedFeature[] = ((features || []) as any[])
      .filter((f) => !enabledFeatureIds.has(f.id))
      .map((feature) => ({
        ...feature,
        relevanceScore: (feature.adoption_rate * 0.6 + feature.average_rating * 0.4) / 100,
        reason: `Highly adopted (${feature.adoption_rate.toFixed(1)}%) with ${feature.average_rating.toFixed(1)}/5 rating`,
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    return {
      features: recommended,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching recommended features:', error);
    throw error;
  }
}

/**
 * Get feature details with all related information
 */
export async function getFeatureDetails(
  featureId: string,
  businessId: string,
): Promise<(MarketplaceFeature & { stats?: RatingStats; usage?: FeatureUsage }) | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: feature, error } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (error) throw error;

    // Get rating stats
    const stats = await getFeatureRatingStats(featureId);

    // Get user's usage
    const usage = await getUserFeatureUsage(businessId, [featureId]);

    return {
      ...feature,
      stats,
      usage: usage[featureId],
    };
  } catch (error) {
    console.error('Error fetching feature details:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// RATING & REVIEW OPERATIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get or create a rating for a feature by a business
 */
export async function setFeatureRating(
  featureId: string,
  businessId: string,
  ratingValue: 1 | 2 | 3 | 4 | 5,
): Promise<FeatureRating> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Check if rating exists
    const { data: existing } = await supabase
      .from('feature_ratings')
      .select('id')
      .eq('feature_id', featureId)
      .eq('business_id', businessId)
      .single();

    if (existing) {
      // Update existing rating
      const { data, error } = await supabase
        .from('feature_ratings')
        .update({ rating_value: ratingValue })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new rating
      const { data, error } = await supabase
        .from('feature_ratings')
        .insert([{ feature_id: featureId, business_id: businessId, rating_value: ratingValue }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error setting feature rating:', error);
    throw error;
  }
}

/**
 * Get rating statistics for a feature
 */
export async function getFeatureRatingStats(featureId: string): Promise<RatingStats | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('feature_ratings')
      .select('rating_value')
      .eq('feature_id', featureId);

    if (error) throw error;

    const ratings = data || [];
    if (ratings.length === 0) {
      return {
        averageRating: 0,
        totalRatings: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>;
    let sum = 0;

    for (const rating of ratings) {
      distribution[rating.rating_value as 1 | 2 | 3 | 4 | 5]++;
      sum += rating.rating_value;
    }

    return {
      averageRating: sum / ratings.length,
      totalRatings: ratings.length,
      distribution,
    };
  } catch (error) {
    console.error('Error fetching rating stats:', error);
    throw error;
  }
}

/**
 * Submit or update a review for a feature
 */
export async function submitFeatureReview(
  featureId: string,
  businessId: string,
  reviewText: string,
  useCaseTag: string | null = null,
  wouldRecommend: boolean = true,
): Promise<FeatureReview> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    // Check if review exists
    const { data: existing } = await supabase
      .from('feature_reviews')
      .select('id')
      .eq('feature_id', featureId)
      .eq('business_id', businessId)
      .single();

    if (existing) {
      // Update existing review
      const { data, error } = await supabase
        .from('feature_reviews')
        .update({
          review_text: reviewText,
          use_case_tag: useCaseTag,
          would_recommend: wouldRecommend,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new review
      const { data, error } = await supabase
        .from('feature_reviews')
        .insert([
          {
            feature_id: featureId,
            business_id: businessId,
            review_text: reviewText,
            use_case_tag: useCaseTag,
            would_recommend: wouldRecommend,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error submitting review:', error);
    throw error;
  }
}

/**
 * Get reviews for a feature with pagination
 */
export async function getFeatureReviews(
  featureId: string,
  limit: number = 10,
  offset: number = 0,
): Promise<FeatureReview[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('feature_reviews')
      .select('*')
      .eq('feature_id', featureId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE REQUEST OPERATIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Submit a feature request
 */
export async function submitFeatureRequest(
  businessId: string,
  featureName: string,
  description: string,
  useCase: string | null = null,
  expectedImpact: string | null = null,
): Promise<FeatureRequest> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('feature_requests')
      .insert([
        {
          business_id: businessId,
          feature_name: featureName,
          description,
          use_case: useCase,
          expected_impact: expectedImpact,
          vote_count: 1,
          voter_ids: [businessId],
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting feature request:', error);
    throw error;
  }
}

/**
 * Vote on a feature request
 */
export async function voteOnFeatureRequest(
  requestId: string,
  businessId: string,
): Promise<FeatureRequest> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: request } = await supabase
      .from('feature_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (!request) throw new Error('Request not found');

    const voterIds = request.voter_ids || [];
    const hasVoted = voterIds.includes(businessId);

    if (hasVoted) {
      // Remove vote
      voterIds.splice(voterIds.indexOf(businessId), 1);
    } else {
      // Add vote
      voterIds.push(businessId);
    }

    const { data, error } = await supabase
      .from('feature_requests')
      .update({
        vote_count: voterIds.length,
        voter_ids: voterIds,
      })
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error voting on feature request:', error);
    throw error;
  }
}

/**
 * Get feature requests with optional filtering
 */
export async function getFeatureRequests(
  status?: string,
  limit: number = 20,
  offset: number = 0,
): Promise<FeatureRequest[]> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    let query = supabase.from('feature_requests').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('vote_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feature requests:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE USAGE OPERATIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Enable a feature for a business
 */
export async function enableFeatureForBusiness(
  featureId: string,
  businessId: string,
  config: Record<string, unknown> = {},
): Promise<FeatureUsage> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: existing } = await supabase
      .from('feature_usage')
      .select('id')
      .eq('feature_id', featureId)
      .eq('business_id', businessId)
      .single();

    if (existing) {
      // Update existing usage record
      const { data, error } = await supabase
        .from('feature_usage')
        .update({ is_enabled: true, config })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new usage record
      const { data, error } = await supabase
        .from('feature_usage')
        .insert([
          {
            feature_id: featureId,
            business_id: businessId,
            is_enabled: true,
            config,
            usage_count: 0,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error enabling feature:', error);
    throw error;
  }
}

/**
 * Disable a feature for a business
 */
export async function disableFeatureForBusiness(
  featureId: string,
  businessId: string,
): Promise<FeatureUsage> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data, error } = await supabase
      .from('feature_usage')
      .update({ is_enabled: false })
      .eq('feature_id', featureId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error disabling feature:', error);
    throw error;
  }
}

/**
 * Track feature usage (increment usage count)
 */
export async function trackFeatureUsage(
  featureId: string,
  businessId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data } = await supabase
      .from('feature_usage')
      .select('usage_count')
      .eq('feature_id', featureId)
      .eq('business_id', businessId)
      .single();

    const currentCount = data?.usage_count || 0;

    await supabase
      .from('feature_usage')
      .update({
        usage_count: currentCount + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('feature_id', featureId)
      .eq('business_id', businessId);
  } catch (error) {
    console.error('Error tracking feature usage:', error);
    // Don't throw - usage tracking should not break feature functionality
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Get user's ratings for multiple features (cached lookup)
 */
async function getUserRatings(
  businessId: string,
  featureIds: string[],
): Promise<Record<string, FeatureRating>> {
  if (!supabase || featureIds.length === 0) return {};

  try {
    const { data } = await supabase
      .from('feature_ratings')
      .select('*')
      .eq('business_id', businessId)
      .in('feature_id', featureIds);

    const lookup: Record<string, FeatureRating> = {};
    (data || []).forEach((rating) => {
      lookup[rating.feature_id] = rating;
    });
    return lookup;
  } catch (error) {
    console.error('Error fetching user ratings:', error);
    return {};
  }
}

/**
 * Get user's reviews for multiple features (cached lookup)
 */
async function getUserReviews(
  businessId: string,
  featureIds: string[],
): Promise<Record<string, FeatureReview>> {
  if (!supabase || featureIds.length === 0) return {};

  try {
    const { data } = await supabase
      .from('feature_reviews')
      .select('*')
      .eq('business_id', businessId)
      .in('feature_id', featureIds);

    const lookup: Record<string, FeatureReview> = {};
    (data || []).forEach((review) => {
      lookup[review.feature_id] = review;
    });
    return lookup;
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return {};
  }
}

/**
 * Get user's feature usage for multiple features (cached lookup)
 */
async function getUserFeatureUsage(
  businessId: string,
  featureIds: string[],
): Promise<Record<string, FeatureUsage>> {
  if (!supabase || featureIds.length === 0) return {};

  try {
    const { data } = await supabase
      .from('feature_usage')
      .select('*')
      .eq('business_id', businessId)
      .in('feature_id', featureIds);

    const lookup: Record<string, FeatureUsage> = {};
    (data || []).forEach((usage) => {
      lookup[usage.feature_id] = usage;
    });
    return lookup;
  } catch (error) {
    console.error('Error fetching user feature usage:', error);
    return {};
  }
}

/**
 * Get feature analytics data
 */
export async function getFeatureAnalytics(featureId: string): Promise<FeatureAnalytics | null> {
  if (!supabase) throw new Error('Supabase client not initialized');

  try {
    const { data: feature } = await supabase
      .from('marketplace_features')
      .select('*')
      .eq('id', featureId)
      .single();

    if (!feature) return null;

    const stats = await getFeatureRatingStats(featureId);
    const { data: reviews } = await supabase
      .from('feature_reviews')
      .select('would_recommend, use_case_tag')
      .eq('feature_id', featureId);

    const { data: usage } = await supabase
      .from('feature_usage')
      .select('is_enabled')
      .eq('feature_id', featureId);

    const usageCount = usage?.length || 0;
    const enabledCount = usage?.filter((u) => u.is_enabled).length || 0;
    const adoptionRate = usageCount > 0 ? (enabledCount / usageCount) * 100 : 0;

    // Calculate sentiment
    const recommendations = reviews || [];
    const positive = recommendations.filter((r) => r.would_recommend).length;
    const negative = recommendations.length - positive;

    const useCases = new Map<string, number>();
    recommendations.forEach((r) => {
      if (r.use_case_tag) {
        useCases.set(r.use_case_tag, (useCases.get(r.use_case_tag) || 0) + 1);
      }
    });

    return {
      featureId,
      featureName: feature.feature_name,
      adoptionRate: feature.adoption_rate,
      adoptionTrend: [],
      usageFrequency: [],
      ratingTrend: [],
      sentimentAnalysis: {
        positive,
        neutral: 0,
        negative,
      },
      requestInterest: 0,
      churnRate: 0,
      topUseCases: Array.from(useCases.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  } catch (error) {
    console.error('Error fetching feature analytics:', error);
    throw error;
  }
}

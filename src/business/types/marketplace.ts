/**
 * Feature Marketplace Type Definitions
 * Complete TypeScript interfaces for feature discovery and management system
 */

// ──────────────────────────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────────────────────────

export enum FeatureCategory {
  Automation = 'Automation',
  Analytics = 'Analytics',
  Integrations = 'Integrations',
  CRM = 'CRM',
  Engagement = 'Engagement',
  Administration = 'Administration',
  Mobile = 'Mobile',
  AIFeatures = 'AI Features',
  Communication = 'Communication',
  Other = 'Other',
}

export enum FeatureStatus {
  Available = 'available',
  ComingSoon = 'coming_soon',
  Beta = 'beta',
  Deprecated = 'deprecated',
}

export enum FeatureRequestStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Completed = 'completed',
  Rejected = 'rejected',
  Planned = 'planned',
}

export enum PricingTier {
  Free = 'free',
  Premium = 'premium',
  Enterprise = 'enterprise',
}

export enum AssetType {
  Screenshot = 'screenshot',
  Video = 'video',
  Documentation = 'documentation',
}

// ──────────────────────────────────────────────────────────────────────────────
// MARKETPLACE FEATURE
// ──────────────────────────────────────────────────────────────────────────────

export interface MarketplaceFeature {
  id: string;
  feature_name: string;
  feature_slug: string;
  description: string;
  icon_url: string | null;
  category: FeatureCategory;
  is_available: boolean;
  status: FeatureStatus;
  adoption_rate: number;
  average_rating: number;
  total_reviews: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureCard extends Omit<MarketplaceFeature, 'created_at' | 'updated_at'> {
  isPinned?: boolean;
  isEnabled?: boolean;
  userRating?: number;
  userReviewCount?: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE CATEGORY
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureCategoryRecord {
  id: string;
  category_name: string;
  category_slug: string;
  description: string | null;
  display_order: number;
  icon_name: string | null;
  color_hex: string | null;
  created_at: string;
  updated_at: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// RATING
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureRating {
  id: string;
  feature_id: string;
  business_id: string;
  rating_value: 1 | 2 | 3 | 4 | 5;
  created_at: string;
  updated_at: string;
}

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution: {
    [key in 1 | 2 | 3 | 4 | 5]: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// REVIEW
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureReview {
  id: string;
  feature_id: string;
  business_id: string;
  review_text: string;
  use_case_tag: string | null;
  would_recommend: boolean;
  helpful_count: number;
  unhelpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewWithAuthor extends FeatureReview {
  author_name?: string;
  author_company?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE REQUEST
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureRequest {
  id: string;
  business_id: string;
  feature_name: string;
  description: string;
  use_case: string | null;
  expected_impact: string | null;
  vote_count: number;
  status: FeatureRequestStatus;
  voter_ids: string[];
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface FeatureRequestWithVotedStatus extends FeatureRequest {
  hasVoted: boolean;
  voteCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// FEATURE USAGE
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureUsage {
  id: string;
  feature_id: string;
  business_id: string;
  is_enabled: boolean;
  usage_count: number;
  last_used_at: string | null;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UsageData {
  isEnabled: boolean;
  usageCount: number;
  lastUsed: Date | null;
  firstEnabled: Date;
  daysSinceLastUse: number | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// PRICING
// ──────────────────────────────────────────────────────────────────────────────

export interface FeaturePricing {
  id: string;
  feature_id: string;
  pricing_tier: PricingTier;
  price_per_month: number;
  features_included: string[];
  description: string | null;
  created_at: string;
}

export interface PricingInfo {
  tier: PricingTier;
  price: number;
  features: string[];
  description: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// ASSETS
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureAsset {
  id: string;
  feature_id: string;
  asset_type: AssetType;
  asset_url: string;
  display_order: number;
  created_at: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// SEARCH & FILTERING
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureBrowseFilters {
  categories?: FeatureCategory[];
  statuses?: FeatureStatus[];
  minRating?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: 'newest' | 'trending' | 'highest_rated' | 'most_adopted';
  pageSize?: number;
  page?: number;
}

export interface FeatureSearchResult {
  features: FeatureCard[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ──────────────────────────────────────────────────────────────────────────────

export interface FeatureAnalytics {
  featureId: string;
  featureName: string;
  adoptionRate: number;
  adoptionTrend: {
    date: string;
    rate: number;
  }[];
  usageFrequency: {
    date: string;
    count: number;
  }[];
  ratingTrend: {
    date: string;
    rating: number;
  }[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
  requestInterest: number;
  churnRate: number;
  topUseCases: {
    tag: string;
    count: number;
  }[];
  comparisonMetrics?: {
    categoryAverage: number;
    rank: number;
    totalInCategory: number;
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// RECOMMENDATIONS
// ──────────────────────────────────────────────────────────────────────────────

export interface RecommendedFeature extends FeatureCard {
  relevanceScore: number;
  reason: string;
  adoptionInIndustry: number;
}

export interface FeatureRecommendations {
  features: RecommendedFeature[];
  generatedAt: string;
  businessType?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// ADMIN OPERATIONS
// ──────────────────────────────────────────────────────────────────────────────

export interface CreateFeatureInput {
  feature_name: string;
  feature_slug: string;
  description: string;
  icon_url?: string;
  category: FeatureCategory;
  status: FeatureStatus;
}

export interface UpdateFeatureInput {
  feature_name?: string;
  description?: string;
  icon_url?: string;
  category?: FeatureCategory;
  status?: FeatureStatus;
  is_available?: boolean;
}

// ──────────────────────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ──────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  error?: string;
}

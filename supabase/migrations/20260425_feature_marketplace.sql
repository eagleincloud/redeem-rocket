-- Feature Marketplace Database Schema
-- Implements feature discovery, rating, review, and request system for Redeem Rocket
-- Created: 2026-04-25

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. MARKETPLACE_FEATURES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.marketplace_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic metadata
  feature_name varchar(255) NOT NULL,
  feature_slug varchar(255) UNIQUE NOT NULL,
  description text NOT NULL,
  icon_url varchar(500),

  -- Categorization
  category varchar(100) NOT NULL,
  is_available boolean DEFAULT true,
  status varchar(50) DEFAULT 'available' CHECK (status IN ('available', 'coming_soon', 'beta', 'deprecated')),

  -- Metrics
  adoption_rate numeric(5, 2) DEFAULT 0,
  average_rating numeric(3, 2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  total_ratings integer DEFAULT 0,

  -- Relationships
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT valid_category CHECK (category IN (
    'Automation', 'Analytics', 'Integrations', 'CRM', 'Engagement',
    'Administration', 'Mobile', 'AI Features', 'Communication', 'Other'
  ))
);

CREATE INDEX idx_marketplace_features_category ON public.marketplace_features(category);
CREATE INDEX idx_marketplace_features_status ON public.marketplace_features(status);
CREATE INDEX idx_marketplace_features_adoption_rate ON public.marketplace_features(adoption_rate DESC);
CREATE INDEX idx_marketplace_features_average_rating ON public.marketplace_features(average_rating DESC);
CREATE INDEX idx_marketplace_features_feature_slug ON public.marketplace_features(feature_slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. FEATURE_CATEGORIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Category info
  category_name varchar(100) NOT NULL UNIQUE,
  category_slug varchar(100) UNIQUE NOT NULL,
  description text,

  -- Display
  display_order integer DEFAULT 0,
  icon_name varchar(50),
  color_hex varchar(7),

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feature_categories_slug ON public.feature_categories(category_slug);
CREATE INDEX idx_feature_categories_display_order ON public.feature_categories(display_order);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. FEATURE_RATINGS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Rating
  rating_value integer NOT NULL CHECK (rating_value >= 1 AND rating_value <= 5),

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Enforce one rating per business per feature
  UNIQUE(feature_id, business_id)
);

CREATE INDEX idx_feature_ratings_feature_id ON public.feature_ratings(feature_id);
CREATE INDEX idx_feature_ratings_business_id ON public.feature_ratings(business_id);
CREATE INDEX idx_feature_ratings_rating_value ON public.feature_ratings(rating_value);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. FEATURE_REVIEWS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Review content
  review_text text NOT NULL,
  use_case_tag varchar(100),
  would_recommend boolean DEFAULT false,

  -- Engagement
  helpful_count integer DEFAULT 0,
  unhelpful_count integer DEFAULT 0,

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One main review per business per feature
  UNIQUE(feature_id, business_id)
);

CREATE INDEX idx_feature_reviews_feature_id ON public.feature_reviews(feature_id);
CREATE INDEX idx_feature_reviews_business_id ON public.feature_reviews(business_id);
CREATE INDEX idx_feature_reviews_would_recommend ON public.feature_reviews(would_recommend);
CREATE INDEX idx_feature_reviews_use_case_tag ON public.feature_reviews(use_case_tag);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. FEATURE_REQUESTS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Requestor
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Request details
  feature_name varchar(255) NOT NULL,
  description text NOT NULL,
  use_case text,
  expected_impact varchar(100),

  -- Engagement
  vote_count integer DEFAULT 1,
  status varchar(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'rejected', 'planned')),

  -- Votes tracking (denormalized for performance)
  voter_ids uuid[] DEFAULT '{}',

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_feature_requests_business_id ON public.feature_requests(business_id);
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX idx_feature_requests_vote_count ON public.feature_requests(vote_count DESC);
CREATE INDEX idx_feature_requests_created_at ON public.feature_requests(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. FEATURE_USAGE TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Usage tracking
  is_enabled boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  last_used_at timestamptz,

  -- Configuration
  config jsonb DEFAULT '{}',

  -- Audit
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- One feature usage record per business
  UNIQUE(feature_id, business_id)
);

CREATE INDEX idx_feature_usage_business_id ON public.feature_usage(business_id);
CREATE INDEX idx_feature_usage_feature_id ON public.feature_usage(feature_id);
CREATE INDEX idx_feature_usage_is_enabled ON public.feature_usage(is_enabled);
CREATE INDEX idx_feature_usage_last_used_at ON public.feature_usage(last_used_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. FEATURE_PRICING TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,

  -- Pricing tier
  pricing_tier varchar(50) NOT NULL DEFAULT 'free' CHECK (pricing_tier IN ('free', 'premium', 'enterprise')),
  price_per_month numeric(10, 2) DEFAULT 0,

  -- Features included
  features_included jsonb DEFAULT '[]',
  description text,

  -- Audit
  created_at timestamptz DEFAULT now(),

  -- One pricing record per feature per tier
  UNIQUE(feature_id, pricing_tier)
);

CREATE INDEX idx_feature_pricing_feature_id ON public.feature_pricing(feature_id);
CREATE INDEX idx_feature_pricing_pricing_tier ON public.feature_pricing(pricing_tier);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. FEATURE_ASSETS TABLE
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feature_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,

  -- Asset info
  asset_type varchar(50) NOT NULL CHECK (asset_type IN ('screenshot', 'video', 'documentation')),
  asset_url varchar(500) NOT NULL,
  display_order integer DEFAULT 0,

  -- Metadata
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_feature_assets_feature_id ON public.feature_assets(feature_id);
CREATE INDEX idx_feature_assets_asset_type ON public.feature_assets(asset_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on all tables
ALTER TABLE public.marketplace_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_assets ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- MARKETPLACE_FEATURES RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Everyone can view available features
CREATE POLICY "view_available_features" ON public.marketplace_features
  FOR SELECT
  USING (is_available = true);

-- Admin can manage all features
CREATE POLICY "admin_manage_features" ON public.marketplace_features
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_CATEGORIES RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Everyone can view categories
CREATE POLICY "view_all_categories" ON public.feature_categories
  FOR SELECT
  USING (true);

-- Admin can manage categories
CREATE POLICY "admin_manage_categories" ON public.feature_categories
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_RATINGS RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can view all ratings
CREATE POLICY "view_all_ratings" ON public.feature_ratings
  FOR SELECT
  USING (true);

-- Users can insert their own ratings
CREATE POLICY "insert_own_rating" ON public.feature_ratings
  FOR INSERT
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Users can update their own ratings
CREATE POLICY "update_own_rating" ON public.feature_ratings
  FOR UPDATE
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_REVIEWS RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can view all reviews
CREATE POLICY "view_all_reviews" ON public.feature_reviews
  FOR SELECT
  USING (true);

-- Users can insert their own reviews
CREATE POLICY "insert_own_review" ON public.feature_reviews
  FOR INSERT
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Users can update their own reviews
CREATE POLICY "update_own_review" ON public.feature_reviews
  FOR UPDATE
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_REQUESTS RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can view all requests
CREATE POLICY "view_all_requests" ON public.feature_requests
  FOR SELECT
  USING (true);

-- Users can insert requests for their own business
CREATE POLICY "insert_own_request" ON public.feature_requests
  FOR INSERT
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Users can update their own requests (vote)
CREATE POLICY "update_own_request" ON public.feature_requests
  FOR UPDATE
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()) OR
         auth.uid() IN (SELECT user_id FROM public.admin_users))
  WITH CHECK (true);

-- Admin can update any request
CREATE POLICY "admin_update_request" ON public.feature_requests
  FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_USAGE RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Users can view their own feature usage
CREATE POLICY "view_own_usage" ON public.feature_usage
  FOR SELECT
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Users can insert/update their own feature usage
CREATE POLICY "manage_own_usage" ON public.feature_usage
  FOR ALL
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()))
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Admin can view all usage
CREATE POLICY "admin_view_all_usage" ON public.feature_usage
  FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_PRICING RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Everyone can view pricing
CREATE POLICY "view_all_pricing" ON public.feature_pricing
  FOR SELECT
  USING (true);

-- Admin can manage pricing
CREATE POLICY "admin_manage_pricing" ON public.feature_pricing
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- FEATURE_ASSETS RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- Everyone can view assets
CREATE POLICY "view_all_assets" ON public.feature_assets
  FOR SELECT
  USING (true);

-- Admin can manage assets
CREATE POLICY "admin_manage_assets" ON public.feature_assets
  FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA - 40+ FEATURES
-- ─────────────────────────────────────────────────────────────────────────────

-- Insert feature categories
INSERT INTO public.feature_categories (category_name, category_slug, description, display_order, color_hex) VALUES
('Automation', 'automation', 'Automate repetitive tasks and workflows', 1, '#FF6B6B'),
('Analytics', 'analytics', 'Track metrics and gain insights', 2, '#4ECDC4'),
('Integrations', 'integrations', 'Connect with third-party tools', 3, '#45B7D1'),
('CRM', 'crm', 'Manage customer relationships', 4, '#96CEB4'),
('Engagement', 'engagement', 'Connect with customers', 5, '#FFEAA7'),
('Administration', 'administration', 'Manage users and permissions', 6, '#DDA0DD'),
('Mobile', 'mobile', 'Mobile app features', 7, '#98D8C8'),
('AI Features', 'ai-features', 'AI-powered functionality', 8, '#F7DC6F'),
('Communication', 'communication', 'Team and customer communication', 9, '#85C1E2'),
('Other', 'other', 'Additional features', 10, '#D3D3D3')
ON CONFLICT DO NOTHING;

-- Insert features (40+ features across all categories)
INSERT INTO public.marketplace_features (feature_name, feature_slug, description, icon_url, category, status, adoption_rate, average_rating, total_reviews, total_ratings) VALUES
-- Automation (5 features)
('Workflow Automation', 'workflow-automation', 'Create custom workflows without code', 'zap', 'Automation', 'available', 85.5, 4.6, 245, 312),
('Email Sequences', 'email-sequences', 'Set up automated email campaigns', 'mail', 'Automation', 'available', 72.3, 4.4, 189, 278),
('Lead Assignment', 'lead-assignment', 'Automatically assign leads to team members', 'user-plus', 'Automation', 'available', 65.2, 4.3, 142, 198),
('Task Creation', 'task-creation', 'Auto-create tasks based on triggers', 'check-square', 'Automation', 'available', 58.9, 4.2, 123, 167),
('Webhook Automation', 'webhook-automation', 'Connect with external services via webhooks', 'link', 'Automation', 'beta', 34.5, 4.1, 89, 112),

-- Analytics (5 features)
('Sales Analytics', 'sales-analytics', 'Analyze sales performance metrics', 'bar-chart-2', 'Analytics', 'available', 78.6, 4.5, 267, 334),
('Customer Analytics', 'customer-analytics', 'Understand customer behavior patterns', 'users', 'Analytics', 'available', 71.2, 4.4, 201, 289),
('Performance Metrics', 'performance-metrics', 'Track team and individual performance', 'activity', 'Analytics', 'available', 68.9, 4.3, 178, 245),
('Predictive Analytics', 'predictive-analytics', 'AI-powered sales forecasting', 'trending-up', 'Analytics', 'beta', 42.3, 4.5, 112, 156),
('Custom Reports', 'custom-reports', 'Build your own analytical reports', 'pie-chart', 'Analytics', 'available', 54.7, 4.2, 134, 187),

-- CRM (5 features)
('Lead Management', 'lead-management', 'Organize and track leads effectively', 'inbox', 'CRM', 'available', 92.1, 4.7, 356, 412),
('Contact Management', 'contact-management', 'Manage all customer information', 'book', 'CRM', 'available', 88.5, 4.6, 298, 351),
('Deal Tracking', 'deal-tracking', 'Track sales opportunities through pipeline', 'briefcase', 'CRM', 'available', 85.3, 4.6, 267, 312),
('Customer Timeline', 'customer-timeline', 'See complete interaction history', 'clock', 'CRM', 'available', 62.1, 4.3, 156, 212),
('Relationship Insights', 'relationship-insights', 'AI-powered customer insights', 'brain', 'CRM', 'beta', 48.5, 4.4, 123, 178),

-- Communication (5 features)
('Email Campaigns', 'email-campaigns', 'Send bulk email campaigns', 'send', 'Communication', 'available', 76.4, 4.4, 234, 289),
('SMS Campaigns', 'sms-campaigns', 'Send SMS messages to customers', 'message-circle', 'Communication', 'available', 58.2, 4.3, 145, 198),
('In-App Messaging', 'in-app-messaging', 'Send targeted in-app messages', 'message-square', 'Communication', 'beta', 31.7, 4.2, 78, 101),
('Customer Feedback', 'customer-feedback', 'Collect customer feedback and surveys', 'thumbs-up', 'Communication', 'available', 52.3, 4.2, 123, 167),
('Notification Center', 'notification-center', 'Centralized notification management', 'bell', 'Communication', 'available', 67.8, 4.4, 189, 245),

-- Integrations (5 features)
('Slack Integration', 'slack-integration', 'Get Redeem Rocket notifications in Slack', 'slack', 'Integrations', 'available', 61.2, 4.4, 178, 234),
('Calendar Integration', 'calendar-integration', 'Sync with Google Calendar or Outlook', 'calendar', 'Integrations', 'available', 55.6, 4.3, 134, 178),
('Payment Processing', 'payment-processing', 'Accept payments through multiple gateways', 'credit-card', 'Integrations', 'available', 73.4, 4.5, 212, 267),
('Accounting Software', 'accounting-software', 'Sync with QuickBooks, FreshBooks, etc.', 'dollar-sign', 'Integrations', 'available', 48.9, 4.2, 112, 156),
('Third-party APIs', 'third-party-apis', 'Connect any third-party API', 'git', 'Integrations', 'beta', 28.3, 4.1, 67, 89),

-- Administration (5 features)
('User Management', 'user-management', 'Create and manage user accounts', 'users', 'Administration', 'available', 95.2, 4.7, 389, 445),
('Role-Based Permissions', 'role-based-permissions', 'Define custom roles and permissions', 'lock', 'Administration', 'available', 89.6, 4.6, 312, 367),
('Audit Logs', 'audit-logs', 'Track all user actions and changes', 'eye', 'Administration', 'available', 71.3, 4.4, 201, 267),
('Data Export', 'data-export', 'Export data in multiple formats', 'download', 'Administration', 'available', 64.8, 4.3, 167, 223),
('Custom Fields', 'custom-fields', 'Create custom fields for your data', 'plus-square', 'Administration', 'available', 82.1, 4.5, 267, 334),

-- Mobile (3 features)
('Mobile App', 'mobile-app', 'Full-featured native mobile application', 'smartphone', 'Mobile', 'available', 57.4, 4.4, 156, 212),
('Offline Access', 'offline-access', 'Access data without internet connection', 'wifi-off', 'Mobile', 'beta', 22.1, 4.1, 45, 67),
('Push Notifications', 'push-notifications', 'Send push notifications to mobile users', 'bell-off', 'Mobile', 'available', 51.2, 4.3, 123, 167),

-- AI Features (2 features)
('AI Insights', 'ai-insights', 'AI-powered business intelligence', 'zap', 'AI Features', 'beta', 38.7, 4.6, 156, 201),
('AI Recommendations', 'ai-recommendations', 'Smart recommendations powered by ML', 'lightbulb', 'AI Features', 'beta', 35.2, 4.5, 134, 178)
ON CONFLICT DO NOTHING;

-- Insert feature categories to associate with features (for search/display)
-- This provides category information for the marketplace

-- Add pricing information for features
INSERT INTO public.feature_pricing (feature_id, pricing_tier, price_per_month, features_included, description) VALUES
-- Base pricing for all features
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'workflow-automation'), 'free', 0, '["Basic workflows", "Up to 5 automations"]', 'Perfect for getting started'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'workflow-automation'), 'premium', 49, '["Unlimited workflows", "Advanced triggers", "Priority support"]', 'For growing teams'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'email-sequences'), 'free', 0, '["Basic sequences", "Up to 1000 contacts"]', 'Send automated emails'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'email-sequences'), 'premium', 39, '["Unlimited sequences", "A/B testing", "Analytics"]', 'Advanced email marketing'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'sales-analytics'), 'free', 0, '["Basic metrics", "Standard reports"]', 'Core analytics'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'sales-analytics'), 'premium', 79, '["Advanced analytics", "Custom dashboards", "Data export"]', 'Enterprise analytics'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'lead-management'), 'free', 0, '["Basic lead tracking", "Manual entry"]', 'Essential CRM'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'lead-management'), 'premium', 99, '["Lead scoring", "AI assignment", "Bulk import"]', 'Advanced lead management'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'mobile-app'), 'premium', 29, '["Full mobile access", "Offline mode", "Real-time sync"]', 'On the go access'),
((SELECT id FROM public.marketplace_features WHERE feature_slug = 'payment-processing'), 'premium', 0, '["Accept payments", "Multiple gateways"]', 'Free payment integration')
ON CONFLICT DO NOTHING;

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE 'Feature Marketplace schema created successfully at %', NOW();
END $$;

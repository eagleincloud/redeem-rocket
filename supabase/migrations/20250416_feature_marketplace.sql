-- Feature Marketplace Tables

-- 1. Features Catalog
CREATE TABLE IF NOT EXISTS features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  category TEXT NOT NULL, -- 'sales', 'operations', 'marketing', 'customer_service', 'automation'
  icon TEXT, -- emoji or icon name
  
  -- Requirements & Dependencies
  dependencies JSONB DEFAULT '[]'::jsonb, -- [{"feature_id": "...", "name": "..."}]
  min_plan TEXT DEFAULT 'starter', -- 'starter', 'growth', 'enterprise'
  
  -- Pricing
  base_price_monthly NUMERIC DEFAULT 0,
  additional_seats_price NUMERIC DEFAULT 0,
  
  -- Business Type Relevance (0-100 percentage)
  relevant_for JSONB DEFAULT '{}'::jsonb, -- {"ecommerce": 95, "services": 20, "marketplace": 80, "b2b": 40}
  
  -- Implementation Status
  status TEXT DEFAULT 'active', -- 'active', 'beta', 'deprecated', 'coming_soon', 'development'
  version TEXT DEFAULT '1.0.0',
  
  -- Components included in this feature
  components JSONB DEFAULT '[]'::jsonb, -- ["ProductCatalog.tsx", "BookingSystem.tsx"]
  
  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Business Owner Selected Features
CREATE TABLE IF NOT EXISTS business_owner_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT NOT NULL,
  feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  
  -- How it was added
  enabled_by TEXT NOT NULL, -- 'owner_selected', 'template', 'feature_request_approved', 'admin'
  enabled_by_user_id UUID,
  enabled_at TIMESTAMPTZ DEFAULT now(),
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'archived'
  
  -- Custom configuration per business
  config JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT business_id_fk FOREIGN KEY (business_id) REFERENCES biz_users(business_id),
  UNIQUE(business_id, feature_id)
);

-- 3. Feature Categories
CREATE TABLE IF NOT EXISTS feature_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  display_order INT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Templates
CREATE TABLE IF NOT EXISTS feature_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Business Type & Industry
  business_type TEXT NOT NULL, -- 'ecommerce', 'services', 'marketplace', 'b2b'
  industry TEXT, -- 'fashion', 'restaurant', 'consulting', 'technology'
  
  -- Features included
  included_features JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["feature_id_1", "feature_id_2"]
  included_pages JSONB DEFAULT '[]'::jsonb, -- ["storefront", "admin_dashboard"]
  
  -- Design
  color_scheme TEXT DEFAULT 'modern_blue',
  layout_style TEXT DEFAULT 'grid',
  
  -- Pricing
  total_monthly_price NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'draft', 'archived'
  display_order INT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Feature Requests (for new feature development)
CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id TEXT NOT NULL,
  business_owner_id UUID,
  
  -- Request Details
  requested_feature_name TEXT NOT NULL,
  description TEXT NOT NULL,
  use_case TEXT,
  
  -- Business Context
  business_type TEXT,
  estimated_users INT,
  
  -- Pipeline Status
  status TEXT DEFAULT 'submitted', -- 'submitted', 'in_review', 'ai_development', 'admin_testing', 'approved', 'deployed', 'rejected'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- AI Generation
  ai_development_started_at TIMESTAMPTZ,
  ai_development_completed_at TIMESTAMPTZ,
  ai_generated_code JSONB,
  ai_notes TEXT,
  ai_model_used TEXT DEFAULT 'claude-opus',
  
  -- Admin Review
  admin_review_started_at TIMESTAMPTZ,
  admin_approval_at TIMESTAMPTZ,
  approved_by_admin_id UUID,
  admin_notes TEXT,
  admin_testing_status TEXT, -- 'not_started', 'in_progress', 'passed', 'needs_fixes'
  admin_testing_notes TEXT,
  
  -- Feature Deployment
  make_available_to_all_businesses BOOLEAN DEFAULT false,
  rollout_percentage INT DEFAULT 0,
  deployed_to_owner_at TIMESTAMPTZ,
  
  -- Tracking
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT business_id_fk FOREIGN KEY (business_id) REFERENCES biz_users(business_id)
);

-- 6. Update biz_users table with new columns
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS business_type TEXT; -- 'ecommerce', 'services', 'marketplace', 'b2b'
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS selected_template_id UUID;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS theme_config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS custom_pricing_override NUMERIC;
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS monthly_billing_amount NUMERIC DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_business_owner_features_business ON business_owner_features(business_id);
CREATE INDEX IF NOT EXISTS idx_business_owner_features_feature ON business_owner_features(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_business ON feature_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_templates_business_type ON feature_templates(business_type);

-- RLS Policies
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_owner_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view active features
CREATE POLICY "View active features" ON features
  FOR SELECT USING (status IN ('active', 'beta'));

-- Allow business owners to manage their own feature selections
CREATE POLICY "Manage own features" ON business_owner_features
  FOR ALL USING (
    business_id = (SELECT business_id FROM biz_users WHERE id = auth.uid())
  );

-- Allow business owners to submit feature requests
CREATE POLICY "Submit feature requests" ON feature_requests
  FOR INSERT WITH CHECK (
    business_id = (SELECT business_id FROM biz_users WHERE id = auth.uid())
  );

-- Allow business owners to view their own requests
CREATE POLICY "View own feature requests" ON feature_requests
  FOR SELECT USING (
    business_id = (SELECT business_id FROM biz_users WHERE id = auth.uid())
  );


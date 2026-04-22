-- Growth Platform: Social Media & Lead Connectors
-- Comprehensive schema for multi-channel presence and lead ingestion

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- SOCIAL MEDIA TABLES
-- ========================================

CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok')),
  account_handle TEXT NOT NULL,
  account_name TEXT,
  profile_image_url TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  follower_count INTEGER DEFAULT 0,
  engagement_rate NUMERIC(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  connected_at TIMESTAMPTZ DEFAULT now(),
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, platform, account_handle)
);

CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'instagram', 'tiktok')),
  content TEXT NOT NULL,
  media_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  platform_post_id TEXT UNIQUE,
  engagement_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_engagement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('like', 'comment', 'share', 'mention', 'reply')),
  user_handle TEXT,
  user_name TEXT,
  user_avatar_url TEXT,
  engagement_content TEXT,
  engagement_url TEXT,
  platform TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS social_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  social_account_id UUID REFERENCES social_accounts(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('followers', 'reach', 'engagement', 'impressions', 'engagement_rate', 'growth_rate')),
  metric_value NUMERIC NOT NULL,
  platform TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_connectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  connector_type TEXT NOT NULL CHECK (connector_type IN ('webhook', 'ivr', 'database', 'form', 'api', 'email', 'sms')),
  name TEXT NOT NULL,
  description TEXT,
  config_json JSONB NOT NULL DEFAULT '{}'::JSONB,
  webhook_url TEXT UNIQUE,
  webhook_secret TEXT,
  api_key TEXT,
  is_active BOOLEAN DEFAULT true,
  lead_count INTEGER DEFAULT 0,
  last_received_at TIMESTAMPTZ,
  rate_limit INTEGER DEFAULT 1000,
  rate_limit_window_seconds INTEGER DEFAULT 3600,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS connector_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connector_id UUID NOT NULL REFERENCES lead_connectors(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning', 'rate_limited')),
  message TEXT,
  request_payload JSONB,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  indexed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_source_attribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  connector_id UUID REFERENCES lead_connectors(id) ON DELETE SET NULL,
  social_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================
-- DATABASE FUNCTIONS
-- ========================================

CREATE OR REPLACE FUNCTION ingest_lead(
  p_business_id UUID,
  p_connector_id UUID,
  p_lead_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_lead_id UUID;
BEGIN
  INSERT INTO leads (
    business_id,
    first_name,
    last_name,
    email,
    phone,
    company_name,
    source,
    status,
    metadata,
    created_at,
    updated_at
  ) VALUES (
    p_business_id,
    p_lead_data->>'first_name',
    p_lead_data->>'last_name',
    p_lead_data->>'email',
    p_lead_data->>'phone',
    p_lead_data->>'company_name',
    'connector',
    'new',
    p_lead_data,
    now(),
    now()
  ) RETURNING id INTO v_lead_id;

  INSERT INTO lead_source_attribution (lead_id, business_id, connector_id, source_type, source_data, created_at)
  VALUES (v_lead_id, p_business_id, p_connector_id, 'connector', p_lead_data, now());

  UPDATE lead_connectors
  SET lead_count = lead_count + 1,
      last_received_at = now(),
      updated_at = now()
  WHERE id = p_connector_id;

  RETURN v_lead_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE connector_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_source_attribution ENABLE ROW LEVEL SECURITY;

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX idx_social_accounts_business_id ON social_accounts(business_id);
CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
CREATE INDEX idx_social_posts_business_id ON social_posts(business_id);
CREATE INDEX idx_social_posts_published_at ON social_posts(published_at);
CREATE INDEX idx_social_engagement_post_id ON social_engagement(post_id);
CREATE INDEX idx_social_analytics_business_id ON social_analytics(business_id);
CREATE INDEX idx_lead_connectors_business_id ON lead_connectors(business_id);
CREATE INDEX idx_connector_logs_connector_id ON connector_logs(connector_id);
CREATE INDEX idx_lead_source_attribution_lead_id ON lead_source_attribution(lead_id);

-- AI-Powered Business Theme Storage
-- Stores personalized themes generated during onboarding
-- Created: 2026-04-26

-- ═══════════════════════════════════════════════════════════════════════════
-- BUSINESS THEMES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS business_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL UNIQUE REFERENCES biz_users(id) ON DELETE CASCADE,

  -- Complete theme configuration
  theme_config jsonb NOT NULL DEFAULT '{
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "accentColor": "#06B6D4",
    "backgroundColor": "#FFFFFF",
    "textColor": "#1F2937",
    "borderColor": "#E5E7EB",
    "successColor": "#10B981",
    "warningColor": "#F59E0B",
    "errorColor": "#EF4444",
    "infoColor": "#3B82F6",
    "layout": "data-heavy",
    "fontFamily": "modern",
    "borderRadius": "rounded",
    "shadowIntensity": "medium",
    "spacing": "comfortable"
  }',

  -- Original onboarding answers used to generate theme
  onboarding_answers jsonb DEFAULT '{}',

  -- AI theme generation metadata
  ai_generated boolean DEFAULT true,
  ai_model varchar(100) DEFAULT 'claude-3-5-sonnet',
  ai_confidence numeric(3, 2) DEFAULT 0,
  ai_rationale text,
  ai_recommendations jsonb DEFAULT '[]',

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  ai_generated_at timestamptz
);

-- ═══════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_business_themes_business_id ON business_themes(business_id);
CREATE INDEX idx_business_themes_created_at ON business_themes(created_at DESC);
CREATE INDEX idx_business_themes_ai_generated ON business_themes(ai_generated);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE business_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own business's theme
CREATE POLICY "Users can view own business theme"
  ON business_themes
  FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM biz_users
      WHERE owner_id = auth.uid() OR id IN (
        SELECT business_id FROM team_members
        WHERE member_id = auth.uid()
      )
    )
  );

-- Policy: Users can update their own business's theme
CREATE POLICY "Users can update own business theme"
  ON business_themes
  FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM biz_users
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    business_id IN (
      SELECT id FROM biz_users
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can insert theme for their own business
CREATE POLICY "Users can insert theme for own business"
  ON business_themes
  FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM biz_users
      WHERE owner_id = auth.uid()
    )
  );

-- Policy: Users can delete their own business's theme
CREATE POLICY "Users can delete own business theme"
  ON business_themes
  FOR DELETE
  USING (
    business_id IN (
      SELECT id FROM biz_users
      WHERE owner_id = auth.uid()
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_business_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_business_themes_updated_at
  BEFORE UPDATE ON business_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_business_themes_updated_at();

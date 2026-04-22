-- Add Smart Onboarding and Theme Management columns to biz_users table
-- This migration adds support for feature preferences, theme customization, and onboarding tracking

-- 1. Add feature_preferences column (JSONB)
-- Tracks which features are enabled for each business
ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS feature_preferences jsonb DEFAULT NULL;

-- 2. Add theme_preference column (JSONB)
-- Stores business branding and theme settings
ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS theme_preference jsonb DEFAULT NULL;

-- 3. Add onboarding_status column
-- Tracks onboarding lifecycle: pending, in_progress, completed
ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS onboarding_status text
  DEFAULT 'pending'
  CHECK (onboarding_status IN ('pending', 'in_progress', 'completed'));

-- 4. Add onboarding_phase column
-- Tracks which phase (0-6) the business is currently in
ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS onboarding_phase integer DEFAULT 0 CHECK (onboarding_phase >= 0 AND onboarding_phase <= 6);

-- 5. Create indexes for query performance
CREATE INDEX IF NOT EXISTS biz_users_onboarding_status_idx ON public.biz_users(onboarding_status);
CREATE INDEX IF NOT EXISTS biz_users_onboarding_phase_idx ON public.biz_users(onboarding_phase);

-- 6. Add comments for documentation
COMMENT ON COLUMN public.biz_users.feature_preferences IS 'JSON object tracking which features are enabled for this business (e.g., {basicAnalytics: true, advancedAnalytics: false})';
COMMENT ON COLUMN public.biz_users.theme_preference IS 'JSON object for theme customization (e.g., {primaryColor: "#f97316", secondaryColor: "#6366f1", layout: "grid", fontStyle: "sans"})';
COMMENT ON COLUMN public.biz_users.onboarding_status IS 'Tracks onboarding lifecycle: pending (not started), in_progress (actively onboarding), completed (onboarding finished)';
COMMENT ON COLUMN public.biz_users.onboarding_phase IS 'Current onboarding phase number (0-6), used to resume onboarding from where user left off';

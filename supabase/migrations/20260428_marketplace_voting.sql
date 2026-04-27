-- Feature Marketplace Voting System
-- Adds feature voting, feature votes tracking, and trending features
-- Created: 2026-04-28

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. FEATURE_VOTES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
-- Tracks which users have voted for which features
-- Ensures one vote per user per feature

CREATE TABLE IF NOT EXISTS public.feature_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  feature_id uuid NOT NULL REFERENCES public.marketplace_features(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.biz_users(id) ON DELETE CASCADE,

  -- Audit
  created_at timestamptz DEFAULT now(),

  -- Enforce one vote per business per feature
  UNIQUE(feature_id, business_id)
);

CREATE INDEX idx_feature_votes_feature_id ON public.feature_votes(feature_id);
CREATE INDEX idx_feature_votes_business_id ON public.feature_votes(business_id);
CREATE INDEX idx_feature_votes_created_at ON public.feature_votes(created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. UPDATE MARKETPLACE_FEATURES - Add votes_count column if not exists
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.marketplace_features
ADD COLUMN IF NOT EXISTS votes_count integer DEFAULT 0;

ALTER TABLE public.marketplace_features
ADD COLUMN IF NOT EXISTS install_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_marketplace_features_votes_count
  ON public.marketplace_features(votes_count DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_features_install_count
  ON public.marketplace_features(install_count DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ROW-LEVEL SECURITY POLICIES
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on feature_votes
ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;

-- Everyone can view all votes
CREATE POLICY IF NOT EXISTS "view_all_votes" ON public.feature_votes
  FOR SELECT
  USING (true);

-- Users can insert their own votes
CREATE POLICY IF NOT EXISTS "insert_own_vote" ON public.feature_votes
  FOR INSERT
  WITH CHECK (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- Users can delete their own votes
CREATE POLICY IF NOT EXISTS "delete_own_vote" ON public.feature_votes
  FOR DELETE
  USING (business_id = (SELECT id FROM public.biz_users WHERE id = auth.uid()));

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. HELPER FUNCTIONS FOR VOTING
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to get vote count for a feature
CREATE OR REPLACE FUNCTION public.get_feature_vote_count(feature_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM public.feature_votes WHERE feature_id = $1
$$ LANGUAGE sql STABLE;

-- Function to check if user has voted for a feature
CREATE OR REPLACE FUNCTION public.user_has_voted_for_feature(
  feature_id uuid,
  business_id uuid
)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.feature_votes
    WHERE feature_id = $1 AND business_id = $2
  )
$$ LANGUAGE sql STABLE;

-- Function to get trending features (votes + adoption score)
CREATE OR REPLACE FUNCTION public.get_trending_features(
  limit_count int DEFAULT 20,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  feature_id uuid,
  feature_name varchar,
  feature_slug varchar,
  votes_count bigint,
  adoption_rate numeric,
  average_rating numeric,
  trending_score numeric
) AS $$
  SELECT
    mf.id,
    mf.feature_name,
    mf.feature_slug,
    COUNT(fv.id) as votes_count,
    mf.adoption_rate,
    mf.average_rating,
    (COUNT(fv.id)::numeric * 0.6 + mf.adoption_rate * 0.3 + mf.average_rating * 0.1)::numeric as trending_score
  FROM public.marketplace_features mf
  LEFT JOIN public.feature_votes fv ON mf.id = fv.feature_id
  WHERE mf.is_available = true
    AND (category_filter IS NULL OR mf.category = category_filter)
  GROUP BY mf.id, mf.feature_name, mf.feature_slug, mf.adoption_rate, mf.average_rating
  ORDER BY trending_score DESC, votes_count DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- Function to get top voted features
CREATE OR REPLACE FUNCTION public.get_top_voted_features(
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  feature_id uuid,
  feature_name varchar,
  feature_slug varchar,
  votes_count bigint,
  average_rating numeric,
  total_reviews integer
) AS $$
  SELECT
    mf.id,
    mf.feature_name,
    mf.feature_slug,
    COUNT(fv.id) as votes_count,
    mf.average_rating,
    mf.total_reviews
  FROM public.marketplace_features mf
  LEFT JOIN public.feature_votes fv ON mf.id = fv.feature_id
  WHERE mf.is_available = true
  GROUP BY mf.id, mf.feature_name, mf.feature_slug, mf.average_rating, mf.total_reviews
  ORDER BY votes_count DESC
  LIMIT limit_count;
$$ LANGUAGE sql STABLE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. TRIGGERS TO MAINTAIN DENORMALIZED VOTE COUNTS
-- ─────────────────────────────────────────────────────────────────────────────

-- Function to update vote count when vote is added
CREATE OR REPLACE FUNCTION public.increment_feature_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_features
  SET votes_count = (SELECT COUNT(*) FROM public.feature_votes WHERE feature_id = NEW.feature_id)
  WHERE id = NEW.feature_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update vote count when vote is removed
CREATE OR REPLACE FUNCTION public.decrement_feature_votes()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.marketplace_features
  SET votes_count = (SELECT COUNT(*) FROM public.feature_votes WHERE feature_id = OLD.feature_id)
  WHERE id = OLD.feature_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger on INSERT
DROP TRIGGER IF EXISTS feature_votes_increment_trigger ON public.feature_votes;
CREATE TRIGGER feature_votes_increment_trigger
AFTER INSERT ON public.feature_votes
FOR EACH ROW
EXECUTE FUNCTION public.increment_feature_votes();

-- Trigger on DELETE
DROP TRIGGER IF EXISTS feature_votes_decrement_trigger ON public.feature_votes;
CREATE TRIGGER feature_votes_decrement_trigger
AFTER DELETE ON public.feature_votes
FOR EACH ROW
EXECUTE FUNCTION public.decrement_feature_votes();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. MIGRATION LOG
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN
  RAISE NOTICE 'Feature marketplace voting system created successfully at %', NOW();
END $$;

-- ── Team Member Authentication Columns ───────────────────────────────────────
-- Adds password (bcrypt hash) and first_login tracking to team members

ALTER TABLE public.business_team_members
  ADD COLUMN IF NOT EXISTS password      text,
  ADD COLUMN IF NOT EXISTS first_login   boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS password_changed_at timestamptz;

-- ── Product Selection on businesses table ────────────────────────────────────
-- Stores which product(s) the business owner has selected (rr / lms / both)

ALTER TABLE public.biz_users
  ADD COLUMN IF NOT EXISTS product_selection text NOT NULL DEFAULT 'both'
    CHECK (product_selection IN ('rr', 'lms', 'both'));

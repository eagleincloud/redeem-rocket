-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Admin Users Table
-- Creates the admin_users table for platform administrators
-- ─────────────────────────────────────────────────────────────────────────────

-- ── admin_users table ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.admin_users (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  email           text         NOT NULL UNIQUE,
  name            text         NOT NULL,
  role            text         NOT NULL DEFAULT 'admin'
                  CHECK (role IN ('admin', 'super_admin', 'moderator')),
  status          text         NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'inactive', 'suspended')),
  password_hash   text,        -- bcrypt hash of password (optional for OAuth-only admins)
  last_login      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Create indices for common queries
CREATE INDEX IF NOT EXISTS idx_admin_users_email
  ON public.admin_users (email);

CREATE INDEX IF NOT EXISTS idx_admin_users_role
  ON public.admin_users (role);

CREATE INDEX IF NOT EXISTS idx_admin_users_status
  ON public.admin_users (status);

-- ── Enable RLS ───────────────────────────────────────────────────────────────
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS "admin_all" ON public.admin_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Permissive policy - admin app handles authorization via JWT
CREATE POLICY "admin_all" ON public.admin_users
  FOR ALL USING (true) WITH CHECK (true);

-- ── Add to realtime publication ──────────────────────────────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE admin_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

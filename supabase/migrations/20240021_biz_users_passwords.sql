-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Add Password Columns to Biz Users
-- Adds password storage and authentication fields to biz_users table
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Add password columns to biz_users ────────────────────────────────────────
ALTER TABLE public.biz_users
  ADD COLUMN IF NOT EXISTS password_hash    text,
  ADD COLUMN IF NOT EXISTS is_verified      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_password_change timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at       timestamptz NOT NULL DEFAULT now();

-- Create index for verification status (useful for queries like "get unverified users")
CREATE INDEX IF NOT EXISTS idx_biz_users_is_verified
  ON public.biz_users (is_verified);

-- Create index for password change tracking
CREATE INDEX IF NOT EXISTS idx_biz_users_last_password_change
  ON public.biz_users (last_password_change);

-- ── Add trigger to update updated_at on modification ───────────────────────
-- First, check if the trigger function exists
DROP TRIGGER IF EXISTS biz_users_updated_at_trigger ON public.biz_users;

CREATE OR REPLACE FUNCTION public.update_biz_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER biz_users_updated_at_trigger
  BEFORE UPDATE ON public.biz_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_biz_users_updated_at();

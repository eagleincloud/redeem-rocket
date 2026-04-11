-- ── Password Reset Flow Schema ───────────────────────────────────────────────
-- Adds password authentication and reset tracking to biz_users and app_users
-- Safe to re-run (ADD COLUMN IF NOT EXISTS throughout)

-- ── biz_users: add password authentication columns ────────────────────────────
ALTER TABLE public.biz_users
  ADD COLUMN IF NOT EXISTS password_hash    text,
  ADD COLUMN IF NOT EXISTS password_set_at  timestamptz,
  ADD COLUMN IF NOT EXISTS auth_method      text DEFAULT 'otp'
    CHECK (auth_method IN ('otp', 'password', 'google'));

CREATE INDEX IF NOT EXISTS idx_biz_users_auth_method
  ON public.biz_users (auth_method);

-- ── app_users: add password authentication columns ─────────────────────────────
ALTER TABLE public.app_users
  ADD COLUMN IF NOT EXISTS password_hash    text,
  ADD COLUMN IF NOT EXISTS password_set_at  timestamptz,
  ADD COLUMN IF NOT EXISTS auth_method      text DEFAULT 'otp'
    CHECK (auth_method IN ('otp', 'password', 'google'));

CREATE INDEX IF NOT EXISTS idx_app_users_auth_method
  ON public.app_users (auth_method);

-- ── password_reset_tokens: track password reset requests for audit/rate limiting
-- Optional: use if you want to track reset requests separately from OTP
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid        NOT NULL,
  user_table     text        NOT NULL CHECK (user_table IN ('biz_users', 'app_users')),
  email          text        NOT NULL,
  contact_type   text        NOT NULL DEFAULT 'email'
    CHECK (contact_type IN ('email', 'phone')),
  otp_hash       text        NOT NULL,  -- SHA-256 hex of the 6-digit OTP
  expires_at     timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  attempts       int         NOT NULL DEFAULT 0,
  verified_at    timestamptz,
  completed_at   timestamptz,  -- when password was actually reset
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_email
  ON public.password_reset_tokens (email, user_table);
CREATE INDEX IF NOT EXISTS idx_password_reset_user
  ON public.password_reset_tokens (user_id, user_table);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires
  ON public.password_reset_tokens (expires_at)
  WHERE verified_at IS NULL;

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "password_reset_all" ON public.password_reset_tokens;
CREATE POLICY "password_reset_all"
  ON public.password_reset_tokens FOR ALL
  USING (true) WITH CHECK (true);

-- ── Enable realtime for password_reset_tokens (if needed) ─────────────────────
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE password_reset_tokens;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

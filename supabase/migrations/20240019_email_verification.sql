-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Email Verification Schema
-- Adds email verification tracking to app_users and biz_users
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add email verification columns to app_users
ALTER TABLE app_users
ADD COLUMN email_verified boolean DEFAULT false,
ADD COLUMN email_verified_at timestamptz,
ADD COLUMN email_verification_token text UNIQUE;

CREATE INDEX IF NOT EXISTS app_users_email_verified_idx ON app_users (email_verified);
CREATE INDEX IF NOT EXISTS app_users_email_verification_token_idx ON app_users (email_verification_token);

-- 2. Add email verification columns to biz_users
ALTER TABLE biz_users
ADD COLUMN email_verified boolean DEFAULT false,
ADD COLUMN email_verified_at timestamptz,
ADD COLUMN email_verification_token text UNIQUE;

CREATE INDEX IF NOT EXISTS biz_users_email_verified_idx ON biz_users (email_verified);
CREATE INDEX IF NOT EXISTS biz_users_email_verification_token_idx ON biz_users (email_verification_token);

-- 3. Create email verification tokens table for tracking and resend
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_type text NOT NULL CHECK (user_type IN ('app', 'biz')),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '24 hours',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_verification_tokens_user_id_idx ON email_verification_tokens (user_id, user_type);
CREATE INDEX IF NOT EXISTS email_verification_tokens_email_idx ON email_verification_tokens (email);
CREATE INDEX IF NOT EXISTS email_verification_tokens_token_idx ON email_verification_tokens (token);
CREATE INDEX IF NOT EXISTS email_verification_tokens_expires_at_idx ON email_verification_tokens (expires_at);

-- 4. Enable RLS
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_email_verification_tokens" ON email_verification_tokens;

CREATE POLICY "anon_email_verification_tokens"
  ON email_verification_tokens FOR ALL
  USING (true) WITH CHECK (true);

-- 5. Enable realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE email_verification_tokens;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: OTP Authentication Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/eomqkeoozxnttqizstzk/sql/new
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. OTP verifications (TTL: 10 minutes, max 3 attempts)
CREATE TABLE IF NOT EXISTS otp_verifications (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact      text        NOT NULL,           -- phone number or email address
  contact_type text        NOT NULL CHECK (contact_type IN ('phone', 'email')),
  otp_hash     text        NOT NULL,           -- SHA-256 hex of the 6-digit OTP
  expires_at   timestamptz NOT NULL DEFAULT now() + interval '10 minutes',
  attempts     int         NOT NULL DEFAULT 0,
  verified     boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS otp_verifications_contact_idx
  ON otp_verifications (contact, contact_type);

-- 2. App users (customer app)
CREATE TABLE IF NOT EXISTS app_users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text        UNIQUE,
  email       text        UNIQUE,
  name        text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_login  timestamptz
);

CREATE INDEX IF NOT EXISTS app_users_phone_idx ON app_users (phone);
CREATE INDEX IF NOT EXISTS app_users_email_idx ON app_users (email);

-- 3. Biz users (business app)
CREATE TABLE IF NOT EXISTS biz_users (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  phone        text        UNIQUE,
  email        text        UNIQUE,
  name         text,
  business_id  text,       -- references businesses.id (text PK)
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_login   timestamptz
);

CREATE INDEX IF NOT EXISTS biz_users_phone_idx       ON biz_users (phone);
CREATE INDEX IF NOT EXISTS biz_users_email_idx       ON biz_users (email);
CREATE INDEX IF NOT EXISTS biz_users_business_id_idx ON biz_users (business_id);

-- 4. Enable RLS with permissive policies
--    (app uses localStorage auth, not Supabase Auth JWT — auth.uid() is null)
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE biz_users         ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$ BEGIN
  DROP POLICY IF EXISTS "anon_otp"      ON otp_verifications;
  DROP POLICY IF EXISTS "anon_app_user" ON app_users;
  DROP POLICY IF EXISTS "anon_biz_user" ON biz_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "anon_otp"
  ON otp_verifications FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_app_user"
  ON app_users FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "anon_biz_user"
  ON biz_users FOR ALL
  USING (true) WITH CHECK (true);

-- 5. Enable realtime for these tables (safe to re-run)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE otp_verifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE app_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE biz_users;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

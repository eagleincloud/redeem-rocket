-- ── FCM Tokens table ──────────────────────────────────────────────────────────
-- Stores Firebase Cloud Messaging push tokens per user per device.
-- Used by the fcm-send edge function to deliver push notifications.

CREATE TABLE IF NOT EXISTS fcm_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     text NOT NULL,
  user_type   text NOT NULL DEFAULT 'app',   -- 'app' | 'biz'
  token       text NOT NULL,
  platform    text NOT NULL DEFAULT 'web',   -- 'web' | 'android' | 'ios'
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, platform)
);

-- Index for fast look-ups by user_id
CREATE INDEX IF NOT EXISTS fcm_tokens_user_id_idx ON fcm_tokens (user_id);

-- RLS — allow the service role (edge functions) to read/write; anon cannot
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fcm_service_all" ON fcm_tokens;
CREATE POLICY "fcm_service_all" ON fcm_tokens USING (true) WITH CHECK (true);

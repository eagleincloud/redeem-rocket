-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Notification Logs + User Profile phone fields
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. notification_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_logs (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type   text        NOT NULL CHECK (recipient_type IN ('customer','business')),
  recipient_id     text,
  event_type       text        NOT NULL,
  channel          text        NOT NULL CHECK (channel IN ('email','sms','whatsapp','in_app')),
  subject          text,
  body             text,
  status           text        NOT NULL DEFAULT 'sent'
                               CHECK (status IN ('sent','failed','pending')),
  recipient_email  text,
  recipient_phone  text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_logs_recipient_id
  ON notification_logs (recipient_id);

CREATE INDEX IF NOT EXISTS idx_notif_logs_event_type
  ON notification_logs (event_type);

CREATE INDEX IF NOT EXISTS idx_notif_logs_created_at
  ON notification_logs (created_at DESC);

-- RLS: allow inserts from authenticated + anon (service sends on behalf of users)
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_notif_logs"       ON notification_logs;
DROP POLICY IF EXISTS "allow_select_own_notif_logs"   ON notification_logs;

CREATE POLICY "allow_insert_notif_logs"
  ON notification_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_select_own_notif_logs"
  ON notification_logs FOR SELECT
  USING (true);

-- ── 2. in_app_notifications (persistent in-app notification center) ───────────
CREATE TABLE IF NOT EXISTS in_app_notifications (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text        NOT NULL,
  user_type      text        NOT NULL CHECK (user_type IN ('customer','business')),
  event_type     text        NOT NULL,
  title          text        NOT NULL,
  body           text        NOT NULL,
  icon           text        DEFAULT '🔔',
  is_read        boolean     NOT NULL DEFAULT false,
  action_url     text,
  metadata       jsonb,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_user_id
  ON in_app_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_user_unread
  ON in_app_notifications (user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_in_app_notif_created_at
  ON in_app_notifications (created_at DESC);

ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_see_own_in_app_notifs"    ON in_app_notifications;
DROP POLICY IF EXISTS "insert_in_app_notifs"           ON in_app_notifications;
DROP POLICY IF EXISTS "users_update_own_in_app_notifs" ON in_app_notifications;

CREATE POLICY "users_see_own_in_app_notifs"
  ON in_app_notifications FOR SELECT
  USING (true);

CREATE POLICY "insert_in_app_notifs"
  ON in_app_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "users_update_own_in_app_notifs"
  ON in_app_notifications FOR UPDATE
  USING (true) WITH CHECK (true);

-- ── 3. Add phone column to businesses (for business notifications) ─────────────
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS owner_phone text,
  ADD COLUMN IF NOT EXISTS owner_email text;

-- ── 4. user_profiles (stores phone + notification prefs for customers) ────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id               text        PRIMARY KEY,
  phone                 text,
  email                 text,
  notify_email          boolean     NOT NULL DEFAULT true,
  notify_sms            boolean     NOT NULL DEFAULT true,
  notify_whatsapp       boolean     NOT NULL DEFAULT true,
  notify_in_app         boolean     NOT NULL DEFAULT true,
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_own_profile" ON user_profiles;

CREATE POLICY "users_own_profile"
  ON user_profiles FOR ALL
  USING (true) WITH CHECK (true);

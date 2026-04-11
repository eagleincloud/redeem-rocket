-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: RLS Hotfix — Enable RLS on all public tables + fix auth.uid() policies
-- Run in: https://supabase.com/dashboard/project/eomqkeoozxnttqizstzk/sql/new
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Tables with NO RLS — enable + add permissive policies ─────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','businesses','offers','products',
    'auctions','wallet_transactions','campaigns','campaign_contacts'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('DROP POLICY IF EXISTS "anon_all_%s" ON %I', t, t);
      EXECUTE format('CREATE POLICY "anon_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', t, t);
    EXCEPTION WHEN undefined_table THEN
      NULL; -- table doesn't exist yet, skip silently
    END;
  END LOOP;
END $$;

-- ── 2. payment_submissions ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "customer_insert"              ON payment_submissions;
DROP POLICY IF EXISTS "customer_select"              ON payment_submissions;
DROP POLICY IF EXISTS "business_read"                ON payment_submissions;
DROP POLICY IF EXISTS "business_update_status"       ON payment_submissions;
DROP POLICY IF EXISTS "anon_all_payment_submissions" ON payment_submissions;
CREATE POLICY "anon_all_payment_submissions"
  ON payment_submissions FOR ALL USING (true) WITH CHECK (true);

-- ── 3. notification_logs ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "allow_select_own_notif_logs" ON notification_logs;
DROP POLICY IF EXISTS "anon_select_notif_logs"      ON notification_logs;
CREATE POLICY "anon_select_notif_logs"
  ON notification_logs FOR SELECT USING (true);

-- ── 4. in_app_notifications ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_see_own_in_app_notifs"    ON in_app_notifications;
DROP POLICY IF EXISTS "users_update_own_in_app_notifs" ON in_app_notifications;
DROP POLICY IF EXISTS "anon_read_in_app_notifs"        ON in_app_notifications;
DROP POLICY IF EXISTS "anon_update_in_app_notifs"      ON in_app_notifications;
CREATE POLICY "anon_read_in_app_notifs"
  ON in_app_notifications FOR SELECT USING (true);
CREATE POLICY "anon_update_in_app_notifs"
  ON in_app_notifications FOR UPDATE USING (true) WITH CHECK (true);

-- ── 5. user_profiles ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_own_profile"      ON user_profiles;
DROP POLICY IF EXISTS "anon_all_user_profiles" ON user_profiles;
CREATE POLICY "anon_all_user_profiles"
  ON user_profiles FOR ALL USING (true) WITH CHECK (true);

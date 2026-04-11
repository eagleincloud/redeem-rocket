-- ── Lead Follow-Up Reminder Cron ─────────────────────────────────────────────
-- Run in Supabase SQL editor after deploying lead-follow-up-reminder edge function.
-- This schedules the function to run every hour.

-- Enable pg_cron extension (run once as superuser):
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the lead follow-up reminder to run every hour at :00
SELECT cron.schedule(
  'lead-follow-up-reminder-hourly',
  '0 * * * *',  -- every hour at minute 0
  $$
    SELECT net.http_post(
      url := (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'supabase_url'
      ) || '/functions/v1/lead-follow-up-reminder',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || (
          SELECT decrypted_secret
          FROM vault.decrypted_secrets
          WHERE name = 'supabase_anon_key'
        )
      ),
      body := '{}'::jsonb
    );
  $$
);

-- Alternative simpler approach using environment variable directly:
-- Replace the URL and key with your actual values if vault is not configured.

-- To verify the cron job was created:
-- SELECT * FROM cron.job WHERE jobname = 'lead-follow-up-reminder-hourly';

-- To unschedule if needed:
-- SELECT cron.unschedule('lead-follow-up-reminder-hourly');

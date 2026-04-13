/**
 * warmup-advance-day
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs daily at 00:05 IST via pg_cron.
 * For each sender identity with warmup_enabled=true:
 *   - Increments warmup_day
 *   - Recalculates warmup_daily_limit per schedule
 *   - Resets warmup_today_sent = 0
 *
 * pg_cron setup:
 *   SELECT cron.schedule(
 *     'warmup-advance-day',
 *     '35 18 * * *',   -- 00:05 IST = 18:35 UTC
 *     $$SELECT net.http_post(url := '...warmup-advance-day', headers := ..., body := '{}')$$
 *   );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

/** Warmup schedule: returns daily limit for a given warmup day */
function dailyLimit(day: number): number {
  if (day <= 7)   return 50;
  if (day <= 14)  return 150;
  if (day <= 21)  return 500;
  if (day <= 30)  return 2000;
  if (day <= 45)  return 10000;
  return 50000; // fully warmed up
}

serve(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // Load all warmup-enabled sender identities
    const { data: senders, error } = await supabase
      .from('sender_identities')
      .select('id, warmup_day, bounce_rate, spam_rate, warmup_last_reset')
      .eq('warmup_enabled', true);

    if (error) throw error;
    if (!senders || senders.length === 0) {
      return new Response(JSON.stringify({ ok: true, message: 'No warmup senders' }), { status: 200 });
    }

    const updates: Promise<unknown>[] = [];
    const results: { id: string; newDay: number; newLimit: number }[] = [];

    for (const sender of senders) {
      // Skip if already advanced today
      if (sender.warmup_last_reset === today) continue;

      // Pause warmup if bounce or spam rate too high
      if (sender.bounce_rate > 5 || sender.spam_rate > 0.5) {
        console.warn(`[warmup] Sender ${sender.id} paused: bounce=${sender.bounce_rate}% spam=${sender.spam_rate}%`);
        updates.push(
          supabase.from('sender_identities').update({ warmup_enabled: false }).eq('id', sender.id)
        );
        continue;
      }

      const newDay   = (sender.warmup_day ?? 0) + 1;
      const newLimit = dailyLimit(newDay);

      updates.push(
        supabase.from('sender_identities').update({
          warmup_day:        newDay,
          warmup_daily_limit: newLimit,
          warmup_today_sent: 0,
          warmup_last_reset: today,
        }).eq('id', sender.id)
      );

      results.push({ id: sender.id, newDay, newLimit });
    }

    await Promise.all(updates);
    console.log(`[warmup-advance-day] Updated ${results.length} senders`);

    return new Response(JSON.stringify({ ok: true, updated: results }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[warmup-advance-day]', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});

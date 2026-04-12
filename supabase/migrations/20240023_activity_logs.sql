-- ── Activity Logs ─────────────────────────────────────────────────────────────
-- Stores a chronological audit trail for every meaningful action taken by
-- owners and team members on the platform.

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  TEXT        NOT NULL,
  actor_id     TEXT        NOT NULL,          -- biz_users.id or team_member.id
  actor_type   TEXT        NOT NULL           -- 'owner' | 'team_member'
                 CHECK (actor_type IN ('owner', 'team_member')),
  actor_name   TEXT,
  action       TEXT        NOT NULL,          -- e.g. 'login', 'create_product', 'delete_offer'
  entity_type  TEXT,                          -- 'product' | 'offer' | 'lead' | 'campaign' | ...
  entity_id    TEXT,                          -- ID of the affected record
  entity_name  TEXT,                          -- human-readable label (e.g. product name)
  metadata     JSONB       DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_id ON public.activity_logs (business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_id    ON public.activity_logs (actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action      ON public.activity_logs (action);

-- Row-Level Security
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon (service key) to insert logs
CREATE POLICY "activity_logs_insert" ON public.activity_logs
  FOR INSERT WITH CHECK (true);

-- Allow reading logs only for the matching business
CREATE POLICY "activity_logs_select" ON public.activity_logs
  FOR SELECT USING (true);

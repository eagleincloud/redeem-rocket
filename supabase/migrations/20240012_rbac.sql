-- ── business_roles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_roles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  text NOT NULL,
  name         text NOT NULL,  -- e.g. "Sales", "Support", "Manager"
  description  text,
  is_default   boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_roles_business ON public.business_roles (business_id);
ALTER TABLE public.business_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "roles_all" ON public.business_roles;
CREATE POLICY "roles_all" ON public.business_roles FOR ALL USING (true) WITH CHECK (true);

-- ── business_role_permissions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_role_permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id     uuid NOT NULL REFERENCES public.business_roles(id) ON DELETE CASCADE,
  feature     text NOT NULL CHECK (feature IN (
                'leads','campaigns','invoices','analytics',
                'notifications','auctions','requirements','settings','team')),
  level       text NOT NULL CHECK (level IN ('read','readwrite','admin')),
  UNIQUE (role_id, feature)
);
ALTER TABLE public.business_role_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rp_all" ON public.business_role_permissions;
CREATE POLICY "rp_all" ON public.business_role_permissions FOR ALL USING (true) WITH CHECK (true);

-- ── business_team_members ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_team_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  text NOT NULL,
  role_id      uuid REFERENCES public.business_roles(id) ON DELETE SET NULL,
  name         text NOT NULL,
  email        text NOT NULL,
  phone        text,
  -- Override permissions per-member (optional — if null, use role perms)
  permissions  jsonb,  -- { leads: 'read', campaigns: 'readwrite', ... }
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','invited')),
  invited_at   timestamptz DEFAULT now(),
  joined_at    timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_business ON public.business_team_members (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_email ON public.business_team_members (business_id, email);
ALTER TABLE public.business_team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tm_all" ON public.business_team_members;
CREATE POLICY "tm_all" ON public.business_team_members FOR ALL USING (true) WITH CHECK (true);

-- ── member_notification_prefs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_notification_prefs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id    uuid NOT NULL REFERENCES public.business_team_members(id) ON DELETE CASCADE,
  business_id  text NOT NULL,
  event_types  text[] NOT NULL DEFAULT ARRAY['lead_stage_changed','lead_follow_up_reminder','campaign_sent'],
  channels     text[] NOT NULL DEFAULT ARRAY['in_app'],  -- in_app, whatsapp, sms, email
  UNIQUE (member_id)
);
ALTER TABLE public.member_notification_prefs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mnp_all" ON public.member_notification_prefs;
CREATE POLICY "mnp_all" ON public.member_notification_prefs FOR ALL USING (true) WITH CHECK (true);

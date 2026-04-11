-- ── leads ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id               uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      text         NOT NULL,
  name             text         NOT NULL,
  phone            text,
  email            text,
  company          text,
  source_url       text,
  stage            text         NOT NULL DEFAULT 'new'
                   CHECK (stage IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  priority         text         NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','urgent')),
  deal_value       numeric(14,2),
  product_interest text,
  source           text         NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('manual','csv','scrape','campaign','referral','walk_in','website')),
  scraped_biz_id   uuid         REFERENCES public.scraped_businesses(id) ON DELETE SET NULL,
  proposal_sent_at timestamptz,
  proposal_url     text,
  won_at           timestamptz,
  lost_at          timestamptz,
  lost_reason      text,
  closed_value     numeric(14,2),
  notes            text,
  tags             text[],
  created_at       timestamptz  NOT NULL DEFAULT now(),
  updated_at       timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_business_id ON public.leads (business_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage       ON public.leads (business_id, stage);

-- auto updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS leads_set_updated_at ON public.leads;
CREATE TRIGGER leads_set_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_select" ON public.leads;
DROP POLICY IF EXISTS "leads_insert" ON public.leads;
DROP POLICY IF EXISTS "leads_update" ON public.leads;
DROP POLICY IF EXISTS "leads_delete" ON public.leads;
CREATE POLICY "leads_select" ON public.leads FOR SELECT USING (true);
CREATE POLICY "leads_insert" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "leads_update" ON public.leads FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "leads_delete" ON public.leads FOR DELETE USING (true);

-- ── lead_activities ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid  NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  business_id text  NOT NULL,
  type        text  NOT NULL CHECK (type IN (
                'note','call','email','whatsapp','sms','meeting',
                'stage_change','follow_up_set','follow_up_done','proposal_sent','won','lost')),
  title       text  NOT NULL,
  body        text,
  old_stage   text,
  new_stage   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activities_lead ON public.lead_activities (lead_id);
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "la_all" ON public.lead_activities;
CREATE POLICY "la_all" ON public.lead_activities FOR ALL USING (true) WITH CHECK (true);

-- ── lead_follow_ups ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_follow_ups (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id       uuid  NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  business_id   text  NOT NULL,
  type          text  NOT NULL DEFAULT 'call'
                CHECK (type IN ('call','email','whatsapp','sms','meeting','other')),
  title         text  NOT NULL,
  notes         text,
  due_at        timestamptz NOT NULL,
  reminder_sent boolean NOT NULL DEFAULT false,
  completed     boolean NOT NULL DEFAULT false,
  completed_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_biz ON public.lead_follow_ups (business_id, due_at) WHERE completed = false;
ALTER TABLE public.lead_follow_ups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fu_all" ON public.lead_follow_ups;
CREATE POLICY "fu_all" ON public.lead_follow_ups FOR ALL USING (true) WITH CHECK (true);

-- ── lead_templates ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.lead_templates (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text  NOT NULL,
  name        text  NOT NULL,
  channel     text  NOT NULL CHECK (channel IN ('whatsapp','sms','email')),
  subject     text,
  body        text  NOT NULL,
  variables   text[],
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lead_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lt_all" ON public.lead_templates;
CREATE POLICY "lt_all" ON public.lead_templates FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- OUTREACH / BULK MARKETING SCHEMA
-- Tables: outreach_campaigns, outreach_recipients, outreach_batches,
--         sender_identities, outreach_unsubscribes
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── sender_identities ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sender_identities (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id        text NOT NULL,
  channel            text NOT NULL CHECK (channel IN ('email','whatsapp','sms')),
  display_name       text NOT NULL,
  -- Email / SMTP
  from_email         text,
  smtp_host          text,
  smtp_port          int  DEFAULT 587,
  smtp_user          text,
  smtp_password_enc  text,          -- AES-256 encrypted — never stored plaintext
  smtp_use_tls       boolean DEFAULT true,
  -- WhatsApp (MSG91)
  wa_number          text,
  -- SMS (MSG91)
  sms_sender_id      text,
  -- Warmup tracking
  warmup_enabled     boolean DEFAULT false,
  warmup_day         int     DEFAULT 0,
  warmup_daily_limit int     DEFAULT 50,
  warmup_today_sent  int     DEFAULT 0,
  warmup_last_reset  date,
  -- Health
  reputation_score   numeric(4,1) DEFAULT 100.0,
  bounce_rate        numeric(5,2) DEFAULT 0.0,
  spam_rate          numeric(5,2) DEFAULT 0.0,
  is_verified        boolean DEFAULT false,
  is_default         boolean DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sender_biz ON public.sender_identities (business_id);
ALTER TABLE public.sender_identities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "si_all" ON public.sender_identities FOR ALL USING (true) WITH CHECK (true);

-- ── outreach_campaigns ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id            text NOT NULL,
  name                   text NOT NULL,
  description            text,
  channel                text NOT NULL DEFAULT 'email'
                         CHECK (channel IN ('email','whatsapp','sms','multi')),
  status                 text NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','scheduled','warming_up','running','paused','completed','failed')),
  -- Content
  subject                text,
  body                   text NOT NULL DEFAULT '',
  template_id            uuid REFERENCES public.lead_templates(id) ON DELETE SET NULL,
  -- Counters (updated by triggers / edge functions)
  total_recipients       int DEFAULT 0,
  queued_count           int DEFAULT 0,
  sent_count             int DEFAULT 0,
  delivered_count        int DEFAULT 0,
  opened_count           int DEFAULT 0,
  clicked_count          int DEFAULT 0,
  failed_count           int DEFAULT 0,
  bounced_count          int DEFAULT 0,
  unsubscribed_count     int DEFAULT 0,
  -- Scheduling
  scheduled_at           timestamptz,
  completed_at           timestamptz,
  send_window_start      time DEFAULT '09:00',
  send_window_end        time DEFAULT '20:00',
  timezone               text DEFAULT 'Asia/Kolkata',
  -- Batching
  batch_size             int DEFAULT 500,
  batch_interval_minutes int DEFAULT 5,
  -- Sender
  sender_identity_id     uuid REFERENCES public.sender_identities(id) ON DELETE SET NULL,
  warmup_enabled         boolean DEFAULT false,
  -- UTM / tracking
  utm_source             text DEFAULT 'outreach',
  utm_campaign           text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oc_business ON public.outreach_campaigns (business_id, status);
DROP TRIGGER IF EXISTS oc_set_updated_at ON public.outreach_campaigns;
CREATE TRIGGER oc_set_updated_at BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "oc_all" ON public.outreach_campaigns FOR ALL USING (true) WITH CHECK (true);

-- ── outreach_recipients ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_recipients (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  business_id    text NOT NULL,
  name           text,
  email          text,
  phone          text,
  lead_id        uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status         text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','queued','sent','delivered','opened',
                                   'clicked','failed','bounced','unsubscribed','skipped')),
  error_message  text,
  batch_number   int,
  queued_at      timestamptz,
  sent_at        timestamptz,
  delivered_at   timestamptz,
  opened_at      timestamptz,
  clicked_at     timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_or_campaign_status ON public.outreach_recipients (campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_or_batch           ON public.outreach_recipients (campaign_id, batch_number);
CREATE INDEX IF NOT EXISTS idx_or_lead            ON public.outreach_recipients (lead_id) WHERE lead_id IS NOT NULL;
ALTER TABLE public.outreach_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "or_all" ON public.outreach_recipients FOR ALL USING (true) WITH CHECK (true);

-- ── outreach_batches ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_batches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  batch_number int  NOT NULL,
  total_count  int  NOT NULL DEFAULT 0,
  sent_count   int  DEFAULT 0,
  failed_count int  DEFAULT 0,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','running','completed','failed')),
  scheduled_at timestamptz NOT NULL,
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ob_pickup ON public.outreach_batches (status, scheduled_at)
  WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_ob_campaign ON public.outreach_batches (campaign_id);
ALTER TABLE public.outreach_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ob_all" ON public.outreach_batches FOR ALL USING (true) WITH CHECK (true);

-- ── outreach_unsubscribes ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.outreach_unsubscribes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id text NOT NULL,
  email       text,
  phone       text,
  channel     text NOT NULL DEFAULT 'all'
              CHECK (channel IN ('email','whatsapp','sms','all')),
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_unsub_email ON public.outreach_unsubscribes (business_id, email, channel)
  WHERE email IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_unsub_phone ON public.outreach_unsubscribes (business_id, phone, channel)
  WHERE phone IS NOT NULL;
ALTER TABLE public.outreach_unsubscribes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ou_all" ON public.outreach_unsubscribes FOR ALL USING (true) WITH CHECK (true);

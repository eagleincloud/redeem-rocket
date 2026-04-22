-- ============================================================
-- Migration: 20260416_growth_platform.sql
-- Growth platform tables: email sequences, automation rules,
-- social accounts/posts, lead connectors, email provider configs
-- Fully idempotent — safe to run multiple times
-- business_id is TEXT; RLS uses auth.uid()::text
-- ============================================================

-- ----------------------------------------------------------------
-- Reusable updated_at trigger function
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ================================================================
-- 1. email_sequences
-- ================================================================
CREATE TABLE IF NOT EXISTS email_sequences (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  description   TEXT,
  trigger_type  TEXT        DEFAULT 'manual',   -- manual, signup, purchase, tag_added
  is_active     BOOLEAN     DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sequences_business_id
  ON email_sequences (business_id);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_sequences_select" ON email_sequences;
CREATE POLICY "email_sequences_select"
  ON email_sequences FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_sequences_insert" ON email_sequences;
CREATE POLICY "email_sequences_insert"
  ON email_sequences FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_sequences_update" ON email_sequences;
CREATE POLICY "email_sequences_update"
  ON email_sequences FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_sequences_delete" ON email_sequences;
CREATE POLICY "email_sequences_delete"
  ON email_sequences FOR DELETE
  USING (business_id = auth.uid()::text);

DO $$ BEGIN
  CREATE TRIGGER trg_email_sequences_updated_at
    BEFORE UPDATE ON email_sequences
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- 2. email_sequence_steps
-- ================================================================
CREATE TABLE IF NOT EXISTS email_sequence_steps (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id  UUID        NOT NULL,
  step_number  INTEGER     NOT NULL,
  delay_days   INTEGER     DEFAULT 0,
  delay_hours  INTEGER     DEFAULT 0,
  subject      TEXT        NOT NULL,
  body_html    TEXT,
  body_text    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_sequence_steps_sequence_id
  ON email_sequence_steps (sequence_id);

-- FK to email_sequences with CASCADE delete
DO $$ BEGIN
  ALTER TABLE email_sequence_steps
    ADD CONSTRAINT fk_email_sequence_steps_sequence_id
    FOREIGN KEY (sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE;
EXCEPTION WHEN others THEN NULL; END $$;

ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;

-- RLS joins back to email_sequences to check business_id
DROP POLICY IF EXISTS "email_sequence_steps_select" ON email_sequence_steps;
CREATE POLICY "email_sequence_steps_select"
  ON email_sequence_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM email_sequences
      WHERE id = email_sequence_steps.sequence_id
        AND business_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "email_sequence_steps_insert" ON email_sequence_steps;
CREATE POLICY "email_sequence_steps_insert"
  ON email_sequence_steps FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM email_sequences
      WHERE id = email_sequence_steps.sequence_id
        AND business_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "email_sequence_steps_update" ON email_sequence_steps;
CREATE POLICY "email_sequence_steps_update"
  ON email_sequence_steps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM email_sequences
      WHERE id = email_sequence_steps.sequence_id
        AND business_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "email_sequence_steps_delete" ON email_sequence_steps;
CREATE POLICY "email_sequence_steps_delete"
  ON email_sequence_steps FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM email_sequences
      WHERE id = email_sequence_steps.sequence_id
        AND business_id = auth.uid()::text
    )
  );


-- ================================================================
-- 3. automation_rules
-- ================================================================
CREATE TABLE IF NOT EXISTS automation_rules (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id    TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  trigger_type   TEXT        NOT NULL,  -- new_lead, stage_change, score_reached, no_activity,
                                        -- order_placed, form_submitted, campaign_sent
  trigger_config JSONB       DEFAULT '{}',
  conditions     JSONB       DEFAULT '[]',
  actions        JSONB       DEFAULT '[]',
  is_active      BOOLEAN     DEFAULT true,
  run_count      INTEGER     DEFAULT 0,
  last_run_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_business_id
  ON automation_rules (business_id);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_rules_select" ON automation_rules;
CREATE POLICY "automation_rules_select"
  ON automation_rules FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "automation_rules_insert" ON automation_rules;
CREATE POLICY "automation_rules_insert"
  ON automation_rules FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "automation_rules_update" ON automation_rules;
CREATE POLICY "automation_rules_update"
  ON automation_rules FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "automation_rules_delete" ON automation_rules;
CREATE POLICY "automation_rules_delete"
  ON automation_rules FOR DELETE
  USING (business_id = auth.uid()::text);

DO $$ BEGIN
  CREATE TRIGGER trg_automation_rules_updated_at
    BEFORE UPDATE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- 4. social_accounts
-- ================================================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   TEXT        NOT NULL,
  platform      TEXT        NOT NULL,   -- instagram, facebook, twitter, whatsapp
  username      TEXT,
  access_token  TEXT,
  page_id       TEXT,
  status        TEXT        DEFAULT 'pending',  -- pending, connected, disconnected, error
  connected_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (business_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_business_id
  ON social_accounts (business_id);

ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_accounts_select" ON social_accounts;
CREATE POLICY "social_accounts_select"
  ON social_accounts FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_accounts_insert" ON social_accounts;
CREATE POLICY "social_accounts_insert"
  ON social_accounts FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_accounts_update" ON social_accounts;
CREATE POLICY "social_accounts_update"
  ON social_accounts FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_accounts_delete" ON social_accounts;
CREATE POLICY "social_accounts_delete"
  ON social_accounts FOR DELETE
  USING (business_id = auth.uid()::text);


-- ================================================================
-- 5. social_posts
-- ================================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   TEXT        NOT NULL,
  content       TEXT        NOT NULL,
  platforms     TEXT[]      DEFAULT '{}',
  scheduled_at  TIMESTAMPTZ,
  published_at  TIMESTAMPTZ,
  status        TEXT        DEFAULT 'draft',  -- draft, scheduled, published, failed
  media_urls    TEXT[]      DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_posts_business_id
  ON social_posts (business_id);

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "social_posts_select" ON social_posts;
CREATE POLICY "social_posts_select"
  ON social_posts FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_posts_insert" ON social_posts;
CREATE POLICY "social_posts_insert"
  ON social_posts FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_posts_update" ON social_posts;
CREATE POLICY "social_posts_update"
  ON social_posts FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "social_posts_delete" ON social_posts;
CREATE POLICY "social_posts_delete"
  ON social_posts FOR DELETE
  USING (business_id = auth.uid()::text);

DO $$ BEGIN
  CREATE TRIGGER trg_social_posts_updated_at
    BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- 6. lead_connectors
-- ================================================================
CREATE TABLE IF NOT EXISTS lead_connectors (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      TEXT        NOT NULL,
  connector_type   TEXT        NOT NULL,   -- csv, webhook, embed_form, api_key
  api_key          TEXT        UNIQUE,
  webhook_url      TEXT,
  config           JSONB       DEFAULT '{}',
  is_active        BOOLEAN     DEFAULT true,
  leads_imported   INTEGER     DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_connectors_business_id
  ON lead_connectors (business_id);

ALTER TABLE lead_connectors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lead_connectors_select" ON lead_connectors;
CREATE POLICY "lead_connectors_select"
  ON lead_connectors FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "lead_connectors_insert" ON lead_connectors;
CREATE POLICY "lead_connectors_insert"
  ON lead_connectors FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "lead_connectors_update" ON lead_connectors;
CREATE POLICY "lead_connectors_update"
  ON lead_connectors FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "lead_connectors_delete" ON lead_connectors;
CREATE POLICY "lead_connectors_delete"
  ON lead_connectors FOR DELETE
  USING (business_id = auth.uid()::text);

DO $$ BEGIN
  CREATE TRIGGER trg_lead_connectors_updated_at
    BEFORE UPDATE ON lead_connectors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;


-- ================================================================
-- 7. email_provider_configs
-- ================================================================
CREATE TABLE IF NOT EXISTS email_provider_configs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      TEXT        NOT NULL UNIQUE,
  provider         TEXT        DEFAULT 'resend',   -- resend, smtp, ses
  api_key          TEXT,
  from_address     TEXT,
  reply_to         TEXT,
  smtp_host        TEXT,
  smtp_port        INTEGER     DEFAULT 587,
  smtp_username    TEXT,
  smtp_password    TEXT,
  ses_region       TEXT,
  ses_access_key   TEXT,
  ses_secret_key   TEXT,
  custom_domain    TEXT,
  domain_verified  BOOLEAN     DEFAULT false,
  dns_records      JSONB       DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_provider_configs_business_id
  ON email_provider_configs (business_id);

ALTER TABLE email_provider_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "email_provider_configs_select" ON email_provider_configs;
CREATE POLICY "email_provider_configs_select"
  ON email_provider_configs FOR SELECT
  USING (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_provider_configs_insert" ON email_provider_configs;
CREATE POLICY "email_provider_configs_insert"
  ON email_provider_configs FOR INSERT
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_provider_configs_update" ON email_provider_configs;
CREATE POLICY "email_provider_configs_update"
  ON email_provider_configs FOR UPDATE
  USING (business_id = auth.uid()::text)
  WITH CHECK (business_id = auth.uid()::text);

DROP POLICY IF EXISTS "email_provider_configs_delete" ON email_provider_configs;
CREATE POLICY "email_provider_configs_delete"
  ON email_provider_configs FOR DELETE
  USING (business_id = auth.uid()::text);

DO $$ BEGIN
  CREATE TRIGGER trg_email_provider_configs_updated_at
    BEFORE UPDATE ON email_provider_configs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN others THEN NULL; END $$;

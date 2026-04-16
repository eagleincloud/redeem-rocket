-- Expand lead sources with IVR, Database, Oracle, Web Portals, Scraping

-- Add new columns to lead_connectors for advanced integrations
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS auth_token TEXT;
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS auth_secret TEXT;
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS connection_string TEXT;
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS database_type VARCHAR(50); -- 'postgres', 'mysql', 'oracle', 'mssql'
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS query_template TEXT; -- SQL query or API endpoint template
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS last_error TEXT;
ALTER TABLE lead_connectors ADD COLUMN IF NOT EXISTS error_count INT DEFAULT 0;

-- Create ivr_leads table for IVR call data
CREATE TABLE IF NOT EXISTS ivr_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_id UUID,
  phone_number VARCHAR(20) NOT NULL,
  call_duration INT, -- seconds
  ivr_response TEXT,
  lead_intent VARCHAR(255), -- 'inquiry', 'complaint', 'support', 'sales'
  ivr_metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_ivr_leads_business_id ON ivr_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_ivr_leads_connector_id ON ivr_leads(connector_id);
CREATE INDEX IF NOT EXISTS idx_ivr_leads_phone ON ivr_leads(phone_number);

-- Create web_portal_submissions table for form/portal submissions
CREATE TABLE IF NOT EXISTS web_portal_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_id UUID,
  form_name VARCHAR(255),
  form_data JSONB NOT NULL, -- Raw form submission
  submission_url VARCHAR(2048),
  submitter_ip VARCHAR(45),
  submitted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_web_portal_submissions_business_id ON web_portal_submissions(business_id);
CREATE INDEX IF NOT EXISTS idx_web_portal_submissions_connector_id ON web_portal_submissions(connector_id);

-- Create scraped_leads table for web scraping results
CREATE TABLE IF NOT EXISTS scraped_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_id UUID,
  source_url VARCHAR(2048),
  scrape_metadata JSONB, -- Contact info, company, title, etc
  scrape_quality VARCHAR(20), -- 'high', 'medium', 'low'
  scrape_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_scraped_leads_business_id ON scraped_leads(business_id);
CREATE INDEX IF NOT EXISTS idx_scraped_leads_connector_id ON scraped_leads(connector_id);
CREATE INDEX IF NOT EXISTS idx_scraped_leads_source_url ON scraped_leads(source_url);

-- Create database_sync_logs for tracking database imports
CREATE TABLE IF NOT EXISTS database_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  connector_id UUID,
  database_type VARCHAR(50),
  query_executed TEXT,
  records_fetched INT DEFAULT 0,
  records_imported INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  sync_duration_ms INT,
  sync_status VARCHAR(20), -- 'success', 'partial', 'failed'
  sync_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_database_sync_logs_business_id ON database_sync_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_database_sync_logs_connector_id ON database_sync_logs(connector_id);
CREATE INDEX IF NOT EXISTS idx_database_sync_logs_created_at ON database_sync_logs(created_at DESC);

-- Enable RLS
ALTER TABLE ivr_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_portal_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraped_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for IVR leads
DROP POLICY IF EXISTS ivr_leads_select ON ivr_leads;
DROP POLICY IF EXISTS ivr_leads_insert ON ivr_leads;
DROP POLICY IF EXISTS ivr_leads_update ON ivr_leads;

CREATE POLICY ivr_leads_select ON ivr_leads
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY ivr_leads_insert ON ivr_leads
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

CREATE POLICY ivr_leads_update ON ivr_leads
  FOR UPDATE USING (business_id = auth.uid()::text);

-- RLS Policies for web portal submissions
DROP POLICY IF EXISTS web_portal_submissions_select ON web_portal_submissions;
DROP POLICY IF EXISTS web_portal_submissions_insert ON web_portal_submissions;

CREATE POLICY web_portal_submissions_select ON web_portal_submissions
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY web_portal_submissions_insert ON web_portal_submissions
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

-- RLS Policies for scraped leads
DROP POLICY IF EXISTS scraped_leads_select ON scraped_leads;
DROP POLICY IF EXISTS scraped_leads_insert ON scraped_leads;

CREATE POLICY scraped_leads_select ON scraped_leads
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY scraped_leads_insert ON scraped_leads
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

-- RLS Policies for sync logs
DROP POLICY IF EXISTS database_sync_logs_select ON database_sync_logs;
DROP POLICY IF EXISTS database_sync_logs_insert ON database_sync_logs;

CREATE POLICY database_sync_logs_select ON database_sync_logs
  FOR SELECT USING (business_id = auth.uid()::text);

CREATE POLICY database_sync_logs_insert ON database_sync_logs
  FOR INSERT WITH CHECK (business_id = auth.uid()::text);

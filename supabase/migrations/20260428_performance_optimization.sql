-- Performance Optimization: Add Missing Indexes
-- Optimizes frequently filtered queries and improves query performance

-- ══════════════════════════════════════════════════════════════════════════════
-- BUSINESS & USER INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for business status and type filtering
CREATE INDEX IF NOT EXISTS idx_biz_users_status ON biz_users(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_biz_users_business_type ON biz_users(business_type) WHERE business_type IS NOT NULL;

-- Composite indexes for business queries with multiple filters
CREATE INDEX IF NOT EXISTS idx_biz_users_status_created ON biz_users(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_biz_users_subscription_active ON biz_users(subscription_status, is_active);

-- ══════════════════════════════════════════════════════════════════════════════
-- PIPELINE & STAGE INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for pipeline filtering by business and status
CREATE INDEX IF NOT EXISTS idx_pipelines_business_status ON pipelines(business_id, status);
CREATE INDEX IF NOT EXISTS idx_pipelines_business_created ON pipelines(business_id, created_at DESC);

-- Index for pipeline stage queries
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_business ON pipeline_stages(business_id);

-- Composite indexes for stage filtering
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_order ON pipeline_stages(pipeline_id, stage_order);

-- ══════════════════════════════════════════════════════════════════════════════
-- LEAD/ENTITY INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for entity filtering by business and status
CREATE INDEX IF NOT EXISTS idx_entities_business_status ON entities(business_id, status);
CREATE INDEX IF NOT EXISTS idx_entities_business_pipeline ON entities(business_id, pipeline_id);

-- Composite indexes for lead queries
CREATE INDEX IF NOT EXISTS idx_entities_pipeline_stage ON entities(pipeline_id, current_stage_id);
CREATE INDEX IF NOT EXISTS idx_entities_business_updated ON entities(business_id, updated_at DESC);

-- Index for last contact tracking (performance critical for follow-up)
CREATE INDEX IF NOT EXISTS idx_entities_last_contact ON entities(business_id, last_contact_date DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMUNICATION INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for email filtering by business
CREATE INDEX IF NOT EXISTS idx_emails_business_id ON emails(business_id);
CREATE INDEX IF NOT EXISTS idx_emails_business_status ON emails(business_id, status);

-- Composite indexes for communication queries
CREATE INDEX IF NOT EXISTS idx_emails_business_date ON emails(business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_entity_id ON emails(entity_id);

-- Index for SMS
CREATE INDEX IF NOT EXISTS idx_sms_business_id ON sms(business_id);
CREATE INDEX IF NOT EXISTS idx_sms_business_date ON sms(business_id, created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- ACTIVITY & AUDIT INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for activity log queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_business ON activity_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_business_date ON activity_logs(business_id, created_at DESC);

-- ══════════════════════════════════════════════════════════════════════════════
-- PRODUCT & INVENTORY INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for business products queries
CREATE INDEX IF NOT EXISTS idx_business_products_business_id ON business_products(business_id);
CREATE INDEX IF NOT EXISTS idx_business_products_status ON business_products(business_id, is_active);

-- Index for inventory if exists
CREATE INDEX IF NOT EXISTS idx_inventory_business ON inventory(business_id) WHERE inventory.business_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════════════════════
-- AUTOMATION & WORKFLOW INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for automation rules
CREATE INDEX IF NOT EXISTS idx_automation_rules_business ON automation_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_status ON automation_rules(business_id, is_active);

-- Index for scheduled tasks
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_business ON scheduled_tasks(business_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_status ON scheduled_tasks(business_id, status);

-- ══════════════════════════════════════════════════════════════════════════════
-- FINANCIAL DATA INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for financial records
CREATE INDEX IF NOT EXISTS idx_financial_records_business ON financial_records(business_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_date ON financial_records(business_id, created_at DESC);

-- Index for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_business ON invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(business_id, status);

-- ══════════════════════════════════════════════════════════════════════════════
-- COMMENT & FEEDBACK INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for comments
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_business ON comments(business_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- CONNECTOR & INTEGRATION INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for connector integrations
CREATE INDEX IF NOT EXISTS idx_integrations_business ON integrations(business_id);
CREATE INDEX IF NOT EXISTS idx_integrations_type ON integrations(business_id, type);

-- ══════════════════════════════════════════════════════════════════════════════
-- SOCIAL & MARKETING INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for social media posts
CREATE INDEX IF NOT EXISTS idx_social_posts_business ON social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_date ON social_posts(business_id, created_at DESC);

-- Index for campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_business ON campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(business_id, status);

-- ══════════════════════════════════════════════════════════════════════════════
-- TEAM & COLLABORATION INDEXES
-- ══════════════════════════════════════════════════════════════════════════════

-- Index for team members
CREATE INDEX IF NOT EXISTS idx_team_members_business ON team_members(business_id);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON team_members(business_id, role);

-- ══════════════════════════════════════════════════════════════════════════════
-- QUERY OPTIMIZATION COMMENT
-- ══════════════════════════════════════════════════════════════════════════════
-- These indexes optimize common query patterns:
-- 1. Filtering by business_id (multi-tenant isolation)
-- 2. Status-based filtering (active/inactive)
-- 3. Date-based sorting (created_at, updated_at)
-- 4. Composite filters (business_id + status, business_id + date)
-- 5. Foreign key lookups (pipeline_id, entity_id)
--
-- Target metrics:
-- - Reduce query execution time by 40-60%
-- - Improve N+1 query performance with joins
-- - Enable efficient pagination with date-based indexes

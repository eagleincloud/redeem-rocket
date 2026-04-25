-- Enhanced Smart Onboarding Schema
-- Adds feature_sets_by_industry table and additional onboarding columns

-- 1. Create feature_sets_by_industry table
CREATE TABLE IF NOT EXISTS public.feature_sets_by_industry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_category varchar(100) NOT NULL UNIQUE,
  features jsonb DEFAULT '{}'::jsonb,
  pipeline_templates jsonb DEFAULT '{}'::jsonb,
  dynamic_questions jsonb DEFAULT '{}'::jsonb,
  ai_setup_hints jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add missing columns to biz_users if they don't exist
ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS pipeline_templates jsonb DEFAULT NULL;

ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS onboarding_answers jsonb DEFAULT NULL;

ALTER TABLE public.biz_users
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz DEFAULT NULL;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_feature_sets_business_category ON public.feature_sets_by_industry(business_category);
CREATE INDEX IF NOT EXISTS idx_biz_users_onboarding_completed ON public.biz_users(onboarding_completed_at);

-- 4. Enable RLS on feature_sets_by_industry
ALTER TABLE public.feature_sets_by_industry ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for feature_sets_by_industry (public read-only)
CREATE POLICY feature_sets_select ON public.feature_sets_by_industry
  FOR SELECT
  USING (true);

-- 6. Insert seed data for feature sets by industry
INSERT INTO public.feature_sets_by_industry (business_category, features, pipeline_templates, dynamic_questions, ai_setup_hints)
VALUES
  (
    'restaurant',
    '{"feature_showcase": ["product_catalog", "lead_management", "email_campaigns", "social_media", "automation", "reviews"], "core": ["product_catalog", "lead_management"], "premium": ["social_media", "automation"]}'::jsonb,
    '{"templates": [{"id": "orders", "name": "Order Management", "stages": ["New Order", "Preparing", "Ready", "Delivered"]}, {"id": "reservations", "name": "Reservation Pipeline", "stages": ["Inquiry", "Confirmed", "Arrived", "Completed"]}]}'::jsonb,
    '{"questions": [{"id": "menu_type", "question": "What type of menu do you have?", "type": "select", "options": ["Dine-in only", "Dine-in + Delivery", "Dine-in + Takeout", "All three"]}, {"id": "avg_party_size", "question": "What is your average party size?", "type": "text", "placeholder": "e.g., 4 people"}]}'::jsonb,
    '{"hints": ["Consider enabling reservations pipeline", "Email campaigns work great for promotions", "Social media integration drives foot traffic"]}'::jsonb
  ),
  (
    'b2b_saas',
    '{"feature_showcase": ["lead_management", "email_campaigns", "automation", "support", "analytics"], "core": ["lead_management", "email_campaigns"], "premium": ["automation", "support"]}'::jsonb,
    '{"templates": [{"id": "sales", "name": "Sales Pipeline", "stages": ["Lead", "Discovery", "Demo", "Proposal", "Closed Won"]}, {"id": "support", "name": "Support Ticket Pipeline", "stages": ["New", "Assigned", "In Progress", "Resolved"]}]}'::jsonb,
    '{"questions": [{"id": "saas_type", "question": "What type of SaaS product do you offer?", "type": "text", "placeholder": "e.g., Project Management, CRM, Analytics"}, {"id": "sales_cycle", "question": "What is your typical sales cycle?", "type": "select", "options": ["1-2 weeks", "1 month", "2-3 months", "3+ months"]}]}'::jsonb,
    '{"hints": ["Long sales cycles benefit from email nurturing", "Automation can handle qualification", "Support pipeline is critical for retention"]}'::jsonb
  ),
  (
    'ecommerce',
    '{"feature_showcase": ["product_catalog", "email_campaigns", "automation", "payments", "analytics"], "core": ["product_catalog"], "premium": ["automation", "payments"]}'::jsonb,
    '{"templates": [{"id": "orders", "name": "Order Pipeline", "stages": ["Pending Payment", "Processing", "Shipped", "Delivered", "Returned"]}, {"id": "inventory", "name": "Inventory Management", "stages": ["Low Stock", "Ordering", "Received", "Shelved"]}]}'::jsonb,
    '{"questions": [{"id": "product_count", "question": "How many products do you currently sell?", "type": "select", "options": ["1-50", "51-500", "500-5000", "5000+"]}, {"id": "avg_order_value", "question": "What is your average order value?", "type": "text", "placeholder": "e.g., $50"}]}'::jsonb,
    '{"hints": ["Set up abandoned cart email sequences", "Product catalog is your foundation", "Automation can handle order tracking emails"]}'::jsonb
  ),
  (
    'service',
    '{"feature_showcase": ["lead_management", "automation", "email_campaigns", "scheduling", "payments"], "core": ["lead_management"], "premium": ["automation", "scheduling"]}'::jsonb,
    '{"templates": [{"id": "leads", "name": "Lead Pipeline", "stages": ["Inquiry", "Consultation Scheduled", "Proposal Sent", "Closed Won"]}, {"id": "projects", "name": "Project Pipeline", "stages": ["Planning", "In Progress", "Review", "Completed"]}]}'::jsonb,
    '{"questions": [{"id": "service_type", "question": "What services do you provide?", "type": "textarea", "placeholder": "e.g., Web design, consulting, cleaning"}, {"id": "booking_method", "question": "How do clients currently book?", "type": "select", "options": ["Phone calls", "Email requests", "Online form", "Multiple channels"]}]}'::jsonb,
    '{"hints": ["Automation can send appointment reminders", "Email follow-ups increase close rates", "Consider adding online scheduling"]}'::jsonb
  ),
  (
    'fashion',
    '{"feature_showcase": ["product_catalog", "email_campaigns", "social_media", "payments", "reviews"], "core": ["product_catalog", "social_media"], "premium": ["email_campaigns", "payments"]}'::jsonb,
    '{"templates": [{"id": "inventory", "name": "Seasonal Inventory", "stages": ["Incoming", "Shelved", "Promotional", "Clearance", "Archived"]}, {"id": "campaigns", "name": "Campaign Pipeline", "stages": ["Planning", "Design", "Launch", "Active", "Completed"]}]}'::jsonb,
    '{"questions": [{"id": "style_category", "question": "What fashion category do you specialize in?", "type": "select", "options": ["Women", "Men", "Kids", "Accessories", "Mixed"]}, {"id": "seasonality", "question": "How seasonal is your business?", "type": "select", "options": ["Not seasonal", "Slightly seasonal", "Very seasonal"]}]}'::jsonb,
    '{"hints": ["Leverage Instagram and TikTok for visibility", "Email campaigns drive repeat purchases", "Social reviews are critical for fashion"]}'::jsonb
  );

-- 7. Add comments for documentation
COMMENT ON TABLE public.feature_sets_by_industry IS 'Industry-specific feature sets, pipeline templates, and dynamic questions for smart onboarding';
COMMENT ON COLUMN public.feature_sets_by_industry.business_category IS 'Industry/business category identifier (e.g., restaurant, b2b_saas, ecommerce)';
COMMENT ON COLUMN public.feature_sets_by_industry.features IS 'JSON object mapping feature IDs to display configuration and availability';
COMMENT ON COLUMN public.feature_sets_by_industry.pipeline_templates IS 'JSON array of pre-built pipeline templates specific to this industry';
COMMENT ON COLUMN public.feature_sets_by_industry.dynamic_questions IS 'JSON array of dynamic questions shown during Phase 4';
COMMENT ON COLUMN public.feature_sets_by_industry.ai_setup_hints IS 'JSON array of helpful hints shown during Phase 5 (AI setup)';

COMMENT ON COLUMN public.biz_users.pipeline_templates IS 'JSON array of selected/customized pipeline templates';
COMMENT ON COLUMN public.biz_users.onboarding_answers IS 'JSON object storing all answers from Phase 1-4';
COMMENT ON COLUMN public.biz_users.onboarding_completed_at IS 'Timestamp when onboarding was completed';

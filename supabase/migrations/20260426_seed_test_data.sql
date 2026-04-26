-- Test Data for Category-Template-Behavior System
-- Creates sample business profiles for testing
-- Created: 2026-04-26

-- ============================================================================
-- SEED: Test Business Profiles (3 sample businesses)
-- ============================================================================

-- Sample Business 1: Tech SaaS Company
INSERT INTO public.business_profiles (
    user_id,
    business_name,
    category_id,
    business_type_id,
    business_stage,
    profile_data,
    answers
)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'CloudMetrics AI',
    'cat-004',
    (SELECT id FROM public.business_types WHERE slug = 'saas-platform' LIMIT 1),
    'growth',
    '{
        "website": "https://cloudmetrics.ai",
        "founded_year": 2021,
        "headquarters": "San Francisco, CA",
        "total_funding": 2500000
    }'::jsonb,
    '{
        "product_type": "SaaS Platform",
        "arr": 500000,
        "active_customers": 150,
        "churn_rate": 5,
        "tech_stack": "React, Node.js, PostgreSQL, AWS",
        "cac": 2500,
        "has_api": true,
        "security_certs": "SOC 2, ISO 27001"
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Sample Business 2: Boutique E-Commerce
INSERT INTO public.business_profiles (
    user_id,
    business_name,
    category_id,
    business_type_id,
    business_stage,
    profile_data,
    answers
)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'StyleVault Boutique',
    'cat-001',
    (SELECT id FROM public.business_types WHERE slug = 'clothing-apparel' LIMIT 1),
    'startup',
    '{
        "website": "https://stylevault.com",
        "founded_year": 2023,
        "headquarters": "New York, NY",
        "physical_stores": 1
    }'::jsonb,
    '{
        "primary_sales_channel": "Online & Physical",
        "monthly_revenue": 45000,
        "active_skus": 450,
        "inventory_turnover": 8,
        "cac": 35,
        "has_loyalty_program": true,
        "ecommerce_platform": "Shopify",
        "retail_locations": 1
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- Sample Business 3: Fitness & Wellness Studio
INSERT INTO public.business_profiles (
    user_id,
    business_name,
    category_id,
    business_type_id,
    business_stage,
    profile_data,
    answers
)
VALUES (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'Zen Fitness Studios',
    'cat-003',
    (SELECT id FROM public.business_types WHERE slug = 'fitness-gym' LIMIT 1),
    'mature',
    '{
        "website": "https://zenfitnessstudios.com",
        "founded_year": 2018,
        "headquarters": "Austin, TX",
        "locations": 3
    }'::jsonb,
    '{
        "provider_type": "Fitness & Gym",
        "num_practitioners": 12,
        "patient_capacity": 500,
        "certifications": "ACE, NASM, Yoga Alliance",
        "accepts_insurance": false,
        "patient_ltv": 2400,
        "has_telehealth": true,
        "patient_satisfaction": 4.8
    }'::jsonb
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- APPLY TEMPLATES TO TEST BUSINESSES
-- ============================================================================

-- Apply SaaS Health Score template to CloudMetrics AI
INSERT INTO public.applied_templates (
    business_profile_id,
    template_id,
    application_status,
    configuration,
    progress_data
)
SELECT
    bp.id,
    t.id,
    'active',
    '{
        "scoring_frequency": "daily",
        "dashboard_enabled": true,
        "alert_threshold": 50
    }'::jsonb,
    '{
        "last_calculated": "'::text || NOW()::text || '",
        "total_scores_calculated": 15,
        "accounts_flagged": 3
    }'::jsonb
FROM public.business_profiles bp
CROSS JOIN public.templates t
WHERE bp.business_name = 'CloudMetrics AI'
AND t.slug = 'saas-health-score'
AND NOT EXISTS (
    SELECT 1 FROM public.applied_templates
    WHERE business_profile_id = bp.id AND template_id = t.id
) ON CONFLICT DO NOTHING;

-- Apply Customer Segmentation to StyleVault Boutique
INSERT INTO public.applied_templates (
    business_profile_id,
    template_id,
    application_status,
    configuration,
    progress_data
)
SELECT
    bp.id,
    t.id,
    'active',
    '{
        "segment_frequency": "weekly",
        "auto_marketing": true
    }'::jsonb,
    '{
        "total_segments": 5,
        "last_segment_date": "'::text || NOW()::text || '",
        "customers_segmented": 1200
    }'::jsonb
FROM public.business_profiles bp
CROSS JOIN public.templates t
WHERE bp.business_name = 'StyleVault Boutique'
AND t.slug = 'customer-segmentation'
AND NOT EXISTS (
    SELECT 1 FROM public.applied_templates
    WHERE business_profile_id = bp.id AND template_id = t.id
) ON CONFLICT DO NOTHING;

-- Apply Patient Engagement to Zen Fitness Studios
INSERT INTO public.applied_templates (
    business_profile_id,
    template_id,
    application_status,
    configuration,
    progress_data
)
SELECT
    bp.id,
    t.id,
    'active',
    '{
        "engagement_frequency": "weekly",
        "feedback_collection": true
    }'::jsonb,
    '{
        "members_engaged": 450,
        "engagement_rate": 0.89,
        "last_engagement": "'::text || NOW()::text || '"
    }'::jsonb
FROM public.business_profiles bp
CROSS JOIN public.templates t
WHERE bp.business_name = 'Zen Fitness Studios'
AND t.slug = 'patient-engagement'
AND NOT EXISTS (
    SELECT 1 FROM public.applied_templates
    WHERE business_profile_id = bp.id AND template_id = t.id
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE BEHAVIOR EXECUTIONS
-- ============================================================================

-- Sample executions for CloudMetrics SaaS Health Score
INSERT INTO public.behavior_executions (
    applied_template_id,
    behavior_id,
    execution_status,
    execution_result,
    execution_start,
    execution_end,
    duration_ms
)
SELECT
    at.id,
    tb.id,
    'completed',
    '{
        "accounts_analyzed": 145,
        "at_risk_identified": 3,
        "avg_score": 72.5
    }'::jsonb,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day' + INTERVAL '45 seconds',
    45000
FROM public.applied_templates at
CROSS JOIN public.template_behaviors tb
WHERE at.id IN (SELECT id FROM public.applied_templates WHERE business_profile_id = (SELECT id FROM public.business_profiles WHERE business_name = 'CloudMetrics AI' LIMIT 1))
AND tb.behavior_type = 'trigger'
AND NOT EXISTS (
    SELECT 1 FROM public.behavior_executions
    WHERE applied_template_id = at.id
)
LIMIT 3 ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE ENGAGEMENT METRICS
-- ============================================================================

-- Metrics for CloudMetrics AI
INSERT INTO public.engagement_metrics (
    business_profile_id,
    metric_date,
    engagement_score,
    templates_applied,
    behaviors_executed,
    behaviors_successful,
    data_completeness,
    active_workflows
)
SELECT
    bp.id,
    CURRENT_DATE,
    85.5,
    3,
    47,
    45,
    95,
    3
FROM public.business_profiles bp
WHERE bp.business_name = 'CloudMetrics AI'
AND NOT EXISTS (
    SELECT 1 FROM public.engagement_metrics
    WHERE business_profile_id = bp.id AND metric_date = CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- Metrics for StyleVault Boutique
INSERT INTO public.engagement_metrics (
    business_profile_id,
    metric_date,
    engagement_score,
    templates_applied,
    behaviors_executed,
    behaviors_successful,
    data_completeness,
    active_workflows
)
SELECT
    bp.id,
    CURRENT_DATE,
    72.0,
    2,
    18,
    17,
    82,
    2
FROM public.business_profiles bp
WHERE bp.business_name = 'StyleVault Boutique'
AND NOT EXISTS (
    SELECT 1 FROM public.engagement_metrics
    WHERE business_profile_id = bp.id AND metric_date = CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- Metrics for Zen Fitness Studios
INSERT INTO public.engagement_metrics (
    business_profile_id,
    metric_date,
    engagement_score,
    templates_applied,
    behaviors_executed,
    behaviors_successful,
    data_completeness,
    active_workflows
)
SELECT
    bp.id,
    CURRENT_DATE,
    88.0,
    2,
    52,
    51,
    91,
    2
FROM public.business_profiles bp
WHERE bp.business_name = 'Zen Fitness Studios'
AND NOT EXISTS (
    SELECT 1 FROM public.engagement_metrics
    WHERE business_profile_id = bp.id AND metric_date = CURRENT_DATE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE RECOMMENDATIONS
-- ============================================================================

-- Recommendations for CloudMetrics AI
INSERT INTO public.recommendations (
    business_profile_id,
    recommendation_type,
    recommendation_data,
    template_id,
    confidence_score
)
SELECT
    bp.id,
    'template',
    '{
        "title": "Feature Rollout Automation",
        "description": "Automate your feature rollout process for better control"
    }'::jsonb,
    (SELECT id FROM public.templates WHERE slug = 'feature-rollout' LIMIT 1),
    0.92
FROM public.business_profiles bp
WHERE bp.business_name = 'CloudMetrics AI'
AND NOT EXISTS (
    SELECT 1 FROM public.recommendations
    WHERE business_profile_id = bp.id AND recommendation_type = 'template'
) ON CONFLICT DO NOTHING;

-- Recommendations for StyleVault Boutique
INSERT INTO public.recommendations (
    business_profile_id,
    recommendation_type,
    recommendation_data,
    template_id,
    confidence_score
)
SELECT
    bp.id,
    'template',
    '{
        "title": "Inventory Management Automation",
        "description": "Automate your low stock alerts and reorder processes"
    }'::jsonb,
    (SELECT id FROM public.templates WHERE slug = 'inventory-management' LIMIT 1),
    0.88
FROM public.business_profiles bp
WHERE bp.business_name = 'StyleVault Boutique'
AND NOT EXISTS (
    SELECT 1 FROM public.recommendations
    WHERE business_profile_id = bp.id AND recommendation_type = 'template'
) ON CONFLICT DO NOTHING;

-- Recommendations for Zen Fitness Studios
INSERT INTO public.recommendations (
    business_profile_id,
    recommendation_type,
    recommendation_data,
    template_id,
    confidence_score
)
SELECT
    bp.id,
    'template',
    '{
        "title": "Guest Experience Optimization",
        "description": "Enhance member experience with automated workflows"
    }'::jsonb,
    (SELECT id FROM public.templates WHERE slug = 'guest-experience' LIMIT 1),
    0.85
FROM public.business_profiles bp
WHERE bp.business_name = 'Zen Fitness Studios'
AND NOT EXISTS (
    SELECT 1 FROM public.recommendations
    WHERE business_profile_id = bp.id AND recommendation_type = 'template'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE AUDIT LOGS
-- ============================================================================

INSERT INTO public.audit_logs (
    user_id,
    business_profile_id,
    action_type,
    resource_type,
    resource_id,
    changes
)
SELECT
    bp.user_id,
    bp.id,
    'INSERT',
    'business_profiles',
    bp.id,
    to_jsonb(bp)
FROM public.business_profiles bp
WHERE NOT EXISTS (
    SELECT 1 FROM public.audit_logs
    WHERE business_profile_id = bp.id
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- CREATE SAMPLE SYSTEM EVENTS
-- ============================================================================

INSERT INTO public.system_events (
    event_type,
    event_source,
    target_entity_type,
    target_entity_id,
    event_payload,
    is_processed
)
SELECT
    'template_applied',
    'system',
    'applied_templates',
    at.id,
    jsonb_build_object(
        'business_profile_id', at.business_profile_id,
        'template_id', at.template_id,
        'timestamp', NOW()
    ),
    true
FROM public.applied_templates at
WHERE NOT EXISTS (
    SELECT 1 FROM public.system_events
    WHERE target_entity_id = at.id
) ON CONFLICT DO NOTHING;

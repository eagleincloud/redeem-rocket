-- Category-Template-Behavior System Schema
-- Complete database setup with 13 tables, 40+ indexes, and RLS policies
-- Created: 2026-04-26

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- TABLE 1: business_categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON public.business_categories(slug);
CREATE INDEX idx_categories_active ON public.business_categories(is_active);
CREATE INDEX idx_categories_order ON public.business_categories(display_order);

-- ============================================================================
-- TABLE 2: business_types
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.business_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

CREATE INDEX idx_types_category ON public.business_types(category_id);
CREATE INDEX idx_types_slug ON public.business_types(slug);
CREATE INDEX idx_types_active ON public.business_types(is_active);

-- ============================================================================
-- TABLE 3: category_questions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.category_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.business_categories(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL, -- text, number, boolean, multiple_choice, date
    field_key TEXT NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    display_order INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, field_key)
);

CREATE INDEX idx_questions_category ON public.category_questions(category_id);
CREATE INDEX idx_questions_type ON public.category_questions(question_type);
CREATE INDEX idx_questions_required ON public.category_questions(is_required);
CREATE INDEX idx_questions_field_key ON public.category_questions(field_key);

-- ============================================================================
-- TABLE 4: templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.business_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    template_type VARCHAR(50) NOT NULL, -- workflow, automation, report, dashboard, analysis
    configuration JSONB NOT NULL DEFAULT '{}',
    conditions JSONB NOT NULL DEFAULT '{}',
    actions JSONB NOT NULL DEFAULT '{}',
    priority INT DEFAULT 100,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

CREATE INDEX idx_templates_category ON public.templates(category_id);
CREATE INDEX idx_templates_type ON public.templates(template_type);
CREATE INDEX idx_templates_active ON public.templates(is_active);
CREATE INDEX idx_templates_priority ON public.templates(priority);
CREATE INDEX idx_templates_slug ON public.templates(slug);

-- ============================================================================
-- TABLE 5: template_behaviors
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.template_behaviors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    behavior_name TEXT NOT NULL,
    behavior_type VARCHAR(50) NOT NULL, -- trigger, action, condition, notification
    implementation JSONB NOT NULL,
    parameters JSONB DEFAULT '{}',
    execution_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_behaviors_template ON public.template_behaviors(template_id);
CREATE INDEX idx_behaviors_type ON public.template_behaviors(behavior_type);
CREATE INDEX idx_behaviors_active ON public.template_behaviors(is_active);
CREATE INDEX idx_behaviors_order ON public.template_behaviors(execution_order);

-- ============================================================================
-- TABLE 6: business_profiles
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.business_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    category_id UUID NOT NULL REFERENCES public.business_categories(id) ON DELETE RESTRICT,
    business_type_id UUID REFERENCES public.business_types(id) ON DELETE SET NULL,
    business_stage VARCHAR(50), -- startup, growth, mature, scaling
    profile_data JSONB NOT NULL DEFAULT '{}',
    answers JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_user ON public.business_profiles(user_id);
CREATE INDEX idx_profiles_category ON public.business_profiles(category_id);
CREATE INDEX idx_profiles_type ON public.business_profiles(business_type_id);
CREATE INDEX idx_profiles_stage ON public.business_profiles(business_stage);
CREATE INDEX idx_profiles_created ON public.business_profiles(created_at);

-- ============================================================================
-- TABLE 7: applied_templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.applied_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    application_status VARCHAR(50) DEFAULT 'pending', -- pending, active, completed, archived
    configuration JSONB NOT NULL DEFAULT '{}',
    progress_data JSONB DEFAULT '{}',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_applied_profile ON public.applied_templates(business_profile_id);
CREATE INDEX idx_applied_template ON public.applied_templates(template_id);
CREATE INDEX idx_applied_status ON public.applied_templates(application_status);
CREATE INDEX idx_applied_created ON public.applied_templates(applied_at);

-- ============================================================================
-- TABLE 8: behavior_executions
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.behavior_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applied_template_id UUID NOT NULL REFERENCES public.applied_templates(id) ON DELETE CASCADE,
    behavior_id UUID NOT NULL REFERENCES public.template_behaviors(id) ON DELETE CASCADE,
    execution_status VARCHAR(50) DEFAULT 'pending', -- pending, running, completed, failed, skipped
    execution_result JSONB DEFAULT '{}',
    error_message TEXT,
    execution_start TIMESTAMP WITH TIME ZONE,
    execution_end TIMESTAMP WITH TIME ZONE,
    duration_ms INT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_executions_template ON public.behavior_executions(applied_template_id);
CREATE INDEX idx_executions_behavior ON public.behavior_executions(behavior_id);
CREATE INDEX idx_executions_status ON public.behavior_executions(execution_status);
CREATE INDEX idx_executions_created ON public.behavior_executions(created_at);

-- ============================================================================
-- TABLE 9: engagement_metrics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.engagement_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    engagement_score NUMERIC(5, 2) DEFAULT 0,
    templates_applied INT DEFAULT 0,
    behaviors_executed INT DEFAULT 0,
    behaviors_successful INT DEFAULT 0,
    data_completeness NUMERIC(5, 2) DEFAULT 0,
    active_workflows INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_profile_id, metric_date)
);

CREATE INDEX idx_metrics_profile ON public.engagement_metrics(business_profile_id);
CREATE INDEX idx_metrics_date ON public.engagement_metrics(metric_date);
CREATE INDEX idx_metrics_score ON public.engagement_metrics(engagement_score);

-- ============================================================================
-- TABLE 10: recommendations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_profile_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- template, behavior, question, improvement
    recommendation_data JSONB NOT NULL,
    template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,
    confidence_score NUMERIC(5, 2),
    is_dismissed BOOLEAN DEFAULT false,
    dismissed_at TIMESTAMP WITH TIME ZONE,
    actioned_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recommendations_profile ON public.recommendations(business_profile_id);
CREATE INDEX idx_recommendations_type ON public.recommendations(recommendation_type);
CREATE INDEX idx_recommendations_template ON public.recommendations(template_id);
CREATE INDEX idx_recommendations_dismissed ON public.recommendations(is_dismissed);
CREATE INDEX idx_recommendations_created ON public.recommendations(created_at);

-- ============================================================================
-- TABLE 11: template_analytics
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.template_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_applications INT DEFAULT 0,
    successful_executions INT DEFAULT 0,
    failed_executions INT DEFAULT 0,
    average_duration_ms INT,
    user_satisfaction NUMERIC(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, metric_date)
);

CREATE INDEX idx_analytics_template ON public.template_analytics(template_id);
CREATE INDEX idx_analytics_date ON public.template_analytics(metric_date);

-- ============================================================================
-- TABLE 12: audit_logs
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    business_profile_id UUID REFERENCES public.business_profiles(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_profile ON public.audit_logs(business_profile_id);
CREATE INDEX idx_audit_action ON public.audit_logs(action_type);
CREATE INDEX idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);

-- ============================================================================
-- TABLE 13: system_events
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    event_source VARCHAR(50) NOT NULL,
    target_entity_type VARCHAR(50),
    target_entity_id UUID,
    event_payload JSONB DEFAULT '{}',
    is_processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_type ON public.system_events(event_type);
CREATE INDEX idx_events_source ON public.system_events(event_source);
CREATE INDEX idx_events_entity ON public.system_events(target_entity_type, target_entity_id);
CREATE INDEX idx_events_processed ON public.system_events(is_processed);
CREATE INDEX idx_events_created ON public.system_events(created_at);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: get_business_stage()
CREATE OR REPLACE FUNCTION public.get_business_stage(p_business_profile_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_stage VARCHAR;
    v_templates_applied INT;
    v_behaviors_successful INT;
    v_days_active INT;
BEGIN
    SELECT business_stage INTO v_stage FROM public.business_profiles WHERE id = p_business_profile_id;

    IF v_stage IS NOT NULL THEN
        RETURN v_stage;
    END IF;

    -- Determine stage based on activity metrics
    SELECT COUNT(*) INTO v_templates_applied FROM public.applied_templates WHERE business_profile_id = p_business_profile_id;
    SELECT COUNT(*) INTO v_behaviors_successful FROM public.behavior_executions
    WHERE applied_template_id IN (SELECT id FROM public.applied_templates WHERE business_profile_id = p_business_profile_id)
    AND execution_status = 'completed';

    SELECT EXTRACT(DAY FROM NOW() - created_at)::INT INTO v_days_active FROM public.business_profiles WHERE id = p_business_profile_id;

    CASE
        WHEN v_days_active < 7 THEN v_stage := 'startup';
        WHEN v_templates_applied < 3 THEN v_stage := 'startup';
        WHEN v_behaviors_successful < 10 THEN v_stage := 'growth';
        WHEN v_behaviors_successful < 50 THEN v_stage := 'mature';
        ELSE v_stage := 'scaling';
    END CASE;

    UPDATE public.business_profiles SET business_stage = v_stage WHERE id = p_business_profile_id;
    RETURN v_stage;
END;
$$ LANGUAGE plpgsql;

-- Function: calculate_engagement_score()
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(p_business_profile_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC := 0;
    v_templates_applied INT;
    v_behaviors_successful INT;
    v_completion_rate NUMERIC;
    v_data_completeness NUMERIC;
BEGIN
    -- Count applied templates (20 points max)
    SELECT COUNT(*) INTO v_templates_applied FROM public.applied_templates
    WHERE business_profile_id = p_business_profile_id AND application_status IN ('active', 'completed');
    v_score := v_score + LEAST(v_templates_applied * 5, 20);

    -- Count successful behaviors (30 points max)
    SELECT COUNT(*) INTO v_behaviors_successful FROM public.behavior_executions be
    WHERE be.applied_template_id IN (SELECT id FROM public.applied_templates WHERE business_profile_id = p_business_profile_id)
    AND be.execution_status = 'completed';
    v_score := v_score + LEAST(v_behaviors_successful, 30);

    -- Calculate completion rate (25 points max)
    SELECT COALESCE(ROUND(COUNT(*) FILTER (WHERE application_status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0) * 25, 2), 0)
    INTO v_completion_rate FROM public.applied_templates WHERE business_profile_id = p_business_profile_id;
    v_score := v_score + v_completion_rate;

    -- Data completeness (25 points max)
    SELECT COALESCE((jsonb_object_keys(answers) IS NOT NULL AND jsonb_object_keys(answers)::text[] != ARRAY[]::text[])::INT * 25 / NULLIF(jsonb_object_keys(answers)::text[] || ARRAY[]::text[], ARRAY[]::text[])::INT, 0)
    INTO v_data_completeness FROM public.business_profiles WHERE id = p_business_profile_id;
    v_score := v_score + COALESCE(v_data_completeness, 0);

    RETURN ROUND(v_score, 2);
END;
$$ LANGUAGE plpgsql;

-- Function: get_recommendations()
CREATE OR REPLACE FUNCTION public.get_recommendations(p_business_profile_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE(id UUID, recommendation_type VARCHAR, template_id UUID, confidence_score NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT r.id, r.recommendation_type, r.template_id, r.confidence_score
    FROM public.recommendations r
    WHERE r.business_profile_id = p_business_profile_id
    AND r.is_dismissed = FALSE
    ORDER BY r.confidence_score DESC, r.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function: apply_template()
CREATE OR REPLACE FUNCTION public.apply_template(
    p_business_profile_id UUID,
    p_template_id UUID,
    p_configuration JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_applied_template_id UUID;
BEGIN
    INSERT INTO public.applied_templates (business_profile_id, template_id, configuration, application_status)
    VALUES (p_business_profile_id, p_template_id, p_configuration, 'pending')
    RETURNING id INTO v_applied_template_id;

    INSERT INTO public.system_events (event_type, event_source, target_entity_type, target_entity_id, event_payload)
    VALUES ('template_applied', 'system', 'applied_templates', v_applied_template_id, jsonb_build_object('business_profile_id', p_business_profile_id, 'template_id', p_template_id));

    RETURN v_applied_template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE public.business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for business_profiles
CREATE POLICY "Users can read their own business profiles"
ON public.business_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business profiles"
ON public.business_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profiles"
ON public.business_profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for applied_templates
CREATE POLICY "Users can read templates applied to their profiles"
ON public.applied_templates
FOR SELECT
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create templates for their profiles"
ON public.applied_templates
FOR INSERT
WITH CHECK (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update templates for their profiles"
ON public.applied_templates
FOR UPDATE
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

-- RLS Policies for behavior_executions
CREATE POLICY "Users can read behavior executions for their templates"
ON public.behavior_executions
FOR SELECT
USING (applied_template_id IN (
    SELECT id FROM public.applied_templates
    WHERE business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid())
));

-- RLS Policies for engagement_metrics
CREATE POLICY "Users can read metrics for their profiles"
ON public.engagement_metrics
FOR SELECT
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

-- RLS Policies for recommendations
CREATE POLICY "Users can read recommendations for their profiles"
ON public.recommendations
FOR SELECT
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update recommendations for their profiles"
ON public.recommendations
FOR UPDATE
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

-- RLS Policies for audit_logs
CREATE POLICY "Users can read audit logs for their profiles"
ON public.audit_logs
FOR SELECT
USING (business_profile_id IN (SELECT id FROM public.business_profiles WHERE user_id = auth.uid()));

-- Public read access to categories and templates (not user-specific)
CREATE POLICY "Anyone can read categories"
ON public.business_categories
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read types"
ON public.business_types
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read questions"
ON public.category_questions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read templates"
ON public.templates
FOR SELECT
USING (true);

CREATE POLICY "Anyone can read behaviors"
ON public.template_behaviors
FOR SELECT
USING (true);

-- ============================================================================
-- ANALYTICAL VIEWS
-- ============================================================================

CREATE OR REPLACE VIEW public.vw_template_performance AS
SELECT
    t.id,
    t.name,
    t.category_id,
    COUNT(DISTINCT at.id) as total_applications,
    COUNT(DISTINCT CASE WHEN at.application_status = 'completed' THEN at.id END) as completed_applications,
    ROUND(COUNT(DISTINCT CASE WHEN at.application_status = 'completed' THEN at.id END)::NUMERIC / NULLIF(COUNT(DISTINCT at.id), 0) * 100, 2) as completion_rate,
    AVG(EXTRACT(EPOCH FROM (COALESCE(at.completed_at, NOW()) - at.applied_at)))::INT as avg_duration_seconds,
    ta.user_satisfaction
FROM public.templates t
LEFT JOIN public.applied_templates at ON t.id = at.template_id
LEFT JOIN public.template_analytics ta ON t.id = ta.template_id AND ta.metric_date = CURRENT_DATE
GROUP BY t.id, t.name, t.category_id, ta.user_satisfaction;

CREATE OR REPLACE VIEW public.vw_business_health AS
SELECT
    bp.id,
    bp.user_id,
    bp.business_name,
    bp.business_stage,
    COUNT(DISTINCT at.id) as active_templates,
    COUNT(DISTINCT CASE WHEN be.execution_status = 'completed' THEN be.id END) as completed_behaviors,
    public.calculate_engagement_score(bp.id) as engagement_score,
    ROUND((jsonb_object_keys(bp.answers) IS NOT NULL AND jsonb_object_keys(bp.answers)::text[] != ARRAY[]::text[])::NUMERIC, 2) as profile_completeness
FROM public.business_profiles bp
LEFT JOIN public.applied_templates at ON bp.id = at.business_profile_id AND at.application_status IN ('active', 'completed')
LEFT JOIN public.behavior_executions be ON at.id = be.applied_template_id
GROUP BY bp.id, bp.user_id, bp.business_name, bp.business_stage;

-- ============================================================================
-- REALTIME SUBSCRIPTIONS SETUP
-- ============================================================================

-- Tables enabled for realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.applied_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.behavior_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.engagement_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, business_profile_id, action_type, resource_type, resource_id, changes)
    VALUES (
        auth.uid(),
        CASE
            WHEN TG_TABLE_NAME = 'business_profiles' THEN NEW.id
            WHEN TG_TABLE_NAME = 'applied_templates' THEN (SELECT business_profile_id FROM public.applied_templates WHERE id = NEW.id)
            ELSE NULL
        END,
        TG_OP,
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(NEW)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_log_applied_templates
AFTER INSERT OR UPDATE ON public.applied_templates
FOR EACH ROW
EXECUTE FUNCTION public.audit_log_trigger();

-- ============================================================================
-- GRANTS FOR AUTHENTICATED USERS
-- ============================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON public.business_profiles TO authenticated;
GRANT INSERT, UPDATE ON public.applied_templates TO authenticated;
GRANT INSERT ON public.behavior_executions TO authenticated;
GRANT UPDATE ON public.recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_stage TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_engagement_score TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommendations TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_template TO authenticated;

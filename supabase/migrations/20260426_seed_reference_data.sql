-- Seed Reference Data for Category-Template-Behavior System
-- Created: 2026-04-26

-- ============================================================================
-- SEED: Business Categories (10 categories)
-- ============================================================================

INSERT INTO public.business_categories (id, name, slug, description, icon, color, display_order)
VALUES
('cat-001', 'Retail & E-Commerce', 'retail-ecommerce', 'Online and physical retail businesses, e-commerce platforms, marketplaces', 'shopping-bag', '#FF6B6B', 0),
('cat-002', 'Professional Services', 'professional-services', 'Consulting, legal, accounting, and other professional service providers', 'briefcase', '#4ECDC4', 1),
('cat-003', 'Healthcare & Wellness', 'healthcare-wellness', 'Medical practices, fitness, wellness, and health-related services', 'heart', '#FF69B4', 2),
('cat-004', 'Technology & Software', 'technology-software', 'SaaS, software development, tech startups, and IT services', 'code', '#95E1D3', 3),
('cat-005', 'Education & Training', 'education-training', 'Educational institutions, training programs, online courses, tutoring', 'book', '#FFD93D', 4),
('cat-006', 'Hospitality & Travel', 'hospitality-travel', 'Hotels, restaurants, travel agencies, tourism-related businesses', 'map-pin', '#A8E6CF', 5),
('cat-007', 'Real Estate & Property', 'real-estate-property', 'Real estate agencies, property management, real estate development', 'home', '#FFB6B9', 6),
('cat-008', 'Manufacturing & Production', 'manufacturing-production', 'Manufacturing, production facilities, industrial operations', 'factory', '#C7CEEA', 7),
('cat-009', 'Transportation & Logistics', 'transportation-logistics', 'Logistics, shipping, delivery services, transportation operations', 'truck', '#FFDDC1', 8),
('cat-010', 'Finance & Insurance', 'finance-insurance', 'Financial services, insurance, investment management, banking', 'dollar-sign', '#E0B9D9', 9)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SEED: Business Types (56 types total)
-- ============================================================================

INSERT INTO public.business_types (category_id, name, slug, description)
VALUES
-- Retail & E-Commerce (6 types)
('cat-001', 'General Retail Store', 'general-retail', 'Traditional retail store'),
('cat-001', 'Clothing & Apparel', 'clothing-apparel', 'Fashion and apparel retail'),
('cat-001', 'Electronics & Gadgets', 'electronics', 'Electronics retail'),
('cat-001', 'Furniture & Home Decor', 'furniture-home', 'Home furniture and decor'),
('cat-001', 'Beauty & Cosmetics', 'beauty-cosmetics', 'Beauty products retail'),
('cat-001', 'Food & Beverage Retail', 'food-beverage', 'Grocery and food retail'),

-- Professional Services (6 types)
('cat-002', 'Management Consulting', 'consulting', 'Strategy and management consulting'),
('cat-002', 'Legal Services', 'legal-services', 'Law firm and legal services'),
('cat-002', 'Accounting & Bookkeeping', 'accounting', 'Accounting services'),
('cat-002', 'Tax Services', 'tax-services', 'Tax preparation and planning'),
('cat-002', 'IT Consulting', 'it-consulting', 'IT and technology consulting'),
('cat-002', 'Marketing Services', 'marketing-services', 'Marketing and advertising agency'),

-- Healthcare & Wellness (6 types)
('cat-003', 'Medical Practice', 'medical-practice', 'Physician practice'),
('cat-003', 'Dental Clinic', 'dental-clinic', 'Dental practice'),
('cat-003', 'Fitness & Gym', 'fitness-gym', 'Fitness center or gym'),
('cat-003', 'Mental Health Services', 'mental-health', 'Counseling and therapy'),
('cat-003', 'Nutrition & Wellness', 'nutrition', 'Nutritionist and wellness coach'),
('cat-003', 'Spa & Salon', 'spa-salon', 'Spa and salon services'),

-- Technology & Software (6 types)
('cat-004', 'SaaS Platform', 'saas-platform', 'Software as a Service company'),
('cat-004', 'Software Development', 'software-dev', 'Custom software development'),
('cat-004', 'App Development', 'app-development', 'Mobile or web app development'),
('cat-004', 'Web Design Agency', 'web-design', 'Web design and development'),
('cat-004', 'Cybersecurity', 'cybersecurity', 'Cybersecurity services'),
('cat-004', 'Data Analytics', 'data-analytics', 'Data analytics and BI'),

-- Education & Training (6 types)
('cat-005', 'Online Courses', 'online-courses', 'Online course platform'),
('cat-005', 'Tutoring Services', 'tutoring', 'Academic tutoring'),
('cat-005', 'Coaching & Mentoring', 'coaching', 'Life or business coaching'),
('cat-005', 'Corporate Training', 'corporate-training', 'Corporate training programs'),
('cat-005', 'Language School', 'language-school', 'Language learning institution'),
('cat-005', 'Skills Bootcamp', 'skills-bootcamp', 'Technical skills bootcamp'),

-- Hospitality & Travel (6 types)
('cat-006', 'Hotel & Lodging', 'hotel', 'Hotel or inn'),
('cat-006', 'Restaurant & Cafe', 'restaurant', 'Restaurant or cafe'),
('cat-006', 'Travel Agency', 'travel-agency', 'Travel planning agency'),
('cat-006', 'Tour Operator', 'tour-operator', 'Tour company'),
('cat-006', 'Event Venue', 'event-venue', 'Event venue or banquet hall'),
('cat-006', 'Catering Service', 'catering', 'Catering company'),

-- Real Estate & Property (5 types)
('cat-007', 'Real Estate Agency', 'real-estate-agency', 'Residential real estate brokerage'),
('cat-007', 'Property Management', 'property-management', 'Property management company'),
('cat-007', 'Real Estate Development', 'real-estate-dev', 'Real estate development company'),
('cat-007', 'Real Estate Investing', 'real-estate-investing', 'Real estate investment company'),
('cat-007', 'Commercial Real Estate', 'commercial-real-estate', 'Commercial property services'),

-- Manufacturing & Production (5 types)
('cat-008', 'Industrial Manufacturing', 'industrial-manufacturing', 'Factory and manufacturing'),
('cat-008', 'Food Production', 'food-production', 'Food manufacturing'),
('cat-008', 'Textile & Apparel Manufacturing', 'textile-apparel', 'Textile production'),
('cat-008', 'Electronics Manufacturing', 'electronics-mfg', 'Electronics production'),
('cat-008', 'Custom Fabrication', 'custom-fabrication', 'Custom metal or product fabrication'),

-- Transportation & Logistics (5 types)
('cat-009', 'Logistics Company', 'logistics-company', 'Logistics and supply chain'),
('cat-009', 'Shipping & Courier', 'shipping-courier', 'Shipping and courier service'),
('cat-009', 'Fleet Management', 'fleet-management', 'Vehicle fleet management'),
('cat-009', 'Moving Service', 'moving-service', 'Moving and relocation service'),
('cat-009', 'Delivery Service', 'delivery-service', 'Last-mile delivery service'),

-- Finance & Insurance (6 types)
('cat-010', 'Financial Advisory', 'financial-advisory', 'Financial advisor'),
('cat-010', 'Insurance Agency', 'insurance-agency', 'Insurance agency'),
('cat-010', 'Investment Management', 'investment-management', 'Investment firm'),
('cat-010', 'Mortgage Broker', 'mortgage-broker', 'Mortgage brokerage'),
('cat-010', 'Credit Union', 'credit-union', 'Credit union'),
('cat-010', 'FinTech Startup', 'fintech-startup', 'Financial technology startup')
ON CONFLICT (category_id, slug) DO NOTHING;

-- ============================================================================
-- SEED: Category-Specific Questions (78 total)
-- ============================================================================

INSERT INTO public.category_questions (category_id, question_text, question_type, field_key, is_required, display_order)
VALUES
-- Retail & E-Commerce Questions (8)
('cat-001', 'What is your primary sales channel?', 'multiple_choice', 'primary_sales_channel', true, 0),
('cat-001', 'Average monthly revenue', 'number', 'monthly_revenue', false, 1),
('cat-001', 'Number of active SKUs (products)', 'number', 'active_skus', true, 2),
('cat-001', 'What is your inventory turnover ratio?', 'number', 'inventory_turnover', false, 3),
('cat-001', 'Customer acquisition cost', 'number', 'cac', false, 4),
('cat-001', 'Do you offer loyalty programs?', 'boolean', 'has_loyalty_program', false, 5),
('cat-001', 'Current e-commerce platform', 'text', 'ecommerce_platform', false, 6),
('cat-001', 'Number of retail locations', 'number', 'retail_locations', false, 7),

-- Professional Services Questions (8)
('cat-002', 'What services do you offer?', 'text', 'services_offered', true, 0),
('cat-002', 'Number of employees', 'number', 'num_employees', true, 1),
('cat-002', 'Average project value', 'number', 'avg_project_value', true, 2),
('cat-002', 'Client retention rate', 'number', 'client_retention_rate', false, 3),
('cat-002', 'Do you have recurring revenue?', 'boolean', 'has_recurring_revenue', false, 4),
('cat-002', 'Primary customer base', 'text', 'primary_customer_base', false, 5),
('cat-002', 'Typical project duration', 'text', 'project_duration', false, 6),
('cat-002', 'Years of industry experience', 'number', 'years_experience', false, 7),

-- Healthcare & Wellness Questions (8)
('cat-003', 'Type of healthcare provider', 'multiple_choice', 'provider_type', true, 0),
('cat-003', 'Number of practitioners', 'number', 'num_practitioners', true, 1),
('cat-003', 'Patient capacity per month', 'number', 'patient_capacity', true, 2),
('cat-003', 'Certifications and licenses', 'text', 'certifications', true, 3),
('cat-003', 'Do you accept insurance?', 'boolean', 'accepts_insurance', false, 4),
('cat-003', 'Average patient lifetime value', 'number', 'patient_ltv', false, 5),
('cat-003', 'Telehealth capabilities', 'boolean', 'has_telehealth', false, 6),
('cat-003', 'Patient satisfaction score', 'number', 'patient_satisfaction', false, 7),

-- Technology & Software Questions (8)
('cat-004', 'Product or service type', 'multiple_choice', 'product_type', true, 0),
('cat-004', 'Annual recurring revenue (ARR)', 'number', 'arr', true, 1),
('cat-004', 'Number of active users/customers', 'number', 'active_customers', true, 2),
('cat-004', 'Customer churn rate', 'number', 'churn_rate', false, 3),
('cat-004', 'Primary technology stack', 'text', 'tech_stack', false, 4),
('cat-004', 'Customer acquisition cost', 'number', 'cac', false, 5),
('cat-004', 'Does your SaaS have an API?', 'boolean', 'has_api', false, 6),
('cat-004', 'Data security certifications', 'text', 'security_certs', false, 7),

-- Education & Training Questions (8)
('cat-005', 'Primary subject area', 'text', 'subject_area', true, 0),
('cat-005', 'Number of students/learners', 'number', 'num_students', true, 1),
('cat-005', 'Average course price', 'number', 'avg_course_price', true, 2),
('cat-005', 'Learning platform used', 'text', 'learning_platform', false, 3),
('cat-005', 'Completion rate', 'number', 'completion_rate', false, 4),
('cat-005', 'Teaching/coaching credentials', 'text', 'credentials', true, 5),
('cat-005', 'Does offering certificates?', 'boolean', 'offers_certificates', false, 6),
('cat-005', 'Student satisfaction rating', 'number', 'satisfaction_rating', false, 7),

-- Hospitality & Travel Questions (8)
('cat-006', 'Type of hospitality business', 'multiple_choice', 'business_type', true, 0),
('cat-006', 'Number of rooms/beds/seats', 'number', 'capacity', true, 1),
('cat-006', 'Average occupancy rate', 'number', 'occupancy_rate', false, 2),
('cat-006', 'Average daily rate (ADR)', 'number', 'adr', false, 3),
('cat-006', 'Operating since (year)', 'number', 'operating_since', false, 4),
('cat-006', 'Number of staff members', 'number', 'num_staff', true, 5),
('cat-006', 'Booking system used', 'text', 'booking_system', false, 6),
('cat-006', 'Guest satisfaction rating', 'number', 'guest_rating', false, 7),

-- Real Estate & Property Questions (8)
('cat-007', 'Type of real estate service', 'multiple_choice', 'service_type', true, 0),
('cat-007', 'Number of licensed agents', 'number', 'num_agents', true, 1),
('cat-007', 'Properties under management', 'number', 'properties_managed', false, 2),
('cat-007', 'Average transaction value', 'number', 'avg_transaction_value', false, 3),
('cat-007', 'Market served (geographic area)', 'text', 'market_area', true, 4),
('cat-007', 'Years in real estate', 'number', 'years_in_business', false, 5),
('cat-007', 'MLS system used', 'text', 'mls_system', false, 6),
('cat-007', 'Average days on market', 'number', 'avg_days_on_market', false, 7),

-- Manufacturing & Production Questions (8)
('cat-008', 'Primary product manufactured', 'text', 'primary_product', true, 0),
('cat-008', 'Annual production capacity (units)', 'number', 'production_capacity', true, 1),
('cat-008', 'Number of production employees', 'number', 'production_employees', true, 2),
('cat-008', 'Quality certifications', 'text', 'quality_certs', false, 3),
('cat-008', 'Average lead time', 'text', 'avg_lead_time', false, 4),
('cat-008', 'Major customers/clients', 'text', 'major_customers', false, 5),
('cat-008', 'Automation level (% of processes)', 'number', 'automation_level', false, 6),
('cat-008', 'Operating margins', 'number', 'operating_margin', false, 7),

-- Transportation & Logistics Questions (8)
('cat-009', 'Type of transportation service', 'multiple_choice', 'service_type', true, 0),
('cat-009', 'Fleet size (number of vehicles)', 'number', 'fleet_size', true, 1),
('cat-009', 'Annual shipments/deliveries', 'number', 'annual_shipments', false, 2),
('cat-009', 'Geographic coverage area', 'text', 'coverage_area', true, 3),
('cat-009', 'Average delivery time', 'text', 'avg_delivery_time', false, 4),
('cat-009', 'Tracking system used', 'text', 'tracking_system', false, 5),
('cat-009', 'Customer satisfaction rating', 'number', 'satisfaction_rating', false, 6),
('cat-009', 'On-time delivery rate', 'number', 'on_time_rate', false, 7),

-- Finance & Insurance Questions (8)
('cat-010', 'Type of financial service', 'multiple_choice', 'service_type', true, 0),
('cat-010', 'Assets under management', 'number', 'aum', false, 1),
('cat-010', 'Number of clients', 'number', 'num_clients', true, 2),
('cat-010', 'Average client portfolio value', 'number', 'avg_portfolio_value', false, 3),
('cat-010', 'Professional licenses/certifications', 'text', 'licenses', true, 4),
('cat-010', 'Investment focus areas', 'text', 'investment_focus', false, 5),
('cat-010', 'Client retention rate', 'number', 'retention_rate', false, 6),
('cat-010', 'Years in financial services', 'number', 'years_experience', false, 7)
ON CONFLICT (category_id, field_key) DO NOTHING;

-- ============================================================================
-- SEED: Templates (18 templates with configurations)
-- ============================================================================

INSERT INTO public.templates (category_id, name, slug, description, template_type, configuration, conditions, actions, priority, is_active)
VALUES
-- Retail & E-Commerce Templates (2)
('cat-001', 'Customer Segmentation Workflow', 'customer-segmentation', 'Automatically segment customers based on purchase behavior', 'workflow',
  '{"segment_criteria": ["recency", "frequency", "monetary"], "frequency_days": 30}'::jsonb,
  '{"min_transactions": 1, "min_revenue": 100}'::jsonb,
  '{"create_segments": true, "notify_team": true}'::jsonb,
  100, true),
('cat-001', 'Inventory Management Automation', 'inventory-management', 'Automate low stock alerts and reorder processes', 'automation',
  '{"reorder_point_percent": 20, "auto_reorder": true}'::jsonb,
  '{"stock_threshold": "below_20_percent"}'::jsonb,
  '{"send_alert": true, "create_purchase_order": true}'::jsonb,
  95, true),

-- Professional Services Templates (2)
('cat-002', 'Project Status Dashboard', 'project-dashboard', 'Real-time project tracking and status updates', 'dashboard',
  '{"refresh_interval": 300, "metrics": ["budget", "timeline", "resources"]}'::jsonb,
  '{"active_projects": true}'::jsonb,
  '{"generate_report": true, "notify_stakeholders": true}'::jsonb,
  90, true),
('cat-002', 'Client Onboarding Automation', 'client-onboarding', 'Streamlined client onboarding workflow', 'automation',
  '{"steps": 5, "template_docs": true, "auto_send_forms": true}'::jsonb,
  '{"new_client": true}'::jsonb,
  '{"send_welcome_email": true, "create_project_file": true, "schedule_kickoff": true}'::jsonb,
  100, true),

-- Healthcare & Wellness Templates (2)
('cat-003', 'Patient Engagement Program', 'patient-engagement', 'Automated patient follow-up and engagement', 'automation',
  '{"reminder_frequency": "weekly", "survey_enabled": true}'::jsonb,
  '{"patient_status": "active"}'::jsonb,
  '{"send_reminder": true, "collect_feedback": true}'::jsonb,
  85, true),
('cat-003', 'Wellness Metrics Tracker', 'wellness-metrics', 'Track and visualize patient wellness metrics', 'analysis',
  '{"metrics": ["vitals", "progress", "adherence"], "report_frequency": "weekly"}'::jsonb,
  '{"tracking_enabled": true}'::jsonb,
  '{"generate_metrics": true, "send_report": true}'::jsonb,
  80, true),

-- Technology & Software Templates (2)
('cat-004', 'SaaS Customer Health Score', 'saas-health-score', 'Calculate and track customer health scores', 'analysis',
  '{"scoring_model": "weighted", "factors": ["usage", "support_tickets", "expansion"]}'::jsonb,
  '{"active_subscription": true}'::jsonb,
  '{"calculate_score": true, "flag_at_risk": true, "notify_success": true}'::jsonb,
  95, true),
('cat-004', 'Feature Rollout Automation', 'feature-rollout', 'Automated feature rollout and user communication', 'automation',
  '{"rollout_stages": 3, "percentage_increase": 25}'::jsonb,
  '{"new_feature_ready": true}'::jsonb,
  '{"send_notification": true, "track_adoption": true}'::jsonb,
  90, true),

-- Education & Training Templates (2)
('cat-005', 'Course Progress Tracking', 'course-progress', 'Automated student progress monitoring', 'automation',
  '{"alert_threshold": 30, "completion_target": 100}'::jsonb,
  '{"course_active": true}'::jsonb,
  '{"send_progress_alert": true, "suggest_resources": true}'::jsonb,
  85, true),
('cat-005', 'Certification Management', 'certification-management', 'Manage student certifications and credentials', 'workflow',
  '{"auto_issue_certs": true, "expiry_years": 2}'::jsonb,
  '{"course_completed": true}'::jsonb,
  '{"issue_certificate": true, "send_credential": true}'::jsonb,
  80, true),

-- Hospitality & Travel Templates (2)
('cat-006', 'Guest Experience Optimization', 'guest-experience', 'Enhance guest experience with automated workflows', 'workflow',
  '{"pre_arrival_days": 7, "feedback_timing": "post_checkout"}'::jsonb,
  '{"reservation_confirmed": true}'::jsonb,
  '{"send_welcome": true, "arrange_transfers": true, "collect_feedback": true}'::jsonb,
  85, true),
('cat-006', 'Revenue Management Automation', 'revenue-management', 'Optimize pricing and occupancy', 'automation',
  '{"demand_based_pricing": true, "min_adr_adjustment": -5}'::jsonb,
  '{"demand_level": "high"}'::jsonb,
  '{"adjust_rates": true, "send_promotions": true}'::jsonb,
  90, true),

-- Real Estate & Property Templates (2)
('cat-007', 'Lead Management Pipeline', 'lead-management', 'Automated real estate lead management', 'workflow',
  '{"scoring_model": true, "auto_follow_up": true}'::jsonb,
  '{"new_lead": true}'::jsonb,
  '{"send_initial_email": true, "schedule_followup": true, "assign_agent": true}'::jsonb,
  95, true),
('cat-007', 'Property Marketing Automation', 'property-marketing', 'Automated property listing and marketing', 'automation',
  '{"multichannel": true, "auto_mls": true}'::jsonb,
  '{"new_listing": true}'::jsonb,
  '{"post_to_mls": true, "create_ads": true, "send_notifications": true}'::jsonb,
  90, true),

-- Manufacturing & Production Templates (2)
('cat-008', 'Quality Control Automation', 'quality-control', 'Automated quality monitoring and alerts', 'automation',
  '{"sampling_rate": 5, "defect_threshold": 2}'::jsonb,
  '{"production_active": true}'::jsonb,
  '{"run_qc_test": true, "log_results": true, "alert_if_needed": true}'::jsonb,
  100, true),
('cat-008', 'Maintenance Schedule Optimization', 'maintenance-schedule', 'Predictive maintenance scheduling', 'automation',
  '{"predictive_enabled": true, "maintenance_window": "night_shift"}'::jsonb,
  '{"equipment_age": "threshold_reached"}'::jsonb,
  '{"schedule_maintenance": true, "notify_team": true, "order_parts": true}'::jsonb,
  85, true),

-- Transportation & Logistics Templates (2)
('cat-009', 'Route Optimization Engine', 'route-optimization', 'Automatic route optimization and dispatch', 'automation',
  '{"optimization_model": "dynamic", "real_time": true}'::jsonb,
  '{"delivery_ready": true}'::jsonb,
  '{"calculate_route": true, "assign_driver": true, "send_instruction": true}'::jsonb,
  95, true),
('cat-009', 'Customer Tracking & Notifications', 'tracking-notifications', 'Real-time delivery tracking and customer updates', 'workflow',
  '{"notification_frequency": "realtime", "tracking_enabled": true}'::jsonb,
  '{"shipment_in_transit": true}'::jsonb,
  '{"track_location": true, "send_update": true}'::jsonb,
  90, true),

-- Finance & Insurance Templates (2)
('cat-010', 'Portfolio Rebalancing Automation', 'portfolio-rebalancing', 'Automated portfolio rebalancing based on targets', 'automation',
  '{"rebalance_threshold": 5, "frequency": "quarterly"}'::jsonb,
  '{"allocation_drift": "above_threshold"}'::jsonb,
  '{"execute_rebalance": true, "notify_client": true, "log_transaction": true}'::jsonb,
  85, true),
('cat-010', 'Compliance Report Generation', 'compliance-reporting', 'Automated compliance and regulatory reporting', 'automation',
  '{"report_frequency": "monthly", "auto_submit": true}'::jsonb,
  '{"reporting_period_end": true}'::jsonb,
  '{"generate_report": true, "submit_to_regulator": true, "notify_team": true}'::jsonb,
  90, true)
ON CONFLICT (category_id, slug) DO NOTHING;

-- ============================================================================
-- SEED: Template Behaviors (54 behaviors - ~3 per template)
-- ============================================================================

-- Behaviors for Customer Segmentation Template (cat-001, slug: customer-segmentation)
INSERT INTO public.template_behaviors (template_id, behavior_name, behavior_type, implementation, execution_order)
VALUES
((SELECT id FROM public.templates WHERE slug = 'customer-segmentation' LIMIT 1), 'Extract Customer Data', 'trigger',
  '{"source": "database", "query": "SELECT * FROM customers WHERE last_transaction > now() - interval 30 days"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'customer-segmentation' LIMIT 1), 'Apply Segmentation Logic', 'action',
  '{"algorithm": "rfm_analysis", "create_tags": true}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'customer-segmentation' LIMIT 1), 'Send Segment Notification', 'notification',
  '{"template": "segment_assignment", "recipients": "team"}'::jsonb, 2),

-- Behaviors for Inventory Management Template
((SELECT id FROM public.templates WHERE slug = 'inventory-management' LIMIT 1), 'Monitor Stock Levels', 'trigger',
  '{"event": "stock_update", "check_frequency": "hourly"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'inventory-management' LIMIT 1), 'Generate Reorder', 'action',
  '{"create_po": true, "supplier_selection": "automatic"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'inventory-management' LIMIT 1), 'Alert Team', 'notification',
  '{"channel": "email_sms", "recipients": ["manager", "procurement"]}'::jsonb, 2),

-- Behaviors for Project Status Dashboard Template
((SELECT id FROM public.templates WHERE slug = 'project-dashboard' LIMIT 1), 'Fetch Project Data', 'trigger',
  '{"source": "project_management_system", "interval": "5_minutes"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'project-dashboard' LIMIT 1), 'Aggregate Metrics', 'action',
  '{"metrics": ["spent_budget", "completion_percent", "timeline_variance"]}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'project-dashboard' LIMIT 1), 'Update Dashboard', 'action',
  '{"target": "dashboard_ui", "format": "real_time"}'::jsonb, 2),

-- Behaviors for Client Onboarding Template
((SELECT id FROM public.templates WHERE slug = 'client-onboarding' LIMIT 1), 'Receive New Client', 'trigger',
  '{"event": "client_created"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'client-onboarding' LIMIT 1), 'Send Documents', 'action',
  '{"documents": ["nda", "statement_of_work", "onboarding_form"]}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'client-onboarding' LIMIT 1), 'Schedule Kickoff Meeting', 'action',
  '{"calendar": "shared", "duration_minutes": 60}'::jsonb, 2),

-- Behaviors for Patient Engagement Program Template
((SELECT id FROM public.templates WHERE slug = 'patient-engagement' LIMIT 1), 'Check Patient Status', 'trigger',
  '{"schedule": "weekly", "filter": "active_patients"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'patient-engagement' LIMIT 1), 'Send Engagement Message', 'action',
  '{"message_type": "reminder", "channel": "email_sms"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'patient-engagement' LIMIT 1), 'Collect Feedback', 'action',
  '{"survey_template": "satisfaction", "response_tracking": true}'::jsonb, 2),

-- Behaviors for Wellness Metrics Tracker
((SELECT id FROM public.templates WHERE slug = 'wellness-metrics' LIMIT 1), 'Collect Wellness Data', 'trigger',
  '{"source": "patient_records", "data_types": ["vitals", "appointments", "adherence"]}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'wellness-metrics' LIMIT 1), 'Generate Report', 'action',
  '{"report_type": "weekly_summary", "charts": true}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'wellness-metrics' LIMIT 1), 'Distribute Report', 'notification',
  '{"recipients": ["patient", "provider"], "format": "pdf"}'::jsonb, 2),

-- Behaviors for SaaS Customer Health Score
((SELECT id FROM public.templates WHERE slug = 'saas-health-score' LIMIT 1), 'Extract Customer Usage', 'trigger',
  '{"event": "daily_rollup", "metrics": ["logins", "features_used", "api_calls"]}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'saas-health-score' LIMIT 1), 'Calculate Health Score', 'action',
  '{"weights": {"usage": 0.4, "support": 0.3, "expansion": 0.3}}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'saas-health-score' LIMIT 1), 'Flag At-Risk Accounts', 'action',
  '{"threshold": 50, "notify_account_manager": true}'::jsonb, 2),

-- Behaviors for Feature Rollout Automation
((SELECT id FROM public.templates WHERE slug = 'feature-rollout' LIMIT 1), 'Get Feature Ready', 'trigger',
  '{"event": "feature_approved"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'feature-rollout' LIMIT 1), 'Stage Feature Rollout', 'action',
  '{"stages": [{"percent": 25}, {"percent": 50}, {"percent": 100}], "interval_hours": 24}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'feature-rollout' LIMIT 1), 'Track Adoption Metrics', 'action',
  '{"metrics": ["adoption_rate", "error_rate", "user_feedback"]}'::jsonb, 2),

-- Behaviors for Course Progress Tracking
((SELECT id FROM public.templates WHERE slug = 'course-progress' LIMIT 1), 'Monitor Student Progress', 'trigger',
  '{"event": "course_module_completed", "check_frequency": "daily"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'course-progress' LIMIT 1), 'Identify At-Risk Students', 'action',
  '{"risk_threshold": 30, "days_behind": 3}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'course-progress' LIMIT 1), 'Send Support Message', 'notification',
  '{"template": "student_support", "resources": "curated"}'::jsonb, 2),

-- Behaviors for Certification Management
((SELECT id FROM public.templates WHERE slug = 'certification-management' LIMIT 1), 'Check Course Completion', 'trigger',
  '{"event": "final_exam_passed"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'certification-management' LIMIT 1), 'Issue Certificate', 'action',
  '{"format": "digital_pdf", "register_credential": true}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'certification-management' LIMIT 1), 'Send Credential', 'notification',
  '{"delivery": "email_download_link", "social_sharing": true}'::jsonb, 2),

-- Behaviors for Guest Experience Optimization
((SELECT id FROM public.templates WHERE slug = 'guest-experience' LIMIT 1), 'Process Reservation', 'trigger',
  '{"event": "booking_confirmed"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'guest-experience' LIMIT 1), 'Arrange Pre-Arrival Service', 'action',
  '{"services": ["airport_transfer", "room_preferences", "dining_reservations"]}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'guest-experience' LIMIT 1), 'Collect Post-Stay Feedback', 'action',
  '{"timing": "checkout", "feedback_type": "satisfaction_survey"}'::jsonb, 2),

-- Behaviors for Revenue Management Automation
((SELECT id FROM public.templates WHERE slug = 'revenue-management' LIMIT 1), 'Analyze Demand', 'trigger',
  '{"event": "booking_activity", "frequency": "every_4_hours"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'revenue-management' LIMIT 1), 'Adjust Pricing', 'action',
  '{"algorithm": "demand_based", "price_limits": {"min": -10, "max": 30}}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'revenue-management' LIMIT 1), 'Promote Availability', 'notification',
  '{"channel": "email_social", "offer_type": "last_minute_deals"}'::jsonb, 2),

-- Behaviors for Lead Management Pipeline
((SELECT id FROM public.templates WHERE slug = 'lead-management' LIMIT 1), 'Capture New Lead', 'trigger',
  '{"event": "lead_submitted", "source": "website_form"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'lead-management' LIMIT 1), 'Score Lead', 'action',
  '{"criteria": ["property_interest", "timeline", "budget"], "assignment": "auto_route"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'lead-management' LIMIT 1), 'Send Initial Contact', 'notification',
  '{"template": "lead_welcome", "assign_agent": true}'::jsonb, 2),

-- Behaviors for Property Marketing Automation
((SELECT id FROM public.templates WHERE slug = 'property-marketing' LIMIT 1), 'Process New Listing', 'trigger',
  '{"event": "listing_created"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'property-marketing' LIMIT 1), 'Distribute to MLS', 'action',
  '{"mls_systems": ["all_active"], "photo_processing": "hdr_enhanced"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'property-marketing' LIMIT 1), 'Create Marketing Campaign', 'action',
  '{"channels": ["social_media", "email", "advertising"], "budget": "dynamic"}'::jsonb, 2),

-- Behaviors for Quality Control Automation
((SELECT id FROM public.templates WHERE slug = 'quality-control' LIMIT 1), 'Sample Production', 'trigger',
  '{"event": "unit_produced", "sampling": "every_20_units"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'quality-control' LIMIT 1), 'Run QC Tests', 'action',
  '{"tests": ["dimensional", "visual", "functional"], "automated": true}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'quality-control' LIMIT 1), 'Alert on Defects', 'notification',
  '{"threshold": 2, "recipients": ["qc_lead", "production_manager"]}'::jsonb, 2),

-- Behaviors for Maintenance Schedule Optimization
((SELECT id FROM public.templates WHERE slug = 'maintenance-schedule' LIMIT 1), 'Monitor Equipment', 'trigger',
  '{"event": "equipment_metrics", "frequency": "real_time"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'maintenance-schedule' LIMIT 1), 'Predict Maintenance Need', 'action',
  '{"model": "predictive_analytics", "lead_time_days": 5}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'maintenance-schedule' LIMIT 1), 'Schedule Maintenance', 'action',
  '{"scheduling": "off_peak", "parts_ordering": "automatic"}'::jsonb, 2),

-- Behaviors for Route Optimization Engine
((SELECT id FROM public.templates WHERE slug = 'route-optimization' LIMIT 1), 'Receive Delivery Orders', 'trigger',
  '{"event": "delivery_ready", "consolidation": "batch"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'route-optimization' LIMIT 1), 'Calculate Optimal Routes', 'action',
  '{"algorithm": "dynamic_programming", "factors": ["distance", "traffic", "time_windows"]}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'route-optimization' LIMIT 1), 'Assign and Dispatch', 'notification',
  '{"driver_notification": "app_sms", "vehicle_routing": "real_time"}'::jsonb, 2),

-- Behaviors for Customer Tracking & Notifications
((SELECT id FROM public.templates WHERE slug = 'tracking-notifications' LIMIT 1), 'Track Shipment', 'trigger',
  '{"event": "shipment_in_transit", "gps_frequency": "every_minute"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'tracking-notifications' LIMIT 1), 'Generate Location Updates', 'action',
  '{"milestones": ["picked_up", "in_transit", "out_for_delivery", "delivered"]}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'tracking-notifications' LIMIT 1), 'Send Customer Updates', 'notification',
  '{"channels": ["sms", "email", "push_notification"], "frequency": "milestone"}'::jsonb, 2),

-- Behaviors for Portfolio Rebalancing Automation
((SELECT id FROM public.templates WHERE slug = 'portfolio-rebalancing' LIMIT 1), 'Monitor Portfolio Allocation', 'trigger',
  '{"event": "market_close", "frequency": "daily"}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'portfolio-rebalancing' LIMIT 1), 'Check Drift', 'action',
  '{"threshold_percent": 5, "calculation": "current_vs_target"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'portfolio-rebalancing' LIMIT 1), 'Execute Rebalancing', 'action',
  '{"trading": "automated", "settlement": "standard", "cost_optimization": true}'::jsonb, 2),

-- Behaviors for Compliance Report Generation
((SELECT id FROM public.templates WHERE slug = 'compliance-reporting' LIMIT 1), 'Gather Data', 'trigger',
  '{"event": "period_end", "data_sources": ["transactions", "accounts", "trades"]}'::jsonb, 0),
((SELECT id FROM public.templates WHERE slug = 'compliance-reporting' LIMIT 1), 'Generate Report', 'action',
  '{"template": "regulatory_report", "format": "xml_json", "validation": "strict"}'::jsonb, 1),
((SELECT id FROM public.templates WHERE slug = 'compliance-reporting' LIMIT 1), 'Submit and Archive', 'action',
  '{"submission": "automated", "archive": "encrypted", "audit_trail": true}'::jsonb, 2)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED: Template Analytics - Set initial analytics data
-- ============================================================================

INSERT INTO public.template_analytics (template_id, metric_date, total_applications, successful_executions, failed_executions, average_duration_ms, user_satisfaction)
SELECT t.id, CURRENT_DATE, 0, 0, 0, 0, NULL
FROM public.templates t
WHERE NOT EXISTS (SELECT 1 FROM public.template_analytics WHERE template_id = t.id AND metric_date = CURRENT_DATE)
ON CONFLICT (template_id, metric_date) DO NOTHING;

-- Seed Data for Feature Marketplace
-- Creates sample features, templates, categories, and feature requests

-- 1. Feature Categories
INSERT INTO feature_categories (name, description, icon, order) VALUES
  ('E-Commerce', 'Features for online stores and product sellers', '🛍️', 1),
  ('Services', 'Features for service providers and consultants', '🔧', 2),
  ('Marketplace', 'Features for multi-vendor platforms and auctions', '🏪', 3),
  ('B2B & Digital', 'Features for SaaS and subscription platforms', '💼', 4),
  ('Growth & Marketing', 'Features for lead generation and automation', '📈', 5),
  ('Integrations', 'Third-party integrations and connectors', '🔗', 6)
ON CONFLICT DO NOTHING;

-- 2. Sample Features for E-Commerce
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('product-catalog', 'Product Catalog', 'Digital product showcase with search and filtering', 'Create and manage a beautiful product catalog with photos, descriptions, pricing, and inventory tracking. Includes advanced search, filters, and recommendations.', 'E-Commerce', '📦', 'active', 29.00, 5.00, '{"ecommerce": 95, "services": 30, "marketplace": 40, "b2b": 20}', '["ProductGrid", "ProductCard", "ProductDetail", "ProductSearch"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "premium"}'),
  ('inventory-management', 'Inventory Management', 'Track stock levels across locations', 'Real-time inventory tracking with low-stock alerts, multi-warehouse support, and automatic reordering. Includes barcode scanning and SKU management.', 'E-Commerce', '📊', 'active', 49.00, 10.00, '{"ecommerce": 85, "services": 20, "marketplace": 50, "b2b": 40}', '["InventoryDashboard", "StockLevel", "LowStockAlert", "WarehouseManager"]', '["product-catalog"]', '{"api_endpoints": 5, "webhooks": 3, "support_level": "premium"}'),
  ('multi-currency-pricing', 'Multi-Currency Pricing', 'Support customers worldwide with local pricing', 'Automatically convert prices to 150+ currencies with real-time exchange rates. Show customers prices in their local currency.', 'E-Commerce', '💱', 'active', 39.00, 0.00, '{"ecommerce": 80, "services": 10, "marketplace": 30, "b2b": 50}', '["CurrencySelector", "PricingDisplay", "ExchangeRateSync"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "standard"}'),
  ('digital-product-delivery', 'Digital Product Delivery', 'Instant delivery of digital products after purchase', 'Automatically deliver digital products (ebooks, software, courses) immediately after purchase. Support file encryption and expiring links.', 'E-Commerce', '📥', 'active', 29.00, 3.00, '{"ecommerce": 75, "services": 20, "marketplace": 30, "b2b": 60}', '["DeliveryTracker", "FileManager", "ExpiringLinks"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "standard"}'),
  ('flash-sales-promotions', 'Flash Sales & Promotions', 'Run time-limited promotions and flash sales', 'Create limited-time offers with countdown timers, stock limits, and automatic ending. Includes promotion scheduling and analytics.', 'E-Commerce', '⚡', 'active', 39.00, 0.00, '{"ecommerce": 70, "services": 15, "marketplace": 40, "b2b": 20}', '["SaleCountdown", "PromoCode", "SaleAnalytics"]', '["product-catalog"]', '{"api_endpoints": 2, "webhooks": 2, "support_level": "standard"}'),
  ('customer-reviews-ratings', 'Customer Reviews & Ratings', 'Build social proof with verified reviews', 'Collect and display customer reviews with photo support, verified badges, and moderation tools. Includes star ratings and helpful voting.', 'E-Commerce', '⭐', 'active', 19.00, 2.00, '{"ecommerce": 85, "services": 80, "marketplace": 70, "b2b": 30}', '["ReviewDisplay", "RatingStars", "ReviewForm", "ModerationQueue"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "standard"}'),
  ('wishlist-favorites', 'Wishlist & Favorites', 'Let customers save products for later', 'Enable customers to create wish lists and save favorite products. Share lists with friends and get notified when items go on sale.', 'E-Commerce', '❤️', 'active', 9.00, 0.00, '{"ecommerce": 65, "services": 10, "marketplace": 40, "b2b": 10}', '["WishlistButton", "WishlistPage", "ShareWishlist"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "basic"}'),
  ('gift-cards-system', 'Gift Cards System', 'Sell and manage digital gift cards', 'Create, sell, and track digital gift cards. Support custom amounts, redemption tracking, and partial redemptions.', 'E-Commerce', '🎁', 'beta', 29.00, 0.00, '{"ecommerce": 60, "services": 20, "marketplace": 30, "b2b": 40}', '["GiftCardGenerator", "RedemptionTracker", "BalanceChecker"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "standard"}')
ON CONFLICT (slug) DO NOTHING;

-- 3. Sample Features for Services
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('appointment-scheduling', 'Appointment Scheduling', 'Online booking system for services', 'Customers can book appointments online. Support time slots, automatic confirmations, reminders via email/SMS, and calendar integration.', 'Services', '📅', 'active', 39.00, 8.00, '{"ecommerce": 10, "services": 95, "marketplace": 20, "b2b": 40}', '["CalendarWidget", "BookingForm", "TimeSlotPicker", "AvailabilityManager"]', '[]', '{"api_endpoints": 4, "webhooks": 3, "support_level": "premium"}'),
  ('team-member-management', 'Team Member Management', 'Manage team availability and assignments', 'Invite team members, manage their availability, assign appointments, and track their workload. Support role-based access.', 'Services', '👥', 'active', 29.00, 5.00, '{"ecommerce": 10, "services": 85, "marketplace": 30, "b2b": 50}', '["TeamDirectory", "AvailabilityCalendar", "AssignmentQueue"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "standard"}'),
  ('geo-fencing', 'Geo-Fencing Service Radius', 'Show services only to customers in your area', 'Define service areas and only show services to customers within range. Support radius-based or custom polygon areas.', 'Services', '📍', 'active', 49.00, 0.00, '{"ecommerce": 5, "services": 75, "marketplace": 20, "b2b": 10}', '["ServiceAreaMap", "GeofenceConfig", "CustomerLocator"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "premium"}'),
  ('service-packages', 'Custom Service Packages', 'Bundle services with custom pricing', 'Create service packages that combine multiple services with custom duration and pricing. Support add-ons and optional extras.', 'Services', '📦', 'active', 19.00, 3.00, '{"ecommerce": 20, "services": 70, "marketplace": 30, "b2b": 40}', '["PackageBuilder", "PackageCard", "AddOnManager"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "standard"}'),
  ('service-ratings-reviews', 'Service Ratings & Reviews', 'Build trust with customer testimonials', 'Collect verified reviews from completed services. Display ratings and testimonials on your profile. Moderate and respond to reviews.', 'Services', '⭐', 'active', 19.00, 2.00, '{"ecommerce": 20, "services": 80, "marketplace": 50, "b2b": 20}', '["ReviewDisplay", "RatingStars", "ReviewForm"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "standard"}'),
  ('booking-deposits', 'Booking Deposits', 'Collect upfront deposits for services', 'Require deposits or full payment upfront for bookings. Support refundable deposits, partial payments, and cancellation policies.', 'Services', '💳', 'active', 29.00, 0.00, '{"ecommerce": 20, "services": 75, "marketplace": 40, "b2b": 50}', '["DepositCalculator", "PaymentCollector", "RefundManager"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "premium"}')
ON CONFLICT (slug) DO NOTHING;

-- 4. Sample Features for Marketplace
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('vendor-onboarding', 'Vendor Onboarding', 'Streamlined seller registration process', 'Easy vendor signup with verification, bank account setup, and compliance checks. Support document uploads and identity verification.', 'Marketplace', '📝', 'active', 49.00, 0.00, '{"ecommerce": 30, "services": 20, "marketplace": 95, "b2b": 40}', '["OnboardingWizard", "DocumentUpload", "VerificationStatus"]', '[]', '{"api_endpoints": 5, "webhooks": 3, "support_level": "premium"}'),
  ('commission-tracking', 'Commission Tracking', 'Automated commission calculation and payouts', 'Automatically calculate commissions, manage payout schedules, and generate payment reports. Support tiered commission rates.', 'Marketplace', '💰', 'active', 79.00, 0.00, '{"ecommerce": 40, "services": 30, "marketplace": 90, "b2b": 60}', '["CommissionDashboard", "PayoutScheduler", "ReportGenerator"]', '[]', '{"api_endpoints": 4, "webhooks": 3, "support_level": "premium"}'),
  ('dispute-resolution', 'Dispute Resolution System', 'Fair handling of buyer-seller conflicts', 'Manage disputes between buyers and sellers with mediation tools, evidence collection, and fair judgment system. Support appeals.', 'Marketplace', '⚖️', 'active', 59.00, 0.00, '{"ecommerce": 30, "services": 40, "marketplace": 85, "b2b": 20}', '["DisputeTracker", "EvidenceUpload", "MediationChat"]', '[]', '{"api_endpoints": 4, "webhooks": 2, "support_level": "premium"}'),
  ('vendor-analytics', 'Vendor Analytics Dashboard', 'Sales and performance tracking for sellers', 'Vendors can see their sales, traffic, conversion rates, and customer feedback. Support custom date ranges and export to CSV.', 'Marketplace', '📊', 'active', 29.00, 0.00, '{"ecommerce": 30, "services": 20, "marketplace": 80, "b2b": 40}', '["AnalyticsDashboard", "ChartWidget", "ReportBuilder"]', '[]', '{"api_endpoints": 3, "webhooks": 1, "support_level": "standard"}'),
  ('auction-system', 'Auction System', 'English and Dutch auction formats', 'Run auctions with automatic bidding, auction scheduling, and winner notifications. Support multiple auction types.', 'Marketplace', '🏆', 'active', 99.00, 0.00, '{"ecommerce": 40, "services": 10, "marketplace": 90, "b2b": 20}', '["AuctionTimer", "BidTracker", "WinnerNotifier"]', '[]', '{"api_endpoints": 5, "webhooks": 4, "support_level": "premium"}'),
  ('verification-badges', 'Vendor Verification Badges', 'Build trust with verified seller status', 'Award verification badges to trusted vendors. Support multiple badge types (verified, top-rated, fast-shipping, etc.).', 'Marketplace', '✅', 'active', 19.00, 0.00, '{"ecommerce": 20, "services": 30, "marketplace": 75, "b2b": 20}', '["BadgeDisplay", "BadgeManager", "TrustIndicator"]', '[]', '{"api_endpoints": 2, "webhooks": 1, "support_level": "standard"}')
ON CONFLICT (slug) DO NOTHING;

-- 5. Sample Features for B2B & Digital
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('subscription-management', 'Subscription Management', 'Recurring billing and subscription plans', 'Create subscription tiers, manage recurring billing, handle upgrades/downgrades, and cancellations. Support proration and trials.', 'B2B & Digital', '🔄', 'active', 79.00, 0.00, '{"ecommerce": 40, "services": 30, "marketplace": 30, "b2b": 95}', '["SubscriptionPlans", "BillingDashboard", "UpgradeFlow"]', '[]', '{"api_endpoints": 6, "webhooks": 4, "support_level": "premium"}'),
  ('usage-based-pricing', 'Usage-Based Pricing', 'Charge based on consumption metrics', 'Support pay-per-use pricing models. Meter usage, calculate charges, and bill customers based on actual consumption.', 'B2B & Digital', '📏', 'active', 59.00, 0.00, '{"ecommerce": 30, "services": 20, "marketplace": 20, "b2b": 85}', '["UsageMeter", "PricingCalculator", "UsageReport"]', '[]', '{"api_endpoints": 4, "webhooks": 3, "support_level": "premium"}'),
  ('api-access-webhooks', 'API Access & Webhooks', 'Enable integrations with external systems', 'Provide REST API and webhook support for integrations. Support rate limiting, API keys, and webhook management.', 'B2B & Digital', '🔌', 'active', 99.00, 0.00, '{"ecommerce": 50, "services": 30, "marketplace": 40, "b2b": 95}', '["APIKeyManager", "WebhookConfig", "DocumentationUI"]', '[]', '{"api_endpoints": 10, "webhooks": 5, "support_level": "premium"}'),
  ('team-collaboration', 'Team Collaboration Tools', 'Enable team members to work together', 'Workspace sharing, real-time collaboration, comments, and activity feeds. Support role-based access control.', 'B2B & Digital', '🤝', 'active', 39.00, 5.00, '{"ecommerce": 20, "services": 40, "marketplace": 20, "b2b": 80}', '["Workspace", "ActivityFeed", "CommentThread", "PermissionsManager"]', '[]', '{"api_endpoints": 4, "webhooks": 2, "support_level": "standard"}'),
  ('advanced-reporting', 'Advanced Reporting & Analytics', 'Custom reports and business intelligence', 'Build custom reports with drag-drop builder. Support scheduled email delivery, data export, and visualization options.', 'B2B & Digital', '📈', 'active', 69.00, 0.00, '{"ecommerce": 40, "services": 30, "marketplace": 40, "b2b": 90}', '["ReportBuilder", "Dashboard", "ExportManager", "Scheduler"]', '[]', '{"api_endpoints": 5, "webhooks": 2, "support_level": "premium"}')
ON CONFLICT (slug) DO NOTHING;

-- 6. Sample Features for Growth & Marketing
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('email-campaigns', 'Email Campaign Builder', 'Create and send email marketing campaigns', 'Drag-drop email builder with templates, segmentation, scheduling, and A/B testing. Track opens, clicks, and conversions.', 'Growth & Marketing', '📧', 'active', 49.00, 0.00, '{"ecommerce": 75, "services": 60, "marketplace": 50, "b2b": 70}', '["EmailBuilder", "TemplateLibrary", "SegmentBuilder", "AnalyticsView"]', '[]', '{"api_endpoints": 4, "webhooks": 3, "support_level": "premium"}'),
  ('lead-management', 'Lead Management CRM', 'Manage prospects and track their journey', 'Capture, organize, and track leads. Support lead scoring, deal tracking, and sales pipeline management.', 'Growth & Marketing', '👥', 'active', 39.00, 5.00, '{"ecommerce": 50, "services": 60, "marketplace": 40, "b2b": 80}', '["LeadList", "DealPipeline", "LeadScoring"]', '[]', '{"api_endpoints": 5, "webhooks": 3, "support_level": "premium"}'),
  ('automation-rules', 'Automation Rules Engine', 'Create if-then workflows automatically', 'Build automation rules without coding. Support triggers, conditions, and multi-step actions. Visual rule builder included.', 'Growth & Marketing', '🤖', 'active', 39.00, 0.00, '{"ecommerce": 60, "services": 50, "marketplace": 40, "b2b": 75}', '["RuleBuilder", "TriggerSelector", "ActionBuilder", "AutomationLogs"]', '[]', '{"api_endpoints": 4, "webhooks": 4, "support_level": "premium"}'),
  ('social-media-integration', 'Social Media Integration', 'Publish and manage social media posts', 'Connect social accounts, schedule posts, track engagement, and manage comments from one dashboard.', 'Growth & Marketing', '📱', 'active', 29.00, 0.00, '{"ecommerce": 60, "services": 50, "marketplace": 40, "b2b": 60}', '["SocialComposer", "ScheduleCalendar", "EngagementTracker"]', '[]', '{"api_endpoints": 6, "webhooks": 3, "support_level": "premium"}'),
  ('lead-scoring', 'Lead Scoring Engine', 'Automatically qualify and prioritize leads', 'Score leads based on behavior and engagement. Identify hot leads ready for sales outreach automatically.', 'Growth & Marketing', '🎯', 'active', 49.00, 0.00, '{"ecommerce": 40, "services": 50, "marketplace": 30, "b2b": 80}', '["ScoringRules", "LeadRank", "AlertSystem"]', '["lead-management"]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "standard"}'),
  ('email-tracking', 'Email Tracking & Analytics', 'See who opens and clicks your emails', 'Track email opens, link clicks, and forwarding. Get read receipts and device/location information.', 'Growth & Marketing', '👁️', 'active', 19.00, 0.00, '{"ecommerce": 70, "services": 60, "marketplace": 50, "b2b": 70}', '["TrackingDashboard", "ClickMap", "EngagementTimeline"]', '[]', '{"api_endpoints": 3, "webhooks": 2, "support_level": "standard"}')
ON CONFLICT (slug) DO NOTHING;

-- 7. Sample Features for Integrations
INSERT INTO features (slug, name, description, long_description, category, icon, status, base_price_monthly, additional_seats_price, relevant_for, components, dependencies, metadata) VALUES
  ('webhook-connector', 'Webhook Connector', 'Integrate with external apps via webhooks', 'Send real-time data to other apps. Receive webhooks to trigger actions. Full webhook management and testing tools.', 'Integrations', '🪝', 'active', 0.00, 0.00, '{"ecommerce": 70, "services": 50, "marketplace": 60, "b2b": 85}', '["WebhookConfig", "TestTools", "LogViewer"]', '[]', '{"api_endpoints": 3, "webhooks": 5, "support_level": "standard"}'),
  ('stripe-payment', 'Stripe Payment Processing', 'Accept credit card payments securely', 'Accept payments via Stripe. Support recurring billing, subscriptions, and payment splitting.', 'Integrations', '💳', 'active', 0.00, 0.00, '{"ecommerce": 95, "services": 70, "marketplace": 85, "b2b": 90}', '["PaymentWidget", "BillingDashboard"]', '[]', '{"api_endpoints": 4, "webhooks": 3, "support_level": "premium"}'),
  ('slack-notifications', 'Slack Notifications', 'Get alerts and updates in Slack', 'Receive real-time notifications in your Slack workspace when orders, leads, or events happen.', 'Integrations', '💬', 'active', 0.00, 0.00, '{"ecommerce": 60, "services": 50, "marketplace": 60, "b2b": 70}', '["SlackConfig", "NotificationBuilder"]', '[]', '{"api_endpoints": 2, "webhooks": 2, "support_level": "standard"}'),
  ('google-analytics', 'Google Analytics Integration', 'Track visitors and conversions with GA', 'Deep integration with Google Analytics. Track events, goals, and conversions. View reports directly in dashboard.', 'Integrations', '📊', 'active', 0.00, 0.00, '{"ecommerce": 80, "services": 60, "marketplace": 70, "b2b": 70}', '["AnalyticsWidget", "EventTracker"]', '[]', '{"api_endpoints": 2, "webhooks": 0, "support_level": "standard"}'),
  ('zapier-integration', 'Zapier Automation', 'Connect to 5000+ apps without coding', 'Use Zapier to connect with thousands of apps. Create multi-app workflows without writing code.', 'Integrations', '⚡', 'coming_soon', 0.00, 0.00, '{"ecommerce": 70, "services": 60, "marketplace": 60, "b2b": 80}', '["ZapierConnector", "WorkflowBuilder"]', '[]', '{"api_endpoints": 1, "webhooks": 1, "support_level": "basic"}')
ON CONFLICT (slug) DO NOTHING;

-- 8. Feature Templates (Pre-built Bundles)
INSERT INTO feature_templates (name, description, for_business_type, feature_ids, icon, monthly_price, is_popular, metadata) VALUES
  ('E-Commerce Starter', 'Essential features for launching your online store', 'ecommerce',
    (ARRAY(SELECT id FROM features WHERE slug IN ('product-catalog', 'customer-reviews-ratings', 'wishlist-favorites')))::uuid[],
    '🛍️', 57.00, true, '{"target_market": "new_sellers", "setup_time": "1_day"}'),
  ('Service Pro', 'Complete solution for service-based businesses', 'services',
    (ARRAY(SELECT id FROM features WHERE slug IN ('appointment-scheduling', 'team-member-management', 'service-ratings-reviews')))::uuid[],
    '🔧', 87.00, true, '{"target_market": "consultants_agencies", "setup_time": "2_days"}'),
  ('Marketplace MVP', 'Launch a multi-vendor marketplace quickly', 'marketplace',
    (ARRAY(SELECT id FROM features WHERE slug IN ('vendor-onboarding', 'commission-tracking', 'dispute-resolution')))::uuid[],
    '🏪', 187.00, true, '{"target_market": "marketplace_operators", "setup_time": "3_days"}'),
  ('B2B Growth', 'Advanced features for SaaS and subscriptions', 'b2b',
    (ARRAY(SELECT id FROM features WHERE slug IN ('subscription-management', 'api-access-webhooks', 'advanced-reporting')))::uuid[],
    '💼', 237.00, false, '{"target_market": "saas_companies", "setup_time": "1_week"}'),
  ('Marketing Automation', 'All marketing and growth tools bundled', 'ecommerce',
    (ARRAY(SELECT id FROM features WHERE slug IN ('email-campaigns', 'lead-management', 'automation-rules', 'social-media-integration')))::uuid[],
    '📈', 156.00, false, '{"target_market": "growth_teams", "setup_time": "2_days"}')
ON CONFLICT DO NOTHING;

-- 9. Sample Feature Requests
INSERT INTO feature_requests (feature_name, description, business_type_relevance, status, make_available_to_all_businesses, created_at) VALUES
  ('WhatsApp Business Integration', 'Enable WhatsApp messaging for customer support and sales', ARRAY['ecommerce', 'services']::text[], 'submitted', false, NOW() - INTERVAL '5 days'),
  ('Multi-Language Support', 'Automatically translate your entire platform to customer language', ARRAY['ecommerce', 'marketplace', 'b2b']::text[], 'in_review', false, NOW() - INTERVAL '3 days'),
  ('Advanced Analytics Dashboard', 'Real-time dashboards with custom metrics and KPI tracking', ARRAY['ecommerce', 'b2b', 'marketplace']::text[], 'ai_development', true, NOW() - INTERVAL '2 days'),
  ('Custom Domain Setup', 'Use your own domain instead of our subdomain', ARRAY['ecommerce', 'services', 'marketplace']::text[], 'admin_testing', true, NOW() - INTERVAL '1 day'),
  ('Affiliate Program Management', 'Run an affiliate program with commission tracking and payouts', ARRAY['ecommerce', 'marketplace', 'b2b']::text[], 'approved', true, NOW()),
  ('Video Tutorial Builder', 'Create and host product demo videos on your store', ARRAY['ecommerce', 'services', 'b2b']::text[], 'submitted', false, NOW()),
  ('SMS Marketing Campaigns', 'Send bulk SMS to customers for promotions and updates', ARRAY['ecommerce', 'services']::text[], 'in_review', true, NOW()),
  ('Inventory Forecasting', 'AI-powered demand forecasting for better inventory planning', ARRAY['ecommerce', 'marketplace']::text[], 'ai_development', true, NOW() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- 10. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);
CREATE INDEX IF NOT EXISTS idx_features_status ON features(status);
CREATE INDEX IF NOT EXISTS idx_features_relevant_for ON features USING GIN(relevant_for);
CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_templates_business_type ON feature_templates(for_business_type);

-- 11. Add Comments
COMMENT ON TABLE features IS 'Catalog of all available features that businesses can enable';
COMMENT ON TABLE feature_categories IS 'Categories for organizing and filtering features';
COMMENT ON TABLE feature_templates IS 'Pre-built feature bundles for quick onboarding';
COMMENT ON TABLE feature_requests IS 'Customer requests for new features or enhancements';
COMMENT ON COLUMN features.relevant_for IS 'JSONB object with business type relevance scores (0-100)';
COMMENT ON COLUMN features.components IS 'Array of React component names included in this feature';
COMMENT ON COLUMN feature_requests.business_type_relevance IS 'Array of business types this feature would benefit';

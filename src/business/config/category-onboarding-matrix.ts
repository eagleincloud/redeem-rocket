/**
 * Category-Specific Onboarding Matrix
 * Comprehensive configuration for 10 major business categories
 * Each category includes: onboarding questions, core features, integrations, and key metrics
 */

export interface CategoryOnboardingConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  emoji: string;
  targetAudience: string;
  averageSetupTime: number; // in minutes

  onboardingQuestions: OnboardingQuestion[];
  coreFeatures: string[];
  recommendedIntegrations: IntegrationConfig[];
  keyMetrics: MetricConfig[];
  sampleDashboardLayout: DashboardLayoutConfig;
  firstActionGuidance: FirstActionConfig;
  industrySpecificResources: ResourceConfig[];
}

export interface OnboardingQuestion {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'toggle' | 'range';
  placeholder?: string;
  helpText?: string;
  options?: Array<{ label: string; value: string }>;
  required?: boolean;
  dependsOn?: string; // id of question it depends on
  showWhen?: { questionId: string; value: string | string[] }; // conditional display
}

export interface IntegrationConfig {
  name: string;
  category: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  setupComplexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number; // in minutes
  icon: string;
}

export interface MetricConfig {
  name: string;
  description: string;
  metric: string;
  unit: string;
  target?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  icon: string;
}

export interface DashboardLayoutConfig {
  primaryWidgets: string[];
  secondaryWidgets: string[];
  mainChartType: 'line' | 'bar' | 'pie' | 'table';
  recommendedTimeRange: 'day' | 'week' | 'month' | 'quarter';
}

export interface FirstActionConfig {
  action: string;
  description: string;
  expectedOutcome: string;
  estimatedTime: number; // in minutes
  successCriteria: string[];
}

export interface ResourceConfig {
  title: string;
  type: 'guide' | 'template' | 'checklist' | 'video';
  url?: string;
  description: string;
}

// ============================================
// 1. RESTAURANT / FOOD SERVICES
// ============================================

export const restaurantOnboarding: CategoryOnboardingConfig = {
  id: 'restaurant',
  name: 'Restaurant / Food Services',
  icon: '🍽️',
  description: 'For restaurants, cafes, food trucks, catering, and cloud kitchens',
  emoji: '🍽️',
  targetAudience: 'Restaurant owners, managers, and operators',
  averageSetupTime: 12,

  onboardingQuestions: [
    {
      id: 'restaurant_type',
      label: 'What type of restaurant do you operate?',
      type: 'select',
      options: [
        { label: 'Fine Dining', value: 'fine_dining' },
        { label: 'Casual Dining', value: 'casual' },
        { label: 'Quick Service / Fast Food', value: 'qsr' },
        { label: 'Cafe / Bakery', value: 'cafe' },
        { label: 'Cloud Kitchen', value: 'cloud' },
        { label: 'Food Truck / Mobile', value: 'mobile' },
        { label: 'Catering Service', value: 'catering' },
      ],
      required: true,
    },
    {
      id: 'operating_hours',
      label: 'What are your main operating hours?',
      type: 'text',
      placeholder: 'e.g., 10 AM - 11 PM, Monday to Sunday',
      helpText: 'This helps us set up delivery windows and notifications',
      required: true,
    },
    {
      id: 'seating_capacity',
      label: 'Do you have dine-in seating?',
      type: 'select',
      options: [
        { label: 'No dine-in (delivery/takeout only)', value: 'no_seating' },
        { label: 'Small (under 20 seats)', value: 'small' },
        { label: 'Medium (20-50 seats)', value: 'medium' },
        { label: 'Large (50-100 seats)', value: 'large' },
        { label: 'Very Large (100+ seats)', value: 'xlarge' },
      ],
      required: true,
    },
    {
      id: 'delivery_options',
      label: 'What delivery options do you offer?',
      type: 'multiselect',
      options: [
        { label: 'No delivery', value: 'none' },
        { label: 'In-house delivery', value: 'inhouse' },
        { label: 'Third-party platforms (UberEats, DoorDash)', value: 'thirdparty' },
        { label: 'Both in-house and third-party', value: 'both' },
      ],
      required: true,
    },
    {
      id: 'online_ordering',
      label: 'Do you want online ordering?',
      type: 'toggle',
      helpText: 'Enables customers to order directly from your website or app',
    },
    {
      id: 'payment_methods',
      label: 'What payment methods do you accept?',
      type: 'multiselect',
      options: [
        { label: 'Cash', value: 'cash' },
        { label: 'Credit/Debit Card', value: 'card' },
        { label: 'Digital Wallets (Apple Pay, Google Pay)', value: 'digital' },
        { label: 'QR Code Payment', value: 'qr' },
        { label: 'Bank Transfer', value: 'bank' },
      ],
      required: true,
    },
    {
      id: 'avg_daily_orders',
      label: 'Average number of orders per day?',
      type: 'number',
      placeholder: '50-100, 100-200, 200+',
      required: true,
    },
    {
      id: 'peak_hours',
      label: 'When are your peak hours?',
      type: 'text',
      placeholder: 'e.g., Lunch 12-2 PM, Dinner 7-9 PM',
      helpText: 'Helps optimize staffing and delivery scheduling',
    },
  ],

  coreFeatures: [
    'Menu Management',
    'Order Management',
    'Delivery Tracking',
    'Customer Loyalty',
    'Email Campaigns',
    'Table Reservation (if applicable)',
  ],

  recommendedIntegrations: [
    {
      name: 'Stripe / Square',
      category: 'Payment Processing',
      description: 'Accept payments online and in-person',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Delivery Platform APIs',
      category: 'Delivery',
      description: 'Sync with UberEats, DoorDash, Grubhub, etc.',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '🚗',
    },
    {
      name: 'SMS Provider (Twilio, Vonage)',
      category: 'Communications',
      description: 'Send order confirmations and delivery updates via SMS',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📱',
    },
    {
      name: 'Email Marketing (Klaviyo, Mailchimp)',
      category: 'Marketing',
      description: 'Run loyalty programs and promotional campaigns',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 20,
      icon: '📧',
    },
    {
      name: 'Accounting Software (QuickBooks, Xero)',
      category: 'Accounting',
      description: 'Sync sales and revenue data',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📊',
    },
    {
      name: 'Inventory Management',
      category: 'Operations',
      description: 'Track ingredients and supplies in real-time',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 20,
      icon: '📦',
    },
    {
      name: 'Analytics Platform (Google Analytics)',
      category: 'Analytics',
      description: 'Track customer behavior and sales trends',
      priority: 'low',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📈',
    },
  ],

  keyMetrics: [
    {
      name: 'Daily Revenue',
      description: 'Total sales generated per day',
      metric: 'total_daily_revenue',
      unit: '$',
      target: '100% growth YoY',
      frequency: 'daily',
      icon: '💰',
    },
    {
      name: 'Average Order Value',
      description: 'Average value of each order',
      metric: 'avg_order_value',
      unit: '$',
      target: '$35-50',
      frequency: 'daily',
      icon: '🔢',
    },
    {
      name: 'Top Menu Items',
      description: 'Most popular dishes by sales volume',
      metric: 'top_items',
      unit: 'count',
      target: 'Track weekly',
      frequency: 'weekly',
      icon: '⭐',
    },
    {
      name: 'Delivery Time',
      description: 'Average time from order to delivery',
      metric: 'avg_delivery_time',
      unit: 'minutes',
      target: '< 45 min',
      frequency: 'daily',
      icon: '⏱️',
    },
    {
      name: 'Customer Feedback',
      description: 'Average rating and reviews',
      metric: 'customer_rating',
      unit: 'stars',
      target: '4.5+',
      frequency: 'weekly',
      icon: '⭐⭐⭐⭐⭐',
    },
    {
      name: 'Order Fulfillment Rate',
      description: 'Percentage of orders completed successfully',
      metric: 'fulfillment_rate',
      unit: '%',
      target: '>95%',
      frequency: 'daily',
      icon: '✅',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Today\'s Revenue',
      'Active Orders',
      'Top Menu Items',
      'Delivery Status',
    ],
    secondaryWidgets: [
      'Customer Ratings',
      'Peak Hour Forecast',
      'Inventory Alerts',
      'Monthly Revenue Trend',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'day',
  },

  firstActionGuidance: {
    action: 'Set up your first online order',
    description: 'Create your first menu item and enable online ordering',
    expectedOutcome: 'Receive your first digital order from the system',
    estimatedTime: 5,
    successCriteria: [
      'Menu item created with price and description',
      'Online ordering enabled',
      'Test order received via email/SMS',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Restaurant Menu Best Practices',
      type: 'guide',
      description: 'How to structure your menu for maximum sales',
    },
    {
      title: 'Delivery Operations Checklist',
      type: 'checklist',
      description: 'Steps to launch delivery service',
    },
    {
      title: 'Customer Loyalty Program Template',
      type: 'template',
      description: 'Ready-to-use loyalty program structure',
    },
    {
      title: 'Peak Hour Management Video',
      type: 'video',
      description: 'How to handle rush hours efficiently',
    },
  ],
};

// ============================================
// 2. E-COMMERCE
// ============================================

export const ecommerceOnboarding: CategoryOnboardingConfig = {
  id: 'ecommerce',
  name: 'E-Commerce / Online Store',
  icon: '🛍️',
  description: 'For online retailers, dropshippers, marketplaces, and resellers',
  emoji: '🛍️',
  targetAudience: 'E-commerce business owners and store managers',
  averageSetupTime: 15,

  onboardingQuestions: [
    {
      id: 'business_model',
      label: 'What is your business model?',
      type: 'select',
      options: [
        { label: 'Direct Sales (stock inventory)', value: 'direct' },
        { label: 'Dropshipping', value: 'dropshipping' },
        { label: 'Print-on-Demand', value: 'pod' },
        { label: 'Marketplace Seller', value: 'marketplace' },
        { label: 'Subscription Box', value: 'subscription' },
      ],
      required: true,
    },
    {
      id: 'product_count',
      label: 'How many SKUs (unique products) do you have?',
      type: 'select',
      options: [
        { label: 'Under 50', value: 'under_50' },
        { label: '50-200', value: '50_200' },
        { label: '200-1000', value: '200_1000' },
        { label: '1000-5000', value: '1000_5000' },
        { label: '5000+', value: 'over_5000' },
      ],
      required: true,
    },
    {
      id: 'avg_monthly_orders',
      label: 'Average monthly order volume?',
      type: 'number',
      placeholder: '10, 100, 1000+',
      required: true,
    },
    {
      id: 'shipping_methods',
      label: 'Shipping methods you offer',
      type: 'multiselect',
      options: [
        { label: 'Standard Shipping', value: 'standard' },
        { label: 'Express Shipping', value: 'express' },
        { label: 'Overnight Shipping', value: 'overnight' },
        { label: 'Free Shipping', value: 'free' },
        { label: 'Local Pickup', value: 'pickup' },
      ],
      required: true,
    },
    {
      id: 'payment_processors',
      label: 'Which payment processors do you use?',
      type: 'multiselect',
      options: [
        { label: 'Stripe', value: 'stripe' },
        { label: 'PayPal', value: 'paypal' },
        { label: 'Square', value: 'square' },
        { label: 'Amazon Pay', value: 'amazon' },
        { label: 'Apple Pay / Google Pay', value: 'digital' },
      ],
      required: true,
    },
    {
      id: 'product_variants',
      label: 'Do your products have variants (size, color, etc.)?',
      type: 'toggle',
      helpText: 'Variants require separate inventory tracking',
    },
    {
      id: 'international_shipping',
      label: 'Do you ship internationally?',
      type: 'select',
      options: [
        { label: 'No, domestic only', value: 'domestic' },
        { label: 'Yes, limited countries', value: 'limited' },
        { label: 'Yes, worldwide', value: 'worldwide' },
      ],
      required: true,
    },
    {
      id: 'sales_channels',
      label: 'Where do you currently sell? (or plan to)',
      type: 'multiselect',
      options: [
        { label: 'Your own website', value: 'website' },
        { label: 'Amazon', value: 'amazon' },
        { label: 'eBay', value: 'ebay' },
        { label: 'Etsy', value: 'etsy' },
        { label: 'Shopify', value: 'shopify' },
        { label: 'Social Media (Instagram, TikTok)', value: 'social' },
      ],
      required: true,
    },
  ],

  coreFeatures: [
    'Product Catalog',
    'Inventory Management',
    'Order Management',
    'Email Campaigns',
    'Analytics & Reporting',
    'Customer Loyalty',
  ],

  recommendedIntegrations: [
    {
      name: 'Stripe / PayPal',
      category: 'Payment Processing',
      description: 'Secure payment processing and settlement',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 20,
      icon: '💳',
    },
    {
      name: 'Shipping Integration',
      category: 'Fulfillment',
      description: 'FedEx, UPS, DHL, USPS label generation and tracking',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📦',
    },
    {
      name: 'Inventory Management',
      category: 'Operations',
      description: 'Real-time inventory sync across channels',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '📊',
    },
    {
      name: 'Email Marketing (Klaviyo)',
      category: 'Marketing',
      description: 'Abandoned cart recovery, product recommendations',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'Analytics (Google Analytics, Hotjar)',
      category: 'Analytics',
      description: 'Conversion tracking and customer journey analysis',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📈',
    },
    {
      name: 'Returns Management',
      category: 'Customer Service',
      description: 'Automate returns and refund processing',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 20,
      icon: '↩️',
    },
    {
      name: 'Review Platform (Trustpilot, ShopiMind)',
      category: 'Social Proof',
      description: 'Collect and display customer reviews',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '⭐',
    },
  ],

  keyMetrics: [
    {
      name: 'Conversion Rate',
      description: 'Percentage of visitors who make a purchase',
      metric: 'conversion_rate',
      unit: '%',
      target: '2-5%',
      frequency: 'daily',
      icon: '📈',
    },
    {
      name: 'Average Order Value (AOV)',
      description: 'Average revenue per order',
      metric: 'avg_order_value',
      unit: '$',
      target: 'Industry average +10%',
      frequency: 'daily',
      icon: '💰',
    },
    {
      name: 'Customer Acquisition Cost',
      description: 'Cost to acquire each new customer',
      metric: 'cac',
      unit: '$',
      target: '< 1/3 of LTV',
      frequency: 'monthly',
      icon: '👤',
    },
    {
      name: 'Inventory Turnover',
      description: 'How many times inventory sells out',
      metric: 'inventory_turnover',
      unit: 'times/year',
      target: '4-8x/year',
      frequency: 'monthly',
      icon: '🔄',
    },
    {
      name: 'Return Rate',
      description: 'Percentage of orders returned',
      metric: 'return_rate',
      unit: '%',
      target: '< 3%',
      frequency: 'weekly',
      icon: '↩️',
    },
    {
      name: 'Customer Lifetime Value',
      description: 'Total profit from a customer',
      metric: 'ltv',
      unit: '$',
      target: '3x+ of CAC',
      frequency: 'monthly',
      icon: '💎',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Daily Revenue',
      'Conversion Rate',
      'Average Order Value',
      'Top Selling Products',
    ],
    secondaryWidgets: [
      'Inventory Levels',
      'Return Rate',
      'Customer Acquisition Cost',
      'Monthly Revenue Trend',
    ],
    mainChartType: 'line',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Add your first product to catalog',
    description: 'Create a complete product listing with images and pricing',
    expectedOutcome: 'Product appears in your store and can be purchased',
    estimatedTime: 10,
    successCriteria: [
      'Product images uploaded',
      'Price and description set',
      'Inventory quantity configured',
      'Product published and visible',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Product Listing Optimization Guide',
      type: 'guide',
      description: 'SEO best practices for product pages',
    },
    {
      title: 'Inventory Management Checklist',
      type: 'checklist',
      description: 'Steps to set up efficient inventory tracking',
    },
    {
      title: 'Email Marketing Campaign Templates',
      type: 'template',
      description: 'Pre-built email sequences for e-commerce',
    },
    {
      title: 'Conversion Rate Optimization Video Series',
      type: 'video',
      description: 'How to improve your store\'s conversion rate',
    },
  ],
};

// ============================================
// 3. SAAS / DIGITAL SERVICES
// ============================================

export const saasOnboarding: CategoryOnboardingConfig = {
  id: 'saas',
  name: 'SaaS / Digital Services',
  icon: '💻',
  description: 'For software companies, digital agencies, and service platforms',
  emoji: '💻',
  targetAudience: 'SaaS founders, product managers, and business development teams',
  averageSetupTime: 18,

  onboardingQuestions: [
    {
      id: 'pricing_model',
      label: 'What is your primary pricing model?',
      type: 'select',
      options: [
        { label: 'Monthly Subscription (SaaS)', value: 'monthly' },
        { label: 'Annual Subscription', value: 'annual' },
        { label: 'Pay-as-you-go / Usage-based', value: 'usage' },
        { label: 'One-time License / Perpetual', value: 'perpetual' },
        { label: 'Freemium', value: 'freemium' },
      ],
      required: true,
    },
    {
      id: 'pricing_tiers',
      label: 'How many pricing tiers do you have?',
      type: 'number',
      placeholder: '1, 2, 3, etc.',
      required: true,
    },
    {
      id: 'trial_period',
      label: 'Do you offer a free trial?',
      type: 'select',
      options: [
        { label: 'No trial', value: 'no' },
        { label: '7-day trial', value: '7' },
        { label: '14-day trial', value: '14' },
        { label: '30-day trial', value: '30' },
        { label: 'Custom trial period', value: 'custom' },
      ],
      required: true,
    },
    {
      id: 'team_collaboration',
      label: 'Is team collaboration a key feature?',
      type: 'toggle',
      helpText: 'If yes, you\'ll need seat-based pricing and team management',
    },
    {
      id: 'api_offering',
      label: 'Do you offer an API for integrations?',
      type: 'toggle',
      helpText: 'APIs enable deeper customer integration and retention',
    },
    {
      id: 'monthly_recurring_revenue',
      label: 'Current Monthly Recurring Revenue (MRR)?',
      type: 'select',
      options: [
        { label: '$0 - just starting', value: 'zero' },
        { label: '$1K - $10K', value: '1k_10k' },
        { label: '$10K - $50K', value: '10k_50k' },
        { label: '$50K - $100K', value: '50k_100k' },
        { label: '$100K+', value: 'over_100k' },
      ],
      required: true,
    },
    {
      id: 'target_customer',
      label: 'Who is your primary customer?',
      type: 'select',
      options: [
        { label: 'Individual users / Freelancers', value: 'individual' },
        { label: 'Small businesses (1-50 employees)', value: 'smb' },
        { label: 'Mid-market (50-500 employees)', value: 'mid_market' },
        { label: 'Enterprise (500+ employees)', value: 'enterprise' },
      ],
      required: true,
    },
    {
      id: 'integration_needs',
      label: 'Key integrations your customers need?',
      type: 'textarea',
      placeholder: 'e.g., Zapier, Slack, Salesforce, etc.',
      helpText: 'These are critical for customer success',
    },
  ],

  coreFeatures: [
    'Lead Management',
    'Email Automation',
    'Subscription Billing',
    'Customer Analytics',
    'API Management',
    'Integrations Hub',
  ],

  recommendedIntegrations: [
    {
      name: 'Stripe / Paddle',
      category: 'Billing & Payments',
      description: 'Subscription management and recurring billing',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 30,
      icon: '💳',
    },
    {
      name: 'Email Service (SendGrid, Resend)',
      category: 'Communications',
      description: 'Transactional and marketing emails at scale',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'CRM Integration',
      category: 'Sales',
      description: 'Sync with Salesforce, HubSpot, or Pipedrive',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 40,
      icon: '👥',
    },
    {
      name: 'Analytics Platform (Mixpanel, Amplitude)',
      category: 'Analytics',
      description: 'Track feature adoption and user behavior',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📊',
    },
    {
      name: 'Customer Support (Zendesk, Intercom)',
      category: 'Support',
      description: 'In-app messaging and ticket management',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 20,
      icon: '💬',
    },
    {
      name: 'Zapier / Make',
      category: 'Integration Platform',
      description: 'Connect to 5000+ apps without coding',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 30,
      icon: '⚡',
    },
    {
      id: 'webhook_monitoring',
      name: 'Webhook Monitoring (Svix)',
      category: 'Developer Tools',
      description: 'Monitor and debug webhook failures',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 15,
      icon: '🔗',
    },
  ],

  keyMetrics: [
    {
      name: 'Monthly Recurring Revenue (MRR)',
      description: 'Predictable monthly subscription revenue',
      metric: 'mrr',
      unit: '$',
      target: 'Month-over-month growth',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Customer Acquisition Cost (CAC)',
      description: 'Cost to acquire a paying customer',
      metric: 'cac',
      unit: '$',
      target: 'Payback in 12 months',
      frequency: 'monthly',
      icon: '👤',
    },
    {
      name: 'Churn Rate',
      description: 'Percentage of customers who cancel monthly',
      metric: 'churn_rate',
      unit: '%',
      target: '< 5%',
      frequency: 'monthly',
      icon: '📉',
    },
    {
      name: 'Customer Lifetime Value',
      description: 'Total revenue from a customer',
      metric: 'ltv',
      unit: '$',
      target: '> 3x CAC',
      frequency: 'monthly',
      icon: '💎',
    },
    {
      name: 'Trial-to-Paid Conversion',
      description: 'Percentage of trial users who convert',
      metric: 'trial_conversion',
      unit: '%',
      target: '> 10-20%',
      frequency: 'weekly',
      icon: '📈',
    },
    {
      name: 'Net Revenue Retention (NRR)',
      description: 'Growth from existing customers (upsell + churn)',
      metric: 'nrr',
      unit: '%',
      target: '> 120%',
      frequency: 'monthly',
      icon: '⬆️',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'MRR',
      'Active Subscribers',
      'Churn Rate',
      'Trial Conversions',
    ],
    secondaryWidgets: [
      'CAC',
      'LTV',
      'NRR',
      'Feature Adoption Rate',
    ],
    mainChartType: 'line',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Create your first pricing tier',
    description: 'Set up one subscription plan and enable billing',
    expectedOutcome: 'First customer can sign up and complete payment',
    estimatedTime: 15,
    successCriteria: [
      'Pricing tier created with details',
      'Billing platform connected',
      'Test subscription processed',
      'Welcome email sent to new subscriber',
    ],
  },

  industrySpecificResources: [
    {
      title: 'SaaS Pricing Strategy Guide',
      type: 'guide',
      description: 'How to structure pricing for growth',
    },
    {
      title: 'Subscription Billing Checklist',
      type: 'checklist',
      description: 'Compliance and billing best practices',
    },
    {
      title: 'Onboarding Email Sequence Template',
      type: 'template',
      description: 'Pre-built emails for new trial users',
    },
    {
      title: 'Reducing Churn Video Training',
      type: 'video',
      description: 'Strategies to improve customer retention',
    },
  ],
};

// ============================================
// 4. PROFESSIONAL SERVICES (Legal, Accounting, Consulting)
// ============================================

export const professionalServicesOnboarding: CategoryOnboardingConfig = {
  id: 'professional_services',
  name: 'Professional Services',
  icon: '👔',
  description: 'For law firms, accounting, consulting, and professional advisors',
  emoji: '👔',
  targetAudience: 'Partners, principals, and business development managers',
  averageSetupTime: 16,

  onboardingQuestions: [
    {
      id: 'service_type',
      label: 'What type of professional services do you provide?',
      type: 'select',
      options: [
        { label: 'Law Firm', value: 'law' },
        { label: 'Accounting / Tax', value: 'accounting' },
        { label: 'Management Consulting', value: 'consulting' },
        { label: 'Financial Advisory', value: 'financial' },
        { label: 'Other Professional Services', value: 'other' },
      ],
      required: true,
    },
    {
      id: 'firm_size',
      label: 'Firm size?',
      type: 'select',
      options: [
        { label: 'Solo (1 person)', value: 'solo' },
        { label: 'Small (2-10 people)', value: 'small' },
        { label: 'Medium (11-50 people)', value: 'medium' },
        { label: 'Large (50+ people)', value: 'large' },
      ],
      required: true,
    },
    {
      id: 'pricing_structure',
      label: 'How do you typically charge clients?',
      type: 'multiselect',
      options: [
        { label: 'Hourly billing', value: 'hourly' },
        { label: 'Fixed project fees', value: 'fixed' },
        { label: 'Retainer / recurring', value: 'retainer' },
        { label: 'Success-based / contingency', value: 'success' },
        { label: 'Value-based pricing', value: 'value' },
      ],
      required: true,
    },
    {
      id: 'avg_deal_size',
      label: 'What is your typical average project size?',
      type: 'select',
      options: [
        { label: 'Under $5K', value: 'under_5k' },
        { label: '$5K - $25K', value: '5k_25k' },
        { label: '$25K - $100K', value: '25k_100k' },
        { label: '$100K - $500K', value: '100k_500k' },
        { label: '$500K+', value: 'over_500k' },
      ],
      required: true,
    },
    {
      id: 'sales_cycle_length',
      label: 'Average sales cycle length?',
      type: 'select',
      options: [
        { label: 'Less than 1 month', value: 'short' },
        { label: '1-3 months', value: 'medium' },
        { label: '3-6 months', value: 'long' },
        { label: '6+ months', value: 'very_long' },
      ],
      required: true,
    },
    {
      id: 'client_types',
      label: 'Primary client types?',
      type: 'multiselect',
      options: [
        { label: 'Individual consumers', value: 'consumer' },
        { label: 'Small businesses', value: 'smb' },
        { label: 'Mid-market companies', value: 'mid_market' },
        { label: 'Enterprise clients', value: 'enterprise' },
      ],
      required: true,
    },
    {
      id: 'client_management_needs',
      label: 'Key client management needs?',
      type: 'multiselect',
      options: [
        { label: 'Time tracking and billing', value: 'time_tracking' },
        { label: 'Document management', value: 'documents' },
        { label: 'Project tracking', value: 'projects' },
        { label: 'Client portal / communication', value: 'client_portal' },
        { label: 'Proposal management', value: 'proposals' },
      ],
      required: true,
    },
    {
      id: 'compliance_requirements',
      label: 'Specific compliance requirements? (optional)',
      type: 'textarea',
      placeholder: 'e.g., SOC 2, GDPR, data privacy standards',
      helpText: 'Help us ensure proper setup for your industry',
    },
  ],

  coreFeatures: [
    'Lead Management',
    'Proposal Generation',
    'Time & Expense Tracking',
    'Client Portal',
    'Invoice Management',
    'Document Management',
  ],

  recommendedIntegrations: [
    {
      name: 'QuickBooks / Xero',
      category: 'Accounting',
      description: 'Sync invoices, expenses, and financial reports',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '📊',
    },
    {
      name: 'Microsoft 365 / Google Workspace',
      category: 'Productivity',
      description: 'Sync documents, calendar, and team collaboration',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📄',
    },
    {
      name: 'Stripe / Square',
      category: 'Payment Processing',
      description: 'Accept online payments from clients',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Email Marketing (Mailchimp, Klaviyo)',
      category: 'Marketing',
      description: 'Client newsletters and business development',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 20,
      icon: '📧',
    },
    {
      name: 'Document Signing (DocuSign, Hellosign)',
      category: 'Legal',
      description: 'Streamline contract and agreement signing',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '✍️',
    },
    {
      name: 'CRM (Salesforce, HubSpot)',
      category: 'Sales',
      description: 'Track client relationships and opportunities',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 35,
      icon: '👥',
    },
    {
      name: 'Business Card / Contact Sync',
      category: 'Networking',
      description: 'Digitize and manage professional contacts',
      priority: 'low',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '🪪',
    },
  ],

  keyMetrics: [
    {
      name: 'Monthly Billable Hours',
      description: 'Total hours billed to clients',
      metric: 'billable_hours',
      unit: 'hours',
      target: 'Utilization rate > 70%',
      frequency: 'monthly',
      icon: '⏱️',
    },
    {
      name: 'Average Project Value',
      description: 'Mean revenue per completed project',
      metric: 'avg_project_value',
      unit: '$',
      target: 'Growth month-over-month',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Active Clients',
      description: 'Number of clients with active work',
      metric: 'active_clients',
      unit: 'count',
      target: 'Steady growth',
      frequency: 'monthly',
      icon: '👥',
    },
    {
      name: 'Proposal Win Rate',
      description: 'Percentage of proposals that become clients',
      metric: 'proposal_win_rate',
      unit: '%',
      target: '20-40%',
      frequency: 'monthly',
      icon: '📈',
    },
    {
      name: 'Client Retention Rate',
      description: 'Percentage of clients returning for more work',
      metric: 'retention_rate',
      unit: '%',
      target: '> 80%',
      frequency: 'quarterly',
      icon: '🔄',
    },
    {
      name: 'Revenue per Partner',
      description: 'Total revenue divided by number of partners',
      metric: 'revenue_per_partner',
      unit: '$',
      target: 'Industry benchmark +10%',
      frequency: 'quarterly',
      icon: '💎',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Pipeline Value',
      'Active Proposals',
      'Billable Hours This Month',
      'Next Deadlines',
    ],
    secondaryWidgets: [
      'Client Utilization Rate',
      'Proposal Win Rate',
      'Revenue by Client',
      'Monthly Revenue Forecast',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Create your first client and project',
    description: 'Add a client and set up their first project with timeline',
    expectedOutcome: 'Start tracking hours and generating invoices',
    estimatedTime: 10,
    successCriteria: [
      'Client contact information recorded',
      'Project created with scope',
      'Billing rate configured',
      'First time entry logged',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Professional Services Pricing Guide',
      type: 'guide',
      description: 'Best practices for value-based pricing',
    },
    {
      title: 'Client Onboarding Checklist',
      type: 'checklist',
      description: 'Steps for smooth client engagement',
    },
    {
      title: 'Proposal Template Library',
      type: 'template',
      description: 'Industry-specific proposal templates',
    },
    {
      title: 'Growing Your Firm Video Series',
      type: 'video',
      description: 'Strategies for firm growth and scaling',
    },
  ],
};

// ============================================
// 5. HEALTHCARE (Clinic, Salon, Fitness)
// ============================================

export const healthcareOnboarding: CategoryOnboardingConfig = {
  id: 'healthcare',
  name: 'Healthcare / Wellness Services',
  icon: '⚕️',
  description: 'For medical clinics, salons, fitness studios, and wellness centers',
  emoji: '⚕️',
  targetAudience: 'Practitioners, clinic managers, and health business owners',
  averageSetupTime: 14,

  onboardingQuestions: [
    {
      id: 'service_type',
      label: 'What type of healthcare/wellness service?',
      type: 'select',
      options: [
        { label: 'Medical / Dental Clinic', value: 'medical' },
        { label: 'Beauty / Salon Services', value: 'salon' },
        { label: 'Fitness / Gym', value: 'fitness' },
        { label: 'Mental Health / Therapy', value: 'therapy' },
        { label: 'Wellness / Spa', value: 'wellness' },
        { label: 'Physical Therapy / Rehab', value: 'physio' },
      ],
      required: true,
    },
    {
      id: 'staff_count',
      label: 'Number of practitioners/staff?',
      type: 'select',
      options: [
        { label: 'Solo practitioner', value: 'solo' },
        { label: '2-5 staff', value: 'small' },
        { label: '6-20 staff', value: 'medium' },
        { label: '20+ staff', value: 'large' },
      ],
      required: true,
    },
    {
      id: 'booking_system',
      label: 'Do you need appointment scheduling?',
      type: 'toggle',
      helpText: 'Essential for healthcare and service-based businesses',
    },
    {
      id: 'client_capacity',
      label: 'Average number of appointments per day?',
      type: 'number',
      placeholder: '5, 20, 50+',
      required: true,
    },
    {
      id: 'service_types',
      label: 'Types of services you offer?',
      type: 'multiselect',
      options: [
        { label: 'Individual sessions/appointments', value: 'individual' },
        { label: 'Group classes', value: 'group' },
        { label: 'Packages / Memberships', value: 'packages' },
        { label: 'Teletherapy / Virtual visits', value: 'virtual' },
        { label: 'Products sales', value: 'products' },
      ],
      required: true,
    },
    {
      id: 'payment_method',
      label: 'Payment methods you accept?',
      type: 'multiselect',
      options: [
        { label: 'Insurance / Medical billing', value: 'insurance' },
        { label: 'Direct payment', value: 'direct' },
        { label: 'Membership fees', value: 'membership' },
        { label: 'Credit cards', value: 'card' },
      ],
      required: true,
    },
    {
      id: 'compliance_needs',
      label: 'Do you need to track compliance/certifications?',
      type: 'toggle',
      helpText: 'For tracking practitioner licenses and certifications',
    },
    {
      id: 'client_communication',
      label: 'How do you prefer to communicate with clients?',
      type: 'multiselect',
      options: [
        { label: 'Email reminders', value: 'email' },
        { label: 'SMS notifications', value: 'sms' },
        { label: 'App notifications', value: 'app' },
        { label: 'Phone calls', value: 'phone' },
      ],
      required: true,
    },
  ],

  coreFeatures: [
    'Appointment Scheduling',
    'Client Management',
    'Payment Processing',
    'Automated Reminders',
    'Membership Management',
    'Session Notes / Records',
  ],

  recommendedIntegrations: [
    {
      name: 'Calendar Integration (Google, Outlook)',
      category: 'Scheduling',
      description: 'Sync appointments with personal calendars',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📅',
    },
    {
      name: 'Stripe / Square',
      category: 'Payment Processing',
      description: 'In-person and online payment processing',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'SMS Provider (Twilio, Vonage)',
      category: 'Communications',
      description: 'Automated appointment reminders and follow-ups',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📱',
    },
    {
      name: 'Email Marketing (Mailchimp)',
      category: 'Marketing',
      description: 'Email campaigns to clients and members',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'Zoom / Telehealth Integration',
      category: 'Video',
      description: 'Virtual appointment hosting',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📹',
    },
    {
      name: 'Accounting Software (QuickBooks)',
      category: 'Accounting',
      description: 'Revenue and expense tracking',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📊',
    },
    {
      name: 'EHR / Medical Records (if applicable)',
      category: 'Healthcare',
      description: 'Secure patient record storage',
      priority: 'medium',
      setupComplexity: 'complex',
      estimatedSetupTime: 60,
      icon: '🔒',
    },
  ],

  keyMetrics: [
    {
      name: 'Daily Appointment Count',
      description: 'Number of appointments scheduled today',
      metric: 'daily_appointments',
      unit: 'count',
      target: 'Optimize capacity utilization',
      frequency: 'daily',
      icon: '📅',
    },
    {
      name: 'No-show Rate',
      description: 'Percentage of missed appointments',
      metric: 'noshow_rate',
      unit: '%',
      target: '< 5%',
      frequency: 'weekly',
      icon: '❌',
    },
    {
      name: 'Average Client Lifetime Value',
      description: 'Total revenue per client relationship',
      metric: 'client_ltv',
      unit: '$',
      target: '> $1000',
      frequency: 'monthly',
      icon: '💎',
    },
    {
      name: 'Booking Rate',
      description: 'Percentage of available slots filled',
      metric: 'booking_rate',
      unit: '%',
      target: '> 80%',
      frequency: 'weekly',
      icon: '📊',
    },
    {
      name: 'Monthly Revenue',
      description: 'Total revenue from services',
      metric: 'monthly_revenue',
      unit: '$',
      target: 'Month-over-month growth',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Client Retention',
      description: 'Percentage of repeat clients',
      metric: 'retention_rate',
      unit: '%',
      target: '> 60%',
      frequency: 'monthly',
      icon: '🔄',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Today\'s Appointments',
      'Booking Rate',
      'Revenue This Month',
      'Upcoming Cancellations',
    ],
    secondaryWidgets: [
      'No-show Rate',
      'Client Lifetime Value',
      'Staff Utilization',
      'Monthly Revenue Trend',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'week',
  },

  firstActionGuidance: {
    action: 'Schedule your first client appointment',
    description: 'Create your first appointment and set up automated reminder',
    expectedOutcome: 'Client receives appointment confirmation and reminder',
    estimatedTime: 5,
    successCriteria: [
      'Client details captured',
      'Appointment time reserved',
      'Reminder email/SMS configured',
      'Service type assigned',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Client Retention Strategies',
      type: 'guide',
      description: 'How to keep clients coming back',
    },
    {
      title: 'Service Pricing Strategy',
      type: 'guide',
      description: 'Optimal pricing for healthcare services',
    },
    {
      title: 'Membership Program Setup',
      type: 'checklist',
      description: 'Creating recurring revenue through memberships',
    },
    {
      title: 'No-show Reduction Techniques',
      type: 'video',
      description: 'Best practices for appointment attendance',
    },
  ],
};

// ============================================
// 6. EDUCATION (Coaching, Training)
// ============================================

export const educationOnboarding: CategoryOnboardingConfig = {
  id: 'education',
  name: 'Education / Coaching / Training',
  icon: '🎓',
  description: 'For tutors, coaches, instructors, and training providers',
  emoji: '🎓',
  targetAudience: 'Educators, coaches, and training business owners',
  averageSetupTime: 15,

  onboardingQuestions: [
    {
      id: 'education_type',
      label: 'What type of education do you provide?',
      type: 'select',
      options: [
        { label: 'One-on-one Tutoring', value: 'tutoring' },
        { label: 'Group Classes', value: 'group_classes' },
        { label: 'Online Courses', value: 'online_courses' },
        { label: 'Coaching / Mentoring', value: 'coaching' },
        { label: 'Corporate Training', value: 'corporate' },
        { label: 'Bootcamp / Intensive', value: 'bootcamp' },
      ],
      required: true,
    },
    {
      id: 'student_capacity',
      label: 'Average number of students per class/session?',
      type: 'number',
      placeholder: '1, 10, 30+',
      required: true,
    },
    {
      id: 'delivery_method',
      label: 'How do you deliver education?',
      type: 'multiselect',
      options: [
        { label: 'In-person sessions', value: 'inperson' },
        { label: 'Live online sessions', value: 'live_online' },
        { label: 'Pre-recorded courses', value: 'recorded' },
        { label: 'Self-paced learning', value: 'self_paced' },
        { label: 'Hybrid', value: 'hybrid' },
      ],
      required: true,
    },
    {
      id: 'pricing_model',
      label: 'How do you charge students?',
      type: 'multiselect',
      options: [
        { label: 'Per-session rate', value: 'per_session' },
        { label: 'Course packages', value: 'packages' },
        { label: 'Monthly subscriptions', value: 'subscription' },
        { label: 'Per student fee', value: 'per_student' },
        { label: 'Outcome-based', value: 'outcome' },
      ],
      required: true,
    },
    {
      id: 'subject_areas',
      label: 'Subject areas or skills you teach?',
      type: 'textarea',
      placeholder: 'e.g., Math, Python, Business, Fitness, etc.',
      required: true,
    },
    {
      id: 'student_level',
      label: 'Student levels (check all that apply)',
      type: 'multiselect',
      options: [
        { label: 'Beginner', value: 'beginner' },
        { label: 'Intermediate', value: 'intermediate' },
        { label: 'Advanced', value: 'advanced' },
        { label: 'Professional', value: 'professional' },
      ],
      required: true,
    },
    {
      id: 'learning_platform',
      label: 'Current learning platform (if any)?',
      type: 'select',
      options: [
        { label: 'None - just getting started', value: 'none' },
        { label: 'Google Classroom', value: 'google' },
        { label: 'Udemy / Teachable', value: 'udemy' },
        { label: 'Custom LMS', value: 'custom' },
        { label: 'Other', value: 'other' },
      ],
      required: true,
    },
    {
      id: 'certification_program',
      label: 'Do you offer certifications?',
      type: 'toggle',
      helpText: 'Helps students showcase their learning',
    },
  ],

  coreFeatures: [
    'Class & Session Management',
    'Student Portal',
    'Assignment Tracking',
    'Payment Processing',
    'Progress Reporting',
    'Communication Tools',
  ],

  recommendedIntegrations: [
    {
      name: 'Zoom / Google Meet',
      category: 'Video Conferencing',
      description: 'Live class sessions and office hours',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📹',
    },
    {
      name: 'Stripe / PayPal',
      category: 'Payment Processing',
      description: 'Accept course payments and tuition',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Email Service (Mailchimp, SendGrid)',
      category: 'Communications',
      description: 'Bulk emails to students and updates',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'Google Drive / OneDrive',
      category: 'File Storage',
      description: 'Share course materials and assignments',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📁',
    },
    {
      name: 'Learning Management System (Canvas, Blackboard)',
      category: 'Learning',
      description: 'Comprehensive course management',
      priority: 'medium',
      setupComplexity: 'complex',
      estimatedSetupTime: 60,
      icon: '📚',
    },
    {
      name: 'Calendar Integration',
      category: 'Scheduling',
      description: 'Sync classes with student calendars',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📅',
    },
    {
      name: 'Analytics (Mixpanel, Amplitude)',
      category: 'Analytics',
      description: 'Track student engagement and completion',
      priority: 'low',
      setupComplexity: 'moderate',
      estimatedSetupTime: 20,
      icon: '📊',
    },
  ],

  keyMetrics: [
    {
      name: 'Student Enrollment',
      description: 'Total active students in courses',
      metric: 'student_enrollment',
      unit: 'count',
      target: 'Consistent growth',
      frequency: 'monthly',
      icon: '👥',
    },
    {
      name: 'Course Completion Rate',
      description: 'Percentage of enrolled students who complete',
      metric: 'completion_rate',
      unit: '%',
      target: '> 70%',
      frequency: 'monthly',
      icon: '✅',
    },
    {
      name: 'Student Satisfaction',
      description: 'Average course rating from students',
      metric: 'satisfaction_score',
      unit: 'stars',
      target: '4.5+',
      frequency: 'monthly',
      icon: '⭐',
    },
    {
      name: 'Revenue per Student',
      description: 'Average lifetime value of each student',
      metric: 'revenue_per_student',
      unit: '$',
      target: 'Maximize through upsell',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Student Referral Rate',
      description: 'New students from referrals',
      metric: 'referral_rate',
      unit: '%',
      target: '> 20%',
      frequency: 'monthly',
      icon: '🤝',
    },
    {
      name: 'Class Attendance Rate',
      description: 'Average attendance in live sessions',
      metric: 'attendance_rate',
      unit: '%',
      target: '> 85%',
      frequency: 'weekly',
      icon: '📋',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Active Students',
      'Upcoming Classes',
      'Course Completion Rate',
      'Recent Enrollments',
    ],
    secondaryWidgets: [
      'Student Satisfaction',
      'Revenue per Student',
      'Referral Rate',
      'Monthly Revenue',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Create your first course',
    description: 'Set up a course with modules, assignments, and pricing',
    expectedOutcome: 'First student can enroll and start learning',
    estimatedTime: 20,
    successCriteria: [
      'Course title and description created',
      'Modules/lessons added',
      'Pricing configured',
      'First student enrolled',
      'Welcome email sent to student',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Course Curriculum Design Guide',
      type: 'guide',
      description: 'Structure for effective learning outcomes',
    },
    {
      title: 'Student Engagement Strategies',
      type: 'guide',
      description: 'How to keep students motivated and involved',
    },
    {
      title: 'Course Launch Checklist',
      type: 'checklist',
      description: 'Pre-launch tasks for successful courses',
    },
    {
      title: 'Building an Online Teaching Business',
      type: 'video',
      description: 'Scaling your education business',
    },
  ],
};

// ============================================
// 7. RETAIL (Physical Store)
// ============================================

export const retailOnboarding: CategoryOnboardingConfig = {
  id: 'retail',
  name: 'Retail / Physical Store',
  icon: '🏪',
  description: 'For brick-and-mortar stores, pop-ups, and physical retail locations',
  emoji: '🏪',
  targetAudience: 'Retail owners, store managers, and merchandisers',
  averageSetupTime: 14,

  onboardingQuestions: [
    {
      id: 'store_type',
      label: 'What type of retail store?',
      type: 'select',
      options: [
        { label: 'Apparel / Fashion', value: 'apparel' },
        { label: 'Grocery / Food', value: 'grocery' },
        { label: 'General Merchandise', value: 'general' },
        { label: 'Specialty / Niche', value: 'specialty' },
        { label: 'Electronics', value: 'electronics' },
        { label: 'Pop-up / Temporary', value: 'popup' },
      ],
      required: true,
    },
    {
      id: 'location_count',
      label: 'Number of physical locations?',
      type: 'select',
      options: [
        { label: 'Single location', value: 'single' },
        { label: '2-5 locations', value: '2_5' },
        { label: '5-10 locations', value: '5_10' },
        { label: '10+ locations', value: 'over_10' },
      ],
      required: true,
    },
    {
      id: 'operating_hours',
      label: 'Typical operating hours?',
      type: 'text',
      placeholder: 'e.g., 9 AM - 6 PM, 7 days a week',
      required: true,
    },
    {
      id: 'daily_foot_traffic',
      label: 'Average daily customer count?',
      type: 'number',
      placeholder: '50, 200, 1000+',
      required: true,
    },
    {
      id: 'payment_options',
      label: 'Payment methods you accept?',
      type: 'multiselect',
      options: [
        { label: 'Cash', value: 'cash' },
        { label: 'Credit/Debit Card', value: 'card' },
        { label: 'Digital Wallets (Apple Pay, Google Pay)', value: 'digital' },
        { label: 'BNPL (Buy Now Pay Later)', value: 'bnpl' },
      ],
      required: true,
    },
    {
      id: 'pos_system',
      label: 'Do you have a POS system?',
      type: 'select',
      options: [
        { label: 'None - just starting', value: 'none' },
        { label: 'Basic cash register', value: 'basic' },
        { label: 'iPad/Mobile POS', value: 'mobile' },
        { label: 'Traditional POS terminal', value: 'terminal' },
      ],
      required: true,
    },
    {
      id: 'inventory_tracking',
      label: 'How do you track inventory?',
      type: 'select',
      options: [
        { label: 'Manual counting', value: 'manual' },
        { label: 'Spreadsheet', value: 'spreadsheet' },
        { label: 'Barcode scanning', value: 'barcode' },
        { label: 'Integrated system', value: 'integrated' },
      ],
      required: true,
    },
    {
      id: 'omnichannel_needs',
      label: 'Do you also sell online?',
      type: 'toggle',
      helpText: 'Helps sync inventory across in-store and online',
    },
  ],

  coreFeatures: [
    'Point of Sale (POS)',
    'Inventory Management',
    'Customer Data',
    'Sales Reporting',
    'Employee Management',
    'Loyalty Program',
  ],

  recommendedIntegrations: [
    {
      name: 'Square / Stripe',
      category: 'POS & Payments',
      description: 'In-store payment processing and receipts',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Barcode & Inventory System',
      category: 'Inventory',
      description: 'Track products and stock levels in real-time',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '📦',
    },
    {
      name: 'Email Marketing (Mailchimp)',
      category: 'Marketing',
      description: 'Loyalty programs and promotional campaigns',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'SMS Provider (Twilio)',
      category: 'Communications',
      description: 'Send sale notifications and customer updates',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📱',
    },
    {
      name: 'Analytics (Google Analytics)',
      category: 'Analytics',
      description: 'Track foot traffic and sales trends',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📊',
    },
    {
      name: 'E-commerce Platform (Shopify, WooCommerce)',
      category: 'Online Sales',
      description: 'Connect in-store and online operations',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 40,
      icon: '🌐',
    },
    {
      name: 'Accounting Software (QuickBooks)',
      category: 'Accounting',
      description: 'Reconcile sales and manage financials',
      priority: 'low',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📊',
    },
  ],

  keyMetrics: [
    {
      name: 'Daily Revenue',
      description: 'Total sales per day',
      metric: 'daily_revenue',
      unit: '$',
      target: 'Month-over-month growth',
      frequency: 'daily',
      icon: '💰',
    },
    {
      name: 'Average Transaction Value',
      description: 'Mean value per customer purchase',
      metric: 'avg_transaction',
      unit: '$',
      target: '5-10% growth',
      frequency: 'daily',
      icon: '🔢',
    },
    {
      name: 'Foot Traffic',
      description: 'Number of customers entering store',
      metric: 'foot_traffic',
      unit: 'count',
      target: 'Track trends by hour',
      frequency: 'daily',
      icon: '👥',
    },
    {
      name: 'Conversion Rate',
      description: 'Percentage of foot traffic that purchases',
      metric: 'conversion_rate',
      unit: '%',
      target: '10-30%',
      frequency: 'daily',
      icon: '📊',
    },
    {
      name: 'Inventory Turnover',
      description: 'How often inventory sells and replenishes',
      metric: 'inventory_turnover',
      unit: 'times/year',
      target: '4-8x/year',
      frequency: 'monthly',
      icon: '🔄',
    },
    {
      name: 'Customer Retention',
      description: 'Percentage of customers returning',
      metric: 'retention_rate',
      unit: '%',
      target: '> 40%',
      frequency: 'monthly',
      icon: '🤝',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Today\'s Revenue',
      'Current Foot Traffic',
      'Top Selling Items',
      'Inventory Alerts',
    ],
    secondaryWidgets: [
      'Average Transaction Value',
      'Conversion Rate',
      'Peak Hours',
      'Weekly Revenue',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'day',
  },

  firstActionGuidance: {
    action: 'Set up your first product catalog',
    description: 'Add key products with pricing and barcode',
    expectedOutcome: 'Scan products at register and track inventory',
    estimatedTime: 15,
    successCriteria: [
      'Products added with descriptions',
      'Prices configured',
      'Barcodes assigned',
      'First sale processed',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Retail Merchandising Best Practices',
      type: 'guide',
      description: 'Layout and display strategies for sales',
    },
    {
      title: 'Inventory Management Guide',
      type: 'guide',
      description: 'Reducing shrinkage and optimizing stock',
    },
    {
      title: 'Store Opening Checklist',
      type: 'checklist',
      description: 'Daily and weekly operational tasks',
    },
    {
      title: 'Growing Retail Traffic Video',
      type: 'video',
      description: 'Marketing strategies for physical retail',
    },
  ],
};

// ============================================
// 8. MANUFACTURING / B2B
// ============================================

export const manufacturingOnboarding: CategoryOnboardingConfig = {
  id: 'manufacturing',
  name: 'Manufacturing / B2B',
  icon: '🏭',
  description: 'For manufacturers, distributors, and B2B companies',
  emoji: '🏭',
  targetAudience: 'Operations managers, sales teams, and business owners',
  averageSetupTime: 18,

  onboardingQuestions: [
    {
      id: 'company_type',
      label: 'Company type?',
      type: 'select',
      options: [
        { label: 'Manufacturer', value: 'manufacturer' },
        { label: 'Distributor', value: 'distributor' },
        { label: 'Wholesaler', value: 'wholesaler' },
        { label: 'B2B Services', value: 'b2b_services' },
        { label: 'Contract Manufacturer', value: 'contract_mfg' },
      ],
      required: true,
    },
    {
      id: 'product_types',
      label: 'Main product categories?',
      type: 'textarea',
      placeholder: 'e.g., Electronics components, Textiles, Machinery, etc.',
      required: true,
    },
    {
      id: 'production_capacity',
      label: 'Monthly production/throughput?',
      type: 'select',
      options: [
        { label: 'Small (1,000-10,000 units)', value: 'small' },
        { label: 'Medium (10,000-100,000 units)', value: 'medium' },
        { label: 'Large (100,000+ units)', value: 'large' },
      ],
      required: true,
    },
    {
      id: 'customer_base',
      label: 'Type of customers?',
      type: 'multiselect',
      options: [
        { label: 'Direct to retailers', value: 'retailers' },
        { label: 'Other businesses (B2B)', value: 'b2b' },
        { label: 'Distributors', value: 'distributors' },
        { label: 'Direct to consumers', value: 'dtc' },
      ],
      required: true,
    },
    {
      id: 'lead_time',
      label: 'Typical lead time for orders?',
      type: 'select',
      options: [
        { label: 'Less than 1 week', value: 'short' },
        { label: '1-4 weeks', value: 'medium' },
        { label: '1-3 months', value: 'long' },
        { label: '3+ months', value: 'very_long' },
      ],
      required: true,
    },
    {
      id: 'team_size',
      label: 'Company size?',
      type: 'select',
      options: [
        { label: '1-10 employees', value: 'small' },
        { label: '11-50 employees', value: 'medium' },
        { label: '51-200 employees', value: 'large' },
        { label: '200+ employees', value: 'xlarge' },
      ],
      required: true,
    },
    {
      id: 'supply_chain_complexity',
      label: 'Supply chain complexity?',
      type: 'select',
      options: [
        { label: 'Simple (few suppliers)', value: 'simple' },
        { label: 'Moderate (multi-tier)', value: 'moderate' },
        { label: 'Complex (global network)', value: 'complex' },
      ],
      required: true,
    },
    {
      id: 'quality_certifications',
      label: 'Quality certifications needed?',
      type: 'multiselect',
      options: [
        { label: 'ISO 9001 (Quality)', value: 'iso_9001' },
        { label: 'ISO 14001 (Environmental)', value: 'iso_14001' },
        { label: 'FDA (if applicable)', value: 'fda' },
        { label: 'Industry-specific', value: 'industry' },
      ],
    },
  ],

  coreFeatures: [
    'Sales Pipeline',
    'Order Management',
    'Inventory Management',
    'Production Scheduling',
    'Supplier Management',
    'Quality Tracking',
  ],

  recommendedIntegrations: [
    {
      name: 'ERP System (SAP, NetSuite)',
      category: 'Enterprise',
      description: 'Integrated business operations management',
      priority: 'critical',
      setupComplexity: 'complex',
      estimatedSetupTime: 120,
      icon: '🔧',
    },
    {
      name: 'Supply Chain Visibility Platform',
      category: 'Supply Chain',
      description: 'Track supplier orders and shipments',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 45,
      icon: '📦',
    },
    {
      name: 'CRM (Salesforce, HubSpot)',
      category: 'Sales',
      description: 'Manage customer relationships and leads',
      priority: 'high',
      setupComplexity: 'moderate',
      estimatedSetupTime: 40,
      icon: '👥',
    },
    {
      name: 'Accounting Software (SAP, QuickBooks Enterprise)',
      category: 'Finance',
      description: 'Financial management and compliance',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 50,
      icon: '📊',
    },
    {
      name: 'Quality Management System (MES)',
      category: 'Operations',
      description: 'Track quality metrics and compliance',
      priority: 'high',
      setupComplexity: 'complex',
      estimatedSetupTime: 80,
      icon: '✅',
    },
    {
      name: 'IoT Sensors / Monitoring',
      category: 'Automation',
      description: 'Real-time production line monitoring',
      priority: 'medium',
      setupComplexity: 'complex',
      estimatedSetupTime: 90,
      icon: '📡',
    },
    {
      name: 'Email & Document Management',
      category: 'Communications',
      description: 'Secure B2B communication and contracts',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 20,
      icon: '📧',
    },
  ],

  keyMetrics: [
    {
      name: 'Production Capacity Utilization',
      description: 'Percentage of capacity being used',
      metric: 'capacity_utilization',
      unit: '%',
      target: '80-95%',
      frequency: 'daily',
      icon: '⚙️',
    },
    {
      name: 'On-time Delivery Rate',
      description: 'Percentage of orders delivered on schedule',
      metric: 'otd_rate',
      unit: '%',
      target: '> 95%',
      frequency: 'weekly',
      icon: '✅',
    },
    {
      name: 'Quality Defect Rate',
      description: 'Percentage of products with defects',
      metric: 'defect_rate',
      unit: '%',
      target: '< 1%',
      frequency: 'daily',
      icon: '❌',
    },
    {
      name: 'Average Order Value',
      description: 'Mean value of B2B orders',
      metric: 'avg_order_value',
      unit: '$',
      target: 'Growth month-over-month',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Customer Lead Time',
      description: 'Order fulfillment timeline',
      metric: 'lead_time',
      unit: 'days',
      target: 'Meet committed timeline',
      frequency: 'weekly',
      icon: '⏱️',
    },
    {
      name: 'Inventory Turnover',
      description: 'How quickly materials move through',
      metric: 'inventory_turnover',
      unit: 'times/year',
      target: 'Industry benchmark',
      frequency: 'monthly',
      icon: '🔄',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Current Production',
      'On-time Delivery Rate',
      'Defect Rate',
      'Open Orders',
    ],
    secondaryWidgets: [
      'Capacity Utilization',
      'Lead Times',
      'Inventory Levels',
      'Monthly Revenue',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Create your first production order',
    description: 'Set up order details, assign to production line, track progress',
    expectedOutcome: 'Complete order and fulfill customer',
    estimatedTime: 20,
    successCriteria: [
      'Order details captured',
      'Production scheduled',
      'Quality gates defined',
      'Order shipped and confirmed',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Supply Chain Optimization Guide',
      type: 'guide',
      description: 'Best practices for lean manufacturing',
    },
    {
      title: 'Quality Management Framework',
      type: 'guide',
      description: 'Implementing six sigma and continuous improvement',
    },
    {
      title: 'Production Planning Template',
      type: 'template',
      description: 'Master production schedule setup',
    },
    {
      title: 'B2B Sales Process Video',
      type: 'video',
      description: 'Effective strategies for manufacturing sales',
    },
  ],
};

// ============================================
// 9. REAL ESTATE
// ============================================

export const realEstateOnboarding: CategoryOnboardingConfig = {
  id: 'real_estate',
  name: 'Real Estate / Property Management',
  icon: '🏠',
  description: 'For real estate agents, brokers, and property managers',
  emoji: '🏠',
  targetAudience: 'Real estate agents, brokers, and property managers',
  averageSetupTime: 16,

  onboardingQuestions: [
    {
      id: 'business_type',
      label: 'Real estate business type?',
      type: 'select',
      options: [
        { label: 'Residential Sales', value: 'residential' },
        { label: 'Commercial Sales', value: 'commercial' },
        { label: 'Property Management', value: 'property_mgmt' },
        { label: 'Real Estate Investment', value: 'investment' },
        { label: 'Wholesale / Flipping', value: 'wholesale' },
      ],
      required: true,
    },
    {
      id: 'portfolio_size',
      label: 'Number of properties managed/sold?',
      type: 'number',
      placeholder: '5, 50, 500+',
      required: true,
    },
    {
      id: 'geographic_focus',
      label: 'Geographic focus?',
      type: 'multiselect',
      options: [
        { label: 'Single city', value: 'single_city' },
        { label: 'Multiple cities', value: 'multi_city' },
        { label: 'Statewide', value: 'state' },
        { label: 'Regional', value: 'regional' },
        { label: 'National', value: 'national' },
      ],
      required: true,
    },
    {
      id: 'team_size',
      label: 'Team size?',
      type: 'select',
      options: [
        { label: 'Solo agent', value: 'solo' },
        { label: 'Small team (2-5)', value: 'small_team' },
        { label: 'Office/brokerage (6-20)', value: 'office' },
        { label: 'Large brokerage (20+)', value: 'large' },
      ],
      required: true,
    },
    {
      id: 'average_deal_size',
      label: 'Average deal/property value?',
      type: 'select',
      options: [
        { label: 'Under $500K', value: 'under_500k' },
        { label: '$500K - $1M', value: '500k_1m' },
        { label: '$1M - $5M', value: '1m_5m' },
        { label: '$5M+', value: 'over_5m' },
      ],
      required: true,
    },
    {
      id: 'listing_source',
      label: 'Listing sources?',
      type: 'multiselect',
      options: [
        { label: 'MLS (Multiple Listing Service)', value: 'mls' },
        { label: 'Direct owner leads', value: 'owner_leads' },
        { label: 'Investment properties', value: 'investment' },
        { label: 'Wholesale deals', value: 'wholesale' },
        { label: 'Off-market deals', value: 'offmarket' },
      ],
      required: true,
    },
    {
      id: 'management_needs',
      label: 'What do you need most help managing?',
      type: 'multiselect',
      options: [
        { label: 'Lead management', value: 'leads' },
        { label: 'Transaction management', value: 'transactions' },
        { label: 'Tenant management', value: 'tenants' },
        { label: 'Maintenance requests', value: 'maintenance' },
        { label: 'Financials & accounting', value: 'accounting' },
      ],
      required: true,
    },
    {
      id: 'mls_integration',
      label: 'Do you use MLS software?',
      type: 'select',
      options: [
        { label: 'No', value: 'no' },
        { label: 'Yes, broker provides', value: 'broker' },
        { label: 'Yes, third-party', value: 'thirdparty' },
      ],
      required: true,
    },
  ],

  coreFeatures: [
    'Lead Management',
    'Property Management',
    'Document Management',
    'Transaction Tracking',
    'Client Communication',
    'Reporting & Analytics',
  ],

  recommendedIntegrations: [
    {
      name: 'MLS Integration',
      category: 'Listings',
      description: 'Sync listings from MLS systems',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '🏘️',
    },
    {
      name: 'Digital Signature (DocuSign)',
      category: 'Legal',
      description: 'Streamline document signing for contracts',
      priority: 'critical',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '✍️',
    },
    {
      name: 'Payment Processing',
      category: 'Payments',
      description: 'Collect deposits and earnest money',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Email Marketing (Mailchimp)',
      category: 'Marketing',
      description: 'Client newsletters and open house invitations',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'SMS/WhatsApp',
      category: 'Communications',
      description: 'Quick updates with clients and leads',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📱',
    },
    {
      name: 'Accounting (QuickBooks)',
      category: 'Finance',
      description: 'Commission tracking and reporting',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 25,
      icon: '📊',
    },
    {
      name: 'Portal for Tenant/Buyer Communication',
      category: 'Customer Portal',
      description: 'Secure communication channel for clients',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 20,
      icon: '🔐',
    },
  ],

  keyMetrics: [
    {
      name: 'Closed Deals',
      description: 'Number of completed transactions',
      metric: 'closed_deals',
      unit: 'count',
      target: 'Month-over-month growth',
      frequency: 'monthly',
      icon: '🎉',
    },
    {
      name: 'Average Commission',
      description: 'Mean commission per deal',
      metric: 'avg_commission',
      unit: '$',
      target: 'Grow deal size',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Sales Pipeline Value',
      description: 'Total value of active deals',
      metric: 'pipeline_value',
      unit: '$',
      target: '3-6x monthly revenue target',
      frequency: 'weekly',
      icon: '📈',
    },
    {
      name: 'Average Days on Market',
      description: 'Time from listing to sale',
      metric: 'days_on_market',
      unit: 'days',
      target: 'Industry average or better',
      frequency: 'monthly',
      icon: '📅',
    },
    {
      name: 'Lead to Deal Conversion',
      description: 'Percentage of leads that close',
      metric: 'lead_conversion',
      unit: '%',
      target: '5-10%',
      frequency: 'monthly',
      icon: '🎯',
    },
    {
      name: 'Client Retention',
      description: 'Repeat clients and referrals',
      metric: 'retention_rate',
      unit: '%',
      target: '> 50%',
      frequency: 'quarterly',
      icon: '🤝',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'Active Listings',
      'Pipeline Value',
      'Closed Deals This Month',
      'Upcoming Showings',
    ],
    secondaryWidgets: [
      'Lead Conversion Rate',
      'Average Days on Market',
      'Commission This Month',
      'Client Retention',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'List your first property',
    description: 'Add property details, photos, and pricing',
    expectedOutcome: 'Property visible to buyers and agents',
    estimatedTime: 15,
    successCriteria: [
      'Property details completed',
      'Photos uploaded',
      'Pricing set',
      'MLS integration verified',
      'First buyer inquiry received',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Real Estate Marketing Strategies',
      type: 'guide',
      description: 'How to attract quality leads',
    },
    {
      title: 'Transaction Management Checklist',
      type: 'checklist',
      description: 'Steps from contract to close',
    },
    {
      title: 'CMA (Comparative Market Analysis) Guide',
      type: 'guide',
      description: 'Pricing properties competitively',
    },
    {
      title: 'Scaling Your Real Estate Business',
      type: 'video',
      description: 'Building a high-performance team',
    },
  ],
};

// ============================================
// 10. AUTOMOTIVE
// ============================================

export const automotiveOnboarding: CategoryOnboardingConfig = {
  id: 'automotive',
  name: 'Automotive Sales / Service',
  icon: '🚗',
  description: 'For car dealerships, service centers, and auto repair shops',
  emoji: '🚗',
  targetAudience: 'Dealership owners, service managers, and sales teams',
  averageSetupTime: 15,

  onboardingQuestions: [
    {
      id: 'business_type',
      label: 'Type of automotive business?',
      type: 'select',
      options: [
        { label: 'New car dealership', value: 'new_dealer' },
        { label: 'Used car dealership', value: 'used_dealer' },
        { label: 'Both new and used', value: 'both' },
        { label: 'Auto repair / Service', value: 'service' },
        { label: 'Auto parts / Accessories', value: 'parts' },
      ],
      required: true,
    },
    {
      id: 'inventory_size',
      label: 'Current vehicle inventory?',
      type: 'number',
      placeholder: '10, 50, 200+',
      required: true,
    },
    {
      id: 'dealership_brands',
      label: 'Vehicle brands you carry?',
      type: 'multiselect',
      options: [
        { label: 'Single brand', value: 'single' },
        { label: 'Multi-brand', value: 'multi' },
        { label: 'All brands (used only)', value: 'all' },
      ],
      required: true,
    },
    {
      id: 'sales_volume',
      label: 'Average monthly vehicle sales?',
      type: 'number',
      placeholder: '5, 20, 100+',
      required: true,
    },
    {
      id: 'service_capacity',
      label: 'Service bays / stations?',
      type: 'number',
      placeholder: '2, 5, 10+',
    },
    {
      id: 'customer_base',
      label: 'Primary customer types?',
      type: 'multiselect',
      options: [
        { label: 'Individual retail', value: 'retail' },
        { label: 'Corporate/fleet', value: 'corporate' },
        { label: 'Both', value: 'both' },
      ],
      required: true,
    },
    {
      id: 'financing_available',
      label: 'Do you offer financing?',
      type: 'toggle',
      helpText: 'Includes loans, leasing, or third-party financing',
    },
    {
      id: 'service_needs',
      label: 'Key operational needs?',
      type: 'multiselect',
      options: [
        { label: 'Sales pipeline management', value: 'sales_pipeline' },
        { label: 'Service scheduling', value: 'scheduling' },
        { label: 'Inventory management', value: 'inventory' },
        { label: 'Customer follow-up', value: 'followup' },
        { label: 'Finance/documents', value: 'finance' },
      ],
      required: true,
    },
  ],

  coreFeatures: [
    'Sales Pipeline',
    'Inventory Management',
    'Service Scheduling',
    'Customer Management',
    'Document/Paperwork',
    'Finance Tracking',
  ],

  recommendedIntegrations: [
    {
      name: 'Inventory Management',
      category: 'Inventory',
      description: 'Track vehicles, specs, and pricing',
      priority: 'critical',
      setupComplexity: 'moderate',
      estimatedSetupTime: 35,
      icon: '🚗',
    },
    {
      name: 'DMS (Dealer Management System)',
      category: 'Operations',
      description: 'Complete dealership operations management',
      priority: 'critical',
      setupComplexity: 'complex',
      estimatedSetupTime: 120,
      icon: '🔧',
    },
    {
      name: 'Financing Integration',
      category: 'Finance',
      description: 'Lease and loan processing',
      priority: 'high',
      setupComplexity: 'complex',
      estimatedSetupTime: 60,
      icon: '💳',
    },
    {
      name: 'Email Marketing (Mailchimp)',
      category: 'Marketing',
      description: 'Service reminders and promotions',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '📧',
    },
    {
      name: 'SMS / Text Marketing',
      category: 'Communications',
      description: 'Service appointment reminders',
      priority: 'medium',
      setupComplexity: 'simple',
      estimatedSetupTime: 10,
      icon: '📱',
    },
    {
      name: 'Payment Processing',
      category: 'Payments',
      description: 'Down payments and service charges',
      priority: 'high',
      setupComplexity: 'simple',
      estimatedSetupTime: 15,
      icon: '💳',
    },
    {
      name: 'Accounting (QuickBooks)',
      category: 'Finance',
      description: 'Financial management and reporting',
      priority: 'medium',
      setupComplexity: 'moderate',
      estimatedSetupTime: 30,
      icon: '📊',
    },
  ],

  keyMetrics: [
    {
      name: 'Vehicles Sold',
      description: 'Monthly vehicle sales count',
      metric: 'vehicles_sold',
      unit: 'count',
      target: 'Month-over-month growth',
      frequency: 'monthly',
      icon: '🚗',
    },
    {
      name: 'Average Selling Price',
      description: 'Mean vehicle price',
      metric: 'avg_selling_price',
      unit: '$',
      target: 'Grow through mix',
      frequency: 'monthly',
      icon: '💰',
    },
    {
      name: 'Gross Profit',
      description: 'Total profit on sales and service',
      metric: 'gross_profit',
      unit: '$',
      target: 'Industry benchmark +5%',
      frequency: 'monthly',
      icon: '📈',
    },
    {
      name: 'Service Revenue',
      description: 'Monthly service and parts revenue',
      metric: 'service_revenue',
      unit: '$',
      target: '15-20% of total revenue',
      frequency: 'monthly',
      icon: '🔧',
    },
    {
      name: 'Customer Retention',
      description: 'Percentage returning for service',
      metric: 'retention_rate',
      unit: '%',
      target: '> 70%',
      frequency: 'quarterly',
      icon: '🤝',
    },
    {
      name: 'Service Appointment Utilization',
      description: 'Percentage of service bays in use',
      metric: 'bay_utilization',
      unit: '%',
      target: '75-85%',
      frequency: 'daily',
      icon: '📊',
    },
  ],

  sampleDashboardLayout: {
    primaryWidgets: [
      'This Month\'s Sales',
      'Gross Profit',
      'Service Appointments',
      'Inventory Status',
    ],
    secondaryWidgets: [
      'Average Selling Price',
      'Service Revenue',
      'Customer Retention',
      'Pipeline Value',
    ],
    mainChartType: 'bar',
    recommendedTimeRange: 'month',
  },

  firstActionGuidance: {
    action: 'Add your first vehicle to inventory',
    description: 'List vehicle with details, photos, and pricing',
    expectedOutcome: 'Vehicle appears in showroom and online',
    estimatedTime: 15,
    successCriteria: [
      'Vehicle details entered',
      'Photos uploaded',
      'Price and availability set',
      'Listed in inventory',
      'First inquiry received',
    ],
  },

  industrySpecificResources: [
    {
      title: 'Automotive Sales Best Practices',
      type: 'guide',
      description: 'Consultative selling techniques',
    },
    {
      title: 'Service Department Optimization',
      type: 'guide',
      description: 'Maximizing service revenue',
    },
    {
      title: 'Customer Retention Program',
      type: 'template',
      description: 'Service reminders and loyalty programs',
    },
    {
      title: 'Growing Your Dealership',
      type: 'video',
      description: 'Strategies for dealership growth',
    },
  ],
};

// ============================================
// MASTER EXPORT - ALL CATEGORIES
// ============================================

export const allCategoryConfigs: Record<string, CategoryOnboardingConfig> = {
  restaurant: restaurantOnboarding,
  ecommerce: ecommerceOnboarding,
  saas: saasOnboarding,
  professional_services: professionalServicesOnboarding,
  healthcare: healthcareOnboarding,
  education: educationOnboarding,
  retail: retailOnboarding,
  manufacturing: manufacturingOnboarding,
  real_estate: realEstateOnboarding,
  automotive: automotiveOnboarding,
};

/**
 * Get configuration for a specific category
 */
export function getCategoryConfig(categoryId: string): CategoryOnboardingConfig {
  return allCategoryConfigs[categoryId] || allCategoryConfigs['restaurant'];
}

/**
 * Get all available categories as a list
 */
export function getAllCategories(): CategoryOnboardingConfig[] {
  return Object.values(allCategoryConfigs);
}

/**
 * Get category by name
 */
export function getCategoryByName(name: string): CategoryOnboardingConfig | undefined {
  const key = Object.keys(allCategoryConfigs).find(
    k => allCategoryConfigs[k].name.toLowerCase() === name.toLowerCase()
  );
  return key ? allCategoryConfigs[key] : undefined;
}

/**
 * Summary statistics for all categories
 */
export function getCategorySummary() {
  return {
    totalCategories: Object.keys(allCategoryConfigs).length,
    categories: Object.values(allCategoryConfigs).map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      avgSetupTime: c.averageSetupTime,
      questionCount: c.onboardingQuestions.length,
      coreFeatureCount: c.coreFeatures.length,
      integrationCount: c.recommendedIntegrations.length,
      metricCount: c.keyMetrics.length,
    })),
  };
}

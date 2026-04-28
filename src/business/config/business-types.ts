/**
 * Business Type Configurations
 * Defines setup flows, features, and templates for each business type
 */

import type { BusinessTypeConfig, DynamicQuestion } from '../types/advanced-onboarding';

export const businessTypeConfigs: Record<string, BusinessTypeConfig> = {
  restaurant: {
    type: 'restaurant',
    label: 'Restaurant',
    icon: '🍽️',
    description: 'For restaurants, cafes, and food services',
    keyFeatures: ['Menu Management', 'Order Taking', 'Table Management', 'Delivery Integration'],
    pipelineTemplate: 'order',
    suggestedFeatures: ['product_catalog', 'lead_management', 'email_campaigns'],
    setupQuestions: [
      {
        id: 'operating_hours',
        label: 'What are your operating hours?',
        type: 'text',
        placeholder: 'e.g., 10 AM - 11 PM',
        helpText: 'This helps us set up notifications and scheduling',
      },
      {
        id: 'delivery_options',
        label: 'Do you offer delivery?',
        type: 'select',
        options: [
          { label: 'No delivery', value: 'none' },
          { label: 'In-house delivery', value: 'inhouse' },
          { label: 'Third-party delivery (UberEats, etc.)', value: 'thirdparty' },
          { label: 'Both', value: 'both' },
        ],
      },
      {
        id: 'payment_methods',
        label: 'What payment methods do you accept?',
        type: 'multiselect',
        options: [
          { label: 'Cash', value: 'cash' },
          { label: 'Credit/Debit Card', value: 'card' },
          { label: 'Digital Wallets', value: 'digital' },
          { label: 'QR Code Pay', value: 'qr' },
        ],
      },
      {
        id: 'avg_daily_orders',
        label: 'How many orders per day on average?',
        type: 'number',
        placeholder: 'Approximate number',
      },
      {
        id: 'special_requirements',
        label: 'Any special requirements? (optional)',
        type: 'textarea',
        placeholder: 'e.g., allergen tracking, dietary preferences',
      },
    ],
  },

  b2b_services: {
    type: 'b2b_services',
    label: 'B2B Services',
    icon: '🏢',
    description: 'For consulting, agencies, and professional services',
    keyFeatures: ['Lead Tracking', 'Proposal Generation', 'Invoice Management', 'Team Collaboration'],
    pipelineTemplate: 'sales',
    suggestedFeatures: ['lead_management', 'email_campaigns', 'automation'],
    setupQuestions: [
      {
        id: 'sales_stages',
        label: 'What are your sales stages?',
        type: 'textarea',
        placeholder: 'e.g., Prospecting, Qualification, Proposal, Negotiation, Closed Won',
        helpText: 'Describe your typical sales pipeline stages',
      },
      {
        id: 'pricing_model',
        label: 'How do you price your services?',
        type: 'select',
        options: [
          { label: 'Project-based', value: 'project' },
          { label: 'Hourly rate', value: 'hourly' },
          { label: 'Retainer', value: 'retainer' },
          { label: 'Value-based', value: 'value' },
          { label: 'Mixed', value: 'mixed' },
        ],
      },
      {
        id: 'avg_deal_size',
        label: 'What is your average deal size?',
        type: 'select',
        options: [
          { label: 'Under $5K', value: 'under5k' },
          { label: '$5K - $25K', value: '5k_25k' },
          { label: '$25K - $100K', value: '25k_100k' },
          { label: 'Over $100K', value: 'over100k' },
        ],
      },
      {
        id: 'team_size',
        label: 'How many team members will use this?',
        type: 'number',
        placeholder: 'Number of team members',
      },
      {
        id: 'target_industries',
        label: 'What industries do you target?',
        type: 'textarea',
        placeholder: 'e.g., Tech, Finance, E-commerce, Healthcare',
      },
    ],
  },

  ecommerce: {
    type: 'ecommerce',
    label: 'E-commerce',
    icon: '🛍️',
    description: 'For online stores, dropshipping, and resellers',
    keyFeatures: ['Product Catalog', 'Inventory Management', 'Order Fulfillment', 'Customer Reviews'],
    pipelineTemplate: 'order',
    suggestedFeatures: ['product_catalog', 'email_campaigns', 'social_media'],
    setupQuestions: [
      {
        id: 'product_categories',
        label: 'How many product categories?',
        type: 'number',
        placeholder: 'Approximate number',
      },
      {
        id: 'avg_monthly_orders',
        label: 'What are your average monthly orders?',
        type: 'number',
        placeholder: 'Approximate number',
      },
      {
        id: 'shipping_options',
        label: 'Shipping methods you offer',
        type: 'multiselect',
        options: [
          { label: 'Standard Shipping', value: 'standard' },
          { label: 'Express Shipping', value: 'express' },
          { label: 'Free Shipping', value: 'free' },
          { label: 'Local Pickup', value: 'pickup' },
        ],
      },
      {
        id: 'payment_processors',
        label: 'Payment processors you use',
        type: 'multiselect',
        options: [
          { label: 'Stripe', value: 'stripe' },
          { label: 'PayPal', value: 'paypal' },
          { label: 'Square', value: 'square' },
          { label: 'Local Payment Methods', value: 'local' },
        ],
      },
      {
        id: 'inventory_management',
        label: 'Do you need real-time inventory sync?',
        type: 'toggle',
      },
    ],
  },

  freelancer: {
    type: 'freelancer',
    label: 'Freelancer',
    icon: '👨‍💼',
    description: 'For individual freelancers and contractors',
    keyFeatures: ['Project Management', 'Time Tracking', 'Invoice Generation', 'Client Portal'],
    pipelineTemplate: 'sales',
    suggestedFeatures: ['lead_management', 'email_campaigns'],
    setupQuestions: [
      {
        id: 'service_type',
        label: 'What type of services do you offer?',
        type: 'textarea',
        placeholder: 'e.g., Web Design, Content Writing, Consulting',
      },
      {
        id: 'hourly_rate',
        label: 'What is your hourly rate or project fee range?',
        type: 'text',
        placeholder: 'e.g., $50-100/hour',
      },
      {
        id: 'project_types',
        label: 'Types of projects you typically work on',
        type: 'multiselect',
        options: [
          { label: 'One-time projects', value: 'onetime' },
          { label: 'Retainers', value: 'retainer' },
          { label: 'Long-term contracts', value: 'longterm' },
          { label: 'Mixed', value: 'mixed' },
        ],
      },
      {
        id: 'team_size',
        label: 'Do you work solo or with a team?',
        type: 'select',
        options: [
          { label: 'Solo', value: 'solo' },
          { label: 'Small team (2-5)', value: 'small' },
          { label: 'Growing team (6+)', value: 'growing' },
        ],
      },
      {
        id: 'tools_used',
        label: 'Tools you currently use (optional)',
        type: 'textarea',
        placeholder: 'e.g., Figma, Slack, Google Workspace',
      },
    ],
  },

  other: {
    type: 'other',
    label: 'Other Business',
    icon: '🏪',
    description: 'For any other type of business',
    keyFeatures: ['Customer Management', 'Pipeline Management', 'Analytics', 'Integrations'],
    pipelineTemplate: 'sales',
    suggestedFeatures: ['lead_management', 'email_campaigns'],
    setupQuestions: [
      {
        id: 'business_description',
        label: 'Briefly describe your business',
        type: 'textarea',
        placeholder: 'What do you do? Who are your customers?',
        required: true,
      },
      {
        id: 'main_challenges',
        label: 'What are your main challenges?',
        type: 'textarea',
        placeholder: 'e.g., Lead generation, customer retention, team coordination',
      },
      {
        id: 'team_size',
        label: 'Team size',
        type: 'number',
        placeholder: 'Number of people',
      },
    ],
  },
};

export function getBusinessTypeConfig(type: string): BusinessTypeConfig {
  return businessTypeConfigs[type] || businessTypeConfigs['other'];
}

export function getBusinessTypeLabel(type: string): string {
  return businessTypeConfigs[type]?.label || 'Other Business';
}

export function getBusinessTypeIcon(type: string): string {
  return businessTypeConfigs[type]?.icon || '🏪';
}

export function getAllBusinessTypes() {
  return Object.values(businessTypeConfigs);
}

/**
 * Complete feature catalog for Redeem Rocket
 * Defines all 22 available features with metadata, pricing, and configuration
 */

export interface FeatureDefinition {
  id: string;
  name: string;
  description: string;
  category: 'crm' | 'marketing' | 'retention' | 'automation' | 'analytics' | 'operations';
  price: number; // Monthly price in INR
  icon: string; // Lucide icon name
  image?: string;
  requiredIntegrations?: string[];
  configurable: boolean;
  setupRequired: boolean;
  navigation?: {
    path: string;
    label: string;
    icon: string;
  };
  features: string[]; // Key features included
  useCases: string[]; // Example use cases
  setupSteps?: {
    title: string;
    description: string;
    action: string;
  }[];
}

export const FEATURES_CATALOG: Record<string, FeatureDefinition> = {
  // CRM & Customer Experience (3 features)
  lead_management: {
    id: 'lead_management',
    name: 'Lead Management CRM',
    description: 'Complete CRM system to capture, track, and convert leads through your sales pipeline',
    category: 'crm',
    price: 499,
    icon: 'Users',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/leads',
      label: 'Leads',
      icon: 'Users'
    },
    features: [
      'Unlimited lead capture',
      'Visual pipeline tracking',
      'Custom fields',
      'Lead scoring',
      'Bulk actions',
      'CSV import/export',
      'Team collaboration'
    ],
    useCases: [
      'Real estate agents tracking property inquiries',
      'Consulting firms managing client prospects',
      'E-commerce tracking interested buyers'
    ],
    setupSteps: [
      {
        title: 'Create Your First Pipeline',
        description: 'Define stages (New, Qualified, Proposal, Won, Lost)',
        action: 'setup_pipeline'
      },
      {
        title: 'Configure Lead Fields',
        description: 'Add custom fields (budget, property type, timeline)',
        action: 'setup_fields'
      }
    ]
  },

  review_and_reputation: {
    id: 'review_and_reputation',
    name: 'Review & Reputation',
    description: 'Manage customer reviews, ratings, and online reputation across platforms',
    category: 'crm',
    price: 349,
    icon: 'Star',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/reviews',
      label: 'Reviews',
      icon: 'Star'
    },
    features: [
      'Review aggregation',
      'Sentiment analysis',
      'Response templates',
      'Multi-platform management',
      'Reputation monitoring',
      'Alert on negative reviews',
      'Analytics dashboard'
    ],
    useCases: [
      'Restaurants monitoring Google & Zomato reviews',
      'Clinics managing patient reviews',
      'E-commerce tracking product ratings'
    ],
    requiredIntegrations: ['google_business', 'zomato']
  },

  live_chat_support: {
    id: 'live_chat_support',
    name: 'Live Chat Support',
    description: 'Real-time customer support via website chat widget',
    category: 'crm',
    price: 449,
    icon: 'MessageCircle',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/chat',
      label: 'Live Chat',
      icon: 'MessageCircle'
    },
    features: [
      'Website chat widget',
      'Canned responses',
      'Chat routing to team members',
      'Offline message capture',
      'Chat history',
      'Mobile app',
      'Analytics'
    ],
    useCases: [
      'E-commerce websites answering product questions',
      'SaaS platforms providing customer support',
      'Service businesses handling inquiries'
    ],
    requiredIntegrations: ['chat_widget']
  },

  // Marketing & Engagement (5 features)
  whatsapp_marketing: {
    id: 'whatsapp_marketing',
    name: 'WhatsApp Marketing',
    description: 'Send marketing messages, campaigns, and broadcasts via WhatsApp',
    category: 'marketing',
    price: 699,
    icon: 'MessageSquare',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/whatsapp',
      label: 'WhatsApp',
      icon: 'MessageSquare'
    },
    features: [
      'Broadcast messages',
      'Message templates',
      'Media support (images, videos, documents)',
      'Contact list management',
      'Delivery tracking',
      'Response handling',
      'A/B testing'
    ],
    useCases: [
      'Restaurants sending daily specials to customers',
      'Salons booking reminders',
      'E-commerce order updates'
    ],
    requiredIntegrations: ['whatsapp_business']
  },

  coupons_and_offers: {
    id: 'coupons_and_offers',
    name: 'Coupons & Offers',
    description: 'Create and manage discount coupons, promotional codes, and special offers',
    category: 'marketing',
    price: 299,
    icon: 'Ticket',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/coupons',
      label: 'Offers',
      icon: 'Ticket'
    },
    features: [
      'Coupon creation & management',
      'Discount types (percentage, fixed, BOGO)',
      'Expiration dates',
      'Usage limits',
      'Coupon codes',
      'QR codes',
      'Analytics'
    ],
    useCases: [
      'Restaurants running happy hour promotions',
      'Salons offering seasonal discounts',
      'E-commerce flash sales'
    ]
  },

  email_marketing: {
    id: 'email_marketing',
    name: 'Email Marketing',
    description: 'Create email campaigns, automation sequences, and newsletters',
    category: 'marketing',
    price: 499,
    icon: 'Mail',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/email',
      label: 'Email',
      icon: 'Mail'
    },
    features: [
      'Email templates',
      'Drag-drop editor',
      'Automation sequences',
      'Subscriber lists',
      'Open & click tracking',
      'A/B testing',
      'Analytics'
    ],
    useCases: [
      'E-commerce cart abandonment campaigns',
      'Salons booking confirmations',
      'Restaurants promotional newsletters'
    ],
    requiredIntegrations: ['email_provider']
  },

  sms_campaigns: {
    id: 'sms_campaigns',
    name: 'SMS Campaigns',
    description: 'Send SMS marketing messages and notifications',
    category: 'marketing',
    price: 349,
    icon: 'Smartphone',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/sms',
      label: 'SMS',
      icon: 'Smartphone'
    },
    features: [
      'SMS templates',
      'Broadcast campaigns',
      'Scheduled sending',
      'Delivery tracking',
      'Response capture',
      'Shortcodes',
      'Analytics'
    ],
    useCases: [
      'Appointment reminders',
      'Order status updates',
      'Promotional messages'
    ],
    requiredIntegrations: ['sms_provider']
  },

  push_notifications: {
    id: 'push_notifications',
    name: 'Push Notifications',
    description: 'Send web and mobile push notifications to engage customers',
    category: 'marketing',
    price: 299,
    icon: 'Bell',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/push',
      label: 'Push',
      icon: 'Bell'
    },
    features: [
      'Web push notifications',
      'Mobile push notifications',
      'Segmented audiences',
      'Rich media support',
      'Deep linking',
      'Delivery tracking',
      'Analytics'
    ],
    useCases: [
      'E-commerce flash sale alerts',
      'App engagement re-engagement',
      'Order status notifications'
    ],
    requiredIntegrations: ['fcm', 'apns']
  },

  // Customer Retention (3 features)
  loyalty_program: {
    id: 'loyalty_program',
    name: 'Loyalty Program',
    description: 'Reward customers for repeat purchases and engagement',
    category: 'retention',
    price: 399,
    icon: 'Gift',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/loyalty',
      label: 'Loyalty',
      icon: 'Gift'
    },
    features: [
      'Point-based rewards',
      'Tier system (Bronze, Silver, Gold)',
      'Redeemable rewards',
      'Points expiration',
      'Bulk point uploads',
      'Member dashboard',
      'Analytics'
    ],
    useCases: [
      'Restaurants loyalty programs',
      'Salon membership tiers',
      'E-commerce rewards program'
    ]
  },

  referral_program: {
    id: 'referral_program',
    name: 'Referral Program',
    description: 'Incentivize customers to refer friends and grow your customer base',
    category: 'retention',
    price: 449,
    icon: 'Share2',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/referral',
      label: 'Referral',
      icon: 'Share2'
    },
    features: [
      'Custom referral links',
      'Reward configuration',
      'Tracking & attribution',
      'Referral dashboard',
      'Viral campaigns',
      'Analytics',
      'Payout automation'
    ],
    useCases: [
      'SaaS companies growth hacking',
      'E-commerce customer acquisition',
      'Service businesses word-of-mouth'
    ]
  },

  gift_cards_and_vouchers: {
    id: 'gift_cards_and_vouchers',
    name: 'Gift Cards & Vouchers',
    description: 'Sell and manage gift cards and digital vouchers',
    category: 'retention',
    price: 349,
    icon: 'CreditCard',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/gift-cards',
      label: 'Gift Cards',
      icon: 'CreditCard'
    },
    features: [
      'Gift card creation',
      'Custom denominations',
      'Digital delivery',
      'Balance tracking',
      'Expiration management',
      'Bulk distribution',
      'Analytics'
    ],
    useCases: [
      'Salon gift card sales',
      'Restaurant gift certificates',
      'E-commerce holiday gifts'
    ]
  },

  // AI & Automation (2 features)
  ai_business_assistant: {
    id: 'ai_business_assistant',
    name: 'AI Business Assistant',
    description: 'AI-powered assistant for business insights, recommendations, and automation',
    category: 'automation',
    price: 999,
    icon: 'Zap',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/ai',
      label: 'AI Assistant',
      icon: 'Zap'
    },
    features: [
      'Lead scoring',
      'Next-best-action recommendations',
      'Predictive analytics',
      'Automated responses',
      'Insights generation',
      'Document analysis',
      'Natural language interface'
    ],
    useCases: [
      'Automatic lead qualification',
      'Business performance insights',
      'Personalized customer recommendations'
    ],
    requiredIntegrations: ['ai_api']
  },

  marketing_automation: {
    id: 'marketing_automation',
    name: 'Marketing Automation',
    description: 'Automate marketing workflows, emails, and lead nurturing',
    category: 'automation',
    price: 799,
    icon: 'RotateCw',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/automation',
      label: 'Automation',
      icon: 'RotateCw'
    },
    features: [
      'Visual workflow builder',
      'Trigger-based workflows',
      '15+ trigger types',
      'Conditional logic',
      'Multi-step sequences',
      'Execution logs',
      'Performance analytics'
    ],
    useCases: [
      'Welcome email sequences',
      'Lead nurturing workflows',
      'Cart abandonment automation'
    ]
  },

  // Analytics & Insights (1 feature)
  advanced_analytics: {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Deep insights into business performance, customer behavior, and trends',
    category: 'analytics',
    price: 599,
    icon: 'BarChart3',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/analytics',
      label: 'Analytics',
      icon: 'BarChart3'
    },
    features: [
      'Custom dashboards',
      'Real-time analytics',
      'Conversion funnels',
      'Cohort analysis',
      'Customer lifetime value',
      'Custom reports',
      'Data export'
    ],
    useCases: [
      'E-commerce conversion optimization',
      'SaaS usage analytics',
      'Restaurant sales analysis'
    ]
  },

  // Operations & Sales (8 features)
  appointment_booking: {
    id: 'appointment_booking',
    name: 'Appointment Booking',
    description: 'Online appointment scheduling system for services',
    category: 'operations',
    price: 399,
    icon: 'Calendar',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/bookings',
      label: 'Bookings',
      icon: 'Calendar'
    },
    features: [
      'Online booking widget',
      'Availability management',
      'Automated reminders',
      'Customer confirmation',
      'Staff scheduling',
      'Calendar sync',
      'Analytics'
    ],
    useCases: [
      'Salon appointment bookings',
      'Doctor consultations',
      'Gym class scheduling'
    ]
  },

  online_payments: {
    id: 'online_payments',
    name: 'Online Payments',
    description: 'Accept online payments via credit/debit card, UPI, wallet',
    category: 'operations',
    price: 699,
    icon: 'CreditCard',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/payments',
      label: 'Payments',
      icon: 'CreditCard'
    },
    features: [
      'Multiple payment methods',
      'Instant settlement',
      'Recurring payments',
      'Invoice generation',
      'Payment tracking',
      'Multi-currency support',
      'Fraud detection'
    ],
    useCases: [
      'E-commerce checkout',
      'Service booking payments',
      'Subscription billing'
    ],
    requiredIntegrations: ['payment_provider']
  },

  inventory_management: {
    id: 'inventory_management',
    name: 'Inventory Management',
    description: 'Track stock, manage inventory, and automate reorders',
    category: 'operations',
    price: 549,
    icon: 'Package',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/inventory',
      label: 'Inventory',
      icon: 'Package'
    },
    features: [
      'Stock tracking',
      'Low stock alerts',
      'Reorder automation',
      'Supplier management',
      'Barcode scanning',
      'Multiple warehouses',
      'Demand forecasting'
    ],
    useCases: [
      'Retail store inventory',
      'E-commerce stock management',
      'Warehouse operations'
    ]
  },

  multi_location_management: {
    id: 'multi_location_management',
    name: 'Multi-Location Management',
    description: 'Manage multiple business locations from a single dashboard',
    category: 'operations',
    price: 899,
    icon: 'MapPin',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/locations',
      label: 'Locations',
      icon: 'MapPin'
    },
    features: [
      'Location management',
      'Centralized reporting',
      'Staff assignment',
      'Inventory allocation',
      'Performance comparison',
      'Unified calendar',
      'Analytics by location'
    ],
    useCases: [
      'Multi-branch restaurants',
      'Salon chains',
      'Franchise operations'
    ]
  },

  team_management: {
    id: 'team_management',
    name: 'Team Management',
    description: 'Manage team members, permissions, and team collaboration',
    category: 'operations',
    price: 499,
    icon: 'Users',
    configurable: true,
    setupRequired: false,
    navigation: {
      path: '/app/features/team',
      label: 'Team',
      icon: 'Users'
    },
    features: [
      'Team member management',
      'Role-based permissions',
      'Activity logs',
      'Team communication',
      'Assignment tracking',
      'Performance metrics',
      'Leave management'
    ],
    useCases: [
      'Sales team coordination',
      'Service team scheduling',
      'Customer support teams'
    ]
  },

  ecommerce_store: {
    id: 'ecommerce_store',
    name: 'E-Commerce Store',
    description: 'Build and manage a complete online store',
    category: 'operations',
    price: 999,
    icon: 'ShoppingCart',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/store',
      label: 'Store',
      icon: 'ShoppingCart'
    },
    features: [
      'Product catalog',
      'Shopping cart',
      'Checkout process',
      'Payment integration',
      'Shipping management',
      'Order tracking',
      'Store analytics'
    ],
    useCases: [
      'Physical product sales',
      'Digital products',
      'Subscription products'
    ],
    requiredIntegrations: ['payment_provider', 'shipping']
  },

  advanced_security: {
    id: 'advanced_security',
    name: 'Advanced Security',
    description: 'Enterprise-grade security with compliance certifications',
    category: 'operations',
    price: 699,
    icon: 'Shield',
    configurable: true,
    setupRequired: true,
    navigation: {
      path: '/app/features/security',
      label: 'Security',
      icon: 'Shield'
    },
    features: [
      'Two-factor authentication',
      'Data encryption',
      'IP whitelisting',
      'Activity logs',
      'Backup & recovery',
      'Compliance (GDPR, ISO)',
      'Penetration testing'
    ],
    useCases: [
      'Financial services',
      'Healthcare providers',
      'Enterprise businesses'
    ],
    requiredIntegrations: ['security_provider']
  }
};

// Feature categories for grouping
export const FEATURE_CATEGORIES = {
  crm: {
    label: 'CRM & Customer Experience',
    color: '#3B82F6',
    icon: 'Users'
  },
  marketing: {
    label: 'Marketing & Engagement',
    color: '#8B5CF6',
    icon: 'Megaphone'
  },
  retention: {
    label: 'Customer Retention',
    color: '#EC4899',
    icon: 'Heart'
  },
  automation: {
    label: 'AI & Automation',
    color: '#F59E0B',
    icon: 'Zap'
  },
  analytics: {
    label: 'Analytics & Insights',
    color: '#10B981',
    icon: 'BarChart3'
  },
  operations: {
    label: 'Operations & Sales',
    color: '#06B6D4',
    icon: 'Settings'
  }
};

// Pre-built feature bundles
export const FEATURE_BUNDLES = {
  starter: {
    name: 'Starter Bundle',
    price: 1299,
    savings: 500,
    features: [
      'lead_management',
      'email_marketing',
      'coupons_and_offers',
      'appointment_booking'
    ],
    description: 'Perfect for small businesses getting started'
  },
  growth: {
    name: 'Growth Bundle',
    price: 2799,
    savings: 1200,
    features: [
      'lead_management',
      'email_marketing',
      'whatsapp_marketing',
      'marketing_automation',
      'loyalty_program',
      'appointment_booking',
      'online_payments',
      'advanced_analytics'
    ],
    description: 'Best for growing businesses with multiple channels'
  },
  enterprise: {
    name: 'Enterprise Bundle',
    price: 5499,
    savings: 2500,
    features: [
      'lead_management',
      'review_and_reputation',
      'live_chat_support',
      'whatsapp_marketing',
      'coupons_and_offers',
      'email_marketing',
      'sms_campaigns',
      'push_notifications',
      'loyalty_program',
      'referral_program',
      'gift_cards_and_vouchers',
      'ai_business_assistant',
      'marketing_automation',
      'advanced_analytics',
      'appointment_booking',
      'online_payments',
      'inventory_management',
      'multi_location_management',
      'team_management',
      'advanced_security'
    ],
    description: 'Everything you need for large-scale operations'
  }
};

// Helper functions
export const getFeature = (id: string): FeatureDefinition | undefined => {
  return FEATURES_CATALOG[id];
};

export const getFeaturesByCategory = (category: string): FeatureDefinition[] => {
  return Object.values(FEATURES_CATALOG).filter(f => f.category === category);
};

export const calculateBundlePrice = (featureIds: string[]): number => {
  return featureIds.reduce((total, id) => {
    const feature = FEATURES_CATALOG[id];
    return total + (feature?.price || 0);
  }, 0);
};

export const getFeaturesByBundle = (bundleKey: string): FeatureDefinition[] => {
  const bundle = FEATURE_BUNDLES[bundleKey as keyof typeof FEATURE_BUNDLES];
  if (!bundle) return [];
  return bundle.features.map(id => FEATURES_CATALOG[id]).filter(Boolean);
};

# Category-Specific Onboarding: Implementation Examples

This document provides practical implementation examples for using the category-specific onboarding matrix.

---

## Example 1: Restaurant Onboarding Flow

### Scenario: User selects "Restaurant" category

```typescript
import { getCategoryConfig } from '@/business/config/category-onboarding-matrix';

// Step 1: Get the restaurant configuration
const restaurantConfig = getCategoryConfig('restaurant');

// restaurantConfig contains:
// - 8 specific questions about delivery, seating, payments, etc.
// - 6 core features to enable
// - 7 integration suggestions
// - 6 key metrics to track
// - First action guidance
```

### Dynamic Question Display

```typescript
// In OnboardingFlow component
const [category, setCategory] = useState('restaurant');
const config = getCategoryConfig(category);

return (
  <div className="onboarding-flow">
    {config.onboardingQuestions.map((question, index) => (
      <QuestionCard
        key={question.id}
        question={question}
        stepNumber={index + 1}
        totalSteps={config.onboardingQuestions.length}
        onAnswer={(answer) => handleAnswer(question.id, answer)}
      />
    ))}
  </div>
);
```

### Feature Enablement

```typescript
// After onboarding completion
const restaurant = getCategoryConfig('restaurant');
const enabledFeatures = restaurant.coreFeatures;
// ['Menu Management', 'Order Management', 'Delivery Tracking', 'Customer Loyalty', 'Email Campaigns', 'Table Reservation']

// Enable features in database
async function completeOnboarding(userId, answers) {
  const config = getCategoryConfig('restaurant');
  
  // Save answers
  await db.biz_users.update(userId, {
    business_category: 'restaurant',
    onboarding_answers: answers,
    enabled_features: config.coreFeatures,
  });
  
  // Create feature records
  for (const feature of config.coreFeatures) {
    await db.user_features.create({
      user_id: userId,
      feature_name: feature,
      enabled: true,
    });
  }
}
```

### Integration Setup

```typescript
// Show suggested integrations in priority order
const restaurantConfig = getCategoryConfig('restaurant');
const criticalIntegrations = restaurantConfig.recommendedIntegrations
  .filter(i => i.priority === 'critical')
  .sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

// Display to user:
// 1. Stripe / Square (Payment Processing) - 15 min setup
// 2. Delivery Platform APIs (Delivery) - 30 min setup
// 3. SMS Provider (Communications) - 10 min setup
```

### Dashboard Configuration

```typescript
const restaurantConfig = getCategoryConfig('restaurant');

const dashboardConfig = {
  primaryWidgets: [
    'Today\'s Revenue',      // $2,150.00
    'Active Orders',         // 12 orders
    'Top Menu Items',        // Pasta Carbonara: 45 orders
    'Delivery Status',       // 8 out for delivery
  ],
  secondaryWidgets: [
    'Customer Ratings',      // 4.7/5.0
    'Peak Hour Forecast',    // Expected 8-9 PM rush
    'Inventory Alerts',      // Low on fresh basil
    'Monthly Revenue Trend', // Chart showing growth
  ],
  mainChart: 'bar',
  recommendedTimeRange: 'day',
};

// Initialize dashboard for user
await createUserDashboard(userId, dashboardConfig);
```

### First Action Guidance

```typescript
const restaurantConfig = getCategoryConfig('restaurant');
const guidance = restaurantConfig.firstActionGuidance;

// Shows modal:
// Title: "Set up your first online order"
// Description: "Create your first menu item and enable online ordering"
// Expected Outcome: "Receive your first digital order from the system"
// Estimated Time: "5 minutes"
// Success Criteria:
//   - Menu item created with price and description
//   - Online ordering enabled
//   - Test order received via email/SMS

// On completion, show success:
// "Congratulations! You've completed onboarding.
//  You now have access to Menu Management, Order Management,
//  Delivery Tracking, and Customer Loyalty features."
```

### Key Metrics Dashboard

```typescript
const restaurantConfig = getCategoryConfig('restaurant');

// Create widgets for tracking:
const widgets = restaurantConfig.keyMetrics.map(metric => ({
  title: metric.name,
  description: metric.description,
  unit: metric.unit,
  icon: metric.icon,
  target: metric.target,
  frequency: metric.frequency,
  refreshTime: getRefreshInterval(metric.frequency),
}));

// Example values shown to user:
// Daily Revenue: $2,150 (target: 100% growth YoY)
// Average Order Value: $45.50 (target: $35-50)
// Top Menu Items: [Pasta Carbonara (45), Risotto (32), Tiramisu (28)]
// Delivery Time: 38 min (target: < 45 min)
// Customer Feedback: 4.7⭐ (target: 4.5+)
// Order Fulfillment Rate: 98% (target: >95%)
```

---

## Example 2: E-Commerce Onboarding

### Scenario: Multi-step setup for online store

```typescript
// User selects: "E-Commerce / Online Store"
const ecommerceConfig = getCategoryConfig('ecommerce');

// Onboarding Questions:
// 1. Business model? (Direct, Dropshipping, POD, Marketplace, Subscription)
// 2. Number of SKUs? (Under 50, 50-200, 200-1000, 1000-5000, 5000+)
// 3. Monthly orders? (Number)
// 4. Shipping methods? (Multi-select)
// 5. Payment processors? (Multi-select)
// 6. Product variants?
// 7. International shipping?
// 8. Sales channels? (Website, Amazon, eBay, Etsy, Shopify, Social)
```

### Processing Answers for Smart Configuration

```typescript
interface EcommerceAnswers {
  businessModel: string;
  productCount: string;
  monthlyOrders: number;
  shippingMethods: string[];
  paymentProcessors: string[];
  hasVariants: boolean;
  internationalShipping: string;
  salesChannels: string[];
}

function configureEcommerceFeatures(answers: EcommerceAnswers) {
  const features = ['Product Catalog', 'Inventory Management', 'Order Management'];
  
  // Add features based on answers
  if (answers.businessModel === 'subscription') {
    features.push('Subscription Management');
  }
  
  if (answers.salesChannels.length > 1) {
    features.push('Multi-channel Sync');
  }
  
  if (answers.internationalShipping !== 'domestic') {
    features.push('Tax & Duty Management');
  }
  
  return features;
}
```

### Conditional Integration Suggestions

```typescript
function recommendIntegrations(answers: EcommerceAnswers) {
  const config = getCategoryConfig('ecommerce');
  const recommendations = [...config.recommendedIntegrations];
  
  // Reorder based on answers
  const prioritized = [];
  
  // Always suggest payment processor first
  const paymentIntegration = recommendations.find(
    i => i.category === 'Payment Processing'
  );
  if (paymentIntegration) {
    prioritized.push({ ...paymentIntegration, priority: 'critical' });
  }
  
  // Suggest shipping if they have shipping methods
  if (answers.shippingMethods.length > 0) {
    const shipping = recommendations.find(i => i.category === 'Fulfillment');
    if (shipping) {
      prioritized.push({ ...shipping, priority: 'critical' });
    }
  }
  
  // Add remaining integrations
  const remaining = recommendations.filter(i => !prioritized.includes(i));
  prioritized.push(...remaining);
  
  return prioritized;
}
```

### Sample Dashboard for E-Commerce

```typescript
const ecommerceConfig = getCategoryConfig('ecommerce');

// Primary metrics shown prominently:
const dashboard = {
  mainMetrics: [
    {
      name: 'Conversion Rate',
      value: '2.8%',
      target: '2-5%',
      trend: '+0.3%',
    },
    {
      name: 'Average Order Value',
      value: '$87.50',
      target: 'Industry avg +10%',
      trend: '+$2.25',
    },
    {
      name: 'Customer Acquisition Cost',
      value: '$18.50',
      target: '< 1/3 of LTV',
      trend: '-$1.20',
    },
  ],
  charts: [
    {
      title: 'Daily Revenue',
      type: 'line',
      timeRange: 'last_30_days',
      data: [...],
    },
    {
      title: 'Top Selling Products',
      type: 'bar',
      timeRange: 'this_month',
      data: [...],
    },
  ],
};
```

---

## Example 3: SaaS Onboarding

### Scenario: Complex setup with trial to paid flow

```typescript
const saasConfig = getCategoryConfig('saas');

// Questions focus on:
// - Pricing model and tiers
// - Trial period strategy
// - Team collaboration needs
// - API offering
// - Current revenue (MRR)
// - Target customer segment
// - Integration requirements
```

### Dynamic Pricing Configuration

```typescript
interface SaaSAnswers {
  pricingModel: 'monthly' | 'annual' | 'usage' | 'perpetual' | 'freemium';
  pricingTiers: number;
  trialPeriod: string;
  hasTeamCollab: boolean;
  hasAPI: boolean;
  currentMRR: string;
  targetCustomer: string;
}

function createPricingPlans(answers: SaaSAnswers) {
  const plans = [];
  
  if (answers.pricingTiers >= 1) {
    plans.push({
      name: 'Starter',
      price: answers.pricingModel === 'monthly' ? 29 : 290,
      features: ['Basic features', '5 users'],
    });
  }
  
  if (answers.pricingTiers >= 2) {
    plans.push({
      name: 'Professional',
      price: answers.pricingModel === 'monthly' ? 79 : 790,
      features: ['All Starter features', '25 users', 'API access'],
    });
  }
  
  if (answers.pricingTiers >= 3) {
    plans.push({
      name: 'Enterprise',
      price: 'Custom',
      features: ['Custom features', 'Unlimited users', 'Dedicated support'],
    });
  }
  
  // Add trial configuration
  if (answers.trialPeriod !== 'no') {
    plans.forEach(plan => {
      plan.trial = {
        days: parseInt(answers.trialPeriod),
        includesAllFeatures: true,
      };
    });
  }
  
  return plans;
}
```

### Critical Integrations Setup

```typescript
const saasConfig = getCategoryConfig('saas');

// Critical integrations for SaaS:
// 1. Stripe / Paddle (Billing & Payments) - CRITICAL
// 2. Email Service (SendGrid, Resend) - CRITICAL
// 3. CRM Integration - HIGH
// 4. Analytics Platform - HIGH
// 5. Customer Support - HIGH

async function setupSaaS(userId, answers) {
  const config = getCategoryConfig('saas');
  
  // Step 1: Setup billing
  const billingIntegration = config.recommendedIntegrations.find(
    i => i.category === 'Billing & Payments'
  );
  showIntegrationSetup(billingIntegration);
  
  // Step 2: Setup email
  const emailIntegration = config.recommendedIntegrations.find(
    i => i.category === 'Communications'
  );
  showIntegrationSetup(emailIntegration);
  
  // Step 3: Suggest CRM
  const crmIntegration = config.recommendedIntegrations.find(
    i => i.category === 'Sales'
  );
  showIntegrationSuggestion(crmIntegration);
}
```

### Success Metrics for SaaS

```typescript
const saasConfig = getCategoryConfig('saas');

// Track these key metrics:
const metrics = {
  'Monthly Recurring Revenue (MRR)': {
    current: 5000,
    target: 10000,
    benchmark: 'Month-over-month growth',
  },
  'Customer Acquisition Cost': {
    current: 250,
    target: '< 1/3 of LTV',
    benchmark: 'Payback in 12 months',
  },
  'Churn Rate': {
    current: 4.2,
    target: '< 5%',
    benchmark: 'Healthy range',
  },
  'Customer Lifetime Value': {
    current: 2500,
    target: '> 3x CAC',
    benchmark: 'LTV > 3x CAC',
  },
  'Trial to Paid Conversion': {
    current: 18,
    target: '> 10-20%',
    benchmark: 'Industry average 15-20%',
  },
  'Net Revenue Retention': {
    current: 125,
    target: '> 120%',
    benchmark: 'Growth from upsell',
  },
};

// Dashboard shows these prominently with trend indicators
```

---

## Example 4: Healthcare (Clinic) Onboarding

### Scenario: Appointment scheduling focus

```typescript
const healthcareConfig = getCategoryConfig('healthcare');

// Questions focus on:
// - Service type (medical, salon, fitness, therapy, wellness, physio)
// - Staff count
// - Appointment scheduling needs
// - Daily client capacity
// - Service types offered
// - Payment methods (insurance, direct, membership)
// - Compliance tracking
// - Client communication preferences
```

### Smart Scheduling Setup

```typescript
interface HealthcareAnswers {
  serviceType: string;
  staffCount: number;
  clientCapacityPerDay: number;
  serviceTypes: string[];
  paymentMethods: string[];
  hasInsurance: boolean;
  hasCompliance: boolean;
  communicationPrefs: string[];
}

function setupScheduling(answers: HealthcareAnswers) {
  const schedule = {
    capacity: answers.clientCapacityPerDay,
    appointmentDuration: getDefaultDuration(answers.serviceType),
    breakTimes: generateBreakTimes(answers.staffCount),
    bufferTime: 5, // minutes between appointments
    
    // Enable reminders based on preference
    reminders: {
      email: answers.communicationPrefs.includes('email'),
      sms: answers.communicationPrefs.includes('sms'),
      app: answers.communicationPrefs.includes('app'),
      daysBeforeAppointment: 2,
    },
    
    // Insurance billing if needed
    insuranceBilling: answers.hasInsurance,
    
    // Compliance tracking
    complianceTracking: answers.hasCompliance,
  };
  
  return schedule;
}
```

### No-show Reduction Strategy

```typescript
const healthcareConfig = getCategoryConfig('healthcare');

// Create automated no-show reduction workflow
const workflow = {
  name: 'Reduce No-shows',
  triggers: [
    {
      type: 'appointment_scheduled',
      actions: [
        // Send immediate confirmation
        { type: 'email', template: 'appointment_confirmation' },
        // Send reminder 2 days before
        { type: 'sms', template: 'reminder_2days' },
        // Send reminder 4 hours before
        { type: 'sms', template: 'reminder_4hours' },
      ],
    },
    {
      type: 'appointment_missed',
      actions: [
        // Immediate follow-up
        { type: 'email', template: 'missed_appt_email' },
        // Rebook option
        { type: 'sms', template: 'reschedule_offer' },
      ],
    },
  ],
};
```

---

## Example 5: Real Estate Onboarding

### Scenario: Multi-property management

```typescript
const realEstateConfig = getCategoryConfig('real_estate');

// Questions focus on:
// - Business type (residential, commercial, property mgmt, investment, wholesale)
// - Portfolio size
// - Geographic focus
// - Team size
// - Average deal size
// - Listing sources (MLS, direct, off-market)
// - Management needs
// - MLS integration
```

### Property Listing Configuration

```typescript
interface RealEstateAnswers {
  businessType: string;
  portfolioSize: number;
  geographicFocus: string[];
  teamSize: string;
  averageDealSize: string;
  listingSources: string[];
  useMLS: boolean;
}

async function setupProperty(property, answers: RealEstateAnswers) {
  const config = getCategoryConfig('real_estate');
  
  // Create listing with all required fields
  const listing = {
    title: property.address,
    description: property.description,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    squareFeet: property.sqft,
    
    // MLS sync if applicable
    mlsNumber: answers.useMLS ? generateMLSNumber() : null,
    
    // Images
    images: property.images,
    
    // Document management
    documents: {
      listing: property.listingDocument,
      disclosure: property.disclosureDocument,
    },
    
    // Status tracking
    status: 'active',
    listedDate: new Date(),
  };
  
  // Enable property-specific features
  const features = [
    'Listing Management',
    'Document Management',
    'Transaction Tracking',
  ];
  
  if (answers.teamSize !== 'solo') {
    features.push('Team Collaboration');
  }
  
  return { listing, features };
}
```

### Deal Pipeline View

```typescript
const realEstateConfig = getCategoryConfig('real_estate');

// Configure deal pipeline
const pipeline = {
  name: 'Property Sales Pipeline',
  stages: [
    {
      id: 'listing',
      name: 'Listed',
      properties: 12,
    },
    {
      id: 'showing',
      name: 'Showing',
      properties: 8,
      count: 24, // showings
    },
    {
      id: 'offer',
      name: 'Offer Received',
      properties: 3,
    },
    {
      id: 'negotiation',
      name: 'In Negotiation',
      properties: 2,
    },
    {
      id: 'pending',
      name: 'Pending Close',
      properties: 1,
      closingDate: '2026-05-15',
    },
    {
      id: 'closed',
      name: 'Closed',
      properties: 24, // YTD
    },
  ],
};

// Dashboard shows pipeline value
const pipelineValue = calculatePipelineValue(pipeline);
// $18.5M in active listings and pending deals
```

---

## Example 6: Using Comparison Utilities

### Finding Similar Businesses

```typescript
import { 
  recommendCategories,
  findSimilarCategories,
  compareCategories
} from '@/business/utils/category-comparison';

// User describes their business
const description = "We sell coffee equipment and supplies online with delivery";

// Get recommendations
const recommendations = recommendCategories(description);
// Output: ['ecommerce', 'restaurant', 'retail']

// Compare ecommerce and restaurant
const comparison = compareCategories('ecommerce', 'restaurant');
console.log(comparison);
// {
//   commonIntegrations: ['Email Marketing', 'Payment Processing', 'Analytics'],
//   setupTimeDifference: 3,
//   commonMetricCount: 2
// }
```

### Building Admin Dashboard

```typescript
import { 
  createCategoryComparisonMatrix,
  getCategoryStats,
  getCategorySummary
} from '@/business/utils/category-comparison';

// Get overview
const stats = getCategoryStats();
console.log(stats);
// {
//   totalCategories: 10,
//   totalQuestions: 78,
//   totalIntegrations: 67,
//   averageSetupTime: 15.2,
//   quickestSetup: { name: 'Healthcare', time: 14 },
//   longestSetup: { name: 'Manufacturing', time: 18 }
// }

// Create comparison matrix for display
const matrix = createCategoryComparisonMatrix();
// Shows setup times, question counts, integration counts for all categories
```

### Implementation Checklist Generator

```typescript
import { createImplementationChecklist } from '@/business/utils/category-comparison';

// Generate checklist for product team
const checklist = createImplementationChecklist('saas');

console.log(checklist);
// {
//   category: 'SaaS / Digital Services',
//   checklist: [
//     {
//       section: 'Onboarding Flow',
//       items: [
//         'Create 8 onboarding questions',
//         'Implement conditional display',
//         ...
//       ]
//     },
//     ...
//   ]
// }
```

---

## Summary

These examples show how to:

1. **Get configuration** for any category
2. **Display dynamic questions** based on category
3. **Enable smart features** based on answers
4. **Suggest integrations** in priority order
5. **Configure dashboards** with relevant metrics
6. **Guide first actions** with specific instructions
7. **Compare categories** for cross-industry insights
8. **Generate checklists** for implementation

The modular design allows mixing and matching these approaches for your specific use case.

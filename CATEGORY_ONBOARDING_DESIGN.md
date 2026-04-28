# Category-Specific Onboarding Design Matrix

## Overview

This document describes a comprehensive category-specific onboarding system designed to customize the user experience for 10 major business types. Each category has been researched and configured with industry-specific questions, features, integrations, and metrics to accelerate time-to-value.

**Implementation File:** `/src/business/config/category-onboarding-matrix.ts`

---

## The 10 Business Categories

### 1. Restaurant / Food Services 🍽️
- **Setup Time:** 12 minutes
- **Target Audience:** Restaurant owners, managers, operators
- **8 Onboarding Questions** covering: restaurant type, hours, seating, delivery, payments, order volume, peak hours, online ordering
- **6 Core Features:** Menu Management, Order Management, Delivery Tracking, Customer Loyalty, Email Campaigns, Table Reservation
- **7 Integrations:** Payment, Delivery Platforms, SMS, Email Marketing, Accounting, Inventory, Analytics

**Key Metrics Dashboard:**
- Daily Revenue
- Average Order Value
- Top Menu Items
- Delivery Time
- Customer Feedback
- Order Fulfillment Rate

**First Action:** Set up first online order (5 min) → Receive first digital order

---

### 2. E-Commerce / Online Store 🛍️
- **Setup Time:** 15 minutes
- **Target Audience:** E-commerce owners, store managers
- **8 Onboarding Questions** covering: business model, product count, monthly orders, shipping, payment processors, variants, international shipping, sales channels
- **6 Core Features:** Product Catalog, Inventory Management, Order Management, Email Campaigns, Analytics, Customer Loyalty
- **7 Integrations:** Payment Processing, Shipping, Inventory, Email Marketing, Analytics, Returns Management, Review Platform

**Key Metrics Dashboard:**
- Conversion Rate
- Average Order Value (AOV)
- Customer Acquisition Cost (CAC)
- Inventory Turnover
- Return Rate
- Customer Lifetime Value (LTV)

**First Action:** Add first product to catalog (10 min) → First sale processed

---

### 3. SaaS / Digital Services 💻
- **Setup Time:** 18 minutes
- **Target Audience:** SaaS founders, product managers, business development
- **8 Onboarding Questions** covering: pricing model, tiers, trial period, team collaboration, API offering, MRR, target customer, integrations
- **6 Core Features:** Lead Management, Email Automation, Subscription Billing, Customer Analytics, API Management, Integrations Hub
- **7 Integrations:** Stripe/Paddle, Email Service, CRM, Analytics, Customer Support, Zapier/Make, Webhook Monitoring

**Key Metrics Dashboard:**
- Monthly Recurring Revenue (MRR)
- Customer Acquisition Cost (CAC)
- Churn Rate
- Customer Lifetime Value (LTV)
- Trial-to-Paid Conversion
- Net Revenue Retention (NRR)

**First Action:** Create first pricing tier (15 min) → First subscriber processes payment

---

### 4. Professional Services (Law, Accounting, Consulting) 👔
- **Setup Time:** 16 minutes
- **Target Audience:** Partners, principals, business development managers
- **8 Onboarding Questions** covering: service type, firm size, pricing structure, deal size, sales cycle, client types, management needs, compliance
- **6 Core Features:** Lead Management, Proposal Generation, Time & Expense Tracking, Client Portal, Invoice Management, Document Management
- **7 Integrations:** QuickBooks/Xero, Microsoft 365, Payment Processing, Email Marketing, Digital Signature, CRM, Business Cards

**Key Metrics Dashboard:**
- Monthly Billable Hours
- Average Project Value
- Active Clients
- Proposal Win Rate
- Client Retention Rate
- Revenue per Partner

**First Action:** Create first client & project (10 min) → Start tracking hours and generate invoice

---

### 5. Healthcare / Wellness Services ⚕️
- **Setup Time:** 14 minutes
- **Target Audience:** Practitioners, clinic managers, health business owners
- **8 Onboarding Questions** covering: service type, staff count, scheduling, capacity, service types, payment methods, compliance, communication
- **6 Core Features:** Appointment Scheduling, Client Management, Payment Processing, Automated Reminders, Membership Management, Session Notes
- **7 Integrations:** Calendar Integration, Payment Processing, SMS Provider, Email Marketing, Telehealth Integration, Accounting, EHR/Medical Records

**Key Metrics Dashboard:**
- Daily Appointment Count
- No-show Rate
- Average Client Lifetime Value
- Booking Rate
- Monthly Revenue
- Client Retention

**First Action:** Schedule first appointment (5 min) → Client receives confirmation and reminder

---

### 6. Education / Coaching / Training 🎓
- **Setup Time:** 15 minutes
- **Target Audience:** Educators, coaches, training business owners
- **8 Onboarding Questions** covering: education type, student capacity, delivery method, pricing model, subject areas, student levels, learning platform, certifications
- **6 Core Features:** Class & Session Management, Student Portal, Assignment Tracking, Payment Processing, Progress Reporting, Communication Tools
- **7 Integrations:** Zoom/Google Meet, Stripe/PayPal, Email Service, Google Drive, LMS, Calendar Integration, Analytics

**Key Metrics Dashboard:**
- Student Enrollment
- Course Completion Rate
- Student Satisfaction
- Revenue per Student
- Student Referral Rate
- Class Attendance Rate

**First Action:** Create first course (20 min) → First student enrolls and starts learning

---

### 7. Retail / Physical Store 🏪
- **Setup Time:** 14 minutes
- **Target Audience:** Retail owners, store managers, merchandisers
- **8 Onboarding Questions** covering: store type, locations, operating hours, foot traffic, payment options, POS system, inventory tracking, omnichannel
- **6 Core Features:** Point of Sale (POS), Inventory Management, Customer Data, Sales Reporting, Employee Management, Loyalty Program
- **7 Integrations:** Square/Stripe, Barcode & Inventory, Email Marketing, SMS Provider, Analytics, E-commerce Platform, Accounting Software

**Key Metrics Dashboard:**
- Daily Revenue
- Average Transaction Value
- Foot Traffic
- Conversion Rate
- Inventory Turnover
- Customer Retention

**First Action:** Set up first product catalog (15 min) → Scan products at register and track inventory

---

### 8. Manufacturing / B2B 🏭
- **Setup Time:** 18 minutes
- **Target Audience:** Operations managers, sales teams, business owners
- **8 Onboarding Questions** covering: company type, products, production capacity, customer base, lead time, team size, supply chain complexity, certifications
- **6 Core Features:** Sales Pipeline, Order Management, Inventory Management, Production Scheduling, Supplier Management, Quality Tracking
- **7 Integrations:** ERP System, Supply Chain Visibility, CRM, Accounting Software, Quality Management, IoT Sensors, Email & Document Management

**Key Metrics Dashboard:**
- Production Capacity Utilization
- On-time Delivery Rate
- Quality Defect Rate
- Average Order Value
- Customer Lead Time
- Inventory Turnover

**First Action:** Create first production order (20 min) → Complete and fulfill customer order

---

### 9. Real Estate / Property Management 🏠
- **Setup Time:** 16 minutes
- **Target Audience:** Real estate agents, brokers, property managers
- **8 Onboarding Questions** covering: business type, portfolio size, geographic focus, team size, deal size, listing sources, management needs, MLS integration
- **6 Core Features:** Lead Management, Property Management, Document Management, Transaction Tracking, Client Communication, Reporting & Analytics
- **7 Integrations:** MLS Integration, Digital Signature, Payment Processing, Email Marketing, SMS/WhatsApp, Accounting, Client Portal

**Key Metrics Dashboard:**
- Closed Deals
- Average Commission
- Sales Pipeline Value
- Average Days on Market
- Lead to Deal Conversion
- Client Retention

**First Action:** List first property (15 min) → Property visible to buyers and agents

---

### 10. Automotive Sales / Service 🚗
- **Setup Time:** 15 minutes
- **Target Audience:** Dealership owners, service managers, sales teams
- **8 Onboarding Questions** covering: business type, inventory, brands, sales volume, service capacity, customer base, financing, operational needs
- **6 Core Features:** Sales Pipeline, Inventory Management, Service Scheduling, Customer Management, Document/Paperwork, Finance Tracking
- **7 Integrations:** Inventory Management, DMS, Financing Integration, Email Marketing, SMS Marketing, Payment Processing, Accounting

**Key Metrics Dashboard:**
- Vehicles Sold
- Average Selling Price
- Gross Profit
- Service Revenue
- Customer Retention
- Service Appointment Utilization

**First Action:** Add first vehicle to inventory (15 min) → Vehicle appears in showroom and online

---

## Data Structure

### CategoryOnboardingConfig Interface

```typescript
interface CategoryOnboardingConfig {
  // Basic info
  id: string;                          // Unique identifier
  name: string;                        // Display name
  icon: string;                        // Unicode emoji
  description: string;                 // Short description
  emoji: string;                       // Large emoji for UI
  targetAudience: string;              // Who uses this
  averageSetupTime: number;            // Minutes to complete

  // Setup flow
  onboardingQuestions: OnboardingQuestion[];      // 5-8 questions
  
  // Feature activation
  coreFeatures: string[];              // 4-6 default features
  
  // Integrations to enable
  recommendedIntegrations: IntegrationConfig[];   // 5-7 integrations
  
  // Dashboard metrics
  keyMetrics: MetricConfig[];          // 4-6 KPIs to track
  
  // Dashboard layout
  sampleDashboardLayout: DashboardLayoutConfig;
  
  // Guided first action
  firstActionGuidance: FirstActionConfig;
  
  // Industry-specific resources
  industrySpecificResources: ResourceConfig[];
}
```

### OnboardingQuestion Structure

Each question can be:
- **Type:** text, number, select, multiselect, textarea, toggle, range
- **Conditional:** Show based on other answers
- **Validation:** Required, specific format, range
- **Help Text:** Industry-specific guidance

**Example:**
```typescript
{
  id: 'delivery_options',
  label: 'What delivery options do you offer?',
  type: 'multiselect',
  options: [
    { label: 'No delivery', value: 'none' },
    { label: 'In-house delivery', value: 'inhouse' },
    { label: 'Third-party platforms', value: 'thirdparty' },
    { label: 'Both', value: 'both' },
  ],
  required: true,
  helpText: 'This determines which logistics partners to suggest'
}
```

### IntegrationConfig Structure

```typescript
interface IntegrationConfig {
  name: string;                        // e.g., "Stripe"
  category: string;                    // e.g., "Payment"
  description: string;                 // Purpose
  priority: 'critical' | 'high' | 'medium' | 'low';
  setupComplexity: 'simple' | 'moderate' | 'complex';
  estimatedSetupTime: number;          // Minutes
  icon: string;                        // Emoji
}
```

### MetricConfig Structure

```typescript
interface MetricConfig {
  name: string;                        // Display name
  description: string;                 // What it means
  metric: string;                      // Database field
  unit: string;                        // $, %, count, etc.
  target?: string;                     // Industry target
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  icon: string;                        // Emoji
}
```

---

## Implementation Guide

### 1. Feature Flag Setup

When a user completes onboarding for a category, enable their core features:

```typescript
// After onboarding completion
const config = getCategoryConfig(userCategory);
const coreFeatures = config.coreFeatures;

// Enable features in database
await enableFeaturesForUser(userId, coreFeatures);
```

### 2. Dynamic Question Display

Show only relevant questions based on category:

```typescript
// In onboarding component
const config = getCategoryConfig(selectedCategory);
const questions = config.onboardingQuestions;

// Show questions with conditional logic
questions.forEach(q => {
  if (!q.showWhen || shouldShowQuestion(q.showWhen, answers)) {
    renderQuestion(q);
  }
});
```

### 3. Suggested Integrations

After onboarding, show recommended integrations in order of priority:

```typescript
const config = getCategoryConfig(userCategory);
const integrations = config.recommendedIntegrations
  .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
  .slice(0, 5); // Show top 5
```

### 4. Dashboard Configuration

Use the sample layout to configure the user's initial dashboard:

```typescript
const config = getCategoryConfig(userCategory);
const dashboard = {
  primaryWidgets: config.sampleDashboardLayout.primaryWidgets,
  secondaryWidgets: config.sampleDashboardLayout.secondaryWidgets,
  mainChart: config.sampleDashboardLayout.mainChartType,
};
```

### 5. First Action Guidance

Guide users to their first meaningful action:

```typescript
const config = getCategoryConfig(userCategory);
const firstAction = config.firstActionGuidance;

showGuidanceModal({
  title: firstAction.action,
  description: firstAction.description,
  expectedOutcome: firstAction.expectedOutcome,
  estimatedTime: firstAction.estimatedTime,
  successCriteria: firstAction.successCriteria,
});
```

### 6. Industry Resources

Display relevant guides and templates:

```typescript
const config = getCategoryConfig(userCategory);

// Show in help section
config.industrySpecificResources.forEach(resource => {
  addToHelpCenter(resource);
});
```

---

## Integration Points

### Frontend Components

```
src/business/components/onboarding/
├── CategorySelector.tsx          // 10-category grid
├── DynamicQuestionFlow.tsx       // Display questions from config
├── FeatureEnablement.tsx         # Show core features
└── IntegrationSuggestion.tsx     # Priority integrations
```

### API Endpoints

```
POST /api/onboarding/complete
  - categoryId: string
  - answers: Record<string, any>
  - selectedIntegrations: string[]
  
Response:
  - enabledFeatures: string[]
  - suggestedIntegrations: IntegrationConfig[]
  - dashboardConfig: DashboardLayoutConfig
  - firstActionUrl: string
```

### Database

Store user's category choice and answers:

```sql
ALTER TABLE biz_users ADD COLUMN business_category VARCHAR;
ALTER TABLE biz_users ADD COLUMN onboarding_answers JSONB;
ALTER TABLE biz_users ADD COLUMN enabled_features TEXT[];

-- Track integrations user has connected
CREATE TABLE user_connected_integrations (
  user_id UUID,
  integration_name VARCHAR,
  connected_at TIMESTAMP,
  config JSONB
);
```

---

## Customization Examples

### Adding a New Category

1. Create new config object following the interface
2. Add to `allCategoryConfigs` export
3. Add tests for question flow

```typescript
export const myCustomCategory: CategoryOnboardingConfig = {
  id: 'my_category',
  name: 'My Business Type',
  icon: '🏢',
  // ... full config
};

export const allCategoryConfigs = {
  // ... existing
  my_category: myCustomCategory,
};
```

### Modifying Integrations

Update the priority and setup complexity based on real data:

```typescript
{
  name: 'Stripe',
  priority: 'critical',  // Change if needed
  setupComplexity: 'simple',
  estimatedSetupTime: 15,  // Adjust based on feedback
}
```

### Adjusting Metrics

Based on industry benchmarks, update targets:

```typescript
{
  name: 'Churn Rate',
  target: '< 5%',  // Update with real benchmarks
  frequency: 'monthly'
}
```

---

## Benefits of This Matrix Approach

### For Users
✅ **Faster Setup:** Category-specific questions (12-18 min vs 30+ min generic)
✅ **Relevant Features:** Only enable what they need
✅ **Smart Defaults:** Suggested integrations save research time
✅ **Industry Guidance:** Best practices and resources
✅ **Clear First Steps:** Obvious first action to take

### For Product
✅ **Data Quality:** Specific answers improve setup
✅ **Feature Adoption:** Enable relevant features = better engagement
✅ **Integration Success:** Suggest priorities = faster ROI
✅ **Metrics Relevance:** Show KPIs users actually care about
✅ **Growth Loop:** Industry resources drive long-term retention

### For Operations
✅ **Support Efficiency:** Category context in tickets
✅ **Onboarding Consistency:** Standardized experience
✅ **Analytics:** Track completion by category
✅ **Scalability:** Add categories without code changes
✅ **A/B Testing:** Compare category completion rates

---

## Key Metrics by Category

### Setup Completion Rate
Track percentage of users completing onboarding per category:
- Restaurant: target 85%
- E-Commerce: target 88%
- SaaS: target 80%
- Professional Services: target 82%
- Healthcare: target 86%
- Education: target 84%
- Retail: target 87%
- Manufacturing: target 75%
- Real Estate: target 83%
- Automotive: target 81%

### Time to First Action
Track how quickly users complete first meaningful action:
- Restaurant: target < 10 min
- E-Commerce: target < 15 min
- SaaS: target < 20 min
- Professional Services: target < 15 min
- Healthcare: target < 8 min
- Education: target < 25 min
- Retail: target < 20 min
- Manufacturing: target < 30 min
- Real Estate: target < 20 min
- Automotive: target < 20 min

### Feature Adoption
Track % of users adopting core features within first month:
- All categories: target > 70%

---

## Advanced Features

### Conditional Questions

Show questions based on previous answers:

```typescript
{
  id: 'third_party_delivery',
  label: 'Which platforms?',
  type: 'multiselect',
  showWhen: {
    questionId: 'delivery_options',
    value: ['thirdparty', 'both']
  },
  options: [
    { label: 'UberEats', value: 'ubereats' },
    { label: 'DoorDash', value: 'doordash' },
    // ...
  ]
}
```

### Branching Flows

Different question sets based on business size:

```typescript
const questions = category.onboardingQuestions.filter(q => {
  // Small business path
  if (businessSize === 'solo' && q.id.includes('enterprise')) {
    return false;
  }
  return true;
});
```

### Smart Defaults

Use answers to pre-configure integrations:

```typescript
const enableIntegrations = (answers) => {
  // If they have online ordering, suggest email marketing
  if (answers.online_ordering) {
    suggestIntegration('email_marketing');
  }
  
  // If multi-location, suggest inventory sync
  if (answers.location_count > 1) {
    suggestIntegration('inventory_sync');
  }
};
```

---

## File Reference

**Main Implementation:**
- `/src/business/config/category-onboarding-matrix.ts` (2,500+ lines)

**Using the Data:**
- Components import: `import { getCategoryConfig } from '...'`
- API endpoints consume: `const config = getCategoryConfig(categoryId)`
- Dashboard initializes: `const widgets = config.sampleDashboardLayout.primaryWidgets`

**Testing:**
- Each category validates 5-8 questions
- Integration setup times are realistic
- First action takes estimated time
- Metrics are industry-relevant

---

## Next Steps for Implementation

1. **Integration with Onboarding Flow**
   - Update `OnboardingOrchestrator.tsx` to use category config
   - Display category selector early in flow
   - Store category with user data

2. **Feature Flagging**
   - Connect core features to feature flag system
   - Enable/disable by category
   - Track adoption by feature

3. **Dashboard Builder**
   - Use `sampleDashboardLayout` to build initial dashboard
   - Allow users to customize widgets
   - Save preferences to database

4. **Integration Marketplace**
   - Priority sort by category
   - Show setup complexity
   - Track connection rates

5. **Analytics**
   - Track completion rate by category
   - Time to first action by category
   - Feature adoption by category
   - Integration success rate

6. **A/B Testing**
   - Compare category-specific vs generic flows
   - Measure completion rate improvement
   - Measure feature adoption improvement

7. **Documentation**
   - Create category-specific getting started guides
   - Link from onboarding to help center
   - Update with real customer data

---

## Conclusion

This category-specific onboarding matrix provides a structured, data-driven approach to customizing the user experience for 10 major business types. By asking the right questions, enabling relevant features, and guiding first actions, we can significantly improve onboarding completion rates and time-to-value.

The JSON-based configuration allows for easy updates, A/B testing, and scaling to new categories without code changes.

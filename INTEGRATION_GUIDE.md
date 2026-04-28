# Integration Guide: Parallel Agent Deliverables

**Document Version**: 1.0  
**Date**: April 26, 2026  
**Status**: Production-Ready  
**Scope**: Complete integration of Smart Onboarding, Automation Engine, Category-Specific Onboarding, and Advanced Onboarding systems

---

## Table of Contents

1. [Overview & Architecture](#overview--architecture)
2. [Backend Setup (10 Steps)](#backend-setup-10-steps)
3. [Frontend Setup (10 Steps)](#frontend-setup-10-steps)
4. [Configuration Steps (5 Steps)](#configuration-steps-5-steps)
5. [Code Examples (15+ Examples)](#code-examples)
6. [Deployment Checklist (20 Items)](#deployment-checklist-20-items)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Testing Guide](#testing-guide)
9. [Rollback Plan](#rollback-plan)
10. [Monitoring & Metrics](#monitoring--metrics)
11. [FAQ](#faq)

---

## Overview & Architecture

### System Components

The integrated system consists of four parallel agent deliverables:

**Smart Onboarding** (Phase 1)
- 5 feature preference questions
- Feature toggling capability
- Conditional navigation
- Storage: Supabase + localStorage

**Advanced Onboarding** (Phase 2)
- 9-step comprehensive flow
- AI-powered extraction
- Theme selection
- Storage: Supabase

**Category-Specific Onboarding** (Phase 3)
- 10 business types
- Category-tailored setup
- Integration recommendations
- Storage: Config file + Supabase

**Automation Engine** (Phase 2B)
- 18 condition operators
- 6 trigger types
- 6 action types
- Complete rule engine
- Storage: Supabase (6 tables)

### Key Metrics by Component

| Component | Features | Operators | Triggers | Actions | Tables |
|-----------|----------|-----------|----------|---------|--------|
| Smart | 5 | - | - | - | 2 |
| Advanced | 9 steps | - | - | - | 3 |
| Category | 10 types | - | - | - | 4 |
| Automation | 6 | 18 | 6 | 6 | 6 |

---

## Backend Setup (10 Steps)

### Step 1: Initialize Supabase Database

```bash
cd /path/to/App\ Creation\ Request-2
supabase migration up
```

**Expected tables after migrations**:
- automation_rules
- automation_conditions
- automation_actions
- automation_executions
- automation_execution_logs
- automation_email_templates
- business_products

### Step 2: Configure RLS Policies

```bash
supabase db rls
```

Verify all tables have RLS enabled. Expected policies:
- Users access only own business data
- Service role bypasses RLS

### Step 3: Deploy Edge Functions

```bash
supabase functions deploy automation-engine
supabase functions deploy smart-onboarding
supabase functions deploy category-onboarding
```

### Step 4: Configure Environment Variables

Add to `.env.local`:

```bash
VITE_SUPABASE_URL=your-url
VITE_SUPABASE_ANON_KEY=your-key
AUTOMATION_ENABLED=true
AUTOMATION_MAX_RULES_PER_BUSINESS=100
SMART_ONBOARDING_ENABLED=true
ADVANCED_ONBOARDING_ENABLED=true
CATEGORY_ONBOARDING_ENABLED=true
```

### Step 5: Initialize Type Definitions

```bash
npm install
npm run build:types
npm run type-check
```

Type definition files to verify:
- src/business/types/automation.ts (500+ lines)
- src/business/types/advanced-onboarding.ts
- src/business/types/category-onboarding.ts
- src/business/types/smart-onboarding.ts

### Step 6: Set Up Rule Engine Service

File: `src/business/services/automation/ruleEngine.ts`

Verify contains:
- 18 condition operators (fully implemented)
- 6 trigger types (fully implemented)
- Complete evaluation logic
- Helper functions

### Step 7: Initialize API Routes

Verify these files exist:
- src/app/api/automation.ts (20+ functions)
- src/business/api/onboarding.ts
- src/business/api/category-onboarding.ts

All routes must verify user business ownership.

### Step 8: Set Up Caching Layer (Optional)

```bash
npm install @supabase/cached-instance
```

Cache keys to implement:
```typescript
const CACHE_KEYS = {
  AUTOMATION_RULES: (businessId) => `automation:rules:${businessId}`,
  CATEGORY_CONFIG: (category) => `category:${category}`,
  FEATURE_PREFS: (businessId) => `features:${businessId}`,
};
```

### Step 9: Configure Logging & Error Tracking

```typescript
// File: src/business/services/logging.ts
import { captureException } from '@sentry/react';

export const logAutomationEvent = (event: {
  ruleId: string;
  businessId: string;
  action: string;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
}) => {
  console.log(`[Automation] ${event.action}:`, event);
  if (event.status === 'error') {
    captureException(new Error(`Automation failed: ${event.action}`));
  }
};
```

### Step 10: Verify Database Integrity

```bash
npx ts-node scripts/verify-database.ts
```

Expected verification output:
- All automation tables present
- RLS policies enabled
- Indexes created
- Connections successful

---

## Frontend Setup (10 Steps)

### Step 1: Install Dependencies

```bash
npm install
npm list @supabase/supabase-js framer-motion
```

### Step 2: Create Supabase Client

```typescript
// File: src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Step 3: Set Up Business Context

File: `src/business/context/BusinessContext.tsx`

Must export:
- useBusinessContext hook
- canAccessFeature helper
- featurePreferences state
- automationEnabled flag

### Step 4: Integrate Smart Onboarding

Add to routes:
```typescript
import { SmartOnboarding } from '@/components/SmartOnboarding';
import { FeatureSettings } from '@/components/FeatureSettings';

const routes = [
  { path: '/business/onboarding', component: SmartOnboarding },
  { path: '/app/features-settings', component: FeatureSettings },
];
```

### Step 5: Integrate Advanced Onboarding

Add routes:
```typescript
import { AdvancedLandingPage } from '@/pages/AdvancedLandingPage';
import { OnboardingOrchestrator } from '@/components/onboarding/OnboardingOrchestrator';

const routes = [
  { path: '/landing-advanced', component: AdvancedLandingPage },
  { path: '/business/onboarding-advanced', component: OnboardingOrchestrator },
];
```

### Step 6: Set Up Automation UI

Add automation routes:
```typescript
import { AutomationDashboard } from '@/components/automation/AutomationDashboard';
import { RuleBuilder } from '@/components/automation/RuleBuilder';
import { TemplateLibrary } from '@/components/automation/TemplateLibrary';

const routes = [
  { path: '/app/automation', component: AutomationDashboard },
  { path: '/app/automation/rules', component: RuleBuilder },
  { path: '/app/automation/templates', component: TemplateLibrary },
];
```

### Step 7: Add Category Selector

```typescript
import { CATEGORY_ONBOARDING_CONFIG } from '@/config/category-onboarding-matrix';

export const CategorySelector = () => {
  return (
    <div className="category-selector">
      {Object.entries(CATEGORY_ONBOARDING_CONFIG).map(([key, config]) => (
        <CategoryCard key={key} category={key} config={config} />
      ))}
    </div>
  );
};
```

### Step 8: Implement Conditional Navigation

```typescript
export const Navigation = () => {
  const { canAccessFeature } = useBusinessContext();
  
  const navItems = [
    { label: 'Dashboard', href: '/app/dashboard', visible: true },
    { label: 'Products', href: '/app/products', visible: canAccessFeature('product_catalog') },
    { label: 'Leads', href: '/app/leads', visible: canAccessFeature('lead_management') },
    { label: 'Automation', href: '/app/automation', visible: canAccessFeature('automation') },
  ];
  
  return <nav>{navItems.filter(item => item.visible).map(item => ...)}</nav>;
};
```

### Step 9: Create API Integration Layer

```typescript
// File: src/business/api/client.ts
import { supabase } from '@/lib/supabase';

export const automationApi = {
  getRules: async (businessId: string) => {
    return supabase.from('automation_rules').select('*').eq('business_id', businessId);
  },
  createRule: async (businessId: string, rule: any) => {
    return supabase.from('automation_rules').insert([{ ...rule, business_id: businessId }]).select();
  },
  // ... more methods
};
```

### Step 10: Create Custom Hooks

```typescript
// File: src/business/hooks/useAutomation.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { automationApi } from '@/api/client';

export const useAutomation = (businessId: string) => {
  const rulesQuery = useQuery({
    queryKey: ['automation-rules', businessId],
    queryFn: () => automationApi.getRules(businessId),
  });

  const createRuleMutation = useMutation({
    mutationFn: (rule: any) => automationApi.createRule(businessId, rule),
    onSuccess: () => rulesQuery.refetch(),
  });

  return {
    rules: rulesQuery.data || [],
    isLoading: rulesQuery.isLoading,
    createRule: createRuleMutation.mutate,
  };
};
```

---

## Configuration Steps (5 Steps)

### Step 1: Configure Onboarding Strategy

```typescript
// File: src/business/config/onboarding.ts
export const ONBOARDING_CONFIG = {
  strategy: 'smart',
  smart: { enabled: true, questions: 5, estimatedTime: '3-5 minutes' },
  advanced: { enabled: true, steps: 9, estimatedTime: '10-15 minutes' },
  category: { enabled: true, categories: 10 },
  redirectAfterComplete: '/app/dashboard',
  allowSkip: true,
};
```

### Step 2: Configure Automation

```typescript
// File: src/business/config/automation.ts
export const AUTOMATION_CONFIG = {
  enabled: true,
  maxRulesPerBusiness: 100,
  maxConditionsPerRule: 20,
  executionTimeout: 30000,
  dryRunEnabled: true,
  executionLogging: true,
};
```

### Step 3: Configure Categories

```typescript
// File: src/business/config/categories.ts
import { CATEGORY_ONBOARDING_CONFIG } from '@/config/category-onboarding-matrix';

export const CATEGORY_CONFIG = {
  autoDetect: true,
  categories: CATEGORY_ONBOARDING_CONFIG,
  recommendations: { enabled: true, minRelevanceScore: 0.7 },
};
```

### Step 4: Configure Feature Flags

```typescript
// File: src/business/config/features.ts
export const FEATURE_FLAGS = {
  smartOnboarding: { enabled: true, rolloutPercentage: 100 },
  advancedOnboarding: { enabled: true, rolloutPercentage: 50 },
  automation: { enabled: true, dryRun: true },
  categoryOnboarding: { enabled: true, rolloutPercentage: 75 },
};
```

### Step 5: Configure Analytics

```typescript
// File: src/business/config/analytics.ts
export const ANALYTICS_CONFIG = {
  enabled: true,
  provider: 'mixpanel',
  events: {
    onboarding_started: true,
    onboarding_completed: true,
    automation_rule_created: true,
    feature_accessed: true,
  },
};
```

---

## Code Examples

### Example 1: Query Categories

```typescript
import { CATEGORY_ONBOARDING_CONFIG } from '@/config/category-onboarding-matrix';

export const getCategories = async () => {
  return Object.entries(CATEGORY_ONBOARDING_CONFIG).map(([key, config]) => ({
    id: key,
    name: config.name,
    icon: config.icon,
    description: config.description,
  }));
};
```

### Example 2: Apply Template

```typescript
export const applyTemplate = async (businessId: string, categoryKey: string) => {
  const config = CATEGORY_ONBOARDING_CONFIG[categoryKey];
  
  const products = config.initial_products.map(p => ({
    business_id: businessId,
    ...p,
  }));

  const { data, error } = await supabase
    .from('business_products')
    .insert(products)
    .select();

  if (error) throw error;
  return data;
};
```

### Example 3: Track Events

```typescript
export const trackEvent = async (event: {
  businessId: string;
  eventType: string;
  metadata?: Record<string, any>;
}) => {
  const { error } = await supabase
    .from('behavior_events')
    .insert([{
      business_id: event.businessId,
      event_type: event.eventType,
      metadata: event.metadata,
      created_at: new Date().toISOString(),
    }]);

  if (error) console.error('Track event failed:', error);
};
```

### Example 4: Get Recommendations

```typescript
export const getRecommendations = async (businessId: string) => {
  const { data: business } = await supabase
    .from('biz_users')
    .select('category, feature_preferences')
    .eq('business_id', businessId)
    .single();

  return {
    category: business.category,
    suggestedRules: [
      { name: 'Welcome Leads', trigger: 'lead_added', action: 'send_email' },
      { name: 'Follow Up', trigger: 'inactivity', action: 'send_email' },
    ],
  };
};
```

### Example 5: Feature Gating

```typescript
export const FeatureGated: React.FC = () => {
  const { canAccessFeature } = useBusinessContext();

  if (!canAccessFeature('automation')) {
    return <div className="locked">Feature not enabled</div>;
  }

  return <AutomationDashboard />;
};
```

### Example 6: Create Automation Rule

```typescript
export const createRule = async (businessId: string, rule: any) => {
  const { data, error } = await supabase
    .from('automation_rules')
    .insert([{ ...rule, business_id: businessId }])
    .select();

  if (error) throw error;
  return data?.[0];
};
```

### Example 7: Test Rule Trigger

```typescript
export const testTrigger = async (ruleId: string, testData: any) => {
  const { data, error } = await supabase
    .rpc('test_automation_trigger', {
      rule_id: ruleId,
      test_data: testData,
    });

  if (error) throw error;
  return data;
};
```

### Example 8: Get Rules

```typescript
export const getRules = async (businessId: string) => {
  const { data, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};
```

### Example 9: Update Preferences

```typescript
export const updatePreferences = async (
  businessId: string,
  preferences: Record<string, boolean>,
) => {
  // Save locally first
  localStorage.setItem(`prefs_${businessId}`, JSON.stringify(preferences));

  // Save to Supabase
  const { error } = await supabase
    .from('biz_users')
    .update({ feature_preferences: preferences })
    .eq('business_id', businessId);

  if (error) throw error;
};
```

### Example 10: Smart Onboarding Component

```typescript
export const SmartOnboarding: React.FC<{ businessId: string }> = ({ businessId }) => {
  const [prefs, setPrefs] = useState({ product_catalog: false, automation: false });
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      await updatePreferences(businessId, prefs);
      window.location.href = '/app/dashboard';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1>Setup Features</h1>
      {/* Feature toggles */}
      <button onClick={handleComplete} disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Complete'}
      </button>
    </div>
  );
};
```

### Example 11: Category Matching

```typescript
export const findCategory = (
  description: string,
  keywords: string[] = [],
): string | null => {
  let bestMatch = null;
  let highestScore = 0;

  for (const [key, config] of Object.entries(CATEGORY_ONBOARDING_CONFIG)) {
    let score = 0;
    const configKeywords = [config.name.toLowerCase(), ...config.description.toLowerCase().split(' ')];

    for (const keyword of keywords) {
      if (configKeywords.some(k => k.includes(keyword.toLowerCase()))) score += 10;
    }

    if (score > highestScore) {
      highestScore = score;
      bestMatch = key;
    }
  }

  return bestMatch;
};
```

### Example 12: Error Handling

```typescript
export const handleError = (error: unknown) => {
  if (error instanceof Error) {
    if ('code' in error) {
      return { type: 'database', message: error.message };
    }
    if (error.message.includes('validation')) {
      return { type: 'validation', message: error.message };
    }
  }
  return { type: 'unknown', message: 'An error occurred' };
};
```

### Example 13: Type Safe Operations

```typescript
import type { AutomationRule, ConditionOperator } from '@/types/automation';

export const createTypedRule = (state: {
  name: string;
  trigger: string;
  conditions: any[];
  actions: any[];
}): AutomationRule => ({
  id: crypto.randomUUID(),
  business_id: 'biz_123',
  ...state,
  enabled: true,
  created_at: new Date(),
  updated_at: new Date(),
  execution_count: 0,
});
```

### Example 14: Unit Test

```typescript
import { describe, it, expect } from 'vitest';

describe('Automation', () => {
  it('should create rule', () => {
    const rule = createTypedRule({
      name: 'Test',
      trigger: 'lead_added',
      conditions: [],
      actions: [],
    });
    expect(rule.name).toBe('Test');
  });
});
```

### Example 15: Integration Test

```typescript
describe('Automation Integration', () => {
  it('should create and fetch rule', async () => {
    const rule = await createRule('biz_123', {
      name: 'Test Rule',
      trigger: 'lead_added',
      enabled: true,
    });

    expect(rule).toBeDefined();

    const rules = await getRules('biz_123');
    expect(rules.some(r => r.id === rule.id)).toBe(true);
  });
});
```

---

## Deployment Checklist (20 Items)

### Pre-Deployment (5 Items)

- [ ] **1. Code Review** - All changes reviewed and approved
- [ ] **2. Database Backup** - Full backup taken (`supabase db push --dry-run`)
- [ ] **3. TypeScript** - No type errors (`npm run type-check`)
- [ ] **4. Dependencies** - All installed (`npm install`, `npm audit`)
- [ ] **5. Environment** - All variables configured (SUPABASE_URL, etc.)

### Migration & Database (5 Items)

- [ ] **6. Apply Migrations** - Executed successfully (`supabase migration up`)
- [ ] **7. Verify Tables** - All tables created with correct schema
- [ ] **8. RLS Policies** - Security policies in place (`supabase db rls`)
- [ ] **9. Indexes** - Performance indexes created
- [ ] **10. DB Connection** - API can connect to database

### Frontend & Configuration (5 Items)

- [ ] **11. Build Bundle** - No build errors (`npm run build:business`)
- [ ] **12. Assets Bundled** - All assets included in dist
- [ ] **13. Feature Flags** - All properly configured
- [ ] **14. Routes Accessible** - /business/onboarding, /app/automation, etc.
- [ ] **15. Components Render** - All components display correctly

### Testing (5 Items)

- [ ] **16. Unit Tests** - All pass (`npm run test`)
- [ ] **17. Integration Tests** - API integration works
- [ ] **18. Performance** - No significant slowdowns
- [ ] **19. Security** - No vulnerabilities (`npm audit --production`)
- [ ] **20. Staging** - Onboarding, automation, features all work

---

## Troubleshooting Guide

### Issue 1: TypeScript Errors

**Solution**:
```bash
npm install @types/node@latest
rm -rf node_modules/.vite
npm run build:types
npm run type-check
```

### Issue 2: Supabase Connection Fails

**Solution**:
```bash
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
# If wrong, update .env.local and restart
npm run dev:business
```

### Issue 3: RLS Blocks Reads

**Solution**:
```sql
-- In Supabase SQL Editor
SELECT tablename, rowsecurity FROM pg_tables 
WHERE tablename = 'automation_rules';

-- Add missing policy if needed
CREATE POLICY "read_own"
ON automation_rules FOR SELECT
USING (business_id = current_user_id());
```

### Issue 4: Rules Don't Execute

**Solution**:
```typescript
const { data: rule } = await supabase
  .from('automation_rules')
  .select('enabled')
  .eq('id', ruleId)
  .single();

if (!rule.enabled) {
  await supabase
    .from('automation_rules')
    .update({ enabled: true })
    .eq('id', ruleId);
}
```

### Issue 5: Prefs Not Saving

**Solution**:
```typescript
const saved = localStorage.getItem('biz_user_prefs');
console.log('LocalStorage:', saved);

const { error } = await supabase
  .from('biz_users')
  .update({ feature_preferences: prefs })
  .eq('business_id', businessId);

if (error) console.error('Error:', error);
```

### Issue 6: Templates Not Applying

**Solution**:
```typescript
const categoryExists = 'restaurant' in CATEGORY_ONBOARDING_CONFIG;
console.log('Category exists:', categoryExists);

const { data: products } = await supabase
  .from('business_products')
  .select('*')
  .eq('business_id', businessId)
  .eq('category', categoryKey);

console.log('Products created:', products.length);
```

### Issue 7: Redirect Loop

**Solution**:
```typescript
const { data: user } = await supabase
  .from('biz_users')
  .select('onboarding_status')
  .eq('business_id', businessId)
  .single();

if (user?.onboarding_status === 'in_progress') {
  await supabase
    .from('biz_users')
    .update({ onboarding_status: 'completed' })
    .eq('business_id', businessId);
}
```

### Issue 8: Templates Blank

**Solution**:
```typescript
const { data: templates } = await supabase
  .from('automation_email_templates')
  .select('*')
  .eq('template_id', 'welcome_email');

if (!templates?.length) {
  await supabase
    .from('automation_email_templates')
    .insert([{
      template_id: 'welcome_email',
      subject: 'Welcome!',
      body: '<h1>Welcome</h1>',
    }]);
}
```

### Issue 9: Slow Queries

**Solution**:
```sql
-- In Supabase SQL Editor
CREATE INDEX idx_rules_business
ON automation_rules(business_id, enabled);

EXPLAIN ANALYZE
SELECT * FROM automation_rules
WHERE business_id = 'biz_123' AND enabled = true;
```

### Issue 10: Features Not Showing

**Solution**:
```typescript
queryClient.invalidateQueries({ queryKey: ['features'] });

const stored = localStorage.getItem('biz_user');
if (stored) {
  const user = JSON.parse(stored);
  user.feature_preferences = newPreferences;
  localStorage.setItem('biz_user', JSON.stringify(user));
}

window.location.reload();
```

---

## Testing Guide

### Unit Tests

```bash
npm run test
npm run test -- automation.test.ts
npm run test -- --coverage
npm run test -- --watch
```

### Integration Tests

```bash
npm run test:integration
DATABASE_URL=staging npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
npm run test:e2e -- onboarding.spec.ts
npm run test:e2e -- --headed
```

---

## Rollback Plan

### Step 1: Identify Issue

Check Sentry/error logs for automation_* errors

### Step 2: Quick Disable

```typescript
// File: src/business/config/features.ts
export const FEATURE_FLAGS = {
  automation: { enabled: false }, // Disable
};
```

### Step 3: Database Rollback

```bash
supabase migration repair --down
supabase migration up --version <previous_version>
```

### Step 4: Code Rollback

```bash
git log --oneline | head -10
git revert <commit_hash>
git push origin main
```

### Step 5: Redeploy

```bash
npm run build:business
vercel deploy --prod
```

---

## Monitoring & Metrics

### Key Metrics

```typescript
export const metrics = {
  onboarding_completion_rate: 0.0,
  automation_rules_active: 0,
  automation_success_rate: 0.0,
  error_rate: 0.0,
};
```

### Alert Thresholds

```typescript
export const ALERT_THRESHOLDS = {
  error_rate: { warning: 2, critical: 5 },
  onboarding_rate: { warning: 70, critical: 50 },
  automation_success: { warning: 95, critical: 90 },
};
```

---

## FAQ

**Q1: How do I choose the onboarding strategy?**
- Smart: Quick 5 questions (default)
- Advanced: Full 9-step flow with AI
- Category: Business type first

**Q2: Can I customize automation triggers?**
Yes, edit `src/business/config/automation.ts` and implement in rule engine.

**Q3: How do I add a new category?**
Edit `src/business/config/category-onboarding-matrix.ts` with all required fields.

**Q4: How do I track feature usage?**
Check `analytics_events` table with `event_type = 'feature_accessed'`.

**Q5: What if a rule fails?**
Check `automation_executions` table for error details.

**Q6: Can users change features after signup?**
Yes, via `/app/features-settings` component.

**Q7: How do I migrate existing users?**
Create migration script to infer preferences from old data.

**Q8: What's the max rules per business?**
Default 100, configurable in `AUTOMATION_CONFIG`.

**Q9: How do I test rules without executing?**
Use dry-run mode: `automationApi.dryRunRule(ruleId, testData)`.

**Q10: Can I use webhooks?**
Not in Phase 2B, planned for Phase 3.

**Q11: How do I debug conditions?**
Enable debug logging with `{ debug: true }` flag.

**Q12: What's in category templates?**
8 questions, 6 features, 7 integrations, 6 metrics per category.

**Q13: How do I handle feature requests?**
Track in table, analyze patterns, plan for Phase 3.

**Q14: Can I schedule rules?**
Not directly, use date operators + inactivity trigger instead.

---

## Summary

This integration guide covers:

1. **Backend Setup** - 10 steps for database, APIs, services
2. **Frontend Setup** - 10 steps for components, hooks, routing
3. **Configuration** - 5 steps for strategy, automation, categories
4. **Code Examples** - 15+ ready-to-use implementations
5. **Deployment** - 20-item checklist
6. **Troubleshooting** - Solutions for 10 common issues
7. **Testing** - Unit, integration, E2E examples
8. **Rollback** - Safe recovery procedures
9. **Monitoring** - Metrics and alerts
10. **FAQ** - 14 common questions answered

**Expected Timeline**: 6-10 hours total
- Backend: 1-2 hours
- Frontend: 2-3 hours
- Testing: 2-4 hours
- Deployment: 30-60 minutes

**Success Criteria**:
- All migrations applied
- No TypeScript errors
- Onboarding completes end-to-end
- Automation rules work
- Features toggle correctly
- All tests pass
- Production deployment successful

---

**Document Status**: Production Ready  
**Last Updated**: April 26, 2026  
**Version**: 1.0

**Next Steps**: Begin with Backend Setup Step 1

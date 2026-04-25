# Leads Management - Quick Start Guide

This guide will help you get started with the Leads Management module in 15 minutes.

## Prerequisites

- Node.js 18+ installed
- Supabase account and database
- Git repository cloned and updated

## 1. Apply Database Migration (2 minutes)

Apply the leads module migration to your database:

```bash
# Option A: Using Supabase CLI
supabase migration up

# Option B: Copy-paste SQL
# Go to Supabase Dashboard → SQL Editor
# Copy content of supabase/migrations/20260425_leads_module_complete.sql
# Paste and run
```

Verify tables were created:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'lead%';
```

Should return:
- leads
- lead_activities
- lead_imports
- lead_segments
- lead_analytics

## 2. Import Services (1 minute)

All services are already created in your codebase:

```typescript
// Lead Management
import { 
  createLead, 
  getLeads, 
  updateLead, 
  deleteLead,
  bulkOperateLeads 
} from '@/services/lead-management';

// Scoring
import { 
  calculateLeadScore, 
  scoreAllLeads, 
  getTopLeads,
  categorizeLeadsByScore 
} from '@/services/lead-scoring-engine';

// Segmentation & Analytics
import { 
  createSegment, 
  getSegmentLeads, 
  getConversionFunnel,
  calculateAnalytics 
} from '@/services/lead-segmentation';
```

## 3. Create Your First Lead (2 minutes)

```typescript
import { createLead } from '@/services/lead-management';
import { LeadSource, LeadPriority } from '@/types/leads';

const lead = await createLead('your-business-id', {
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1-555-0123',
  company: 'Tech Startup Inc',
  product_interest: 'Pro Plan',
  source: LeadSource.Website,
  priority: LeadPriority.High,
  deal_value: 25000,
  tags: ['startup', 'tech'],
});

console.log('Created lead:', lead?.id);
```

## 4. Get and Filter Leads (2 minutes)

```typescript
import { getLeads, LeadStage, LeadPriority } from '@/services/lead-management';

// Get all leads for business
const result = await getLeads('your-business-id');
console.log(`Total leads: ${result?.total}`);

// With filters
const filtered = await getLeads('your-business-id', 
  {
    stage: LeadStage.Qualified,
    priority: LeadPriority.High,
    search: 'tech',
    min_deal_value: 10000,
  },
  {
    page: 1,
    limit: 20,
    sort_by: 'lead_score',
    sort_order: 'desc',
  }
);

console.log(`Found ${filtered?.leads.length} qualified leads`);
```

## 5. Score Leads (2 minutes)

```typescript
import { scoreAllLeads, getTopLeads, categorizeLeadsByScore } from '@/services/lead-scoring-engine';

// Score all leads for your business
const scores = await scoreAllLeads('your-business-id');
console.log(`Scored ${scores.length} leads`);

// Get top 10 leads
const topLeads = await getTopLeads('your-business-id', 10);
console.log('Top leads:');
topLeads.forEach(lead => {
  console.log(`${lead.name} - Score: ${lead.lead_score}`);
});

// Categorize by temperature
const categories = await categorizeLeadsByScore('your-business-id');
console.log(`Hot leads: ${categories.hot.length}`);
console.log(`Warm leads: ${categories.warm.length}`);
console.log(`Cool leads: ${categories.cool.length}`);
console.log(`Cold leads: ${categories.cold.length}`);
```

## 6. Create Segments (3 minutes)

```typescript
import { createSegment, getSegmentLeads } from '@/services/lead-segmentation';

// Create "High-Value Prospects" segment
const segment = await createSegment('your-business-id', {
  name: 'High-Value Prospects',
  description: 'Leads with $50k+ deal value',
  filter_rules: [
    {
      field: 'deal_value',
      operator: 'gte',
      value: 50000,
    },
    {
      field: 'stage',
      operator: 'neq',
      value: 'lost',
    },
  ],
});

console.log(`Created segment: ${segment?.name}`);

// Get leads in segment
if (segment) {
  const response = await getSegmentLeads(segment.id);
  console.log(`${response?.total_count} leads in segment`);
  response?.leads.forEach(lead => {
    console.log(`- ${lead.name}: $${lead.deal_value}`);
  });
}
```

## 7. View Analytics (2 minutes)

```typescript
import { getConversionFunnel, calculateAnalytics, getSourceAnalytics } from '@/services/lead-segmentation';

// Get conversion funnel
const funnel = await getConversionFunnel('your-business-id');
console.log('Conversion Funnel:');
funnel.forEach(stage => {
  console.log(`${stage.stage}: ${stage.count} leads (${stage.conversion_from_previous}% conversion)`);
});

// Get today's metrics
const today = new Date().toISOString().split('T')[0];
const analytics = await calculateAnalytics('your-business-id', today);
console.log(`Today's Stats:`);
console.log(`  Created: ${analytics?.leads_created}`);
console.log(`  Conversion rate: ${analytics?.conversion_rate}%`);
console.log(`  Revenue: $${analytics?.total_revenue}`);

// Performance by source
const sources = await getSourceAnalytics('your-business-id');
console.log('Performance by Source:');
sources?.forEach(source => {
  console.log(`${source.source}: ${source.conversion_rate}% conversion rate`);
});
```

## 8. Common Tasks

### Update Lead Stage
```typescript
import { updateLead } from '@/services/lead-management';
import { LeadStage } from '@/types/leads';

await updateLead('lead-id', {
  stage: LeadStage.Proposal,
});
```

### Bulk Change Stage
```typescript
import { bulkOperateLeads } from '@/services/lead-management';

await bulkOperateLeads({
  lead_ids: ['lead-1', 'lead-2', 'lead-3'],
  operation: 'change_stage',
  operation_data: { stage: 'qualified' },
});
```

### Add Tags
```typescript
import { bulkOperateLeads } from '@/services/lead-management';

await bulkOperateLeads({
  lead_ids: ['lead-1', 'lead-2'],
  operation: 'add_tags',
  operation_data: { tags: ['hot', 'priority'] },
});
```

### Assign to Team Member
```typescript
import { bulkOperateLeads } from '@/services/lead-management';

await bulkOperateLeads({
  lead_ids: ['lead-1', 'lead-2'],
  operation: 'assign',
  operation_data: { assigned_to: 'user-uuid' },
});
```

### Find Duplicates
```typescript
import { findDuplicates } from '@/services/lead-management';

const duplicates = await findDuplicates('your-business-id', 0.85);
console.log(`Found ${duplicates?.length} potential duplicates`);
duplicates?.forEach(dup => {
  console.log(`${dup.matching_fields.join(', ')} match`);
});
```

## 9. UI Integration

The React components are already built and integrated:

```typescript
// These components are in /src/business/components/:
// - LeadsPage.tsx (main page)
// - LeadDetailPanel.tsx (detail view)
// - LeadFormModal.tsx (create/edit)
// - LeadImportModal.tsx (CSV import)
// - LeadLineagePanel.tsx (duplicates)
// - LeadScoreCard.tsx (scoring)

// They're already integrated into the routing:
// http://your-app.com/app/leads
```

## 10. Type Safety

All functions are fully typed:

```typescript
import type { 
  Lead, 
  LeadActivity, 
  LeadSegment,
  LeadStatsResponse,
  ConversionFunnel,
} from '@/types/leads';

const lead: Lead = {
  id: 'xxx',
  business_id: 'xxx',
  name: 'John',
  // ... all fields typed
};
```

## Configuration

### Adjust Scoring Weights

Edit `src/services/lead-scoring-engine.ts`:

```typescript
export const DEFAULT_SCORING_CRITERIA: ScoringCriteria = {
  engagement_weight: 20,  // Change to 30 for more engagement weight
  stage_weight: 30,
  priority_weight: 20,
  deal_value_weight: 20,
  recency_weight: 10,
};
```

### Add Custom Lead Fields

```typescript
const lead = await createLead('biz-id', {
  // Standard fields
  name: 'John',
  // Custom fields
  custom_fields: {
    industry: 'SaaS',
    employee_count: 50,
    has_budget: true,
    decision_timeline: '30 days',
  },
});
```

## Troubleshooting

### Error: "Database error when fetching leads"
- Ensure migration was applied: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads';`
- Check Supabase credentials in `.env`

### Error: "Lead validation failed"
- Ensure `name` field is provided (required)
- Check email format if provided
- Phone should be numeric

### Scoring seems off
- Check engagement_count is being tracked in lead_activities
- Verify last_contacted is being updated on interactions
- Adjust weights in DEFAULT_SCORING_CRITERIA

### Segments return no results
- Check filter rules are correct
- Verify field names match your data
- Use console.log to debug filter matching

## Next Steps

1. ✅ Create leads via UI
2. ✅ Run CSV import
3. ✅ Score your leads
4. ✅ Create your first segment
5. ✅ View analytics dashboard
6. ✅ Set up automation triggers
7. ✅ Train your team
8. ✅ Start winning deals!

## Documentation

For detailed documentation, see:
- `LEADS_MANAGEMENT_COMPLETE.md` - Full feature reference
- `src/types/leads.ts` - All type definitions
- `src/services/lead-management.ts` - Lead management API
- `src/services/lead-scoring-engine.ts` - Scoring algorithm
- `src/services/lead-segmentation.ts` - Segmentation & analytics

## Support

Have questions? Check:
1. Error messages in browser console
2. Database logs in Supabase
3. Function JSDoc comments in service files
4. Type definitions in `src/types/leads.ts`

Good luck with your lead management! 🚀

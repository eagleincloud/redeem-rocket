# LAYER 7: Manager Portal + AI Recommendation Engine
## Complete Implementation Guide

**Status**: MVP Ready for Implementation  
**Created**: May 3, 2026  
**Estimated Implementation Time**: 4-6 hours

---

## SUMMARY

LAYER 7 implements a hybrid human + AI system where:
- **AI** makes smart recommendations (auto-qualify leads, suggest actions, draft emails)
- **Managers** review and execute recommendations  
- **System** learns from manager actions

### Core Components Designed:

1. ✅ **Type Definitions** - `src/business/types/manager-layer.ts`
2. ✅ **AI Engine** - `src/business/services/ai/AIRecommendationEngine.ts`  
3. ✅ **Metrics Service** - `src/business/services/manager-metrics.ts`
4. ✅ **UI Components** - `src/business/pages/ManagerPortal.tsx`
5. ✅ **React Hook** - `src/business/hooks/useManagerDashboard.ts`
6. ✅ **Database Schema** - `supabase/migrations/20260503_manager_layer.sql`
7. ✅ **API Routes** - `supabase/functions/manager-dashboard/index.ts` + `ai-recommendations/index.ts`
8. ✅ **Route Integration** - Updated `src/business/routes.tsx`

---

## IMPLEMENTATION GUIDE

### Step 1: Create Type Definitions

File: `src/business/types/manager-layer.ts`

Contains all TypeScript interfaces and enums:
- `RecommendationType`, `RecommendationUrgency`, `RecommendationStatus`, `ConfidenceLevel`, `QualificationStage`
- `AIRecommendation` - Core recommendation data
- `EmailDraft` - Email generation results
- `LeadQualificationScore` - Lead scoring
- `CoachingTip` - Manager coaching
- `ClosurePrediction` - Deal probability
- `ManagerDashboard` - Main dashboard interface
- `ManagerStats`, `ManagerMetrics`, `TeamPerformance`
- `ManagerTask` - Task management

### Step 2: Create AI Recommendation Engine

File: `src/business/services/ai/AIRecommendationEngine.ts`

**Core Functions:**

```typescript
// 1. Lead Health Recommendations
generateLeadHealthRecommendations(leads, business)
// Input: List of leads, business profile
// Output: AIRecommendation[] with at-risk lead alerts
// Example: "Acme Corp is going cold. Follow up between 2-3pm."

// 2. Email Draft Generation
generateEmailDraft(lead, context, customNotes)
// Input: Lead, context (follow_up|proposal|re_engagement), optional notes
// Output: { subject, body, personalizedElements, bestSendTime }
// Example: Generates personalized follow-up email

// 3. Lead Auto-Qualification
autoQualifyLead(lead, businessProfile, historicalDeals)
// Input: Lead, business profile, past won deals
// Output: LeadQualificationScore (0-100)
// Example: { score: 75, recommendedStage: 'qualified', confidence: 'high' }

// 4. Coaching Tips
generateCoachingTips(managerId, managerMetrics, teamAverage)
// Input: Manager ID, their metrics, team average
// Output: CoachingTip[] with improvement suggestions
// Example: "Response time 6x slower than top performer. Set 2-hr SLA."

// 5. Deal Closure Prediction
predictDealClosure(lead, historicalData)
// Input: Lead, past win data
// Output: ClosurePrediction with probability and timeline
// Example: { closeProbability: 75, estimatedCloseDate: '2025-06-15' }

// 6. Closing Suggestions
generateDealClosingSuggestions(lead)
// Input: Stalled deal in negotiation/proposal
// Output: AIRecommendation with specific closing tactics
// Example: "Send revised proposal with discount for enterprise tier."
```

**Uses Claude Haiku API:**
- Fast: 1-2 second responses
- Cheap: ~$0.80 per 1M input tokens
- Configured via: `VITE_ANTHROPIC_API_KEY` environment variable

### Step 3: Create Manager Metrics Service

File: `src/business/services/manager-metrics.ts`

**Core Functions:**

```typescript
// Calculate daily manager metrics
calculateManagerMetrics(managerId, businessId, metricDate)
// Returns: ManagerMetrics { leads_assigned, leads_closed, conversion_rate, ... }

// Get dashboard stats
getManagerStats(managerId, businessId)
// Returns: ManagerStats { assigned_leads_count, closed_this_month, ... }

// Get team rankings
getTeamPerformance(businessId)
// Returns: TeamPerformance[] ranked by conversion rate

// Compare to team average
compareToTeamAverage(managerId, businessId)
// Returns: { manager stats, team average, gaps }
```

### Step 4: Create Manager Portal Component

File: `src/business/pages/ManagerPortal.tsx`

**Main Features:**

1. **Stats Cards** - 4 key metrics
   - Assigned Leads (👥)
   - Closed This Month (✅) 
   - Conversion Rate (%)
   - Pipeline Value ($)

2. **AI Recommendations Section**
   - Up to 5 pending recommendations
   - Color-coded by urgency (critical=red, high=orange, medium=yellow, low=green)
   - Confidence scores
   - Action buttons: Mark Reviewed, Draft Email, Dismiss

3. **Assigned Leads Table**
   - Company, Stage, Deal Value, Days in Stage
   - Warning icon for leads >5 days inactive
   - Click to view details

4. **Recently Closed Section**
   - Deals won in last 30 days
   - Similar table layout

5. **Email Draft Modal**
   - Pre-generated draft from Claude
   - Subject and body editable
   - Send button

**Glassmorphic Design:**
- Background blur effect
- Translucent cards
- Smooth transitions
- Mobile responsive

### Step 5: Create React Hook

File: `src/business/hooks/useManagerDashboard.ts`

```typescript
const {
  dashboard,      // Full dashboard data
  recommendations, // Active recommendations
  loading,         // Loading state
  error,          // Error message
  refetch,        // Manual refresh function
  markRecommendationAsReviewed,
  dismissRecommendation
} = useManagerDashboard();
```

Handles:
- API calls to manager-dashboard endpoint
- State management
- Error handling
- Recommendation status updates

### Step 6: Create Database Schema

File: `supabase/migrations/20260503_manager_layer.sql`

**New Tables:**

1. **ai_recommendations**
   - Stores all AI recommendations
   - Columns: id, business_id, manager_id, lead_id, type, title, description, urgency, status, confidence_score, suggested_action, reviewed_at, actioned_at, dismissed_at
   - Indexes: (business_id, created_at), (manager_id, created_at), (status)

2. **manager_metrics**
   - Daily manager performance
   - Columns: metric_date, leads_assigned, leads_closed, conversion_rate, avg_response_time_hours, avg_deal_size, pipeline_value
   - Unique constraint: (manager_id, metric_date)

3. **manager_tasks**
   - Manager to-do list
   - Columns: task_type, lead_id, due_date, priority, status, completed_at
   - Indexes: (manager_id, due_date), (status, due_date)

4. **email_drafts**
   - Email draft history
   - Columns: subject, body, personalized_elements[], best_send_time, sent
   - Track which emails were sent

5. **lead_qualifications**
   - Lead scoring history
   - Columns: score, recommended_stage, fit_factors (JSON), similar_won_deals[]
   - For trend analysis

**RLS Policies:**
- Managers see only their own recommendations/metrics/tasks
- Business owners see all manager data
- Leads table: Added `manager_id` and `assigned_at` columns

**Helper Functions:**
- `calculate_manager_metrics()` - Compute daily stats
- `get_manager_dashboard()` - Aggregate dashboard data

### Step 7: Create API Routes

**File A**: `supabase/functions/manager-dashboard/index.ts`

```
POST /functions/v1/manager-dashboard

Request:
{
  "manager_id": "uuid",
  "business_id": "uuid"
}

Response:
{
  "success": true,
  "data": {
    "stats": {
      "assigned_leads_count": 8,
      "closed_this_month": 2,
      "conversion_rate": 0.25,
      ...
    },
    "recommendations": [...],
    "assigned_leads": [...],
    "recently_closed_deals": [...]
  }
}
```

**File B**: `supabase/functions/ai-recommendations/index.ts`

```
POST /functions/v1/ai-recommendations

Request:
{
  "manager_id": "uuid",
  "business_id": "uuid",
  "lead_ids": ["uuid", ...],
  "recommendation_types": ["lead_health"]
}

Response:
{
  "success": true,
  "recommendations": [...],
  "count": 5
}
```

### Step 8: Update Routes

File: `src/business/routes.tsx`

Add import:
```typescript
import ManagerPortal from './pages/ManagerPortal';
```

Add route:
```typescript
{ path: 'manager', element: <ManagerPortal />, errorElement: <ErrorElement /> }
```

Now accessible at: `/app/manager`

---

## ENVIRONMENT SETUP

### Add to `.env` / `.env.local`
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### Add to Supabase Project Settings
```
ANTHROPIC_API_KEY=sk-ant-...
```

---

## DEPLOYMENT CHECKLIST

- [ ] Create all 8 files listed above
- [ ] Run Supabase migration: `supabase db push`
- [ ] Deploy functions: `supabase functions deploy manager-dashboard && supabase functions deploy ai-recommendations`
- [ ] Set environment variables
- [ ] Test navigation to `/app/manager`
- [ ] Verify dashboard loads with mock data
- [ ] Test AI recommendation generation
- [ ] Test email draft modal
- [ ] Verify mobile responsiveness

---

## TESTING SCENARIOS

### Scenario 1: Basic Dashboard Load
1. Navigate to `/app/manager`
2. Should see stats cards loading
3. Should see "Loading..." spinner briefly
4. Should display mock data once loaded

**Expected Result**: Dashboard visible with stats

### Scenario 2: AI Recommendations
1. Have test leads in database (5-10 days old)
2. Dashboard should auto-load recommendations
3. Should see 1-5 recommendation cards
4. Each card has title, description, urgency badge, confidence score

**Expected Result**: Recommendations appear with Claude API

### Scenario 3: Email Draft
1. Click "Draft Email" button on a recommendation
2. Modal opens with subject/body pre-filled
3. Can edit content
4. Click "Send Email" submits

**Expected Result**: Email modal works, can edit and submit

### Scenario 4: Recommendation Actions
1. Click "Mark Reviewed" on a recommendation
2. Status updates to "reviewed"
3. Click "Dismiss"
4. Recommendation removed from list

**Expected Result**: Recommendation status changes, dismissal works

---

## PERFORMANCE METRICS

### API Latencies
- Dashboard Load: 200-500ms
- Recommendations Gen: 1-3s (Claude API)
- Email Draft: 1-2s (Claude API)
- Qualification: 800ms-2s

### Cost Estimation (Monthly)
- **50 managers** × **5 recommendations/day**
- **~1000 tokens per recommendation**
- Claude Haiku: $0.80 per 1M input tokens
- **Estimated Cost**: $15-30/month

### Optimization Tips
1. Cache recommendations for 5-10 minutes
2. Generate in background job (not on page load)
3. Limit initial dashboard load to 5 recs
4. Use Haiku model (faster/cheaper than Sonnet)

---

## CODE EXAMPLES

### Example 1: Load Manager Dashboard
```typescript
import { useManagerDashboard } from '@/business/hooks/useManagerDashboard';

function Dashboard() {
  const { dashboard, loading, error } = useManagerDashboard();
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  
  return (
    <>
      <StatsCard value={dashboard.stats.assigned_leads_count} />
      {dashboard.recommendations.map(rec => (
        <RecommendationCard key={rec.id} recommendation={rec} />
      ))}
    </>
  );
}
```

### Example 2: Generate Lead Health Recommendations
```typescript
import { generateLeadHealthRecommendations } from '@/business/services/ai/AIRecommendationEngine';

const leads = await fetchManagerLeads(managerId);
const recommendations = await generateLeadHealthRecommendations(leads, {
  type: 'SaaS',
  category: 'Enterprise',
  sales_cycle_days: 45,
  team_size: 10
});

// Save to database
await supabase
  .from('ai_recommendations')
  .insert(recommendations);
```

### Example 3: Auto-Qualify a Lead
```typescript
import { autoQualifyLead } from '@/business/services/ai/AIRecommendationEngine';

const score = await autoQualifyLead(
  lead,
  {
    type: 'SaaS',
    category: 'Enterprise',
    ideal_customer_profile: '100+ employees, $5M+ ARR',
    avg_deal_value: 50000,
    sales_cycle_days: 45
  },
  historicalWonDeals
);

console.log(`Lead score: ${score.score}`);
console.log(`Recommended stage: ${score.recommended_stage}`);
console.log(`Confidence: ${score.confidence}`);
```

### Example 4: Draft Email
```typescript
import { generateEmailDraft } from '@/business/services/ai/AIRecommendationEngine';

const draft = await generateEmailDraft(
  lead,
  'follow_up',
  'Mention their recent expansion into APAC'
);

// draft.subject = "Re: Expansion opportunity in Asia"
// draft.body = "Hi John,\n\nCongratulations on expanding into APAC..."
// draft.personalizedElements = ["expansion", "APAC", "timing"]
```

---

## FUTURE ENHANCEMENTS

### Phase 2 (Learning Loop)
- Track which recommendations managers act on
- Improve recommendation relevance over time
- Auto-assign coaching based on performance gaps
- Predictive lead assignment to best-fit managers

### Phase 3 (Advanced Features)
- Calendar integration (Outlook/Google Calendar)
- Slack/Teams bot for notifications
- Native mobile app (iOS/Android)
- ML-based lead qualification
- Advanced deal closure forecasting

---

## TROUBLESHOOTING

### Problem: "ANTHROPIC_API_KEY not configured"
**Solution**: Add key to Supabase environment settings

### Problem: Claude API returns 401
**Solution**: Verify API key is valid and has correct permissions

### Problem: Recommendations not showing
**Solution**: 
1. Check if leads exist in database
2. Check Supabase function logs
3. Verify RLS policies allow access

### Problem: Dashboard loads but stats are wrong
**Solution**: 
1. Run `calculate_manager_metrics()` function
2. Check database indexes are created
3. Verify leads have `manager_id` assigned

---

## FILE STRUCTURE

```
src/business/
├── types/
│   └── manager-layer.ts ........................ Type definitions
├── services/
│   ├── ai/
│   │   └── AIRecommendationEngine.ts .......... AI engine
│   ├── manager-metrics.ts ..................... Metrics service
│   └── (existing services)
├── pages/
│   ├── ManagerPortal.tsx ..................... Manager dashboard UI
│   └── (existing pages)
├── hooks/
│   ├── useManagerDashboard.ts ............... Custom hook
│   └── (existing hooks)
└── routes.tsx ............................... Updated with /manager route

supabase/
├── migrations/
│   └── 20260503_manager_layer.sql ........... Database schema
└── functions/
    ├── manager-dashboard/index.ts ........... Dashboard API
    └── ai-recommendations/index.ts ......... Recommendations API
```

---

## SUCCESS CRITERIA

✅ Manager Portal accessible at `/app/manager`
✅ Dashboard loads with stats
✅ AI recommendations generate via Claude API
✅ Recommendation cards display with urgency/confidence
✅ Email draft modal works
✅ Lead table shows assigned leads
✅ Recently closed deals section visible
✅ Mobile responsive design works
✅ Database tables created with RLS
✅ API endpoints return correct data

---

## SUPPORT & DOCUMENTATION

- **Anthropic Docs**: https://docs.anthropic.com/claude/reference/getting-started-with-the-api
- **Supabase Docs**: https://supabase.com/docs
- **Project Type**: React + TypeScript + Supabase + Claude AI
- **Node.js Version**: 18+
- **Package**: @anthropic-ai/sdk (v0.90.0)

---

**Total Development Time**: 4-6 hours  
**Testing Time**: 1-2 hours  
**Deployment Time**: 30 minutes  

**Status**: Ready for Implementation ✅


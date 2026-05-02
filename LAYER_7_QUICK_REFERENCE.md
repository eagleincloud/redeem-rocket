# Layer 7: AI + Manager Layer - Quick Reference

## File Locations (Copy-Paste Ready)

### Components
```
src/business/pages/ManagerPortal.tsx
src/business/components/EmailDraftAssistant.tsx
```

### Services
```
src/business/services/AIRecommendationEngine.ts
```

### Hooks
```
src/business/hooks/useManagerDashboard.ts
```

### Database
```
supabase/migrations/20260503_manager_layer.sql
```

### Documentation
```
LAYER_7_IMPLEMENTATION.md
LAYER_7_DEPLOYMENT_SUMMARY.md
LAYER_7_QUICK_REFERENCE.md
```

---

## Key Imports

```typescript
// Manager Portal
import ManagerPortal from '@/business/pages/ManagerPortal';

// Email Assistant
import EmailDraftAssistant from '@/business/components/EmailDraftAssistant';

// AI Service
import { 
  generateLeadHealthRecommendations,
  generateEmailDraft,
  autoQualifyLead,
  generateCoachingTips,
  predictDealClosureProbability,
  generatePipelineHealthSummary
} from '@/business/services/AIRecommendationEngine';

// Hooks
import { 
  useManagerDashboard,
  useLeadWithRecommendations 
} from '@/business/hooks/useManagerDashboard';
```

---

## Component Props

### ManagerPortal
```typescript
// No required props - uses BusinessContext internally
<ManagerPortal />
```

### EmailDraftAssistant
```typescript
interface EmailDraftAssistantProps {
  open: boolean;                    // Modal visibility
  onOpenChange: (open: boolean) => void;  // Modal toggle handler
  lead: {
    id: string;
    name: string;
    email: string;
    company: string;
  };
  onSend?: (subject: string, body: string) => void;  // Optional send callback
}
```

---

## Hook Usage

### useManagerDashboard
```typescript
const { data, loading, error, refetch, dismissRecommendation } = 
  useManagerDashboard(businessId);

// data contains:
// - stats: { totalLeads, conversionRate, avgResponseTime, ... }
// - assignedLeads: Lead[]
// - recommendations: AIRecommendation[]
```

### useLeadWithRecommendations
```typescript
const { lead, recommendations, loading, error } = 
  useLeadWithRecommendations(leadId);
```

---

## AI Service Functions

### 1. generateLeadHealthRecommendations
```typescript
const recs = await generateLeadHealthRecommendations(leads, managerName);
// Returns: GeneratedRecommendation[]
```

### 2. generateEmailDraft
```typescript
const draft = await generateEmailDraft(lead, previousEmails?);
// Returns: { subject: string; body: string; tone?: string }
```

### 3. autoQualifyLead
```typescript
const result = await autoQualifyLead(lead, businessProfile);
// Returns: { 
//   qualificationScore: number;
//   reasoning: string;
//   suggestedStage: string;
//   recommendedAction: string;
// }
```

### 4. generateCoachingTips
```typescript
const tips = await generateCoachingTips(managerStats);
// Returns: string[]
```

### 5. predictDealClosureProbability
```typescript
const predictions = await predictDealClosureProbability(leads);
// Returns: Array<{
//   leadId: string;
//   closureProbability: number;
//   estimatedClosureDate: string;
//   riskFactors: string[];
// }>
```

### 6. generatePipelineHealthSummary
```typescript
const summary = await generatePipelineHealthSummary(leads);
// Returns: {
//   healthScore: number;
//   summary: string;
//   recommendations: string[];
// }
```

---

## Database Queries

### Fetch All Recommendations
```sql
SELECT * FROM ai_recommendations 
WHERE business_id = 'your-business-id' 
AND dismissed_at IS NULL 
ORDER BY urgency DESC;
```

### Get Manager Metrics
```sql
SELECT * FROM manager_metrics 
WHERE manager_id = 'manager-id' 
AND metric_date >= TODAY() - INTERVAL '30 days'
ORDER BY metric_date DESC;
```

### Check Manager Portfolio
```sql
SELECT * FROM manager_portfolio 
WHERE manager_id = 'manager-id';
```

---

## Navigation

### Route
- **Path:** `/manager`
- **Component:** ManagerPortal
- **Auth Required:** Yes (BusinessContext)

### From Other Pages
```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/manager');
```

---

## Environment Setup

### Required
- Supabase project set up
- @anthropic-ai/sdk installed
- ANTHROPIC_API_KEY available

### Optional Configuration
```typescript
// In AIRecommendationEngine.ts, customize:
const model = 'claude-3-5-sonnet-20241022';  // Change model
const max_tokens = 512;  // Adjust per function
```

---

## Common Tasks

### Task 1: Display Manager Dashboard
```typescript
import ManagerPortal from '@/business/pages/ManagerPortal';

function MyApp() {
  return <ManagerPortal />;
}
```

### Task 2: Generate Email Draft
```typescript
import { generateEmailDraft } from '@/business/services/AIRecommendationEngine';

const lead = { /* ... */ };
const draft = await generateEmailDraft(lead);
// draft.subject
// draft.body
```

### Task 3: Check Lead Qualification
```typescript
import { autoQualifyLead } from '@/business/services/AIRecommendationEngine';

const score = await autoQualifyLead(lead, businessProfile);
console.log(`Lead qualification: ${score.qualificationScore}%`);
```

### Task 4: Show Email Modal
```typescript
const [emailDraftOpen, setEmailDraftOpen] = useState(false);
const [selectedLead, setSelectedLead] = useState(null);

return (
  <>
    <button onClick={() => {
      setSelectedLead(someLeadObject);
      setEmailDraftOpen(true);
    }}>
      Draft Email
    </button>
    
    {selectedLead && (
      <EmailDraftAssistant
        open={emailDraftOpen}
        onOpenChange={setEmailDraftOpen}
        lead={selectedLead}
        onSend={async (subject, body) => {
          // Send email via API
        }}
      />
    )}
  </>
);
```

---

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const draft = await generateEmailDraft(lead);
  // Use draft
} catch (error) {
  console.error('Email generation failed:', error);
  // Show fallback or error UI
}
```

### Hook Error Handling
```typescript
const { data, error } = useManagerDashboard(businessId);

if (error) {
  return <div className="text-red-500">{error}</div>;
}
```

---

## Performance Tips

1. **Memoize callbacks** in useManagerDashboard
2. **Lazy load** dashboard on route enter
3. **Cache** AI responses in localStorage
4. **Debounce** recommendation fetches
5. **Paginate** large lead lists

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Claude API timeout | Increase timeout to 5-10s, or reduce max_tokens |
| Empty recommendations | Check leads have daysInStage > 7 |
| Database errors | Verify RLS policies allow access |
| Styling issues | Check glasmorphic class names |
| TypeScript errors | Ensure all imports use correct paths |

---

## Testing Commands

```bash
# Build and verify
npm run build

# Type check
npm run tsc --noEmit

# Test components (if set up)
npm test

# Lint
npm run lint
```

---

## Deployment Commands

```bash
# Database migration
supabase db push

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

---

## Success Indicators

✅ Manager portal loads at `/manager`
✅ Stats cards show data
✅ Email draft generates in <5s
✅ No TypeScript errors
✅ Database tables created
✅ RLS policies active
✅ Build succeeds
✅ Production deployment works

---

## Support Resources

- **Full Guide:** LAYER_7_IMPLEMENTATION.md
- **Deployment:** LAYER_7_DEPLOYMENT_SUMMARY.md
- **Code Comments:** See JSDoc in source files
- **Console Logs:** Check browser console for debugging

---

## Version
- Layer 7: v1.0.0
- Status: Production Ready
- Last Updated: May 3, 2026
- Build Status: ✅ PASSED

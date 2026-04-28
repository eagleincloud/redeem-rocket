# Smart Onboarding Implementation Guide

## Overview

The Smart Onboarding system guides businesses through a comprehensive setup journey. Phase 1 (Business Discovery) is fully implemented and production-ready. Phases 2-3 are actively in development with infrastructure in place.

**Current Date:** 2026-04-23
**Status:** Phase 1 Complete ✅ | Phases 2-3 In Progress 🔄

---

## Current Implementation Status

### Phase 1: Business Discovery ✅ COMPLETE
- **5 feature discovery questions** to understand business needs
- User selections shape the dashboard experience
- Data persisted to Supabase `biz_users` table
- Smooth animations and progress tracking
- Back button for easy navigation

**Live Production URL:** https://redeemrocket.in

### Phase 2: Feature Showcase (IN PROGRESS)
- Display selected features with detailed explanations
- Interactive tutorials for each feature
- Allow users to adjust feature preferences

### Phase 3: Theme & Template Selection (IN PROGRESS)
- Color scheme selection
- Template gallery browsing
- Logo/branding upload

### Phases 4-6: Planned
- Phase 4: Dynamic Journey (conditional questions)
- Phase 5: Smart Setup (AI-powered pipeline/automation generation)
- Phase 6: Preview & Customize

---

## Architecture Overview

### Component Hierarchy

```
SmartOnboarding (Main Component)
├── Questions Stage
│   ├── Progress Bar
│   ├── Question Card
│   │   ├── Icon
│   │   ├── Title & Description
│   │   └── Yes/No Buttons
│   ├── Back Button
│   └── Animation Controller
└── Complete Stage
    ├── Success Message
    ├── Dashboard Preview
    └── Continue Button
```

### Data Flow

```
User Interaction
    ↓
handleAnswer() stores selection in featurePreferences
    ↓
Question animation & transition
    ↓
On completion: finishOnboarding()
    ↓
completeOnboarding() API call
    ↓
Supabase update: biz_users table
    ↓
Local state updated + localStorage
    ↓
Navigate to /app dashboard
```

---

## File Structure & Locations

### Core Component
- **Location:** `/src/business/components/SmartOnboarding.tsx`
- **Size:** ~460 lines
- **Exports:** `SmartOnboarding` component, `FeaturePreference` type, `FeaturePreferences` interface

### Custom Hook
- **Location:** `/src/business/hooks/useSmartOnboarding.ts`
- **Size:** ~680 lines
- **Purpose:** Comprehensive state management for all phases
- **Features:**
  - Full onboarding state management
  - Phase progression validation
  - LocalStorage persistence
  - API integration methods

### API Integration
- **Location:** `/src/app/api/supabase-data.ts` (lines 3614+)
- **Functions:**
  - `completeOnboarding()` - Save Phase 1 preferences
  - `completeOnboardingFull()` - Save all onboarding data
  - `fetchOnboardingData()` - Retrieve saved preferences
  - `updateOnboardingPreferences()` - Partial updates
  - `checkOnboardingStatus()` - Check completion status

### Tests
- **Component Tests:** `/src/__tests__/SmartOnboarding/SmartOnboarding.test.tsx`
- **Integration Tests:** `/src/__tests__/SmartOnboarding/integration.test.tsx`
- **Performance Tests:** `/src/__tests__/SmartOnboarding/performance.test.tsx`
- **Test Helpers:** `/src/__tests__/SmartOnboarding/utils/testHelpers.ts`

### Database
- **Migration:** `/supabase/migrations/20260422_smart_onboarding_context.sql`
- **Tables:** `biz_users` (primary)
- **Related:** `business_pipelines`, `automation_rules`

---

## Type Definitions

### FeaturePreference
```typescript
type FeaturePreference = 
  | 'product_catalog' 
  | 'lead_management' 
  | 'email_campaigns' 
  | 'automation' 
  | 'social_media';
```

### FeaturePreferences
```typescript
interface FeaturePreferences {
  product_catalog: boolean;   // Showcase products/services
  lead_management: boolean;   // Capture and manage leads
  email_campaigns: boolean;   // Send automated emails
  automation: boolean;        // Business workflow automation
  social_media: boolean;      // Manage social media platforms
}
```

### OnboardingPhase
```typescript
type OnboardingPhase = 
  | 'discovery'  // Phase 1: Feature questions
  | 'showcase'   // Phase 2: Feature showcase
  | 'theme'      // Phase 3: Theme selection
  | 'journey'    // Phase 4: Dynamic questions
  | 'setup'      // Phase 5: AI-powered setup
  | 'preview';   // Phase 6: Final preview
```

### ThemePreference
```typescript
interface ThemePreference {
  layout: string;              // e.g., 'default', 'grid', 'list'
  primaryColor: string;        // Hex color code
  secondaryColor: string;      // Hex color code
  logoUrl: string | null;      // URL to uploaded logo
  fontStyle: string;           // e.g., 'inter', 'poppins'
}
```

### OnboardingState (useSmartOnboarding hook)
```typescript
interface OnboardingState {
  featurePreferences: Record<string, boolean>;
  featuredFeatures: string[];
  themePreference: ThemePreference;
  selectedPipelineTemplates: string[];
  journeyAnswers: Record<string, any>;
  generatedPipelines: any[];
  generatedAutomations: any[];
  currentPhase: OnboardingPhase;
  isLoading: boolean;
  error: string | null;
}
```

---

## Data Flow in Detail

### Phase 1 Complete Sequence

1. **User Loads Component**
   ```typescript
   // SmartOnboarding.tsx line 71
   console.log('[SmartOnboarding] Component loaded', { bizUser: bizUser?.id });
   ```

2. **User Answers Questions**
   ```typescript
   // SmartOnboarding.tsx line 105
   function handleAnswer(answer: boolean) {
     setFeaturePreferences(prev => ({ 
       ...prev, 
       [featureId]: answer 
     }));
   }
   ```

3. **All Questions Answered**
   - State transitions to 'complete' stage
   - Success screen shown with checkmark emoji

4. **User Clicks Continue**
   ```typescript
   // SmartOnboarding.tsx line 136
   async function finishOnboarding() {
     await completeOnboarding(bizUser.id, featurePreferences);
     setBizUser(updatedUser);
     navigate('/app');
   }
   ```

5. **Data Saved to Supabase**
   ```typescript
   // supabase-data.ts line 3621
   const { error } = await supabase
     .from('biz_users')
     .update({
       feature_preferences: preferences,
       onboarding_done: true,
     })
     .eq('id', userId);
   ```

6. **Navigation to Dashboard**
   - Route: `/app` (main dashboard)
   - LocalStorage updated with onboarding_done flag

---

## API Integration

### completeOnboarding()
**Purpose:** Save Phase 1 feature preferences
```typescript
export async function completeOnboarding(
  userId: string,
  preferences: FeaturePreferences
): Promise<boolean>
```
**Endpoint:** Supabase RLS-protected update
**Payload:**
```json
{
  "feature_preferences": { ... },
  "onboarding_done": true
}
```

### completeOnboardingFull()
**Purpose:** Save all onboarding data (Phases 1-5)
```typescript
export async function completeOnboardingFull(
  userId: string,
  onboardingData: {
    featurePreferences: FeaturePreferences;
    themePreference?: Record<string, unknown>;
    selectedPipelines?: Array<Record<string, unknown>>;
    automationRules?: Array<Record<string, unknown>>;
    dynamicAnswers?: Record<string, unknown>;
  }
): Promise<boolean>
```
**Multi-step process:**
1. Update `biz_users` with preferences & theme
2. Insert pipelines to `business_pipelines` table
3. Insert automations to `automation_rules` table

### fetchOnboardingData()
**Purpose:** Retrieve saved onboarding configuration
**Returns:** Preferences, theme, and completion status

### checkOnboardingStatus()
**Purpose:** Check if user completed onboarding
**Returns:**
```typescript
{
  completed: boolean;
  completedAt?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}
```

---

## Console Logging Overview

The implementation includes comprehensive debug logging with consistent prefixes for easy filtering:

### SmartOnboarding Component
```
[SmartOnboarding] Component loaded
[SmartOnboarding] finishOnboarding started
[SmartOnboarding] Calling completeOnboarding
[SmartOnboarding] completeOnboarding result
[SmartOnboarding] Onboarding error
```

### useSmartOnboarding Hook
```
[useSmartOnboarding] Failed to persist state
[useSmartOnboarding] Failed to clear localStorage
[useSmartOnboarding] generateSmartSetup error
[useSmartOnboarding] saveOnboarding error
[useSmartOnboarding] Failed to restore state
```

### Supabase API
```
[completeOnboarding] Error
[completeOnboardingFull] User update error
[completeOnboardingFull] Pipeline insert warning
[completeOnboardingFull] Automation insert warning
[fetchOnboardingData] Error
[updateOnboardingPreferences] Error
[checkOnboardingStatus] Error
```

**How to filter logs:**
```javascript
// In browser console
// Show all onboarding logs
console.log(performance.getEntriesByName('SmartOnboarding', 'mark'));

// Or use grep in server logs
grep '\[SmartOnboarding\]' logs/app.log
grep '\[completeOnboarding' logs/api.log
```

---

## Testing Coverage

### Unit Tests (SmartOnboarding.test.tsx)
- ✅ Initial question rendering
- ✅ Progress tracking
- ✅ Answer submission
- ✅ Question navigation (next/back)
- ✅ All 5 feature questions
- ✅ Completion stage
- ✅ LocalStorage persistence
- ✅ API integration mocking
- ✅ Error handling

### Integration Tests (integration.test.tsx)
- ✅ Full user journey (all 5 questions)
- ✅ Business context integration
- ✅ Navigation integration
- ✅ State management across phases
- ✅ Supabase API mocking

### Performance Tests (performance.test.tsx)
- ✅ Component render time < 200ms
- ✅ Animation timing verification
- ✅ Memory leak detection
- ✅ State update performance

### Running Tests
```bash
# All tests
npm test

# Specific test file
npm test SmartOnboarding.test.tsx

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

---

## Database Schema

### biz_users Table (Relevant Columns)

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `id` | uuid | primary key | User identifier |
| `feature_preferences` | jsonb | NULL | Phase 1 selections |
| `theme_preference` | jsonb | NULL | Phase 3 theme config |
| `onboarding_status` | text | 'pending' | Lifecycle state |
| `onboarding_phase` | integer | 0 | Current phase (0-6) |
| `onboarding_done` | boolean | false | Completion flag |
| `onboarding_completed_at` | timestamp | NULL | Completion time |
| `updated_at` | timestamp | NOW() | Last update |

### Example Data

```json
{
  "feature_preferences": {
    "product_catalog": true,
    "lead_management": true,
    "email_campaigns": false,
    "automation": true,
    "social_media": false
  },
  "theme_preference": {
    "layout": "default",
    "primaryColor": "#ff4400",
    "secondaryColor": "#1f2937",
    "logoUrl": null,
    "fontStyle": "inter"
  },
  "onboarding_status": "completed",
  "onboarding_phase": 1,
  "onboarding_done": true
}
```

### RLS Policies
- Users can only read/update their own onboarding data
- Admin can view all onboarding status
- Pipelines and automations are user-scoped

---

## Development Features

### URL Parameters for Testing

Development-only query parameters for testing specific phases:

```
?onboardingPhase=0  // Start at Question 1
?onboardingPhase=1  // Start at Question 2
?onboardingPhase=4  // Start at Question 5 (last)
```

### LocalStorage Keys
```javascript
'biz_user'                    // Current user context
'smart_onboarding'            // Default hook state key
'smart_onboarding_user-123'   // User-specific state key
```

### Feature Question Configuration
Located in `SmartOnboarding.tsx` lines 17-63:
- Easy to add new questions
- Customizable icons (emoji)
- Customizable labels and descriptions
- Progressive disclosure of feature details

---

## Production Deployment Checklist

- [x] Phase 1 implemented and tested
- [x] Supabase migration applied (20260422)
- [x] RLS policies configured
- [x] Error handling in place
- [x] Console logging added
- [x] LocalStorage fallback working
- [x] Animations smooth (60fps)
- [x] Mobile responsive
- [ ] Phases 2-3 implementation
- [ ] Backend AI setup endpoint
- [ ] Email notification on completion

---

## Environment Variables Required

```bash
# .env.local
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

---

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ Mobile: iOS Safari 14+, Chrome Android 90+

---

## Common Issues & Solutions

### Issue: Data not saving to Supabase
**Check:** 
- User ID is valid
- RLS policies allow user to update own record
- Network request not blocked

### Issue: Animations stuttering
**Solution:** Ensure `will-change` CSS property on animated elements

### Issue: Back navigation shows old state
**Solution:** State is correctly restored from React state, not localStorage

### Issue: Progress bar not updating
**Check:** Question index is incrementing properly in handleAnswer()

---

## Future Enhancements

1. **Phase 2:** Feature showcase with videos/GIFs
2. **Phase 3:** Color picker and template gallery
3. **Phase 4:** Conditional questions based on industry
4. **Phase 5:** AI-powered pipeline generation via Supabase function
5. **Phase 6:** Real-time preview of dashboard
6. **Analytics:** Track completion rates and drop-off points
7. **Resumption:** Allow users to resume interrupted onboarding

---

## Support & Debugging

For questions or issues:
1. Check console logs with `[SmartOnboarding]` prefix
2. Review test files for usage examples
3. Verify Supabase connection in Network tab
4. Check RLS policies in Supabase dashboard

---

**Last Updated:** 2026-04-23
**Maintained By:** Development Team
**Documentation Version:** 1.0

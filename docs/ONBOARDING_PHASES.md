# Onboarding Phases & Success Criteria

## Overview

The Smart Onboarding system is designed as a 6-phase journey that transforms new businesses from signup to fully operational with AI-configured pipelines and automations.

**Timeline:** Phase 1 ready for production. Phases 2-6 have architectural foundation in place.

---

## Phase 1: Business Discovery ✅ COMPLETE

### Purpose
Understand which core features the business needs to enable optimal dashboard experience.

### Duration
**3-5 minutes** (User experience optimized)

### User Flow

1. **Question 1:** Product Catalog
   - Icon: 📦
   - Question: "Do you want to showcase your products or services?"
   - Impact: Enables product management in dashboard

2. **Question 2:** Lead Management
   - Icon: 👥
   - Question: "Do you want to capture and manage sales leads?"
   - Impact: Enables lead pipeline and tracking

3. **Question 3:** Email Campaigns
   - Icon: 📧
   - Question: "Do you want to send automated email campaigns?"
   - Impact: Enables email marketing automation

4. **Question 4:** Workflow Automation
   - Icon: 🤖
   - Question: "Do you want to automate your business workflows?"
   - Impact: Enables automation rules and triggers

5. **Question 5:** Social Media
   - Icon: 📱
   - Question: "Do you want to manage your social media?"
   - Impact: Enables social media integration

### UI/UX Elements
- Progress bar showing 0% → 100%
- Question counter: "Question N of 5"
- Large emoji icon for visual appeal
- Yes/No button pair
- Back navigation support
- Smooth fade animations (300ms)

### Technical Implementation

**Component:** `/src/business/components/SmartOnboarding.tsx`
```typescript
const FEATURE_QUESTIONS = [
  {
    id: 'product_catalog',
    icon: '📦',
    title: 'Do you want to showcase your products or services?',
    // ... additional config
  },
  // ... 4 more questions
];
```

### Data Storage
```json
{
  "feature_preferences": {
    "product_catalog": true,
    "lead_management": false,
    "email_campaigns": false,
    "automation": false,
    "social_media": true
  },
  "onboarding_done": true,
  "onboarding_status": "completed"
}
```

### Success Criteria ✅
- [x] User can answer all 5 questions
- [x] Navigation (forward/back) works smoothly
- [x] Progress tracking displays accurately
- [x] Animations are smooth (60fps)
- [x] Data persists to Supabase
- [x] LocalStorage fallback works
- [x] Mobile responsive design
- [x] Completion redirects to dashboard
- [x] Comprehensive test coverage
- [x] Console logging for debugging
- [x] RLS policies protect user data
- [x] Error handling with user feedback

### Completion Action
**Button:** "Continue to Dashboard"
- Calls `completeOnboarding()` API
- Updates `biz_users.feature_preferences`
- Sets `onboarding_done = true`
- Navigates to `/app` dashboard

### Example Duration Estimate
```
Average user: 4 minutes
Fast users: 2 minutes
Careful users: 6-8 minutes
```

---

## Phase 2: Feature Showcase (IN PROGRESS) 🔄

### Purpose
Showcase selected features with detailed explanations, tutorials, and use case examples to excite users about their new capabilities.

### Planned Duration
**5-7 minutes**

### Planned User Flow

1. **Feature Cards Display**
   - Show only selected features from Phase 1
   - Display feature icon, title, description
   - Add video/GIF demonstrating feature

2. **Interactive Tutorials**
   - Click to watch short tutorial (30-60 seconds)
   - Animated walkthrough of key feature
   - Use real business examples

3. **Feature Adjustments**
   - Allow users to deselect features
   - Add features they might have missed
   - Explain pricing implications

4. **Proceed to Next Phase**
   - "Continue to Theme" button

### Proposed UI Structure
```
Feature Showcase Screen
├── Header: "Here's what you'll get"
├── Feature List (selected only)
│   ├── Feature Card 1
│   │   ├── Icon + Title
│   │   ├── Description
│   │   ├── Play Tutorial Button
│   │   └── Checkbox (enabled/disabled toggle)
│   ├── Feature Card 2
│   └── ... more features
├── Tutorial Modal (on demand)
│   ├── Video Player
│   └── Close Button
└── Button: "Continue to Theme"
```

### Data Model
```typescript
interface FeatureShowcase {
  featureId: string;
  title: string;
  description: string;
  videoUrl: string;
  icon: string;
  useCases: string[];
  enabled: boolean;  // User can toggle
}
```

### Hook Integration
```typescript
const { updateFeaturePreferences } = useSmartOnboarding(userId);

// User toggles feature
updateFeaturePreferences({
  product_catalog: false,  // Changed their mind
});
```

### Success Criteria (Planned)
- [ ] All selected features displayed
- [ ] Video/GIF loads quickly
- [ ] Users can modify selections
- [ ] Changes saved to state
- [ ] Progress tracking updated
- [ ] Completion rate > 85%
- [ ] Average time: 5-7 minutes

### Implementation Notes
- Videos should be pre-recorded or use screen recordings
- Consider Vimeo/YouTube embeds for hosting
- Add analytics to track feature view time
- Track which features users toggle

---

## Phase 3: Theme & Template Selection (IN PROGRESS) 🔄

### Purpose
Allow businesses to customize visual appearance and select dashboard templates that match their brand identity.

### Planned Duration
**3-5 minutes**

### Planned Components

1. **Color Selection**
   - Primary color picker
   - Secondary color picker
   - Preview real-time changes
   - Suggested color palettes

2. **Template Gallery**
   - Browse 5-10 pre-designed templates
   - Category-specific templates
   - Mobile responsive preview
   - Drag-to-preview capability

3. **Logo Upload**
   - Upload company logo (optional)
   - Crop and position tool
   - Preview in dashboard header
   - Size validation

4. **Font Selection**
   - Modern sans-serif options
   - Preview text with fonts
   - Consistency validation

### Proposed UI Structure
```
Theme Customization Screen
├── Color Section
│   ├── Primary Color Picker
│   ├── Secondary Color Picker
│   └── Preset Palettes
├── Template Gallery
│   ├── Template Card 1
│   │   ├── Preview Image
│   │   ├── Title & Description
│   │   └── Select Button
│   └── ... more templates
├── Logo Upload
│   ├── Drag & Drop Area
│   └── Crop Tool
├── Font Selection
│   ├── Font Options
│   └── Preview
└── Button: "Continue to Journey"
```

### Data Model
```typescript
interface ThemePreference {
  layout: string;           // 'default' | 'grid' | 'sidebar'
  primaryColor: string;     // Hex color
  secondaryColor: string;   // Hex color
  logoUrl: string | null;   // URL to uploaded asset
  fontStyle: string;        // 'inter' | 'poppins' | 'roboto'
  template: string;         // Template ID
}
```

### Hook Integration
```typescript
const { updateThemePreference, state } = useSmartOnboarding(userId);

// User updates theme
updateThemePreference({
  primaryColor: '#ff4400',
  secondaryColor: '#1f2937',
  logoUrl: 'https://...',
  template: 'modern-dashboard',
});
```

### Success Criteria (Planned)
- [ ] Color picker functional
- [ ] Real-time preview updates
- [ ] Logo upload works (max 2MB)
- [ ] Template selection visible
- [ ] All changes saved to state
- [ ] Theme applied in preview
- [ ] Completion rate > 80%
- [ ] Average time: 3-5 minutes

### Database Update
```sql
-- Update theme_preference in biz_users
UPDATE biz_users
SET theme_preference = jsonb_build_object(
  'layout', 'default',
  'primaryColor', '#ff4400',
  'secondaryColor', '#1f2937',
  'logoUrl', null,
  'fontStyle', 'inter',
  'template', 'modern-dashboard'
)
WHERE id = user_id;
```

---

## Phase 4: Dynamic Journey (PLANNED)

### Purpose
Ask contextual questions based on business type and selected features to enable AI-powered setup.

### Planned Duration
**2-4 minutes**

### Planned Questions (Dynamic)

Example for E-commerce business:
- "What's your average monthly revenue?"
- "How many products do you currently have?"
- "What payment methods do you accept?"
- "Do you handle shipping?"

Example for Service business:
- "How many service offerings do you have?"
- "Do you use a booking/appointment system?"
- "What's your typical project timeline?"

### Hook Integration
```typescript
const { updateJourneyAnswers } = useSmartOnboarding(userId);

updateJourneyAnswers({
  'business-revenue': 'under-50k',
  'product-count': '50-100',
  'payment-methods': ['credit_card', 'paypal'],
  'shipping-handled': true,
});
```

### Success Criteria (Planned)
- [ ] Questions conditional on Phase 1 selections
- [ ] Questions conditional on business category
- [ ] Answers validated before proceeding
- [ ] State persisted across sessions
- [ ] Skip button for optional questions

---

## Phase 5: Smart Setup (PLANNED)

### Purpose
AI-powered system generates customized pipelines, automations, and email templates based on all previous answers.

### Planned Duration
**2-3 minutes + 30-60 second generation**

### Process Flow

1. **Collect All Answers**
   - Phase 1: Feature preferences
   - Phase 3: Theme preferences
   - Phase 4: Journey answers

2. **Call AI Backend**
   ```typescript
   const success = await generateSmartSetup(
     businessType,
     businessName
   );
   ```

3. **Generate Components**
   - Sales pipeline (stages)
   - Lead scoring rules
   - Automated emails (welcome, follow-up)
   - Workflow automation rules
   - Social media templates

4. **Display Generated Items**
   - Pipeline preview
   - Automation rules list
   - Email template previews

### Hook Integration
```typescript
const { generateSmartSetup, state } = useSmartOnboarding(userId);

// Generate setup
await generateSmartSetup('ecommerce', 'My Online Store');

// Access generated data
console.log(state.generatedPipelines);
console.log(state.generatedAutomations);
```

### Success Criteria (Planned)
- [ ] AI generation completes < 60 seconds
- [ ] Pipelines have 3+ stages
- [ ] Automations are relevant
- [ ] Email templates are editable
- [ ] User can regenerate if needed
- [ ] Completion rate > 90%

---

## Phase 6: Preview & Customize (PLANNED)

### Purpose
Final review of all settings and AI-generated content before activating the dashboard.

### Planned Duration
**2-3 minutes**

### Review Sections

1. **Summary Review**
   - Selected features
   - Theme colors
   - Business info

2. **Generated Pipelines**
   - View pipeline stages
   - Edit stage names
   - Add/remove stages

3. **Automations Preview**
   - List of automation rules
   - Edit conditions
   - Disable specific rules

4. **Email Templates**
   - Preview templates
   - Edit subject/content
   - Configure sender

5. **Final Customization**
   - Adjust any settings
   - Upload additional assets
   - Configure integrations

### Button Actions
- "Edit Phase X" - Jump to previous phase
- "Customize X" - Edit specific section
- "Go Live" - Activate dashboard

### Hook Integration
```typescript
const { state, updateSelectedPipelines } = useSmartOnboarding(userId);

// View all generated content
console.log(state.generatedPipelines);
console.log(state.generatedAutomations);

// Customize if needed
updateSelectedPipelines(customPipelines);
```

### Success Criteria (Planned)
- [ ] All settings visible
- [ ] Users can customize everything
- [ ] Changes saved properly
- [ ] Completion saves to database
- [ ] Dashboard activates immediately
- [ ] Completion rate > 95%

---

## Overall Success Metrics

### Completion Rates (Target)
- Phase 1: 100% (required)
- Phase 2: 85% (informational)
- Phase 3: 80% (customization)
- Phase 4: 75% (contextual)
- Phase 5: 90% (generation)
- Phase 6: 95% (activation)

### Time to Completion
- **Target:** 15-20 minutes total
- **Fast path:** 10 minutes
- **Thorough path:** 25 minutes

### Drop-off Analysis
- Track exit points
- Identify confusing phases
- A/B test different flows
- Monitor error rates

### User Satisfaction
- NPS score target: 40+
- Completion satisfaction: 4.5/5 stars
- Feature usage within 24h: 70%+
- Return rate: 50%+

---

## Feature Requirement Matrix

| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4 | Phase 5 | Phase 6 |
|---------|---------|---------|---------|---------|---------|---------|
| Product Catalog | Q | T | - | T | G | R |
| Lead Management | Q | T | - | Q | G | R |
| Email Campaigns | Q | T | - | - | G | R |
| Automation | Q | T | - | Q | G | R |
| Social Media | Q | T | - | - | G | R |

*Legend: Q=Question, T=Tutorial, G=Generate, R=Review, -=Not applicable*

---

## Implementation Roadmap

### Week 1 (Completed)
- [x] Phase 1 design & implementation
- [x] Testing & QA
- [x] Production deployment

### Week 2 (Current)
- [ ] Phase 2 design
- [ ] Feature showcase component
- [ ] Video hosting setup

### Week 3
- [ ] Phase 3 design
- [ ] Color picker integration
- [ ] Template gallery

### Week 4
- [ ] Phase 4 design
- [ ] Conditional question logic
- [ ] Dynamic content mapping

### Week 5-6
- [ ] Phase 5 design
- [ ] AI backend integration
- [ ] Generation testing

### Week 7
- [ ] Phase 6 design
- [ ] Customization UI
- [ ] E2E testing

### Week 8
- [ ] Full integration testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Production release

---

## Technical Debt & Notes

1. **Phase 2-6 Architecture Exists**
   - `useSmartOnboarding` hook has all state management
   - Type definitions in place
   - API integration stubs ready

2. **Database Schema Complete**
   - Columns added in migration 20260422
   - RLS policies configured
   - Related tables ready

3. **Testing Infrastructure Ready**
   - Vitest configured
   - React Testing Library setup
   - Mock patterns established

4. **Still Needed**
   - Phase 2-6 UI components
   - AI backend endpoint
   - Video hosting setup
   - Email template system

---

**Last Updated:** 2026-04-23
**Status:** Phase 1 Production Ready | Phases 2-6 In Planning
**Documentation Version:** 1.0

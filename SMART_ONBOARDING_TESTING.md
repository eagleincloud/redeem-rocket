# Smart AI-Powered Onboarding - Testing & Implementation Guide

## Overview

The Smart Onboarding system replaces the 9-step BusinessOnboarding with a streamlined 5-question feature preference system + conditional setup steps.

## Components Implemented

### 1. **SmartOnboarding.tsx** (Main Component)
- **Location**: `src/business/components/SmartOnboarding.tsx`
- **Features**:
  - 5 feature preference questions with MadMuscles-inspired dark UI
  - Progress bar showing question number and completion percentage
  - Smooth animations (0.3s ease transitions)
  - Back button to navigate between questions
  - Completion screen with loading state
  - Saves preferences to both Supabase and localStorage

### 2. **FeatureSettings.tsx** (Re-customization Page)
- **Location**: `src/business/components/FeatureSettings.tsx`
- **Route**: `/app/features-settings`
- **Features**:
  - Grid layout of all 5 features with icons and descriptions
  - Toggle switches for each feature
  - Shows what each feature includes
  - Save button to persist changes to database
  - Success confirmation message

### 3. **Updated BusinessContext**
- **Location**: `src/business/context/BusinessContext.tsx`
- **Features**:
  - `canAccessFeature()` helper function
  - `feature_preferences` stored in BizUser interface
  - Defaults to true if preferences not set (safe fallback)

### 4. **Updated Navigation**
- **Location**: `business-app/frontend/src/components/Navigation.tsx`
- **Features**:
  - Conditional nav items based on feature_preferences from localStorage
  - Reads from `biz_user` localStorage key
  - Shows/hides items for leads, campaigns, automation, social, connectors

### 5. **Database Schema Migration**
- **Location**: `supabase/migrations/20250422_smart_onboarding_schema.sql`
- **Adds**:
  - `feature_preferences` (JSONB) to biz_users
  - `onboarding_step`, `onboarding_ai_data`, `onboarding_done` columns
  - `business_products` table for AI-generated products
  - RLS policies for multi-tenant security
  - Indexes for performance

### 6. **Edge Functions** (Already created in previous session)
- **Location**: `supabase/functions/biz-onboarding-ai/`
- **Functions**:
  - `/describe` - Generate business descriptions via Claude
  - `/extract-from-url` - Extract info from website
  - `/parse-natural-language` - Parse natural language input
  - `/build-products` - Generate sample products

## Implementation Checklist

### Phase 1: Database & Backend Setup ✓

- [x] Create SmartOnboarding component with 5 feature questions
- [x] Create FeatureSettings component for re-customization
- [x] Update BusinessContext with `canAccessFeature()` helper
- [x] Create database migration file (20250422_smart_onboarding_schema.sql)
- [x] Update Navigation component to use feature preferences
- [x] Add FeatureSettings route to business routes
- [x] Create deployment documentation (DEPLOY_EDGE_FUNCTIONS.md, DEPLOY_MIGRATIONS.md)

### Phase 2: Frontend Integration (Ready to test)

- [ ] **DEPLOY DATABASE MIGRATION**: Run SQL migration via Supabase dashboard
- [ ] **DEPLOY EDGE FUNCTIONS**: Run `supabase functions deploy biz-onboarding-ai`
- [ ] **TEST ONBOARDING FLOW**: Navigate to `/onboarding` and complete questions
- [ ] **VERIFY DATA SAVED**: Check localStorage and Supabase biz_users table
- [ ] **TEST NAVIGATION**: Verify nav items show/hide based on preferences
- [ ] **TEST RE-CUSTOMIZATION**: Go to `/app/features-settings` and toggle features
- [ ] **VERIFY REAL-TIME UPDATES**: Check if navigation updates immediately

## Step-by-Step Testing Guide

### Test 1: Complete Onboarding Flow

**Setup**:
1. Deploy migration: Run SQL from `DEPLOY_MIGRATIONS.md`
2. Deploy functions: Run `supabase functions deploy biz-onboarding-ai`
3. Clear browser localStorage (optional): `localStorage.clear()`

**Test Steps**:
1. Navigate to `https://your-domain/business.html#/onboarding`
2. See question 1: "Do you want to showcase your products?"
3. Verify:
   - [ ] Progress shows "Question 1 of 5" and "20%"
   - [ ] Icon is 📦
   - [ ] Yes/No buttons are visible
4. Click "Yes, showcase products"
5. Verify:
   - [ ] Smooth fade animation (0.3s)
   - [ ] Question 2 appears
6. Repeat for remaining questions:
   - Question 2: Lead management
   - Question 3: Email campaigns
   - Question 4: Workflow automation
   - Question 5: Social media
7. After all questions:
   - [ ] Completion screen shows "You're all set!"
   - [ ] "Continue to Dashboard" button appears
   - [ ] Clicking button shows loading state with spinner
8. Verify redirect:
   - [ ] Redirected to `/app` (dashboard)
   - [ ] localStorage contains `biz_user` with `feature_preferences`
   - [ ] Supabase `biz_users` table updated with preferences

**Expected Feature Preferences** (if all Yes):
```json
{
  "product_catalog": true,
  "lead_management": true,
  "email_campaigns": true,
  "automation": true,
  "social_media": true
}
```

### Test 2: Navigation Conditional Display

**Setup**: Complete onboarding with mixed feature selections (e.g., Yes/No/Yes/No/Yes)

**Test Steps**:
1. Go to dashboard `/app`
2. Check Navigation links:
   - [ ] Dashboard always visible
   - [ ] "Leads" visible only if `lead_management: true`
   - [ ] "Campaigns" visible only if `email_campaigns: true`
   - [ ] "Automation" visible only if `automation: true`
   - [ ] "Social" visible only if `social_media: true`
   - [ ] "Connectors" visible only if `social_media: true`
3. Verify orders/documents links:
   - [ ] Only visible if `product_catalog: true`

### Test 3: Feature Re-customization

**Setup**: Complete onboarding, then access feature settings

**Test Steps**:
1. Navigate to `/app/features-settings`
2. See 5 feature cards with:
   - [ ] Icon (📦👥📧🤖📱)
   - [ ] Feature name
   - [ ] Description
   - [ ] List of included features
   - [ ] Checkbox toggle (currently checked/unchecked based on preferences)
3. Toggle a feature (e.g., enable "Lead Management"):
   - [ ] Checkbox visually updates
   - [ ] Card styling changes (opacity, borders)
4. Click "Save Preferences":
   - [ ] Button shows loading state
   - [ ] After save, shows "✓ Saved successfully"
   - [ ] Message disappears after 3 seconds
5. Verify changes persisted:
   - [ ] localStorage updated with new preferences
   - [ ] Supabase biz_users table reflects change
   - [ ] Navigation items update in real-time
6. Refresh page:
   - [ ] Preferences still show saved state
   - [ ] Navigation items correct

### Test 4: Navigation Back Button

**Setup**: Start onboarding from question 2

**Test Steps**:
1. Answer first question
2. On question 2, click "Back" button
3. Verify:
   - [ ] Back to question 1
   - [ ] Previous answer is preserved
   - [ ] Back button NOT visible on question 1
4. Go forward to question 3, then back
5. Verify:
   - [ ] Previous answers preserved
   - [ ] Can navigate freely

### Test 5: Error Handling

**Setup**: Deploy with missing environment variables or misconfigured Edge Functions

**Test Steps**:
1. Try to complete onboarding with API errors:
   - [ ] Should gracefully continue with local save
   - [ ] No UI errors or exceptions
   - [ ] Data saved to localStorage
   - [ ] Console shows warning: "Failed to save to Supabase, continuing with local save"

### Test 6: Cross-Browser & Responsive

**Test Steps**:
1. **Desktop (1920x1080)**:
   - [ ] All elements visible and properly sized
   - [ ] Animations smooth
   - [ ] Buttons clickable

2. **Tablet (768x1024)**:
   - [ ] Layout responsive
   - [ ] Font sizes readable
   - [ ] Touch targets large enough (48px min)

3. **Mobile (375x812)**:
   - [ ] Single column layout
   - [ ] Padding adequate on small screens
   - [ ] Buttons easy to tap

4. **Browsers**:
   - [ ] Chrome/Edge (Chromium)
   - [ ] Firefox
   - [ ] Safari

## Database Verification

### Verify Migration Applied

**Via Supabase Dashboard**:
1. Go to SQL Editor
2. Run:
   ```sql
   -- Check if new columns exist
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'biz_users' 
   AND column_name IN ('feature_preferences', 'onboarding_done', 'onboarding_step');

   -- Check if business_products table exists
   SELECT * FROM information_schema.tables 
   WHERE table_name = 'business_products';
   ```
3. Verify results show all columns/tables

### Verify RLS Policies

**Via Supabase Dashboard**:
1. Go to Authentication > Policies
2. See policies on `business_products` table:
   - [ ] SELECT policy for users' own business products
   - [ ] INSERT policy for users' own business
   - [ ] UPDATE policy for users' own business
   - [ ] DELETE policy for users' own business

### Test Data Persistence

**Via Supabase Dashboard** > SQL Editor:
```sql
-- Check saved preferences
SELECT id, email, feature_preferences, onboarding_done 
FROM biz_users 
WHERE email = 'test@example.com';
```

Expected output:
```
id | email | feature_preferences | onboarding_done
---|-------|---------------------|----------------
xxx | test@example.com | {"product_catalog":true,"lead_management":true,...} | true
```

## Edge Function Testing

### Test Description Generation

```bash
curl -X POST https://project.supabase.co/functions/v1/biz-onboarding-ai \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/describe",
    "businessType": "coffee_shop",
    "businessName": "Morning Brew",
    "websiteText": "Specialty coffee drinks, pastries"
  }'
```

**Expected Response**:
```json
{
  "descriptions": [
    "Morning Brew: Premium specialty coffee and fresh pastries...",
    "Start your day at Morning Brew...",
    "Experience artisanal coffee..."
  ]
}
```

### Test URL Extraction

```bash
curl -X POST https://project.supabase.co/functions/v1/biz-onboarding-ai \
  -H "Authorization: Bearer ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/extract-from-url",
    "url": "https://example.com",
    "businessType": "restaurant"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "url": "https://example.com",
  "businessDescription": "...",
  "hours": "...",
  "phone": "...",
  "email": "..."
}
```

## Deployment Instructions

### 1. Apply Database Migration

See `DEPLOY_MIGRATIONS.md` for detailed steps. Quick version:

1. Copy SQL from `supabase/migrations/20250422_smart_onboarding_schema.sql`
2. Go to Supabase dashboard → SQL Editor
3. Paste and run SQL
4. Wait for "Success" message

### 2. Deploy Edge Functions

See `DEPLOY_EDGE_FUNCTIONS.md` for detailed steps. Quick version:

```bash
export SUPABASE_ACCESS_TOKEN="your_access_token"
cd /path/to/project
supabase functions deploy biz-onboarding-ai
```

### 3. Set Environment Variables

In Supabase project:
1. Go to Project Settings → Functions
2. Add secret: `ANTHROPIC_API_KEY` = your Anthropic API key
3. Deploy

### 4. Test Edge Functions

Run tests from "Edge Function Testing" section above

### 5. Clear Browser Cache

```javascript
// In browser console
localStorage.clear()
sessionStorage.clear()
```

Then refresh and test onboarding

## Troubleshooting

### Issue: "Function not found" error

**Solution**:
1. Verify functions deployed: `supabase functions list`
2. Check function exists at `supabase/functions/biz-onboarding-ai/`
3. Ensure `index.ts` has all route handlers
4. Re-deploy: `supabase functions deploy biz-onboarding-ai`

### Issue: Feature preferences not saving

**Solution**:
1. Check Supabase migration ran successfully
2. Verify `biz_users` table has `feature_preferences` column
3. Check browser console for errors during save
4. Verify `completeOnboarding()` function called with correct user ID

### Issue: Navigation not updating after toggling features

**Solution**:
1. Check localStorage contains updated `biz_user`
2. Verify `canAccessFeature()` logic is correct
3. Clear localStorage and reload: `localStorage.clear()`
4. Check Supabase data matches localStorage

### Issue: Onboarding redirects to login instead of dashboard

**Solution**:
1. Check `onboarding_done` flag is set to `true`
2. Verify `setBizUser()` called after completion
3. Check navigation route exists at `/app`
4. Verify user is authenticated before completing

## Performance Metrics

- **Page Load**: SmartOnboarding should load <2s
- **Question Transition**: Animation 0.3s, no visible lag
- **Save Preferences**: <1s to complete
- **Navigation Update**: <100ms to show/hide items

## Accessibility

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Screen reader announces question number
- [ ] Color contrast passes WCAG AA
- [ ] Mobile touch targets ≥48px

## Success Criteria

✅ All tests pass
✅ No console errors or warnings
✅ Database migration applied
✅ Edge Functions deployed
✅ Preferences persist across sessions
✅ Navigation updates dynamically
✅ Mobile responsive

## Next Steps (Optional Features)

- [ ] Add AI-powered product generation
- [ ] Add natural language business hours parsing
- [ ] Add website URL extraction
- [ ] Add conditional form steps (location, photos, social links)
- [ ] Add analytics for feature adoption
- [ ] Add A/B testing for question phrasing

---

**Created**: 2026-04-22
**Last Updated**: 2026-04-22
**Status**: Ready for testing

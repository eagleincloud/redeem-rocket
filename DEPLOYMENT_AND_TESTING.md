# 🚀 Deployment & Testing Guide

Complete guide to deploy the registration flow backend and test all endpoints.

## Prerequisites

- Supabase project set up
- `supabase-cli` installed (`npm install -g supabase`)
- `.env` file with Supabase credentials
- Node.js and npm installed

## Step 1: Set Environment Variables

Create `.env.local` in project root:

```bash
# Frontend
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend (for Supabase Functions)
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 2: Run Database Migrations

Deploy the database schema:

```bash
# Navigate to project root
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2

# Run migrations
supabase db push

# Verify tables were created
supabase db show
```

This creates:
- `businesses` table
- `business_registrations` table
- `design_presets` table
- Indexes and RLS policies
- Sample design presets

## Step 3: Deploy Edge Function

Deploy the registration API:

```bash
# Deploy the function
supabase functions deploy registration-api

# Verify deployment
supabase functions list

# Check logs
supabase functions list registration-api --full
```

## Step 4: Start Development Server

```bash
# Terminal 1: Start business app
npm run dev:business

# Terminal 2: Start Supabase locally (optional)
supabase start
```

Server will run on: `http://localhost:5174`

## Testing the Complete Flow

### Test 1: Welcome Page

**URL**: `http://localhost:5174/register`

**Expected**: 
- Beautiful hero with 16 category pills
- 4 feature cards displayed
- "Start Building Your App" button visible

### Test 2: Business Details Form

**URL**: `http://localhost:5174/register/details`

**Actions**:
1. Fill Step 1 (Business Basics):
   - Business Name: "Test Restaurant"
   - Email: "test@restaurant.com"
   - Phone: "+91-9876543210"
2. Click "Next" → Should go to Step 2
3. Fill Step 2 (Category & Profile):
   - Category: Restaurant
   - Team Size: 2–10
   - Business Stage: Growing
4. Click "Next" → Should go to Step 3
5. Fill Step 3 (Goals & Audience):
   - Select 2-3 goals
   - Select social media (Instagram, WhatsApp)
6. Click "Next" → Should go to feature selection

### Test 3: Feature Selection

**URL**: `http://localhost:5174/register/features`

**Actions**:
1. Try clicking "Growth" bundle → Should select all features in bundle
2. Unselect individual features → Count should update
3. Click "Next" → Should go to customization

### Test 4: App Customization

**URL**: `http://localhost:5174/register/customize`

**Actions**:
1. Choose "Restaurant" category preset
2. Modify primary color using color picker
3. See preview update in real-time
4. Click "Next" → Should go to preview

### Test 5: Preview & Launch

**URL**: `http://localhost:5174/register/preview`

**Actions**:
1. Review all selections
2. Click "Go Live! 🚀" button
3. Wait for loading spinner
4. **Expected**: 
   - API call should succeed
   - Data should be saved to database
   - Redirect to dashboard

## API Testing with curl

### Test Email Validation

```bash
curl -X POST https://your-project.supabase.co/functions/v1/registration-api/register/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected Response:
# {"available":true,"email":"test@example.com"}
```

### Test Complete Registration Submission

```bash
curl -X POST https://your-project.supabase.co/functions/v1/registration-api/register/submit \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Restaurant",
    "email": "owner@test.com",
    "phone": "+91-9876543210",
    "category": "restaurant",
    "location": "Mumbai",
    "teamSize": "2-10",
    "businessStage": "growing",
    "targetAudience": "regional",
    "goals": ["get-new-customers", "increase-sales"],
    "challenges": ["managing-customer-data"],
    "monthlyCustomers": "200-1000",
    "socialMedia": ["instagram", "whatsapp"],
    "selectedFeatures": ["lead-management", "whatsapp-marketing"],
    "appName": "Test Restaurant",
    "stylePresetId": "restaurant-rustic",
    "primaryColor": "#8B4513",
    "accentColor": "#FFB347",
    "bgColor": "#FDF5E6",
    "theme": "light",
    "fontStyle": "classic",
    "layoutStyle": "card",
    "buttonStyle": "rounded"
  }'

# Expected Response:
# {
#   "success": true,
#   "registrationId": "uuid-here",
#   "businessId": "uuid-here",
#   "message": "Registration submitted. Please verify your email."
# }
```

### Test Get Design Presets

```bash
curl -X GET 'https://your-project.supabase.co/functions/v1/registration-api/register/presets/restaurant' \
  -H "Content-Type: application/json"

# Expected Response:
# {
#   "category": "restaurant",
#   "presets": [
#     {
#       "id": "restaurant-rustic",
#       "name": "Rustic Kitchen",
#       ...
#     }
#   ],
#   "count": 2
# }
```

## Database Testing

### Verify Tables Created

```bash
# Access Supabase SQL Editor
supabase sql

-- Check businesses table
SELECT * FROM businesses LIMIT 1;

-- Check business_registrations table
SELECT * FROM business_registrations LIMIT 1;

-- Check design_presets table
SELECT * FROM design_presets LIMIT 5;
```

### Check RLS Policies

```sql
-- View RLS policies for business_registrations
SELECT * FROM pg_policies WHERE tablename = 'business_registrations';

-- Test RLS: Unauthenticated users should not see other users' data
SELECT * FROM business_registrations 
WHERE user_id != auth.uid();  -- Should return empty
```

## Browser Developer Tools Testing

### Check Network Requests

1. Open DevTools (F12)
2. Go to Network tab
3. Complete registration flow
4. Look for requests to `/registration-api/*`
5. Verify responses have correct status (200 for success, 400/500 for errors)

### Check LocalStorage

1. Open DevTools
2. Go to Application → LocalStorage
3. Filter for `redeem_rocket_data`
4. Verify data updates as you fill the form
5. Verify data is cleared after successful submission

### Check Console

1. Open DevTools Console
2. Complete registration flow
3. Look for success message: "Registration submitted:"
4. Check for any JavaScript errors

## Troubleshooting

### Issue: API returns 404

**Solution**:
- Verify function is deployed: `supabase functions list`
- Check function name is correct: `registration-api`
- Verify base URL is correct in `registrationAPI.ts`

### Issue: Database tables don't exist

**Solution**:
```bash
# Re-run migrations
supabase db push

# Reset database (caution: deletes all data)
supabase db reset
```

### Issue: CORS errors

**Solution**:
- Check `_shared/cors.ts` exports `corsHeaders`
- Verify Edge Function sets CORS headers correctly
- Test from browser DevTools to see actual CORS error

### Issue: RLS policies blocking access

**Solution**:
- Check RLS policies in Supabase dashboard
- Verify user is authenticated
- Test with service role to bypass RLS

### Issue: Timestamp in wrong timezone

**Solution**:
- PostgreSQL stores in UTC by default
- Add `AT TIME ZONE` when querying if needed
- Example: `created_at AT TIME ZONE 'IST'`

## Verifying Production Readiness

### Checklist Before Deploying to Production

- [ ] All API endpoints tested and working
- [ ] Database tables created with proper indexes
- [ ] RLS policies enabled and tested
- [ ] Error handling works correctly
- [ ] Email validation prevents duplicates
- [ ] Data is saved to database correctly
- [ ] Design presets load correctly
- [ ] Preview page works without errors
- [ ] Redirect after submission works
- [ ] localStorage is cleared after submission
- [ ] No JavaScript errors in console
- [ ] Network requests show proper status codes
- [ ] Response times are acceptable (<1s)
- [ ] No sensitive data logged to console

### Performance Metrics to Check

- API response time: Should be <500ms
- Function cold start: <2 seconds first time
- Database queries: Should be <100ms
- Page load time: Should be <2 seconds

## Optional: Add Observability

### Logging

Add logging to Supabase Edge Function:

```typescript
console.log('Registration submitted:', data.email);
console.error('Error:', error);
```

View logs:
```bash
supabase functions logs registration-api
```

### Error Tracking (Optional)

Integrate with Sentry for production:

```typescript
import * as Sentry from '@sentry/node';

Sentry.captureException(error);
```

## Manual Testing Scenarios

### Scenario 1: Happy Path

1. Complete all 5 steps of registration
2. Use valid email and data
3. Verify registration saves to database
4. Confirm redirect to dashboard

**Expected Outcome**: Success, data saved, redirected ✅

### Scenario 2: Duplicate Email

1. Register with "test@example.com"
2. Try to register again with same email
3. Should show error: "Email already registered"

**Expected Outcome**: Error displayed, no duplicate created ✅

### Scenario 3: Missing Required Fields

1. Try to submit with blank business name
2. Should show validation error
3. Submit button should be disabled

**Expected Outcome**: Form validation prevents submission ✅

### Scenario 4: Network Error

1. Close internet connection
2. Try to submit registration
3. Reconnect internet
4. Try again

**Expected Outcome**: Error shown, can retry after reconnect ✅

### Scenario 5: Mobile Responsiveness

1. Open DevTools (F12)
2. Toggle device toolbar (mobile view)
3. Complete registration on mobile
4. Verify all UI elements are readable
5. Buttons are clickable

**Expected Outcome**: Everything works on mobile ✅

## Monitoring in Production

### Set Up Alerts

Configure Supabase alerts for:
- High error rate on registration-api
- Slow query performance on business_registrations
- Storage quota exceeded

### Monitor Metrics

Track in your analytics:
- Registration completion rate
- Time to complete registration
- Error rate by step
- Popular business categories
- Popular design presets

## Next Steps

After successful testing:

1. **Email Integration** - Add email verification step
2. **Payment** - Integrate Stripe for premium features
3. **Analytics** - Track registration funnel metrics
4. **Scaling** - Monitor performance as traffic grows
5. **Maintenance** - Regular backups and updates

---

**Last Updated**: 2026-05-01
**Status**: Ready for testing ✅

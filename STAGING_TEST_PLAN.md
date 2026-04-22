# Smart Onboarding Staging Test Plan

**Environment**: Staging (eomqkeoozxnttqizstzk)  
**Test Date**: 2026-04-23  
**Duration**: 2-3 hours  

---

## Test Execution Summary Template

For each test section below, mark results as:
- ✓ PASS - Feature works as expected
- ✗ FAIL - Feature does not work (log error)
- ⚠ WARN - Works but with issues (document)
- ⏭ SKIP - Not applicable

---

## Phase 1: Environment & Access Verification (30 min)

### 1.1 Staging URL Accessibility
**Test**: Navigate to staging app URL
- [ ] Staging URL accessible via browser
- [ ] Page loads without timeout
- [ ] HTTPS enforced
- [ ] No certificate warnings
- [ ] Page rendering time < 3 seconds

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 1.2 Environment Variables
**Test**: Check console for variable loads
```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```
- [ ] All variables present
- [ ] No undefined values
- [ ] Correct staging endpoints

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 1.3 Database Connectivity
**Test**: Check Supabase connection in console
```javascript
// After login, should have active session
const session = await supabase.auth.getSession();
console.log(session);
```
- [ ] Auth session established
- [ ] No CORS errors
- [ ] API endpoints responding

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 2: Database Schema Verification (20 min)

### 2.1 Tables Created
**Test**: Using Supabase Studio, verify tables exist
- [ ] biz_users table exists with new columns:
  - [ ] feature_preferences (JSONB)
  - [ ] onboarding_step (integer)
  - [ ] onboarding_ai_data (JSONB)
  - [ ] onboarding_done (boolean)
- [ ] business_products table exists
  - [ ] All required columns present
  - [ ] Foreign key to biz_users exists
  - [ ] Timestamps functional

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 2.2 Indexes Created
**Test**: Check database indexes
- [ ] idx_business_products_business_id exists
- [ ] idx_business_products_is_active exists
- [ ] idx_biz_users_feature_preferences exists (GIN type)

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 2.3 RLS Policies Active
**Test**: Verify Row Level Security
- [ ] business_products_select active
- [ ] business_products_insert active
- [ ] business_products_update active
- [ ] business_products_delete active
- [ ] biz_users_select active
- [ ] biz_users_update active

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 3: Authentication Flow (15 min)

### 3.1 Signup
**Test**: Create new test account
- [ ] Signup page loads
- [ ] Form validation works
- [ ] Email verification sent
- [ ] User record created in database
- [ ] Session established after verification

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 3.2 Login
**Test**: Login with test account
- [ ] Login page accessible
- [ ] Credentials accepted
- [ ] Session established
- [ ] Redirected to appropriate page
- [ ] User context loaded

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 3.3 Protected Routes
**Test**: Verify authentication requirement
- [ ] Unauthenticated users redirected to login
- [ ] Onboarding route requires auth
- [ ] Dashboard requires auth
- [ ] Cannot access /business without login

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 4: Onboarding Flow - Phase 1 (15 min)

### 4.1 Page Load
**Test**: Navigate to onboarding after signup
- [ ] Onboarding page loads
- [ ] Initial phase (Phase 1) displays
- [ ] No console errors
- [ ] All text renders correctly
- [ ] Images/icons load properly

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 4.2 Business Discovery Questions
**Test**: First onboarding phase
- [ ] "What industry?" question displays
- [ ] Options are selectable
- [ ] Selection updates UI
- [ ] Next button becomes enabled
- [ ] Click Next proceeds to Phase 2

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 5: Onboarding Flow - Phase 2 & 3 (20 min)

### 5.1 Feature Showcase (Phase 2)
**Test**: Second phase of onboarding
- [ ] Phase 2 page loads after Phase 1
- [ ] Feature showcase displays
- [ ] Can scroll through features
- [ ] Feature descriptions visible
- [ ] Navigation buttons work

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 5.2 Theme Selection (Phase 3)
**Test**: Third phase - Theme customization
- [ ] Theme selection page displays
- [ ] Multiple themes available
- [ ] Preview updates on selection
- [ ] Colors apply correctly
- [ ] Dark/Light mode toggle works

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 6: Onboarding Flow - Phase 4 & 5 (20 min)

### 6.1 Dynamic Questions (Phase 4)
**Test**: Fourth phase - AI-guided questions
- [ ] Question page loads
- [ ] Questions display properly
- [ ] Input validation works
- [ ] Answers accepted
- [ ] Progress indicator accurate

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 6.2 AI Generation (Phase 5)
**Test**: Fifth phase - AI processing
- [ ] Loading state displays
- [ ] AI processing initiates
- [ ] Results generated (with mock if needed)
- [ ] No timeout errors
- [ ] Complete button appears

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 7: Onboarding Completion (15 min)

### 7.1 Preview & Confirmation
**Test**: Final onboarding step
- [ ] Preview page displays summary
- [ ] Selected features listed
- [ ] Theme preview shows
- [ ] Edit buttons functional
- [ ] Complete/Confirm button works

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 7.2 Completion & Navigation
**Test**: Finish onboarding
- [ ] Complete button processes
- [ ] Redirects to dashboard
- [ ] Success message displayed
- [ ] User status updated in DB
- [ ] onboarding_done flag set to true

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 8: Data Persistence (20 min)

### 8.1 Feature Preferences Save
**Test**: Verify feature preferences stored
```javascript
const { data: user } = await supabase
  .from('biz_users')
  .select('feature_preferences')
  .eq('id', userId)
  .single();
```
- [ ] feature_preferences stored correctly
- [ ] All selected features present
- [ ] Correct boolean values
- [ ] Retrieved same as stored

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 8.2 Onboarding Data Persistence
**Test**: Check onboarding completion
```javascript
const { data: user } = await supabase
  .from('biz_users')
  .select('onboarding_done, onboarding_step, onboarding_ai_data')
  .eq('id', userId)
  .single();
```
- [ ] onboarding_done = true
- [ ] onboarding_step correct
- [ ] onboarding_ai_data populated
- [ ] Timestamps accurate

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 8.3 Products Table (if applicable)
**Test**: Verify products created
```javascript
const { data: products } = await supabase
  .from('business_products')
  .select('*')
  .eq('business_id', userId);
```
- [ ] Products table populated (if AI generated)
- [ ] Correct relationship to business
- [ ] All fields populated
- [ ] Timestamps set correctly

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 9: RLS Policy Enforcement (15 min)

### 9.1 User Data Isolation
**Test**: Verify users see only their data
- [ ] Login as User A
- [ ] Query feature_preferences
- [ ] Should return own data
- [ ] Should NOT return other users' data
- [ ] Login as User B, verify same

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 9.2 Products Isolation
**Test**: Verify product data isolation
- [ ] User A can see own products
- [ ] User A cannot see User B's products
- [ ] Insert as User A succeeds
- [ ] Insert as User A with business_id of User B fails

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 10: Navigation & UI (15 min)

### 10.1 Back/Forward Navigation
**Test**: Test navigation within onboarding
- [ ] Back button goes to previous phase
- [ ] Forward button goes to next phase
- [ ] Data retained when navigating back
- [ ] Can jump to specific phase via URL (?onboardingPhase=N)
- [ ] Progress bar updates correctly

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 10.2 Skip Option
**Test**: Verify skip onboarding works
- [ ] Skip button visible on phases
- [ ] Skip triggers completion
- [ ] Dashboard accessible after skip
- [ ] Defaults applied if skipped

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 10.3 Edit/Redo
**Test**: Verify re-running onboarding
- [ ] Onboarding button in settings
- [ ] Resets status correctly
- [ ] Can re-run all phases
- [ ] Previous data cleared appropriately

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 11: Error Handling (15 min)

### 11.1 Network Errors
**Test**: Simulate network issues
**Method**: Open DevTools → Network → throttle
- [ ] Error message displays
- [ ] User informed of connection issue
- [ ] Retry button functional
- [ ] App doesn't hang

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 11.2 Invalid Input
**Test**: Submit invalid data
- [ ] Required fields validated
- [ ] Error messages appear
- [ ] Form doesn't submit
- [ ] Can correct and retry

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 11.3 API Timeout
**Test**: Simulate API timeout
**Method**: DevTools → Network → very slow 3G
- [ ] Timeout handled gracefully
- [ ] User sees appropriate message
- [ ] Can retry or proceed
- [ ] No silent failures

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 12: Performance Testing (20 min)

### 12.1 Page Load
**Test**: Measure onboarding page load
**Method**: DevTools → Performance tab
- [ ] Page loads in < 3 seconds
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] No layout shift issues (CLS < 0.1)

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 12.2 Component Render
**Test**: Measure component render time
- [ ] SmartOnboarding renders smoothly
- [ ] No jank on phase transitions
- [ ] Animations are smooth (60fps)
- [ ] No main thread blocking

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 12.3 Bundle Impact
**Test**: Check bundle size impact
- [ ] SmartOnboarding component: ~6.7 KB
- [ ] Total main bundle < 2.5 MB gzipped
- [ ] CSS bundle reasonable size
- [ ] No excessive dependency bloat

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 13: Browser Compatibility (10 min)

### 13.1 Modern Browsers
**Test**: Test on modern browsers
- [ ] Chrome/Edge latest (works)
- [ ] Firefox latest (works)
- [ ] Safari latest (works)
- [ ] Mobile browsers (works)

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 13.2 Responsive Design
**Test**: Responsive behavior
- [ ] Desktop layout (1920x1080)
- [ ] Tablet layout (768x1024)
- [ ] Mobile layout (375x812)
- [ ] All responsive breakpoints functional

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 14: Security Testing (15 min)

### 14.1 XSS Prevention
**Test**: Input sanitization
- [ ] Try HTML injection in input fields
- [ ] Script tags not executed
- [ ] Data properly escaped
- [ ] No console errors

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 14.2 CSRF Protection
**Test**: Verify session security
- [ ] Tokens validated
- [ ] Cross-origin requests blocked (if expected)
- [ ] CORS headers correct
- [ ] No unauthorized modifications possible

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 14.3 Authentication Security
**Test**: Auth token security
- [ ] Tokens not in URL parameters
- [ ] Tokens stored securely
- [ ] No token leakage in logs
- [ ] Session timeout works

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Phase 15: Console & Logging (10 min)

### 15.1 Error Logging
**Test**: Check browser console
```javascript
// Open DevTools Console
// Navigate through full onboarding flow
```
- [ ] No JavaScript errors
- [ ] No unhandled rejections
- [ ] No CORS errors
- [ ] No auth errors
- [ ] Expected warnings only (if any)

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

### 15.2 Application Logs
**Test**: Check application logs (if available)
- [ ] No error logs
- [ ] Request/response logs normal
- [ ] Performance logs within limits
- [ ] No sensitive data in logs

**Result**: [ ] PASS [ ] FAIL [ ] WARN
**Notes**: _____________________

---

## Test Summary

### Overall Results
- Total Tests: ___
- Passed: ___
- Failed: ___
- Warnings: ___
- Skipped: ___

### Pass Rate: ___% (Must be > 95% for approval)

### Critical Issues Found
1. _____________________
2. _____________________
3. _____________________

### Minor Issues Found
1. _____________________
2. _____________________
3. _____________________

### Performance Metrics
- Page Load Time: ___ ms
- Component Render: ___ ms
- API Response Time: ___ ms
- Bundle Size (gzip): ___ KB

### Sign-Off
- [ ] All critical issues resolved
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for production

**Tested By**: _______________  
**Date**: _______________  
**Approval**: [ ] APPROVED [ ] REJECTED [ ] PENDING

---

**Next Step**: If all tests pass with > 95% success rate, proceed to production deployment.

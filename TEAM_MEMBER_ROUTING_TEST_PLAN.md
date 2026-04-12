# Team Member Routing Verification Test Plan

## Overview
This document outlines all authentication and routing scenarios to verify that the business app routing works correctly for both business owners and team members.

## Changes Deployed

### 1. BusinessContext.tsx
- Added detailed logging for team member session detection
- Added error handling for Supabase fallback queries
- Added logging when owner is loaded from localStorage
- Better error messages for debugging failed team member data loading

### 2. LoginPage.tsx (All three auth flows)
- **Team Member Flow**: Changed from `window.location.href` to `window.location.reload()` for proper hard page reload
- **All Owner Flows** (Password, OTP, Google):
  - Now reads actual `plan`, `planExpiry`, `onboarding_done` from database instead of hardcoding
  - Uses `navigate('/app')` with 1000ms delay (React Router SPA navigation)
  - Added comprehensive logging at each step
  - Properly reads `business_name`, `business_logo`, `business_category` from either table

---

## Test Scenarios

### Scenario 1: Business Owner Password Login
**Flow**: Password auth → Load plan from DB → Navigate to /app with React Router

**Steps**:
1. Go to https://app-creation-request-2.vercel.app/login
2. Enter owner email and password
3. Click "Login" button
4. Observe console logs

**Expected Console Logs**:
```
[LoginPage] Owner login successful: {...userId, plan: 'pro|enterprise|basic|free', businessId...}
[LoginPage] Owner redirect to /app with navigate()
[BusinessContext] Owner loaded from localStorage: {...id, email, role}
```

**Expected Result**: 
- ✅ Login succeeds
- ✅ User sees dashboard (not onboarding/login)
- ✅ Plan badge shows correct plan (not always "FREE")
- ✅ No hard page reload (smooth transition)

---

### Scenario 2: Business Owner OTP Login
**Flow**: Send OTP → Verify OTP → Create/load owner → Navigate to /app

**Steps**:
1. Go to https://app-creation-request-2.vercel.app/login
2. Click "Email" tab
3. Enter owner email address
4. Click "Send OTP"
5. Enter OTP code from console (dev mode) or email
6. Click "Verify"
7. Observe console logs

**Expected Console Logs**:
```
[LoginPage] OTP user login successful: {...userId, plan, businessId...}
[LoginPage] OTP redirect to /app with navigate()
[BusinessContext] Owner loaded from localStorage: {...email, role}
```

**Expected Result**:
- ✅ Login succeeds
- ✅ User sees dashboard (not onboarding/login)
- ✅ Plan matches database value
- ✅ Smooth transition (no hard reload)

---

### Scenario 3: Business Owner Google Sign-In
**Flow**: Google auth → Create/load owner → Navigate to /app

**Steps**:
1. Go to https://app-creation-request-2.vercel.app/login
2. Click "Sign in with Google" button
3. Sign in with Google account
4. Observe console logs

**Expected Console Logs**:
```
[LoginPage] Google sign-in successful: {...userId, plan, businessId...}
[LoginPage] Google sign-in redirect to /app with navigate()
[BusinessContext] Owner loaded from localStorage: {...email, role}
```

**Expected Result**:
- ✅ Login succeeds
- ✅ User sees dashboard
- ✅ Plan value is correct (not hardcoded to free)
- ✅ Smooth transition

---

### Scenario 4: Team Member Password Login ⭐ (CRITICAL)
**Flow**: Password auth → Save session to localStorage → Hard page reload → Context loads async

**Steps**:
1. Go to https://app-creation-request-2.vercel.app/login
2. Enter team member email and password
3. Click "Login" button
4. Observe console logs (watch both before and after reload)

**Expected Console Logs (Before Reload)**:
```
[LoginPage] Checking team members for email: team@example.com
[LoginPage] Team member found: {id, email, businessId, hasPassword: true}
[LoginPage] Password verified successfully for team member: ...
[LoginPage] Saving team member session to localStorage: {id, businessId}
[LoginPage] Team member login successful, reloading page...
```

**Expected Console Logs (After Reload)**:
```
[BusinessContext] Team member session detected, will load async
[BusinessContext] Loading team member session: {teamId, businessId}
[BusinessContext] Loaded biz_users record successfully: {bizUserId, businessId}
    OR
[BusinessContext] Loaded business from fallback: {businessId, businessName}
```

**Expected Result**:
- ✅ Page reloads (hard reload)
- ✅ Spinner shows briefly
- ✅ Dashboard loads (not login page)
- ✅ User can access team member functions
- ✅ No redirect loop

---

### Scenario 5: Unauthenticated User Access to /app
**Flow**: No session → Redirect to /login

**Steps**:
1. Clear localStorage:
   ```javascript
   localStorage.clear()
   ```
2. Navigate directly to https://app-creation-request-2.vercel.app/app
3. Observe redirect

**Expected Result**:
- ✅ Immediately redirects to /login
- ✅ No dashboard visible
- ✅ No errors in console

---

### Scenario 6: Owner Onboarding Check
**Flow**: Owner login → Check onboarding_done from DB → Redirect to onboarding if needed

**Steps**:
1. Login as owner who has `onboarding_done = false` in database
2. Observe redirect

**Expected Result**:
- ✅ After login, redirects to /onboarding (not /app)
- ✅ Can complete onboarding
- ✅ After onboarding, redirects to /app

**Debug**: Check if `onboarding_done` is being read from database:
```javascript
// After login
const user = JSON.parse(localStorage.getItem('biz_user'));
console.log('Onboarding done:', user.onboarding_done);
```

---

### Scenario 7: Team Member First Login Password Change
**Flow**: Team member login → Check first_login flag → Show password change modal

**Steps**:
1. Login as team member with `first_login = true`
2. Page should show password change modal
3. Complete password change
4. Verify password is updated in database

**Expected Result**:
- ✅ Password change modal appears
- ✅ New password is saved to database
- ✅ First login flag is cleared

---

### Scenario 8: Owner Logout and Re-login
**Flow**: Logout → Clear session → Login again

**Steps**:
1. Login as owner
2. Go to Profile → Logout
3. Verify localStorage is cleared:
   ```javascript
   localStorage.getItem('biz_user') // should be null
   localStorage.getItem('team_member_session') // should be null
   ```
4. Try to access /app → should redirect to /login
5. Login again

**Expected Result**:
- ✅ Session is cleared
- ✅ Cannot access /app after logout
- ✅ Re-login works correctly
- ✅ New session is established

---

### Scenario 9: Team Member Logout
**Flow**: Logout → Clear team_member_session → Redirect to /login

**Steps**:
1. Login as team member
2. Go to Profile → Logout
3. Verify localStorage is cleared:
   ```javascript
   localStorage.getItem('team_member_session') // should be null
   ```
4. Try to access /app → should redirect to /login

**Expected Result**:
- ✅ Team session is cleared
- ✅ Cannot access /app after logout
- ✅ Redirects to /login immediately

---

### Scenario 10: Check Logs for Correct User Type
**Flow**: Verify logging distinguishes between owner and team member

**Steps**:
1. Login as owner
2. Check logs for `[LoginPage] Owner login successful:`
3. Check logs for `[BusinessContext] Owner loaded from localStorage:`
4. Logout and login as team member
5. Check logs for `[LoginPage] Team member login successful:`
6. Check logs for `[BusinessContext] Team member session detected, will load async:`

**Expected Result**:
- ✅ Different log messages for owner vs team member
- ✅ Logs clearly indicate which authentication path was taken
- ✅ Can trace the entire flow in console

---

## Debugging Commands

### Check Current User (Owner)
```javascript
const user = JSON.parse(localStorage.getItem('biz_user'));
console.log('Current owner:', { 
  id: user.id, 
  email: user.email, 
  plan: user.plan,
  onboarding_done: user.onboarding_done,
  isTeamMember: user.isTeamMember 
});
```

### Check Current User (Team Member)
```javascript
const session = JSON.parse(localStorage.getItem('team_member_session'));
const context = window.__businessContext; // if exposed
console.log('Current team member:', session);
```

### Check BusinessContext State (if accessible)
```javascript
// In browser console after React loads
// Note: This only works if context is exposed to window
window.__businessContext // may not exist, depends on implementation
```

### Simulate Failed Supabase Query
```javascript
// This would require modifying code, but test by:
// 1. Check network tab for Supabase calls
// 2. Look for 404 or error responses
// 3. Check if fallback query is triggered
```

---

## Common Issues & Solutions

### Issue: Team Member Stuck on /login After Authentication
**Cause**: Supabase query failed (business not found, or data loading error)
**Solution**: 
1. Check console for `[BusinessContext]` error logs
2. Verify business record exists in `businesses` table
3. Verify team member's `business_id` matches a business record
4. Check Supabase query in Network tab for error responses

### Issue: Owner Plan Always Shows as FREE
**Cause**: Plan was hardcoded instead of being read from database
**Solution**: 
1. Verify fix is deployed
2. Check that `result.user?.plan` is being read in LoginPage
3. Check database for owner's plan value
4. Check localStorage after login: `JSON.parse(localStorage.getItem('biz_user')).plan`

### Issue: Onboarding Not Showing After Owner Login
**Cause**: `onboarding_done` hardcoded to `true` or read incorrectly
**Solution**:
1. Check database: owner's `onboarding_done = false`
2. Verify LoginPage reads `(result.user as any)?.onboarding_done`
3. Check localStorage after login: `.onboarding_done` value
4. Verify BusinessLayout checks this value and redirects

### Issue: Owner Redirect Takes Too Long
**Cause**: 1000ms delay in navigate() call
**Solution**: Expected behavior. Routes use React Router's navigate() which is SPA-based, so 1000ms delay allows UI feedback.

### Issue: Team Member Page Reloads
**Cause**: Team member uses `window.location.reload()` for hard refresh
**Solution**: Expected behavior. Team members need hard reload to reinitialize React and async load data.

---

## Success Criteria

- ✅ Owner password login works correctly
- ✅ Owner OTP login works correctly  
- ✅ Owner Google sign-in works correctly
- ✅ Team member password login works correctly
- ✅ Onboarding redirects work based on database value
- ✅ Plan value matches database (not hardcoded)
- ✅ Logout clears session
- ✅ Unauthenticated access redirects to /login
- ✅ Console logs show correct user type and flow
- ✅ No errors in browser console during login/logout/navigation

---

## Deployment Verification

All changes have been deployed to production:
- Commit 1: `6f2678d` - Team member login debugging improvements
- Commit 2: `ebe72a7` - Owner login database field fixes

To verify deployment:
```bash
git log --oneline | head -5
# Should show commits with [LoginPage] and [BusinessContext] updates
```

---

## Next Steps if Issues Occur

1. **Enable Network Inspection**: Open DevTools → Network tab
2. **Monitor Supabase Queries**: Watch for failed queries to `biz_users` or `businesses` table
3. **Check Response Payloads**: See if data is being returned from Supabase
4. **Review Console Logs**: Follow the log messages to identify which step fails
5. **Share Logs with Developer**: Screenshot console output showing the error

---

**Last Updated**: April 13, 2026
**Status**: Ready for Testing

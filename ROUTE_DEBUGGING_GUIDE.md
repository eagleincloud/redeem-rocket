# Route Debugging Guide

## Issue Summary
After signup, redirect should go to `/business/onboarding` but appears to go to `/onboarding`.

## Verified Fixes Applied ✅
- [x] SignupPage.tsx: `navigate('/business/onboarding')`
- [x] LoginPage.tsx (3 locations): `navigate('/business/onboarding')`
- [x] Root.tsx: `navigate('/business/onboarding')`
- [x] Built code contains correct path
- [x] Routes defined as: `path: '/business/onboarding'`

## Possible Remaining Issues

### 1. Browser Caching
**Check:**
- Open DevTools → Network tab → disable cache
- Or use incognito/private tab
- Clear local storage: `localStorage.clear()`
- Ctrl+Shift+Delete to clear all cache

### 2. Service Worker
**Check:**
- DevTools → Application → Service Workers
- Unregister any service workers
- Or add `?v=123` to URL to bypass cache

### 3. Vercel Edge Cache
**Check:**
- URL might be cached at CDN level
- Solution: Vercel already re-deployed with --force

### 4. Route Matching Issue
**Possible Problem:**
- App router has `/onboarding` route (src/app/routes.tsx:39)
- Business router has `/business/onboarding`
- Might conflict if routers overlap

**To Debug:**
- Open browser console
- Add: `console.log('Current path:', window.location.pathname)`
- Check what React Router is matching

### 5. Basename Configuration
**Current Setting:**
- Production: `basename: '/'`
- Development: `basename: '/business.html'`

**Check:**
- In production, routes should be absolute (`/business/onboarding`)
- Test URL: `https://redeemrocket.in/business/onboarding`

## Testing Steps

1. **Clear all caches:**
   ```bash
   - Ctrl+Shift+Delete → Clear all browser data
   - Or use incognito tab
   ```

2. **Test URL directly:**
   - Go to: `https://redeemrocket.in/business/onboarding`
   - Does the onboarding page load? (Should show 5 questions)

3. **Check console:**
   - DevTools → Console
   - Type: `window.location.pathname`
   - Should show: `/business/onboarding`

4. **Check localStorage:**
   - DevTools → Application → Local Storage
   - Look for: `onboarding_status`, `biz_user`
   - These might be forcing a redirect

5. **Network trace:**
   - DevTools → Network
   - Do signup
   - Check redirect chain:
     - POST to `/signup` 
     - Redirect to `/business/onboarding` or `/onboarding`?

## If Still Failing

Send:
1. Screenshot of DevTools → Network tab showing the redirect
2. Browser console error messages (if any)
3. Current URL when you see the wrong onboarding page
4. Steps to reproduce exactly

## Route Map (Verified)

**Business App Routes:**
```
/              → Landing
/login         → Login Page
/signup        → Signup Page
/business/onboarding  ← Should redirect here
/app           → Dashboard
/app/finance   → Finance
...more routes
```

**App Routes (May Conflict):**
```
/onboarding    ← PROBLEM: This might be catching requests
...
```

## Possible Fix If Needed

If the app router `/onboarding` is interfering, we may need to:
1. Remove or rename `/onboarding` route in app router
2. Or, change business route to `/business-onboarding`
3. Or, add route guard to prevent app router from matching


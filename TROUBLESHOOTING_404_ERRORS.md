# 🔧 Troubleshooting 404 Errors & App Issues

**Date:** April 7, 2026
**Status:** Diagnostic Guide for App Errors

---

## ✅ What We've Verified

- ✓ All three vite configs are correct
- ✓ All CSS imports are fixed
- ✓ Routes are properly configured
- ✓ All components exist
- ✓ .env file exists with Supabase credentials
- ✓ Environment variables are properly set:
  - `VITE_SUPABASE_URL=https://eomqkeoozxnttqizstzk.supabase.co`
  - `VITE_SUPABASE_ANON_KEY=sb_publishable_...`
  - All other required vars present

---

## 🔴 Possible Causes of 404 Error

### 1. **Environment Variables Not Loading**
The .env file exists but Vite might not be loading them properly.

**Fix:**
```bash
# Kill all running servers
pkill -f vite

# Clear Vite cache
rm -rf node_modules/.vite

# Restart servers
npm run dev:business
```

### 2. **Supabase Connection Issues**
The Supabase database might not have required tables.

**Check:**
- Go to Supabase Dashboard: https://app.supabase.com
- Project: `eomqkeoozxnttqizstzk`
- SQL Editor → Run all migrations
- Check if tables exist: `leads`, `businesses`, `products`, etc.

**Fix if missing:**
```bash
# In Supabase SQL Editor, run:
-- From migrations folder in order:
-- 20240001_paynow_schema.sql
-- 20240002_notifications_schema.sql
-- 20240003_otp_auth_schema.sql
-- ... and so on in sequence
```

### 3. **Component Runtime Errors**
A component might be throwing an error during render.

**Check:**
- Open browser DevTools (F12)
- Console tab → see actual errors
- Network tab → check for failed API calls

### 4. **Missing Error Boundary**
Apps don't have error boundaries to catch and display errors properly.

**Solution:** Add error boundary wrapper (see below)

---

## 📋 Quick Diagnostic Checklist

### In Browser Console (F12):
- [ ] Any red errors?
- [ ] Any 404 requests in Network tab?
- [ ] Any CORS errors?
- [ ] Any "undefined" reference errors?

### App-Specific Issues:

**Customer App (5173):**
- [ ] Can you see the map?
- [ ] Are categories loading?
- [ ] Check if Home component is throwing errors

**Business App (5174):**
- [ ] Does Dashboard load?
- [ ] Are leads fetching from Supabase?
- [ ] Check if DashboardPage is trying to query non-existent tables

**Admin App (5175):**
- [ ] Does admin panel load?
- [ ] Can you see user list?
- [ ] Are there any 404s from API calls?

---

## 🛠️ Immediate Actions to Try

### 1. **Clear Cache and Restart**
```bash
# Kill servers
pkill -f vite

# Clear caches
rm -rf .next dist dist-business dist-admin
rm -rf node_modules/.vite
rm -rf node_modules/.cache

# Restart
npm run dev:business
```

### 2. **Add Error Boundary to Catch Real Errors**

Create `src/app/components/ErrorBoundary.tsx`:
```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong</h2>
          <details style={{ whiteSpace: 'pre-wrap', cursor: 'pointer' }}>
            {this.state.error?.toString()}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
```

Then wrap Root:
```typescript
// In src/app/routes.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ErrorBoundary>
        <Root />
      </ErrorBoundary>
    ),
    // ...
  },
  // ...
]);
```

### 3. **Enable Console Logging**

Add to `src/app/components/Root.tsx`:
```typescript
useEffect(() => {
  console.log('Root component mounted');
  console.log('DEV_BYPASS:', DEV_BYPASS);
  console.log('User:', localStorage.getItem('user'));
  console.log('Supabase initialized:', hasSupabase());
}, []);
```

### 4. **Check Supabase Connection**

Add to `src/app/lib/supabase.ts`:
```typescript
export const supabase = url && anonKey 
  ? createClient(url, anonKey) 
  : null;

// Log for debugging
if (!supabase) {
  console.error('Supabase not configured!', {
    url: url ? 'present' : 'missing',
    anonKey: anonKey ? 'present' : 'missing'
  });
} else {
  console.log('✓ Supabase configured');
}
```

---

## 🧪 Testing Each App Independently

### Test Customer App:
1. Open http://localhost:5173
2. Should see map or Home page
3. Check console for errors
4. Try navigating to /explore

### Test Business App:
1. Open http://localhost:5174/business.html
2. Should see Dashboard
3. Check if it's querying Supabase (Network tab)
4. Try navigating to /app/leads

### Test Admin App:
1. Open http://localhost:5175/admin.html
2. Should see Admin panel
3. Check for user data loading
4. Check Network tab for API calls

---

## 📊 Common 404 Sources

| Error | Cause | Fix |
|-------|-------|-----|
| 404 on `/` | Route not configured | Check routes.tsx |
| 404 on `/api/*` | Backend endpoint missing | Check if Supabase functions exist |
| 404 on asset | CSS/JS not found | Check vite config |
| 404 from Supabase | Table doesn't exist | Run migrations |
| Component not rendering | Import error or render error | Check console errors |

---

## 🚀 Next Steps

1. **Check browser console (F12)** - Look for actual error message
2. **Check Network tab** - See which requests are failing
3. **Look at server logs** - See if there are compilation errors
4. **Add error boundary** - To see actual React errors
5. **Test Supabase connection** - Make sure database is accessible

---

## 📞 If Still Not Working

**Check these in order:**
1. Browser DevTools Console - what's the actual error?
2. Network tab - what requests failed?
3. Supabase Dashboard - are tables created?
4. Environment variables - are they loaded?
5. Vite config - are all apps configured?

**Share:**
- Screenshot of browser console error
- Browser Network tab (failed requests)
- Server terminal output

---

**Last Updated:** April 7, 2026


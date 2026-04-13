# Business App - Quick Start Guide

**For:** Developers testing the Redeem Rocket Business App
**Last Updated:** April 7, 2026

---

## 🚀 30-Second Startup

```bash
# 1. Navigate to project
cd "/Users/adityatiwari/Downloads/App Creation Request-2"

# 2. Start the business app
npm run dev:business

# 3. Open in browser
# http://localhost:5174/business.html
```

**Boom! 🎉 App is running**

---

## 🆕 New Features (April 2026)

### ✨ Better Error Messages
- No more confusing "404 Not Found" errors
- Real error messages show what went wrong
- Stack traces help with debugging
- Professional error page with suggestions

### 🔄 Smart Routing
- New users → Onboarding → Dashboard
- Existing users → Dashboard (skip onboarding)
- Protected routes prevent unauthorized access

---

## 👤 Testing - Quick Login

### Option 1: New User
1. Email: `test@example.com`
2. Click "Send OTP"
3. Enter any 6 digits (e.g., `000000`)
4. Complete onboarding setup
5. Land on Dashboard

### Option 2: Quick Demo Login
1. On login page, scroll down
2. Click any "Quick Demo Login" button
3. Instant access to dashboard

---

## 🎯 What to Test (5 min checklist)

```
✓ Login page loads
✓ Complete login flow
✓ Dashboard displays
✓ Click sidebar items
✓ Pages load without errors
✓ If error occurs → Check error popup for details
```

---

## 📍 Where Everything Is

### Main Files
```
src/business/
├── routes.tsx                          ← Route definitions
├── components/
│   ├── BusinessLayout.tsx              ← Main dashboard layout
│   ├── ErrorBoundary.tsx               ← Error catching
│   ├── ErrorElement.tsx                ← Error display (NEW)
│   ├── BusinessLogin.tsx               ← Login page
│   ├── BusinessOnboarding.tsx          ← New user setup
│   └── [19 page components]            ← All dashboard pages
└── context/
    └── BusinessContext.tsx             ← User state
```

### Configuration
```
vite.config.business.ts        ← Build config
.env                           ← Environment variables
```

---

## 🔍 If Something Goes Wrong

### Step 1: Check the Error Popup
When a page fails:
1. Red error box appears
2. Shows actual error message
3. Click "Click to see error details" for stack trace
4. Button: "Refresh Page" or "Go Home"

### Step 2: Open Browser Console
```
F12 → Console tab → Look for red messages
```

### Step 3: Check Network Requests
```
F12 → Network tab → Reload page
Look for red requests (failed API calls)
```

### Step 4: Read the Error Message
Most errors tell you exactly what's wrong:
- "Cannot read property X of undefined" → Something is null
- "Cannot find module" → Import path is wrong
- "Supabase error" → Database connection issue

---

## 📱 All 19 Pages to Test

After login, try each page:

```
Dashboard          /app
├─ Products        /app/products
├─ Offers          /app/offers
├─ Auctions        /app/auctions
├─ Orders          /app/orders
├─ Requirements    /app/requirements
├─ Wallet          /app/wallet
├─ Analytics       /app/analytics
├─ Grow            /app/grow
├─ Photos          /app/photos
├─ Profile         /app/profile
├─ Notifications   /app/notifications
├─ Subscription    /app/subscription
├─ Marketing       /app/marketing
├─ Campaigns       /app/campaigns
├─ Invoices        /app/invoices
├─ Leads           /app/leads
├─ Outreach        /app/outreach
└─ Team            /app/team
```

**For each page:**
1. Click the sidebar link
2. Wait for page to load
3. If error → Note the message
4. If loaded → Click another link

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot connect to Supabase"
**Solution:** Check `.env` file has correct credentials
```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyxxxx
```

### Issue: "Cannot find module X"
**Solution:** Check import path is correct
- Should be: `import { Foo } from './components/Foo'`
- Check file exists in that location

### Issue: "Page is empty/blank"
**Solution:**
1. Check browser console for errors
2. Verify data is in Supabase
3. Check Network tab for API calls

### Issue: "Redirect loop"
**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Login again

### Issue: "Styles look broken"
**Solution:**
1. Hard refresh: `Ctrl+F5` (Windows) or `Cmd+Shift+R` (Mac)
2. Clear browser cache: `Ctrl+Shift+Delete`

---

## 💾 localStorage Check

Open DevTools Console and run:
```javascript
// See current user
JSON.parse(localStorage.getItem('biz_user'))

// Clear if corrupted
localStorage.clear()

// Check specific fields
const user = JSON.parse(localStorage.getItem('biz_user'))
console.log('Onboarding done:', user.onboarding_done)
console.log('Business ID:', user.businessId)
```

---

## 📊 Response Expectations

### Pages That Show Data
```
✓ Dashboard        → Shows widgets, charts, metrics
✓ Products         → Shows product list or empty state
✓ Orders           → Shows orders or empty state
✓ Analytics        → Shows charts and metrics
✓ Leads            → Shows leads or empty state
```

### Pages That Are Empty (Normal)
```
✓ Offers           → Empty until you create one
✓ Campaigns        → Empty until you create one
✓ Team             → Empty until you add members
✓ Photos           → Empty until you upload
```

### Pages With Forms
```
✓ Profile          → Shows business info form
✓ Subscription     → Shows plan selection
✓ Settings pages   → Various configuration forms
```

---

## 🎬 Complete Test Scenario (10 min)

### Scenario 1: New User
```
1. Open http://localhost:5174/business.html
2. See login page
3. Enter email: test@newuser.com
4. Click "Send OTP"
5. Enter OTP: 000000
6. Click "Verify & Sign In"
7. Success message appears
8. Redirect to /onboarding
9. Complete 6 steps:
   - Business Info
   - Location
   - Hours
   - Photos
   - Team
   - Plan
10. Click "Complete Setup"
11. Redirect to /app (Dashboard)
12. Dashboard displays
13. Click Products → /app/products loads
14. Click Offers → /app/offers loads
15. All pages load without 404 errors ✓
```

### Scenario 2: Existing User
```
1. Open http://localhost:5174/business.html
2. See login page
3. Enter same email: test@newuser.com
4. Click "Send OTP"
5. Enter OTP: 000000
6. Click "Verify & Sign In"
7. Success message
8. Redirect to /app (Dashboard) - No onboarding! ✓
9. Dashboard displays
10. Can access all pages
```

### Scenario 3: Return Session
```
1. App is already loaded
2. Click refresh (F5)
3. Should stay on current page OR
4. If logged in, should maintain dashboard
5. If not logged in, should show login
6. No loss of data ✓
```

---

## 🚨 When to Report Issues

Report an issue if:
- ❌ Generic "404 Not Found" error (should be specific)
- ❌ Whitepage with no error message
- ❌ Console showing "Cannot find module X"
- ❌ Page should have data but empty (and not starting)
- ❌ Authentication not working
- ❌ Redirect loops happening
- ❌ Styles completely broken
- ❌ Navigation buttons don't work

**When reporting, include:**
1. What you were doing
2. The error message (screenshot)
3. Console error (F12 → Console)
4. Network error (if any)
5. Browser/OS version

---

## 🔐 Security Notes

- ✅ Passwords never stored locally (OTP only)
- ✅ localStorage only stores user metadata
- ✅ API calls use Supabase auth tokens
- ✅ Protected routes prevent unauthorized access
- ✅ localStorage.clear() on logout

---

## 📚 Detailed Guides

For in-depth information, see:

1. **BUSINESS_APP_TESTING_GUIDE.md**
   - Complete testing procedures
   - All features to test
   - Troubleshooting guide

2. **BUSINESS_APP_ROUTING_SETUP.md**
   - How routing works
   - User journey flows
   - Route protection details

3. **BUSINESS_APP_FIXES_COMPLETE.md**
   - All fixes implemented
   - Technical details
   - Deployment checklist

---

## ⚡ Performance Tips

- **Fast refresh:** F5 (not Ctrl+R)
- **Hard refresh:** Ctrl+F5 (clears cache)
- **Clear cache:** Ctrl+Shift+Delete
- **Dev throttling:** F12 → Network → Slow 3G (test slow connections)
- **Device emulation:** F12 → Toggle Device Toolbar (test mobile)

---

## 🎯 Success Criteria

✅ You're good when:
```
✓ All 19 pages load without generic 404 errors
✓ Actual error messages are shown if problems occur
✓ Login flow works (new users → onboarding → dashboard)
✓ Existing users go straight to dashboard
✓ All navigation works
✓ Data displays or proper empty states shown
✓ No console errors (except warnings)
✓ Responsive on mobile/tablet/desktop
```

---

## 🤔 Questions?

Check these in order:
1. **Error message itself** - Usually tells you the problem
2. **Browser console** - F12 → Console tab
3. **BUSINESS_APP_TESTING_GUIDE.md** - Detailed procedures
4. **BUSINESS_APP_FIXES_COMPLETE.md** - Technical details
5. **Network tab** - F12 → Network → See API calls

---

## ✅ Checklist Before Reporting Issues

```
Before reporting, have you:
□ Tried refreshing the page (F5)?
□ Tried hard refresh (Ctrl+F5)?
□ Cleared browser cache?
□ Cleared localStorage?
□ Checked browser console for errors?
□ Checked Network tab for failed API calls?
□ Verified Supabase credentials in .env?
□ Tried on a different browser?
□ Restarted the dev server?
```

---

**Happy Testing! 🎉**

If you find issues, the error messages should tell you exactly what's wrong.
If not, check the detailed guides above.

Remember: The goal is to make errors **helpful** not confusing.

**Status:** ✅ App is ready for comprehensive testing

---

*Last Updated: April 7, 2026*
*All Error Handling Implemented*

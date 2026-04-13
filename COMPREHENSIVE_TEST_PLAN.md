# Comprehensive Test Plan - Business App

**Purpose:** Complete functional testing before production deployment
**Target:** All 19 pages + Authentication + Error Handling
**Time Estimate:** 2-3 hours for full testing

---

## 🎯 Pre-Testing Setup

### Prerequisites
```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Verify .env file has credentials
cat .env | grep VITE_SUPABASE

# 3. Start development server
npm run dev:business

# 4. Open DevTools (F12) and keep Console tab open
# This will show any errors immediately
```

### Browser Setup
- Open: **http://localhost:5174/business.html**
- Keep DevTools open (F12 → Console tab)
- Clear localStorage before starting: `localStorage.clear()`

---

## 📋 TEST PHASE 1: AUTHENTICATION (15 min)

### Test 1.1: New User Registration Flow

**Steps:**
```
1. Browser: http://localhost:5174/business.html
   Expected: Landing page or login form

2. Click "Login" button
   Expected: Login page loads with email/phone options

3. Select "Email" tab
   Expected: Email input field visible

4. Enter test email: test_new_user_001@example.com
   Expected: Email accepted

5. Click "Send OTP"
   Expected: OTP sent confirmation

6. Enter OTP: 000000
   Expected: 6 digit fields filled

7. Click "Verify & Sign In"
   Expected: Success animation shows, message "Signed in! 🎉"

8. Wait 2 seconds
   Expected: Page redirects to /onboarding (URL changes)

9. Onboarding Step 1: Business Info
   - Business Type: "Electronics"
   - Business Name: "Test Electronics Store"
   - Logo: 🔌 (should be selected)
   Expected: Form filled, Next button enabled

10. Click Next
    Expected: Progress shows Step 2/6

11. Onboarding Step 2: Location
    - Address: "123 Test Street"
    - City: "Mumbai"
    - Pincode: "400001"
    Expected: Form filled

12. Click Next
    Expected: Progress shows Step 3/6

13. Onboarding Step 3: Hours
    - Monday-Saturday: 09:00 - 21:00
    - Sunday: Toggle closed
    Expected: Hours configured

14. Click Next
    Expected: Progress shows Step 4/6

15. Onboarding Step 4: Photos (Optional)
    - Skip or upload test image
    Expected: Can skip or upload

16. Click Next
    Expected: Progress shows Step 5/6

17. Onboarding Step 5: Team
    - Add team member or skip
    Expected: Can add or skip

18. Click Next
    Expected: Progress shows Step 6/6

19. Onboarding Step 6: Plan
    - Select: "Pro" plan
    Expected: Plan selected with features shown

20. Click "Complete Setup"
    Expected: Loading spinner, success message

21. Wait 2 seconds
    Expected: Redirect to /app (Dashboard)
    URL should be: http://localhost:5174/business.html/app

22. Dashboard loads
    Expected: Dashboard displays with:
    - Revenue chart
    - Recent orders
    - Getting started card
    - Team section
    - Metrics

✅ TEST PASSED if:
- No errors in console
- No 404 errors
- Onboarding completed
- Dashboard loaded
```

**Console Check:** `localStorage.getItem('biz_user')` should show:
```json
{
  "onboarding_done": true,
  "businessId": "biz-xxxxx",
  "businessName": "Test Electronics Store"
}
```

---

### Test 1.2: Existing User Login Flow

**Steps:**
```
1. From dashboard, logout
   - Click user menu (top right)
   - Click "Logout"
   Expected: Redirected to /login

2. Clear any session data if needed
   - Console: localStorage.clear()

3. Login with same email: test_new_user_001@example.com
   Expected: Login form loads

4. Enter email
   Click "Send OTP"
   Expected: OTP sent

5. Enter OTP: 000000
   Click "Verify & Sign In"
   Expected: Success animation, but NO onboarding!

6. After 2 seconds
   Expected: Redirect to /app (Dashboard) NOT /onboarding

7. Dashboard loads immediately
   Expected: See dashboard without onboarding

✅ TEST PASSED if:
- Redirected directly to /app
- No onboarding shown
- Dashboard loads
- No console errors
```

---

### Test 1.3: Session Persistence

**Steps:**
```
1. From dashboard, press F5 (refresh)
   Expected: Page stays on dashboard (session preserved)

2. After refresh, page should show
   Expected: Dashboard loads again

3. Check console
   Expected: localStorage still has user data

4. Close browser completely
   Expected: All tabs/windows closed

5. Reopen browser
   Navigate to: http://localhost:5174/business.html
   Expected: Since we're not logged in after full close, should show login

6. Open DevTools console
   Expected: localStorage might be empty

✅ TEST PASSED if:
- Session persists on refresh
- Data is properly stored
- No console errors
```

---

## 📋 TEST PHASE 2: ERROR HANDLING (10 min)

### Test 2.1: Route Protection

**Steps:**
```
1. Clear localStorage: localStorage.clear()

2. Try accessing: http://localhost:5174/business.html/app
   Expected: Redirected to login page

3. Check console for errors
   Expected: No errors, clean redirect

✅ TEST PASSED if:
- Redirected to login
- No 404 error
- No console errors
```

### Test 2.2: Error Message Display

**Steps:**
```
1. Intentionally break something (testing error display)
   - Open console
   - Type: window.location.href = '/business.html/app/fake-page'

2. Press Enter
   Expected: Error page shows with message

3. Error popup should show:
   - Error title (e.g., "404: Page Not Found")
   - Error message
   - "Click to see error details" button

4. Click "Click to see error details"
   Expected: Stack trace expands

5. Check for helpful info:
   - Error message is clear
   - Stack trace shows file/line
   - Buttons to refresh or go home

✅ TEST PASSED if:
- Error page shows (not white blank page)
- Error message is helpful
- Stack trace visible
- Buttons work
```

---

## 📋 TEST PHASE 3: ALL 19 PAGES (40 min)

For each page, follow this pattern:

**Test Pattern:**
```
1. Click page in sidebar
2. Wait for page to load (2-3 seconds)
3. Verify:
   - URL changed correctly
   - No 404 errors
   - No console errors
   - Page has content or empty state
   - Sidebar highlights current page
4. Check for common elements:
   - Headers/titles
   - Search/filter (if applicable)
   - Action buttons
   - Data displays or empty state message
```

### Dashboard (`/app`)
```
✓ URL: .../business.html/app
✓ Should show: Revenue chart, recent orders, KPIs
✓ Search for: Charts, metrics, cards
✓ Common elements: Widgets, cards, numbers
```

### Products (`/app/products`)
```
✓ URL: .../business.html/app/products
✓ Should show: Product list or empty state
✓ Buttons: Add Product, Search, Filter
✓ Columns: Name, Category, Price, Stock
```

### Offers (`/app/offers`)
```
✓ URL: .../business.html/app/offers
✓ Should show: Offers list or empty state
✓ Buttons: Create Offer, Search
✓ Info: Offer name, discount, validity
```

### Auctions (`/app/auctions`)
```
✓ URL: .../business.html/app/auctions
✓ Should show: Auction list or empty state
✓ Buttons: Create Auction
✓ Info: Item, starting price, bids
```

### Orders (`/app/orders`)
```
✓ URL: .../business.html/app/orders
✓ Should show: Orders list or empty state
✓ Buttons: Filter, search
✓ Info: Order ID, customer, amount, date
```

### Requirements (`/app/requirements`)
```
✓ URL: .../business.html/app/requirements
✓ Should show: Requirements list or empty state
✓ Buttons: Add requirement
✓ Info: Customer needs, quotes
```

### Wallet (`/app/wallet`)
```
✓ URL: .../business.html/app/wallet
✓ Should show: Balance, transactions
✓ Elements: Account balance, history, buttons
```

### Analytics (`/app/analytics`)
```
✓ URL: .../business.html/app/analytics
✓ Should show: Charts and metrics
✓ Elements: Period selector, charts, KPIs
✓ Charts: Line charts, bar charts, data
```

### Grow (`/app/grow`)
```
✓ URL: .../business.html/app/grow
✓ Should show: Growth recommendations
✓ Elements: Suggestions, metrics
```

### Photos (`/app/photos`)
```
✓ URL: .../business.html/app/photos
✓ Should show: Photo gallery or upload prompt
✓ Buttons: Upload, delete
✓ Features: Cover photo selection
```

### Profile (`/app/profile`)
```
✓ URL: .../business.html/app/profile
✓ Should show: Business info form
✓ Fields: Name, category, logo, description
✓ Buttons: Save, cancel
```

### Notifications (`/app/notifications`)
```
✓ URL: .../business.html/app/notifications
✓ Should show: Notification list or empty
✓ Elements: Notification cards, timestamps
```

### Subscription (`/app/subscription`)
```
✓ URL: .../business.html/app/subscription
✓ Should show: Plan selection
✓ Elements: Plan cards, features, pricing
✓ Buttons: Select plan, upgrade, downgrade
```

### Marketing (`/app/marketing`)
```
✓ URL: .../business.html/app/marketing
✓ Should show: Marketing tools
✓ Elements: Campaign overview, recommendations
```

### Campaigns (`/app/campaigns`)
```
✓ URL: .../business.html/app/campaigns
✓ Should show: Campaign list or empty state
✓ Buttons: Create campaign
✓ Info: Campaign name, reach, stats
```

### Invoices (`/app/invoices`)
```
✓ URL: .../business.html/app/invoices
✓ Should show: Invoice list or empty state
✓ Buttons: Generate, download
✓ Info: Invoice number, amount, date
```

### Leads (`/app/leads`)
```
✓ URL: .../business.html/app/leads
✓ Should show: Lead list or empty state
✓ Buttons: Add lead, import
✓ Info: Lead name, status, value
```

### Outreach (`/app/outreach`)
```
✓ URL: .../business.html/app/outreach
✓ Should show: Campaigns or empty state
✓ Buttons: Create campaign
✓ Info: Campaign stats, messages sent
```

### Team (`/app/team`)
```
✓ URL: .../business.html/app/team
✓ Should show: Team members from onboarding
✓ Buttons: Add member, edit, delete
✓ Info: Name, email, role, permissions
```

---

## 📊 TEST PHASE 4: FEATURE TESTING (30 min)

### Feature 4.1: Product Management
```
1. Go to Products page
2. Click "Add Product" or similar button
3. Fill form:
   - Name: "Test Product"
   - Category: "Electronics"
   - Price: 999
4. Save/Submit
   Expected: Product added to list
✅ PASSED if: Product appears in list
```

### Feature 4.2: Photo Upload
```
1. Go to Photos page
2. Click upload button
3. Select test image file
4. Upload
   Expected: Photo appears in gallery
✅ PASSED if: Photo displays
```

### Feature 4.3: Team Member Visibility
```
1. Go to Team page
2. Check if members added during onboarding appear
   Expected: Members from step 5 should be listed
✅ PASSED if: Members are shown
```

### Feature 4.4: Navigation Consistency
```
1. Click through all pages
2. Check sidebar always highlights current page
3. Check all links work
   Expected: Smooth navigation, no broken links
✅ PASSED if: All navigation works
```

---

## 📋 TEST PHASE 5: RESPONSIVE DESIGN (15 min)

### Test 5.1: Mobile View
```
1. DevTools → Toggle device toolbar (Ctrl+Shift+M)
2. Select "iPhone 12" or similar
3. Navigate through pages
4. Check:
   - Layout adjusts
   - Text readable
   - Buttons clickable
   - No overflow
✅ PASSED if: Pages work on mobile
```

### Test 5.2: Tablet View
```
1. DevTools → Select "iPad" or similar
2. Test same as mobile
✅ PASSED if: Works on tablet
```

### Test 5.3: Desktop View
```
1. Resize to 1920x1080
2. Verify sidebar and content layout
3. Check spacing and alignment
✅ PASSED if: Looks good on desktop
```

---

## 🔍 CONSOLE CHECKS

After each test, verify:

```javascript
// 1. Check for errors (should be empty or only warnings)
console.log('Errors:', console.errors)

// 2. Check user data
JSON.parse(localStorage.getItem('biz_user'))

// 3. Check for 404s in Network tab
// Should see successful API calls (200, 201 status)

// 4. Check for JavaScript errors
// Console should be clean (no red messages)
```

---

## ✅ TEST REPORT TEMPLATE

For each test, record:

```
Test: [Test Name]
Status: ✅ PASSED / ❌ FAILED
Notes: [Any observations]
Errors: [If any]
Console Issues: [If any]
Time: [How long it took]

Evidence:
- Screenshot: [If failed]
- Console errors: [If any]
- Network errors: [If any]
```

---

## 🎯 SUCCESS CRITERIA

### Must Pass
- ✅ New user can register and complete onboarding
- ✅ Existing user can login directly to dashboard
- ✅ All 19 pages load without 404 errors
- ✅ No console errors (except warnings)
- ✅ Error messages are helpful and clear
- ✅ Session persists on refresh
- ✅ Route protection works

### Should Pass
- ✅ All features functional
- ✅ Data displays correctly
- ✅ Responsive on mobile/tablet
- ✅ Navigation smooth
- ✅ Team members visible (from onboarding)

### Nice to Have
- ✅ Fast page load
- ✅ Smooth animations
- ✅ Professional styling
- ✅ Dark/light theme works

---

## 📝 TESTING CHECKLIST

```
AUTHENTICATION:
☐ New user registration
☐ OTP verification
☐ Onboarding completion
☐ Existing user login (no onboarding)
☐ Session persistence
☐ Route protection

PAGES (19 total):
☐ Dashboard
☐ Products
☐ Offers
☐ Auctions
☐ Orders
☐ Requirements
☐ Wallet
☐ Analytics
☐ Grow
☐ Photos
☐ Profile
☐ Notifications
☐ Subscription
☐ Marketing
☐ Campaigns
☐ Invoices
☐ Leads
☐ Outreach
☐ Team

ERROR HANDLING:
☐ Route protection errors
☐ Component render errors
☐ Error message clarity
☐ Stack trace visibility
☐ Recovery buttons work

FEATURES:
☐ Add/edit product
☐ Upload photos
☐ Team members visible
☐ Navigation works
☐ Data displays

RESPONSIVE:
☐ Mobile (375px)
☐ Tablet (768px)
☐ Desktop (1920px)

FINAL:
☐ All tests passed
☐ No critical issues
☐ Ready for production
```

---

## 🎬 ESTIMATED TIMELINE

| Phase | Tests | Time | Status |
|-------|-------|------|--------|
| Phase 1 | Auth (3 tests) | 15 min | ⏳ |
| Phase 2 | Errors (2 tests) | 10 min | ⏳ |
| Phase 3 | Pages (19 tests) | 40 min | ⏳ |
| Phase 4 | Features (4 tests) | 30 min | ⏳ |
| Phase 5 | Responsive (3 tests) | 15 min | ⏳ |
| **Total** | **31 tests** | **2-3 hours** | ⏳ |

---

**Ready to test?** Follow the steps above and document results!

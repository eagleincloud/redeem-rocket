# 🧪 Local Verification Checklist

**Purpose**: Verify all changes work correctly before deploying to Vercel  
**Environment**: http://localhost:5173 (Business App)  
**Status**: Ready for Testing

---

## 🚀 Quick Start

### Open App
```
http://localhost:5173
```

### Login or Create Test Account
- Email: test@example.com (or any email)
- Password: Any strong password

---

## ✅ Feature Verification Checklist

### Layer 1: Pipeline Engine
**Route**: `/app/pipelines`

- [ ] Page loads without errors
- [ ] See pipeline list (Lead, Marketing, Retention, Support)
- [ ] Can view pipeline details
- [ ] Glassmorphic design visible (dark theme with blur effect)
- [ ] No console errors (F12 > Console)

**Test**: Click on "Lead Pipeline" → Should show stages

---

### Layer 2: Automation Engine
**Route**: `/app/automation/rules`

- [ ] Page loads without errors
- [ ] See automation rules list
- [ ] "Create Rule" button visible
- [ ] Design theme matches (dark glassmorphic)
- [ ] No console errors

**Test**: Click "Create Rule" → Should open rule builder

---

### Layer 3: Smart Onboarding
**Route**: `/business-app/onboarding` (for new signup flow)

- [ ] If new user: Onboarding shows 5 feature questions
- [ ] Feature preference questions display with icons (📦 👥 📧 🤖 📱)
- [ ] Can select yes/no for each question
- [ ] "Next" button works
- [ ] Progress indicator shows (e.g., "1 of 5")

**Test**: Create new account → Should trigger onboarding

---

### Layer 4: Configurable System
**Route**: `/app/settings`

- [ ] Settings page loads
- [ ] Features tab shows toggle switches
- [ ] Can toggle features on/off
- [ ] Navigation updates when features toggled
- [ ] Settings persist (refresh page, should still be enabled/disabled)

**Test**: Toggle "Lead Management" OFF → Navigate away and back → Should still be OFF

---

### Layer 5: Actionable Dashboard
**Route**: `/app/dashboard-insights`

- [ ] Page loads without errors
- [ ] See insight cards (bottlenecks, recommendations, celebrations)
- [ ] Recommendations display with action buttons
- [ ] Charts/metrics visible
- [ ] Design consistent with other pages

**Test**: Should show real data or sample data, no errors

---

### Layer 6: Advanced Analytics
**Route**: `/app/analytics/advanced`

- [ ] Analytics page loads
- [ ] See analytics charts/metrics
- [ ] Design matches other pages
- [ ] No broken chart displays

**Test**: Charts should render (even if empty)

---

### Layer 7: AI + Manager Layer
**Route**: `/app/manager`

- [ ] Manager portal loads
- [ ] See manager stats cards
- [ ] See list of assigned leads (if any)
- [ ] "Draft Email" button visible on leads
- [ ] Design consistent

**Test**: Click on a lead → Should show options to draft email

---

### Phase 8: Mobile Optimization
**Test Method**: Press F12 → Click device toolbar → Select iPhone 12 (375px)

- [ ] Page layout responds to 375px width
- [ ] Navigation collapses or adapts
- [ ] Text is readable
- [ ] Buttons are touch-friendly
- [ ] No horizontal scroll
- [ ] All features still accessible

**Test**: Resize to 375px, 768px, 1024px, 1280px → All should work

---

### Phase 9: Multi-Tenancy & RBAC
**Route**: `/app/team/roles`

- [ ] Team roles page loads
- [ ] See role list (Owner, Manager, Sales Rep, Viewer, custom roles)
- [ ] Can view role details
- [ ] Design matches other pages

**Test**: Should load without errors

---

## 🎨 Design System Verification

### Dark Theme with Glassmorphism
Check on every page:
- [ ] Background is dark (gray-900)
- [ ] Cards have blur effect (`backdrop-blur-xl`)
- [ ] Cards are semi-transparent (`bg-white/10`)
- [ ] Text is readable white/light gray
- [ ] Borders are subtle (`border-white/20`)
- [ ] Orange/Green/Red colors for status badges

**Reference**: Cards should look like frosted glass with subtle blur

---

## 🔍 Console Verification

**Open Developer Console** (Press F12):

```
✅ Should see: No errors or warnings
❌ Should NOT see: 
  - Red error messages
  - "default" is not exported
  - "Cannot find module"
  - Network errors (404, 500)
```

**Check**:
1. Click F12 > Console tab
2. Look for any RED text
3. Should be mostly clean (maybe some warnings, but no RED errors)

---

## 🌐 Network Verification

**Open Network Tab** (F12 > Network):

```
✅ Should see:
  - All requests returning 200 OK or 304
  - No 404s or 500s
  - Supabase requests succeeding
```

**Test**:
1. Open F12 > Network tab
2. Refresh page
3. Look for failed requests (red)
4. Should be minimal to none

---

## ⚡ Performance Verification

**Check Load Time**:
1. Open F12 > Network tab
2. Refresh page
3. Look at "DOMContentLoaded" time
4. Should be under 3 seconds

**Check Bundle Size**:
- Business app should be ~3MB uncompressed
- Gzipped should be ~770KB

---

## 🔗 Navigation Verification

**Test Navigation Between Pages**:

- [ ] Click Pipelines → loads
- [ ] Click Automation → loads
- [ ] Click Dashboard → loads
- [ ] Click Analytics → loads
- [ ] Click Manager → loads
- [ ] Click Settings → loads
- [ ] Click Team → loads
- [ ] Back button works
- [ ] No missing pages/broken links

---

## 📊 Data Verification

**Test Data Loading**:

- [ ] Pipelines load with data
- [ ] Automation rules load (or empty if none exist)
- [ ] Dashboard shows metrics (or empty state)
- [ ] Analytics show data (or charts load)
- [ ] Manager portal shows stats

---

## 🐛 Error Handling

**Try These to Test Error Handling**:

1. **Offline Mode**: 
   - Open DevTools > Network tab > Offline mode
   - Try to load page
   - Should show graceful error (not crash)

2. **Network Error**:
   - Disable internet
   - Try to refresh
   - Should show helpful message

3. **Invalid Route**:
   - Go to `/app/nonexistent`
   - Should show 404 page (not crash)

---

## ✅ Sign-Off

### All Tests Passed? ✅
- [ ] All 7 layers load without errors
- [ ] Both phases (mobile + RBAC) work
- [ ] Design is consistent (dark glassmorphic)
- [ ] No console errors
- [ ] Navigation works
- [ ] Data loads
- [ ] Mobile responsive
- [ ] Performance acceptable

### If Issues Found:
Document:
1. Which feature failed
2. What error did you see
3. In which browser/version
4. Steps to reproduce

---

## 🎯 Testing Workflow

### Quick Test (15 minutes)
1. Load http://localhost:5173
2. Test each layer (1-7) - should load
3. Check console for errors
4. Verify mobile responsive (F12 > 375px)

### Full Test (30 minutes)
1. Complete all checklist items above
2. Test navigation between pages
3. Test error handling
4. Verify data loads correctly
5. Check performance

### Detailed Test (1 hour)
1. Complete full test above
2. Test end-to-end workflows
3. Test with different user roles
4. Test on different browsers
5. Test on different devices (mobile, tablet, desktop)

---

## 📝 Test Results

### Date: ___________
### Tester: ___________

### Overall Status: ________________

### Issues Found:
1. 
2. 
3. 

### Performance:
- Page Load Time: _______ seconds
- Bundle Size: _______ KB
- Lighthouse Score: _______ / 100

### Sign-Off: ✅ Ready for Production / ❌ Needs Fixes

---

## 🚀 After Verification

If all tests pass:
1. ✅ Create new Vercel project
2. ✅ Update GitHub secrets with new project ID/token
3. ✅ Deploy to Vercel
4. ✅ Test in production

If issues found:
1. ❌ Document issues above
2. ❌ Fix in source code
3. ❌ Restart dev server
4. ❌ Re-test
5. ❌ Repeat until all pass

---

**Status**: 🟡 Ready for Testing  
**Updated**: May 4, 2026

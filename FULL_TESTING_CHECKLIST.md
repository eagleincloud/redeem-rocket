# Full Testing Checklist - Smart AI Onboarding

**Status**: All backend systems deployed and tested ✅

## Test Environment Setup

### Prerequisites
- [ ] Browser with Developer Tools (F12)
- [ ] Access to Supabase dashboard
- [ ] Your deployed application URL
- [ ] Clean browser state (localStorage cleared)

### Clear Browser Cache Before Starting
```javascript
// Open browser console (F12) and run:
localStorage.clear()
sessionStorage.clear()
```

---

## Test Suite 1: Edge Function Verification (API Level)

### Function 1: /describe - Business Descriptions

**Test**: Generate descriptions for a coffee shop
```bash
curl -X POST https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/biz-onboarding-ai/describe \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "businessType": "coffee_shop",
    "businessName": "Morning Brew"
  }'
```

**Expected Result**:
```json
{
  "descriptions": [
    "Description 1...",
    "Description 2...",
    "Description 3..."
  ]
}
```

**Checklist**:
- [ ] Returns 3 descriptions
- [ ] Descriptions are unique
- [ ] Each 1-2 sentences
- [ ] Professional tone

---

## Test Suite 2: Browser UI Testing

### Prerequisites for Browser Testing
1. Application must be running locally or deployed
2. URL should be: `http://localhost:5173/#/onboarding` (dev) or your deployed URL

### Test 2.1: Onboarding Page Loads

**Steps**:
1. Navigate to `/onboarding` route
2. Open Developer Console (F12)
3. Check Network tab

**Checklist**:
- [ ] Page loads without errors
- [ ] No red errors in console
- [ ] Dark theme applies (#0a0e27 background)
- [ ] 5 questions visible or first question shows
- [ ] Progress bar visible (0% or similar)
- [ ] "Question 1 of 5" text visible

---

### Test 2.2: Question 1 - Product Catalog

**Expected Content**:
- Icon: 📦
- Title: "Do you want to showcase your products or services?"
- Buttons: "Yes, showcase products" | "No, not needed"

**Test Steps**:
1. Verify all text displays correctly
2. Hover over "Yes" button → should dim slightly
3. Hover over "No" button → should dim slightly
4. Click "Yes, showcase products"

**Checklist**:
- [ ] Text displays correctly
- [ ] Buttons are clickable
- [ ] Hover effects work
- [ ] Click advances to Question 2
- [ ] Animation smooth (0.3s fade)

---

### Test 2.3: Question 2 - Lead Management

**Expected Content**:
- Icon: 👥
- Title: "Do you want to capture and manage sales leads?"

**Test Steps**:
1. Verify question displays
2. Click "Yes, manage leads"
3. Verify progress shows "Question 2 of 5" (40%)

**Checklist**:
- [ ] Question 2 displays
- [ ] Progress updates to 40%
- [ ] Back button now visible
- [ ] Back button is clickable

---

### Test 2.4: Back Navigation

**Test Steps**:
1. Click Back button
2. Verify return to Question 2
3. Verify previous answer (Yes) is still selected
4. Click Back again
5. Verify return to Question 1

**Checklist**:
- [ ] Back button works
- [ ] Previous answers preserved
- [ ] Back button hidden on Question 1
- [ ] Can navigate freely

---

### Test 2.5: Complete All Questions

**Test Steps**:
1. From Question 1, click Yes/No to answer each:
   - Q1: Product Catalog → Click "Yes" ✓
   - Q2: Lead Management → Click "No" ✗
   - Q3: Email Campaigns → Click "Yes" ✓
   - Q4: Automation → Click "No" ✗
   - Q5: Social Media → Click "Yes" ✓

**Expected Pattern After Q5**:
```json
{
  "product_catalog": true,
  "lead_management": false,
  "email_campaigns": true,
  "automation": false,
  "social_media": true
}
```

**Checklist**:
- [ ] All 5 questions appear
- [ ] Progress reaches 100%
- [ ] Smooth animations between questions
- [ ] After Q5, completion screen appears
- [ ] Completion screen shows "You're all set! ✨"

---

### Test 2.6: Completion Screen

**Expected Screen**:
- Title: "You're all set!"
- Subtitle: "Your dashboard is ready with the features you selected"
- Button: "Continue to Dashboard" with chevron
- Rocket emoji (🚀)

**Test Steps**:
1. Verify all text displays
2. Click "Continue to Dashboard"
3. Observe loading spinner animation

**Checklist**:
- [ ] Completion screen displays correctly
- [ ] Button shows loading state (spinner + "Finishing...")
- [ ] Page redirects to `/app` (dashboard)
- [ ] No console errors during redirect

---

## Test Suite 3: Data Persistence

### Test 3.1: localStorage Persistence

**Test Steps**:
1. After completing onboarding, open Browser Console (F12)
2. Run: `JSON.parse(localStorage.getItem('biz_user')).feature_preferences`

**Expected Result**:
```json
{
  "product_catalog": true,
  "lead_management": false,
  "email_campaigns": true,
  "automation": false,
  "social_media": true
}
```

**Checklist**:
- [ ] localStorage contains `biz_user` key
- [ ] `feature_preferences` object exists
- [ ] All 5 features present
- [ ] Values match what was selected
- [ ] `onboarding_done` = true

---

### Test 3.2: Database Persistence (Supabase)

**Test Steps**:
1. Go to Supabase Dashboard: https://app.supabase.com/
2. Click "SQL Editor"
3. Run this query:
```sql
SELECT id, email, feature_preferences, onboarding_done 
FROM biz_users 
WHERE onboarding_done = true 
ORDER BY created_at DESC 
LIMIT 1;
```

**Expected Result**:
```
id | email | feature_preferences | onboarding_done
---|-------|---------------------|----------------
uuid | user@example.com | {"product_catalog": true, ...} | true
```

**Checklist**:
- [ ] Query returns results
- [ ] `feature_preferences` is JSON object
- [ ] All 5 features present
- [ ] Values match selections
- [ ] `onboarding_done` = true

---

## Test Suite 4: Navigation Conditional Display

### Test 4.1: Dashboard Navigation

**Test Steps**:
1. After onboarding completes, land on `/app` dashboard
2. Look at navigation menu/sidebar
3. Identify which items are visible

**Expected Navigation** (with our test selections):
- ✅ Dashboard (always visible)
- ✅ Orders (visible - product_catalog: true)
- ✅ Documents (visible - product_catalog: true)
- ❌ Leads (NOT visible - lead_management: false)
- ✅ Campaigns (visible - email_campaigns: true)
- ❌ Automation (NOT visible - automation: false)
- ✅ Social (visible - social_media: true)
- ✅ Connectors (visible - social_media: true)

**Test Steps**:
1. Scroll through navigation menu
2. Count visible feature items
3. Verify matches expected pattern above

**Checklist**:
- [ ] Orders link visible
- [ ] Documents link visible
- [ ] Leads link NOT visible
- [ ] Campaigns link visible
- [ ] Automation link NOT visible
- [ ] Social link visible
- [ ] Connectors link visible

---

### Test 4.2: Refresh Persistence

**Test Steps**:
1. From dashboard, press F5 (refresh)
2. Wait for page to reload
3. Check navigation again

**Checklist**:
- [ ] Navigation items same after refresh
- [ ] Feature preferences still applied
- [ ] No console errors
- [ ] Dashboard loads correctly

---

## Test Suite 5: Feature Re-customization

### Test 5.1: Access Feature Settings

**Test Steps**:
1. From dashboard, navigate to `/app/features-settings`
   (Or look for "Feature Preferences" or "Settings" link)
2. Page should load with 5 feature cards

**Checklist**:
- [ ] Page loads successfully
- [ ] All 5 feature cards display
- [ ] Each card has icon, name, description
- [ ] Checkboxes show current state

---

### Test 5.2: Toggle Features

**Test Steps**:
1. Find "Lead Management" card (👥 icon)
2. Click checkbox to enable it (currently disabled)
3. Observe card styling change
4. Find "Automation" card (🤖 icon)
5. Click checkbox to enable it (currently disabled)

**Checklist**:
- [ ] Checkboxes toggle visibly
- [ ] Card opacity/styling changes
- [ ] "Save Preferences" button available
- [ ] No immediate navigation changes

---

### Test 5.3: Save Preferences

**Test Steps**:
1. After toggling features, click "Save Preferences"
2. Observe button changes to loading state
3. Wait for "✓ Saved successfully" message

**Expected Flow**:
- Button shows: "Saving..." with spinner
- After ~1s: "✓ Saved successfully"
- Message disappears after 3 seconds

**Checklist**:
- [ ] Save button shows loading state
- [ ] Success message appears
- [ ] No console errors
- [ ] Message auto-dismisses

---

### Test 5.4: Navigation Updates

**Test Steps**:
1. After saving, DON'T refresh
2. Look at navigation menu (may need to navigate away/back)
3. "Leads" link should now be visible
4. "Automation" link should now be visible

**Checklist**:
- [ ] Leads link now visible
- [ ] Automation link now visible
- [ ] Other links unchanged
- [ ] Navigation updates without page reload (if cached)

---

### Test 5.5: Persistence After Refresh

**Test Steps**:
1. Press F5 to refresh page
2. Navigate back to `/app/features-settings`
3. Check checkboxes for Lead Management and Automation
4. They should be checked

**Checklist**:
- [ ] Feature preferences persist after refresh
- [ ] Dashboard navigation reflects changes
- [ ] No data loss

---

## Test Suite 6: Edge Cases & Error Handling

### Test 6.1: Mobile Responsiveness

**Test Steps** (in Browser DevTools):
1. Press F12 to open DevTools
2. Click device toolbar icon (mobile view)
3. Select iPhone 12 or Pixel 5
4. Navigate through onboarding

**Checklist** (Mobile):
- [ ] Layout responsive (single column)
- [ ] Text readable
- [ ] Buttons easy to tap (48px+ touch target)
- [ ] No horizontal scroll
- [ ] Icons visible

---

### Test 6.2: Different Feature Combinations

**Test 1: All Enabled**
1. Complete onboarding selecting "Yes" for all 5
2. Check navigation - should show all optional items
3. Verify in Supabase

**Test 2: All Disabled**
1. Complete onboarding selecting "No" for all 5
2. Check navigation - should only show Dashboard
3. Verify in Supabase

**Test 3: Only Product Catalog**
1. Complete: Yes, No, No, No, No
2. Navigation should show: Dashboard, Orders, Documents only
3. Verify in Supabase

**Checklist**:
- [ ] All combinations save correctly
- [ ] Navigation updates for each combo
- [ ] Supabase data matches selections
- [ ] No console errors

---

### Test 6.3: Console Error Check

**Test Steps** (in Browser Console):
1. Open DevTools (F12)
2. Go to Console tab
3. Filter for "Error" or "Warning"
4. Run through full onboarding flow
5. Check console periodically

**Checklist**:
- [ ] No red error messages
- [ ] No undefined errors
- [ ] Network requests successful (200 status)
- [ ] Only expected logs appear

---

## Test Suite 7: AI Features Integration

### Test 7.1: AI Description Generation

**Note**: This test requires frontend integration to test end-to-end. The API works (tested above).

**What It Does** (when frontend calls it):
- User enters business name and type
- Component calls `/describe` edge function
- Claude generates 3 business descriptions
- Displays as dropdown options

**Current Status**: ✅ Edge function working, frontend integration optional

---

## Final Verification Checklist

After completing all tests above:

- [ ] **Database Migration**: Applied successfully
- [ ] **Edge Functions**: All 4 functions deployed and working
- [ ] **ANTHROPIC_API_KEY**: Set in Supabase secrets
- [ ] **Onboarding Flow**: Complete 5-question flow works
- [ ] **Data Saving**: Preferences save to localStorage
- [ ] **Data Persistence**: Preferences save to Supabase
- [ ] **Navigation**: Shows/hides items based on prefs
- [ ] **Feature Settings**: Allows re-customization
- [ ] **Mobile Responsive**: Works on phone/tablet
- [ ] **No Console Errors**: Clean console during testing
- [ ] **Smooth Animations**: 0.3s transitions work
- [ ] **Persistence**: Data survives page refresh

---

## Test Results Summary

| Test Suite | Status | Notes |
|-----------|--------|-------|
| Edge Functions | ✅ | All 4 functions deployed and working |
| Onboarding UI | ⏳ | Ready for manual testing |
| localStorage | ⏳ | Ready for manual testing |
| Supabase DB | ⏳ | Ready for manual testing |
| Navigation | ⏳ | Ready for manual testing |
| Re-customization | ⏳ | Ready for manual testing |
| Mobile | ⏳ | Ready for manual testing |
| Error Handling | ⏳ | Ready for manual testing |

---

## How to Report Issues

If you encounter any issues during testing:

1. **Note the exact step** where issue occurred
2. **Screenshot or record** the behavior
3. **Check browser console** (F12) for error messages
4. **Check Supabase logs** for backend errors
5. **Run query** to verify database state

---

## Next Steps After Testing

✅ All tests pass:
- **Live Deployment**: Ready to deploy to production
- **User Rollout**: Begin onboarding new users
- **Monitor Analytics**: Track feature adoption

⚠️ Issues found:
- Note issues with screenshots
- Check console errors
- Verify database schema applied correctly
- Check if API key is set properly

---

**Testing Start Time**: [Record when you start]
**Testing End Time**: [Record when you finish]
**Total Duration**: [Calculate]
**Issues Found**: [List any issues]
**Status**: [Pass/Fail]

---

Good luck with testing! 🚀

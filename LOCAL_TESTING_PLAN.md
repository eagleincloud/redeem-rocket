# 🧪 Comprehensive Local Testing Plan
**Date**: May 3, 2026  
**Status**: Ready for Testing  
**Test Environment**: localhost:5173 (Business) / localhost:5174 (Admin)

---

## 📋 Testing Checklist

### Layer 1: Pipeline Engine ✅
**Route**: `/app/pipelines`

**Tests to Perform**:
- [ ] Navigate to Pipelines page
- [ ] View default pipelines (Lead, Marketing, Retention, Support)
- [ ] Create new pipeline with custom name
- [ ] Add custom stages to pipeline
- [ ] Reorder stages via drag-drop
- [ ] Edit stage properties (color, name)
- [ ] Delete custom pipeline
- [ ] View lead count per stage
- [ ] Move lead between stages (drag onto stage card)
- [ ] See updated metrics after stage change
- [ ] Verify RLS: Can only see own business pipelines

**Expected Behavior**:
- Glassmorphic card design with dark theme
- Real-time stage updates
- Smooth drag-drop interactions
- Statistics update immediately

---

### Layer 2: Automation Engine ✅
**Route**: `/app/automation/rules`

**Tests to Perform**:
- [ ] Navigate to Automation Rules page
- [ ] View list of automation rules
- [ ] Create new rule with trigger (lead_added, email_opened, stage_changed)
- [ ] Add conditions (IF lead stage = negotiation AND value > 5000)
- [ ] Select action (send_email, add_tag, create_task, update_field)
- [ ] Configure action parameters
- [ ] Enable/disable rule via toggle
- [ ] Edit existing rule
- [ ] Delete rule
- [ ] View execution logs (Rule Execution Logs page)
- [ ] See rule run count and success/failure stats
- [ ] Test rule with sample lead (trigger manual execution)

**Expected Behavior**:
- Rule builder with intuitive UI
- Conditions support AND/OR logic
- Real-time rule validation
- Execution logs show full history

---

### Layer 3: Smart Onboarding ✅
**Route**: `/business-app/onboarding` (for new signups)

**Tests to Perform**:
- [ ] Create new business account (signup flow)
- [ ] See 5 feature preference questions:
  - [ ] Products/Services management
  - [ ] Lead Management
  - [ ] Email Automation
  - [ ] Workflow Automation
  - [ ] Social Media Integration
- [ ] Answer questions and see feature showcase
- [ ] Select theme/colors
- [ ] Choose pipeline templates
- [ ] See dynamic journey questions based on selections
- [ ] Review AI-generated profile setup
- [ ] Customize dashboard layout
- [ ] Complete onboarding
- [ ] Verify feature preferences saved to database
- [ ] Verify navigation shows only selected features
- [ ] Access "Customize Features" from profile to re-run onboarding

**Expected Behavior**:
- Multi-phase smooth flow
- Real-time feature toggles in navigation
- Persistent preferences across sessions
- Intuitive feature discovery

---

### Layer 4: Configurable System ✅
**Route**: `/app/settings`

**Tests to Perform**:
- [ ] Navigate to Settings page
- [ ] See "Features" tab with all available features
- [ ] Toggle features on/off
- [ ] Changes save to database
- [ ] Navigation updates in real-time
- [ ] Team members see inherited feature set
- [ ] Can rename pipeline stages
- [ ] Can add custom fields
- [ ] Can manage custom field types (text, number, dropdown, etc.)
- [ ] Can reorder custom fields
- [ ] Can delete custom fields

**Expected Behavior**:
- Settings persist across sessions
- Real-time UI updates on toggle
- Validation prevents invalid configurations
- Custom fields appear in all relevant forms

---

### Layer 5: Actionable Dashboard ✅
**Route**: `/app/dashboard-insights` (new)

**Tests to Perform**:
- [ ] Navigate to Dashboard Insights page
- [ ] See bottleneck detection (stages with stuck leads)
- [ ] View smart alerts (e.g., "5 leads stalled 10+ days")
- [ ] See performance metrics vs goals
- [ ] View KPI cards: conversion rate, pipeline velocity, deal size
- [ ] See trend charts (last 30 days)
- [ ] View AI recommendations panel
- [ ] Each recommendation has action link (create automation, send email, etc.)
- [ ] Click recommendation to execute action
- [ ] See "celebrations" when deals close
- [ ] Filter insights by pipeline, date range

**Route**: `/app/analytics/bottlenecks`
- [ ] View waterfall chart of lead progression
- [ ] See where leads get stuck
- [ ] View time-in-stage analysis

**Route**: `/app/analytics/performance`
- [ ] View conversion funnel
- [ ] Compare actual vs target metrics
- [ ] See trend analysis

**Expected Behavior**:
- Metrics calculated from real pipeline data
- Charts update as data changes
- Recommendations are actionable
- Color coding (red=alert, yellow=warning, green=good)

---

### Layer 6: Advanced Analytics ✅
**Route**: `/app/analytics/advanced`

**Tests to Perform**:
- [ ] Navigate to Advanced Analytics
- [ ] View revenue by pipeline chart
- [ ] See deal closure forecast
- [ ] View pipeline health score
- [ ] See KPI breakdown by pipeline
- [ ] Export analytics as CSV

**Route**: `/app/analytics/trends`
- [ ] View historical trends (30/60/90 days)
- [ ] See cycle time trend
- [ ] View conversion rate trend
- [ ] Compare year-over-year metrics

**Route**: `/app/analytics/forecast`
- [ ] View revenue forecast (next 30/60/90 days)
- [ ] See deal probability scoring
- [ ] View risk alerts (at-risk deals)

**Expected Behavior**:
- Charts render correctly with real data
- Data refreshes without page reload
- Filters work (date range, pipeline, stage)
- Forecasts are reasonable and based on historical data

---

### Layer 7: AI + Manager Layer ✅
**Route**: `/app/manager`

**Tests to Perform**:
- [ ] Navigate to Manager Portal
- [ ] See manager stats (total leads, conversion rate, avg response time)
- [ ] View assigned leads (leads where manager_id = current user)
- [ ] See pending tasks
- [ ] View AI-generated recommendations
- [ ] Click "Draft Email" on a lead
  - [ ] Email draft modal opens
  - [ ] AI generates subject + body
  - [ ] Can edit email
  - [ ] Can copy to clipboard
  - [ ] Can send email directly
  - [ ] Can regenerate different versions
- [ ] See team performance metrics
- [ ] View manager activity log

**Expected Behavior**:
- Claude API generates contextual emails
- Email drafts are personalized to lead
- Manager can edit before sending
- All interactions logged to database

---

### Phase 8: Mobile Optimization ✅
**Test on**: Safari with responsive design mode (375px mobile)

**Tests to Perform**:
- [ ] Business app loads on mobile
- [ ] Navigation collapses to hamburger menu
- [ ] Pipeline board shows mobile-optimized layout
- [ ] Cards stack vertically
- [ ] Forms are full-width and mobile-friendly
- [ ] Buttons are touch-sized (44px minimum)
- [ ] No horizontal scroll (content fits viewport)
- [ ] Text is readable (minimum 16px font)
- [ ] Modal dialogs work on mobile

**Responsive Breakpoints**:
- [ ] 375px (iPhone)
- [ ] 768px (Tablet)
- [ ] 1280px (Desktop)

**Expected Behavior**:
- App is fully responsive
- Touch-friendly controls
- No text overflow or cutoff
- Performance is good on mobile

---

### Phase 9: Multi-Tenancy & RBAC ✅
**Routes**: `/app/team/roles`, `/app/team/permissions`, `/app/team/departments`

**Tests to Perform**:
- [ ] Navigate to Team Roles page
- [ ] See predefined roles (Owner, Manager, Sales Rep, Viewer)
- [ ] Create custom role with permissions
- [ ] Edit role permissions
- [ ] Delete custom role
- [ ] Navigate to Team Permissions page
- [ ] Assign roles to team members
- [ ] See role-based feature access
- [ ] Test member login: verify they only see assigned features
- [ ] Navigate to Departments page
- [ ] Create department
- [ ] Add team members to department
- [ ] Create department-specific pipeline
- [ ] Verify department isolation (members only see their department data)
- [ ] View audit logs (who did what and when)

**RBAC Verification**:
- [ ] Owner: Full access to all features
- [ ] Manager: Can manage leads, pipelines, team
- [ ] Sales Rep: Can only see assigned leads
- [ ] Viewer: Read-only access
- [ ] Team members in department X cannot see data from department Y

**Expected Behavior**:
- RLS policies enforced at database level
- Users can only see their own data
- Features hidden based on role/permissions
- Audit trail tracks all user actions

---

## 🔍 Database Integration Tests

### Supabase Verification

**Tests to Perform**:
- [ ] All migration tables exist:
  - [ ] `business_pipelines`
  - [ ] `automation_rules`
  - [ ] `dashboard_daily_metrics`
  - [ ] `smart_recommendations`
  - [ ] `ai_recommendations`
  - [ ] `departments`
  - [ ] `department_members`
  - [ ] `custom_roles`
  - [ ] `member_feature_permissions`
  - [ ] `email_drafts`
- [ ] RLS policies enforce business_id isolation
- [ ] Can perform CRUD on all tables
- [ ] Indexes are created and performing well
- [ ] Relationships (foreign keys) are set up correctly

**Query Performance**:
- [ ] Pagination works (50 items/page)
- [ ] Filters execute in <100ms
- [ ] Real-time subscriptions work (lead updates)
- [ ] Bulk operations are efficient

---

## 🎯 Integration Tests

### End-to-End Workflows

**Test 1: Lead to Automation**
1. Create new lead manually
2. Lead should trigger automation rule
3. Verify email sent (check email_tracking)
4. Check automation execution logged
5. Verify manager assigned

**Test 2: Smart Onboarding → Dashboard**
1. New signup completes onboarding
2. Select features (Leads + Automation only)
3. Dashboard only shows selected features
4. Navigation reflects selections
5. Create lead should trigger selected automations

**Test 3: Manager Workflow**
1. Create lead
2. Assign manager
3. Manager views portal
4. Manager drafts email using AI
5. Email sent to lead
6. Check activity log

**Test 4: Custom Field Usage**
1. Add custom field to lead (e.g., "Industry")
2. Custom field appears in all lead forms
3. Custom field data persists
4. Can search/filter by custom field

**Test 5: Department Isolation**
1. Create 2 departments
2. Add team members to each
3. Create pipelines per department
4. Verify members only see their department data
5. Verify audit logs work

---

## 🚨 Error Handling Tests

**Tests to Perform**:
- [ ] Offline mode: App continues to work (cached data)
- [ ] Network error: Shows error toast with retry
- [ ] Supabase connection fails: Shows helpful error
- [ ] File upload fails: Shows file size/type error
- [ ] Email sending fails: Shows error and allows retry
- [ ] API rate limit: Shows rate limit message
- [ ] Invalid form submission: Shows validation errors
- [ ] Unauthorized access: Shows "Access Denied"
- [ ] Concurrent updates: Last write wins (optimistic UI)
- [ ] Session timeout: Redirects to login

**Expected Behavior**:
- Clear error messages
- User-friendly tooltips
- No silent failures
- Graceful degradation

---

## 📊 Performance Tests

**Metrics to Verify**:
- [ ] Page load time < 2s (on 3G)
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 85
- [ ] Bundle size < 500KB (business app)
- [ ] No console errors or warnings
- [ ] Memory usage stable (no leaks)
- [ ] No layout shifts (CLS < 0.1)

**Tools**:
- Chrome DevTools Performance tab
- Lighthouse
- Network tab (throttle to 3G)

---

## 🔐 Security Tests

**Tests to Perform**:
- [ ] Cannot modify other business data (RLS enforced)
- [ ] Cannot access admin pages without admin role
- [ ] API keys not exposed in frontend code
- [ ] Passwords hashed in database
- [ ] Session tokens not stored in localStorage (use secure cookie)
- [ ] CORS configured correctly
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React escaping)

---

## ✅ Sign-Off Checklist

Before deploying to production, verify:

- [ ] All 7 layers tested and working
- [ ] Both phases (mobile + RBAC) tested and working
- [ ] Database migrations applied successfully
- [ ] RLS policies enforced
- [ ] No console errors
- [ ] Mobile responsive (375px - 1280px)
- [ ] All tests passed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation updated
- [ ] Team can use all features

---

## 📝 Testing Notes

**How to Test Locally**:
1. Start dev server: `npm run dev`
2. Open http://localhost:5173 in browser
3. Create test account (or use existing)
4. Follow checklist above
5. Document any issues found
6. Fix issues before deployment

**Test Account Credentials** (if available):
- Email: test@example.com
- Password: TestPassword123!

**Debug Mode**:
- Open browser console (F12)
- Check for errors
- Use React DevTools to inspect components
- Use Supabase dashboard to verify database state

---

## 🐛 Known Issues

(To be filled during testing)

---

## 📅 Testing Timeline

- **Day 1**: Layers 1-3 (Pipeline, Automation, Onboarding)
- **Day 2**: Layers 4-5 (Settings, Dashboard)
- **Day 3**: Layers 6-7 (Analytics, Manager)
- **Day 4**: Phases 8-9 (Mobile, RBAC)
- **Day 5**: Integration tests, security, performance
- **Day 6**: Bug fixes and refinements
- **Day 7**: Final sign-off and deployment

---

**Status**: 🔴 **NOT READY FOR PRODUCTION** (Testing in progress)

**Next Action**: Start testing and document findings

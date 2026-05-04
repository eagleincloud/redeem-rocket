# 🔗 Local Testing URLs Reference

**Environment**: `http://localhost:5173` (Business App) | `http://localhost:5174` (Admin App)

---

## 🏠 Core Navigation

| Feature | URL | Status |
|---------|-----|--------|
| **Dashboard Home** | http://localhost:5173/app/dashboard | ✅ Existing |
| **Pipelines** | http://localhost:5173/app/pipelines | ✅ Layer 1 |
| **Leads** | http://localhost:5173/app/leads | ✅ Existing |
| **Settings** | http://localhost:5173/app/settings | ✅ Layer 4 |
| **Team** | http://localhost:5173/app/team | ✅ Phase 9 |

---

## 🎯 Layer 1: Pipeline Engine

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Pipeline Board | `/app/pipelines` | View/manage pipelines, stages, lead movement |
| Create Pipeline | `/app/pipelines?action=create` | Create new pipeline with custom name |
| Edit Pipeline | `/app/pipelines/:id/edit` | Rename, add/remove stages, customize |

**Test Actions**:
```
1. Navigate to /app/pipelines
2. Verify 4 default pipelines visible (Lead, Marketing, Retention, Support)
3. Create new pipeline
4. Add custom stages
5. Move lead between stages
6. Verify metrics update
```

---

## 🤖 Layer 2: Automation Engine

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Automation Rules List | `/app/automation/rules` | View all rules, enable/disable |
| Create Rule | `/app/automation/rules?action=create` | Build new automation rule |
| Edit Rule | `/app/automation/rules/:id/edit` | Modify conditions and actions |
| Execution Logs | `/app/automation/logs` | View rule execution history |
| Rule Debugger | `/app/automation/rules/:id/debug` | Test rule on sample lead |
| Rule Templates | `/app/automation/templates` | Browse pre-built rule templates |

**Test Actions**:
```
1. Navigate to /app/automation/rules
2. Create rule: "IF lead stage = negotiation → send email"
3. Edit rule conditions and actions
4. Enable/disable rule
5. Go to /app/automation/logs
6. Check rule executed (run_count increased)
7. View execution details and any errors
```

---

## 📥 Layer 3: Smart Onboarding

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Onboarding (New Signup) | `/business-app/onboarding` | Complete 5-phase onboarding flow |
| Feature Preferences | `/business-app/onboarding?phase=1` | Answer feature questions |
| Feature Showcase | `/business-app/onboarding?phase=2` | Explore available features |
| Theme Selection | `/business-app/onboarding?phase=3` | Choose dashboard layout, colors |
| Dynamic Journey | `/business-app/onboarding?phase=4` | Answer conditional questions |
| Smart Setup | `/business-app/onboarding?phase=5` | AI builds initial configuration |
| Preview & Launch | `/business-app/onboarding?phase=6` | Review and launch platform |

**Test Actions**:
```
1. Create new business account (signup)
2. Answer all 5 feature preference questions
3. Select features (Products + Leads)
4. Choose theme and color scheme
5. Answer dynamic questions
6. Review AI setup
7. Customize and launch
8. Verify navigation only shows selected features
```

---

## ⚙️ Layer 4: Configurable System (Settings)

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Settings Home | `/app/settings` | Main settings page |
| Features Tab | `/app/settings?tab=features` | Toggle features on/off |
| Pipelines | `/app/settings?tab=pipelines` | Rename stages, customize pipelines |
| Custom Fields | `/app/settings?tab=custom-fields` | Add/manage custom fields |
| Automation Rules | `/app/settings?tab=automation` | View and manage all rules |
| Users & Roles | `/app/settings?tab=users` | Manage team members |

**Test Actions**:
```
1. Go to /app/settings
2. Click Features tab
3. Toggle features on/off
4. Verify navigation updates in real-time
5. Add custom field (e.g., "Industry")
6. Verify custom field appears in lead form
7. Create lead with custom field value
8. Verify data persists
```

---

## 📊 Layer 5: Actionable Dashboard

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Dashboard Insights | `/app/dashboard-insights` | View bottlenecks, recommendations, celebrations |
| Bottleneck Detection | `/app/analytics/bottlenecks` | See where leads get stuck |
| Performance Analysis | `/app/analytics/performance` | Compare metrics to goals |
| Smart Recommendations | `/app/dashboard-insights?section=recommendations` | AI-powered next steps |

**Test Actions**:
```
1. Go to /app/dashboard-insights
2. Verify bottleneck alerts displayed
3. Check performance metrics vs targets
4. Read AI recommendations
5. Click recommendation to execute action
6. Go to /app/analytics/bottlenecks
7. View waterfall chart and analysis
8. Go to /app/analytics/performance
9. See conversion funnel and KPIs
```

---

## 📈 Layer 6: Advanced Analytics

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Advanced Analytics | `/app/analytics/advanced` | Revenue, conversion, pipeline health |
| Trends Analysis | `/app/analytics/trends` | Historical trends (30/60/90 days) |
| Forecast | `/app/analytics/forecast` | Revenue and deal forecasts |
| Reports | `/app/analytics/reports` | Downloadable reports |

**Test Actions**:
```
1. Go to /app/analytics/advanced
2. View revenue by pipeline chart
3. Check deal closure forecast
4. Go to /app/analytics/trends
5. Select time period (30/60/90 days)
6. View trend charts
7. Go to /app/analytics/forecast
8. See revenue forecast and risk alerts
```

---

## 🧠 Layer 7: AI + Manager Layer

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Manager Portal | `/app/manager` | Manager dashboard, stats, leads, recommendations |
| Manager Stats | `/app/manager?section=stats` | Conversion rate, avg response time, etc. |
| Assigned Leads | `/app/manager?section=leads` | Leads assigned to manager |
| Pending Tasks | `/app/manager?section=tasks` | Tasks assigned to manager |
| AI Recommendations | `/app/manager?section=recommendations` | AI-suggested actions |
| Team Performance | `/app/manager?section=team` | Team member stats |
| Activity Log | `/app/manager?section=activity` | Manager activity history |

**Email Draft Assistant** (Modal on Lead Detail):
```
1. Go to /app/leads
2. Click on a lead → /app/leads/:leadId
3. Click "Draft Email" button
4. Modal opens with AI-generated subject + body
5. Edit email content
6. Click "Copy" or "Send"
7. Verify email in email tracking
```

**Test Actions**:
```
1. Go to /app/manager
2. View manager stats
3. See assigned leads
4. Read AI recommendations
5. Click recommendation to take action
6. View team performance
7. Go to /app/leads/:leadId
8. Click "Draft Email"
9. Review Claude-generated email
10. Send email
11. Check activity log
```

---

## 📱 Phase 8: Mobile Optimization

**Testing Setup**:
```
1. Open Chrome DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select iPhone 12 (375px × 812px)
4. Refresh page
5. Test all features below
```

| Feature | URL | Test |
|---------|-----|------|
| Responsive Dashboard | `/app/dashboard` | Cards stack vertically, hamburger menu |
| Responsive Pipelines | `/app/pipelines` | Horizontal scroll for stages, touch-friendly |
| Responsive Forms | `/app/leads?action=create` | Full-width inputs, large buttons |
| Responsive Navigation | All URLs | Hamburger menu collapse |
| Touch Interactions | All pages | Buttons are 44px+ for touch |

**Breakpoints to Test**:
- 375px (iPhone)
- 768px (iPad)
- 1024px (iPad Pro)
- 1280px (Desktop)

---

## 🔐 Phase 9: Multi-Tenancy & RBAC

| Feature | URL | Test Purpose |
|---------|-----|--------------|
| Team Roles | `/app/team/roles` | Create/manage roles, assign permissions |
| Team Permissions | `/app/team/permissions` | View member permissions, edit access |
| Departments | `/app/team/departments` | Create departments, assign members |
| Department Pipelines | `/app/team/departments/:id/pipelines` | Department-specific pipelines |
| Audit Logs | `/app/team/audit-logs` | Who did what and when |

**Test Actions**:
```
1. Go to /app/team/roles
2. View predefined roles (Owner, Manager, Sales Rep, Viewer)
3. Create custom role
4. Assign permissions
5. Go to /app/team/permissions
6. Assign role to team member
7. Have team member login
8. Verify they only see allowed features
9. Go to /app/team/departments
10. Create department
11. Add members to department
12. Create department pipeline
13. Verify isolation (members only see their dept data)
14. Go to /app/team/audit-logs
15. Verify actions are logged
```

---

## 🗄️ Database Testing

**Supabase Console**: https://supabase.com/dashboard

**Tables to Verify**:
```
- business_pipelines
- automation_rules
- automation_executions
- dashboard_daily_metrics
- smart_recommendations
- ai_recommendations
- departments
- department_members
- custom_roles
- member_feature_permissions
- email_drafts
- leads (check manager_id field)
```

**Quick SQL Queries**:
```sql
-- Verify migrations applied
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check business data
SELECT COUNT(*) FROM business_pipelines;
SELECT COUNT(*) FROM automation_rules;
SELECT COUNT(*) FROM dashboard_daily_metrics;

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'business_pipelines';
```

---

## 📝 Testing Workflow

### Quick Test (30 minutes)
```
1. /app/pipelines - Create pipeline ✓
2. /app/automation/rules - Create rule ✓
3. /app/dashboard-insights - View insights ✓
4. /app/manager - View portal ✓
5. /app/team/roles - View roles ✓
```

### Full Test (2 hours)
```
1. Complete onboarding (5 phases)
2. Test all 7 layers
3. Test mobile responsiveness
4. Test RBAC/permissions
5. Verify database state
6. Check performance
```

### Production Readiness (4 hours)
```
1. Full test above
2. End-to-end workflows
3. Error handling
4. Security verification
5. Performance optimization
6. Documentation review
7. Sign-off
```

---

## 🎯 Quick Test Checklist

```
Layer 1: Pipeline ............ /app/pipelines
Layer 2: Automation .......... /app/automation/rules
Layer 3: Onboarding .......... /business-app/onboarding
Layer 4: Settings ............ /app/settings
Layer 5: Dashboard ........... /app/dashboard-insights
Layer 6: Analytics ........... /app/analytics/advanced
Layer 7: Manager ............. /app/manager
Phase 8: Mobile .............. DevTools (375px)
Phase 9: RBAC ................ /app/team/roles
```

---

## 🚀 Ready to Deploy?

After testing, verify:
- [ ] All routes respond correctly
- [ ] Features work as designed
- [ ] Database state is correct
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Performance acceptable
- [ ] RLS enforced
- [ ] All integrations working

**Then run**: `npm run build && git push origin main`

---

**Last Updated**: May 3, 2026  
**Status**: 🟢 Ready for Testing

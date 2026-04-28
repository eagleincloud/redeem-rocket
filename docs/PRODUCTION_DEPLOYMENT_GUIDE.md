# 🚀 BUSINESS OS v1.0 - PRODUCTION DEPLOYMENT & SMOKE TESTING

## 📋 Deployment Checklist

### Phase 1: Database Migrations
- [ ] Verify all migrations exist
- [ ] Run migrations in order
- [ ] Verify 35+ tables created
- [ ] Verify 40+ RLS policies enabled
- [ ] Test data isolation

### Phase 2: Edge Function Deployment
- [ ] Deploy all 36 functions
- [ ] Test each function endpoint
- [ ] Verify Claude integration
- [ ] Check error handling

### Phase 3: Environment Configuration
- [ ] Set Supabase credentials
- [ ] Set Anthropic API key
- [ ] Set email provider key
- [ ] Set monitoring credentials

### Phase 4: Frontend Build & Deploy
- [ ] Build for production
- [ ] Deploy to Vercel
- [ ] Verify DNS/domain
- [ ] Check SSL certificate

### Phase 5: Smoke Testing
- [ ] Test Phase 1: Onboarding
- [ ] Test Phase 2: Pipelines
- [ ] Test Phase 3: Automation
- [ ] Test Phase 4: Configuration
- [ ] Test Phase 5: Dashboard
- [ ] Test Phase 6: Marketplace
- [ ] Test Phase 7: Manager Layer

---

## 🗄️ Database Migration Commands

### Check Migration Status
```bash
# List all migrations
ls -lah supabase/migrations/ | tail -20

# Check which migrations have run
supabase migration list
```

### Deploy Migrations
```bash
# Deploy all pending migrations
supabase db push

# Or specify a single migration
supabase migration up --name 20260428_manager_layer_checkpoint1
```

### Verify Migration Success
```bash
# Count tables (should be 35+)
supabase query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# Check RLS enabled (should be 20+)
supabase query "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;"
```

---

## ⚙️ Function Deployment Commands

### Deploy All Functions
```bash
# Deploy all edge functions
supabase functions deploy

# Monitor deployment
supabase functions list
```

### Test Critical Functions
```bash
# Test pipeline-api
curl -X GET https://[project].supabase.co/functions/v1/pipeline-api \
  -H "Authorization: Bearer [anon-key]"

# Test ai-manager-layer
curl -X POST https://[project].supabase.co/functions/v1/ai-manager-layer \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"dealId":"test","businessId":"test","managerId":"test","context":{}}'

# Test metrics-engine
curl -X POST https://[project].supabase.co/functions/v1/metrics-engine \
  -H "Authorization: Bearer [anon-key]" \
  -H "Content-Type: application/json" \
  -d '{"businessId":"test","period":"month"}'
```

---

## 🔧 Environment Configuration

### Required Environment Variables
```bash
# Copy to Vercel/Supabase
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]
ANTHROPIC_API_KEY=[claude-api-key]
RESEND_API_KEY=[email-api-key]
```

### Set in Vercel
```bash
# Using CLI
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY

# Or in Dashboard: Settings → Environment Variables
```

---

## 🏗️ Frontend Build & Deploy

### Build for Production
```bash
# Install dependencies
npm install

# Build
npm run build

# Check build artifacts
ls -la dist-business/index.html
ls -la dist-admin/index.html
```

### Deploy to Vercel
```bash
# Option A: CLI
vercel deploy --prod

# Option B: GitHub push (if configured)
git push origin main

# Option C: Dashboard
# Just link your GitHub repo
```

---

## 🧪 SMOKE TEST: Phase 1 - Smart Onboarding

**Expected**: User can complete onboarding and get personalized dashboard

```bash
# Test 1: Load signup page
curl -I https://[domain]/signup
# Expected: 200 OK

# Test 2: Complete onboarding flow
# 1. Visit /signup
# 2. Enter email and password
# 3. Answer 5 feature questions
# 4. Select theme
# 5. Launch dashboard
# Expected: Personalized dashboard loads with selected features

# Test 3: Verify feature preferences saved
# Navigate to settings
# Expected: Selected features match what was chosen
```

---

## 🧪 SMOKE TEST: Phase 2 - Pipeline Engine

**Expected**: Can create pipelines and move items through stages

```bash
# Test 1: Create pipeline
POST /api/pipelines
{
  "name": "Sales Pipeline",
  "stages": [
    {"name": "Lead", "order": 1},
    {"name": "Qualified", "order": 2},
    {"name": "Proposal", "order": 3},
    {"name": "Won", "order": 4}
  ]
}
# Expected: 201 Created with pipeline_id

# Test 2: Add entity to pipeline
POST /api/pipelines/{pipelineId}/entities
{
  "name": "Test Company",
  "value": 50000,
  "stage": "Lead"
}
# Expected: 201 Created

# Test 3: Move entity to next stage
PUT /api/pipelines/{pipelineId}/entities/{entityId}
{
  "stage": "Qualified"
}
# Expected: 200 OK

# Test 4: Get pipeline statistics
GET /api/pipelines/{pipelineId}/stats
# Expected: 200 OK with counts and values
```

---

## 🧪 SMOKE TEST: Phase 3 - Automation Engine

**Expected**: Can create rules and execute automations

```bash
# Test 1: Create automation rule
POST /api/automation/rules
{
  "name": "Send welcome email",
  "trigger": "lead_added",
  "conditions": [],
  "action": "send_email",
  "actionConfig": {"templateId": "welcome"}
}
# Expected: 201 Created

# Test 2: Test rule execution
POST /api/automation/rules/{ruleId}/test
# Expected: 200 OK with execution result

# Test 3: Get execution logs
GET /api/automation/rules/{ruleId}/logs
# Expected: 200 OK with log entries
```

---

## 🧪 SMOKE TEST: Phase 4 - Configuration System

**Expected**: Can customize fields and permissions

```bash
# Test 1: Create custom field
POST /api/custom-fields
{
  "name": "Company Size",
  "type": "select",
  "options": ["Small", "Medium", "Large"]
}
# Expected: 201 Created

# Test 2: Get custom fields
GET /api/custom-fields
# Expected: 200 OK with field list

# Test 3: Set role permissions
PUT /api/roles/{roleId}/permissions
{
  "canViewReports": true,
  "canEditPipelines": true
}
# Expected: 200 OK
```

---

## 🧪 SMOKE TEST: Phase 5 - Dashboard & Metrics

**Expected**: Dashboard displays metrics and recommendations

```bash
# Test 1: Get dashboard metrics
GET /api/metrics/dashboard
# Expected: 200 OK with health score, charts

# Test 2: Get AI recommendations
GET /api/metrics/recommendations
# Expected: 200 OK with recommendation list

# Test 3: View conversion funnel
GET /api/metrics/funnel
# Expected: 200 OK with stage breakdown
```

---

## 🧪 SMOKE TEST: Phase 6 - Feature Marketplace

**Expected**: Can browse and vote for features

```bash
# Test 1: List features
GET /api/marketplace/features
# Expected: 200 OK with feature list

# Test 2: Vote for feature
POST /api/marketplace/features/{featureId}/vote
# Expected: 200 OK with vote count

# Test 3: Create feature request
POST /api/marketplace/requests
{
  "title": "Dark mode",
  "description": "Add dark mode support"
}
# Expected: 201 Created
```

---

## 🧪 SMOKE TEST: Phase 7 - AI Manager Layer

**Expected**: AI generates suggestions and recommendations

```bash
# Test 1: Generate email suggestions
POST /api/ai-manager-layer
{
  "dealId": "test",
  "businessId": "test",
  "managerId": "test",
  "context": {"dealValue": 100000, "stage": "proposal"}
}
# Expected: 200 OK with suggestions + confidence score

# Test 2: View manager dashboard
GET /app/manager-portal
# Expected: 200 OK with focus deals

# Test 3: View deal details
GET /app/deals/{dealId}
# Expected: 200 OK with full analysis
```

---

## 📊 Performance Verification

### Page Load Times
```bash
# Test load time for critical pages
curl -w "@curl-format.txt" -o /dev/null -s https://[domain]/app/dashboard
curl -w "@curl-format.txt" -o /dev/null -s https://[domain]/app/pipelines
curl -w "@curl-format.txt" -o /dev/null -s https://[domain]/app/automation

# Expected: Total time < 2 seconds
```

### API Response Times
```bash
# Test API endpoints
time curl -s https://[domain]/api/pipelines | jq
time curl -s https://[domain]/api/metrics/dashboard | jq

# Expected: < 500ms response time
```

---

## ✅ Success Criteria

All tests pass when:
- ✅ All 35+ tables created
- ✅ All 36 functions deployed
- ✅ Onboarding flow completes
- ✅ Can create and move pipeline items
- ✅ Automation rules execute
- ✅ Dashboard shows metrics
- ✅ Feature voting works
- ✅ AI suggestions generate
- ✅ Performance < 2s page load
- ✅ APIs respond < 500ms
- ✅ Error rate < 0.1%

---

**Status**: Ready for deployment
**Date**: April 28, 2026
**Version**: Business OS v1.0

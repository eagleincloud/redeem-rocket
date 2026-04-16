# Growth Platform - Step-by-Step Deployment

## Prerequisites ✅

- [x] Database migrations completed
- [x] 10 tables created and verified
- [x] Edge functions compiled
- [x] E2E tests written
- [x] Documentation prepared

## Step 1: Authenticate with Supabase CLI

**Time: 2 minutes**

```bash
# Login to Supabase
supabase login

# You'll be redirected to browser to authenticate
# Create a new access token if needed:
# - Go to https://app.supabase.com/account/tokens
# - Create "Supabase CLI" token
# - Paste when prompted
```

**Verification:**
```bash
supabase projects list
# Should show your project
```

## Step 2: Configure .supabaserc (Optional but Recommended)

**Time: 2 minutes**

Create `.supabaserc` in project root:

```toml
[env.production]
project_id = "your-project-ref"
```

Get `project_id` from your Supabase URL:
- URL: `https://your-project-ref.supabase.co`
- Extract: `your-project-ref`

## Step 3: Deploy Edge Functions

**Time: 5-10 minutes**

### Option A: Automated Deployment (Recommended)

```bash
./deploy-growth-platform.sh
```

This will deploy all 6 functions automatically.

### Option B: Manual Deployment

Deploy each function individually:

```bash
# Get project ref from .env.local
PROJECT_REF=$(grep SUPABASE_URL .env.local | sed 's|https://||;s|\.supabase\.co||')

# Deploy functions
supabase functions deploy process-email-sequences --project-id $PROJECT_REF
supabase functions deploy lead-ingest --project-id $PROJECT_REF
supabase functions deploy verify-email-provider --project-id $PROJECT_REF
supabase functions deploy execute-automation-rules --project-id $PROJECT_REF
supabase functions deploy publish-social-post --project-id $PROJECT_REF
supabase functions deploy ingest-advanced-leads --project-id $PROJECT_REF
```

**Verify Deployment:**
```bash
supabase functions list --project-id $PROJECT_REF
# Should show all 6 functions
```

## Step 4: Set Environment Variables in Supabase Dashboard

**Time: 10 minutes**

1. Go to: https://app.supabase.com
2. Select your project
3. Go to: **Settings** → **Functions** → **Environment Variables**
4. Add the following:

### Essential Variables
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Email Configuration (Required for email sequences)
```env
RESEND_API_KEY=re_your_api_key
# OR for SMTP:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Social Media (Optional, for social posting)
```env
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_ACCESS_TOKEN=your-token
TWITTER_ACCESS_TOKEN_SECRET=your-token-secret

LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-token

FACEBOOK_PAGE_ACCESS_TOKEN=your-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-id
INSTAGRAM_ACCESS_TOKEN=your-token

TIKTOK_API_KEY=your-api-key
TIKTOK_API_SECRET=your-api-secret
```

### Other Integrations (Optional)
```env
# For IVR (Twilio)
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token

# For location data
GOOGLE_PLACES_API_KEY=your-api-key

# For Anthropic integrations
ANTHROPIC_API_KEY=your-api-key
```

## Step 5: Configure Cron Jobs

**Time: 5 minutes**

### Option A: Via Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select project → **Functions**
3. For each function, click the schedule icon:

**process-email-sequences:**
- Schedule: `0 2 * * *` (2 AM UTC daily)

**execute-automation-rules:**
- Schedule: `0 * * * *` (Every hour)

### Option B: Via CLI

```bash
PROJECT_REF=$(grep SUPABASE_URL .env.local | sed 's|https://||;s|\.supabase\.co||')

# Daily email sequences at 2 AM UTC
supabase functions deploy process-email-sequences \
  --project-id $PROJECT_REF \
  --schedule "0 2 * * *"

# Hourly automation rules
supabase functions deploy execute-automation-rules \
  --project-id $PROJECT_REF \
  --schedule "0 * * * *"
```

## Step 6: Verify Deployment

**Time: 5 minutes**

### Run E2E Tests

```bash
# Set environment variables
export SUPABASE_URL="https://your-project-ref.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run tests
deno run --allow-net --allow-env e2e-tests.ts
```

**Expected Output:**
```
✓ Email Sequences: 4 tests pass
✓ Lead Import: 4 tests pass
✓ Email Providers: 4 tests pass
✓ Automation Rules: 3 tests pass
✓ Social Media: 5 tests pass
✓ Advanced Leads: 4 tests pass

Total: 24 tests pass ✓
```

### Test Individual Functions

**Test lead-ingest webhook:**
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/lead-ingest \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "test-biz",
    "leads": [{
      "name": "Test Lead",
      "email": "test@example.com",
      "phone": "5551234567"
    }]
  }'
```

**Check function logs:**
```bash
PROJECT_REF=$(grep SUPABASE_URL .env.local | sed 's|https://||;s|\.supabase\.co||')
supabase functions logs process-email-sequences --project-id $PROJECT_REF --tail
```

## Step 7: Enable Monitoring (Recommended)

**Time: 10 minutes**

1. Go to Supabase Dashboard
2. **Functions** → Select a function
3. Click **Logs** tab
4. Enable error alerts if available
5. Check logs for any errors

**Common Log Queries:**
```bash
# View all function logs
supabase functions logs --project-id $PROJECT_REF --tail

# View specific function errors
supabase functions logs lead-ingest --project-id $PROJECT_REF --tail --filter="level=error"
```

## Step 8: Verify Database

**Time: 5 minutes**

```bash
# Check all tables exist
psql $DATABASE_URL << 'SQL'
\dt
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SQL

# Verify RLS policies
psql $DATABASE_URL << 'SQL'
SELECT schemaname, tablename, policyname FROM pg_policies ORDER BY tablename;
SQL

# Check recent inserts
psql $DATABASE_URL << 'SQL'
SELECT tablename, COUNT(*) as row_count 
FROM pg_class 
JOIN information_schema.tables ON pg_class.relname = tables.table_name 
WHERE schemaname='public' 
GROUP BY tablename;
SQL
```

## Troubleshooting

### Deploy Fails: "Access token not provided"

```bash
supabase login
# Reauthenticate and retry
```

### Deploy Fails: "Project not found"

```bash
# Verify project ref
grep SUPABASE_URL .env.local

# List available projects
supabase projects list

# Check project is accessible
```

### Function Returns 401 Unauthorized

```bash
# Verify service role key in environment variables
# Go to Supabase Dashboard → Settings → API → service_role key
# Make sure it's set in Dashboard environment variables
```

### E2E Tests Fail: "Invalid API key"

```bash
# Verify credentials in .env.local
cat .env.local

# Get fresh service role key from Supabase Dashboard
# Update .env.local and re-run tests
```

### Cron Jobs Not Running

```bash
# Check if schedule was set correctly
supabase functions list --project-id $PROJECT_REF --detailed

# Verify logs show scheduled execution
supabase functions logs process-email-sequences --project-id $PROJECT_REF --tail
```

## Complete Deployment Checklist

- [ ] Step 1: Supabase CLI authenticated
- [ ] Step 2: .supabaserc created (optional)
- [ ] Step 3: All 6 edge functions deployed
- [ ] Step 4: Environment variables set in Supabase Dashboard
- [ ] Step 5: Cron jobs configured
- [ ] Step 6: E2E tests passing (24+ tests)
- [ ] Step 7: Monitoring enabled
- [ ] Step 8: Database verified

## Success Indicators ✓

When deployment is complete, you should see:

1. ✓ All 6 functions listed in Supabase Dashboard
2. ✓ Functions have green status indicators
3. ✓ Environment variables visible in Settings
4. ✓ Cron schedules show in function details
5. ✓ E2E tests pass with actual API keys
6. ✓ Log entries appear when webhooks are called
7. ✓ Daily sequences trigger at 2 AM UTC
8. ✓ Hourly automation rules execute on schedule

## Timeline

| Step | Time | Status |
|------|------|--------|
| 1. CLI Auth | 2 min | ⏳ Pending |
| 2. Config | 2 min | ⏳ Pending |
| 3. Deploy Functions | 10 min | ⏳ Pending |
| 4. Env Variables | 10 min | ⏳ Pending |
| 5. Cron Jobs | 5 min | ⏳ Pending |
| 6. Verify | 5 min | ⏳ Pending |
| 7. Monitoring | 10 min | ⏳ Pending |
| 8. Database Check | 5 min | ⏳ Pending |
| **Total** | **~60 min** | |

## Support

- DEPLOYMENT_GUIDE.md - Detailed deployment guide
- PRODUCTION_READINESS.md - Complete checklist
- CREDENTIALS_SETUP.md - Credential management
- GROWTH_PLATFORM_SUMMARY.md - Feature overview

**Ready to deploy? Start with Step 1!**


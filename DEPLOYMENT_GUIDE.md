# Growth Platform Deployment Guide

## Overview

This guide covers deploying the complete growth platform backend (6 edge functions + 10 database tables) to Supabase production.

## Prerequisites

1. ✅ Database migrations applied (verified working)
2. ⏳ Supabase CLI installed: `npm install -g supabase`
3. ⏳ Valid Supabase account and project access
4. ⏳ Environment variables configured

## Deployment Checklist

### 1. Verify Database Setup

```bash
# Check if all tables exist
psql $DATABASE_URL << 'SQL'
\dt
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SQL
```

Expected tables:
- automation_rules
- database_sync_logs
- email_provider_configs
- email_sequences
- email_tracking
- ivr_leads
- lead_connectors
- lead_tags
- leads
- scraped_leads
- social_accounts
- social_posts
- web_portal_submissions

### 2. Prepare Environment Variables for Edge Functions

Set these in Supabase project → Settings → Functions → Environment Variables:

```env
# Required for all functions
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# For email functions
RESEND_API_KEY=re_xxxxx  # Get from https://resend.com
SMTP_HOST=smtp.gmail.com  # or your SMTP provider
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# For social media posting
TWITTER_API_KEY=your-api-key
TWITTER_API_SECRET=your-api-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_TOKEN_SECRET=your-token-secret

LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_ACCESS_TOKEN=your-access-token

FACEBOOK_PAGE_ACCESS_TOKEN=your-page-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-account-id
INSTAGRAM_ACCESS_TOKEN=your-access-token

TIKTOK_API_KEY=your-api-key
TIKTOK_API_SECRET=your-api-secret

# For Google Places API (if using location data)
GOOGLE_PLACES_API_KEY=your-api-key

# For IVR integration (if using Twilio)
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
```

### 3. Deploy Edge Functions

```bash
# Login to Supabase
supabase login

# Deploy growth platform functions
supabase functions deploy process-email-sequences
supabase functions deploy lead-ingest
supabase functions deploy verify-email-provider
supabase functions deploy execute-automation-rules
supabase functions deploy publish-social-post
supabase functions deploy ingest-advanced-leads

# Verify deployment
supabase functions list
```

### 4. Configure Cron Jobs

Email sequences and automation rules should run on a schedule:

**Daily Email Sequences (2:00 AM UTC):**
```bash
supabase functions deploy process-email-sequences --schedule "0 2 * * *"
```

**Hourly Automation Rules:**
```bash
supabase functions deploy execute-automation-rules --schedule "0 * * * *"
```

### 5. Test Functions

#### Test Email Sequences
```bash
curl -X POST https://your-project.supabase.co/functions/v1/process-email-sequences \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"trigger_type": "signup"}'
```

#### Test Lead Ingest
```bash
curl -X POST https://your-project.supabase.co/functions/v1/lead-ingest \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "test-biz",
    "leads": [
      {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "5551234567",
        "company": "ACME Corp"
      }
    ]
  }'
```

#### Test Email Provider Verification
```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify-email-provider \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "test-biz",
    "provider_config_id": "uuid-here"
  }'
```

## Function Descriptions

### 1. process-email-sequences
- **Purpose**: Execute drip email campaigns
- **Trigger**: Daily cron job
- **Logic**: Finds leads created N days ago, sends scheduled emails
- **Outputs**: Records in email_tracking table

### 2. lead-ingest  
- **Purpose**: Ingest leads from multiple sources
- **Trigger**: HTTP POST webhook
- **Logic**: Validates leads, supports JSON/CSV, batch processes
- **Inputs**: webhook, csv, form_embed, api, zapier

### 3. verify-email-provider
- **Purpose**: Test email provider configuration
- **Trigger**: Manual or HTTP POST
- **Logic**: Validates credentials, tests connectivity
- **Providers**: Resend, SMTP, AWS SES

### 4. execute-automation-rules
- **Purpose**: Trigger-based workflow automation
- **Trigger**: Hourly cron job
- **Logic**: Evaluates conditions, executes actions
- **Actions**: send_email, add_tag, update_field, create_task

### 5. publish-social-post
- **Purpose**: Post to social media platforms
- **Trigger**: HTTP POST
- **Logic**: Routes to platform APIs, applies limits
- **Platforms**: Twitter, Facebook, LinkedIn, Instagram, TikTok

### 6. ingest-advanced-leads
- **Purpose**: Ingest from advanced sources
- **Trigger**: HTTP POST
- **Logic**: Separate handlers for each source
- **Sources**: IVR, web portals, database sync, web scraping

## Troubleshooting

### Function Deployment Issues

```bash
# Check deployment status
supabase functions list --detailed

# View logs
supabase functions logs process-email-sequences

# Redeploy if needed
supabase functions deploy process-email-sequences --force
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL -c "SELECT current_user, current_database;"

# Check RLS policies
psql $DATABASE_URL << 'SQL'
SELECT schemaname, tablename, policyname FROM pg_policies ORDER BY tablename;
SQL
```

### RLS Permission Issues

If functions can't access tables, verify:

```sql
-- Check RLS policies (should allow service role to bypass)
SELECT * FROM pg_policies WHERE tablename = 'leads';

-- Service role should have unrestricted access via bypass
-- If policies reference auth.uid(), service role queries should not be blocked
```

## Monitoring

### View Function Logs
```bash
supabase functions logs process-email-sequences --tail
supabase functions logs lead-ingest --tail
```

### Monitor Database
```bash
# Check table row counts
psql $DATABASE_URL << 'SQL'
SELECT tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
SQL

# Check recent inserts
SELECT table_name, COUNT(*) FROM information_schema.tables GROUP BY table_name;
```

## Production Readiness Checklist

- [ ] Database migrations verified
- [ ] All environment variables set in Supabase
- [ ] Edge functions deployed and tested
- [ ] Cron jobs configured
- [ ] Log monitoring set up
- [ ] Database backup configured
- [ ] Error alerts configured
- [ ] RLS policies verified for security
- [ ] Rate limiting configured (if needed)
- [ ] API usage monitoring enabled

## Rollback Procedure

If issues occur:

```bash
# Disable cron jobs
supabase functions deploy process-email-sequences --no-schedule
supabase functions deploy execute-automation-rules --no-schedule

# Temporarily disable a function
supabase functions delete process-email-sequences

# Restore from backup if data corruption
# (depends on your Supabase backup configuration)
```

## Support

For issues:
1. Check function logs: `supabase functions logs <name> --tail`
2. Verify database: `psql $DATABASE_URL -c "SELECT count(*) FROM leads;"`
3. Check credentials in Supabase dashboard
4. Review error messages in Supabase logs


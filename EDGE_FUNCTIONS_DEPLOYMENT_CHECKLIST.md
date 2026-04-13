# Edge Functions Deployment Checklist

Complete checklist for deploying Resend Edge Functions to production.

---

## Pre-Deployment Setup

### Resend Account
- [ ] Created account at https://resend.com
- [ ] Created API key at https://resend.com/api-keys
- [ ] API key copied (format: `re_XXXXXXXXXX`)
- [ ] Verified sender domain (or using Resend default)
- [ ] Checked free tier limits (3,000 emails/month)

### Supabase Project
- [ ] Supabase project created and accessible
- [ ] Project ID: `________________`
- [ ] SUPABASE_URL in `.env`: `________________`
- [ ] SUPABASE_SERVICE_ROLE_KEY in `.env`: `________________`
- [ ] Can access Supabase Dashboard

### CLI & Dependencies
- [ ] Supabase CLI installed: `supabase --version`
- [ ] Node.js v16+ installed: `node --version`
- [ ] Working in correct directory: `/Users/adityatiwari/Downloads/App\ Creation\ Request-2`
- [ ] `.env` file exists with Supabase credentials

---

## Database Setup

### Schema Verification
- [ ] Migration file exists: `supabase/migrations/20260413224528_resend_schema.sql`
- [ ] Database tables created:
  - [ ] `outreach_email_tracking`
  - [ ] `outreach_campaigns`
  - [ ] `email_preferences`
  - [ ] `campaign_email_lists`
  - [ ] `campaign_list_subscribers`
  - [ ] `email_unsubscribe_tokens`
- [ ] Verified in Supabase Dashboard → Tables

### Database Functions
- [ ] SQL functions created:
  - [ ] `mark_email_delivered()`
  - [ ] `mark_email_opened()`
  - [ ] `mark_email_clicked()`
  - [ ] `update_campaign_stats()`
  - [ ] `update_list_subscriber_count()`
- [ ] Row-level security (RLS) enabled where applicable
- [ ] Indexes created for performance

---

## Edge Functions Code Verification

### send-campaign-email
- [ ] File exists: `supabase/functions/send-campaign-email/index.ts`
- [ ] Code reviewed (217 lines)
- [ ] Imports verified:
  - [ ] Supabase client imported
  - [ ] Environment variables used correctly
- [ ] Type definitions present for `Recipient` and `EmailPayload`
- [ ] Error handling implemented
- [ ] Database tracking integrated
- [ ] CORS headers configured

### bulk-outreach-email
- [ ] File exists: `supabase/functions/bulk-outreach-email/index.ts`
- [ ] Code reviewed (274 lines)
- [ ] Batching logic implemented (configurable batch size)
- [ ] Rate limiting delays included (configurable)
- [ ] Campaign creation function working
- [ ] Database tracking integrated
- [ ] Type definitions present
- [ ] Error handling comprehensive

---

## Supabase Configuration

### Secrets Setup
```bash
# Execute in terminal:
supabase secrets set RESEND_API_KEY=re_YOUR_KEY
supabase secrets set RESEND_FROM="Your Name <noreply@yourdomain.com>"
```

- [ ] RESEND_API_KEY set in Supabase
- [ ] RESEND_FROM set in Supabase
- [ ] Secrets verified in Supabase Dashboard → Settings → Edge Function secrets

### Project Linking
```bash
# Link to Supabase project:
supabase link --project-ref YOUR_PROJECT_ID
```

- [ ] Project linked: `supabase projects list` confirms connection
- [ ] Correct project linked (verify URL matches)

---

## Deployment Steps

### Deploy Functions
```bash
# Option 1: Using deployment script
bash scripts/deploy-edge-functions.sh re_YOUR_API_KEY

# Option 2: Manual deployment
supabase functions deploy send-campaign-email
supabase functions deploy bulk-outreach-email
```

- [ ] `send-campaign-email` deployed successfully
- [ ] `bulk-outreach-email` deployed successfully
- [ ] No deployment errors in console
- [ ] Functions show in `supabase functions list`

### Verify Deployed Functions

```bash
# List functions
supabase functions list

# Should show:
# - send-campaign-email
# - bulk-outreach-email
```

- [ ] Both functions listed
- [ ] Functions have deployment URLs
- [ ] URLs follow pattern: `https://PROJECT_ID.supabase.co/functions/v1/FUNCTION_NAME`

---

## Testing

### Test send-campaign-email

```bash
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
ANON_KEY="YOUR_ANON_KEY"

curl -X POST $SUPABASE_URL/functions/v1/send-campaign-email \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"email": "test@example.com"}],
    "subject": "Test",
    "htmlContent": "<h1>Test</h1>",
    "content": "Test",
    "businessId": "test"
  }'
```

- [ ] Request successful (no network errors)
- [ ] Response includes `"ok": true` or `"ok": false`
- [ ] `successCount` and `failedCount` returned
- [ ] Test email received (or logged in dev mode)

### Test bulk-outreach-email

```bash
curl -X POST $SUPABASE_URL/functions/v1/bulk-outreach-email \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [
      {"email": "user1@example.com"},
      {"email": "user2@example.com"}
    ],
    "subject": "Newsletter",
    "htmlContent": "<h1>Newsletter</h1>",
    "content": "Newsletter",
    "campaignName": "Test Campaign",
    "businessId": "test"
  }'
```

- [ ] Request successful
- [ ] `campaignId` returned
- [ ] `successCount` > 0
- [ ] Campaign created in database

### Test Database Tracking

```sql
-- In Supabase Dashboard → SQL Editor

-- Check campaign was created
SELECT * FROM outreach_campaigns 
WHERE campaign_name = 'Test Campaign';

-- Check emails were tracked
SELECT * FROM outreach_email_tracking 
LIMIT 10;
```

- [ ] Campaign record created
- [ ] Email tracking records inserted
- [ ] Status field shows 'sent'
- [ ] Timestamps are current

---

## Integration Testing

### Frontend Integration

```typescript
// In your React component:
import { resendService } from '@/app/lib/resendService';

await resendService.sendCampaignEmail({
  recipients: [{ email: 'test@example.com' }],
  subject: 'Test',
  htmlContent: '<h1>Test</h1>',
  content: 'Test',
  businessId: 'biz_123',
});
```

- [ ] `resendService.ts` imports correctly
- [ ] Functions callable from React components
- [ ] No TypeScript errors
- [ ] Response handled correctly
- [ ] Error cases managed

### Real-World Email Test

```typescript
// Send test email to actual address
await resendService.sendCampaignEmail({
  recipients: [{ email: 'YOUR_EMAIL@example.com' }],
  subject: 'Production Test',
  htmlContent: '<h1>Production Test</h1>',
  content: 'Production Test',
  businessId: 'production',
  campaignId: 'test-campaign',
});
```

- [ ] Email sent from correct sender address
- [ ] Subject line correct
- [ ] HTML renders properly
- [ ] Reply-to address functional
- [ ] No bounce/rejection

---

## Production Configuration

### Environment Variables

#### Supabase Secrets
```bash
supabase secrets set RESEND_API_KEY=re_YOUR_PRODUCTION_KEY
supabase secrets set RESEND_FROM="Your Business <noreply@yourdomain.com>"
```

- [ ] Production Resend API key configured
- [ ] Verified sender domain configured
- [ ] Secrets not exposed in code

#### Vercel Environment (if applicable)
- [ ] `RESEND_API_KEY` set in Vercel Dashboard
- [ ] `RESEND_FROM` set in Vercel Dashboard
- [ ] `VITE_RESEND_FROM` set in Vercel Dashboard
- [ ] Variables available for Production environment

#### Local .env
- [ ] `.env` file never committed to git
- [ ] `.env` in `.gitignore`
- [ ] Sensitive keys not logged

---

## Monitoring Setup

### Logging Configuration

```bash
# Check function logs
supabase logs pull --function=send-campaign-email --limit=50
supabase logs pull --function=bulk-outreach-email --limit=50
```

- [ ] Can view function logs
- [ ] No errors in recent logs
- [ ] Can filter by function name

### Database Monitoring

```sql
-- Track email delivery rates
SELECT 
  campaign_id,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered
FROM outreach_email_tracking
GROUP BY campaign_id;
```

- [ ] Can query tracking data
- [ ] Indexes working (queries fast)
- [ ] Can group by campaign
- [ ] Can count by status

---

## Documentation

### Generated Documentation Files
- [ ] `EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md` created
- [ ] `EDGE_FUNCTIONS_API_REFERENCE.md` created
- [ ] `EDGE_FUNCTIONS_QUICK_START.md` created
- [ ] `EDGE_FUNCTIONS_DEPLOYMENT_CHECKLIST.md` (this file)
- [ ] `scripts/deploy-edge-functions.sh` created and executable

### Documentation Review
- [ ] Deployment guide reviewed
- [ ] API reference accurate
- [ ] Quick start tested and works
- [ ] Code examples correct
- [ ] Troubleshooting section complete

---

## Rollout Plan

### Phase 1: Development
- [ ] Functions deployed to development environment
- [ ] Tested with development database
- [ ] Internal team tested the workflow

### Phase 2: Staging
- [ ] Functions tested in staging environment
- [ ] Production-like data used for testing
- [ ] Email templates finalized
- [ ] Performance verified

### Phase 3: Production
- [ ] Final review completed
- [ ] Backup plan if rollback needed
- [ ] Team notified of deployment
- [ ] Monitoring setup verified
- [ ] Production Resend API key configured

---

## Post-Deployment

### Verification Tasks
- [ ] Both functions responding to requests
- [ ] Emails being sent successfully
- [ ] Database tracking working
- [ ] No errors in logs
- [ ] Performance acceptable

### Team Notification
- [ ] Development team notified
- [ ] Usage examples shared
- [ ] API documentation distributed
- [ ] Support plan established

### Monitoring Schedule
- [ ] Daily log checks for first week
- [ ] Weekly email delivery report
- [ ] Monthly performance review
- [ ] Quarterly cost analysis

---

## Rollback Plan

If issues arise:

1. **Identify Issue**
   - [ ] Check function logs: `supabase logs pull --function=send-campaign-email`
   - [ ] Query database: Check `outreach_email_tracking` records
   - [ ] Test with curl to isolate issue

2. **Immediate Mitigation**
   - [ ] Temporarily disable sending if critical issue
   - [ ] Document error message
   - [ ] Notify team

3. **Fix & Redeploy**
   - [ ] Update function code if needed
   - [ ] Test locally first
   - [ ] Redeploy: `supabase functions deploy send-campaign-email`
   - [ ] Verify fix works

---

## Appendix: Quick Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref YOUR_PROJECT_ID

# Set Resend API key
supabase secrets set RESEND_API_KEY=re_YOUR_KEY

# Deploy functions
supabase functions deploy send-campaign-email
supabase functions deploy bulk-outreach-email

# View logs
supabase logs pull --function=send-campaign-email

# List functions
supabase functions list

# Test with curl
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-campaign-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## Sign-Off

- [ ] Deployment completed and verified
- [ ] All tests passed
- [ ] Documentation reviewed
- [ ] Team trained on usage
- [ ] Monitoring configured
- [ ] Ready for production use

**Date Deployed**: ________________  
**Deployed By**: ________________  
**Review Date**: ________________  

---

**Status**: Ready for Deployment ✅

All Edge Functions are production-ready and this checklist ensures complete deployment.

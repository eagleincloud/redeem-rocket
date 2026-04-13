# Edge Functions Quick Start

Deploy Resend Edge Functions in 5 minutes.

---

## Prerequisites

```bash
# 1. Supabase CLI
npm install -g supabase

# 2. Resend API Key
# Go to https://resend.com/api-keys
# Copy your API key (format: re_XXXXXXXXXX)
```

---

## 1-Minute Deployment

### Step 1: Navigate to Project

```bash
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2
```

### Step 2: Set Resend API Key

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_API_KEY_HERE
```

Replace `re_YOUR_API_KEY_HERE` with your actual Resend API key.

### Step 3: Deploy Functions

```bash
# Using the deployment script
bash scripts/deploy-edge-functions.sh re_YOUR_API_KEY_HERE

# Or manually:
supabase functions deploy send-campaign-email
supabase functions deploy bulk-outreach-email
```

### Step 4: Verify Deployment

```bash
# Should show both functions
supabase functions list
```

**Done!** Functions are now live. ✅

---

## Testing

### Quick Test with curl

```bash
# Replace YOUR_PROJECT and YOUR_KEY with actual values
SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
ANON_KEY="YOUR_ANON_KEY"

curl -X POST $SUPABASE_URL/functions/v1/send-campaign-email \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"email": "test@example.com"}],
    "subject": "Test Email",
    "htmlContent": "<h1>Hello World</h1>",
    "content": "Hello World",
    "businessId": "test-business"
  }'
```

### Expected Response

```json
{
  "ok": true,
  "successCount": 1,
  "failedCount": 0,
  "accepted": ["test@example.com"],
  "rejected": []
}
```

---

## Using in Your App

### With Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const { data, error } = await supabase.functions.invoke(
  'send-campaign-email',
  {
    body: {
      recipients: [
        { email: 'user@example.com', name: 'John' }
      ],
      subject: 'Hello!',
      htmlContent: '<h1>Welcome</h1>',
      content: 'Welcome',
      businessId: 'biz_123',
    },
  }
);
```

### Using resendService.ts

```typescript
import { resendService } from '@/app/lib/resendService';

await resendService.sendCampaignEmail({
  recipients: [{ email: 'user@example.com' }],
  subject: 'Campaign',
  htmlContent: '<h1>Campaign</h1>',
  content: 'Campaign',
  businessId: 'biz_123',
  campaignId: 'camp_456',
});
```

---

## Common Issues

### "RESEND_API_KEY not set"

Functions run in dev mode. Set the key:

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_KEY
supabase functions deploy send-campaign-email --force-update
```

### "recipients required" or "businessId required"

Ensure request includes required fields:

```json
{
  "recipients": [{"email": "test@example.com"}],
  "subject": "Subject",
  "htmlContent": "<h1>HTML</h1>",
  "content": "Text",
  "businessId": "business-id"
}
```

### "Supabase CLI not found"

Install it:

```bash
npm install -g supabase
```

---

## Next Steps

1. ✅ Deploy functions
2. ✅ Test with curl
3. ✅ Integrate with frontend
4. ✅ Monitor logs: `supabase logs pull --function=send-campaign-email`
5. ✅ Check tracking: Query `outreach_email_tracking` table

---

## Key Files

| File | Purpose |
|------|---------|
| `supabase/functions/send-campaign-email/index.ts` | Campaign email handler |
| `supabase/functions/bulk-outreach-email/index.ts` | Bulk outreach handler |
| `supabase/migrations/20260413224528_resend_schema.sql` | Database schema |
| `src/app/lib/resendService.ts` | Client service |
| `EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md` | Full documentation |
| `EDGE_FUNCTIONS_API_REFERENCE.md` | Complete API docs |

---

## Environment Variables

### Supabase Secrets (for edge functions)

```bash
supabase secrets set RESEND_API_KEY=re_YOUR_KEY
supabase secrets set RESEND_FROM="App <noreply@yourdomain.com>"
```

### Vercel (if using Vercel for hosting)

```bash
# Set in Vercel Dashboard → Settings → Environment Variables
RESEND_API_KEY=re_YOUR_KEY
RESEND_FROM=Redeem Rocket <noreply@redeemrocket.in>
```

### Local .env (development)

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
RESEND_API_KEY=re_YOUR_KEY
```

---

## Functions Summary

### send-campaign-email

- **Purpose**: Send campaign emails to recipients
- **Use case**: Marketing campaigns, newsletters, one-off sends
- **Max recipients**: 100-1000 per request
- **Response time**: 5-30 seconds

**Request**:
```json
{
  "recipients": [{email, name?, properties?}],
  "subject": "string",
  "htmlContent": "string",
  "content": "string",
  "businessId": "string",
  "campaignId?": "string"
}
```

### bulk-outreach-email

- **Purpose**: Send bulk emails with rate limiting
- **Use case**: Large campaigns (1000+ recipients)
- **Max recipients**: 10,000+ per request
- **Response time**: Minutes (based on batch size)
- **Features**: Batching, rate limiting, campaign tracking

**Request**:
```json
{
  "recipients": [{email, name?, properties?}],
  "subject": "string",
  "htmlContent": "string",
  "content": "string",
  "campaignName": "string",
  "businessId": "string",
  "batchSize?": 50,
  "delayMs?": 500
}
```

---

## Monitoring

### View Logs

```bash
# Last 100 logs
supabase logs pull --function=send-campaign-email --limit=100

# Follow real-time logs
supabase logs pull --function=send-campaign-email

# Check for errors
supabase logs pull --function=bulk-outreach-email | grep -i error
```

### Query Database

```sql
-- Check sent emails
SELECT * FROM outreach_email_tracking 
WHERE campaign_id = 'camp_123'
LIMIT 10;

-- Campaign statistics
SELECT campaign_id, COUNT(*) as count
FROM outreach_email_tracking
GROUP BY campaign_id;
```

---

## Troubleshooting

### Functions not showing in list

```bash
# Verify project linked
supabase projects list

# Link to project
supabase link --project-ref YOUR_PROJECT_ID

# Then deploy
supabase functions deploy send-campaign-email
```

### Can't access functions from frontend

```bash
# Check CORS in function (already configured)
# Verify ANON_KEY is correct
# Check network tab for actual error

# Test with curl first
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-campaign-email ...
```

### Emails not being tracked

```bash
# Check database tables exist
# Verify SUPABASE_SERVICE_ROLE_KEY is set in function environment
# Check Supabase logs for SQL errors
supabase logs pull --function=send-campaign-email
```

---

## Performance Tips

### For Large Campaigns

```typescript
// Use bulk-outreach-email with tuned parameters
{
  batchSize: 25,      // Smaller batches
  delayMs: 2000       // Longer delays
}
```

### Rate Limiting

- Resend free tier: 3,000 emails/month
- Pro tier: Higher based on plan
- Functions: Adjust batchSize and delayMs accordingly

---

## Additional Resources

- **Full Deployment Guide**: `EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md`
- **API Reference**: `EDGE_FUNCTIONS_API_REFERENCE.md`
- **Resend Docs**: https://resend.com/docs
- **Supabase Functions**: https://supabase.com/docs/guides/functions

---

## Support

1. Check logs: `supabase logs pull --function=send-campaign-email`
2. Review API reference: `EDGE_FUNCTIONS_API_REFERENCE.md`
3. Verify Resend API key: https://resend.com/api-keys
4. Check database: Supabase Dashboard → SQL Editor

---

**Status**: ✅ Production Ready

Both functions are fully implemented, tested, and ready for production use.

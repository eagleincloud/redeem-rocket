# Resend Integration - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Get Resend API Key
```bash
# 1. Go to https://resend.com
# 2. Sign up (free plan: 3,000 emails/month)
# 3. Create API key at https://resend.com/api-keys
# 4. Copy the API key (starts with "re_")
```

### 2. Set Environment Variables

**Local Development (.env.local):**
```env
VITE_RESEND_FROM=Redeem Rocket <noreply@redeemrocket.in>
VITE_RESEND_REPLY_TO=support@redeemrocket.in
```

**Vercel Production:**
```bash
# In Vercel dashboard → Settings → Environment Variables
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM=Redeem Rocket <noreply@redeemrocket.in>
```

### 3. Deploy Database Schema

```bash
# In Supabase dashboard, run this SQL:
psql -h db.YOUR_PROJECT.supabase.co -U postgres < RESEND_DATABASE_SCHEMA.sql

# Or via Supabase CLI:
supabase db push RESEND_DATABASE_SCHEMA.sql
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy send-campaign-email
supabase functions deploy bulk-outreach-email
```

### 5. Set Supabase Secrets

```bash
supabase secrets set RESEND_API_KEY "re_your_api_key"
supabase secrets set RESEND_FROM "Redeem Rocket <noreply@redeemrocket.in>"
supabase secrets set VERIFICATION_URL "https://app.example.com/verify-email"
```

## 💻 Component Integration Examples

### Send Campaign Emails
```typescript
import { sendCampaignEmails } from '@/app/lib/resendService';

// In your OutreachPage or CampaignsPage:
const result = await sendCampaignEmails({
  recipients: [
    { email: 'john@example.com', name: 'John' },
    { email: 'jane@example.com', name: 'Jane' },
  ],
  subject: 'Special Offer Just for You',
  content: 'Check out our latest deals!',
  template: 'promotional',
  campaignId: campaign.id,
  businessId: bizUser.businessId,
});

if (result.ok) {
  console.log(`✅ Sent to ${result.successCount} recipients`);
} else {
  console.error(`❌ Error: ${result.error}`);
}
```

### Send Bulk Outreach (1000+ recipients)
```typescript
import { sendBulkOutreach } from '@/app/lib/resendService';

const result = await sendBulkOutreach({
  recipients: largeContactList, // 1000+ emails
  subject: 'New Feature Launch',
  content: 'We've launched something new!',
  template: 'announcement',
  campaignName: 'Q2 2026 Launch',
  businessId: bizUser.businessId,
  batchSize: 50,        // 50 emails per batch
  delayMs: 500,         // 500ms between batches
});

console.log(`Sent: ${result.successCount}, Failed: ${result.failedCount}`);
```

### Send Direct Message
```typescript
import { sendDirectMessage } from '@/app/lib/resendService';

const result = await sendDirectMessage({
  to: { email: 'customer@example.com', name: 'John' },
  subject: 'Follow-up Message',
  body: 'Thanks for your interest!',
  channel: 'email',
  businessId: bizUser.businessId,
});
```

### Track Email Analytics
```typescript
import { getCampaignStats } from '@/app/lib/resendService';

const stats = await getCampaignStats(campaignId);
console.log(`Opens: ${stats.opens}, Clicks: ${stats.clicks}`);
```

## 🧪 Testing

### Test with Real Email
```typescript
// Send to yourself first
const testResult = await sendCampaignEmails({
  recipients: [{ email: 'your-email@example.com' }],
  // ... rest of config
});
```

### Test with Resend Test Email
```typescript
// Resend allows unlimited test emails to test@resend.dev
const testResult = await sendCampaignEmails({
  recipients: [{ email: 'test@resend.dev' }],
  // ... rest of config
});
```

### Development Mode (No API Key)
```typescript
// If RESEND_API_KEY not set:
// - Console logs intended email sends
// - No API calls made
// - Perfect for testing locally
```

## 📊 Monitoring & Troubleshooting

### Check Sent Emails
```bash
# In Supabase dashboard:
# Table: outreach_email_tracking
# Filter by status = 'sent'
```

### Monitor Campaign Stats
```typescript
// Get campaign metrics
const stats = await getCampaignStats(campaignId);

// Check in database
SELECT COUNT(*) FILTER (WHERE status = 'opened')
FROM outreach_email_tracking
WHERE campaign_id = 'abc123';
```

### Debug Failed Sends
```typescript
const result = await sendCampaignEmails({...});

// Check rejected emails
console.log(result.rejected); // Array of failed emails
```

## ⚡ Best Practices

✅ **Do:**
- Use bulk outreach for large lists (1000+)
- Test with small batch first (10 emails)
- Monitor delivery rates
- Clean email lists regularly
- Segment audiences

❌ **Don't:**
- Send to unverified email lists
- Send too fast (respect rate limits)
- Use test emails in production
- Skip unsubscribe links
- Ignore bounce feedback

## 🔑 Important Files

| File | Purpose |
|------|---------|
| `src/app/lib/resendService.ts` | Client-side email API |
| `supabase/functions/send-campaign-email/index.ts` | Campaign handler |
| `supabase/functions/bulk-outreach-email/index.ts` | Bulk handler |
| `RESEND_DATABASE_SCHEMA.sql` | Database setup |
| `RESEND_IMPLEMENTATION_GUIDE.md` | Complete documentation |

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Emails not sending | Check RESEND_API_KEY in Vercel |
| "Resend not configured" | Set RESEND_API_KEY in Supabase secrets |
| High bounce rate | Verify email list quality |
| Rate limiting | Reduce batchSize to 25-30 |
| Tracking not working | Ensure campaign_id is set |

## 📈 Success Metrics

**Target rates:**
- Delivery: > 95%
- Open: 15-30%
- Click: 2-5%

**Monitor in Supabase:**
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
  COUNT(*) FILTER (WHERE status = 'opened') AS opened,
  COUNT(*) FILTER (WHERE status = 'clicked') AS clicked,
  COUNT(*) AS total
FROM outreach_email_tracking
WHERE campaign_id = 'your-campaign-id';
```

## 🎓 Learn More

- [Resend API Docs](https://resend.com/docs)
- [Email Best Practices](https://resend.com/docs/knowledge-base/best-practices)
- [SPF/DKIM Setup](https://resend.com/docs/knowledge-base/spf-dkim)

## ✨ Next Steps

1. ✅ Sign up for Resend account
2. ✅ Set environment variables
3. ✅ Deploy database schema
4. ✅ Deploy edge functions
5. ⭕ Integrate with OutreachPage
6. ⭕ Integrate with CampaignsPage
7. ⭕ Test end-to-end
8. ⭕ Monitor production metrics

---

**Status**: Implementation complete, ready for deployment
**Commit**: a52cd06
**Build**: ✅ Passed

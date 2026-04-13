# Resend Email Integration Implementation Guide

## Overview

This guide covers the complete implementation of Resend for outreach, campaigns, and direct email messaging in the Redeem Rocket application.

## ✅ What's Been Implemented

### 1. Client-Side Service (`src/app/lib/resendService.ts`)

**Features:**
- Campaign email sending with HTML templates
- Direct message sending (email, SMS, WhatsApp)
- Bulk outreach with rate limiting
- Email list management (add/remove contacts)
- Email tracking (opens, clicks)
- Campaign statistics

**Key Functions:**
```typescript
// Send campaign emails to multiple recipients
sendCampaignEmails(payload: CampaignEmailPayload)

// Send direct messages via multiple channels
sendDirectMessage(payload: DirectMessagePayload)

// Send bulk outreach with batching and delays
sendBulkOutreach(payload: BulkOutreachPayload)

// Email list management
addToList(listId, contacts, businessId)
removeFromList(listId, emails, businessId)

// Tracking
trackEmailOpen(campaignId, recipientEmail)
trackEmailClick(campaignId, recipientEmail, linkUrl)
getCampaignStats(campaignId)
```

**Template Formats:**
- `campaign` - General campaign emails
- `promotional` - Special offers and promotions
- `newsletter` - Regular newsletters
- `announcement` - Important announcements

### 2. Supabase Edge Functions

#### `send-campaign-email`
- Sends bulk campaign emails via Resend API
- Supports up to 100+ recipients per request
- Includes email tracking database integration
- Returns detailed success/failure report

#### `bulk-outreach-email`
- Sends large-scale outreach campaigns (1000s of recipients)
- Implements batching (default: 50 emails per batch)
- Rate limiting with configurable delays (default: 500ms between batches)
- Creates campaign record in database
- Tracks all sent emails automatically

### 3. Database Schema

**New Tables:**
- `email_tracking` - Tracks opens, clicks, bounces
- `outreach_email_tracking` - Extended tracking for bulk campaigns
- `email_preferences` - User subscription preferences
- `campaign_email_lists` - Segmented email lists
- `campaign_list_subscribers` - List membership
- `email_unsubscribe_tokens` - Safe unsubscribe link management

**Database Functions:**
- `mark_email_delivered()` - Update delivery status
- `mark_email_opened()` - Track opens
- `mark_email_clicked()` - Track clicks
- `update_campaign_stats()` - Get campaign metrics

## 🚀 Setup Instructions

### Step 1: Resend Account Setup

1. Sign up at https://resend.com
2. Create API key at https://resend.com/api-keys
3. Verify your sender domain (or use Resend's default)
4. Get your sender email address (e.g., `noreply@yourdomain.com`)

### Step 2: Environment Variables

Add to `.env.local` (development):
```env
VITE_RESEND_FROM=Redeem Rocket <noreply@redeemrocket.in>
VITE_RESEND_REPLY_TO=support@redeemrocket.in
```

Add to Supabase secrets (for edge functions):
```bash
supabase secrets set RESEND_API_KEY "your_resend_api_key"
supabase secrets set RESEND_FROM "Redeem Rocket <noreply@redeemrocket.in>"
```

### Step 3: Database Setup

Run the SQL schema in Supabase:
```sql
-- Execute all SQL in RESEND_DATABASE_SCHEMA.sql
-- This creates all necessary tables and functions
```

Or use Supabase CLI:
```bash
supabase db push RESEND_DATABASE_SCHEMA.sql
```

### Step 4: Deploy Edge Functions

```bash
supabase functions deploy send-campaign-email
supabase functions deploy bulk-outreach-email
```

Verify deployment:
```bash
supabase functions list
```

### Step 5: Update Components

#### OutreachPage Integration
```typescript
import { sendBulkOutreach } from '@/app/lib/resendService';

// In your send handler:
const result = await sendBulkOutreach({
  recipients: contactList,
  subject: 'Your Outreach Subject',
  content: 'Email body text',
  template: 'invitation',
  campaignName: 'Q2 2026 Outreach',
  businessId: bizUser.businessId,
  batchSize: 50,
  delayMs: 500,
});

if (result.ok) {
  console.log(`Sent to ${result.successCount} recipients`);
} else {
  console.error(`Failed: ${result.error}`);
}
```

#### CampaignsPage Integration
```typescript
import { sendCampaignEmails } from '@/app/lib/resendService';

const result = await sendCampaignEmails({
  recipients: segmentedList,
  subject: campaign.subject,
  content: campaign.content,
  htmlContent: campaign.htmlTemplate,
  template: 'campaign',
  campaignId: campaign.id,
  businessId: bizUser.businessId,
  trackOpens: true,
  trackClicks: true,
});
```

#### Direct Messages (SendMessageModal)
```typescript
import { sendDirectMessage } from '@/app/lib/resendService';

const result = await sendDirectMessage({
  to: { email: recipient.email, name: recipient.name },
  subject: 'Your Message',
  body: messageContent,
  channel: 'email', // or 'sms', 'whatsapp'
  toPhone: recipient.phone,
  businessId: bizUser.businessId,
});
```

## 📊 Email Metrics & Tracking

### Campaign Analytics
```typescript
import { getCampaignStats } from '@/app/lib/resendService';

const stats = await getCampaignStats(campaignId);
// Returns: { opens: 45, clicks: 12 }

// Display metrics
const openRate = (stats.opens / totalSent) * 100;
const clickRate = (stats.clicks / stats.opens) * 100;
```

### Tracking Implementation
- **Opens** - Tracked via pixel in email HTML (automatic)
- **Clicks** - Tracked by wrapping links with tracking URLs
- **Bounces** - Integrated with Resend webhook handlers
- **Unsubscribes** - Automatic via email preferences table

## 🔧 Configuration Options

### Campaign Email Payload
```typescript
interface CampaignEmailPayload {
  recipients: EmailRecipient[];        // Array of { email, name, properties }
  subject: string;                    // Email subject
  template: 'campaign' | 'promotional' | 'newsletter' | 'announcement';
  content: string;                    // Plain text content
  htmlContent?: string;               // Custom HTML (optional)
  campaignId?: string;                // Track in database
  businessId: string;                 // Required for multi-tenancy
  replyTo?: string;                   // Defaults to VITE_RESEND_REPLY_TO
  trackOpens?: boolean;               // Default: true
  trackClicks?: boolean;              // Default: true
}
```

### Bulk Outreach Payload
```typescript
interface BulkOutreachPayload {
  recipients: EmailRecipient[];        // Up to 10,000+
  subject: string;
  template: 'invitation' | 'introduction' | 'partnership' | 'feature_launch';
  content: string;
  htmlContent?: string;
  businessId: string;
  campaignName: string;
  batchSize?: number;                 // Default: 50
  delayMs?: number;                   // Default: 500ms between batches
}
```

### Direct Message Payload
```typescript
interface DirectMessagePayload {
  to: EmailRecipient;
  subject: string;
  body: string;
  htmlBody?: string;
  businessId: string;
  channel: 'email' | 'whatsapp' | 'sms';
  toPhone?: string;                   // For SMS/WhatsApp
}
```

## 📧 Email Template Customization

### Use Built-in Templates
```typescript
const result = await sendCampaignEmails({
  recipients,
  subject,
  content,
  template: 'promotional', // Automatic HTML generation
  // ... rest of payload
});
```

### Custom HTML Templates
```typescript
const customHtml = `
<html>
  <body>
    <h1>Custom Content</h1>
    <p>Your custom HTML here</p>
    <a href="https://example.com/click-track">Click me</a>
  </body>
</html>
`;

const result = await sendCampaignEmails({
  recipients,
  subject,
  content,
  htmlContent: customHtml, // Overrides template
  // ... rest of payload
});
```

## ⚡ Rate Limiting & Best Practices

### Resend API Limits
- **Free plan**: 3,000 emails/month
- **Pro plan**: 10,000 emails/month (pay-as-you-go)
- **Rate**: ~100 emails/second per API key

### Best Practices
1. **Use bulk functions for large lists** (1000+ recipients)
2. **Implement batching** for better reliability
3. **Monitor delivery rates** and adjust delay times if needed
4. **Segment audiences** for better targeting
5. **A/B test subject lines** before full sends
6. **Respect unsubscribes** - check preferences before sending
7. **Keep lists clean** - remove bounced emails regularly

### Batch Configuration
```typescript
// For 10,000 recipients with 500ms delays:
// Time = (10,000 / 50) * 0.5s = 100 seconds (~1.5 minutes)
const result = await sendBulkOutreach({
  recipients: largeList,
  // ... other fields
  batchSize: 50,     // 50 emails per batch
  delayMs: 500,      // 500ms delay between batches
});

// For faster sends (if needed):
// batchSize: 100, delayMs: 300 // ~30 seconds for 10k

// For reliability on noisy networks:
// batchSize: 25, delayMs: 1000 // ~7 minutes for 10k
```

## 🔐 Security & Compliance

### GDPR Compliance
- ✅ Unsubscribe links in every email (automatic)
- ✅ Preference centers for email frequency
- ✅ Easy list removal with `removeFromList()`
- ✅ Track consent in email_preferences

### Deliverability
- ✅ SPF/DKIM configured with Resend
- ✅ Bounce handling automatic
- ✅ Complaint handling via Resend webhooks
- ✅ Spam filtering built-in

### Multi-Tenancy
- ✅ All tables have `business_id` field
- ✅ RLS policies enforce business-level access
- ✅ Businesses cannot see other businesses' emails

## 🧪 Testing

### Local Development
```typescript
// If RESEND_API_KEY not set, console logs will show intended behavior
// Useful for testing without consuming API credits
```

### Staging Testing
```typescript
// Use test email: test@resend.dev
// Resend allows unlimited test emails
const result = await sendCampaignEmails({
  recipients: [{ email: 'test@resend.dev' }],
  // ...
});
```

### Production Deployment
1. Set RESEND_API_KEY in Vercel environment variables
2. Deploy edge functions: `supabase functions deploy send-campaign-email`
3. Deploy edge functions: `supabase functions deploy bulk-outreach-email`
4. Verify database schema is deployed
5. Test with small batch first

## 📝 Implementation Checklist

- [ ] Resend account created and API key obtained
- [ ] Environment variables configured (.env and Vercel)
- [ ] Supabase edge functions deployed
- [ ] Database schema deployed
- [ ] OutreachPage updated to use `sendBulkOutreach()`
- [ ] CampaignsPage updated to use `sendCampaignEmails()`
- [ ] SendMessageModal updated to use `sendDirectMessage()`
- [ ] Email preferences modal created for list management
- [ ] Analytics dashboard shows email metrics
- [ ] Unsubscribe endpoint implemented (/api/unsubscribe)
- [ ] Tested with small batch (10 emails)
- [ ] Tested with medium batch (100 emails)
- [ ] Tested with large batch (1000+ emails)
- [ ] Verified email delivery to real inboxes
- [ ] Verified tracking (opens/clicks) working
- [ ] Production deployment completed

## 🆘 Troubleshooting

### Emails not sending
- Check RESEND_API_KEY in Supabase secrets
- Verify sender domain is verified on Resend
- Check Resend API status: https://status.resend.com
- Review console logs in Supabase functions

### High bounce rates
- Check email list quality
- Verify sender reputation at Resend dashboard
- Review bounce reasons in email_tracking table
- Re-validate email addresses before sending

### Tracking not working
- Ensure email_tracking table has correct campaign_id
- Check if trackOpens/trackClicks is enabled
- Verify tracking pixel is in HTML email
- Check browser network tab for tracking requests

### Rate limiting errors
- Reduce batchSize to 25-30 emails per batch
- Increase delayMs to 1000-2000ms
- Check Resend API key rate limits
- Consider upgrading Resend plan if needed

## 📚 Additional Resources

- Resend Docs: https://resend.com/docs
- Resend API Reference: https://resend.com/docs/api-reference
- Email Template Examples: https://resend.com/templates
- SPF/DKIM Setup: https://resend.com/docs/knowledge-base/spf-dkim

## 🎯 Next Steps

1. **Get Resend API key** from https://resend.com
2. **Set environment variables** in .env and Vercel
3. **Deploy database schema** in Supabase
4. **Deploy edge functions** via Supabase CLI
5. **Update components** to use resendService functions
6. **Test end-to-end** with small batch
7. **Monitor delivery** via Resend dashboard
8. **Optimize based on metrics** (open rates, click rates, etc.)

---

**Implementation Status**: Ready for component integration and testing
**Deployment Status**: Pending environment variable configuration

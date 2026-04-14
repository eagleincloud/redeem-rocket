# Resend Email Templates & Webhooks Setup Guide

Complete guide for setting up Resend email templates and webhook integration for production email tracking and bounce handling.

---

## 📋 Prerequisites

- ✅ Resend account at https://resend.com
- ✅ Resend API Key: `re_KXQtkqkj_Psy3qxwTh8pE4GftxeQf85iZ`
- ✅ Domain verified in Resend (noreply@redeemrocket.in)
- ✅ Supabase project configured

---

## Part 1: Email Templates in Resend

Email templates are pre-built, reusable email designs that you can send via API. They improve send times and maintain consistent branding.

### Step 1: Create Welcome Email Template

1. Go to **Resend Dashboard** → https://resend.com/templates
2. Click **+ New Template**
3. Choose template name: `welcome-email`
4. Click **Edit**
5. Replace the default HTML with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Redeem Rocket</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);">
              <h1 style="margin: 0; color: white; font-size: 28px;">Welcome to Redeem Rocket! 🚀</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Hi <strong>{{user_name}}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Welcome to Redeem Rocket! We're excited to have you on board. Your account has been created and you can now start managing your business, customers, and rewards.
              </p>
              <p style="margin: 0 0 30px; color: #333; font-size: 16px; line-height: 1.6;">
                <strong>Next Steps:</strong>
              </p>
              <ul style="margin: 0 0 30px; padding-left: 20px; color: #333; font-size: 16px; line-height: 1.8;">
                <li>Complete your profile</li>
                <li>Add your first product or service</li>
                <li>Create a customer loyalty program</li>
                <li>Send your first campaign</li>
              </ul>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 30px; background: #7c3aed; border-radius: 6px;">
                    <a href="{{dashboard_url}}" style="color: white; text-decoration: none; font-weight: 600; display: block;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background: #f9f9f9; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 0 0 10px;">© 2026 Redeem Rocket. All rights reserved.</p>
              <p style="margin: 0;">
                <a href="{{unsubscribe_url}}" style="color: #7c3aed; text-decoration: none;">Unsubscribe</a> |
                <a href="{{preferences_url}}" style="color: #7c3aed; text-decoration: none;">Manage Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

6. Click **Save Template**
7. Copy the **Template ID** (format: `t_xxx...`)

### Step 2: Create Campaign Email Template

1. Click **+ New Template** again
2. Name: `campaign-email`
3. Replace with your campaign template HTML (use similar structure above)
4. Copy the **Template ID**

### Step 3: Create Transactional Email Template

1. Click **+ New Template** again
2. Name: `transactional-email`
3. Use a minimal design for transactional emails (OTPs, resets, etc.)
4. Copy the **Template ID**

---

## Part 2: Webhook Setup for Email Events

Webhooks allow Resend to send real-time notifications about email deliveries, bounces, opens, and clicks.

### Step 1: Get Your Webhook URL

Your webhook endpoint is:
```
https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/resend-webhook
```

**Note:** This is automatically set up via the `resend-webhook` edge function we created.

### Step 2: Create Webhook in Resend

1. Go to **Resend Dashboard** → **Settings** → **Webhooks**
2. Click **+ New Webhook**
3. **Endpoint URL:** Paste the webhook URL above
4. **Select Events:**
   - ✅ `email.sent` — Email was accepted by Resend
   - ✅ `email.delivered` — Email successfully delivered to recipient
   - ✅ `email.opened` — Recipient opened the email (tracking)
   - ✅ `email.clicked` — Recipient clicked a link (tracking)
   - ✅ `email.bounced` — Email bounced (invalid address, etc.)
   - ✅ `email.complained` — Recipient marked as spam

5. Click **Create Webhook**
6. **Important:** Copy the **Signing Secret** (looks like `whsec_xxx...`)

### Step 3: Set Webhook Secret in Supabase

The webhook uses a signing secret for security verification. Set it as a Supabase secret:

**Option A: Using Supabase Dashboard**
1. Go to Supabase Dashboard → **Settings** → **Secrets**
2. Click **+ New Secret**
3. Name: `RESEND_WEBHOOK_SECRET`
4. Value: Paste the signing secret from Resend
5. Click **Add Secret**

**Option B: Using CLI**
```bash
supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxx...
supabase functions deploy resend-webhook
```

---

## Part 3: Database Migration

The email tracking infrastructure requires database tables. Run the migration:

```bash
# Push the migration to Supabase
supabase db push

# Or apply manually via Supabase SQL Editor:
# Copy contents of: supabase/migrations/20260414_enhance_email_tracking.sql
# Paste in Supabase Dashboard → SQL Editor → Execute
```

### What This Creates:

1. **email_tracking** — Records all email events (opens, clicks, bounces, etc.)
2. **email_suppressions** — Auto-managed list of bounced/complained emails
3. **email_tracking_stats** — View for campaign statistics
4. **suppress_email_on_event()** — Automatic trigger to suppress bounces/complaints

---

## Part 4: Integration in Code

### Using Email Templates

Update your edge functions to use templates:

```typescript
// supabase/functions/send-campaign-email/index.ts

const result = await resend.emails.send({
  from: 'noreply@redeemrocket.in',
  to: recipientEmail,
  template: 'welcome-email',  // Use template ID here
  props: {
    user_name: 'John Doe',
    dashboard_url: 'https://www.redeemrocket.in/dashboard',
    unsubscribe_url: 'https://www.redeemrocket.in/unsubscribe?email=' + recipientEmail,
  }
});
```

### Checking Suppressed Emails

Before sending a campaign, filter out suppressed addresses:

```typescript
import { filterActiveRecipients } from './suppressionService';

// Get recipients
const recipients = [
  { email: 'john@example.com', name: 'John' },
  { email: 'jane@example.com', name: 'Jane' },
];

// Filter out suppressed emails
const activeRecipients = await filterActiveRecipients(recipients);

console.log(`Sending to ${activeRecipients.length} of ${recipients.length} addresses`);
```

### Checking Campaign Stats

```typescript
import { getCampaignStats } from './resendService';

const stats = await getCampaignStats(campaignId);
console.log(`Opens: ${stats?.opens}, Clicks: ${stats?.clicks}`);
```

---

## Part 5: Testing

### Test Email Sending

1. Navigate to your app: https://www.redeemrocket.in
2. Go to **Outreach** → **Send Email**
3. Enter a test email address
4. Click **Send**
5. Check Resend Dashboard → **Emails** to see the email status

### Test Webhook

1. Go to Resend Dashboard → **Webhooks**
2. Find your webhook
3. Click **Send Test Event**
4. Go to Supabase Dashboard → **SQL Editor**
5. Run: `SELECT * FROM email_tracking ORDER BY event_time DESC LIMIT 5;`
6. Verify test event appears in the table

### Monitor Email Events

In Supabase, check real-time events:

```sql
-- See all events for a campaign
SELECT * FROM email_tracking WHERE campaign_id = 'xxx' ORDER BY event_time DESC;

-- Get campaign statistics
SELECT * FROM email_tracking_stats WHERE campaign_id = 'xxx';

-- Check suppression list
SELECT * FROM email_suppressions ORDER BY suppressed_at DESC;
```

---

## Part 6: Production Checklist

- [ ] Verify domain in Resend (noreply@redeemrocket.in)
- [ ] Create email templates in Resend
- [ ] Set up webhooks in Resend
- [ ] Add RESEND_WEBHOOK_SECRET to Supabase
- [ ] Run database migration (email_tracking tables)
- [ ] Test email sending with real recipient
- [ ] Verify webhook receives events (check email_tracking table)
- [ ] Configure suppression list (auto-populated on bounces)
- [ ] Set up email templates in your edge functions
- [ ] Add suppression checks before sending campaigns

---

## Troubleshooting

### Webhook Not Receiving Events
1. Verify endpoint URL is correct and publicly accessible
2. Check webhook logs in Resend Dashboard
3. Ensure RESEND_WEBHOOK_SECRET is set in Supabase
4. Verify database connection in edge function

### Emails Not Sending
1. Verify API key is set: `VITE_RESEND_API_KEY` in Vercel
2. Check domain is verified in Resend
3. Monitor email rate limits (may need upgrade)
4. Check Resend Dashboard → Emails for errors

### Email Tracking Not Working
1. Verify email_tracking table exists: `SELECT * FROM email_tracking LIMIT 1;`
2. Run database migration if table missing
3. Check webhook is properly configured
4. Test webhook with "Send Test Event"

### Bounces Not Auto-Suppressed
1. Verify email_suppressions table exists
2. Check trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_suppress_email_on_event';`
3. Manually test trigger with SQL
4. Monitor bounce events in webhook logs

---

## Performance Optimization

### Index Database

Already included in migration, but verify:

```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'email_tracking';
```

### Archive Old Events

For high-volume campaigns, archive old tracking data:

```sql
-- Archive events older than 90 days
CREATE TABLE email_tracking_archive AS
SELECT * FROM email_tracking WHERE event_time < NOW() - INTERVAL '90 days';

DELETE FROM email_tracking WHERE event_time < NOW() - INTERVAL '90 days';
```

---

## Support & Resources

- **Resend Docs:** https://resend.com/docs
- **Resend API Keys:** https://resend.com/api-keys
- **Resend Webhooks:** https://resend.com/webhooks
- **Supabase Docs:** https://supabase.com/docs

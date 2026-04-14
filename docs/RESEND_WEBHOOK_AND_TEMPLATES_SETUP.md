# Resend Webhook & Email Templates Setup

Complete guide for setting up webhooks and email templates in Resend for production email tracking and campaigns.

---

## 🎯 Overview

**What we're setting up:**
1. ✅ Email webhook for real-time event tracking (opens, clicks, bounces)
2. ✅ Three professional email templates (Welcome, Campaign, Transactional)
3. ✅ Webhook signing secret in Supabase

**What it enables:**
- 📊 Track email opens and clicks
- 🚫 Auto-suppress bounces and complaints
- 📈 Campaign performance analytics
- 🎯 Personalized email templates

---

## 📋 **Step 1: Create Resend Webhook** (5 minutes)

### 1.1 Navigate to Resend Webhooks

1. Go to **https://resend.com/webhooks**
2. Log in with your Resend account
3. You should see "Webhooks" page

### 1.2 Create New Webhook

1. Click **+ New Webhook** (or **Add Webhook**)
2. Fill in the details:

   **Endpoint URL:**
   ```
   https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/resend-webhook
   ```

   **Events to enable (check all):**
   - ✅ `email.sent` — Email accepted by Resend
   - ✅ `email.delivered` — Successfully delivered to recipient
   - ✅ `email.opened` — Recipient opened email
   - ✅ `email.clicked` — Recipient clicked a link
   - ✅ `email.bounced` — Email bounced (invalid address)
   - ✅ `email.complained` — Marked as spam

3. Click **Create Webhook**

### 1.3 Copy Signing Secret

1. After creation, you should see your webhook listed
2. Click the webhook to view details
3. **Copy the Signing Secret** (format: `whsec_xxx...`)
4. Save it somewhere safe - you'll need it for the next step

---

## 🔐 **Step 2: Add Webhook Secret to Supabase** (2 minutes)

### Option A: Via Supabase Dashboard (Recommended)

1. Go to **https://app.supabase.com**
2. Select your project
3. Click **Settings** → **Secrets and Environment Variables** (or **Secrets**)
4. Click **+ Add Secret**
5. Fill in:
   - **Name:** `RESEND_WEBHOOK_SECRET`
   - **Value:** Paste the signing secret you copied from Resend
6. Click **Add Secret**

### Option B: Via Supabase CLI (When Available)

```bash
supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxx...
```

✅ **Done!** Your webhook is now ready to receive email events.

---

## 🎨 **Step 3: Create Email Templates** (15 minutes)

Email templates are pre-designed, reusable email layouts. This speeds up sending and keeps branding consistent.

### 3.1 Create Welcome Email Template

1. Go to **https://resend.com/templates**
2. Click **+ New Template** (or **Create Template**)
3. **Template Name:** `welcome-email`
4. **Click Edit** to enter template builder

**Copy and paste this HTML:**

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
          <!-- Header with gradient -->
          <tr>
            <td style="padding: 40px 30px; background: linear-gradient(135deg, #FF9E64 0%, #FFAB61 100%);">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Welcome to Redeem Rocket! 🚀</h1>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Hi {{user_name}},
              </p>
              <p style="margin: 0 0 20px; color: #333; font-size: 16px; line-height: 1.6;">
                Welcome to Redeem Rocket! Your account has been created successfully. You're now ready to:
              </p>
              <ul style="margin: 0 0 30px; padding-left: 20px; color: #333; font-size: 16px; line-height: 1.8;">
                <li>Manage your business products and services</li>
                <li>Create customer loyalty programs</li>
                <li>Launch email campaigns</li>
                <li>Track customer engagement</li>
              </ul>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 12px 30px; background: #FF9E64; border-radius: 6px;">
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
                <a href="{{unsubscribe_url}}" style="color: #FF9E64; text-decoration: none;">Unsubscribe</a> |
                <a href="{{preferences_url}}" style="color: #FF9E64; text-decoration: none;">Manage Preferences</a>
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

5. Click **Save Template**
6. **Copy the Template ID** (looks like `t_xxx...`) and save it

### 3.2 Create Campaign Email Template

1. Click **+ New Template** again
2. **Template Name:** `campaign-email`
3. **Click Edit**

**Use similar HTML as above** but modify for campaigns:
- Change title to: `Campaign - {{campaign_name}}`
- Change content to be more generic for multiple campaigns
- Keep the same structure and styling

### 3.3 Create Transactional Email Template

1. Click **+ New Template** again
2. **Template Name:** `transactional-email`
3. **Click Edit**

**Use this simpler template for transactional emails (OTPs, confirmations):**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background: white; border-radius: 6px; overflow: hidden;">
          <tr>
            <td style="padding: 30px; text-align: center;">
              <h2 style="margin: 0 0 20px; color: #333; font-size: 22px;">{{title}}</h2>
              <p style="margin: 0 0 30px; color: #666; font-size: 16px; line-height: 1.6;">
                {{content}}
              </p>
              <div style="background: #f0f0f0; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; color: #999; font-size: 12px;">CODE:</p>
                <p style="margin: 0; color: #FF9E64; font-size: 28px; font-weight: bold; letter-spacing: 2px;">
                  {{code}}
                </p>
              </div>
              <p style="margin: 0; color: #999; font-size: 12px;">
                This code expires in {{expiry_time}}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px; background: #f9f9f9; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee;">
              <p style="margin: 0;">© 2026 Redeem Rocket</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

4. Click **Save Template**
5. **Copy the Template ID** and save it

---

## 📝 **Step 4: Update Edge Functions with Template IDs** (Optional)

If you want to use the templates in your edge functions, update them with the template IDs:

In `supabase/functions/send-campaign-email/index.ts`:

```typescript
const result = await resend.emails.send({
  from: 'noreply@redeemrocket.in',
  to: recipientEmail,
  template: 'welcome-email', // Use template ID here
  props: {
    user_name: 'John Doe',
    dashboard_url: 'https://www.redeemrocket.in/dashboard',
    unsubscribe_url: '...',
  }
});
```

---

## ✅ **Step 5: Verify Everything Works** (5 minutes)

### Test the Webhook

1. Go back to **Resend Webhooks**
2. Find your webhook in the list
3. Click on it to see details
4. Scroll down to **"Send test event"** section
5. Click **Send test event**
6. Select event type: `email.opened` or `email.delivered`
7. Click **Send**

### Verify in Supabase

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query to check if webhook received the event:

```sql
SELECT * FROM email_tracking ORDER BY event_time DESC LIMIT 5;
```

3. You should see the test event recorded!

---

## 🧪 **Step 6: Test Email Sending** (Live Testing)

1. Log into your app: **https://www.redeemrocket.in**
2. Go to **Outreach** → **Send Email**
3. Send a test email to yourself
4. Check your inbox for the email
5. Open it to trigger the `email.opened` event
6. Back in Supabase, run the query above again
7. You should see both `email.sent` and `email.opened` events!

---

## 📊 **Monitor Email Events**

To see all your email tracking data:

```sql
-- View all email events
SELECT * FROM email_tracking ORDER BY event_time DESC;

-- View campaign statistics
SELECT * FROM email_tracking_stats;

-- View suppressed emails (bounces/complaints)
SELECT * FROM email_suppressions;

-- Get opens and clicks for a specific email
SELECT event_type, COUNT(*) as count 
FROM email_tracking 
WHERE recipient_email = 'user@example.com'
GROUP BY event_type;
```

---

## 🔄 **Webhook Events Explained**

| Event | Meaning | Action |
|-------|---------|--------|
| `email.sent` | Email accepted by Resend | Recorded in database |
| `email.delivered` | Successfully sent to recipient | Delivery confirmed |
| `email.opened` | Email opened by recipient | Tracked for analytics |
| `email.clicked` | Link clicked in email | Engagement metric |
| `email.bounced` | Email failed to deliver | Auto-suppressed |
| `email.complained` | Marked as spam | Auto-suppressed |

---

## 🔒 **Security Notes**

✅ **Webhook Signature Verification:**
- Your edge function verifies webhook signatures using `RESEND_WEBHOOK_SECRET`
- Only authentic events from Resend are processed
- Prevents spoofing and unauthorized data

✅ **Data Protection:**
- Email addresses in suppression list are encrypted
- Access controlled via Supabase RLS policies
- Only authenticated users can view their campaign data

---

## ⚡ **Troubleshooting**

### Webhook Not Receiving Events

**Problem:** Test events don't appear in database

**Solutions:**
1. Verify webhook URL is correct: `https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/resend-webhook`
2. Check `RESEND_WEBHOOK_SECRET` is set in Supabase
3. Verify Supabase project is not paused
4. Check edge function logs for errors

### Email Not Being Sent

**Problem:** Email sending returns error

**Solutions:**
1. Verify `VITE_RESEND_API_KEY` is set in Vercel
2. Check Resend API key is valid at https://resend.com/api-keys
3. Verify recipient email format is valid
4. Check email is not in suppression list

### Template Not Showing Up

**Problem:** Template ID not working

**Solutions:**
1. Verify template was saved (look for Template ID)
2. Ensure template HTML is valid
3. Check template is in `welcome-email` format (lowercase with hyphens)
4. Copy exact Template ID from Resend

---

## 📚 **Resources**

- **Resend Docs:** https://resend.com/docs
- **Resend API Keys:** https://resend.com/api-keys
- **Resend Webhooks:** https://resend.com/webhooks
- **Email Template Tips:** https://resend.com/docs/templates
- **SMTP Settings:** https://resend.com/docs/send-with-smtp

---

## ✅ **Completion Checklist**

- [ ] Created Resend webhook with correct URL
- [ ] Copied and saved webhook signing secret
- [ ] Added `RESEND_WEBHOOK_SECRET` to Supabase
- [ ] Created `welcome-email` template
- [ ] Created `campaign-email` template
- [ ] Created `transactional-email` template
- [ ] Saved all template IDs
- [ ] Sent test webhook event
- [ ] Verified event appears in `email_tracking` table
- [ ] Tested live email sending
- [ ] Verified open/click tracking works

---

🎉 **You're all set!** Your email infrastructure is now production-ready with full tracking, templates, and webhook integration.

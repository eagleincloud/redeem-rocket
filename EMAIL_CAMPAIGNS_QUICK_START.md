# Email Campaigns - Quick Start Guide

## 5-Minute Setup

### Step 1: Database Migration
The schema is already created. Verify tables exist:

```bash
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2
npx supabase db list
```

Should see:
- email_campaigns
- email_sequences
- email_templates
- email_tracking
- email_segments
- email_provider_config
- email_unsubscribes
- email_ab_tests
- email_bounces

### Step 2: Configure Email Provider

```typescript
// In your app, configure a provider:
import { setupEmailProvider } from '@/app/api/email';

const provider = await setupEmailProvider(businessId, {
  provider_type: 'resend',
  provider_name: 'Production',
  config_json: {
    api_key: process.env.RESEND_API_KEY,
    domain: 'emails.example.com'
  },
  is_primary: true,
  is_active: false // Set to true after verification
});
```

### Step 3: Verify Provider
```typescript
import { verifyEmailProvider } from '@/app/api/email';

const result = await verifyEmailProvider(
  provider.id,
  'test@your-domain.com'
);

if (result.success) {
  console.log('Provider verified!');
}
```

### Step 4: Create a Campaign
```typescript
import { createCampaign } from '@/app/api/email';

const campaign = await createCampaign(businessId, {
  name: 'Welcome Series',
  subject: 'Welcome to our platform!',
  body: '<h1>Hello {name}</h1><p>Get started now...</p>',
  from_name: 'Your Company',
  reply_to: 'support@yourcompany.com',
  status: 'draft'
});
```

### Step 5: Add to Routes
```typescript
// In src/business/routes.tsx
import EmailCampaignsPage from './components/Email';

// Add route:
{ path: 'email', element: <EmailCampaignsPage businessId={businessId} />, ... }
```

---

## Using the UI

### Access Email Campaigns
Navigate to: `/app/email`

### Main Pages

#### 1. Campaigns Tab
- View all campaigns
- Filter by status
- Click campaign to see analytics
- Create new campaign

#### 2. Providers Tab
- View all providers
- Set primary provider
- Configure new provider
- Test delivery

#### 3. Analytics Tab (when campaign selected)
- View key metrics
- See engagement funnel
- Check daily breakdown
- Monitor bounce rate

---

## API Usage Examples

### Send Campaign to Segment
```typescript
import { 
  createCampaign, 
  getEmailSegments,
  getCampaignTracking 
} from '@/app/api/email';

// 1. Get segment members
const { segments } = await getEmailSegments(businessId);
const segment = segments[0];

// 2. Create campaign
const campaign = await createCampaign(businessId, {
  name: 'Flash Sale',
  subject: '50% Off Today Only!',
  body: '...',
  segment_id: segment.id,
  status: 'scheduled'
});

// 3. Send immediately (via automation engine)
// Integrate with your automation system
```

### Track Email Metrics
```typescript
import { 
  getCampaignAnalytics,
  getCampaignTracking 
} from '@/app/api/email';

// Get summary metrics
const analytics = await getCampaignAnalytics(campaignId);
console.log(`Open rate: ${analytics.open_rate}%`);
console.log(`Click rate: ${analytics.click_rate}%`);

// Get detailed tracking
const { tracking } = await getCampaignTracking(campaignId);
tracking.forEach(record => {
  console.log(`${record.recipient_email}: opened=${record.opened}`);
});
```

### Create Multi-Step Sequence
```typescript
import { createSequence } from '@/app/api/email';

const sequence = await createSequence(businessId, {
  name: 'Onboarding',
  trigger_type: 'signup',
  is_active: true,
  steps: [
    {
      step_number: 1,
      delay_days: 0,
      subject: 'Welcome!',
      body: 'Thanks for signing up...'
    },
    {
      step_number: 2,
      delay_days: 2,
      subject: 'Getting Started',
      body: 'Here are the basics...'
    },
    {
      step_number: 3,
      delay_days: 5,
      subject: 'Advanced Tips',
      body: 'Now that you know basics...'
    }
  ]
});
```

### Handle Unsubscribes
```typescript
import { 
  addUnsubscribe,
  isEmailUnsubscribed 
} from '@/app/api/email';

// Check if email is unsubscribed
const unsubscribed = await isEmailUnsubscribed(businessId, email);

if (!unsubscribed) {
  // Send campaign
}

// Add to unsubscribe list
await addUnsubscribe(businessId, email, 'marketing');
```

---

## Email Tracking Setup

### 1. Open Tracking
Add this pixel to your email body:
```html
<img src="/api/email/track?campaign={campaignId}&email={recipientEmail}&event=open" 
     width="1" height="1" alt="" />
```

### 2. Click Tracking
Wrap links in redirect:
```html
<a href="/api/email/track-click?campaign={campaignId}&email={recipientEmail}&url={linkUrl}&index=0">
  Click here
</a>
```

### 3. Programmatic Tracking
```typescript
import { 
  trackEmailOpen,
  trackEmailClick 
} from '@/app/api/email';

// Track open
await trackEmailOpen(campaignId, email, {
  clientName: 'Gmail',
  ipAddress: '192.168.1.1'
});

// Track click
await trackEmailClick(campaignId, email, 'https://example.com', 0);
```

---

## Provider-Specific Setup

### Resend
1. Get API key from [dashboard.resend.com](https://dashboard.resend.com)
2. Verify domain
3. Add to environment: `RESEND_API_KEY=re_xxxxx`

### SMTP (Gmail)
1. Enable 2-factor authentication
2. Generate app password
3. Host: `smtp.gmail.com`
4. Port: `587`
5. Use TLS

### AWS SES
1. Set region (e.g., `us-east-1`)
2. Verify domain or email
3. Get IAM credentials
4. Request production access if in sandbox

### SendGrid
1. Get API key from [sendgrid.com](https://sendgrid.com)
2. Create sender identity
3. Verify domain

---

## Testing

### Send Test Email
```typescript
import { sendTestEmail } from '@/app/api/email';

const result = await sendTestEmail(
  providerId,
  'your-email@example.com'
);

if (result.success) {
  console.log('Test email sent!');
}
```

### Test Campaign
```typescript
const testCampaign = await createCampaign(businessId, {
  // ... campaign data
  is_test: true  // Mark as test
});
```

---

## Common Tasks

### Change Primary Provider
```typescript
import { setPrimaryEmailProvider } from '@/app/api/email';

await setPrimaryEmailProvider(businessId, newProviderId);
```

### Update Campaign
```typescript
import { updateCampaign } from '@/app/api/email';

await updateCampaign(campaignId, {
  subject: 'Updated Subject',
  body: 'Updated content...',
  status: 'scheduled'
});
```

### Delete Campaign
```typescript
import { deleteCampaign } from '@/app/api/email';

await deleteCampaign(campaignId);
```

### Get All Campaigns for Business
```typescript
import { getCampaigns } from '@/app/api/email';

const { campaigns, total } = await getCampaigns(businessId, {
  status: 'sent',
  limit: 50
});
```

---

## Performance Tips

1. **Use Segments**
   - Pre-segment users before sending
   - Reduces send time
   - Better targeting

2. **Template Variables**
   - Use {name}, {email}, {company}
   - Increases engagement
   - Easy to implement

3. **Batch Operations**
   - Send in batches (1000 at a time)
   - Avoid rate limits
   - Monitor daily limits

4. **Cache Templates**
   - Load templates once
   - Reuse across campaigns
   - Reduce DB queries

---

## Troubleshooting

### Emails Not Sending
1. Check provider `is_active` and `is_verified`
2. Verify API key/credentials
3. Check rate limits
4. Review `last_error` field

### Low Open Rate
1. Check subject line quality
2. Verify from name
3. Test on different clients
4. Segment audience better

### Links Not Tracking
1. Verify tracking pixel in body
2. Check link format
3. Enable click tracking redirect
4. Test with test email

### High Bounce Rate
1. Verify email list quality
2. Check sender reputation
3. Review bounce types (hard vs soft)
4. Remove bounced addresses

---

## Next Steps

1. Configure your first provider
2. Create a test campaign
3. Send to test audience
4. Monitor analytics
5. Create email sequences
6. Integrate with automation engine
7. Set up lead nurturing workflows

---

## Resources

- **Full API Docs**: See `/src/app/api/email.ts`
- **Component Docs**: See `/src/business/components/Email/`
- **Type Definitions**: See `/src/business/types/email.ts`
- **Implementation Guide**: See `EMAIL_CAMPAIGNS_IMPLEMENTATION.md`

# Edge Functions API Reference

Complete API documentation for `send-campaign-email` and `bulk-outreach-email` functions.

---

## Base URL

```
https://YOUR_SUPABASE_PROJECT_ID.supabase.co/functions/v1
```

Replace `YOUR_SUPABASE_PROJECT_ID` with your actual Supabase project ID.

---

## Authentication

All requests must include authentication headers:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-campaign-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

Get `YOUR_ANON_KEY` from:
- Supabase Dashboard → Settings → API
- Or from your `.env`: `VITE_SUPABASE_ANON_KEY`

---

## Endpoint: POST /send-campaign-email

Send email campaigns to a list of recipients with optional tracking.

### Request

```bash
POST /send-campaign-email
Content-Type: application/json
Authorization: Bearer YOUR_ANON_KEY
```

### Request Body

```typescript
{
  recipients: Array<{
    email: string;                    // Required: recipient email
    name?: string;                    // Optional: recipient name for personalization
    properties?: Record<string, string>; // Optional: custom tags for Resend
  }>,
  subject: string;                    // Required: email subject
  htmlContent: string;                // Required: email HTML body
  content: string;                    // Required: email text fallback
  businessId: string;                 // Required: business identifier
  campaignId?: string;                // Optional: campaign ID for tracking
  replyTo?: string;                   // Optional: reply-to email address
  trackOpens?: boolean;               // Optional: track open events (future)
  trackClicks?: boolean;              // Optional: track click events (future)
}
```

### Request Example

```json
{
  "recipients": [
    {
      "email": "john@example.com",
      "name": "John Doe",
      "properties": {
        "tier": "gold",
        "region": "us-west"
      }
    },
    {
      "email": "jane@example.com",
      "name": "Jane Smith"
    }
  ],
  "subject": "Spring Sale - 30% Off Everything",
  "htmlContent": "<h1>Spring Sale</h1><p>Get 30% off all items this week!</p>",
  "content": "Spring Sale: Get 30% off all items this week!",
  "businessId": "biz_123456",
  "campaignId": "camp_spring_2026",
  "replyTo": "support@example.com"
}
```

### Response

**Success (200)**:
```json
{
  "ok": true,
  "batchId": "email_123456",
  "successCount": 2,
  "failedCount": 0,
  "accepted": ["john@example.com", "jane@example.com"],
  "rejected": [],
  "errors": []
}
```

**Partial Failure (200)**:
```json
{
  "ok": false,
  "batchId": "email_123456",
  "successCount": 1,
  "failedCount": 1,
  "accepted": ["john@example.com"],
  "rejected": ["invalid@example"],
  "errors": [
    {
      "email": "invalid@example",
      "error": "Invalid email address"
    }
  ]
}
```

**Bad Request (400)**:
```json
{
  "ok": false,
  "error": "recipients required"
}
```

**Server Error (500)**:
```json
{
  "ok": false,
  "error": "Internal server error"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Success indicator (all recipients accepted) |
| `batchId` | string? | Resend batch ID (if available) |
| `successCount` | number | Number of emails accepted |
| `failedCount` | number | Number of emails rejected |
| `accepted` | string[] | Array of accepted email addresses |
| `rejected` | string[] | Array of rejected email addresses |
| `errors` | object[] | Detailed error information |

### Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK (all or partial success) |
| 400 | Bad request (missing required fields) |
| 500 | Server error |

### Database Tracking

When `campaignId` is provided and emails are sent successfully, the function automatically inserts records into `outreach_email_tracking`:

```sql
-- Records inserted with:
INSERT INTO outreach_email_tracking (
  campaign_id,
  recipient_email,
  business_id,
  status,
  sent_at
) VALUES (...)
```

---

## Endpoint: POST /bulk-outreach-email

Send bulk emails with rate limiting and batching, ideal for large campaigns (1000+ recipients).

### Request

```bash
POST /bulk-outreach-email
Content-Type: application/json
Authorization: Bearer YOUR_ANON_KEY
```

### Request Body

```typescript
{
  recipients: Array<{
    email: string;                    // Required: recipient email
    name?: string;                    // Optional: recipient name
    properties?: Record<string, string>; // Optional: custom tags
  }>,
  subject: string;                    // Required: email subject
  htmlContent: string;                // Required: email HTML body
  content: string;                    // Required: email text fallback
  campaignName: string;               // Required: campaign name (creates record)
  businessId: string;                 // Required: business identifier
  batchSize?: number;                 // Optional: batch size (default: 50)
  delayMs?: number;                   // Optional: delay between batches (default: 500ms)
}
```

### Request Example

```json
{
  "recipients": [
    {"email": "user1@example.com", "name": "User 1"},
    {"email": "user2@example.com", "name": "User 2"},
    {"email": "user3@example.com", "name": "User 3"}
  ],
  "subject": "Monthly Newsletter - April 2026",
  "htmlContent": "<h1>April Newsletter</h1><p>News and updates from our team</p>",
  "content": "April Newsletter: News and updates from our team",
  "campaignName": "April 2026 Newsletter",
  "businessId": "biz_123456",
  "batchSize": 100,
  "delayMs": 1000
}
```

### Response

**Success (200)**:
```json
{
  "ok": true,
  "campaignId": "camp_uuid_12345",
  "successCount": 1000,
  "failedCount": 0,
  "accepted": ["user1@example.com", "user2@example.com", ...],
  "message": "Sent to 1000 recipients"
}
```

**Partial Failure (200)**:
```json
{
  "ok": false,
  "campaignId": "camp_uuid_12345",
  "successCount": 998,
  "failedCount": 2,
  "accepted": ["user1@example.com", ...],
  "message": "Sent to 998 recipients (2 failed)"
}
```

**Bad Request (400)**:
```json
{
  "ok": false,
  "error": "subject, htmlContent, campaignName, and businessId required"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `ok` | boolean | Success indicator (no failures) |
| `campaignId` | string? | Created campaign ID in database |
| `successCount` | number | Total emails sent successfully |
| `failedCount` | number | Total emails failed |
| `accepted` | string[] | Array of accepted email addresses |
| `message` | string | Human-readable status message |

### Campaign Record Created

When request succeeds, a record is created in `outreach_campaigns`:

```sql
INSERT INTO outreach_campaigns (
  campaign_name,
  business_id,
  status,
  total_recipients,
  sent_count,
  created_at
) VALUES (
  'April 2026 Newsletter',
  'biz_123456',
  'running',
  1000,
  998,
  NOW()
)
```

### Email Tracking

All sent emails are tracked in `outreach_email_tracking`:

```sql
INSERT INTO outreach_email_tracking (
  campaign_id,
  recipient_email,
  business_id,
  status,
  sent_at
) VALUES
  ('camp_uuid_12345', 'user1@example.com', 'biz_123456', 'sent', NOW()),
  ('camp_uuid_12345', 'user2@example.com', 'biz_123456', 'sent', NOW()),
  ...
```

### Performance Tuning

Adjust these parameters based on Resend rate limits:

```javascript
// Light load (few hundred recipients)
{ batchSize: 50, delayMs: 100 }

// Normal load (1000-5000 recipients)
{ batchSize: 50, delayMs: 500 }  // Default

// Heavy load (10,000+ recipients)
{ batchSize: 25, delayMs: 1000 }
```

---

## Using with TypeScript/JavaScript

### With Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Send campaign email
const { data, error } = await supabase.functions.invoke(
  'send-campaign-email',
  {
    body: {
      recipients: [{ email: 'test@example.com' }],
      subject: 'Test Campaign',
      htmlContent: '<h1>Hello</h1>',
      content: 'Hello',
      businessId: 'biz_123',
    },
  }
);

if (error) console.error('Error:', error);
else console.log('Success:', data);
```

### With Fetch API

```typescript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/send-campaign-email',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      recipients: [{ email: 'test@example.com' }],
      subject: 'Test',
      htmlContent: '<h1>Test</h1>',
      content: 'Test',
      businessId: 'biz_123',
    }),
  }
);

const result = await response.json();
console.log(result);
```

### Using resendService.ts

The project includes a complete service wrapper:

```typescript
import { resendService } from '@/app/lib/resendService';

// Send campaign email
await resendService.sendCampaignEmail({
  recipients: [{ email: 'test@example.com' }],
  subject: 'Campaign Title',
  htmlContent: '<h1>Hello</h1>',
  content: 'Hello',
  businessId: 'biz_123',
  campaignId: 'camp_456',
});

// Send bulk outreach
await resendService.sendBulkOutreach({
  recipients: largeEmailList,
  subject: 'Newsletter',
  htmlContent: '<h1>Newsletter</h1>',
  content: 'Newsletter',
  campaignName: 'April Newsletter',
  businessId: 'biz_123',
  batchSize: 100,
  delayMs: 500,
});
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `recipients required` | Empty or missing recipients array | Add at least one recipient |
| `subject required` | Missing subject field | Provide email subject |
| `businessId required` | Missing business identifier | Provide businessId |
| `Invalid email address` | Malformed email in recipients | Validate email format |
| `RESEND_API_KEY not set` | Key not configured in Supabase | Set via `supabase secrets set` |

### Dev Mode

When `RESEND_API_KEY` is not set, functions run in dev mode:
- No emails actually sent
- All requests return success (for testing)
- Logged to console: `[DEV] Would send campaign email to X recipients`

---

## Rate Limits

### Resend API Limits

- **Free tier**: 3,000 emails/month
- **Pro tier**: Higher limits based on plan

### Function Limits

- **Request timeout**: 600 seconds
- **Response size**: 6MB
- **Concurrent invocations**: Per Supabase plan

### Recommended Batching

For large campaigns, use `bulk-outreach-email`:

```
10,000 recipients → batchSize=50, delayMs=500 → ~167 batches → ~2.5 minutes
100,000 recipients → batchSize=25, delayMs=1000 → ~4000 batches → ~67 minutes
```

---

## Monitoring and Debugging

### View Function Logs

```bash
# Real-time logs
supabase logs pull --function=send-campaign-email --limit=100

# Filter by error
supabase logs pull --function=bulk-outreach-email | grep error
```

### Query Tracking Data

```sql
-- Check sent emails for campaign
SELECT recipient_email, status, sent_at
FROM outreach_email_tracking
WHERE campaign_id = 'camp_123'
LIMIT 10;

-- Campaign statistics
SELECT 
  campaign_id,
  COUNT(*) as total_sent,
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'opened') as opened
FROM outreach_email_tracking
GROUP BY campaign_id;
```

### Test with curl

```bash
# Send test campaign email
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-campaign-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "recipients": [{"email": "test@example.com"}],
    "subject": "Test",
    "htmlContent": "<h1>Test</h1>",
    "content": "Test",
    "businessId": "test"
  }'

# Response should be:
# {"ok":true,"successCount":1,"failedCount":0,"accepted":["test@example.com"],"rejected":[]}
```

---

## Examples

### Example 1: Simple Campaign Email

```typescript
const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipients: [
      { email: 'customer@example.com', name: 'John' }
    ],
    subject: 'Special Offer Just for You',
    htmlContent: '<h1>50% Off Sale</h1><p>This weekend only!</p>',
    content: '50% Off Sale - This weekend only!',
    businessId: 'pizza_shop_001'
  })
});
```

### Example 2: Bulk Newsletter with Personalization

```typescript
const recipients = await supabase
  .from('customers')
  .select('email, name, tier')
  .eq('business_id', businessId);

const response = await fetch(endpoint, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipients: recipients.data.map(r => ({
      email: r.email,
      name: r.name,
      properties: { tier: r.tier }
    })),
    subject: `Exclusive offer for ${tier} members`,
    htmlContent: generateHtmlTemplate(tier),
    content: 'Exclusive offer',
    campaignName: 'Q2 2026 Newsletter',
    businessId,
    batchSize: 100,
    delayMs: 500
  })
});
```

### Example 3: Tracking Sent Emails

```typescript
const { data } = await supabase.functions.invoke('send-campaign-email', {
  body: {
    recipients: emailList,
    subject: 'Campaign',
    htmlContent: '<h1>Campaign</h1>',
    content: 'Campaign',
    businessId: 'biz_123',
    campaignId: 'camp_456' // Enable tracking
  }
});

// Query results
if (data.ok) {
  const { data: tracking } = await supabase
    .from('outreach_email_tracking')
    .select('*')
    .eq('campaign_id', 'camp_456')
    .eq('status', 'sent');
  
  console.log(`Tracked ${tracking.length} sent emails`);
}
```

---

## Support and Resources

- **Resend Docs**: https://resend.com/docs
- **Supabase Functions**: https://supabase.com/docs/guides/functions
- **Project Docs**: See `EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md`
- **Code**: `supabase/functions/*/index.ts`

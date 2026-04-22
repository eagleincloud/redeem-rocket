# Growth Platform: Email Campaigns - Complete Implementation Guide

## Overview

The Email Campaigns module is a comprehensive email automation, tracking, and analytics system for Redeem Rocket. It enables businesses to create, schedule, track, and analyze email campaigns with advanced segmentation, personalization, and multi-provider support.

---

## Table of Contents

1. [Database Schema](#database-schema)
2. [React Components](#react-components)
3. [Service Layer](#service-layer)
4. [Custom Hooks](#custom-hooks)
5. [Email Variables & Personalization](#email-variables--personalization)
6. [Email Providers](#email-providers)
7. [Segmentation Guide](#segmentation-guide)
8. [Analytics & Tracking](#analytics--tracking)
9. [API Endpoints](#api-endpoints)
10. [Best Practices](#best-practices)

---

## Database Schema

### Tables Overview

#### 1. `email_campaigns`
Main table for storing email campaign data.

**Columns:**
- `id` (uuid): Unique identifier
- `business_id` (uuid): Reference to business
- `name` (varchar): Campaign name
- `subject` (varchar): Email subject line
- `body` (text): Email content
- `status` (varchar): draft | scheduled | sending | sent | paused | archived
- `send_at` (timestamptz): Scheduled send time
- `template_id` (uuid): Reference to email template
- `segment_id` (uuid): Reference to email segment
- `recipient_count` (integer): Total recipients
- `sent_count` (integer): Emails sent
- `open_count` (integer): Total opens
- `click_count` (integer): Total clicks
- `conversion_count` (integer): Conversions tracked

**Example Query:**
```sql
SELECT * FROM email_campaigns
WHERE business_id = 'biz-123' AND status = 'sent'
ORDER BY created_at DESC;
```

#### 2. `email_sequences`
Multi-step email automation sequences.

**Columns:**
- `id` (uuid): Unique identifier
- `business_id` (uuid): Reference to business
- `name` (varchar): Sequence name
- `trigger_type` (varchar): signup | purchase | manual | abandoned_cart | inactivity | tag_added
- `steps` (jsonb): Array of email steps
- `is_active` (boolean): Whether sequence is active

**Step Structure:**
```json
{
  "stepNumber": 1,
  "delayDays": 0,
  "subject": "Welcome to {company}",
  "body": "Hello {name}...",
  "templateId": "template-123"
}
```

#### 3. `email_templates`
Reusable email templates with variable support.

**Columns:**
- `id` (uuid): Unique identifier
- `business_id` (uuid): Reference to business
- `name` (varchar): Template name
- `category` (varchar): marketing | transactional | newsletter | onboarding
- `subject_template` (varchar): Subject with variables
- `body_html` (text): HTML content
- `variables` (jsonb): Template variables definition

#### 4. `email_tracking`
Individual email send and engagement tracking.

**Columns:**
- `campaign_id` (uuid): Reference to campaign
- `recipient_email` (varchar): Email recipient
- `sent_at` (timestamptz): When email was sent
- `opened` (boolean): Whether email was opened
- `opened_at` (timestamptz): When opened
- `open_count` (integer): Number of opens
- `clicked` (boolean): Whether links were clicked
- `click_count` (integer): Number of clicks
- `links_clicked` (jsonb): Array of clicked links
- `converted` (boolean): Whether conversion occurred
- `delivery_status` (varchar): pending | sent | delivered | bounced | hard_bounce | soft_bounce

#### 5. `email_segments`
Audience segments for campaign targeting.

**Columns:**
- `business_id` (uuid): Reference to business
- `name` (varchar): Segment name
- `criteria` (jsonb): Filter criteria
- `recipient_count` (integer): Recipients in segment
- `is_active` (boolean): Whether segment is active

**Example Criteria:**
```json
{
  "stage": ["qualified", "proposal"],
  "minDealValue": 5000,
  "maxDealValue": 50000,
  "tags": ["hot-lead"],
  "source": "campaign"
}
```

#### 6. `email_provider_config`
Email service provider configuration.

**Columns:**
- `business_id` (uuid): Reference to business
- `provider_type` (varchar): resend | smtp | aws_ses | sendgrid | mailchimp | brevo
- `provider_name` (varchar): User-friendly name
- `config_json` (jsonb): Provider configuration (encrypted)
- `is_verified` (boolean): Whether domain is verified
- `is_active` (boolean): Whether provider is active
- `is_primary` (boolean): Whether primary provider
- `daily_limit` (integer): Daily email limit
- `monthly_limit` (integer): Monthly email limit
- `emails_sent_today` (integer): Emails sent today

#### 7. `email_unsubscribes`
Track unsubscribed emails.

**Columns:**
- `email` (varchar): Email address
- `reason` (varchar): Unsubscribe reason
- `unsubscribe_type` (varchar): all | marketing | transactional | digest
- `unsubscribed_at` (timestamptz): When unsubscribed
- `source` (varchar): link | api | manual | bounce

#### 8. `email_ab_tests`
A/B testing for campaigns.

**Columns:**
- `campaign_id` (uuid): Reference to campaign
- `name` (varchar): Test name
- `test_type` (varchar): subject | content | send_time | from_name
- `variant_a_id` (uuid): First variant campaign
- `variant_b_id` (uuid): Second variant campaign
- `split_percentage` (numeric): Split ratio (0-1)
- `winner` (varchar): A | B (when complete)
- `is_complete` (boolean): Whether test is complete
- `confidence_level` (numeric): Statistical confidence

#### 9. `email_bounces`
Track email bounces.

**Columns:**
- `email` (varchar): Email address
- `bounce_type` (varchar): permanent | temporary | complaint | transient
- `bounce_reason` (varchar): Reason for bounce
- `bounced_at` (timestamptz): When bounce occurred
- `suppression_list_added` (boolean): Whether added to suppression list

---

## React Components

### 1. EmailCampaignBuilder.tsx
Create and edit email campaigns with live preview.

**Props:** None (uses React Router params)

**Features:**
- Campaign name and basic info
- Email subject and body editors
- From name and reply-to configuration
- Schedule send time
- Live preview panel
- Form validation

**Usage:**
```tsx
<Route path="/email-campaigns/new" element={<EmailCampaignBuilder />} />
<Route path="/email-campaigns/:campaignId" element={<EmailCampaignBuilder />} />
```

### 2. EmailTemplateBuilder.tsx
Build reusable email templates with drag-drop variables.

**Features:**
- Template name and category
- Subject and HTML body editors
- Drag-drop variable insertion
- Variable library sidebar
- Preview with sample variable values
- Template tagging

**Usage:**
```tsx
<EmailTemplateBuilder />
```

### 3. EmailAnalytics.tsx
View comprehensive campaign analytics.

**Props:**
- `campaignId` (from URL params)

**Features:**
- Metrics grid (sent, opened, clicked, converted)
- Conversion funnel visualization
- Top clicked links table
- Timeframe filtering (24h, 7d, 30d, all)
- Real-time metric updates

**Usage:**
```tsx
<Route path="/email-campaigns/:campaignId/analytics" element={<EmailAnalytics />} />
```

### 4. EmailScheduler.tsx
Schedule campaign sends with recurrence options.

**Props:**
- `campaignId`: Campaign to schedule
- `onSave`: Callback when schedule is saved

**Features:**
- Immediate send option
- Future send scheduling
- Recurrence (daily, weekly, monthly)
- Day of week selection for weekly

**Usage:**
```tsx
<EmailScheduler
  campaignId="campaign-123"
  onSave={async (schedule) => {
    await api.schedule(schedule)
  }}
/>
```

### 5. EmailSegmentSelector.tsx
Select or create recipient segments.

**Props:**
- `onSelect`: Callback with selected segment ID
- `selectedSegmentId`: Currently selected segment

**Features:**
- List of existing segments
- Recipient count display
- Quick segment creation
- Active/inactive status

**Usage:**
```tsx
const [selectedSegment, setSelectedSegment] = useState('')

<EmailSegmentSelector
  onSelect={setSelectedSegment}
  selectedSegmentId={selectedSegment}
/>
```

### 6. EmailProviderSetup.tsx
Configure email service providers.

**Features:**
- Multiple provider support (Resend, SMTP, AWS SES, etc.)
- Provider configuration forms
- Test email sending
- Primary provider selection
- Verification status

**Usage:**
```tsx
<EmailProviderSetup />
```

### 7. EmailSequenceBuilder.tsx
Create multi-step email automation sequences.

**Features:**
- Sequence name and trigger type
- Dynamic step management
- Delay configuration between steps
- Subject and body per step
- Template assignment

**Usage:**
```tsx
<EmailSequenceBuilder
  onSave={async (sequence) => {
    await api.saveSequence(sequence)
  }}
/>
```

### 8. EmailPreview.tsx
Modal preview of email before sending.

**Props:**
- `data`: Preview data (fromName, subject, body)
- `onClose`: Callback to close preview

**Features:**
- Email preview in modal
- Variable highlighting
- Full email layout preview
- Variable reference display

**Usage:**
```tsx
const [showPreview, setShowPreview] = useState(false)

{showPreview && (
  <EmailPreview
    data={{
      fromName: 'Redeem Rocket',
      subject: 'Welcome {name}!',
      body: 'Hello {name}...',
      variables: { name: 'John' }
    }}
    onClose={() => setShowPreview(false)}
  />
)}
```

### 9. EmailVariableInsert.tsx
Helper component for inserting variables into content.

**Features:**
- Quick variable selection buttons
- Variable information tooltips
- Paste-ready variable format

### 10. EmailCampaignList.tsx
Existing component - list all campaigns with metrics.

**Features:**
- Campaign listing with status
- Metrics display
- Filter by status
- Quick actions (edit, delete)

---

## Service Layer

### email-campaign-manager.ts
Core campaign management operations.

**Methods:**

```typescript
// Create new campaign
EmailCampaignManager.createCampaign(businessId, {
  name: 'Spring Sale',
  subject: 'Special Spring Offer',
  body: 'Check out our latest deals!',
  replyTo: 'sales@redeem.co',
  fromName: 'Redeem Rocket',
  sendAt: '2026-05-01T10:00:00Z',
  templateId: 'template-123',
  segmentId: 'segment-456'
})

// Get campaign metrics
EmailCampaignManager.getCampaignMetrics('campaign-123')
// Returns: { sentCount, deliveredCount, bouncedCount, openCount, clickCount, openRate, clickRate, conversionCount }

// Send campaign
EmailCampaignManager.sendCampaign('campaign-123', {
  sendImmediately: true
})

// Pause/Resume/Archive
EmailCampaignManager.pauseCampaign('campaign-123')
EmailCampaignManager.resumeCampaign('campaign-123')
EmailCampaignManager.archiveCampaign('campaign-123')

// List campaigns
EmailCampaignManager.listCampaigns(businessId, {
  status: 'sent',
  limit: 20,
  offset: 0
})
```

### email-service.ts
Email utilities and operations.

**EmailTemplateEngine:**
```typescript
// Parse variables in template
EmailTemplateEngine.parseVariables(
  'Hi {name}, your email is {email}',
  { name: 'John', email: 'john@example.com' }
)
// Returns: 'Hi John, your email is john@example.com'

// Extract variables from template
EmailTemplateEngine.extractVariables('Hi {name}, {email}')
// Returns: ['name', 'email']

// Validate template
EmailTemplateEngine.validateTemplate('Hello {name}!')
// Returns: { valid: true, errors: [] }
```

**EmailTracking:**
```typescript
// Track email open
EmailTracking.trackOpen('campaign-123', 'user@example.com', 'Gmail')

// Track email click
EmailTracking.trackClick('campaign-123', 'user@example.com', 'https://example.com', 0)

// Get tracking data
EmailTracking.getTrackingData('campaign-123')

// Get specific recipient tracking
EmailTracking.getRecipientTracking('campaign-123', 'user@example.com')
```

**EmailSegmentation:**
```typescript
// Create segment
EmailSegmentation.createSegment(businessId, 'High-Value Leads', {
  minDealValue: 10000,
  stage: ['qualified', 'proposal']
})

// Get segments
EmailSegmentation.getSegments(businessId)

// Count recipients in segment
EmailSegmentation.countSegmentRecipients('segment-123')

// Delete segment
EmailSegmentation.deleteSegment('segment-123')
```

**EmailProvider:**
```typescript
// Get active providers
EmailProvider.getProviders(businessId)

// Get primary provider
EmailProvider.getPrimaryProvider(businessId)

// Create provider
EmailProvider.createProvider(businessId, 'resend', {
  apiKey: 'sk_...'
}, true) // Set as primary

// Verify provider
EmailProvider.verifyProvider('provider-123')

// Set primary provider
EmailProvider.setPrimaryProvider(businessId, 'provider-123')
```

**EmailUnsubscribe & EmailBounce:**
```typescript
// Check if email is unsubscribed
EmailUnsubscribe.isUnsubscribed(businessId, 'user@example.com')

// Get unsubscribes
EmailUnsubscribe.getUnsubscribes(businessId)

// Record bounce
EmailBounce.recordBounce(businessId, 'invalid@example.com', 'permanent', 'Invalid email')

// Check if bounced
EmailBounce.isBounced(businessId, 'invalid@example.com')
```

---

## Custom Hooks

### useEmailCampaigns()
Manage email campaigns.

```typescript
const {
  campaigns,      // Campaign[] - list of campaigns
  loading,        // boolean
  error,          // string | null
  fetchCampaigns, // (filters?) => Promise<void>
  createCampaign, // (data) => Promise<Campaign>
  deleteCampaign, // (id) => Promise<void>
} = useEmailCampaigns()
```

### useEmailTemplates()
Manage email templates.

```typescript
const {
  templates,       // EmailTemplate[]
  loading,         // boolean
  error,           // string | null
  fetchTemplates,  // () => Promise<void>
  createTemplate,  // (data) => Promise<Template>
  updateTemplate,  // (id, data) => Promise<Template>
  deleteTemplate,  // (id) => Promise<void>
} = useEmailTemplates()
```

### useEmailSegments()
Manage email segments.

```typescript
const {
  segments,        // Segment[]
  loading,         // boolean
  error,           // string | null
  fetchSegments,   // () => Promise<void>
  createSegment,   // (name, criteria) => Promise<Segment>
  deleteSegment,   // (id) => Promise<void>
} = useEmailSegments()
```

### useEmailAnalytics(campaignId)
Get campaign analytics.

```typescript
const {
  metrics,     // { sentCount, openRate, clickRate, ... }
  topLinks,    // { url, clicks, percentage }[]
  loading,     // boolean
  error,       // string | null
  refetch,     // () => Promise<void>
} = useEmailAnalytics('campaign-123')
```

### useEmailProviders()
Manage email providers.

```typescript
const {
  providers,           // Provider[]
  loading,             // boolean
  error,               // string | null
  fetchProviders,      // () => Promise<void>
  createProvider,      // (type, config, isPrimary) => Promise<Provider>
  setPrimaryProvider,  // (id) => Promise<void>
  verifyProvider,      // (id) => Promise<void>
  deleteProvider,      // (id) => Promise<void>
} = useEmailProviders()
```

---

## Email Variables & Personalization

### Built-in Variables

```
{name}              - Recipient first name
{email}             - Recipient email address
{company}           - Company name
{personalization}   - Custom personalization text
{date}              - Current date (YYYY-MM-DD)
```

### Using Variables

**In Subject Lines:**
```
"Hi {name}, exclusive offer inside!"
"Double bonus for {company} customers!"
```

**In Body:**
```html
<p>Dear {name},</p>
<p>We have a special offer for {company}!</p>
<p>As of {date}, we're running a promotion...</p>
```

### Variable Validation

The EmailTemplateEngine will:
1. Extract all variables from template
2. Validate variables exist in data
3. Replace with empty string if missing (to prevent errors)
4. Support multiple occurrences of same variable

```typescript
// Example
const template = 'Hi {name}, welcome {name}!'
const variables = { name: 'John' }
// Result: 'Hi John, welcome John!'
```

---

## Email Providers

### Supported Providers

1. **Resend** (Recommended for transactional)
   - API Key authentication
   - High deliverability
   - Good webhook support

2. **SMTP** (Flexible)
   - Host, port, username, password
   - Works with any SMTP server
   - Self-hosted option available

3. **AWS SES** (High volume)
   - Access Key, Secret Key, Region
   - High sending limits
   - Sandbox mode for testing

4. **SendGrid** (Popular)
   - API Key authentication
   - Good tracking features

5. **Mailchimp** (Traditional)
   - API Key authentication
   - Built-in marketing tools

6. **Brevo** (EU-friendly)
   - API Key authentication
   - Good compliance support

### Setting Up a Provider

```typescript
// Resend Example
const provider = await useEmailProviders().createProvider(
  'resend',
  { apiKey: 'sk_123...' },
  true // Set as primary
)

// SMTP Example
const provider = await useEmailProviders().createProvider(
  'smtp',
  {
    host: 'smtp.gmail.com',
    port: 587,
    user: 'your-email@gmail.com',
    password: 'app-specific-password'
  },
  true
)

// AWS SES Example
const provider = await useEmailProviders().createProvider(
  'aws_ses',
  {
    accessKey: 'AKIAIOSFODNN7EXAMPLE',
    secretKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    region: 'us-east-1'
  },
  true
)
```

---

## Segmentation Guide

### Creating Segments

**High-Value Leads:**
```json
{
  "minDealValue": 50000,
  "stage": ["proposal", "negotiation"],
  "priority": ["high", "urgent"]
}
```

**New Signups:**
```json
{
  "source": "signup",
  "daysOld": { "min": 0, "max": 7 },
  "stage": "new"
}
```

**Inactive Leads:**
```json
{
  "lastActivityDays": { "min": 30 },
  "stage": ["new", "contacted"]
}
```

**By Geography:**
```json
{
  "location": ["California", "New York"],
  "dealValue": { "min": 10000 }
}
```

### Dynamic Segmentation

Segments automatically update recipient count based on criteria. Query the database to get current count:

```typescript
const count = await EmailSegmentation.countSegmentRecipients('segment-123')
```

---

## Analytics & Tracking

### Key Metrics

**Open Rate:**
```
(Total Opens / Total Sent) * 100
```

**Click Rate:**
```
(Total Clicks / Total Sent) * 100
```

**Conversion Rate:**
```
(Total Conversions / Total Sent) * 100
```

**Bounce Rate:**
```
(Total Bounces / Total Sent) * 100
```

### Tracking Beacons

Email opens are tracked via:
1. Pixel tracking (1x1 invisible image)
2. Click tracking (modified links)
3. User-agent detection
4. IP geolocation

### Privacy Considerations

- GDPR compliant unsubscribe links
- No tracking for users with privacy browsers
- Bounce handling for invalid addresses
- Complaint handling for spam reports

---

## API Endpoints

### Campaign Management
```
POST   /api/campaigns                 - Create campaign
GET    /api/campaigns                 - List campaigns
GET    /api/campaigns/:id             - Get campaign
PUT    /api/campaigns/:id             - Update campaign
DELETE /api/campaigns/:id             - Delete campaign
POST   /api/campaigns/:id/send        - Send campaign
POST   /api/campaigns/:id/pause       - Pause campaign
POST   /api/campaigns/:id/resume      - Resume campaign
POST   /api/campaigns/:id/archive     - Archive campaign
GET    /api/campaigns/:id/analytics   - Get analytics
```

### Templates
```
POST   /api/templates                 - Create template
GET    /api/templates                 - List templates
GET    /api/templates/:id             - Get template
PUT    /api/templates/:id             - Update template
DELETE /api/templates/:id             - Delete template
```

### Segments
```
POST   /api/segments                  - Create segment
GET    /api/segments                  - List segments
PUT    /api/segments/:id              - Update segment
DELETE /api/segments/:id              - Delete segment
GET    /api/segments/:id/count        - Get recipient count
```

### Sequences
```
POST   /api/sequences                 - Create sequence
GET    /api/sequences                 - List sequences
PUT    /api/sequences/:id             - Update sequence
DELETE /api/sequences/:id             - Delete sequence
```

### Providers
```
POST   /api/email-providers           - Create provider
GET    /api/email-providers           - List providers
PUT    /api/email-providers/:id       - Update provider
DELETE /api/email-providers/:id       - Delete provider
POST   /api/email-providers/:id/test  - Test provider
PUT    /api/email-providers/:id/set-primary - Set as primary
```

### Tracking
```
GET    /api/tracking/:campaignId      - Get tracking data
POST   /api/tracking/:campaignId/open - Record open (pixel)
POST   /api/tracking/:campaignId/click- Record click
GET    /api/tracking/:campaignId/toplinks - Get top links
```

---

## Best Practices

### Email Design
1. Keep subject lines under 50 characters
2. Use clear, single call-to-action
3. Test on multiple clients (Gmail, Outlook, Apple Mail)
4. Ensure mobile-responsive design
5. Use plain text fallback for HTML

### Segmentation
1. Start with broad segments
2. Refine based on engagement metrics
3. Exclude unsubscribed/bounced emails
4. Update segments regularly
5. Test segments before sending

### Sending Best Practices
1. Schedule sends for high engagement times
2. Start with small segments for testing
3. Warm up new sending domains
4. Monitor bounce rates
5. Use authentication (SPF, DKIM, DMARC)

### Analytics & Optimization
1. Track opens and clicks
2. Monitor unsubscribe rates
3. Test subject lines with A/B testing
4. Analyze top-performing content
5. Implement conversion tracking

### Rate Limiting
- Resend: 100 emails/second
- SMTP: Depends on provider
- AWS SES: Starts at 1 email/second (request increase)
- SendGrid: 100 emails/second
- Mailchimp: API rate limits apply

### Compliance
- Honor unsubscribe requests within 10 days
- Include physical address in emails
- Maintain list hygiene (remove bounces)
- Get explicit consent for marketing
- Keep opt-in records for 3 years

---

## Performance Targets

- ✅ Campaign creation < 2 seconds
- ✅ Send 1,000 emails < 5 seconds
- ✅ Analytics load < 1 second
- ✅ Template rendering < 100ms per email
- ✅ Segmentation count < 500ms
- ✅ 99.9% email delivery success rate
- ✅ Open tracking accuracy > 95%
- ✅ Click tracking accuracy > 99%

---

## Support & Troubleshooting

### Common Issues

**Emails not being received?**
- Check provider authentication
- Verify domain SPF/DKIM/DMARC records
- Review bounce list for email addresses
- Check spam folder

**Analytics not updating?**
- Wait 30 seconds for real-time updates
- Verify tracking pixels are loading
- Check user privacy browser settings
- Review email client filtering

**Template variables not replacing?**
- Ensure variable names match exactly (case-sensitive)
- Provide fallback values
- Test with sample data first
- Check for special characters

---

## Migration Notes

This Email Campaigns module is fully backward compatible with existing email sequences and providers. No data migration required from previous implementation.

---

## Document Version
- Version: 1.0
- Last Updated: 2026-04-26
- Status: Production Ready

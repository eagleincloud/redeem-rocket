# Email Campaigns - Testing & Verification Guide

## Overview

Complete testing strategy for Email Campaigns module with manual and automated test cases.

---

## Pre-Testing Setup

### Prerequisites
1. Database migration deployed: `20260426_growth_email_campaigns.sql`
2. Supabase project configured
3. Business context available
4. Email provider credentials ready

### Test Data Setup
```typescript
// Create test business
const testBusiness = {
  id: 'test-business-123',
  name: 'Test Company',
  auth_user_id: 'test-user-123'
};

// Create test email
const testEmail = 'test@example.com';
```

---

## Unit Tests

### API Function Tests

#### Campaign CRUD Tests
```typescript
describe('Campaign CRUD', () => {
  const businessId = 'test-business-123';

  it('should create a campaign', async () => {
    const campaign = await createCampaign(businessId, {
      name: 'Test Campaign',
      subject: 'Hello {name}',
      body: '<p>Welcome!</p>',
      status: 'draft',
      is_test: false,
      recipient_count: 0,
      sent_count: 0,
      delivered_count: 0,
      bounced_count: 0,
      open_count: 0,
      click_count: 0,
      conversion_count: 0,
      unsubscribe_count: 0,
      complaint_count: 0
    });

    expect(campaign.id).toBeDefined();
    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.status).toBe('draft');
  });

  it('should get campaign by ID', async () => {
    const campaign = await getCampaign(campaignId);
    expect(campaign.id).toBe(campaignId);
  });

  it('should update campaign', async () => {
    const updated = await updateCampaign(campaignId, {
      subject: 'Updated Subject'
    });
    expect(updated.subject).toBe('Updated Subject');
  });

  it('should delete campaign', async () => {
    await deleteCampaign(campaignId);
    // Verify deletion
  });

  it('should get campaigns with pagination', async () => {
    const { campaigns, total } = await getCampaigns(businessId, {
      limit: 10,
      offset: 0
    });
    expect(Array.isArray(campaigns)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  });

  it('should filter campaigns by status', async () => {
    const { campaigns } = await getCampaigns(businessId, {
      status: 'draft'
    });
    campaigns.forEach(c => {
      expect(c.status).toBe('draft');
    });
  });
});
```

#### Email Sequence Tests
```typescript
describe('Email Sequences', () => {
  const businessId = 'test-business-123';

  it('should create a sequence', async () => {
    const sequence = await createSequence(businessId, {
      name: 'Onboarding',
      trigger_type: 'signup',
      is_active: true,
      trigger_config: {},
      steps: [
        {
          step_number: 1,
          delay_days: 0,
          subject: 'Welcome',
          body: 'Welcome email'
        }
      ],
      step_count: 1,
      total_sends: 0,
      total_opens: 0,
      total_clicks: 0
    });

    expect(sequence.id).toBeDefined();
    expect(sequence.steps.length).toBe(1);
  });

  it('should add step to sequence', async () => {
    const updated = await addSequenceStep(sequenceId, {
      step_number: 2,
      delay_days: 3,
      subject: 'Follow up',
      body: 'Follow up email'
    });

    expect(updated.step_count).toBe(2);
    expect(updated.steps.length).toBe(2);
  });

  it('should remove step from sequence', async () => {
    const updated = await removeSequenceStep(sequenceId, 2);
    expect(updated.step_count).toBe(1);
  });

  it('should update sequence step', async () => {
    const updated = await updateSequenceStep(sequenceId, 1, {
      subject: 'Updated Subject'
    });
    expect(updated.steps[0].subject).toBe('Updated Subject');
  });
});
```

#### Email Provider Tests
```typescript
describe('Email Providers', () => {
  const businessId = 'test-business-123';

  it('should setup an email provider', async () => {
    const provider = await setupEmailProvider(businessId, {
      provider_type: 'resend',
      provider_name: 'Production',
      config_json: {
        api_key: 'test-key',
        domain: 'test.example.com'
      },
      is_verified: false,
      is_active: false,
      is_primary: false
    });

    expect(provider.id).toBeDefined();
    expect(provider.provider_type).toBe('resend');
  });

  it('should get all providers for business', async () => {
    const providers = await getEmailProviders(businessId);
    expect(Array.isArray(providers)).toBe(true);
  });

  it('should set primary provider', async () => {
    await setPrimaryEmailProvider(businessId, providerId);
    const providers = await getEmailProviders(businessId, { primary: true });
    expect(providers.length).toBe(1);
    expect(providers[0].id).toBe(providerId);
  });

  it('should update provider config', async () => {
    const updated = await updateEmailProvider(providerId, {
      daily_limit: 1000
    });
    expect(updated.daily_limit).toBe(1000);
  });

  it('should delete provider', async () => {
    await deleteEmailProvider(providerId);
    // Verify deletion
  });
});
```

#### Email Tracking Tests
```typescript
describe('Email Tracking', () => {
  const campaignId = 'test-campaign-123';
  const email = 'test@example.com';

  it('should track email open', async () => {
    await trackEmailOpen(campaignId, email, {
      clientName: 'Gmail',
      ipAddress: '192.168.1.1'
    });

    const { tracking } = await getCampaignTracking(campaignId);
    const record = tracking.find(t => t.recipient_email === email);
    expect(record?.opened).toBe(true);
    expect(record?.open_client_name).toBe('Gmail');
  });

  it('should track email click', async () => {
    await trackEmailClick(campaignId, email, 'https://example.com', 0);

    const { tracking } = await getCampaignTracking(campaignId);
    const record = tracking.find(t => t.recipient_email === email);
    expect(record?.clicked).toBe(true);
    expect(record?.click_count).toBeGreaterThan(0);
  });

  it('should update delivery status', async () => {
    await updateEmailDeliveryStatus(campaignId, email, 'delivered');

    const { tracking } = await getCampaignTracking(campaignId);
    const record = tracking.find(t => t.recipient_email === email);
    expect(record?.delivery_status).toBe('delivered');
  });

  it('should get campaign tracking', async () => {
    const { tracking, total } = await getCampaignTracking(campaignId);
    expect(Array.isArray(tracking)).toBe(true);
    expect(total).toBeGreaterThanOrEqual(0);
  });
});
```

#### Analytics Tests
```typescript
describe('Campaign Analytics', () => {
  const campaignId = 'test-campaign-123';

  it('should calculate campaign metrics', async () => {
    const analytics = await getCampaignAnalytics(campaignId);

    expect(analytics.sent_count).toBeGreaterThanOrEqual(0);
    expect(analytics.delivered_count).toBeGreaterThanOrEqual(0);
    expect(analytics.open_rate).toBeGreaterThanOrEqual(0);
    expect(analytics.open_rate).toBeLessThanOrEqual(100);
    expect(analytics.click_rate).toBeGreaterThanOrEqual(0);
    expect(analytics.click_rate).toBeLessThanOrEqual(100);
  });

  it('should handle empty campaign', async () => {
    const newCampaign = await createCampaign(businessId, {
      name: 'Empty Campaign',
      subject: 'Test',
      body: 'Test',
      status: 'draft',
      is_test: false,
      recipient_count: 0,
      sent_count: 0,
      delivered_count: 0,
      bounced_count: 0,
      open_count: 0,
      click_count: 0,
      conversion_count: 0,
      unsubscribe_count: 0,
      complaint_count: 0
    });

    const analytics = await getCampaignAnalytics(newCampaign.id);
    expect(analytics.sent_count).toBe(0);
    expect(analytics.open_rate).toBe(0);
  });

  it('should calculate with date range', async () => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const analytics = await getCampaignAnalytics(campaignId, {
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });

    expect(analytics.sent_count).toBeGreaterThanOrEqual(0);
  });
});
```

#### Unsubscribe Tests
```typescript
describe('Unsubscribe Management', () => {
  const businessId = 'test-business-123';
  const email = 'test@example.com';

  it('should add email to unsubscribe list', async () => {
    await addUnsubscribe(businessId, email, 'marketing');

    const unsubscribed = await isEmailUnsubscribed(businessId, email);
    expect(unsubscribed).toBe(true);
  });

  it('should check if email is unsubscribed', async () => {
    const unsubscribed = await isEmailUnsubscribed(businessId, email);
    expect(typeof unsubscribed).toBe('boolean');
  });

  it('should remove email from unsubscribe list', async () => {
    await addUnsubscribe(businessId, email, 'marketing');
    await removeUnsubscribe(businessId, email, 'marketing');

    const unsubscribed = await isEmailUnsubscribed(businessId, email);
    expect(unsubscribed).toBe(false);
  });

  it('should get all unsubscribes', async () => {
    const unsubscribes = await getUnsubscribes(businessId);
    expect(Array.isArray(unsubscribes)).toBe(true);
  });
});
```

---

## Integration Tests

### Provider Integration Tests
```typescript
describe('Provider Integration', () => {
  const businessId = 'test-business-123';

  it('should verify Resend provider', async () => {
    const provider = await setupEmailProvider(businessId, {
      provider_type: 'resend',
      provider_name: 'Resend Test',
      config_json: {
        api_key: process.env.TEST_RESEND_KEY,
        domain: process.env.TEST_RESEND_DOMAIN
      },
      is_verified: false,
      is_active: false,
      is_primary: false
    });

    const result = await verifyEmailProvider(provider.id, 'test@example.com');
    expect(result.success).toBe(true);
  });

  it('should send test email via provider', async () => {
    const result = await sendTestEmail(providerId, 'test@example.com');
    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
  });

  it('should handle provider errors gracefully', async () => {
    const provider = await setupEmailProvider(businessId, {
      provider_type: 'resend',
      provider_name: 'Invalid Provider',
      config_json: {
        api_key: 'invalid-key',
        domain: 'invalid.com'
      },
      is_verified: false,
      is_active: false,
      is_primary: false
    });

    try {
      await verifyEmailProvider(provider.id, 'test@example.com');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

### End-to-End Workflow Tests
```typescript
describe('Complete Email Workflow', () => {
  const businessId = 'test-business-123';

  it('should complete full campaign lifecycle', async () => {
    // 1. Create provider
    const provider = await setupEmailProvider(businessId, {
      provider_type: 'resend',
      provider_name: 'E2E Test',
      config_json: { /* valid config */ },
      is_verified: true,
      is_active: true,
      is_primary: true
    });

    // 2. Create campaign
    const campaign = await createCampaign(businessId, {
      name: 'E2E Test Campaign',
      subject: 'Test {name}',
      body: '<p>Hello {name}</p>',
      status: 'draft',
      is_test: false,
      recipient_count: 0,
      sent_count: 0,
      delivered_count: 0,
      bounced_count: 0,
      open_count: 0,
      click_count: 0,
      conversion_count: 0,
      unsubscribe_count: 0,
      complaint_count: 0
    });

    // 3. Create segment
    const segment = await createEmailSegment(businessId, {
      name: 'Test Segment',
      criteria: {},
      recipient_count: 100,
      is_active: true
    });

    // 4. Update campaign with segment
    await updateCampaign(campaign.id, {
      segment_id: segment.id,
      status: 'scheduled'
    });

    // 5. Get analytics
    const analytics = await getCampaignAnalytics(campaign.id);

    expect(campaign.id).toBeDefined();
    expect(provider.id).toBeDefined();
    expect(segment.id).toBeDefined();
    expect(analytics.sent_count).toBe(0);
  });
});
```

---

## Manual Testing Checklist

### UI Component Testing

#### Campaign List Page
- [ ] Page loads without errors
- [ ] List displays all campaigns
- [ ] Filters work (draft, scheduled, sending, sent, paused, archived)
- [ ] Search functionality works
- [ ] Pagination works for 50+ items
- [ ] Can click campaign to view analytics
- [ ] Can create new campaign
- [ ] Can edit campaign
- [ ] Can delete campaign with confirmation
- [ ] Bulk selection works
- [ ] Pause/resume functionality works
- [ ] Stats display correctly (sent, open rate, click rate)

#### Campaign Builder
- [ ] Form loads properly
- [ ] Can enter campaign name
- [ ] Can enter subject with variables
- [ ] Can enter body (HTML/text)
- [ ] Can select from template library
- [ ] Variables autocomplete shows {name}, {email}, {company}
- [ ] From name and reply-to fields work
- [ ] Status dropdown works
- [ ] Test email checkbox works
- [ ] Save button creates/updates campaign
- [ ] Cancel button returns to campaign list
- [ ] Validation shows for required fields

#### Analytics Dashboard
- [ ] Metrics cards display correctly
  - [ ] Total sent
  - [ ] Delivery rate
  - [ ] Open rate
  - [ ] Click rate
- [ ] Engagement funnel shows all stages
- [ ] Daily breakdown chart displays
- [ ] Bounce rate shows correctly
- [ ] Unsubscribe count shows
- [ ] Conversion metrics display
- [ ] Date range filtering works

#### Provider Management Page
- [ ] Lists all configured providers
- [ ] Shows provider type with icon
- [ ] Shows verification status
- [ ] Shows active/inactive status
- [ ] Shows rate limits (daily/monthly)
- [ ] Primary provider indicator shows
- [ ] Can set as primary
- [ ] Can edit provider
- [ ] Can delete provider
- [ ] Can add new provider
- [ ] Error messages display clearly

#### Provider Setup Form
- [ ] Provider type dropdown loads
- [ ] Form fields change based on provider type
- [ ] Resend form shows API key and domain
- [ ] SMTP form shows all fields (host, port, user, password)
- [ ] AWS SES form shows all fields
- [ ] SendGrid form shows all fields
- [ ] Password fields have visibility toggle
- [ ] Rate limit fields work
- [ ] Validation shows for required fields
- [ ] Save button creates provider
- [ ] Cancel button returns to provider list

---

## Security Testing

### RLS Policy Testing
```sql
-- Test 1: User can only see their own business campaigns
SELECT * FROM email_campaigns WHERE business_id = 'other-business-123';
-- Should return 0 rows if RLS is working

-- Test 2: User can't update other business campaigns
UPDATE email_campaigns 
SET subject = 'Hacked'
WHERE business_id = 'other-business-123';
-- Should fail with permission denied

-- Test 3: User can't delete other business campaigns
DELETE FROM email_campaigns 
WHERE business_id = 'other-business-123';
-- Should fail with permission denied
```

### API Security Testing
```typescript
it('should reject requests with invalid businessId', async () => {
  try {
    await getCampaigns('invalid-business-id');
    // Should fail with auth error
  } catch (error) {
    expect(error).toBeDefined();
  }
});

it('should not expose provider API keys', async () => {
  const provider = await getEmailProvider(providerId);
  expect(provider.config_json.api_key).not.toContain('sk_');
});
```

---

## Performance Testing

### Load Testing
```typescript
// Test with 1000 campaigns
it('should handle 1000 campaigns efficiently', async () => {
  const start = Date.now();
  const { campaigns } = await getCampaigns(businessId, { limit: 1000 });
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000); // < 1 second
  expect(campaigns.length).toBeLessThanOrEqual(1000);
});

// Test with 10000 tracking records
it('should query 10000 tracking records quickly', async () => {
  const start = Date.now();
  const { tracking } = await getCampaignTracking(campaignId, { limit: 1000 });
  const duration = Date.now() - start;

  expect(duration).toBeLessThan(1000); // < 1 second
});
```

---

## Deployment Verification

### Post-Deployment Testing
1. [ ] Database migration ran successfully
2. [ ] All 9 tables created
3. [ ] RLS policies enabled
4. [ ] Indexes created properly
5. [ ] Functions deployed successfully
6. [ ] API endpoints responding
7. [ ] UI pages loading
8. [ ] Email provider can be added
9. [ ] Test email can be sent
10. [ ] Campaign can be created
11. [ ] Analytics data displays
12. [ ] No console errors

---

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Delete test data
DELETE FROM email_campaigns WHERE is_test = true;
DELETE FROM email_campaigns WHERE business_id = 'test-business-123';
DELETE FROM email_sequences WHERE business_id = 'test-business-123';
DELETE FROM email_templates WHERE business_id = 'test-business-123';
DELETE FROM email_segments WHERE business_id = 'test-business-123';
DELETE FROM email_provider_config WHERE business_id = 'test-business-123';
```

---

## Continuous Testing

### Monitoring
- Monitor error rates in email_provider_config.error_count
- Track consecutive_failures
- Check last_error messages
- Monitor daily email quotas

### Regular Tests
- Weekly: Run full test suite
- Daily: Check provider health
- Hourly: Monitor error logs

---

## Troubleshooting Failed Tests

### Campaign Tests Fail
1. Verify businessId is valid
2. Check RLS policies
3. Verify data in database

### Provider Tests Fail
1. Check API credentials
2. Verify provider type
3. Test connectivity

### Tracking Tests Fail
1. Verify campaign exists
2. Check tracking format
3. Verify recipient email

### Analytics Tests Fail
1. Check data in tracking table
2. Verify calculations
3. Check date range

---

## Test Execution

Run tests:
```bash
npm test -- email.test.ts
npm test -- email.integration.test.ts
npm run test:e2e -- email
```

Generate coverage:
```bash
npm test -- --coverage --collectCoverageFrom="src/app/api/email.ts"
npm test -- --coverage --collectCoverageFrom="src/business/components/Email/**/*.tsx"
```

Expected coverage:
- API: > 95%
- Components: > 90%
- Overall: > 90%

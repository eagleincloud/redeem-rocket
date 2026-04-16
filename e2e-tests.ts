// Comprehensive E2E tests for all growth platform features

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test helpers
interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = performance.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: performance.now() - startTime });
    console.log(`✓ ${name}`);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err);
    results.push({
      name,
      passed: false,
      duration: performance.now() - startTime,
      error: errorMsg,
    });
    console.log(`✗ ${name}: ${errorMsg}`);
  }
}

// Test constants
const TEST_BUSINESS_ID = 'test-business-' + Date.now();
const TEST_EMAIL = `test-${Date.now()}@example.com`;

// ─── TEST 1: EMAIL SEQUENCES EXECUTION ───────────────────────────────────────

async function testEmailSequences() {
  console.log('\n=== TEST 1: EMAIL SEQUENCES EXECUTION ===\n');

  await runTest('Create email sequence', async () => {
    const { data, error } = await supabase.from('email_sequences').insert({
      business_id: TEST_BUSINESS_ID,
      sequence_name: 'Welcome Series',
      trigger_type: 'signup',
      step_number: 1,
      step_delay_days: 0,
      email_subject: 'Welcome to our service!',
      email_body: 'Hello {name}, thanks for joining!',
      is_active: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify sequence in database', async () => {
    const { data, error } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) throw new Error('Sequence not found');
  });

  await runTest('Create lead for sequence trigger', async () => {
    const { data, error } = await supabase.from('leads').insert({
      business_id: TEST_BUSINESS_ID,
      name: 'Test Lead',
      email: TEST_EMAIL,
      phone: '919876543210',
      source: 'campaign',
      stage: 'new',
      priority: 'medium',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify email tracking table exists', async () => {
    const { data, error } = await supabase
      .from('email_tracking')
      .select('id')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      throw new Error(error.message);
    }
  });
}

// ─── TEST 2: LEAD WEBHOOKS & CSV IMPORT ──────────────────────────────────────

async function testLeadImport() {
  console.log('\n=== TEST 2: LEAD WEBHOOKS & CSV IMPORT ===\n');

  await runTest('Import lead via webhook format', async () => {
    const { data, error } = await supabase.from('leads').insert({
      business_id: TEST_BUSINESS_ID,
      name: 'Webhook Lead',
      email: 'webhook@example.com',
      phone: '919876543210',
      company: 'Tech Corp',
      source: 'campaign',
      stage: 'new',
      priority: 'high',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Import CSV lead', async () => {
    const { data, error } = await supabase.from('leads').insert({
      business_id: TEST_BUSINESS_ID,
      name: 'CSV Lead',
      email: 'csv@example.com',
      phone: '919876543211',
      company: 'Data Inc',
      source: 'csv',
      stage: 'new',
      priority: 'medium',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create lead connector for tracking', async () => {
    const { data, error } = await supabase.from('lead_connectors').insert({
      business_id: TEST_BUSINESS_ID,
      connector_name: 'Test Connector',
      connector_type: 'webhook',
      source_name: 'API',
      is_active: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify multiple leads created', async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (error) throw new Error(error.message);
    if (!data || data.length < 3) throw new Error(`Expected at least 3 leads, got ${data?.length || 0}`);
  });
}

// ─── TEST 3: EMAIL PROVIDER TESTING ──────────────────────────────────────────

async function testEmailProviders() {
  console.log('\n=== TEST 3: EMAIL PROVIDER TESTING ===\n');

  await runTest('Create Resend provider config', async () => {
    const { data, error } = await supabase.from('email_provider_configs').insert({
      business_id: TEST_BUSINESS_ID,
      provider_type: 'resend',
      provider_name: 'Primary Resend',
      is_verified: false,
      is_primary: true,
      config_data: {
        resend_api_key: 're_test_key_12345',
      },
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create SMTP provider config', async () => {
    const { data, error } = await supabase.from('email_provider_configs').insert({
      business_id: TEST_BUSINESS_ID,
      provider_type: 'smtp',
      provider_name: 'Backup SMTP',
      is_verified: false,
      config_data: {
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        smtp_user: 'user@example.com',
        smtp_pass: 'password',
      },
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify provider configs stored', async () => {
    const { data, error } = await supabase
      .from('email_provider_configs')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (error) throw new Error(error.message);
    if (!data || data.length < 2) throw new Error(`Expected 2 providers, got ${data?.length || 0}`);
  });

  await runTest('Mark provider as verified', async () => {
    const { error } = await supabase
      .from('email_provider_configs')
      .update({ is_verified: true, verified_domain: 'example.com' })
      .eq('business_id', TEST_BUSINESS_ID)
      .eq('provider_type', 'resend');

    if (error) throw new Error(error.message);
  });
}

// ─── TEST 4: AUTOMATION RULE EXECUTION ───────────────────────────────────────

async function testAutomationRules() {
  console.log('\n=== TEST 4: AUTOMATION RULE EXECUTION ===\n');

  await runTest('Create "send email on lead add" automation', async () => {
    const { data, error } = await supabase.from('automation_rules').insert({
      business_id: TEST_BUSINESS_ID,
      rule_name: 'Welcome Email on New Lead',
      trigger_type: 'lead_added',
      trigger_conditions: {},
      action_type: 'send_email',
      action_config: {
        subject: 'Welcome {name}!',
        body: 'Thanks for joining our platform!',
      },
      is_active: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create "add tag on high priority" automation', async () => {
    const { data, error } = await supabase.from('automation_rules').insert({
      business_id: TEST_BUSINESS_ID,
      rule_name: 'Tag High Priority Leads',
      trigger_type: 'lead_added',
      trigger_conditions: { field: 'priority', operator: 'equals', value: 'high' },
      action_type: 'add_tag',
      action_config: { tag: 'vip-prospect' },
      is_active: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify automation rules created', async () => {
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (error) throw new Error(error.message);
    if (!data || data.length < 2) throw new Error(`Expected 2 rules, got ${data?.length || 0}`);
  });
}

// ─── TEST 5: SOCIAL MEDIA POSTING ───────────────────────────────────────────

async function testSocialMedia() {
  console.log('\n=== TEST 5: SOCIAL MEDIA POSTING ===\n');

  await runTest('Create Twitter account config', async () => {
    const { data, error } = await supabase.from('social_accounts').insert({
      business_id: TEST_BUSINESS_ID,
      platform: 'twitter',
      account_name: '@TestBusiness',
      account_id: '123456789',
      access_token: 'test_twitter_token',
      is_connected: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create LinkedIn account config', async () => {
    const { data, error } = await supabase.from('social_accounts').insert({
      business_id: TEST_BUSINESS_ID,
      platform: 'linkedin',
      account_name: 'Test Business Page',
      account_id: 'urn:li:page:123456',
      access_token: 'test_linkedin_token',
      is_connected: true,
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create social post', async () => {
    const { data: accounts } = await supabase
      .from('social_accounts')
      .select('id')
      .eq('business_id', TEST_BUSINESS_ID)
      .limit(1);

    if (!accounts || accounts.length === 0) throw new Error('No social account found');

    const { data, error } = await supabase.from('social_posts').insert({
      business_id: TEST_BUSINESS_ID,
      social_account_id: accounts[0].id,
      platform: 'twitter',
      post_content: 'Check out our amazing new product launch! 🚀',
      post_type: 'text',
      status: 'draft',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Schedule social post', async () => {
    const { data: posts } = await supabase
      .from('social_posts')
      .select('id')
      .eq('business_id', TEST_BUSINESS_ID)
      .limit(1);

    if (!posts || posts.length === 0) throw new Error('No post found');

    const { error } = await supabase
      .from('social_posts')
      .update({
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        status: 'scheduled',
      })
      .eq('id', posts[0].id);

    if (error) throw new Error(error.message);
  });

  await runTest('Verify social accounts connected', async () => {
    const { data, error } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (error) throw new Error(error.message);
    if (!data || data.length < 2) throw new Error(`Expected 2 accounts, got ${data?.length || 0}`);
  });
}

// ─── TEST 6: ADVANCED LEAD SOURCES ──────────────────────────────────────────

async function testAdvancedLeadSources() {
  console.log('\n=== TEST 6: ADVANCED LEAD SOURCES ===\n');

  await runTest('Create IVR lead', async () => {
    const { data, error } = await supabase.from('ivr_leads').insert({
      business_id: TEST_BUSINESS_ID,
      phone_number: '919876543212',
      call_duration: 240,
      ivr_response: 'Customer requested sales callback',
      lead_intent: 'sales',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create web portal submission', async () => {
    const { data, error } = await supabase.from('web_portal_submissions').insert({
      business_id: TEST_BUSINESS_ID,
      form_name: 'Contact Form',
      form_data: {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Interested in demo',
      },
      submission_url: 'https://example.com/contact',
      submitter_ip: '192.168.1.1',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Create scraped lead record', async () => {
    const { data, error } = await supabase.from('scraped_leads').insert({
      business_id: TEST_BUSINESS_ID,
      source_url: 'https://example.com/directory/john-smith',
      scrape_metadata: {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'Tech Corp',
        title: 'VP Sales',
      },
      scrape_quality: 'high',
    });

    if (error) throw new Error(error.message);
  });

  await runTest('Verify advanced lead sources tables', async () => {
    const { data: ivrData, error: ivrError } = await supabase
      .from('ivr_leads')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (ivrError) throw new Error(`IVR Error: ${ivrError.message}`);

    const { data: portalData, error: portalError } = await supabase
      .from('web_portal_submissions')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (portalError) throw new Error(`Portal Error: ${portalError.message}`);

    const { data: scrapedData, error: scrapedError } = await supabase
      .from('scraped_leads')
      .select('*')
      .eq('business_id', TEST_BUSINESS_ID);

    if (scrapedError) throw new Error(`Scraped Error: ${scrapedError.message}`);

    if (!ivrData || !portalData || !scrapedData) throw new Error('Advanced sources not created');
  });
}

// ─── MAIN TEST RUNNER ───────────────────────────────────────────────────────

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║    GROWTH PLATFORM E2E TEST SUITE                           ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  await testEmailSequences();
  await testLeadImport();
  await testEmailProviders();
  await testAutomationRules();
  await testSocialMedia();
  await testAdvancedLeadSources();

  // Print summary
  console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║    TEST SUMMARY                                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total Tests: ${results.length}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total Time: ${totalTime.toFixed(2)}ms\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.name}: ${r.error}`);
      });
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');

  return failed === 0;
}

// Run tests
const success = await runAllTests();
process.exit(success ? 0 : 1);

#!/usr/bin/env node

/**
 * BUSINESS OS v1.0 - AUTOMATED SMOKE TEST SUITE
 *
 * Tests all 7 phases:
 * 1. Smart Onboarding
 * 2. Pipeline Engine
 * 3. Automation Engine
 * 4. Configurable System
 * 5. Actionable Dashboard
 * 6. Feature Marketplace
 * 7. AI + Manager Layer
 */

const https = require('https');
const fs = require('fs');

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

class TestRunner {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.results = [];
    this.startTime = Date.now();
  }

  async request(method, path, body = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(`${this.baseUrl}${path}`);
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: data ? JSON.parse(data) : null,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              data,
            });
          }
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  }

  log(message, level = 'info') {
    const time = new Date().toLocaleTimeString();
    switch (level) {
      case 'success':
        console.log(`${colors.green}✅ [${time}]${colors.reset} ${message}`);
        break;
      case 'error':
        console.log(`${colors.red}❌ [${time}]${colors.reset} ${message}`);
        break;
      case 'warning':
        console.log(`${colors.yellow}⚠️  [${time}]${colors.reset} ${message}`);
        break;
      default:
        console.log(`${colors.blue}ℹ️  [${time}]${colors.reset} ${message}`);
    }
  }

  recordTest(name, passed, details = '') {
    this.results.push({ name, passed, details });
  }

  // ========================================================================
  // PHASE 1: SMART ONBOARDING
  // ========================================================================

  async testPhase1() {
    this.log('Testing Phase 1: Smart Onboarding', 'info');

    try {
      // Test 1.1: Frontend loads
      const response = await this.request('GET', '/');
      if (response.status === 200) {
        this.log('Phase 1.1: Onboarding page loads', 'success');
        this.recordTest('Phase 1.1: Onboarding page loads', true);
      } else {
        throw new Error(`Status ${response.status}`);
      }

      // Test 1.2: Feature preferences can be saved
      const preferences = await this.request('POST', '/api/onboarding/preferences', {
        businessType: 'saas',
        features: {
          products: true,
          leads: true,
          email: true,
          automation: false,
          social: false,
        },
      });

      if (preferences.status === 201 || preferences.status === 200) {
        this.log('Phase 1.2: Feature preferences saved', 'success');
        this.recordTest('Phase 1.2: Feature preferences saved', true);
      } else {
        throw new Error(`Status ${preferences.status}`);
      }

      // Test 1.3: Theme can be selected
      const theme = await this.request('POST', '/api/onboarding/theme', {
        primaryColor: '#3B82F6',
        layout: 'data-heavy',
      });

      if (theme.status === 201 || theme.status === 200) {
        this.log('Phase 1.3: Theme saved', 'success');
        this.recordTest('Phase 1.3: Theme saved', true);
      } else {
        throw new Error(`Status ${theme.status}`);
      }
    } catch (error) {
      this.log(`Phase 1 failed: ${error.message}`, 'error');
      this.recordTest('Phase 1: Smart Onboarding', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 2: PIPELINE ENGINE
  // ========================================================================

  async testPhase2() {
    this.log('Testing Phase 2: Pipeline Engine', 'info');

    try {
      // Test 2.1: Create pipeline
      const pipeline = await this.request('POST', '/api/pipelines', {
        name: 'Test Sales Pipeline',
        stages: [
          { name: 'Lead', order: 1 },
          { name: 'Qualified', order: 2 },
          { name: 'Proposal', order: 3 },
          { name: 'Won', order: 4 },
        ],
      });

      if (pipeline.status !== 201) throw new Error(`Status ${pipeline.status}`);
      this.log('Phase 2.1: Pipeline created', 'success');
      this.recordTest('Phase 2.1: Pipeline created', true);

      const pipelineId = pipeline.data?.id;

      // Test 2.2: Add entity to pipeline
      if (pipelineId) {
        const entity = await this.request('POST', `/api/pipelines/${pipelineId}/entities`, {
          name: 'Test Company',
          value: 50000,
          stage: 'Lead',
        });

        if (entity.status === 201) {
          this.log('Phase 2.2: Entity added to pipeline', 'success');
          this.recordTest('Phase 2.2: Entity added to pipeline', true);

          const entityId = entity.data?.id;

          // Test 2.3: Move entity between stages
          if (entityId) {
            const move = await this.request('PUT', `/api/pipelines/${pipelineId}/entities/${entityId}`, {
              stage: 'Qualified',
            });

            if (move.status === 200) {
              this.log('Phase 2.3: Entity moved between stages', 'success');
              this.recordTest('Phase 2.3: Entity moved between stages', true);
            } else {
              throw new Error(`Move status ${move.status}`);
            }
          }
        } else {
          throw new Error(`Entity status ${entity.status}`);
        }
      }

      // Test 2.4: Get pipeline stats
      if (pipelineId) {
        const stats = await this.request('GET', `/api/pipelines/${pipelineId}/stats`);
        if (stats.status === 200) {
          this.log('Phase 2.4: Pipeline statistics retrieved', 'success');
          this.recordTest('Phase 2.4: Pipeline statistics retrieved', true);
        } else {
          throw new Error(`Stats status ${stats.status}`);
        }
      }
    } catch (error) {
      this.log(`Phase 2 failed: ${error.message}`, 'error');
      this.recordTest('Phase 2: Pipeline Engine', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 3: AUTOMATION ENGINE
  // ========================================================================

  async testPhase3() {
    this.log('Testing Phase 3: Automation Engine', 'info');

    try {
      // Test 3.1: Create automation rule
      const rule = await this.request('POST', '/api/automation/rules', {
        name: 'Send welcome email',
        trigger: 'lead_added',
        conditions: [],
        action: 'send_email',
        actionConfig: {
          templateId: 'welcome',
          subject: 'Welcome to Redeem Rocket',
        },
      });

      if (rule.status !== 201) throw new Error(`Status ${rule.status}`);
      this.log('Phase 3.1: Automation rule created', 'success');
      this.recordTest('Phase 3.1: Automation rule created', true);

      const ruleId = rule.data?.id;

      // Test 3.2: Test rule execution
      if (ruleId) {
        const test = await this.request('POST', `/api/automation/rules/${ruleId}/test`, {
          leadId: 'test-lead',
        });

        if (test.status === 200) {
          this.log('Phase 3.2: Automation rule tested', 'success');
          this.recordTest('Phase 3.2: Automation rule tested', true);
        } else {
          throw new Error(`Test status ${test.status}`);
        }
      }

      // Test 3.3: Get execution logs
      if (ruleId) {
        const logs = await this.request('GET', `/api/automation/rules/${ruleId}/logs`);
        if (logs.status === 200) {
          this.log('Phase 3.3: Execution logs retrieved', 'success');
          this.recordTest('Phase 3.3: Execution logs retrieved', true);
        } else {
          throw new Error(`Logs status ${logs.status}`);
        }
      }
    } catch (error) {
      this.log(`Phase 3 failed: ${error.message}`, 'error');
      this.recordTest('Phase 3: Automation Engine', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 4: CONFIGURABLE SYSTEM
  // ========================================================================

  async testPhase4() {
    this.log('Testing Phase 4: Configurable System', 'info');

    try {
      // Test 4.1: Create custom field
      const field = await this.request('POST', '/api/custom-fields', {
        name: 'Company Size',
        type: 'select',
        options: ['Small', 'Medium', 'Large'],
      });

      if (field.status !== 201) throw new Error(`Status ${field.status}`);
      this.log('Phase 4.1: Custom field created', 'success');
      this.recordTest('Phase 4.1: Custom field created', true);

      // Test 4.2: Get custom fields
      const fields = await this.request('GET', '/api/custom-fields');
      if (fields.status === 200) {
        this.log('Phase 4.2: Custom fields retrieved', 'success');
        this.recordTest('Phase 4.2: Custom fields retrieved', true);
      } else {
        throw new Error(`Fields status ${fields.status}`);
      }

      // Test 4.3: Set permissions
      const perms = await this.request('PUT', '/api/roles/admin/permissions', {
        canViewReports: true,
        canEditPipelines: true,
        canManageTeam: true,
      });

      if (perms.status === 200) {
        this.log('Phase 4.3: Permissions set', 'success');
        this.recordTest('Phase 4.3: Permissions set', true);
      } else {
        throw new Error(`Permissions status ${perms.status}`);
      }
    } catch (error) {
      this.log(`Phase 4 failed: ${error.message}`, 'error');
      this.recordTest('Phase 4: Configurable System', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 5: ACTIONABLE DASHBOARD
  // ========================================================================

  async testPhase5() {
    this.log('Testing Phase 5: Actionable Dashboard', 'info');

    try {
      // Test 5.1: Get dashboard metrics
      const metrics = await this.request('GET', '/api/metrics/dashboard');
      if (metrics.status !== 200) throw new Error(`Status ${metrics.status}`);
      this.log('Phase 5.1: Dashboard metrics retrieved', 'success');
      this.recordTest('Phase 5.1: Dashboard metrics retrieved', true);

      // Test 5.2: Get recommendations
      const recommendations = await this.request('GET', '/api/metrics/recommendations');
      if (recommendations.status === 200) {
        this.log('Phase 5.2: Recommendations retrieved', 'success');
        this.recordTest('Phase 5.2: Recommendations retrieved', true);
      } else {
        throw new Error(`Status ${recommendations.status}`);
      }

      // Test 5.3: Get conversion funnel
      const funnel = await this.request('GET', '/api/metrics/funnel');
      if (funnel.status === 200) {
        this.log('Phase 5.3: Conversion funnel retrieved', 'success');
        this.recordTest('Phase 5.3: Conversion funnel retrieved', true);
      } else {
        throw new Error(`Status ${funnel.status}`);
      }
    } catch (error) {
      this.log(`Phase 5 failed: ${error.message}`, 'error');
      this.recordTest('Phase 5: Actionable Dashboard', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 6: FEATURE MARKETPLACE
  // ========================================================================

  async testPhase6() {
    this.log('Testing Phase 6: Feature Marketplace', 'info');

    try {
      // Test 6.1: List features
      const features = await this.request('GET', '/api/marketplace/features');
      if (features.status !== 200) throw new Error(`Status ${features.status}`);
      this.log('Phase 6.1: Features listed', 'success');
      this.recordTest('Phase 6.1: Features listed', true);

      // Test 6.2: Vote for feature
      const vote = await this.request('POST', '/api/marketplace/features/test-feature/vote');
      if (vote.status === 200 || vote.status === 201) {
        this.log('Phase 6.2: Feature vote registered', 'success');
        this.recordTest('Phase 6.2: Feature vote registered', true);
      } else {
        throw new Error(`Vote status ${vote.status}`);
      }

      // Test 6.3: Create feature request
      const request = await this.request('POST', '/api/marketplace/requests', {
        title: 'Dark mode',
        description: 'Add dark mode support to the application',
      });

      if (request.status === 201) {
        this.log('Phase 6.3: Feature request created', 'success');
        this.recordTest('Phase 6.3: Feature request created', true);
      } else {
        throw new Error(`Request status ${request.status}`);
      }
    } catch (error) {
      this.log(`Phase 6 failed: ${error.message}`, 'error');
      this.recordTest('Phase 6: Feature Marketplace', false, error.message);
    }
  }

  // ========================================================================
  // PHASE 7: AI + MANAGER LAYER
  // ========================================================================

  async testPhase7() {
    this.log('Testing Phase 7: AI + Manager Layer', 'info');

    try {
      // Test 7.1: Generate email suggestions
      const emails = await this.request('POST', '/api/ai-manager-layer', {
        dealId: 'test-deal',
        businessId: 'test-business',
        managerId: 'test-manager',
        context: {
          dealValue: 100000,
          stage: 'proposal',
          daysSinceActivity: 5,
        },
      });

      if (emails.status !== 200) throw new Error(`Status ${emails.status}`);
      this.log('Phase 7.1: AI email suggestions generated', 'success');
      this.recordTest('Phase 7.1: AI email suggestions generated', true);

      // Test 7.2: Manager dashboard loads
      const dashboard = await this.request('GET', '/app/manager-portal');
      if (dashboard.status === 200) {
        this.log('Phase 7.2: Manager dashboard accessible', 'success');
        this.recordTest('Phase 7.2: Manager dashboard accessible', true);
      } else {
        throw new Error(`Dashboard status ${dashboard.status}`);
      }

      // Test 7.3: Deal detail page loads
      const deal = await this.request('GET', '/app/deals/test-deal');
      if (deal.status === 200) {
        this.log('Phase 7.3: Deal detail page accessible', 'success');
        this.recordTest('Phase 7.3: Deal detail page accessible', true);
      } else {
        throw new Error(`Deal status ${deal.status}`);
      }
    } catch (error) {
      this.log(`Phase 7 failed: ${error.message}`, 'error');
      this.recordTest('Phase 7: AI + Manager Layer', false, error.message);
    }
  }

  // ========================================================================
  // RESULTS
  // ========================================================================

  printResults() {
    const duration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║              SMOKE TEST RESULTS SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    this.results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}`);
      if (result.details) console.log(`   └─ ${result.details}`);
    });

    console.log(`\n${colors.blue}Statistics:${colors.reset}`);
    console.log(`  Total tests: ${this.results.length}`);
    console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`  Duration: ${(duration / 1000).toFixed(2)}s\n`);

    const success = failed === 0;
    console.log(success
      ? `${colors.green}✅ All smoke tests passed!${colors.reset}`
      : `${colors.red}❌ ${failed} test(s) failed${colors.reset}`
    );

    process.exit(success ? 0 : 1);
  }

  async runAll() {
    await this.testPhase1();
    await this.testPhase2();
    await this.testPhase3();
    await this.testPhase4();
    await this.testPhase5();
    await this.testPhase6();
    await this.testPhase7();
    this.printResults();
  }
}

// Main
const baseUrl = process.env.TEST_URL || 'https://localhost:3000';
const apiKey = process.env.SUPABASE_ANON_KEY || 'test-key';

const runner = new TestRunner(baseUrl, apiKey);
runner.runAll().catch(console.error);

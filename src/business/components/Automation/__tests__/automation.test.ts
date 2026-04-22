import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { AutomationRule, AutomationCondition, AutomationAction } from '../../../types/automation';
import { ruleEngine } from '../../../services/automation/ruleEngine';
import { TriggerDetectionService } from '../../../services/automation/trigger-detection';

describe('Automation Engine', () => {
  let service: TriggerDetectionService;
  const businessId = 'test-business-123';

  beforeEach(() => {
    service = new TriggerDetectionService();
    service.init(businessId);
  });

  afterEach(() => {
    service.cleanup();
  });

  describe('Rule Creation & Validation', () => {
    it('should validate required fields', () => {
      const rule: Partial<AutomationRule> = {
        name: '',
        trigger_type: 'lead_added',
        action_type: 'send_email',
      };

      const validation = ruleEngine.validateRule(rule as AutomationRule);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Rule name is required');
    });

    it('should create valid rule', () => {
      const rule: AutomationRule = {
        id: '123',
        business_id: businessId,
        name: 'Welcome New Leads',
        trigger_type: 'lead_added',
        trigger_config: null,
        conditions: [],
        action_type: 'send_email',
        action_config: { template_id: 'welcome', delay_days: 0 },
        is_active: true,
        run_count: 0,
        created_at: new Date().toISOString(),
      };

      const validation = ruleEngine.validateRule(rule);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate equals condition', () => {
      const condition: AutomationCondition = {
        field: 'priority',
        operator: 'equals',
        value: 'high',
      };

      const leadData = { priority: 'high' };
      const result = ruleEngine.evaluateCondition(condition, leadData);
      expect(result).toBe(true);
    });

    it('should evaluate greater_than condition', () => {
      const condition: AutomationCondition = {
        field: 'days_in_stage',
        operator: 'greater_than',
        value: 5,
      };

      const leadData = { days_in_stage: 10 };
      const result = ruleEngine.evaluateCondition(condition, leadData);
      expect(result).toBe(true);
    });

    it('should evaluate contains condition', () => {
      const condition: AutomationCondition = {
        field: 'company',
        operator: 'contains',
        value: 'Tech',
      };

      const leadData = { company: 'Tech Solutions Inc' };
      const result = ruleEngine.evaluateCondition(condition, leadData);
      expect(result).toBe(true);
    });

    it('should evaluate AND logic between conditions', () => {
      const conditions: AutomationCondition[] = [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'days_in_stage', operator: 'greater_than', value: 5 },
      ];

      const leadData = { priority: 'high', days_in_stage: 10 };
      const result = ruleEngine.evaluateConditions(conditions, leadData, 'AND');
      expect(result).toBe(true);
    });

    it('should evaluate OR logic between conditions', () => {
      const conditions: AutomationCondition[] = [
        { field: 'priority', operator: 'equals', value: 'high' },
        { field: 'priority', operator: 'equals', value: 'critical' },
      ];

      const leadData = { priority: 'critical' };
      const result = ruleEngine.evaluateConditions(conditions, leadData, 'OR');
      expect(result).toBe(true);
    });
  });

  describe('Action Configuration', () => {
    it('should validate send_email action', () => {
      const action: AutomationAction = {
        type: 'send_email',
        config: {
          template_id: 'welcome',
          recipients: ['lead'],
          delay_days: 0,
        },
      };

      const validation = ruleEngine.validateAction(action);
      expect(validation.isValid).toBe(true);
    });

    it('should validate add_tag action', () => {
      const action: AutomationAction = {
        type: 'add_tag',
        config: {
          tags: ['hot-lead', 'priority'],
        },
      };

      const validation = ruleEngine.validateAction(action);
      expect(validation.isValid).toBe(true);
    });

    it('should validate webhook action', () => {
      const action: AutomationAction = {
        type: 'webhook',
        config: {
          url: 'https://example.com/webhook',
          method: 'POST',
          payload: { event: 'lead_qualified' },
        },
      };

      const validation = ruleEngine.validateAction(action);
      expect(validation.isValid).toBe(true);
    });

    it('should require valid webhook URL', () => {
      const action: AutomationAction = {
        type: 'webhook',
        config: {
          url: 'not-a-valid-url',
          method: 'POST',
        },
      };

      const validation = ruleEngine.validateAction(action);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.includes('URL'))).toBe(true);
    });
  });

  describe('Trigger Detection', () => {
    it('should emit lead_added event', (done) => {
      service.on('lead_added', (data) => {
        expect(data).toHaveProperty('leadId');
        expect(data).toHaveProperty('name');
        expect(data).toHaveProperty('email');
        done();
      });

      service.emit('lead_added', {
        leadId: 'lead-123',
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Acme Inc',
        source: 'website',
      });
    });

    it('should emit stage_changed event', (done) => {
      service.on('stage_changed', (data) => {
        expect(data.previousStage).toBe('prospect');
        expect(data.newStage).toBe('qualified');
        done();
      });

      service.emit('stage_changed', {
        leadId: 'lead-123',
        previousStage: 'prospect',
        newStage: 'qualified',
        timestamp: new Date(),
      });
    });

    it('should handle multiple event listeners', (done) => {
      let callCount = 0;

      const listener1 = () => {
        callCount++;
      };
      const listener2 = () => {
        callCount++;
      };

      service.on('lead_added', listener1);
      service.on('lead_added', listener2);

      service.emit('lead_added', {
        leadId: 'lead-123',
        name: 'Test',
        email: 'test@example.com',
      });

      setTimeout(() => {
        expect(callCount).toBe(2);
        done();
      }, 100);
    });

    it('should unsubscribe from events', (done) => {
      let callCount = 0;

      const unsubscribe = service.subscribe('lead_added', () => {
        callCount++;
      });

      service.emit('lead_added', {
        leadId: 'lead-123',
        name: 'Test',
        email: 'test@example.com',
      });

      unsubscribe();

      service.emit('lead_added', {
        leadId: 'lead-456',
        name: 'Test 2',
        email: 'test2@example.com',
      });

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('Rule Execution', () => {
    it('should execute rule on trigger match', async () => {
      const rule: AutomationRule = {
        id: 'rule-123',
        business_id: businessId,
        name: 'Auto Tag Hot Leads',
        trigger_type: 'lead_added',
        trigger_config: null,
        conditions: [
          {
            field: 'priority',
            operator: 'equals',
            value: 'high',
          },
        ],
        action_type: 'add_tag',
        action_config: { tags: ['hot'] },
        is_active: true,
        run_count: 0,
        created_at: new Date().toISOString(),
      };

      const leadData = {
        leadId: 'lead-123',
        priority: 'high',
        name: 'John Doe',
      };

      const result = ruleEngine.evaluateRuleForExecution(rule, 'lead_added', leadData);
      expect(result.shouldExecute).toBe(true);
      expect(result.conditionsMatched).toBe(true);
    });

    it('should not execute rule when conditions do not match', async () => {
      const rule: AutomationRule = {
        id: 'rule-123',
        business_id: businessId,
        name: 'Auto Tag Hot Leads',
        trigger_type: 'lead_added',
        trigger_config: null,
        conditions: [
          {
            field: 'priority',
            operator: 'equals',
            value: 'high',
          },
        ],
        action_type: 'add_tag',
        action_config: { tags: ['hot'] },
        is_active: true,
        run_count: 0,
        created_at: new Date().toISOString(),
      };

      const leadData = {
        leadId: 'lead-123',
        priority: 'low',
        name: 'Jane Doe',
      };

      const result = ruleEngine.evaluateRuleForExecution(rule, 'lead_added', leadData);
      expect(result.shouldExecute).toBe(false);
      expect(result.conditionsMatched).toBe(false);
    });

    it('should not execute inactive rules', async () => {
      const rule: AutomationRule = {
        id: 'rule-123',
        business_id: businessId,
        name: 'Inactive Rule',
        trigger_type: 'lead_added',
        trigger_config: null,
        conditions: [],
        action_type: 'send_email',
        action_config: { template_id: 'welcome' },
        is_active: false,
        run_count: 0,
        created_at: new Date().toISOString(),
      };

      const leadData = { leadId: 'lead-123', name: 'Test' };

      const result = ruleEngine.evaluateRuleForExecution(rule, 'lead_added', leadData);
      expect(result.shouldExecute).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid trigger type gracefully', () => {
      const result = ruleEngine.evaluateRuleForExecution(
        {
          id: 'rule-123',
          business_id: businessId,
          name: 'Test',
          trigger_type: 'invalid_trigger' as any,
          conditions: [],
          action_type: 'send_email',
          action_config: {},
          is_active: true,
          run_count: 0,
          created_at: new Date().toISOString(),
        },
        'invalid_trigger' as any,
        {}
      );

      expect(result.error).toBeDefined();
      expect(result.shouldExecute).toBe(false);
    });

    it('should handle missing lead data gracefully', () => {
      const condition: AutomationCondition = {
        field: 'priority',
        operator: 'equals',
        value: 'high',
      };

      const result = ruleEngine.evaluateCondition(condition, {});
      expect(result).toBe(false);
    });
  });

  describe('Performance', () => {
    it('should evaluate complex rules efficiently', () => {
      const start = performance.now();

      const conditions: AutomationCondition[] = Array.from({ length: 10 }, (_, i) => ({
        field: 'status',
        operator: 'equals',
        value: `status-${i}`,
      }));

      const leadData = { status: 'status-0' };

      const result = ruleEngine.evaluateConditions(conditions, leadData, 'AND');

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in < 100ms
      expect(result).toBe(true);
    });
  });
});

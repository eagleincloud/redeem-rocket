# Automation Engine Design Specification
**Version 1.0 | Status: Ready for Implementation | Phase 2B**

## Executive Summary

The Automation Engine is a production-grade workflow automation system that enables business owners to create sophisticated, AI-powered automation rules. Triggered by pipeline events (lead added, stage changed, inactivity), it evaluates complex conditions and executes multiple actions (email, task creation, webhooks, field updates). Integrated with Smart Onboarding for AI-generated rules and the Pipeline Engine for event triggers.

## 1. System Architecture

### 1.1 Architecture Layers

```
┌─────────────────────────────────────────┐
│     React Frontend (Business App)       │
│  ┌─────────────────────────────────────┐│
│  │ Components (RuleList, RuleBuilder)  ││
│  │ + Hooks (useAutomationRules, etc)   ││
│  │ + Pages (AutomationPage)            ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │ REST API
┌──────────────v──────────────────────────┐
│   API Service Layer (src/app/api/)      │
│  ┌─────────────────────────────────────┐│
│  │ CRUD (rules, templates)             ││
│  │ Execution & Testing                 ││
│  │ Validation & Authorization          ││
│  │ History & Logging                   ││
│  └─────────────────────────────────────┘│
└──────────────┬──────────────────────────┘
               │ Supabase Client
┌──────────────v──────────────────────────┐
│    Supabase Backend                     │
│  ┌─────────────────────────────────────┐│
│  │ PostgreSQL Database                 ││
│  │ RLS Policies & Row Security         ││
│  │ Database Functions & Triggers       ││
│  │ Real-time Subscriptions             ││
│  │ Edge Functions (Webhooks, Email)    ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

## 2. Trigger Types (6 Total)

1. **lead_added** - New entity created in pipeline
2. **stage_changed** - Entity moved between stages
3. **inactivity** - No updates for N days in specific stage
4. **email_opened** - Tracking email from automation opened
5. **email_clicked** - Link in tracking email clicked
6. **milestone_reached** - Custom event or threshold hit

## 3. Condition Operators (18 Total)

**String (7)**: equals, not_equals, contains, not_contains, starts_with, ends_with, matches_regex
**Numeric (4)**: equals, greater_than, less_than, between
**Empty (2)**: is_empty, is_not_empty
**Set (2)**: in_list, not_in_list
**Pattern (1)**: matches_pattern
**Date (3)**: date_equals, date_after, date_before

## 4. Action Types (6 Total)

1. **send_email** - Send templated email to lead/user
2. **assign_user** - Assign entity to user or team
3. **add_tag** - Add one or more tags to entity
4. **create_task** - Create follow-up task assigned to user
5. **webhook** - HTTP POST to external service
6. **update_field** - Set value of custom field

## 5. Database Schema

### Core Tables:
- `automation_rules` - Rule definitions (enabled, trigger, stats)
- `automation_conditions` - Conditions with AND/OR logic
- `automation_actions` - Action configurations
- `automation_executions` - Execution history & results
- `automation_execution_logs` - Detailed execution logs
- `automation_email_templates` - Email template library

### Key Features:
- RLS policies for multi-tenant security
- Full audit trail of executions
- Statistics tracking (runs, successes, failures)
- Support for nested conditions (AND/OR logic)
- Email template variables with validation

## 6. Core Components (8 Total)

1. **RuleList** - View all rules, toggle enable/disable, create new
2. **RuleBuilder** - Wizard for creating/editing rules (4 steps)
3. **TriggerSelector** - Pick trigger type with options
4. **ConditionBuilder** - AND/OR logic with 18 operators
5. **ActionBuilder** - Configure actions with defaults
6. **ExecutionLogs** - View rule execution history & details
7. **RuleDebugger** - Dry-run rules with test data
8. **EmailTemplateEditor** - Create/edit email templates

## 7. Service Layer API (20+ Functions)

**Rules**:
- getRules, getRule, createRule, updateRule, deleteRule
- enableRule, disableRule, duplicateRule

**Testing**:
- testTrigger, dryRunRule, testEmail

**Execution**:
- getExecutionHistory, getExecutionLogs, getExecutionStats

**Templates**:
- getEmailTemplates, createEmailTemplate, updateEmailTemplate, deleteEmailTemplate

## 8. Routes

```
/automation                    - Rule list
/automation/new               - Create new rule
/automation/:id               - Edit rule
/automation/:id/logs          - View execution logs
/automation/:id/debug         - Debug/test rule
/email-templates              - Email template manager
```

## 9. Performance & Quality

- **Latency**: Trigger detection < 5s, action execution < 30s
- **Success Rate**: > 99% for action execution, > 95% email delivery
- **Testing**: > 85% code coverage
- **Database**: Indexed on business_id, rule status, trigger type
- **Async**: Email, webhook - queue-based with retry logic
- **Security**: Full RLS policies, input validation, PII masking

## 10. Integration Points

**Pipeline Engine**:
- Triggers: lead_added, stage_changed, inactivity
- Entity context: All pipeline fields available in conditions/actions
- Audit: Actions logged in pipeline_history

**Smart Onboarding**:
- Initial rules: AI-generated templates during onboarding
- Context: Business type, industry, use case
- Suggestions: Recommend rules based on behavior

**Email Service**:
- Templates: Centralized template library
- Tracking: Opens/clicks via email provider
- Variables: Dynamic content substitution ({{name}}, {{company}}, etc)

## 11. Implementation Timeline

**Week 1**:
- Database schema & migration
- TypeScript types
- Rule engine (18 operators)
- Service layer API

**Week 2**:
- React components (8)
- Custom hooks & services
- Trigger detection
- Email templates
- Routing & documentation
- Tests (85%+ coverage)

**Deliverables**: Production-ready automation system with comprehensive docs

---

**Version**: 1.0 | **Status**: Ready for Implementation | **Phase**: 2B

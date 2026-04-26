# Quick Reference - Database Schema

## Table Summary

| Table | Purpose | Rows at 100k Businesses | Key Indexes |
|-------|---------|----------------------|------------|
| `business_categories` | Category hierarchy | 20-50 | parent_category, name |
| `business_types` | Types per category | 100-500 | category_id, slug |
| `templates` | Feature packages | 200-1000 | business_type_id, is_default |
| `template_pipelines` | Pre-configured pipelines | 500-2000 | template_id, type |
| `template_automations` | Event automation rules | 1000-5000 | template_id, trigger_type |
| `category_questions` | Onboarding questions | 500-2000 | category_id, order |
| `business_profiles` | Core businesses | 100,000 | auth_user_id, category_id, slug |
| `behavior_tracking` | User action events | 100M+ | (partitioned by date) |
| `recommendations` | Smart suggestions | 500k | business_id, priority |
| `feature_usage_stats` | Daily analytics | 10M+ | (partitioned by date) |
| `template_applications` | Template audit log | 500k | business_id, template_id |
| `template_versions` | Template history | 5k-10k | template_id, version |
| `business_feature_toggles` | Per-business features | 5M+ | business_id, feature_name |

---

## Common Queries

### Get Business with All Context
```sql
SELECT * FROM v_business_with_template WHERE business_id = $1;
-- Returns: Business + category name + type name + template name
-- Expected latency: < 50ms
```

### Record User Action
```sql
INSERT INTO behavior_tracking (
  business_id, feature_used, action_type, duration_seconds, status, timestamp
) VALUES ($1, $2, $3, $4, $5, NOW());
-- Expected latency: < 10ms
```

### Get Recent Activities
```sql
SELECT * FROM behavior_tracking 
WHERE business_id = $1 
ORDER BY timestamp DESC 
LIMIT 50;
-- Expected latency: < 100ms
```

### Get Onboarding Progress
```sql
SELECT * FROM calculate_onboarding_progress($1);
-- Returns: (step, progress_percentage)
-- Expected latency: < 30ms
```

### Get Recommendations
```sql
SELECT * FROM recommendations 
WHERE business_id = $1 
AND dismissed_at IS NULL 
ORDER BY priority DESC;
-- Expected latency: < 100ms
```

### Get Feature Adoption by Category
```sql
SELECT feature_name, adoption_rate, avg_success_score 
FROM feature_usage_stats 
WHERE category_id = $1 
AND stat_date = CURRENT_DATE - 1
ORDER BY adoption_rate DESC;
-- Expected latency: < 50ms
```

### Get Onboarded Businesses
```sql
SELECT COUNT(*) FROM business_profiles 
WHERE status = 'active' 
AND onboarding_completed_at IS NOT NULL;
-- Expected latency: < 100ms (with index)
```

---

## RLS Policies Summary

| Table | Policy | Access |
|-------|--------|--------|
| `business_categories` | public_read | Everyone (is_active=true) |
| `business_types` | public_read | Everyone (is_active=true) |
| `templates` | public_read | Everyone (is_active=true) |
| `template_pipelines` | public_read | Everyone (is_active=true) |
| `template_automations` | public_read | Everyone (is_active=true) |
| `category_questions` | public_read | Everyone (is_active=true) |
| `business_profiles` | own_business | Own profile only (auth.uid()=auth_user_id) |
| `behavior_tracking` | own_via_business | Own business via EXISTS subquery |
| `recommendations` | own_via_business | Own business via EXISTS subquery |
| `feature_usage_stats` | aggregate_read | Category level (public) or own business |
| `business_feature_toggles` | own_via_business | Own business via EXISTS subquery |

---

## JSONB Structures

### Template Configuration
```json
{
  "default_features": ["products", "orders", "customers", "offers"],
  "dashboard_config": {
    "layout": "grid",
    "widgets": [
      {"type": "sales_summary", "position": [0, 0]},
      {"type": "recent_orders", "position": [1, 0]}
    ]
  },
  "ui_theme": {
    "primary_color": "#FF5733",
    "secondary_color": "#C70039",
    "font_family": "Inter"
  },
  "recommended_addons": ["loyalty", "delivery_tracking"],
  "success_metrics": [
    {"metric": "daily_orders", "target": 50},
    {"metric": "average_order_value", "target": 25}
  ]
}
```

### Business Answers
```json
{
  "q1": "restaurant",
  "q2": "high_volume",
  "q3": true,
  "business_size": "10-50 employees",
  "has_delivery": true,
  "multiple_locations": false
}
```

### Pipeline Configuration
```json
{
  "stages": [
    {"name": "lead", "order": 1},
    {"name": "proposal", "order": 2},
    {"name": "won", "order": 3}
  ],
  "stage_definitions": {
    "lead": {
      "duration_target_days": 1,
      "required_fields": ["email", "phone"]
    }
  },
  "rules": [
    {
      "trigger": "first_contact_logged",
      "action": "move_to_stage",
      "target_stage": "contacted"
    }
  ]
}
```

### Automation Configuration
```json
{
  "trigger_config": {
    "event": "order_created",
    "conditions": [{"field": "order_total", "operator": ">", "value": 10}]
  },
  "action_config": {
    "channel": "sms",
    "template": "order_confirmation",
    "recipient_field": "customer.phone"
  }
}
```

---

## Performance Tips

### 1. Use Indexes Effectively
```sql
-- ✓ GOOD: Uses index on (auth_user_id)
SELECT * FROM business_profiles 
WHERE auth_user_id = 'uuid' AND status = 'active';

-- ✗ BAD: Full table scan on JSONB
SELECT * FROM business_profiles 
WHERE answers_json @> '{"q1": "value"}';

-- ✓ Fix with index:
CREATE INDEX idx_answers_q1 ON business_profiles 
USING GIN ((answers_json -> 'q1'));
```

### 2. Batch Operations
```sql
-- ✓ GOOD: Batch insert
INSERT INTO behavior_tracking (...) 
VALUES ($1), ($2), ($3), ...;

-- ✗ BAD: Individual inserts
INSERT INTO behavior_tracking (...) VALUES ($1);
INSERT INTO behavior_tracking (...) VALUES ($2);
```

### 3. Limit Result Sets
```sql
-- ✓ GOOD: Pagination
SELECT * FROM behavior_tracking 
WHERE business_id = $1 
ORDER BY timestamp DESC 
LIMIT 50 OFFSET 0;

-- ✗ BAD: Unlimited results
SELECT * FROM behavior_tracking 
WHERE business_id = $1;
```

### 4. Use Views
```sql
-- ✓ GOOD: Pre-computed join
SELECT * FROM v_business_with_template 
WHERE business_id = $1;

-- ✗ BAD: Manual joins
SELECT bp.*, bc.name, bt.name, t.name 
FROM business_profiles bp 
LEFT JOIN business_categories bc ON ...
LEFT JOIN business_types bt ON ...
LEFT JOIN templates t ON ...;
```

---

## Monitoring Checklist

### Daily
- [ ] Stats aggregation completed
- [ ] Recommendation generation ran
- [ ] Error rate < 1%
- [ ] Uptime 99.9%+

### Weekly
- [ ] Query latencies within targets
- [ ] Database size growing normally
- [ ] RLS policies effective
- [ ] No unused indexes

### Monthly
- [ ] Table bloat < 30%
- [ ] Archive old data > 90 days
- [ ] Review slow queries
- [ ] Test restore procedure

---

## Deployment Checklist

**Pre-Production**
- [ ] Schema created
- [ ] RLS enabled
- [ ] Indexes created
- [ ] 1000+ test records
- [ ] Load test passed

**Launch Day**
- [ ] Seed reference data
- [ ] Deploy aggregation job
- [ ] Enable monitoring
- [ ] Verify backups
- [ ] Test RLS with real users

**Week 1**
- [ ] Monitor query latencies
- [ ] Check stats aggregation
- [ ] Monitor for errors
- [ ] Collect performance metrics

---

## Useful SQL Snippets

### Check Index Health
```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Check Slow Queries
```sql
SELECT query, mean_exec_time, max_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 20;
```

### Table & Index Sizes
```sql
SELECT
  schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size DESC;
```

### RLS Policy Check
```sql
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Database Growth Rate
```sql
SELECT
  DATE(now()) as date,
  (SELECT pg_database_size('main')) / 1024.0 / 1024.0 as size_mb;
```

---

## Contact & Support

For questions about the schema:
1. Check SCHEMA_ARCHITECTURE.md for detailed design rationale
2. See IMPLEMENTATION_GUIDE.md for code patterns
3. Review DEPLOYMENT_CHECKLIST.md for operational guidance

Created: April 26, 2026
Version: 1.0
Status: Production-Ready

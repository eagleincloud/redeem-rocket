# Deployment & Operations Checklist

## Pre-Deployment Verification

### Schema Validation
- [ ] All tables created with correct column types
- [ ] All foreign keys have corresponding references
- [ ] All indexes created for performance
- [ ] RLS policies enabled on all tables
- [ ] Primary keys all UUIDs (except dates)
- [ ] Timestamps all TIMESTAMPTZ (UTC)

### Test Data
- [ ] Seed 10 business categories with hierarchy
- [ ] Create 5 business types per category
- [ ] Create 2 templates per business type
- [ ] Create pipelines (sales, support) per template
- [ ] Create automations per template
- [ ] Create 20-30 questions per category
- [ ] Create 50+ test business profiles
- [ ] Generate 10k+ behavior tracking events
- [ ] Verify RLS policies work correctly

---

## Phase 1: Foundation Deployment (Week 1)

### Step 1: Create Base Tables
```bash
supabase migration up
```

### Step 2: Enable RLS
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'business%' OR tablename LIKE 'template%'
ORDER BY tablename;
-- Should show 'on' for all
```

### Step 3: Seed Reference Data
Categories, business types, templates, pipelines, automations, and questions.

### Step 4: Load Test (100 concurrent businesses)
Test RLS with multiple users and onboarding flow.

---

## Phase 2: Analytics Deployment (Week 2)

### Step 1: Deploy Daily Aggregation Job
```sql
-- Aggregate stats nightly
SELECT cron.schedule('aggregate-daily-stats', '2 2 * * *', 
  'SELECT aggregate_stats_by_category(CURRENT_DATE - 1)');
```

### Step 2: Create Materialized Views
Pre-compute category adoption and template performance metrics.

### Step 3: Validate Data Pipeline
Verify aggregation runs successfully and generates stats.

---

## Phase 3: Recommendations Deployment (Week 3)

### Step 1: Deploy Generation Logic
Trigger recommendations on:
- Onboarding completion
- Daily refresh
- Template application

### Step 2: Monitor Quality
Track engagement, dismissals, and actions on recommendations.

---

## Phase 4: Optimization & Scale (Week 4+)

### Step 1: Implement Table Partitioning
Partition behavior_tracking by month for better performance.

### Step 2: Archive Old Data
Move behavior_tracking >1 year old to cold storage.

### Step 3: Connection Pooling
Use PgBouncer in transaction mode for serverless deployments.

---

## Production Monitoring

### Key Metrics to Watch

**Query Performance**
- Business lookup with template: < 50ms
- Behavior event insert: < 10ms
- Feature stats query: < 100ms

**Table Sizes**
- behavior_tracking growth rate
- Archive when exceeds 50GB

**RLS Impact**
- Subquery latency < 50ms
- Alert if > 200ms

**Aggregation Health**
- Daily stats complete within 5 minutes
- Recommendation generation < 30s per business

---

## Alerting Rules

**Critical** (Page on-call):
- Database down
- Replication lag > 60s
- Queries > 5s
- Connection limit > 90%

**Warning** (Slack):
- Queries > 1s
- Stats aggregation > 5m
- RLS subquery > 200ms

**Info** (Daily digest):
- Businesses created
- Onboarding completion rate
- Feature adoption rates

---

## Disaster Recovery

**Backup Strategy**
- Full daily backup + 6-hourly incremental
- 30-day retention for full backups
- Test restore monthly

**RTO**: < 1 hour (full database)
**RPO**: < 1 hour (acceptable data loss)

---

## Performance Baselines

| Metric | Target | Alert |
|--------|--------|-------|
| Business lookup | < 50ms | > 200ms |
| Behavior insert | < 10ms | > 50ms |
| Behavior query (50 items) | < 100ms | > 500ms |
| Stats aggregation | < 5m | > 10m |
| Recommendations | < 30s/biz | > 60s |
| RLS overhead | < 50ms | > 200ms |

---

## Success Criteria

- [ ] All tables created with RLS enabled
- [ ] 1000+ test businesses working
- [ ] Onboarding flow end-to-end
- [ ] Behavior tracking captures all events
- [ ] Stats aggregation runs daily
- [ ] Recommendations generated
- [ ] All queries within latency targets
- [ ] 99.9% uptime in first month
- [ ] Handles 10k+ concurrent businesses


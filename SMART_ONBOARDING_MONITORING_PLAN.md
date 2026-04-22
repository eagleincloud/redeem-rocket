# Smart Onboarding - Monitoring & Success Metrics Plan

**Date**: 2026-04-22  
**Duration**: First 24 hours critical, then ongoing weekly  
**Monitoring Lead**: [TBD]  

---

## Table of Contents

1. [Real-Time Monitoring Dashboard](#real-time-monitoring-dashboard)
2. [Key Performance Indicators](#key-performance-indicators)
3. [Alert Configuration](#alert-configuration)
4. [Monitoring Tools Setup](#monitoring-tools-setup)
5. [Daily Monitoring Checklist](#daily-monitoring-checklist)
6. [Incident Response Procedures](#incident-response-procedures)
7. [Escalation Thresholds](#escalation-thresholds)
8. [Weekly Review Process](#weekly-review-process)

---

## Real-Time Monitoring Dashboard

### Dashboard 1: Infrastructure Health

**URL**: https://vercel.com/dashboard → Project → Monitoring  
**Refresh Rate**: Every 1 minute (first 4 hours), then every 5 minutes  
**Stakeholders**: DevOps, Engineering Team

```
┌────────────────────────────────────────┐
│ DEPLOYMENT HEALTH DASHBOARD            │
├────────────────────────────────────────┤
│                                        │
│ Site Status:        ✅ UP             │
│ Last Build:         2026-04-22 10:05  │
│ Deployment Status:  ✅ DEPLOYED       │
│ Response Time:      247ms (avg)       │
│ Error Rate:         0.02%             │
│ CDN Cache:          ✅ Primed         │
│                                        │
│ Recent Deployments:                    │
│ ✅ 10:05 Smart Onboarding v1.0        │
│ ✅ 09:20 Feature Marketplace v2.1     │
│ ✅ 08:15 Admin Dashboard v1.2         │
│                                        │
└────────────────────────────────────────┘
```

**Metrics to Track**:
- [ ] Build status (success/failure)
- [ ] Deployment status (active)
- [ ] Server response time
- [ ] Bundle size delivered
- [ ] CDN cache hit rate

### Dashboard 2: Application Performance

**URL**: Supabase Dashboard → Analytics  
**Refresh Rate**: Every 1 minute first hour, then every 5 minutes  
**Stakeholders**: Backend Team, Product Team

```
┌────────────────────────────────────────┐
│ APPLICATION PERFORMANCE                │
├────────────────────────────────────────┤
│                                        │
│ Active Users:       12 (in onboarding) │
│ API Success Rate:   99.8%              │
│ Avg Response Time:  234ms              │
│ 95th %ile Response: 456ms              │
│ Error Rate:         0.2%               │
│ Slow Queries (>1s): 0                  │
│                                        │
│ Database Stats:                        │
│ Connection Count:   8/20               │
│ Query Latency:      45ms (avg)         │
│ Row Operations/min: 1,200              │
│ Storage Used:       2.3GB/5GB          │
│                                        │
└────────────────────────────────────────┘
```

**Metrics to Track**:
- [ ] API success rate (target: >99%)
- [ ] API response time (target: <300ms)
- [ ] Error rate (target: <0.5%)
- [ ] Active user count
- [ ] Database query performance
- [ ] Connection pool usage

### Dashboard 3: Onboarding Metrics

**URL**: Custom analytics (or Google Analytics)  
**Refresh Rate**: Every 5 minutes  
**Stakeholders**: Product Team, Marketing

```
┌────────────────────────────────────────┐
│ SMART ONBOARDING ANALYTICS             │
├────────────────────────────────────────┤
│                                        │
│ New Users Started:  12                 │
│ Completed:         8 (67%)             │
│ Abandoned:         4 (33%)             │
│ Avg Completion:    4m 23s              │
│                                        │
│ Feature Preferences:                   │
│ Product Catalog:   10 (83%)            │
│ Lead Mgmt:         6 (50%)             │
│ Email Campaigns:   4 (33%)             │
│ Automation:        7 (58%)             │
│ Social Media:      3 (25%)             │
│                                        │
│ Errors:            0                   │
│ Support Tickets:   0                   │
│                                        │
└────────────────────────────────────────┘
```

**Metrics to Track**:
- [ ] Onboarding start count
- [ ] Completion count
- [ ] Completion rate
- [ ] Avg completion time
- [ ] Feature selection distribution
- [ ] Error count
- [ ] Support tickets

---

## Key Performance Indicators

### Tier 1: Critical KPIs (Immediate Action if Threshold Breached)

| KPI | Target | Warning | Critical | Alert |
|-----|--------|---------|----------|-------|
| **Site Uptime** | >99.9% | <99.5% | <99% | Immediate |
| **Error Rate** | <0.1% | 0.1-0.5% | >0.5% | Immediate |
| **Onboarding Completion Rate** | >70% | 50-70% | <50% | Within 1 hour |
| **Avg Response Time** | <200ms | 200-300ms | >300ms | Within 5 min |
| **API Error Rate** | <0.1% | 0.1-0.5% | >0.5% | Immediate |

### Tier 2: Important KPIs (Monitor & Report)

| KPI | Target | Acceptable | Review Action |
|-----|--------|-----------|---------------|
| **95th %ile Response Time** | <400ms | <500ms | If >500ms |
| **Database Query Time** | <100ms | <200ms | If >200ms |
| **Active Users (Peak)** | N/A | Track | Weekly report |
| **Feature Adoption Rate** | N/A | Track | Weekly report |
| **Page Load Time** | <2s | <3s | If >3s |

### Tier 3: Operational KPIs (Trending & Analysis)

| KPI | Target | Frequency | Owner |
|-----|--------|-----------|-------|
| **Onboarding Start Count** | >10/day | Daily | Product |
| **Average Completion Time** | <5min | Daily | Product |
| **Feature Selection Distribution** | Balanced | Weekly | Product |
| **User Satisfaction Score** | >4.0/5 | Weekly | Product |
| **Support Ticket Volume** | <2/day | Daily | Support |

---

## Alert Configuration

### Alert 1: Site Down or Unresponsive

**Condition**: Site returns HTTP 5xx or times out for 2+ requests  
**Severity**: 🔴 CRITICAL  
**Response Time**: Immediate  

**What to Do**:
1. Check Vercel Dashboard status
2. Check Supabase status
3. Attempt manual site access
4. Check Git logs for recent changes
5. Execute rollback if needed
6. Alert on-call engineer

**Alert Recipients**: On-call engineer, Tech Lead, CTO

### Alert 2: High Error Rate

**Condition**: Error rate >1% sustained for 5+ minutes  
**Severity**: 🔴 CRITICAL  
**Response Time**: Immediate  

**What to Do**:
1. Identify error type in logs
2. Check affected feature
3. Determine if rollback needed
4. If Onboarding broken: consider rollback
5. If non-critical: monitor and fix

**Alert Recipients**: Engineering team, Tech Lead

### Alert 3: Onboarding Failing

**Condition**: >50% of onboarding attempts fail to save  
**Severity**: 🔴 CRITICAL  
**Response Time**: Within 5 minutes  

**What to Do**:
1. Check Supabase status
2. Check for RLS policy errors
3. Verify API connectivity
4. Check database storage
5. Prepare rollback if needed
6. Contact support team

**Alert Recipients**: Backend team, Tech Lead, Support

### Alert 4: Performance Degradation

**Condition**: Response time >500ms for 10+ minutes  
**Severity**: 🟠 HIGH  
**Response Time**: Within 15 minutes  

**What to Do**:
1. Check database query times
2. Check database connections
3. Monitor CPU/memory
4. Identify slow queries
5. Optimize or scale if needed
6. Monitor after fix

**Alert Recipients**: Backend team, DevOps

### Alert 5: Database Issues

**Condition**: Database connection errors or slow queries (>1s)  
**Severity**: 🟠 HIGH  
**Response Time**: Within 15 minutes  

**What to Do**:
1. Check Supabase dashboard
2. Check connection pool status
3. Identify slow queries
4. Check for locks
5. Restart connection pool if needed
6. Monitor for recovery

**Alert Recipients**: DevOps, Database team

### Alert 6: Unusual Onboarding Activity

**Condition**: Completion rate drops below 50%  
**Severity**: 🟡 MEDIUM  
**Response Time**: Within 1 hour  

**What to Do**:
1. Check for errors in logs
2. Analyze incomplete submissions
3. Contact affected users
4. Offer support
5. Collect feedback
6. Plan improvements

**Alert Recipients**: Product team, Support team

---

## Monitoring Tools Setup

### Tool 1: Vercel Monitoring

**Setup Instructions**:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Monitoring
4. Enable:
   - [ ] Build failure alerts
   - [ ] Deployment failure alerts
   - [ ] Performance degradation alerts
   - [ ] Function errors
5. Set thresholds:
   - [ ] Response time: 500ms
   - [ ] Error rate: 1%
6. Configure notifications:
   - [ ] Email to ops-team@company.com
   - [ ] Slack to #deployments channel

**Monitoring Commands**:
```bash
# Check deployment status
vercel projects list
vercel deployments

# Check latest logs
vercel logs --follow
```

### Tool 2: Supabase Monitoring

**Setup Instructions**:

1. Go to https://app.supabase.com/project/[id]
2. Dashboard → Monitoring
3. Enable alerts:
   - [ ] Database error rate >1%
   - [ ] API latency >500ms
   - [ ] Connection errors
   - [ ] Auth failures
4. Configure thresholds:
   - [ ] Database latency: 200ms
   - [ ] API latency: 300ms
5. Set up Slack integration:
   - Manage → Integrations → Slack

**Monitoring Queries**:
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 100 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check connection count
SELECT count(*) FROM pg_stat_activity;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Tool 3: Browser Console Error Tracking

**Setup** (if using Sentry or similar):

1. Go to https://sentry.io/dashboard
2. Create new project for redeemrocket.in
3. Install Sentry SDK:
   ```bash
   npm install @sentry/react
   ```
4. Initialize in app:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_DSN_HERE",
     environment: "production",
     tracesSampleRate: 1.0
   });
   ```
5. Monitor dashboard for errors
6. Set up alerts for new error types

**Alternative**: Use Supabase Edge Function logs:

```bash
supabase functions list
supabase functions logs [function-name]
```

### Tool 4: Custom Analytics Dashboard

**Setup** (using Google Analytics or Mixpanel):

1. Add tracking to Smart Onboarding component:
   ```typescript
   // Track onboarding start
   gtag('event', 'onboarding_start');
   
   // Track question completion
   gtag('event', 'onboarding_question_answered', {
     question_number: step + 1
   });
   
   // Track completion
   gtag('event', 'onboarding_completed', {
     time_to_complete: completionTime
   });
   ```

2. Create dashboard in Google Analytics:
   - Audience → Overview (new users)
   - Conversion → Goals (onboarding completion)
   - Behavior → Content (page views)

---

## Daily Monitoring Checklist

### Morning (Within 1 hour of deployment)

- [ ] **Site Status**: Visit https://redeemrocket.in
  - Loads without errors
  - No 5xx errors
  - Fast loading (<3s)
  
- [ ] **Browser Console**: Press F12
  - No critical errors
  - No red errors
  - Only expected warnings

- [ ] **Vercel Dashboard**: Check deployments
  - Latest deployment shows "Built & Ready"
  - No build failures
  - All previous deployments successful

- [ ] **Supabase Dashboard**: Check status
  - Database shows "Healthy"
  - API responding
  - No pending migrations

- [ ] **Error Rate**: Check monitoring
  - Error rate <0.5%
  - No spike in errors
  - Performance normal

- [ ] **User Activity**: Check analytics
  - Users accessing new feature
  - Onboarding completions happening
  - No obvious issues reported

### Hourly (First 4 hours)

- [ ] **Refresh dashboards** (Vercel, Supabase, Analytics)
- [ ] **Check error logs** for new errors
- [ ] **Verify API responses** are successful
- [ ] **Monitor response times** stay under threshold
- [ ] **Watch user feedback channels** (Slack, email)
- [ ] **Track onboarding metrics** (starts vs completions)

### Every 4 Hours (Day 1)

- [ ] **Full system check**:
  - [ ] Test onboarding flow manually
  - [ ] Verify database persistence
  - [ ] Check feature settings
  - [ ] Verify navigation updates
  - [ ] Test on multiple browsers

- [ ] **Performance check**:
  - [ ] Lighthouse score
  - [ ] Bundle size
  - [ ] Database query times
  - [ ] API response times

- [ ] **Error review**:
  - [ ] Read all error logs
  - [ ] Identify any patterns
  - [ ] Plan fixes if needed
  - [ ] Update team

### Daily (Day 2+)

- [ ] **Morning review**: Check overnight activity
- [ ] **User metrics**: Review onboarding stats
- [ ] **Error report**: Summarize any issues
- [ ] **Team sync**: Share findings
- [ ] **Plan next steps**: What to monitor next

---

## Incident Response Procedures

### P1 Incident (Site Down or Onboarding Broken)

**Time to Respond**: Immediate  
**Time to Resolve**: <30 minutes

**Step 1: Acknowledge (1 minute)**
```
[ ] Verify incident reported
[ ] Acknowledge to reporter
[ ] Open incident channel in Slack
[ ] Alert on-call engineer
[ ] Start incident timeline
```

**Step 2: Assess (2 minutes)**
```
[ ] What is broken? (which feature)
[ ] How many users affected? (estimate)
[ ] Can users proceed? (workaround possible)
[ ] Is data at risk? (safe or backup needed)
[ ] Root cause obvious? (logs, recent changes)
```

**Step 3: Communicate (2 minutes)**
```
[ ] Alert engineering team
[ ] Alert product team
[ ] Alert support team
[ ] Update status page (if public)
[ ] Notify stakeholders
[ ] Plan communication cadence (every 5 min)
```

**Step 4: Investigate (5-10 minutes)**
```
[ ] Check Vercel build logs
[ ] Check Supabase logs
[ ] Check browser console
[ ] Check network requests
[ ] Review recent changes
[ ] Identify root cause
[ ] Estimate time to fix
```

**Step 5: Execute Fix (5-15 minutes)**
```
[ ] If obvious fix: deploy immediately
[ ] If uncertain: rollback to known good state
[ ] Monitor fix for 5 minutes
[ ] Verify incident resolved
[ ] Check for secondary issues
```

**Step 6: Post-Incident (30-60 minutes)**
```
[ ] Update incident timeline
[ ] Document root cause
[ ] Identify prevention measures
[ ] Plan follow-up improvements
[ ] Schedule incident review meeting
[ ] Notify all stakeholders of resolution
[ ] Collect user feedback
```

### P2 Incident (Feature Degraded or Performance Issue)

**Time to Respond**: Within 15 minutes  
**Time to Resolve**: <2 hours

**Steps**:
1. Assess impact and scope
2. Notify relevant teams
3. Gather logs and metrics
4. Identify root cause
5. Plan and execute fix
6. Monitor for stability
7. Document lessons learned

### P3 Incident (Minor Bug or Non-Critical Issue)

**Time to Respond**: Within 1 hour  
**Time to Resolve**: <8 hours (or schedule for next release)

**Steps**:
1. Document issue thoroughly
2. Create support ticket/bug report
3. Notify team
4. Plan fix for next release or ASAP
5. Provide user workaround if possible
6. Resolve when able

---

## Escalation Thresholds

### Auto-Escalation Criteria

**Escalate from Developer → Team Lead if**:
- Issue not identified within 10 minutes
- Issue requires database changes
- Issue requires code rollback
- Issue affects multiple systems
- Unclear what the issue is

**Escalate from Team Lead → CTO if**:
- Issue not resolved within 30 minutes
- Site completely down >15 minutes
- Data loss suspected
- Security vulnerability found
- Major business impact
- Media/public awareness

**Escalate from CTO → CEO if**:
- Revenue-impacting incident
- Data breach or security issue
- >10,000 users affected
- Media coverage expected
- Customer escalation to executive level
- Regulatory compliance issue

---

## Weekly Review Process

### Monday Morning (9 AM)

**Meeting**: Deployment Retrospective (1 hour)

**Attendees**: 
- Deployment lead
- Engineering team
- Product team
- Support team

**Agenda**:
```
1. Review deployment execution (15 min)
   - Timeline adherence
   - Issues encountered
   - How well team performed
   
2. Review incidents & metrics (20 min)
   - Error rate trends
   - Performance trends
   - User metrics & feedback
   - Support ticket volume
   
3. Identify improvements (15 min)
   - What went well
   - What could improve
   - Action items for next deployment
   - Owner assignments
   
4. Next steps (10 min)
   - Any ongoing issues
   - Monitoring adjustments
   - Next deployment plan
```

### Weekly Report Template

```
SMART ONBOARDING - WEEKLY DEPLOYMENT REPORT
============================================
Week of: April 22-28, 2026

METRICS SUMMARY
===============
Uptime:              99.98% ✅
Error Rate:          0.03% ✅
Avg Response Time:   187ms ✅
Onboarding Starts:   87
Onboarding Completes: 61 (70%)
Feature Adoption:    78% ✅
Support Tickets:     3
User Satisfaction:   4.3/5 ✅

INCIDENTS
=========
Incident 1: Onboarding delay on 2026-04-24
  - Severity: Low
  - Duration: 5 minutes
  - Root Cause: Database connection slow query
  - Resolution: Query optimized
  - Prevention: Monitor slow query log going forward

FEATURE ADOPTION
================
Product Catalog:     78% (68 users)
Lead Management:     54% (47 users)
Email Campaigns:     42% (36 users)
Automation:          63% (55 users)
Social Media:        31% (27 users)

KEY FINDINGS
============
✓ Onboarding completion rate exceeds 70% target
✓ No critical issues reported
✓ Users primarily adopt Product Catalog feature
✓ Social Media feature has low adoption (consider simplification)
✓ Average completion time: 4m 12s (within 5 min target)

RECOMMENDATIONS
===============
1. Investigate why Social Media adoption low
2. Add more details to Social Media questions
3. Monitor Lead Management adoption growth
4. Plan for next feature iteration
5. Expand onboarding to collect more feedback

NEXT WEEK FOCUS
===============
- Monitor for any edge cases
- Analyze user feedback
- Plan next feature iteration
- Continue daily monitoring
```

---

## Success Criteria Checklist

### Immediate Success (First 24 Hours)

- [x] **Uptime**: >99% during deployment window
- [x] **Build**: Deployment completes successfully
- [x] **Functionality**: All features working as expected
- [x] **Performance**: Load time <3 seconds
- [x] **Errors**: Error rate <1%
- [x] **Users**: Can sign up and complete onboarding
- [x] **Data**: Preferences saved correctly to database
- [x] **Navigation**: Feature-based navigation working
- [x] **Team**: All team members briefed and ready
- [x] **Communication**: Users notified of new feature

### Short-Term Success (1 Week)

- [ ] **Stability**: No critical issues reported
- [ ] **Completion**: >70% onboarding completion rate
- [ ] **Time**: Average completion <5 minutes
- [ ] **Adoption**: >60% of new users use feature
- [ ] **Satisfaction**: No major complaints
- [ ] **Support**: <5 support tickets total
- [ ] **Performance**: Consistent <2s load time
- [ ] **Uptime**: >99.9% uptime
- [ ] **Growth**: >50 new users completed onboarding
- [ ] **Engagement**: Returning users adjust preferences

### Long-Term Success (30 Days)

- [ ] **Sustained completion**: >70% completion rate maintained
- [ ] **Feature adoption**: Clear preference distribution
- [ ] **User satisfaction**: >4.0/5 ratings
- [ ] **Support load**: <1 ticket per day
- [ ] **Performance**: No degradation over time
- [ ] **Zero critical issues**: No P1 incidents
- [ ] **User feedback**: Positive sentiment
- [ ] **Metrics**: All success metrics met
- [ ] **Improvements planned**: Next feature iteration planned
- [ ] **Team confidence**: Team comfortable with system

---

## Contact Information

### On-Call Escalation

**Monday-Friday 9am-5pm UTC**:
- Primary: [Name] - [email] - [phone]
- Secondary: [Name] - [email] - [phone]

**Off-hours/Weekends**:
- Primary: [Name] - [phone]
- Secondary: [Name] - [phone]

### Team Contacts

| Role | Name | Email | Slack |
|------|------|-------|-------|
| **Deployment Lead** | [Name] | [email] | @[slack] |
| **Backend Lead** | [Name] | [email] | @[slack] |
| **Frontend Lead** | [Name] | [email] | @[slack] |
| **DevOps** | [Name] | [email] | @[slack] |
| **Product Manager** | [Name] | [email] | @[slack] |
| **Support Lead** | [Name] | [email] | @[slack] |

### External Support

| Service | Contact | Hours |
|---------|---------|-------|
| **Vercel Support** | support@vercel.com | 24/7 |
| **Supabase Support** | support@supabase.io | 24/7 |
| **AWS/Cloud Support** | [Support page] | 24/7 |

---

## Appendix: Monitoring Queries

### Supabase SQL Queries

```sql
-- Check real-time error rate (last 1 hour)
SELECT 
  DATE_TRUNC('minute', timestamp) as minute,
  COUNT(*) as total_requests,
  SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) as errors,
  ROUND(100.0 * SUM(CASE WHEN status >= 400 THEN 1 ELSE 0 END) / COUNT(*), 2) as error_rate
FROM request_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY minute
ORDER BY minute DESC;

-- Check slow queries
SELECT 
  query,
  COUNT(*) as exec_count,
  ROUND(AVG(execution_time::numeric), 2) as avg_time_ms,
  MAX(execution_time) as max_time_ms
FROM query_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY query
HAVING AVG(execution_time) > 100
ORDER BY avg_time_ms DESC;

-- Monitor onboarding saves
SELECT 
  DATE_TRUNC('minute', created_at) as minute,
  COUNT(*) as saves,
  COUNT(CASE WHEN onboarding_done THEN 1 END) as completed,
  COUNT(CASE WHEN onboarding_done THEN 1 END)::float / COUNT(*) * 100 as completion_rate
FROM biz_users
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY minute
ORDER BY minute DESC;
```

### Browser Network Monitoring

```javascript
// Monitor API response times
performance.getEntriesByType('resource').forEach(entry => {
  if (entry.name.includes('/api/')) {
    console.log(`${entry.name}: ${entry.duration.toFixed(0)}ms`);
  }
});

// Check for failed requests
fetch('/api/complete-onboarding', {
  method: 'POST',
  body: JSON.stringify(preferences)
})
.then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
})
.catch(e => console.error('Onboarding save failed:', e));
```

---

**Monitoring Plan Approved**: _________  
**By**: _________  
**Date**: _________  

---

*For monitoring questions: contact ops-team@redeemrocket.in*

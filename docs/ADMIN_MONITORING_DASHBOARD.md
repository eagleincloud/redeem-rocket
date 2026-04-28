# Admin Monitoring Dashboard - User Guide

## Overview

The Admin Monitoring Dashboard provides real-time visibility into system health, performance metrics, active alerts, and test execution results. Access at: `/admin/monitoring`

## Key Sections

### 1. System Health Summary (Top Row)

**System Health %** - Overall percentage of healthy components (Target: > 95%)

**Critical Alerts** - Count of unresolved critical alerts (Target: 0)

**Average Response Time** - API response time in milliseconds (Target: < 200ms)

**Error Rate** - System error percentage (Target: < 1%)

### 2. System Components

Real-time status of critical infrastructure:

- **Frontend API** - Web application and REST endpoints
- **PostgreSQL Database** - Primary data store
- **Edge Functions** - Serverless functions (Supabase)

Each shows:
- Status badge (Healthy/Degraded/Down)
- Uptime percentage
- Response time (ms)
- Error rate (%)

### 3. Active Alerts Panel

Shows unresolved system alerts with severity:

**🔴 Critical (Red)** - Immediate action required
- Database connection lost
- API returning 500 errors
- System component down

**🟡 Warning (Yellow)** - Address within 1 hour
- Memory usage > 85%
- Response time > 500ms
- Error rate > 2%

**🔵 Info (Blue)** - Informational, no action needed
- Deployment completed
- Backup successful

### 4. Test Execution Results

Shows latest E2E test runs:

- **Phase 1-7** - Test results for each Business OS phase
- **Status** - Passed ✓ / Failed ✗ / Running 🔄
- **Metrics** - Passed count, Failed count, Duration (seconds)
- **Timestamp** - When test executed

### 5. Advanced Metrics

Detailed system performance:

- **Requests/Minute** - API request throughput (Target: 500-2000)
- **Database Connections** - Usage of connection pool (Target: < 50%)
- **Cache Hit Rate** - Cached vs fresh requests (Target: > 80%)
- **Edge Functions** - Active/Total deployed functions (Target: All active)

## Common Workflows

### Daily Check (5 minutes)

1. Check System Health % (should be > 95%)
2. Check Critical Alerts count (should be 0)
3. Review any warning alerts
4. Verify all components are "Healthy"
5. Confirm latest test phase passed

### Investigating a Critical Alert

1. **Read Alert** - Understand the issue
2. **Check Component** - View detailed status and metrics
3. **Review Logs** - Look for error patterns
4. **Take Action** - Restart, redeploy, or scale as needed
5. **Monitor Recovery** - Watch metrics return to normal
6. **Resolve Alert** - Mark as complete

### Understanding Metrics

```
Response Time:
< 100ms     ✅ Excellent
100-200ms   ✅ Good  
200-500ms   ⚠️  Monitor
> 500ms     ❌ Slow - Investigate

Error Rate:
< 0.5%      ✅ Excellent
0.5-1%      ✅ Good
1-2%        ⚠️  Monitor
> 2%        ❌ Critical
```

## Auto-Refresh Settings

Default: 30 seconds

Options: 15s, 30s, 1 min, 5 min

**During deployments:** Use 15s for close monitoring
**Normal operation:** Use 30s to balance latency with load
**Overnight:** Use 5 min to reduce dashboard load

## Troubleshooting

### Database Shows "Down"

1. Check Supabase status page
2. Verify database connection parameters
3. Check firewall rules
4. Consider rolling back recent migrations

### High Error Rate

1. Check which endpoint has errors
2. Review API logs
3. Check if recent code was deployed
4. Rollback deployment or scale resources

### Slow Response Time

1. Check which endpoint is slow
2. Analyze database query performance
3. Check database connection pool
4. Consider adding indexes or scaling

### Test Failures

1. Identify which test phase failed
2. Check what changed recently
3. Run test manually to verify
4. Investigate and fix root cause

## Mobile Access

The dashboard is fully responsive:

- **Desktop:** Full dashboard with all metrics
- **Tablet:** Stacked layout, all features  
- **Mobile:** Simplified view, swipe navigation

## Best Practices

✅ **DO:**
- Check dashboard at start of day
- Investigate critical alerts within 5 min
- Keep alert channels active during deploys
- Document significant incidents
- Share alerts with team

❌ **DON'T:**
- Ignore critical alerts > 15 min
- Deploy without checking test results
- Disable alerts without documenting
- Make config changes without testing
- Leave alerts unresolved

---

**Last Updated:** 2026-04-28 | **Status:** ✅ Operational

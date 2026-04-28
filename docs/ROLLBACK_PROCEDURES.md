# Business OS v1.0 - Rollback Procedures

**Version**: 1.0  
**Status**: Production-Ready  
**Last Updated**: April 28, 2026

## Quick Reference

### When to Rollback
- ❌ **Immediate Rollback**: Error rate > 5%, core functionality broken, data integrity issues
- ⚠️ **Consider Rollback**: Error rate > 1%, performance degradation > 50%, failed smoke tests
- ✅ **Do Not Rollback**: Minor UI issues, single user impacted, non-critical feature broken

### Rollback Commands

```bash
# Frontend only
./scripts/rollback.sh frontend latest

# Database only
./scripts/rollback.sh database latest

# Edge functions only
./scripts/rollback.sh functions latest

# Environment variables only
./scripts/rollback.sh environment latest

# Complete rollback (last resort)
./scripts/rollback.sh all latest
```

### Time Estimate

| Component | Time | Risk Level |
|-----------|------|-----------|
| Frontend | 2-5 minutes | Low |
| Edge Functions | 5-10 minutes | Low |
| Environment | 5 minutes | Medium |
| Database | 15-30 minutes | **High** |
| All (Complete) | 30-60 minutes | **Very High** |

## Rollback Types

### 1. Frontend Rollback
- **Data impact**: None
- **User impact**: Page refresh required
- **When to use**: UI broken, JavaScript errors, layout issues
- **Command**: `./scripts/rollback.sh frontend latest`

### 2. Database Rollback
- **Data impact**: HIGH - May lose data
- **User impact**: Application may be offline
- **When to use**: Schema corruption, constraint violations, RLS policy breaks
- **Command**: `./scripts/rollback.sh database latest`
- **⚠️ WARNING**: Requires explicit approval, manual verification

### 3. Edge Functions Rollback
- **Data impact**: None
- **User impact**: Feature stops working temporarily
- **When to use**: Function crashes, API contract broken, infinite loops
- **Command**: `./scripts/rollback.sh functions latest`

### 4. Environment Rollback
- **Data impact**: None (depends on what changed)
- **User impact**: Features may break
- **When to use**: Wrong API key, feature flag disabled, invalid config
- **Command**: `./scripts/rollback.sh environment latest`

### 5. Complete Rollback
- **Data impact**: HIGH
- **User impact**: Application may be offline
- **When to use**: Multiple components failed, production unusable
- **Command**: `./scripts/rollback.sh all latest`
- **⚠️ LAST RESORT**: Requires CTO approval, expect 1-2 hours

## Step-by-Step Procedures

### Frontend Rollback (5-10 minutes)
1. Assess the issue (2 min): Check website, error logs
2. Backup current state (1 min): Save git log
3. Execute rollback (2-3 min): Run script
4. Verify success (1 min): Test key pages
5. Notify team (1 min): Post in #alerts

### Database Rollback (45-90 minutes)
1. Assess issue (5 min): Determine scope
2. Notify stakeholders (immediately): Engineering lead, product
3. Backup database (5 min): Full backup to file
4. Review what will be lost (5 min): Assess data loss
5. Get explicit approval (5 min): Document decision
6. Execute rollback (5-10 min): Run script
7. Verify integrity (10 min): Check tables, RLS, data
8. Restore missing data (if needed)
9. Run smoke tests (5 min)
10. Notify completion (1 min)

### Edge Functions Rollback (15-20 minutes)
1. Identify affected functions (2 min)
2. Check git history (2 min)
3. Backup current functions (2 min)
4. Execute rollback (5 min)
5. Verify deployment (3 min)
6. Run tests (3 min)
7. Notify team (1 min)

### Environment Rollback (12-15 minutes)
1. Identify changed variables (2 min)
2. Backup current environment (1 min)
3. Execute rollback (3 min)
4. Verify environment (2 min)
5. Run smoke tests (3 min)
6. Notify team (1 min)

### Complete Rollback (1-2 hours)
1. Declare incident (immediately)
2. Assess scope (2 min)
3. Get approval (1 min)
4. Backup everything (3 min)
5. Execute rollback (30-60 min): All components
6. Verify all systems (10 min)
7. Communicate status (ongoing)

## Recovery & Verification

### Verification Checklist
- [ ] Frontend loads and no console errors
- [ ] API health check responds
- [ ] Database accessible
- [ ] All 15+ functions deployed
- [ ] Page load < 5 seconds
- [ ] API response < 2 seconds
- [ ] No memory leaks

### Smoke Tests
```bash
npm run test:smoke
npm run test:smoke -- --phase 1  # Onboarding
npm run test:smoke -- --phase 7  # AI Manager
```

### Recovery is Complete When
- All smoke tests pass
- Error rate < 0.5%
- Response times normal
- No customer complaints

## Troubleshooting

### Frontend Rollback Failed
```bash
vercel ls --json          # List deployments
vercel alias set <url> redeemrocket.in  # Manually promote
```

### Database Rollback Failed
```bash
supabase migration list   # List migrations
pg_restore $DATABASE_URL < backup.sql  # Restore from backup
```

### Functions Rollback Failed
```bash
deno check supabase/functions/*/index.ts
supabase functions deploy ai-manager-layer  # Deploy single function
```

### Environment Rollback Failed
```bash
vercel env add VITE_SUPABASE_URL <value>
vercel env ls  # List current
```

### Complete Rollback Stuck
1. Cancel with Ctrl+C
2. Check logs to see what step failed
3. Manually rollback each component
4. Verify each step before proceeding

## Incident Response Checklist

### Phase 1: Triage (5 minutes)
- [ ] Alert engineering team
- [ ] Assess severity
- [ ] Identify affected systems
- [ ] Make go/no-go decision

### Phase 2: Preparation (5 minutes)
- [ ] Get CTO/engineering lead approval
- [ ] Backup current state
- [ ] Review rollback script
- [ ] Prepare user communication

### Phase 3: Execution (30-60 minutes)
- [ ] Run rollback script
- [ ] Monitor progress
- [ ] Check logs
- [ ] Be ready to cancel if issues

### Phase 4: Verification (10 minutes)
- [ ] Run smoke tests
- [ ] Verify critical functionality
- [ ] Check error rates
- [ ] Confirm no data loss

### Phase 5: Communication (ongoing)
- [ ] Post status update to Slack
- [ ] Update status page
- [ ] Email affected customers
- [ ] Set expectations for fix

### Phase 6: Post-Incident (next day)
- [ ] Schedule incident review
- [ ] Write root cause analysis
- [ ] Identify preventive measures
- [ ] Update runbooks

## Prevention

To avoid rollbacks:

1. **Testing**
   - Run smoke tests before deploying
   - Test all phases locally
   - Verify database migrations locally

2. **Staging**
   - Deploy to staging first
   - Run full test suite on staging
   - Performance test on staging

3. **Monitoring**
   - Monitor error rates continuously
   - Alert on any spike
   - Check performance metrics

4. **Procedures**
   - Document all steps
   - Keep backups current
   - Practice rollbacks quarterly

---

**Support**: Engineering lead | CTO | On-call  
**Slack**: #incidents, #alerts  
**Documentation**: See PRODUCTION_DEPLOYMENT_GUIDE.md, MONITORING_AND_ALERTING.md

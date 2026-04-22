# Smart Onboarding - Emergency Procedures & Quick Reference

**For Use During Deployment or Crisis**  
**Keep This Accessible During Deployment Window**

---

## EMERGENCY: SITE IS DOWN

### Immediate Actions (First 2 Minutes)

```
1. VERIFY DOWN
   [ ] Try https://redeemrocket.in in browser
   [ ] Try https://redeemrocket.in/features
   [ ] Check multiple browsers/devices
   
2. ALERT TEAM
   [ ] Post to #deployments Slack channel
   [ ] @mention Tech Lead and DevOps
   [ ] Start incident channel
   
3. CHECK DASHBOARD
   [ ] Go to https://vercel.com/dashboard
   [ ] Select project
   [ ] Check "Deployments" tab
   [ ] Is latest deployment showing "Built & Ready"?
      YES → Proceed to Step 4
      NO → Check build logs for error
      
4. CHECK SERVICES
   [ ] Vercel status: https://www.vercel.com/status
   [ ] Supabase status: https://status.supabase.com
```

### Likely Causes (3-5 Minutes)

**Cause 1: Build Failed**
```
Symptoms: Deployment shows red X or "Build failed"
Fix:
  1. Click deployment to view logs
  2. Search logs for "error"
  3. Common: Missing environment variable
  4. Fix environment variable in Vercel Dashboard
  5. Manually trigger redeploy
  6. Check logs again
```

**Cause 2: Server Error 500**
```
Symptoms: Get HTTP 500 when accessing site
Fix:
  1. Check Vercel build logs (looks OK?)
  2. Check Supabase status (is it up?)
  3. Check Supabase connection in app
  4. If Supabase down: wait for them to recover
  5. If connection issue: check .env variables
  6. Last resort: ROLLBACK (see below)
```

**Cause 3: Network/DNS Issue**
```
Symptoms: Cannot resolve redeemrocket.in
Fix:
  1. ping redeemrocket.in
  2. nslookup redeemrocket.in
  3. Wait 2-5 minutes for DNS propagation
  4. Clear browser DNS cache
  5. Restart browser
  6. Try from different network (mobile hotspot)
```

### ROLLBACK (Last Resort)

**If you can't fix it in 30 minutes, ROLLBACK:**

```
OPTION 1: Vercel Dashboard (Easiest - 2 minutes)
  1. Go to https://vercel.com/dashboard
  2. Click Deployments tab
  3. Find deployment before latest (green checkmark)
  4. Click "..." menu
  5. Click "Promote to Production"
  6. Click "Confirm"
  7. Wait 30 seconds
  8. Verify site loads

OPTION 2: Vercel CLI (3 minutes)
  1. Open terminal
  2. Type: vercel rollback
  3. Select previous deployment
  4. Confirm
  5. Wait for completion
  6. Verify site loads

OPTION 3: Git Rollback (5 minutes)
  1. cd to project
  2. git revert HEAD
  3. git push origin main
  4. Wait for Vercel to rebuild
  5. Verify site loads
```

**After Rollback**:
```
[ ] Site loads successfully
[ ] Verify old feature working
[ ] Alert team: "Rolled back to previous version"
[ ] Notify users if public: "We rolled back to stable version"
[ ] Investigate root cause
[ ] Fix issue
[ ] Test fix thoroughly
[ ] Redeploy when ready
```

---

## EMERGENCY: ONBOARDING NOT SAVING

### Immediate Actions (1 Minute)

```
1. IDENTIFY SYMPTOM
   [ ] User clicks "Complete" but page doesn't change
   [ ] User sees error message
   [ ] Data saved but user not redirected
   [ ] Browser console shows error
   
2. CHECK DATABASE
   [ ] Go to https://app.supabase.com
   [ ] Select project
   [ ] Go to Table Editor
   [ ] Check biz_users table
   [ ] Is onboarding_done column populated? (YES/NO)
   [ ] Is feature_preferences valid JSON? (YES/NO)
```

### Quick Diagnosis

```
✓ Column populated, valid JSON
  → Problem is UI/routing
  → Check browser console for errors
  → Hard refresh (Ctrl+Shift+R)
  → Try in incognito mode
  
✗ Column empty or invalid JSON
  → Problem is API or RLS policy
  → Check Supabase logs for errors
  → Look for "permission denied" errors
  → Check RLS policies are enabled correctly
  
✗ Column missing entirely
  → Migration didn't run!
  → Go to Supabase SQL Editor
  → Run migration script manually
  → Verify columns created
```

### RLS Policy Issue (Most Common)

```
Error Message: "new row violates row-level security policy"

FIX:
1. Go to https://app.supabase.com/project/[id]/sql/new
2. Run this:
   
   SELECT * FROM biz_users 
   WHERE id = auth.uid();
   
   Should return: 1 row with your user
   If error: Auth token issue
   
3. Check RLS policy:
   
   SELECT * FROM pg_policies 
   WHERE tablename = 'biz_users';
   
   Should show 2 policies (select, update)
   If missing: Policies weren't created
   
4. Fix missing policy:
   
   CREATE POLICY biz_users_update ON biz_users
   FOR UPDATE USING (id = auth.uid());
   
5. Try again in browser
```

### API Call Not Working

```
In Browser Console (F12):

fetch('/api/complete-onboarding', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({preferences: {...}})
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e));

If Error:
  - Check network tab for response
  - Look for 403 (permission) error
  - Look for 500 (server) error
  - Look for timeout
  - Check Supabase logs
```

---

## EMERGENCY: PERFORMANCE ISSUE

### Symptoms

```
Page loads slowly (>3 seconds)
OR
Page is unresponsive when interacting
OR
Site becomes slower over time
```

### Quick Diagnosis (2 Minutes)

```bash
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page (F5)
4. Look at timeline:
   
   Should see:
   - index.html: <100ms
   - JS files: <500ms total
   - CSS files: <200ms total
   - API calls: <300ms
   
   If any >500ms: That's the bottleneck
```

### Common Fixes

```
CASE 1: JS bundles slow (> 500ms)
  FIX: Clear Vercel cache
    1. Vercel Dashboard → Project Settings
    2. Scroll to "Build Cache"
    3. Click "Clear All"
    4. Trigger redeploy
    5. Wait for rebuild
    6. Test again

CASE 2: API calls slow (> 500ms)
  FIX: Check database performance
    1. Supabase Dashboard → SQL Editor
    2. Run: SELECT COUNT(*) FROM biz_users;
    3. Check query time (should be <100ms)
    4. Look for slow queries:
       SELECT query, mean_exec_time FROM pg_stat_statements
       ORDER BY mean_exec_time DESC LIMIT 5;
    5. Add index to slow columns
    6. Clear connection pool if needed

CASE 3: Page unresponsive
  FIX: Check for memory leak
    1. Open DevTools → Memory tab
    2. Click record
    3. Interact with page
    4. Stop recording
    5. Look for heap growing (bad)
    6. Look for detached DOM nodes (bad)
    7. Hard refresh and check again
    8. If still leaking: It's the component
       → Contact backend team to investigate
```

---

## EMERGENCY: DATABASE CORRUPTION

### Recognize It

```
Symptoms:
  - User data missing
  - Columns showing NULL unexpectedly
  - Strange JSON errors
  - Cannot insert new records
  - Constraint violations
  - Orphaned records
```

### Immediate Actions (CRITICAL - 1 Minute)

```
1. STOP new operations
   [ ] Stop accepting new signups
   [ ] Put site in "maintenance mode" if needed
   [ ] Notify team: "Database issue detected"
   
2. VERIFY corruption
   [ ] Run integrity check:
   
       SELECT COUNT(*) FROM biz_users;
       SELECT COUNT(*) FROM business_products;
       SELECT * FROM information_schema.columns 
       WHERE table_name IN ('biz_users', 'business_products');
       
   [ ] Do row counts match expected?
   [ ] Are all columns present?
   
3. RESTORE BACKUP
   [ ] Go to https://app.supabase.com
   [ ] Settings → Database → Backups
   [ ] Find most recent backup BEFORE issue
   [ ] Click "Restore"
   [ ] Confirm restoration
   [ ] Wait for restore complete (5-20 min)
   [ ] Verify restored data
   [ ] Alert team: "Database restored from backup"
```

### After Restore

```
[ ] Verify data is correct
[ ] Check row counts
[ ] Spot-check user records
[ ] Verify constraints intact
[ ] Verify indexes present
[ ] Take new backup as safety
[ ] Investigate what caused corruption
[ ] Implement prevention
[ ] Document incident
```

---

## EMERGENCY: SECURITY ISSUE

### Recognize It

```
Symptoms:
  - Unauthorized users seeing other users' data
  - Users seeing each other's preferences
  - API calls not requiring auth
  - Passwords exposed in logs
  - SQL injection attempts
  - XSS attempts in form fields
```

### Immediate Actions (CRITICAL - 1 Minute)

```
1. CONTAIN THE ISSUE
   [ ] If data exposed: Take system offline temporarily
   [ ] If injection attempted: Change database passwords
   [ ] If XSS: Clear any stored malicious data
   
2. INVESTIGATE
   [ ] Check Supabase auth logs
   [ ] Check RLS policies
   [ ] Check API logs for unusual requests
   [ ] Check git history for vulnerable code
   
3. COMMUNICATE
   [ ] Alert security team
   [ ] Alert management
   [ ] Do NOT communicate to users yet
   [ ] Determine if users affected
   [ ] Determine severity level
```

### RLS Policy Breach

```
If users can see other users' data:

1. Check RLS policies:
   SELECT * FROM pg_policies;
   
2. Look for missing WHERE clauses
3. Look for policies that don't check user ID
4. Look for disabled RLS:
   SELECT tablename FROM pg_tables 
   WHERE schemaname='public' AND rowsecurity=false;
   
5. Fix policies:
   - Add WHERE id = auth.uid() to policies
   - Enable RLS on affected tables
   - Test with different users
   
6. Verify fix works:
   - Log in as user A
   - Check that you can only see your data
   - Log in as user B
   - Verify you can't see user A's data
```

---

## EMERGENCY: MASSIVE ERROR RATE

### Recognize It

```
Error Rate >5% for 2+ minutes
OR
Error Rate >1% for 10+ minutes

Means: System is in trouble, needs immediate attention
```

### Diagnosis (2 Minutes)

```
1. Identify error type:
   [ ] Go to Supabase → Logs
   [ ] Look at recent errors
   [ ] Are they all the same error? (Yes = specific issue)
   [ ] Are they different? (Yes = widespread problem)
   
2. Check specific errors:
   [ ] Database connection errors?
   [ ] Auth failures?
   [ ] API timeouts?
   [ ] Memory errors?
   [ ] File not found?
   
3. Check if infrastructure is OK:
   [ ] Vercel Dashboard → healthy?
   [ ] Supabase status → healthy?
   [ ] DNS → resolving correctly?
```

### Emergency Fixes

```
If database connection errors:
  1. Check database capacity
     SELECT pg_database.datname,
            pg_size_pretty(pg_database_size(pg_database.datname))
     FROM pg_database;
  
  2. Check connection count
     SELECT count(*) FROM pg_stat_activity;
  
  3. Kill idle connections if needed
     SELECT pg_terminate_backend(pid) 
     FROM pg_stat_activity 
     WHERE state = 'idle';
  
  4. Restart connection pool
     (via Supabase Dashboard)

If auth failures:
  1. Check auth service status
  2. Verify JWT tokens are valid
  3. Check auth table corruption
  4. May need to force re-login for all users

If memory errors:
  1. Identify memory leak
  2. Check component cleanup functions
  3. Monitor with DevTools Memory tab
  4. May need code fix / redeploy

If widespread:
  JUST ROLLBACK - Don't spend time fixing if unclear
  It's better to revert and investigate safely
```

---

## EMERGENCY: Users Can't Log In

### Immediate Actions (1 Minute)

```
1. Test login yourself
   [ ] Try logging in at https://redeemrocket.in
   [ ] Try signup as new user
   [ ] Does it show error? Or get stuck?
   
2. Check authentication service
   [ ] Go to https://app.supabase.com
   [ ] Check Authentication → Overview
   [ ] Are logins processing?
   [ ] Any errors shown?
   
3. Check if auth table exists
   [ ] SQL Editor
   [ ] SELECT * FROM auth.users LIMIT 1;
   [ ] If error: Table missing (never deployed auth)
   [ ] Check Supabase logs for errors
```

### Common Causes & Fixes

```
CASE 1: Auth table missing
  → Auth never deployed
  → Need to re-run migrations
  → Or redeploy from pre-auth version
  
CASE 2: JWT token expired/invalid
  → Users need to re-login
  → Force logout all users in app
  → Check JWT secret matches
  
CASE 3: Auth service down
  → Check Supabase status page
  → Wait for Supabase to recover
  → If prolonged: Failover to backup service
  
CASE 4: Too many failed attempts
  → Supabase rate limiting triggered
  → Check auth logs for spam
  → Reset IP whitelist if needed
  → Block attack sources
```

---

## EMERGENCY: Data Loss Suspected

### CRITICAL - Immediate Actions (30 Seconds)

```
1. STOP everything
   [ ] Stop accepting new writes
   [ ] Put system in read-only if possible
   [ ] Notify team: "Data loss suspected - freezing system"
   [ ] DO NOT RUN ANY QUERIES THAT MODIFY DATA
   
2. VERIFY loss
   [ ] Compare row count with morning baseline
   [ ] Spot-check specific records
   [ ] Confirm data actually missing (not just query issue)
   
3. RESTORE from backup
   [ ] Go to Supabase Backups
   [ ] Find backup BEFORE data loss
   [ ] Click "Restore"
   [ ] CONFIRM restoration
   [ ] Wait for completion
   [ ] Verify data recovered
```

### After Restore

```
[ ] Inform all users data restored
[ ] Check if restore lost any new data (likely)
[ ] Document what happened
[ ] Audit which data was lost
[ ] Re-add missing data if critical
[ ] Investigate root cause
[ ] Implement prevention measures
[ ] Update backup procedures
[ ] Schedule incident review
```

---

## Team Emergency Contacts

**Have these ready BEFORE deployment:**

### Technical Team

```
On-Call Engineer: _________________ Phone: _____________
Tech Lead: _________________ Phone: _____________
Backend Lead: _________________ Phone: _____________
DevOps: _________________ Phone: _____________
Frontend Lead: _________________ Phone: _____________
```

### Management

```
Product Manager: _________________ Phone: _____________
CEO: _________________ Phone: _____________
VP Engineering: _________________ Phone: _____________
```

### External Support

```
Vercel: support@vercel.com (24/7)
Supabase: support@supabase.io (24/7)
AWS Support: [Support number] (24/7)
```

---

## Emergency Communication Template

### Internal Team Alert

```
🚨 CRITICAL INCIDENT 🚨

Issue: [What's broken]
Severity: [P1/P2/P3]
Impact: [Who's affected and how]
Status: [Investigating/Resolving/Resolved]
ETA: [When it will be fixed]

Actions in progress:
- [Action 1]
- [Action 2]
- [Action 3]

Next update: [When]

Incident Channel: #incident-[date]
```

### External User Communication

```
We're experiencing issues with [feature]. Our team is 
investigating and working on a fix. We'll update you 
within [time period].

Thank you for your patience.

The RedeemRocket Team
```

---

## Key Emergency Commands

### Copy & Paste These

**Check if site is up:**
```bash
curl -I https://redeemrocket.in
# Should return: HTTP/1.1 200 OK
```

**Check Vercel deployment:**
```bash
vercel projects list
vercel deployments
```

**Check Supabase connection:**
```bash
curl -I https://eomqkeoozxnttqizstzk.supabase.co
# Should return: 200 OK
```

**Verify database integrity:**
```sql
SELECT COUNT(*) as user_count FROM biz_users;
SELECT COUNT(*) as product_count FROM business_products;
SELECT column_name FROM information_schema.columns 
WHERE table_name='biz_users' ORDER BY ordinal_position;
```

**Check RLS policies:**
```sql
SELECT policyname, permissive, qual FROM pg_policies 
WHERE tablename='biz_users';
```

---

## Incident Severity Levels

### 🔴 P1 (CRITICAL - Immediate Action)
- Site completely down (500 errors, timeouts)
- Data loss or corruption detected
- Security breach
- >10% error rate
- Onboarding completely broken

**Response**: Immediate rollback or emergency fix  
**Time Target**: Fix within 30 minutes

### 🟠 P2 (HIGH - Urgent)
- Feature broken for subset of users
- Performance severely degraded (>3s load)
- RLS policies blocking legitimate users
- Onboarding >50% failure rate

**Response**: Investigate & fix within 1-2 hours  
**Time Target**: Fix within 2 hours

### 🟡 P3 (MEDIUM - Important)
- Minor UI bug
- Performance issue (<3s but slower than target)
- One user unable to complete action
- Non-critical data incorrect

**Response**: Plan fix for next release  
**Time Target**: Fix within 24 hours

### 🟢 P4 (LOW - Can Wait)
- Documentation out of date
- Minor typo
- Nice-to-have feature
- Cosmetic issue

**Response**: Backlog for next sprint  
**Time Target**: Fix in next release

---

## Pre-Deployment Prep

### Print This Document

Before deployment window, PRINT this document and have:
- [ ] Hard copy on desk
- [ ] Bookmark on browser
- [ ] Phone number list ready
- [ ] Slack channels open
- [ ] Team assembled
- [ ] Coffee ready ☕

### 30 Minutes Before Deployment

```
[ ] Phone: Unmute and keep nearby
[ ] Slack: Open and watching
[ ] Dashboard: Have Vercel, Supabase dashboards open
[ ] Team: Everyone ready and alert
[ ] Backups: Verify latest backup exists
[ ] Rollback: Tested and ready
[ ] Fingers: Ready to click deploy ✌️
```

---

## Remember

**DON'T PANIC** - Follow procedures step by step  
**COMMUNICATE** - Keep team and users informed  
**ESCALATE** - Ask for help if unsure  
**DOCUMENT** - Write down what you did  
**RECOVER** - Focus on getting system stable first  
**INVESTIGATE** - Figure out what went wrong after  
**PREVENT** - Improve systems to prevent recurrence  

You've got this! 💪

---

**Version**: 1.0  
**Last Updated**: 2026-04-22  
**Keep Accessible During Deployment Window**

---

*In case of emergency, call your Tech Lead or DevOps Engineer*

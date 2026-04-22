# Smart Onboarding - Production Deployment Plan
## redeemrocket.in Deployment

**Document Version**: 1.0  
**Date**: 2026-04-22  
**Target**: redeemrocket.in (Vercel)  
**Database**: Supabase (eomqkeoozxnttqizstzk)  
**Estimated Duration**: 15-30 minutes  

---

## Executive Summary

This document provides a step-by-step deployment plan for Smart Onboarding to production. Smart Onboarding is a 5-question AI-powered onboarding system that allows businesses to customize which features they want to use (Product Catalog, Lead Management, Email Campaigns, Automation, Social Media).

**Key Components**:
- SmartOnboarding.tsx (455 lines, fully typed)
- FeatureSettings.tsx (customization page)
- Database migration (4 new columns, 1 new table, RLS policies)
- Navigation conditional rendering based on preferences

**Deployment Risk Level**: LOW (non-breaking changes, backwards compatible)

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Go/No-Go Criteria](#gono-go-criteria)
3. [Pre-Deployment Verification](#pre-deployment-verification)
4. [Database Migration Strategy](#database-migration-strategy)
5. [Build & Deployment Process](#build--deployment-process)
6. [Production Verification Checklist](#production-verification-checklist)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [User Communication Plan](#user-communication-plan)
9. [Rollback Procedure](#rollback-procedure)
10. [Post-Deployment Tasks](#post-deployment-tasks)
11. [Success Metrics](#success-metrics)
12. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

### Code Readiness

- [x] SmartOnboarding.tsx component completed (455 lines)
- [x] FeatureSettings.tsx component completed (re-customization page)
- [x] BusinessContext updated with `canAccessFeature()` helper
- [x] Navigation.tsx updated with conditional rendering
- [x] Routes configured (`/onboarding` and `/app/features-settings`)
- [x] TypeScript compilation passing
- [x] No critical console errors
- [ ] Code review approved by team lead
- [ ] Security audit completed
- [ ] Performance testing completed

### Database Readiness

- [x] Migration file created: `20250422_smart_onboarding_schema.sql`
- [x] Contains: 4 new columns, 1 new table, RLS policies, indexes
- [ ] Migration tested on staging database
- [ ] Backup of production database confirmed
- [ ] Database credentials verified
- [ ] RLS policies reviewed and approved
- [ ] Migration rollback procedure documented

### Staging Environment

- [ ] Deployed to staging (staging.redeemrocket.in or similar)
- [ ] Migration applied to staging database
- [ ] All 5 onboarding questions functional
- [ ] Feature settings page working
- [ ] Navigation conditional rendering working
- [ ] Database saves/loads working correctly
- [ ] No console errors in staging
- [ ] Performance acceptable (<3s load time)
- [ ] Tested on Chrome, Firefox, Safari, Edge
- [ ] Tested on mobile (iOS, Android)

### Environment Configuration

- [x] Production Supabase URL configured
- [x] Production Anon Key configured
- [x] Production Service Role Key available
- [ ] Vercel environment variables set
- [ ] Production .env.local prepared
- [ ] No sensitive data in commits
- [ ] Git branch protection enabled

### Testing & Validation

- [ ] Unit tests passing (if applicable)
- [ ] E2E tests passing on staging
- [ ] Onboarding completion tested
- [ ] Database persistence verified
- [ ] Feature preferences persistence verified
- [ ] Rollback procedure tested
- [ ] Error scenarios tested
- [ ] Network disconnection handling tested

### Documentation

- [ ] SMART_ONBOARDING_IMPLEMENTATION.md reviewed
- [ ] Database migration guide reviewed
- [ ] Deployment guide reviewed
- [ ] User communication prepared
- [ ] Support team briefed
- [ ] Troubleshooting guide created
- [ ] Rollback guide created

### Approvals

- [ ] Tech Lead approval obtained
- [ ] Product Manager approval obtained
- [ ] QA Lead sign-off received
- [ ] Security team sign-off received
- [ ] Business stakeholder approval

---

## Go/No-Go Criteria

### GO Criteria (All must be true)

1. **Code Quality**
   - All TypeScript compilation passing (warnings acceptable)
   - No critical console errors
   - Code review approved

2. **Testing**
   - All tests passing on staging
   - Onboarding flow tested end-to-end
   - Database migrations verified on staging
   - No blocking issues found

3. **Database**
   - Production database backup exists
   - Migration tested successfully on staging
   - RLS policies verified

4. **Performance**
   - Build bundle size acceptable (<1MB gzipped)
   - Load time <3 seconds
   - No memory leaks detected

5. **Environment**
   - All production credentials in place
   - Vercel environment variables set
   - DNS records configured for redeemrocket.in

6. **Approvals**
   - Tech Lead signed off
   - Product Manager approved
   - QA Lead confirmed

### NO-GO Criteria (Any of these = STOP deployment)

1. **Code Issues**
   - Critical TypeScript errors
   - Failed code review
   - Security vulnerabilities found
   - Unresolved merge conflicts

2. **Testing Issues**
   - Test failures on staging
   - Blocking bugs found
   - Database migration fails
   - Data loss detected

3. **Database Issues**
   - No backup found
   - Migration rollback failure
   - RLS policy issues
   - Data corruption detected

4. **Environment Issues**
   - Missing credentials
   - Invalid Supabase configuration
   - DNS not configured
   - Vercel build failing

5. **Approvals**
   - Critical sign-off missing
   - Security team concerns
   - Performance concerns
   - User impact concerns

---

## Pre-Deployment Verification

### Step 1: Code Verification (5 minutes)

```bash
# Navigate to project root
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2/.claude/worktrees/jolly-herschel

# Check git status
git status
# Should show only documentation changes, not uncommitted code

# Verify main branch
git branch -v
# Should show: * (HEAD detached) or main

# Check recent commits
git log --oneline -5
# Should show deployment commits

# Check for uncommitted changes
git diff
# Should be empty or only docs
```

**Expected Output**:
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
```

**No-Go Signal**: Uncommitted code changes or conflicts

### Step 2: Build Verification (5 minutes)

```bash
# Clean build
rm -rf dist-business node_modules/.vite

# Install dependencies
npm install

# Build production bundle
npm run build:business

# Check build output
ls -lh dist-business/
# Should show index.html, assets/, etc.
```

**Expected Output**:
```
vite v6.3.5 building for production...
✓ 1234 modules transformed.
dist-business/index.html          12.45 kB
dist-business/assets/main-xxxx.js 450.23 kB / gzip: 125.45 kB
dist-business/assets/style-xxxx.css 45.12 kB / gzip: 10.23 kB
```

**No-Go Signal**: Build failure, bundle size >1MB gzipped

### Step 3: Environment Verification (5 minutes)

```bash
# Check environment variables
cat .env.local
# Should show Supabase credentials

# Verify Supabase connectivity
curl -I https://eomqkeoozxnttqizstzk.supabase.co
# Expected: 200 OK

# Check Vercel configuration
cat vercel.json
# Should show correct build command and output directory
```

**Expected Output**:
```
SUPABASE_URL=https://eomqkeoozxnttqizstzk.supabase.co
SUPABASE_ANON_KEY=<valid-key>
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=<valid-key>
```

**No-Go Signal**: Invalid credentials, missing keys, unreachable services

### Step 4: Database Migration Verification (5 minutes)

```bash
# Check migration file exists
ls -lh supabase/migrations/20250422_smart_onboarding_schema.sql

# Review migration script (don't execute yet)
cat supabase/migrations/20250422_smart_onboarding_schema.sql

# Verify migration syntax
head -50 supabase/migrations/20250422_smart_onboarding_schema.sql
```

**Expected Output**:
```
-- Smart AI-Powered Onboarding Schema
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS feature_preferences jsonb
ALTER TABLE biz_users ADD COLUMN IF NOT EXISTS onboarding_step integer
CREATE TABLE IF NOT EXISTS business_products
CREATE INDEX IF NOT EXISTS idx_business_products_business_id
```

**No-Go Signal**: Invalid SQL syntax, missing migration file

### Step 5: Staging Verification (if available)

```bash
# If staging environment exists, verify:
# 1. Navigate to staging.redeemrocket.in
# 2. Check console for errors (F12)
# 3. Test onboarding flow
# 4. Verify database saves
# 5. Check feature settings page
```

**No-Go Signals**:
- Console errors
- Onboarding not functional
- Database not saving
- Feature settings page broken

---

## Database Migration Strategy

### Pre-Migration Backup

```bash
# Create backup using Supabase CLI (if available)
# Or use Supabase Dashboard → Backups

# Verify backup exists:
# 1. Go to https://app.supabase.com
# 2. Select project
# 3. Settings → Backups
# 4. Should show recent backup
```

**Backup Requirements**:
- Full database backup created within last 24 hours
- Backup testable (restore procedure documented)
- Backup location: Supabase automatic backups
- Restore time estimate: <5 minutes

### Migration Execution

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to https://app.supabase.com/project/[project-id]/sql
2. Create new query
3. Copy content from `supabase/migrations/20250422_smart_onboarding_schema.sql`
4. Execute query
5. Monitor execution status
6. Verify no errors

**Option B: Via Supabase CLI**

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-id eomqkeoozxnttqizstzk

# Run migration
supabase db push

# Verify
supabase db pull
```

**Option C: Via Direct SQL**

```sql
-- Run migration script manually via pgAdmin or similar
-- Ensure "IF NOT EXISTS" clauses prevent duplicate errors
-- Monitor execution time
-- Verify success with queries
```

### Post-Migration Verification

```sql
-- Verify columns added to biz_users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'biz_users' 
AND column_name IN ('feature_preferences', 'onboarding_step', 'onboarding_ai_data', 'onboarding_done');

-- Expected: 4 rows

-- Verify business_products table created
SELECT * FROM information_schema.tables 
WHERE table_name = 'business_products';

-- Expected: 1 row

-- Verify indexes created
SELECT indexname FROM pg_indexes 
WHERE tablename = 'business_products' 
OR tablename = 'biz_users' 
AND indexname LIKE '%smart_onboarding%' OR indexname LIKE '%feature%' OR indexname LIKE '%products%';

-- Expected: 4+ rows

-- Verify RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'business_products';

-- Expected: rowsecurity = true
```

**No-Go Signal**: Migration fails, tables not created, RLS not enabled

### Migration Rollback

If migration fails or causes issues:

```sql
-- Option 1: Restore from backup
-- Use Supabase Dashboard → Backups → Restore

-- Option 2: Manual rollback (if needed)
ALTER TABLE biz_users DROP COLUMN IF EXISTS feature_preferences;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_step;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_ai_data;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_done;
DROP TABLE IF EXISTS business_products;

-- Estimated time: <2 minutes
```

---

## Build & Deployment Process

### Step 1: Final Code Review (5 minutes)

```bash
# Show changes since last release
git log --oneline main..HEAD

# Show file changes
git diff --stat main

# Review key files
git show HEAD:src/business/components/SmartOnboarding.tsx | head -50
git show HEAD:src/business/components/FeatureSettings.tsx | head -50
```

**Checklist**:
- [ ] All Smart Onboarding files included
- [ ] No debugging code present
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Proper error handling
- [ ] TypeScript types correct

### Step 2: Clean Build (5-10 minutes)

```bash
# Clean previous builds
rm -rf dist-business .vite

# Install dependencies
npm ci  # Use ci instead of install for clean state

# Build for production
npm run build:business

# Verify build
ls -lh dist-business/index.html
du -sh dist-business/
```

**Expected Output**:
```
Total size: <100 MB (uncompressed)
Gzipped: <15 MB for JS/CSS combined
Build time: <3 minutes
No errors in output
```

**No-Go Signal**: Build fails, bundle too large, unresolved dependencies

### Step 3: Pre-Deployment Testing (5 minutes)

```bash
# Run tests if available
npm test 2>&1 | tail -20

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npx eslint src/business/components/SmartOnboarding.tsx

# Verify no console errors
grep -r "console.error\|console.warn" src/business/components/SmartOnboarding.tsx
# Should return nothing
```

**Expected Output**:
```
All tests passing
No TypeScript errors
No linting errors
No console statements
```

### Step 4: Commit & Push to Main

```bash
# Verify staging is ready
git status

# Add any remaining files
git add -A

# Commit with descriptive message
git commit -m "Deploy Smart Onboarding to production

- SmartOnboarding.tsx: 5-question onboarding flow
- FeatureSettings.tsx: Feature customization page
- Database migration: feature_preferences table
- Navigation: Conditional rendering based on preferences

Tested on staging. Ready for production deployment."

# Push to main (triggers auto-deployment to Vercel)
git push origin main

# Verify push succeeded
git log --oneline -1
```

**Expected Output**:
```
[main <hash>] Deploy Smart Onboarding to production
To github.com:your-repo.git
   <hash1>..<hash2>  main -> main
```

### Step 5: Database Migration Execution (5 minutes)

**Timing**: Deploy database migration BEFORE code deployment if possible, or immediately after.

```bash
# Option 1: Execute via Supabase Dashboard
# 1. Go to https://app.supabase.com/project/[id]/sql
# 2. Create new query
# 3. Paste migration script
# 4. Click "Run"
# 5. Monitor execution

# Option 2: Via CLI
supabase link --project-id eomqkeoozxnttqizstzk
supabase db push
```

**Monitoring**:
- Watch Supabase Dashboard for execution status
- Check for error messages
- Verify execution time (should be <1 minute)
- Verify no data loss

### Step 6: Monitor Vercel Deployment (3-5 minutes)

```bash
# Option 1: Via CLI
vercel projects list
# Shows your projects

# Option 2: Via Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Go to "Deployments"
# 4. Monitor latest deployment
# 5. Watch for "Built & Ready"

# Option 3: Check build logs
# In Vercel Dashboard → Deployment → View Logs
# Should see:
# - npm install successful
# - npm run build:business successful
# - Build optimized for production
# - Deployed to production domain
```

**Expected Deployment Timeline**:
- Git push detected: <1 minute
- Build starts: <1 minute
- Build completes: 3-5 minutes
- Deploy: <1 minute
- DNS update: <1 minute
- **Total**: 5-8 minutes

### Step 7: Verify Deployment Status

```bash
# Check if site is live
curl -I https://redeemrocket.in

# Expected: HTTP/1.1 200 OK

# Check if latest code deployed
curl https://redeemrocket.in/index.html | grep "SmartOnboarding" || echo "Not found"
# Should not error

# Verify DNS resolution
nslookup redeemrocket.in
# Should resolve to Vercel IP
```

**No-Go Signal**: 404 errors, old code still deployed, DNS not resolving

---

## Production Verification Checklist

### Phase 1: Infrastructure (5 minutes)

- [ ] https://redeemrocket.in loads (HTTP 200)
- [ ] Browser console shows no critical errors
- [ ] Network tab shows successful requests
- [ ] Assets loading from CDN
- [ ] HTTPS certificate valid
- [ ] Page load time <3 seconds
- [ ] No "Cannot GET" errors

### Phase 2: Authentication (5 minutes)

- [ ] Login page loads
- [ ] Can sign up new business account
- [ ] Email verification works
- [ ] Password reset works
- [ ] Auth token stored in localStorage
- [ ] Session persists on refresh
- [ ] Logout works correctly

### Phase 3: Onboarding Flow (10 minutes)

- [ ] First login redirects to `/onboarding`
- [ ] Question 1 loads (Product Catalog?)
- [ ] Question 2 loads (Lead Management?)
- [ ] Question 3 loads (Email Campaigns?)
- [ ] Question 4 loads (Workflow Automation?)
- [ ] Question 5 loads (Social Media?)
- [ ] Can navigate back between questions
- [ ] Cannot go forward without answering
- [ ] Progress bar updates correctly
- [ ] Completion screen shows
- [ ] Loading state works during save
- [ ] Redirect to dashboard on completion

### Phase 4: Database Integration (5 minutes)

- [ ] Onboarding preferences saved to Supabase
- [ ] Can verify in Supabase Dashboard:
  - [ ] Check `biz_users` table
  - [ ] Verify `feature_preferences` column populated
  - [ ] Verify `onboarding_done` = true
  - [ ] Check timestamps correct

### Phase 5: Feature Settings (5 minutes)

- [ ] Navigate to `/app/features-settings`
- [ ] See all 5 feature toggles
- [ ] Can toggle features on/off
- [ ] Changes save immediately
- [ ] Success message appears
- [ ] Changes persist after page refresh
- [ ] Verify in Supabase that changes saved

### Phase 6: Navigation Conditional Rendering (10 minutes)

After setting feature preferences, verify navigation shows/hides items:

- [ ] **Enabled Features**: Show in sidebar
  - [ ] Product Catalog: Orders, Documents visible
  - [ ] Lead Management: Leads visible
  - [ ] Email Campaigns: Campaigns visible
  - [ ] Automation: Automation visible
  - [ ] Social Media: Social, Connectors visible

- [ ] **Disabled Features**: Hidden from sidebar
  - [ ] Dashboard always visible
  - [ ] Other pages hidden

- [ ] Test toggling features in settings:
  - [ ] Enable/disable features
  - [ ] Refresh page
  - [ ] Navigation updates correctly
  - [ ] No navigation link visible for disabled features

### Phase 7: Error Handling (5 minutes)

- [ ] Network error during onboarding (disable network):
  - [ ] Shows error message
  - [ ] Allows retry
  - [ ] Doesn't lose progress
  - [ ] Can refresh and continue

- [ ] Database error simulation:
  - [ ] Invalid Supabase key: shows error
  - [ ] Connection timeout: shows message
  - [ ] Generic error: provides support contact

- [ ] Browser compatibility:
  - [ ] Chrome: fully functional
  - [ ] Firefox: fully functional
  - [ ] Safari: fully functional
  - [ ] Edge: fully functional

### Phase 8: Performance (5 minutes)

- [ ] Onboarding page load: <2 seconds
- [ ] Feature settings page load: <2 seconds
- [ ] Saving preferences: <1 second
- [ ] No memory leaks (use DevTools Memory tab)
- [ ] CPU usage normal during interaction
- [ ] Lighthouse score >85 for Performance

### Phase 9: Mobile Testing (5 minutes)

- [ ] Responsive on mobile (375px width)
- [ ] Touch interactions work
- [ ] No horizontal scroll
- [ ] Questions readable on small screen
- [ ] Buttons large enough to tap
- [ ] Settings grid responsive

### Phase 10: Data Integrity (5 minutes)

- [ ] Create 3 test accounts with different preferences
- [ ] Verify all preferences saved correctly
- [ ] Test multiple rapid changes
- [ ] Verify no data corruption
- [ ] Check for orphaned records
- [ ] Verify RLS policies working (can't see other user's data)

---

## Monitoring & Alerting

### Real-Time Monitoring (First 24 Hours)

Monitor these metrics continuously for first 24 hours:

```bash
# 1. Error Rate
# Monitor: Supabase Dashboard → Logs
# Alert threshold: >1% error rate
# Action: Check error logs, contact on-call

# 2. API Response Time
# Monitor: Supabase → API Analytics
# Alert threshold: >500ms average
# Action: Check database performance, queries

# 3. Authentication Failures
# Monitor: Supabase → Auth Logs
# Alert threshold: >10 failures per minute
# Action: Check auth service, email verification

# 4. Database Connection Issues
# Monitor: Supabase → Database Logs
# Alert threshold: >5 connection errors
# Action: Check connection pool, restart if needed

# 5. Build Deployment Status
# Monitor: Vercel Dashboard → Deployments
# Alert threshold: Failed deployment
# Action: Check build logs, rollback if needed
```

### Setup Monitoring Alerts

**Option 1: Supabase Alerts**

1. Go to https://app.supabase.com/project/[id]
2. Settings → Monitoring
3. Set thresholds:
   - Error rate: >1%
   - Response time: >500ms
   - Connection errors: >5

**Option 2: Vercel Alerts**

1. Go to https://vercel.com/dashboard
2. Project Settings → Monitoring
3. Enable alerts for:
   - Build failures
   - Deployment failures
   - Performance degradation

**Option 3: Custom Monitoring**

```bash
# Create a monitoring script that checks:
# 1. Site uptime
# 2. API response time
# 3. Error rate

# Schedule to run every 5 minutes:
*/5 * * * * /path/to/monitoring-script.sh
```

### Monitoring Dashboard

Create a simple monitoring dashboard:

```
redeemrocket.in Deployment Status
========================================

Site Status:     ✅ UP
Response Time:   248ms (Avg)
Error Rate:      0.02%
Active Users:    12 (in onboarding)
Database:        ✅ HEALTHY

Recent Errors:
  - None

Performance:
  - Onboarding page: 1.2s
  - Feature settings: 1.1s
  - Database save: 234ms

Last Checked: 2026-04-22 12:35 PM UTC
Next Check: 2026-04-22 12:40 PM UTC
```

### Alert Escalation

If alerts triggered:

1. **Yellow Alert** (Performance degradation)
   - Monitor for 5 minutes
   - Check logs
   - If continues, investigate

2. **Red Alert** (Errors >1%, Downtime)
   - Immediately investigate
   - Check recent changes
   - Prepare rollback
   - Alert on-call engineer
   - Notify stakeholders

3. **Critical** (Site down, Data loss)
   - Execute rollback immediately
   - Alert all stakeholders
   - Call emergency meeting
   - Document incident

---

## User Communication Plan

### Pre-Deployment Communication

**Email to Users** (send 24 hours before):

```
Subject: Exciting New Feature Coming Tomorrow: Smart Onboarding!

Hi [Business Name],

Tomorrow we're launching Smart Onboarding - a smarter, faster way to 
get your business set up on RedeemRocket!

What's New:
✓ 5 simple questions to customize your experience
✓ See only the features you need
✓ Change your preferences anytime
✓ Takes just 2 minutes

What to Expect:
- New users will see Smart Onboarding on first login
- Existing users can update preferences in settings
- All your data stays the same, just a better experience

Questions? We're here to help at support@redeemrocket.in

The RedeemRocket Team
```

### In-App Announcement

```
🎉 NEW FEATURE: Smart Onboarding

Customize your RedeemRocket experience with Smart Onboarding!

Choose the features you want to use:
• Product Catalog
• Lead Management
• Email Campaigns
• Automation
• Social Media

Then sit back and see only what matters to you.

[Learn More] [Set Preferences Now]
```

### Support Team Brief

Send to support team 1 hour before deployment:

```
Smart Onboarding Deployment - TODAY

Deployment Time: [TIME]
Expected Duration: 5-10 minutes

What to Expect:
1. New users will see 5 onboarding questions
2. Answers determine which nav items appear
3. Users can change preferences in Settings → Feature Preferences

Common Questions:
Q: Why am I seeing different menu options?
A: You selected which features to use during onboarding. 
   Change this in Settings → Feature Preferences.

Q: Where are the [Feature] menu items?
A: You didn't enable that feature in onboarding.
   Enable it in Settings → Feature Preferences.

Q: Can I change my choices later?
A: Yes! Go to Settings → Feature Preferences anytime.

Please monitor support tickets and report any issues immediately.
```

### Post-Deployment Announcement

**Email to Users** (30 minutes after deployment):

```
Subject: Smart Onboarding is Now Live!

Good news! Smart Onboarding is now available.

New Users:
On your first login after today, you'll see Smart Onboarding.
Just answer 5 quick questions and you're all set!

Existing Users:
Your setup is unchanged. Whenever you're ready, you can try 
Smart Onboarding by going to Settings → Feature Preferences.

Learn More: [link to help documentation]
Video Tutorial: [link to video]
Questions? Contact support@redeemrocket.in

Enjoy,
The RedeemRocket Team
```

### Help Documentation

Create these help docs:

1. **Smart Onboarding Guide.md**
   - What is Smart Onboarding?
   - How to use it (step-by-step with screenshots)
   - What each feature does
   - How to customize later

2. **Feature Preferences FAQ.md**
   - Where to find Feature Preferences
   - How to enable/disable features
   - Why some menu items are hidden
   - How to customize at any time

3. **Troubleshooting.md**
   - Onboarding not showing
   - Changes not saving
   - Menu items not appearing
   - Performance issues
   - Contact support

---

## Rollback Procedure

### When to Rollback

Rollback if:
1. Site completely down after 30 minutes
2. Data loss or corruption detected
3. Critical security vulnerability found
4. >5% error rate sustained
5. Business-blocking bugs affecting >50% of users

### Rollback Steps (5-10 minutes)

#### Option 1: Via Vercel Dashboard (Easiest)

1. Go to https://vercel.com/dashboard
2. Select your project
3. Click "Deployments"
4. Find the previous successful deployment
5. Click "..." menu
6. Select "Promote to Production"
7. Click "Confirm"
8. Wait for deployment to complete

**Time**: 3-5 minutes

#### Option 2: Via Git

```bash
# Revert the problematic commit
git revert HEAD

# Or reset to previous commit
git reset --hard HEAD~1

# Push to main (triggers auto-deployment)
git push origin main --force

# Note: Use --force carefully in production!
```

**Time**: 3-5 minutes

#### Option 3: Via Vercel CLI

```bash
# List recent deployments
vercel deployments

# Rollback to previous
vercel rollback

# Confirm the rollback
```

**Time**: 2-3 minutes

### Database Rollback

If database migration caused issues:

#### Option 1: Supabase Backup Restore

1. Go to https://app.supabase.com/project/[id]
2. Settings → Backups
3. Click "Restore" on last known-good backup
4. Confirm date/time
5. Wait for restore (takes 5-15 minutes)

**Time**: 10-20 minutes

#### Option 2: Manual SQL Rollback

```sql
-- Drop new table
DROP TABLE IF EXISTS business_products;

-- Remove new columns
ALTER TABLE biz_users DROP COLUMN IF EXISTS feature_preferences;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_step;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_ai_data;
ALTER TABLE biz_users DROP COLUMN IF EXISTS onboarding_done;

-- Drop new indexes
DROP INDEX IF EXISTS idx_business_products_business_id;
DROP INDEX IF EXISTS idx_business_products_is_active;
DROP INDEX IF EXISTS idx_biz_users_feature_preferences;

-- Drop new functions/triggers
DROP TRIGGER IF EXISTS update_business_products_timestamp ON business_products;
DROP FUNCTION IF EXISTS update_business_products_updated_at();
```

**Time**: <2 minutes

### Post-Rollback Verification

```bash
# 1. Verify old code deployed
curl https://redeemrocket.in/index.html | head -20

# 2. Check site loads
open https://redeemrocket.in

# 3. Test login
# Try logging in with test account

# 4. Check console
# Open DevTools → Console
# Should have no critical errors

# 5. Verify database
# In Supabase Dashboard
# Check biz_users table structure
# Verify dropped columns gone

# 6. Confirm error rate normal
# Monitor error logs for 5 minutes
# Should return to normal levels
```

### Rollback Communication

**Email to Users** (if public-facing issue):

```
Subject: RedeemRocket Maintenance Update

We encountered an issue during tonight's deployment and have 
rolled back to our previous stable version.

Status: ✅ RESOLVED
All systems are functioning normally.

What happened:
- Deployed Smart Onboarding feature
- Issue detected and immediate rollback executed
- Site fully operational within 10 minutes

What you need to do:
- Nothing! Everything is back to normal.
- You may need to refresh your browser.

We're investigating the issue and will redeploy when ready.

Thank you for your patience,
The RedeemRocket Team
```

---

## Post-Deployment Tasks

### Immediate (First 30 minutes)

- [ ] Monitor error logs continuously
- [ ] Watch for user-reported issues
- [ ] Check database for anomalies
- [ ] Verify all features working
- [ ] Monitor performance metrics
- [ ] Be ready for quick rollback

### Short-term (First 24 hours)

- [ ] Monitor 24/7 for issues
- [ ] Respond to user feedback
- [ ] Track new user onboarding success rate
- [ ] Monitor database growth
- [ ] Review error logs
- [ ] Fix any critical bugs found
- [ ] Document any incidents

### Medium-term (First week)

- [ ] Analyze user adoption metrics
- [ ] Track onboarding completion rate
- [ ] Monitor feature preference distribution
- [ ] Review user feedback
- [ ] Fix non-critical bugs
- [ ] Optimize performance if needed
- [ ] Create incident report (if any issues)

### Long-term (Ongoing)

- [ ] Monitor success metrics
- [ ] Collect user feedback
- [ ] Plan next feature iteration
- [ ] Optimize based on usage patterns
- [ ] Update documentation
- [ ] Plan feature enhancements
- [ ] Schedule next release

### Documentation & Cleanup

- [ ] Update deployment guide with lessons learned
- [ ] Document any issues encountered
- [ ] Update troubleshooting guide
- [ ] Archive old deployment docs
- [ ] Update CHANGELOG.md
- [ ] Celebrate successful deployment!

---

## Success Metrics

### Target Metrics

| Metric | Target | Threshold | Owner |
|--------|--------|-----------|-------|
| **Uptime** | 99.9% | >95% OK | DevOps |
| **Error Rate** | <0.1% | <1% OK | Backend |
| **Load Time** | <2s | <3s OK | Frontend |
| **API Response** | <200ms | <500ms OK | Backend |
| **Onboarding Completion** | >70% | >50% OK | Product |
| **Avg Completion Time** | <5 min | <15 min OK | Product |
| **User Satisfaction** | >4.0/5 | >3.0/5 OK | Product |
| **Feature Adoption** | >80% | >50% OK | Product |
| **Database Health** | 100% | >95% OK | DevOps |
| **Security** | 0 breaches | 0 critical | Security |

### How to Track Metrics

**Real-time Dashboard**:
- Create in Vercel Analytics
- Create in Supabase Dashboard
- Create in custom monitoring tool

**Weekly Report**:
```
Smart Onboarding - Weekly Report
================================
Week of: April 22-28, 2026

Uptime:          99.98% ✅
Error Rate:      0.03% ✅
Avg Load Time:   1.8s ✅
API Response:    187ms ✅
Completions:     78% ✅
Satisfaction:    4.2/5 ✅
```

---

## Emergency Contacts

### Deployment Team

| Role | Name | Email | Phone |
|------|------|-------|-------|
| **Tech Lead** | [Name] | [email] | [phone] |
| **DevOps** | [Name] | [email] | [phone] |
| **Backend Lead** | [Name] | [email] | [phone] |
| **Frontend Lead** | [Name] | [email] | [phone] |
| **Product Manager** | [Name] | [email] | [phone] |
| **Support Lead** | [Name] | [email] | [phone] |

### External Services

| Service | Contact | Phone | Hours |
|---------|---------|-------|-------|
| **Vercel Support** | support@vercel.com | +1 (844) 4-VERCEL | 24/7 |
| **Supabase Support** | support@supabase.io | [TBD] | 24/7 |
| **Domain Registrar** | [Provider] | [phone] | Business |

### Escalation Path

1. **Level 1**: Development team (first responder)
2. **Level 2**: Tech Lead (if issues not resolved in 15 min)
3. **Level 3**: CTO/VP Engineering (if issues not resolved in 30 min)
4. **Level 4**: CEO (if revenue-impacting)

### On-Call Schedule

- **Week of April 22**: [Engineer Name]
- **Week of April 29**: [Engineer Name]
- **Week of May 6**: [Engineer Name]

Rotate on Mondays at 9 AM UTC.

---

## Deployment Checklist (Final)

### Day Before Deployment

- [ ] Final code review completed
- [ ] All tests passing
- [ ] Database migration tested on staging
- [ ] Backups verified
- [ ] Environment variables ready
- [ ] Team briefed
- [ ] User communications drafted
- [ ] Rollback procedure verified
- [ ] Monitoring alerts set up
- [ ] Support team trained

### Day of Deployment

**2 Hours Before**:
- [ ] Final verification checklist completed
- [ ] Team assembled and ready
- [ ] Communication channels open
- [ ] Monitoring active

**1 Hour Before**:
- [ ] Final pre-deployment verification
- [ ] Staging environment confirmed
- [ ] Team synced on go/no-go status

**At Deployment Time**:
- [ ] Code pushed to main
- [ ] Database migration executed
- [ ] Vercel deployment monitored
- [ ] Post-deployment verification started

**30 Minutes After**:
- [ ] All verification checks passed
- [ ] User communication sent
- [ ] Monitoring confirmed
- [ ] Team debriefing

**24 Hours After**:
- [ ] Incident report filed (if any)
- [ ] Metrics reviewed
- [ ] User feedback collected
- [ ] Post-deployment tasks completed

---

## Appendix A: Reference Files

Key files referenced in this plan:

```
Project Root: /Users/adityatiwari/Downloads/App\ Creation\ Request-2/.claude/worktrees/jolly-herschel

Components:
  - src/business/components/SmartOnboarding.tsx
  - src/business/components/FeatureSettings.tsx

Database:
  - supabase/migrations/20250422_smart_onboarding_schema.sql

Configuration:
  - vercel.json
  - .env.local
  - src/business/context/BusinessContext.tsx

Documentation:
  - SMART_ONBOARDING_IMPLEMENTATION.md
  - NEXT_STEPS.md
  - TEST_EXECUTION_REPORT.md
```

---

## Appendix B: Deployment Timeline

```
Deployment Day Timeline
=======================

09:00 AM - Final Pre-deployment Verification
          - Code review
          - Build verification
          - Environment check
          - Database backup verified

09:15 AM - Database Migration Execution
          - Execute migration in Supabase
          - Monitor execution
          - Verify success

09:20 AM - Code Deployment
          - Git push to main
          - Vercel auto-deployment triggered
          - Monitor build process

09:25 AM - Build Completion
          - Verify build successful
          - Check bundle size
          - Monitor deployment progress

09:30 AM - Deployment Goes Live
          - Verify site loads
          - Check console for errors
          - Verify DNS resolution

09:35 AM - Post-Deployment Verification
          - Full verification checklist
          - Test all features
          - Verify database integration

09:45 AM - User Communication
          - Send deployment announcement
          - Brief support team
          - Monitor first interactions

10:00 AM - Active Monitoring Begins
          - Watch error logs
          - Monitor performance
          - Respond to user feedback

ESTIMATED TOTAL TIME: 1 hour (9:00 AM - 10:00 AM)
```

---

## Appendix C: Testing Scenarios

### Happy Path Test

```
1. Sign up new account
2. Verify email
3. See Smart Onboarding
4. Answer Q1: Yes to Product Catalog
5. Answer Q2: Yes to Lead Management
6. Answer Q3: No to Email Campaigns
7. Answer Q4: Yes to Automation
8. Answer Q5: No to Social Media
9. Complete and see confirmation
10. Navigate to dashboard
11. Verify Products, Leads, Automation visible
12. Verify Campaigns, Social hidden
13. Go to Feature Preferences
14. Toggle Email Campaigns on
15. Verify Campaigns now visible
16. Log out and log back in
17. Verify preferences persisted
```

**Expected Result**: All steps complete without errors

### Error Handling Test

```
1. Start onboarding
2. Disable network (DevTools → Offline)
3. Try to complete
4. Verify error message appears
5. Re-enable network
6. Click retry
7. Verify completes successfully
8. Check no duplicate data in database
```

**Expected Result**: Graceful error handling, no data duplication

### Database Test

```
1. Complete onboarding with test account
2. Check Supabase Dashboard → biz_users table
3. Find test user's record
4. Verify feature_preferences column populated
5. Verify onboarding_done = true
6. Verify all new columns present
7. Toggle preferences
8. Verify changes reflected in database
```

**Expected Result**: All data saved correctly, no corruption

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-22 | Deployment Team | Initial comprehensive plan |

---

**Status**: READY FOR DEPLOYMENT  
**Approval**: Pending  
**Last Updated**: 2026-04-22  

---

*For questions or issues, contact: [deployment-team-email]*

# Feature Marketplace Database Deployment Guide

This guide provides comprehensive instructions for deploying the Feature Marketplace database schema to Supabase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Migration Deployment](#migration-deployment)
4. [Database Verification](#database-verification)
5. [RLS Policy Testing](#rls-policy-testing)
6. [Seed Data](#seed-data)
7. [Production Checklist](#production-checklist)
8. [Rollback Procedures](#rollback-procedures)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. A Supabase project created at https://app.supabase.com
2. Your project URL and anonymous key
3. Access to the Supabase dashboard
4. PostgreSQL understanding (optional, but helpful)

## Environment Setup

### 1. Local Development Environment

Create a `.env.local` file in `business-app/frontend/`:

```bash
cp business-app/frontend/.env.example business-app/frontend/.env.local
```

Edit the file with your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. Finding Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project
3. Click **Settings** (gear icon)
4. Click **API** in the left sidebar
5. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** → `VITE_SUPABASE_ANON_KEY`

### 3. Verifying Credentials

Test your connection with this curl command:

```bash
curl -H "apikey: YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/ \
  -H "Content-Type: application/json"
```

You should get a successful response.

## Migration Deployment

### Step 1: Access Supabase SQL Editor

1. Open your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the Feature Marketplace Migration

Copy the entire contents of `supabase/migrations/20250416_feature_marketplace.sql` and paste it into the SQL editor.

Click **Run** to execute the migration.

**Expected output**: No errors, migration should complete in 2-5 seconds.

### Step 3: Verify Migration Completed

Run this verification query:

```sql
-- Check all required tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('features', 'business_owner_features', 'feature_categories', 'feature_templates', 'feature_requests')
ORDER BY table_name;
```

**Expected result**: 5 rows (all tables created)

## Database Verification

### Automated Health Check

The frontend includes a migration health check utility. When your app starts, run:

```typescript
import { runDatabaseHealthCheck, logMigrationStatus } from './src/lib/supabase/migrations'

const health = await runDatabaseHealthCheck()
logMigrationStatus(health.migration)

if (!health.healthy) {
  console.error('Database migration incomplete:', health.migration.errors)
  // Handle deployment error
}
```

### Manual Verification Checklist

#### 1. Verify Table Structure

```sql
-- Check features table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'features'
ORDER BY ordinal_position;

-- Expected columns:
-- id (uuid), slug (text), name (text), description (text), category (text),
-- icon (text), dependencies (jsonb), min_plan (text), base_price_monthly (numeric),
-- additional_seats_price (numeric), relevant_for (jsonb), status (text),
-- version (text), components (jsonb), created_at (timestamp), updated_at (timestamp)
```

#### 2. Verify Foreign Keys

```sql
-- Check business_owner_features foreign key constraint
SELECT constraint_name, table_name, column_name
FROM information_schema.constraint_column_usage
WHERE constraint_name LIKE 'business_%'
ORDER BY table_name;
```

#### 3. Verify Indexes

```sql
-- List all indexes on feature tables
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('features', 'business_owner_features', 'feature_requests', 'feature_templates')
ORDER BY tablename;

-- Expected indexes:
-- idx_features_category
-- idx_features_status
-- idx_business_owner_features_business
-- idx_business_owner_features_feature
-- idx_feature_requests_business
-- idx_feature_requests_status
-- idx_templates_business_type
```

#### 4. Verify RLS Is Enabled

```sql
-- Check RLS policies
SELECT tablename, policyname, permissive, qual
FROM pg_policies
WHERE tablename IN ('features', 'business_owner_features', 'feature_requests')
ORDER BY tablename, policyname;

-- Expected policies:
-- features: "View active features"
-- business_owner_features: "Manage own features"
-- feature_requests: "Submit feature requests", "View own feature requests"
```

## RLS Policy Testing

### 1. Test "View Active Features" Policy

This policy allows anyone to view active features:

```sql
-- Test as anonymous user (no authentication)
SELECT id, name, slug, status
FROM features
WHERE status IN ('active', 'beta')
LIMIT 5;
```

**Expected**: Returns features with status 'active' or 'beta'

### 2. Test "Manage Own Features" Policy

This policy allows users to manage only their business's features:

```sql
-- Test as authenticated user
SELECT id, business_id, feature_id, status
FROM business_owner_features
WHERE business_id = (SELECT business_id FROM biz_users WHERE id = auth.uid())
LIMIT 5;
```

**Expected**: Returns only features for the authenticated user's business

### 3. Test "Submit Feature Requests" Policy

Users can submit feature requests for their own business:

```sql
-- Insert test should work for authenticated user
INSERT INTO feature_requests (
  business_id, business_owner_id, requested_feature_name, description, status
) VALUES (
  (SELECT business_id FROM biz_users WHERE id = auth.uid()),
  auth.uid(),
  'Test Feature',
  'Test Description',
  'submitted'
);
```

**Expected**: Insert succeeds for authenticated user

## Seed Data

### Add Sample Features

```sql
-- Seed basic features
INSERT INTO features (
  slug, name, description, category, status, base_price_monthly, relevant_for, min_plan
) VALUES
('product-catalog', 'Product Catalog', 'Showcase your products with detailed descriptions and images', 'sales', 'active', 0, 
  '{"ecommerce": 95, "services": 20, "marketplace": 80, "b2b": 40}'::jsonb, 'starter'),
('booking-system', 'Booking System', 'Allow customers to book services or appointments', 'operations', 'active', 29.99,
  '{"ecommerce": 10, "services": 95, "marketplace": 50, "b2b": 60}'::jsonb, 'growth'),
('email-marketing', 'Email Marketing', 'Create and send email campaigns to customers', 'marketing', 'active', 49.99,
  '{"ecommerce": 85, "services": 60, "marketplace": 70, "b2b": 80}'::jsonb, 'growth');

-- Seed categories
INSERT INTO feature_categories (slug, name, description, display_order) VALUES
('sales', 'Sales', 'Increase revenue and customer acquisitions', 1),
('operations', 'Operations', 'Manage your business efficiently', 2),
('marketing', 'Marketing', 'Reach and engage your customers', 3),
('customer_service', 'Customer Service', 'Provide excellent support', 4),
('automation', 'Automation', 'Automate repetitive tasks', 5);
```

### Verify Seed Data

```sql
SELECT COUNT(*) as feature_count FROM features WHERE status = 'active';
SELECT COUNT(*) as category_count FROM feature_categories;
```

## Production Checklist

Before deploying to production, verify:

- [ ] Migration file exists at `supabase/migrations/20250416_feature_marketplace.sql`
- [ ] All tables created successfully (verification query passed)
- [ ] All indexes exist and are functioning
- [ ] RLS policies enabled on all required tables
- [ ] RLS policies tested and working correctly
- [ ] Sample seed data inserted (optional but recommended)
- [ ] Environment variables set correctly in production
- [ ] Database backup created (via Supabase dashboard)
- [ ] Team members notified of deployment
- [ ] Monitoring alerts configured for database

### Pre-Production Verification Script

Run this script to verify everything:

```typescript
import { 
  checkFeatureMarketplaceMigration, 
  logMigrationStatus,
  runDatabaseHealthCheck 
} from './src/lib/supabase/migrations'

async function verifyDeployment() {
  console.log('Starting database verification...')
  
  const health = await runDatabaseHealthCheck()
  logMigrationStatus(health.migration)
  
  if (health.healthy) {
    console.log('✅ All checks passed! Database is ready for production.')
    return true
  } else {
    console.error('❌ Database checks failed!')
    console.error('Errors:', health.migration.errors)
    return false
  }
}

verifyDeployment()
```

## Rollback Procedures

### If Migration Fails

If something goes wrong during migration:

1. **Identify the Error**
   - Check Supabase logs
   - Note the specific error message
   - Review the migration SQL

2. **Option 1: Manual Fix**
   - Identify which statement failed
   - Fix the SQL
   - Re-run the corrected statement

3. **Option 2: Rollback and Reapply**
   - Delete the tables (if needed):
   ```sql
   DROP TABLE IF EXISTS feature_requests CASCADE;
   DROP TABLE IF EXISTS feature_templates CASCADE;
   DROP TABLE IF EXISTS business_owner_features CASCADE;
   DROP TABLE IF EXISTS feature_categories CASCADE;
   DROP TABLE IF EXISTS features CASCADE;
   ```
   - Review and fix the migration file
   - Re-run the migration

### If biz_users Table Is Missing

The migration references `biz_users` table. If it doesn't exist, you'll see an error. Ensure:

1. All previous migrations have run successfully
2. The `biz_users` table exists with a `business_id` column
3. Check business app database setup documentation

## Troubleshooting

### "Relation does not exist" Error

**Problem**: Migration fails with "relation 'biz_users' does not exist"

**Solution**:
1. Verify previous migrations have run
2. Check that `biz_users` table exists
3. Run this query to verify:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'biz_users';
   ```

### "Permission denied" Error

**Problem**: RLS policies prevent access

**Solution**:
1. Ensure you're using a service role key for admin operations
2. Test with the anon key to verify RLS is working
3. Check user authentication in your app

### Foreign Key Constraint Error

**Problem**: "Insert or update on table 'business_owner_features' violates foreign key constraint"

**Solution**:
1. Verify the feature_id exists in features table
2. Verify the business_id exists in biz_users table
3. Check data type consistency (UUID vs TEXT)

### Slow Queries

**Problem**: Feature queries are slow

**Solution**:
1. Verify indexes were created:
   ```sql
   SELECT * FROM pg_stat_user_indexes 
   WHERE relname IN ('features', 'business_owner_features');
   ```
2. Run ANALYZE to update statistics:
   ```sql
   ANALYZE features;
   ANALYZE business_owner_features;
   ```

### RLS Policy Not Working

**Problem**: Users can see data they shouldn't

**Solution**:
1. Verify RLS is enabled on the table:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE tablename = 'business_owner_features';
   ```
   Result should show `rowsecurity = true`

2. Verify policies are correct:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'business_owner_features';
   ```

3. Test with explicit user context:
   ```sql
   -- Simulate authenticated user
   SELECT * FROM features 
   LIMIT 1;
   ```

## Monitoring and Maintenance

### Enable Slow Query Logging

In Supabase dashboard:

1. Go to **Project Settings**
2. Click **Database** section
3. Enable **Query Performance Insights**
4. Set slow query threshold to 100ms

### Regular Backups

Supabase automatically creates backups, but you can also:

1. Download backup via dashboard
2. Use `pg_dump` to export data:
   ```bash
   pg_dump postgresql://user:password@host/dbname > backup.sql
   ```

### Monitor RLS Performance

RLS policies can add overhead. Monitor with:

```sql
-- Check RLS policy execution time
EXPLAIN ANALYZE
SELECT * FROM business_owner_features
WHERE business_id = 'some-id';
```

## Support Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Reference](https://supabase.com/docs/guides/database/full-text-search)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/sql-createrole.html)
- [Project Issues & Support](https://github.com/your-repo/issues)

## Next Steps

After successful deployment:

1. Update feature data with real business information
2. Set up monitoring and alerting
3. Create admin dashboard for feature management
4. Implement feature request handling workflow
5. Set up analytics for feature usage
6. Plan feature roadmap based on requests

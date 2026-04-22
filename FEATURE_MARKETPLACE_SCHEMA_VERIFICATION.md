# Feature Marketplace Schema Verification Guide

Complete reference for verifying the Feature Marketplace database schema has been properly deployed.

## Migration File Reference

**File**: `supabase/migrations/20250416_feature_marketplace.sql`

**Status**: Ready for deployment

**Last Updated**: 2026-04-16

## Schema Overview

The Feature Marketplace uses 5 main tables:

```
features
├── business_owner_features (FK: feature_id)
├── feature_requests (references features indirectly)
└── feature_templates (references features via JSONB array)

biz_users
└── business_owner_features (FK: business_id)
└── feature_requests (FK: business_id)
```

## Table Specifications

### 1. `features` Table

**Purpose**: Catalog of all available features

**Columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| slug | TEXT | NO | - | Unique identifier, URL-safe |
| name | TEXT | NO | - | Display name |
| description | TEXT | YES | - | Short description |
| long_description | TEXT | YES | - | Detailed description |
| category | TEXT | NO | - | Feature category |
| icon | TEXT | YES | - | Emoji or icon name |
| dependencies | JSONB | YES | '[]' | Array of dependent features |
| min_plan | TEXT | YES | 'starter' | Minimum plan required |
| base_price_monthly | NUMERIC | YES | 0 | Base monthly price |
| additional_seats_price | NUMERIC | YES | 0 | Per-seat pricing |
| relevant_for | JSONB | YES | '{}' | Business type relevance scores |
| status | TEXT | YES | 'active' | Status: active, beta, deprecated, etc |
| version | TEXT | YES | '1.0.0' | Feature version |
| components | JSONB | YES | '[]' | React components included |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Constraints**:
- PRIMARY KEY: id
- UNIQUE: slug

**Indexes**:
- idx_features_category
- idx_features_status

**RLS**: ENABLED
- Policy: "View active features" - SELECT only (status IN 'active', 'beta')

**Verification Query**:
```sql
SELECT * FROM features LIMIT 1;
```

### 2. `business_owner_features` Table

**Purpose**: Track which features are enabled for each business

**Columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| business_id | TEXT | NO | - | Foreign key to biz_users |
| feature_id | UUID | NO | - | Foreign key to features |
| enabled_by | TEXT | NO | - | How feature was enabled |
| enabled_by_user_id | UUID | YES | - | User who enabled it |
| enabled_at | TIMESTAMPTZ | YES | now() | When enabled |
| status | TEXT | YES | 'active' | Status: active, suspended, archived |
| config | JSONB | YES | '{}' | Custom configuration |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Constraints**:
- PRIMARY KEY: id
- FOREIGN KEY: business_id -> biz_users(business_id)
- FOREIGN KEY: feature_id -> features(id) ON DELETE CASCADE
- UNIQUE: (business_id, feature_id)

**Indexes**:
- idx_business_owner_features_business
- idx_business_owner_features_feature

**RLS**: ENABLED
- Policy: "Manage own features" - ALL operations for user's own business

**Verification Query**:
```sql
SELECT * FROM business_owner_features LIMIT 1;
```

### 3. `feature_categories` Table

**Purpose**: Organize features into categories

**Columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| slug | TEXT | NO | - | Unique slug |
| name | TEXT | NO | - | Display name |
| description | TEXT | YES | - | Category description |
| icon | TEXT | YES | - | Category icon |
| display_order | INT | YES | - | Sort order |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |

**Constraints**:
- PRIMARY KEY: id
- UNIQUE: slug

**RLS**: Not explicitly enabled (relies on table-level access)

**Verification Query**:
```sql
SELECT * FROM feature_categories ORDER BY display_order;
```

### 4. `feature_templates` Table

**Purpose**: Pre-configured feature sets for different business types

**Columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| name | TEXT | NO | - | Template name |
| description | TEXT | YES | - | Template description |
| thumbnail_url | TEXT | YES | - | Template thumbnail |
| business_type | TEXT | NO | - | Target business type |
| industry | TEXT | YES | - | Target industry |
| included_features | JSONB | NO | '[]' | Array of feature IDs |
| included_pages | JSONB | YES | '[]' | Array of page names |
| color_scheme | TEXT | YES | 'modern_blue' | Color scheme name |
| layout_style | TEXT | YES | 'grid' | Layout style |
| total_monthly_price | NUMERIC | YES | - | Total price |
| status | TEXT | YES | 'active' | Status |
| display_order | INT | YES | - | Sort order |
| created_at | TIMESTAMPTZ | NO | now() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NO | now() | Last update timestamp |

**Constraints**:
- PRIMARY KEY: id

**Indexes**:
- idx_templates_business_type

**RLS**: Not explicitly enabled

**Verification Query**:
```sql
SELECT * FROM feature_templates WHERE business_type = 'ecommerce';
```

### 5. `feature_requests` Table

**Purpose**: Track user requests for new features

**Columns**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | NO | uuid_generate_v4() | Primary key |
| business_id | TEXT | NO | - | Foreign key to biz_users |
| business_owner_id | UUID | YES | - | User who submitted |
| requested_feature_name | TEXT | NO | - | Feature name |
| description | TEXT | NO | - | Feature description |
| use_case | TEXT | YES | - | Use case description |
| business_type | TEXT | YES | - | Business type |
| estimated_users | INT | YES | - | Estimated users |
| status | TEXT | YES | 'submitted' | Status in pipeline |
| priority | TEXT | YES | 'medium' | Priority level |
| ai_development_started_at | TIMESTAMPTZ | YES | - | AI work started |
| ai_development_completed_at | TIMESTAMPTZ | YES | - | AI work completed |
| ai_generated_code | JSONB | YES | - | Generated code |
| ai_notes | TEXT | YES | - | AI development notes |
| ai_model_used | TEXT | YES | 'claude-opus' | AI model used |
| admin_review_started_at | TIMESTAMPTZ | YES | - | Admin review started |
| admin_approval_at | TIMESTAMPTZ | YES | - | Admin approval time |
| approved_by_admin_id | UUID | YES | - | Approving admin |
| admin_notes | TEXT | YES | - | Admin notes |
| admin_testing_status | TEXT | YES | - | Testing status |
| admin_testing_notes | TEXT | YES | - | Testing notes |
| make_available_to_all_businesses | BOOLEAN | YES | false | Rollout scope |
| rollout_percentage | INT | YES | 0 | Rollout percentage |
| deployed_to_owner_at | TIMESTAMPTZ | YES | - | Deployment time |
| submitted_at | TIMESTAMPTZ | NO | now() | Submission time |
| updated_at | TIMESTAMPTZ | NO | now() | Last update |

**Constraints**:
- PRIMARY KEY: id
- FOREIGN KEY: business_id -> biz_users(business_id)

**Indexes**:
- idx_feature_requests_business
- idx_feature_requests_status

**RLS**: ENABLED
- Policy: "Submit feature requests" - INSERT for own business
- Policy: "View own feature requests" - SELECT for own business

**Verification Query**:
```sql
SELECT * FROM feature_requests WHERE status = 'submitted' ORDER BY submitted_at DESC;
```

## biz_users Table Modifications

The migration adds columns to the existing `biz_users` table:

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| business_type | TEXT | - | ecommerce, services, marketplace, b2b |
| selected_template_id | UUID | - | Current template |
| theme_config | JSONB | '{}' | Theme settings |
| custom_pricing_override | NUMERIC | - | Custom pricing |
| monthly_billing_amount | NUMERIC | 0 | Billing amount |

## Complete Verification Checklist

### Phase 1: Basic Existence Checks

```sql
-- Check if tables exist (should return 5 rows)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('features', 'business_owner_features', 'feature_categories', 'feature_templates', 'feature_requests')
ORDER BY table_name;
```

**Expected Output**:
```
business_owner_features
feature_categories
feature_requests
feature_templates
features
```

### Phase 2: Column Verification

For each table, verify columns:

```sql
-- Features table columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'features'
ORDER BY ordinal_position;

-- Business owner features columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'business_owner_features'
ORDER BY ordinal_position;

-- Feature requests columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feature_requests'
ORDER BY ordinal_position;

-- Feature categories columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feature_categories'
ORDER BY ordinal_position;

-- Feature templates columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feature_templates'
ORDER BY ordinal_position;
```

### Phase 3: Constraint Verification

```sql
-- Check primary keys
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'PRIMARY KEY'
AND table_name IN ('features', 'business_owner_features', 'feature_categories', 'feature_templates', 'feature_requests');

-- Check unique constraints
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name IN ('features', 'business_owner_features', 'feature_categories', 'feature_templates', 'feature_requests');

-- Check foreign keys
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name IN ('business_owner_features', 'feature_requests')
AND column_name != table_name;
```

### Phase 4: Index Verification

```sql
-- All indexes
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE tablename IN ('features', 'business_owner_features', 'feature_categories', 'feature_templates', 'feature_requests');
```

**Expected Indexes** (7 total):
- idx_features_category
- idx_features_status
- idx_business_owner_features_business
- idx_business_owner_features_feature
- idx_feature_requests_business
- idx_feature_requests_status
- idx_templates_business_type

### Phase 5: RLS Policy Verification

```sql
-- Check RLS enabled on tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('features', 'business_owner_features', 'feature_requests');

-- Check policies
SELECT tablename, policyname, permissive, cmd, qual
FROM pg_policies
WHERE tablename IN ('features', 'business_owner_features', 'feature_requests')
ORDER BY tablename, policyname;
```

**Expected RLS Status**:
- features: RLS ENABLED
- business_owner_features: RLS ENABLED
- feature_requests: RLS ENABLED
- feature_categories: RLS DISABLED (optional)
- feature_templates: RLS DISABLED (optional)

**Expected Policies**:
1. features - "View active features" (SELECT, public)
2. business_owner_features - "Manage own features" (ALL, authenticated)
3. feature_requests - "Submit feature requests" (INSERT, authenticated)
4. feature_requests - "View own feature requests" (SELECT, authenticated)

## Data Integrity Checks

### Check for Orphaned Records

```sql
-- Check for orphaned feature_requests (business_id not in biz_users)
SELECT COUNT(*) FROM feature_requests fr
WHERE NOT EXISTS (
  SELECT 1 FROM biz_users bu WHERE bu.business_id = fr.business_id
);

-- Check for orphaned business_owner_features
SELECT COUNT(*) FROM business_owner_features bof
WHERE NOT EXISTS (
  SELECT 1 FROM features f WHERE f.id = bof.feature_id
)
OR NOT EXISTS (
  SELECT 1 FROM biz_users bu WHERE bu.business_id = bof.business_id
);
```

Both queries should return 0 (no orphaned records).

### Check Unique Constraints

```sql
-- Check for duplicate slug values in features
SELECT slug, COUNT(*) as count
FROM features
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check for duplicate slug values in feature_categories
SELECT slug, COUNT(*) as count
FROM feature_categories
GROUP BY slug
HAVING COUNT(*) > 1;

-- Check for duplicate (business_id, feature_id) in business_owner_features
SELECT business_id, feature_id, COUNT(*) as count
FROM business_owner_features
GROUP BY business_id, feature_id
HAVING COUNT(*) > 1;
```

All queries should return 0 rows (no duplicates).

## RLS Testing Guide

### Test 1: View Active Features (Public)

```sql
-- This should work as any user (including anonymous)
SELECT COUNT(*) as active_feature_count
FROM features
WHERE status IN ('active', 'beta');

-- This should return 0 or fail
SELECT COUNT(*) as all_features
FROM features
WHERE status NOT IN ('active', 'beta');
```

### Test 2: Manage Own Features (Authenticated)

```sql
-- Need to set authenticated user context
-- This works if user owns the business
SELECT * FROM business_owner_features
WHERE business_id = (SELECT business_id FROM biz_users WHERE id = auth.uid());
```

### Test 3: Submit Feature Requests (Authenticated)

```sql
-- User can insert requests for their own business
INSERT INTO feature_requests (
  business_id,
  business_owner_id,
  requested_feature_name,
  description,
  status
) VALUES (
  (SELECT business_id FROM biz_users WHERE id = auth.uid()),
  auth.uid(),
  'Test Feature',
  'This is a test',
  'submitted'
)
RETURNING id;
```

## Performance Baseline

Initial performance metrics (baseline):

```sql
-- Check query execution time
EXPLAIN ANALYZE
SELECT f.* FROM features f
WHERE f.category = 'sales' AND f.status = 'active';

EXPLAIN ANALYZE
SELECT bof.* FROM business_owner_features bof
WHERE bof.business_id = 'test-id';

EXPLAIN ANALYZE
SELECT fr.* FROM feature_requests fr
WHERE fr.status = 'submitted'
ORDER BY fr.created_at DESC;
```

**Target**: All queries should complete in <10ms

## Deployment Sign-Off

After completing all verification steps:

- [ ] All 5 tables created successfully
- [ ] All columns present with correct data types
- [ ] All constraints (PK, FK, UNIQUE) in place
- [ ] All 7 indexes created
- [ ] RLS enabled and policies configured
- [ ] RLS policies tested and working
- [ ] No orphaned records
- [ ] No constraint violations
- [ ] Query performance acceptable
- [ ] Sample data inserted (optional)

**Verification Completed**: __________________

**Verified By**: __________________

**Date**: __________________

**Notes**: ___________________________________________________________________

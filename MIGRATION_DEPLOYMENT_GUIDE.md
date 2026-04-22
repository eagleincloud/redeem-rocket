# Feature Marketplace Migration Deployment Guide

## 🎯 Objective
Deploy the Feature Marketplace database schema and seed data to your Supabase production environment.

## 📋 Prerequisites
- Supabase project is created and configured
- `.env.local` file contains valid credentials
- All migrations files exist in `supabase/migrations/`

## 🚀 Deployment Methods

### Method 1: Supabase Dashboard (Easiest - No CLI Required)

1. **Go to Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your project (eomqkeoozxnttqizstzk)

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "+ New Query"

3. **Deploy Main Migration**
   - Open: `supabase/migrations/20250416_feature_marketplace.sql`
   - Copy entire file contents
   - Paste into SQL Editor query window
   - Click "Run" (play button)
   - Wait for completion (takes ~5 seconds)
   - ✅ You should see: "Query executed successfully"

4. **Deploy Seed Data**
   - Click "+ New Query"
   - Open: `supabase/migrations/20250416_seed_features.sql`
   - Copy entire file contents
   - Paste into SQL Editor
   - Click "Run"
   - ✅ You should see: "Query executed successfully"

5. **Verify Deployment**
   - Click "Table Editor" in left sidebar
   - You should see these new tables:
     - `features` (40+ rows after seed)
     - `business_owner_features`
     - `feature_categories` (6 categories)
     - `feature_templates` (5 templates)
     - `feature_requests` (8 sample requests)

---

### Method 2: Using Supabase CLI (If Docker Installed)

```bash
# 1. Navigate to project root
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2/.claude/worktrees/jolly-herschel

# 2. Link your project (if not already linked)
supabase link --project-ref eomqkeoozxnttqizstzk

# 3. Push migrations
supabase db push

# 4. Verify
supabase db tables
```

**Note**: Requires Docker daemon running. If Docker is not available, use Method 1.

---

### Method 3: Using psql Command (Linux/Mac)

```bash
# 1. Extract DATABASE_URL from .env.local
export DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d= -f2-)

# 2. Deploy migrations
psql "$DATABASE_URL" < supabase/migrations/20250416_feature_marketplace.sql
psql "$DATABASE_URL" < supabase/migrations/20250416_seed_features.sql

# 3. Verify
psql "$DATABASE_URL" -c "SELECT COUNT(*) as feature_count FROM features;"
```

**Note**: Requires `psql` installed. Install via:
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql-client`

---

## ✅ Verification Checklist

After deployment, verify everything is working:

### 1. Check Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
Expected: 5 tables (features, business_owner_features, feature_categories, feature_templates, feature_requests)

### 2. Check Feature Count
```sql
SELECT COUNT(*) as total_features FROM features;
```
Expected: 40+ features

### 3. Check Categories
```sql
SELECT slug, name, COUNT(*) as feature_count 
FROM features 
JOIN feature_categories ON features.category = feature_categories.slug 
GROUP BY slug, name;
```
Expected: 6 categories with features distributed

### 4. Check Templates
```sql
SELECT COUNT(*) as total_templates FROM feature_templates;
```
Expected: 5 templates

### 5. Check Feature Requests
```sql
SELECT status, COUNT(*) as count 
FROM feature_requests 
GROUP BY status 
ORDER BY count DESC;
```
Expected: Sample requests in various statuses

### 6. Check RLS Policies
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('features', 'business_owner_features', 'feature_templates', 'feature_requests')
ORDER BY tablename, policyname;
```
Expected: 4 RLS policies (public view, owner management, etc.)

### 7. Check Indexes
```sql
SELECT indexname FROM pg_indexes 
WHERE tablename IN ('features', 'feature_templates', 'feature_requests')
ORDER BY indexname;
```
Expected: 7 performance indexes

---

## 📊 Post-Deployment Verification

After migrations are deployed, verify the feature marketplace is working:

### 1. Check Supabase Dashboard
- Go to: https://app.supabase.com → Your Project → Table Editor
- Click each table and verify data:
  - `features`: 40+ rows with pricing and business type relevance
  - `feature_categories`: 6 categories
  - `feature_templates`: 5 complete templates
  - `feature_requests`: 8 sample requests

### 2. Test API Access
```bash
# From project root
curl -X GET "https://eomqkeoozxnttqizstzk.supabase.co/rest/v1/features" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

Expected: JSON array with 40+ feature objects

### 3. Test React App
```bash
# Start the business app frontend
cd business-app/frontend
npm install
npm run dev

# Navigate to Features page (after login)
# You should see:
# - Feature Marketplace loads without errors
# - All 40 features visible in grid
# - Pricing calculates correctly
# - Templates display with feature counts
```

---

## 🐛 Troubleshooting

### Issue: "Table 'features' already exists"
**Cause**: Migration was already applied  
**Solution**: Safe to ignore. Migrations are idempotent (CREATE TABLE IF NOT EXISTS)

### Issue: "Foreign key constraint failed"
**Cause**: Seed data references non-existent categories or dependencies  
**Solution**: Ensure both migrations run in order (schema first, then seed data)

### Issue: "Permission denied" in RLS policies
**Cause**: User doesn't have proper role permissions  
**Solution**: Use service role key for admin operations

### Issue: Features not appearing in dashboard
**Cause**: RLS policy blocking query  
**Solution**: Verify RLS policies with verification queries above

---

## 📁 Migration Files Manifest

```
supabase/migrations/
├── 20250416_feature_marketplace.sql (190 lines)
│   ├── Features catalog table
│   ├── Business owner features table
│   ├── Feature categories table
│   ├── Feature templates table
│   ├── Feature requests table
│   ├── 4 RLS policies
│   └── 7 performance indexes
│
└── 20250416_seed_features.sql (120 lines)
    ├── 6 feature categories
    ├── 40 pre-built features
    ├── 5 feature templates
    ├── 8 sample feature requests
    └── Realistic pricing and relevance scores
```

---

## 🔒 Security Notes

### What the Migrations Include
- ✅ Row-Level Security (RLS) policies for multi-tenant isolation
- ✅ Foreign key constraints for referential integrity
- ✅ Proper indexes for performance
- ✅ Audit timestamps on all tables

### What Migrations DON'T Do
- ❌ Don't expose sensitive data (service role key used server-side)
- ❌ Don't allow cross-business access (RLS enforces)
- ❌ Don't create public endpoints (must be called from secure backend)

---

## 📞 Next Steps

After successful deployment:

1. ✅ **Verify migrations** using checklist above
2. ✅ **Update environment variables** if needed
3. ✅ **Test feature marketplace** in React app
4. ✅ **Deploy edge functions** for AI code generation
5. ✅ **Set up CI/CD** for automated deployments

See `FEATURE_MARKETPLACE_COMPLETE_SETUP_REPORT.md` for full setup overview.

---

**Status**: 🟢 Ready to Deploy  
**Last Updated**: 2026-04-16  
**Tested On**: Supabase v2.0+

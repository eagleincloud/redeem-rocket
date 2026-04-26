# Supabase Database Setup - Category-Template-Behavior System

## Quick Start

This directory contains the complete database setup for the category-template-behavior automation platform.

### Project Details
- **Supabase Project ID:** `eomqkeoozxnttqizstzk`
- **Supabase URL:** https://eomqkeoozxnttqizstzk.supabase.co
- **Database:** postgres
- **Port:** 5432

## What's Included

### Database Schema (13 Tables)
- `business_categories` - Master categories (10)
- `business_types` - Category-specific types (56)
- `category_questions` - Dynamic questions (78)
- `templates` - Automation templates (18)
- `template_behaviors` - Behavior configs (54+)
- `business_profiles` - Customer profiles
- `applied_templates` - Applied instances
- `behavior_executions` - Execution logs
- `engagement_metrics` - Daily metrics
- `recommendations` - Smart recommendations
- `template_analytics` - Analytics data
- `audit_logs` - Activity audit trail
- `system_events` - System events

### Database Features
- **40+ indexes** for query performance
- **5 helper functions** for business logic
- **2 analytical views** for dashboards
- **RLS policies** for data security
- **Realtime subscriptions** for updates
- **Audit logging** for compliance

### Test Data
- 3 sample businesses (CloudMetrics AI, StyleVault Boutique, Zen Fitness Studios)
- Applied templates with sample executions
- Engagement metrics and recommendations

## Files

### Migration Files
```
supabase/migrations/
  ├── 20260426_category_template_schema.sql
  │   └── Creates all 13 tables, indexes, functions, RLS, views
  ├── 20260426_seed_reference_data.sql
  │   └── Seeds categories, types, questions, templates, behaviors
  └── 20260426_seed_test_data.sql
      └── Creates 3 test businesses with sample data
```

### Configuration
```
.supabaserc                    # Supabase CLI config
supabase-setup.py             # Python setup script
supabase/data/
  └── business_categories.json # Category definitions
```

### Documentation
```
DATABASE_SETUP_COMPLETE.md    # Detailed verification report
SUPABASE_SETUP_SUMMARY.md     # Execution summary
SUPABASE_README.md            # This file
```

## Setup Instructions

### Option 1: Using Supabase CLI (Recommended)

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to the project
supabase link --project-ref eomqkeoozxnttqizstzk

# Push migrations to remote
supabase db push

# Verify setup
supabase db pull --schema-only
```

### Option 2: Using Python Script

```bash
# Set password environment variable
export SUPABASE_PASSWORD='your-supabase-password'

# Run setup script
python supabase-setup.py

# Output will show verification results
```

### Option 3: Direct PostgreSQL Connection

```bash
# Using psql
psql postgres://postgres:PASSWORD@eomqkeoozxnttqizstzk.supabase.co:5432/postgres

# Apply migrations manually
\i supabase/migrations/20260426_category_template_schema.sql
\i supabase/migrations/20260426_seed_reference_data.sql
\i supabase/migrations/20260426_seed_test_data.sql
```

## Key Database Functions

### Calculate Business Stage
```sql
SELECT public.get_business_stage(profile_id);
-- Returns: 'startup' | 'growth' | 'mature' | 'scaling'
```

### Calculate Engagement Score
```sql
SELECT public.calculate_engagement_score(profile_id);
-- Returns: 0-100 numeric score
```

### Get Top Recommendations
```sql
SELECT * FROM public.get_recommendations(profile_id, 5);
-- Returns: Top 5 template recommendations
```

### Apply Template to Business
```sql
SELECT public.apply_template(profile_id, template_id, '{}'::jsonb);
-- Returns: applied_template_id
```

## Analytics Views

### Template Performance
```sql
SELECT * FROM public.vw_template_performance
WHERE user_satisfaction IS NOT NULL
ORDER BY completion_rate DESC;
```

### Business Health Dashboard
```sql
SELECT * FROM public.vw_business_health
WHERE engagement_score > 75
ORDER BY engagement_score DESC;
```

## Data Categories

### 10 Business Categories
1. Retail & E-Commerce
2. Professional Services
3. Healthcare & Wellness
4. Technology & Software
5. Education & Training
6. Hospitality & Travel
7. Real Estate & Property
8. Manufacturing & Production
9. Transportation & Logistics
10. Finance & Insurance

### 18 Templates (2 per category)
Each template includes:
- Configuration (JSONB)
- Conditions (JSONB)
- Actions (JSONB)
- ~3 behaviors per template
- Example implementations

## RLS Security

### Public Access (No Auth)
- Categories: Read
- Types: Read
- Questions: Read
- Templates: Read
- Behaviors: Read

### User-Protected (Auth Required)
- Business Profiles: Read/Create/Update (own only)
- Applied Templates: Read/Create/Update (own only)
- Behavior Executions: Read (own only)
- Engagement Metrics: Read (own only)
- Recommendations: Read/Update (own only)
- Audit Logs: Read (own only)

## Realtime Subscriptions

Enable realtime updates for:
- `applied_templates` - Track template applications
- `behavior_executions` - Monitor behavior execution
- `engagement_metrics` - Watch engagement changes
- `system_events` - Track system events

Example subscription:
```javascript
const channel = supabase
  .channel('behavior-updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'behavior_executions',
      filter: `applied_template_id=eq.${templateId}`
    },
    (payload) => console.log('Update:', payload)
  )
  .subscribe();
```

## Test Data

### Test Business 1: CloudMetrics AI
```
User ID:  550e8400-e29b-41d4-a716-446655440001
Category: Technology & Software
Type:     SaaS Platform
Stage:    Growth
Metrics:  ARR=$500K, Customers=150, Engagement=85.5/100
```

### Test Business 2: StyleVault Boutique
```
User ID:  550e8400-e29b-41d4-a716-446655440002
Category: Retail & E-Commerce
Type:     Clothing & Apparel
Stage:    Startup
Metrics:  Revenue=$45K/mo, SKUs=450, Engagement=72.0/100
```

### Test Business 3: Zen Fitness Studios
```
User ID:  550e8400-e29b-41d4-a716-446655440003
Category: Healthcare & Wellness
Type:     Fitness & Gym
Stage:    Mature
Metrics:  Members=500, Satisfaction=4.8/5, Engagement=88.0/100
```

## Troubleshooting

### Connection Issues
- Verify Supabase password is correct
- Check network connectivity
- Ensure SSL/TLS enabled (sslmode=require)
- Verify IP whitelist in Supabase console

### RLS Permission Errors
- Check auth.uid() matches user_id
- Verify user is authenticated
- Review RLS policies: SELECT * FROM pg_policies
- Check audit logs for denied operations

### Missing Tables/Functions
- Verify all migrations ran successfully
- Check migration history: SELECT * FROM supabase_migrations_schema.schema_migrations
- Re-run migrations if needed
- Check for SQL syntax errors in logs

### Performance Issues
- Verify all indexes exist: SELECT * FROM pg_stat_user_indexes
- Check query plans: EXPLAIN ANALYZE SELECT...
- Monitor connection count: SELECT count(*) FROM pg_stat_activity
- Review slow query log if available

## Monitoring

### Audit Trail
```sql
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### System Events
```sql
SELECT * FROM system_events
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### Engagement Metrics
```sql
SELECT bp.business_name, em.*
FROM engagement_metrics em
JOIN business_profiles bp ON em.business_profile_id = bp.id
WHERE em.metric_date = CURRENT_DATE
ORDER BY em.engagement_score DESC;
```

## Deployment Checklist

- [ ] Database migrations applied successfully
- [ ] All 13 tables verified to exist
- [ ] RLS policies enabled
- [ ] Test data created
- [ ] Helper functions working
- [ ] Views queryable
- [ ] Realtime subscriptions tested
- [ ] Audit logging functional
- [ ] Performance baseline established

## Support

For issues or questions:
1. Check `DATABASE_SETUP_COMPLETE.md` for detailed verification
2. Review `SUPABASE_SETUP_SUMMARY.md` for execution details
3. Check inline comments in SQL migration files
4. Review Supabase dashboard logs
5. Test with sample data in test businesses

## Maintenance

### Regular Tasks
- Monitor engagement metrics daily
- Review audit logs weekly
- Analyze template performance monthly
- Backup database regularly
- Update statistics: ANALYZE

### Updates
- New templates: INSERT into templates table
- New categories: INSERT into business_categories table
- Schema changes: Create new migration file
- Function updates: ALTER FUNCTION or create new version

## Production Notes

- All user data is protected by RLS policies
- Audit logging tracks all modifications
- Realtime subscriptions enabled for key tables
- Indexes optimized for common queries
- Foreign key constraints enforce data integrity
- Unique constraints prevent duplicates
- Cascade rules manage related data

---

**Status:** Ready for Production ✓  
**Setup Date:** 2026-04-26  
**Project:** eomqkeoozxnttqizstzk  
**Next Step:** Integrate with frontend applications

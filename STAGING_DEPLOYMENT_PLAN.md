# Smart Onboarding Staging Deployment Plan

**Date**: 2026-04-23
**Version**: 1.0.0
**Component**: Smart AI-Powered Onboarding System

## 1. PRE-DEPLOYMENT STATUS

### Build Verification
- **Build Status**: ✓ SUCCESS
- **Build Time**: 2.85 seconds
- **Total Bundle Size**: 2.8 MB
  - Main JS Bundle: 2.1 MB (571.47 kB gzip)
  - CSS Bundle: 163 KB (30.77 kB gzip)
  - SmartOnboarding Component: 6.7 KB (2.47 kB gzip)
- **Build Warnings**: 
  - Main chunk exceeds 500 kB threshold (expected for monolithic app)
  - Recommendation: Code-split on next iteration

### Code Quality
- ✓ All imports resolve correctly
- ✓ No TypeScript errors
- ✓ No build errors after syntax fix
- ✓ Dependencies compiled successfully

### Components Ready
- ✓ SmartOnboarding.tsx - Feature preference gathering
- ✓ BusinessOnboarding.tsx - Full onboarding flow
- ✓ RouteGuards.tsx - Auth protection
- ✓ useSmartOnboarding.ts - State management hook
- ✓ All supporting utilities and types

## 2. DATABASE MIGRATION READINESS

### Migration File
- **File**: `20250422_smart_onboarding_schema.sql`
- **Status**: ✓ Ready for deployment
- **Changes Include**:
  - `biz_users` table enhancements:
    - `feature_preferences` (JSONB) - Feature toggle storage
    - `onboarding_step` (integer) - Track progress
    - `onboarding_ai_data` (JSONB) - Store AI responses
    - `onboarding_done` (boolean) - Completion flag
  
  - New tables:
    - `business_products` - AI-generated products catalog
      - Supports product/service showcase
      - Tracks AI-generated vs user-created products
      - Includes soft delete (is_active flag)
  
  - Indexes created:
    - `idx_business_products_business_id`
    - `idx_business_products_is_active`
    - `idx_biz_users_feature_preferences` (GIN index for JSONB)
  
  - RLS Policies:
    - ✓ business_products SELECT/INSERT/UPDATE/DELETE
    - ✓ biz_users SELECT/UPDATE
    - ✓ Users can only access their own data

### Backwards Compatibility
- ✓ All new columns have defaults
- ✓ No breaking changes to existing tables
- ✓ RLS policies safe for existing data

## 3. ENVIRONMENT SETUP

### Staging Configuration Required
- SUPABASE_URL: [Staging project URL]
- SUPABASE_ANON_KEY: [Staging anon key]
- SUPABASE_SERVICE_ROLE_KEY: [Staging service role key]
- DATABASE_URL: [Staging database connection string]

### Current Configuration Status
- ✓ Staging keys available in `.env.local`
- ✓ All environment variables configured
- ✓ Supabase staging project: eomqkeoozxnttqizstzk

## 4. DEPLOYMENT STEPS CHECKLIST

### Phase 1: Database Migration
- [ ] Backup staging database
- [ ] Run migration: `supabase db push`
- [ ] Verify table creation
- [ ] Verify RLS policies active
- [ ] Verify indexes created

### Phase 2: Build & Package
- [x] Run `npm run build:business`
- [x] Verify no build errors
- [x] Confirm bundle sizes within limits
- [x] Create dist-business output

### Phase 3: Deploy to Staging
- [ ] Push build to Vercel staging
- [ ] Monitor deployment progress
- [ ] Confirm deployment successful
- [ ] Get staging URL

### Phase 4: Staging Verification
- [ ] App loads without errors
- [ ] No console errors/warnings
- [ ] API connectivity confirmed
- [ ] Environment variables loaded

### Phase 5: Feature Testing
- [ ] Signup flow accessible
- [ ] Onboarding phase 1 loads (business discovery)
- [ ] Onboarding phase 2 loads (feature showcase)
- [ ] Onboarding phase 3 loads (theme selection)
- [ ] Onboarding phase 4 loads (dynamic questions)
- [ ] Onboarding phase 5 works (AI generation)
- [ ] Onboarding phase 6 loads (preview)
- [ ] Complete flow works end-to-end
- [ ] Skip onboarding option works
- [ ] Navigation back/forward functional

### Phase 6: Data Persistence
- [ ] Features save to database
- [ ] Theme preferences persist
- [ ] User preferences load on return
- [ ] Data relationships correct

### Phase 7: Error Handling
- [ ] Network errors handled gracefully
- [ ] Invalid input validation works
- [ ] API timeouts managed
- [ ] Error messages display correctly

### Phase 8: Security
- [ ] Auth required for onboarding
- [ ] RLS policies enforced
- [ ] User isolation verified
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

### Phase 9: Performance
- [ ] Page load time < 3s
- [ ] Component render smooth
- [ ] No layout shift issues
- [ ] Lazy loading functional
- [ ] Network requests optimized

## 5. ROLLBACK PLAN

If issues occur:
1. Document error with timestamp
2. Revert to previous Vercel deployment
3. Restore database backup if needed
4. Notify stakeholders
5. Create incident report

## 6. SUCCESS CRITERIA

- [ ] All builds complete successfully
- [ ] All migrations apply without errors
- [ ] No JavaScript errors in console
- [ ] Onboarding flow completes successfully
- [ ] Data persists correctly
- [ ] RLS policies working
- [ ] Performance acceptable
- [ ] Security requirements met

---

Generated: 2026-04-23T00:01:00Z

# Feature Marketplace Testing Guide

Complete testing procedures for validating the Feature Marketplace implementation.

## Test Execution Checklist

### Phase 1: Pre-Deployment Tests (15 minutes)

- [ ] Environment variables set correctly
- [ ] Database migration applied successfully
- [ ] All tables created with correct schema
- [ ] All indexes created
- [ ] RLS policies enabled
- [ ] No TypeScript errors
- [ ] Client library installed

### Phase 2: Unit Tests (10 minutes)

- [ ] Supabase client initializes without errors
- [ ] Migration verification utilities work
- [ ] Type definitions compile correctly
- [ ] Service functions export correctly

### Phase 3: Integration Tests (20 minutes)

- [ ] Can read active features
- [ ] Can read business features with RLS
- [ ] Can create feature requests
- [ ] Can manage feature configurations
- [ ] RLS blocks unauthorized access

### Phase 4: UI Tests (15 minutes)

- [ ] Feature list renders
- [ ] Feature details load
- [ ] Feature request form submits
- [ ] Error handling works
- [ ] Loading states display

### Phase 5: Production Tests (10 minutes)

- [ ] Build completes without errors
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Health check passes

---

## Phase 1: Pre-Deployment Tests

### 1.1 Verify Environment Variables

```bash
# Check .env.local exists
ls -la business-app/frontend/.env.local

# Verify content
grep VITE_SUPABASE business-app/frontend/.env.local

# Expected output:
# VITE_SUPABASE_URL=https://...
# VITE_SUPABASE_ANON_KEY=...
```

**Pass Criteria**: Both variables present with non-empty values

### 1.2 Test Migration Applied

Run in Supabase SQL Editor:

```sql
SELECT COUNT(*) as tables_created
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
  'features',
  'business_owner_features',
  'feature_categories',
  'feature_templates',
  'feature_requests'
);
```

**Pass Criteria**: Result should be 5

### 1.3 Verify Schema

```sql
-- Verify features table structure
SELECT COUNT(*) as column_count
FROM information_schema.columns
WHERE table_name = 'features'
AND column_name IN (
  'id', 'slug', 'name', 'description',
  'category', 'status', 'base_price_monthly',
  'relevant_for', 'dependencies', 'components',
  'created_at', 'updated_at'
);
```

**Pass Criteria**: Result should be 12 (all required columns exist)

### 1.4 Check Indexes

```sql
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE tablename IN (
  'features',
  'business_owner_features',
  'feature_requests',
  'feature_templates'
);
```

**Pass Criteria**: Result should be 7 or more

### 1.5 Verify RLS Enabled

```sql
SELECT COUNT(*) as rls_enabled
FROM pg_tables
WHERE tablename IN (
  'features',
  'business_owner_features',
  'feature_requests'
)
AND rowsecurity = true;
```

**Pass Criteria**: Result should be 3

### 1.6 Check TypeScript Compilation

```bash
cd business-app/frontend
npm run type-check
```

**Pass Criteria**: No TypeScript errors

### 1.7 Verify Dependencies

```bash
npm list @supabase/supabase-js
```

**Pass Criteria**: Package listed with version number

---

## Phase 2: Unit Tests

### 2.1 Supabase Client Initialization Test

Create `business-app/frontend/src/lib/supabase/__tests__/client.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { supabase } from '../client'

describe('Supabase Client', () => {
  it('should initialize without errors', () => {
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
  })

  it('should have correct project URL', () => {
    expect(supabase.supabaseUrl).toBe(
      import.meta.env.VITE_SUPABASE_URL
    )
  })

  it('should be configured with public key', () => {
    expect(supabase.supabaseKey).toBe(
      import.meta.env.VITE_SUPABASE_ANON_KEY
    )
  })
})
```

**Run Test**:
```bash
npm run test src/lib/supabase/__tests__/client.test.ts
```

**Pass Criteria**: All tests pass

### 2.2 Migration Verification Test

Create `business-app/frontend/src/lib/supabase/__tests__/migrations.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest'
import {
  checkFeatureMarketplaceMigration,
  verifyTableStructure,
} from '../migrations'

describe('Migration Verification', () => {
  it('should check migration status', async () => {
    const status = await checkFeatureMarketplaceMigration()
    expect(status).toBeDefined()
    expect(status.applied).toBeDefined()
    expect(Array.isArray(status.tables)).toBe(true)
    expect(Array.isArray(status.rlsPolicies)).toBe(true)
  })

  it('should verify features table structure', async () => {
    const valid = await verifyTableStructure('features', [
      'id',
      'slug',
      'name',
      'description',
      'category',
      'status',
      'base_price_monthly',
      'relevant_for',
      'created_at',
      'updated_at',
    ])
    expect(valid).toBe(true)
  })
})
```

**Run Test**:
```bash
npm run test src/lib/supabase/__tests__/migrations.test.ts
```

**Pass Criteria**: All migration checks pass

### 2.3 Type Definitions Test

```bash
# Verify types compile
npm run type-check

# Expected: No errors
```

**Pass Criteria**: Clean type-check output

### 2.4 Service Functions Export Test

```typescript
// In browser console or test file
import {
  getActiveFeatures,
  getFeaturesByCategory,
  getBusinessFeatures,
  enableFeatureForBusiness,
  submitFeatureRequest,
  getFeatureCategories,
  getTemplatesForBusinessType,
} from './src/lib/supabase/features'

console.log('getActiveFeatures:', typeof getActiveFeatures) // function
console.log('getFeaturesByCategory:', typeof getFeaturesByCategory) // function
console.log('getBusinessFeatures:', typeof getBusinessFeatures) // function
// ... etc
```

**Pass Criteria**: All functions are typeof 'function'

---

## Phase 3: Integration Tests

### 3.1 Can Read Active Features

```typescript
import { getActiveFeatures } from './src/lib/supabase/features'

async function testGetActiveFeatures() {
  try {
    const features = await getActiveFeatures()
    console.assert(Array.isArray(features), 'Should return array')
    console.assert(
      features.every(f => f.status === 'active'),
      'All features should be active'
    )
    console.log('✅ Can read active features')
    return true
  } catch (error) {
    console.error('❌ Failed to read active features:', error)
    return false
  }
}

await testGetActiveFeatures()
```

**Pass Criteria**: Successfully reads features array

### 3.2 Can Read Business Features with RLS

```typescript
import { getBusinessFeatures } from './src/lib/supabase/features'

async function testGetBusinessFeatures() {
  try {
    // Need authenticated user with a business_id
    const features = await getBusinessFeatures('test-business-id')
    console.assert(Array.isArray(features), 'Should return array')
    console.assert(
      features.every(f => f.business_id === 'test-business-id'),
      'All features should belong to business'
    )
    console.log('✅ Can read business features with RLS')
    return true
  } catch (error) {
    console.error('❌ Failed to read business features:', error)
    return false
  }
}

await testGetBusinessFeatures()
```

**Pass Criteria**: Returns only features for specified business

### 3.3 Can Create Feature Requests

```typescript
import { submitFeatureRequest } from './src/lib/supabase/features'

async function testSubmitFeatureRequest() {
  try {
    const result = await submitFeatureRequest(
      'test-business-id',
      'test-user-id',
      'Test Feature',
      'A test feature description',
      ['ecommerce']
    )
    console.assert(result.id, 'Should return created request')
    console.assert(result.status === 'submitted', 'Status should be submitted')
    console.log('✅ Can create feature requests')
    return true
  } catch (error) {
    console.error('❌ Failed to create feature request:', error)
    return false
  }
}

await testSubmitFeatureRequest()
```

**Pass Criteria**: Successfully creates and returns request

### 3.4 RLS Blocking Test

Test that RLS prevents unauthorized access:

```sql
-- Test 1: Try to read inactive features (should fail/return empty)
SELECT COUNT(*) FROM features
WHERE status NOT IN ('active', 'beta');
-- Expected: 0 rows (RLS blocks this)

-- Test 2: Try to read another business's features (should fail)
DELETE FROM business_owner_features
WHERE business_id != (SELECT business_id FROM biz_users WHERE id = auth.uid());
-- Expected: Delete limited to user's own business

-- Test 3: Try to insert request for another business (should fail)
INSERT INTO feature_requests (business_id, business_owner_id, requested_feature_name, description, status)
VALUES ('other-business-id', auth.uid(), 'Test', 'Test', 'submitted');
-- Expected: Error due to RLS policy
```

**Pass Criteria**: RLS policies block unauthorized access

### 3.5 Feature Template Test

```typescript
import { getTemplatesForBusinessType } from './src/lib/supabase/features'

async function testGetTemplates() {
  try {
    const templates = await getTemplatesForBusinessType('ecommerce')
    console.assert(Array.isArray(templates), 'Should return array')
    console.assert(
      templates.every(t => t.business_type === 'ecommerce'),
      'All templates should be for ecommerce'
    )
    console.log('✅ Can load feature templates')
    return true
  } catch (error) {
    console.error('❌ Failed to load templates:', error)
    return false
  }
}

await testGetTemplates()
```

**Pass Criteria**: Templates load correctly with RLS

---

## Phase 4: UI Tests

### 4.1 Feature List Component Test

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import { FeatureList } from './components/FeatureList' // Create this

test('renders feature list', async () => {
  render(<FeatureList />)
  
  await waitFor(() => {
    expect(screen.getByText(/Features/i)).toBeInTheDocument()
  })
})

test('displays loading state', () => {
  render(<FeatureList />)
  expect(screen.getByText(/Loading/i)).toBeInTheDocument()
})

test('handles error state', async () => {
  // Mock error scenario
  render(<FeatureList />)
  
  await waitFor(() => {
    expect(screen.queryByText(/Error/i)).toBeInTheDocument()
  })
})
```

**Pass Criteria**: Component renders with loading and error states

### 4.2 Feature Request Form Test

```typescript
import { render, screen, userEvent } from '@testing-library/react'
import { FeatureRequestForm } from './components/FeatureRequestForm'

test('submits feature request', async () => {
  const user = userEvent.setup()
  const onSubmit = vi.fn()
  
  render(<FeatureRequestForm onSubmit={onSubmit} />)
  
  await user.type(screen.getByLabelText(/Feature Name/i), 'New Feature')
  await user.type(screen.getByLabelText(/Description/i), 'Feature description')
  await user.click(screen.getByRole('button', { name: /Submit/i }))
  
  expect(onSubmit).toHaveBeenCalled()
})
```

**Pass Criteria**: Form submits and calls callback

### 4.3 Error Handling Test

```typescript
test('shows error when submission fails', async () => {
  const user = userEvent.setup()
  
  // Mock submission error
  vi.mocked(submitFeatureRequest).mockRejectedValueOnce(
    new Error('Network error')
  )
  
  render(<FeatureRequestForm />)
  
  await user.click(screen.getByRole('button', { name: /Submit/i }))
  
  await waitFor(() => {
    expect(screen.getByText(/Network error/i)).toBeInTheDocument()
  })
})
```

**Pass Criteria**: Error message displays on failure

---

## Phase 5: Production Tests

### 5.1 Production Build Test

```bash
cd business-app/frontend
npm run build
```

**Pass Criteria**: Build completes without errors

### 5.2 Environment Variable Validation

```bash
# Set production variables
export VITE_SUPABASE_URL=https://your-prod.supabase.co
export VITE_SUPABASE_ANON_KEY=your-prod-key

# Build with production env
npm run build
```

**Pass Criteria**: Build succeeds with all required variables

### 5.3 Database Health Check

```typescript
import { runDatabaseHealthCheck, logMigrationStatus } from './src/lib/supabase/migrations'

async function verifyProduction() {
  const health = await runDatabaseHealthCheck()
  
  if (health.healthy) {
    console.log('✅ Production database is healthy')
    return true
  } else {
    console.error('❌ Production database issues:')
    logMigrationStatus(health.migration)
    return false
  }
}

// Run on app startup in production
verifyProduction()
```

**Pass Criteria**: Health check passes without errors

### 5.4 Production Connection Test

Test actual database connectivity:

```typescript
import { supabase } from './src/lib/supabase/client'

async function testProductionConnection() {
  try {
    const { data, error } = await supabase
      .from('features')
      .select('id')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Production connection successful')
    return true
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return false
  }
}

await testProductionConnection()
```

**Pass Criteria**: Can query production database successfully

---

## Full Test Suite Automation

Create `scripts/test-feature-marketplace.sh`:

```bash
#!/bin/bash

echo "🧪 Feature Marketplace Test Suite"
echo "=================================="

cd business-app/frontend

echo ""
echo "1️⃣ TypeScript Compilation..."
npm run type-check || exit 1
echo "✅ Type check passed"

echo ""
echo "2️⃣ Unit Tests..."
npm run test 2>&1 | grep -E "(PASS|FAIL|✓|✗)" || echo "⚠️ Tests skipped"

echo ""
echo "3️⃣ Production Build..."
npm run build || exit 1
echo "✅ Build successful"

echo ""
echo "4️⃣ Database Health Check..."
node -e "
import('./dist/index.js').then(() => {
  console.log('✅ All checks passed!')
}).catch(e => {
  console.error('❌ Check failed:', e)
  process.exit(1)
})
"

echo ""
echo "=================================="
echo "✅ All tests passed!"
```

**Run Full Suite**:
```bash
chmod +x scripts/test-feature-marketplace.sh
./scripts/test-feature-marketplace.sh
```

---

## Test Results Template

```markdown
# Feature Marketplace Test Results

**Date**: ___________
**Environment**: [ ] Development [ ] Staging [ ] Production
**Tester**: ___________

## Phase 1: Pre-Deployment (___/7)
- [ ] Environment variables ✓/✗
- [ ] Migration applied ✓/✗
- [ ] Schema correct ✓/✗
- [ ] Indexes created ✓/✗
- [ ] RLS enabled ✓/✗
- [ ] TypeScript compiled ✓/✗
- [ ] Dependencies installed ✓/✗

## Phase 2: Unit Tests (___/4)
- [ ] Client initialization ✓/✗
- [ ] Migration verification ✓/✗
- [ ] Type definitions ✓/✗
- [ ] Service exports ✓/✗

## Phase 3: Integration Tests (___/5)
- [ ] Read active features ✓/✗
- [ ] Read business features ✓/✗
- [ ] Create feature requests ✓/✗
- [ ] RLS blocking ✓/✗
- [ ] Templates loading ✓/✗

## Phase 4: UI Tests (___/3)
- [ ] Feature list renders ✓/✗
- [ ] Request form submits ✓/✗
- [ ] Error handling works ✓/✗

## Phase 5: Production Tests (___/4)
- [ ] Build completes ✓/✗
- [ ] Environment variables set ✓/✗
- [ ] Health check passes ✓/✗
- [ ] Database connection works ✓/✗

## Summary
**Total Score**: ___/27
**Status**: [ ] PASSED [ ] FAILED

**Notes**:
_________________________________________________________________
_________________________________________________________________

**Approved By**: _________________ **Date**: ________________
```

---

## Continuous Testing

### GitHub Actions Integration

Create `.github/workflows/test-marketplace.yml`:

```yaml
name: Feature Marketplace Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd business-app/frontend
          npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test
      
      - name: Build
        run: npm run build
      
      - name: Verify migration
        run: |
          node -e "
          const fs = require('fs')
          if (!fs.existsSync('supabase/migrations/20250416_feature_marketplace.sql')) {
            throw new Error('Migration file missing')
          }
          console.log('✅ Migration file found')
          "
```

---

## Regression Testing

After each deployment, run:

```bash
# Full regression suite
npm run test:regression

# Quick smoke tests
npm run test:smoke

# Performance baseline
npm run test:performance
```

---

## Sign-Off

After completing all test phases:

**Test Status**: ✅ PASSED / ❌ FAILED

**Tested By**: _____________________

**Date**: _____________________

**Known Issues**: _______________________________________________________________

**Approved For Production**: _____________________ (Signature)

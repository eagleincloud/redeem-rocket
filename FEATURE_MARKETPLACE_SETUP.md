# Feature Marketplace Setup & Configuration Guide

Complete setup instructions for the Feature Marketplace feature, including Supabase client configuration and environment setup.

## Quick Start (5 Minutes)

### 1. Install Supabase JS Client

```bash
cd business-app/frontend
npm install @supabase/supabase-js
```

### 2. Configure Environment Variables

Create `.env.local` in `business-app/frontend/`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Test Connection

In your app startup code:

```typescript
import { supabase } from './src/lib/supabase/client'

// This will throw if credentials are invalid
console.log('Supabase connected:', supabase.auth)
```

Done! Your app is now connected to Supabase.

## Detailed Setup Guide

### Step 1: Create Supabase Project

1. Visit https://app.supabase.com
2. Click "New Project"
3. Enter project name (e.g., "redeem-rocket-marketplace")
4. Create a strong password
5. Select region closest to your users
6. Click "Create new project"

Wait 2-3 minutes for project creation to complete.

### Step 2: Get Your Credentials

1. Go to Project Dashboard
2. Click **Settings** (gear icon in left sidebar)
3. Click **API** in left sidebar
4. You'll see:
   - **Project URL** (starts with `https://`)
   - **anon public** (64+ character string)
   - **service_role** (keep secret!)

### Step 3: Deploy Database Migration

1. From project dashboard, click **SQL Editor** in left sidebar
2. Click **"New Query"**
3. Copy entire contents of:
   ```
   supabase/migrations/20250416_feature_marketplace.sql
   ```
4. Paste into SQL editor
5. Click **"Run"**
6. Wait for success message

### Step 4: Install Dependencies

```bash
cd business-app/frontend

# Install Supabase client library
npm install @supabase/supabase-js

# Verify installation
npm list @supabase/supabase-js
```

### Step 5: Configure Frontend

Create `business-app/frontend/.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-key-here
VITE_FEATURE_MARKETPLACE_ENABLED=true
```

Replace with your actual credentials from Step 2.

### Step 6: Verify Configuration

Start the dev server:

```bash
npm run dev
```

Check browser console for any errors. You should see no Supabase errors.

### Step 7: Test Features

Run this in browser console:

```javascript
import('./src/lib/supabase/client.js')
  .then(m => {
    console.log('Supabase client loaded:', m.supabase)
  })
  .catch(e => console.error('Failed to load:', e))
```

## File Structure

### Supabase Configuration Files

```
business-app/frontend/
├── .env.example                  # Template environment variables
├── .env.local                    # (Create) Local configuration
├── src/
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts        # Supabase client initialization
│   │       ├── features.ts      # Feature service (CRUD operations)
│   │       └── migrations.ts    # Migration verification utilities
│   └── types/
│       └── index.ts             # Type definitions
```

### Migration Files

```
supabase/migrations/
├── 20250416_feature_marketplace.sql    # Main migration
```

### Documentation

```
├── FEATURE_MARKETPLACE_SETUP.md          # This file
├── FEATURE_MARKETPLACE_DEPLOYMENT.md     # Deployment guide
├── FEATURE_MARKETPLACE_SCHEMA_VERIFICATION.md  # Schema reference
```

## Supabase Client API Reference

### The `supabase` Object

The client provides access to your database:

```typescript
import { supabase } from './src/lib/supabase/client'

// Authentication
supabase.auth.signUp({ email, password })
supabase.auth.signInWithPassword({ email, password })
supabase.auth.signOut()

// Database reads
supabase
  .from('features')
  .select()
  .eq('status', 'active')

// Database writes
supabase
  .from('business_owner_features')
  .insert({ business_id, feature_id })

// Real-time subscriptions
supabase
  .from('feature_requests')
  .on('*', payload => console.log('Change:', payload))
  .subscribe()
```

### Using in React Components

```typescript
import { useState, useEffect } from 'react'
import { supabase } from './src/lib/supabase/client'
import type { Feature } from './src/types'

export function FeatureList() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch active features
    supabase
      .from('features')
      .select()
      .eq('status', 'active')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load features:', error)
          return
        }
        setFeatures(data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <ul>
      {features.map(f => (
        <li key={f.id}>{f.name}</li>
      ))}
    </ul>
  )
}
```

## Feature Service Usage

The `features.ts` file provides convenient functions:

```typescript
import {
  getActiveFeatures,
  getFeaturesByCategory,
  getBusinessFeatures,
  enableFeatureForBusiness,
  submitFeatureRequest,
} from './src/lib/supabase/features'

// Get all active features
const features = await getActiveFeatures()

// Get features by category
const salesFeatures = await getFeaturesByCategory('sales')

// Get features enabled for a specific business
const myFeatures = await getBusinessFeatures('my-business-id')

// Enable a feature for a business
await enableFeatureForBusiness('business-id', 'feature-id')

// Submit a feature request
await submitFeatureRequest(
  'business-id',
  'user-id',
  'Feature Name',
  'Feature Description',
  ['ecommerce', 'services']
)
```

## Environment Variables Reference

### Required Variables

```
VITE_SUPABASE_URL
  - Your Supabase project URL
  - Format: https://[project-id].supabase.co
  - Found in: Supabase Dashboard → Settings → API
  
VITE_SUPABASE_ANON_KEY
  - Public API key for the browser
  - Safe to expose (use this, not service role key)
  - Found in: Supabase Dashboard → Settings → API
```

### Optional Variables

```
VITE_FEATURE_MARKETPLACE_ENABLED
  - Enable/disable feature marketplace UI
  - Default: true
  
VITE_API_URL
  - Backend API endpoint
  - Default: http://localhost:3000
```

## Configuration by Environment

### Local Development

`.env.local`:
```
VITE_SUPABASE_URL=https://your-dev-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-dev-key
VITE_FEATURE_MARKETPLACE_ENABLED=true
```

### Staging

`.env.staging` (optional):
```
VITE_SUPABASE_URL=https://your-staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-key
VITE_FEATURE_MARKETPLACE_ENABLED=true
```

### Production

Set in deployment platform (Vercel, etc):
```
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-key
VITE_FEATURE_MARKETPLACE_ENABLED=true
```

## Troubleshooting

### "Missing Supabase configuration" Error

**Cause**: Environment variables not set correctly

**Fix**:
1. Check `.env.local` exists in `business-app/frontend/`
2. Verify both variables are set
3. Restart dev server
4. Check browser console for exact error

### "Permission denied" when inserting data

**Cause**: RLS policies blocking the operation

**Fix**:
1. Ensure user is authenticated
2. Check RLS policy configuration
3. Verify user owns the business_id
4. Use admin/service role for testing RLS

### Slow load times

**Cause**: Large data sets, missing indexes, or RLS overhead

**Fix**:
1. Add LIMIT to queries
2. Verify indexes exist
3. Use pagination for large tables
4. Optimize RLS policies

### "relation does not exist" error

**Cause**: Migration not applied successfully

**Fix**:
1. Go to Supabase SQL Editor
2. Re-run the migration
3. Check for errors in output
4. Verify tables in Tables view

### CORS errors

**Cause**: Browser blocking Supabase API calls

**Fix**:
1. Check Supabase URL is correct
2. Ensure HTTPS is used
3. Verify project isn't Rate Limited (check in Supabase dashboard)
4. Add custom domain if using subdomain

## TypeScript Types

All types are defined in `src/types/index.ts`:

```typescript
import type {
  Feature,
  FeatureCategory,
  FeatureTemplate,
  FeatureRequest,
  BusinessOwnerFeature,
  BusinessType,
  FeatureStatus,
} from './src/types'
```

## Best Practices

### 1. Always Use Environment Variables

```typescript
// ✅ Good
const url = import.meta.env.VITE_SUPABASE_URL

// ❌ Bad
const url = 'https://my-project.supabase.co'
```

### 2. Handle Errors Gracefully

```typescript
// ✅ Good
const { data, error } = await supabase.from('features').select()
if (error) {
  console.error('Failed to load features:', error.message)
  return []
}

// ❌ Bad
const { data } = await supabase.from('features').select()
// May be null or undefined
```

### 3. Use RLS for Security

```typescript
// ✅ Good - RLS prevents unauthorized access
await supabase
  .from('business_owner_features')
  .select()
  .eq('business_id', userId)

// ❌ Bad - No RLS protection
await supabase.from('business_owner_features').select()
```

### 4. Cache Appropriately

```typescript
// ✅ Good - Cache features (static data)
useQuery(['features'], () => getActiveFeatures(), {
  staleTime: 1000 * 60 * 5, // 5 minutes
})

// ✅ Good - Don't cache user-specific requests
useQuery(['my-features', businessId], () => getBusinessFeatures(businessId), {
  staleTime: 0, // Always fresh
})
```

### 5. Validate Client-Side

```typescript
// ✅ Good - Validate before sending
if (!businessId || !featureId) {
  throw new Error('Missing required parameters')
}
await enableFeatureForBusiness(businessId, featureId)

// ❌ Bad - Let database catch errors
await enableFeatureForBusiness(null, featureId) // Will fail
```

## Performance Tips

### 1. Use Selective Queries

```typescript
// ✅ Good - Only fetch needed columns
await supabase
  .from('features')
  .select('id, name, slug, icon')

// ❌ Bad - Fetch unnecessary data
await supabase
  .from('features')
  .select('*')
```

### 2. Add Pagination

```typescript
// ✅ Good
const page = 0
const pageSize = 20
await supabase
  .from('features')
  .select()
  .range(page * pageSize, (page + 1) * pageSize - 1)

// ❌ Bad - Fetch all rows
await supabase.from('features').select()
```

### 3. Filter Server-Side

```typescript
// ✅ Good - Filter in database
await supabase
  .from('features')
  .select()
  .eq('status', 'active')
  .eq('category', 'sales')

// ❌ Bad - Fetch all, filter in JavaScript
const all = await supabase.from('features').select()
const filtered = all.filter(f => f.status === 'active' && f.category === 'sales')
```

## Next Steps

1. **Complete Setup**: Follow the Quick Start section
2. **Verify Database**: Run queries from `FEATURE_MARKETPLACE_SCHEMA_VERIFICATION.md`
3. **Deploy**: Follow `FEATURE_MARKETPLACE_DEPLOYMENT.md`
4. **Add Seed Data**: Populate with initial features
5. **Build UI**: Create feature marketplace components
6. **Test RLS**: Verify security policies work as expected

## Support & Resources

- [Supabase JS Client Docs](https://supabase.com/docs/reference/javascript)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Project README](./README.md)
- [GitHub Issues](https://github.com/your-repo/issues)

# Admin Business Details API Reference

## Overview
API integration methods used in the AdminBusinessDetailsPage component for Supabase operations.

## Supabase Methods

### 1. Fetch Business Details

```typescript
// Fetch a single business by ID
const { data: businessData, error: businessError } = await supabase
  .from('businesses')
  .select('*')
  .eq('id', businessId)
  .single();

// Returns: Business object or error
```

**Parameters:**
- `businessId` (UUID) - The unique identifier of the business

**Response:**
```typescript
{
  id: UUID,
  name: string,
  owner_id: UUID,
  description?: string,
  address?: string,
  city?: string,
  state?: string,
  postal_code?: string,
  phone?: string,
  email?: string,
  website?: string,
  is_approved?: boolean,
  is_active?: boolean,
  created_at: timestamp,
  updated_at?: timestamp
}
```

### 2. Fetch Owner Information

```typescript
// Fetch owner details by ID
const { data: ownerData } = await supabase
  .from('biz_users')
  .select('id, name, email')
  .eq('id', businessData.owner_id)
  .single();

// Returns: Owner object { id, name, email }
```

**Parameters:**
- `owner_id` (UUID) - The owner's user ID

**Response:**
```typescript
{
  id: UUID,
  name: string,
  email: string
}
```

### 3. Update Business Details

```typescript
// Update business information
const { error } = await supabase
  .from('businesses')
  .update({
    name: string,
    description?: string,
    address?: string,
    city?: string,
    state?: string,
    postal_code?: string,
    phone?: string,
    email?: string,
    website?: string,
    updated_at: new Date().toISOString()
  })
  .eq('id', businessId);

// Returns: { error: null } on success or { error: Error } on failure
```

**Parameters:**
- `businessId` (UUID) - Business to update
- `updates` (object) - Fields to update (all optional)
- `updated_at` (timestamp) - Auto-generated update timestamp

**Success Response:**
```typescript
{ error: null }
```

**Error Response:**
```typescript
{ error: PostgrestError }
```

### 4. Update Approval Status

```typescript
// Toggle approval status
const { error } = await supabase
  .from('businesses')
  .update({ is_approved: newStatus })
  .eq('id', businessId);

// Returns: { error: null } on success or { error: Error } on failure
```

**Parameters:**
- `businessId` (UUID) - Business to update
- `newStatus` (boolean) - true to approve, false to unapprove

**Usage Example:**
```typescript
const toggleApprovalStatus = async () => {
  const newStatus = !business.is_approved;
  const { error } = await supabase
    .from('businesses')
    .update({ is_approved: newStatus })
    .eq('id', businessId);

  if (error) throw error;
  // Update local state
  setBusiness(prev => prev ? { ...prev, is_approved: newStatus } : null);
  toast.success(`Business ${newStatus ? 'approved' : 'unapproved'} successfully`);
};
```

## Error Handling

### Types of Errors

1. **Network Errors**
   - No internet connection
   - Supabase service unavailable
   - Timeout

2. **Database Errors**
   - Business not found
   - Permission denied (RLS policy)
   - Column not found
   - Data validation failed

3. **Authentication Errors**
   - User not authenticated
   - Token expired
   - Insufficient permissions

### Error Handling Pattern

```typescript
try {
  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single();

  if (error) throw error;

  // Process data
  setBusiness(data);
} catch (err) {
  console.error('Failed to load business:', err);
  toast.error('Failed to load business details');
  // Show error UI
}
```

## Supabase RLS Policies

Required Row-Level Security (RLS) policies:

### For `businesses` table

**SELECT Policy** (Admins can read)
```sql
CREATE POLICY "admin_select_businesses" ON businesses
  FOR SELECT
  USING (auth.jwt() -> 'role' = '"admin"');
```

**UPDATE Policy** (Admins can update)
```sql
CREATE POLICY "admin_update_businesses" ON businesses
  FOR UPDATE
  USING (auth.jwt() -> 'role' = '"admin"')
  WITH CHECK (auth.jwt() -> 'role' = '"admin"');
```

### For `biz_users` table

**SELECT Policy** (Admins can read user info)
```sql
CREATE POLICY "admin_select_biz_users" ON biz_users
  FOR SELECT
  USING (auth.jwt() -> 'role' = '"admin"');
```

## Rate Limiting & Optimization

### Current Implementation
- Single business fetch per page load
- Owner fetch triggered after business load
- Sequential API calls (not parallel)
- No pagination or caching

### Optimization Opportunities

**1. Parallel Requests**
```typescript
// Fetch business and owner in parallel
const [businessData, ownerData] = await Promise.all([
  supabase.from('businesses').select('*').eq('id', businessId).single(),
  supabase.from('biz_users').select('id, name, email').eq('id', ownerId).single()
]);
```

**2. Caching Strategy**
```typescript
// Cache business data to avoid repeated requests
const [cachedBusiness, setCachedBusiness] = useState<BusinessDetails | null>(null);

useEffect(() => {
  if (!businessId) return;

  // Check cache first
  if (cachedBusiness?.id === businessId) {
    setBusiness(cachedBusiness);
    return;
  }

  // Fetch from API if not cached
  loadBusiness();
}, [businessId, cachedBusiness]);
```

**3. Real-time Subscriptions**
```typescript
// Subscribe to business updates
const subscription = supabase
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'businesses',
    filter: `id=eq.${businessId}`
  }, (payload) => {
    setBusiness(payload.new as BusinessDetails);
  })
  .subscribe();

return () => {
  supabase.removeChannel(subscription);
};
```

## Data Validation

### Client-Side Validation
```typescript
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  defaultValues: {
    name: business?.name || '',
    // ... other fields
  }
});

// Register field with validation
<Input
  {...register('name', {
    required: 'Business name is required',
    minLength: { value: 2, message: 'Name must be at least 2 characters' }
  })}
/>

// Display error
{errors.name && <p className="text-red-500">{errors.name.message}</p>}
```

### Server-Side Validation (Supabase)
- Column constraints (NOT NULL, UNIQUE, etc.)
- Data type validation
- Custom check constraints

## Common API Patterns

### Pattern 1: Fetch and Display
```typescript
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  })();
}, [id]);
```

### Pattern 2: Update and Sync
```typescript
const onSubmit = async (formData) => {
  try {
    const { error } = await supabase
      .from('table')
      .update(formData)
      .eq('id', id);

    if (error) throw error;

    // Update local state to match database
    setData(prev => prev ? { ...prev, ...formData } : null);

    // Notify user
    toast.success('Updated successfully');
  } catch (err) {
    toast.error('Update failed');
  }
};
```

### Pattern 3: Conditional Update
```typescript
const toggleStatus = async (newStatus: boolean) => {
  try {
    const { error } = await supabase
      .from('table')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) throw error;

    setData(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Status changed to ${newStatus}`);
  } catch (err) {
    toast.error('Failed to update status');
  }
};
```

## Authentication Integration

### Admin Context Access
```typescript
import { useAuthAdmin } from '@/admin/context/AdminContext';

export function AdminBusinessDetailsPage() {
  const { user } = useAuthAdmin();

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
    }
  }, [user, navigate]);

  // user contains: { id, email, name, role, status }
}
```

## Debugging Tips

### Enable Query Logging
```typescript
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Check actual queries in browser DevTools Network tab
```

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `null` response on `.single()` | Record doesn't exist | Check ID validity, add error handling |
| `PGRST301` error | Row-Level Security blocking access | Verify RLS policies, check user role |
| Stale data displayed | Cache not updated | Refetch data after update |
| Form not updating | State not synced with DB | Reset form after successful update |
| Slow page load | Sequential API calls | Use Promise.all for parallel requests |

---

**Last Updated**: 2026-04-06
**Component**: AdminBusinessDetailsPage
**Status**: ✅ Production Ready

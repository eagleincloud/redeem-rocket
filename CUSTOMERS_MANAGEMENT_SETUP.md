# Admin Customers Management Page Setup Guide

## Overview

A complete customers management system has been implemented for your admin panel with full CRUD (Create, Read, Update, Delete) functionality. This guide will walk you through the setup process.

## What's Included

### 📁 Files Created

1. **Data Service** - `src/admin/lib/customersService.ts`
   - Supabase integration for customer data operations
   - Pagination and search support
   - Error handling and type-safe responses

2. **Components**
   - `src/admin/components/CustomerForm.tsx` - Reusable form for add/edit
   - `src/admin/pages/AdminCustomersPage.tsx` - Main management page

3. **Database Migration** - `scripts/migrations/create_customers_table.sql`
   - SQL script to create the customers table
   - Indexes for performance
   - Row-level security policies

4. **Routes** - Updated `src/admin/routes.tsx`
   - New route: `/admin/customers`
   - Automatic navigation setup

## Setup Steps

### Step 1: Create the Database Table

1. Go to your Supabase project dashboard
2. Click on the SQL Editor (left sidebar)
3. Create a new query and run the SQL from:
   ```
   scripts/migrations/create_customers_table.sql
   ```

Alternatively, you can execute it manually via the Supabase dashboard:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_status ON customers(status);
```

### Step 2: Start the Admin App

```bash
npm run dev:admin
```

The admin app will start on `http://localhost:5175`

### Step 3: Login to Admin Panel

- Navigate to `http://localhost:5175/admin/`
- Login with your admin credentials
- **Dev Mode**: If you need to skip login for testing, set `DEV_BYPASS = true` in `src/admin/context/AdminContext.tsx`

### Step 4: Access Customers Page

- From the dashboard, click the **"Manage Customers"** card
- Or navigate directly to `http://localhost:5175/admin/customers`

## Features

### ✅ List Customers
- View all customers with pagination (10 per page)
- Real-time statistics:
  - Total customers
  - Active customers
  - Inactive customers
- Hover effects and responsive design

### 🔍 Search
- Search by:
  - Customer name
  - Email address
  - Phone number
- Instant filtering with pagination reset

### ➕ Add Customers
- Click "Add Customer" button
- Form validation:
  - Name (required, min 2 characters)
  - Email (required, valid format, unique)
  - Phone (required, valid format)
  - Status (active/inactive)
- Success notifications after creation

### ✏️ Edit Customers
- Click the Edit button (pencil icon) on any customer
- Modify any field with validation
- Auto-saved with timestamp
- Error feedback if update fails

### 🗑️ Delete Customers
- Click the Delete button (trash icon)
- Confirmation dialog appears
- Shows customer name for safety
- Cannot be undone - be careful!

## API Reference

### Service Functions (src/admin/lib/customersService.ts)

```typescript
// Fetch customers with pagination and search
fetchCustomers(limit: number, offset: number, searchTerm?: string)
→ { customers: Customer[], total: number, error?: string }

// Get single customer
fetchCustomerById(id: string)
→ { customer: Customer | null, error?: string }

// Create new customer
createCustomer(input: CreateCustomerInput)
→ { customer: Customer | null, error?: string }

// Update existing customer
updateCustomer(id: string, input: UpdateCustomerInput)
→ { customer: Customer | null, error?: string }

// Delete customer
deleteCustomer(id: string)
→ { success: boolean, error?: string }

// Get statistics
getCustomerStats()
→ { total: number, active: number, inactive: number, error?: string }
```

### Types

```typescript
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

interface CreateCustomerInput {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}
```

## Usage Examples

### In Your Components

```typescript
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/admin/lib/customersService';

// Fetch customers
const { customers, total, error } = await fetchCustomers(10, 0, 'search term');

// Create customer
const { customer, error } = await createCustomer({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 9876543210',
  status: 'active'
});

// Update customer
const { customer, error } = await updateCustomer(customerId, {
  status: 'inactive'
});

// Delete customer
const { success, error } = await deleteCustomer(customerId);
```

## File Structure

```
src/admin/
├── lib/
│   └── customersService.ts      # Data service and API functions
├── components/
│   └── CustomerForm.tsx          # Reusable form component
├── pages/
│   └── AdminCustomersPage.tsx    # Main management page
└── routes.tsx                    # Updated with /admin/customers route

scripts/
└── migrations/
    └── create_customers_table.sql # Database migration
```

## Styling & Design

- **Framework**: React 18 + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form with validation
- **Consistency**: Matches existing admin dashboard styling

## Security Considerations

1. **Row-Level Security**: The migration script includes RLS policies
2. **Input Validation**: All forms validate data before submission
3. **Authentication**: Page requires admin login via `useAuthAdmin()` hook
4. **Error Handling**: Proper error messages without exposing sensitive details

## Troubleshooting

### "Supabase not configured" error
- Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
- Ensure Supabase client is initialized correctly

### Table doesn't exist
- Run the migration SQL script in Supabase
- Check Supabase project has the `customers` table

### "Unique constraint violation" on email
- Email must be unique per customer
- Change the email before creating/updating

### Search not working
- Ensure the customer data exists
- Check the search term in the input field
- Make sure the database has data indexed

## Customization

### Add More Fields

1. Update the database schema:
```sql
ALTER TABLE customers ADD COLUMN address TEXT;
```

2. Update the TypeScript types:
```typescript
// In customersService.ts
export interface Customer {
  // ... existing fields
  address?: string;
}
```

3. Update the form component:
```typescript
// In CustomerForm.tsx
<input {...register('address')} placeholder="Address" />
```

### Change Pagination Size

In `AdminCustomersPage.tsx`:
```typescript
const pageSize = 20; // Change from 10
```

### Customize Styling

All components use Tailwind CSS classes that can be modified in the component files.

## Performance Tips

1. **Indexes**: The migration creates indexes on commonly searched fields
2. **Pagination**: Large lists are paginated to reduce load
3. **Search**: Uses Supabase's `.ilike()` for case-insensitive search
4. **Updates**: Only modified fields are sent to the database

## Next Steps

1. ✅ Create the database table
2. ✅ Start the admin app
3. ✅ Test CRUD operations
4. 📊 Add customer data
5. 🔧 Customize fields if needed
6. 📱 Test on different devices
7. 🔒 Review security policies

## Support & Feedback

If you need to:
- Add more fields to customers
- Implement bulk operations
- Add export/import functionality
- Create customer segments or tags
- Add customer activity tracking

Let me know and I can help you extend the system!

## Quick Reference

| Action | URL | Button |
|--------|-----|--------|
| View Customers | `/admin/customers` | Dashboard Card |
| Add Customer | Click "Add Customer" | + Button in header |
| Edit Customer | Click ✏️ icon | Edit button on row |
| Delete Customer | Click 🗑️ icon | Delete button on row |
| Back to Dashboard | Click "Back to Dashboard" | Header link |

---

**Last Updated**: 2026-04-06
**Status**: ✅ Ready for Production

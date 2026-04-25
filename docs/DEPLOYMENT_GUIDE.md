# Finance & Payments Deployment Guide

## Pre-Deployment Checklist

### 1. Supabase Setup
- [ ] Supabase project created
- [ ] Database accessible
- [ ] Service role key available for Edge Functions
- [ ] Webhooks configured (optional, for Stripe events)

### 2. Stripe Setup (if using payments)
- [ ] Stripe account created
- [ ] API keys obtained (publishable and secret)
- [ ] Webhook endpoint configured
- [ ] Payment method types enabled in dashboard
- [ ] Development/Test mode ready

### 3. Code Review
- [ ] All migration files reviewed
- [ ] Edge Function dependencies available
- [ ] API wrapper functions imported in app
- [ ] Environment variables documented

---

## Step 1: Deploy Database Migrations

### Order of Execution
Migrations MUST be deployed in this order due to dependencies:

#### A. Finance Schema (20260424_finance_schema.sql)
```bash
# Via Supabase CLI
supabase db push

# Or manually:
# Copy 20260424_finance_schema.sql contents
# Execute in Supabase SQL Editor
```

**Verification:**
```sql
-- In Supabase SQL Editor, run:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('invoices', 'invoice_items', 'expenses', 'financial_summaries', 'finance_activities');
-- Should return 5 rows
```

#### B. Payments Schema (20260424_payments_schema.sql)
```bash
supabase db push
```

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('stripe_customers', 'payment_methods', 'transactions', 'invoice_payments', 'refunds', 'payment_audit_logs');
-- Should return 6 rows
```

#### C. Inventory Schema (20260424_inventory_schema.sql)
```bash
supabase db push
```

**Verification:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('inventory_items', 'inventory_movements', 'inventory_valuations', 'inventory_audit_logs');
-- Should return 4 rows
```

---

## Step 2: Deploy Edge Functions

### Option A: Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Navigate to project
cd /path/to/project

# Deploy each function
supabase functions deploy get-financial-summary
supabase functions deploy create-invoice-payment
supabase functions deploy calculate-inventory-value

# Verify deployment
supabase functions list
```

### Option B: Manual Deployment

1. Go to Supabase Dashboard → Edge Functions
2. Create new function for each:
   - `get-financial-summary`
   - `create-invoice-payment`
   - `calculate-inventory-value`
3. Copy/paste the TypeScript code from respective files
4. Click "Deploy"

### Set Environment Variables for Edge Functions

In Supabase Dashboard → Settings → Edge Functions:

```
SUPABASE_URL: https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY: your-service-role-key
```

---

## Step 3: Configure Application

### 1. Environment Variables

Create `.env.local`:
```bash
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_SECRET_KEY=sk_test_... (or sk_live_...)
```

### 2. Import API Wrappers

```typescript
// In your app's finance page/component
import {
  getInvoices,
  createInvoice,
  getExpenses,
  getFinancialSummary,
  type Invoice,
  type Expense,
} from '@/app/api/finance';

import {
  createTransaction,
  getTransactions,
  linkInvoicePayment,
} from '@/app/api/payments';
```

### 3. Initialize Stripe (if using payments)

```typescript
import { loadStripe } from '@stripe/js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Use in payment components
const stripe = await stripePromise;
```

---

## Step 4: Test Migrations and Functions

### Test 1: Create Sample Invoice
```typescript
const { data: invoice, error } = await createInvoice('biz-123', {
  invoice_number: 'INV-001',
  issue_date: '2024-04-24',
  due_date: '2024-05-24',
  total_amount: 1000,
  items: [
    {
      description: 'Professional Services',
      quantity: 10,
      unit_price: 100,
      tax_rate: 0,
      amount: 1000,
      order_index: 0,
    }
  ]
});

console.log('Created invoice:', invoice);
```

### Test 2: Create Sample Expense
```typescript
const { data: expense, error } = await createExpense('biz-123', {
  category: 'marketing',
  description: 'Social media ads',
  amount: 500,
  expense_date: '2024-04-24',
});

console.log('Created expense:', expense);
```

### Test 3: Get Financial Summary
```typescript
const { data: summary, error } = await getFinancialSummary('biz-123', 'month');

console.log('Financial Summary:', summary);
// Expected: {
//   period_type: 'month',
//   total_invoiced: 1000,
//   total_expenses: 500,
//   net_income: 500,
//   ...
// }
```

### Test 4: Create Transaction
```typescript
const { data: transaction, error } = await createTransaction('biz-123', {
  amount: 500,
  stripe_id: 'ch_test_123',
  customer_id: 'cust-uuid',
  description: 'Payment for INV-001',
});

console.log('Created transaction:', transaction);
```

### Test 5: Link Payment to Invoice
```typescript
const { ok, newStatus, totalPaid } = await linkInvoicePayment(
  'biz-123',
  'invoice-uuid',
  'transaction-uuid',
  500
);

console.log('Payment linked:', { ok, newStatus, totalPaid });
// Expected newStatus: 'partial' (if not fully paid) or 'paid'
```

---

## Step 5: Set Up Stripe Webhooks (Production)

### Create Webhook Endpoint

1. Stripe Dashboard → Developers → Webhooks
2. Create endpoint:
   - URL: `https://your-domain.com/functions/v1/stripe-webhook`
   - Events:
     - `charge.succeeded`
     - `charge.failed`
     - `charge.refunded`
     - `customer.created`
     - `customer.updated`

3. Copy signing secret
4. Set environment variable:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Example Webhook Handler (in Supabase Edge Function)

```typescript
// supabase/functions/stripe-webhook/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';

Deno.serve(async (req: Request) => {
  const signature = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  // Verify signature
  const event = await verifyWebhookSignature(body, signature);

  if (!event) {
    return new Response('Invalid signature', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  switch (event.type) {
    case 'charge.succeeded':
      await handleChargeSucceeded(event.data.object, supabase);
      break;
    case 'charge.failed':
      await handleChargeFailed(event.data.object, supabase);
      break;
    case 'charge.refunded':
      await handleChargeRefunded(event.data.object, supabase);
      break;
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

---

## Step 6: Data Migration (if migrating from old system)

### For Existing Invoices

```typescript
// Transform old invoice format and bulk insert
const oldInvoices = [...]; // Your existing invoices

const transformed = oldInvoices.map(inv => ({
  business_id: inv.businessId,
  customer_id: inv.customerId,
  invoice_number: inv.number,
  status: inv.status || 'draft',
  issue_date: inv.issuedAt,
  due_date: inv.dueAt,
  total_amount: inv.total,
  paid_amount: inv.amountPaid || 0,
  tax_amount: inv.tax || 0,
  discount_amount: inv.discount || 0,
  currency: inv.currency || 'USD',
  notes: inv.notes,
}));

const { error } = await supabase
  .from('invoices')
  .insert(transformed);
```

### For Existing Customers

```typescript
// Create stripe_customers entries for existing customers
const { data: customers } = await supabase
  .from('customers')
  .select('id, business_id, email, name');

const stripeCustomers = customers.map(cust => ({
  business_id: cust.business_id,
  customer_id: cust.id,
  stripe_customer_id: `cust_migrated_${cust.id}`, // Placeholder
  email: cust.email,
  name: cust.name,
}));

await supabase.from('stripe_customers').insert(stripeCustomers);
```

---

## Step 7: Enable Row-Level Security (RLS)

### For Multi-Tenant Isolation

Update all finance tables to add business-scoped RLS:

```sql
-- For invoices
DROP POLICY IF EXISTS "invoices_business_isolation" ON public.invoices;
CREATE POLICY "invoices_business_isolation" ON public.invoices
  FOR ALL USING (
    -- If you have auth.jwt() ->> 'business_id'
    (auth.jwt() ->> 'business_id')::text = business_id
  );

-- Repeat for: expenses, transactions, invoice_items, etc.
```

**Note:** Current schema has permissive RLS (`FOR ALL USING (true)`). Tighten based on your auth model.

---

## Step 8: Set Up Monitoring and Alerts

### Monitor Edge Function Performance

```sql
-- Check Edge Function logs
SELECT 
  timestamp,
  event_message,
  status_code
FROM edge_function_logs
WHERE function_name IN (
  'get-financial-summary',
  'create-invoice-payment',
  'calculate-inventory-value'
)
ORDER BY timestamp DESC
LIMIT 100;
```

### Monitor Database Performance

```sql
-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE query LIKE '%invoices%'
ORDER BY mean_time DESC;
```

### Set Up Alerts

Supabase Dashboard → Monitoring:
- Database CPU > 80%
- Database connections > 80%
- Edge Function errors > 5%

---

## Step 9: Production Deployment Checklist

### Database
- [ ] Backups enabled and tested
- [ ] RLS policies implemented
- [ ] Indexes created (verify with `\d+ table_name`)
- [ ] Foreign key constraints active
- [ ] Triggers verified

### Edge Functions
- [ ] All functions deployed
- [ ] Secrets configured
- [ ] Error logging active
- [ ] Rate limiting configured (optional)
- [ ] CORS headers correct

### Application
- [ ] Environment variables set correctly
- [ ] API wrappers imported and tested
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Form validation complete

### Stripe Integration (if applicable)
- [ ] Stripe keys correct (not test keys in production)
- [ ] Webhook signature verification working
- [ ] Webhook events logged
- [ ] Refund flow tested
- [ ] Error handling for declined cards

### Security
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] Sensitive data not logged
- [ ] API keys not exposed in frontend

### Documentation
- [ ] Team trained on new system
- [ ] Troubleshooting guide created
- [ ] Runbook for common scenarios
- [ ] Data backup procedures documented

---

## Troubleshooting

### Edge Function Errors

**Problem:** Function returns 500 error
**Solution:**
1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set
3. Test locally with correct Supabase credentials
4. Check JSON request format matches specification

### RLS Policy Blocking Queries

**Problem:** "row level security policy prevent this operation"
**Symptom:** Queries work in SQL Editor but fail in app
**Solution:**
1. Check current user's business_id matches query filter
2. Verify RLS policy references correct auth context
3. Test with `set role authenticated` in SQL Editor

### Invoice Status Not Updating

**Problem:** Invoice status stays 'draft' after payment
**Solution:**
1. Verify trigger `trigger_update_status_on_payment` exists
2. Check `paid_amount` is being updated
3. Query `pg_stat_user_triggers` to see if trigger is firing

### Financial Summary Not Calculating

**Problem:** Summary returns zeros or stale data
**Solution:**
1. Verify invoice records exist with correct business_id
2. Check trigger `trigger_update_summary_on_invoice` is active
3. Run calculation manually:
   ```sql
   SELECT * FROM public.get_financial_summary('biz-123');
   ```

### Stripe Payment Not Linking

**Problem:** Transaction created but invoice not updated
**Solution:**
1. Verify transaction ID and invoice ID are valid
2. Check invoice `paid_amount` field constraints
3. Verify Edge Function response includes `ok: true`
4. Check `invoice_payments` table has the record

---

## Performance Tuning

### For High-Volume Invoicing

```sql
-- Add partial index on paid invoices (rarely queried)
CREATE INDEX idx_invoices_paid 
ON public.invoices (business_id) 
WHERE status = 'paid';

-- Add partial index on recent invoices
CREATE INDEX idx_invoices_recent 
ON public.invoices (business_id, issue_date DESC) 
WHERE issue_date >= CURRENT_DATE - interval '90 days';
```

### For Large Inventory

```sql
-- Partition inventory movements by month
ALTER TABLE public.inventory_movements
  PARTITION BY RANGE (DATE_TRUNC('month', created_at));

-- Add materialized view for valuation cache
CREATE MATERIALIZED VIEW inventory_value_cache AS
SELECT 
  business_id,
  CURRENT_DATE as valuation_date,
  COUNT(*) as total_items,
  SUM(quantity_on_hand) as total_quantity,
  SUM(quantity_on_hand * unit_cost) as total_cost_value,
  SUM(quantity_on_hand * selling_price) as total_retail_value
FROM inventory_items
WHERE is_active = true
GROUP BY business_id;

-- Refresh periodically
REFRESH MATERIALIZED VIEW inventory_value_cache;
```

---

## Rollback Plan

### If Issues Encountered

1. **Database Issues:**
   ```bash
   # Create restore point before major changes
   supabase db backup create
   
   # Restore if needed
   supabase db restore [backup-id]
   ```

2. **Edge Function Issues:**
   - Redeploy previous version
   - Or temporarily disable webhook while fixing

3. **RLS Issues:**
   - Temporarily set policies to `USING (true)`
   - Fix auth context issues
   - Re-enable restrictive policies

---

## Next Steps

1. Test all functionality in staging environment first
2. Load test with production-like data volume
3. Security audit of RLS and API endpoints
4. User acceptance testing with stakeholders
5. Schedule maintenance window for production deployment
6. Have database restore plan ready
7. Monitor closely for first 24-48 hours post-deployment

# Finance & Payments Module - Complete Index

## Overview

This documentation covers the complete Finance and Payment modules for the Redeem Rocket business application, including database schemas, API wrappers, Edge Functions, and deployment guides.

## Quick Navigation

### Database Migrations (Ready to Deploy)
1. **20260424_finance_schema.sql** - Core finance tables
   - invoices
   - invoice_items
   - expenses
   - financial_summaries
   - finance_activities (audit log)

2. **20260424_payments_schema.sql** - Payment processing
   - stripe_customers
   - payment_methods
   - transactions
   - invoice_payments
   - refunds
   - payment_audit_logs

3. **20260424_inventory_schema.sql** - Inventory management
   - inventory_items
   - inventory_movements
   - inventory_valuations
   - inventory_audit_logs

### Edge Functions (Ready to Deploy)
1. **get-financial-summary** - Calculate financial metrics
   - Location: `supabase/functions/get-financial-summary/index.ts`
   - Calculates revenue, expenses, net income for any period
   - Returns payment collection rate and outstanding amounts

2. **create-invoice-payment** - Link payments to invoices
   - Location: `supabase/functions/create-invoice-payment/index.ts`
   - Updates invoice status automatically
   - Ensures payment amount doesn't exceed remaining balance

3. **calculate-inventory-value** - Compute stock valuations
   - Location: `supabase/functions/calculate-inventory-value/index.ts`
   - Calculates total inventory value at cost and retail
   - Stores valuation for historical tracking

### API Wrapper Functions (Ready to Import)
1. **src/app/api/finance.ts** - Finance operations
   - Invoice CRUD operations
   - Expense tracking
   - Financial summary queries
   - Functions: getInvoices, createInvoice, getExpenses, createExpense, getFinancialSummary, etc.

2. **src/app/api/payments.ts** - Payment operations
   - Transaction management
   - Stripe customer mapping
   - Payment method storage
   - Refund processing
   - Functions: createTransaction, getTransactions, linkInvoicePayment, etc.

## Documentation Files

### 1. FINANCE_PAYMENTS_SCHEMA.md
**Comprehensive database design documentation**
- Complete table schemas with all fields
- Index strategies for performance
- Row-level security (RLS) policies
- Database triggers and functions
- Data relationships and constraints
- Example queries for common operations
- Performance considerations

### 2. DEPLOYMENT_GUIDE.md
**Step-by-step deployment instructions**
- Pre-deployment checklist
- Migration deployment order
- Edge Function deployment (CLI and manual)
- Environment variable configuration
- Testing procedures for each component
- Stripe webhook setup
- Data migration examples
- RLS policy configuration
- Monitoring and alerting
- Troubleshooting guide
- Performance tuning recommendations
- Rollback procedures

### 3. IMPLEMENTATION_EXAMPLES.md
**Real-world code examples**
- Create invoices with line items
- Generate financial summaries
- Track business expenses
- Process Stripe payments
- Manage customer payment methods
- Handle refunds
- Track inventory movements
- Build financial dashboards
- Send invoice reminders
- Analyze revenue trends
- Error handling patterns
- React component examples

## File Structure

```
App Creation Request-2/
├── .claude/worktrees/jolly-herschel/
│   ├── supabase/
│   │   ├── migrations/
│   │   │   ├── 20260424_finance_schema.sql
│   │   │   ├── 20260424_payments_schema.sql
│   │   │   └── 20260424_inventory_schema.sql
│   │   └── functions/
│   │       ├── get-financial-summary/
│   │       │   └── index.ts
│   │       ├── create-invoice-payment/
│   │       │   └── index.ts
│   │       └── calculate-inventory-value/
│   │           └── index.ts
│   ├── src/app/api/
│   │   ├── finance.ts
│   │   └── payments.ts
│   └── docs/
│       ├── FINANCE_PAYMENTS_INDEX.md (this file)
│       ├── FINANCE_PAYMENTS_SCHEMA.md
│       ├── DEPLOYMENT_GUIDE.md
│       └── IMPLEMENTATION_EXAMPLES.md
```

## Core Features

### Finance Module
- **Invoice Management**
  - Create invoices with automatic numbering
  - Line item support with tax and discount
  - Status tracking (draft → sent → paid/overdue)
  - Payment tracking and collection monitoring
  - Customizable terms and notes

- **Expense Tracking**
  - Categorized expense recording
  - Receipt attachment support
  - Approval workflow with audit trail
  - Status tracking (draft → recorded → reimbursed)

- **Financial Reporting**
  - Period-based summaries (monthly, quarterly, yearly)
  - Revenue and expense aggregation
  - Net income calculation
  - Outstanding invoice tracking
  - Payment collection rate metrics
  - Automatic summary updates on invoice changes

### Payments Module
- **Stripe Integration**
  - Customer record mapping
  - Multiple payment method storage
  - Transaction tracking with full audit log
  - Status synchronization with Stripe

- **Payment Processing**
  - Create and track payment transactions
  - Link payments to specific invoices
  - Automatic invoice status updates on payment
  - Partial payment support

- **Refund Management**
  - Create refund records
  - Track refund status
  - Automatic transaction status updates
  - Reason tracking for compliance

### Inventory Module
- **Stock Management**
  - SKU-based product tracking
  - Real-time quantity monitoring
  - Reorder level alerts
  - Multi-warehouse location support

- **Movement Tracking**
  - Record all stock movements (purchase, sale, loss, adjustment, return)
  - Cost tracking at time of movement
  - FIFO/LIFO/Weighted average support
  - Full audit trail of all changes

- **Valuation**
  - Period snapshots of total inventory value
  - Margin calculation (retail vs. cost)
  - Low stock item identification
  - Historical value tracking

## Database Design Highlights

### Multi-Tenant Architecture
- All tables include `business_id` field for isolation
- Indexes on business_id for fast queries
- Ready for RLS policy implementation

### Automatic Status Updates
- Invoices auto-update to 'paid' when fully paid
- Invoices auto-update to 'overdue' based on date
- Transactions auto-update to 'refunded' when fully refunded
- All via PostgreSQL triggers (reliable and performant)

### Audit Trails
- Finance activities log all invoice/expense changes
- Payment audit logs track all transaction events
- Inventory audit logs record all stock movements
- Old and new values stored for change tracking

### Performance Optimization
- Strategic indexes on common query patterns
- Materialized views support for complex aggregations
- Trigger-based calculations instead of application logic
- Partial indexes for active/non-cancelled records

## Quick Start

### 1. Deploy Infrastructure
```bash
# Deploy migrations (in order)
supabase db push  # Runs all .sql files in migrations/

# Deploy Edge Functions
supabase functions deploy get-financial-summary
supabase functions deploy create-invoice-payment
supabase functions deploy calculate-inventory-value
```

### 2. Configure Application
```typescript
// Import API wrappers
import {
  getInvoices,
  createInvoice,
  getFinancialSummary,
} from '@/app/api/finance';

import {
  createTransaction,
  linkInvoicePayment,
} from '@/app/api/payments';

// Use in components
const { data: invoices } = await getInvoices(businessId);
const { data: summary } = await getFinancialSummary(businessId, 'month');
```

### 3. Test Core Flows
- Create a test invoice with line items
- Record a test expense
- Generate a financial summary
- Create a test transaction
- Link transaction to invoice

## Key Tables & Relationships

```
FINANCE:
├── invoices (main transaction record)
│   ├── customer_id → customers
│   └── invoice_items (line items)
│
├── expenses (operating costs)
│   ├── business_id (multi-tenant)
│   ├── approved_by → business_team_members
│   └── created_by → business_team_members
│
└── financial_summaries (aggregated data)
    └── business_id (multi-tenant)

PAYMENTS:
├── stripe_customers (Stripe mapping)
│   └── customer_id → customers
│
├── payment_methods (saved cards)
│   └── stripe_customer_id → stripe_customers
│
├── transactions (payment records)
│   ├── customer_id → customers
│   └── stripe_customer_id → stripe_customers
│
├── invoice_payments (many-to-many)
│   ├── invoice_id → invoices
│   └── transaction_id → transactions
│
└── refunds (refund records)
    └── transaction_id → transactions

INVENTORY:
├── inventory_items (product definitions)
│   └── supplier_id → customers (suppliers)
│
├── inventory_movements (stock changes)
│   └── inventory_item_id → inventory_items
│
└── inventory_valuations (snapshots)
    └── business_id (multi-tenant)
```

## Common Use Cases

### 1. Generate Monthly P&L Statement
```typescript
const summary = await getFinancialSummary(businessId, 'month');
// Returns: revenue, expenses, net income, invoice count, payment rate
```

### 2. Track Overdue Invoices
```typescript
const invoices = await getInvoices(businessId, { status: 'overdue' });
// Filter and send reminders
```

### 3. Record Customer Payment
```typescript
// 1. Create transaction
const transaction = await createTransaction(businessId, {
  stripe_id: 'ch_123',
  amount: 500,
  customer_id: cust_uuid,
});

// 2. Link to invoice
const result = await linkInvoicePayment(
  businessId,
  invoice_uuid,
  transaction.id,
  500
);
// Invoice automatically updates to 'partial' or 'paid'
```

### 4. Manage Inventory
```typescript
// Record a sale
await supabase.from('inventory_movements').insert({
  inventory_item_id: item_uuid,
  movement_type: 'sale',
  quantity: -5,  // Negative for sales
  reference_id: invoice_uuid,
});
// Quantity automatically updated via trigger

// Get inventory value
const valuation = await calculateInventoryValue(businessId);
```

### 5. Expense Approval Workflow
```typescript
// Create expense (draft)
const expense = await createExpense(businessId, {
  category: 'supplies',
  amount: 250,
  // status defaults to 'recorded'
});

// Approve expense
await updateExpense(expense.id, {
  status: 'reimbursed',
  approved_by: member_uuid,
  approved_at: new Date().toISOString(),
});
```

## Performance Notes

### Query Performance
- All tables indexed on business_id (primary filter)
- Composite indexes on common filter combinations
- Partial indexes for active records only

### Calculation Performance
- Financial summaries pre-calculated and cached
- Triggers update summaries automatically
- Inventory valuations stored periodically
- No complex calculations in application code

### Scaling Considerations
- Schema supports millions of records per business
- Indexes designed for common query patterns
- Partitioning strategy included (see DEPLOYMENT_GUIDE.md)
- Caching recommendations for high-traffic scenarios

## Security Considerations

### Row-Level Security (RLS)
- Schema includes basic RLS (FOR ALL USING true)
- Implementation guide for business-scoped RLS in DEPLOYMENT_GUIDE.md
- Multi-tenant isolation ready

### Data Protection
- All monetary amounts stored as numeric type (no floating point)
- Audit trails on all financial operations
- Immutable transaction records
- Soft deletes via status field (no hard deletes)

### API Security
- Edge Functions validate all inputs
- Amount validation (no negative payments)
- Invoice amount validation (payment ≤ balance)
- Service role key required (never expose)

## Next Steps

1. **Review** FINANCE_PAYMENTS_SCHEMA.md for detailed schema understanding
2. **Follow** DEPLOYMENT_GUIDE.md for step-by-step deployment
3. **Reference** IMPLEMENTATION_EXAMPLES.md for code patterns
4. **Deploy** migrations in Supabase
5. **Configure** environment variables
6. **Import** API wrappers in your application
7. **Integrate** with Stripe for payment processing
8. **Test** all core workflows before production

## Support & Troubleshooting

See DEPLOYMENT_GUIDE.md section "Troubleshooting" for:
- Common Edge Function errors and solutions
- RLS policy issues and debugging
- Status update problems
- Payment linking failures
- Financial summary calculation issues

## Version Information

- Created: April 24, 2026
- Supabase SDK: @supabase/supabase-js@2
- Stripe: Latest API version
- PostgreSQL: 13+ compatible
- Deno (Edge Functions): Latest compatible version

## Changelog

### Initial Release (2026-04-24)
- Complete Finance schema with invoices, expenses, summaries
- Complete Payments schema with Stripe integration
- Complete Inventory schema with valuation
- 3 Edge Functions for reporting and payment processing
- 2 API wrapper modules (finance.ts, payments.ts)
- Comprehensive documentation and examples
- Deployment guides and troubleshooting

---

**Last Updated:** April 24, 2026  
**Status:** Ready for Staging/Production Deployment  
**Requires:** Supabase project, Stripe account (for payments)

For questions or issues, refer to the detailed documentation files or consult the DEPLOYMENT_GUIDE.md troubleshooting section.

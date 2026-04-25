# Finance and Payments Module - Database Schema Documentation

## Overview

The Finance and Payments modules provide comprehensive business financial management including invoicing, expense tracking, payment processing via Stripe, and inventory valuation.

## Schema Architecture

### Finance Module Tables

#### 1. **invoices** - Main invoice records
- **id** (uuid): Primary key
- **business_id** (text): Business identifier (multi-tenant)
- **customer_id** (uuid): Reference to customers table
- **invoice_number** (text): Unique invoice number per business
- **status** (text): draft | sent | viewed | partial | paid | overdue | cancelled
- **issue_date** (date): Date invoice was created
- **due_date** (date): Payment due date
- **total_amount** (numeric): Total invoice amount
- **paid_amount** (numeric): Amount paid (auto-synced from invoice_payments)
- **tax_amount** (numeric): Tax portion of invoice
- **discount_amount** (numeric): Discount applied
- **currency** (text): Currency code (default: USD)
- **notes** (text): Internal notes
- **last_sent_at** (timestamptz): Last time invoice was sent to customer
- **viewed_at** (timestamptz): When customer viewed the invoice
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id (multi-tenant queries)
- business_id + status (status filtering)
- business_id + due_date (overdue reporting)
- customer_id (customer history)

**Constraints:**
- UNIQUE(business_id, invoice_number)
- CHECK paid_amount <= total_amount
- Automatic status updates via triggers (partial, paid, overdue)

**Triggers:**
- `invoices_set_updated_at` - Updates timestamp on modification
- `trigger_update_summary_on_invoice` - Recalculates financial_summaries
- `trigger_update_status_on_payment` - Updates status based on paid_amount

#### 2. **invoice_items** - Line items within invoices
- **id** (uuid): Primary key
- **invoice_id** (uuid): References invoices
- **description** (text): Item description
- **quantity** (numeric): Item quantity
- **unit_price** (numeric): Price per unit
- **tax_rate** (numeric): Tax percentage
- **amount** (numeric): Total line item amount (quantity × unit_price)
- **order_index** (integer): Position in invoice
- **created_at** (timestamptz)

**Constraints:**
- No standalone table RLS (accessed through invoices)
- Deleted when parent invoice is deleted (CASCADE)

#### 3. **expenses** - Business expense records
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant identifier
- **category** (text): salary | rent | utilities | marketing | supplies | equipment | software | travel | meals | insurance | taxes | other
- **description** (text): Expense description
- **amount** (numeric): Expense amount
- **currency** (text): Currency code
- **status** (text): draft | recorded | reimbursed | cancelled
- **expense_date** (date): When expense occurred
- **payment_method** (text): cash | card | bank_transfer | check | other
- **receipt_url** (text): URL to receipt document
- **notes** (text): Additional notes
- **approved_by** (uuid): Team member who approved
- **approved_at** (timestamptz): Approval timestamp
- **created_by** (uuid): User who created expense
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- business_id + category (category reporting)
- business_id + expense_date (date range queries)
- business_id + status

#### 4. **financial_summaries** - Aggregated financial data
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant identifier
- **period_start**, **period_end** (date): Period boundaries
- **period_type** (text): month | quarter | year
- **total_revenue** (numeric): Total revenue (not always invoiced)
- **total_expenses** (numeric): Sum of all expenses
- **total_invoiced** (numeric): Sum of all invoices
- **total_paid** (numeric): Sum of all payments received
- **net_income** (numeric): total_invoiced - total_expenses
- **invoice_count** (integer): Number of invoices in period
- **expense_count** (integer): Number of expenses in period
- **outstanding_amount** (numeric): Invoices not yet paid
- **last_calculated_at** (timestamptz): When summary was calculated
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- business_id + period_start + period_end

**Triggers:**
- `trigger_update_summary_on_invoice` - Auto-recalculates when invoices change

#### 5. **finance_activities** - Audit log for finance operations
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **entity_type** (text): invoice | expense | payment
- **entity_id** (uuid): ID of the changed entity
- **action** (text): created | updated | sent | viewed | paid | cancelled | approved
- **old_values** (jsonb): Previous state
- **new_values** (jsonb): New state
- **performed_by** (uuid): User who performed action
- **notes** (text): Additional context
- **created_at** (timestamptz)

---

### Payments Module Tables

#### 1. **stripe_customers** - Maps business customers to Stripe
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **customer_id** (uuid): Reference to customers table
- **stripe_customer_id** (text): Stripe's customer identifier
- **email** (text): Customer email
- **name** (text): Customer name
- **metadata** (jsonb): Custom Stripe metadata
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- stripe_customer_id (Stripe webhook lookups)

**Constraints:**
- UNIQUE(business_id, stripe_customer_id)
- UNIQUE(business_id, customer_id)

#### 2. **payment_methods** - Saved customer payment methods
- **id** (uuid): Primary key
- **stripe_customer_id** (text): References stripe_customers
- **stripe_payment_method_id** (text): Stripe's payment method ID
- **type** (text): card | bank_account | wallet
- **card_brand** (text): visa, mastercard, amex, etc.
- **card_last_four** (text): Last 4 digits of card
- **card_exp_month**, **card_exp_year** (integer): Expiration
- **bank_account_last_four** (text): For bank transfers
- **bank_account_holder_name** (text): Account holder name
- **is_default** (boolean): Whether this is the default method
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- stripe_customer_id
- stripe_customer_id WHERE is_default = true

#### 3. **transactions** - Stripe payment transactions
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **stripe_id** (text): Stripe charge ID (UNIQUE)
- **stripe_charge_id** (text): Stripe charge reference
- **stripe_payment_intent_id** (text): Stripe payment intent
- **amount** (numeric): Transaction amount
- **currency** (text): Currency code
- **status** (text): pending | succeeded | failed | cancelled | refunded | disputed
- **payment_method_type** (text): card | bank_account | wallet | manual
- **customer_id** (uuid): Reference to customers
- **stripe_customer_id** (text): Reference to stripe_customers
- **description** (text): Transaction description
- **statement_descriptor** (text): What appears on statement
- **receipt_email** (text): Email to send receipt
- **receipt_url** (text): Stripe receipt URL
- **metadata** (jsonb): Custom metadata
- **error_code** (text): Stripe error code if failed
- **error_message** (text): Error description
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- business_id + status
- stripe_id
- customer_id
- created_at DESC

**Triggers:**
- `trigger_update_transaction_on_refund` - Updates status when fully refunded

#### 4. **invoice_payments** - Links invoices to transactions
- **id** (uuid): Primary key
- **invoice_id** (uuid): References invoices (CASCADE delete)
- **transaction_id** (uuid): References transactions (CASCADE delete)
- **amount** (numeric): Amount applied to invoice
- **notes** (text): Payment notes
- **applied_at** (timestamptz): When payment was applied
- **created_at** (timestamptz)

**Indexes:**
- invoice_id
- transaction_id

**Constraints:**
- UNIQUE(invoice_id, transaction_id)
- CHECK amount > 0

**Triggers:**
- `trigger_sync_invoice_payment` - Updates invoice.paid_amount when created/deleted

#### 5. **refunds** - Refund records for transactions
- **id** (uuid): Primary key
- **transaction_id** (uuid): References transactions
- **stripe_refund_id** (text): Stripe refund ID (UNIQUE)
- **amount** (numeric): Refund amount
- **currency** (text): Currency code
- **status** (text): pending | succeeded | failed | cancelled
- **reason** (text): duplicate | fraudulent | requested_by_customer | expired_uncaptured_charge | other
- **metadata** (jsonb): Custom data
- **notes** (text): Refund notes
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- transaction_id
- status
- stripe_refund_id

#### 6. **payment_audit_logs** - Audit trail for payments
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **entity_type** (text): transaction | refund | payment_method
- **entity_id** (uuid): ID of entity
- **stripe_id** (text): Stripe identifier if applicable
- **action** (text): created | updated | succeeded | failed
- **status** (text): Current status
- **amount** (numeric): Transaction/refund amount
- **details** (jsonb): Additional details
- **created_at** (timestamptz)

**Indexes:**
- business_id
- entity_type + entity_id

---

### Inventory Module Tables

#### 1. **inventory_items** - Product inventory tracking
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **sku** (text): Stock keeping unit (UNIQUE per business)
- **name** (text): Product name
- **description** (text): Product description
- **category** (text): Product category
- **quantity_on_hand** (numeric): Current stock quantity
- **reorder_level** (numeric): Minimum stock level
- **unit_cost** (numeric): Cost per unit
- **selling_price** (numeric): Retail price
- **unit** (text): unit | pack | box | etc.
- **supplier_id** (uuid): References customers (suppliers)
- **location** (text): Warehouse location
- **is_active** (boolean): Whether item is active
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- sku
- business_id + category
- business_id WHERE quantity_on_hand <= reorder_level (low stock alerts)

**Triggers:**
- `trigger_update_inventory_quantity` - Updates quantity on movement inserts

#### 2. **inventory_movements** - Stock movement records
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **inventory_item_id** (uuid): References inventory_items
- **movement_type** (text): purchase | sale | adjustment | loss | return | transfer | opening
- **quantity** (numeric): Quantity moved (can be negative)
- **unit_cost** (numeric): Cost of the unit at time of movement
- **reference_type** (text): invoice | expense | order | manual
- **reference_id** (uuid): Reference to source document
- **notes** (text): Movement notes
- **created_by** (uuid): User who created movement
- **created_at** (timestamptz)

**Indexes:**
- business_id
- inventory_item_id
- business_id + movement_type

#### 3. **inventory_valuations** - Periodic inventory valuations
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **valuation_date** (date): Date of valuation
- **total_items** (integer): Number of active items
- **total_quantity** (numeric): Total units in stock
- **total_cost_value** (numeric): Total value at cost
- **total_retail_value** (numeric): Total value at retail
- **valuation_method** (text): fifo | lifo | weighted_average
- **created_at**, **updated_at** (timestamptz)

**Indexes:**
- business_id
- business_id + valuation_date DESC

**Constraints:**
- UNIQUE(business_id, valuation_date)

#### 4. **inventory_audit_logs** - Inventory change audit trail
- **id** (uuid): Primary key
- **business_id** (text): Multi-tenant
- **item_id** (uuid): References inventory_items
- **action** (text): Inventory action
- **old_quantity** (numeric): Previous quantity
- **new_quantity** (numeric): Updated quantity
- **performed_by** (uuid): User who made change
- **notes** (text): Additional notes
- **created_at** (timestamptz)

**Indexes:**
- business_id
- item_id

---

## Row-Level Security (RLS) Policies

All tables have basic RLS enabled allowing cross-business queries (for dashboard/admin purposes). In production, implement business-scoped RLS:

```sql
-- Example: Restrict invoices to business_id
CREATE POLICY "invoices_business_isolation" ON public.invoices
  FOR ALL USING (auth.jwt() ->> 'business_id' = business_id);
```

---

## Database Functions

### Finance Functions

#### `update_financial_summary_on_invoice_change()`
- **Trigger:** AFTER INSERT/UPDATE on invoices
- **Purpose:** Recalculates financial_summaries for the invoice's month
- **Calculation:** Sums invoiced amounts, paid amounts, and counts for the period

#### `update_invoice_status_on_payment()`
- **Trigger:** BEFORE UPDATE on invoices
- **Purpose:** Auto-updates invoice status based on paid_amount
- **Logic:**
  - If paid_amount >= total_amount → status = 'paid'
  - If paid_amount > 0 → status = 'partial'
  - If date > due_date and unpaid → status = 'overdue'

### Inventory Functions

#### `calculate_inventory_total_value(p_business_id text)`
- **Type:** Utility function
- **Returns:** total_cost_value, total_retail_value, total_items, total_quantity
- **Usage:** Call via Edge Function or directly from app
- **Calculation:** Multiplies quantity_on_hand by unit_cost/selling_price for all active items

#### `get_low_stock_items(p_business_id text)`
- **Type:** Utility function
- **Returns:** Items where quantity_on_hand <= reorder_level
- **Usage:** For low stock alerts and reorder recommendations

### Payment Functions

#### `sync_invoice_paid_amount()`
- **Trigger:** AFTER INSERT/UPDATE/DELETE on invoice_payments
- **Purpose:** Keeps invoice.paid_amount in sync with sum of invoice_payments.amount
- **Side Effect:** Triggers status update via `update_invoice_status_on_payment()`

#### `update_transaction_on_refund()`
- **Trigger:** AFTER UPDATE on refunds (when status = 'succeeded')
- **Purpose:** Updates transaction status to 'refunded' if all amount is refunded

---

## Edge Functions

### 1. get-financial-summary
**Endpoint:** POST `/functions/v1/get-financial-summary`

**Request:**
```json
{
  "businessId": "string",
  "period": "month|quarter|year",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)"
}
```

**Response:**
```json
{
  "ok": true,
  "summary": {
    "period_type": "month",
    "period_start": "2024-04-01",
    "period_end": "2024-04-30",
    "total_invoiced": 15000.00,
    "total_paid": 10000.00,
    "total_expenses": 5000.00,
    "net_income": 10000.00,
    "invoice_count": 12,
    "expense_count": 8,
    "outstanding_amount": 5000.00,
    "payment_rate": 66.67
  }
}
```

### 2. create-invoice-payment
**Endpoint:** POST `/functions/v1/create-invoice-payment`

**Request:**
```json
{
  "businessId": "string",
  "invoiceId": "uuid",
  "transactionId": "uuid",
  "amount": 1000.00
}
```

**Response:**
```json
{
  "ok": true,
  "paymentId": "uuid",
  "invoiceId": "uuid",
  "newStatus": "partial",
  "totalPaid": 1000.00,
  "outstandingAmount": 4000.00
}
```

### 3. calculate-inventory-value
**Endpoint:** POST `/functions/v1/calculate-inventory-value`

**Request:**
```json
{
  "businessId": "string",
  "valuationDate": "2024-04-24 (optional, defaults to today)",
  "valuationMethod": "fifo|lifo|weighted_average (optional)"
}
```

**Response:**
```json
{
  "ok": true,
  "valuation": {
    "total_items": 45,
    "total_quantity": 1234.50,
    "total_cost_value": 25000.00,
    "total_retail_value": 40000.00,
    "valuation_date": "2024-04-24",
    "valuation_method": "fifo",
    "margin_percent": 37.5
  }
}
```

---

## API Wrappers

### Finance API (src/app/api/finance.ts)

**Key Functions:**
- `getInvoices(businessId, filters)` - List invoices
- `getInvoice(invoiceId)` - Get invoice with items
- `createInvoice(businessId, input)` - Create invoice
- `updateInvoice(invoiceId, updates)` - Update invoice
- `markInvoiceSent(invoiceId)` - Mark as sent
- `getExpenses(businessId, filters)` - List expenses
- `createExpense(businessId, input)` - Create expense
- `updateExpense(expenseId, updates)` - Update expense
- `getFinancialSummary(businessId, period)` - Call Edge Function
- `getStoredFinancialSummary(businessId, startDate, endDate)` - Query DB

### Payments API (src/app/api/payments.ts)

**Key Functions:**
- `createTransaction(businessId, input)` - Create payment transaction
- `getTransactions(businessId, filters)` - List transactions
- `getTransaction(transactionId)` - Get single transaction
- `updateTransactionStatus(transactionId, status)` - Update status
- `createStripeCustomer(businessId, stripeId, email)` - Map customer
- `getStripeCustomer(businessId, customerId)` - Get Stripe mapping
- `savePaymentMethod(stripeCustomerId, ...)` - Save payment method
- `getPaymentMethods(stripeCustomerId)` - List saved methods
- `setDefaultPaymentMethod(paymentMethodId, customerId)` - Set default
- `createRefund(transactionId, amount, reason)` - Create refund
- `getRefunds(transactionId)` - List refunds
- `updateRefundStatus(refundId, status)` - Update refund
- `linkInvoicePayment(businessId, invoiceId, transactionId, amount)` - Call Edge Function
- `getInvoicePayments(invoiceId)` - Get payments for invoice

---

## Migration Deployment Order

1. **Finance Schema** (`20260424_finance_schema.sql`)
   - Creates invoices, invoice_items, expenses, financial_summaries, finance_activities
   - Sets up auto-update triggers

2. **Payments Schema** (`20260424_payments_schema.sql`)
   - Creates transactions, stripe_customers, payment_methods, invoice_payments, refunds
   - Sets up payment sync triggers

3. **Inventory Schema** (`20260424_inventory_schema.sql`)
   - Creates inventory_items, inventory_movements, inventory_valuations
   - Sets up valuation functions

---

## Data Model Relationships

```
customers
  ├─ invoices (customer_id)
  │   └─ invoice_items
  │       └─ invoice_payments
  │           └─ transactions
  │               └─ refunds
  ├─ stripe_customers (customer_id)
  │   ├─ payment_methods
  │   └─ transactions
  └─ inventory_items (supplier_id)
      └─ inventory_movements

business
  ├─ invoices (business_id)
  ├─ expenses (business_id)
  ├─ financial_summaries (business_id)
  ├─ transactions (business_id)
  ├─ inventory_items (business_id)
  └─ finance_activities (business_id)
```

---

## Performance Considerations

1. **Indexes on Multi-Tenant Queries:** All tables have business_id index as primary access pattern
2. **Status Filtering:** Composite indexes on business_id + status for quick filtering
3. **Date Range Queries:** Indexes on date fields for period-based reports
4. **Financial Summary Caching:** Pre-calculated summaries avoid expensive aggregations
5. **Invoice Status Triggers:** Automatic updates prevent stale data

---

## Example Queries

### Get Monthly Revenue
```sql
SELECT 
  DATE_TRUNC('month', issue_date)::DATE as month,
  SUM(total_amount) as revenue,
  SUM(paid_amount) as received,
  SUM(total_amount - paid_amount) as outstanding
FROM invoices
WHERE business_id = 'biz-123'
  AND status != 'cancelled'
GROUP BY DATE_TRUNC('month', issue_date)
ORDER BY month DESC;
```

### Low Stock Alert
```sql
SELECT sku, name, quantity_on_hand, reorder_level
FROM inventory_items
WHERE business_id = 'biz-123'
  AND quantity_on_hand <= reorder_level
  AND is_active = true
ORDER BY quantity_on_hand ASC;
```

### Outstanding Invoices
```sql
SELECT invoice_number, customer_id, total_amount, paid_amount,
       total_amount - paid_amount as due,
       CURRENT_DATE - due_date as days_overdue
FROM invoices
WHERE business_id = 'biz-123'
  AND paid_amount < total_amount
  AND status != 'cancelled'
ORDER BY due_date ASC;
```

### Payment Collection Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as amount,
  ROUND(100.0 * SUM(paid_amount) / SUM(total_amount), 2) as collection_rate
FROM invoices
WHERE business_id = 'biz-123'
GROUP BY status;
```

---

## Environment Variables Required

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For Edge Functions
STRIPE_SECRET_KEY=sk_...  # For payment processing
STRIPE_PUBLISHABLE_KEY=pk_...  # For client-side integration
```

---

## Deployment Checklist

- [ ] Run migrations in order (Finance → Payments → Inventory)
- [ ] Deploy Edge Functions to Supabase
- [ ] Set environment variables in Supabase
- [ ] Test RLS policies match your tenant model
- [ ] Import API wrapper functions in your app
- [ ] Set up Stripe webhook handlers
- [ ] Configure Stripe API keys
- [ ] Run initial data validation queries
- [ ] Set up monitoring for trigger performance
- [ ] Back up database before production deployment

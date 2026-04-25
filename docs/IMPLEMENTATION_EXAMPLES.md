# Finance & Payments - Implementation Examples

## Quick Start Examples

### 1. Create an Invoice with Line Items

```typescript
import { createInvoice } from '@/app/api/finance';

async function createSalesInvoice(businessId: string) {
  const { data, error } = await createInvoice(businessId, {
    customer_id: 'cust-uuid-123',
    invoice_number: 'INV-2024-001',
    issue_date: '2024-04-24',
    due_date: '2024-05-24',
    total_amount: 2500,
    tax_amount: 250,
    discount_amount: 0,
    currency: 'USD',
    notes: 'Thank you for your business!',
    items: [
      {
        description: 'Web Design Services',
        quantity: 40,
        unit_price: 50,
        tax_rate: 10,
        amount: 2000,
        order_index: 0,
      },
      {
        description: 'Hosting Setup',
        quantity: 1,
        unit_price: 500,
        tax_rate: 10,
        amount: 500,
        order_index: 1,
      }
    ]
  });

  if (error) {
    console.error('Failed to create invoice:', error);
    return;
  }

  console.log('Invoice created:', data);
  return data;
}
```

---

### 2. Get Monthly Financial Summary

```typescript
import { getFinancialSummary } from '@/app/api/finance';

async function getMonthlyReport(businessId: string) {
  const { data: summary, error } = await getFinancialSummary(
    businessId,
    'month'
  );

  if (error) {
    console.error('Failed to get summary:', error);
    return;
  }

  console.log(`Monthly Report for ${businessId}`);
  console.log(`Period: ${summary.period_start} to ${summary.period_end}`);
  console.log(`Total Invoiced: $${summary.total_invoiced}`);
  console.log(`Total Paid: $${summary.total_paid}`);
  console.log(`Outstanding: $${summary.outstanding_amount}`);
  console.log(`Total Expenses: $${summary.total_expenses}`);
  console.log(`Net Income: $${summary.net_income}`);
  console.log(`Payment Rate: ${summary.payment_rate}%`);

  return summary;
}
```

---

### 3. Track Business Expenses

```typescript
import { createExpense, getExpenses } from '@/app/api/finance';

// Record a new expense
async function recordExpense(businessId: string) {
  const { data, error } = await createExpense(businessId, {
    category: 'software',
    description: 'Monthly SaaS subscription - Design tool',
    amount: 99.99,
    expense_date: '2024-04-24',
    currency: 'USD',
    payment_method: 'card',
    receipt_url: 'https://receipts.example.com/receipt-123.pdf',
    notes: 'Recurring monthly',
  });

  return data;
}

// Get expenses for a date range
async function getMonthlyExpenses(businessId: string) {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0];
  const endDate = now.toISOString().split('T')[0];

  const { data: expenses, error, count } = await getExpenses(businessId, {
    startDate,
    endDate,
    limit: 100,
  });

  if (error) {
    console.error('Failed to fetch expenses:', error);
    return;
  }

  // Group by category
  const byCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
  });

  console.log('Expenses by Category:');
  Object.entries(byCategory).forEach(([category, total]) => {
    console.log(`  ${category}: $${total.toFixed(2)}`);
  });

  return { expenses, byCategory };
}
```

---

### 4. Process Stripe Payments

```typescript
import { createTransaction, linkInvoicePayment } from '@/app/api/payments';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function processInvoicePayment(
  businessId: string,
  invoiceId: string,
  stripePaymentIntentId: string
) {
  // Retrieve payment intent from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(
    stripePaymentIntentId
  );

  if (paymentIntent.status !== 'succeeded') {
    throw new Error(`Payment not succeeded: ${paymentIntent.status}`);
  }

  // Create transaction record in database
  const { data: transaction, error: txnError } = await createTransaction(
    businessId,
    {
      amount: paymentIntent.amount / 100, // Stripe uses cents
      stripe_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.charges.data[0].id,
      stripe_payment_intent_id: paymentIntent.id,
      payment_method_type: 'card',
      description: `Payment for Invoice ${invoiceId}`,
      receipt_email: paymentIntent.receipt_email || undefined,
    }
  );

  if (txnError) {
    console.error('Failed to create transaction:', txnError);
    throw txnError;
  }

  // Link payment to invoice
  const { ok, newStatus, totalPaid } = await linkInvoicePayment(
    businessId,
    invoiceId,
    transaction.id,
    transaction.amount
  );

  if (!ok) {
    throw new Error('Failed to link payment to invoice');
  }

  console.log(`Payment processed:`);
  console.log(`  Invoice Status: ${newStatus}`);
  console.log(`  Total Paid: $${totalPaid}`);

  return { transaction, newStatus, totalPaid };
}
```

---

### 5. Manage Customer Payment Methods

```typescript
import {
  createStripeCustomer,
  savePaymentMethod,
  getPaymentMethods,
  setDefaultPaymentMethod,
} from '@/app/api/payments';

async function setupCustomerPayment(
  businessId: string,
  customerId: string,
  email: string,
  name: string
) {
  // Create Stripe customer
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const stripeCustomer = await stripe.customers.create({
    email,
    name,
    metadata: { businessId, customerId },
  });

  // Save to database
  const { data: dbCustomer } = await createStripeCustomer(
    businessId,
    stripeCustomer.id,
    email,
    name,
    customerId
  );

  return dbCustomer;
}

async function saveCard(
  stripeCustomerId: string,
  cardToken: string,
  isDefault: boolean = false
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Create payment method in Stripe
  const paymentMethod = await stripe.paymentMethods.create({
    type: 'card',
    card: { token: cardToken },
  });

  // Attach to customer
  await stripe.paymentMethods.attach(paymentMethod.id, {
    customer: stripeCustomerId,
  });

  // Save to database
  const card = paymentMethod.card!;
  const { data } = await savePaymentMethod(
    stripeCustomerId,
    paymentMethod.id,
    'card',
    {
      brand: card.brand,
      lastFour: card.last4,
      expMonth: card.exp_month,
      expYear: card.exp_year,
    },
    isDefault
  );

  return data;
}

async function listPaymentMethods(stripeCustomerId: string) {
  const { data: methods } = await getPaymentMethods(stripeCustomerId);

  console.log('Saved Payment Methods:');
  methods.forEach((method) => {
    const marker = method.is_default ? ' [DEFAULT]' : '';
    if (method.type === 'card') {
      console.log(
        `  ${method.card_brand} ending in ${method.card_last_four}${marker}`
      );
    } else {
      console.log(`  ${method.type}${marker}`);
    }
  });

  return methods;
}

async function setDefaultCard(paymentMethodId: string, customerId: string) {
  const { ok } = await setDefaultPaymentMethod(paymentMethodId, customerId);
  if (ok) {
    console.log('Default payment method updated');
  }
}
```

---

### 6. Handle Refunds

```typescript
import { createRefund, updateRefundStatus } from '@/app/api/payments';
import Stripe from 'stripe';

async function refundPayment(
  transactionId: string,
  businessId: string,
  amount: number,
  reason: string = 'requested_by_customer'
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Create refund in Stripe
  const refund = await stripe.refunds.create({
    charge: stripeChargeId, // Get from transaction record
    amount: Math.round(amount * 100), // Convert to cents
    reason: reason as any,
  });

  // Create refund record in database
  const { data: dbRefund, error } = await createRefund(
    transactionId,
    amount,
    reason,
    `Refund ID: ${refund.id}`
  );

  if (error) {
    throw error;
  }

  // Update refund status after Stripe confirms
  await updateRefundStatus(dbRefund.id, 'succeeded', refund.id);

  console.log(`Refund created: ${refund.id}`);
  console.log(`Amount: $${(refund.amount / 100).toFixed(2)}`);

  return dbRefund;
}
```

---

### 7. Inventory Tracking

```typescript
import { supabase } from '@/app/lib/supabase';

// Create inventory item
async function addProduct(businessId: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert([
      {
        business_id: businessId,
        sku: 'WIDGET-001',
        name: 'Premium Widget',
        description: 'High-quality widget for businesses',
        category: 'widgets',
        quantity_on_hand: 100,
        reorder_level: 20,
        unit_cost: 15.00,
        selling_price: 29.99,
        unit: 'unit',
        is_active: true,
      },
    ])
    .select()
    .single();

  return data;
}

// Record inventory movement (sale)
async function recordSale(
  businessId: string,
  inventoryItemId: string,
  quantity: number,
  invoiceId: string
) {
  const { error } = await supabase
    .from('inventory_movements')
    .insert([
      {
        business_id: businessId,
        inventory_item_id: inventoryItemId,
        movement_type: 'sale',
        quantity: -quantity, // Negative for sale
        reference_type: 'invoice',
        reference_id: invoiceId,
        notes: `Sale from invoice ${invoiceId}`,
      },
    ]);

  if (error) {
    console.error('Failed to record sale:', error);
    throw error;
  }

  console.log(`Recorded sale of ${quantity} units`);
}

// Record inventory movement (purchase/restock)
async function recordPurchase(
  businessId: string,
  inventoryItemId: string,
  quantity: number,
  unitCost: number
) {
  const { error } = await supabase
    .from('inventory_movements')
    .insert([
      {
        business_id: businessId,
        inventory_item_id: inventoryItemId,
        movement_type: 'purchase',
        quantity: quantity, // Positive for purchase
        unit_cost: unitCost,
        notes: 'Restocking purchase',
      },
    ]);

  if (error) throw error;

  console.log(`Restocked ${quantity} units at $${unitCost} per unit`);
}

// Get low stock items
async function getLowStockAlerts(businessId: string) {
  const { data: lowStock, error } = await supabase
    .from('inventory_items')
    .select('id, sku, name, quantity_on_hand, reorder_level')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .lte('quantity_on_hand', 'reorder_level')
    .order('quantity_on_hand', { ascending: true });

  if (error) throw error;

  console.log('Low Stock Alerts:');
  lowStock.forEach((item) => {
    console.log(
      `  ${item.sku} - ${item.name}: ${item.quantity_on_hand}/${item.reorder_level}`
    );
  });

  return lowStock;
}

// Calculate inventory value
async function getInventoryValue(businessId: string) {
  const response = await fetch(
    `${window.location.origin}/functions/v1/calculate-inventory-value`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessId }),
    }
  );

  const { valuation } = await response.json();

  console.log('Inventory Valuation:');
  console.log(`  Total Items: ${valuation.total_items}`);
  console.log(`  Total Quantity: ${valuation.total_quantity}`);
  console.log(`  Cost Value: $${valuation.total_cost_value.toFixed(2)}`);
  console.log(`  Retail Value: $${valuation.total_retail_value.toFixed(2)}`);
  console.log(`  Margin: ${valuation.margin_percent}%`);

  return valuation;
}
```

---

### 8. Financial Dashboard Data

```typescript
import { getInvoices, getExpenses, getFinancialSummary } from '@/app/api/finance';

async function buildDashboard(businessId: string) {
  // Get this month's summary
  const { data: summary } = await getFinancialSummary(businessId, 'month');

  // Get recent invoices
  const { data: invoices } = await getInvoices(businessId, {
    limit: 10,
    offset: 0,
  });

  // Get recent expenses
  const { data: expenses } = await getExpenses(businessId, {
    limit: 10,
    offset: 0,
  });

  // Calculate metrics
  const overdueInvoices = invoices.filter((inv) => {
    const dueDate = new Date(inv.due_date);
    return dueDate < new Date() && inv.status !== 'paid';
  });

  const expensesByCategory: Record<string, number> = {};
  expenses.forEach((exp) => {
    expensesByCategory[exp.category] =
      (expensesByCategory[exp.category] || 0) + exp.amount;
  });

  return {
    summary,
    recentInvoices: invoices.slice(0, 5),
    recentExpenses: expenses.slice(0, 5),
    overdueCount: overdueInvoices.length,
    expensesByCategory,
    topExpenseCategory: Object.entries(expensesByCategory).sort(
      ([, a], [, b]) => b - a
    )[0],
  };
}
```

---

### 9. Invoice Reminder System

```typescript
import { getInvoices, markInvoiceSent } from '@/app/api/finance';

async function sendInvoiceReminders(businessId: string) {
  // Get unpaid invoices that are overdue
  const { data: invoices } = await getInvoices(businessId, {
    status: 'overdue',
    limit: 100,
  });

  for (const invoice of invoices) {
    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(invoice.due_date).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // Send reminder (integrate with your email service)
    const reminderData = {
      invoiceNumber: invoice.invoice_number,
      customerId: invoice.customer_id,
      amount: invoice.total_amount,
      daysOverdue,
      outstandingAmount: invoice.total_amount - invoice.paid_amount,
    };

    console.log(`Reminder for overdue invoice:`, reminderData);
    // await emailService.sendOverdueReminder(reminderData);
  }
}

async function markInvoiceViewed(invoiceId: string) {
  // When customer opens invoice from email link
  const { error } = await supabase
    .from('invoices')
    .update({ viewed_at: new Date().toISOString() })
    .eq('id', invoiceId);

  if (!error) {
    console.log('Invoice marked as viewed');
  }
}
```

---

### 10. Revenue Analysis

```typescript
async function getRevenueTrends(businessId: string) {
  // Get last 12 months of data
  const summaries = [];

  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);

    const { data: summary } = await getFinancialSummary(businessId, 'month');

    summaries.push({
      month: date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      }),
      revenue: summary.total_invoiced,
      expenses: summary.total_expenses,
      profit: summary.net_income,
      invoiceCount: summary.invoice_count,
    });
  }

  // Calculate growth
  const currentMonth = summaries[summaries.length - 1];
  const previousMonth = summaries[summaries.length - 2];
  const revenueGrowth =
    ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) *
    100;

  console.log('12-Month Revenue Trend:');
  summaries.forEach((data) => {
    console.log(
      `  ${data.month}: $${data.revenue.toFixed(2)} (${data.invoiceCount} invoices)`
    );
  });
  console.log(`\nMonth-over-Month Growth: ${revenueGrowth.toFixed(1)}%`);

  return { summaries, growth: revenueGrowth };
}
```

---

## Error Handling Patterns

```typescript
// Pattern 1: Try-catch with typed errors
async function safeFetchInvoice(invoiceId: string) {
  try {
    const { data, error } = await getInvoice(invoiceId);
    if (error) throw new Error(error);
    return data;
  } catch (err) {
    console.error('Failed to fetch invoice:', err);
    // Return null or default value
    return null;
  }
}

// Pattern 2: Error boundary with retry
async function fetchWithRetry<T>(
  fn: () => Promise<{ data?: T; error?: string }>,
  maxRetries: number = 3
): Promise<T | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data, error } = await fn();
      if (error) {
        if (i === maxRetries - 1) throw new Error(error);
        await new Promise((res) => setTimeout(res, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      return data || null;
    } catch (err) {
      if (i === maxRetries - 1) {
        console.error('Max retries exceeded:', err);
        return null;
      }
    }
  }
  return null;
}

// Usage:
const invoice = await fetchWithRetry(() =>
  getInvoice('invoice-uuid')
);
```

---

## React Component Examples

```typescript
// Component: Invoice List with Filters
import { useState, useEffect } from 'react';
import { getInvoices } from '@/app/api/finance';

export function InvoiceList({ businessId }: { businessId: string }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await getInvoices(businessId, {
        status: status || undefined,
        limit: 50,
      });
      if (!error) {
        setInvoices(data);
      }
      setLoading(false);
    }
    load();
  }, [businessId, status]);

  if (loading) return <div>Loading invoices...</div>;

  return (
    <div>
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All Status</option>
        <option value="draft">Draft</option>
        <option value="sent">Sent</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
      </select>

      <table>
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.invoice_number}</td>
              <td>${invoice.total_amount.toFixed(2)}</td>
              <td>{invoice.status}</td>
              <td>{invoice.due_date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

These examples demonstrate the core functionality of the Finance and Payments modules with real-world use cases.

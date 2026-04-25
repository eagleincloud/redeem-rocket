/**
 * Finance API Wrapper
 * Provides client-side functions for invoice and expense management
 *
 * Location: src/app/api/finance.ts
 */

import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Invoice {
  id: string;
  business_id: string;
  customer_id?: string;
  invoice_number: string;
  status: 'draft' | 'sent' | 'viewed' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  total_amount: number;
  paid_amount: number;
  tax_amount: number;
  discount_amount: number;
  currency: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
  order_index: number;
}

export interface Expense {
  id: string;
  business_id: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  status: 'draft' | 'recorded' | 'reimbursed' | 'cancelled';
  expense_date: string;
  payment_method?: string;
  receipt_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  period_type: string;
  period_start: string;
  period_end: string;
  total_invoiced: number;
  total_paid: number;
  total_expenses: number;
  net_income: number;
  invoice_count: number;
  expense_count: number;
  outstanding_amount: number;
  payment_rate: number;
}

export interface CreateInvoiceInput {
  customer_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  currency?: string;
  notes?: string;
  items?: Omit<InvoiceItem, 'id' | 'invoice_id'>[];
}

export interface CreateExpenseInput {
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  currency?: string;
  payment_method?: string;
  receipt_url?: string;
  notes?: string;
}

export interface ExpenseFilters {
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch invoices for a business with optional filters
 */
export async function getInvoices(
  businessId: string,
  filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Invoice[]; error?: string; count?: number }> {
  try {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('issue_date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count };
  } catch (error) {
    console.error('[getInvoices] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch invoices' };
  }
}

/**
 * Get a single invoice with its items
 */
export async function getInvoice(
  invoiceId: string
): Promise<{ data?: Invoice & { items?: InvoiceItem[] }; error?: string }> {
  try {
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invoiceError) throw invoiceError;

    const { data: items, error: itemsError } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('order_index', { ascending: true });

    if (itemsError) throw itemsError;

    return { data: { ...invoice, items: items || [] } };
  } catch (error) {
    console.error('[getInvoice] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch invoice' };
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(
  businessId: string,
  input: CreateInvoiceInput
): Promise<{ data?: Invoice; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([
        {
          business_id: businessId,
          customer_id: input.customer_id,
          invoice_number: input.invoice_number,
          issue_date: input.issue_date,
          due_date: input.due_date,
          total_amount: input.total_amount,
          tax_amount: input.tax_amount || 0,
          discount_amount: input.discount_amount || 0,
          currency: input.currency || 'USD',
          notes: input.notes,
          status: 'draft',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Create line items if provided
    if (input.items && input.items.length > 0) {
      const items = input.items.map((item, index) => ({
        invoice_id: data.id,
        ...item,
        order_index: index,
      }));

      const { error: itemsError } = await supabase.from('invoice_items').insert(items);

      if (itemsError) {
        console.error('[createInvoice] Failed to create items:', itemsError);
        // Rollback invoice creation
        await supabase.from('invoices').delete().eq('id', data.id);
        throw itemsError;
      }
    }

    return { data };
  } catch (error) {
    console.error('[createInvoice] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create invoice' };
  }
}

/**
 * Update an invoice
 */
export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Invoice>
): Promise<{ data?: Invoice; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[updateInvoice] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update invoice' };
  }
}

/**
 * Mark invoice as sent (set last_sent_at)
 */
export async function markInvoiceSent(invoiceId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({ last_sent_at: new Date().toISOString() })
      .eq('id', invoiceId);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[markInvoiceSent] Error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to mark invoice as sent' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fetch expenses for a business with optional filters
 */
export async function getExpenses(
  businessId: string,
  filters?: ExpenseFilters & { limit?: number; offset?: number }
): Promise<{ data: Expense[]; error?: string; count?: number }> {
  try {
    let query = supabase
      .from('expenses')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .neq('status', 'cancelled')
      .order('expense_date', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.startDate) {
      query = query.gte('expense_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('expense_date', filters.endDate);
    }
    if (filters?.minAmount !== undefined) {
      query = query.gte('amount', filters.minAmount);
    }
    if (filters?.maxAmount !== undefined) {
      query = query.lte('amount', filters.maxAmount);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count };
  } catch (error) {
    console.error('[getExpenses] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch expenses' };
  }
}

/**
 * Create a new expense
 */
export async function createExpense(
  businessId: string,
  input: CreateExpenseInput
): Promise<{ data?: Expense; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          business_id: businessId,
          category: input.category,
          description: input.description,
          amount: input.amount,
          currency: input.currency || 'USD',
          status: 'recorded',
          expense_date: input.expense_date,
          payment_method: input.payment_method,
          receipt_url: input.receipt_url,
          notes: input.notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[createExpense] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create expense' };
  }
}

/**
 * Update an expense
 */
export async function updateExpense(
  expenseId: string,
  updates: Partial<Expense>
): Promise<{ data?: Expense; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[updateExpense] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to update expense' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// FINANCIAL SUMMARIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get financial summary from Edge Function
 */
export async function getFinancialSummary(
  businessId: string,
  period: 'month' | 'quarter' | 'year' = 'month',
  customDates?: { startDate: string; endDate: string }
): Promise<{ data?: FinancialSummary; error?: string }> {
  try {
    const functionUrl = `${window.location.origin}/functions/v1/get-financial-summary`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        businessId,
        period,
        ...(customDates && {
          startDate: customDates.startDate,
          endDate: customDates.endDate,
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to get financial summary');
    }

    return { data: result.summary };
  } catch (error) {
    console.error('[getFinancialSummary] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to get financial summary' };
  }
}

/**
 * Fetch stored financial summary from database
 */
export async function getStoredFinancialSummary(
  businessId: string,
  startDate: string,
  endDate: string
): Promise<{ data?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('financial_summaries')
      .select('*')
      .eq('business_id', businessId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error) {
    console.error('[getStoredFinancialSummary] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch financial summary' };
  }
}

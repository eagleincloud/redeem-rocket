/**
 * Payments API Wrapper
 * Provides client-side functions for Stripe payment management
 *
 * Location: src/app/api/payments.ts
 */

import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface Transaction {
  id: string;
  business_id: string;
  stripe_id?: string;
  stripe_charge_id?: string;
  stripe_payment_intent_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled' | 'refunded' | 'disputed';
  payment_method_type?: string;
  customer_id?: string;
  description?: string;
  receipt_url?: string;
  error_code?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface StripeCustomer {
  id: string;
  business_id: string;
  customer_id?: string;
  stripe_customer_id: string;
  email: string;
  name?: string;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  stripe_customer_id: string;
  stripe_payment_method_id: string;
  type: 'card' | 'bank_account' | 'wallet';
  card_brand?: string;
  card_last_four?: string;
  card_exp_month?: number;
  card_exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface Refund {
  id: string;
  transaction_id: string;
  stripe_refund_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  reason?: string;
  notes?: string;
  created_at: string;
}

export interface CreateTransactionInput {
  amount: number;
  currency?: string;
  stripe_id?: string;
  stripe_charge_id?: string;
  stripe_payment_intent_id?: string;
  payment_method_type?: string;
  customer_id?: string;
  description?: string;
  receipt_email?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a new transaction
 */
export async function createTransaction(
  businessId: string,
  input: CreateTransactionInput
): Promise<{ data?: Transaction; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          business_id: businessId,
          amount: input.amount,
          currency: input.currency || 'USD',
          stripe_id: input.stripe_id,
          stripe_charge_id: input.stripe_charge_id,
          stripe_payment_intent_id: input.stripe_payment_intent_id,
          payment_method_type: input.payment_method_type,
          customer_id: input.customer_id,
          description: input.description,
          receipt_email: input.receipt_email,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Log transaction creation
    await supabase.from('payment_audit_logs').insert([
      {
        business_id: businessId,
        entity_type: 'transaction',
        entity_id: data.id,
        stripe_id: input.stripe_id,
        action: 'created',
        status: 'pending',
        amount: input.amount,
      },
    ]);

    return { data };
  } catch (error) {
    console.error('[createTransaction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create transaction' };
  }
}

/**
 * Fetch transactions for a business
 */
export async function getTransactions(
  businessId: string,
  filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ data: Transaction[]; error?: string; count?: number }> {
  try {
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customerId) {
      query = query.eq('customer_id', filters.customerId);
    }
    if (filters?.startDate) {
      query = query.gte('created_at', `${filters.startDate}T00:00:00Z`);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', `${filters.endDate}T23:59:59Z`);
    }

    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;
    return { data: data || [], count };
  } catch (error) {
    console.error('[getTransactions] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch transactions' };
  }
}

/**
 * Get a single transaction
 */
export async function getTransaction(
  transactionId: string
): Promise<{ data?: Transaction; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[getTransaction] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch transaction' };
  }
}

/**
 * Update transaction status (e.g., succeeded, failed)
 */
export async function updateTransactionStatus(
  transactionId: string,
  status: string,
  errorCode?: string,
  errorMessage?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('transactions')
      .update({
        status,
        error_code: errorCode,
        error_message: errorMessage,
      })
      .eq('id', transactionId);

    if (error) throw error;

    // Log status update
    await supabase.from('payment_audit_logs').insert([
      {
        entity_type: 'transaction',
        entity_id: transactionId,
        action: 'updated',
        status,
      },
    ]);

    return { ok: true };
  } catch (error) {
    console.error('[updateTransactionStatus] Error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update transaction' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STRIPE CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create Stripe customer record
 */
export async function createStripeCustomer(
  businessId: string,
  stripeCustomerId: string,
  email: string,
  name?: string,
  customerId?: string
): Promise<{ data?: StripeCustomer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('stripe_customers')
      .insert([
        {
          business_id: businessId,
          customer_id: customerId,
          stripe_customer_id: stripeCustomerId,
          email,
          name,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[createStripeCustomer] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create Stripe customer' };
  }
}

/**
 * Get Stripe customer by customer_id
 */
export async function getStripeCustomer(
  businessId: string,
  customerId: string
): Promise<{ data?: StripeCustomer; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('stripe_customers')
      .select('*')
      .eq('business_id', businessId)
      .eq('customer_id', customerId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // 404 is expected
    return { data };
  } catch (error) {
    console.error('[getStripeCustomer] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to fetch Stripe customer' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT METHODS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Save payment method
 */
export async function savePaymentMethod(
  stripeCustomerId: string,
  stripePaymentMethodId: string,
  type: string,
  cardDetails?: {
    brand?: string;
    lastFour?: string;
    expMonth?: number;
    expYear?: number;
  },
  isDefault?: boolean
): Promise<{ data?: PaymentMethod; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .insert([
        {
          stripe_customer_id: stripeCustomerId,
          stripe_payment_method_id: stripePaymentMethodId,
          type,
          card_brand: cardDetails?.brand,
          card_last_four: cardDetails?.lastFour,
          card_exp_month: cardDetails?.expMonth,
          card_exp_year: cardDetails?.expYear,
          is_default: isDefault || false,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[savePaymentMethod] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to save payment method' };
  }
}

/**
 * Get payment methods for a Stripe customer
 */
export async function getPaymentMethods(
  stripeCustomerId: string
): Promise<{ data: PaymentMethod[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error) {
    console.error('[getPaymentMethods] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch payment methods' };
  }
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string,
  stripeCustomerId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    // Remove default from all others
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('stripe_customer_id', stripeCustomerId);

    // Set as default
    const { error } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', paymentMethodId);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[setDefaultPaymentMethod] Error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to set default payment method' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REFUNDS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a refund record
 */
export async function createRefund(
  transactionId: string,
  amount: number,
  reason?: string,
  notes?: string
): Promise<{ data?: Refund; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .insert([
        {
          transaction_id: transactionId,
          amount,
          currency: 'USD',
          status: 'pending',
          reason,
          notes,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data };
  } catch (error) {
    console.error('[createRefund] Error:', error);
    return { error: error instanceof Error ? error.message : 'Failed to create refund' };
  }
}

/**
 * Get refunds for a transaction
 */
export async function getRefunds(
  transactionId: string
): Promise<{ data: Refund[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('refunds')
      .select('*')
      .eq('transaction_id', transactionId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error) {
    console.error('[getRefunds] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch refunds' };
  }
}

/**
 * Update refund status
 */
export async function updateRefundStatus(
  refundId: string,
  status: string,
  stripeRefundId?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('refunds')
      .update({
        status,
        stripe_refund_id: stripeRefundId,
      })
      .eq('id', refundId);

    if (error) throw error;
    return { ok: true };
  } catch (error) {
    console.error('[updateRefundStatus] Error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to update refund' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INVOICE PAYMENTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Link a transaction to an invoice (via Edge Function)
 */
export async function linkInvoicePayment(
  businessId: string,
  invoiceId: string,
  transactionId: string,
  amount: number
): Promise<{ ok: boolean; newStatus?: string; totalPaid?: number; error?: string }> {
  try {
    const functionUrl = `${window.location.origin}/functions/v1/create-invoice-payment`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        transactionId,
        amount,
        businessId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = await response.json();
    if (!result.ok) {
      throw new Error(result.error || 'Failed to link payment');
    }

    return {
      ok: true,
      newStatus: result.newStatus,
      totalPaid: result.totalPaid,
    };
  } catch (error) {
    console.error('[linkInvoicePayment] Error:', error);
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to link invoice payment' };
  }
}

/**
 * Get payments for an invoice
 */
export async function getInvoicePayments(
  invoiceId: string
): Promise<{ data: any[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*, transactions (*)')
      .eq('invoice_id', invoiceId)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return { data: data || [] };
  } catch (error) {
    console.error('[getInvoicePayments] Error:', error);
    return { data: [], error: error instanceof Error ? error.message : 'Failed to fetch invoice payments' };
  }
}

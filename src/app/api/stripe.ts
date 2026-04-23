/**
 * Stripe Integration Service Layer (Scaffold)
 * Payment processing and webhook handling for invoices
 *
 * Location: src/app/api/stripe.ts
 * Note: This is a scaffolding module. Full implementation requires Stripe account setup.
 */

import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface PaymentLinkRequest {
  invoiceId: string;
  businessId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentLinkResponse {
  payment_link_url: string;
  payment_link_id: string;
  invoice_id: string;
  created_at: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// STRIPE API CALLS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a Stripe Payment Link for an invoice
 * Requires Stripe API key configuration in environment variables
 */
export async function createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
  try {
    // This would call your backend API endpoint that interacts with Stripe
    const response = await fetch('/api/stripe/payment-links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create payment link: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Get payment link status
 */
export async function getPaymentLinkStatus(paymentLinkId: string): Promise<any> {
  try {
    const response = await fetch(`/api/stripe/payment-links/${paymentLinkId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment link status: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting payment link status:', error);
    throw error;
  }
}

/**
 * Update invoice with Stripe payment link
 */
export async function updateInvoiceWithPaymentLink(
  invoiceId: string,
  paymentLink: string,
  paymentLinkId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        stripe_payment_link: paymentLink,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating invoice with payment link:', error);
    throw error;
  }
}

/**
 * Get invoice payment status from Stripe
 */
export async function getInvoicePaymentStatus(invoiceId: string): Promise<{
  status: string;
  amount_received: number;
  created_at: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('stripe_payment_link, status, paid_date, total')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      status: data.status,
      amount_received: data.status === 'paid' ? data.total : 0,
      created_at: data.paid_date || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting payment status:', error);
    throw error;
  }
}

/**
 * Process refund for paid invoice
 */
export async function refundInvoicePayment(
  invoiceId: string,
  amount?: number
): Promise<{ refund_id: string; amount_refunded: number }> {
  try {
    const response = await fetch('/api/stripe/refunds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoiceId,
        amount,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to process refund: ${response.statusText}`);
    }

    const data = await response.json();

    await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    return data;
  } catch (error) {
    console.error('Error processing refund:', error);
    throw error;
  }
}

/**
 * Get Stripe account dashboard link
 */
export function getStripeExpressLink(): string {
  return process.env.REACT_APP_STRIPE_EXPRESS_DASHBOARD_URL || '';
}

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK HANDLERS (Server-side implementation)
// ═══════════════════════════════════════════════════════════════════════════

export async function handlePaymentSucceeded(paymentIntentId: string, invoiceId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);

    if (error) throw error;

    const invoice = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice.error && invoice.data) {
      await supabase.from('transactions').insert({
        business_id: invoice.data.business_id,
        type: 'payment',
        amount: invoice.data.total,
        currency: invoice.data.currency,
        date: new Date().toISOString().split('T')[0],
        description: `Payment received for invoice ${invoice.data.invoice_number}`,
        reference_id: invoiceId,
        reference_type: 'invoice',
        status: 'completed',
      });
    }
  } catch (error) {
    console.error('Error handling payment succeeded webhook:', error);
    throw error;
  }
}

export async function handlePaymentFailed(paymentIntentId: string, invoiceId: string): Promise<void> {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error) throw error;

    if (invoice && invoice.status === 'sent') {
      const now = new Date(invoice.due_date);
      if (new Date() > now) {
        await supabase
          .from('invoices')
          .update({ status: 'overdue' })
          .eq('id', invoiceId);
      }
    }
  } catch (error) {
    console.error('Error handling payment failed webhook:', error);
    throw error;
  }
}

export async function handleChargeRefunded(chargeId: string, invoiceId: string): Promise<void> {
  try {
    await supabase
      .from('invoices')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', invoiceId);
  } catch (error) {
    console.error('Error handling charge refunded webhook:', error);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

export function isStripeConfigured(): boolean {
  const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;
  return !!publishableKey;
}

export function getStripeConfig() {
  return {
    publishableKey: process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '',
    accountId: process.env.REACT_APP_STRIPE_ACCOUNT_ID || '',
    testMode: process.env.NODE_ENV === 'development',
  };
}

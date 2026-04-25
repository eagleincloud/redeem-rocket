/**
 * Stripe Invoice Utilities
 * Handles invoice-specific payment operations
 */

import { createPaymentIntent, createPaymentLink, getPaymentStatus, createRefund } from './stripe';
import { supabase } from '@/app/lib/supabase';
import { convertAmountToStripe, convertAmountFromStripe, formatAmountForDisplay } from '../config/stripe';

export interface InvoicePaymentData {
  invoiceId: string;
  businessId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  paymentIntentId?: string;
  paymentLinkUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createInvoicePaymentIntent(invoiceId: string, businessId: string, amount: number, currency = 'inr', customerEmail?: string, description?: string): Promise<InvoicePaymentData> {
  const { data: invoice, error: fetchError } = await supabase.from('payment_submissions').select('*').eq('id', invoiceId).single();

  if (fetchError || !invoice) {
    throw new Error('Invoice not found');
  }

  const intent = await createPaymentIntent(amount, currency, {
    invoice_id: invoiceId,
    business_id: businessId,
    customer_email: customerEmail || invoice.user_email,
    description: description || `Invoice ${invoiceId}`,
  });

  const { error: insertError } = await supabase.from('payment_intents').insert({
    payment_intent_id: intent.id,
    client_secret: intent.client_secret,
    invoice_id: invoiceId,
    business_id: businessId,
    amount,
    currency,
    status: intent.status,
    metadata: { customer_email: customerEmail || invoice.user_email, description },
    expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  });

  if (insertError) console.error('Failed to record payment intent:', insertError);

  return {
    invoiceId,
    businessId,
    amount,
    currency,
    status: 'processing',
    paymentIntentId: intent.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function generateInvoicePaymentLink(invoiceId: string, businessId: string, amount: number, currency = 'inr', businessName?: string): Promise<string> {
  const linkData = await createPaymentLink({
    invoiceId,
    businessId,
    amount,
    currency,
    customerName: businessName,
  });

  const { error } = await supabase.from('payment_links').insert({
    payment_link_id: linkData.payment_link_id,
    link_url: linkData.payment_link_url,
    invoice_id: invoiceId,
    business_id: businessId,
    amount,
    currency,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: { business_name: businessName },
  });

  if (error) console.error('Failed to record payment link:', error);
  return linkData.payment_link_url;
}

export async function checkInvoicePaymentStatus(invoiceId: string): Promise<InvoicePaymentData | null> {
  const { data: transaction, error } = await supabase.from('stripe_transactions').select('*').eq('invoice_id', invoiceId).order('created_at', { ascending: false }).limit(1).single();

  if (error || !transaction) return null;

  return {
    invoiceId,
    businessId: transaction.business_id,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status === 'succeeded' ? 'succeeded' : 'failed',
    paymentIntentId: transaction.payment_id,
    createdAt: transaction.created_at,
    updatedAt: transaction.updated_at,
  };
}

export async function getBusinessPaymentAnalytics(businessId: string, days = 30): Promise<any> {
  const { data: transactions, error } = await supabase.from('stripe_transactions').select('*').eq('business_id', businessId).gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (error || !transactions) return { totalRevenue: 0, totalTransactions: 0, successfulTransactions: 0, failedTransactions: 0, successRate: 0, averageTransactionAmount: 0, totalFees: 0, currency: 'INR' };

  const successful = transactions.filter((t: any) => t.status === 'succeeded');
  const failed = transactions.filter((t: any) => t.status === 'failed');
  const totalAmount = successful.reduce((sum: number, t: any) => sum + t.amount, 0);
  const totalFees = successful.reduce((sum: number, t: any) => sum + (t.stripe_fee || 0), 0);

  return {
    totalRevenue: totalAmount,
    totalTransactions: transactions.length,
    successfulTransactions: successful.length,
    failedTransactions: failed.length,
    successRate: transactions.length > 0 ? (successful.length / transactions.length) * 100 : 0,
    averageTransactionAmount: successful.length > 0 ? totalAmount / successful.length : 0,
    totalFees,
    currency: 'INR',
  };
}

export function formatInvoiceForPayment(invoiceId: string, amount: number, currency = 'inr') {
  return {
    invoiceId,
    displayAmount: formatAmountForDisplay(amount, currency),
    stripeAmount: convertAmountToStripe(amount, currency),
    currency: currency.toUpperCase(),
  };
}

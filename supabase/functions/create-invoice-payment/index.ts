/**
 * Supabase Edge Function: create-invoice-payment
 *
 * Creates a payment record for an invoice and updates invoice status.
 * This function links a transaction to an invoice and calculates payment totals.
 *
 * Request body:
 *   {
 *     invoiceId: string,           — invoice UUID
 *     transactionId: string,       — Stripe transaction UUID
 *     amount: number,              — amount paid (must be <= invoice total)
 *     businessId: string,          — business identifier
 *   }
 *
 * Response:
 *   {
 *     ok: boolean,
 *     paymentId?: string,
 *     invoiceId?: string,
 *     newStatus?: string,          — updated invoice status
 *     totalPaid?: number,          — total paid on invoice
 *     outstandingAmount?: number,  — remaining due
 *     error?: string
 *   }
 *
 * Deploy:
 *   supabase functions deploy create-invoice-payment
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ── Config ────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface PaymentRequest {
  invoiceId: string;
  transactionId: string;
  amount: number;
  businessId: string;
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      invoiceId,
      transactionId,
      amount,
      businessId,
    }: PaymentRequest = await req.json();

    // Validate inputs
    if (!invoiceId || !transactionId || !amount || !businessId) {
      return json(
        {
          ok: false,
          error: 'invoiceId, transactionId, amount, and businessId are required',
        },
        400
      );
    }

    if (amount <= 0) {
      return json({ ok: false, error: 'amount must be greater than 0' }, 400);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get invoice to verify it exists and check amount
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, total_amount, paid_amount, status')
      .eq('id', invoiceId)
      .eq('business_id', businessId)
      .single();

    if (invoiceError || !invoice) {
      console.error('[create-invoice-payment] Invoice fetch error:', invoiceError);
      return json({ ok: false, error: 'Invoice not found' }, 404);
    }

    // Validate payment amount
    const remainingAmount = invoice.total_amount - invoice.paid_amount;
    if (amount > remainingAmount) {
      return json(
        {
          ok: false,
          error: `Payment amount exceeds remaining balance. Remaining: ${remainingAmount}`,
        },
        400
      );
    }

    // Create invoice payment record
    const { data: payment, error: paymentError } = await supabase
      .from('invoice_payments')
      .insert([
        {
          invoice_id: invoiceId,
          transaction_id: transactionId,
          amount,
        },
      ])
      .select()
      .single();

    if (paymentError) {
      console.error('[create-invoice-payment] Payment creation error:', paymentError);
      return json({ ok: false, error: 'Failed to create payment record' }, 500);
    }

    // Get updated invoice
    const { data: updatedInvoice, error: updateError } = await supabase
      .from('invoices')
      .select('id, paid_amount, total_amount, status')
      .eq('id', invoiceId)
      .single();

    if (updateError) {
      console.error('[create-invoice-payment] Update fetch error:', updateError);
      return json({ ok: false, error: 'Failed to fetch updated invoice' }, 500);
    }

    // Log payment activity
    await supabase.from('finance_activities').insert([
      {
        business_id: businessId,
        entity_type: 'payment',
        entity_id: payment.id,
        action: 'created',
        new_values: {
          invoice_id: invoiceId,
          transaction_id: transactionId,
          amount,
        },
      },
    ]);

    const outstandingAmount =
      updatedInvoice.total_amount - updatedInvoice.paid_amount;

    return json({
      ok: true,
      paymentId: payment.id,
      invoiceId: updatedInvoice.id,
      newStatus: updatedInvoice.status,
      totalPaid: updatedInvoice.paid_amount,
      outstandingAmount,
    });
  } catch (err) {
    console.error('[create-invoice-payment] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});

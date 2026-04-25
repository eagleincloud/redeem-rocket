/**
 * Supabase Edge Function: get-financial-summary
 *
 * Calculates and returns financial summary (revenue, expenses, net income)
 * for a business within a specified period.
 *
 * Request body:
 *   {
 *     businessId: string,          — business identifier
 *     period: 'month' | 'quarter' | 'year',  — time period type
 *     startDate?: string,          — optional ISO date (overrides period)
 *     endDate?: string,            — optional ISO date (overrides period)
 *   }
 *
 * Response:
 *   {
 *     ok: boolean,
 *     summary?: {
 *       period_type: string,
 *       period_start: string (ISO date),
 *       period_end: string (ISO date),
 *       total_invoiced: number,
 *       total_paid: number,
 *       total_expenses: number,
 *       net_income: number,
 *       invoice_count: number,
 *       expense_count: number,
 *       outstanding_amount: number,
 *       payment_rate: number (0-100)
 *     },
 *     error?: string
 *   }
 *
 * Deploy:
 *   supabase functions deploy get-financial-summary
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

interface FinancialSummaryRequest {
  businessId: string;
  period?: 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
}

interface FinancialSummary {
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

// ── Helper: Calculate period dates ────────────────────────────────────────

function calculatePeriodDates(period: string): { start: string; end: string } {
  const now = new Date();
  let start: Date;
  let end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month

  switch (period) {
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      businessId,
      period = 'month',
      startDate,
      endDate,
    }: FinancialSummaryRequest = await req.json();

    if (!businessId || typeof businessId !== 'string') {
      return json({ ok: false, error: 'businessId is required' }, 400);
    }

    // Determine date range
    let start: string;
    let end: string;

    if (startDate && endDate) {
      start = startDate;
      end = endDate;
    } else {
      const dates = calculatePeriodDates(period || 'month');
      start = dates.start;
      end = dates.end;
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch invoices data
    const { data: invoices, error: invoiceError } = await supabase
      .from('invoices')
      .select('total_amount, paid_amount, status')
      .eq('business_id', businessId)
      .gte('issue_date', start)
      .lte('issue_date', end)
      .neq('status', 'cancelled');

    if (invoiceError) {
      console.error('[get-financial-summary] Invoice fetch error:', invoiceError);
      return json({ ok: false, error: 'Failed to fetch invoices' }, 500);
    }

    // Fetch expenses data
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('amount, status')
      .eq('business_id', businessId)
      .gte('expense_date', start)
      .lte('expense_date', end)
      .neq('status', 'cancelled');

    if (expenseError) {
      console.error('[get-financial-summary] Expense fetch error:', expenseError);
      return json({ ok: false, error: 'Failed to fetch expenses' }, 500);
    }

    // Calculate totals
    const totalInvoiced = (invoices || [])
      .reduce((sum, inv) => sum + (Number(inv.total_amount) || 0), 0);
    const totalPaid = (invoices || [])
      .reduce((sum, inv) => sum + (Number(inv.paid_amount) || 0), 0);
    const totalExpenses = (expenses || [])
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const netIncome = totalInvoiced - totalExpenses;
    const outstandingAmount = totalInvoiced - totalPaid;
    const paymentRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

    const summary: FinancialSummary = {
      period_type: period,
      period_start: start,
      period_end: end,
      total_invoiced: totalInvoiced,
      total_paid: totalPaid,
      total_expenses: totalExpenses,
      net_income: netIncome,
      invoice_count: invoices?.length || 0,
      expense_count: expenses?.length || 0,
      outstanding_amount: outstandingAmount,
      payment_rate: Math.round(paymentRate * 100) / 100,
    };

    return json({ ok: true, summary });
  } catch (err) {
    console.error('[get-financial-summary] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});

/**
 * Supabase Edge Function: calculate-inventory-value
 *
 * Calculates total inventory stock value (at cost and retail) for a business.
 * Also creates or updates inventory valuation record.
 *
 * Request body:
 *   {
 *     businessId: string,          — business identifier
 *     valuationDate?: string,      — ISO date (defaults to today)
 *     valuationMethod?: string,    — 'fifo' | 'lifo' | 'weighted_average' (defaults to 'fifo')
 *   }
 *
 * Response:
 *   {
 *     ok: boolean,
 *     valuation?: {
 *       total_items: number,
 *       total_quantity: number,
 *       total_cost_value: number,     — total value at cost
 *       total_retail_value: number,   — total value at retail price
 *       valuation_date: string,
 *       valuation_method: string,
 *       margin_percent: number        — (retail_value - cost_value) / retail_value * 100
 *     },
 *     error?: string
 *   }
 *
 * Deploy:
 *   supabase functions deploy calculate-inventory-value
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

interface InventoryValuationRequest {
  businessId: string;
  valuationDate?: string;
  valuationMethod?: 'fifo' | 'lifo' | 'weighted_average';
}

interface InventoryValuation {
  total_items: number;
  total_quantity: number;
  total_cost_value: number;
  total_retail_value: number;
  valuation_date: string;
  valuation_method: string;
  margin_percent: number;
}

// ── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const {
      businessId,
      valuationDate = new Date().toISOString().split('T')[0],
      valuationMethod = 'fifo',
    }: InventoryValuationRequest = await req.json();

    if (!businessId || typeof businessId !== 'string') {
      return json({ ok: false, error: 'businessId is required' }, 400);
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active inventory items
    const { data: items, error: itemsError } = await supabase
      .from('inventory_items')
      .select('id, quantity_on_hand, unit_cost, selling_price')
      .eq('business_id', businessId)
      .eq('is_active', true);

    if (itemsError) {
      console.error('[calculate-inventory-value] Items fetch error:', itemsError);
      return json({ ok: false, error: 'Failed to fetch inventory items' }, 500);
    }

    if (!items || items.length === 0) {
      // No inventory
      const emptyValuation: InventoryValuation = {
        total_items: 0,
        total_quantity: 0,
        total_cost_value: 0,
        total_retail_value: 0,
        valuation_date: valuationDate,
        valuation_method: valuationMethod,
        margin_percent: 0,
      };

      // Update or create valuation record
      await supabase.from('inventory_valuations').upsert(
        [
          {
            business_id: businessId,
            valuation_date: valuationDate,
            total_items: 0,
            total_quantity: 0,
            total_cost_value: 0,
            total_retail_value: 0,
            valuation_method: valuationMethod,
          },
        ],
        { onConflict: 'business_id,valuation_date' }
      );

      return json({ ok: true, valuation: emptyValuation });
    }

    // Calculate totals
    let totalCostValue = 0;
    let totalRetailValue = 0;
    let totalQuantity = 0;

    for (const item of items) {
      const qty = Number(item.quantity_on_hand) || 0;
      const cost = Number(item.unit_cost) || 0;
      const retail = Number(item.selling_price) || 0;

      totalCostValue += qty * cost;
      totalRetailValue += qty * retail;
      totalQuantity += qty;
    }

    const marginPercent =
      totalRetailValue > 0
        ? Math.round(((totalRetailValue - totalCostValue) / totalRetailValue) * 100 * 100) / 100
        : 0;

    const valuation: InventoryValuation = {
      total_items: items.length,
      total_quantity: totalQuantity,
      total_cost_value: Math.round(totalCostValue * 100) / 100,
      total_retail_value: Math.round(totalRetailValue * 100) / 100,
      valuation_date: valuationDate,
      valuation_method: valuationMethod,
      margin_percent: marginPercent,
    };

    // Upsert valuation record
    const { error: upsertError } = await supabase
      .from('inventory_valuations')
      .upsert(
        [
          {
            business_id: businessId,
            valuation_date: valuationDate,
            total_items: items.length,
            total_quantity: totalQuantity,
            total_cost_value: valuation.total_cost_value,
            total_retail_value: valuation.total_retail_value,
            valuation_method: valuationMethod,
          },
        ],
        { onConflict: 'business_id,valuation_date' }
      );

    if (upsertError) {
      console.error('[calculate-inventory-value] Upsert error:', upsertError);
      // Still return the calculated valuation even if DB update fails
      console.warn('Failed to save valuation to database, returning calculated value');
    }

    return json({ ok: true, valuation });
  } catch (err) {
    console.error('[calculate-inventory-value] Unexpected error:', err);
    return json({ ok: false, error: 'Internal server error' }, 500);
  }
});

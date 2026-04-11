import { supabase } from '../lib/supabase';

export interface PaymentSubmission {
  id: string;
  user_id: string;
  business_id: string;
  business_name: string;
  amount: number;
  payment_method: 'upi' | 'cash';
  bill_url?: string | null;
  status: 'pending' | 'acknowledged' | 'approved' | 'rejected';
  cashback_amount?: number | null;
  cashback_rate: number;
  created_at: string;
}

export interface SubmitPaymentInput {
  user_id: string;
  business_id: string;
  business_name: string;
  amount: number;
  payment_method: 'upi' | 'cash';
  bill_url?: string | null;
  cashback_rate?: number;
}

/** Upload a bill image to the payment-bills bucket and return its public URL. */
export async function uploadBillImage(file: File, userId: string): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('payment-bills').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    console.warn('[payment-bills] upload error', error.message);
    return null;
  }
  const { data } = supabase.storage.from('payment-bills').getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/** Insert a new payment submission row. Returns the created row or null on failure. */
export async function submitPayment(
  input: SubmitPaymentInput
): Promise<PaymentSubmission | null> {
  if (!supabase) return null;
  const cashback_rate = input.cashback_rate ?? 5;
  const cashback_amount = parseFloat(((input.amount * cashback_rate) / 100).toFixed(2));
  const { data, error } = await supabase
    .from('payment_submissions')
    .insert({
      user_id: input.user_id,
      business_id: input.business_id,
      business_name: input.business_name,
      amount: input.amount,
      payment_method: input.payment_method,
      bill_url: input.bill_url ?? null,
      status: 'pending',
      cashback_rate,
      cashback_amount,
    })
    .select()
    .single();
  if (error) {
    console.warn('[payment_submissions] insert error', error.message);
    return null;
  }
  return data as PaymentSubmission;
}

/** Fetch payment submissions for a customer user. */
export async function fetchUserPayments(userId: string): Promise<PaymentSubmission[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('payment_submissions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    console.warn('[payment_submissions] fetch error', error.message);
    return [];
  }
  return (data ?? []) as PaymentSubmission[];
}

/**
 * Stripe Checkout Component
 * Secure payment form for invoice payments
 */

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { createPaymentIntent } from '@/app/api/stripe';
import { toast } from 'sonner';

interface StripeCheckoutProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  businessName: string;
  customerEmail: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
  isDark?: boolean;
}

export function StripeCheckout({
  invoiceId,
  amount,
  currency = 'inr',
  businessName,
  customerEmail,
  onSuccess,
  onError,
  isDark = false,
}: StripeCheckoutProps) {
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ cardName: '', cardNumber: '', expiry: '', cvc: '' });

  useEffect(() => {
    const initializePayment = async () => {
      try {
        await createPaymentIntent(amount, currency, {
          invoice_id: invoiceId,
          customer_email: customerEmail,
          business_name: businessName,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to initialize payment';
        setError(errorMsg);
        onError?.(errorMsg);
      }
    };
    initializePayment();
  }, [invoiceId, amount, currency, businessName, customerEmail, onSuccess, onError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'cardNumber') {
      const formatted = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'expiry') {
      const cleaned = value.replace(/\D/g, '');
      const formatted = cleaned.length >= 2 ? `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}` : cleaned;
      setFormData({ ...formData, [name]: formatted });
    } else if (name === 'cvc') {
      setFormData({ ...formData, [name]: value.replace(/\D/g, '').slice(0, 4) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cardName || !formData.cardNumber || !formData.expiry || !formData.cvc) {
      setError('Please fill in all payment details');
      return;
    }

    setIsLoading(true);
    setStatus('processing');

    try {
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, invoiceId, amount, currency }),
      });

      if (!response.ok) throw new Error('Payment processing failed');

      const result = await response.json();
      if (result.success) {
        setStatus('success');
        toast.success('Payment successful!');
        onSuccess?.(result.paymentId);
        setFormData({ cardName: '', cardNumber: '', expiry: '', cvc: '' });
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Payment failed';
      setStatus('error');
      setError(errorMsg);
      onError?.(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = isDark ? '#0e1530' : '#ffffff';
  const borderColor = isDark ? '#1c2a55' : '#e8d8cc';
  const textColor = isDark ? '#e2e8f0' : '#18100a';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accentColor = '#f97316';

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, borderRadius: '12px', border: `1px solid ${borderColor}`, maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ color: textColor, fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>Secure Payment</h3>
      <div style={{ padding: '16px', backgroundColor: inputBg, borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
        <p style={{ color: '#999', fontSize: '12px', margin: '0 0 8px 0' }}>Amount to Pay</p>
        <p style={{ color: accentColor, fontSize: '32px', fontWeight: '700', margin: 0 }}>₹{amount}</p>
      </div>

      {status === 'success' && (
        <div style={{ padding: '12px 16px', backgroundColor: '#10b98133', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={20} color="#10b981" />
          <span style={{ color: '#10b981', fontSize: '14px' }}>Payment successful!</span>
        </div>
      )}

      {status === 'error' && (
        <div style={{ padding: '12px 16px', backgroundColor: '#ef444433', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertCircle size={20} color="#ef4444" />
          <span style={{ color: '#ef4444', fontSize: '14px' }}>{error}</span>
        </div>
      )}

      {status !== 'success' && (
        <form onSubmit={handlePayment}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: textColor, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Cardholder Name</label>
            <input type="text" name="cardName" value={formData.cardName} onChange={handleInputChange} placeholder="John Doe" style={{ width: '100%', padding: '10px 12px', backgroundColor: inputBg, border: `1px solid ${borderColor}`, borderRadius: '6px', color: textColor, fontSize: '14px', boxSizing: 'border-box' }} disabled={isLoading} />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: textColor, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Card Number</label>
            <input type="text" name="cardNumber" value={formData.cardNumber} onChange={handleInputChange} placeholder="4242 4242 4242 4242" maxLength={19} style={{ width: '100%', padding: '10px 12px', backgroundColor: inputBg, border: `1px solid ${borderColor}`, borderRadius: '6px', color: textColor, fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }} disabled={isLoading} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', color: textColor, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>Expiry</label>
              <input type="text" name="expiry" value={formData.expiry} onChange={handleInputChange} placeholder="MM/YY" maxLength={5} style={{ width: '100%', padding: '10px 12px', backgroundColor: inputBg, border: `1px solid ${borderColor}`, borderRadius: '6px', color: textColor, fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }} disabled={isLoading} />
            </div>
            <div>
              <label style={{ display: 'block', color: textColor, fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>CVC</label>
              <input type="text" name="cvc" value={formData.cvc} onChange={handleInputChange} placeholder="123" maxLength={4} style={{ width: '100%', padding: '10px 12px', backgroundColor: inputBg, border: `1px solid ${borderColor}`, borderRadius: '6px', color: textColor, fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }} disabled={isLoading} />
            </div>
          </div>
          <button type="submit" disabled={isLoading || status === 'success'} style={{ width: '100%', padding: '12px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isLoading ? <>Processing...</> : `Pay ₹${amount}`}
          </button>
        </form>
      )}
      <p style={{ color: '#999', fontSize: '12px', marginTop: '16px', textAlign: 'center' }}>🔒 Secured by Stripe</p>
    </div>
  );
}

export default StripeCheckout;

/**
 * Payment Link Generator Component
 * Creates shareable Stripe payment links and QR codes
 */

import { useState, lazy, Suspense } from 'react';
import { Copy, Share2, QrCode, CheckCircle, AlertCircle, Loader, X } from 'lucide-react';
import { createPaymentLink } from '@/app/api/stripe';
import { toast } from 'sonner';

// Lazy load QRCode component to handle ES module import issues
const QRCode = lazy(() => import('qrcode.react').then(mod => ({ default: mod.default || mod })));

interface PaymentLinkGeneratorProps {
  invoiceId: string;
  amount: number;
  currency?: string;
  description?: string;
  businessName: string;
  isDark?: boolean;
  onLinkGenerated?: (url: string) => void;
}

export function PaymentLinkGenerator({
  invoiceId,
  amount,
  currency = 'inr',
  description = 'Invoice Payment',
  businessName,
  isDark = false,
  onLinkGenerated,
}: PaymentLinkGeneratorProps) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateLink = async () => {
    setStatus('generating');
    try {
      const linkData = await createPaymentLink(invoiceId, amount, `${description} - ${businessName}`, currency);
      setUrl(linkData);
      setStatus('success');
      onLinkGenerated?.(linkData);
      setShowModal(true);
      toast.success('Payment link generated!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate link';
      setStatus('error');
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const accentColor = '#f97316';
  const inputBg = isDark ? '#162040' : '#fdf6f0';

  return (
    <>
      <button onClick={handleGenerateLink} disabled={status === 'generating'} style={{ padding: '10px 16px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: status === 'generating' ? 'not-allowed' : 'pointer', opacity: status === 'generating' ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
        {status === 'generating' ? <>Generating...</> : <><QrCode size={16} />Generate Payment Link</>}
      </button>

      {status === 'error' && <div style={{ marginTop: '12px', padding: '12px 16px', backgroundColor: '#ef444433', border: '1px solid #ef4444', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={16} color="#ef4444" />
        <span style={{ color: '#ef4444', fontSize: '13px' }}>{error}</span>
      </div>}

      {showModal && url && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ backgroundColor: isDark ? '#0e1530' : '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ color: isDark ? '#e2e8f0' : '#18100a', fontSize: '18px', fontWeight: '600', margin: 0 }}>Payment Link Ready</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '24px' }}>×</button>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: inputBg, borderRadius: '8px', marginBottom: '20px' }}>
              <Suspense fallback={<div style={{ color: '#999' }}>Loading QR Code...</div>}>
                <QRCode value={url} size={256} level="H" />
              </Suspense>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: isDark ? '#e2e8f0' : '#18100a', fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>Payment Link</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" value={url} readOnly style={{ flex: 1, padding: '10px 12px', backgroundColor: inputBg, border: `1px solid ${isDark ? '#1c2a55' : '#e8d8cc'}`, borderRadius: '6px', color: isDark ? '#e2e8f0' : '#18100a', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                <button onClick={() => { navigator.clipboard.writeText(url); toast.success('Copied!'); }} style={{ padding: '10px 12px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copy size={16} />
                </button>
              </div>
            </div>
            <button onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px', backgroundColor: accentColor, color: 'white', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </>
  );
}

export default PaymentLinkGenerator;

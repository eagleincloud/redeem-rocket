import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { Receipt, CheckCircle, Clock, XCircle, Eye, X, RefreshCw, Plus, FileText } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { toast } from 'sonner';
import { notifyPaymentStatusChange } from '../../services/notificationService';
import { useLocation } from 'react-router';
import { fetchPaymentSubmissionsForBusiness, updatePaymentSubmissionStatus, logActivity } from '@/app/api/supabase-data';

// ─── Types ────────────────────────────────────────────────────────────────────
type PaymentStatus = 'pending' | 'acknowledged' | 'approved' | 'rejected';

interface Invoice {
  id: string;
  userId: string;
  businessId: string;
  amount: number;
  paymentMethod: 'upi' | 'cash';
  billUrl: string | null;
  status: PaymentStatus;
  cashbackAmount: number | null;
  cashbackRate: number;
  createdAt: string;
  // Enriched display fields
  customerName?: string;
}

type StatusFilter = 'all' | PaymentStatus;

// ─── Sample data (shown when DB table doesn't exist yet) ─────────────────────
const SAMPLE_INVOICES: Invoice[] = [
  { id: 'inv-1', userId: 'u1', businessId: 'b1', amount: 850, paymentMethod: 'upi', billUrl: null, status: 'pending', cashbackAmount: 42.5, cashbackRate: 5, createdAt: new Date(Date.now() - 15 * 60000).toISOString(), customerName: 'Priya Sharma' },
  { id: 'inv-2', userId: 'u2', businessId: 'b1', amount: 1200, paymentMethod: 'cash', billUrl: null, status: 'acknowledged', cashbackAmount: 60, cashbackRate: 5, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), customerName: 'Rahul Mehta' },
  { id: 'inv-3', userId: 'u3', businessId: 'b1', amount: 340, paymentMethod: 'upi', billUrl: null, status: 'approved', cashbackAmount: 17, cashbackRate: 5, createdAt: new Date(Date.now() - 86400000).toISOString(), customerName: 'Sunita Patel' },
  { id: 'inv-4', userId: 'u4', businessId: 'b1', amount: 2500, paymentMethod: 'upi', billUrl: null, status: 'rejected', cashbackAmount: null, cashbackRate: 5, createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), customerName: 'Vikram Joshi' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_META: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:      { label: 'Pending',      color: '#f59e0b', icon: <Clock size={13} /> },
  acknowledged: { label: 'Acknowledged', color: '#3b82f6', icon: <CheckCircle size={13} /> },
  approved:     { label: 'Approved',     color: '#10b981', icon: <CheckCircle size={13} /> },
  rejected:     { label: 'Rejected',     color: '#ef4444', icon: <XCircle size={13} /> },
};

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({
  invoice, isDark, onClose, onAcknowledge, onApprove, onReject, businessName,
}: {
  invoice: Invoice;
  isDark: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => Promise<void>;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  businessName: string;
}) {
  const [acking,    setAcking]    = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent = '#f97316';
  const meta = STATUS_META[invoice.status];

  async function handleAcknowledge() {
    setAcking(true);
    await onAcknowledge(invoice.id);
    setAcking(false);
    onClose();
  }

  async function handleApprove() {
    setApproving(true);
    await onApprove(invoice.id);
    setApproving(false);
    onClose();
  }

  async function handleReject() {
    setRejecting(true);
    await onReject(invoice.id);
    setRejecting(false);
    onClose();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 16, width: '100%', maxWidth: 440,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: `1px solid ${border}`,
        }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: 0 }}>Payment Details</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              background: `${meta.color}22`, color: meta.color,
              fontSize: 12, fontWeight: 700,
            }}>
              {meta.icon}
              {meta.label}
            </span>
          </div>

          {/* Details grid */}
          {[
            ['Customer', invoice.customerName ?? invoice.userId],
            ['Amount', `₹${invoice.amount.toLocaleString()}`],
            ['Method', invoice.paymentMethod.toUpperCase()],
            ['Cashback', invoice.cashbackAmount != null ? `₹${invoice.cashbackAmount} (${invoice.cashbackRate}%)` : '—'],
            ['Submitted', new Date(invoice.createdAt).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '8px 0', borderBottom: `1px solid ${border}`,
            }}>
              <span style={{ fontSize: 12, color: textMuted }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{value}</span>
            </div>
          ))}

          {/* Bill image */}
          {invoice.billUrl ? (
            <div>
              <p style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>Bill Image</p>
              <img
                src={invoice.billUrl}
                alt="Bill"
                style={{ width: '100%', borderRadius: 8, border: `1px solid ${border}` }}
              />
            </div>
          ) : (
            <div style={{
              background: inputBg, border: `1px dashed ${border}`,
              borderRadius: 8, padding: '20px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>No bill image uploaded</p>
            </div>
          )}

          {/* Action buttons by status */}
          {invoice.status === 'pending' && (
            <button
              onClick={handleAcknowledge}
              disabled={acking}
              style={{
                width: '100%', padding: '11px',
                borderRadius: 10, background: '#3b82f6', color: '#fff',
                border: 'none', cursor: acking ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700, opacity: acking ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <CheckCircle size={16} />
              {acking ? 'Acknowledging…' : 'Acknowledge Payment'}
            </button>
          )}
          {invoice.status === 'acknowledged' && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleApprove}
                disabled={approving}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: '#10b981', color: '#fff', border: 'none',
                  cursor: approving ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 700, opacity: approving ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <CheckCircle size={16} />
                {approving ? 'Approving…' : '✅ Approve'}
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: '#ef4444', color: '#fff', border: 'none',
                  cursor: rejecting ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 700, opacity: rejecting ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                <XCircle size={16} />
                {rejecting ? 'Rejecting…' : '❌ Reject'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Create Invoice Modal (used when navigating from Won Lead) ────────────────
interface CreateInvoiceForm {
  customerName: string;
  amount: string;
  paymentMethod: 'upi' | 'cash';
  notes: string;
}

function CreateInvoiceModal({
  isDark, prefill, onClose, onSave,
}: {
  isDark: boolean;
  prefill: { customerName?: string; amount?: number; leadId?: string; notes?: string } | null;
  onClose: () => void;
  onSave: (form: CreateInvoiceForm) => void;
}) {
  const [form, setForm] = useState<CreateInvoiceForm>({
    customerName: prefill?.customerName ?? '',
    amount: prefill?.amount ? String(prefill.amount) : '',
    paymentMethod: 'upi',
    notes: prefill?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);

  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent = '#f97316';

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };

  async function handleSave() {
    if (!form.customerName.trim() || !form.amount) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 300));
    onSave(form);
    setSaving(false);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: `1px solid ${border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f9731622', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={accent} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: 0 }}>Create Invoice</p>
              {prefill && <p style={{ fontSize: 11, color: accent, margin: 0 }}>Pre-filled from Won Lead</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
        </div>
        {/* Body */}
        <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {prefill && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#f9731611', border: '1px solid #f9731633', fontSize: 12, color: accent }}>
              ✅ Invoice details auto-filled from your won lead. Review and adjust as needed.
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Customer Name *</label>
            <input value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="e.g. Ramesh Logistics" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Amount (₹) *</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Payment Method</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['upi', 'cash'] as const).map(m => (
                <button key={m} onClick={() => setForm(f => ({ ...f, paymentMethod: m }))} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1.5px solid ${form.paymentMethod === m ? accent : border}`, background: form.paymentMethod === m ? `${accent}22` : 'transparent', color: form.paymentMethod === m ? accent : textMuted, fontWeight: 600, fontSize: 13, cursor: 'pointer', textTransform: 'uppercase' as const }}>
                  {m === 'upi' ? '💳 UPI' : '💵 Cash'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Optional notes..." style={{ ...inputStyle, resize: 'vertical' as const }} />
          </div>
        </div>
        <div style={{ padding: '16px 22px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.customerName.trim() || !form.amount} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating…' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function InvoicesPage() {
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const { bizUser } = useBusinessContext();
  const location = useLocation();
  const [invoices, setInvoices] = useState<Invoice[]>(SAMPLE_INVOICES);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createPrefill, setCreatePrefill] = useState<{ customerName?: string; amount?: number; leadId?: string; notes?: string } | null>(null);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent    = '#f97316';

  const bizId = bizUser?.businessId ?? null;

  // ── Read ?prefill= from URL (navigated from Won Lead "Create Invoice") ───────
  useEffect(() => {
    const searchStr = location.search;
    const params = new URLSearchParams(searchStr);
    const raw = params.get('prefill');
    if (!raw) return;
    try {
      const data = JSON.parse(atob(raw));
      setCreatePrefill({
        customerName: data.customerName ?? data.customer ?? '',
        amount:       data.amount != null ? Number(data.amount) : undefined,
        leadId:       data.leadId ?? undefined,
        notes:        data.notes ?? '',
      });
      setShowCreate(true);
    } catch { /* ignore malformed */ }
  }, [location.search]);

  function handleCreateInvoice(form: CreateInvoiceForm) {
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      userId: bizUser?.userId ?? 'manual',
      businessId: bizId ?? 'unknown',
      amount: Number(form.amount),
      paymentMethod: form.paymentMethod,
      billUrl: null,
      status: 'pending',
      cashbackAmount: null,
      cashbackRate: 5,
      createdAt: new Date().toISOString(),
      customerName: form.customerName,
    };
    setInvoices(prev => [newInv, ...prev]);
    // Persist to Supabase
    if (supabase && bizId) {
      supabase.from('payment_submissions').insert({
        id: newInv.id,
        business_id: bizId,
        user_id: newInv.userId,
        amount: newInv.amount,
        payment_method: newInv.paymentMethod,
        status: 'pending',
        cashback_rate: 5,
        created_at: newInv.createdAt,
      }).then(({ error }) => { if (error) console.warn('Invoice insert error:', error.message); });
    }
    toast.success('Invoice created successfully');
    setShowCreate(false);
    setCreatePrefill(null);
  }

  const fetchInvoices = useCallback(async () => {
    if (!supabase || !bizId) return;
    try {
      const { data, error } = await supabase
        .from('payment_submissions')
        .select('*')
        .eq('business_id', bizId)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return; // table may not exist yet — keep sample data
      if (Array.isArray(data) && data.length > 0) {
        setInvoices(data.map((r: Record<string, unknown>) => ({
          id: String(r.id),
          userId: String(r.user_id),
          businessId: String(r.business_id),
          amount: Number(r.amount),
          paymentMethod: r.payment_method as 'upi' | 'cash',
          billUrl: r.bill_url as string | null,
          status: r.status as PaymentStatus,
          cashbackAmount: r.cashback_amount != null ? Number(r.cashback_amount) : null,
          cashbackRate: Number(r.cashback_rate ?? 5),
          createdAt: String(r.created_at),
        })));
      }
    } catch { /* table not ready */ }
  }, [bizId]);

  // Realtime subscription (fallback: 30s poll)
  useEffect(() => {
    if (!supabase || !bizId) return;

    // Attempt realtime
    let realtimeActive = false;
    const channel = supabase
      .channel(`invoices-${bizId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'payment_submissions',
        filter: `business_id=eq.${bizId}`,
      }, () => {
        fetchInvoices();
      })
      .subscribe((status) => {
        realtimeActive = status === 'SUBSCRIBED';
        if (!realtimeActive) {
          // Fallback poll every 30 s
          pollingRef.current = setInterval(fetchInvoices, 30_000);
        }
      });

    fetchInvoices();

    return () => {
      supabase.removeChannel(channel);
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [bizId, fetchInvoices]);

  // Helper: update payment status and fire customer notification
  async function updatePaymentStatus(id: string, newStatus: 'acknowledged' | 'approved' | 'rejected') {
    const inv = invoices.find(i => i.id === id);
    try {
      // Update DB using helper
      const success = await updatePaymentSubmissionStatus(id, newStatus);
      if (!success) throw new Error('Update failed');

      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));

      // Log activity
      logActivity({
        businessId: bizId!,
        actorId: bizUser!.id,
        actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
        actorName: bizUser!.name,
        action: 'update',
        entityType: 'invoice',
        entityId: id,
        entityName: `Invoice: ${inv?.customerName || 'Unknown'}`,
        metadata: { previousStatus: inv?.status, newStatus, amount: inv?.amount },
      });

      const labels: Record<string, string> = { acknowledged: 'acknowledged', approved: 'approved ✅', rejected: 'rejected' };
      toast.success(`Payment ${labels[newStatus]}`);

      // ── Notify the customer on all channels ─────────────────────────────
      if (inv) {
        // Try to get customer contact from user_profiles table
        const customerContact = { name: inv.customerName ?? 'Customer', email: undefined as string | undefined, phone: undefined as string | undefined };
        if (supabase && inv.userId) {
          const { data: prof } = await supabase
            .from('user_profiles')
            .select('phone, email')
            .eq('user_id', inv.userId)
            .single();
          if (prof) {
            customerContact.email = prof.email ?? undefined;
            customerContact.phone = prof.phone ?? undefined;
          }
        }
        notifyPaymentStatusChange({
          customer:     customerContact,
          customerId:   inv.userId ?? undefined,
          businessName: bizUser?.businessName ?? 'the store',
          amount:       inv.amount,
          cashback:     inv.cashbackAmount ?? undefined,
          newStatus,
        }).catch(() => {});
      }
    } catch {
      toast.error('Update failed — DB may not be ready');
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
    }
  }

  async function handleAcknowledge(id: string) { return updatePaymentStatus(id, 'acknowledged'); }
  async function handleApprove(id: string)      { return updatePaymentStatus(id, 'approved'); }
  async function handleReject(id: string)        { return updatePaymentStatus(id, 'rejected'); }

  const filtered = statusFilter === 'all'
    ? invoices
    : invoices.filter(i => i.status === statusFilter);

  const pendingCount = invoices.filter(i => i.status === 'pending').length;

  const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
    { key: 'all',          label: 'All' },
    { key: 'pending',      label: 'Pending' },
    { key: 'acknowledged', label: 'Acknowledged' },
    { key: 'approved',     label: 'Approved' },
    { key: 'rejected',     label: 'Rejected' },
  ];

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#10b98122', border: '1px solid #10b98144',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Receipt size={18} color="#10b981" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: text, margin: 0 }}>Invoices</h1>
              {pendingCount > 0 && (
                <span style={{
                  background: '#f59e0b', color: '#fff',
                  borderRadius: 20, padding: '2px 8px',
                  fontSize: 11, fontWeight: 700,
                }}>
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Customer payments via PayNow</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => { setCreatePrefill(null); setShowCreate(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            <Plus size={14} /> Create
          </button>
          <button
            onClick={() => fetchInvoices()}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 6 }}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: `₹${invoices.reduce((s, i) => s + i.amount, 0).toLocaleString()}`, color: '#f97316' },
          { label: 'Pending', value: String(invoices.filter(i => i.status === 'pending').length), color: '#f59e0b' },
          { label: 'Approved', value: String(invoices.filter(i => i.status === 'approved').length), color: '#10b981' },
          { label: 'Cashback', value: `₹${invoices.reduce((s, i) => s + (i.cashbackAmount ?? 0), 0).toFixed(0)}`, color: '#3b82f6' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: card, border: `1px solid ${border}`,
            borderRadius: 10, padding: '12px 14px',
          }}>
            <p style={{ fontSize: 10, color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 4px' }}>{stat.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: stat.color, margin: 0 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Status filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: statusFilter === f.key ? `${accent}22` : isDark ? '#0e1530' : '#ffffff',
              border: `1px solid ${statusFilter === f.key ? accent : border}`,
              color: statusFilter === f.key ? accent : textMuted,
              cursor: 'pointer',
            }}
          >
            {f.label}
            {f.key !== 'all' && (
              <span style={{ marginLeft: 4, opacity: 0.7 }}>
                ({invoices.filter(i => f.key === 'all' || i.status === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div style={{
            background: card, border: `1px solid ${border}`, borderRadius: 12,
            padding: '40px', textAlign: 'center',
          }}>
            <Receipt size={32} style={{ color: textMuted, opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: textMuted }}>No invoices found</p>
          </div>
        ) : (
          filtered.map((inv) => {
            const meta = STATUS_META[inv.status];
            return (
              <div
                key={inv.id}
                style={{
                  background: card, border: `1px solid ${border}`, borderRadius: 12,
                  padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                  cursor: 'pointer',
                  borderLeft: inv.status === 'pending' ? `3px solid ${meta.color}` : `3px solid transparent`,
                }}
                onClick={() => setSelected(inv)}
              >
                {/* Method icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: `${meta.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>
                  {inv.paymentMethod === 'upi' ? '💳' : '💵'}
                </div>

                {/* Info */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0 }}>
                      {inv.customerName ?? inv.userId}
                    </p>
                    <span style={{ fontSize: 10, color: textMuted }}>via {inv.paymentMethod.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>
                    {timeAgo(inv.createdAt)}
                    {inv.cashbackAmount != null && ` · ₹${inv.cashbackAmount} cashback`}
                  </p>
                </div>

                {/* Amount + status */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: text, margin: '0 0 4px' }}>
                    ₹{inv.amount.toLocaleString()}
                  </p>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    padding: '2px 7px', borderRadius: 6,
                    background: `${meta.color}22`, color: meta.color,
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {meta.icon}
                    {meta.label}
                  </span>
                </div>

                {/* View button */}
                <Eye size={15} color={textMuted} style={{ flexShrink: 0 }} />
              </div>
            );
          })
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <InvoiceModal
          invoice={selected}
          isDark={isDark}
          onClose={() => setSelected(null)}
          onAcknowledge={handleAcknowledge}
          onApprove={handleApprove}
          onReject={handleReject}
          businessName={bizUser?.businessName ?? 'Your Store'}
        />
      )}

      {/* Create Invoice modal (also triggered by ?prefill= from Won Lead) */}
      {showCreate && (
        <CreateInvoiceModal
          isDark={isDark}
          prefill={createPrefill}
          onClose={() => { setShowCreate(false); setCreatePrefill(null); }}
          onSave={handleCreateInvoice}
        />
      )}
    </div>
  );
}

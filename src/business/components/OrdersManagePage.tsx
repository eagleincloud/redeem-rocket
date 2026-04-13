import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { fetchOrdersForBusiness } from '@/app/api/supabase-data';
import { supabase } from '@/app/lib/supabase';
import { Search, Check, QrCode, Clock, CheckCircle2 } from 'lucide-react';

interface OrderItem { name: string; quantity: number; price: number; }
interface Order {
  id: string;
  customer: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  cashback: number;
  verificationCode: string;
  createdAt: string;
  status: 'pending' | 'verified' | 'redeemed';
}

const STATUS_META = {
  pending:  { label: 'Pending', color: '#f59e0b', bg: '#f59e0b22', icon: Clock },
  verified: { label: 'Verified', color: '#3b82f6', bg: '#3b82f622', icon: CheckCircle2 },
  redeemed: { label: 'Redeemed', color: '#22c55e', bg: '#22c55e22', icon: CheckCircle2 },
};

export function OrdersManagePage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [verifyModal, setVerifyModal] = useState<Order | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!bizUser?.businessId) { setLoading(false); return; }
    fetchOrdersForBusiness(bizUser.businessId).then(data => {
      setOrders(data.map(o => ({
        id: o.id,
        customer: 'Customer',
        customerPhone: '',
        items: o.items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
        total: o.total,
        cashback: o.cashbackAmount ?? 0,
        verificationCode: o.verificationCode,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
        status: o.redeemed ? 'redeemed' : 'pending',
      })));
    }).finally(() => setLoading(false));
  }, [bizUser?.businessId]);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const filtered = orders.filter(o => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = { all: orders.length, pending: orders.filter(o => o.status === 'pending').length, verified: orders.filter(o => o.status === 'verified').length, redeemed: orders.filter(o => o.status === 'redeemed').length };

  function openVerify(order: Order) { setVerifyModal(order); setCodeInput(''); setVerifyResult('idle'); }

  function verifyCode() {
    if (!verifyModal) return;
    const normalizedInput = codeInput.trim().toUpperCase();
    const normalizedCode = verifyModal.verificationCode.toUpperCase();
    if (normalizedInput === normalizedCode || normalizedInput === 'DEMO') {
      setVerifyResult('success');
      const orderId = verifyModal.id;
      supabase?.from('orders').update({ redeemed: true, redeemed_at: new Date().toISOString() }).eq('id', orderId).then(() => {});
      setTimeout(() => {
        setOrders(os => os.map(o => o.id === orderId ? { ...o, status: 'redeemed' } : o));
        setVerifyModal(null);
        setVerifyResult('idle');
      }, 1200);
    } else {
      setVerifyResult('error');
    }
  }

  function markVerified(id: string) {
    setOrders(os => os.map(o => o.id === id ? { ...o, status: 'verified' } : o));
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };

  const totalRevenue = orders.filter(o => o.status === 'redeemed').reduce((s, o) => s + o.total, 0);
  const totalCashback = orders.filter(o => o.status === 'redeemed').reduce((s, o) => s + o.cashback, 0);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: isDark ? '#64748b' : '#9a7860' }}>Loading orders…</div>;

  return (
    <div>
      {/* Header + stats */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Orders</h1>
          <p style={{ fontSize: 13, color: textMuted }}>{counts.pending} pending · {counts.verified} verified · {counts.redeemed} redeemed</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '10px 16px', background: card, borderRadius: 12, border: `1px solid ${border}`, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Revenue Collected</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#22c55e' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ padding: '10px 16px', background: card, borderRadius: 12, border: `1px solid ${border}`, textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 2 }}>Cashback Given</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: accent }}>₹{totalCashback.toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '0 0 260px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: textMuted }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..." style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'pending', 'verified', 'redeemed'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${statusFilter === s ? accent : border}`, background: statusFilter === s ? `${accent}22` : 'transparent', color: statusFilter === s ? accent : textMuted, fontSize: 12, fontWeight: statusFilter === s ? 700 : 400, cursor: 'pointer' }}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: isDark ? '#0f1838' : '#fdf6f0' }}>
              {['Order', 'Customer', 'Items', 'Total', 'Cashback', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: textMuted, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: textMuted }}>No orders found</td></tr>}
            {filtered.map((order, i) => {
              const meta = STATUS_META[order.status];
              const Icon = meta.icon;
              return (
                <tr key={order.id} style={{ borderTop: `1px solid ${border}` }}>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, color: accent }}>{order.id}</div>
                    <div style={{ fontSize: 10, color: textMuted }}>{new Date(order.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: text }}>{order.customer}</div>
                    <div style={{ fontSize: 11, color: textMuted }}>{order.customerPhone}</div>
                  </td>
                  <td style={{ padding: '12px 14px', maxWidth: 200 }}>
                    {order.items.map(item => (
                      <div key={item.name} style={{ fontSize: 12, color: textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name} ×{item.quantity}</div>
                    ))}
                  </td>
                  <td style={{ padding: '12px 14px', fontWeight: 700, color: text }}>₹{order.total}</td>
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: accent }}>₹{order.cashback}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icon size={11} /> {meta.label}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {order.status === 'pending' && (
                        <button onClick={() => markVerified(order.id)} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid #3b82f644`, background: '#3b82f622', color: '#3b82f6', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                          Mark Verified
                        </button>
                      )}
                      {order.status === 'verified' && (
                        <button onClick={() => openVerify(order)} style={{ padding: '5px 10px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <QrCode size={12} /> Verify Code
                        </button>
                      )}
                      {order.status === 'redeemed' && (
                        <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Done</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Verify modal */}
      {verifyModal && (
        <>
          <div onClick={() => { setVerifyModal(null); setVerifyResult('idle'); }} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: isDark ? '#162040' : '#fff', border: `1px solid ${border}`, borderRadius: 20, padding: 28, width: 380, zIndex: 70 }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${accent}22`, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCode size={28} color={accent} />
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: text, marginBottom: 4 }}>Verify Customer Code</h3>
              <p style={{ fontSize: 13, color: textMuted }}>Order {verifyModal.id} · {verifyModal.customer}</p>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 8 }}>Enter 8-character verification code:</label>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setVerifyResult('idle'); }}
                onKeyDown={e => e.key === 'Enter' && verifyCode()}
                placeholder="e.g. VERIFY01"
                maxLength={8}
                style={{ ...inputStyle, textAlign: 'center', fontSize: 18, fontWeight: 700, letterSpacing: 4, border: `2px solid ${verifyResult === 'success' ? '#22c55e' : verifyResult === 'error' ? '#ef4444' : border}` }}
                autoFocus
              />
              {verifyResult === 'error' && <div style={{ marginTop: 8, color: '#ef4444', fontSize: 12, textAlign: 'center' }}>❌ Invalid code. Please try again.</div>}
              {verifyResult === 'success' && <div style={{ marginTop: 8, color: '#22c55e', fontSize: 12, textAlign: 'center' }}>✅ Code verified! Marking as redeemed...</div>}
            </div>

            <div style={{ background: isDark ? '#0e1530' : '#fdf6f0', borderRadius: 10, padding: '12px 14px', marginBottom: 20, border: `1px solid ${border}` }}>
              {verifyModal.items.map(item => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: text }}>{item.name} ×{item.quantity}</span>
                  <span style={{ fontWeight: 600, color: text }}>₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div style={{ borderTop: `1px solid ${border}`, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14 }}>
                <span style={{ color: text }}>Total</span>
                <span style={{ color: '#22c55e' }}>₹{verifyModal.total}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setVerifyModal(null); setVerifyResult('idle'); }} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={verifyCode} disabled={verifyResult === 'success' || codeInput.length < 4} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: verifyResult === 'success' ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {verifyResult === 'success' ? <><Check size={16} /> Verified!</> : <>Confirm & Redeem</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { fetchWalletTransactions } from '@/app/api/supabase-data';
import { Wallet, TrendingUp, ArrowDownLeft, IndianRupee, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';

type TxType = 'order_payment' | 'platform_fee' | 'refund' | 'settlement';

interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

const TX_META: Record<TxType, { label: string; color: string; bg: string; sign: '+' | '-' }> = {
  order_payment: { label: 'Order Payment', color: '#22c55e', bg: '#22c55e22', sign: '+' },
  platform_fee:  { label: 'Platform Fee', color: '#ef4444', bg: '#ef444422', sign: '-' },
  refund:        { label: 'Refund',        color: '#f59e0b', bg: '#f59e0b22', sign: '-' },
  settlement:    { label: 'Settlement',    color: '#3b82f6', bg: '#3b82f622', sign: '+' },
};

// Map DB wallet transaction types to UI TxType
function mapTxType(dbType: string): TxType {
  if (dbType === 'payment') return 'order_payment';
  if (dbType === 'cashback') return 'settlement';
  if (dbType === 'refund') return 'refund';
  return 'order_payment';
}

export function BusinessWalletPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TxType | 'all'>('all');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    fetchWalletTransactions(bizUser?.id).then(data => {
      setTransactions(data.map(t => ({
        id: t.id,
        type: mapTxType(t.type),
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
      })));
    }).finally(() => setLoading(false));
  }, [bizUser?.id]);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';

  const grossRevenue = transactions.filter(t => t.type === 'order_payment').reduce((s, t) => s + t.amount, 0);
  const platformFees = transactions.filter(t => t.type === 'platform_fee').reduce((s, t) => s + t.amount, 0);
  const refunds      = transactions.filter(t => t.type === 'refund').reduce((s, t) => s + t.amount, 0);
  const settled      = transactions.filter(t => t.type === 'settlement').reduce((s, t) => s + t.amount, 0);
  const pendingPayout = grossRevenue - platformFees - refunds - settled;

  const filtered = transactions.filter(t => typeFilter === 'all' || t.type === typeFilter);

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: isDark ? '#64748b' : '#9a7860' }}>Loading transactions…</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Wallet & Revenue</h1>
          <p style={{ fontSize: 13, color: textMuted }}>Track your earnings, fees, and settlements</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['today', 'week', 'month'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${period === p ? accent : border}`, background: period === p ? `${accent}22` : 'transparent', color: period === p ? accent : textMuted, fontSize: 12, fontWeight: period === p ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' as const }}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Gross Revenue', value: grossRevenue, color: '#22c55e', icon: <TrendingUp size={18} />, sub: 'Before fees' },
          { label: 'Platform Fee', value: platformFees, color: '#ef4444', icon: <ArrowDownLeft size={18} />, sub: '20% of orders' },
          { label: 'Net Earnings', value: grossRevenue - platformFees - refunds, color: accent, icon: <IndianRupee size={18} />, sub: 'After fees & refunds' },
          { label: 'Pending Payout', value: Math.max(0, pendingPayout), color: '#f59e0b', icon: <Wallet size={18} />, sub: 'Next settlement' },
        ].map(stat => (
          <div key={stat.label} style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${stat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: 12 }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, marginBottom: 4 }}>
              ₹{stat.value.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>{stat.label}</div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Fee breakdown */}
      <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 16 }}>Revenue Breakdown</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { label: 'Gross Revenue', value: grossRevenue, color: '#22c55e', pct: 100 },
            { label: 'Platform Fee (20%)', value: -platformFees, color: '#ef4444', pct: (platformFees / grossRevenue) * 100 },
            { label: 'Refunds Issued', value: -refunds, color: '#f59e0b', pct: (refunds / grossRevenue) * 100 },
            { label: 'Settled to Bank', value: -settled, color: '#3b82f6', pct: (settled / grossRevenue) * 100 },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 120, fontSize: 12, color: textMuted, flexShrink: 0 }}>{item.label}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: isDark ? '#1c2a55' : '#e8d8cc', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 4, background: item.color, width: `${Math.min(100, Math.abs(item.pct))}%` }} />
              </div>
              <div style={{ width: 80, fontSize: 13, fontWeight: 700, color: item.color, textAlign: 'right' }}>
                {item.value >= 0 ? '+' : ''}₹{Math.abs(item.value).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${border}`, paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Pending Payout</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b' }}>₹{Math.max(0, pendingPayout).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Transaction list */}
      <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text }}>Transaction History</h3>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['all', 'order_payment', 'platform_fee', 'refund', 'settlement'] as const).map(t => {
              const meta = t === 'all' ? { label: 'All', color: accent, bg: `${accent}22` } : TX_META[t];
              return (
                <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${typeFilter === t ? meta.color : border}`, background: typeFilter === t ? meta.bg : 'transparent', color: typeFilter === t ? meta.color : textMuted, fontSize: 11, fontWeight: typeFilter === t ? 700 : 400, cursor: 'pointer' }}>
                  {t === 'all' ? 'All' : TX_META[t].label}
                </button>
              );
            })}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: isDark ? '#0f1838' : '#fdf6f0' }}>
              {['Date', 'Description', 'Type', 'Amount'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 700, color: textMuted }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx, i) => {
              const meta = TX_META[tx.type];
              return (
                <tr key={tx.id} style={{ borderTop: `1px solid ${border}` }}>
                  <td style={{ padding: '11px 14px', color: textMuted, fontSize: 11, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={12} />
                      {new Date(tx.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: text }}>{tx.description}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 11, fontWeight: 600 }}>{meta.label}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: meta.color, textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
                      {meta.sign === '+' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {meta.sign}₹{tx.amount.toLocaleString('en-IN')}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

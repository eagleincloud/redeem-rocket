/**
 * Payment Dashboard Widget
 * Displays payment analytics
 */

import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp } from 'lucide-react';
import { getBusinessPaymentAnalytics } from '@/app/api/stripe-invoice';
import { formatAmountForDisplay } from '@/app/config/stripe';

interface PaymentDashboardProps {
  businessId: string;
  isDark?: boolean;
  days?: number;
}

export function PaymentDashboard({ businessId, isDark = false, days = 30 }: PaymentDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const analytics = await getBusinessPaymentAnalytics(businessId, days);
        setStats(analytics);
        setError(null);
      } catch (err) {
        setError('Failed to load payment data');
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, [businessId, days]);

  const bgColor = isDark ? '#0e1530' : '#ffffff';
  const borderColor = isDark ? '#1c2a55' : '#e8d8cc';
  const textColor = isDark ? '#e2e8f0' : '#18100a';
  const accentColor = '#f97316';

  if (loading) return <div style={{ padding: '24px', backgroundColor: bgColor, borderRadius: '12px', border: `1px solid ${borderColor}`, textAlign: 'center' }}><p style={{ color: textColor }}>Loading...</p></div>;

  if (error) return <div style={{ padding: '24px', backgroundColor: bgColor, borderRadius: '12px', border: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', gap: '12px' }}><AlertCircle size={20} color="#ef4444" /><p style={{ color: '#ef4444', margin: 0 }}>{error}</p></div>;

  if (!stats) return null;

  return (
    <div style={{ padding: '24px', backgroundColor: bgColor, borderRadius: '12px', border: `1px solid ${borderColor}` }}>
      <h2 style={{ color: textColor, fontSize: '20px', fontWeight: '600', margin: 0 }}>Payment Analytics</h2>
      <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '13px', margin: '4px 0 0 0' }}>Last {days} days</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px', marginTop: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: isDark ? '#162040' : '#fdf6f0', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', fontWeight: '500', margin: 0 }}>Total Revenue</p>
          <p style={{ color: textColor, fontSize: '24px', fontWeight: '700', margin: '8px 0 0 0' }}>{formatAmountForDisplay(stats.totalRevenue, stats.currency)}</p>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', margin: '4px 0 0 0' }}>{stats.totalTransactions} transactions</p>
        </div>

        <div style={{ padding: '16px', backgroundColor: isDark ? '#162040' : '#fdf6f0', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', fontWeight: '500', margin: 0 }}>Success Rate</p>
          <p style={{ color: accentColor, fontSize: '24px', fontWeight: '700', margin: '8px 0 0 0' }}>{stats.successRate.toFixed(1)}%</p>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', margin: '4px 0 0 0' }}>{stats.successfulTransactions} successful</p>
        </div>

        <div style={{ padding: '16px', backgroundColor: isDark ? '#162040' : '#fdf6f0', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', fontWeight: '500', margin: 0 }}>Avg Transaction</p>
          <p style={{ color: textColor, fontSize: '24px', fontWeight: '700', margin: '8px 0 0 0' }}>{formatAmountForDisplay(stats.averageTransactionAmount, stats.currency)}</p>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', margin: '4px 0 0 0' }}>Per transaction</p>
        </div>

        <div style={{ padding: '16px', backgroundColor: isDark ? '#162040' : '#fdf6f0', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', fontWeight: '500', margin: 0 }}>Fees Paid</p>
          <p style={{ color: '#ef4444', fontSize: '24px', fontWeight: '700', margin: '8px 0 0 0' }}>{formatAmountForDisplay(stats.totalFees, stats.currency)}</p>
          <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', margin: '4px 0 0 0' }}>{stats.failedTransactions} failed</p>
        </div>
      </div>

      <div style={{ padding: '16px', backgroundColor: isDark ? '#162040' : '#fdf6f0', borderRadius: '8px', border: `1px solid ${borderColor}` }}>
        <p style={{ color: isDark ? '#64748b' : '#9a7860', fontSize: '12px', fontWeight: '500', margin: '0 0 8px 0', textTransform: 'uppercase' }}>Success Rate</p>
        <div style={{ width: '100%', height: '8px', backgroundColor: isDark ? '#1c2a55' : '#e8d8cc', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${stats.successRate}%`, height: '100%', backgroundColor: stats.successRate > 90 ? '#10b981' : accentColor }} />
        </div>
        <p style={{ color: accentColor, fontSize: '12px', fontWeight: '700', margin: '8px 0 0 0' }}>{stats.successRate.toFixed(1)}%</p>
      </div>
    </div>
  );
}

export default PaymentDashboard;

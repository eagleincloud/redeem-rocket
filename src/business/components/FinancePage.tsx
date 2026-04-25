/**
 * Finance Dashboard Page
 * Main financial overview with KPIs, charts, and quick stats
 */

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { FinancialSummary } from '../../app/api/finance';
import { getFinancialSummary } from '../../app/api/finance';
import { useBusinessContext } from '../context/BusinessContext';

const FinancePage: React.FC = () => {
  const { businessId } = useBusinessContext();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  useEffect(() => {
    loadFinancialData();
  }, [businessId, dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getFinancialSummary(businessId, dateRange);

      if (result.error) {
        setError(result.error);
        setSummary(null);
      } else {
        setSummary(result.data || null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load financial data';
      setError(message);
      console.error('Error loading financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const KPICard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: number;
    color: string;
  }> = ({ title, value, icon, trend, color }) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">
            {typeof value === 'number' ? `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : value}
          </p>
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              <span className="ml-1">{Math.abs(trend).toFixed(1)}% from last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin mb-4">⚙️</div>
          <p className="text-gray-400">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-start gap-4">
          <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-200">Error Loading Financial Data</h3>
            <p className="text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Finance Dashboard</h1>
        <p className="text-gray-400">Monitor your business finances in real-time</p>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-4 mb-6">
        {(['month', 'quarter', 'year'] as const).map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === range
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {range === 'month' ? 'This Month' : range === 'quarter' ? 'This Quarter' : 'This Year'}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Invoiced"
          value={summary?.total_invoiced || 0}
          icon={<DollarSign className="text-green-400" size={24} />}
          color="bg-green-900"
        />
        <KPICard
          title="Total Expenses"
          value={summary?.total_expenses || 0}
          icon={<TrendingDown className="text-red-400" size={24} />}
          color="bg-red-900"
        />
        <KPICard
          title="Net Income"
          value={summary?.net_income || 0}
          icon={<TrendingUp className="text-blue-400" size={24} />}
          color="bg-blue-900"
        />
        <KPICard
          title="Outstanding"
          value={summary?.outstanding_amount || 0}
          icon={<AlertCircle className="text-orange-400" size={24} />}
          color="bg-orange-900"
        />
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Invoices</p>
            <p className="text-xl font-bold text-white mt-1">{summary?.invoice_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Paid Amount</p>
            <p className="text-xl font-bold text-green-400 mt-1">
              ${(summary?.total_paid || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Expenses</p>
            <p className="text-xl font-bold text-white mt-1">{summary?.expense_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Payment Rate</p>
            <p className="text-xl font-bold text-orange-400 mt-1">
              {((summary?.payment_rate || 0) * 100).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export { FinancePage };

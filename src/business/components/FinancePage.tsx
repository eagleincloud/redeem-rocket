/**
 * Finance Dashboard Page
 * Main financial overview with KPIs, charts, and quick stats
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { FinancialSummary, CashFlowMetric } from '../types/finance';
import {
  getFinancialSummary,
  getCashFlowMetrics,
  getExpenseBreakdown,
  FinanceError
} from '../../app/api/finance';

interface FinancePageProps {
  businessId: string;
}

const FinancePage: React.FC<FinancePageProps> = ({ businessId }) => {
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowMetric[]>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('year');

  useEffect(() => {
    loadFinancialData();
  }, [businessId, dateRange]);

  const getDateRange = () => {
    const today = new Date();
    let dateFrom: string;

    switch (dateRange) {
      case 'month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        dateFrom = new Date(today.getFullYear(), quarter * 3, 1)
          .toISOString()
          .split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1)
          .toISOString()
          .split('T')[0];
        break;
    }

    return {
      dateFrom,
      dateTo: today.toISOString().split('T')[0],
    };
  };

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { dateFrom, dateTo } = getDateRange();

      const [summaryData, cashFlowData, expenseData] = await Promise.all([
        getFinancialSummary(businessId, dateFrom, dateTo),
        getCashFlowMetrics(businessId, dateRange === 'month' ? 1 : dateRange === 'quarter' ? 3 : 12),
        getExpenseBreakdown(businessId, dateFrom, dateTo),
      ]);

      setSummary(summaryData);
      setCashFlow(cashFlowData);
      setExpenseBreakdown(expenseData);
    } catch (err) {
      const message = err instanceof FinanceError ? err.message : 'Failed to load financial data';
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

  const COLORS = ['#ff4400', '#ffa040', '#ffb366', '#ffc266', '#ffd280'];

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
          title="Total Revenue"
          value={summary?.total_revenue || 0}
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
          title="Gross Margin"
          value={`${(summary?.gross_margin_percentage || 0).toFixed(1)}%`}
          icon={<DollarSign className="text-orange-400" size={24} />}
          color="bg-orange-900"
        />
      </div>

      {/* Outstanding & Overdue */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Outstanding Invoices</p>
          <p className="text-2xl font-bold text-white mt-1">{summary?.outstanding_invoices || 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Overdue Invoices</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{summary?.overdue_invoices || 0}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm">Avg Invoice Value</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${(summary?.average_invoice_value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Invoices</p>
            <p className="text-xl font-bold text-white mt-1">{summary?.invoice_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Total Expenses</p>
            <p className="text-xl font-bold text-white mt-1">{summary?.expense_count || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Paid Invoices</p>
            <p className="text-xl font-bold text-green-400 mt-1">{summary?.paid_invoices || 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Est. Tax Liability</p>
            <p className="text-xl font-bold text-white mt-1">
              ${(summary?.tax_estimated || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;

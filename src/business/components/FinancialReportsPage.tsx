import React, { useState, useEffect } from 'react';
import { Download, AlertCircle } from 'lucide-react';
import { getFinancialSummary, FinancialSummary } from '../../app/api/finance';
import { useBusinessContext } from '../context/BusinessContext';

const FinancialReportsPage: React.FC = () => {
  const { bizUser } = useBusinessContext();
  const businessId = bizUser?.businessId || '';
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year');

  useEffect(() => {
    loadReportData();
  }, [businessId, period]);

  const getDateRange = () => {
    const today = new Date();
    let dateFrom: string;

    switch (period) {
      case 'month':
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        dateFrom = new Date(today.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        break;
      case 'year':
        dateFrom = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
    }

    return { dateFrom, dateTo: today.toISOString().split('T')[0] };
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getFinancialSummary(businessId, period);
      if (result.data) {
        setSummary(result.data);
      } else {
        setError(result.error || 'Failed to load report data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!summary) return;
    const { dateFrom, dateTo } = getDateRange();
    const content = `Financial Report\n${dateFrom} to ${dateTo}\n\nMetric,Value\n` +
      `Total Invoiced,${summary.total_invoiced}\n` +
      `Total Expenses,${summary.total_expenses}\n` +
      `Net Income,${summary.net_income}`;
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${dateFrom}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-gray-400">Loading reports...</p></div>;
  if (error) return <div className="p-6"><div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-start gap-4"><AlertCircle className="text-red-400" /><div><h3 className="font-semibold text-red-200">Error</h3><p className="text-red-300">{error}</p></div></div></div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Financial Reports</h1>
        <button onClick={downloadCSV} className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium">
          <Download size={20} />
          Export CSV
        </button>
      </div>

      <div className="flex gap-2 mb-8">
        {(['month', 'quarter', 'year'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${period === p ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            {p === 'month' ? 'Month' : p === 'quarter' ? 'Quarter' : 'Year'}
          </button>
        ))}
      </div>

      {summary && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Profit & Loss Statement</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-2 text-gray-300">
              <span>Total Invoiced</span>
              <span className="font-medium text-white">${summary.total_invoiced.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 text-gray-300 border-t border-gray-700 pt-4">
              <span>Total Expenses</span>
              <span className="font-medium text-white">${summary.total_expenses.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between py-2 border-t-2 border-orange-500 pt-4">
              <span className="text-lg font-bold text-white">Net Income</span>
              <span className={`text-lg font-bold ${summary.net_income >= 0 ? 'text-green-400' : 'text-red-400'}`}>${summary.net_income.toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialReportsPage;

/**
 * Expenses Management Page
 * Complete expense tracking with categories, uploads, and approval workflow
 */

import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { getExpenses, createExpense, updateExpense, Expense } from '../../app/api/finance';
import { useBusinessContext } from '../context/BusinessContext';

interface CreateExpenseRequest {
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface ExpenseCategory extends String {}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'supplies', 'travel', 'meals', 'utilities', 'marketing',
  'salaries', 'equipment', 'software', 'rent', 'other'
];

const ExpensesPage: React.FC = () => {
  const { bizUser } = useBusinessContext();
  const businessId = bizUser?.businessId || '';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState<CreateExpenseRequest>({
    category: 'other',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    loadExpenses();
  }, [businessId]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getExpenses(businessId, { limit: 50 });
      setExpenses(result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load expenses';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createExpense(businessId, {
        category: formData.category,
        description: formData.description,
        amount: formData.amount,
        expense_date: formData.date,
      });
      setShowForm(false);
      setFormData({ category: 'other', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
      loadExpenses();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save expense';
      setError(message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Expenses</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          Add Expense
        </button>
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4 flex items-start gap-4 mb-6">
          <AlertCircle className="text-red-400" />
          <div>
            <h3 className="font-semibold text-red-200">Error</h3>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Add Expense</h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-400">Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">No expenses found</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Add Your First Expense
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-900">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Description</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Status</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id} className="border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-white">{expense.description}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{expense.category}</td>
                  <td className="px-6 py-4 text-sm text-white">${expense.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-sm text-gray-300">{new Date(expense.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm"><span className="bg-green-900 text-green-200 px-2 py-1 rounded text-xs">{expense.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;

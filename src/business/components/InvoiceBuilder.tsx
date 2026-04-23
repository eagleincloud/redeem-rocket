import React, { useState } from 'react';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import { CreateInvoiceRequest, CreateInvoiceItemRequest } from '../types/finance';

interface InvoiceBuilderProps {
  businessId: string;
  userId: string;
  onSave: (data: CreateInvoiceRequest) => Promise<void>;
  onCancel: () => void;
}

const InvoiceBuilder: React.FC<InvoiceBuilderProps> = ({ businessId, userId, onSave, onCancel }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [items, setItems] = useState<CreateInvoiceItemRequest[]>([
    { description: '', quantity: 1, unit_price: 0 }
  ]);
  const [taxRate, setTaxRate] = useState(0.1);
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const total = subtotal + (subtotal * taxRate);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Customer name is required');
      return;
    }

    if (!dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        customer_name: customerName,
        customer_email: customerEmail || undefined,
        items,
        tax_rate: taxRate,
        due_date: dueDate,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onCancel} className="p-2 hover:bg-gray-700 rounded">
          <ArrowLeft className="text-gray-300" size={24} />
        </button>
        <h1 className="text-3xl font-bold text-white">Create Invoice</h1>
      </div>

      {error && <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6 text-red-200">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Customer Information</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  placeholder="Customer Name"
                  required
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500"
                  placeholder="Email"
                />
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Line Items</h2>
                <button type="button" onClick={handleAddItem} className="flex items-center gap-2 text-orange-400 hover:text-orange-300">
                  <Plus size={20} />
                  Add Item
                </button>
              </div>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].description = e.target.value;
                        setItems(newItems);
                      }}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      placeholder="Description"
                      required
                    />
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].quantity = parseFloat(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-20 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].unit_price = parseFloat(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-24 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                      min="0"
                      step="0.01"
                    />
                    {items.length > 1 && (
                      <button type="button" onClick={() => setItems(items.filter((_, i) => i !== index))} className="p-2 hover:bg-red-900 rounded">
                        <Trash2 className="text-red-400" size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span>${(subtotal * taxRate).toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-700 pt-3 flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tax Rate (%)</label>
                  <input
                    type="number"
                    value={(taxRate * 100).toFixed(2)}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) / 100)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button type="button" onClick={onCancel} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg font-medium">
            {saving ? 'Saving...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InvoiceBuilder;

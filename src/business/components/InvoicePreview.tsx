import React from 'react';
import { X, Download } from 'lucide-react';
import { Invoice } from '../types/finance';

interface InvoicePreviewProps {
  invoice: Invoice;
  onClose: () => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-700 sticky top-0 bg-gray-900">
          <h2 className="text-2xl font-bold text-white">Invoice {invoice.invoice_number}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded">
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <div className="p-8 bg-white text-gray-900">
          <div className="grid grid-cols-2 gap-8 mb-8">
            <h1 className="text-4xl font-bold text-orange-600">INVOICE</h1>
            <div className="text-right">
              <p><span className="font-semibold">Invoice Date:</span> {new Date(invoice.issue_date).toLocaleDateString()}</p>
              <p><span className="font-semibold">Due Date:</span> {new Date(invoice.due_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="text-sm font-semibold uppercase mb-2">Bill To</h3>
              <p className="font-semibold text-lg">{invoice.customer_name}</p>
              {invoice.customer_email && <p>{invoice.customer_email}</p>}
            </div>
          </div>

          <table className="w-full mb-8">
            <thead>
              <tr className="border-t-2 border-b-2 border-gray-900">
                <th className="text-left py-3">Description</th>
                <th className="text-right py-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-4">Invoice Items</td>
                <td className="text-right">${invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div className="flex justify-end">
            <div className="w-80">
              <div className="flex justify-between py-2 border-b">
                <span>Subtotal</span>
                <span>${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Tax</span>
                <span>${invoice.tax_amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-3 font-bold text-lg">
                <span>Total</span>
                <span>${invoice.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 p-6 border-t border-gray-700 bg-gray-800">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium">
            <Download size={20} />
            Print
          </button>
          <button onClick={onClose} className="ml-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;

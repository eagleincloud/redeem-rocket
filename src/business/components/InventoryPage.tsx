import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';

const mockData = [
  { month: 'Jan', value: 45000 },
  { month: 'Feb', value: 52000 },
  { month: 'Mar', value: 48000 },
];

const mockLowStock = [
  { id: 1, name: 'Product A', current: 8, reorder: 20 },
  { id: 2, name: 'Product B', current: 15, reorder: 30 },
];

export function InventoryPage() {
  const { bizUser } = useBusinessContext();

  return (
    <div style={{ padding: '24px', background: '#0a0e27', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Inventory Management</h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Package style={{ color: '#ff4400' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Total SKUs</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>247</div>
        </div>

        <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <AlertTriangle style={{ color: '#ff4400' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Low Stock Items</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>12</div>
        </div>

        <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <DollarSign style={{ color: '#ff4400' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Stock Value</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>₹28.4L</div>
        </div>

        <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <TrendingUp style={{ color: '#ff4400' }} />
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Turnover Ratio</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>8.5x</div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Low Stock Alerts</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1f2937' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#9ca3af' }}>Product</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#9ca3af' }}>Current</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#9ca3af' }}>Reorder</th>
              </tr>
            </thead>
            <tbody>
              {mockLowStock.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #1f2937' }}>
                  <td style={{ padding: '12px' }}>{item.name}</td>
                  <td style={{ padding: '12px', color: '#ff4400' }}>{item.current}</td>
                  <td style={{ padding: '12px' }}>{item.reorder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Stock Value Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockData}>
            <CartesianGrid stroke="#1f2937" />
            <XAxis stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#ff4400" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

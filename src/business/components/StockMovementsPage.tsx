import { useBusinessContext } from '../context/BusinessContext';

export function StockMovementsPage() {
  const { bizUser } = useBusinessContext();

  return (
    <div style={{ padding: '24px', background: '#0a0e27', minHeight: '100vh', color: '#fff' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>StockMovementsPage</h1>
      <div style={{ background: '#111827', padding: '20px', borderRadius: '8px', border: '1px solid #1f2937' }}>
        <p style={{ color: '#9ca3af' }}>Coming soon...</p>
      </div>
    </div>
  );
}

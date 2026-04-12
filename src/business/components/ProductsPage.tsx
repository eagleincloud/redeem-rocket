import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useViewport } from '../hooks/useViewport';
import { useBusinessContext } from '../context/BusinessContext';
import { usePersistedState } from '../hooks/usePersistedState';
import { fetchOwnProducts, createProduct, updateProduct, deleteProduct as supaDeleteProduct, logActivity } from '@/app/api/supabase-data';
import { Plus, Search, Edit2, Trash2, X, Check, Package, RefreshCw } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  mrp: number;
  sellingPrice: number;
  maxCashback: number;
  stock: number;
  description: string;
  emoji: string;
}

const CATEGORIES = ['Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Pharmacy', 'Beauty', 'Home & Garden', 'Sports', 'Books', 'Other'];

// Default category: use business category if available, otherwise 'Grocery'
const getEmptyProduct = (businessCategory?: string) => ({
  name: '',
  category: businessCategory || 'Grocery',
  mrp: 0,
  sellingPrice: 0,
  description: '',
  emoji: '📦',
  stock: 0,
});

export function ProductsPage() {
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const { bizUser } = useBusinessContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = usePersistedState<string>('products_cat_filter', 'All', bizUser?.id);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(getEmptyProduct(bizUser?.businessCategory));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Fetch products from Supabase on mount
  useEffect(() => {
    const businessId = bizUser?.businessId;
    if (!businessId) { setFetchLoading(false); return; }
    fetchOwnProducts(businessId)
      .then(data => {
        if (data.length > 0) {
          setProducts(data.map(p => ({
            id: p.id,
            name: p.name,
            category: p.category,
            mrp: p.mrp,
            sellingPrice: p.sellingPrice,
            maxCashback: Math.max(0, Math.floor((p.mrp - p.sellingPrice) / 2)),
            stock: p.stock,
            description: p.description,
            emoji: p.emoji,
          })));
        }
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizUser?.businessId]);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  const maxCashback = form.mrp > form.sellingPrice ? Math.floor((form.mrp - form.sellingPrice) / 2) : 0;
  const margin = form.mrp > 0 ? ((form.mrp - form.sellingPrice) / form.mrp * 100).toFixed(1) : '0';

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const uniqueCats = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  function openNew() { setForm(getEmptyProduct(bizUser?.businessCategory)); setEditId(null); setPanelOpen(true); }
  function openEdit(p: Product) { setForm({ name: p.name, category: p.category, mrp: p.mrp, sellingPrice: p.sellingPrice, description: p.description, emoji: p.emoji, stock: p.stock }); setEditId(p.id); setPanelOpen(true); }
  function closePanel() { setPanelOpen(false); setEditId(null); }

  function saveProduct() {
    if (!form.name.trim() || form.mrp <= 0 || form.sellingPrice <= 0) return;
    const mc = Math.floor((form.mrp - form.sellingPrice) / 2);
    const businessId = bizUser?.businessId ?? 'unknown';
    const actorId = bizUser?.isTeamMember ? (bizUser.teamMemberData?.id ?? bizUser.id) : bizUser?.id ?? '';
    const actorType = bizUser?.isTeamMember ? 'team_member' as const : 'owner' as const;
    const actorName = bizUser?.name;
    if (editId) {
      setProducts(ps => ps.map(p => p.id === editId ? { ...p, ...form, maxCashback: Math.max(0, mc) } : p));
      updateProduct(editId, {
        businessId,
        name: form.name,
        description: form.description,
        mrp: form.mrp,
        category: form.category,
      }).catch(() => {});
      logActivity({ businessId, actorId, actorType, actorName, action: 'update_product', entityType: 'product', entityId: editId, entityName: form.name });
    } else {
      const newId = `p${Date.now()}`;
      const newP: Product = { id: newId, ...form, maxCashback: Math.max(0, mc) };
      setProducts(ps => [...ps, newP]);
      createProduct({
        businessId,
        name: form.name,
        description: form.description,
        mrp: form.mrp,
        sellingPrice: form.sellingPrice,
        category: form.category,
        image: form.emoji,
      }).catch(() => {});
      logActivity({ businessId, actorId, actorType, actorName, action: 'create_product', entityType: 'product', entityId: newId, entityName: form.name, metadata: { category: form.category, mrp: form.mrp } });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); closePanel(); }, 800);
  }

  function deleteProduct(id: string) {
    const product = products.find(p => p.id === id);
    const businessId = bizUser?.businessId ?? 'unknown';
    const actorId = bizUser?.isTeamMember ? (bizUser.teamMemberData?.id ?? bizUser.id) : bizUser?.id ?? '';
    const actorType = bizUser?.isTeamMember ? 'team_member' as const : 'owner' as const;
    setProducts(ps => ps.filter(p => p.id !== id));
    setDeleteId(null);
    supaDeleteProduct(id).catch(() => {});
    logActivity({ businessId, actorId, actorType, actorName: bizUser?.name, action: 'delete_product', entityType: 'product', entityId: id, entityName: product?.name });
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: `1.5px solid ${border}`, background: inputBg,
    color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };

  // Panel style: bottom sheet on mobile, side drawer on desktop
  const panelStyle = isMobile
    ? { position: 'fixed' as const, left: 0, right: 0, bottom: 0, height: '92vh', borderRadius: '20px 20px 0 0', background: isDark ? '#0e1530' : '#fff', zIndex: 50, display: 'flex', flexDirection: 'column' as const, overflowY: 'auto' as const }
    : { position: 'fixed' as const, right: 0, top: 0, bottom: 0, width: 420, background: isDark ? '#0e1530' : '#fff', borderLeft: `1px solid ${border}`, zIndex: 50, display: 'flex', flexDirection: 'column' as const, overflowY: 'auto' as const };

  return (
    <div style={{ display: 'flex', gap: 0, position: 'relative' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: text, marginBottom: 2 }}>Products</h1>
            <p style={{ fontSize: 13, color: textMuted }}>{products.length} products in your catalog</p>
          </div>
          {!isMobile && (
            <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '0 0 280px' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: 11, color: textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." style={{ ...inputStyle, paddingLeft: 36 }} />
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {uniqueCats.map(c => (
              <button key={c} onClick={() => setCatFilter(c)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${catFilter === c ? accent : border}`, background: catFilter === c ? `${accent}22` : 'transparent', color: catFilter === c ? accent : textMuted, fontSize: 12, fontWeight: catFilter === c ? 600 : 400, cursor: 'pointer' }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {fetchLoading && (
          <div style={{ textAlign: 'center', padding: 60, color: textMuted }}>
            <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
            <div style={{ fontSize: 14 }}>Loading products…</div>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* Mobile: Card list */}
        {!fetchLoading && isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: textMuted }}>
                <Package size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
                <p>No products found</p>
              </div>
            ) : filtered.map(p => (
              <div key={p.id} style={{ background: card, borderRadius: 12, border: `1px solid ${border}`, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, color: text, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>{p.category}</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>₹{p.sellingPrice}</span>
                    <span style={{ fontSize: 11, color: textMuted, textDecoration: 'line-through' }}>₹{p.mrp}</span>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: p.stock > 50 ? '#22c55e22' : p.stock > 10 ? '#f59e0b22' : '#ef444422', color: p.stock > 50 ? '#22c55e' : p.stock > 10 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>
                      {p.stock} in stock
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => openEdit(p)} style={{ padding: '8px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', color: accent, display: 'flex' }}><Edit2 size={16} /></button>
                  <button onClick={() => setDeleteId(p.id)} style={{ padding: '8px', borderRadius: 8, border: '1px solid #ef444444', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : !fetchLoading && (
          /* Desktop: Table */
          <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: isDark ? '#0f1838' : '#fdf6f0' }}>
                    {['Product', 'Category', 'MRP', 'Sell Price', 'Margin', 'Max Cashback', 'Stock', 'Actions'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 14px', fontSize: 11, fontWeight: 700, color: textMuted, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: textMuted }}>No products found</td></tr>
                  ) : filtered.map((p, i) => (
                    <tr key={p.id} style={{ borderTop: `1px solid ${border}`, background: i % 2 === 0 ? 'transparent' : isDark ? '#0f0f1e' : '#fafafa' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 22 }}>{p.emoji}</span>
                          <div>
                            <div style={{ fontWeight: 600, color: text }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: textMuted, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: textMuted }}>{p.category}</td>
                      <td style={{ padding: '12px 14px', fontWeight: 600, color: text }}>₹{p.mrp}</td>
                      <td style={{ padding: '12px 14px', color: '#22c55e', fontWeight: 600 }}>₹{p.sellingPrice}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: '#f59e0b22', color: '#f59e0b', fontSize: 11, fontWeight: 600 }}>
                          {((p.mrp - p.sellingPrice) / p.mrp * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: accent, fontWeight: 600 }}>₹{p.maxCashback}</td>
                      <td style={{ padding: '12px 14px', color: p.stock > 50 ? '#22c55e' : p.stock > 10 ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{p.stock}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openEdit(p)} style={{ padding: '6px', borderRadius: 6, border: `1px solid ${border}`, background: 'transparent', cursor: 'pointer', color: accent, display: 'flex' }}><Edit2 size={14} /></button>
                          <button onClick={() => setDeleteId(p.id)} style={{ padding: '6px', borderRadius: 6, border: '1px solid #ef444444', background: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {isMobile && (
        <button
          onClick={openNew}
          style={{
            position: 'fixed', bottom: 80, right: 20,
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg, ${accent}, #fb923c)`,
            border: 'none', cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99,102,241,0.5)', zIndex: 30,
          }}
        >
          <Plus size={22} />
        </button>
      )}

      {/* Slide-in / bottom-sheet panel */}
      {panelOpen && (
        <>
          <div onClick={closePanel} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 40 }} />
          <div style={panelStyle}>
            {/* Drag handle on mobile */}
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ffffff30', margin: '12px auto 0' }} />}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: text }}>{editId ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={closePanel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex' }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: '0 0 auto' }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Emoji</label>
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle, width: 60, textAlign: 'center', fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Product Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Organic Cashews 500g" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>MRP (₹) *</label>
                  <input type="number" value={form.mrp || ''} onChange={e => setForm(f => ({ ...f, mrp: Number(e.target.value) }))} placeholder="599" style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Selling Price (₹) *</label>
                  <input type="number" value={form.sellingPrice || ''} onChange={e => setForm(f => ({ ...f, sellingPrice: Number(e.target.value) }))} placeholder="499" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Stock</label>
                <input type="number" value={form.stock || ''} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} placeholder="100" style={inputStyle} />
              </div>

              {/* Live preview */}
              {form.mrp > 0 && form.sellingPrice > 0 && (
                <div style={{ padding: 14, borderRadius: 10, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, marginBottom: 10 }}>PRICING PREVIEW</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: textMuted }}>Margin</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b' }}>{margin}%</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: textMuted }}>Platform keeps 50% margin</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>₹{Math.floor((form.mrp - form.sellingPrice) / 2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: textMuted }}>Max customer cashback</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: accent }}>₹{maxCashback}</span>
                  </div>
                  {form.sellingPrice >= form.mrp && (
                    <div style={{ marginTop: 8, color: '#ef4444', fontSize: 11 }}>⚠️ Selling price must be less than MRP</div>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10 }}>
              <button onClick={closePanel} style={{ flex: 1, padding: '11px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={saveProduct} disabled={saved} style={{ flex: 2, padding: '11px', borderRadius: 10, border: 'none', background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saved ? <><Check size={16} /> Saved!</> : <>{editId ? 'Save Changes' : 'Add Product'}</>}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <>
          <div onClick={() => setDeleteId(null)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: isDark ? '#162040' : '#fff', border: `1px solid ${border}`, borderRadius: 16, padding: 24, width: 'min(320px, 90vw)', zIndex: 70, textAlign: 'center' }}>
            <Trash2 size={32} color="#ef4444" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>Delete Product?</h3>
            <p style={{ fontSize: 13, color: textMuted, marginBottom: 20 }}>This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteId(null)} style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => deleteProduct(deleteId)} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>Delete</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

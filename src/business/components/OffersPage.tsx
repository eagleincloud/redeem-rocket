import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { usePersistedState } from '../hooks/usePersistedState';
import { createOffer as supaCreateOffer, updateOffer as supaUpdateOffer, deleteOffer as supaDeleteOffer, fetchOwnOffers, logActivity } from '@/app/api/supabase-data';
import { Plus, Tag, Clock, Percent, X, Check, AlertCircle, RefreshCw, Zap, LayoutGrid, List } from 'lucide-react';

type OfferStatus = 'pending_approval' | 'approved' | 'rejected' | 'expired';

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  price: number;
  isFlashDeal: boolean;
  startDate: string;
  endDate: string;
  status: OfferStatus;
  rejectionReason?: string;
  category: string;
}

const STATUS_META: Record<OfferStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending_approval: { label: 'Pending',  color: '#f59e0b', bg: '#f59e0b22', icon: '🕐' },
  approved:         { label: 'Live',     color: '#22c55e', bg: '#22c55e22', icon: '✅' },
  rejected:         { label: 'Rejected', color: '#ef4444', bg: '#ef444422', icon: '❌' },
  expired:          { label: 'Expired',  color: '#6b7280', bg: '#6b728022', icon: '⏱' },
};

const KANBAN_COLS: { key: OfferStatus; label: string; color: string }[] = [
  { key: 'pending_approval', label: 'Pending Review', color: '#f59e0b' },
  { key: 'approved',         label: 'Live',           color: '#22c55e' },
  { key: 'rejected',         label: 'Rejected',       color: '#ef4444' },
  { key: 'expired',          label: 'Expired',        color: '#6b7280' },
];

// Default category: use business category if available, otherwise 'Grocery'
const getEmptyForm = (businessCategory?: string) => ({
  title: '',
  description: '',
  discount: 10,
  price: 0,
  isFlashDeal: false,
  startDate: '',
  endDate: '',
  category: businessCategory || 'Grocery',
});
const CATEGORIES = ['Grocery', 'Electronics', 'Fashion', 'Food & Beverage', 'Pharmacy', 'Beauty', 'All'];

// Mark 'offer' step complete in Getting Started checklist
function markGsStep(id: string) {
  try {
    const done: string[] = JSON.parse(localStorage.getItem('rr_onboarding_done') || '[]');
    if (!done.includes(id)) {
      localStorage.setItem('rr_onboarding_done', JSON.stringify([...done, id]));
    }
  } catch { /* ignore */ }
}

export function OffersPage() {
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const { bizUser } = useBusinessContext();
  const [offers, setOffers] = useState<Offer[]>([]);

  // Mark Getting Started: 'offer' step done on first visit
  useEffect(() => { markGsStep('offer'); }, []);

  // Fetch existing offers from Supabase on mount
  const [fetchLoading, setFetchLoading] = useState(true);
  useEffect(() => {
    const businessId = bizUser?.businessId;
    if (!businessId) { setFetchLoading(false); return; }
    fetchOwnOffers(businessId)
      .then(data => {
        if (data.length > 0) setOffers(data as Offer[]);
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizUser?.businessId]);

  const [statusFilter, setStatusFilter] = usePersistedState<OfferStatus | 'all'>('offers_filter', 'all', bizUser?.id);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(getEmptyForm(bizUser?.businessCategory));
  const [saved, setSaved] = useState(false);
  const [view, setView] = usePersistedState<'kanban' | 'list'>('offers_view', 'kanban', bizUser?.id);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<OfferStatus | null>(null);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const filtered = statusFilter === 'all' ? offers : offers.filter(o => o.status === statusFilter);

  const counts = {
    all: offers.length,
    approved: offers.filter(o => o.status === 'approved').length,
    pending_approval: offers.filter(o => o.status === 'pending_approval').length,
    rejected: offers.filter(o => o.status === 'rejected').length,
    expired: offers.filter(o => o.status === 'expired').length,
  };

  function openNew() { setForm(getEmptyForm(bizUser?.businessCategory)); setEditId(null); setFormOpen(true); }
  function openEdit(o: Offer) { setForm({ title: o.title, description: o.description, discount: o.discount, price: o.price, isFlashDeal: o.isFlashDeal, startDate: o.startDate, endDate: o.endDate, category: o.category }); setEditId(o.id); setFormOpen(true); }
  function resubmit(o: Offer) { setOffers(os => os.map(x => x.id === o.id ? { ...x, status: 'pending_approval', rejectionReason: undefined } : x)); }
  function deleteOffer(id: string) {
    const offer = offers.find(o => o.id === id);
    const businessId = bizUser?.businessId ?? 'unknown';
    const actorId = bizUser?.isTeamMember ? (bizUser.teamMemberData?.id ?? bizUser?.id ?? '') : bizUser?.id ?? '';
    const actorType = bizUser?.isTeamMember ? 'team_member' as const : 'owner' as const;
    setOffers(os => os.filter(o => o.id !== id));
    supaDeleteOffer(id).catch(() => {});
    logActivity({ businessId, actorId, actorType, actorName: bizUser?.name, action: 'delete_offer', entityType: 'offer', entityId: id, entityName: offer?.title });
  }

  function save() {
    if (!form.title.trim()) return;
    const businessId = bizUser?.businessId ?? 'unknown';
    const actorId = bizUser?.isTeamMember ? (bizUser.teamMemberData?.id ?? bizUser?.id ?? '') : bizUser?.id ?? '';
    const actorType = bizUser?.isTeamMember ? 'team_member' as const : 'owner' as const;
    if (editId) {
      setOffers(os => os.map(o => o.id === editId ? { ...o, ...form, status: 'pending_approval' as OfferStatus } : o));
      supaUpdateOffer(editId, {
        businessId,
        title: form.title,
        description: form.description,
        discount: form.discount,
        price: form.price,
        isFlashDeal: form.isFlashDeal,
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate,
      }).catch(() => {});
      logActivity({ businessId, actorId, actorType, actorName: bizUser?.name, action: 'update_offer', entityType: 'offer', entityId: editId, entityName: form.title });
    } else {
      const newId = `o${Date.now()}`;
      const newO: Offer = { id: newId, ...form, status: 'pending_approval' };
      setOffers(os => [...os, newO]);
      supaCreateOffer({
        businessId,
        title: form.title,
        description: form.description,
        discount: form.discount,
        price: form.price,
        isFlashDeal: form.isFlashDeal,
        category: form.category,
        startDate: form.startDate,
        endDate: form.endDate,
      }).catch(() => {});
      logActivity({ businessId, actorId, actorType, actorName: bizUser?.name, action: 'create_offer', entityType: 'offer', entityId: newId, entityName: form.title, metadata: { discount: form.discount, isFlashDeal: form.isFlashDeal } });
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setFormOpen(false); setEditId(null); }, 800);
  }

  // Kanban drag handlers
  function handleDragStart(id: string) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, status: OfferStatus) { e.preventDefault(); setDragOver(status); }
  function handleDrop(newStatus: OfferStatus) {
    if (dragging) {
      setOffers(os => os.map(o => o.id === dragging ? { ...o, status: newStatus } : o));
      // Sync to Supabase
      supaUpdateOffer(dragging, { status: newStatus }).catch(() => {});
    }
    setDragging(null);
    setDragOver(null);
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Offers & Deals</h1>
          <p style={{ fontSize: 13, color: textMuted }}>{counts.approved} live · {counts.pending_approval} pending · {counts.rejected} rejected</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${border}`, overflow: 'hidden' }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '7px 12px', border: 'none', background: view === v ? `${accent}22` : 'transparent', color: view === v ? accent : textMuted, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, fontWeight: view === v ? 700 : 400 }}>
                {v === 'kanban' ? <LayoutGrid size={13} /> : <List size={13} />}
                {v === 'kanban' ? 'Board' : 'List'}
              </button>
            ))}
          </div>
          <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Plus size={16} /> Create Offer
          </button>
        </div>
      </div>

      {/* Loading state */}
      {fetchLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: textMuted }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 8 }} />
          <div style={{ fontSize: 14 }}>Loading offers…</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* ── Kanban board ────────────────────────────────────────────────────────── */}
      {!fetchLoading && view === 'kanban' && (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 800 }}>
            {KANBAN_COLS.map(col => {
              const colOffers = offers.filter(o => o.status === col.key);
              const isDragTarget = dragOver === col.key;
              return (
                <div
                  key={col.key}
                  onDragOver={e => handleDragOver(e, col.key)}
                  onDrop={() => handleDrop(col.key)}
                  style={{ flex: 1, minWidth: 190, background: isDragTarget ? `${col.color}18` : (isDark ? '#0a1020' : '#f8f4f0'), borderRadius: 14, border: `2px dashed ${isDragTarget ? col.color : 'transparent'}`, padding: 12, transition: 'all 0.15s' }}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textMuted, background: `${col.color}22`, borderRadius: 10, padding: '2px 8px' }}>{colOffers.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colOffers.length === 0 && (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: textMuted, fontSize: 12, border: `1px dashed ${border}`, borderRadius: 10 }}>
                        Drop here
                      </div>
                    )}
                    {colOffers.map(offer => {
                      const meta = STATUS_META[offer.status];
                      return (
                        <div
                          key={offer.id}
                          draggable
                          onDragStart={() => handleDragStart(offer.id)}
                          style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px', cursor: 'grab', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', opacity: dragging === offer.id ? 0.5 : 1, position: 'relative', overflow: 'hidden' }}
                        >
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: meta.color }} />
                          <div style={{ paddingLeft: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: text, lineHeight: 1.3 }}>{offer.title}</div>
                              {offer.isFlashDeal && <span style={{ padding: '2px 6px', borderRadius: 8, background: '#f59e0b22', color: '#f59e0b', fontSize: 9, fontWeight: 700, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}><Zap size={9} /> FLASH</span>}
                            </div>
                            <div style={{ fontSize: 11, color: textMuted, marginBottom: 8, lineHeight: 1.4 }}>{offer.description.slice(0, 60)}{offer.description.length > 60 ? '...' : ''}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><Percent size={11} /> {offer.discount}% OFF</span>
                              {offer.price > 0 && <span style={{ fontSize: 10, color: textMuted }}>₹{offer.price}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: textMuted, marginBottom: 8 }}>
                              <Clock size={10} /> {offer.endDate}
                            </div>
                            {offer.status === 'rejected' && offer.rejectionReason && (
                              <div style={{ padding: '6px 8px', borderRadius: 6, background: '#ef444411', fontSize: 10, color: '#ef4444', marginBottom: 8 }}>
                                {offer.rejectionReason.slice(0, 60)}...
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: 5 }}>
                              {offer.status !== 'expired' && (
                                <button onClick={() => openEdit(offer)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: `1px solid ${border}`, background: 'transparent', color: accent, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                              )}
                              {offer.status === 'rejected' && (
                                <button onClick={() => resubmit(offer)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: 'none', background: `${accent}22`, color: accent, fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                                  <RefreshCw size={9} /> Resubmit
                                </button>
                              )}
                              <button onClick={() => deleteOffer(offer.id)} style={{ padding: '5px 8px', borderRadius: 7, border: '1px solid #ef444444', background: 'transparent', color: '#ef4444', fontSize: 10, cursor: 'pointer' }}>✕</button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List view ─────────────────────────────────────────────────────────── */}
      {!fetchLoading && view === 'list' && (
        <>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['all', 'approved', 'pending_approval', 'rejected', 'expired'] as const).map(s => {
              const meta = s === 'all' ? { label: 'All', color: accent, bg: `${accent}22` } : STATUS_META[s];
              const active = statusFilter === s;
              return (
                <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '7px 14px', borderRadius: 20, border: `1.5px solid ${active ? meta.color : border}`, background: active ? meta.bg : 'transparent', color: active ? meta.color : textMuted, fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {s !== 'all' && <span>{STATUS_META[s as OfferStatus].icon}</span>}
                  {s === 'all' ? 'All' : STATUS_META[s as OfferStatus].label}
                  <span style={{ background: isDark ? '#ffffff22' : '#00000011', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{counts[s]}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: textMuted, background: card, borderRadius: 16, border: `1px solid ${border}` }}>No offers found</div>}
            {filtered.map(offer => {
              const meta = STATUS_META[offer.status];
              return (
                <div key={offer.id} style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20, display: 'flex', gap: 20, alignItems: 'flex-start', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: meta.color }} />
                  <div style={{ paddingLeft: 8, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: text }}>{offer.title}</h3>
                          {offer.isFlashDeal && <span style={{ padding: '2px 8px', borderRadius: 12, background: '#f59e0b22', color: '#f59e0b', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Zap size={10} /> FLASH</span>}
                        </div>
                        <p style={{ fontSize: 13, color: textMuted, marginBottom: 8 }}>{offer.description}</p>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#22c55e', fontWeight: 600 }}>
                            <Percent size={13} /> {offer.discount}% OFF
                          </div>
                          {offer.price > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: textMuted }}>
                            ₹{offer.price} marked price
                          </div>}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: textMuted }}>
                            <Clock size={13} /> {offer.startDate} – {offer.endDate}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <span style={{ padding: '5px 12px', borderRadius: 20, background: meta.bg, color: meta.color, fontSize: 12, fontWeight: 700 }}>
                          {meta.icon} {meta.label}
                        </span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {offer.status !== 'expired' && <button onClick={() => openEdit(offer)} style={{ padding: '5px 12px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Edit</button>}
                          {offer.status === 'rejected' && <button onClick={() => resubmit(offer)} style={{ padding: '5px 12px', borderRadius: 8, border: 'none', background: `${accent}22`, color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={12} /> Resubmit</button>}
                          <button onClick={() => deleteOffer(offer.id)} style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid #ef444444', background: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Remove</button>
                        </div>
                      </div>
                    </div>
                    {offer.status === 'rejected' && offer.rejectionReason && (
                      <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: '#ef444422', border: '1px solid #ef444444', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <AlertCircle size={15} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 2 }}>Rejection Reason</div>
                          <div style={{ fontSize: 12, color: '#fca5a5' }}>{offer.rejectionReason}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Form panel */}
      {formOpen && (
        <>
          <div onClick={() => setFormOpen(false)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 40 }} />
          <div style={isMobile
            ? { position: 'fixed', left: 0, right: 0, bottom: 0, height: '92vh', borderRadius: '20px 20px 0 0', background: isDark ? '#0e1530' : '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
            : { position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: isDark ? '#0e1530' : '#fff', borderLeft: `1px solid ${border}`, zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
          }>
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ffffff30', margin: '12px auto 0' }} />}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: text }}>{editId ? 'Edit Offer' : 'New Offer'}</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Offer Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Weekend Mega Sale" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Discount %</label>
                  <input type="number" min={1} max={70} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: Number(e.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Item Price (₹)</label>
                  <input type="number" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} placeholder="0" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 8, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}`, cursor: 'pointer' }} onClick={() => setForm(f => ({ ...f, isFlashDeal: !f.isFlashDeal }))}>
                <div style={{ width: 40, height: 22, borderRadius: 11, background: form.isFlashDeal ? '#f59e0b' : '#374151', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: form.isFlashDeal ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: text, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={14} color="#f59e0b" /> Flash Deal</div>
                  <div style={{ fontSize: 11, color: textMuted }}>Shows countdown timer to customers</div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: '#f59e0b11', border: '1px solid #f59e0b33', fontSize: 12, color: '#f59e0b' }}>
                ℹ️ New offers go through admin review before going live (usually within 24h).
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10 }}>
              <button onClick={() => setFormOpen(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={save} disabled={saved} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saved ? <><Check size={16} /> Submitted!</> : 'Submit for Review'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { createAuction as supaCreateAuction, updateAuction as supaUpdateAuction, logActivity } from '@/app/api/supabase-data';
import { supabase } from '@/app/lib/supabase';
import { Plus, Gavel, Clock, TrendingUp, Users, X, Check, LayoutGrid, List, ChevronDown, ChevronUp } from 'lucide-react';

interface Auction {
  id: string;
  emoji: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  totalBids: number;
  startAt: string;
  endAt: string;
  status: 'draft' | 'upcoming' | 'live' | 'ended';
  winnerId?: string;
}

interface BidRecord {
  id: string;
  bidder_name?: string;
  bidder_phone?: string;
  amount: number;
  created_at: string;
}

const EMPTY_FORM = { emoji: '🏆', title: '', description: '', startingBid: 500, endAt: '' };

const KANBAN_COLS: { key: Auction['status']; label: string; color: string }[] = [
  { key: 'draft',    label: 'Draft',    color: '#6b7280' },
  { key: 'upcoming', label: 'Upcoming', color: '#3b82f6' },
  { key: 'live',     label: 'Live',     color: '#22c55e' },
  { key: 'ended',    label: 'Ended',    color: '#ef4444' },
];

function useCountdown(endAt: string, status: Auction['status']) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    if (status !== 'live') return;
    function update() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endAt, status]);
  return remaining;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AuctionCard({ auction, onEdit, onViewBids, isDark, border, text, textMuted, card, isMobile }: {
  auction: Auction; onEdit: (a: Auction) => void; onViewBids: (a: Auction) => void;
  isDark: boolean; border: string; text: string; textMuted: string; card: string; isMobile: boolean;
}) {
  const countdown = useCountdown(auction.endAt, auction.status);
  const accent = '#f97316';
  const STATUS_STYLES = {
    draft:    { color: '#6b7280', bg: '#6b728022', label: '📝 Draft' },
    live:     { color: '#22c55e', bg: '#22c55e22', label: '🟢 Live' },
    upcoming: { color: '#3b82f6', bg: '#3b82f622', label: '🔵 Upcoming' },
    ended:    { color: '#6b7280', bg: '#6b728022', label: '⚫ Ended' },
  };
  const st = STATUS_STYLES[auction.status];

  return (
    <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${accent}33, #fb923c33)`, border: `1px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {auction.emoji}
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 4 }}>{auction.title}</h3>
            <p style={{ fontSize: 12, color: textMuted, maxWidth: 300 }}>{auction.description}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ padding: '5px 12px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 12, fontWeight: 700 }}>{st.label}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {auction.status !== 'ended' && (
              <button onClick={() => onEdit(auction)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: accent, cursor: 'pointer', fontWeight: 600 }}>Edit</button>
            )}
            <button onClick={() => onViewBids(auction)} style={{ fontSize: 11, padding: '5px 12px', borderRadius: 8, border: `1px solid #3b82f644`, background: '#3b82f611', color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}>Bids</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 12 }}>
        {[
          { label: 'Starting Bid', value: `₹${auction.startingBid}`, icon: <Gavel size={14} />, color: textMuted },
          { label: 'Current Bid', value: `₹${auction.currentBid}`, icon: <TrendingUp size={14} />, color: '#22c55e' },
          { label: 'Total Bids', value: String(auction.totalBids), icon: <Users size={14} />, color: '#3b82f6' },
          { label: auction.status === 'live' ? 'Time Left' : 'End Time', value: auction.status === 'live' ? countdown : new Date(auction.endAt).toLocaleDateString('en-IN'), icon: <Clock size={14} />, color: auction.status === 'live' ? '#ef4444' : textMuted },
        ].map(stat => (
          <div key={stat.label} style={{ padding: '12px', background: isDark ? '#0f1838' : '#fdf6f0', borderRadius: 10, border: `1px solid ${border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: textMuted, fontSize: 11 }}>
              {stat.icon} {stat.label}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {auction.status === 'live' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 11, color: textMuted }}>
            <span>Bid progress</span>
            <span>+{((auction.currentBid - auction.startingBid) / auction.startingBid * 100).toFixed(0)}% above start</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: isDark ? '#1c2a55' : '#e8d8cc', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${accent}, #22c55e)`, width: `${Math.min(100, (auction.currentBid / (auction.startingBid * 3)) * 100)}%`, transition: 'width 0.5s' }} />
          </div>
        </div>
      )}
    </div>
  );
}

export function AuctionsManagePage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { isMobile } = useViewport();
  const [auctions, setAuctions] = useState<any>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'all' | 'live' | 'upcoming' | 'ended'>('all');
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Auction['status'] | null>(null);
  // Bid history
  const [bidAuction, setBidAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<BidRecord[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);

  useEffect(() => {
    if (!bizUser?.businessId || !supabase) return;
    supabase
      .from('auctions')
      .select('id, title, description, image, starting_bid, current_bid, total_bids, start_at, end_at, status')
      .eq('business_id', bizUser.businessId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (!data?.length) return;
        setAuctions(data.map(r => ({
          id: r.id,
          emoji: r.image ?? '🏆',
          title: r.title,
          description: r.description ?? '',
          startingBid: r.starting_bid ?? 0,
          currentBid: r.current_bid ?? r.starting_bid ?? 0,
          totalBids: r.total_bids ?? 0,
          startAt: r.start_at ?? new Date().toISOString(),
          endAt: r.end_at ?? '',
          status: r.status ?? 'draft',
        })));
      });
  }, [bizUser?.businessId]);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const filtered = tab === 'all' ? auctions : auctions.filter(a => a.status === tab);

  function openNew() { setForm({ ...EMPTY_FORM }); setEditId(null); setFormOpen(true); }
  function openEdit(a: Auction) { setForm({ emoji: a.emoji, title: a.title, description: a.description, startingBid: a.startingBid, endAt: a.endAt.split('T')[0] }); setEditId(a.id); setFormOpen(true); }

  async function openBidHistory(auction: Auction) {
    setBidAuction(auction);
    setLoadingBids(true);
    try {
      if (supabase) {
        const { data } = await supabase
          .from('auction_bids')
          .select('id, bidder_name, bidder_phone, amount, created_at')
          .eq('auction_id', auction.id)
          .order('amount', { ascending: false })
          .limit(50);
        if (data && data.length > 0) {
          setBids(data as BidRecord[]);
        } else {
          setBids([]);
        }
      } else {
        setBids([]);
      }
    } catch {
      setBids([]);
    } finally {
      setLoadingBids(false);
    }
  }

  function save() {
    if (!form.title.trim() || !form.endAt) return;
    const endAtFull = `${form.endAt}T22:00:00`;
    const now = new Date().toISOString();
    const status: Auction['status'] = endAtFull < now ? 'ended' : now < `${form.endAt}T00:00:00` ? 'upcoming' : 'live';
    const businessId = bizUser?.businessId ?? 'unknown';
    const businessName = bizUser?.businessName ?? 'Unknown Business';
    if (editId) {
      setAuctions(as => as.map(a => a.id === editId ? { ...a, emoji: form.emoji, title: form.title, description: form.description, startingBid: form.startingBid, endAt: endAtFull, status } : a));
      supaUpdateAuction(editId, { title: form.title, description: form.description, startingBid: form.startingBid, endAt: new Date(endAtFull) }).catch(() => {});
      logActivity({ businessId, actorId: bizUser?.id ?? businessId, actorType: 'owner', action: 'auction_updated', entityType: 'auction', entityId: editId, entityName: form.title }).catch(() => {});
    } else {
      const newId = `a${Date.now()}`;
      const newA: Auction = { id: newId, ...form, endAt: endAtFull, startAt: now, currentBid: form.startingBid, totalBids: 0, status };
      setAuctions(as => [...as, newA]);
      supaCreateAuction({ id: newId, businessId, businessName, title: form.title, description: form.description, startingBid: form.startingBid, currentBid: form.startingBid, endAt: new Date(endAtFull), image: form.emoji, totalBids: 0 }).catch(() => {});
      logActivity({ businessId, actorId: bizUser?.id ?? businessId, actorType: 'owner', action: 'auction_created', entityType: 'auction', entityId: newId, entityName: form.title }).catch(() => {});
    }
    setSaved(true);
    setTimeout(() => { setSaved(false); setFormOpen(false); setEditId(null); }, 800);
  }

  // Kanban drag
  function handleDragStart(id: string) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, status: Auction['status']) { e.preventDefault(); setDragOver(status); }
  function handleDrop(newStatus: Auction['status']) {
    if (dragging) {
      setAuctions(as => as.map(a => a.id === dragging ? { ...a, status: newStatus } : a));
      supaUpdateAuction(dragging, { status: newStatus } as Parameters<typeof supaUpdateAuction>[1]).catch(() => {});
    }
    setDragging(null);
    setDragOver(null);
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const counts = { all: auctions.length, live: auctions.filter(a => a.status === 'live').length, upcoming: auctions.filter(a => a.status === 'upcoming').length, ended: auctions.filter(a => a.status === 'ended').length };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Auctions</h1>
          <p style={{ fontSize: 13, color: textMuted }}>{counts.live} live · {counts.upcoming} upcoming · {counts.ended} ended</p>
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
            <Plus size={16} /> Create Auction
          </button>
        </div>
      </div>

      {/* ── Kanban board ────────────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 14, minWidth: 760 }}>
            {KANBAN_COLS.map(col => {
              const colAuctions = auctions.filter(a => a.status === col.key);
              const isDragTarget = dragOver === col.key;
              return (
                <div
                  key={col.key}
                  onDragOver={e => handleDragOver(e, col.key)}
                  onDrop={() => handleDrop(col.key)}
                  style={{ flex: 1, minWidth: 180, background: isDragTarget ? `${col.color}18` : (isDark ? '#0a1020' : '#f8f4f0'), borderRadius: 14, border: `2px dashed ${isDragTarget ? col.color : 'transparent'}`, padding: 12, transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: col.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{col.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textMuted, background: `${col.color}22`, borderRadius: 10, padding: '2px 8px' }}>{colAuctions.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colAuctions.length === 0 && (
                      <div style={{ padding: '20px 12px', textAlign: 'center', color: textMuted, fontSize: 12, border: `1px dashed ${border}`, borderRadius: 10 }}>Drop here</div>
                    )}
                    {colAuctions.map(auction => {
                      const statusStyle = { live: '#22c55e', upcoming: '#3b82f6', ended: '#6b7280', draft: '#6b7280' };
                      return (
                        <div
                          key={auction.id}
                          draggable
                          onDragStart={() => handleDragStart(auction.id)}
                          style={{ background: card, border: `1px solid ${border}`, borderRadius: 10, padding: '12px 14px', cursor: 'grab', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', opacity: dragging === auction.id ? 0.5 : 1 }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 22 }}>{auction.emoji}</span>
                            <div style={{ fontSize: 12, fontWeight: 700, color: text, lineHeight: 1.3 }}>{auction.title}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, fontSize: 11, marginBottom: 8 }}>
                            <span style={{ color: '#22c55e', fontWeight: 700 }}>₹{auction.currentBid}</span>
                            <span style={{ color: textMuted }}>{auction.totalBids} bids</span>
                          </div>
                          {auction.status === 'live' && (
                            <LiveCountdownBadge endAt={auction.endAt} />
                          )}
                          <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                            {auction.status !== 'ended' && (
                              <button onClick={() => openEdit(auction)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: `1px solid ${border}`, background: 'transparent', color: accent, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                            )}
                            <button onClick={() => openBidHistory(auction)} style={{ flex: 1, padding: '5px', borderRadius: 7, border: `1px solid #3b82f644`, background: '#3b82f611', color: '#3b82f6', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Bids</button>
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
      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['all', 'live', 'upcoming', 'ended'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${tab === t ? accent : border}`, background: tab === t ? `${accent}22` : 'transparent', color: tab === t ? accent : textMuted, fontSize: 12, fontWeight: tab === t ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' as const }}>
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t] ?? auctions.length})
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: textMuted, background: card, borderRadius: 16, border: `1px solid ${border}` }}>No auctions found</div>}
            {filtered.map(a => <AuctionCard key={a.id} auction={a} onEdit={openEdit} onViewBids={openBidHistory} isDark={isDark} border={border} text={text} textMuted={textMuted} card={card} isMobile={isMobile} />)}
          </div>
        </>
      )}

      {/* ── Bid History modal ─────────────────────────────────────────────────── */}
      {bidAuction && (
        <>
          <div onClick={() => setBidAuction(null)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: isDark ? '#0e1530' : '#fff', border: `1px solid ${border}`, borderRadius: 20, padding: 28, width: 480, maxHeight: '85vh', overflowY: 'auto', zIndex: 70 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 2 }}>Bid History</h3>
                <p style={{ fontSize: 12, color: textMuted }}>{bidAuction.title} · {bids.length} bids</p>
              </div>
              <button onClick={() => setBidAuction(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>

            {/* Auction summary */}
            <div style={{ padding: '12px 16px', borderRadius: 12, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}`, marginBottom: 16, display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 32 }}>{bidAuction.emoji}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>{bidAuction.title}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>Current: ₹{bidAuction.currentBid}</span>
                  <span style={{ color: textMuted }}>Start: ₹{bidAuction.startingBid}</span>
                  <span style={{ color: textMuted }}>{bidAuction.totalBids} bids</span>
                </div>
              </div>
            </div>

            {loadingBids ? (
              <div style={{ textAlign: 'center', padding: 32, color: textMuted }}>Loading bid history…</div>
            ) : bids.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: textMuted }}>
                <Gavel size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No bids placed yet</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bids.map((bid, i) => (
                  <div key={bid.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, background: i === 0 ? '#22c55e11' : (isDark ? '#162040' : '#fdf6f0'), border: `1px solid ${i === 0 ? '#22c55e44' : border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i === 0 ? '#22c55e22' : `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: i === 0 ? '#22c55e' : accent, flexShrink: 0 }}>
                      #{i + 1}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{bid.bidder_name ?? 'Anonymous'}</div>
                      {bid.bidder_phone && <div style={{ fontSize: 11, color: textMuted }}>{bid.bidder_phone}</div>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: i === 0 ? '#22c55e' : text }}>₹{bid.amount.toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: 10, color: textMuted }}>{relativeTime(bid.created_at)}</div>
                    </div>
                    {i === 0 && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 6, background: '#22c55e22', color: '#22c55e', fontWeight: 700 }}>Highest</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Create/Edit form ───────────────────────────────────────────────────── */}
      {formOpen && (
        <>
          <div onClick={() => setFormOpen(false)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 40 }} />
          <div style={isMobile
            ? { position: 'fixed', left: 0, right: 0, bottom: 0, height: '92vh', borderRadius: '20px 20px 0 0', background: isDark ? '#0e1530' : '#fff', zIndex: 50, display: 'flex', flexDirection: 'column', overflowY: 'auto' }
            : { position: 'fixed', right: 0, top: 0, bottom: 0, width: 400, background: isDark ? '#0e1530' : '#fff', borderLeft: `1px solid ${border}`, zIndex: 50, display: 'flex', flexDirection: 'column' }
          }>
            {isMobile && <div style={{ width: 40, height: 4, borderRadius: 2, background: '#ffffff30', margin: '12px auto 0' }} />}
            <div style={{ padding: '20px 24px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: text }}>{editId ? 'Edit Auction' : 'New Auction'}</h2>
              <button onClick={() => setFormOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14, flex: 1, overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Emoji</label>
                  <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle, width: 60, textAlign: 'center', fontSize: 22 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Auction Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Premium Cashew Pack" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Starting Bid (₹) *</label>
                <input type="number" value={form.startingBid} onChange={e => setForm(f => ({ ...f, startingBid: Number(e.target.value) }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>End Date *</label>
                <input type="date" value={form.endAt} onChange={e => setForm(f => ({ ...f, endAt: e.target.value }))} style={inputStyle} />
              </div>
              <div style={{ padding: '12px', borderRadius: 8, background: isDark ? '#162040' : '#fdf6f0', border: `1px solid ${border}`, fontSize: 12, color: textMuted, lineHeight: 1.6 }}>
                💡 <strong>How it works:</strong> Customers bid against each other. The highest bidder at the end time wins and gets the item at their bid price.
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10 }}>
              <button onClick={() => setFormOpen(false)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={save} disabled={saved} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {saved ? <><Check size={16} /> Created!</> : editId ? 'Save Changes' : 'Launch Auction'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Small live countdown badge for kanban cards
function LiveCountdownBadge({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState('');
  useEffect(() => {
    function update() {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Ended'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h}h ${m}m ${s}s`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endAt]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#ef4444', fontWeight: 700 }}>
      <Clock size={10} /> {remaining}
    </div>
  );
}

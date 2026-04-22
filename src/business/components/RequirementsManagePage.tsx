import { useState, useEffect, useCallback } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { supabase } from '@/app/lib/supabase';
import { logActivity } from '@/app/api/supabase-data';
import { ClipboardList, Send, ChevronDown, ChevronUp, Clock, IndianRupee, X, Check, UserCheck, ArrowRight, LayoutGrid, List, RefreshCw } from 'lucide-react';

interface Requirement {
  id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  urgency: 'low' | 'medium' | 'high';
  kanban_stage: 'new' | 'quoted' | 'negotiating' | 'won' | 'rejected';
  status: 'open' | 'in_progress' | 'completed';
  createdAt: string;
  customerName: string;
  userId?: string;
  responses: { businessId: string; message: string; price: number; sentAt: string }[];
  myQuote?: { message: string; price: number; sentAt: string };
}

const URGENCY_META = {
  low:    { label: 'Low',    color: '#22c55e', bg: '#22c55e22' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#f59e0b22' },
  high:   { label: 'High',   color: '#ef4444', bg: '#ef444422' },
};

const KANBAN_STAGES: { key: Requirement['kanban_stage']; label: string; color: string; bg: string }[] = [
  { key: 'new',         label: 'New',         color: '#64748b', bg: '#64748b15' },
  { key: 'quoted',      label: 'Quoted',      color: '#3b82f6', bg: '#3b82f615' },
  { key: 'negotiating', label: 'Negotiating', color: '#f59e0b', bg: '#f59e0b15' },
  { key: 'won',         label: 'Won',         color: '#22c55e', bg: '#22c55e15' },
  { key: 'rejected',    label: 'Rejected',    color: '#ef4444', bg: '#ef444415' },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RequirementsManagePage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<any>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [quoteModal, setQuoteModal] = useState<Requirement | null>(null);
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [sent, setSent] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress'>('all');
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [loading, setLoading] = useState(false);
  // Drag state for kanban
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Requirement['kanban_stage'] | null>(null);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  const bizId = bizUser?.businessId;

  // ── Load from Supabase ─────────────────────────────────────────────────────
  const loadRequirements = useCallback(async () => {
    if (!supabase || !bizId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_requirements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) { console.warn('Requirements load error:', error.message); return; }
      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: Requirement[] = data.map((r: Record<string, any>) => ({
          id: r.id,
          title: r.title ?? r.name ?? 'Untitled',
          description: r.description ?? '',
          category: r.category ?? 'General',
          budget: Number(r.budget ?? r.max_budget ?? 0),
          urgency: (r.urgency ?? 'medium') as Requirement['urgency'],
          kanban_stage: (r.kanban_stage ?? 'new') as Requirement['kanban_stage'],
          status: (r.status === 'completed' ? 'completed' : r.status === 'in_progress' ? 'in_progress' : 'open') as Requirement['status'],
          createdAt: r.created_at ?? new Date().toISOString(),
          customerName: r.customer_name ?? r.user_name ?? 'Customer',
          userId: r.user_id,
          responses: [],
          myQuote: r.my_quote_message ? { message: r.my_quote_message, price: Number(r.my_quote_price ?? 0), sentAt: r.my_quote_sent_at ?? '' } : undefined,
        }));
        setRequirements(mapped);
      }
    } finally {
      setLoading(false);
    }
  }, [bizId]);

  useEffect(() => { loadRequirements(); }, [loadRequirements]);

  const filtered = statusFilter === 'all' ? requirements : requirements.filter(r => r.status === statusFilter);

  function convertToLead(req: Requirement) {
    setConvertedIds(prev => new Set([...prev, req.id]));
    // Move to Won in kanban too
    moveKanbanStage(req.id, 'won');
    sessionStorage.setItem('prefill_lead', JSON.stringify({
      name: req.customerName,
      product_interest: req.title,
      deal_value: req.budget,
      priority: req.urgency === 'high' ? 'high' : req.urgency === 'medium' ? 'medium' : 'low',
      source: 'manual',
      notes: req.description,
    }));
    navigate('/leads');
  }

  async function moveKanbanStage(id: string, newStage: Requirement['kanban_stage']) {
    const req = requirements.find(r => r.id === id);
    setRequirements(rs => rs.map(r => r.id === id ? { ...r, kanban_stage: newStage } : r));
    if (supabase) {
      await supabase.from('customer_requirements').update({ kanban_stage: newStage }).eq('id', id).catch(() => {});
    }

    // Log activity
    logActivity({
      businessId: bizId!,
      actorId: bizUser!.id,
      actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
      actorName: bizUser!.name,
      action: 'update',
      entityType: 'requirement',
      entityId: id,
      entityName: req?.title || 'Requirement',
      metadata: { newStage },
    });
  }

  async function sendQuote() {
    if (!quoteModal || !quoteMessage.trim() || !quotePrice) return;
    const quote = { message: quoteMessage.trim(), price: Number(quotePrice), sentAt: new Date().toISOString() };
    setRequirements(rs => rs.map(r => r.id === quoteModal.id ? { ...r, myQuote: quote, status: 'in_progress' as const, kanban_stage: 'quoted' as const } : r));

    // Persist quote to Supabase
    if (supabase) {
      await supabase.from('customer_requirements').update({
        kanban_stage: 'quoted',
        my_quote_message: quote.message,
        my_quote_price: quote.price,
        my_quote_sent_at: quote.sentAt,
        status: 'in_progress',
      }).eq('id', quoteModal.id).catch(() => {});
    }

    // Log activity
    logActivity({
      businessId: bizId!,
      actorId: bizUser!.id,
      actorType: bizUser!.isTeamMember ? 'team_member' : 'owner',
      actorName: bizUser!.name,
      action: 'create',
      entityType: 'quote',
      entityId: quoteModal.id,
      entityName: quoteModal.title,
      metadata: { price: Number(quotePrice) },
    });

    setSent(true);
    setTimeout(() => { setSent(false); setQuoteModal(null); setQuoteMessage(''); setQuotePrice(''); }, 1000);
  }

  // Kanban drag handlers
  function handleDragStart(id: string) { setDragging(id); }
  function handleDragOver(e: React.DragEvent, stage: Requirement['kanban_stage']) { e.preventDefault(); setDragOver(stage); }
  function handleDrop(stage: Requirement['kanban_stage']) {
    if (dragging && dragging !== stage) {
      moveKanbanStage(dragging, stage);
      if (stage === 'won') {
        const req = requirements.find(r => r.id === dragging);
        if (req && !convertedIds.has(req.id)) {
          // Prompt auto-convert to lead
          setTimeout(() => {
            if (window.confirm(`Move "${req.title}" to Won. Convert to Lead automatically?`)) {
              convertToLead(req);
            }
          }, 100);
        }
      }
    }
    setDragging(null);
    setDragOver(null);
  }

  const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const };
  const counts = { all: requirements.length, open: requirements.filter(r => r.status === 'open').length, in_progress: requirements.filter(r => r.status === 'in_progress').length };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: text, marginBottom: 2 }}>Customer Requirements</h1>
          <p style={{ fontSize: 13, color: textMuted }}>{counts.open} open · {counts.in_progress} in progress</p>
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
          <button onClick={loadRequirements} style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: 7, cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* ── Kanban view ──────────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 900 }}>
            {KANBAN_STAGES.map(stage => {
              const stageReqs = requirements.filter(r => r.kanban_stage === stage.key);
              const isDragTarget = dragOver === stage.key;
              return (
                <div
                  key={stage.key}
                  onDragOver={e => handleDragOver(e, stage.key)}
                  onDrop={() => handleDrop(stage.key)}
                  style={{ flex: 1, minWidth: 180, background: isDragTarget ? `${stage.color}18` : (isDark ? '#0a1020' : '#f8f4f0'), borderRadius: 14, border: `2px dashed ${isDragTarget ? stage.color : 'transparent'}`, padding: 12, transition: 'all 0.15s' }}
                >
                  {/* Column header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: stage.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: textMuted, background: `${stage.color}22`, borderRadius: 10, padding: '2px 8px' }}>{stageReqs.length}</span>
                  </div>

                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stageReqs.length === 0 && (
                      <div style={{ padding: '20px 12px', textAlign: 'center', color: textMuted, fontSize: 12, border: `1px dashed ${border}`, borderRadius: 10 }}>
                        Drop here
                      </div>
                    )}
                    {stageReqs.map(req => {
                      const urgMeta = URGENCY_META[req.urgency];
                      return (
                        <div
                          key={req.id}
                          draggable
                          onDragStart={() => handleDragStart(req.id)}
                          style={{ background: card, border: `1px solid ${req.myQuote ? accent + '44' : border}`, borderRadius: 10, padding: '12px 14px', cursor: 'grab', userSelect: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', opacity: dragging === req.id ? 0.5 : 1 }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 6, lineHeight: 1.3 }}>{req.title}</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                            <span style={{ padding: '2px 7px', borderRadius: 10, background: urgMeta.bg, color: urgMeta.color, fontSize: 10, fontWeight: 700 }}>{urgMeta.label}</span>
                            {req.myQuote && <span style={{ padding: '2px 7px', borderRadius: 10, background: `${accent}22`, color: accent, fontSize: 10, fontWeight: 700 }}>Quoted ✓</span>}
                          </div>
                          <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>₹{req.budget.toLocaleString('en-IN')}</div>
                          <div style={{ fontSize: 10, color: textMuted, marginBottom: 8 }}>👤 {req.customerName} · {timeAgo(req.createdAt)}</div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {!req.myQuote && req.status === 'open' && (
                              <button onClick={() => { setQuoteModal(req); setQuoteMessage(''); setQuotePrice(String(req.budget)); }} style={{ flex: 1, padding: '5px 8px', borderRadius: 7, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                                Quote
                              </button>
                            )}
                            {convertedIds.has(req.id) ? (
                              <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}><UserCheck size={10} /> Lead</span>
                            ) : (
                              <button onClick={() => convertToLead(req)} style={{ padding: '5px 8px', borderRadius: 7, border: `1px solid #3b82f644`, background: '#3b82f611', color: '#3b82f6', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                                <UserCheck size={10} /> Lead
                              </button>
                            )}
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
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {([['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress']] as const).map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)} style={{ padding: '7px 16px', borderRadius: 20, border: `1.5px solid ${statusFilter === val ? accent : border}`, background: statusFilter === val ? `${accent}22` : 'transparent', color: statusFilter === val ? accent : textMuted, fontSize: 12, fontWeight: statusFilter === val ? 700 : 400, cursor: 'pointer' }}>
                {label} ({counts[val]})
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: textMuted, background: card, borderRadius: 16, border: `1px solid ${border}` }}>No requirements found</div>}
            {filtered.map(req => {
              const urgMeta = URGENCY_META[req.urgency];
              const isExpanded = expanded === req.id;
              const hasMyQuote = !!req.myQuote;
              const stage = KANBAN_STAGES.find(s => s.key === req.kanban_stage);
              return (
                <div key={req.id} style={{ background: card, borderRadius: 16, border: `1px solid ${hasMyQuote ? accent + '44' : border}`, overflow: 'hidden' }}>
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: text }}>{req.title}</h3>
                          <span style={{ padding: '2px 8px', borderRadius: 20, background: urgMeta.bg, color: urgMeta.color, fontSize: 10, fontWeight: 700 }}>{urgMeta.label} Priority</span>
                          {hasMyQuote && <span style={{ padding: '2px 8px', borderRadius: 20, background: `${accent}22`, color: accent, fontSize: 10, fontWeight: 700 }}>Quote Sent ✓</span>}
                          {stage && <span style={{ padding: '2px 8px', borderRadius: 20, background: `${stage.color}22`, color: stage.color, fontSize: 10, fontWeight: 700 }}>{stage.label}</span>}
                        </div>
                        <p style={{ fontSize: 13, color: textMuted, marginBottom: 10 }}>{req.description.length > 120 ? req.description.slice(0, 120) + '...' : req.description}</p>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#22c55e', fontWeight: 600 }}>
                            <IndianRupee size={12} /> Budget: ₹{req.budget.toLocaleString('en-IN')}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: textMuted }}>
                            <ClipboardList size={12} /> {req.category}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: textMuted }}>
                            <Clock size={12} /> {timeAgo(req.createdAt)}
                          </div>
                          <div style={{ color: textMuted }}>👤 {req.customerName}</div>
                          {req.responses.length > 0 && <div style={{ color: textMuted }}>{req.responses.length} other quote{req.responses.length > 1 ? 's' : ''}</div>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                        {!hasMyQuote && req.status === 'open' && (
                          <button onClick={() => { setQuoteModal(req); setQuoteMessage(''); setQuotePrice(String(req.budget)); }} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Send size={13} /> Send Quote
                          </button>
                        )}
                        {convertedIds.has(req.id) ? (
                          <span style={{ padding: '5px 10px', borderRadius: 8, background: '#22c55e18', color: '#22c55e', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5, border: '1px solid #22c55e33' }}>
                            <UserCheck size={12} /> Lead Created
                          </span>
                        ) : (
                          <button onClick={() => convertToLead(req)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid #3b82f644`, background: '#3b82f611', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600 }}>
                            <UserCheck size={12} /> To Lead <ArrowRight size={10} />
                          </button>
                        )}
                        <button onClick={() => setExpanded(e => e === req.id ? null : req.id)} style={{ padding: '6px 10px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                          {isExpanded ? <><ChevronUp size={14} /> Less</> : <><ChevronDown size={14} /> Details</>}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${border}` }}>
                        <p style={{ fontSize: 13, color: text, marginBottom: 12, lineHeight: 1.6 }}>{req.description}</p>
                        {req.myQuote && (
                          <div style={{ padding: '12px 16px', borderRadius: 10, background: `${accent}11`, border: `1px solid ${accent}33` }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 8 }}>YOUR QUOTE</div>
                            <div style={{ fontSize: 13, color: text, marginBottom: 6 }}>{req.myQuote.message}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#22c55e' }}>₹{req.myQuote.price.toLocaleString('en-IN')}</div>
                          </div>
                        )}
                        {/* Stage selector */}
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: textMuted, marginBottom: 8 }}>Move Stage:</p>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {KANBAN_STAGES.map(s => (
                              <button key={s.key} onClick={() => moveKanbanStage(req.id, s.key)} style={{ padding: '4px 10px', borderRadius: 8, border: `1.5px solid ${req.kanban_stage === s.key ? s.color : border}`, background: req.kanban_stage === s.key ? `${s.color}22` : 'transparent', color: req.kanban_stage === s.key ? s.color : textMuted, fontSize: 11, fontWeight: req.kanban_stage === s.key ? 700 : 400, cursor: 'pointer' }}>
                                {s.label}
                              </button>
                            ))}
                          </div>
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

      {/* Quote modal */}
      {quoteModal && (
        <>
          <div onClick={() => setQuoteModal(null)} style={{ position: 'fixed', inset: 0, background: '#00000066', zIndex: 60 }} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: isDark ? '#162040' : '#fff', border: `1px solid ${border}`, borderRadius: 20, padding: 28, width: 460, zIndex: 70, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: text }}>Send Quote</h3>
              <button onClick={() => setQuoteModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}><X size={18} /></button>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: isDark ? '#0e1530' : '#fdf6f0', border: `1px solid ${border}`, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 4 }}>{quoteModal.title}</div>
              <div style={{ fontSize: 11, color: textMuted, marginBottom: 6 }}>{quoteModal.description.slice(0, 100)}...</div>
              <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Budget: ₹{quoteModal.budget.toLocaleString('en-IN')}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Your Quote Price (₹) *</label>
                <input type="number" value={quotePrice} onChange={e => setQuotePrice(e.target.value)} placeholder={String(quoteModal.budget)} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 6 }}>Message to Customer *</label>
                <textarea value={quoteMessage} onChange={e => setQuoteMessage(e.target.value)} rows={4} placeholder="Describe what you can offer, timeline, delivery, etc." style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setQuoteModal(null)} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Cancel</button>
              <button onClick={sendQuote} disabled={sent} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', background: sent ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {sent ? <><Check size={16} /> Sent!</> : <><Send size={15} /> Send Quote</>}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

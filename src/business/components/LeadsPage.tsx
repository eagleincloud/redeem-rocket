import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Plus, Search, LayoutGrid, List, Upload, Clock, TrendingUp, Users, Trophy, Filter } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useRBAC } from '../context/RBACContext';
import { fetchLeads, insertLead, updateLead, insertLeadActivity, type Lead, type LeadStage, type LeadPriority } from '@/app/api/supabase-data';
import { notifyLeadFollowUpDue, notifyLeadAction } from '@/services/notificationService';
import { LeadDetailPanel } from './LeadDetailPanel';
import { LeadFormModal } from './LeadFormModal';
import { LeadImportModal } from './LeadImportModal';
import { HintTooltip } from './HintTooltip';

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new',         label: 'New',         color: '#64748b' },
  { key: 'contacted',   label: 'Contacted',   color: '#3b82f6' },
  { key: 'qualified',   label: 'Qualified',   color: '#f59e0b' },
  { key: 'proposal',    label: 'Proposal',    color: '#f97316' },
  { key: 'negotiation', label: 'Negotiation', color: '#a855f7' },
  { key: 'won',         label: 'Won',         color: '#22c55e' },
  { key: 'lost',        label: 'Lost',        color: '#ef4444' },
];

const PRIORITY_COLORS: Record<LeadPriority, string> = {
  low: '#22c55e', medium: '#f59e0b', high: '#ef4444', urgent: '#a855f7',
};

const SOURCE_ICONS: Record<string, string> = {
  manual: '✍️', csv: '📋', scrape: '🔍', campaign: '📣',
  referral: '👤', walk_in: '🚶', website: '🌐',
};

const FREE_LEAD_CAP = 10;

const PLAN_RANK: Record<string, number> = { free: 0, basic: 1, pro: 2, enterprise: 3 };
function meetsRequirement(userPlan: string, required: string): boolean {
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

// ── Mock data ─────────────────────────────────────────────────────────────────

// ── Helper ────────────────────────────────────────────────────────────────────

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function formatCurrency(n?: number): string {
  if (!n) return '—';
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function LeadsPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const navigate = useNavigate();

  // Mark Getting Started: 'lead' step done on first visit
  useEffect(() => {
    try {
      const done: string[] = JSON.parse(localStorage.getItem('rr_onboarding_done') || '[]');
      if (!done.includes('lead')) localStorage.setItem('rr_onboarding_done', JSON.stringify([...done, 'lead']));
    } catch { /* ignore */ }
  }, []);

  const [leads,        setLeads]        = useState<any>([]);
  const [usingMock,    setUsingMock]    = useState(true);
  const [loading,      setLoading]      = useState(false);
  const [view,         setView]         = useState<'kanban' | 'list'>('kanban');
  const [search,       setSearch]       = useState('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'all'>('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showImport,   setShowImport]   = useState(false);
  const [showAddLead,  setShowAddLead]  = useState(false);
  const [prefillData,  setPrefillData]  = useState<Partial<Lead> | undefined>(undefined);
  const [dragLeadId,   setDragLeadId]   = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [bulkStage,    setBulkStage]    = useState<LeadStage | ''>('');
  const [stageFilter,  setStageFilter]  = useState<LeadStage | 'all'>('all');

  const { canRead, canWrite } = useRBAC();

  const card     = isDark ? '#0e1530' : '#ffffff';
  const bg       = isDark ? '#080d20' : '#faf7f3';
  const border   = isDark ? '#1c2a55' : '#e8d8cc';
  const text     = isDark ? '#e2e8f0' : '#18100a';
  const muted    = isDark ? '#64748b' : '#9a7860';
  const accent   = '#f97316';

  const isFree      = bizUser.plan === 'free';
  const canKanban   = meetsRequirement(bizUser.plan, 'basic');
  const canImport   = meetsRequirement(bizUser.plan, 'basic');

  // ── Load real data from Supabase ──────────────────────────────────────────

  useEffect(() => {
    if (!bizUser.businessId) return;
    setLoading(true);
    fetchLeads(bizUser.businessId)
      .then(data => {
        if (data !== null) {
          // DB is accessible — use real data (even if empty)
          setLeads(data);
          setUsingMock(false);
        }
        // null means DB unavailable/table missing — keep mock data
      })
      .finally(() => setLoading(false));
  }, [bizUser.businessId]);

  // ── Read prefill from Requirements page conversion ────────────────────────

  useEffect(() => {
    const raw = sessionStorage.getItem('prefill_lead');
    if (!raw) return;
    try {
      const data = JSON.parse(raw) as Partial<Lead>;
      sessionStorage.removeItem('prefill_lead');
      setPrefillData(data);
      setShowAddLead(true);
    } catch { /* ignore malformed */ }
  }, []);

  // ── Overdue check every 5 min ─────────────────────────────────────────────

  const checkOverdueFollowUps = useCallback(() => {
    const overdueLead = leads.find(l => (l.overdue_follow_ups ?? 0) > 0 && !['won','lost'].includes(l.stage));
    if (overdueLead && bizUser) {
      notifyLeadFollowUpDue({
        business: { name: bizUser.name, email: bizUser.email, phone: bizUser.phone },
        businessId: bizUser.id,
        leadName: overdueLead.name,
        followUpTitle: `You have ${overdueLead.overdue_follow_ups} overdue follow-up(s)`,
      }).catch(() => {});
    }
  }, [leads, bizUser]);

  useEffect(() => {
    checkOverdueFollowUps();
    const id = setInterval(checkOverdueFollowUps, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [checkOverdueFollowUps]);

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = leads.filter(l => {
    const q = search.toLowerCase();
    const matchSearch = !q || l.name.toLowerCase().includes(q) ||
      (l.company ?? '').toLowerCase().includes(q) ||
      (l.phone ?? '').includes(q) ||
      (l.product_interest ?? '').toLowerCase().includes(q);
    const matchPriority = priorityFilter === 'all' || l.priority === priorityFilter;
    const matchStage    = stageFilter === 'all' || l.stage === stageFilter;
    return matchSearch && matchPriority && matchStage;
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const pipelineValue = leads.reduce((sum, l) =>
    !['won','lost'].includes(l.stage) ? sum + (l.deal_value ?? 0) : sum, 0);

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const wonThisMonth = leads.filter(l => l.won_at && new Date(l.won_at) >= monthStart).length;
  const overdueCount = leads.reduce((s, l) => s + (l.overdue_follow_ups ?? 0), 0);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAddLead(data: Partial<Lead>) {
    if (isFree && leads.length >= FREE_LEAD_CAP) return;
    const newLead = await insertLead({
      business_id: bizUser.businessId!,
      stage: 'new', priority: 'medium', source: 'manual',
      ...data,
    } as Omit<Lead,'id'|'created_at'|'updated_at'>);
    if (newLead) {
      notifyLeadAction({
        businessId: newLead.business_id,
        eventType: 'lead_created',
        data: {
          leadName:  newLead.name,
          company:   newLead.company,
          dealValue: newLead.deal_value,
          stage:     newLead.stage,
          source:    newLead.source,
        },
      });
      setLeads(prev => [newLead, ...prev]);
    } else {
      // Fallback for dev mode
      const mock: Lead = {
        id: `lead-${Date.now()}`,
        business_id: bizUser.businessId ?? 'biz-dev-1',
        stage: 'new', priority: 'medium', source: 'manual',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...data,
        name: data.name ?? 'New Lead',
      } as Lead;
      setLeads(prev => [mock, ...prev]);
    }
    setShowAddLead(false);
  }

  function handleDrop(targetStage: LeadStage) {
    if (!dragLeadId) return;
    const lead = leads.find(l => l.id === dragLeadId);
    if (!lead || lead.stage === targetStage) { setDragLeadId(null); setDragOverStage(null); return; }
    const updated = { ...lead, stage: targetStage, updated_at: new Date().toISOString() };
    setLeads(prev => prev.map(l => l.id === dragLeadId ? updated : l));
    updateLead(dragLeadId, { stage: targetStage });
    insertLeadActivity({
      lead_id: dragLeadId, business_id: bizUser?.businessId ?? '',
      type: 'stage_change', title: `Moved to ${targetStage}`,
      old_stage: lead.stage, new_stage: targetStage,
    });
    setDragLeadId(null);
    setDragOverStage(null);
  }

  function handleLeadUpdate(updatedLead: Lead) {
    setLeads(prev => prev.map(l => l.id === updatedLead.id ? updatedLead : l));
    setSelectedLead(updatedLead);
  }

  function handleImported(importedLeads: Lead[]) {
    setLeads(prev => [...importedLeads, ...prev]);
  }

  // ── CSV Export ────────────────────────────────────────────────────────────

  function exportLeadsCSV(leadsToExport: Lead[]) {
    const headers = ['Name', 'Company', 'Phone', 'Email', 'Stage', 'Priority', 'Deal Value', 'Source', 'Product Interest', 'Notes', 'Tags', 'Created'];
    const rows = leadsToExport.map(l => [
      l.name, l.company ?? '', l.phone ?? '', l.email ?? '',
      l.stage, l.priority, l.deal_value ?? '', l.source,
      l.product_interest ?? '', l.notes ?? '',
      (l.tags ?? []).join('; '),
      new Date(l.created_at).toLocaleDateString('en-IN'),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Bulk stage change ─────────────────────────────────────────────────────

  async function handleBulkStageChange() {
    if (!bulkStage) return;
    const ids = Array.from(selectedLeads);
    setLeads(prev => prev.map(l => selectedLeads.has(l.id) ? { ...l, stage: bulkStage as LeadStage } : l));
    await Promise.all(ids.map(id => updateLead(id, { stage: bulkStage as LeadStage })));
    setSelectedLeads(new Set());
    setBulkStage('');
  }

  // ── Campaign blast from leads ─────────────────────────────────────────────

  function handleBulkCampaign() {
    const sel = leads.filter(l => selectedLeads.has(l.id));
    const phones = sel.map(l => l.phone).filter(Boolean).join(',');
    const names  = sel.map(l => l.name).join(', ');
    const params = new URLSearchParams({ from_leads: '1', phones, names, count: String(sel.length) });
    navigate(`/outreach?campaign=${btoa(params.toString())}`);
    setSelectedLeads(new Set());
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const statCards = [
    { label: 'Total Leads',      value: leads.length,                    icon: <Users size={16} color={muted} />,       color: '#3b82f6' },
    { label: 'Pipeline Value',   value: formatCurrency(pipelineValue),   icon: <TrendingUp size={16} color={muted} />,  color: '#f97316' },
    { label: 'Won This Month',   value: wonThisMonth,                    icon: <Trophy size={16} color={muted} />,      color: '#22c55e' },
    { label: 'Overdue Follow-ups', value: overdueCount,                  icon: <Clock size={16} color={muted} />,       color: overdueCount > 0 ? '#ef4444' : muted as string },
  ];

  // RBAC no-access guard
  if (!canRead('leads')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: text }}>No access to Leads</div>
        <div style={{ fontSize: 13, color: muted }}>Contact your business owner to request access.</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Demo data banner ───────────────────────────────────────────────── */}
      {usingMock && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '8px 14px', marginBottom: 12, fontSize: 12, color: '#92400e',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <span>
            <strong>Demo data</strong> — Run the leads migration in Supabase SQL editor to connect real data.
            See <code style={{ background: '#fde68a', padding: '1px 4px', borderRadius: 3 }}>supabase/migrations/20240007_leads_schema.sql</code>
          </span>
        </div>
      )}

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: card, borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${border}`,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: muted, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {s.label}
              </span>
              {s.icon}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action bar ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        {/* View toggle */}
        <div style={{
          display: 'flex', background: isDark ? '#0a1020' : '#f3f4f6',
          borderRadius: 8, padding: 2, flexShrink: 0,
          border: `1px solid ${border}`,
        }}>
          <button onClick={() => setView('kanban')} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: view === 'kanban' ? card : 'transparent',
            color: view === 'kanban' ? accent : muted,
            fontSize: 12, fontWeight: view === 'kanban' ? 700 : 400,
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: view === 'kanban' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          }}>
            <LayoutGrid size={13} /> Kanban
          </button>
          <button onClick={() => setView('list')} style={{
            padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
            background: view === 'list' ? card : 'transparent',
            color: view === 'list' ? accent : muted,
            fontSize: 12, fontWeight: view === 'list' ? 700 : 400,
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: view === 'list' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
          }}>
            <List size={13} /> List
          </button>
        </div>
        <HintTooltip
          hint="Kanban view shows leads as cards grouped by stage. List view shows them as a sortable table. Both show the same data."
          position="bottom"
        />

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads…"
            style={{
              width: '100%', padding: '8px 12px 8px 30px',
              background: isDark ? '#0a1020' : '#fdf6f0',
              border: `1px solid ${border}`, borderRadius: 8,
              color: text, fontSize: 13, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Priority filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Filter size={13} color={muted} />
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as LeadPriority | 'all')}
            style={{
              padding: '7px 10px', background: isDark ? '#0a1020' : '#fdf6f0',
              border: `1px solid ${border}`, borderRadius: 8,
              color: text, fontSize: 12, outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Buttons */}
        {/* Export CSV */}
        <button
          onClick={() => exportLeadsCSV(filtered)}
          title="Export visible leads as CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 14px', background: isDark ? '#0a1020' : '#f3f4f6',
            border: `1px solid ${border}`, borderRadius: 8,
            cursor: 'pointer', color: text, fontSize: 12, fontWeight: 600, flexShrink: 0,
          }}
        >
          ⬇️ Export
        </button>

        {canWrite('leads') && (
          <button
            onClick={() => canImport ? setShowImport(true) : undefined}
            title={canImport ? 'Import leads' : 'Requires Basic plan'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '8px 14px', background: isDark ? '#0a1020' : '#f3f4f6',
              border: `1px solid ${border}`, borderRadius: 8,
              cursor: canImport ? 'pointer' : 'not-allowed',
              color: canImport ? text : muted, fontSize: 12, fontWeight: 600,
              opacity: canImport ? 1 : 0.5, flexShrink: 0,
            }}
          >
            <Upload size={13} /> Import
          </button>
        )}

        {canWrite('leads') && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={() => {
                if (isFree && leads.length >= FREE_LEAD_CAP) return;
                setShowAddLead(true);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 16px',
                background: isFree && leads.length >= FREE_LEAD_CAP
                  ? `${accent}44` : `linear-gradient(135deg, ${accent}, #fb923c)`,
                border: 'none', borderRadius: 8,
                cursor: isFree && leads.length >= FREE_LEAD_CAP ? 'not-allowed' : 'pointer',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 12px rgba(249,115,22,0.4)', flexShrink: 0,
              }}
            >
              <Plus size={14} />
              Add Lead
              {isFree && (
                <span style={{ fontSize: 10, opacity: 0.85, marginLeft: 2 }}>
                  ({leads.length}/{FREE_LEAD_CAP})
                </span>
              )}
            </button>
            <HintTooltip
              title="What is a Lead?"
              hint="A lead is a potential customer you're tracking. Add their contact info, deal value, and stage. Move them through the pipeline as you progress toward a sale."
              position="bottom"
            />
          </div>
        )}
      </div>

      {/* ── Stage quick-filter chips ──────────────────────────────────────── */}
      {leads.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: muted, fontWeight: 600, marginRight: 2 }}>Filter:</span>
          {[{ key: 'all' as const, label: 'All', color: muted }, ...STAGES].map(s => {
            const count = s.key === 'all' ? leads.length : leads.filter(l => l.stage === s.key).length;
            const isActive = stageFilter === s.key;
            const color = 'color' in s ? s.color : muted;
            return (
              <button
                key={s.key}
                onClick={() => setStageFilter(s.key)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: isActive ? 700 : 500,
                  border: `1px solid ${isActive ? color : border}`,
                  background: isActive ? `${color}22` : 'transparent',
                  color: isActive ? color : muted,
                  cursor: 'pointer', transition: 'all 0.12s',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {s.label}
                <span style={{
                  background: isActive ? color : (isDark ? '#1c2a55' : '#e5e7eb'),
                  color: isActive ? '#fff' : muted,
                  borderRadius: 8, padding: '0 5px', fontSize: 10, fontWeight: 700,
                }}>
                  {count}
                </span>
              </button>
            );
          })}
          {stageFilter !== 'all' && (
            <button
              onClick={() => setStageFilter('all')}
              style={{ padding: '4px 8px', borderRadius: 20, fontSize: 11, border: `1px solid ${border}`, background: 'none', color: muted, cursor: 'pointer' }}
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* ── Empty DB state ─────────────────────────────────────────────────── */}
      {!usingMock && leads.length === 0 && (
        <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎯</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: text, marginBottom: 8 }}>Start building your pipeline</div>
            <div style={{ fontSize: 13, color: muted, lineHeight: 1.6 }}>
              Track every potential customer from first contact to closed deal — all in one place.
            </div>
          </div>

          {/* 3-step guide */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 440 }}>
            {[
              { step: '1', icon: '➕', title: 'Add your first lead', desc: 'Click "Add Lead" and fill in the customer\'s name, phone, and what they\'re interested in.', action: 'Add Lead', onClick: () => setShowAddLead(true) },
              { step: '2', icon: '📋', title: 'Track across stages', desc: 'Move leads through New → Contacted → Proposal → Won. The kanban view makes it visual.', action: null, onClick: null },
              { step: '3', icon: '📣', title: 'Send a campaign', desc: 'Once you have leads, go to Outreach to send bulk WhatsApp, SMS or email campaigns.', action: 'Go to Outreach', onClick: () => navigate('/outreach') },
            ].map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 12, background: card, border: `1px solid ${border}`, alignItems: 'flex-start' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${accent}22`, border: `2px solid ${accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {s.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 3 }}>
                    <span style={{ color: accent, marginRight: 6 }}>Step {s.step}.</span>{s.title}
                  </div>
                  <div style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{s.desc}</div>
                  {s.action && (
                    <button onClick={s.onClick!} style={{ marginTop: 8, padding: '5px 14px', background: `${accent}15`, border: `1px solid ${accent}44`, borderRadius: 20, fontSize: 12, fontWeight: 700, color: accent, cursor: 'pointer' }}>
                      {s.action} →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Primary CTA */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowAddLead(true)} style={{ padding: '11px 28px', background: `linear-gradient(135deg, ${accent}, #fb923c)`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}>
              + Add First Lead
            </button>
            <button onClick={() => setShowImport(true)} style={{ padding: '11px 20px', background: 'none', border: `1px solid ${border}`, borderRadius: 10, color: muted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              📥 Import CSV
            </button>
          </div>

          {/* Tip box */}
          <div style={{ padding: '10px 16px', borderRadius: 10, background: isDark ? '#0a1428' : '#eff6ff', border: `1px solid ${isDark ? '#1e3a5f' : '#bfdbfe'}`, fontSize: 12, color: isDark ? '#93c5fd' : '#1d4ed8', maxWidth: 440, width: '100%', lineHeight: 1.6 }}>
            💡 <strong>Pro tip:</strong> Import a CSV file with your existing contacts to get started in seconds. The AI will automatically detect duplicates and group related leads.
          </div>
        </div>
      )}

      {/* ── Kanban view ────────────────────────────────────────────────────── */}
      {view === 'kanban' && (leads.length > 0 || usingMock) && (
        <div style={{ position: 'relative' }}>
          {/* Free plan overlay */}
          {!canKanban && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
              borderRadius: 12, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
            }}>
              <div style={{ fontSize: 40 }}>🔒</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Kanban View — Basic Plan</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center', maxWidth: 280 }}>
                Upgrade to Basic plan to unlock the Kanban pipeline view, CSV import, and more.
              </div>
              <button onClick={() => {}} style={{
                padding: '10px 28px', background: `linear-gradient(135deg, ${accent}, #fb923c)`,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: '#fff', fontSize: 14, fontWeight: 700,
                boxShadow: '0 4px 16px rgba(249,115,22,0.5)',
              }}>
                Upgrade to Basic
              </button>
            </div>
          )}

          {/* Kanban board */}
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            paddingBottom: 12, minHeight: 500,
          }}>
            {STAGES.map(stage => {
              const stageLeads = filtered.filter(l => l.stage === stage.key);
              const stageValue = stageLeads.reduce((s, l) => s + (l.deal_value ?? 0), 0);
              return (
                <div key={stage.key} style={{
                  minWidth: 240, maxWidth: 260, flex: '0 0 240px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Column header */}
                  <div style={{
                    padding: '10px 12px', borderRadius: '10px 10px 0 0',
                    background: `${stage.color}22`,
                    border: `1px solid ${stage.color}44`,
                    borderBottom: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: stage.color }}>{stage.label}</span>
                      <span style={{
                        background: stage.color, color: '#fff',
                        fontSize: 10, fontWeight: 800,
                        padding: '1px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
                      }}>
                        {stageLeads.length}
                      </span>
                    </div>
                    {stageValue > 0 && (
                      <span style={{ fontSize: 10, color: stage.color, fontWeight: 700 }}>
                        ₹{(stageValue / 1000).toFixed(0)}k
                      </span>
                    )}
                  </div>

                  {/* Cards — drop zone */}
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverStage(stage.key); }}
                    onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverStage(null); }}
                    onDrop={e => { e.preventDefault(); handleDrop(stage.key); }}
                    style={{
                      flex: 1, padding: 8,
                      background: dragOverStage === stage.key
                        ? (isDark ? `${stage.color}18` : `${stage.color}0d`)
                        : (isDark ? '#0a1020' : '#f3f4f6'),
                      border: `2px ${dragOverStage === stage.key ? 'dashed' : 'solid'} ${dragOverStage === stage.key ? stage.color : stage.color + '44'}`,
                      borderRadius: '0 0 10px 10px',
                      display: 'flex', flexDirection: 'column', gap: 8,
                      minHeight: 200,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    {loading && stageLeads.length === 0 && (
                      <div style={{ textAlign: 'center', color: muted, fontSize: 12, paddingTop: 20 }}>Loading…</div>
                    )}
                    {!loading && stageLeads.length === 0 && (
                      <div style={{ textAlign: 'center', fontSize: 11, paddingTop: 20, opacity: dragOverStage === stage.key ? 1 : 0.5, color: dragOverStage === stage.key ? stage.color : muted }}>
                        {dragOverStage === stage.key ? '↓ Drop here' : 'No leads'}
                      </div>
                    )}
                    {stageLeads.map(lead => (
                      <KanbanCard
                        key={lead.id}
                        lead={lead}
                        stageColor={stage.color}
                        isDark={isDark}
                        border={border}
                        text={text}
                        muted={muted}
                        card={card}
                        isDragging={dragLeadId === lead.id}
                        onDragStart={() => setDragLeadId(lead.id)}
                        onDragEnd={() => { setDragLeadId(null); setDragOverStage(null); }}
                        onClick={() => setSelectedLead(lead)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── List view ──────────────────────────────────────────────────────── */}
      {view === 'list' && (leads.length > 0 || usingMock) && (
        <div style={{
          background: card, borderRadius: 12,
          border: `1px solid ${border}`, overflow: 'hidden',
          boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '32px 2fr 1fr 1fr 1fr 1fr 1fr',
            padding: '10px 16px',
            borderBottom: `1px solid ${border}`,
            background: isDark ? '#0a1020' : '#fdf6f0',
            alignItems: 'center',
          }}>
            <input
              type="checkbox"
              checked={selectedLeads.size === filtered.length && filtered.length > 0}
              onChange={e => setSelectedLeads(e.target.checked ? new Set(filtered.map(l => l.id)) : new Set())}
              style={{ cursor: 'pointer', accentColor: accent }}
            />
            {['Name / Company', 'Stage', 'Priority', 'Deal Value', 'Source', 'Created'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: muted, fontSize: 13 }}>
              {search ? 'No leads match your search' : 'No leads yet. Add your first lead!'}
            </div>
          ) : (
            filtered.map((lead, i) => {
              const stageInfo = STAGES.find(s => s.key === lead.stage)!;
              const pcol = PRIORITY_COLORS[lead.priority];
              const isSelected = selectedLeads.has(lead.id);
              return (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  style={{
                    display: 'grid', gridTemplateColumns: '32px 2fr 1fr 1fr 1fr 1fr 1fr',
                    padding: '12px 16px',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${border}` : 'none',
                    cursor: 'pointer', alignItems: 'center',
                    transition: 'background 0.12s',
                    background: isSelected ? (isDark ? '#f9731610' : '#fff7ed') : 'transparent',
                  }}
                  onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = isDark ? '#ffffff08' : '#fdf6f0'; }}
                  onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={e => {
                      const next = new Set(selectedLeads);
                      if (e.target.checked) next.add(lead.id); else next.delete(lead.id);
                      setSelectedLeads(next);
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ cursor: 'pointer', accentColor: accent }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{lead.name}</div>
                    {lead.company && (
                      <div style={{ fontSize: 11, color: muted, marginTop: 1 }}>{lead.company}</div>
                    )}
                    {(lead.follow_up_count ?? 0) > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                        {(lead.overdue_follow_ups ?? 0) > 0 && (
                          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>
                            ⏰ {lead.overdue_follow_ups} overdue
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      background: `${stageInfo.color}22`, color: stageInfo.color,
                      border: `1px solid ${stageInfo.color}44`,
                    }}>
                      {stageInfo.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: pcol, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: pcol, fontWeight: 600, textTransform: 'capitalize' }}>{lead.priority}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>
                    {formatCurrency(lead.deal_value)}
                  </div>
                  <div style={{ fontSize: 13, color: muted }}>
                    {SOURCE_ICONS[lead.source] ?? '📌'} {lead.source.replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: 11, color: muted }}>
                    {daysAgo(lead.created_at) === 0 ? 'Today' : `${daysAgo(lead.created_at)}d ago`}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Bulk action bar ────────────────────────────────────────────────── */}
      {selectedLeads.size > 0 && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          zIndex: 100, background: isDark ? '#0e1530' : '#fff',
          border: `1px solid ${border}`, borderRadius: 14,
          padding: '12px 20px', boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: text }}>
            {selectedLeads.size} lead{selectedLeads.size > 1 ? 's' : ''} selected
          </span>
          <select
            value={bulkStage}
            onChange={e => setBulkStage(e.target.value as LeadStage | '')}
            style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${border}`, background: isDark ? '#0a1020' : '#fdf6f0', color: text, fontSize: 12, cursor: 'pointer' }}
          >
            <option value="">Move to stage…</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <button onClick={handleBulkStageChange} disabled={!bulkStage} style={{ padding: '7px 14px', borderRadius: 8, background: bulkStage ? `linear-gradient(135deg, ${accent}, #fb923c)` : '#64748b', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: bulkStage ? 'pointer' : 'default' }}>
            Apply
          </button>
          <div style={{ width: 1, height: 24, background: border }} />
          <button onClick={handleBulkCampaign} style={{ padding: '7px 14px', borderRadius: 8, background: isDark ? '#0a1020' : '#eff6ff', border: '1px solid #3b82f630', color: '#3b82f6', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            📣 Create Campaign
          </button>
          <button onClick={() => exportLeadsCSV(leads.filter(l => selectedLeads.has(l.id)))} style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${border}`, background: 'none', color: muted, fontSize: 12, cursor: 'pointer' }}>
            ⬇️ Export Selected
          </button>
          <button onClick={() => setSelectedLeads(new Set())} style={{ padding: '7px 12px', borderRadius: 8, border: `1px solid ${border}`, background: 'none', color: muted, fontSize: 12, cursor: 'pointer' }}>
            ✕ Cancel
          </button>
        </div>
      )}

      {/* ── Modals / panels ───────────────────────────────────────────────── */}

      {showAddLead && (
        <LeadFormModal
          onClose={() => { setShowAddLead(false); setPrefillData(undefined); }}
          onSave={handleAddLead}
          initial={prefillData}
        />
      )}

      {showImport && (
        <LeadImportModal
          onClose={() => setShowImport(false)}
          onImported={handleImported}
          currentLeadCount={leads.length}
        />
      )}

      <LeadDetailPanel
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onLeadUpdate={handleLeadUpdate}
      />
    </div>
  );
}

// ── KanbanCard ────────────────────────────────────────────────────────────────

interface KanbanCardProps {
  lead: Lead;
  stageColor: string;
  isDark: boolean;
  border: string;
  text: string;
  muted: string;
  card: string;
  isDragging?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onClick: () => void;
}

function KanbanCard({ lead, stageColor, isDark, border, text, muted, card, isDragging, onDragStart, onDragEnd, onClick }: KanbanCardProps) {
  const pcol = PRIORITY_COLORS[lead.priority];
  const daysSinceUpdate = daysAgo(lead.updated_at);

  return (
    <div
      draggable
      onDragStart={e => { e.stopPropagation(); onDragStart(); }}
      onDragEnd={e => { e.stopPropagation(); onDragEnd(); }}
      onClick={onClick}
      style={{
        background: card, borderRadius: 10, padding: 12,
        border: `1px solid ${border}`,
        cursor: 'grab', position: 'relative',
        opacity: isDragging ? 0.4 : 1,
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.08)',
        transition: 'transform 0.12s, box-shadow 0.12s, opacity 0.15s',
        userSelect: 'none',
      }}
      onMouseEnter={e => {
        if (isDragging) return;
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
        (e.currentTarget as HTMLElement).style.boxShadow = isDark
          ? '0 6px 20px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLElement).style.boxShadow = isDark
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 1px 4px rgba(0,0,0,0.08)';
      }}
    >
      {/* Priority dot */}
      <span style={{
        position: 'absolute', top: 10, right: 10,
        width: 8, height: 8, borderRadius: '50%',
        background: pcol,
      }} />

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: text, paddingRight: 16, marginBottom: 3, lineHeight: 1.3 }}>
        {lead.name}
      </div>
      {lead.company && (
        <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>{lead.company}</div>
      )}

      {/* Deal value + source */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        {lead.deal_value ? (
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#22c55e',
            background: '#22c55e18', padding: '2px 7px', borderRadius: 8,
            border: '1px solid #22c55e30',
          }}>
            ₹{(lead.deal_value / 1000).toFixed(0)}k
          </span>
        ) : <span />}
        <span style={{ fontSize: 12 }} title={`Source: ${lead.source}`}>
          {SOURCE_ICONS[lead.source] ?? '📌'}
        </span>
      </div>

      {/* Overdue indicator */}
      {(lead.overdue_follow_ups ?? 0) > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6,
          padding: '3px 7px', background: '#ef444418', borderRadius: 6,
          border: '1px solid #ef444430',
        }}>
          <Clock size={10} color="#ef4444" />
          <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 700 }}>
            {lead.overdue_follow_ups} overdue
          </span>
        </div>
      )}

      {/* Days since update */}
      <div style={{ fontSize: 10, color: muted, marginTop: 2 }}>
        {daysSinceUpdate === 0 ? 'Updated today' : `${daysSinceUpdate}d ago`}
      </div>

      {/* Tags */}
      {(lead.tags ?? []).length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {lead.tags!.slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              background: `${stageColor}18`, color: stageColor, border: `1px solid ${stageColor}30`,
            }}>
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

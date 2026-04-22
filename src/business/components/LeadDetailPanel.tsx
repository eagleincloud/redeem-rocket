import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import {
  X, Phone, Mail, MessageCircle, MessageSquare, Building2, Tag, DollarSign,
  FileText, CheckCircle, Clock, Plus, ChevronRight, AlertCircle, GitBranch,
} from 'lucide-react';
import { SendMessageModal, type MessageChannel } from './SendMessageModal';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import {
  fetchLeadActivities, fetchLeadFollowUps, insertLeadActivity,
  insertLeadFollowUp, completeFollowUp, updateLead,
  type Lead, type LeadActivity, type LeadFollowUp, type LeadStage, type ActivityType,
} from '@/app/api/supabase-data';
import { LeadLineagePanel } from './LeadLineagePanel';
import { LeadScoreCard } from './LeadScoreCard';
import { notifyLeadAction } from '@/services/notificationService';

// ── Stage constants ────────────────────────────────────────────────────────────

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new',         label: 'New',         color: '#64748b' },
  { key: 'contacted',   label: 'Contacted',   color: '#3b82f6' },
  { key: 'qualified',   label: 'Qualified',   color: '#f59e0b' },
  { key: 'proposal',    label: 'Proposal',    color: '#f97316' },
  { key: 'negotiation', label: 'Negotiation', color: '#a855f7' },
  { key: 'won',         label: 'Won',         color: '#22c55e' },
  { key: 'lost',        label: 'Lost',        color: '#ef4444' },
];

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: string }[] = [
  { value: 'note',     label: 'Note',        icon: '📝' },
  { value: 'call',     label: 'Call',        icon: '📞' },
  { value: 'email',    label: 'Email',       icon: '✉️' },
  { value: 'whatsapp', label: 'WhatsApp',    icon: '💬' },
  { value: 'sms',      label: 'SMS',         icon: '📱' },
  { value: 'meeting',  label: 'Meeting',     icon: '🤝' },
];

const FOLLOWUP_TYPES = [
  { value: 'call',      label: 'Call',     icon: '📞' },
  { value: 'email',     label: 'Email',    icon: '✉️' },
  { value: 'whatsapp',  label: 'WhatsApp', icon: '💬' },
  { value: 'sms',       label: 'SMS',      icon: '📱' },
  { value: 'meeting',   label: 'Meeting',  icon: '🤝' },
  { value: 'other',     label: 'Other',    icon: '📌' },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  lead: Lead | null;
  onClose: () => void;
  onLeadUpdate: (lead: Lead) => void;
  popupMode?: boolean;
}

type Tab = 'overview' | 'activity' | 'followups' | 'lineage';

export function LeadDetailPanel({ lead, onClose, onLeadUpdate, popupMode = false }: Props) {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const navigate = useNavigate();
  const [tab, setTab]                   = useState<Tab>('overview');
  // Nested popup lead — opened from lineage tab
  const [nestedPopupLead, setNestedPopupLead] = useState<Lead | null>(null);
  const [activities, setActivities]     = useState<LeadActivity[]>([]);
  const [followUps,  setFollowUps]      = useState<LeadFollowUp[]>([]);
  const [loadingAct, setLoadingAct]     = useState(false);
  const [loadingFu,  setLoadingFu]      = useState(false);

  // Edit state
  const [editDeal,    setEditDeal]    = useState('');
  const [editProduct, setEditProduct] = useState('');
  const [editNotes,   setEditNotes]   = useState('');
  const [editProposal,setEditProposal]= useState('');
  const [savingEdit,  setSavingEdit]  = useState(false);

  // Add activity
  const [showAddAct,    setShowAddAct]    = useState(false);
  const [actType,       setActType]       = useState<ActivityType>('note');
  const [actTitle,      setActTitle]      = useState('');
  const [actBody,       setActBody]       = useState('');
  const [savingAct,     setSavingAct]     = useState(false);

  // Add follow-up
  const [showAddFu,     setShowAddFu]     = useState(false);
  const [fuType,        setFuType]        = useState('call');
  const [fuTitle,       setFuTitle]       = useState('');
  const [fuDue,         setFuDue]         = useState('');
  const [fuNotes,       setFuNotes]       = useState('');
  const [savingFu,      setSavingFu]      = useState(false);

  // Send message modal
  const [sendMsg, setSendMsg] = useState<{ channel: MessageChannel; defaultMessage?: string; defaultSubject?: string } | null>(null);

  // Close / won / lost flow
  const [showWonForm,   setShowWonForm]   = useState(false);
  const [showLostForm,  setShowLostForm]  = useState(false);
  const [wonValue,      setWonValue]      = useState('');
  const [lostReason,    setLostReason]    = useState('');

  const panel    = isDark ? '#0e1530' : '#ffffff';
  const bg       = isDark ? '#080d20' : '#faf7f3';
  const border   = isDark ? '#1c2a55' : '#e8d8cc';
  const text     = isDark ? '#e2e8f0' : '#18100a';
  const muted    = isDark ? '#64748b' : '#9a7860';
  const accent   = '#f97316';
  const inputBg  = isDark ? '#0a1020' : '#fdf6f0';

  const inputSt = {
    width: '100%', padding: '8px 12px', background: inputBg,
    border: `1px solid ${border}`, borderRadius: 8, color: text,
    fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
    fontFamily: 'inherit',
  };

  // Sync editable fields when lead changes
  useEffect(() => {
    if (!lead) return;
    setEditDeal(lead.deal_value ? String(lead.deal_value) : '');
    setEditProduct(lead.product_interest ?? '');
    setEditNotes(lead.notes ?? '');
    setEditProposal(lead.proposal_url ?? '');
    setTab('overview');
    setShowAddAct(false);
    setShowAddFu(false);
  }, [lead?.id]);

  // Load activities when tab = activity
  useEffect(() => {
    if (tab !== 'activity' || !lead) return;
    setLoadingAct(true);
    fetchLeadActivities(lead.id)
      .then(data => { if (data.length) setActivities(data); })
      .finally(() => setLoadingAct(false));
  }, [tab, lead?.id]);

  // Load follow-ups when tab = followups
  useEffect(() => {
    if (tab !== 'followups' || !lead) return;
    setLoadingFu(true);
    fetchLeadFollowUps(lead.id)
      .then(data => { if (data.length) setFollowUps(data); })
      .finally(() => setLoadingFu(false));
  }, [tab, lead?.id]);

  if (!lead) return null;

  const stageInfo = STAGES.find(s => s.key === lead.stage) ?? STAGES[0];
  const PRIORITY_COLORS: Record<string, string> = {
    low: '#22c55e', medium: '#f59e0b', high: '#ef4444', urgent: '#a855f7',
  };
  const priorityColor = PRIORITY_COLORS[lead.priority] ?? '#64748b';

  // ── Stage stepper ──────────────────────────────────────────────────────────
  async function handleStageChange(newStage: LeadStage) {
    if (newStage === lead.stage) return;
    const oldStage = lead.stage;
    const patch: Partial<Lead> = { stage: newStage };
    if (newStage === 'won') { patch.won_at = new Date().toISOString(); }
    if (newStage === 'lost') { patch.lost_at = new Date().toISOString(); }
    await updateLead(lead.id, patch);
    await insertLeadActivity({
      lead_id: lead.id, business_id: lead.business_id,
      type: 'stage_change',
      title: `Stage moved: ${oldStage} → ${newStage}`,
      old_stage: oldStage, new_stage: newStage,
    });
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: newStage === 'won' ? 'lead_won' : newStage === 'lost' ? 'lead_lost' : 'lead_stage_changed',
      data: {
        leadName:    lead.name,
        oldStage:    oldStage,
        newStage:    newStage,
        company:     lead.company,
        dealValue:   lead.deal_value,
        closedValue: lead.closed_value,
        lostReason:  lead.lost_reason,
      },
      actorName: bizUser?.name ?? undefined,
    });
    onLeadUpdate({ ...lead, ...patch });
  }

  // ── Save overview edits ────────────────────────────────────────────────────
  async function handleSaveOverview() {
    setSavingEdit(true);
    await updateLead(lead.id, {
      deal_value:       editDeal ? Number(editDeal) : undefined,
      product_interest: editProduct || undefined,
      notes:            editNotes || undefined,
      proposal_url:     editProposal || undefined,
    });
    onLeadUpdate({
      ...lead,
      deal_value:       editDeal ? Number(editDeal) : undefined,
      product_interest: editProduct || undefined,
      notes:            editNotes || undefined,
      proposal_url:     editProposal || undefined,
    });
    setSavingEdit(false);
  }

  // ── Mark Won ───────────────────────────────────────────────────────────────
  async function handleMarkWon() {
    const patch: Partial<Lead> = {
      stage: 'won', won_at: new Date().toISOString(),
      closed_value: wonValue ? Number(wonValue) : undefined,
    };
    await updateLead(lead.id, patch);
    await insertLeadActivity({
      lead_id: lead.id, business_id: lead.business_id,
      type: 'won', title: `Deal closed 🎉${wonValue ? ` — ₹${Number(wonValue).toLocaleString('en-IN')}` : ''}`,
    });
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: 'lead_won',
      data: {
        leadName:    lead.name,
        company:     lead.company,
        dealValue:   lead.deal_value,
        closedValue: wonValue ? Number(wonValue) : lead.closed_value,
      },
      actorName: bizUser?.name ?? undefined,
    });
    onLeadUpdate({ ...lead, ...patch });
    setShowWonForm(false);
    setWonValue('');
  }

  // ── Mark Lost ──────────────────────────────────────────────────────────────
  async function handleMarkLost() {
    const patch: Partial<Lead> = {
      stage: 'lost', lost_at: new Date().toISOString(), lost_reason: lostReason || undefined,
    };
    await updateLead(lead.id, patch);
    await insertLeadActivity({
      lead_id: lead.id, business_id: lead.business_id,
      type: 'lost', title: `Lead lost${lostReason ? `: ${lostReason}` : ''}`,
    });
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: 'lead_lost',
      data: {
        leadName:   lead.name,
        company:    lead.company,
        dealValue:  lead.deal_value,
        lostReason: lostReason || undefined,
      },
      actorName: bizUser?.name ?? undefined,
    });
    onLeadUpdate({ ...lead, ...patch });
    setShowLostForm(false);
    setLostReason('');
  }

  // ── Create Invoice from Won lead ───────────────────────────────────────────
  function handleCreateInvoice() {
    const params = new URLSearchParams({
      customer: lead.name,
      phone:    lead.phone ?? '',
      email:    lead.email ?? '',
      company:  lead.company ?? '',
      amount:   String(lead.closed_value ?? lead.deal_value ?? ''),
      notes:    lead.product_interest ?? '',
      lead_id:  lead.id,
    });
    navigate(`/invoices?prefill=${btoa(params.toString())}`);
    onClose();
  }

  // ── Log Activity ───────────────────────────────────────────────────────────
  async function handleAddActivity() {
    if (!actTitle.trim()) return;
    setSavingAct(true);
    const newAct: Omit<LeadActivity,'id'|'created_at'> = {
      lead_id: lead.id, business_id: lead.business_id,
      type: actType, title: actTitle.trim(), body: actBody.trim() || undefined,
    };
    await insertLeadActivity(newAct);
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: 'lead_activity_logged',
      data: {
        leadName:      lead.name,
        activityTitle: actTitle.trim(),
        activityBody:  actBody.trim() || undefined,
      },
      actorName: bizUser?.name ?? undefined,
    });
    const mockAct: LeadActivity = { ...newAct, id: `act-${Date.now()}`, created_at: new Date().toISOString() };
    setActivities(prev => [mockAct, ...prev]);
    setActTitle(''); setActBody(''); setShowAddAct(false);
    setSavingAct(false);
  }

  // ── Schedule Follow-up ─────────────────────────────────────────────────────
  async function handleAddFollowUp() {
    if (!fuTitle.trim() || !fuDue) return;
    setSavingFu(true);
    const newFu: Omit<LeadFollowUp,'id'|'created_at'> = {
      lead_id: lead.id, business_id: lead.business_id,
      type: fuType, title: fuTitle.trim(),
      notes: fuNotes.trim() || undefined,
      due_at: new Date(fuDue).toISOString(),
      reminder_sent: false, completed: false,
    };
    await insertLeadFollowUp(newFu);
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: 'lead_follow_up_scheduled',
      data: {
        leadName:      lead.name,
        followUpTitle: fuTitle.trim(),
        dueAt:         new Date(fuDue).toLocaleDateString('en-IN'),
      },
      actorName: bizUser?.name ?? undefined,
    });
    const mockFu: LeadFollowUp = { ...newFu, id: `fu-${Date.now()}`, created_at: new Date().toISOString() };
    setFollowUps(prev => [...prev, mockFu].sort((a,b) => a.due_at.localeCompare(b.due_at)));
    setFuTitle(''); setFuDue(''); setFuNotes(''); setShowAddFu(false);
    setSavingFu(false);
  }

  // ── Complete Follow-up ─────────────────────────────────────────────────────
  async function handleCompleteFollowUp(fu: LeadFollowUp) {
    await completeFollowUp(fu.id);
    notifyLeadAction({
      businessId: lead.business_id,
      eventType: 'lead_follow_up_completed',
      data: {
        leadName:      lead.name,
        followUpTitle: fu.title,
      },
      actorName: bizUser?.name ?? undefined,
    });
    setFollowUps(prev => prev.map(f => f.id === fu.id ? { ...f, completed: true, completed_at: new Date().toISOString() } : f));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const panelContent = (
    <div
      onClick={e => e.stopPropagation()}
      style={popupMode
        ? {
            position: 'relative', width: '100%', maxWidth: 500, maxHeight: '88vh',
            background: panel, borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          }
        : {
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 'min(100%, 460px)',
            background: panel, zIndex: 80,
            display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 32px rgba(0,0,0,0.35)',
            borderLeft: `1px solid ${border}`,
            transform: lead ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.28s cubic-bezier(.22,1,.36,1)',
          }
      }
    >

        {/* Back to New Lead button — popup mode only */}
        {popupMode && (
          <div style={{
            padding: '10px 16px', background: isDark ? '#0a1020' : '#fdf6f0',
            borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 8,
            flexShrink: 0,
          }}>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: accent,
              fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ← Back to New Lead
            </button>
          </div>
        )}

        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {lead.name}
              </span>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: priorityColor, flexShrink: 0,
              }} />
            </div>
            {lead.company && (
              <div style={{ fontSize: 12, color: muted }}>{lead.company}</div>
            )}
            <div style={{
              display: 'inline-flex', alignItems: 'center', marginTop: 4,
              padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
              background: `${stageInfo.color}22`, color: stageInfo.color,
              border: `1px solid ${stageInfo.color}44`,
            }}>
              {stageInfo.label}
            </div>
            {lead.deal_value && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 700,
                color: '#22c55e',
              }}>
                ₹{Number(lead.deal_value).toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: muted,
            padding: 4, borderRadius: 6, display: 'flex', flexShrink: 0,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick actions */}
        <div style={{
          padding: '10px 16px', display: 'flex', gap: 8,
          borderBottom: `1px solid ${border}`, flexShrink: 0,
        }}>
          {lead.phone && (
            <button
              onClick={e => { e.stopPropagation(); setSendMsg({ channel: 'whatsapp', defaultMessage: `Hi ${lead.name}, ` }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', cursor: 'pointer' }}
            >
              <MessageSquare size={13} /> WhatsApp
            </button>
          )}
          {lead.phone && (
            <button
              onClick={e => { e.stopPropagation(); setSendMsg({ channel: 'sms', defaultMessage: `Hi ${lead.name}, ` }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#f59e0b22', color: '#f59e0b', border: '1px solid #f59e0b44', cursor: 'pointer' }}
            >
              <Phone size={13} /> SMS
            </button>
          )}
          {lead.email && (
            <button
              onClick={e => { e.stopPropagation(); setSendMsg({ channel: 'email', defaultMessage: `Hi ${lead.name},\n\n`, defaultSubject: 'Following up' }); }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644', cursor: 'pointer' }}
            >
              <Mail size={13} /> Email
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: `1px solid ${border}`,
          flexShrink: 0,
        }}>
          {(['overview','activity','followups','lineage'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 4px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: tab === t ? 700 : 500,
              color: tab === t ? accent : muted,
              borderBottom: `2px solid ${tab === t ? accent : 'transparent'}`,
              textTransform: 'capitalize',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
              {t === 'followups' ? 'Follow-ups'
                : t === 'lineage' ? <><GitBranch size={11} />Lineage</>
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

          {/* ── LINEAGE TAB ──────────────────────────────────────────────── */}
          {tab === 'lineage' && (
            <LeadLineagePanel
              leadId={lead.id}
              lead={lead}
              onOpenLead={(l) => setNestedPopupLead(l)}
            />
          )}

          {/* ── OVERVIEW TAB ─────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              {/* AI Lead Score */}
              <div style={{ marginBottom: 16 }}>
                <LeadScoreCard lead={lead} />
              </div>

              {/* Stage stepper */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 8, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Pipeline Stage
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {STAGES.map(s => (
                    <button key={s.key} onClick={() => handleStageChange(s.key)} style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: lead.stage === s.key ? s.color : `${s.color}22`,
                      color: lead.stage === s.key ? '#fff' : s.color,
                      border: `1px solid ${s.color}44`,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div style={{ marginBottom: 16, padding: 12, background: isDark ? '#0a1020' : '#fdf6f0', borderRadius: 10, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</div>
                {lead.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: text }}>
                    <Phone size={13} color={muted} /> {lead.phone}
                  </div>
                )}
                {lead.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, color: text }}>
                    <Mail size={13} color={muted} /> {lead.email}
                  </div>
                )}
                {lead.company && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: text }}>
                    <Building2 size={13} color={muted} /> {lead.company}
                  </div>
                )}
              </div>

              {/* Editable fields */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <DollarSign size={10} style={{ display: 'inline', marginRight: 4 }} />Deal Value (₹)
                </label>
                <input type="number" value={editDeal} onChange={e => setEditDeal(e.target.value)}
                  placeholder="e.g. 50000" style={inputSt} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <Tag size={10} style={{ display: 'inline', marginRight: 4 }} />Product / Service Interest
                </label>
                <input value={editProduct} onChange={e => setEditProduct(e.target.value)}
                  placeholder="What are they interested in?" style={inputSt} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  <FileText size={10} style={{ display: 'inline', marginRight: 4 }} />Proposal URL
                </label>
                <input value={editProposal} onChange={e => setEditProposal(e.target.value)}
                  placeholder="https://drive.google.com/..." style={inputSt} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: muted, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                  placeholder="Add notes..." rows={3}
                  style={{ ...inputSt, resize: 'vertical' }} />
              </div>

              <button onClick={handleSaveOverview} disabled={savingEdit} style={{
                width: '100%', padding: '9px',
                background: savingEdit ? `${accent}66` : `linear-gradient(135deg, ${accent}, #fb923c)`,
                border: 'none', borderRadius: 8, cursor: savingEdit ? 'not-allowed' : 'pointer',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 12px rgba(249,115,22,0.3)', marginBottom: 12,
              }}>
                {savingEdit ? 'Saving…' : 'Save Changes'}
              </button>

              {/* Create Invoice — show on Won leads */}
              {lead.stage === 'won' && (
                <div style={{ padding: '12px 14px', borderRadius: 10, background: isDark ? '#0a1a0a' : '#f0fdf4', border: `1px solid ${isDark ? '#14532d' : '#bbf7d0'}` }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>🏆 Deal Won!</div>
                  <div style={{ fontSize: 11, color: isDark ? '#86efac' : '#15803d', marginBottom: 10 }}>
                    Closed value: ₹{(lead.closed_value ?? lead.deal_value ?? 0).toLocaleString('en-IN')}
                  </div>
                  <button onClick={handleCreateInvoice} style={{ padding: '8px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #22c55e, #16a34a)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    📄 Create Invoice
                  </button>
                </div>
              )}

              {/* Won / Lost buttons */}
              {!['won','lost'].includes(lead.stage) && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setShowWonForm(true)} style={{
                    flex: 1, padding: '8px', background: '#22c55e22',
                    border: '1px solid #22c55e44', borderRadius: 8,
                    cursor: 'pointer', color: '#22c55e', fontSize: 12, fontWeight: 700,
                  }}>
                    🎉 Mark Won
                  </button>
                  <button onClick={() => setShowLostForm(true)} style={{
                    flex: 1, padding: '8px', background: '#ef444422',
                    border: '1px solid #ef444444', borderRadius: 8,
                    cursor: 'pointer', color: '#ef4444', fontSize: 12, fontWeight: 700,
                  }}>
                    ❌ Mark Lost
                  </button>
                </div>
              )}

              {/* Won form */}
              {showWonForm && (
                <div style={{ marginTop: 12, padding: 12, background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>🎉 Close as Won</div>
                  <input type="number" value={wonValue} onChange={e => setWonValue(e.target.value)}
                    placeholder="Closed value (₹) — optional" style={{ ...inputSt, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowWonForm(false)} style={{
                      flex: 1, padding: '7px', background: 'none', border: `1px solid ${border}`,
                      borderRadius: 8, cursor: 'pointer', color: muted, fontSize: 12,
                    }}>Cancel</button>
                    <button onClick={handleMarkWon} style={{
                      flex: 2, padding: '7px', background: '#22c55e', border: 'none',
                      borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>Confirm Won</button>
                  </div>
                </div>
              )}

              {/* Lost form */}
              {showLostForm && (
                <div style={{ marginTop: 12, padding: 12, background: '#ef444411', border: '1px solid #ef444433', borderRadius: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', marginBottom: 8 }}>❌ Mark as Lost</div>
                  <input value={lostReason} onChange={e => setLostReason(e.target.value)}
                    placeholder="Reason (optional)" style={{ ...inputSt, marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowLostForm(false)} style={{
                      flex: 1, padding: '7px', background: 'none', border: `1px solid ${border}`,
                      borderRadius: 8, cursor: 'pointer', color: muted, fontSize: 12,
                    }}>Cancel</button>
                    <button onClick={handleMarkLost} style={{
                      flex: 2, padding: '7px', background: '#ef4444', border: 'none',
                      borderRadius: 8, cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>Confirm Lost</button>
                  </div>
                </div>
              )}

              {/* Tags */}
              {(lead.tags ?? []).length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, color: muted, marginBottom: 6 }}>Tags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {lead.tags!.map(tag => (
                      <span key={tag} style={{
                        padding: '3px 10px', borderRadius: 12,
                        background: `${accent}22`, color: accent,
                        fontSize: 11, fontWeight: 600,
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITY TAB ─────────────────────────────────────────────── */}
          {tab === 'activity' && (
            <div>
              {/* Add activity button */}
              <button onClick={() => setShowAddAct(v => !v)} style={{
                width: '100%', padding: '9px', marginBottom: 12,
                background: `${accent}22`, border: `1px solid ${accent}44`,
                borderRadius: 8, cursor: 'pointer', color: accent,
                fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Plus size={14} /> Log Activity
              </button>

              {/* Add activity form */}
              {showAddAct && (
                <div style={{ marginBottom: 16, padding: 12, background: isDark ? '#0a1020' : '#fdf6f0', borderRadius: 10, border: `1px solid ${border}` }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <select value={actType} onChange={e => setActType(e.target.value as ActivityType)}
                      style={{ ...inputSt, width: 'auto', flex: '0 0 auto' }}>
                      {ACTIVITY_TYPES.map(t => (
                        <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <input value={actTitle} onChange={e => setActTitle(e.target.value)}
                    placeholder="Title (required)" style={{ ...inputSt, marginBottom: 8 }} />
                  <textarea value={actBody} onChange={e => setActBody(e.target.value)}
                    placeholder="Details (optional)" rows={2}
                    style={{ ...inputSt, resize: 'vertical', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowAddAct(false)} style={{
                      flex: 1, padding: '7px', background: 'none', border: `1px solid ${border}`,
                      borderRadius: 8, cursor: 'pointer', color: muted, fontSize: 12,
                    }}>Cancel</button>
                    <button onClick={handleAddActivity} disabled={savingAct || !actTitle.trim()} style={{
                      flex: 2, padding: '7px',
                      background: actTitle.trim() ? accent : `${accent}44`,
                      border: 'none', borderRadius: 8, cursor: actTitle.trim() ? 'pointer' : 'not-allowed',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>{savingAct ? 'Saving…' : 'Log'}</button>
                  </div>
                </div>
              )}

              {loadingAct ? (
                <div style={{ textAlign: 'center', color: muted, padding: 24, fontSize: 13 }}>Loading…</div>
              ) : activities.length === 0 ? (
                <div style={{ textAlign: 'center', color: muted, padding: 24, fontSize: 13 }}>
                  No activities yet. Log a call, note, or email above.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {activities.map((act, i) => {
                    const info = ACTIVITY_TYPES.find(t => t.value === act.type);
                    return (
                      <div key={act.id} style={{ display: 'flex', gap: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: isDark ? '#1c2a55' : '#f3e8ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, flexShrink: 0,
                          }}>
                            {info?.icon ?? '📌'}
                          </div>
                          {i < activities.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: border, margin: '4px 0', minHeight: 20 }} />
                          )}
                        </div>
                        <div style={{ flex: 1, paddingBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: text }}>{act.title}</span>
                            <span style={{ fontSize: 10, color: muted, flexShrink: 0, marginLeft: 8 }}>{relativeTime(act.created_at)}</span>
                          </div>
                          {act.body && (
                            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{act.body}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── FOLLOW-UPS TAB ───────────────────────────────────────────── */}
          {tab === 'followups' && (
            <div>
              <button onClick={() => setShowAddFu(v => !v)} style={{
                width: '100%', padding: '9px', marginBottom: 12,
                background: '#3b82f622', border: '1px solid #3b82f644',
                borderRadius: 8, cursor: 'pointer', color: '#3b82f6',
                fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Plus size={14} /> Schedule Follow-up
              </button>

              {showAddFu && (
                <div style={{ marginBottom: 16, padding: 12, background: isDark ? '#0a1020' : '#fdf6f0', borderRadius: 10, border: `1px solid ${border}` }}>
                  <select value={fuType} onChange={e => setFuType(e.target.value)}
                    style={{ ...inputSt, marginBottom: 8 }}>
                    {FOLLOWUP_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                    ))}
                  </select>
                  <input value={fuTitle} onChange={e => setFuTitle(e.target.value)}
                    placeholder="Title (required)" style={{ ...inputSt, marginBottom: 8 }} />
                  <input type="datetime-local" value={fuDue} onChange={e => setFuDue(e.target.value)}
                    style={{ ...inputSt, marginBottom: 8 }} />
                  <textarea value={fuNotes} onChange={e => setFuNotes(e.target.value)}
                    placeholder="Notes (optional)" rows={2}
                    style={{ ...inputSt, resize: 'vertical', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowAddFu(false)} style={{
                      flex: 1, padding: '7px', background: 'none', border: `1px solid ${border}`,
                      borderRadius: 8, cursor: 'pointer', color: muted, fontSize: 12,
                    }}>Cancel</button>
                    <button onClick={handleAddFollowUp} disabled={savingFu || !fuTitle.trim() || !fuDue} style={{
                      flex: 2, padding: '7px',
                      background: (fuTitle.trim() && fuDue) ? '#3b82f6' : '#3b82f644',
                      border: 'none', borderRadius: 8,
                      cursor: (fuTitle.trim() && fuDue) ? 'pointer' : 'not-allowed',
                      color: '#fff', fontSize: 12, fontWeight: 700,
                    }}>{savingFu ? 'Saving…' : 'Schedule'}</button>
                  </div>
                </div>
              )}

              {loadingFu ? (
                <div style={{ textAlign: 'center', color: muted, padding: 24, fontSize: 13 }}>Loading…</div>
              ) : followUps.length === 0 ? (
                <div style={{ textAlign: 'center', color: muted, padding: 24, fontSize: 13 }}>
                  No follow-ups scheduled yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {followUps.map(fu => {
                    const overdue = !fu.completed && new Date(fu.due_at) < new Date();
                    const fuInfo = FOLLOWUP_TYPES.find(t => t.value === fu.type);
                    return (
                      <div key={fu.id} style={{
                        padding: 12, borderRadius: 10,
                        background: fu.completed
                          ? (isDark ? '#0a1020' : '#f9fafb')
                          : overdue
                            ? '#ef444411'
                            : (isDark ? '#0a1020' : '#fdf6f0'),
                        border: `1px solid ${fu.completed ? border : overdue ? '#ef444433' : border}`,
                        opacity: fu.completed ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <button
                            onClick={() => !fu.completed && handleCompleteFollowUp(fu)}
                            disabled={fu.completed}
                            style={{
                              background: 'none', border: 'none', cursor: fu.completed ? 'default' : 'pointer',
                              color: fu.completed ? '#22c55e' : muted, padding: 0, flexShrink: 0,
                            }}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 12 }}>{fuInfo?.icon ?? '📌'}</span>
                              <span style={{
                                fontSize: 13, fontWeight: fu.completed ? 400 : 600,
                                color: text,
                                textDecoration: fu.completed ? 'line-through' : 'none',
                              }}>
                                {fu.title}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                              {overdue && <AlertCircle size={11} color="#ef4444" />}
                              <span style={{
                                fontSize: 11, color: overdue ? '#ef4444' : muted,
                                fontWeight: overdue ? 700 : 400,
                              }}>
                                {fu.completed ? `Done ${relativeTime(fu.completed_at!)}` : formatDate(fu.due_at)}
                                {overdue && ' — OVERDUE'}
                              </span>
                            </div>
                            {fu.notes && (
                              <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>{fu.notes}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* SendMessageModal */}
        {sendMsg && (
          <SendMessageModal
            channel={sendMsg.channel}
            recipientName={lead.name}
            recipientPhone={lead.phone}
            recipientEmail={lead.email}
            defaultMessage={sendMsg.defaultMessage}
            defaultSubject={sendMsg.defaultSubject}
            onClose={() => setSendMsg(null)}
            onSent={() => {
              setSendMsg(null);
            }}
          />
        )}
      </div>
  );

  if (popupMode) {
    return (
      <>
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 3000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={onClose}
        >
          {panelContent}
        </div>
        {/* Nested popup from lineage tab */}
        {nestedPopupLead && (
          <LeadDetailPanel
            lead={nestedPopupLead}
            onClose={() => setNestedPopupLead(null)}
            onLeadUpdate={(updated) => setNestedPopupLead(updated)}
            popupMode={true}
          />
        )}
      </>
    );
  }

  // Non-popup: slide-in panel with backdrop
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 75,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)',
        }}
      />
      {panelContent}
      {/* Nested popup from lineage tab */}
      {nestedPopupLead && (
        <LeadDetailPanel
          lead={nestedPopupLead}
          onClose={() => setNestedPopupLead(null)}
          onLeadUpdate={(updated) => setNestedPopupLead(updated)}
          popupMode={true}
        />
      )}
    </>
  );
}

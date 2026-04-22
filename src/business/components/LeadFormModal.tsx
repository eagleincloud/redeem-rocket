import { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useNavigate }  from 'react-router-dom';
import { useBusinessContext } from '../context/BusinessContext';
import type { Lead, LeadStage, LeadPriority, LeadSource, LeadMatchResult } from '@/app/api/supabase-data';
import { fetchLeads } from '@/app/api/supabase-data';
import { HistoricalMatchPanel } from './HistoricalMatchPanel';
import { LeadDetailPanel } from './LeadDetailPanel';

interface LeadFormModalProps {
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  initial?: Partial<Lead>;
}

const STAGE_OPTIONS: { value: LeadStage; label: string }[] = [
  { value: 'new',         label: 'New'         },
  { value: 'contacted',   label: 'Contacted'   },
  { value: 'qualified',   label: 'Qualified'   },
  { value: 'proposal',    label: 'Proposal'    },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won',         label: 'Won'         },
  { value: 'lost',        label: 'Lost'        },
];

const PRIORITY_OPTIONS: { value: LeadPriority; label: string }[] = [
  { value: 'low',    label: 'Low'    },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High'   },
  { value: 'urgent', label: 'Urgent' },
];

const SOURCE_OPTIONS: { value: LeadSource; label: string }[] = [
  { value: 'manual',   label: 'Manual'   },
  { value: 'csv',      label: 'CSV Import' },
  { value: 'scrape',   label: 'Scrape'   },
  { value: 'campaign', label: 'Campaign' },
  { value: 'referral', label: 'Referral' },
  { value: 'walk_in',  label: 'Walk-in'  },
  { value: 'website',  label: 'Website'  },
];

export function LeadFormModal({ onClose, onSave, initial }: LeadFormModalProps) {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const navigate    = useNavigate();

  const [name,            setName]            = useState(initial?.name            ?? '');
  const [phone,           setPhone]           = useState(initial?.phone           ?? '');
  const [email,           setEmail]           = useState(initial?.email           ?? '');
  const [company,         setCompany]         = useState(initial?.company         ?? '');
  const [source,          setSource]          = useState<LeadSource>(initial?.source   ?? 'manual');
  const [stage,           setStage]           = useState<LeadStage>(initial?.stage    ?? 'new');
  const [priority,        setPriority]        = useState<LeadPriority>(initial?.priority ?? 'medium');
  const [dealValue,       setDealValue]       = useState(initial?.deal_value ? String(initial.deal_value) : '');
  const [productInterest, setProductInterest] = useState(initial?.product_interest ?? '');
  const [notes,           setNotes]           = useState(initial?.notes           ?? '');
  const [tagInput,        setTagInput]        = useState('');
  const [tags,            setTags]            = useState<string[]>(initial?.tags   ?? []);

  // Linked match — set when salesperson clicks "Same Person"
  const [linkedMatch, setLinkedMatch] = useState<LeadMatchResult | null>(null);

  // Popup lead — opens historical lead as overlay on top of form
  const [popupLead, setPopupLead] = useState<Lead | null>(null);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const bg      = isDark ? '#080d20' : '#faf7f3';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const muted   = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';
  const inputBg = isDark ? '#0a1020' : '#fdf6f0';

  const isEdit = Boolean(initial?.id);

  // Query for match panel — only when NOT editing an existing lead
  const matchQuery = useMemo(() => ({
    name:    name.length > 2    ? name    : undefined,
    phone:   phone.length > 7   ? phone   : undefined,
    email:   email.includes('@') ? email   : undefined,
    company: company.length > 2 ? company : undefined,
  }), [name, phone, email, company]);

  function handleAddTag() {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone:            phone.trim()  || undefined,
      email:            email.trim()  || undefined,
      company:          company.trim() || undefined,
      source,
      stage,
      priority,
      deal_value:       dealValue ? Number(dealValue) : undefined,
      product_interest: productInterest.trim() || undefined,
      notes:            notes.trim()  || undefined,
      tags:             tags.length ? tags : undefined,
    });
  }

  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    background: inputBg,
    border: `1px solid ${border}`,
    borderRadius: 8,
    color: text,
    fontSize: 13,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block' as const,
    fontSize: 11,
    fontWeight: 600,
    color: muted,
    marginBottom: 4,
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '100%', maxWidth: isEdit ? 500 : 860,
        background: card, borderRadius: 16,
        border: `1px solid ${border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
        margin: 16,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: `1px solid ${border}`, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text }}>
              {isEdit ? '✏️ Edit Lead' : '➕ Add New Lead'}
            </h3>
            {!isEdit && (
              <span style={{
                fontSize: 10, color: '#f97316', background: '#f9731615',
                border: '1px solid #f9731630', borderRadius: 5, padding: '2px 7px', fontWeight: 600,
              }}>
                ⚡ AI Duplicate Check
              </span>
            )}
            {linkedMatch && (
              <span style={{
                fontSize: 10, color: '#22c55e', background: '#22c55e15',
                border: '1px solid #22c55e30', borderRadius: 5, padding: '2px 7px', fontWeight: 600,
              }}>
                🔗 Linked to {linkedMatch.lead.name}
              </span>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: muted,
            padding: 4, borderRadius: 6, display: 'flex',
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Two-column layout: Form | Match Panel */}
        <div style={{
          display: 'flex', flex: 1, overflow: 'hidden',
          flexDirection: isEdit ? 'column' : 'row',
        }}>
          {/* ── Left: Form ── */}
          <form onSubmit={handleSubmit} style={{
            overflowY: 'auto', padding: '20px',
            flex: isEdit ? 1 : '0 0 460px', minWidth: 0,
            borderRight: isEdit ? 'none' : `1px solid ${border}`,
          }}>
            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Name *</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Logistics"
                style={inputStyle}
              />
            </div>

            {/* Phone + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9876543210"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Company */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Company</label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Company / Business name"
                style={inputStyle}
              />
            </div>

            {/* Source + Stage + Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Source</label>
                <select value={source} onChange={e => setSource(e.target.value as LeadSource)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Stage</label>
                <select value={stage} onChange={e => setStage(e.target.value as LeadStage)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {STAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select value={priority} onChange={e => setPriority(e.target.value as LeadPriority)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PRIORITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {/* Deal Value */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Deal Value (₹)</label>
              <input
                type="number"
                min="0"
                value={dealValue}
                onChange={e => setDealValue(e.target.value)}
                placeholder="e.g. 50000"
                style={inputStyle}
              />
            </div>

            {/* Product Interest */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Product / Service Interest</label>
              <input
                value={productInterest}
                onChange={e => setProductInterest(e.target.value)}
                placeholder="e.g. Monthly supply of rice 50kg"
                style={inputStyle}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Any additional notes..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            {/* Tags */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Tags</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  placeholder="Add tag and press Enter"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button type="button" onClick={handleAddTag} style={{
                  padding: '9px 14px', background: `${accent}22`, border: `1px solid ${accent}44`,
                  borderRadius: 8, color: accent, cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                  <Plus size={16} />
                </button>
              </div>
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {tags.map(tag => (
                    <span key={tag} style={{
                      padding: '3px 10px', borderRadius: 12,
                      background: `${accent}22`, color: accent,
                      fontSize: 11, fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      #{tag}
                      <button type="button" onClick={() => setTags(t => t.filter(x => x !== tag))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: accent, lineHeight: 1, padding: 0, fontSize: 12 }}>
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={onClose} style={{
                padding: '9px 20px',
                background: 'transparent', border: `1px solid ${border}`,
                borderRadius: 8, cursor: 'pointer', color: muted, fontSize: 13,
              }}>
                Cancel
              </button>
              <button type="submit" style={{
                padding: '9px 24px',
                background: `linear-gradient(135deg, ${accent}, #fb923c)`,
                border: 'none', borderRadius: 8, cursor: 'pointer',
                color: '#fff', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 12px rgba(249,115,22,0.4)',
              }}>
                {isEdit ? 'Save Changes' : 'Add Lead'}
              </button>
            </div>
          </form>

          {/* ── Right: AI Match Panel (only on Add, not Edit) ── */}
          {!isEdit && (
            <div style={{
              flex: 1, overflowY: 'auto', padding: '20px',
              minWidth: 0, maxWidth: 380,
              background: isDark ? '#060c1c' : '#f5f0ea',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 12 }}>
                🔍 Historical Lead Matches
              </div>
              <div style={{ fontSize: 11, color: muted, marginBottom: 14, lineHeight: 1.5 }}>
                As you type, we search your lead history for similar contacts. Review past interactions before creating a duplicate.
              </div>
              {bizUser?.businessId ? (
                <HistoricalMatchPanel
                  businessId={bizUser.businessId}
                  query={matchQuery}
                  excludeId={initial?.id}
                  onViewLead={async (leadId) => {
                    // Fetch the lead and open as popup overlay instead of navigating away
                    const allLeads = await fetchLeads(bizUser.businessId);
                    const found = (allLeads ?? []).find(l => l.id === leadId) ?? null;
                    if (found) {
                      setPopupLead(found);
                    } else {
                      // Fallback: navigate if lead not found locally
                      onClose();
                      navigate(`/leads?open=${leadId}`);
                    }
                  }}
                  onLinkLead={match => setLinkedMatch(match)}
                />
              ) : (
                <div style={{ fontSize: 11, color: muted }}>Business not configured.</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Popup overlay — opens historical lead without closing the form */}
      {popupLead && (
        <LeadDetailPanel
          lead={popupLead}
          onClose={() => setPopupLead(null)}
          onLeadUpdate={(updated) => setPopupLead(updated)}
          popupMode={true}
        />
      )}
    </div>
  );
}

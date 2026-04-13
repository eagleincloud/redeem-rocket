import { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Mail, MessageSquare, Phone, Send,
         Upload, Users, UserCheck, Plus, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import {
  insertOutreachCampaign, insertOutreachRecipients, scheduleCampaignBatches,
  fetchLeads,
  type OutreachCampaign, type SenderIdentity, type OutreachChannel,
} from '@/app/api/supabase-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecipientRow {
  name: string; email: string; phone: string;
  source: 'manual' | 'lead' | 'csv';
  leadId?: string;
}

interface Props {
  onClose: () => void;
  onCreated: (campaign: OutreachCampaign) => void;
  senders: SenderIdentity[];
  prefill?: { phones: string; names: string; count: number } | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { n: 1, label: 'Setup',      icon: '⚙️'  },
  { n: 2, label: 'Recipients', icon: '👥'  },
  { n: 3, label: 'Content',    icon: '✍️'  },
  { n: 4, label: 'Schedule',   icon: '📅'  },
  { n: 5, label: 'Review',     icon: '🚀'  },
];

const CHANNEL_OPTIONS: { value: OutreachChannel; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'email',    label: 'Email',    icon: <Mail size={18} />,         desc: 'Rich HTML emails via SMTP / Resend' },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare size={18} />, desc: 'Approved templates via MSG91' },
  { value: 'sms',      label: 'SMS',      icon: <Phone size={18} />,        desc: 'Transactional SMS via MSG91' },
  { value: 'multi',    label: 'Multi',    icon: <Send size={18} />,         desc: 'Email + WhatsApp + SMS combined' },
];

const VARIABLE_HINTS = ['{name}', '{company}', '{phone}', '{email}', '{business}'];

// ── CSV parser helper ─────────────────────────────────────────────────────────

function parseCsv(raw: string): RecipientRow[] {
  const lines = raw.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/['"]/g, ''));
  const nameIdx  = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));
  const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/['"]/g, ''));
    return {
      name:   nameIdx  >= 0 ? cols[nameIdx]  : '',
      email:  emailIdx >= 0 ? cols[emailIdx] : '',
      phone:  phoneIdx >= 0 ? cols[phoneIdx] : '',
      source: 'csv' as const,
    };
  }).filter(r => r.name || r.email || r.phone);
}

// ── Estimated completion time ─────────────────────────────────────────────────

function estimateCompletion(recipientCount: number, batchSize: number, intervalMin: number): string {
  if (!recipientCount) return '—';
  const batches = Math.ceil(recipientCount / batchSize);
  const totalMin = batches * intervalMin;
  if (totalMin < 60) return `~${totalMin} min`;
  return `~${(totalMin / 60).toFixed(1)} hours`;
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export function CampaignWizardModal({ onClose, onCreated, senders, prefill }: Props) {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();

  const [step,          setStep]          = useState(1);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');
  const [prefillNotice, setPrefillNotice] = useState('');

  // Step 1 — Setup
  const [name,       setName]       = useState('');
  const [channel,    setChannel]    = useState<OutreachChannel>('email');
  const [desc,       setDesc]       = useState('');
  const [senderId,   setSenderId]   = useState(senders.find(s => s.is_default)?.id ?? '');

  // Step 2 — Recipients
  const [recipients, setRecipients] = useState<RecipientRow[]>([]);
  const [importTab,  setImportTab]  = useState<'manual' | 'csv' | 'leads'>('manual');
  const [manualRow,  setManualRow]  = useState({ name: '', email: '', phone: '' });
  const [csvText,    setCsvText]    = useState('');

  // Handle prefill from Leads blast
  useEffect(() => {
    if (!prefill || !prefill.phones) return;
    const rows: RecipientRow[] = prefill.phones.split(',').filter(Boolean).map((phone, i) => ({
      name: prefill.names.split(',')[i]?.trim() ?? `Lead ${i + 1}`,
      phone: phone.trim(),
      email: '',
    }));
    setRecipients(rows);
    setPrefillNotice(`Sending to ${prefill.count} lead${prefill.count !== 1 ? 's' : ''}: ${prefill.names.slice(0, 60)}${prefill.names.length > 60 ? '…' : ''}`);
    setStep(2); // jump to recipients step
  }, [prefill]);
  const [leadSearch, setLeadSearch] = useState('');
  const [leads,      setLeads]      = useState<{ id: string; name: string; email?: string; phone?: string; company?: string }[]>([]);
  const [loadLeads,  setLoadLeads]  = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Step 3 — Content
  const [subject,    setSubject]    = useState('');
  const [body,       setBody]       = useState('');
  const [templateId, setTemplateId] = useState('');

  // Step 4 — Schedule
  const [scheduleType,    setScheduleType]    = useState<'now' | 'later'>('now');
  const [scheduledAt,     setScheduledAt]     = useState('');
  const [windowStart,     setWindowStart]     = useState('09:00');
  const [windowEnd,       setWindowEnd]       = useState('20:00');
  const [batchSize,       setBatchSize]       = useState(500);
  const [batchInterval,   setBatchInterval]   = useState(5);
  const [warmup,          setWarmup]          = useState(false);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const bg      = isDark ? '#080d20' : '#faf7f3';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const muted   = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';
  const inputBg = isDark ? '#0a1020' : '#fdf6f0';

  const inputStyle = {
    width: '100%', padding: '9px 12px', background: inputBg,
    border: `1px solid ${border}`, borderRadius: 8,
    color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' as const,
  };
  const label = (t: string) => (
    <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 4,
      textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{t}</div>
  );

  // Load leads for step 2
  async function fetchLeadsForImport() {
    if (!bizUser?.businessId) return;
    setLoadLeads(true);
    const data = await fetchLeads(bizUser.businessId);
    setLeads((data ?? []).map(l => ({
      id: l.id, name: l.name, email: l.email, phone: l.phone, company: l.company,
    })));
    setLoadLeads(false);
  }

  function addManual() {
    if (!manualRow.name && !manualRow.email && !manualRow.phone) return;
    setRecipients(prev => [...prev, { ...manualRow, source: 'manual' }]);
    setManualRow({ name: '', email: '', phone: '' });
  }

  function importFromCsv() {
    const rows = parseCsv(csvText);
    if (rows.length === 0) { setError('No valid rows found in CSV'); return; }
    setRecipients(prev => {
      const existing = new Set(prev.map(r => r.email || r.phone));
      const deduped = rows.filter(r => !existing.has(r.email || r.phone));
      return [...prev, ...deduped];
    });
    setCsvText('');
    setError('');
  }

  function addLeadAsRecipient(lead: typeof leads[0]) {
    setRecipients(prev => {
      if (prev.some(r => r.leadId === lead.id)) return prev;
      return [...prev, { name: lead.name, email: lead.email ?? '', phone: lead.phone ?? '', source: 'lead', leadId: lead.id }];
    });
  }

  function removeRecipient(idx: number) {
    setRecipients(prev => prev.filter((_, i) => i !== idx));
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setCsvText(ev.target?.result as string ?? '');
    reader.readAsText(file);
  }

  function canProceed(): boolean {
    if (step === 1) return Boolean(name.trim() && channel);
    if (step === 2) return recipients.length > 0;
    if (step === 3) return Boolean(body.trim() && (channel !== 'email' || subject.trim()));
    if (step === 4) return true;
    return true;
  }

  async function handleLaunch() {
    if (!bizUser?.businessId) return;
    setSaving(true);
    setError('');
    try {
      // 1. Create campaign
      const campaign = await insertOutreachCampaign({
        business_id:           bizUser.businessId,
        name:                  name.trim(),
        description:           desc.trim() || undefined,
        channel,
        status:                'draft',
        subject:               subject.trim() || undefined,
        body:                  body.trim(),
        template_id:           templateId || undefined,
        scheduled_at:          scheduleType === 'later' && scheduledAt ? scheduledAt : undefined,
        send_window_start:     windowStart,
        send_window_end:       windowEnd,
        timezone:              'Asia/Kolkata',
        batch_size:            batchSize,
        batch_interval_minutes: batchInterval,
        sender_identity_id:    senderId || undefined,
        warmup_enabled:        warmup,
        utm_source:            'outreach',
        utm_campaign:          name.toLowerCase().replace(/\s+/g, '_'),
      });
      if (!campaign) { setError('Failed to create campaign. Check DB connection.'); setSaving(false); return; }

      // 2. Insert recipients
      const rcptPayload = recipients.map(r => ({
        campaign_id: campaign.id,
        business_id: bizUser.businessId!,
        name:        r.name || undefined,
        email:       r.email || undefined,
        phone:       r.phone || undefined,
        lead_id:     r.leadId || undefined,
      }));
      const inserted = await insertOutreachRecipients(rcptPayload);

      // 3. Update total_recipients count
      await insertOutreachCampaign; // already done above

      // 4. Schedule batches
      const withCount = { ...campaign, total_recipients: inserted, batch_size: batchSize,
        batch_interval_minutes: batchInterval, send_window_start: windowStart,
        send_window_end: windowEnd, scheduled_at: scheduleType === 'later' ? scheduledAt : undefined };
      await scheduleCampaignBatches(withCount);

      onCreated({ ...withCount, total_recipients: inserted });
    } catch (e) {
      setError('Unexpected error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const filteredLeads = leads.filter(l =>
    !leadSearch || l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    (l.company ?? '').toLowerCase().includes(leadSearch.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: 680, margin: 16,
        background: card, borderRadius: 18,
        border: `1px solid ${border}`,
        boxShadow: '0 28px 80px rgba(0,0,0,0.45)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px', borderBottom: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>
            📣 Create Outreach Campaign
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: 4,
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Step progress */}
        <div style={{
          display: 'flex', padding: '12px 24px', gap: 6,
          borderBottom: `1px solid ${border}`, flexShrink: 0,
          overflowX: 'auto',
        }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 20,
                background: step === s.n ? accent : step > s.n ? '#22c55e18' : `${border}55`,
                border: step === s.n ? 'none' : step > s.n ? '1px solid #22c55e44' : `1px solid ${border}`,
                cursor: step < s.n ? 'default' : 'pointer',
              }} onClick={() => step > s.n && setStep(s.n)}>
                <span style={{ fontSize: 12 }}>
                  {step > s.n ? '✓' : s.icon}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: step === s.n ? '#fff' : step > s.n ? '#22c55e' : muted,
                }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <ChevronRight size={12} color={muted} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

          {/* Prefill notice from Leads blast */}
          {prefillNotice && (
            <div style={{ padding: '9px 13px', borderRadius: 9, background: '#3b82f620', border: '1px solid #3b82f640', fontSize: 12, color: '#3b82f6', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              📣 {prefillNotice}
            </div>
          )}

          {/* ── Step 1: Setup ── */}
          {step === 1 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 18 }}>
                Campaign Setup
              </div>
              {/* Campaign name */}
              <div style={{ marginBottom: 16 }}>
                {label('Campaign Name *')}
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. March Newsletter, Diwali Greetings…"
                  style={inputStyle} />
              </div>
              {/* Channel */}
              <div style={{ marginBottom: 16 }}>
                {label('Channel *')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {CHANNEL_OPTIONS.map(opt => (
                    <div key={opt.value} onClick={() => setChannel(opt.value)} style={{
                      padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${channel === opt.value ? accent : border}`,
                      background: channel === opt.value ? `${accent}12` : inputBg,
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'border-color 0.15s',
                    }}>
                      <span style={{ color: channel === opt.value ? accent : muted }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: channel === opt.value ? accent : text }}>
                          {opt.label}
                        </div>
                        <div style={{ fontSize: 10, color: muted }}>{opt.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                {label('Description')}
                <textarea value={desc} onChange={e => setDesc(e.target.value)}
                  placeholder="Optional internal description…"
                  rows={2} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              {/* Sender identity */}
              <div style={{ marginBottom: 4 }}>
                {label('Sender Identity')}
                <select value={senderId} onChange={e => setSenderId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">— Select sender (optional) —</option>
                  {senders.filter(s => s.channel === channel || channel === 'multi').map(s => (
                    <option key={s.id} value={s.id}>{s.display_name} ({s.channel})</option>
                  ))}
                </select>
                {senders.length === 0 && (
                  <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
                    ⚠️ No sender identities configured. Add one in Sender Settings first.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 2: Recipients ── */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: text }}>Import Recipients</div>
                <div style={{
                  background: `${accent}20`, color: accent, border: `1px solid ${accent}40`,
                  borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700,
                }}>
                  {recipients.length} added
                </div>
              </div>

              {/* Import tabs */}
              <div style={{ display: 'flex', gap: 4, background: `${border}55`, borderRadius: 8, padding: 3, marginBottom: 16 }}>
                {(['manual', 'csv', 'leads'] as const).map(t => (
                  <button key={t} onClick={() => { setImportTab(t); if (t === 'leads' && leads.length === 0) fetchLeadsForImport(); }}
                    style={{
                      flex: 1, padding: '6px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                      background: importTab === t ? card : 'transparent',
                      color: importTab === t ? accent : muted,
                      fontWeight: importTab === t ? 700 : 400, fontSize: 11,
                    }}>
                    {t === 'manual' ? '✍️ Manual' : t === 'csv' ? '📋 CSV' : '🎯 From Leads'}
                  </button>
                ))}
              </div>

              {/* Manual add */}
              {importTab === 'manual' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                    <input value={manualRow.name} onChange={e => setManualRow(r => ({ ...r, name: e.target.value }))}
                      placeholder="Name" style={inputStyle} />
                    <input value={manualRow.email} onChange={e => setManualRow(r => ({ ...r, email: e.target.value }))}
                      placeholder="Email" style={inputStyle} />
                    <input value={manualRow.phone} onChange={e => setManualRow(r => ({ ...r, phone: e.target.value }))}
                      placeholder="Phone" style={inputStyle} />
                    <button onClick={addManual} style={{
                      padding: '9px 12px', background: accent, color: '#fff',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                    }}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* CSV import */}
              {importTab === 'csv' && (
                <div>
                  <div style={{
                    border: `2px dashed ${border}`, borderRadius: 10, padding: 20,
                    textAlign: 'center', marginBottom: 12, cursor: 'pointer',
                    background: inputBg,
                  }} onClick={() => fileRef.current?.click()}>
                    <Upload size={24} color={muted} style={{ margin: '0 auto 8px' }} />
                    <div style={{ fontSize: 12, color: text, fontWeight: 600 }}>Click to upload CSV</div>
                    <div style={{ fontSize: 10, color: muted }}>Columns: name, email, phone</div>
                    <input ref={fileRef} type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
                  </div>
                  <textarea value={csvText} onChange={e => setCsvText(e.target.value)}
                    placeholder="Or paste CSV text here…&#10;name,email,phone&#10;Ramesh,ramesh@co.in,9876543210"
                    rows={4} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
                  <button onClick={importFromCsv} style={{
                    marginTop: 8, padding: '8px 20px', background: accent, color: '#fff',
                    border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 12,
                  }}>
                    Import CSV rows
                  </button>
                </div>
              )}

              {/* Import from leads */}
              {importTab === 'leads' && (
                <div>
                  <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                    placeholder="Search leads by name or company…"
                    style={{ ...inputStyle, marginBottom: 10 }} />
                  {loadLeads ? (
                    <div style={{ textAlign: 'center', color: muted, fontSize: 12, padding: 20 }}>Loading leads…</div>
                  ) : (
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredLeads.map(l => {
                        const added = recipients.some(r => r.leadId === l.id);
                        return (
                          <div key={l.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                            background: added ? '#22c55e12' : inputBg,
                            border: `1px solid ${added ? '#22c55e33' : border}`,
                          }}>
                            <UserCheck size={14} color={added ? '#22c55e' : muted} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: text }}>{l.name}</div>
                              <div style={{ fontSize: 10, color: muted }}>
                                {l.company && `${l.company} · `}{l.email || l.phone || 'No contact info'}
                              </div>
                            </div>
                            <button onClick={() => addLeadAsRecipient(l)} disabled={added} style={{
                              padding: '4px 10px', fontSize: 10, fontWeight: 700,
                              background: added ? '#22c55e20' : accent, color: added ? '#22c55e' : '#fff',
                              border: 'none', borderRadius: 6, cursor: added ? 'not-allowed' : 'pointer',
                            }}>
                              {added ? '✓ Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                      {filteredLeads.length === 0 && (
                        <div style={{ textAlign: 'center', color: muted, fontSize: 12, padding: 20 }}>
                          No leads found. Run the DB migration first.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Recipient list preview */}
              {recipients.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 8, textTransform: 'uppercase' }}>
                    Added Recipients ({recipients.length})
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', border: `1px solid ${border}`, borderRadius: 8 }}>
                    {recipients.slice(0, 50).map((r, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                        borderBottom: i < Math.min(recipients.length, 50) - 1 ? `1px solid ${border}` : 'none',
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: 12, color: text, fontWeight: 600 }}>{r.name || '—'}</span>
                          <span style={{ fontSize: 10, color: muted, marginLeft: 8 }}>
                            {r.email || r.phone}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 9, color: r.source === 'lead' ? '#3b82f6' : r.source === 'csv' ? '#f59e0b' : muted,
                          fontWeight: 600, textTransform: 'uppercase',
                        }}>{r.source}</span>
                        <button onClick={() => removeRecipient(i)} style={{
                          background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 2,
                        }}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    {recipients.length > 50 && (
                      <div style={{ padding: '8px 10px', fontSize: 11, color: muted, textAlign: 'center' }}>
                        …and {recipients.length - 50} more
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 3: Content ── */}
          {step === 3 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 18 }}>
                Message Content
              </div>

              {/* Variable hints */}
              <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, color: muted, fontWeight: 600 }}>Variables:</span>
                {VARIABLE_HINTS.map(v => (
                  <button key={v} onClick={() => setBody(b => b + v)} style={{
                    fontSize: 10, background: `${accent}18`, color: accent,
                    border: `1px solid ${accent}33`, borderRadius: 5,
                    padding: '2px 7px', cursor: 'pointer', fontFamily: 'monospace',
                  }}>
                    {v}
                  </button>
                ))}
              </div>

              {/* Subject (email only) */}
              {(channel === 'email' || channel === 'multi') && (
                <div style={{ marginBottom: 14 }}>
                  {label('Subject Line *')}
                  <input value={subject} onChange={e => setSubject(e.target.value)}
                    placeholder="e.g. Special offers just for you, {name}! 🎉"
                    style={inputStyle} />
                </div>
              )}

              {/* Body */}
              <div style={{ marginBottom: 14 }}>
                {label(`Message Body * ${body.length > 0 ? `(${body.length} chars)` : ''}`)}
                <textarea value={body} onChange={e => setBody(e.target.value)}
                  placeholder={channel === 'email'
                    ? 'Hi {name},\n\nWe have an exclusive offer just for you!\n\nBest regards,\n{business}'
                    : 'Hi {name}! Check out our latest offers. Visit us today!'}
                  rows={channel === 'email' ? 8 : 4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }} />
              </div>

              {/* Preview */}
              {body && (
                <div style={{
                  padding: '12px 14px', background: `${border}33`,
                  borderRadius: 10, border: `1px solid ${border}`,
                }}>
                  <div style={{ fontSize: 10, color: muted, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
                    Preview (sample data)
                  </div>
                  {subject && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: text, marginBottom: 6 }}>
                      {subject.replace('{name}', 'Ramesh').replace('{business}', 'Redeem Rocket')}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: text, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                    {body
                      .replace(/\{name\}/g, 'Ramesh')
                      .replace(/\{company\}/g, 'Ramesh Transport Co.')
                      .replace(/\{business\}/g, 'Redeem Rocket')
                      .replace(/\{phone\}/g, '9876543210')
                      .replace(/\{email\}/g, 'ramesh@example.com')
                    }
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Schedule ── */}
          {step === 4 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 18 }}>
                Schedule & Delivery
              </div>

              {/* Send time */}
              <div style={{ marginBottom: 16 }}>
                {label('When to Send')}
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['now', 'later'] as const).map(t => (
                    <div key={t} onClick={() => setScheduleType(t)} style={{
                      flex: 1, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${scheduleType === t ? accent : border}`,
                      background: scheduleType === t ? `${accent}12` : inputBg,
                      textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 18, marginBottom: 4 }}>{t === 'now' ? '⚡' : '📅'}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: scheduleType === t ? accent : text }}>
                        {t === 'now' ? 'Send Now' : 'Schedule Later'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {scheduleType === 'later' && (
                <div style={{ marginBottom: 16 }}>
                  {label('Start Date & Time')}
                  <input type="datetime-local" value={scheduledAt}
                    onChange={e => setScheduledAt(e.target.value)}
                    style={inputStyle} />
                </div>
              )}

              {/* Send window */}
              <div style={{ marginBottom: 16 }}>
                {label('Daily Send Window')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>Start time</div>
                    <input type="time" value={windowStart} onChange={e => setWindowStart(e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>End time</div>
                    <input type="time" value={windowEnd} onChange={e => setWindowEnd(e.target.value)} style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Batch config */}
              <div style={{ marginBottom: 16 }}>
                {label('Batch Configuration')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>Batch size (per send)</div>
                    <input type="number" min={1} max={5000} value={batchSize}
                      onChange={e => setBatchSize(Number(e.target.value))} style={inputStyle} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: muted, marginBottom: 3 }}>Interval (minutes)</div>
                    <input type="number" min={1} max={120} value={batchInterval}
                      onChange={e => setBatchInterval(Number(e.target.value))} style={inputStyle} />
                  </div>
                </div>
                <div style={{
                  marginTop: 8, padding: '8px 12px', background: `${accent}12`,
                  border: `1px solid ${accent}30`, borderRadius: 8, fontSize: 11, color: accent,
                }}>
                  📊 Estimated completion: {estimateCompletion(recipients.length, batchSize, batchInterval)}
                  {' '}({Math.ceil(recipients.length / batchSize)} batches)
                </div>
              </div>

              {/* Warmup toggle (email only) */}
              {(channel === 'email' || channel === 'multi') && (
                <div style={{
                  padding: '14px 16px', background: inputBg,
                  border: `1px solid ${border}`, borderRadius: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: text }}>🔥 Email Warmup</div>
                      <div style={{ fontSize: 10, color: muted }}>
                        Gradually ramp sending volume to improve deliverability
                      </div>
                    </div>
                    <div onClick={() => setWarmup(w => !w)} style={{
                      width: 40, height: 22, borderRadius: 11,
                      background: warmup ? accent : border,
                      cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
                    }}>
                      <div style={{
                        position: 'absolute', top: 3, left: warmup ? 20 : 3,
                        width: 16, height: 16, borderRadius: '50%',
                        background: '#fff', transition: 'left 0.2s',
                      }} />
                    </div>
                  </div>
                  {warmup && (
                    <div style={{ fontSize: 10, color: muted, lineHeight: 1.6 }}>
                      Week 1: 50/day → Week 2: 150/day → Week 3: 500/day → Week 4+: 2000/day
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Review ── */}
          {step === 5 && (
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 18 }}>
                Review & Launch
              </div>

              {[
                { label: 'Campaign Name', value: name },
                { label: 'Channel', value: channel.toUpperCase() },
                { label: 'Recipients', value: `${recipients.length.toLocaleString()} contacts` },
                { label: 'Subject', value: subject || '—' },
                { label: 'Schedule', value: scheduleType === 'now' ? 'Send immediately' : new Date(scheduledAt).toLocaleString() },
                { label: 'Send Window', value: `${windowStart} – ${windowEnd}` },
                { label: 'Batch Size', value: `${batchSize} per batch` },
                { label: 'Interval', value: `${batchInterval} min` },
                { label: 'Est. Completion', value: estimateCompletion(recipients.length, batchSize, batchInterval) },
                { label: 'Email Warmup', value: warmup ? 'Enabled ✅' : 'Disabled' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: `1px solid ${border}`,
                  fontSize: 12,
                }}>
                  <span style={{ color: muted, fontWeight: 600 }}>{row.label}</span>
                  <span style={{ color: text, fontWeight: 700 }}>{row.value}</span>
                </div>
              ))}

              <div style={{
                marginTop: 16, padding: '12px 14px',
                background: '#22c55e12', border: '1px solid #22c55e30',
                borderRadius: 10, fontSize: 11, color: '#15803d', lineHeight: 1.6,
              }}>
                <strong>✅ Ready to launch.</strong> Messages will be sent in batches of {batchSize}{' '}
                every {batchInterval} minutes within your send window.
                Unsubscribers will be automatically excluded from future campaigns.
              </div>

              {error && (
                <div style={{
                  marginTop: 12, padding: '10px 14px',
                  background: '#ef444415', border: '1px solid #ef444430',
                  borderRadius: 8, fontSize: 12, color: '#ef4444',
                }}>
                  ❌ {error}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{
          padding: '14px 24px', borderTop: `1px solid ${border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}>
          <button
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            style={{
              padding: '9px 20px', background: 'transparent',
              border: `1px solid ${border}`, borderRadius: 8,
              color: muted, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronLeft size={14} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>

          <div style={{ fontSize: 11, color: muted }}>
            Step {step} of {STEPS.length}
          </div>

          {step < 5 ? (
            <button
              onClick={() => canProceed() && setStep(s => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: '9px 20px',
                background: canProceed() ? `linear-gradient(135deg, ${accent}, #fb923c)` : border,
                border: 'none', borderRadius: 8, color: canProceed() ? '#fff' : muted,
                fontSize: 13, fontWeight: 700, cursor: canProceed() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={saving}
              style={{
                padding: '9px 24px',
                background: saving ? border : `linear-gradient(135deg, #22c55e, #16a34a)`,
                border: 'none', borderRadius: 8, color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {saving ? (
                <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Launching…</>
              ) : (
                <><CheckCircle size={14} /> Launch Campaign</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


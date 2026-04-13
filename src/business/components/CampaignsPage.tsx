import { useState, useRef, useMemo, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import {
  Users, Upload, Plus, Send, Clock, CheckCircle,
  MessageSquare, X, ChevronDown, Lock, UserCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/app/lib/supabase';
import { fetchCampaignsForBusiness, createCampaignForBusiness, updateCampaignForBusiness, deleteCampaignForBusiness, logActivity } from '@/app/api/supabase-data';

// ─── Types ────────────────────────────────────────────────────────────────────
type SubTab = 'contacts' | 'create' | 'history';
type Channel = 'whatsapp' | 'sms' | 'push';
type SendChannel = 'whatsapp' | 'sms';

interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string[];
}

interface Campaign {
  id: string;
  name: string;
  messageTemplate: string;
  channel: Channel;
  status: 'draft' | 'active' | 'completed' | 'paused';
  contactCount: number;
  sentCount: number;
  createdAt: string;
}

// ─── Message Templates ────────────────────────────────────────────────────────
const MESSAGE_TEMPLATES = [
  { id: 'promo',           label: '🎉 Promotional Offer',    body: 'Hi {name}! 🎉 {business} has a special offer just for you — {offer}. Visit us today!' },
  { id: 'payment_reminder',label: '💳 Payment Reminder',      body: 'Hi {name}, this is a friendly reminder from {business} that your payment of ₹{amount} is due. Please clear it at your earliest convenience. Thank you!' },
  { id: 'payment_received', label: '✅ Payment Received',      body: 'Hi {name}, we confirm receipt of your payment at {business}. Thank you for your trust! 🙏' },
  { id: 'appointment',     label: '📅 Appointment Reminder', body: 'Hi {name}, your appointment at {business} is coming up. Please confirm by replying to this message.' },
  { id: 'new_arrival',     label: '🆕 New Arrival',          body: 'Hi {name}! We have exciting new arrivals at {business}. Come check them out and grab exclusive early-bird offers!' },
  { id: 'festive',         label: '🎊 Festive Greeting',     body: 'Warm wishes from {business} to you and your family, {name}! May this festive season bring joy and prosperity. 🎊' },
  { id: 'loyalty',         label: '⭐ Loyalty Reward',       body: 'Hi {name}, as a valued customer of {business}, you have earned a special loyalty reward! Visit us to claim your exclusive benefit.' },
  { id: 'feedback',        label: '📝 Feedback Request',     body: 'Hi {name}, thank you for visiting {business}! We would love to hear your feedback. Your opinion helps us serve you better. 🙏' },
  { id: 'winback',         label: '💔 Win-Back',             body: 'Hi {name}, we miss you at {business}! It has been a while. Come back and enjoy a special welcome-back discount just for you. ❤️' },
  { id: 'custom',          label: '✏️ Custom Message',       body: '' },
];

// ─── Mock campaigns (replace with Supabase) ───────────────────────────────────
const SAMPLE_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'March Sale Blast', messageTemplate: 'Hi {name}! 🎉 {business} has a special offer for you — 30% OFF today only. Visit us now!', channel: 'whatsapp', status: 'completed', contactCount: 45, sentCount: 45, createdAt: '2026-03-10' },
  { id: 'c2', name: 'New Product Launch', messageTemplate: 'Hey {name}, {business} just launched something amazing! Check it out and grab your offer: {offer}', channel: 'whatsapp', status: 'active', contactCount: 28, sentCount: 12, createdAt: '2026-03-15' },
];

const CHIP_VARIABLES = ['{name}', '{business}', '{offer}', '{amount}'];

// ─── TAG COLORS ───────────────────────────────────────────────────────────────
const TAG_COLORS = [
  '#f97316', '#22c55e', '#3b82f6', '#a855f7', '#ec4899',
  '#f59e0b', '#14b8a6', '#ef4444',
];
function tagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// ─── Compose Sheet ────────────────────────────────────────────────────────────
interface ComposeSheetProps {
  contacts: Contact[];
  channel: SendChannel;
  bizName: string;
  isDark: boolean;
  onClose: () => void;
}

function ComposeSheet({ contacts, channel, bizName, isDark, onClose }: ComposeSheetProps) {
  const [templateId, setTemplateId] = useState(MESSAGE_TEMPLATES[0].id);
  const [body, setBody] = useState(MESSAGE_TEMPLATES[0].body);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';
  const overlay   = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';

  function handleTemplateChange(id: string) {
    setTemplateId(id);
    const tpl = MESSAGE_TEMPLATES.find(t => t.id === id);
    if (tpl) setBody(tpl.body);
  }

  const firstContact = contacts[0];
  const preview = body
    .replace(/\{name\}/g, firstContact?.name ?? 'Customer')
    .replace(/\{business\}/g, bizName)
    .replace(/\{offer\}/g, 'Special Offer')
    .replace(/\{amount\}/g, '0');

  function buildLink(c: Contact): string {
    const msg = body
      .replace(/\{name\}/g, c.name)
      .replace(/\{business\}/g, bizName)
      .replace(/\{offer\}/g, 'Special Offer')
      .replace(/\{amount\}/g, '0');
    const phone = c.phone.replace(/\D/g, '');
    if (channel === 'whatsapp') {
      return `https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`;
    }
    return `sms:${phone}?body=${encodeURIComponent(msg)}`;
  }

  const channelColor = channel === 'whatsapp' ? '#25d366' : '#3b82f6';
  const channelLabel = channel === 'whatsapp' ? 'WhatsApp' : 'SMS';

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: overlay,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 16, padding: 24, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: text, margin: 0 }}>
              Send {channelLabel}
            </p>
            <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>
              {contacts.length} contact{contacts.length !== 1 ? 's' : ''} selected
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%', border: `1px solid ${border}`,
              background: inputBg, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: textMuted,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Template selector */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>Template</span>
          <div style={{ position: 'relative' }}>
            <select
              value={templateId}
              onChange={e => handleTemplateChange(e.target.value)}
              style={{
                width: '100%', padding: '9px 32px 9px 12px', borderRadius: 8,
                background: inputBg, border: `1px solid ${border}`, color: text,
                fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {MESSAGE_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
          </div>
        </label>

        {/* Message body */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>Message</span>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={4}
            placeholder="Type your message…"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
              background: inputBg, border: `1px solid ${border}`, color: text,
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              fontFamily: 'inherit', lineHeight: 1.6,
            }}
          />
        </label>

        {/* Live preview */}
        <div style={{
          background: isDark ? '#0f1838' : '#fdf6f0',
          border: `1px solid ${border}`, borderRadius: 8, padding: 12,
          fontSize: 12, color: textMuted, lineHeight: 1.7, marginBottom: 20,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: text, display: 'block', marginBottom: 4 }}>
            Preview (for {firstContact?.name ?? 'first contact'}):
          </span>
          {preview || <span style={{ opacity: 0.5 }}>Enter a message above…</span>}
        </div>

        {/* Links list */}
        {contacts.length > 0 && body.trim() && (
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: text, marginBottom: 8 }}>
              Send links ({contacts.length}):
            </p>
            <div style={{
              border: `1px solid ${border}`, borderRadius: 10,
              maxHeight: 240, overflowY: 'auto',
            }}>
              {contacts.map((c, i) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px',
                    borderBottom: i < contacts.length - 1 ? `1px solid ${border}` : 'none',
                  }}
                >
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: text, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{c.phone}</p>
                  </div>
                  <a
                    href={buildLink(c)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 10px', borderRadius: 7,
                      background: channelColor, color: '#fff',
                      textDecoration: 'none', fontSize: 11, fontWeight: 600, flexShrink: 0,
                    }}
                  >
                    <Send size={11} />
                    Send
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', borderRadius: 9,
            background: inputBg, border: `1px solid ${border}`,
            color: textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ─── Contacts Tab ─────────────────────────────────────────────────────────────
function ContactsTab({
  bizId, bizName, isDark,
}: { bizId: string | null; bizName: string; isDark: boolean }) {
  const [contacts, setContacts]       = useState<Contact[]>([]);
  const [preview, setPreview]         = useState<Contact[]>([]);
  const [importing, setImporting]     = useState(false);
  const [importingLeads, setImportingLeads] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [composeChannel, setComposeChannel] = useState<SendChannel | null>(null);

  // Add Customer form state
  const [addName, setAddName]   = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addTags, setAddTags]   = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  const allChecked = contacts.length > 0 && selectedIds.size === contacts.length;
  const someChecked = selectedIds.size > 0 && selectedIds.size < contacts.length;

  const selectedContacts = useMemo(
    () => contacts.filter(c => selectedIds.has(c.id)),
    [contacts, selectedIds],
  );

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(contacts.map(c => c.id)));
    }
  }

  async function handleAddCustomer() {
    if (!addName.trim()) { toast.error('Name is required'); return; }
    if (!addPhone.trim()) { toast.error('Phone is required'); return; }
    setAddSaving(true);
    const tags = addTags.split(',').map(t => t.trim()).filter(Boolean);
    const newContact: Contact = {
      id: `manual-${Date.now()}`,
      name: addName.trim(),
      phone: addPhone.trim(),
      email: addEmail.trim() || undefined,
      notes: addNotes.trim() || undefined,
      tags: tags.length ? tags : undefined,
    };
    try {
      if (supabase && bizId) {
        const { error } = await supabase.from('campaign_contacts').insert({
          business_id: bizId,
          name: newContact.name,
          phone: newContact.phone,
          email: newContact.email ?? null,
          notes: newContact.notes ?? null,
          tags: tags.length ? tags : null,
          status: 'pending',
        });
        if (error) throw error;
      }
      setContacts(prev => {
        const existing = new Set(prev.map(c => c.phone));
        if (existing.has(newContact.phone)) {
          toast.error('A contact with this phone already exists');
          return prev;
        }
        return [newContact, ...prev];
      });
      toast.success(`${newContact.name} added`);
      setAddName(''); setAddPhone(''); setAddEmail(''); setAddNotes(''); setAddTags('');
      setShowAddForm(false);
    } catch {
      toast.error('Save failed — showing locally');
      setContacts(prev => {
        const existing = new Set(prev.map(c => c.phone));
        if (existing.has(newContact.phone)) return prev;
        return [newContact, ...prev];
      });
      setAddName(''); setAddPhone(''); setAddEmail(''); setAddNotes(''); setAddTags('');
      setShowAddForm(false);
    } finally {
      setAddSaving(false);
    }
  }

  function handleDeleteContact(id: string) {
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelectedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  }

  function parseCSV(raw: string): Contact[] {
    const lines = raw.trim().split('\n').filter(Boolean);
    const rows: Contact[] = [];
    const start = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
    for (let i = start; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const name  = parts[0] ?? '';
      const phone = parts[1] ?? '';
      const email = parts[2] ?? '';
      const tags  = parts[3] ? parts[3].split(';').map(t => t.trim()).filter(Boolean) : undefined;
      if (name && phone) {
        rows.push({ id: `import-${i}-${Date.now()}`, name, phone, email: email || undefined, tags });
      }
    }
    return rows;
  }

  async function handleImportFromLeads() {
    setImportingLeads(true);
    try {
      // Pull leads from Supabase; fall back to mock data in dev mode
      let leadContacts: Contact[] = [];
      if (supabase && bizId) {
        const { data } = await supabase
          .from('leads')
          .select('id, name, phone, email, company')
          .eq('business_id', bizId)
          .not('phone', 'is', null);
        if (data && data.length > 0) {
          leadContacts = data
            .filter((l: { phone?: string }) => l.phone)
            .map((l: { id: string; name: string; phone: string; email?: string; company?: string }) => ({
              id: `lead-contact-${l.id}`,
              name: l.name,
              phone: l.phone,
              email: l.email ?? undefined,
              notes: l.company ? `Company: ${l.company}` : undefined,
              tags: ['lead'],
            }));
        }
      }
      // Dev mode fallback
      if (leadContacts.length === 0) {
        leadContacts = [
          { id: 'lc-1', name: 'Ramesh Logistics', phone: '9876543210', tags: ['lead', 'b2b'] },
          { id: 'lc-2', name: 'Priya Boutique', phone: '9123456789', tags: ['lead', 'retail'] },
          { id: 'lc-3', name: 'Sunita Catering', phone: '9988776655', tags: ['lead', 'catering'] },
          { id: 'lc-4', name: 'Vikram Pharma', phone: '9871234560', tags: ['lead', 'wholesale'] },
        ];
      }
      const existingPhones = new Set(contacts.map(c => c.phone));
      const fresh = leadContacts.filter(c => !existingPhones.has(c.phone));
      if (fresh.length === 0) {
        toast.success('All lead contacts are already in your list');
        return;
      }
      setContacts(prev => [...prev, ...fresh]);
      toast.success(`${fresh.length} lead contact${fresh.length !== 1 ? 's' : ''} imported`);
    } catch {
      toast.error('Import failed');
    } finally {
      setImportingLeads(false);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const raw = ev.target?.result as string;
      const parsed = parseCSV(raw);
      setPreview(parsed);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setImporting(true);
    try {
      if (supabase && bizId) {
        const rows = preview.map(c => ({
          business_id: bizId,
          name: c.name,
          phone: c.phone,
          email: c.email ?? null,
          tags: c.tags ?? null,
          status: 'pending',
        }));
        const { error } = await supabase.from('campaign_contacts').insert(rows);
        if (error) throw error;
      }
      setContacts(prev => {
        const existing = new Set(prev.map(c => c.phone));
        return [...prev, ...preview.filter(c => !existing.has(c.phone))];
      });
      toast.success(`${preview.length} contacts imported`);
      setPreview([]);
    } catch {
      toast.error('Import failed — DB may not be set up yet, showing locally');
      setContacts(prev => {
        const existing = new Set(prev.map(c => c.phone));
        return [...prev, ...preview.filter(c => !existing.has(c.phone))];
      });
      setPreview([]);
    } finally {
      setImporting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    background: inputBg, border: `1px solid ${border}`, color: text,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Compose sheet overlay */}
      {composeChannel && (
        <ComposeSheet
          contacts={selectedContacts}
          channel={composeChannel}
          bizName={bizName}
          isDark={isDark}
          onClose={() => setComposeChannel(null)}
        />
      )}

      {/* Add Customer */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAddForm ? 16 : 0 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>Add Customer</p>
            {!showAddForm && (
              <p style={{ fontSize: 11, color: textMuted, margin: 0, marginTop: 2 }}>Manually add a contact to your list</p>
            )}
          </div>
          <button
            onClick={() => setShowAddForm(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: accent, color: '#fff', border: 'none',
              cursor: 'pointer', fontSize: 12, fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {showAddForm ? <X size={13} /> : <Plus size={13} />}
            {showAddForm ? 'Cancel' : 'Add Customer'}
          </button>
        </div>

        {showAddForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: text, display: 'block', marginBottom: 4 }}>
                  Name <span style={{ color: accent }}>*</span>
                </span>
                <input
                  value={addName}
                  onChange={e => setAddName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  style={inputStyle}
                />
              </label>
              <label style={{ display: 'block' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: text, display: 'block', marginBottom: 4 }}>
                  Phone <span style={{ color: accent }}>*</span>
                </span>
                <input
                  value={addPhone}
                  onChange={e => setAddPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  type="tel"
                  style={inputStyle}
                />
              </label>
            </div>

            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: text, display: 'block', marginBottom: 4 }}>Email (optional)</span>
              <input
                value={addEmail}
                onChange={e => setAddEmail(e.target.value)}
                placeholder="e.g. ravi@example.com"
                type="email"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: text, display: 'block', marginBottom: 4 }}>Notes (optional)</span>
              <input
                value={addNotes}
                onChange={e => setAddNotes(e.target.value)}
                placeholder="e.g. Regular customer, prefers mornings"
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'block' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: text, display: 'block', marginBottom: 4 }}>Tags — comma separated (optional)</span>
              <input
                value={addTags}
                onChange={e => setAddTags(e.target.value)}
                placeholder="e.g. VIP, Loyal, Diwali"
                style={inputStyle}
              />
            </label>

            <button
              onClick={handleAddCustomer}
              disabled={addSaving}
              style={{
                padding: '10px', borderRadius: 9,
                background: accent, color: '#fff', border: 'none',
                cursor: addSaving ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 700, opacity: addSaving ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Plus size={15} />
              {addSaving ? 'Saving…' : 'Save Contact'}
            </button>
          </div>
        )}
      </div>

      {/* Import from Leads */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserCheck size={14} color={accent} /> Import from Leads
            </p>
            <p style={{ fontSize: 11, color: textMuted, margin: 0, marginTop: 2 }}>Pull phone numbers from your leads pipeline</p>
          </div>
          <button
            onClick={handleImportFromLeads}
            disabled={importingLeads}
            style={{ padding: '8px 16px', borderRadius: 9, border: `1px solid ${accent}55`, background: `${accent}11`, color: accent, cursor: importingLeads ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, opacity: importingLeads ? 0.6 : 1 }}
          >
            <UserCheck size={13} /> {importingLeads ? 'Importing…' : 'Import Leads'}
          </button>
        </div>
      </div>

      {/* CSV Import */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: text, marginBottom: 4 }}>Import from CSV</p>
        <p style={{ fontSize: 11, color: textMuted, marginBottom: 16 }}>
          Columns: <strong style={{ color: text }}>name, phone, email (opt), tags (opt, semicolon-separated)</strong>
        </p>

        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{ display: 'none' }} />

        <button
          onClick={() => fileRef.current?.click()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', padding: '12px', borderRadius: 10,
            background: inputBg, border: `2px dashed ${border}`,
            cursor: 'pointer', fontSize: 13, color: textMuted, fontWeight: 500,
          }}
        >
          <Upload size={16} />
          Click to select CSV file
        </button>

        {preview.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: textMuted, marginBottom: 8 }}>
              Preview ({preview.length} contacts):
            </p>
            <div style={{ background: inputBg, borderRadius: 8, border: `1px solid ${border}`, maxHeight: 200, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: textMuted, fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: textMuted, fontWeight: 600 }}>Phone</th>
                    <th style={{ padding: '6px 12px', textAlign: 'left', color: textMuted, fontWeight: 600 }}>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 20).map((c) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${border}88` }}>
                      <td style={{ padding: '6px 12px', color: text }}>{c.name}</td>
                      <td style={{ padding: '6px 12px', color: textMuted }}>{c.phone}</td>
                      <td style={{ padding: '6px 12px', color: textMuted }}>{c.email ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                marginTop: 12, width: '100%', padding: '10px',
                borderRadius: 8, background: accent, color: '#fff',
                border: 'none', cursor: importing ? 'not-allowed' : 'pointer',
                fontSize: 13, fontWeight: 600, opacity: importing ? 0.7 : 1,
              }}
            >
              {importing ? 'Importing…' : `Import ${preview.length} contacts`}
            </button>
          </div>
        )}
      </div>

      {/* Contact list */}
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {contacts.length > 0 && (
              <input
                type="checkbox"
                checked={allChecked}
                ref={el => { if (el) el.indeterminate = someChecked; }}
                onChange={toggleAll}
                style={{ width: 15, height: 15, cursor: 'pointer', accentColor: accent }}
              />
            )}
            <p style={{ fontSize: 13, fontWeight: 600, color: text, margin: 0 }}>
              Contacts ({contacts.length})
              {selectedIds.size > 0 && (
                <span style={{
                  marginLeft: 8, padding: '2px 8px', borderRadius: 20,
                  background: `${accent}22`, color: accent,
                  fontSize: 11, fontWeight: 700,
                }}>
                  {selectedIds.size} selected
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            padding: '10px 12px', borderRadius: 10,
            background: isDark ? '#162040' : '#fff7ed',
            border: `1px solid ${accent}44`, marginBottom: 12,
          }}>
            <span style={{ fontSize: 12, color: text, fontWeight: 600, marginRight: 4 }}>
              {selectedIds.size} selected —
            </span>
            <button
              onClick={() => setComposeChannel('whatsapp')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7,
                background: '#25d366', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              <Send size={12} />
              Send WhatsApp
            </button>
            <button
              onClick={() => setComposeChannel('sms')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7,
                background: '#3b82f6', color: '#fff', border: 'none',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}
            >
              <MessageSquare size={12} />
              Send SMS
            </button>
            <button
              disabled
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7,
                background: isDark ? '#1c2a55' : '#f3f4f6',
                color: textMuted, border: `1px solid ${border}`,
                cursor: 'not-allowed', fontSize: 12, fontWeight: 600, opacity: 0.6,
              }}
            >
              <Lock size={12} />
              Send Push
            </button>
          </div>
        )}

        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: textMuted }}>
            <Users size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontSize: 13, margin: 0 }}>No contacts yet — add a customer or import a CSV</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
            {contacts.map((c) => {
              const isSelected = selectedIds.has(c.id);
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 9,
                    background: isSelected
                      ? isDark ? '#1a2e5a' : '#fff7ed'
                      : inputBg,
                    border: `1px solid ${isSelected ? accent + '66' : border}`,
                    transition: 'background 0.12s, border-color 0.12s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(c.id)}
                    style={{ width: 14, height: 14, cursor: 'pointer', accentColor: accent, flexShrink: 0 }}
                  />
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: `${accent}22`, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 12, color: accent, fontWeight: 700,
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: text, margin: 0 }}>{c.name}</p>
                      {c.tags?.map(tag => (
                        <span
                          key={tag}
                          style={{
                            padding: '1px 7px', borderRadius: 20,
                            background: `${tagColor(tag)}22`, color: tagColor(tag),
                            fontSize: 10, fontWeight: 700,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>
                      {c.phone}
                      {c.email && <span style={{ marginLeft: 8, opacity: 0.75 }}>{c.email}</span>}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteContact(c.id)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', border: `1px solid ${border}`,
                      background: 'transparent', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: textMuted, flexShrink: 0,
                    }}
                    title="Remove contact"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Create Campaign Tab ───────────────────────────────────────────────────────
function CreateCampaignTab({
  bizId, bizName, isDark,
}: { bizId: string | null; bizName: string; isDark: boolean }) {
  const [name, setName]         = useState('');
  const [templateId, setTemplateId] = useState(MESSAGE_TEMPLATES[0].id);
  const [template, setTemplate] = useState(MESSAGE_TEMPLATES[0].body);
  const [channel, setChannel]   = useState<Channel>('whatsapp');
  const [contacts]              = useState<Contact[]>([
    { id: 's1', name: 'Demo Customer', phone: '9876543210' },
  ]);
  const [saving, setSaving]     = useState(false);
  const [generated, setGenerated] = useState<{ contact: Contact; msg: string }[]>([]);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const inputBg   = isDark ? '#162040' : '#fdf6f0';
  const accent    = '#f97316';

  function handleTemplateIdChange(id: string) {
    setTemplateId(id);
    const tpl = MESSAGE_TEMPLATES.find(t => t.id === id);
    if (tpl) setTemplate(tpl.body);
  }

  const previewMsg = template
    .replace(/\{name\}/g, 'Customer')
    .replace(/\{business\}/g, bizName)
    .replace(/\{offer\}/g, 'Special Offer')
    .replace(/\{amount\}/g, '0');

  function insertChip(chip: string) {
    setTemplate(prev => prev + chip);
  }

  async function handleCreate() {
    if (!name.trim() || !template.trim()) {
      toast.error('Please fill in campaign name and message');
      return;
    }
    setSaving(true);
    try {
      const created = await createCampaignForBusiness(bizId!, name.trim(), template, channel);
      if (!created) throw new Error('Create failed');

      logActivity({
        businessId: bizId!,
        actorId: bizId!,
        actorType: 'owner',
        actorName: bizName,
        action: 'create',
        entityType: 'campaign',
        entityId: '',
        entityName: name.trim(),
        metadata: { channel, contactCount: contacts.length },
      });

      const msgs = contacts.map(c => ({
        contact: c,
        msg: template
          .replace(/\{name\}/g, c.name)
          .replace(/\{business\}/g, bizName)
          .replace(/\{offer\}/g, 'Special Offer')
          .replace(/\{amount\}/g, '0'),
      }));
      setGenerated(msgs);
      toast.success('Campaign created!');
    } catch {
      toast.error('Save failed — DB may not be ready, showing links anyway');
      const msgs = contacts.map(c => ({
        contact: c,
        msg: template
          .replace(/\{name\}/g, c.name)
          .replace(/\{business\}/g, bizName)
          .replace(/\{offer\}/g, 'Special Offer')
          .replace(/\{amount\}/g, '0'),
      }));
      setGenerated(msgs);
    } finally {
      setSaving(false);
    }
  }

  const CHANNEL_OPTS: { key: Channel; label: string; color: string; available: boolean }[] = [
    { key: 'whatsapp', label: 'WhatsApp', color: '#25d366', available: true },
    { key: 'sms',      label: 'SMS',      color: '#3b82f6', available: false },
    { key: 'push',     label: 'Push',     color: '#8b5cf6', available: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>

        {/* Campaign name */}
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>Campaign Name</span>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. March Sale Blast"
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
              background: inputBg, border: `1px solid ${border}`, color: text,
              outline: 'none', boxSizing: 'border-box',
            }}
          />
        </label>

        {/* Template selector */}
        <label style={{ display: 'block', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>Message Template</span>
          <div style={{ position: 'relative' }}>
            <select
              value={templateId}
              onChange={e => handleTemplateIdChange(e.target.value)}
              style={{
                width: '100%', padding: '9px 32px 9px 12px', borderRadius: 8,
                background: inputBg, border: `1px solid ${border}`, color: text,
                fontSize: 13, outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {MESSAGE_TEMPLATES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted, pointerEvents: 'none' }} />
          </div>
        </label>

        {/* Editable message */}
        <label style={{ display: 'block', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: text, display: 'block', marginBottom: 6 }}>Edit Message</span>
          <textarea
            value={template}
            onChange={e => setTemplate(e.target.value)}
            rows={4}
            style={{
              width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
              background: inputBg, border: `1px solid ${border}`, color: text,
              outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
          />
        </label>

        {/* Variable chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          <span style={{ fontSize: 11, color: textMuted, alignSelf: 'center' }}>Insert:</span>
          {CHIP_VARIABLES.map(chip => (
            <button
              key={chip}
              onClick={() => insertChip(chip)}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                background: isDark ? '#1c2a55' : '#f3f4f6',
                border: `1px solid ${border}`, color: textMuted,
                cursor: 'pointer',
              }}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Live preview */}
        <div style={{
          background: isDark ? '#0f1838' : '#fdf6f0',
          border: `1px solid ${border}`, borderRadius: 8, padding: 12,
          fontSize: 12, color: textMuted, lineHeight: 1.7, marginBottom: 16,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: text, display: 'block', marginBottom: 4 }}>Preview:</span>
          {previewMsg || <span style={{ opacity: 0.5 }}>Enter a message above…</span>}
        </div>

        {/* Channel selector */}
        <p style={{ fontSize: 12, fontWeight: 600, color: text, marginBottom: 8 }}>Channel</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {CHANNEL_OPTS.map(opt => (
            <button
              key={opt.key}
              onClick={() => opt.available && setChannel(opt.key)}
              style={{
                flex: 1, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: channel === opt.key ? `${opt.color}22` : inputBg,
                border: `1px solid ${channel === opt.key ? opt.color : border}`,
                color: opt.available ? (channel === opt.key ? opt.color : textMuted) : `${textMuted}55`,
                cursor: opt.available ? 'pointer' : 'not-allowed',
              }}
            >
              {opt.label}
              {!opt.available && (
                <span style={{ display: 'block', fontSize: 9, color: textMuted, fontWeight: 400 }}>
                  Configure gateway
                </span>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleCreate}
          disabled={saving}
          style={{
            width: '100%', padding: '11px', borderRadius: 10,
            background: accent, color: '#fff', border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: 14, fontWeight: 700, opacity: saving ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Plus size={16} />
          {saving ? 'Creating…' : 'Create Campaign'}
        </button>
      </div>

      {/* Generated WhatsApp links */}
      {generated.length > 0 && channel === 'whatsapp' && (
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 20 }}>
          <div style={{
            background: '#25d36622', border: '1px solid #25d36644',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, color: isDark ? '#e2e8f0' : '#18100a', lineHeight: 1.6,
          }}>
            <strong>📲 Send via WhatsApp:</strong> Click each link below to open WhatsApp with a pre-filled message for that contact.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {generated.map(({ contact, msg }) => (
              <div key={contact.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', borderRadius: 8,
                background: inputBg, border: `1px solid ${border}`,
              }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: text, margin: 0 }}>{contact.name}</p>
                  <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>{contact.phone}</p>
                </div>
                <a
                  href={`https://wa.me/91${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 7,
                    background: '#25d366', color: '#fff',
                    textDecoration: 'none', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}
                >
                  <Send size={12} />
                  Send
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────
function HistoryTab({ isDark, businessId }: { isDark: boolean; businessId: string | null }) {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const card      = isDark ? '#0e1530' : '#ffffff';
  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';

  useEffect(() => {
    if (!businessId) return;
    setLoading(true);
    fetchCampaignsForBusiness(businessId).then(setCampaigns).finally(() => setLoading(false));
  }, [businessId]);

  const STATUS_META: Record<string, { label: string; color: string }> = {
    draft:     { label: 'Draft',  color: '#64748b' },
    active:    { label: 'Active', color: '#f59e0b' },
    completed: { label: 'Done',   color: '#22c55e' },
    paused:    { label: 'Paused', color: '#6b7280' },
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: textMuted }}>
        <div style={{ fontSize: 13 }}>Loading campaigns…</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {campaigns.map((c) => {
        const meta = STATUS_META[c.status] ?? STATUS_META.draft;
        const progress = c.contact_count > 0 ? Math.round((c.sent_count / c.contact_count) * 100) : 0;
        return (
          <div key={c.id} style={{ background: card, border: `1px solid ${border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: text, margin: 0, marginBottom: 2 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: textMuted, margin: 0 }}>
                  {c.channel === 'whatsapp' ? '💬' : c.channel === 'sms' ? '📱' : '🔔'} {c.channel.toUpperCase()} · {new Date(c.created_at).toLocaleDateString()}
                </p>
              </div>
              <span style={{
                padding: '3px 8px', borderRadius: 6,
                background: `${meta.color}22`, color: meta.color,
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {meta.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: isDark ? '#1c2a55' : '#e8d8cc', overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: meta.color, borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 11, color: textMuted, flexShrink: 0 }}>
                {c.sent_count}/{c.contact_count} sent
              </span>
            </div>
          </div>
        );
      })}
      {campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: textMuted }}>
          <Clock size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
          <p style={{ fontSize: 13, margin: 0 }}>No campaigns yet — create your first one!</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function CampaignsPage() {
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const { bizUser } = useBusinessContext();
  const [activeTab, setActiveTab] = useState<SubTab>('contacts');
  const businessId = bizUser?.businessId || bizUser?.id;

  // Mark Getting Started: 'campaign' step done on first visit
  useEffect(() => {
    try {
      const done: string[] = JSON.parse(localStorage.getItem('rr_onboarding_done') || '[]');
      if (!done.includes('campaign')) localStorage.setItem('rr_onboarding_done', JSON.stringify([...done, 'campaign']));
    } catch { /* ignore */ }
  }, []);

  const border    = isDark ? '#1c2a55' : '#e8d8cc';
  const text      = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent    = '#f97316';

  const bizId   = bizUser?.businessId ?? null;
  const bizName = bizUser?.businessName ?? 'My Business';

  const TABS: { key: SubTab; label: string; icon: React.ReactNode }[] = [
    { key: 'contacts', label: 'Contacts',        icon: <Users size={14} /> },
    { key: 'create',   label: 'Create Campaign', icon: <Plus size={14} /> },
    { key: 'history',  label: 'History',         icon: <Clock size={14} /> },
  ];

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: '#22c55e22', border: '1px solid #22c55e44',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={18} color="#22c55e" />
        </div>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: text, margin: 0 }}>Campaigns</h1>
          <p style={{ fontSize: 12, color: textMuted, margin: 0 }}>Manage contacts and send marketing campaigns</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: isDark ? '#0e1530' : '#f3f4f6',
        borderRadius: 12, marginBottom: 24,
        border: `1px solid ${border}`,
      }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6, padding: '8px 12px', borderRadius: 8,
              background: activeTab === tab.key
                ? isDark ? '#162040' : '#ffffff'
                : 'transparent',
              border: activeTab === tab.key ? `1px solid ${border}` : '1px solid transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
              color: activeTab === tab.key ? accent : textMuted,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {tab.icon}
            {isMobile
              ? (tab.key === 'contacts' ? 'Contacts' : tab.key === 'create' ? 'Create' : 'History')
              : tab.label
            }
          </button>
        ))}
      </div>

      {activeTab === 'contacts' && (
        <ContactsTab bizId={bizId} bizName={bizName} isDark={isDark} />
      )}
      {activeTab === 'create' && (
        <CreateCampaignTab bizId={bizId} bizName={bizName} isDark={isDark} />
      )}
      {activeTab === 'history' && (
        <HistoryTab isDark={isDark} businessId={businessId} />
      )}
    </div>
  );
}

/**
 * SenderIdentityModal — Simplified
 *
 * Platform manages all API credentials (Resend for email, MSG91 for WhatsApp/SMS).
 * Users only provide:
 *   Email    → Display name  +  From email address
 *   WhatsApp → Display name  +  WhatsApp business number
 *   SMS      → Display name  +  Approved Sender ID
 */

import { useState } from 'react';
import { X, Mail, MessageSquare, Phone, CheckCircle, Info, Zap } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { upsertSenderIdentity, type SenderIdentity } from '@/app/api/supabase-data';
import { HintTooltip } from './HintTooltip';

interface Props {
  onClose: () => void;
  onSaved: (identity: SenderIdentity) => void;
  existing?: SenderIdentity;
}

const CHANNEL_OPTIONS = [
  {
    value:  'email'    as const,
    label:  'Email',
    icon:   <Mail size={18} />,
    color:  '#3b82f6',
    badge:  'Powered by Resend',
    desc:   'Send bulk emails. Platform handles delivery, unsubscribes & warmup automatically.',
  },
  {
    value:  'whatsapp' as const,
    label:  'WhatsApp',
    icon:   <MessageSquare size={18} />,
    color:  '#22c55e',
    badge:  'Powered by MSG91',
    desc:   'Send WhatsApp messages to opted-in customers via your registered business number.',
  },
  {
    value:  'sms'      as const,
    label:  'SMS',
    icon:   <Phone size={18} />,
    color:  '#f59e0b',
    badge:  'Powered by MSG91',
    desc:   'Transactional & promotional SMS. Sender ID must be TRAI-approved (1–3 days).',
  },
];

export function SenderIdentityModal({ onClose, onSaved, existing }: Props) {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();

  const [channel,     setChannel]     = useState<'email' | 'whatsapp' | 'sms'>(existing?.channel ?? 'email');
  const [displayName, setDisplayName] = useState(existing?.display_name ?? '');
  const [fromEmail,   setFromEmail]   = useState(existing?.from_email ?? '');
  const [waNumber,    setWaNumber]    = useState(existing?.wa_number ?? '');
  const [smsSenderId, setSmsSenderId] = useState(existing?.sms_sender_id ?? '');
  const [warmup,      setWarmup]      = useState(existing?.warmup_enabled ?? true);
  const [isDefault,   setIsDefault]   = useState(existing?.is_default ?? false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');

  const overlay = isDark ? 'rgba(0,0,0,0.7)'  : 'rgba(0,0,0,0.4)';
  const card    = isDark ? '#0e1530'           : '#ffffff';
  const border  = isDark ? '#1c2a55'           : '#e8d8cc';
  const text    = isDark ? '#e2e8f0'           : '#18100a';
  const muted   = isDark ? '#64748b'           : '#9a7860';
  const inputBg = isDark ? '#0a1020'           : '#fdf6f0';
  const accent  = '#f97316';

  const selected = CHANNEL_OPTIONS.find(c => c.value === channel)!;

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 13px', background: inputBg,
    border: `1px solid ${border}`, borderRadius: 9,
    color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };

  function ToggleRow({ label, sub, value, onChange, accentColor }: {
    label: string; sub: string; value: boolean; onChange: () => void; accentColor?: string;
  }) {
    const bg = value ? (accentColor ?? accent) : (isDark ? '#374151' : '#d1d5db');
    return (
      <div style={{ padding: '12px 14px', borderRadius: 10, border: `1px solid ${border}`, background: inputBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: text }}>{label}</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{sub}</div>
        </div>
        <button onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', background: bg, position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
        </button>
      </div>
    );
  }

  function FieldLabel({ t }: { t: string }) {
    return <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>{t}</div>;
  }

  function InfoBox({ color, bg, borderClr, children }: { color: string; bg: string; borderClr: string; children: React.ReactNode }) {
    return (
      <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: bg, border: `1px solid ${borderClr}`, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Info size={12} color={color} style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 11, color, lineHeight: 1.5 }}>{children}</div>
      </div>
    );
  }

  async function handleSave() {
    setError('');
    if (!displayName.trim())                            { setError('Display name is required.'); return; }
    if (channel === 'email'    && !fromEmail.trim())    { setError('From email address is required.'); return; }
    if (channel === 'whatsapp' && !waNumber.trim())     { setError('WhatsApp number is required.'); return; }
    if (channel === 'sms'      && !smsSenderId.trim())  { setError('Sender ID is required.'); return; }
    if (!bizUser?.businessId)                           { setError('Business not configured.'); return; }

    setSaving(true);
    try {
      const result = await upsertSenderIdentity({
        id:             existing?.id,
        business_id:    bizUser.businessId,
        channel,
        display_name:   displayName.trim(),
        from_email:     channel === 'email'    ? fromEmail.trim()   : undefined,
        wa_number:      channel === 'whatsapp' ? waNumber.trim()    : undefined,
        sms_sender_id:  channel === 'sms'      ? smsSenderId.trim() : undefined,
        warmup_enabled: channel === 'email' ? warmup : false,
        is_default:     isDefault,
        is_verified:    true,
      });
      if (result) {
        setSaved(true);
        setTimeout(() => onSaved(result), 800);
      } else {
        setError('Failed to save. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: card, borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', maxHeight: '92vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: `${selected.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: selected.color }}>
            {selected.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: text }}>
              {existing ? `Edit ${selected.label} Sender` : 'Add Sender Identity'}
            </div>
            <div style={{ fontSize: 12, color: muted }}>{selected.badge} · No API keys needed</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Platform notice */}
          <div style={{ padding: '10px 14px', borderRadius: 10, background: isDark ? '#0a1a0a' : '#f0fdf4', border: `1px solid ${isDark ? '#14532d' : '#bbf7d0'}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <Zap size={14} color="#22c55e" style={{ marginTop: 1, flexShrink: 0 }} />
            <div style={{ fontSize: 12, color: isDark ? '#86efac' : '#15803d', lineHeight: 1.5 }}>
              <strong>Zero configuration.</strong> Delivery infrastructure, rate limits, and compliance are fully managed by the platform. Just enter your sender details below.
            </div>
          </div>

          {/* Channel selector — only on new */}
          {!existing && (
            <div>
              <FieldLabel t="Channel" />
              <div style={{ display: 'flex', gap: 8 }}>
                {CHANNEL_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setChannel(opt.value)} style={{
                    flex: 1, padding: '10px 6px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${channel === opt.value ? opt.color : border}`,
                    background: channel === opt.value ? `${opt.color}15` : inputBg,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}>
                    <span style={{ color: channel === opt.value ? opt.color : muted }}>{opt.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: channel === opt.value ? opt.color : muted }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 8, lineHeight: 1.5 }}>{selected.desc}</div>
            </div>
          )}

          {/* Display name — all channels */}
          <div>
            <FieldLabel t="Display Name" />
            <input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder={channel === 'email' ? "e.g. Raj's Bakery Offers" : channel === 'whatsapp' ? "e.g. Raj's Bakery Support" : "e.g. Raj's Bakery"}
              style={inputStyle}
            />
            <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>Shown to recipients as the sender name.</div>
          </div>

          {/* EMAIL */}
          {channel === 'email' && (
            <>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FieldLabel t="From Email Address" />
                  <HintTooltip
                    hint="Use your own domain email (e.g. offers@yourbusiness.com) for best deliverability. For testing, onboarding@resend.dev works without any setup."
                    position="right"
                    size={13}
                  />
                </div>
                <input
                  value={fromEmail}
                  onChange={e => setFromEmail(e.target.value)}
                  placeholder="e.g. offers@yourbusiness.com"
                  type="email"
                  style={inputStyle}
                />
                <InfoBox color={isDark ? '#93c5fd' : '#1d4ed8'} bg={isDark ? '#0a1428' : '#eff6ff'} borderClr={isDark ? '#1e3a5f' : '#bfdbfe'}>
                  Use your own domain for best deliverability (e.g. <strong>offers@yourbusiness.com</strong>).
                  For testing, <strong>onboarding@resend.dev</strong> works out of the box.
                </InfoBox>
              </div>
              <ToggleRow
                label="Email Warmup"
                sub="Gradually increases sending volume over 6 weeks. Prevents emails landing in spam for new domains."
                value={warmup}
                onChange={() => setWarmup(v => !v)}
                accentColor="#22c55e"
              />
            </>
          )}

          {/* WHATSAPP */}
          {channel === 'whatsapp' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FieldLabel t="WhatsApp Business Number" />
                <HintTooltip
                  hint="This must be your WhatsApp Business number registered in your MSG91 account. Include country code, e.g. 919876543210 for +91 98765 43210."
                  position="right"
                  size={13}
                />
              </div>
              <input
                value={waNumber}
                onChange={e => setWaNumber(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="e.g. 919876543210"
                style={inputStyle}
              />
              <InfoBox color={isDark ? '#86efac' : '#15803d'} bg={isDark ? '#0a1a0a' : '#f0fdf4'} borderClr={isDark ? '#14532d' : '#bbf7d0'}>
                Digits only with country code. Indian example: <strong>919876543210</strong> = +91 98765 43210.
                Must be registered in your MSG91 WhatsApp account.
              </InfoBox>
            </div>
          )}

          {/* SMS */}
          {channel === 'sms' && (
            <div>
              <FieldLabel t="SMS Sender ID" />
              <input
                value={smsSenderId}
                onChange={e => setSmsSenderId(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                placeholder="e.g. BAKERY"
                style={inputStyle}
                maxLength={6}
              />
              <InfoBox color={isDark ? '#fcd34d' : '#92400e'} bg={isDark ? '#1a1200' : '#fffbeb'} borderClr={isDark ? '#713f12' : '#fde68a'}>
                6-character alphanumeric ID. Requires TRAI pre-approval (1–3 days).
                Until approved, messages deliver as <strong>NOTIFY</strong>.
              </InfoBox>
            </div>
          )}

          {/* Set as default */}
          <ToggleRow
            label="Set as Default"
            sub={`Auto-select this sender for new ${channel} campaigns`}
            value={isDefault}
            onChange={() => setIsDefault(v => !v)}
          />

          {error && (
            <div style={{ padding: '9px 13px', borderRadius: 8, background: '#ef444420', border: '1px solid #ef444440', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${border}`, borderRadius: 9, cursor: 'pointer', color: muted, fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving || saved} style={{
            flex: 2, padding: '10px',
            background: saved ? '#22c55e' : `linear-gradient(135deg, ${accent}, #fb923c)`,
            border: 'none', borderRadius: 9, cursor: saving || saved ? 'default' : 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 700,
            boxShadow: '0 2px 12px rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.3s',
          }}>
            {saved ? <><CheckCircle size={15} /> Saved!</> : saving ? 'Saving…' : existing ? 'Update Sender' : 'Add Sender'}
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * SendMessageModal
 * In-platform message sender — shows a confirmation popup before sending.
 * Uses MSG91 for WhatsApp/SMS, Resend for Email.
 */
import { useState } from 'react';
import { X, Send, CheckCircle, MessageSquare, Phone, Mail, AlertCircle } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

export type MessageChannel = 'whatsapp' | 'sms' | 'email';

interface Props {
  channel: MessageChannel;
  recipientName: string;
  recipientPhone?: string;
  recipientEmail?: string;
  defaultMessage?: string;
  defaultSubject?: string;
  onClose: () => void;
  onSent?: () => void;
}

export function SendMessageModal({ channel, recipientName, recipientPhone, recipientEmail, defaultMessage = '', defaultSubject = '', onClose, onSent }: Props) {
  const { isDark } = useTheme();

  const [message, setMessage]   = useState(defaultMessage);
  const [subject, setSubject]   = useState(defaultSubject);
  const [sending,  setSending]  = useState(false);
  const [sent,     setSent]     = useState(false);
  const [error,    setError]    = useState('');

  const overlay = isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)';
  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const muted   = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#0a1020' : '#fdf6f0';
  const accent  = '#f97316';

  const CHANNEL_META = {
    whatsapp: { label: 'WhatsApp', icon: <MessageSquare size={16} />, color: '#22c55e', placeholder: 'Type your WhatsApp message…' },
    sms:      { label: 'SMS',      icon: <Phone size={16} />,         color: '#f59e0b', placeholder: 'Type your SMS (160 chars recommended)…' },
    email:    { label: 'Email',    icon: <Mail size={16} />,          color: '#3b82f6', placeholder: 'Type your email body…' },
  };
  const meta = CHANNEL_META[channel];

  async function handleSend() {
    setError('');
    if (!message.trim()) { setError('Message cannot be empty.'); return; }
    if (channel === 'email' && !recipientEmail) { setError('No email address for this lead.'); return; }
    if ((channel === 'whatsapp' || channel === 'sms') && !recipientPhone) { setError('No phone number for this lead.'); return; }

    setSending(true);
    try {
      // Call our Supabase edge function to send (avoids CORS + key exposure)
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-direct-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          channel,
          to_phone: recipientPhone?.replace(/\D/g, ''),
          to_email: recipientEmail,
          to_name:  recipientName,
          subject:  channel === 'email' ? subject : undefined,
          body:     message,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.ok === false) throw new Error(json.error ?? 'Send failed');
      setSent(true);
      onSent?.();
      setTimeout(onClose, 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: overlay, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: card, borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 24px 80px rgba(0,0,0,0.35)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }}>
            {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: text }}>Send {meta.label}</div>
            <div style={{ fontSize: 12, color: muted }}>To: {recipientName} {channel !== 'email' ? `· ${recipientPhone}` : `· ${recipientEmail}`}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: muted }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Subject (email only) */}
          {channel === 'email' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</div>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Email subject…"
                style={{ width: '100%', padding: '10px 13px', background: inputBg, border: `1px solid ${border}`, borderRadius: 9, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Message body */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Message</div>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={meta.placeholder}
              rows={channel === 'email' ? 8 : 5}
              style={{ width: '100%', padding: '10px 13px', background: inputBg, border: `1px solid ${border}`, borderRadius: 9, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
            />
            {channel === 'sms' && (
              <div style={{ fontSize: 11, color: message.length > 160 ? '#ef4444' : muted, marginTop: 4, textAlign: 'right' }}>
                {message.length}/160 chars {message.length > 160 ? '— will send as multiple SMS' : ''}
              </div>
            )}
          </div>

          {/* Quick templates */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Templates</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {channel === 'whatsapp' && [
                { label: 'Follow-up', text: `Hi ${recipientName}, just checking in on our conversation. Do you have any questions?` },
                { label: 'Proposal ready', text: `Hi ${recipientName}, your proposal is ready! Please review and let me know your thoughts.` },
                { label: 'Meeting invite', text: `Hi ${recipientName}, would you be available for a quick call this week? Please share a convenient time.` },
              ].map(t => (
                <button key={t.label} onClick={() => setMessage(t.text)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${border}`, background: inputBg, color: muted, fontSize: 11, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
              {channel === 'sms' && [
                { label: 'Follow-up', text: `Hi ${recipientName}, following up on our discussion. Please call back when convenient.` },
                { label: 'Reminder', text: `Reminder: Your appointment is scheduled. Please confirm by replying YES.` },
              ].map(t => (
                <button key={t.label} onClick={() => setMessage(t.text)} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${border}`, background: inputBg, color: muted, fontSize: 11, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
              {channel === 'email' && [
                { label: 'Follow-up', text: `Hi ${recipientName},\n\nI hope you're doing well. I wanted to follow up on our previous conversation.\n\nPlease let me know if you have any questions or if you'd like to schedule a call.\n\nBest regards` },
                { label: 'Proposal', text: `Hi ${recipientName},\n\nThank you for your interest. Please find the details as discussed.\n\nI'm happy to clarify anything or arrange a meeting.\n\nBest regards` },
              ].map(t => (
                <button key={t.label} onClick={() => { setMessage(t.text); }} style={{ padding: '5px 10px', borderRadius: 6, border: `1px solid ${border}`, background: inputBg, color: muted, fontSize: 11, cursor: 'pointer' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 14, padding: '9px 13px', borderRadius: 8, background: '#ef444420', border: '1px solid #ef444440', fontSize: 12, color: '#ef4444', fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={13} /> {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: `1px solid ${border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'none', border: `1px solid ${border}`, borderRadius: 9, cursor: 'pointer', color: muted, fontSize: 13, fontWeight: 600 }}>
            Cancel
          </button>
          <button onClick={handleSend} disabled={sending || sent} style={{
            flex: 2, padding: '10px',
            background: sent ? '#22c55e' : `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
            border: 'none', borderRadius: 9, cursor: sending || sent ? 'default' : 'pointer',
            color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.3s',
          }}>
            {sent ? <><CheckCircle size={15} /> Sent!</> : sending ? 'Sending…' : <><Send size={14} /> Send {meta.label}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

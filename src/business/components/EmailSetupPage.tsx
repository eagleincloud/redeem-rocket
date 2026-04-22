import { useState, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { supabase } from '@/app/lib/supabase';
import { toast } from 'sonner';
import {
  Mail,
  Server,
  Globe,
  Send,
  Key,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Info,
  RefreshCw,
  Zap,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Provider = 'resend' | 'smtp' | 'ses';
type Tab = 'provider' | 'dns' | 'test';

interface DnsRecord {
  type: string;
  host: string;
  value: string;
  status: 'verified' | 'pending' | 'failed';
}

interface ProviderConfig {
  provider: Provider;
  // Resend
  resend_api_key: string;
  from_address: string;
  reply_to: string;
  // SMTP
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  // SES
  ses_region: string;
  ses_access_key: string;
  ses_secret_key: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PLACEHOLDER_DNS: DnsRecord[] = [
  { type: 'TXT', host: 'mail._domainkey', value: 'v=DKIM1; k=rsa; p=<your-public-key>', status: 'pending' },
  { type: 'MX', host: 'mail', value: '10 feedback-smtp.us-east-1.amazonses.com', status: 'pending' },
  { type: 'TXT', host: '_dmarc', value: 'v=DMARC1; p=none; rua=mailto:dmarc@yourbusiness.com', status: 'pending' },
  { type: 'CNAME', host: 'em123._domainkey', value: 'em123.yourbusiness.com.dkim.resend.com', status: 'pending' },
];

function statusBadge(status: DnsRecord['status'], isDark: boolean) {
  const map = {
    verified: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: <CheckCircle2 size={12} /> },
    pending:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <Clock size={12} /> },
    failed:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',   icon: <AlertCircle size={12} /> },
  };
  const s = map[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      color: s.color, background: s.bg,
    }}>
      {s.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function EmailSetupPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { isMobile } = useViewport();

  const [activeTab, setActiveTab] = useState<Tab>('provider');

  // Provider tab state
  const [config, setConfig] = useState<ProviderConfig>({
    provider: 'resend',
    resend_api_key: import.meta.env.VITE_RESEND_API_KEY ?? '',
    from_address: '',
    reply_to: '',
    smtp_host: '',
    smtp_port: '587',
    smtp_username: '',
    smtp_password: '',
    ses_region: 'us-east-1',
    ses_access_key: '',
    ses_secret_key: '',
  });
  const [savingProvider, setSavingProvider] = useState(false);

  // DNS tab state
  const [sendingDomain, setSendingDomain] = useState('');
  const [verifyingDomain, setVerifyingDomain] = useState(false);
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>([]);

  // Test tab state
  const [toEmail, setToEmail]       = useState('');
  const [subject, setSubject]       = useState('Test email from your business app');
  const [body, setBody]             = useState('Hello! This is a test email sent from your Email Setup configuration.');
  const [sendingTest, setSendingTest] = useState(false);

  // Load existing provider config on mount
  useEffect(() => {
    if (!bizUser?.businessId) return;
    (async () => {
      const { data, error } = await supabase
        .from('email_provider_configs')
        .select('*')
        .eq('business_id', bizUser.businessId)
        .maybeSingle();
      if (error) return;
      if (data) {
        setConfig(prev => ({
          ...prev,
          provider: data.provider ?? 'resend',
          resend_api_key: data.resend_api_key ?? prev.resend_api_key,
          from_address: data.from_address ?? '',
          reply_to: data.reply_to ?? '',
          smtp_host: data.smtp_host ?? '',
          smtp_port: data.smtp_port ?? '587',
          smtp_username: data.smtp_username ?? '',
          smtp_password: data.smtp_password ?? '',
          ses_region: data.ses_region ?? 'us-east-1',
          ses_access_key: data.ses_access_key ?? '',
          ses_secret_key: data.ses_secret_key ?? '',
        }));
        if (data.sending_domain) setSendingDomain(data.sending_domain);
        if (data.dns_records) setDnsRecords(data.dns_records);
      }
    })();
  }, [bizUser?.businessId]);

  // ── Colors ──────────────────────────────────────────────────────────────────
  const bg        = isDark ? '#0b1220' : '#f8fafc';
  const card      = isDark ? '#111827' : '#ffffff';
  const border    = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const text      = isDark ? '#f1f5f9' : '#0f172a';
  const muted     = isDark ? '#6b7280' : '#94a3b8';
  const accent    = '#f97316';
  const primary   = '#6366f1';
  const inputBg   = isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9';
  const inputBorder = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.12)';

  const cardStyle: React.CSSProperties = {
    background: isDark
      ? 'radial-gradient(ellipse at top left, rgba(99,102,241,0.06) 0%, #111827 60%)'
      : card,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: isMobile ? 20 : 28,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    borderRadius: 10,
    padding: '10px 14px',
    color: text,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  };

  const fieldGroup = (label: string, input: React.ReactNode) => (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}</label>
      {input}
    </div>
  );

  // ── Save provider config ────────────────────────────────────────────────────
  async function handleSaveProvider() {
    if (!bizUser?.businessId) { toast.error('No business account found'); return; }
    setSavingProvider(true);
    try {
      const payload = {
        business_id: bizUser.businessId,
        provider: config.provider,
        resend_api_key: config.resend_api_key,
        from_address: config.from_address,
        reply_to: config.reply_to,
        smtp_host: config.smtp_host,
        smtp_port: config.smtp_port,
        smtp_username: config.smtp_username,
        smtp_password: config.smtp_password,
        ses_region: config.ses_region,
        ses_access_key: config.ses_access_key,
        ses_secret_key: config.ses_secret_key,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase
        .from('email_provider_configs')
        .upsert(payload, { onConflict: 'business_id' });
      if (error) throw error;
      toast.success('Email provider settings saved');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to save settings');
    } finally {
      setSavingProvider(false);
    }
  }

  // ── Verify domain ───────────────────────────────────────────────────────────
  async function handleVerifyDomain() {
    if (!sendingDomain.trim()) { toast.error('Enter a sending domain first'); return; }
    if (!bizUser?.businessId) { toast.error('No business account found'); return; }
    setVerifyingDomain(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-email-domain', {
        body: { domain: sendingDomain, business_id: bizUser.businessId },
      });
      if (error) throw error;
      if (data?.dns_records) {
        setDnsRecords(data.dns_records);
        toast.success('Domain verification initiated — add DNS records below');
      } else {
        toast.info('Verification request sent. DNS records may take up to 48 hours to propagate.');
        setDnsRecords(PLACEHOLDER_DNS);
      }
    } catch (err: any) {
      toast.error(err.message ?? 'Domain verification failed');
      setDnsRecords(PLACEHOLDER_DNS);
    } finally {
      setVerifyingDomain(false);
    }
  }

  // ── Send test email ─────────────────────────────────────────────────────────
  async function handleSendTest() {
    if (!toEmail.trim()) { toast.error('Enter a recipient email address'); return; }
    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke('send-direct-message', {
        body: {
          channel: 'email',
          to_email: toEmail.trim(),
          subject: subject,
          body: body,
          htmlBody: body,
        },
      });
      if (error) throw error;
      toast.success(`Test email sent to ${toEmail}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  }

  // ── Tab bar ─────────────────────────────────────────────────────────────────
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'provider', label: 'Provider',      icon: <Server size={15} /> },
    { id: 'dns',      label: 'DNS / Domain',  icon: <Globe size={15} /> },
    { id: 'test',     label: 'Test Send',     icon: <Send size={15} /> },
  ];

  const tabBar = (
    <div style={{
      display: 'flex',
      gap: 4,
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      padding: 4,
      marginBottom: 28,
      flexWrap: isMobile ? 'wrap' : 'nowrap',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: isMobile ? '9px 10px' : '10px 18px',
            borderRadius: 9,
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: activeTab === t.id ? 700 : 500,
            color: activeTab === t.id ? '#fff' : muted,
            background: activeTab === t.id
              ? `linear-gradient(135deg, ${primary}, #818cf8)`
              : 'transparent',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
          }}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );

  // ── Provider cards ───────────────────────────────────────────────────────────
  const providers: { id: Provider; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'resend',
      name: 'Resend',
      desc: 'Default · Built-in integration',
      icon: <Zap size={18} color={accent} />,
    },
    {
      id: 'smtp',
      name: 'Custom SMTP',
      desc: 'Gmail, Mailgun, Postmark…',
      icon: <Server size={18} color={primary} />,
    },
    {
      id: 'ses',
      name: 'Amazon SES',
      desc: 'High-volume AWS delivery',
      icon: <Mail size={18} color='#ec4899' />,
    },
  ];

  const providerTab = (
    <div>
      {/* Provider selector */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 13, color: muted, marginBottom: 14 }}>Choose your outbound email provider</p>
        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 12 }}>
          {providers.map(p => {
            const active = config.provider === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setConfig(c => ({ ...c, provider: p.id }))}
                style={{
                  flex: 1,
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px',
                  background: active
                    ? isDark
                      ? 'radial-gradient(ellipse at top left, rgba(99,102,241,0.18) 0%, rgba(17,24,39,0.9) 100%)'
                      : 'rgba(99,102,241,0.08)'
                    : inputBg,
                  border: `1.5px solid ${active ? primary : inputBorder}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  boxShadow: active ? `0 0 0 3px rgba(99,102,241,0.15)` : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 2 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: muted }}>{p.desc}</div>
                </div>
                {active && (
                  <CheckCircle2 size={16} color={primary} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider-specific fields */}
      <div style={cardStyle}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 20 }}>
          {config.provider === 'resend' && 'Resend Configuration'}
          {config.provider === 'smtp'   && 'SMTP Configuration'}
          {config.provider === 'ses'    && 'Amazon SES Configuration'}
        </h3>

        {config.provider === 'resend' && (
          <>
            {fieldGroup('API Key', (
              <div style={{ position: 'relative' }}>
                <Key size={14} color={muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={config.resend_api_key}
                  onChange={e => setConfig(c => ({ ...c, resend_api_key: e.target.value }))}
                  style={{ ...inputStyle, paddingLeft: 34 }}
                />
              </div>
            ))}
            {fieldGroup('From Address', (
              <input
                type="email"
                placeholder="hello@yourbusiness.com"
                value={config.from_address}
                onChange={e => setConfig(c => ({ ...c, from_address: e.target.value }))}
                style={inputStyle}
              />
            ))}
            {fieldGroup('Reply-To Address', (
              <input
                type="email"
                placeholder="support@yourbusiness.com"
                value={config.reply_to}
                onChange={e => setConfig(c => ({ ...c, reply_to: e.target.value }))}
                style={inputStyle}
              />
            ))}
          </>
        )}

        {config.provider === 'smtp' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr', gap: 16, marginBottom: 18 }}>
              <div>
                <label style={labelStyle}>SMTP Host</label>
                <input
                  type="text"
                  placeholder="smtp.example.com"
                  value={config.smtp_host}
                  onChange={e => setConfig(c => ({ ...c, smtp_host: e.target.value }))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Port</label>
                <input
                  type="number"
                  placeholder="587"
                  value={config.smtp_port}
                  onChange={e => setConfig(c => ({ ...c, smtp_port: e.target.value }))}
                  style={inputStyle}
                />
              </div>
            </div>
            {fieldGroup('Username', (
              <input
                type="text"
                placeholder="your@email.com"
                value={config.smtp_username}
                onChange={e => setConfig(c => ({ ...c, smtp_username: e.target.value }))}
                style={inputStyle}
              />
            ))}
            {fieldGroup('Password', (
              <input
                type="password"
                placeholder="••••••••••••"
                value={config.smtp_password}
                onChange={e => setConfig(c => ({ ...c, smtp_password: e.target.value }))}
                style={inputStyle}
              />
            ))}
            {fieldGroup('From Address', (
              <input
                type="email"
                placeholder="hello@yourbusiness.com"
                value={config.from_address}
                onChange={e => setConfig(c => ({ ...c, from_address: e.target.value }))}
                style={inputStyle}
              />
            ))}
          </>
        )}

        {config.provider === 'ses' && (
          <>
            {fieldGroup('AWS Region', (
              <select
                value={config.ses_region}
                onChange={e => setConfig(c => ({ ...c, ses_region: e.target.value }))}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {['us-east-1','us-west-2','eu-west-1','ap-southeast-1','ap-northeast-1'].map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ))}
            {fieldGroup('Access Key ID', (
              <input
                type="text"
                placeholder="AKIAIOSFODNN7EXAMPLE"
                value={config.ses_access_key}
                onChange={e => setConfig(c => ({ ...c, ses_access_key: e.target.value }))}
                style={inputStyle}
              />
            ))}
            {fieldGroup('Secret Access Key', (
              <div style={{ position: 'relative' }}>
                <Key size={14} color={muted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                  value={config.ses_secret_key}
                  onChange={e => setConfig(c => ({ ...c, ses_secret_key: e.target.value }))}
                  style={{ ...inputStyle, paddingLeft: 34 }}
                />
              </div>
            ))}
            {fieldGroup('From Address', (
              <input
                type="email"
                placeholder="hello@yourbusiness.com"
                value={config.from_address}
                onChange={e => setConfig(c => ({ ...c, from_address: e.target.value }))}
                style={inputStyle}
              />
            ))}
          </>
        )}

        <button
          onClick={handleSaveProvider}
          disabled={savingProvider}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 24px',
            background: `linear-gradient(135deg, ${primary}, #818cf8)`,
            border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 14, fontWeight: 700,
            cursor: savingProvider ? 'not-allowed' : 'pointer',
            opacity: savingProvider ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {savingProvider ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={15} />}
          {savingProvider ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </div>
  );

  // ── DNS / Domain tab ─────────────────────────────────────────────────────────
  const dnsTab = (
    <div>
      {/* Info banner */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        padding: '14px 18px',
        background: isDark ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)',
        border: `1px solid rgba(249,115,22,0.25)`,
        borderRadius: 12,
        marginBottom: 24,
      }}>
        <Info size={16} color={accent} style={{ flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 13, color: isDark ? '#fdba74' : '#c2410c', lineHeight: 1.6, margin: 0 }}>
          <strong>Custom domain improves deliverability and brand trust.</strong>{' '}
          Emails sent from your own domain (e.g. <code style={{ fontSize: 12, opacity: 0.8 }}>mail.yourbusiness.com</code>) are far less likely to land in spam and reinforce your brand identity.
        </p>
      </div>

      {/* Domain input + verify */}
      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>Custom Sending Domain</h3>
        <p style={{ fontSize: 13, color: muted, marginBottom: 20 }}>
          Enter the subdomain you want to send emails from.
        </p>
        <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            type="text"
            placeholder="mail.yourbusiness.com"
            value={sendingDomain}
            onChange={e => setSendingDomain(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button
            onClick={handleVerifyDomain}
            disabled={verifyingDomain}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 20px',
              background: `linear-gradient(135deg, ${accent}, #fb923c)`,
              border: 'none', borderRadius: 10,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: verifyingDomain ? 'not-allowed' : 'pointer',
              opacity: verifyingDomain ? 0.7 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {verifyingDomain
              ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</>
              : <><Globe size={14} /> Verify Domain</>}
          </button>
        </div>
      </div>

      {/* DNS records table */}
      {(dnsRecords.length > 0 || true) && (
        <div style={cardStyle}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>Required DNS Records</h3>
          <p style={{ fontSize: 13, color: muted, marginBottom: 20 }}>
            Add these records to your DNS provider. Verification may take up to 48 hours.
          </p>

          {isMobile ? (
            // Card layout for mobile
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(dnsRecords.length > 0 ? dnsRecords : PLACEHOLDER_DNS).map((rec, i) => (
                <div key={i} style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${border}`,
                  borderRadius: 10, padding: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px',
                      borderRadius: 6, background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                      color: primary,
                    }}>{rec.type}</span>
                    {statusBadge(rec.status, isDark)}
                  </div>
                  <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>Host</div>
                  <div style={{ fontSize: 13, color: text, fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 8 }}>{rec.host}</div>
                  <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>Value</div>
                  <div style={{ fontSize: 12, color: text, fontFamily: 'monospace', wordBreak: 'break-all', opacity: 0.8 }}>{rec.value}</div>
                </div>
              ))}
            </div>
          ) : (
            // Table for desktop
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {['Type', 'Host', 'Value', 'Status'].map(h => (
                      <th key={h} style={{
                        textAlign: 'left', padding: '8px 12px',
                        fontSize: 11, fontWeight: 700, color: muted,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(dnsRecords.length > 0 ? dnsRecords : PLACEHOLDER_DNS).map((rec, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: `1px solid ${border}`,
                        background: i % 2 === 0 ? 'transparent' : (isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.012)'),
                      }}
                    >
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px',
                          borderRadius: 6, background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)',
                          color: primary,
                        }}>{rec.type}</span>
                      </td>
                      <td style={{ padding: '12px 12px', fontFamily: 'monospace', color: text }}>{rec.host}</td>
                      <td style={{
                        padding: '12px 12px', fontFamily: 'monospace',
                        color: muted, maxWidth: 300, overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        <span title={rec.value}>{rec.value}</span>
                      </td>
                      <td style={{ padding: '12px 12px' }}>{statusBadge(rec.status, isDark)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dnsRecords.length === 0 && (
                <p style={{ fontSize: 12, color: muted, textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>
                  Example records shown — click "Verify Domain" to generate real records for your domain.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // ── Test Send tab ────────────────────────────────────────────────────────────
  const testTab = (
    <div style={cardStyle}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 6 }}>Send a Test Email</h3>
      <p style={{ fontSize: 13, color: muted, marginBottom: 24 }}>
        Verify your provider is configured correctly by sending a test message.
      </p>

      {fieldGroup('To Email', (
        <input
          type="email"
          placeholder="you@example.com"
          value={toEmail}
          onChange={e => setToEmail(e.target.value)}
          style={inputStyle}
        />
      ))}
      {fieldGroup('Subject', (
        <input
          type="text"
          placeholder="Test email subject"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          style={inputStyle}
        />
      ))}
      {fieldGroup('Body', (
        <textarea
          placeholder="Write your test message here…"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={6}
          style={{
            ...inputStyle,
            resize: 'vertical',
            minHeight: 120,
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
      ))}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <button
          onClick={handleSendTest}
          disabled={sendingTest}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 28px',
            background: sendingTest
              ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
              : `linear-gradient(135deg, ${primary}, #818cf8)`,
            border: 'none', borderRadius: 10,
            color: sendingTest ? muted : '#fff',
            fontSize: 14, fontWeight: 700,
            cursor: sendingTest ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {sendingTest
            ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Sending…</>
            : <><Send size={15} /> Send Test Email</>}
        </button>
        <span style={{ fontSize: 12, color: muted }}>
          Uses your saved provider configuration
        </span>
      </div>

      {/* Tips */}
      <div style={{
        marginTop: 28, padding: '16px 18px',
        background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.05)',
        border: `1px solid rgba(99,102,241,0.18)`,
        borderRadius: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Info size={14} color={primary} />
          <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Tips for testing</span>
        </div>
        {[
          'Check your spam folder if the email doesn\'t arrive within 2 minutes.',
          'Ensure your "From Address" is verified with your provider.',
          'Use a custom sending domain to improve inbox delivery rates.',
        ].map((tip, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 8 : 0 }}>
            <ChevronRight size={13} color={primary} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 13, color: muted, lineHeight: 1.5 }}>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: bg, minHeight: '100vh', padding: isMobile ? '20px 16px' : '32px 32px' }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: ${muted}; opacity: 0.7; }
        input:focus, textarea:focus, select:focus {
          border-color: ${primary} !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        select option { background: ${card}; color: ${text}; }
      `}</style>

      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: `linear-gradient(135deg, ${primary}22, ${accent}22)`,
            border: `1px solid ${border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Mail size={20} color={primary} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: text, margin: 0 }}>
              Email Setup
            </h1>
            <p style={{ fontSize: 13, color: muted, margin: 0, marginTop: 2 }}>
              Configure outbound email, verify your domain, and send test messages
            </p>
          </div>
        </div>
      </div>

      {tabBar}

      <div style={{ maxWidth: 860 }}>
        {activeTab === 'provider' && providerTab}
        {activeTab === 'dns'      && dnsTab}
        {activeTab === 'test'     && testTab}
      </div>
    </div>
  );
}

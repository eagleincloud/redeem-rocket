import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  Plus, Mail, MessageSquare, Phone, Play, Pause, Trash2,
  BarChart2, Settings, Send, Clock, CheckCircle, XCircle,
  AlertCircle, ChevronRight, Users, RefreshCw, Loader,
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useRBAC } from '../context/RBACContext';
import {
  fetchOutreachCampaigns, updateOutreachCampaign, deleteOutreachCampaign,
  fetchSenderIdentities,
  type OutreachCampaign, type SenderIdentity, type OutreachStatus,
} from '@/app/api/supabase-data';
import { sendBulkOutreach } from '@/app/lib/resendService';
import { CampaignWizardModal } from './CampaignWizardModal';
import { SenderIdentityModal } from './SenderIdentityModal';
import { MarketingAutomationPanel } from './MarketingAutomationPanel';
import { HintTooltip } from './HintTooltip';
import { SendSingleEmailModal } from './SendSingleEmailModal';
import { CampaignProgressTracker } from './CampaignProgressTracker';
import { FeatureGuideOverlay, useFeatureGuide } from './FeatureGuideOverlay';
import { featureGuides } from '@/business/utils/helpContent';

// ── Constants ─────────────────────────────────────────────────────────────────

const KANBAN_COLUMNS: { key: OutreachStatus; label: string; color: string; icon: React.ReactNode }[] = [
  { key: 'draft',       label: 'Draft',       color: '#64748b', icon: <Mail size={13} /> },
  { key: 'scheduled',   label: 'Scheduled',   color: '#3b82f6', icon: <Clock size={13} /> },
  { key: 'warming_up',  label: 'Warming Up',  color: '#f59e0b', icon: <RefreshCw size={13} /> },
  { key: 'running',     label: 'Running',     color: '#f97316', icon: <Play size={13} /> },
  { key: 'paused',      label: 'Paused',      color: '#a855f7', icon: <Pause size={13} /> },
  { key: 'completed',   label: 'Completed',   color: '#22c55e', icon: <CheckCircle size={13} /> },
  { key: 'failed',      label: 'Failed',      color: '#ef4444', icon: <XCircle size={13} /> },
];

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email:     <Mail size={12} />,
  whatsapp:  <MessageSquare size={12} />,
  sms:       <Phone size={12} />,
  multi:     <Send size={12} />,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: '#3b82f6', whatsapp: '#22c55e', sms: '#f59e0b', multi: '#a855f7',
};

// Mock data for when DB isn't set up yet

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function progressPct(c: OutreachCampaign): number {
  if (!c.total_recipients) return 0;
  return Math.round((c.sent_count / c.total_recipients) * 100);
}

function openRate(c: OutreachCampaign): string {
  if (!c.delivered_count) return '—';
  return `${Math.round((c.opened_count / c.delivered_count) * 100)}%`;
}

function clickRate(c: OutreachCampaign): string {
  if (!c.opened_count) return '—';
  return `${Math.round((c.clicked_count / c.opened_count) * 100)}%`;
}

function timeUntil(iso?: string): string {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Now';
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0)  return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Campaign Card ─────────────────────────────────────────────────────────────

function CampaignCard({
  campaign, border, card, text, muted, colColor,
  onPause, onResume, onDelete, onView, isSending = false,
}: {
  campaign: OutreachCampaign; border: string; card: string; text: string; muted: string; colColor: string;
  onPause:  () => void; onResume: () => void; onDelete: () => void; onView: () => void; isSending?: boolean;
}) {
  const pct      = progressPct(campaign);
  const chColor  = CHANNEL_COLORS[campaign.channel] ?? '#64748b';
  const isActive = campaign.status === 'running';
  const isDone   = campaign.status === 'completed' || campaign.status === 'failed';
  const campaign_with_sending = { ...campaign, sending: isSending };

  return (
    <div style={{
      background: card, borderRadius: 12,
      border: `1px solid ${border}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      padding: '14px', marginBottom: 10,
      cursor: 'pointer', transition: 'border-color 0.15s',
    }}
      onClick={onView}
      onMouseEnter={e => (e.currentTarget.style.borderColor = colColor)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = border)}
    >
      {/* Channel badge + name */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <div style={{
          background: `${chColor}20`, color: chColor,
          border: `1px solid ${chColor}40`, borderRadius: 6,
          padding: '3px 7px', fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          textTransform: 'uppercase',
        }}>
          {CHANNEL_ICONS[campaign.channel]}
          {campaign.channel}
        </div>
        {campaign.warmup_enabled && (
          <div style={{
            background: '#f59e0b20', color: '#f59e0b',
            border: '1px solid #f59e0b40', borderRadius: 5,
            padding: '2px 6px', fontSize: 9, fontWeight: 700,
          }}>
            🔥 WARMUP
          </div>
        )}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 4, lineHeight: 1.3 }}>
        {campaign.name}
      </div>

      {/* Recipient count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
        <Users size={11} color={muted} />
        <span style={{ fontSize: 11, color: muted }}>
          {formatNumber(campaign.total_recipients)} recipients
        </span>
        {campaign.status === 'scheduled' && campaign.scheduled_at && (
          <span style={{
            marginLeft: 'auto', fontSize: 10, color: '#3b82f6',
            background: '#3b82f615', border: '1px solid #3b82f630',
            borderRadius: 4, padding: '1px 6px',
          }}>
            Starts in {timeUntil(campaign.scheduled_at)}
          </span>
        )}
      </div>

      {/* Progress bar (running or done) */}
      {(isActive || isDone) && (
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 10, color: muted }}>
              {formatNumber(campaign.sent_count)} / {formatNumber(campaign.total_recipients)} sent
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: colColor }}>{pct}%</span>
          </div>
          <div style={{ height: 5, background: `${border}88`, borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`, borderRadius: 3,
              background: `linear-gradient(90deg, ${colColor}, ${colColor}bb)`,
              transition: 'width 0.4s',
            }} />
          </div>
        </div>
      )}

      {/* Stats row for completed email campaigns */}
      {isDone && campaign.channel === 'email' && (
        <div style={{
          display: 'flex', gap: 10, marginBottom: 8,
          background: `${border}33`, borderRadius: 6, padding: '6px 8px',
        }}>
          {[
            { label: 'Open', value: openRate(campaign) },
            { label: 'Click', value: clickRate(campaign) },
            { label: 'Bounce', value: campaign.bounced_count ? `${campaign.bounced_count}` : '0' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{s.value}</div>
              <div style={{ fontSize: 9, color: muted, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Running: next batch info */}
      {isActive && (
        <div style={{ fontSize: 10, color: '#f97316', marginBottom: 8 }}>
          ⚡ Sending {campaign.batch_size}/batch · every {campaign.batch_interval_minutes}min
        </div>
      )}

      {/* Action buttons */}
      <div style={{
        display: 'flex', gap: 6, marginTop: 4,
        borderTop: `1px solid ${border}`, paddingTop: 10,
      }}
        onClick={e => e.stopPropagation()}
      >
        {isActive && (
          <button onClick={onPause} style={{
            flex: 1, padding: '5px 0', background: '#a855f720', color: '#a855f7',
            border: '1px solid #a855f740', borderRadius: 6, cursor: 'pointer',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 4,
          }}>
            <Pause size={11} /> Pause
          </button>
        )}
        {campaign.status === 'paused' && (
          <button onClick={onResume} style={{
            flex: 1, padding: '5px 0', background: '#f9731620', color: '#f97316',
            border: '1px solid #f9731640', borderRadius: 6, cursor: 'pointer',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 4,
          }}>
            <Play size={11} /> Resume
          </button>
        )}
        {campaign.status === 'draft' && (
          <button onClick={onResume} disabled={isSending} style={{
            flex: 1, padding: '5px 0', background: '#22c55e20', color: '#22c55e',
            border: '1px solid #22c55e40', borderRadius: 6, cursor: isSending ? 'not-allowed' : 'pointer',
            fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 4, opacity: isSending ? 0.6 : 1,
          }}>
            {isSending ? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={11} />}
            {isSending ? 'Sending...' : 'Launch'}
          </button>
        )}
        <button onClick={onView} style={{
          flex: 1, padding: '5px 0', background: 'transparent', color: muted,
          border: `1px solid ${border}`, borderRadius: 6, cursor: 'pointer',
          fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <BarChart2 size={11} /> Stats
        </button>
        {!isActive && (
          <button onClick={onDelete} style={{
            padding: '5px 10px', background: '#ef444415', color: '#ef4444',
            border: '1px solid #ef444430', borderRadius: 6, cursor: 'pointer',
            fontSize: 11, display: 'flex', alignItems: 'center',
          }}>
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Campaign Detail Modal ─────────────────────────────────────────────────────

function CampaignDetailModal({
  campaign, border, card, text, muted, onClose,
}: {
  campaign: OutreachCampaign; border: string; card: string; text: string; muted: string;
  onClose: () => void;
}) {
  const delivered = campaign.delivered_count || campaign.sent_count;
  const stats = [
    { label: 'Total Recipients', value: campaign.total_recipients.toLocaleString(), color: '#3b82f6' },
    { label: 'Sent',             value: campaign.sent_count.toLocaleString(),        color: '#f97316' },
    { label: 'Delivered',        value: delivered.toLocaleString(),                  color: '#22c55e' },
    { label: 'Opened',           value: `${campaign.opened_count.toLocaleString()} (${openRate(campaign)})`, color: '#a855f7' },
    { label: 'Clicked',          value: `${campaign.clicked_count.toLocaleString()} (${clickRate(campaign)})`, color: '#06b6d4' },
    { label: 'Bounced',          value: campaign.bounced_count.toLocaleString(),     color: '#f59e0b' },
    { label: 'Unsubscribed',     value: campaign.unsubscribed_count.toLocaleString(), color: '#ef4444' },
    { label: 'Failed',           value: campaign.failed_count.toLocaleString(),      color: '#64748b' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: '100%', maxWidth: 520, margin: 16,
        background: card, borderRadius: 16, border: `1px solid ${border}`,
        boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
        maxHeight: '85vh', overflowY: 'auto',
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text }}>{campaign.name}</h3>
            <span style={{ fontSize: 11, color: muted }}>Campaign Analytics</span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', color: muted, padding: 4,
          }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: muted }}>Overall Progress</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{progressPct(campaign)}%</span>
            </div>
            <div style={{ height: 8, background: `${border}88`, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${progressPct(campaign)}%`, borderRadius: 4,
                background: 'linear-gradient(90deg, #f97316, #22c55e)',
              }} />
            </div>
          </div>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {stats.map(s => (
              <div key={s.label} style={{
                background: `${s.color}12`, border: `1px solid ${s.color}30`,
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 10, color: muted, marginTop: 2, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Campaign config */}
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: `${border}33`, borderRadius: 10,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: text, marginBottom: 8 }}>Configuration</div>
            {[
              { k: 'Channel', v: campaign.channel.toUpperCase() },
              { k: 'Batch Size', v: `${campaign.batch_size} per batch` },
              { k: 'Interval', v: `${campaign.batch_interval_minutes} min between batches` },
              { k: 'Send Window', v: `${campaign.send_window_start} – ${campaign.send_window_end}` },
              { k: 'Timezone', v: campaign.timezone },
              { k: 'Warmup', v: campaign.warmup_enabled ? 'Enabled' : 'Disabled' },
            ].map(row => (
              <div key={row.k} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 11, color: muted, marginBottom: 4,
              }}>
                <span>{row.k}</span>
                <span style={{ color: text, fontWeight: 600 }}>{row.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function OutreachPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { canRead, canWrite } = useRBAC();
  const location = useLocation();

  // Mark Getting Started: 'sender' step done on first visit
  useEffect(() => {
    try {
      const done: string[] = JSON.parse(localStorage.getItem('rr_onboarding_done') || '[]');
      if (!done.includes('sender')) localStorage.setItem('rr_onboarding_done', JSON.stringify([...done, 'sender']));
    } catch { /* ignore */ }
  }, []);

  const [campaigns,           setCampaigns]           = useState<any>([]);
  const [usingMock,           setUsingMock]           = useState(true);
  const [senders,             setSenders]             = useState<SenderIdentity[]>([]);
  const [loading,             setLoading]             = useState(false);
  const [sendingId,           setSendingId]           = useState<string | null>(null);
  const [sendError,           setSendError]           = useState<string | null>(null);
  const [tab,                 setTab]                 = useState<'campaigns' | 'settings' | 'automation'>('campaigns');
  const [showWizard,          setShowWizard]          = useState(false);
  const [showSender,          setShowSender]          = useState(false);
  const [showSingleEmail,     setShowSingleEmail]     = useState(false);
  const [viewCampaign,        setViewCampaign]        = useState<OutreachCampaign | null>(null);
  const [campaignPrefill,     setCampaignPrefill]     = useState<{ phones: string; names: string; count: number } | null>(null);

  // Feature guide
  const { shouldShow: showGuide, resetGuide } = useFeatureGuide('outreach_page');

  const bg     = isDark ? '#080d20' : '#faf7f3';
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';
  const accent = '#f97316';

  useEffect(() => {
    if (!bizUser?.businessId) return;
    setLoading(true);
    Promise.all([
      fetchOutreachCampaigns(bizUser.businessId),
      fetchSenderIdentities(bizUser.businessId),
    ]).then(([camps, sids]) => {
      if (camps !== null) {
        // DB is reachable — use real data (even if empty)
        setCampaigns(camps);
        setUsingMock(false);
      }
      // camps === null means DB unavailable → keep mock campaigns
      setSenders(sids);
    }).finally(() => setLoading(false));
  }, [bizUser?.businessId]);

  // Handle campaign prefill from Leads page bulk action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const b64 = params.get('campaign');
    if (!b64) return;
    try {
      const prefill = new URLSearchParams(atob(b64));
      if (prefill.get('from_leads') === '1') {
        setCampaignPrefill({
          phones: prefill.get('phones') ?? '',
          names:  prefill.get('names') ?? '',
          count:  parseInt(prefill.get('count') ?? '0'),
        });
        setShowWizard(true);
      }
    } catch { /* ignore malformed */ }
  }, [location.search]);

  async function handlePause(id: string) {
    await updateOutreachCampaign(id, { status: 'paused' });
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: 'paused' } : c));
  }

  async function handleResume(id: string) {
    const camp = campaigns.find(c => c.id === id);
    if (!camp) return;

    setSendingId(id);
    setSendError(null);

    try {
      const next: OutreachStatus = camp.status === 'draft' ? 'running' : 'running';

      // For email campaigns, send via Resend
      if (camp.channel === 'email' && bizUser?.businessId) {
        // Parse recipients from campaign data
        const recipients = (camp.recipient_list || []).map((r: any) => ({
          email: r.email || '',
          name: r.name || '',
        })).filter((r: any) => r.email);

        if (recipients.length > 0) {
          console.log(`[OutreachPage] Sending bulk outreach: ${recipients.length} recipients`);

          const result = await sendBulkOutreach({
            recipients,
            subject: camp.subject || 'Check this out',
            content: camp.content || 'Hello from Redeem Rocket!',
            htmlContent: camp.html_content,
            template: 'announcement',
            campaignName: camp.name,
            businessId: bizUser.businessId,
            campaignId: id,
            batchSize: camp.batch_size || 50,
            delayMs: 500,
          });

          if (!result.ok) {
            setSendError(`Send failed: ${result.error || 'Unknown error'}`);
            console.error('[OutreachPage] Send failed:', result.error);
            setSendingId(null);
            return;
          }

          console.log(`[OutreachPage] Email send successful: ${result.successCount} sent, ${result.failedCount} failed`);
        }
      }

      // Update campaign status
      await updateOutreachCampaign(id, {
        status: next,
        started_at: new Date().toISOString(),
      });

      setCampaigns(prev =>
        prev.map(c =>
          c.id === id
            ? {
                ...c,
                status: next,
                started_at: new Date().toISOString(),
              }
            : c,
        ),
      );

      // Clear success after 3 seconds
      setTimeout(() => setSendingId(null), 3000);
    } catch (err) {
      console.error('[OutreachPage] handleResume error:', err);
      setSendError(String(err));
      setSendingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    await deleteOutreachCampaign(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  }

  // Summary stats
  const totalSent       = campaigns.reduce((s, c) => s + c.sent_count, 0);
  const totalRecipients = campaigns.reduce((s, c) => s + c.total_recipients, 0);
  const running         = campaigns.filter(c => c.status === 'running').length;
  const avgOpen         = campaigns.filter(c => c.opened_count > 0)
    .reduce((s, c) => s + c.opened_count / Math.max(c.delivered_count, 1) * 100, 0)
    / Math.max(campaigns.filter(c => c.opened_count > 0).length, 1);

  // RBAC no-access guard
  if (!canRead('campaigns')) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: 40 }}>🔒</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: isDark ? '#e2e8f0' : '#18100a' }}>No access to Campaigns</div>
        <div style={{ fontSize: 13, color: isDark ? '#64748b' : '#9a7860' }}>Contact your business owner to request access.</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', paddingBottom: 40 }}>

      {/* Demo banner */}
      {usingMock && (
        <div style={{
          background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '8px 14px', marginBottom: 14, fontSize: 12, color: '#92400e',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>⚠️</span>
          <span>
            <strong>Demo data</strong> — Could not reach database. Showing sample campaigns for preview.
          </span>
        </div>
      )}

      {/* ── Summary KPIs ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12, marginBottom: 20,
      }}>
        {[
          { label: 'Total Sent',    value: formatNumber(totalSent),          icon: <Send size={16} />,      color: '#f97316' },
          { label: 'Total Reached', value: formatNumber(totalRecipients),    icon: <Users size={16} />,     color: '#3b82f6' },
          { label: 'Live Campaigns', value: String(running),                 icon: <Play size={16} />,      color: '#22c55e' },
          { label: 'Avg Open Rate', value: `${Math.round(avgOpen)}%`,        icon: <BarChart2 size={16} />, color: '#a855f7' },
        ].map(s => (
          <div key={s.label} style={{
            background: card, borderRadius: 12, padding: '14px 16px',
            border: `1px solid ${border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.label}
              </span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Actions ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 16, flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', gap: 4, background: `${border}55`, borderRadius: 10, padding: 3 }}>
          {(['campaigns', 'automation', 'settings'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', borderRadius: 7, border: 'none',
              background: tab === t ? card : 'transparent',
              color: tab === t ? accent : muted,
              fontWeight: tab === t ? 700 : 400, fontSize: 12,
              cursor: 'pointer',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              textTransform: 'capitalize',
            }}>
              {t === 'campaigns' ? '📣 Campaigns' : t === 'automation' ? '🤖 Automation' : '⚙️ Sender Settings'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'settings' && (
            <button onClick={() => setShowSender(true)} style={{
              padding: '8px 16px', background: `${border}66`,
              border: `1px solid ${border}`, borderRadius: 8,
              color: text, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Plus size={14} /> Add Sender
            </button>
          )}
          {tab === 'campaigns' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowSingleEmail(true)} style={{
                  padding: '8px 14px',
                  background: `${border}66`,
                  border: `1px solid ${border}`,
                  borderRadius: 8, color: text,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <Mail size={13} /> Send Email
                </button>
              </div>
              <button onClick={() => setShowWizard(true)} style={{
                padding: '8px 18px',
                background: `linear-gradient(135deg, ${accent}, #fb923c)`,
                border: 'none', borderRadius: 8, color: '#fff',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 2px 12px rgba(249,115,22,0.35)',
              }}>
                <Plus size={14} /> New Campaign
              </button>
              <HintTooltip
                title="Create a Campaign"
                hint="A campaign lets you send bulk emails, WhatsApp messages, or SMS to your customer list. Set up a sender identity first, then pick your audience and message."
                position="bottom"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Empty state for campaigns tab when no campaigns exist ── */}
      {tab === 'campaigns' && !usingMock && campaigns.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 520, margin: '0 auto' }}>
          {/* Icon */}
          <div style={{ fontSize: 48, marginBottom: 16 }}>📣</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: text, marginBottom: 8 }}>
            Launch Your First Campaign
          </div>
          <div style={{ fontSize: 14, color: muted, marginBottom: 32, lineHeight: 1.6 }}>
            Reach your customers instantly via Email, WhatsApp, or SMS. Create a campaign in under 2 minutes.
          </div>

          {/* Steps */}
          {[
            { n: '1', icon: '🪪', title: 'Add a Sender Identity', desc: 'Go to Settings tab → add your email address or WhatsApp number.', action: null },
            { n: '2', icon: '✍️', title: 'Create a Campaign', desc: 'Pick your channel, write your message, and choose your audience.', action: () => setShowWizard(true), actionLabel: '+ New Campaign' },
            { n: '3', icon: '🚀', title: 'Schedule & Send', desc: 'Send immediately or schedule for the perfect time. Track opens and replies live.', action: null },
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', textAlign: 'left', marginBottom: 20, padding: '14px 16px', borderRadius: 12, background: isDark ? '#0a1020' : '#fdf6f0', border: `1px solid ${border}` }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {step.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 4 }}>
                  {step.icon} {step.title}
                </div>
                <div style={{ fontSize: 12, color: muted, lineHeight: 1.5 }}>{step.desc}</div>
                {step.action && (
                  <button onClick={step.action} style={{ marginTop: 10, padding: '7px 16px', borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #fb923c)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {step.actionLabel}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Primary CTA */}
          <button onClick={() => setShowWizard(true)} style={{ marginTop: 8, padding: '12px 32px', background: 'linear-gradient(135deg, #f97316, #fb923c)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,115,22,0.35)' }}>
            + Create My First Campaign
          </button>
        </div>
      )}

      {/* ── Campaigns Kanban ── */}
      {tab === 'campaigns' && (usingMock || campaigns.length > 0) && (
        <div style={{ overflowX: 'auto', paddingBottom: 12 }}>
          <div style={{ display: 'flex', gap: 12, minWidth: 'max-content' }}>
            {KANBAN_COLUMNS.map(col => {
              const colCamps = campaigns.filter(c => c.status === col.key);
              return (
                <div key={col.key} style={{
                  width: 260, flexShrink: 0,
                  display: 'flex', flexDirection: 'column',
                }}>
                  {/* Column header */}
                  <div style={{
                    padding: '10px 12px', borderRadius: '10px 10px 0 0',
                    background: `${col.color}18`,
                    border: `1px solid ${col.color}33`,
                    borderBottom: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: col.color }}>{col.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>
                        {col.label}
                      </span>
                    </div>
                    <span style={{
                      background: `${col.color}25`, color: col.color,
                      borderRadius: '50%', width: 20, height: 20,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700,
                    }}>
                      {colCamps.length}
                    </span>
                  </div>

                  {/* Column body */}
                  <div style={{
                    flex: 1, minHeight: 120, padding: '10px 8px',
                    background: `${col.color}08`,
                    border: `1px solid ${col.color}22`,
                    borderTop: 'none', borderRadius: '0 0 10px 10px',
                  }}>
                    {colCamps.length === 0 && (
                      <div style={{
                        textAlign: 'center', fontSize: 11, color: muted,
                        paddingTop: 24, opacity: 0.5,
                      }}>
                        No campaigns
                      </div>
                    )}
                    {colCamps.map(c => (
                      <CampaignCard
                        key={c.id}
                        campaign={c}
                        border={border}
                        card={card}
                        text={text}
                        muted={muted}
                        colColor={col.color}
                        isSending={sendingId === c.id}
                        onPause={() => handlePause(c.id)}
                        onResume={() => handleResume(c.id)}
                        onDelete={() => handleDelete(c.id)}
                        onView={() => setViewCampaign(c)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Automation Tab ── */}
      {tab === 'automation' && (
        <MarketingAutomationPanel />
      )}

      {/* ── Sender Settings Tab ── */}
      {tab === 'settings' && (
        <div>
          {senders.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px',
              border: `2px dashed ${border}`, borderRadius: 12, color: muted,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 8 }}>
                No sender identities configured
              </div>
              <div style={{ fontSize: 12, marginBottom: 20 }}>
                Add an SMTP server, WhatsApp number, or SMS sender ID to start outreach campaigns.
              </div>
              <button onClick={() => setShowSender(true)} style={{
                padding: '10px 24px', background: accent, color: '#fff',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 13,
              }}>
                + Add Sender Identity
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {senders.map(s => (
                <div key={s.id} style={{
                  background: card, borderRadius: 12, padding: '14px 16px',
                  border: `1px solid ${border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      background: `${CHANNEL_COLORS[s.channel] ?? '#64748b'}20`,
                      color: CHANNEL_COLORS[s.channel] ?? '#64748b',
                      border: `1px solid ${CHANNEL_COLORS[s.channel] ?? '#64748b'}40`,
                      borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 700,
                    }}>
                      {s.channel.toUpperCase()}
                    </div>
                    {s.is_default && (
                      <span style={{ fontSize: 9, color: accent, fontWeight: 700 }}>DEFAULT</span>
                    )}
                    <div style={{
                      marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                      background: s.is_verified ? '#22c55e' : '#f59e0b',
                    }} />
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 4 }}>
                    {s.display_name}
                  </div>
                  {s.from_email && (
                    <div style={{ fontSize: 11, color: muted, marginBottom: 4 }}>{s.from_email}</div>
                  )}
                  {s.warmup_enabled && (
                    <div style={{
                      fontSize: 10, color: '#f59e0b', marginBottom: 4,
                      background: '#f59e0b15', borderRadius: 5, padding: '2px 8px', display: 'inline-block',
                    }}>
                      🔥 Warmup Day {s.warmup_day} · {s.warmup_daily_limit}/day limit
                    </div>
                  )}
                  <div style={{
                    display: 'flex', gap: 6, marginTop: 8,
                    fontSize: 10, color: muted,
                  }}>
                    <span>Rep: {s.reputation_score}</span>
                    <span>•</span>
                    <span>Bounce: {s.bounce_rate}%</span>
                    <span>•</span>
                    <span>Spam: {s.spam_rate}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showWizard && (
        <CampaignWizardModal
          onClose={() => { setShowWizard(false); setCampaignPrefill(null); }}
          onCreated={camp => {
            setCampaigns(prev => [camp, ...prev]);
            setUsingMock(false);
            setShowWizard(false);
            setCampaignPrefill(null);
          }}
          senders={senders}
          prefill={campaignPrefill}
        />
      )}
      {showSender && (
        <SenderIdentityModal
          onClose={() => setShowSender(false)}
          onSaved={identity => {
            setSenders(prev => {
              const idx = prev.findIndex(s => s.id === identity.id);
              return idx >= 0
                ? prev.map(s => s.id === identity.id ? identity : s)
                : [identity, ...prev];
            });
            setShowSender(false);
          }}
        />
      )}
      {viewCampaign && (
        <CampaignDetailModal
          campaign={viewCampaign}
          border={border} card={card} text={text} muted={muted}
          onClose={() => setViewCampaign(null)}
        />
      )}

      {/* Send Single Email Modal */}
      {showSingleEmail && bizUser?.businessId && (
        <SendSingleEmailModal
          businessId={bizUser.businessId}
          onClose={() => setShowSingleEmail(false)}
          onSuccess={(email) => {
            // Refresh campaigns list
            if (bizUser.businessId) {
              fetchOutreachCampaigns(bizUser.businessId).then(camps => {
                if (camps) setCampaigns(camps);
              });
            }
          }}
        />
      )}

      {/* Feature Guide Overlay */}
      {showGuide && tab === 'campaigns' && (
        <FeatureGuideOverlay
          steps={featureGuides.outreach}
          featureName="outreach_page"
          onComplete={() => {
            // Optional: track that guide was completed
          }}
        />
      )}
    </div>
  );
}

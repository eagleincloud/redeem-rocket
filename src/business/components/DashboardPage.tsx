import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useTheme } from '@/app/context/ThemeContext';
import { GettingStartedCard } from './GettingStartedCard';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { supabase } from '@/app/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, ShoppingBag, Tag, UserCheck, Plus, Wallet, ArrowUpRight, ArrowDownRight, AlertCircle, RefreshCw, X, CheckCircle, Pencil, Lock, Globe, Copy, ExternalLink } from 'lucide-react';
import bcrypt from 'bcryptjs';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: '#f59e0b22', color: '#f59e0b', label: 'Pending' },
  verified: { bg: '#3b82f622', color: '#3b82f6', label: 'Verified' },
  redeemed: { bg: '#22c55e22', color: '#22c55e', label: 'Redeemed' },
};

interface DashboardKPIs {
  totalRevenue: number;
  todayOrders: number;
  activeOffers: number;
  openLeads: number;
  overdueFollowUps: number;
  pipelineValue: number;
  wonThisMonth: number;
}

interface LeadStageCount {
  label: string;
  count: number;
  value: number;
  color: string;
}

interface RecentNotif {
  id: string | number;
  type: string;
  message: string;
  time: string;
  icon: string;
  path: string;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Profile Completeness Banner ───────────────────────────────────────────────

const BANNER_KEY = 'profile_banner_dismissed_v1';
const BANNER_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface ProfileField { label: string; filled: boolean; link: string; }

function ProfileCompletenessBanner({ bizUser, isDark, isMobile }: { bizUser: { name?: string | null; businessName?: string | null; phone?: string; address?: string; businessPhone?: string; mapLat?: number; mapLng?: number; businessCategory?: string } | null; isDark: boolean; isMobile: boolean }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const raw = localStorage.getItem(BANNER_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { ts: number };
      return Date.now() - parsed.ts < BANNER_TTL_MS;
    } catch { return false; }
  });

  if (!bizUser) return null;

  const fields: ProfileField[] = [
    { label: 'Business Name',  filled: Boolean(bizUser.businessName?.trim()),                          link: '/app/profile?highlight=incomplete&field=name' },
    { label: 'Phone Number',   filled: Boolean((bizUser.businessPhone || bizUser.phone)?.trim()),      link: '/app/profile?highlight=incomplete&field=phone' },
    { label: 'Category',       filled: Boolean(bizUser.businessCategory?.trim()),                      link: '/app/profile?highlight=incomplete&field=category' },
    { label: 'Location Pinned', filled: Boolean(bizUser.mapLat && bizUser.mapLng),                    link: '/app/profile?highlight=incomplete&field=location' },
  ];

  const filledCount = fields.filter(f => f.filled).length;
  const pct = Math.round((filledCount / fields.length) * 100);
  const missing = fields.filter(f => !f.filled);

  if (pct === 100) return null;
  if (dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(BANNER_KEY, JSON.stringify({ ts: Date.now() }));
    setDismissed(true);
  }

  const accent = '#f97316';
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';

  return (
    <div style={{ background: card, borderRadius: 16, border: `1.5px solid ${accent}55`, padding: isMobile ? 16 : 20, position: 'relative' }}>
      <button
        onClick={handleDismiss}
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: muted, display: 'flex', alignItems: 'center', padding: 4 }}
        title="Dismiss"
      >
        <X size={16} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CheckCircle size={20} color={accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 2 }}>
            Profile {pct}% Complete
          </div>
          <div style={{ fontSize: 12, color: muted }}>Complete your profile to get found by customers</div>
        </div>
        <Link
          to="/app/profile?highlight=incomplete"
          style={{ padding: '8px 16px', borderRadius: 8, background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0, display: 'none' }}
          className="profile-complete-btn"
        >
          Complete Profile
        </Link>
        {!isMobile && (
          <Link
            to="/app/profile?highlight=incomplete"
            style={{ padding: '8px 16px', borderRadius: 8, background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}
          >
            Complete Profile
          </Link>
        )}
      </div>

      <div style={{ height: 6, borderRadius: 6, background: isDark ? '#1c2a55' : '#f3f0ec', marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: `linear-gradient(90deg, ${accent}, #fb923c)`, transition: 'width 0.4s ease' }} />
      </div>

      {missing.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {missing.map(f => (
            <Link
              key={f.label}
              to={f.link}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: isDark ? '#1c2a55' : '#fdf6f0', border: `1px solid ${border}`, textDecoration: 'none', color: text, fontSize: 11, fontWeight: 600 }}
            >
              <Pencil size={10} color={accent} />
              {f.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── First-time Team Member Password Change Modal ──────────────────────────────

interface PasswordStrength { score: number; label: string; color: string; }

function getPasswordStrength(pw: string): PasswordStrength {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e'];
  return { score, label: labels[score - 1] ?? 'Weak', color: colors[score - 1] ?? '#ef4444' };
}

function FirstLoginPasswordModal({ isDark }: { isDark: boolean }) {
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(newPw);

  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    if (!newPw || newPw.length < 8) { setErr('Password must be at least 8 characters'); return; }
    if (newPw !== confirmPw) { setErr('Passwords do not match'); return; }

    setLoading(true);
    try {
      const memberId = localStorage.getItem('team_member_first_login_id');
      if (!memberId || !supabase) throw new Error('Session error');

      const hashed = await bcrypt.hash(newPw, 10);
      const { error } = await supabase
        .from('business_team_members')
        .update({ password: hashed, first_login: false })
        .eq('id', memberId);

      if (error) throw error;

      localStorage.removeItem('team_member_first_login');
      localStorage.removeItem('team_member_first_login_id');
      setSuccess(true);
    } catch (e) {
      setErr('Failed to update password. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: card, borderRadius: 20, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: text, marginBottom: 8 }}>Password Set!</div>
          <div style={{ fontSize: 13, color: muted }}>Your password has been updated successfully.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: card, borderRadius: 20, padding: 32, maxWidth: 440, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} color={accent} />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: text }}>Welcome! Please set your password</div>
            <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>You must set a password before continuing</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: muted, display: 'block', marginBottom: 6 }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Minimum 8 characters"
                style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: 10, border: `1.5px solid ${border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: muted }}>
                {showPw ? <X size={16} /> : <CheckCircle size={16} />}
              </button>
            </div>

            {newPw && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 4, borderRadius: 4, background: isDark ? '#1c2a55' : '#f3f0ec', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(strength.score / 4) * 100}%`, borderRadius: 4, background: strength.color, transition: 'all 0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: strength.color, marginTop: 4, fontWeight: 600 }}>{strength.label}</div>
              </div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: muted, display: 'block', marginBottom: 6 }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat your password"
              style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${confirmPw && confirmPw !== newPw ? '#ef4444' : border}`, background: inputBg, color: text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {err && <div style={{ fontSize: 12, color: '#ef4444', padding: '8px 12px', background: '#ef444411', borderRadius: 8 }}>{err}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{ padding: '12px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Business Website / QR Code Card ──────────────────────────────────────────

function BusinessWebsiteCard({ bizUser, isDark, isMobile }: { bizUser: { businessId?: string | null } | null; isDark: boolean; isMobile: boolean }) {
  if (!bizUser?.businessId) return null;

  const [showPreview, setShowPreview] = useState(false);

  const bizUrl = import.meta.env.PROD
    ? `${window.location.origin}/biz/${bizUser.businessId}`
    : `${window.location.origin}/business.html/biz/${bizUser.businessId}`;
  const card   = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';
  const inputBg = isDark ? '#162040' : '#fdf6f0';
  const accent  = '#f97316';

  function copyLink() {
    navigator.clipboard.writeText(bizUrl).then(() => {
      toast.success('Link copied! 📋');
    });
  }

  function openWebsite() {
    window.open(bizUrl, '_blank');
  }

  return (
    <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: isMobile ? 16 : 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Globe size={18} color={accent} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: text }}>Your Business Website</div>
          <div style={{ fontSize: 11, color: muted }}>Share this QR with customers to let them browse your business</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ padding: 12, borderRadius: 12, background: '#ffffff', border: `1px solid ${border}` }}>
            <QRCodeSVG value={bizUrl} size={160} fgColor="#0d0d18" bgColor="#ffffff" />
          </div>
          <div style={{ fontSize: 10, color: muted, textAlign: 'center' }}>Scan to open business page</div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: muted, marginBottom: 6 }}>Business URL</div>
            <div style={{ padding: '8px 12px', borderRadius: 8, background: inputBg, border: `1px solid ${border}`, fontSize: 12, color: text, wordBreak: 'break-all', lineHeight: 1.5 }}>
              {bizUrl}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={copyLink}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: `1px solid ${border}`, background: inputBg, color: text, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <Copy size={13} /> Copy Link
            </button>
            <button
              onClick={() => setShowPreview(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: `1px solid ${accent}`, background: `${accent}15`, color: accent, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              👁 Customer View
            </button>
            <button
              onClick={openWebsite}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <ExternalLink size={13} /> Open Website
            </button>
          </div>
        </div>
      </div>

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 420, background: isDark ? '#0e1530' : '#f3f4f6', borderRadius: 20, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ background: isDark ? '#162040' : '#e5e7eb', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              </div>
              <div style={{ flex: 1, margin: '0 12px', background: isDark ? '#0e1530' : '#fff', borderRadius: 6, padding: '3px 10px', fontSize: 11, color: isDark ? '#64748b' : '#9a7860', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bizUrl}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#6b7280', fontSize: 18, lineHeight: 1, padding: 2 }}
              >✕</button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', minHeight: 500 }}>
              <iframe
                src={bizUrl}
                style={{ width: '100%', height: '100%', minHeight: 500, border: 'none' }}
                title="Customer View Preview"
              />
            </div>
            <div style={{ padding: '10px 16px', background: isDark ? '#162040' : '#e5e7eb', textAlign: 'center', fontSize: 11, color: isDark ? '#64748b' : '#9a7860', flexShrink: 0 }}>
              👁 Customer View Preview — <span style={{ color: accent, cursor: 'pointer', fontWeight: 600 }} onClick={openWebsite}>Open in new tab ↗</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DashboardPage() {
  const { bizUser, productSelection } = useBusinessContext();
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const navigate = useNavigate();

  const [showPasswordModal] = useState(
    () => localStorage.getItem('team_member_first_login') === 'true'
  );

  const accent  = '#f97316';
  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? 'rgba(255,140,80,0.1)' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';

  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalRevenue: 147600,
    todayOrders: 23,
    activeOffers: 8,
    openLeads: 14,
    overdueFollowUps: 1,
    pipelineValue: 235000,
    wonThisMonth: 1,
  });
  const [leadPipeline, setLeadPipeline] = useState<LeadStageCount[]>([
    { label: 'New',       count: 3, value: 85000,  color: '#64748b' },
    { label: 'Contacted', count: 1, value: 30000,  color: '#3b82f6' },
    { label: 'Proposal',  count: 1, value: 120000, color: '#f97316' },
    { label: 'Won',       count: 1, value: 52000,  color: '#22c55e' },
  ]);
  const [recentNotifs, setRecentNotifs] = useState<RecentNotif[]>([
    { id: 1, type: 'order',  message: 'New order received from Priya S. — ₹580', time: '5m ago',  icon: '🛍️', path: '/orders' },
    { id: 2, type: 'bid',    message: 'New bid ₹850 on your "Cashew Pack" auction', time: '22m ago', icon: '🏆', path: '/auctions' },
    { id: 3, type: 'lead',   message: 'Follow-up overdue with Ramesh Logistics', time: '1h ago',  icon: '⏰', path: '/leads' },
    { id: 4, type: 'lead',   message: 'New lead: Sunita Catering — ₹1.2L deal', time: '3h ago',  icon: '🎯', path: '/leads' },
  ]);
  const [loading, setLoading] = useState(false);

  const bizId = bizUser?.businessId;

  async function loadDashboardData() {
    if (!supabase || !bizId) return;
    setLoading(true);
    try {
      const { data: leadsData } = await supabase
        .from('leads')
        .select('stage, deal_value, won_at, updated_at')
        .eq('business_id', bizId);

      if (leadsData && leadsData.length > 0) {
        const openStages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation'];
        const openLeads = leadsData.filter(l => openStages.includes(l.stage));
        const pipelineValue = openLeads.reduce((s: number, l: { deal_value: number | null }) => s + (l.deal_value ?? 0), 0);

        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const wonThisMonth = leadsData.filter(l => l.stage === 'won' && l.won_at && new Date(l.won_at) >= monthStart).length;

        const stageMap: Record<string, { count: number; value: number }> = {};
        for (const l of leadsData) {
          if (!stageMap[l.stage]) stageMap[l.stage] = { count: 0, value: 0 };
          stageMap[l.stage].count++;
          stageMap[l.stage].value += l.deal_value ?? 0;
        }

        const STAGE_COLORS: Record<string, string> = {
          new: '#64748b', contacted: '#3b82f6', qualified: '#f59e0b',
          proposal: '#f97316', negotiation: '#a855f7', won: '#22c55e', lost: '#ef4444',
        };

        const pipelineRows: LeadStageCount[] = ['new','contacted','proposal','won']
          .map(s => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            count: stageMap[s]?.count ?? 0,
            value: stageMap[s]?.value ?? 0,
            color: STAGE_COLORS[s],
          }));
        setLeadPipeline(pipelineRows);

        setKpis(prev => ({
          ...prev,
          openLeads: openLeads.length,
          pipelineValue,
          wonThisMonth,
        }));
      }

      const { count: overdueCount } = await supabase
        .from('lead_follow_ups')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('completed', false)
        .lt('due_at', new Date().toISOString());
      if (overdueCount != null) {
        setKpis(prev => ({ ...prev, overdueFollowUps: overdueCount }));
      }

      const { count: offersCount } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('status', 'approved');
      if (offersCount != null) {
        setKpis(prev => ({ ...prev, activeOffers: offersCount }));
      }

      const { data: payments } = await supabase
        .from('payment_submissions')
        .select('amount, created_at')
        .eq('business_id', bizId)
        .eq('status', 'approved');
      if (payments && payments.length > 0) {
        const monthStart = new Date();
        monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
        const monthRevenue = payments
          .filter((p: { created_at: string }) => new Date(p.created_at) >= monthStart)
          .reduce((s: number, p: { amount: number }) => s + (p.amount ?? 0), 0);
        if (monthRevenue > 0) setKpis(prev => ({ ...prev, totalRevenue: monthRevenue }));
      }

      const { data: notifData } = await supabase
        .from('in_app_notifications')
        .select('id, event_type, title, body, created_at')
        .eq('user_type', 'business')
        .eq('user_id', bizId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (notifData && notifData.length > 0) {
        const TYPE_ICON: Record<string, { icon: string; path: string }> = {
          lead_stage_changed: { icon: '🎯', path: '/leads' },
          lead_follow_up_reminder: { icon: '⏰', path: '/leads' },
          lead_created: { icon: '👤', path: '/leads' },
          lead_won: { icon: '🏆', path: '/leads' },
          lead_lost: { icon: '📉', path: '/leads' },
          order: { icon: '🛍️', path: '/orders' },
          payment_received: { icon: '💰', path: '/invoices' },
          auction: { icon: '🔨', path: '/auctions' },
        };
        const mapped: RecentNotif[] = notifData.map((n: Record<string, unknown>) => {
          const ev = String(n.event_type ?? '');
          const meta = TYPE_ICON[ev] ?? { icon: '🔔', path: '/notifications' };
          return {
            id: n.id as string,
            type: ev,
            message: String(n.body ?? n.title ?? ''),
            time: relativeTime(String(n.created_at)),
            icon: meta.icon,
            path: meta.path,
          };
        });
        setRecentNotifs(mapped);
      }
    } catch (e) {
      console.warn('Dashboard data load error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bizId]);

  // ── Sparkline SVGs ──────────────────────────────────────────────────────────
  const sparklineGreen = (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <path d="M0,28 C15,22 25,18 35,20 C45,22 55,10 65,7 C72,5 76,4 80,2" stroke="#22c55e" strokeWidth="2" fill="none" />
    </svg>
  );
  const sparklineRed = (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <path d="M0,4 C10,6 20,8 30,12 C42,16 55,22 65,24 C72,26 76,27 80,29" stroke="#ef4444" strokeWidth="2" fill="none" />
    </svg>
  );
  const sparklineBlue = (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <path d="M0,24 C10,20 20,22 30,16 C42,10 52,14 64,8 C72,4 76,3 80,5" stroke="#3b82f6" strokeWidth="2" fill="none" />
    </svg>
  );
  const sparklineOrange = (
    <svg width="80" height="32" viewBox="0 0 80 32" fill="none">
      <path d="M0,26 C12,20 22,24 34,18 C46,12 56,8 68,6 C74,5 77,4 80,3" stroke="#f97316" strokeWidth="2" fill="none" />
    </svg>
  );

  // ── 4 KPI metric cards data ─────────────────────────────────────────────────
  const metricCards = [
    {
      icon: '💰',
      iconColor: '#22c55e',
      value: `₹${(kpis.totalRevenue / 1000).toFixed(0)}K`,
      trend: '+18%',
      trendUp: true,
      label: 'Revenue',
      desc: 'Weekend offers boosted sales',
      sparkline: sparklineGreen,
      actionLabel: 'Improve',
      actionPath: '/offers',
    },
    {
      icon: '🛍️',
      iconColor: '#3b82f6',
      value: String(kpis.todayOrders),
      trend: '+12%',
      trendUp: true,
      label: 'Orders',
      desc: 'Push combo offer to increase AOV',
      sparkline: sparklineBlue,
      actionLabel: 'View Details',
      actionPath: '/orders',
    },
    {
      icon: '🏷️',
      iconColor: '#f59e0b',
      value: String(kpis.activeOffers),
      trend: '-5.2%',
      trendUp: false,
      label: 'Offers',
      desc: 'Alert: Competitors running higher discounts',
      sparkline: sparklineRed,
      actionLabel: 'Act Now',
      actionPath: '/offers',
    },
    {
      icon: '👥',
      iconColor: '#f97316',
      value: String(kpis.openLeads),
      trend: '+33.3%',
      trendUp: true,
      label: 'Leads',
      desc: 'Follow up with 3 hot leads now',
      sparkline: sparklineOrange,
      actionLabel: 'View Leads',
      actionPath: '/leads',
    },
  ];

  // ── Trending Near You data ──────────────────────────────────────────────────
  const trendingItems = [
    { emoji: '☕', title: 'Buy 1 Get 1 Coffee', detail: '3 nearby cafes', time: '2h ago' },
    { emoji: '💆', title: 'Hair Spa ₹299 Flat', detail: '5 salons near you', time: '4h ago' },
    { emoji: '🍕', title: 'Family Meal @ ₹499', detail: '2 restaurants', time: '6h ago' },
  ];

  // ── Notification dot colors ─────────────────────────────────────────────────
  const notifDotColors: Record<string, string> = {
    order: '#22c55e',
    bid: '#3b82f6',
    lead: '#f97316',
    payment_received: '#a855f7',
  };

  const heroBg = 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 30%, #2d1080 50%, #1a0a4d 70%, #0d0621 100%)';

  const bizUrl = bizUser?.businessId
    ? (import.meta.env.PROD
        ? `${window.location.origin}/biz/${bizUser.businessId}`
        : `${window.location.origin}/business.html/biz/${bizUser.businessId}`)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* First-login modal */}
      {showPasswordModal && <FirstLoginPasswordModal isDark={isDark} />}

      {/* Profile completeness banner */}
      <ProfileCompletenessBanner bizUser={bizUser} isDark={isDark} isMobile={isMobile} />

      {/* Getting Started guide */}
      <GettingStartedCard />

      {/* ── HERO BANNER ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: heroBg,
        minHeight: 220,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: isMobile ? '28px 24px' : '32px 40px',
      }}>
        {/* Radial glow overlay */}
        <div style={{
          position: 'absolute',
          right: 0,
          top: 0,
          width: '50%',
          height: '100%',
          background: 'radial-gradient(ellipse at 80% 50%, rgba(255,100,30,0.25) 0%, rgba(120,40,200,0.35) 40%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Stars decoration */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[
            { top: '15%', left: '60%', size: 2 }, { top: '30%', left: '75%', size: 1.5 },
            { top: '55%', left: '82%', size: 2 }, { top: '70%', left: '65%', size: 1 },
            { top: '20%', left: '88%', size: 2.5 }, { top: '45%', left: '92%', size: 1.5 },
            { top: '80%', left: '78%', size: 1 }, { top: '10%', left: '95%', size: 2 },
          ].map((s, i) => (
            <div key={i} style={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.6)',
            }} />
          ))}
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: isMobile ? '100%' : '65%' }}>
          {/* Headline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: isMobile ? 22 : 26 }}>🚀</span>
            <span style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: '#ffffff' }}>
              Your Business is Growing
            </span>
            <span style={{
              padding: '3px 10px',
              borderRadius: 20,
              background: 'rgba(34,197,94,0.2)',
              border: '1px solid rgba(34,197,94,0.5)',
              color: '#22c55e',
              fontSize: 13,
              fontWeight: 700,
            }}>
              +18% this week
            </span>
          </div>

          {/* AI Suggestion card */}
          <div style={{
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            border: '1px solid rgba(255,140,80,0.2)',
            padding: '12px 16px',
            marginBottom: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              ✨ AI Suggestion
            </div>
            <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>
              Run a ₹200 OFF above ₹999 offer this weekend
            </div>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
              +32% conversions expected
            </div>
          </div>

          {/* Competitor alert */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 14 }}>⚠️</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ color: '#fbbf24', fontWeight: 600 }}>Competitor Alert:</span> 2 nearby businesses launched new offers
            </span>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/offers')}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: 'none',
                background: `linear-gradient(135deg, ${accent}, #fb923c)`,
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(249,115,22,0.4)',
              }}
            >
              Apply Suggestion
            </button>
            <button
              onClick={() => navigate('/ai-insights')}
              style={{
                padding: '10px 20px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.25)',
                background: 'rgba(255,255,255,0.08)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              View Insights
            </button>
            <button
              onClick={loadDashboardData}
              title="Refresh"
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── 4 METRIC CARDS ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: 16,
      }}>
        {metricCards.map((mc) => (
          <div
            key={mc.label}
            onClick={() => navigate(mc.actionPath)}
            style={{
              background: card,
              borderRadius: 16,
              border: `1px solid ${border}`,
              padding: '20px',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = mc.iconColor;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = border;
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
          >
            {/* Top row: icon badge + trend badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${mc.iconColor}22`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}>
                {mc.icon}
              </div>
              <span style={{
                padding: '3px 8px',
                borderRadius: 20,
                background: mc.trendUp ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: mc.trendUp ? '#22c55e' : '#ef4444',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}>
                {mc.trendUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                {mc.trend}
              </span>
            </div>

            {/* Value */}
            <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: text, marginBottom: 2, lineHeight: 1 }}>
              {mc.value}
            </div>

            {/* Label */}
            <div style={{ fontSize: 13, fontWeight: 700, color: text, marginBottom: 4 }}>
              {mc.label}
            </div>

            {/* Description */}
            <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.4, marginBottom: 12, minHeight: 30 }}>
              {mc.label === 'Offers' && kpis.activeOffers < 5 ? (
                <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <AlertCircle size={10} color="#ef4444" /> {mc.desc}
                </span>
              ) : mc.desc}
            </div>

            {/* Sparkline + action button row */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <div style={{ opacity: 0.7 }}>
                {mc.sparkline}
              </div>
              <button
                onClick={e => { e.stopPropagation(); navigate(mc.actionPath); }}
                style={{
                  padding: '5px 12px',
                  borderRadius: 8,
                  border: `1px solid ${mc.iconColor}44`,
                  background: `${mc.iconColor}11`,
                  color: mc.iconColor,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {mc.actionLabel}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── BOTTOM 3-COLUMN ROW ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
        gap: 16,
      }}>

        {/* AI Command Center */}
        <div style={{
          background: card,
          borderRadius: 16,
          border: `1px solid ${border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 6px #a855f7' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>AI Command Center</span>
          </div>

          {/* QR code mini */}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ padding: 8, borderRadius: 10, background: '#ffffff', flexShrink: 0 }}>
              {bizUrl
                ? <QRCodeSVG value={bizUrl} size={56} fgColor="#0d0d18" bgColor="#ffffff" />
                : <div style={{ width: 56, height: 56, background: '#e5e7eb', borderRadius: 6 }} />
              }
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: text }}>Profile Views</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>+12%</div>
              <div style={{ fontSize: 11, color: textMuted }}>vs last week</div>
            </div>
          </div>

          {/* Top service */}
          <div style={{
            padding: '10px 12px',
            borderRadius: 10,
            background: isDark ? '#162040' : '#fdf6f0',
            border: `1px solid ${accent}22`,
          }}>
            <div style={{ fontSize: 11, color: textMuted, marginBottom: 3 }}>Top Service</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text }}>Hair Spa</div>
            <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>₹2,220 earned</div>
          </div>

          {/* AI suggestion */}
          <div style={{ fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
            💡 <span style={{ color: text }}>Create a "Weekend Special" bundle</span> to boost Saturday footfall by ~24%
          </div>

          <button
            onClick={() => navigate('/offers')}
            style={{
              padding: '10px',
              borderRadius: 10,
              border: 'none',
              background: `linear-gradient(135deg, ${accent}, #fb923c)`,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              marginTop: 'auto',
            }}
          >
            Apply Suggestion
          </button>
        </div>

        {/* Trending Near You */}
        <div style={{
          background: card,
          borderRadius: 16,
          border: `1px solid ${border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 16 }}>🔥</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Trending Near You</span>
            <span style={{
              marginLeft: 'auto',
              padding: '2px 8px',
              borderRadius: 20,
              background: 'rgba(239,68,68,0.15)',
              color: '#ef4444',
              fontSize: 10,
              fontWeight: 700,
            }}>
              LIVE
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {trendingItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isDark ? '#162040' : '#fdf6f0',
                  border: `1px solid ${border}`,
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: accent, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: textMuted }}>{item.detail}</div>
                </div>
                <div style={{ fontSize: 10, color: textMuted, flexShrink: 0, marginTop: 2 }}>{item.time}</div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/competitors')}
            style={{
              padding: '8px',
              borderRadius: 10,
              border: `1px solid ${border}`,
              background: 'transparent',
              color: textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 'auto',
            }}
          >
            See All Trends →
          </button>
        </div>

        {/* Live Activity */}
        <div style={{
          background: card,
          borderRadius: 16,
          border: `1px solid ${border}`,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: text }}>Live Activity</span>
            <span style={{
              padding: '2px 8px',
              borderRadius: 20,
              background: 'rgba(34,197,94,0.15)',
              color: '#22c55e',
              fontSize: 10,
              fontWeight: 700,
              border: '1px solid rgba(34,197,94,0.3)',
            }}>
              New
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentNotifs.slice(0, 3).map((n) => (
              <div
                key={n.id}
                onClick={() => navigate(n.path)}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: isDark ? '#162040' : '#fdf6f0',
                  border: `1px solid ${border}`,
                  cursor: 'pointer',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
              >
                {/* Colored dot */}
                <div style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: notifDotColors[n.type] ?? '#64748b',
                  flexShrink: 0,
                  marginTop: 4,
                  boxShadow: `0 0 6px ${notifDotColors[n.type] ?? '#64748b'}`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: text, lineHeight: 1.4, marginBottom: 3 }}>
                    {n.icon} {n.message}
                  </div>
                  <div style={{ fontSize: 10, color: textMuted }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/notifications')}
            style={{
              padding: '8px',
              borderRadius: 10,
              border: `1px solid ${border}`,
              background: 'transparent',
              color: textMuted,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              marginTop: 'auto',
            }}
          >
            View All Activity →
          </button>
        </div>
      </div>

      {/* ── Lead Pipeline mini-summary (LMS / both) ──────────────────────────── */}
      {productSelection !== 'rr' && (
        <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: 7 }}>
              <UserCheck size={15} color={accent} /> Lead Pipeline
            </h3>
            <button onClick={() => navigate('/leads')} style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Manage →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10 }}>
            {leadPipeline.map(stage => (
              <div
                key={stage.label}
                onClick={() => navigate('/leads')}
                style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${stage.color}33`, background: `${stage.color}0d`, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${stage.color}18`}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${stage.color}0d`}
              >
                <div style={{ fontSize: 11, fontWeight: 600, color: stage.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: text }}>{stage.count}</div>
                <div style={{ fontSize: 10, color: textMuted }}>{stage.value > 0 ? `₹${(stage.value / 1000).toFixed(0)}K` : '—'}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

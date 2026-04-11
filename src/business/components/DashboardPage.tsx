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

  // If complete, don't show banner
  if (pct === 100) return null;
  // If dismissed recently, don't show
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
      {/* Dismiss button */}
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

      {/* Progress bar */}
      <div style={{ height: 6, borderRadius: 6, background: isDark ? '#1c2a55' : '#f3f0ec', marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 6, background: `linear-gradient(90deg, ${accent}, #fb923c)`, transition: 'width 0.4s ease' }} />
      </div>

      {/* Missing chips */}
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

            {/* Strength indicator */}
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

  const bizUrl = `${window.location.origin}/business.html/biz/${bizUser.businessId}`;
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
        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ padding: 12, borderRadius: 12, background: '#ffffff', border: `1px solid ${border}` }}>
            <QRCodeSVG value={bizUrl} size={160} fgColor="#0d0d18" bgColor="#ffffff" />
          </div>
          <div style={{ fontSize: 10, color: muted, textAlign: 'center' }}>Scan to open business page</div>
        </div>

        {/* URL + Buttons */}
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
              onClick={openWebsite}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              <ExternalLink size={13} /> Open Website
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { bizUser, productSelection } = useBusinessContext();
  const { isDark } = useTheme();
  const { isMobile } = useViewport();
  const navigate = useNavigate();

  // First-login password modal for team members
  const [showPasswordModal, setShowPasswordModal] = useState(
    () => localStorage.getItem('team_member_first_login') === 'true'
  );

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';

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
      // ── Leads ──────────────────────────────────────────────────────────────
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

        // Stage breakdown for pipeline mini-summary
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

      // ── Overdue follow-ups ──────────────────────────────────────────────────
      const { count: overdueCount } = await supabase
        .from('lead_follow_ups')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('completed', false)
        .lt('due_at', new Date().toISOString());
      if (overdueCount != null) {
        setKpis(prev => ({ ...prev, overdueFollowUps: overdueCount }));
      }

      // ── Active offers ───────────────────────────────────────────────────────
      const { count: offersCount } = await supabase
        .from('offers')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', bizId)
        .eq('status', 'approved');
      if (offersCount != null) {
        setKpis(prev => ({ ...prev, activeOffers: offersCount }));
      }

      // ── Revenue from payment_submissions ─────────────────────────────────
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

      // ── Recent notifications ────────────────────────────────────────────────
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

  interface KPI {
    label: string;
    value: string;
    sub: string;
    trend: number;
    icon: React.ReactNode;
    color: string;
    path?: string;
  }

  const rrKPIs: KPI[] = [
    { label: 'Total Revenue', value: `₹${(kpis.totalRevenue / 1000).toFixed(0)}K`, sub: 'This month (approved)', trend: 18.4, icon: <TrendingUp size={20} />, color: '#22c55e' },
    { label: "Today's Orders", value: String(kpis.todayOrders), sub: 'From payment submissions', trend: 12.0, icon: <ShoppingBag size={20} />, color: '#3b82f6', path: '/orders' },
    { label: 'Active Offers', value: String(kpis.activeOffers), sub: `Live & approved`, trend: -5.2, icon: <Tag size={20} />, color: '#f59e0b', path: '/offers' },
  ];

  const lmsKPIs: KPI[] = [
    { label: 'Open Leads', value: String(kpis.openLeads), sub: kpis.overdueFollowUps > 0 ? `${kpis.overdueFollowUps} overdue follow-up` : `₹${(kpis.pipelineValue / 1000).toFixed(0)}K pipeline`, trend: 33.3, icon: <UserCheck size={20} />, color: '#fb923c', path: '/leads' },
    { label: 'Won This Month', value: String(kpis.wonThisMonth), sub: 'Deals closed', trend: 10.0, icon: <TrendingUp size={20} />, color: '#22c55e' },
    { label: 'Pipeline Value', value: `₹${(kpis.pipelineValue / 1000).toFixed(0)}K`, sub: 'Open deals total', trend: 5.0, icon: <Wallet size={20} />, color: '#3b82f6' },
  ];

  const KPIs: KPI[] = productSelection === 'rr'
    ? rrKPIs
    : productSelection === 'lms'
      ? lmsKPIs
      : [...rrKPIs, { label: 'Open Leads', value: String(kpis.openLeads), sub: kpis.overdueFollowUps > 0 ? `${kpis.overdueFollowUps} overdue follow-up` : `₹${(kpis.pipelineValue / 1000).toFixed(0)}K pipeline`, trend: 33.3, icon: <UserCheck size={20} />, color: '#fb923c', path: '/leads' }];

  const allQuickActions = [
    { label: 'Add Product', icon: <Plus size={18} />, color: accent, path: '/products', module: 'rr' },
    { label: 'Create Offer', icon: <Tag size={18} />, color: '#f59e0b', path: '/offers', module: 'rr' },
    { label: 'View Wallet', icon: <Wallet size={18} />, color: '#22c55e', path: '/wallet', module: 'rr' },
    { label: 'View Leads', icon: <UserCheck size={18} />, color: '#fb923c', path: '/leads', module: 'lms' },
  ];

  const QUICK_ACTIONS = allQuickActions.filter(a =>
    productSelection === 'both' || a.module === productSelection
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* First-login password change modal for team members */}
      {showPasswordModal && <FirstLoginPasswordModal isDark={isDark} />}

      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: text, marginBottom: 4 }}>
            Good morning, {bizUser?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: textMuted }}>
            {bizUser?.businessName} — Here's what's happening today
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!isMobile && productSelection !== 'lms' && (
            <button onClick={() => navigate('/products')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={16} /> Add Product
            </button>
          )}
          <button onClick={loadDashboardData} title="Refresh" style={{ background: 'none', border: `1px solid ${border}`, borderRadius: 8, padding: 8, cursor: 'pointer', color: textMuted, display: 'flex', alignItems: 'center' }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Profile Completeness Banner */}
      <ProfileCompletenessBanner bizUser={bizUser} isDark={isDark} isMobile={isMobile} />

      {/* Getting Started guide */}
      <GettingStartedCard />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: isMobile ? 12 : 16 }}>
        {KPIs.map(kpi => (
          <div
            key={kpi.label}
            onClick={() => kpi.path && navigate(kpi.path)}
            style={{ background: card, borderRadius: 16, border: `1px solid ${kpi.path ? `${kpi.color}44` : border}`, padding: 20, cursor: kpi.path ? 'pointer' : 'default', transition: 'all 0.15s' }}
            onMouseEnter={e => { if (kpi.path) (e.currentTarget as HTMLElement).style.borderColor = kpi.color; }}
            onMouseLeave={e => { if (kpi.path) (e.currentTarget as HTMLElement).style.borderColor = `${kpi.color}44`; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                {kpi.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: kpi.trend > 0 ? '#22c55e' : '#ef4444' }}>
                {kpi.trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(kpi.trend)}%
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: text, marginBottom: 4 }}>{kpi.value}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: textMuted }}>{kpi.label}</div>
            <div style={{ fontSize: 11, color: kpi.label === 'Open Leads' && kpis.overdueFollowUps > 0 ? '#ef4444' : textMuted, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
              {kpi.label === 'Open Leads' && kpis.overdueFollowUps > 0 && <AlertCircle size={10} color="#ef4444" />}
              {kpi.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Business Website QR Card */}
      <BusinessWebsiteCard bizUser={bizUser} isDark={isDark} isMobile={isMobile} />

      {/* Revenue chart + Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 16 }}>
        {/* Revenue chart — hidden for LMS-only users */}
        {productSelection !== 'lms' && <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: text }}>Revenue — Last 7 Days</h3>
            <span style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>₹{0}K</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: textMuted }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: textMuted }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: isDark ? '#162040' : '#fff', border: `1px solid ${border}`, borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill={accent} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>}

        {/* Quick actions + Notifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 12 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {QUICK_ACTIONS.map(a => (
                <button key={a.label} onClick={() => navigate(a.path)} style={{ padding: '12px 8px', borderRadius: 10, border: `1px solid ${border}`, background: `${a.color}11`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', color: a.color, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  {a.icon}
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 12 }}>Latest Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentNotifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => navigate(n.path)}
                  style={{ display: 'flex', gap: 10, padding: '8px', borderRadius: 8, background: n.type.includes('lead') ? (isDark ? '#f97316' + '11' : '#fff7f0') : (isDark ? '#0f1838' : '#fdf6f0'), cursor: 'pointer', transition: 'opacity 0.1s', border: n.type.includes('lead') ? `1px solid #f9731622` : '1px solid transparent' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                  <div>
                    <p style={{ fontSize: 11, color: text, lineHeight: 1.4, marginBottom: 2 }}>{n.message}</p>
                    <span style={{ fontSize: 10, color: textMuted }}>{n.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Pipeline mini-summary (real data) — hidden for RR-only users */}
      {productSelection !== 'rr' && <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text, display: 'flex', alignItems: 'center', gap: 7 }}>
            <UserCheck size={15} color={accent} /> Lead Pipeline
          </h3>
          <button onClick={() => navigate('/leads')} style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Manage →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${isMobile ? 2 : 4}, 1fr)`, gap: 10 }}>
          {leadPipeline.map(stage => (
            <div key={stage.label} onClick={() => navigate('/leads')} style={{ padding: '10px 14px', borderRadius: 10, border: `1px solid ${stage.color}33`, background: `${stage.color}0d`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${stage.color}18`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${stage.color}0d`}>
              <div style={{ fontSize: 11, fontWeight: 600, color: stage.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{stage.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: text }}>{stage.count}</div>
              <div style={{ fontSize: 10, color: textMuted }}>{stage.value > 0 ? `₹${(stage.value / 1000).toFixed(0)}K` : '—'}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* Recent Orders — hidden for LMS-only users */}
      {productSelection !== 'lms' && <div style={{ background: card, borderRadius: 16, border: `1px solid ${border}`, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: text }}>Recent Orders</h3>
          <button onClick={() => navigate('/orders')} style={{ fontSize: 12, color: accent, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View all →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Order ID', 'Customer', 'Items', 'Total', 'Status', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 600, color: textMuted, borderBottom: `1px solid ${border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              { [].map((o, i) => {
                const st = STATUS_COLORS[o.status];
                return (
                  <tr key={o.id} style={{ borderBottom: i < 0 - 1 ? `1px solid ${border}` : 'none' }}>
                    <td style={{ padding: '10px 12px', color: accent, fontWeight: 600 }}>{o.id}</td>
                    <td style={{ padding: '10px 12px', color: text }}>{o.customer}</td>
                    <td style={{ padding: '10px 12px', color: textMuted, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.items}</td>
                    <td style={{ padding: '10px 12px', color: text, fontWeight: 600 }}>₹{o.total}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 11, fontWeight: 600 }}>{st.label}</span>
                    </td>
                    <td style={{ padding: '10px 12px', color: textMuted, fontSize: 11 }}>{o.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}

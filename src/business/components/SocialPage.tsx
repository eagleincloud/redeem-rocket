import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { supabase } from '@/app/lib/supabase';
import { toast } from 'sonner';
import {
  Instagram,
  Facebook,
  Twitter,
  MessageCircle,
  Plus,
  Calendar,
  Edit3,
  Trash2,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Link,
  Unlink,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Platform = 'instagram' | 'facebook' | 'twitter' | 'whatsapp';
type PostStatus = 'draft' | 'scheduled' | 'published';
type ActiveTab = 'accounts' | 'posts' | 'calendar';

interface SocialAccount {
  id: string;
  platform: Platform;
  username: string | null;
  followers: number | null;
  status: 'connected' | 'pending' | 'disconnected';
}

interface SocialPost {
  id: string;
  business_id: string;
  content: string;
  platforms: Platform[];
  scheduled_at: string | null;
  status: PostStatus;
  created_at: string;
}

// ── Platform Meta ──────────────────────────────────────────────────────────────

const PLATFORM_META: Record<
  Platform,
  {
    label: string;
    color: string;
    bgGradient: string;
    icon: React.ElementType;
    textColor: string;
  }
> = {
  instagram: {
    label: 'Instagram',
    color: '#e1306c',
    bgGradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    icon: Instagram,
    textColor: '#fff',
  },
  facebook: {
    label: 'Facebook Page',
    color: '#1877f2',
    bgGradient: 'linear-gradient(135deg, #1877f2 0%, #0a5dc2 100%)',
    icon: Facebook,
    textColor: '#fff',
  },
  twitter: {
    label: 'Twitter / X',
    color: '#000',
    bgGradient: 'linear-gradient(135deg, #14171a 0%, #2d3748 100%)',
    icon: Twitter,
    textColor: '#fff',
  },
  whatsapp: {
    label: 'WhatsApp Business',
    color: '#25d366',
    bgGradient: 'linear-gradient(135deg, #075e54 0%, #25d366 100%)',
    icon: MessageCircle,
    textColor: '#fff',
  },
};

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'twitter', 'whatsapp'];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function getDayLabel(date: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: Platform }) {
  const meta = PLATFORM_META[platform];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        background: meta.bgGradient,
        color: meta.textColor,
        lineHeight: 1.6,
      }}
    >
      <meta.icon size={10} />
      {meta.label}
    </span>
  );
}

function StatusBadge({ status }: { status: PostStatus }) {
  const cfg: Record<PostStatus, { bg: string; color: string; label: string }> = {
    draft: { bg: 'rgba(107,114,128,0.18)', color: '#9ca3af', label: 'Draft' },
    scheduled: { bg: 'rgba(99,102,241,0.18)', color: '#818cf8', label: 'Scheduled' },
    published: { bg: 'rgba(34,197,94,0.15)', color: '#4ade80', label: 'Published' },
  };
  const { bg, color, label } = cfg[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 10px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 600,
        background: bg,
        color,
      }}
    >
      {status === 'draft' && <FileText size={10} />}
      {status === 'scheduled' && <Clock size={10} />}
      {status === 'published' && <CheckCircle2 size={10} />}
      {label}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SocialPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { isMobile } = useViewport();

  const [activeTab, setActiveTab] = useState<ActiveTab>('accounts');

  // Accounts state
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [connectingPlatform, setConnectingPlatform] = useState<Platform | null>(null);

  // Posts state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Compose state
  const [composeContent, setComposeContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(new Set());
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [saving, setSaving] = useState(false);

  // Calendar state
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // ── Colors ──────────────────────────────────────────────────────────────────

  const bg = isDark ? '#0b1220' : '#f8fafc';
  const cardBg = isDark ? '#111827' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const textPrimary = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#6b7280' : '#64748b';
  const accent = '#f97316';
  const primary = '#6366f1';

  // ── Data Loading ─────────────────────────────────────────────────────────────

  const loadAccounts = useCallback(async () => {
    if (!bizUser?.businessId) return;
    setAccountsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('business_id', bizUser.businessId);
      if (error) throw error;
      setAccounts((data as SocialAccount[]) ?? []);
    } catch (err) {
      console.error('Failed to load social accounts:', err);
    } finally {
      setAccountsLoading(false);
    }
  }, [bizUser?.businessId]);

  const loadPosts = useCallback(async () => {
    if (!bizUser?.businessId) return;
    setPostsLoading(true);
    try {
      const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('business_id', bizUser.businessId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts((data as SocialPost[]) ?? []);
    } catch (err) {
      console.error('Failed to load social posts:', err);
    } finally {
      setPostsLoading(false);
    }
  }, [bizUser?.businessId]);

  useEffect(() => {
    loadAccounts();
    loadPosts();
  }, [loadAccounts, loadPosts]);

  // ── Account Actions ──────────────────────────────────────────────────────────

  const handleConnect = async (platform: Platform) => {
    if (!bizUser?.businessId) return;
    setConnectingPlatform(platform);
    try {
      const { error } = await supabase.from('social_accounts').upsert(
        {
          business_id: bizUser.businessId,
          platform,
          status: 'pending',
          username: null,
          followers: null,
        },
        { onConflict: 'business_id,platform' }
      );
      if (error) throw error;
      toast.info('Connection feature coming soon — connect manually for now');
      await loadAccounts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to initiate connection');
    } finally {
      setConnectingPlatform(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!bizUser?.businessId) return;
    try {
      const { error } = await supabase
        .from('social_accounts')
        .delete()
        .eq('business_id', bizUser.businessId)
        .eq('platform', platform);
      if (error) throw error;
      toast.success(`${PLATFORM_META[platform].label} disconnected`);
      await loadAccounts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to disconnect account');
    }
  };

  const getAccount = (platform: Platform) =>
    accounts.find((a) => a.platform === platform) ?? null;

  // ── Post Actions ─────────────────────────────────────────────────────────────

  const togglePlatform = (platform: Platform) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(platform)) next.delete(platform);
      else next.add(platform);
      return next;
    });
  };

  const savePost = async (status: PostStatus) => {
    if (!bizUser?.businessId) return;
    if (!composeContent.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }
    if (selectedPlatforms.size === 0) {
      toast.error('Select at least one platform');
      return;
    }
    if (status === 'scheduled' && !scheduledAt) {
      toast.error('Please pick a schedule date & time');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('social_posts').insert({
        business_id: bizUser.businessId,
        content: composeContent.trim(),
        platforms: Array.from(selectedPlatforms),
        scheduled_at:
          status === 'scheduled' ? new Date(scheduledAt).toISOString() : null,
        status,
      });
      if (error) throw error;
      toast.success(status === 'draft' ? 'Saved as draft' : status === 'scheduled' ? 'Post scheduled!' : 'Post published!');
      setComposeContent('');
      setSelectedPlatforms(new Set());
      setScheduleMode('now');
      setScheduledAt('');
      await loadPosts();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase.from('social_posts').delete().eq('id', id);
      if (error) throw error;
      toast.success('Post deleted');
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete post');
    }
  };

  // ── Calendar Helpers ─────────────────────────────────────────────────────────

  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(calendarWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const postsForDate = (date: Date) =>
    posts.filter(
      (p) => p.scheduled_at && isSameDay(new Date(p.scheduled_at), date)
    );

  const filteredPosts = selectedCalendarDate
    ? posts.filter(
        (p) =>
          p.scheduled_at && isSameDay(new Date(p.scheduled_at), selectedCalendarDate)
      )
    : posts.filter((p) => p.status === 'scheduled');

  const shiftWeek = (delta: number) => {
    setCalendarWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + delta * 7);
      return d;
    });
    setSelectedCalendarDate(null);
  };

  // ── Styles helpers ───────────────────────────────────────────────────────────

  const card: React.CSSProperties = {
    background: cardBg,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 20,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
    border: `1px solid ${border}`,
    borderRadius: 10,
    padding: '10px 14px',
    color: textPrimary,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        padding: isMobile ? '16px 12px' : '24px 28px',
        boxSizing: 'border-box',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 22 : 26, fontWeight: 700, color: textPrimary }}>
            Social Media
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: textMuted }}>
            Manage your social presence across platforms
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab('posts');
            setTimeout(() => {
              document.getElementById('compose-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          <Plus size={16} />
          Schedule Post
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          width: 'fit-content',
        }}
      >
        {(['accounts', 'posts', 'calendar'] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px',
              borderRadius: 9,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              background: activeTab === tab ? primary : 'transparent',
              color: activeTab === tab ? '#fff' : textMuted,
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'accounts' && '📱 '}
            {tab === 'posts' && '✍️ '}
            {tab === 'calendar' && '📅 '}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          ACCOUNTS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div>
          {accountsLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <Loader2 size={28} style={{ color: primary, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {ALL_PLATFORMS.map((platform) => {
                const meta = PLATFORM_META[platform];
                const account = getAccount(platform);
                const isConnected = account?.status === 'connected';
                const isPending = account?.status === 'pending';
                const PlatformIcon = meta.icon;
                const isConnecting = connectingPlatform === platform;

                return (
                  <div key={platform} style={{ ...card, position: 'relative', overflow: 'hidden' }}>
                    {/* gradient top strip */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 4,
                        background: meta.bgGradient,
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, marginTop: 4 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          background: meta.bgGradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <PlatformIcon size={22} color="#fff" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: textPrimary, fontSize: 15 }}>{meta.label}</div>
                        {isPending && (
                          <div style={{ fontSize: 11, color: accent, marginTop: 2 }}>Pending connection</div>
                        )}
                        {isConnected && account?.username && (
                          <div style={{ fontSize: 12, color: textMuted, marginTop: 2 }}>@{account.username}</div>
                        )}
                      </div>
                    </div>

                    {isConnected && account?.followers != null && (
                      <div
                        style={{
                          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                          borderRadius: 8,
                          padding: '8px 12px',
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, color: textMuted }}>Followers</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: textPrimary }}>
                          {account.followers.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {isConnected ? (
                      <button
                        onClick={() => handleDisconnect(platform)}
                        style={{
                          width: '100%',
                          padding: '9px 0',
                          borderRadius: 9,
                          border: `1px solid rgba(239,68,68,0.4)`,
                          background: 'rgba(239,68,68,0.08)',
                          color: '#f87171',
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <Unlink size={14} />
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(platform)}
                        disabled={isConnecting || isPending}
                        style={{
                          width: '100%',
                          padding: '9px 0',
                          borderRadius: 9,
                          border: `1px solid ${border}`,
                          background: isPending
                            ? 'rgba(249,115,22,0.1)'
                            : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)',
                          color: isPending ? accent : textPrimary,
                          fontWeight: 600,
                          fontSize: 13,
                          cursor: isConnecting ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          opacity: isConnecting ? 0.7 : 1,
                        }}
                      >
                        {isConnecting ? (
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Link size={14} />
                        )}
                        {isPending ? 'Pending' : 'Connect'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          POSTS TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'posts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Compose ── */}
          <div id="compose-section" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Edit3 size={17} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: textPrimary }}>
                Compose Post
              </h2>
            </div>

            {/* Content */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: textMuted }}>Content</label>
                <span
                  style={{
                    fontSize: 12,
                    color: composeContent.length > 260 ? '#f87171' : textMuted,
                  }}
                >
                  {composeContent.length} / 280
                </span>
              </div>
              <textarea
                value={composeContent}
                onChange={(e) => {
                  if (e.target.value.length <= 280) setComposeContent(e.target.value);
                }}
                rows={4}
                placeholder="What's on your mind? Write your social post here..."
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Platform selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 8 }}>
                Post to platforms
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {ALL_PLATFORMS.map((p) => {
                  const meta = PLATFORM_META[p];
                  const selected = selectedPlatforms.has(p);
                  const PlatformIcon = meta.icon;
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlatform(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 9999,
                        border: selected ? `1.5px solid ${meta.color}` : `1.5px solid ${border}`,
                        background: selected
                          ? `${meta.color}20`
                          : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        color: selected ? meta.color : textMuted,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      <PlatformIcon size={13} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule toggle */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: textMuted, display: 'block', marginBottom: 8 }}>
                Timing
              </label>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                  borderRadius: 9,
                  padding: 3,
                  width: 'fit-content',
                }}
              >
                {(['now', 'later'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setScheduleMode(mode)}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 7,
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: 12,
                      background: scheduleMode === mode ? primary : 'transparent',
                      color: scheduleMode === mode ? '#fff' : textMuted,
                      transition: 'all 0.2s',
                    }}
                  >
                    {mode === 'now' ? '⚡ Post Now' : '🕐 Schedule for later'}
                  </button>
                ))}
              </div>

              {scheduleMode === 'later' && (
                <div style={{ marginTop: 10 }}>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    style={{ ...inputStyle, width: 'auto', minWidth: 220 }}
                  />
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => savePost('draft')}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: `1.5px solid ${border}`,
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  color: textPrimary,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <FileText size={15} />
                Save Draft
              </button>
              <button
                onClick={() => savePost(scheduleMode === 'later' ? 'scheduled' : 'published')}
                disabled={saving}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: saving ? 'wait' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? (
                  <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Send size={15} />
                )}
                {scheduleMode === 'later' ? 'Schedule' : 'Publish Now'}
              </button>
            </div>
          </div>

          {/* ── Posts List ── */}
          <div>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: textPrimary }}>
              All Posts
            </h2>
            {postsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={26} style={{ color: primary, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : posts.length === 0 ? (
              <div
                style={{
                  ...card,
                  textAlign: 'center',
                  padding: '48px 24px',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <Edit3 size={26} color={primary} />
                </div>
                <p style={{ margin: 0, color: textMuted, fontSize: 15 }}>
                  No posts yet. Create your first social post above.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {posts.map((post) => (
                  <div key={post.id} style={card}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: textPrimary,
                          lineHeight: 1.6,
                          flex: 1,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {post.content}
                      </p>
                      <button
                        onClick={() => deletePost(post.id)}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          border: 'none',
                          background: 'transparent',
                          color: textMuted,
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'color 0.2s',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#f87171')}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = textMuted)}
                        title="Delete post"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        marginTop: 12,
                        alignItems: 'center',
                      }}
                    >
                      {post.platforms.map((p) => (
                        <PlatformBadge key={p} platform={p} />
                      ))}
                      <StatusBadge status={post.status} />
                      {post.scheduled_at && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: textMuted,
                          }}
                        >
                          <Clock size={11} />
                          {formatDate(post.scheduled_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          CALENDAR TAB
      ══════════════════════════════════════════════════ */}
      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Week navigation */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <button
                onClick={() => shiftWeek(-1)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 9,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>
                {calendarDays[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>

              <button
                onClick={() => shiftWeek(1)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 9,
                  border: `1px solid ${border}`,
                  background: 'transparent',
                  color: textPrimary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 7-day row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 6,
              }}
            >
              {calendarDays.map((day, idx) => {
                const dayPosts = postsForDate(day);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedCalendarDate && isSameDay(day, selectedCalendarDate);

                return (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedCalendarDate((prev) =>
                        prev && isSameDay(prev, day) ? null : day
                      )
                    }
                    style={{
                      padding: isMobile ? '8px 4px' : '10px 6px',
                      borderRadius: 12,
                      border: isSelected
                        ? `2px solid ${primary}`
                        : isToday
                        ? `2px solid ${accent}`
                        : `1.5px solid ${border}`,
                      background: isSelected
                        ? `${primary}20`
                        : isToday
                        ? `${accent}10`
                        : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 10, color: textMuted, fontWeight: 600 }}>
                      {getDayLabel(day)}
                    </span>
                    <span
                      style={{
                        fontSize: isMobile ? 14 : 16,
                        fontWeight: 700,
                        color: isSelected ? primary : isToday ? accent : textPrimary,
                      }}
                    >
                      {day.getDate()}
                    </span>
                    {dayPosts.length > 0 && (
                      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {dayPosts.slice(0, 3).map((p, i) => (
                          <div
                            key={i}
                            title={p.content.slice(0, 40)}
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background:
                                p.platforms[0]
                                  ? PLATFORM_META[p.platforms[0]].color
                                  : primary,
                            }}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <span style={{ fontSize: 9, color: textMuted }}>+{dayPosts.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Posts for selected date (or all scheduled) */}
          <div>
            <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 700, color: textPrimary }}>
              {selectedCalendarDate
                ? `Posts on ${selectedCalendarDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}`
                : 'Upcoming Scheduled Posts'}
            </h2>

            {postsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Loader2 size={26} style={{ color: primary, animation: 'spin 1s linear infinite' }} />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                style={{
                  ...card,
                  textAlign: 'center',
                  padding: '40px 24px',
                }}
              >
                <Calendar size={32} color={textMuted} style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, color: textMuted, fontSize: 14 }}>
                  {selectedCalendarDate
                    ? 'No posts scheduled for this date.'
                    : 'No upcoming scheduled posts.'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredPosts.map((post) => (
                  <div key={post.id} style={card}>
                    <p
                      style={{
                        margin: '0 0 10px',
                        fontSize: 14,
                        color: textPrimary,
                        lineHeight: 1.6,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {post.content}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        alignItems: 'center',
                      }}
                    >
                      {post.platforms.map((p) => (
                        <PlatformBadge key={p} platform={p} />
                      ))}
                      <StatusBadge status={post.status} />
                      {post.scheduled_at && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: textMuted,
                            marginLeft: 4,
                          }}
                        >
                          <Clock size={11} />
                          {formatDate(post.scheduled_at)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CSS keyframes for spinner ── */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

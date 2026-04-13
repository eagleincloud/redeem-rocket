import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from '@/app/context/ThemeContext';
import { Bell, ShoppingBag, Gavel, ClipboardList, Star, AlertCircle, CheckCheck, X, IndianRupee, UserCheck, ArrowRight } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { useBusinessContext } from '@/business/context/BusinessContext';
import { markNotificationAsRead, markAllNotificationsRead } from '@/app/api/supabase-data';

type NotifType = 'order' | 'auction' | 'lead' | 'review' | 'system' | 'payment_received';

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  message: string;
  time: string;
  read: boolean;
  amount?: number;
  // Navigation metadata
  navPath?: string;
  metadata?: Record<string, unknown>;
}

const TYPE_META: Record<NotifType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  order:            { icon: <ShoppingBag size={16} />,   color: '#22c55e', bg: '#22c55e22', label: 'Order' },
  auction:          { icon: <Gavel size={16} />,         color: '#fb923c', bg: '#fb923c22', label: 'Auction' },
  lead:             { icon: <UserCheck size={16} />,     color: '#3b82f6', bg: '#3b82f622', label: 'Lead' },
  review:           { icon: <Star size={16} />,          color: '#f59e0b', bg: '#f59e0b22', label: 'Review' },
  system:           { icon: <AlertCircle size={16} />,   color: '#6b7280', bg: '#6b728022', label: 'System' },
  payment_received: { icon: <IndianRupee size={16} />,   color: '#10b981', bg: '#10b98122', label: 'Payment' },
};

// Map event_type → nav path
function getNavPath(eventType: string, metadata?: Record<string, unknown>): string {
  if (eventType.includes('lead')) {
    const leadId = metadata?.lead_id;
    return leadId ? `/leads?open=${leadId}` : '/leads';
  }
  if (eventType.includes('payment') || eventType.includes('invoice')) return '/invoices';
  if (eventType.includes('order')) return '/orders';
  if (eventType.includes('auction')) return '/auctions';
  if (eventType.includes('campaign') || eventType.includes('outreach')) return '/outreach';
  if (eventType.includes('requirement')) return '/requirements';
  if (eventType.includes('review')) return '/analytics';
  return '/notifications';
}

const PAGE_SIZE = 20;

function groupNotifications(notifs: Notification[]) {
  const today = notifs.filter(n => n.time.includes('m ago') || (n.time.includes('h ago') && parseInt(n.time) < 12));
  const yesterday = notifs.filter(n => n.time.includes('h ago') && parseInt(n.time) >= 12);
  const older = notifs.filter(n => n.time.includes('d ago'));
  return [
    { label: 'Today', items: today },
    { label: 'Yesterday', items: yesterday },
    { label: 'Earlier', items: older },
  ].filter(g => g.items.length > 0);
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function dbEventToType(eventType: string): NotifType {
  if (eventType.includes('payment')) return 'payment_received';
  if (eventType.includes('order'))   return 'order';
  if (eventType.includes('auction')) return 'auction';
  if (eventType.includes('lead') || eventType.includes('requirement') || eventType.includes('follow_up')) return 'lead';
  if (eventType.includes('review'))  return 'review';
  return 'system';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToNotif(row: Record<string, any>): Notification {
  const metadata = row.metadata ?? {};
  return {
    id:       row.id,
    type:     dbEventToType(row.event_type ?? ''),
    title:    row.title ?? '',
    message:  row.body ?? '',
    time:     relativeTime(row.created_at),
    read:     row.is_read ?? false,
    amount:   metadata?.amount ?? undefined,
    navPath:  getNavPath(row.event_type ?? '', metadata),
    metadata,
  };
}

export function BusinessNotificationsPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any>([]);
  const [typeFilter, setTypeFilter] = useState<NotifType | 'all'>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const card    = isDark ? '#0e1530' : '#ffffff';
  const border  = isDark ? '#1c2a55' : '#e8d8cc';
  const text    = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent  = '#f97316';

  const bizId = bizUser?.businessId;

  // ── Initial fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !bizId) return;

    supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_type', 'business')
      .eq('user_id', bizId)
      .order('created_at', { ascending: false })
      .range(0, PAGE_SIZE - 1)
      .then(({ data, count }) => {
        if (data && data.length > 0) {
          setNotifications(data.map(dbRowToNotif));
          setHasMore((count ?? 0) > PAGE_SIZE || data.length === PAGE_SIZE);
        }
      });

    // Realtime new notifications
    const channel = supabase
      .channel(`biz-notifs-${bizId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'in_app_notifications', filter: `user_id=eq.${bizId}` },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setNotifications(prev => [dbRowToNotif(payload.new as Record<string, any>), ...prev]);
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [bizId]);

  // ── Load more ──────────────────────────────────────────────────────────────
  async function loadMore() {
    if (!supabase || !bizId || loadingMore) return;
    setLoadingMore(true);
    const from = page * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_type', 'business')
      .eq('user_id', bizId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (data && data.length > 0) {
      setNotifications(prev => [...prev, ...data.map(dbRowToNotif)]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(p => p + 1);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    if (supabase && bizId) {
      supabase.from('in_app_notifications').update({ is_read: true }).eq('user_type', 'business').eq('user_id', bizId).eq('is_read', false).then(() => {});
    }
  }, [bizId]);

  const dismiss = useCallback((id: string) => {
    setNotifications(ns => ns.filter(n => n.id !== id));
    if (supabase && !id.startsWith('n')) {
      supabase.from('in_app_notifications').update({ is_read: true }).eq('id', id).then(() => {});
    }
  }, []);

  function handleNotifClick(notif: Notification) {
    // Mark read
    setNotifications(ns => ns.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (supabase && !notif.id.startsWith('n')) {
      supabase.from('in_app_notifications').update({ is_read: true }).eq('id', notif.id).then(() => {});
    }
    // Navigate to relevant page
    if (notif.navPath && notif.navPath !== '/notifications') {
      navigate(notif.navPath);
    }
  }

  const filtered = typeFilter === 'all' ? notifications : notifications.filter(n => n.type === typeFilter);
  const groups = groupNotifications(filtered);

  const typeCounts = (['order', 'auction', 'lead', 'review', 'system'] as NotifType[]).reduce((acc, t) => {
    acc[t] = notifications.filter(n => n.type === t).length;
    return acc;
  }, {} as Record<NotifType, number>);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: text }}>Notifications</h1>
            {unreadCount > 0 && <span style={{ padding: '3px 10px', borderRadius: 20, background: `${accent}22`, color: accent, fontSize: 12, fontWeight: 700 }}>{unreadCount} new</span>}
          </div>
          <p style={{ fontSize: 13, color: textMuted, marginTop: 2 }}>Click any notification to navigate directly to the relevant page</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setTypeFilter('all')} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${typeFilter === 'all' ? accent : border}`, background: typeFilter === 'all' ? `${accent}22` : 'transparent', color: typeFilter === 'all' ? accent : textMuted, fontSize: 12, fontWeight: typeFilter === 'all' ? 700 : 400, cursor: 'pointer' }}>
          All ({notifications.length})
        </button>
        {(['order', 'auction', 'lead', 'review', 'system'] as NotifType[]).map(t => {
          const meta = TYPE_META[t];
          const active = typeFilter === t;
          return (
            <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '6px 14px', borderRadius: 20, border: `1.5px solid ${active ? meta.color : border}`, background: active ? meta.bg : 'transparent', color: active ? meta.color : textMuted, fontSize: 12, fontWeight: active ? 700 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              {meta.icon} {meta.label} ({typeCounts[t]})
            </button>
          );
        })}
      </div>

      {/* Notification groups */}
      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: textMuted, background: card, borderRadius: 16, border: `1px solid ${border}` }}>
          <Bell size={32} color={textMuted} style={{ marginBottom: 12 }} />
          <p>No notifications found</p>
        </div>
      )}

      {groups.map(group => (
        <div key={group.label} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, color: textMuted, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: 1 }}>{group.label}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {group.items.map(notif => {
              const meta = TYPE_META[notif.type];
              const isClickable = notif.navPath && notif.navPath !== '/notifications';
              return (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    background: card, borderRadius: 14,
                    border: `1px solid ${notif.read ? border : accent + '44'}`,
                    padding: '14px 16px', display: 'flex', gap: 14,
                    cursor: isClickable ? 'pointer' : 'default',
                    position: 'relative', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (isClickable) (e.currentTarget as HTMLElement).style.borderColor = `${meta.color}66`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = notif.read ? border : accent + '44'; }}
                >
                  {!notif.read && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '3px 0 0 3px', background: accent }} />}
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: notif.read ? 500 : 700, color: text }}>{notif.title}</span>
                        {notif.amount && <span style={{ fontSize: 12, fontWeight: 700, color: '#22c55e' }}>₹{notif.amount.toLocaleString('en-IN')}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: textMuted, whiteSpace: 'nowrap', marginLeft: 10 }}>{notif.time}</span>
                    </div>
                    <p style={{ fontSize: 12, color: textMuted, lineHeight: 1.5, marginBottom: 6 }}>{notif.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 12, background: meta.bg, color: meta.color, fontSize: 10, fontWeight: 700 }}>{meta.label}</span>
                      {isClickable && (
                        <span style={{ fontSize: 10, color: meta.color, display: 'flex', alignItems: 'center', gap: 3, fontWeight: 600 }}>
                          View <ArrowRight size={10} />
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); dismiss(notif.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, padding: 4, flexShrink: 0, display: 'flex', alignItems: 'flex-start' }}
                  >
                    <X size={15} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Load More button */}
      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: '10px 28px', borderRadius: 10, border: `1px solid ${border}`,
              background: 'transparent', color: accent, fontSize: 13, fontWeight: 600,
              cursor: loadingMore ? 'not-allowed' : 'pointer', opacity: loadingMore ? 0.7 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {loadingMore ? 'Loading…' : `Load More (showing ${notifications.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

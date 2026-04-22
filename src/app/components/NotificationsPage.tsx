import { useState, useCallback, useEffect, useRef } from 'react';
import type { Business, Offer } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate }  from 'react-router-dom';
import {
  Bell, BellOff, ArrowLeft, Tag, CreditCard,
  Gavel, ShoppingBag, MapPin, Trash2, CheckCheck,
  ChevronRight, X, Sparkles, Clock, TrendingUp,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

// ── Types ────────────────────────────────────────────────────────────────────

type NotifType = 'deal_alert' | 'cashback_expiry' | 'auction_result' | 'order_update' | 'nearby' | 'system' | 'nearby_geofence';

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  time: string;       // display string
  ts: number;         // for sorting
  read: boolean;
  action?: string;    // route to navigate to on tap
  icon?: string;      // emoji override
  badge?: string;     // accent label e.g. "Flash Deal"
}

// ── Mock notifications ────────────────────────────────────────────────────────

const MOCK_NOTIFS: Notif[] = [
  {
    id: 'n1',
    type: 'deal_alert',
    title: '🔥 Flash Deal — Biryani Palace',
    body: '40% off on all biryanis! Only 3 hours left. Earn up to ₹80 cashback.',
    time: '2 min ago',
    ts: Date.now() - 2 * 60_000,
    read: false,
    action: '/business/biz1',
    badge: 'Flash Deal',
  },
  {
    id: 'n2',
    type: 'cashback_expiry',
    title: '⚠️ Cashback expiring soon',
    body: '₹150 cashback from your last order at StyleZone expires in 3 days. Redeem before it\'s gone!',
    time: '1 hr ago',
    ts: Date.now() - 60 * 60_000,
    read: false,
    action: '/wallet',
    badge: 'Expiring',
  },
  {
    id: 'n3',
    type: 'order_update',
    title: '✅ Order Verified',
    body: 'Your order at Fresh Mart (₹340) has been verified by the merchant. ₹22 cashback added.',
    time: '3 hr ago',
    ts: Date.now() - 3 * 60 * 60_000,
    read: false,
    action: '/orders',
  },
  {
    id: 'n4',
    type: 'nearby',
    title: '📍 New business near you',
    body: 'TechFix Hub just opened 400m away — Electronics repair & accessories. Check out their deals!',
    time: '5 hr ago',
    ts: Date.now() - 5 * 60 * 60_000,
    read: true,
    action: '/',
  },
  {
    id: 'n5',
    type: 'auction_result',
    title: '🏆 You won the auction!',
    body: 'Congratulations! You won "Designer Handbag" for ₹2,200. Visit the store within 48 hours.',
    time: 'Yesterday',
    ts: Date.now() - 22 * 60 * 60_000,
    read: true,
    action: '/auctions',
    badge: 'Won',
  },
  {
    id: 'n6',
    type: 'deal_alert',
    title: '🎉 Weekend Special — Coffee House',
    body: 'Buy 1 Get 1 Free on all beverages this weekend. Valid Sat-Sun, 10AM–8PM.',
    time: 'Yesterday',
    ts: Date.now() - 26 * 60 * 60_000,
    read: true,
    action: '/',
    badge: 'Weekend',
  },
  {
    id: 'n7',
    type: 'cashback_expiry',
    title: '💰 Cashback credited',
    body: '₹45 cashback for your purchase at ZenSpa has been added to your wallet.',
    time: '2 days ago',
    ts: Date.now() - 2 * 24 * 60 * 60_000,
    read: true,
    action: '/wallet',
  },
  {
    id: 'n8',
    type: 'system',
    title: '🚀 New feature: Business Reviews',
    body: 'You can now write reviews for businesses you\'ve visited. Your feedback helps the community!',
    time: '3 days ago',
    ts: Date.now() - 3 * 24 * 60 * 60_000,
    read: true,
  },
  {
    id: 'n9',
    type: 'auction_result',
    title: '😔 Auction ended — outbid',
    body: 'You were outbid on "Vintage Watch" at ₹5,800. Similar auctions are live now.',
    time: '4 days ago',
    ts: Date.now() - 4 * 24 * 60 * 60_000,
    read: true,
    action: '/auctions',
  },
  {
    id: 'n10',
    type: 'nearby',
    title: '📡 3 new deals within 1km',
    body: 'Spice Garden, Urban Salon & QuickMart have new offers matching your interests.',
    time: '5 days ago',
    ts: Date.now() - 5 * 24 * 60 * 60_000,
    read: true,
    action: '/',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<NotifType, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  deal_alert:      { icon: <Tag size={16} />,         color: '#ff6b35', bg: 'rgba(255,107,53,0.12)',   label: 'Deals'    },
  cashback_expiry: { icon: <CreditCard size={16} />,  color: '#00d68f', bg: 'rgba(0,214,143,0.12)',    label: 'Wallet'   },
  auction_result:  { icon: <Gavel size={16} />,       color: '#e040fb', bg: 'rgba(224,64,251,0.12)',   label: 'Auctions' },
  order_update:    { icon: <ShoppingBag size={16} />, color: '#147EFB', bg: 'rgba(20,126,251,0.12)',   label: 'Orders'   },
  nearby:          { icon: <MapPin size={16} />,      color: '#ffb300', bg: 'rgba(255,179,0,0.12)',    label: 'Nearby'   },
  system:          { icon: <Sparkles size={16} />,    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',   label: 'System'   },
  nearby_geofence: { icon: <MapPin size={16} />,      color: '#f97316', bg: 'rgba(249,115,22,0.12)',   label: 'Nearby'   },
};

const FILTERS = ['All', 'Deals', 'Wallet', 'Orders', 'Auctions', 'Nearby'] as const;
type Filter = typeof FILTERS[number];

function filterMatches(n: Notif, f: Filter): boolean {
  if (f === 'All') return true;
  return TYPE_META[n.type].label === f;
}

function groupByTime(notifs: Notif[]): { label: string; items: Notif[] }[] {
  const now = Date.now();
  const today: Notif[] = [], week: Notif[] = [], earlier: Notif[] = [];
  for (const n of notifs) {
    const age = now - n.ts;
    if (age < 24 * 60 * 60_000)          today.push(n);
    else if (age < 7 * 24 * 60 * 60_000)  week.push(n);
    else                                   earlier.push(n);
  }
  return [
    { label: 'Today',     items: today   },
    { label: 'This Week', items: week    },
    { label: 'Earlier',   items: earlier },
  ].filter(g => g.items.length > 0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getUserId(): string {
  try { const u = localStorage.getItem('user'); if (u) return JSON.parse(u).id ?? 'anon'; } catch { /* */ }
  return 'anon';
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

// Map DB event_type → NotifType
function dbEventToType(eventType: string): NotifType {
  if (eventType.includes('payment') || eventType.includes('order')) return 'order_update';
  if (eventType.includes('deal') || eventType.includes('offer'))    return 'deal_alert';
  if (eventType.includes('cashback'))                                return 'cashback_expiry';
  if (eventType.includes('auction'))                                 return 'auction_result';
  if (eventType.includes('nearby') || eventType.includes('geo'))    return 'nearby';
  return 'system';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToNotif(row: Record<string, any>): Notif {
  return {
    id:     row.id,
    type:   dbEventToType(row.event_type ?? ''),
    title:  row.title ?? '',
    body:   row.body  ?? '',
    time:   relativeTime(row.created_at),
    ts:     new Date(row.created_at).getTime(),
    read:   row.is_read ?? false,
    action: row.action_url ?? undefined,
    icon:   row.icon ?? undefined,
    badge:  row.metadata?.badge ?? undefined,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const navigate  = useNavigate();
  const { isDark } = useTheme();
  const [notifs, setNotifs]     = useState<Notif[]>(MOCK_NOTIFS);
  const [filter, setFilter]     = useState<Filter>('All');
  const [showEmpty, setShowEmpty] = useState(false);
  const dbLoadedRef = useRef(false);

  const filtered = notifs.filter(n => filterMatches(n, filter));
  const unread   = notifs.filter(n => !n.read).length;
  const groups   = groupByTime(filtered);

  // ── Fetch from Supabase on mount + realtime subscription ──────────────────
  useEffect(() => {
    const userId = getUserId();
    if (!supabase || userId === 'anon') return;

    // Initial fetch
    supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_type', 'customer')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data && data.length > 0) {
          dbLoadedRef.current = true;
          setNotifs(data.map(dbRowToNotif));
        }
        // else: keep mock data for demo
      });

    // Realtime: listen for new inserts
    const channel = supabase
      .channel(`customer-notifs-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'in_app_notifications',
          filter: `user_id=eq.${userId}` },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setNotifs(prev => [dbRowToNotif(payload.new as Record<string, any>), ...prev]);
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, []);

  // Listen for geofence alerts dispatched by useGeofenceAlerts hook
  useEffect(() => {
    const handler = (e: Event) => {
      const { biz, offer, dist } = (e as CustomEvent<{ biz: Business; offer: Offer; dist: number }>).detail;
      const distLabel = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;
      const newNotif: Notif = {
        id: `geo-${biz.id}-${Date.now()}`,
        type: 'nearby_geofence',
        title: `📍 ${biz.name} is nearby`,
        body: `${distLabel} away — ${offer.discount}% off: ${offer.title}`,
        time: 'Just now',
        ts: Date.now(),
        read: false,
        icon: '📍',
        badge: 'Nearby',
      };
      setNotifs(prev => [newNotif, ...prev]);
    };
    window.addEventListener('geo:geofence_alert', handler);
    return () => window.removeEventListener('geo:geofence_alert', handler);
  }, []);

  const markAllRead = useCallback(() => {
    const userId = getUserId();
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    if (supabase && userId !== 'anon') {
      supabase
        .from('in_app_notifications')
        .update({ is_read: true })
        .eq('user_type', 'customer')
        .eq('user_id', userId)
        .eq('is_read', false)
        .then(() => {/* silent */});
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifs(ns => ns.filter(n => n.id !== id));
    // For DB rows (non-geo IDs are UUIDs), mark read on dismiss
    if (supabase && !id.startsWith('geo-') && !id.startsWith('n')) {
      supabase.from('in_app_notifications').update({ is_read: true }).eq('id', id).then(() => {/* silent */});
    }
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    if (supabase && !id.startsWith('geo-') && !id.startsWith('n')) {
      supabase.from('in_app_notifications').update({ is_read: true }).eq('id', id).then(() => {/* silent */});
    }
  }, []);

  const clearAll = useCallback(() => {
    setNotifs([]);
    setShowEmpty(true);
  }, []);

  const handleTap = useCallback((n: Notif) => {
    markRead(n.id);
    if (n.action) navigate(n.action);
  }, [markRead, navigate]);

  // ── Card background & border ─────────────────────────────────────────────
  const pageBg   = isDark ? 'var(--bg)'   : '#f5f5f7';
  const cardBg   = isDark ? 'var(--card)' : '#ffffff';
  const border   = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="h-full overflow-y-auto pb-28" style={{ background: pageBg }}>

      {/* ── Sticky Header ── */}
      <div
        className="sticky top-0 z-20 border-b px-4 py-3 flex items-center justify-between"
        style={{
          background: isDark ? 'rgba(10,10,15,0.94)' : 'rgba(245,245,247,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderColor: border,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
            style={{ background: cardBg, borderColor: border, color: 'var(--text2)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="font-bold text-base leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>
              Notifications
            </h1>
            {unread > 0 && (
              <p className="text-xs" style={{ color: 'var(--text3)' }}>{unread} unread</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all"
              style={{ background: 'rgba(20,126,251,0.1)', borderColor: 'rgba(20,126,251,0.2)', color: '#147EFB' }}
            >
              <CheckCheck size={13} />
              Mark all read
            </motion.button>
          )}
          {notifs.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={clearAll}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
              style={{ background: cardBg, borderColor: border, color: 'var(--text3)' }}
              title="Clear all"
            >
              <Trash2 size={15} />
            </motion.button>
          )}
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="sticky top-[60px] z-10 px-4 py-2 overflow-x-auto scrollbar-hide" style={{ background: pageBg }}>
        <div className="flex gap-2 min-w-max">
          {FILTERS.map(f => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border"
                style={{
                  background:  active ? 'var(--accent)' : cardBg,
                  borderColor: active ? 'var(--accent)' : border,
                  color:       active ? '#fff' : 'var(--text2)',
                  boxShadow:   active ? '0 4px 12px rgba(255,107,53,0.28)' : 'none',
                  fontFamily:  'var(--font-b)',
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-4 py-2">
        <AnimatePresence mode="popLayout">
          {(groups.length === 0 || showEmpty) ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
              >
                <BellOff size={36} style={{ color: 'var(--text3)' }} />
              </div>
              <p className="text-base font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>
                {filter === 'All' ? 'All caught up!' : `No ${filter} notifications`}
              </p>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text3)' }}>
                {filter === 'All' ? "You're up to date. New notifications will appear here." : `Switch to "All" to see everything.`}
              </p>
            </motion.div>
          ) : groups.map(group => (
            <motion.div key={group.label} layout className="mb-4">
              {/* Group label */}
              <div className="flex items-center gap-2 mb-2 mt-3">
                <Clock size={11} style={{ color: 'var(--text3)' }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--text3)', fontFamily: 'var(--font-b)' }}
                >
                  {group.label}
                </span>
              </div>
              {/* Cards */}
              <div className="space-y-2">
                <AnimatePresence>
                  {group.items.map((n, i) => {
                    const meta = TYPE_META[n.type];
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="relative overflow-hidden rounded-2xl border"
                        style={{
                          background: cardBg,
                          borderColor: n.read ? border : meta.color + '40',
                          boxShadow: n.read ? 'none' : `0 0 0 1px ${meta.color}22`,
                        }}
                      >
                        {/* Unread left stripe */}
                        {!n.read && (
                          <div
                            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                            style={{ background: meta.color }}
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => handleTap(n)}
                          className="w-full text-left flex items-start gap-3 px-4 py-3.5"
                          style={{ paddingLeft: n.read ? undefined : '20px' }}
                        >
                          {/* Icon pill */}
                          <div
                            className="shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center mt-0.5"
                            style={{ background: meta.bg, color: meta.color }}
                          >
                            {meta.icon}
                          </div>

                          {/* Text */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)', fontFamily: 'var(--font-b)' }}>
                                {n.title}
                              </p>
                              {n.badge && (
                                <span
                                  className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                  style={{ background: meta.bg, color: meta.color, fontFamily: 'var(--font-b)' }}
                                >
                                  {n.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs leading-relaxed mt-0.5 line-clamp-2" style={{ color: 'var(--text2)' }}>
                              {n.body}
                            </p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{n.time}</span>
                              {n.action && (
                                <>
                                  <span style={{ color: 'var(--text3)' }}>·</span>
                                  <span className="text-[10px] font-semibold flex items-center gap-0.5" style={{ color: meta.color }}>
                                    View <ChevronRight size={9} />
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </button>

                        {/* Dismiss X */}
                        <button
                          type="button"
                          onClick={() => dismiss(n.id)}
                          className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full transition-all"
                          style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: 'var(--text3)' }}
                          aria-label="Dismiss"
                        >
                          <X size={11} />
                        </button>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Stats strip at the bottom ── */}
        {notifs.length > 0 && !showEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 mb-2 rounded-2xl border p-4 flex items-center gap-4"
            style={{ background: cardBg, borderColor: border }}
          >
            <TrendingUp size={18} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-b)' }}>
                Activity summary
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text3)' }}>
                {notifs.filter(n => n.type === 'deal_alert').length} deals · {notifs.filter(n => n.type === 'cashback_expiry').length} wallet · {notifs.filter(n => n.type === 'order_update').length} orders
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              style={{ background: 'rgba(20,126,251,0.10)', color: '#147EFB' }}
            >
              Wallet
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

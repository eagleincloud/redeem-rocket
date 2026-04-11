import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, MapPin, Bookmark, ChevronRight, Star, Navigation2,
  Search, Zap, Clock, Heart, Grid3x3, Map,
  Award, Flame, Tag, SlidersHorizontal,
} from 'lucide-react';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router';
import { getBusinessTypeKey } from '../utils/businessType';
import { distanceKm } from '../utils/geo';
import type { Business } from '../types';

// ─── Bookmark helpers ─────────────────────────────────────────────────────────
const LS_BOOKMARKS = 'geo-bookmarks';
const LS_RECENT    = 'geo-recently-viewed';

export interface SavedPlace {
  id: string;
  name: string;
  category: string;
  address: string;
  emoji: string;
  savedAt: string;
}

export function getSavedPlaces(): SavedPlace[] {
  try { return JSON.parse(localStorage.getItem(LS_BOOKMARKS) || '[]'); } catch { return []; }
}
export function savePlace(biz: Business): void {
  const places = getSavedPlaces();
  if (places.some((p) => p.id === biz.id)) return;
  const emoji = bizEmoji(biz);
  places.unshift({ id: biz.id, name: biz.name, category: biz.category, address: biz.address, emoji, savedAt: new Date().toISOString() });
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(places.slice(0, 50)));
}
export function removeSavedPlace(id: string): void {
  localStorage.setItem(LS_BOOKMARKS, JSON.stringify(getSavedPlaces().filter((p) => p.id !== id)));
}
export function isSaved(id: string): boolean {
  return getSavedPlaces().some((p) => p.id === id);
}

// ─── Recently-viewed helpers ──────────────────────────────────────────────────
function getRecentlyViewed(): SavedPlace[] {
  try { return JSON.parse(localStorage.getItem(LS_RECENT) || '[]'); } catch { return []; }
}
function addRecentlyViewed(place: SavedPlace): void {
  const list = getRecentlyViewed().filter(p => p.id !== place.id);
  list.unshift(place);
  localStorage.setItem(LS_RECENT, JSON.stringify(list.slice(0, 12)));
}

// ─── Category palette ─────────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { bg: string; emoji: string; label: string }> = {
  restaurant:  { bg: 'linear-gradient(135deg,#f97316,#ea580c)', emoji: '🍔', label: 'Food & Dining'   },
  grocery:     { bg: 'linear-gradient(135deg,#16a34a,#15803d)', emoji: '🛒', label: 'Grocery'         },
  pharmacy:    { bg: 'linear-gradient(135deg,#2563eb,#1d4ed8)', emoji: '💊', label: 'Pharmacy'        },
  salon:       { bg: 'linear-gradient(135deg,#db2777,#be185d)', emoji: '💇', label: 'Salon & Beauty'  },
  hotel:       { bg: 'linear-gradient(135deg,#7c3aed,#6d28d9)', emoji: '🏨', label: 'Hotel'           },
  atm:         { bg: 'linear-gradient(135deg,#ca8a04,#a16207)', emoji: '🏧', label: 'ATM & Banking'   },
  electronics: { bg: 'linear-gradient(135deg,#0891b2,#0e7490)', emoji: '📱', label: 'Electronics'     },
  clothing:    { bg: 'linear-gradient(135deg,#c026d3,#9333ea)', emoji: '👗', label: 'Fashion'         },
  petrol:      { bg: 'linear-gradient(135deg,#dc2626,#b91c1c)', emoji: '⛽', label: 'Fuel'            },
  hardware:    { bg: 'linear-gradient(135deg,#78716c,#57534e)', emoji: '🔧', label: 'Hardware'        },
  gym:         { bg: 'linear-gradient(135deg,#16a34a,#065f46)', emoji: '💪', label: 'Gym & Fitness'   },
  auto:        { bg: 'linear-gradient(135deg,#374151,#1f2937)', emoji: '🚗', label: 'Auto & Garage'   },
  education:   { bg: 'linear-gradient(135deg,#4f46e5,#3730a3)', emoji: '📚', label: 'Education'       },
  jewellery:   { bg: 'linear-gradient(135deg,#b45309,#92400e)', emoji: '💍', label: 'Jewellery'       },
  optical:     { bg: 'linear-gradient(135deg,#0e7490,#0369a1)', emoji: '👓', label: 'Optical'         },
  travel:      { bg: 'linear-gradient(135deg,#0369a1,#1e40af)', emoji: '✈️', label: 'Travel'          },
  furniture:   { bg: 'linear-gradient(135deg,#92400e,#78350f)', emoji: '🪑', label: 'Furniture'       },
  stationery:  { bg: 'linear-gradient(135deg,#6d28d9,#4c1d95)', emoji: '📒', label: 'Stationery'     },
  other:       { bg: 'linear-gradient(135deg,#475569,#334155)', emoji: '🏪', label: 'Other'           },
};

const ALL_CAT_KEYS = ['restaurant','grocery','pharmacy','salon','hotel','atm',
  'electronics','clothing','petrol','hardware','gym','auto',
  'education','jewellery','optical','travel','furniture','stationery'];

function bizEmoji(biz: Business): string {
  const k = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.name);
  return CAT_STYLE[k]?.emoji ?? '📍';
}
function bizGradient(biz: Business): string {
  const k = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.name);
  return CAT_STYLE[k]?.bg ?? CAT_STYLE.other.bg;
}
function bizKey(biz: Business): string {
  return getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.name);
}

// ─── Star rating renderer ─────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={9}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
        />
      ))}
    </span>
  );
}

// ─── Distance badge ───────────────────────────────────────────────────────────
function DistBadge({ dist }: { dist: number | null }) {
  if (dist === null) return null;
  const label = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: 'rgba(255,107,53,0.12)', color: 'var(--accent)' }}>
      {label}
    </span>
  );
}

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeNavTarget?: Business | null;
}

type TabId = 'nearby' | 'saved' | 'browse';
const TABS: { id: TabId; icon: React.FC<{ size: number; className?: string }>; label: string }[] = [
  { id: 'nearby', icon: Map,      label: 'Nearby'    },
  { id: 'saved',  icon: Heart,    label: 'Saved'     },
  { id: 'browse', icon: Grid3x3,  label: 'Browse'    },
];

// ─── Main component ───────────────────────────────────────────────────────────
export function ExploreSheet({ isOpen, onClose, activeNavTarget }: Props) {
  const { isDark } = useTheme();
  const { locationScrapedBusinesses, userLocation, savedLocation } = useSearchCategory();
  const navigate = useNavigate();

  const [tab, setTab]             = useState<TabId>('nearby');
  const [searchText, setSearchText] = useState('');
  const [filterCat, setFilterCat]   = useState('all');
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [recentViewed, setRecentViewed] = useState<SavedPlace[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const focus = userLocation ?? savedLocation ?? null;

  useEffect(() => {
    if (isOpen) {
      setSavedPlaces(getSavedPlaces());
      setRecentViewed(getRecentlyViewed());
    }
  }, [isOpen]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const filteredBizs = useMemo(() => {
    let list = [...locationScrapedBusinesses];
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(b =>
        b.name.toLowerCase().includes(q) ||
        (b.address || '').toLowerCase().includes(q)
      );
    }
    if (filterCat !== 'all') {
      list = list.filter(b => bizKey(b) === filterCat);
    }
    if (focus) {
      list.sort((a, b) => distanceKm(focus, a.location) - distanceKm(focus, b.location));
    }
    return list.slice(0, 40);
  }, [locationScrapedBusinesses, searchText, filterCat, focus]);

  const catCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of locationScrapedBusinesses) {
      const k = bizKey(b);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [locationScrapedBusinesses]);

  const hotDeals = useMemo(() =>
    locationScrapedBusinesses
      .filter(b => b.offers.length > 0)
      .sort((a, b) => b.offers.length - a.offers.length)
      .slice(0, 12),
    [locationScrapedBusinesses]
  );

  const topRated = useMemo(() =>
    locationScrapedBusinesses
      .filter(b => (b.rating ?? 0) >= 4)
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
      .slice(0, 8),
    [locationScrapedBusinesses]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleRemoveSaved = (id: string) => {
    removeSavedPlace(id);
    setSavedPlaces(getSavedPlaces());
  };

  const goBiz = (biz: Business) => {
    const place: SavedPlace = {
      id: biz.id, name: biz.name, category: biz.category,
      address: biz.address, emoji: bizEmoji(biz), savedAt: new Date().toISOString(),
    };
    addRecentlyViewed(place);
    onClose();
    navigate(`/business/${biz.id}`);
  };

  const goSaved = (place: SavedPlace) => {
    addRecentlyViewed(place);
    onClose();
    navigate(`/business/${place.id}`);
  };

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  const sheet   = isDark ? 'rgba(10,6,22,0.98)'   : 'rgba(252,250,255,0.98)';
  const cardBg  = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border  = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const text    = 'var(--text)';
  const text2   = 'var(--text2)';
  const accent  = 'var(--accent)';

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm"
            style={{ zIndex: 400 }}
          />

          {/* ── Sheet ─────────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            className="fixed bottom-0 left-0 right-0 rounded-t-[32px] overflow-hidden flex flex-col"
            style={{ maxHeight: '90vh', zIndex: 410, background: sheet }}
          >
            {/* Rainbow accent line */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2.5,
              background: 'linear-gradient(90deg,#ff6b35 0%,#f97316 20%,#e040fb 50%,#3b82f6 80%,#10b981 100%)',
            }} />

            {/* ── Drag handle + close ──────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-1 shrink-0">
              <div className="flex-1" />
              <div className="w-10 h-1 rounded-full" style={{ background: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)' }} />
              <div className="flex-1 flex justify-end">
                <button onClick={onClose} className="p-1.5 rounded-full"
                  style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                  <X size={14} style={{ color: text2 }} />
                </button>
              </div>
            </div>

            {/* ── Title + live pulse ───────────────────────────────────────────── */}
            <div className="px-5 pb-2 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black" style={{ color: text }}>Explore</h2>
                  <p className="text-xs" style={{ color: text2 }}>
                    {locationScrapedBusinesses.length > 0
                      ? `${locationScrapedBusinesses.length} shops • ${hotDeals.length} active deals`
                      : 'Loading shops near you…'}
                  </p>
                </div>
                {/* Live pulse indicator */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400">Live</span>
                </div>
              </div>
            </div>

            {/* ── Navigation tracking banner ───────────────────────────────────── */}
            <AnimatePresence>
              {activeNavTarget && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="mx-4 mb-2 rounded-2xl overflow-hidden shrink-0"
                >
                  <div style={{ background: 'linear-gradient(135deg,#c2410c,#ea580c)', padding: '12px 14px' }}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                        <Navigation2 size={16} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-[10px]">Navigating to</p>
                        <p className="text-white text-sm font-bold truncate">{activeNavTarget.name}</p>
                      </div>
                      <button
                        onClick={() => { onClose(); navigate('/'); }}
                        className="shrink-0 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full"
                      >View Map</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Quick stats strip ────────────────────────────────────────────── */}
            <div className="px-4 mb-2 shrink-0">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <MapPin size={13}/>, label: 'Shops', value: locationScrapedBusinesses.length || '–', color: accent },
                  { icon: <Tag size={13}/>,    label: 'Deals',  value: hotDeals.length || '–',                  color: '#10b981' },
                  { icon: <Award size={13}/>,  label: 'Top Rated', value: topRated.length || '–',               color: '#f59e0b' },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center justify-center py-2 rounded-xl gap-0.5"
                    style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <span style={{ color: s.color }}>{s.icon}</span>
                    <span className="text-lg font-black leading-none" style={{ color: text }}>{s.value}</span>
                    <span className="text-[9px] font-medium" style={{ color: text2 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Tab bar ──────────────────────────────────────────────────────── */}
            <div className="px-4 mb-1 shrink-0">
              <div className="flex gap-1 p-1 rounded-2xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                {TABS.map(t => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{
                        background: active ? 'linear-gradient(135deg,#ff6b35,#e040fb)' : 'transparent',
                        color: active ? '#fff' : text2,
                        boxShadow: active ? '0 2px 12px rgba(255,107,53,0.35)' : 'none',
                      }}
                    >
                      <t.icon size={13} className={active ? 'text-white' : ''} />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Scrollable tab content ───────────────────────────────────────── */}
            <div className="overflow-y-auto flex-1 pb-28">

              {/* ════ TAB: NEARBY ════════════════════════════════════════════════ */}
              {tab === 'nearby' && (
                <div className="px-4 pt-2 space-y-3">

                  {/* Search bar */}
                  <div className="flex items-center gap-2 px-3 rounded-2xl"
                    style={{ background: cardBg, border: `1px solid ${border}`, height: 40 }}>
                    <Search size={14} style={{ color: text2 }} />
                    <input
                      ref={searchRef}
                      value={searchText}
                      onChange={e => setSearchText(e.target.value)}
                      placeholder="Search shops, restaurants…"
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: text }}
                    />
                    {searchText && (
                      <button onClick={() => setSearchText('')}>
                        <X size={13} style={{ color: text2 }} />
                      </button>
                    )}
                  </div>

                  {/* Category filter chips */}
                  {catCounts.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
                      <button
                        onClick={() => setFilterCat('all')}
                        className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                        style={{
                          background: filterCat === 'all'
                            ? 'linear-gradient(135deg,#ff6b35,#e040fb)'
                            : cardBg,
                          color: filterCat === 'all' ? '#fff' : text2,
                          border: `1px solid ${filterCat === 'all' ? 'transparent' : border}`,
                        }}
                      >
                        <SlidersHorizontal size={10} />All
                      </button>
                      {catCounts.map(([key, count]) => {
                        const cs = CAT_STYLE[key] ?? CAT_STYLE.other;
                        const active = filterCat === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setFilterCat(active ? 'all' : key)}
                            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                            style={{
                              background: active ? cs.bg : cardBg,
                              color: active ? '#fff' : text2,
                              border: `1px solid ${active ? 'transparent' : border}`,
                            }}
                          >
                            <span>{cs.emoji}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Business list */}
                  {filteredBizs.length === 0 ? (
                    <div className="py-10 text-center">
                      <Search size={28} className="mx-auto mb-2 opacity-20" style={{ color: text2 }} />
                      <p className="text-sm font-medium" style={{ color: text }}>No shops found</p>
                      <p className="text-xs mt-1" style={{ color: text2 }}>Try a different search or category</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredBizs.map((biz, i) => {
                        const dist = focus ? distanceKm(focus, biz.location) : null;
                        return (
                          <motion.div
                            key={biz.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: Math.min(i * 0.025, 0.4) }}
                            onClick={() => goBiz(biz)}
                            className="flex items-center gap-3 rounded-2xl p-3 cursor-pointer active:scale-98"
                            style={{ background: cardBg, border: `1px solid ${border}` }}
                          >
                            {/* Category tile */}
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 relative"
                              style={{ background: bizGradient(biz) }}>
                              {bizEmoji(biz)}
                              {biz.offers.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-[9px] font-black text-white">
                                  {biz.offers.length}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate leading-tight" style={{ color: text }}>{biz.name}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: text2 }}>
                                {biz.address || biz.category}
                              </p>
                              {(biz.rating ?? 0) > 0 && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <Stars rating={biz.rating ?? 0} />
                                  <span className="text-[10px]" style={{ color: text2 }}>{biz.rating?.toFixed(1)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <DistBadge dist={dist} />
                              <ChevronRight size={14} style={{ color: text2, opacity: 0.5 }} />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* "Show all" hint */}
                  {filteredBizs.length >= 40 && (
                    <p className="text-center text-xs py-3" style={{ color: text2 }}>
                      Showing top 40 · Pan the map to load more
                    </p>
                  )}
                </div>
              )}

              {/* ════ TAB: SAVED ═════════════════════════════════════════════════ */}
              {tab === 'saved' && (
                <div className="px-4 pt-2 space-y-5">

                  {/* Saved places */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bookmark size={14} style={{ color: accent }} />
                        <span className="font-bold text-sm" style={{ color: text }}>Saved Places</span>
                      </div>
                      {savedPlaces.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(255,107,53,0.15)', color: accent }}>
                          {savedPlaces.length}
                        </span>
                      )}
                    </div>

                    {savedPlaces.length === 0 ? (
                      <div className="rounded-2xl p-8 text-center" style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <Heart size={28} className="mx-auto mb-2 opacity-20" style={{ color: text2 }} />
                        <p className="font-semibold text-sm" style={{ color: text }}>No saved places yet</p>
                        <p className="text-xs mt-1" style={{ color: text2 }}>Tap ★ on any shop to save it here</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {savedPlaces.map((place) => (
                          <motion.div
                            key={place.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92, x: 20 }}
                            onClick={() => goSaved(place)}
                            className="flex items-center gap-3 rounded-2xl p-3.5 cursor-pointer"
                            style={{ background: cardBg, border: `1px solid ${border}` }}
                          >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                              style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.18),rgba(224,64,251,0.18))' }}>
                              {place.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate" style={{ color: text }}>{place.name}</p>
                              <p className="text-xs truncate mt-0.5" style={{ color: text2 }}>{place.address || place.category}</p>
                              <p className="text-[10px] mt-0.5 opacity-50" style={{ color: text2 }}>
                                Saved {new Date(place.savedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveSaved(place.id); }}
                              className="shrink-0 p-2 rounded-full"
                              style={{ background: 'rgba(239,68,68,0.1)' }}
                            >
                              <X size={12} className="text-red-400" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recently Viewed */}
                  {recentViewed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Clock size={14} style={{ color: accent }} />
                        <span className="font-bold text-sm" style={{ color: text }}>Recently Viewed</span>
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
                        {recentViewed.map((place) => (
                          <motion.button
                            key={place.id}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => goSaved(place)}
                            className="shrink-0 flex flex-col items-center gap-1 w-16"
                          >
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                              style={{ background: 'linear-gradient(135deg,rgba(255,107,53,0.2),rgba(224,64,251,0.2))', border: `1px solid ${border}` }}>
                              {place.emoji}
                            </div>
                            <p className="text-[10px] font-medium text-center leading-tight line-clamp-2 w-full"
                              style={{ color: text2 }}>{place.name}</p>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ════ TAB: BROWSE ════════════════════════════════════════════════ */}
              {tab === 'browse' && (
                <div className="pt-2 space-y-5">

                  {/* Hot Deals carousel */}
                  {hotDeals.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 mb-3">
                        <Flame size={14} className="text-orange-500" />
                        <span className="font-bold text-sm" style={{ color: text }}>Hot Deals Near You</span>
                        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                          {hotDeals.length} shops
                        </span>
                      </div>
                      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-hide">
                        {hotDeals.map((biz, i) => (
                          <motion.div
                            key={biz.id}
                            initial={{ opacity: 0, scale: 0.88 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.04 }}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => goBiz(biz)}
                            className="shrink-0 rounded-2xl overflow-hidden cursor-pointer shadow-lg"
                            style={{ width: 130, height: 150, background: bizGradient(biz), position: 'relative' }}
                          >
                            {/* Shimmer */}
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.15) 0%,transparent 60%)' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-2 gap-1.5">
                              <span className="text-4xl drop-shadow-lg">{bizEmoji(biz)}</span>
                              <p className="text-white text-[11px] text-center font-bold leading-tight line-clamp-2">
                                {biz.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <Zap size={10} className="text-yellow-300" />
                                <span className="text-yellow-300 text-[10px] font-black">
                                  {biz.offers.length} deal{biz.offers.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Top Rated row */}
                  {topRated.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 px-4 mb-3">
                        <Star size={14} className="fill-amber-400 text-amber-400" />
                        <span className="font-bold text-sm" style={{ color: text }}>Top Rated</span>
                      </div>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 px-4 scrollbar-hide">
                        {topRated.map((biz) => (
                          <motion.button
                            key={biz.id}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => goBiz(biz)}
                            className="shrink-0 flex flex-col items-center gap-1 w-18"
                            style={{ width: 72 }}
                          >
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-md"
                              style={{ background: bizGradient(biz) }}>
                              {bizEmoji(biz)}
                            </div>
                            <p className="text-[10px] font-semibold text-center leading-tight line-clamp-2 w-16"
                              style={{ color: text2 }}>{biz.name}</p>
                            <div className="flex items-center gap-0.5">
                              <Star size={8} className="fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold" style={{ color: text2 }}>{biz.rating?.toFixed(1)}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Category Grid */}
                  <div className="px-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Grid3x3 size={14} style={{ color: accent }} />
                      <span className="font-bold text-sm" style={{ color: text }}>Browse by Category</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {ALL_CAT_KEYS.map((key, i) => {
                        const cs = CAT_STYLE[key];
                        const count = locationScrapedBusinesses.filter(b => bizKey(b) === key).length;
                        if (!cs) return null;
                        return (
                          <motion.button
                            key={key}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03 }}
                            whileTap={{ scale: 0.91 }}
                            onClick={() => { setTab('nearby'); setFilterCat(key); }}
                            className="rounded-2xl overflow-hidden shadow-sm"
                            style={{ aspectRatio: '1', background: cs.bg, position: 'relative' }}
                          >
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.14) 0%,transparent 55%)' }} />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2">
                              <span className="text-3xl drop-shadow">{cs.emoji}</span>
                              <p className="text-white text-[9px] font-bold text-center leading-tight line-clamp-2 drop-shadow">{cs.label}</p>
                              {count > 0 && (
                                <span className="bg-white/20 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                                  {count}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explore map CTA */}
                  <div className="px-4 py-2">
                    <button
                      onClick={() => { onClose(); navigate('/'); }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                      style={{
                        background: 'linear-gradient(135deg,#ff6b35,#e040fb)',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(255,107,53,0.35)',
                      }}
                    >
                      <Map size={16} />
                      View All on Map
                      <ChevronRight size={16} />
                    </button>
                  </div>

                </div>
              )}

            </div>{/* end scrollable */}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

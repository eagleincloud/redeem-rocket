import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  Search,
  Navigation,
  Bell,
  LogOut,
  Settings,
  Building2,
  ChevronDown,
  IndianRupee,
  Sun,
  Moon,
} from 'lucide-react';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { useOrders } from '../context/OrdersContext';
import { useWallet } from '../context/WalletContext';
import { useTheme } from '../context/ThemeContext';
import { searchPlaces, type NominatimResult } from '../api/nominatim';
import type { Business } from '../types';

const HEADER_HEIGHT = 116;

// ── shared dropdown glass styles ──────────────────────────────────────────────
const DROPDOWN_CLS =
  'absolute right-0 top-full mt-2 rounded-2xl border shadow-2xl z-50 overflow-hidden';

export function AppHeader() {
  const navigate = useNavigate();
  const {
    searchQuery, setSearchQuery,
    category, setCategory,
    setMapCenter, setUserLocation, setSavedLocation,
    setIsPlacingPin,
    categories,
    geofenceRadiusKm, setGeofenceRadiusKm, geofenceOptionsKm,
    locationScrapedBusinesses, locationBusinesses,
  } = useSearchCategory();
  const { balance: walletBalance } = useWallet();
  const { orders } = useOrders();
  const { isDark, toggleTheme } = useTheme();

  const [profileOpen,         setProfileOpen]         = useState(false);
  const [locationOpen,        setLocationOpen]        = useState(false);
  const [searchInput,         setSearchInput]         = useState('');
  const [searchDropdownOpen,  setSearchDropdownOpen]  = useState(false);
  const [placeResults,        setPlaceResults]        = useState<NominatimResult[]>([]);
  const [placesLoading,       setPlacesLoading]       = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSearchInput(searchQuery); }, [searchQuery]);

  // Debounced Nominatim search
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) { setPlaceResults([]); setPlacesLoading(false); return; }
    setPlacesLoading(true);
    const t = setTimeout(async () => {
      try { setPlaceResults(await searchPlaces(q)); }
      catch { setPlaceResults([]); }
      finally { setPlacesLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const businessResults = useMemo(() => {
    const q = searchInput.trim();
    if (!q) return [];
    return locationScrapedBusinesses.length > 0 ? locationScrapedBusinesses : locationBusinesses;
  }, [searchInput, locationScrapedBusinesses, locationBusinesses]);

  const showDropdown =
    searchDropdownOpen &&
    (searchInput.length >= 1 || placeResults.length > 0 || businessResults.length > 0 || placesLoading);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node))
        setSearchDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectPlace = useCallback((place: NominatimResult) => {
    const lat = parseFloat(place.lat), lng = parseFloat(place.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    setSavedLocation({ lat, lng, label: place.display_name });
    setMapCenter({ lat, lng });
    setSearchInput(''); setSearchQuery(''); setSearchDropdownOpen(false); setPlaceResults([]);
    navigate('/');
  }, [setMapCenter, setSavedLocation, setSearchQuery, navigate]);

  const handleSelectBusiness = useCallback((business: Business) => {
    setMapCenter({ lat: business.location.lat, lng: business.location.lng });
    setSearchInput(''); setSearchQuery(''); setSearchDropdownOpen(false);
    navigate('/', { state: { highlightBusiness: business } });
  }, [setMapCenter, setSearchQuery, navigate]);

  const unreadCount  = 1;
  const ordersCount  = orders.length;
  const badgeCount   = unreadCount + (ordersCount > 0 ? 1 : 0);

  const handleMyLocation = () => {
    setLocationOpen(false);
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSavedLocation(null);
        setMapCenter(loc);
        setUserLocation(loc);
        // Tell the map to fly to this location and show the pin
        window.dispatchEvent(new CustomEvent('geo:flyto', { detail: loc }));
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handleSetLocationOnMap = () => { setLocationOpen(false); setIsPlacingPin(true); navigate('/'); };
  const handleSignOut = () => { localStorage.removeItem('user'); setProfileOpen(false); navigate('/login'); };
  const handleProfileManager = () => { setProfileOpen(false); navigate('/profile'); };

  // ── Section label inside dropdowns ──────────────────────────────────────────
  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)', color: 'var(--text3)' }}>
      <p className="text-[10px] font-bold uppercase tracking-widest">{children}</p>
    </div>
  );

  // ── Dropdown row button ──────────────────────────────────────────────────────
  const DropRow = ({ icon, label, sub, onClick, danger = false }: {
    icon: React.ReactNode; label: string; sub?: React.ReactNode;
    onClick: () => void; danger?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
      style={{ color: danger ? 'var(--red)' : 'var(--text)' }}
      onMouseEnter={e => (e.currentTarget.style.background = danger ? 'rgba(255,77,109,0.08)' : 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      <span style={{ color: danger ? 'var(--red)' : 'var(--text2)' }}>{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {sub}
    </button>
  );

  const headerBg = isDark ? 'rgba(10,10,15,0.92)' : 'rgba(248,248,252,0.95)';
  const DROPDOWN_STYLE = {
    background: isDark ? 'rgba(17,17,24,0.97)' : 'rgba(255,255,255,0.98)',
    borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        height: HEADER_HEIGHT,
        background: headerBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderColor: 'var(--border)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* ── Row 1: logo · search · icons ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 h-14">

        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center shrink-0"
          aria-label="Home"
        >
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 44, width: 'auto', objectFit: 'contain' }} />
        </button>

        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-[300px] sm:max-w-sm mx-2" ref={searchDropdownRef}>
          <div
            className="relative flex items-center gap-2 rounded-2xl px-3 h-9 border transition-all"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            onFocus={() => {}}
          >
            <Search size={15} style={{ color: 'var(--text3)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search place or business…"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setSearchQuery(e.target.value); setSearchDropdownOpen(true); }}
              onFocus={() => setSearchDropdownOpen(true)}
              onKeyDown={e => e.key === 'Escape' && setSearchDropdownOpen(false)}
              className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
              style={{ color: 'var(--text)', fontFamily: 'var(--font-b)' }}
            />
          </div>

          {/* Search dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className={`${DROPDOWN_CLS} left-0 max-h-72 overflow-y-auto`}
                style={{ ...DROPDOWN_STYLE, width: '100%' }}
              >
                {placesLoading && (
                  <div className="px-4 py-3 text-sm" style={{ color: 'var(--text2)' }}>Searching…</div>
                )}
                {!placesLoading && placeResults.length > 0 && (
                  <>
                    <SectionLabel>Places</SectionLabel>
                    {placeResults.map(p => (
                      <button
                        key={p.place_id}
                        type="button"
                        onClick={() => handleSelectPlace(p)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <MapPin size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span className="truncate" style={{ color: 'var(--text2)' }}>{p.display_name}</span>
                      </button>
                    ))}
                  </>
                )}
                {businessResults.length > 0 && (
                  <>
                    <SectionLabel>Businesses</SectionLabel>
                    {businessResults.slice(0, 8).map(b => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBusiness(b)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                        style={{ color: 'var(--text)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Building2 size={14} style={{ color: 'var(--blue)', flexShrink: 0 }} />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold truncate block">{b.name}</span>
                          <span className="text-xs truncate block" style={{ color: 'var(--text3)' }}>
                            {b.category}{b.address ? ` · ${b.address}` : ''}
                          </span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                {!placesLoading && placeResults.length === 0 && businessResults.length === 0 && searchInput.trim().length >= 2 && (
                  <div className="px-4 py-3 text-sm" style={{ color: 'var(--text3)' }}>No results found</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Icon buttons */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">

          {/* Theme toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.88 }}
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
            style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span key="sun" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <Sun size={16} style={{ color: 'var(--accent3)' }} />
                </motion.span>
              ) : (
                <motion.span key="moon" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.18 }}>
                  <Moon size={16} style={{ color: 'var(--accent)' }} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Location */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setLocationOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}
              title="Location"
            >
              <MapPin size={16} />
            </button>
            <AnimatePresence>
              {locationOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden onClick={() => setLocationOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: .96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: .96 }}
                    transition={{ duration: 0.15 }}
                    className={`${DROPDOWN_CLS} w-60`}
                    style={DROPDOWN_STYLE}
                  >
                    <SectionLabel>Location</SectionLabel>
                    <DropRow icon={<Navigation size={15} />} label="Use current location" onClick={handleMyLocation} />
                    <DropRow icon={<MapPin size={15} />} label="Set on map" onClick={handleSetLocationOnMap} />
                    <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text3)' }}>
                        Nearby radius
                      </p>
                      <div className="flex gap-1.5 flex-wrap">
                        {geofenceOptionsKm.map(km => (
                          <button
                            key={km}
                            type="button"
                            onClick={() => setGeofenceRadiusKm(km)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                            style={{
                              background: geofenceRadiusKm === km ? 'var(--accent)' : 'var(--card2)',
                              color:      geofenceRadiusKm === km ? '#fff' : 'var(--text2)',
                              boxShadow:  geofenceRadiusKm === km ? '0 4px 12px rgba(255,107,53,.3)' : 'none',
                            }}
                          >
                            {km === 20 ? 'All' : `${km} km`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative">
            <motion.button
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => navigate('/notifications')}
              className="w-9 h-9 flex items-center justify-center rounded-xl border relative transition-all"
              style={{ background: 'var(--card)', borderColor: 'var(--border)', color: 'var(--text2)' }}
              title="Notifications"
            >
              <Bell size={16} />
              {badgeCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[9px] font-bold text-white border-2"
                  style={{ background: 'var(--accent)', borderColor: 'var(--bg)' }}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </motion.span>
              )}
            </motion.button>
          </div>

          {/* Profile */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen(v => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-xl border transition-all font-display text-sm font-bold"
              style={{
                background: profileOpen ? 'var(--accent)' : 'var(--card)',
                borderColor: profileOpen ? 'var(--accent)' : 'var(--border)',
                color: profileOpen ? '#fff' : 'var(--text2)',
                fontFamily: 'var(--font-d)',
              }}
              title="Profile"
            >
              RK
            </button>
            <AnimatePresence>
              {profileOpen && (
                <>
                  <div className="fixed inset-0 z-40" aria-hidden onClick={() => setProfileOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: .96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: .96 }}
                    transition={{ duration: 0.15 }}
                    className={`${DROPDOWN_CLS} w-52`}
                    style={DROPDOWN_STYLE}
                  >
                    <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-d)', color: 'var(--text)' }}>Rahul Kumar</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Gold Member</p>
                    </div>
                    <DropRow icon={<Settings size={15} />} label="Profile Manager" onClick={handleProfileManager} />
                    <DropRow icon={<LogOut size={15} />} label="Sign out" onClick={handleSignOut} danger />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Row 2: categories + wallet ────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 border-t"
        style={{ height: 52, borderColor: 'var(--border)' }}
      >
        {/* Category pills */}
        <div className="flex-1 min-w-0 overflow-x-auto scrollbar-hide flex items-center gap-1.5">
          {categories.map(cat => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap transition-all border"
                style={{
                  background:   active ? 'var(--accent)' : 'var(--card)',
                  borderColor:  active ? 'var(--accent)' : 'var(--border)',
                  color:        active ? '#fff' : 'var(--text2)',
                  boxShadow:    active ? '0 4px 14px rgba(255,107,53,0.30)' : 'none',
                  fontFamily:   'var(--font-b)',
                }}
              >
                {cat === 'all' ? '🌟 All' : cat}
              </button>
            );
          })}
        </div>

        {/* Wallet pill */}
        <button
          type="button"
          onClick={() => navigate('/wallet')}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border transition-all"
          style={{
            background:   'rgba(0,214,143,0.10)',
            borderColor:  'rgba(0,214,143,0.25)',
            color:        'var(--green)',
          }}
        >
          <IndianRupee size={15} />
          <span className="text-sm font-bold" style={{ fontFamily: 'var(--font-d)' }}>
            {Math.max(0, walletBalance).toFixed(0)}
          </span>
          <ChevronDown size={12} style={{ color: 'var(--text3)' }} />
        </button>
      </div>
    </header>
  );
}

export const APP_HEADER_HEIGHT = HEADER_HEIGHT;

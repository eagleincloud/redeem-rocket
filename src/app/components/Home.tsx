import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Crosshair, X, Navigation2, Camera, ScanLine, Lock, Unlock, Plus, Minus, MapPin, Route, ChevronRight } from 'lucide-react';
import '../leaflet-global';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MapBusinessPopup } from './MapBusinessPopup';
import { MapBusinessSheet } from './MapBusinessSheet';
import type { Business } from '../types';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { useTheme } from '../context/ThemeContext';
import { getBusinessTypeKey } from '../utils/businessType';
import { fetchOSRMRoute, fetchOSRMTour } from '../api/osrm-route';
import { astarOptimalRoute } from '../utils/astar';
import { distanceKm } from '../utils/geo';

// ─── Category colours & emoji ─────────────────────────────────────────────────
const CATEGORY_STYLE: Record<string, { bg: string; shadow: string; emoji: string }> = {
  restaurant: { bg: '#f97316', shadow: 'rgba(249,115,22,.40)', emoji: '🍔' },
  grocery:    { bg: '#16a34a', shadow: 'rgba(22,163,74,.40)',  emoji: '🛒' },
  pharmacy:   { bg: '#2563eb', shadow: 'rgba(37,99,235,.40)',  emoji: '💊' },
  salon:      { bg: '#db2777', shadow: 'rgba(219,39,119,.40)', emoji: '💇' },
  hotel:      { bg: '#7c3aed', shadow: 'rgba(124,58,237,.40)', emoji: '🏨' },
  atm:        { bg: '#ca8a04', shadow: 'rgba(202,138,4,.40)',  emoji: '🏧' },
  other:      { bg: '#475569', shadow: 'rgba(71,85,105,.35)',  emoji: '🏪' },
};

function getCatStyle(typeKey: string) {
  return CATEGORY_STYLE[typeKey] ?? CATEGORY_STYLE.other;
}

// ─── Tile URL helpers ─────────────────────────────────────────────────────────
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
// Positron (light_all) — clean near-white base, much closer to Apple Maps than Voyager
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR  = '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>';

// ─── All custom map CSS injected once ─────────────────────────────────────────
const MAP_CSS = `
/* ── Leaflet container overrides ─────────────────────────────────── */
.leaflet-div-icon { background: transparent !important; border: none !important; }
/* Apple Maps–style frosted attribution chip */
.leaflet-control-attribution {
  font-size: 9px !important; opacity: .5;
  background: rgba(255,255,255,0.70) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  border-radius: 6px !important;
  padding: 2px 6px !important;
  border: none !important;
  box-shadow: none !important;
}
.leaflet-control-zoom { display: none !important; }

/* Cap Leaflet pane z-indexes low so React overlays (z-800+) always win */
.leaflet-pane             { z-index: auto; }
.leaflet-tile-pane        { z-index: 2   !important; }
.leaflet-overlay-pane     { z-index: 3   !important; }
.leaflet-shadow-pane      { z-index: 4   !important; }
.leaflet-marker-pane      { z-index: 5   !important; }
.leaflet-tooltip-pane     { z-index: 6   !important; }
.leaflet-popup-pane       { z-index: 7   !important; }
.leaflet-control-container { z-index: 8  !important; }

/* ── Dark mode: cool navy-blue — lifted brightness so streets are legible ──
   brightness(1.10) brightens the dark_all tiles so roads/labels are
   clearly visible → saturate(0.70) keeps road colour contrast →
   hue-rotate(188deg) shifts the palette toward cool navy-blue →
   contrast(0.95) softens harsh edges for a cleaner look          */
.brand-map-dark .leaflet-tile-pane {
  filter: brightness(1.10) saturate(0.70) hue-rotate(188deg) contrast(0.95);
}

/* ── Apple Maps light mode: warm cream tone on Positron tiles ─────
   sepia(0.08) adds just enough warmth → saturate(0.80) softens
   Positron's slightly cool grays → brightness(1.03) & contrast(1.04)
   bring out road hierarchy cleanly, matching Apple's #faf8f3 canvas */
.apple-map-light .leaflet-tile-pane {
  filter: sepia(0.08) saturate(0.80) brightness(1.03) contrast(1.04);
}

/* ── Current location pulsing dot ───────────────────────────── */
.cl-wrap {
  position: relative; width: 44px; height: 44px;
}
/* Prominent blue location dot — larger, with label */
.cl-dot {
  width: 20px; height: 20px;
  background: #147EFB; border: 3.5px solid #fff;
  border-radius: 50%; position: absolute;
  top: 50%; left: 50%; transform: translate(-50%,-50%);
  box-shadow: 0 0 0 3px rgba(20,126,251,.35), 0 3px 16px rgba(20,126,251,.8);
  z-index: 3;
}
.cl-dot::after {
  content: '';
  position: absolute; inset: -5px;
  border-radius: 50%;
  border: 2px solid rgba(20,126,251,.55);
  animation: cl-border-pulse 1.6s ease-out infinite;
}
.cl-label {
  position: absolute;
  bottom: -20px; left: 50%; transform: translateX(-50%);
  white-space: nowrap;
  font-size: 10px; font-weight: 700; color: #147EFB;
  background: rgba(255,255,255,.92);
  padding: 1px 5px; border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,.18);
  pointer-events: none;
}
.cl-ring {
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(20,126,251,.15);
  position: absolute; top: 0; left: 0;
  animation: cl-pulse 2.4s ease-out infinite;
}
.cl-ring2 { animation-delay: 1s; }
@keyframes cl-pulse {
  0%  { transform: scale(.3); opacity: 1; }
  100%{ transform: scale(1.7); opacity: 0; }
}
@keyframes cl-border-pulse {
  0%  { transform: scale(1); opacity: .8; }
  50% { transform: scale(1.45); opacity: .3; }
  100%{ transform: scale(1); opacity: .8; }
}

/* ── Business map pin (teardrop / Google Maps style) ─────────── */
.biz-pin {
  position: relative;
  cursor: pointer;
  transition: transform .22s cubic-bezier(.34,1.56,.64,1), filter .22s ease;
  animation: pin-drop .32s cubic-bezier(.34,1.56,.64,1);
}
.biz-pin:hover {
  transform: translateY(-7px) scale(1.12);
  filter: brightness(1.06) saturate(1.08);
}
@keyframes pin-drop {
  from { transform: scale(0.35) translateY(-14px); opacity: 0; }
  60%  { transform: scale(1.06) translateY(2px);   opacity: 1; }
  to   { transform: scale(1)    translateY(0);     opacity: 1; }
}

/* ── Business pill marker (selected) ────────────────────────── */
.biz-pill {
  display: inline-flex; align-items: center; gap: 5px;
  border-radius: 999px; padding: 6px 11px 6px 7px;
  cursor: pointer; white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: transform .18s ease;
  animation: pill-pop .28s cubic-bezier(.34,1.56,.64,1);
}
@keyframes pill-pop {
  from { transform: scale(.6) translateY(6px); opacity: 0; }
  to   { transform: scale(1)  translateY(0);   opacity: 1; }
}
.biz-pill-ico  { font-size: 14px; line-height: 1; }
.biz-pill-name {
  font-size: 12px; font-weight: 700; color: #fff;
  letter-spacing: -.01em; max-width: 100px;
  overflow: hidden; text-overflow: ellipsis;
}
.biz-pill-badge {
  background: rgba(255,255,255,.28); border-radius: 999px;
  padding: 2px 7px; font-size: 10px; font-weight: 800;
  color: #fff; margin-left: 2px;
}

/* ── Strip ALL default MarkerCluster styling (prevents offer-badge look) ─ */
.marker-cluster-small,
.marker-cluster-medium,
.marker-cluster-large { background: transparent !important; }
.marker-cluster-small div,
.marker-cluster-medium div,
.marker-cluster-large div { background: transparent !important; }
.marker-cluster span { display: none !important; }

/* ── Cluster bubble — shows category emojis + count ──────────────────────── */
.biz-cluster {
  display: flex; align-items: center; justify-content: center;
  flex-direction: column; gap: 1px;
  border-radius: 50%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  transition: transform .18s ease;
}
.biz-cluster:hover { transform: scale(1.1); }
.biz-cluster-sm { width: 46px; height: 46px;
  background: linear-gradient(135deg,#4f46e5,#7c3aed);
  box-shadow: 0 4px 14px rgba(79,70,229,.45), 0 0 0 3px rgba(255,255,255,.65); }
.biz-cluster-md { width: 58px; height: 58px;
  background: linear-gradient(135deg,#0891b2,#0d9488);
  box-shadow: 0 4px 18px rgba(8,145,178,.40), 0 0 0 3px rgba(255,255,255,.65); }
.biz-cluster-lg { width: 70px; height: 70px;
  background: linear-gradient(135deg,#2563eb,#4f46e5);
  box-shadow: 0 6px 20px rgba(37,99,235,.40), 0 0 0 3px rgba(255,255,255,.65); }
.biz-cluster-emojis {
  display: flex; align-items: center; justify-content: center; gap: 1px; line-height: 1;
}
.biz-cluster-count {
  color: #fff; font-weight: 900; line-height: 1;
}

/* ── Route info pill — Apple Maps info-bubble style ─────────── */
.route-pill {
  background: var(--card, rgba(255,255,255,0.96));
  border-radius: 999px; padding: 8px 18px;
  box-shadow: 0 4px 20px rgba(0,0,0,.16), 0 0 0 1px rgba(28,126,214,.15);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  display: inline-flex; align-items: center; gap: 10px;
  border: 1.5px solid rgba(28,126,214,.28);
  white-space: nowrap; pointer-events: none;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.route-pill-stat { font-size: 13px; font-weight: 700; color: var(--text, #1e293b); }
.route-pill-sep  { color: var(--border2, #cbd5e1); font-size: 13px; }

/* ── Business name floating label (Leaflet tooltip) ─────────── */
.leaflet-tooltip.biz-label {
  background: rgba(10, 15, 35, 0.86);
  border: none;
  border-radius: 9px;
  padding: 4px 10px;
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  white-space: nowrap;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 3px 14px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08);
  letter-spacing: -0.01em;
  pointer-events: none;
  transition: opacity 0.12s ease;
}
/* Hide the default tooltip arrow */
.leaflet-tooltip.biz-label::before { display: none !important; }

/* ── Premium pin: gold star badge ───────────────────────────── */
.biz-pin-premium-star {
  position: absolute; top: -6px; right: -6px;
  font-size: 11px; line-height: 1;
  pointer-events: none;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.55));
  z-index: 2;
}

/* ── Offer badge pill below pin ──────────────────────────────── */
.biz-offer-pill {
  display: block; text-align: center;
  background: linear-gradient(135deg,#f97316,#fb923c);
  color: #fff; font-size: 10px; font-weight: 800;
  border-radius: 999px; padding: 2px 7px;
  margin-top: 3px; white-space: nowrap;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  box-shadow: 0 2px 8px rgba(249,115,22,0.50);
  pointer-events: none; line-height: 1.4;
  border: 1px solid rgba(255,255,255,0.35);
}

/* ── HUD corner bracket pulse ────────────────────────────────── */
@keyframes corner-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.55; }
}
.map-corner { animation: corner-pulse 4s ease-in-out infinite; }

/* ── Multi-route: animated dashes along route lines ─────────── */
@keyframes dash-flow {
  to { stroke-dashoffset: -30; }
}
.route-dash-anim path {
  stroke-dasharray: 10 6;
  animation: dash-flow 0.7s linear infinite;
}

/* ── Multi-route: numbered waypoint badge ────────────────────── */
.stop-badge {
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; font-weight: 900;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #fff; border: 2.5px solid rgba(255,255,255,0.9);
  box-shadow: 0 3px 12px rgba(0,0,0,0.35);
  line-height: 1;
  animation: pin-drop .32s cubic-bezier(.34,1.56,.64,1);
}

/* ── Multi-route strip scroll ────────────────────────────────── */
.tour-strip::-webkit-scrollbar { display: none; }
.tour-strip { -ms-overflow-style: none; scrollbar-width: none; }
`;

const DEFAULT_CENTER: [number, number] = [22.7196, 75.8577];
const DEFAULT_ZOOM = 15;

// ─── Multi-route tour stop type ───────────────────────────────────────────────
interface TourStop {
  biz: Business;
  color: string;
  segDistKm: number;
  segTimeMin: number;
  cumDistKm: number;
}

// ─── Multi-route: per-segment colours (rainbow spectrum) ─────────────────────
const TOUR_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow-500
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
] as const;

// Max businesses used in tour (OSRM rate + A* perf)
const TOUR_MAX_STOPS = 8;

// ─── Rotating highlight messages ─────────────────────────────────────────────
const STATIC_HIGHLIGHTS = [
  { icon: '⚡', line1: 'Auctions live now!', line2: 'Bid & win great deals' },
  { icon: '🎯', line1: 'Shop. Earn. Repeat.', line2: 'Cashback on every purchase' },
  { icon: '🚀', line1: 'New shops on the map!', line2: 'Explore what\'s nearby' },
];

// ─── Zoom → pin dimensions ────────────────────────────────────────────────────
// SVG viewBox is 36×48. Pin head circle: cx=18 cy=17 r=11. Tip at y=46.
function pinSizeFromZoom(zoom: number): { pw: number; ph: number; emSz: number } {
  const sc =
    zoom <= 10 ? 0.50 :
    zoom <= 11 ? 0.60 :
    zoom <= 12 ? 0.70 :
    zoom <= 13 ? 0.82 :
    zoom <= 14 ? 0.91 :
    zoom <= 15 ? 1.00 :
    zoom <= 16 ? 1.12 :
    zoom <= 17 ? 1.24 : 1.38;
  return {
    pw:   Math.round(36 * sc),
    ph:   Math.round(48 * sc),
    emSz: Math.round(15 * sc),
  };
}

export function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const multiRouteLayerRef = useRef<L.LayerGroup | null>(null);
  const navigationTargetRef = useRef<Business | null>(null);
  const routeOriginRef = useRef<{ lat: number; lng: number } | null>(null);
  const clearRouteRef = useRef<() => void>(() => {});

  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const isDarkRef = useRef(isDark);
  useEffect(() => { isDarkRef.current = isDark; }, [isDark]);

  const {
    mapCenter,
    userLocation,
    savedLocation,
    setMapCenter,
    setUserLocation,
    setSavedLocation,
    setIsPlacingPin,
    isPlacingPin,
    setMapViewportQuery,
    locationScrapedBusinesses,
    viewportLoading,
  } = useSearchCategory();

  const [selectedBusinesses, setSelectedBusinesses] = useState<Business[] | null>(null);
  const [navigationTarget, setNavigationTarget] = useState<Business | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distanceKm: number; timeMinutes: number } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [visibleCats, setVisibleCats] = useState<{ emoji: string; count: number }[]>([]);
  const [locating, setLocating] = useState(false);
  const [camToast, setCamToast] = useState(false);
  const [zoomLocked, setZoomLocked] = useState(false);
  const [pinSetToast, setPinSetToast] = useState(false);
  const [mapZoom, setMapZoom] = useState(15);

  // ── Multi-route (A* tour) state ───────────────────────────────────────────
  const [multiRouteMode, setMultiRouteMode]     = useState(false);
  const [multiRouteLoading, setMultiRouteLoading] = useState(false);
  const [tourStops, setTourStops]               = useState<TourStop[]>([]);
  const [tourTotalKm, setTourTotalKm]           = useState(0);
  const [tourTotalMin, setTourTotalMin]         = useState(0);

  // ── Broadcast nav target to Root.tsx via custom event ─────────────────────────
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('geo:navtarget', { detail: navigationTarget }));
  }, [navigationTarget]);

  // ── Listen for "fly to location" events from AppHeader / OfferSlotsPanel ───────
  useEffect(() => {
    const handler = (e: Event) => {
      const loc = (e as CustomEvent<{ lat: number; lng: number }>).detail;
      if (!loc || !Number.isFinite(loc.lat) || !Number.isFinite(loc.lng)) return;
      mapRef.current?.flyTo([loc.lat, loc.lng], 16, { duration: 0.9, easeLinearity: 0.25 });
    };
    window.addEventListener('geo:flyto', handler);
    return () => window.removeEventListener('geo:flyto', handler);
  }, []);

  // ── Listen for "open business popup" events from OfferSlotsPanel ────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const biz = (e as CustomEvent<Business>).detail;
      if (!biz) return;
      setSelectedBusinesses([biz]);
    };
    window.addEventListener('geo:openbiz', handler);
    return () => window.removeEventListener('geo:openbiz', handler);
  }, []);

  // ── Zoom lock: disable/enable user interactions ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (zoomLocked) {
      map.scrollWheelZoom.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.keyboard.disable();
    } else {
      map.scrollWheelZoom.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.keyboard.enable();
    }
  }, [zoomLocked]);

  // ── "Set on map" pin placement: intercept map click ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!isPlacingPin) {
      map.getContainer().style.cursor = '';
      return;
    }
    map.getContainer().style.cursor = 'crosshair';
    const onMapClick = (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      setSavedLocation({ lat, lng, label: `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}` });
      setMapCenter({ lat, lng });
      setIsPlacingPin(false);
      map.getContainer().style.cursor = '';
      setPinSetToast(true);
      setTimeout(() => setPinSetToast(false), 2500);
    };
    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [isPlacingPin, setSavedLocation, setMapCenter, setIsPlacingPin]);

  // ── Rotating top-right highlight ─────────────────────────────────────────────
  const [hlIdx, setHlIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHlIdx(i => (i + 1) % 99), 3800);
    return () => clearInterval(t);
  }, []);

  // ── Cashback stats from nearby businesses ─────────────────────────────────────
  const cashbackStats = useMemo(() => {
    let maxCashback = 0;
    let offerCount = 0;
    const bizSet = new Set<string>();
    for (const biz of locationScrapedBusinesses) {
      const approved = biz.offers?.filter(o => !o.status || o.status === 'approved') ?? [];
      if (!approved.length) continue;
      offerCount += approved.length;
      bizSet.add(biz.id);
      for (const offer of approved) {
        if (offer.price && offer.discount > 0) {
          maxCashback += Math.max(1, Math.floor((offer.price * offer.discount / 100) / 2));
        } else if (offer.discount > 0) {
          maxCashback += Math.max(1, Math.floor(offer.discount / 2));
        }
      }
    }
    return { maxCashback, offerCount, bizCount: bizSet.size };
  }, [locationScrapedBusinesses]);

  // Build highlights array with live data
  const highlights = useMemo(() => [
    cashbackStats.offerCount > 0
      ? { icon: '💰', line1: `Earn up to ₹${cashbackStats.maxCashback} today`, line2: `${cashbackStats.offerCount} active deals nearby` }
      : { icon: '💰', line1: 'Cashback on every purchase', line2: 'Shop nearby & earn ₹' },
    cashbackStats.bizCount > 0
      ? { icon: '🏪', line1: `${cashbackStats.bizCount} shops with offers`, line2: 'Tap a pin to see deals' }
      : { icon: '🏪', line1: 'Shops near you', line2: 'Tap any pin to explore' },
    ...STATIC_HIGHLIGHTS,
  ], [cashbackStats.maxCashback, cashbackStats.offerCount, cashbackStats.bizCount]);

  const currentHL = highlights[hlIdx % highlights.length];

  // ── Inject CSS once ──────────────────────────────────────────────────────────
  useEffect(() => {
    const id = 'geo-map-v5-css';
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = MAP_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // ── Open from header search ──────────────────────────────────────────────────
  const highlightBusiness = (location.state as { highlightBusiness?: Business } | null)?.highlightBusiness;
  useEffect(() => {
    if (!highlightBusiness) return;
    setSelectedBusinesses([highlightBusiness]);
    setMapCenter({ lat: highlightBusiness.location.lat, lng: highlightBusiness.location.lng });
    mapRef.current?.setView(
      [highlightBusiness.location.lat, highlightBusiness.location.lng],
      Math.max(15, mapRef.current?.getZoom() ?? 15)
    );
    navigate(location.pathname, { replace: true, state: {} });
  }, [highlightBusiness?.id, setMapCenter, navigate, location.pathname]);

  // ── FIX: User marker position ONLY tracks real GPS / saved location ─────────
  const userMarkerPos = useMemo(() => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    if (savedLocation) return { lat: savedLocation.lat, lng: savedLocation.lng };
    return null;
  }, [
    userLocation?.lat, userLocation?.lng,
    savedLocation?.lat, savedLocation?.lng,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  const routeOriginPos = useMemo(() => {
    if (userLocation) return { lat: userLocation.lat, lng: userLocation.lng };
    if (savedLocation) return { lat: savedLocation.lat, lng: savedLocation.lng };
    return { lat: mapCenter.lat, lng: mapCenter.lng };
  }, [userLocation?.lat, userLocation?.lng, savedLocation?.lat, savedLocation?.lng, mapCenter.lat, mapCenter.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Init Leaflet map ─────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const initialCenter: [number, number] = [
      savedLocation?.lat ?? userLocation?.lat ?? DEFAULT_CENTER[0],
      savedLocation?.lng ?? userLocation?.lng ?? DEFAULT_CENTER[1],
    ];

    const map = L.map(container, { zoomControl: false, attributionControl: true })
      .setView(initialCenter, DEFAULT_ZOOM);

    const tileLayer = L.tileLayer(isDarkRef.current ? TILE_DARK : TILE_LIGHT, {
      subdomains: 'abcd', maxZoom: 20, attribution: TILE_ATTR,
    });
    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // ── Pulsing brand-colored location marker ──────────────────────────────────
    const locIcon = L.divIcon({
      className: '',
      html: `<div class="cl-wrap">
        <div class="cl-ring"></div>
        <div class="cl-ring cl-ring2"></div>
        <div class="cl-dot"></div>
        <span class="cl-label">You</span>
      </div>`,
      iconSize: [44, 64],
      iconAnchor: [22, 22],
    });
    // Only show marker immediately if we have a real known location at init time
    const initHasLocation = !!(savedLocation || userLocation);
    const userMarker = L.marker(initialCenter, {
      icon: locIcon,
      zIndexOffset: 1000,
      opacity: initHasLocation ? 1 : 0,
    }).addTo(map);
    userMarkerRef.current = userMarker;

    // ── Marker cluster group ───────────────────────────────────────────────────
    const clusterGroup = (L as unknown as {
      markerClusterGroup: (o?: object) => L.MarkerClusterGroup
    }).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 55,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster: { getChildCount: () => number; getAllChildMarkers: () => L.Marker[] }) => {
        const count = cluster.getChildCount();
        // Tally category emojis from child markers
        const children = cluster.getAllChildMarkers() as Array<L.Marker & { _bizEmoji?: string; _bizPremium?: boolean }>;
        const tally: Record<string, number> = {};
        let hasPremium = false;
        for (const m of children) {
          const e = m._bizEmoji ?? '🏪';
          tally[e] = (tally[e] ?? 0) + 1;
          if (m._bizPremium) hasPremium = true;
        }
        const topEmojis = Object.entries(tally)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([e]) => e);

        const cls = count < 10 ? 'biz-cluster-sm' : count < 40 ? 'biz-cluster-md' : 'biz-cluster-lg';
        const size = count < 10 ? 46 : count < 40 ? 58 : 70;
        const emojiSize = count < 10 ? 15 : count < 40 ? 14 : 16;
        const countSize = count < 10 ? 10 : count < 40 ? 11 : 13;

        const emojiHtml = topEmojis
          .map(e => `<span style="font-size:${emojiSize}px">${e}</span>`)
          .join('');

        // Premium clusters get a gold outer ring
        const premiumStyle = hasPremium
          ? `box-shadow:0 4px 18px rgba(245,158,11,.55),0 0 0 3px #f59e0b;`
          : '';
        const premiumBadge = hasPremium
          ? `<span style="position:absolute;top:-5px;right:-5px;font-size:10px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))">⭐</span>`
          : '';

        return L.divIcon({
          html: `<div class="biz-cluster ${cls}" style="position:relative;${premiumStyle}">
            <div class="biz-cluster-emojis">${emojiHtml}</div>
            <span class="biz-cluster-count" style="font-size:${countSize}px">${count}</span>
            ${premiumBadge}
          </div>`,
          className: '',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
    clusterGroup.addTo(map);
    clusterGroupRef.current = clusterGroup;

    const updateViewportCount = () => {
      const b = map.getBounds();
      const visible = bizRef.current.filter(
        (biz) =>
          biz.location.lat >= b.getSouth() &&
          biz.location.lat <= b.getNorth() &&
          biz.location.lng >= b.getWest() &&
          biz.location.lng <= b.getEast()
      );
      const tally: Record<string, { emoji: string; count: number }> = {};
      for (const biz of visible) {
        const key = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.subcategory ?? biz.name);
        const { emoji } = getCatStyle(key);
        tally[emoji] = { emoji, count: (tally[emoji]?.count ?? 0) + 1 };
      }
      setVisibleCats(Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 4));
    };

    const onMoveEnd = () => {
      const c = map.getCenter();
      setMapCenter({ lat: c.lat, lng: c.lng });
      setMapViewportQuery({ bounds: null, zoom: map.getZoom(), userInteracted: true });
      setMapZoom(map.getZoom());
      updateViewportCount();
    };
    map.on('moveend', onMoveEnd);
    // Store so marker effect can call it too
    (map as unknown as Record<string, unknown>).__updateViewportCount = updateViewportCount;
    mapRef.current = map;

    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(container);

    return () => {
      map.off('moveend', onMoveEnd);
      if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
      clusterGroup.clearLayers(); clusterGroup.remove(); clusterGroupRef.current = null;
      userMarker.remove(); userMarkerRef.current = null;
      tileLayerRef.current = null;
      ro.disconnect(); map.remove(); mapRef.current = null;
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swap tile + filter class on theme change ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) map.removeLayer(tileLayerRef.current);
    const tl = L.tileLayer(isDark ? TILE_DARK : TILE_LIGHT, {
      subdomains: 'abcd', maxZoom: 20, attribution: TILE_ATTR,
    });
    tl.addTo(map);
    tileLayerRef.current = tl;
  }, [isDark]);

  // ── Keep user marker at real GPS position — hide until GPS is known ───────────
  useEffect(() => {
    const marker = userMarkerRef.current;
    if (!marker) return;
    if (!userMarkerPos) {
      marker.setOpacity(0);
      return;
    }
    marker.setLatLng([userMarkerPos.lat, userMarkerPos.lng]);
    marker.setOpacity(1);
  }, [userMarkerPos?.lat, userMarkerPos?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Restrict map panning to 50 km radius around user location ────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = userLocation ?? savedLocation;
    if (!center) return;
    // 50 km in degrees: lat ≈ 0.4497°, lng varies by latitude
    const LAT_DEG = 50 / 111.32;
    const LNG_DEG = 50 / (111.32 * Math.cos((center.lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [center.lat - LAT_DEG, center.lng - LNG_DEG],
      [center.lat + LAT_DEG, center.lng + LNG_DEG]
    );
    map.setMaxBounds(bounds);
    map.options.maxBoundsViscosity = 0.9;
  }, [userLocation?.lat, userLocation?.lng, savedLocation?.lat, savedLocation?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Lock / unlock map on business focus ───────────────────────────────────────
  const singleSelectedBusiness = selectedBusinesses?.length === 1 ? selectedBusinesses[0] : null;
  const focusBusiness = navigationTarget ?? singleSelectedBusiness;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const lock   = () => { map.dragging.disable(); map.scrollWheelZoom.disable(); map.doubleClickZoom.disable(); map.touchZoom.disable(); map.boxZoom.disable(); map.keyboard.disable(); };
    const unlock = () => { map.dragging.enable();  map.scrollWheelZoom.enable();  map.doubleClickZoom.enable();  map.touchZoom.enable();  map.boxZoom.enable();  map.keyboard.enable();  };
    if (focusBusiness) {
      lock();
      if (!navigationTarget)
        map.flyTo([focusBusiness.location.lat, focusBusiness.location.lng], Math.max(map.getZoom(), 15), { duration: 0.45, easeLinearity: 0.25 });
    } else {
      unlock();
    }
    return unlock;
  }, [focusBusiness?.id ?? null, navigationTarget?.id ?? null]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── FIX: Stable business pin dep ─────────────────────────────────────────────
  const bizRef = useRef(locationScrapedBusinesses);
  useEffect(() => { bizRef.current = locationScrapedBusinesses; }, [locationScrapedBusinesses]);

  const bizIds = useMemo(
    () => locationScrapedBusinesses.map(b => b.id).sort().join(','),
    [locationScrapedBusinesses],
  );

  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;
    group.clearLayers();

    // In multi-route mode the layer draws its own numbered badges — hide cluster markers
    if (multiRouteMode) return;

    const businesses = focusBusiness ? [focusBusiness] : bizRef.current;

    // Viewport-filtered category breakdown
    const map = mapRef.current;
    if (map) {
      const b = map.getBounds();
      const visible = businesses.filter(
        (biz) =>
          biz.location.lat >= b.getSouth() &&
          biz.location.lat <= b.getNorth() &&
          biz.location.lng >= b.getWest() &&
          biz.location.lng <= b.getEast()
      );
      const tally: Record<string, { emoji: string; count: number }> = {};
      for (const biz of visible) {
        const key = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.subcategory ?? biz.name);
        const { emoji } = getCatStyle(key);
        tally[emoji] = { emoji, count: (tally[emoji]?.count ?? 0) + 1 };
      }
      setVisibleCats(Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 4));
    } else {
      setVisibleCats([]);
    }

    // ── Pin dimensions for this zoom level ──────────────────────────────────
    const { pw, ph, emSz } = pinSizeFromZoom(mapZoom);
    // Emoji sits centred on the pin head (SVG circle at cx=18 cy=17 in 36×48 viewBox)
    const emojiTop  = Math.round(ph * (17 / 48) - emSz / 2);
    // Anchor = pin tip (SVG y=46 out of 48)
    const anchorY   = Math.round(ph * (46 / 48));

    // ── SVG pin builder ──────────────────────────────────────────────────────
    function makePinSvg(color: string, scale = 1, extra = '', isPremium = false) {
      const w2 = Math.round(pw * scale), h2 = Math.round(ph * scale);
      const em2 = Math.round(emSz * scale);
      const et2 = Math.round(h2 * (17 / 48) - em2 / 2);
      // Premium: add gold glow to drop-shadow + gold ring around white center circle
      const premiumGlow = isPremium ? ' drop-shadow(0 0 9px rgba(245,158,11,0.75))' : '';
      const premiumRing = isPremium
        ? `<circle cx="18" cy="17" r="13" fill="none" stroke="#f59e0b" stroke-width="2.2" opacity="0.95"/>`
        : '';
      return { w2, h2, et2, em2,
        svg: `<svg width="${w2}" height="${h2}" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg"
            style="filter:drop-shadow(0 6px 10px rgba(0,0,0,0.40)) drop-shadow(0 2px 4px rgba(0,0,0,0.26))${premiumGlow};overflow:visible;display:block${extra}">
          <!-- ground shadow -->
          <ellipse cx="18" cy="47.5" rx="5" ry="2" fill="rgba(0,0,0,0.16)"/>
          <!-- pin body -->
          <path d="M18 2C9 2 2 9 2 18C2 30.5 18 46 18 46C18 46 34 30.5 34 18C34 9 27 2 18 2Z"
            fill="${color}" stroke="white" stroke-width="2.5" stroke-linejoin="round"/>
          <!-- inner white circle (emoji sits here) -->
          <circle cx="18" cy="17" r="11.5" fill="rgba(255,255,255,0.93)"/>
          <!-- premium gold ring (outside white circle, inside pin body) -->
          ${premiumRing}
          <!-- glint highlight -->
          <circle cx="14" cy="13" r="3" fill="rgba(255,255,255,0.45)"/>
        </svg>`,
      };
    }

    for (const biz of businesses) {
      const isSelected  = focusBusiness?.id === biz.id;
      const isUnclaimed = biz.is_claimed === false;
      const typeKey  = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.subcategory ?? biz.name);
      const { bg, shadow, emoji } = getCatStyle(typeKey);
      const offerCount = Array.isArray(biz.offers) ? biz.offers.filter(o => !o.status || o.status === 'approved').length : 0;

      let html: string;
      let w: number, h: number;
      let anchorYFinal = anchorY;

      if (isSelected) {
        // ── Selected: familiar coloured pill ─────────────────────────────────
        const badge = offerCount > 0
          ? `<span class="biz-pill-badge">${offerCount} deal${offerCount > 1 ? 's' : ''}</span>`
          : '';
        html = `<div class="biz-pill" style="background:${bg};box-shadow:0 8px 28px ${shadow},0 0 0 2.5px rgba(255,255,255,0.85),0 3px 6px rgba(0,0,0,0.35)">
          <span class="biz-pill-ico">${emoji}</span>
          <span class="biz-pill-name">${escHtml(biz.name)}</span>
          ${badge}
        </div>`;
        w = 148; h = 38; anchorYFinal = 38;
      } else if (isUnclaimed) {
        // ── Unclaimed: smaller greyed-out pin ────────────────────────────────
        const { w2, h2, et2, em2, svg } = makePinSvg('#94a3b8', 0.75, ';opacity:0.55;filter:grayscale(0.6)');
        html = `<div class="biz-pin" style="position:relative;width:${w2}px;height:${h2}px">
          ${svg}
          <span style="position:absolute;top:${et2}px;left:50%;transform:translateX(-50%);font-size:${em2}px;line-height:1;pointer-events:none">${emoji}</span>
        </div>`;
        w = w2; h = h2; anchorYFinal = Math.round(h2 * (46 / 48));
      } else {
        // ── Normal: full teardrop SVG pin with category colour ───────────────
        const isPremium = biz.isPremium === true;
        // Scale premium pins up slightly
        const pinScale = isPremium ? 1.15 : 1;
        const { svg, w2, h2 } = makePinSvg(bg, pinScale, '', isPremium);
        const et = Math.round(h2 * (17 / 48) - Math.round(emSz * pinScale) / 2);
        const em = Math.round(emSz * pinScale);
        const premiumStar = isPremium
          ? `<span class="biz-pin-premium-star">⭐</span>`
          : '';

        // Offer badge pill (only at zoom ≥ 13)
        const approvedOffers = Array.isArray(biz.offers)
          ? biz.offers.filter(o => !o.status || o.status === 'approved')
          : [];
        const bestOffer = approvedOffers.sort((a, b) => b.discount - a.discount)[0];
        const showBadge = mapZoom >= 13 && approvedOffers.length > 0;
        let badgeHtml = '';
        if (showBadge) {
          if (approvedOffers.length > 1) {
            badgeHtml = `<span class="biz-offer-pill">🎟️ ${approvedOffers.length} offers</span>`;
          } else if (bestOffer && bestOffer.price && bestOffer.price > 0) {
            const rupeeOff = Math.floor(bestOffer.price * bestOffer.discount / 100);
            badgeHtml = rupeeOff > 0
              ? `<span class="biz-offer-pill">₹${rupeeOff} off</span>`
              : `<span class="biz-offer-pill">${bestOffer.discount}% off</span>`;
          } else if (bestOffer && bestOffer.discount > 0) {
            badgeHtml = `<span class="biz-offer-pill">${bestOffer.discount}% off</span>`;
          }
        }
        const badgeH = showBadge && badgeHtml ? 20 : 0;
        const containerW = Math.max(w2, 76);

        html = `<div style="display:inline-flex;flex-direction:column;align-items:center;width:${containerW}px">
          <div class="biz-pin" style="position:relative;width:${w2}px;height:${h2}px">
            ${svg}
            <span style="position:absolute;top:${et}px;left:50%;transform:translateX(-50%);font-size:${em}px;line-height:1;pointer-events:none">${emoji}</span>
            ${premiumStar}
          </div>
          ${badgeHtml}
        </div>`;
        w = containerW; h = h2 + badgeH;
        anchorYFinal = Math.round(h2 * (46 / 48));
      }

      const marker = L.marker([biz.location.lat, biz.location.lng], {
        icon: L.divIcon({ className: '', html, iconSize: [w, h], iconAnchor: [Math.round(w / 2), anchorYFinal] }),
        zIndexOffset: isSelected ? 600 : (biz.isPremium ? 100 : 0),
      } as L.MarkerOptions);
      // Store emoji + premium flag on marker so iconCreateFunction can read from cluster children
      (marker as L.Marker & { _bizEmoji: string; _bizPremium: boolean })._bizEmoji = emoji;
      (marker as L.Marker & { _bizEmoji: string; _bizPremium: boolean })._bizPremium = biz.isPremium === true;

      // ── Show business name above marker on hover (desktop) ──────────────────
      // On mobile, tap already switches to pill view which shows the name inline.
      if (!isSelected) {
        marker.bindTooltip(escHtml(biz.name), {
          permanent: false,
          direction: 'top',
          // Offset upward from anchor (pin tip) by the full pin height so label appears above pin head
          offset: [0, -(anchorYFinal + 4)],
          className: 'biz-label',
          opacity: 0.97,
        });
      }

      marker.on('click', () => setSelectedBusinesses([biz]));
      group.addLayer(marker);
    }
  }, [focusBusiness?.id ?? null, bizIds, mapZoom, multiRouteMode]);  // eslint-disable-line react-hooks/exhaustive-deps

  function escHtml(s: string) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Start navigation ─────────────────────────────────────────────────────────
  const handleStartNavigation = useCallback((biz: Business) => {
    setSelectedBusinesses(null);
    navigationTargetRef.current = biz;
    const startRoute = (loc: { lat: number; lng: number }) => {
      routeOriginRef.current = loc;
      setNavigationTarget(biz);
    };
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Always request fresh GPS for accurate routing
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          routeOriginRef.current = loc;
          setUserLocation(loc);
          setNavigationTarget(biz);
        },
        () => {
          // GPS failed — fall back to last known location or map center
          const fallback = userLocation ?? routeOriginPos;
          startRoute({ lat: fallback.lat, lng: fallback.lng });
        },
        { timeout: 6000, maximumAge: 30000, enableHighAccuracy: true }
      );
    } else {
      startRoute({ lat: routeOriginPos.lat, lng: routeOriginPos.lng });
    }
  }, [routeOriginPos.lat, routeOriginPos.lng, userLocation, setUserLocation]);

  // ── Draw route polyline ──────────────────────────────────────────────────────
  const navId  = navigationTarget?.id ?? null;
  const navLat = navigationTarget?.location?.lat;
  const navLng = navigationTarget?.location?.lng;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLayerRef.current) { map.removeLayer(routeLayerRef.current); routeLayerRef.current = null; setRouteInfo(null); }
    setRouteError(false);
    const target = navigationTargetRef.current ?? navigationTarget;
    if (!target?.location) { setRouteLoading(false); return; }
    const { lat: toLat, lng: toLng } = target.location;
    if (!Number.isFinite(toLat) || !Number.isFinite(toLng)) { setRouteLoading(false); return; }
    const from = routeOriginRef.current ?? routeOriginPos;
    setRouteLoading(true);
    let cancelled = false;
    fetchOSRMRoute({ lat: from.lat, lng: from.lng }, { lat: toLat, lng: toLng })
      .then((result) => {
        if (cancelled || !mapRef.current) { setRouteLoading(false); return; }
        setRouteLoading(false);
        if (!result) { setRouteError(true); return; }
        const m = mapRef.current;
        const distanceKm  = result.distanceMeters / 1000;
        const timeMinutes = Math.round(result.durationSeconds / 60);
        setRouteInfo({ distanceKm, timeMinutes });
        const layer = new L.LayerGroup();
        // Apple Maps route style: white halo + Apple blue core
        layer.addLayer(L.polyline(result.coordinates, { color: 'rgba(255,255,255,0.88)', weight: 13, opacity: 1, lineCap: 'round', lineJoin: 'round' }));
        layer.addLayer(L.polyline(result.coordinates, { color: '#1C7ED6', weight: 5.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }));
        const mid = result.coordinates[Math.floor(result.coordinates.length / 2)] as [number, number];
        layer.addLayer(L.marker(mid, {
          icon: L.divIcon({ className: '', html: `<div class="route-pill"><span class="route-pill-stat">📍 ${distanceKm.toFixed(1)} km</span><span class="route-pill-sep">·</span><span class="route-pill-stat">🕐 ${timeMinutes} min</span></div>`, iconSize: [200, 38], iconAnchor: [100, 19] }),
          zIndexOffset: -100,
        }));
        layer.addTo(m);
        routeLayerRef.current = layer;
        if (result.coordinates.length > 0)
          m.fitBounds(L.latLngBounds(result.coordinates), { padding: [40, 40], maxZoom: 17 });
      })
      .catch(() => { if (!cancelled) { setRouteInfo(null); setRouteLoading(false); setRouteError(true); } });
    return () => {
      cancelled = true; setRouteLoading(false); setRouteError(false);
      if (routeLayerRef.current && mapRef.current) { mapRef.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
      setRouteInfo(null);
    };
  }, [navId, navLat, navLng, routeOriginPos.lat, routeOriginPos.lng]);  // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenBusiness = useCallback((id: string) => navigate(`/business/${id}`), [navigate]);
  clearRouteRef.current = () => { navigationTargetRef.current = null; setNavigationTarget(null); };

  // ── Multi-route (A* tour) effect ──────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    // Clear previous multi-route layer whenever mode changes
    if (multiRouteLayerRef.current && map) {
      map.removeLayer(multiRouteLayerRef.current);
      multiRouteLayerRef.current = null;
    }
    setTourStops([]);
    setTourTotalKm(0);
    setTourTotalMin(0);

    if (!multiRouteMode) return;

    const origin = routeOriginPos;
    const businesses = bizRef.current;
    if (businesses.length === 0) { setMultiRouteLoading(false); return; }

    // Sort by straight-line distance, pick nearest TOUR_MAX_STOPS
    const sorted = [...businesses]
      .map((b) => ({ b, d: distanceKm(origin, b.location) }))
      .sort((a, z) => a.d - z.d)
      .slice(0, TOUR_MAX_STOPS)
      .map(({ b }) => b);

    // Build RouteNode list for A*
    const originNode = { id: '__origin__', lat: origin.lat, lng: origin.lng };
    const destNodes  = sorted.map((b) => ({ id: b.id, lat: b.location.lat, lng: b.location.lng }));

    setMultiRouteLoading(true);
    let cancelled = false;

    (async () => {
      // A* optimal ordering
      const ordered = astarOptimalRoute(originNode, destNodes);

      // Build waypoint list: origin + ordered stops
      const waypoints = [originNode, ...ordered];

      // Fetch OSRM route for each segment in parallel
      const segments = await fetchOSRMTour(waypoints);

      if (cancelled || !mapRef.current) { setMultiRouteLoading(false); return; }

      const layer = new L.LayerGroup();
      const stops: TourStop[] = [];
      let cumDist = 0;
      let cumTime = 0;
      let allCoords: [number, number][] = [];

      segments.forEach((seg, i) => {
        const color = TOUR_COLORS[i % TOUR_COLORS.length];
        const biz = sorted.find((b) => b.id === ordered[i]?.id)!;
        if (!biz) return;

        const segDistKm  = seg ? seg.distanceMeters / 1000 : distanceKm(waypoints[i], waypoints[i + 1]);
        const segTimeMin = seg ? Math.round(seg.durationSeconds / 60) : Math.round(segDistKm / 0.5);
        cumDist += segDistKm;
        cumTime += segTimeMin;

        const coords = seg?.coordinates ?? ([
          [waypoints[i].lat, waypoints[i].lng],
          [waypoints[i + 1].lat, waypoints[i + 1].lng],
        ] as [number, number][]);

        allCoords = allCoords.concat(coords);

        // White halo for contrast
        layer.addLayer(L.polyline(coords, {
          color: 'rgba(255,255,255,0.85)', weight: 10, opacity: 1, lineCap: 'round', lineJoin: 'round',
        }));
        // Coloured core
        layer.addLayer(L.polyline(coords, {
          color, weight: 4.5, opacity: 0.95, lineCap: 'round', lineJoin: 'round',
        }));
        // Animated dashes overlay
        layer.addLayer(L.polyline(coords, {
          color: 'rgba(255,255,255,0.55)', weight: 2.5, opacity: 1,
          lineCap: 'round', lineJoin: 'round',
          // @ts-expect-error — Leaflet accepts className on polyline via options passthrough
          className: 'route-dash-anim',
        }));

        // Numbered waypoint badge at destination
        const dst = waypoints[i + 1];
        const stopNum = i + 1;
        layer.addLayer(L.marker([dst.lat, dst.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div class="stop-badge" style="width:28px;height:28px;font-size:12px;background:${color};">${stopNum}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
          zIndexOffset: 500,
        }));

        stops.push({ biz, color, segDistKm, segTimeMin, cumDistKm: cumDist });
      });

      layer.addTo(mapRef.current);
      multiRouteLayerRef.current = layer;

      setTourStops(stops);
      setTourTotalKm(cumDist);
      setTourTotalMin(cumTime);
      setMultiRouteLoading(false);

      // Fit map to all route coords
      if (allCoords.length > 0) {
        mapRef.current?.fitBounds(L.latLngBounds(allCoords), { padding: [48, 48], maxZoom: 16 });
      }
    })().catch(() => { if (!cancelled) setMultiRouteLoading(false); });

    return () => {
      cancelled = true;
      setMultiRouteLoading(false);
      if (multiRouteLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(multiRouteLayerRef.current);
        multiRouteLayerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiRouteMode, routeOriginPos.lat, routeOriginPos.lng, bizIds]);

  const handleToggleMultiRoute = useCallback(() => {
    // Exit single-route mode if active
    navigationTargetRef.current = null;
    setNavigationTarget(null);
    setSelectedBusinesses(null);
    setMultiRouteMode((v) => !v);
  }, []);

  // ── My Location FAB ──────────────────────────────────────────────────────────
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        mapRef.current?.flyTo([loc.lat, loc.lng], 16, { duration: 0.9, easeLinearity: 0.25 });
      },
      () => {
        setLocating(false);
        if (userMarkerPos) mapRef.current?.flyTo([userMarkerPos.lat, userMarkerPos.lng], 16, { duration: 0.9 });
      },
      { timeout: 6000, maximumAge: 30000, enableHighAccuracy: true }
    );
  }, [setUserLocation, userMarkerPos]);

  // ── Theme-aware overlay styles ────────────────────────────────────────────────
  const overlayCard   = isDark ? 'rgba(17,17,24,0.92)'    : 'rgba(255,255,255,0.92)';
  const overlayText   = isDark ? 'var(--text)'             : '#1e293b';
  const overlayText2  = isDark ? 'var(--text2)'            : '#64748b';
  const overlayBorder = isDark ? 'rgba(255,255,255,0.10)'  : 'rgba(0,0,0,0.10)';

  return (
    <div
      className={`relative w-full overflow-hidden ${focusBusiness ? 'map-frozen' : ''} ${isDark ? 'brand-map-dark' : 'apple-map-light'}`}
      style={{ height: 'calc(100vh - 120px)', minHeight: 400, background: isDark ? '#1c2331' : '#f0ece4' }}
      data-map-frozen={!!focusBusiness}
    >
      {/* Map canvas — isolation:isolate keeps Leaflet's internal z-indexes
          (tile-pane: 200, marker-pane: 600) inside this stacking context
          so they never bleed above our React overlays at z-10/z-20       */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0, isolation: 'isolate' }} />

      {/* Overlays — z-[800] ensures they paint above Leaflet's marker-pane (z:600)
          and popup-pane (z:700) which live inside the isolated map stacking context */}
      <div className="absolute inset-0 z-[800] pointer-events-none">

        {/* ── HUD corner brackets ───────────────────────────────────────────── */}
        {(['tl','tr','bl','br'] as const).map((c, ci) => {
          const isTop  = c[0] === 't';
          const isLeft = c[1] === 'l';
          return (
            <div key={c} className="map-corner absolute" style={{
              width: 30, height: 30,
              top:    isTop  ? 10 : undefined,
              bottom: !isTop ? 10 : undefined,
              left:   isLeft ? 10 : undefined,
              right:  !isLeft ? 10 : undefined,
              animationDelay: `${ci * 0.9}s`,
            }}>
              {/* Horizontal arm */}
              <div style={{
                position: 'absolute', height: 2, width: '100%',
                top: isTop ? 0 : undefined, bottom: !isTop ? 0 : undefined, left: 0,
                background: isLeft
                  ? 'linear-gradient(90deg,#ff6b35,#e040fb66)'
                  : 'linear-gradient(90deg,#e040fb66,#ff6b35)',
                boxShadow: '0 0 6px rgba(255,107,53,0.75)',
                borderRadius: 2,
              }} />
              {/* Vertical arm */}
              <div style={{
                position: 'absolute', width: 2, height: '100%',
                left: isLeft ? 0 : undefined, right: !isLeft ? 0 : undefined, top: 0,
                background: isTop
                  ? 'linear-gradient(180deg,#ff6b35,#e040fb66)'
                  : 'linear-gradient(180deg,#e040fb66,#ff6b35)',
                boxShadow: '0 0 6px rgba(255,107,53,0.75)',
                borderRadius: 2,
              }} />
              {/* Corner glowing dot */}
              <div style={{
                position: 'absolute', width: 5, height: 5, borderRadius: '50%',
                top:    isTop  ? -1.5 : undefined,
                bottom: !isTop ? -1.5 : undefined,
                left:   isLeft ? -1.5 : undefined,
                right:  !isLeft ? -1.5 : undefined,
                background: '#ff6b35',
                boxShadow: '0 0 8px #ff6b35, 0 0 20px rgba(255,107,53,0.6)',
              }} />
            </div>
          );
        })}

        {/* ── Viewport loading indicator ────────────────────────────────────── */}
        <AnimatePresence>
          {viewportLoading && (
            <motion.div
              key="vp-loading"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10"
            >
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl text-xs font-semibold border"
                style={{ background: overlayCard, backdropFilter: 'blur(12px)', color: overlayText2, borderColor: overlayBorder }}>
                <span className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                Loading nearby…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top-left: category breakdown badge ─────────────────────────────── */}
        <AnimatePresence>
          {!focusBusiness && !navigationTarget && visibleCats.length > 0 && (
            <motion.div
              key="cat-badge"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-3 pointer-events-none"
            >
              <div
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-2xl border"
                style={{ background: overlayCard, backdropFilter: 'blur(12px)', borderColor: overlayBorder, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
                {visibleCats.map(({ emoji, count }) => (
                  <span key={emoji} className="flex items-center gap-0.5">
                    <span className="text-base leading-none">{emoji}</span>
                    <span className="text-[10px] font-bold" style={{ color: overlayText2 }}>{count}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top-right: Interactive rotating highlight ───────────────────────── */}
        <AnimatePresence>
          {!focusBusiness && !navigationTarget && (
            <motion.div
              key="top-right-hl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute top-3 right-3 pointer-events-auto"
            >
              <div
                className="relative overflow-hidden rounded-2xl border cursor-pointer"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(17,17,24,0.95))'
                    : 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,255,255,0.96))',
                  borderColor: 'rgba(255,107,53,0.35)',
                  boxShadow: '0 4px 20px rgba(255,107,53,0.20)',
                  backdropFilter: 'blur(14px)',
                  minWidth: 148,
                }}
                onClick={() => navigate('/auctions')}
              >
                {/* Shimmer bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent3))' }}
                />

                <div className="px-3 py-2.5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={hlIdx % highlights.length}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base leading-none">{currentHL.icon}</span>
                        <span
                          className="text-[12px] font-bold leading-tight"
                          style={{ color: 'var(--accent2)', fontFamily: 'var(--font-d)' }}
                        >
                          {currentHL.line1}
                        </span>
                      </div>
                      <p className="text-[10px] font-medium leading-tight" style={{ color: overlayText2 }}>
                        {currentHL.line2}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Pulsing dot indicator */}
                <div className="absolute bottom-2 right-2.5 flex gap-1">
                  {highlights.slice(0, 4).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === hlIdx % highlights.length ? 12 : 4,
                        height: 4,
                        background: i === hlIdx % highlights.length ? 'var(--accent)' : 'rgba(255,107,53,0.30)',
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Top-right: End Route (replaces highlight when navigating) ───────── */}
        <AnimatePresence>
          {navigationTarget != null && (
            <motion.div
              key="end-route"
              initial={{ opacity: 0, scale: .8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: .8, x: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute top-3 right-3 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => { navigationTargetRef.current = null; setNavigationTarget(null); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-500 text-white text-sm font-bold shadow-xl hover:bg-red-600 active:scale-95 transition-all"
              >
                <X size={15} strokeWidth={2.5} />
                End Route
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Route loading ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {routeLoading && (
            <motion.div
              key="route-loading"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border"
                style={{ background: overlayCard, backdropFilter: 'blur(12px)', color: overlayText, borderColor: overlayBorder, boxShadow: '0 4px 16px rgba(0,0,0,0.18)' }}>
                <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                Finding route…
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Route error ───────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {routeError && !routeLoading && (
            <motion.div
              key="route-error"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => setRouteError(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border"
                style={{ background: overlayCard, backdropFilter: 'blur(12px)', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', boxShadow: '0 4px 16px rgba(239,68,68,0.18)' }}
              >
                ⚠️ Route unavailable — tap to dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Route summary ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {routeInfo && !routeLoading && (
            <motion.div
              key="route-info"
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none"
            >
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold border"
                style={{ background: overlayCard, backdropFilter: 'blur(12px)', color: overlayText, borderColor: 'rgba(255,107,53,0.30)', boxShadow: '0 4px 20px rgba(255,107,53,0.15)' }}>
                <Navigation2 size={15} style={{ color: 'var(--accent)' }} />
                <span>{routeInfo.distanceKm.toFixed(1)} km</span>
                <span style={{ color: overlayText2 }}>·</span>
                <span>{routeInfo.timeMinutes} min</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Business popup / sheet ──────────────────────────────────────────── */}
        {selectedBusinesses != null && selectedBusinesses.length === 1 && (
          <MapBusinessPopup
            business={selectedBusinesses[0]}
            onClose={() => setSelectedBusinesses(null)}
            onStartNavigation={handleStartNavigation}
            onOpenBusiness={handleOpenBusiness}
          />
        )}
        {selectedBusinesses != null && selectedBusinesses.length > 1 && (
          <MapBusinessSheet
            businesses={selectedBusinesses}
            onClose={() => setSelectedBusinesses(null)}
            onStartNavigation={handleStartNavigation}
            onOpenBusiness={handleOpenBusiness}
          />
        )}
      </div>

      {/* ── Zoom controls (left side) ────────────────────────────────────────── */}
      <AnimatePresence>
        {!focusBusiness && !isPlacingPin && (
          <motion.div
            key="zoom-ctrls"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
            className="absolute z-[800] left-3 flex flex-col gap-1.5 pointer-events-auto"
            style={{ bottom: 'calc(100px + 12px)' }}
          >
            {/* Zoom in */}
            <button
              type="button"
              onClick={() => { const m = mapRef.current; if (m) { m.zoomIn(1); setMapZoom(m.getZoom()); } }}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-90"
              style={{ background: overlayCard, boxShadow: '0 4px 14px rgba(0,0,0,0.2)', border: `1px solid ${overlayBorder}`, backdropFilter: 'blur(12px)', color: overlayText }}
              title="Zoom in"
            >
              <Plus size={18} strokeWidth={2.5} />
            </button>

            {/* Zoom level pill */}
            <div
              className="w-10 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold"
              style={{ background: overlayCard, border: `1px solid ${overlayBorder}`, color: overlayText2 }}
            >
              {mapZoom}x
            </div>

            {/* Zoom out */}
            <button
              type="button"
              onClick={() => { const m = mapRef.current; if (m) { m.zoomOut(1); setMapZoom(m.getZoom()); } }}
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-all active:scale-90"
              style={{ background: overlayCard, boxShadow: '0 4px 14px rgba(0,0,0,0.2)', border: `1px solid ${overlayBorder}`, backdropFilter: 'blur(12px)', color: overlayText }}
              title="Zoom out"
            >
              <Minus size={18} strokeWidth={2.5} />
            </button>

            {/* Zoom lock toggle */}
            <button
              type="button"
              onClick={() => setZoomLocked(z => !z)}
              className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{
                background: zoomLocked ? 'rgba(239,68,68,0.15)' : overlayCard,
                border: `1px solid ${zoomLocked ? 'rgba(239,68,68,0.5)' : overlayBorder}`,
                boxShadow: zoomLocked ? '0 4px 14px rgba(239,68,68,0.2)' : '0 4px 14px rgba(0,0,0,0.18)',
                backdropFilter: 'blur(12px)',
                color: zoomLocked ? '#ef4444' : overlayText2,
              }}
              title={zoomLocked ? 'Unlock zoom' : 'Lock zoom'}
            >
              {zoomLocked ? <Lock size={16} strokeWidth={2.5} /> : <Unlock size={16} strokeWidth={2} />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My Location FAB ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!focusBusiness && (
          <motion.button
            key="my-loc"
            initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
            whileTap={{ scale: .9 }}
            onClick={handleMyLocation}
            disabled={locating}
            className="absolute z-[800] pointer-events-auto right-3 rounded-full flex items-center justify-center transition-all disabled:opacity-70"
            style={{ bottom: 'calc(100px + 12px)', width: 44, height: 44, background: overlayCard, boxShadow: '0 4px 20px rgba(0,0,0,0.25)', border: `1px solid ${overlayBorder}`, backdropFilter: 'blur(12px)' }}
            title="My location"
          >
            {locating
              ? <span className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              : <Crosshair size={20} style={{ color: 'var(--accent)' }} strokeWidth={2.2} />
            }
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── "Set on map" pin placement overlay ──────────────────────────────────── */}
      <AnimatePresence>
        {isPlacingPin && (
          <motion.div
            key="pin-placement"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[810] pointer-events-none flex flex-col items-center"
            style={{ background: 'rgba(0,0,0,0.12)' }}
          >
            {/* Crosshair centre */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative">
                <div style={{ width: 2, height: 40, background: 'var(--accent)', position: 'absolute', left: '50%', top: '-20px', transform: 'translateX(-50%)' }} />
                <div style={{ width: 40, height: 2, background: 'var(--accent)', position: 'absolute', top: '50%', left: '-20px', transform: 'translateY(-50%)' }} />
                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '3px solid var(--accent)', background: 'rgba(255,107,53,0.2)' }} />
              </div>
            </div>
            {/* Instruction banner */}
            <motion.div
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="mt-6 flex items-center gap-2.5 px-5 py-3 rounded-2xl pointer-events-auto"
              style={{ background: overlayCard, backdropFilter: 'blur(14px)', boxShadow: '0 8px 30px rgba(255,107,53,0.25)', border: '1.5px solid rgba(255,107,53,0.4)', color: overlayText }}
            >
              <MapPin size={16} style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-semibold">Tap anywhere to set your location</span>
              <button
                type="button"
                onClick={() => setIsPlacingPin(false)}
                className="ml-2 text-xs px-2.5 py-1 rounded-xl font-bold transition-colors"
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Pin set confirmation toast ───────────────────────────────────────────── */}
      <AnimatePresence>
        {pinSetToast && (
          <motion.div
            key="pin-toast"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute z-[820] left-1/2 -translate-x-1/2 pointer-events-none flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ bottom: 'calc(100px + 20px)', background: '#16a34a', color: '#fff', boxShadow: '0 8px 24px rgba(22,163,74,0.4)' }}
          >
            <MapPin size={15} className="text-white" />
            <span className="text-sm font-bold">Location pin set!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Camera / Scan FAB ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!focusBusiness && (
          <motion.button
            key="cam-fab"
            initial={{ opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .8 }}
            transition={{ delay: 0.08 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: .9 }}
            onClick={() => { setCamToast(true); setTimeout(() => setCamToast(false), 2200); }}
            className="absolute z-[800] pointer-events-auto right-3 rounded-full flex items-center justify-center"
            style={{
              bottom: 'calc(100px + 68px)',
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #ff6b35 0%, #e040fb 100%)',
              boxShadow: '0 4px 20px rgba(255,107,53,0.45), 0 0 0 2px rgba(255,107,53,0.2)',
            }}
            title="Scan QR / discover"
          >
            <Camera size={20} className="text-white" strokeWidth={2} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Camera scan toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {camToast && (
          <motion.div
            key="cam-toast"
            initial={{ opacity: 0, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.92 }}
            className="absolute z-[900] pointer-events-none right-3 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl"
            style={{
              bottom: 'calc(100px + 126px)',
              background: overlayCard,
              backdropFilter: 'blur(14px)',
              border: `1px solid rgba(255,107,53,0.3)`,
              boxShadow: '0 4px 20px rgba(255,107,53,0.18)',
              color: overlayText,
              whiteSpace: 'nowrap',
            }}
          >
            <ScanLine size={15} style={{ color: '#ff6b35' }} />
            <span className="text-xs font-semibold">QR scan coming soon!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── All Routes FAB (A* tour toggle) ─────────────────────────────────────── */}
      <AnimatePresence>
        {!focusBusiness && !navigationTarget && !isPlacingPin && (
          <motion.button
            key="all-routes-fab"
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.12 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleToggleMultiRoute}
            disabled={multiRouteLoading}
            className="absolute z-[800] pointer-events-auto rounded-2xl flex items-center gap-2 px-3.5 py-2.5 text-sm font-bold transition-all disabled:opacity-70"
            style={{
              bottom: 'calc(100px + 12px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: multiRouteMode
                ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                : overlayCard,
              color: multiRouteMode ? '#fff' : overlayText,
              border: multiRouteMode ? 'none' : `1px solid ${overlayBorder}`,
              boxShadow: multiRouteMode
                ? '0 6px 24px rgba(124,58,237,0.45), 0 0 0 2px rgba(124,58,237,0.2)'
                : '0 4px 16px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(14px)',
            }}
            title={multiRouteMode ? 'Exit route tour' : 'Show optimal route to all shops (A*)'}
          >
            {multiRouteLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Route size={16} strokeWidth={2.2} />
            )}
            <span>
              {multiRouteLoading ? 'Computing…' : multiRouteMode ? 'Exit Tour' : 'All Routes'}
            </span>
            {!multiRouteMode && !multiRouteLoading && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(124,58,237,0.15)', color: '#7c3aed' }}>
                A*
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Multi-route loading banner ───────────────────────────────────────────── */}
      <AnimatePresence>
        {multiRouteLoading && (
          <motion.div
            key="multi-route-loading"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[800] pointer-events-none"
          >
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold border"
              style={{ background: overlayCard, backdropFilter: 'blur(12px)', color: overlayText, borderColor: 'rgba(124,58,237,0.3)', boxShadow: '0 4px 16px rgba(124,58,237,0.18)' }}>
              <span className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              Running A* · fetching routes…
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour summary header ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {multiRouteMode && !multiRouteLoading && tourStops.length > 0 && (
          <motion.div
            key="tour-header"
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-[800] pointer-events-none"
          >
            <div
              className="flex items-center gap-3 px-4 py-2 rounded-2xl border"
              style={{
                background: isDark ? 'rgba(17,17,24,0.94)' : 'rgba(255,255,255,0.96)',
                backdropFilter: 'blur(16px)',
                borderColor: 'rgba(124,58,237,0.30)',
                boxShadow: '0 4px 20px rgba(124,58,237,0.15)',
                whiteSpace: 'nowrap',
              }}
            >
              {/* Colour spectrum bar */}
              <div className="flex gap-0.5 items-center">
                {tourStops.map((s) => (
                  <div key={s.biz.id} style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
                ))}
              </div>
              <Route size={14} style={{ color: '#7c3aed' }} />
              <span className="text-[13px] font-bold" style={{ color: overlayText }}>
                {tourStops.length} stops
              </span>
              <span style={{ color: overlayText2, fontSize: 13 }}>·</span>
              <span className="text-[13px] font-bold" style={{ color: overlayText }}>
                {tourTotalKm.toFixed(1)} km
              </span>
              <span style={{ color: overlayText2, fontSize: 13 }}>·</span>
              <span className="text-[13px] font-bold" style={{ color: overlayText }}>
                {tourTotalMin} min
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tour stop strip (bottom scrollable) ─────────────────────────────────── */}
      <AnimatePresence>
        {multiRouteMode && !multiRouteLoading && tourStops.length > 0 && (
          <motion.div
            key="tour-strip"
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="absolute z-[800] left-0 right-0 pointer-events-auto"
            style={{ bottom: 'calc(100px + 12px)' }}
          >
            <div
              className="tour-strip flex gap-3 overflow-x-auto px-4 pb-1"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              {tourStops.map((stop, i) => {
                const typeKey = stop.biz.businessType ?? stop.biz.category ?? stop.biz.subcategory ?? stop.biz.name;
                const { emoji } = getCatStyle(typeKey?.toLowerCase?.() ?? 'other');
                return (
                  <motion.div
                    key={stop.biz.id}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="shrink-0 rounded-2xl flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                    style={{
                      scrollSnapAlign: 'start',
                      background: isDark ? 'rgba(17,17,24,0.93)' : 'rgba(255,255,255,0.96)',
                      backdropFilter: 'blur(14px)',
                      border: `1.5px solid ${stop.color}44`,
                      boxShadow: `0 4px 16px ${stop.color}22`,
                      minWidth: 200,
                    }}
                    onClick={() => setSelectedBusinesses([stop.biz])}
                  >
                    {/* Stop number badge */}
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black"
                      style={{ background: stop.color, boxShadow: `0 2px 8px ${stop.color}55` }}
                    >
                      {i + 1}
                    </div>

                    {/* Business info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm leading-none">{emoji}</span>
                        <span
                          className="text-[12px] font-bold truncate"
                          style={{ color: overlayText }}
                        >
                          {stop.biz.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold" style={{ color: stop.color }}>
                          +{stop.segDistKm.toFixed(1)} km
                        </span>
                        <span className="text-[10px]" style={{ color: overlayText2 }}>·</span>
                        <span className="text-[10px] font-semibold" style={{ color: overlayText2 }}>
                          ~{stop.segTimeMin} min
                        </span>
                      </div>
                    </div>

                    {/* Tap to expand */}
                    <ChevronRight size={14} style={{ color: overlayText2, flexShrink: 0 }} />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

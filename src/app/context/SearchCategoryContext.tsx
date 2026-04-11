import { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { mockBusinesses } from '../mockData';
import {
  fetchMapBusinessesNear,
  fetchMapBusinessesInBounds,
  fetchBusinessIdsWithMatchingOfferOrProduct,
  fetchBusinessIdsWithActiveAuctionNear,
  type MapBounds,
} from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';
import type { Business, Offer } from '../types';
import { distanceKm, LOCATION_RADIUS_KM } from '../utils/geo';

/** Initial tight radius (km) to load the closest businesses first. Expands progressively via viewport. */
const SCRAPED_FETCH_RADIUS_KM = 3;

const GEOFENCE_STORAGE_KEY = 'redeem-rocket-geofence-radius-km';
const LAST_MAP_CENTER_KEY = 'redeem-rocket-last-map-center';

function loadLastMapCenter(): { lat: number; lng: number } | null {
  try {
    const s = localStorage.getItem(LAST_MAP_CENTER_KEY);
    if (!s) return null;
    const o = JSON.parse(s);
    const lat = Number(o?.lat);
    const lng = Number(o?.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

function saveLastMapCenter(center: { lat: number; lng: number }) {
  try {
    localStorage.setItem(LAST_MAP_CENTER_KEY, JSON.stringify(center));
  } catch {
    // ignore
  }
}
const GEOFENCE_OPTIONS_KM = [1, 3, 5, 20] as const;
export type GeofenceRadiusKm = (typeof GEOFENCE_OPTIONS_KM)[number];
/** 20 km = "All" (show all fetched businesses); 1/3/5 = filter by that radius. */
const GEOFENCE_ALL_KM = 20;

function loadGeofenceRadius(): GeofenceRadiusKm {
  try {
    const v = localStorage.getItem(GEOFENCE_STORAGE_KEY);
    const n = v ? parseInt(v, 10) : GEOFENCE_ALL_KM;
    return GEOFENCE_OPTIONS_KM.includes(n as GeofenceRadiusKm) ? (n as GeofenceRadiusKm) : GEOFENCE_ALL_KM;
  } catch {
    return GEOFENCE_ALL_KM;
  }
}

export interface SavedLocation {
  lat: number;
  lng: number;
  label: string;
}

export interface NearbyOffer {
  offer: Offer;
  business: Business;
  distance: number;
}

export interface SearchCategoryContextValue {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  category: string;
  setCategory: (c: string) => void;
  mapCenter: { lat: number; lng: number };
  setMapCenter: (c: { lat: number; lng: number }) => void;
  userLocation: { lat: number; lng: number } | null;
  setUserLocation: (c: { lat: number; lng: number } | null) => void;
  savedLocation: SavedLocation | null;
  setSavedLocation: (loc: SavedLocation | null) => void;
  isPlacingPin: boolean;
  setIsPlacingPin: (v: boolean) => void;
  /** Geofence radius in km (user setting). Businesses/offers within this radius. */
  geofenceRadiusKm: GeofenceRadiusKm;
  setGeofenceRadiusKm: (km: GeofenceRadiusKm) => void;
  geofenceOptionsKm: readonly number[];
  /** Businesses within geofence of focus (filtered by category, search). */
  locationBusinesses: Business[];
  /** All offers from businesses within geofence (for “offers nearby” list). */
  nearbyOffers: NearbyOffer[];
  categories: string[];
  /** All businesses (from Supabase or mock). Use to resolve business by id. */
  allBusinesses: Business[];
  businessesLoading: boolean;
  /** Scraped businesses (from scraped_businesses table) within geofence, for map pins. */
  locationScrapedBusinesses: Business[];
  /** Viewport update for hybrid loading (radius-first, then viewport). */
  setMapViewportQuery: (viewport: { bounds: MapBounds | null; zoom: number | null; userInteracted?: boolean }) => void;
  /** True while a viewport pan/zoom is fetching more businesses in the background. */
  viewportLoading: boolean;
}

const INDORE_CENTER = { lat: 22.7196, lng: 75.8577 };
const defaultCenter = loadLastMapCenter() ?? INDORE_CENTER;
const VIEWPORT_FETCH_MIN_ZOOM = 11;

const SearchCategoryContext = createContext<SearchCategoryContextValue | null>(null);

export function SearchCategoryProvider({ children }: { children: ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [savedLocation, setSavedLocation] = useState<SavedLocation | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [geofenceRadiusKm, setGeofenceRadiusKmState] = useState<GeofenceRadiusKm>(loadGeofenceRadius);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>(mockBusinesses);
  const [allScrapedBusinesses, setAllScrapedBusinesses] = useState<Business[]>([]);
  const [scrapedFromFallback, setScrapedFromFallback] = useState(false); // true when no nearby scraped, so we show the fallback batch without distance filter
  const [locationReady, setLocationReady] = useState(false); // true after we've tried to get current location (so we start with current location, then fetch nearby)
  const [businessesLoading, setBusinessesLoading] = useState(hasSupabase());
  const [viewportBounds, setViewportBounds] = useState<MapBounds | null>(null);
  const [viewportZoom, setViewportZoom] = useState<number | null>(null);
  const [hasMovedMap, setHasMovedMap] = useState(false);
  const [productMatchBusinessIds, setProductMatchBusinessIds] = useState<Set<string>>(new Set());
  const productMatchQueryRef = useRef<string>('');
  const [activeAuctionBusinessIds, setActiveAuctionBusinessIds] = useState<Set<string>>(new Set());
  const activeAuctionRequestRef = useRef<string>('');

  // On start: get current location first, then load businesses near user (or fallback center)
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationReady(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const loc = { lat, lng };
        setUserLocation(loc);
        setMapCenter(loc);
        saveLastMapCenter(loc);
        setSavedLocation(null);
        setLocationReady(true);
      },
      () => setLocationReady(true),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const focus = savedLocation ?? userLocation ?? mapCenter;
  const shouldUseViewport =
    hasMovedMap &&
    viewportBounds !== null &&
    (viewportZoom ?? 0) >= VIEWPORT_FETCH_MIN_ZOOM;

  const INITIAL_LOAD_LIMIT = 300;   // tight first load — closest 300 businesses within 3 km
  const VIEWPORT_LOAD_LIMIT = 500;  // viewport fetch as user pans
  const lastInitialFocusRef = useRef<{ lat: number; lng: number } | null>(null);
  const viewportCacheRef = useRef<Map<string, boolean>>(new Map());
  const viewportDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewportLoading, setViewportLoading] = useState(false);

  function boundsCacheKey(b: MapBounds): string {
    return `${b.minLat.toFixed(3)},${b.minLng.toFixed(3)},${b.maxLat.toFixed(3)},${b.maxLng.toFixed(3)}`;
  }

  useEffect(() => {
    if (!hasSupabase()) {
      setBusinessesLoading(false);
      return;
    }
    if (!locationReady) return;
    if (
      lastInitialFocusRef.current &&
      lastInitialFocusRef.current.lat === focus.lat &&
      lastInitialFocusRef.current.lng === focus.lng
    )
      return;
    lastInitialFocusRef.current = { lat: focus.lat, lng: focus.lng };
    setBusinessesLoading(true);
    fetchMapBusinessesNear(
      focus.lat,
      focus.lng,
      SCRAPED_FETCH_RADIUS_KM,
      INITIAL_LOAD_LIMIT
    )
      .then((list) => {
        setAllBusinesses([]);
        const businesses = Array.isArray(list) ? list : [];
        if (businesses.length > 0) {
          setAllScrapedBusinesses(businesses);
          setScrapedFromFallback(false);
          console.log(`[Map businesses] Fetched ${businesses.length} nearby (within ${SCRAPED_FETCH_RADIUS_KM} km):`, businesses);
          console.table(businesses.slice(0, 100).map((b) => ({ name: b.name, address: b.address?.slice(0, 40), lat: b.location?.lat, lng: b.location?.lng })));
        } else {
          setAllScrapedBusinesses([]);
          setScrapedFromFallback(false);
          console.log('[Map businesses] No businesses found nearby.');
        }
      })
      .catch(() => setAllScrapedBusinesses([]))
      .finally(() => setBusinessesLoading(false));
  }, [locationReady, focus.lat, focus.lng]);

  // Debounced viewport fetch after user pans/zooms — merges new businesses into existing set
  useEffect(() => {
    if (!hasSupabase() || !hasMovedMap || !viewportBounds || (viewportZoom ?? 0) < VIEWPORT_FETCH_MIN_ZOOM) return;
    const key = boundsCacheKey(viewportBounds);
    if (viewportCacheRef.current.get(key)) return;

    // Debounce: wait 400 ms after panning stops
    if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current);
    viewportDebounceRef.current = setTimeout(() => {
      viewportCacheRef.current.set(key, true);
      setViewportLoading(true);
      fetchMapBusinessesInBounds(viewportBounds, VIEWPORT_LOAD_LIMIT)
        .then((inViewport) => {
          if (inViewport.length === 0) return;
          setAllScrapedBusinesses((prev) => {
            const byId = new Map(prev.map((b) => [b.id, b]));
            inViewport.forEach((b) => byId.set(b.id, b));
            return Array.from(byId.values());
          });
        })
        .catch(() => {})
        .finally(() => setViewportLoading(false));
    }, 400);

    return () => { if (viewportDebounceRef.current) clearTimeout(viewportDebounceRef.current); };
  }, [hasMovedMap, viewportBounds, viewportZoom]);

  useEffect(() => {
    localStorage.setItem(GEOFENCE_STORAGE_KEY, String(geofenceRadiusKm));
  }, [geofenceRadiusKm]);

  // When search query changes, fetch business IDs that have matching offer/product (for search-by-product).
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setProductMatchBusinessIds(new Set());
      productMatchQueryRef.current = '';
      return;
    }
    if (productMatchQueryRef.current === q) return;
    productMatchQueryRef.current = q;
    let cancelled = false;
    fetchBusinessIdsWithMatchingOfferOrProduct(q).then((ids) => {
      if (!cancelled) setProductMatchBusinessIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  // When Auctions filter is on, fetch business IDs with active auction (and nearby).
  const focusForAuctions = savedLocation ?? userLocation ?? mapCenter;
  useEffect(() => {
    if (category !== 'Auctions') {
      setActiveAuctionBusinessIds(new Set());
      activeAuctionRequestRef.current = '';
      return;
    }
    const key = `${focusForAuctions.lat.toFixed(4)},${focusForAuctions.lng.toFixed(4)},${geofenceRadiusKm}`;
    if (activeAuctionRequestRef.current === key) return;
    activeAuctionRequestRef.current = key;
    let cancelled = false;
    fetchBusinessIdsWithActiveAuctionNear(
      focusForAuctions.lat,
      focusForAuctions.lng,
      geofenceRadiusKm
    ).then((ids) => {
      if (!cancelled) setActiveAuctionBusinessIds(new Set(ids));
    });
    return () => {
      cancelled = true;
    };
  }, [category, focusForAuctions.lat, focusForAuctions.lng, geofenceRadiusKm]);

  const setGeofenceRadiusKm = useCallback((km: GeofenceRadiusKm) => {
    setGeofenceRadiusKmState(km);
  }, []);

  const setMapViewportQuery = useCallback(
    (viewport: { bounds: MapBounds | null; zoom: number | null; userInteracted?: boolean }) => {
      setViewportBounds(viewport.bounds);
      setViewportZoom(viewport.zoom);
      if (viewport.userInteracted) setHasMovedMap(true);
    },
    []
  );

  const businessesList = Array.isArray(allBusinesses) ? allBusinesses : [];

  const standardCategories = [
    'Food & Beverage',
    'Fashion',
    'Electronics',
    'Health & Beauty',
    'Health & Fitness',
    'Home Services',
    'Food',
    'Store',
    'Restaurant',
    'Scraped',
    'Other',
  ];
  const categories = useMemo(() => {
    const fromData = Array.from(new Set(businessesList.map((b) => b.category).filter(Boolean)));
    const merged = Array.from(new Set([...fromData, ...standardCategories])).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
    return ['all', 'Auctions', ...merged];
  }, [businessesList]);

  const locationBusinesses = useMemo(() => {
    const focus = savedLocation ?? { lat: mapCenter.lat, lng: mapCenter.lng };
    let list = businessesList.map((b) => ({ ...b, distance: distanceKm(focus, b.location) }));
    if (!shouldUseViewport) {
      list = list.filter((b) => b.distance <= geofenceRadiusKm);
      if (list.length === 0 && businessesList.length > 0) {
        list = businessesList.map((b) => ({ ...b, distance: distanceKm(focus, b.location) }));
      }
    }
    list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    if (category === 'Auctions') {
      list = list.filter((b) => activeAuctionBusinessIds.has(b.id));
    } else if (category !== 'all') {
      list = list.filter((b) => b.category === category);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          (b.subcategory && b.subcategory.toLowerCase().includes(q)) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          productMatchBusinessIds.has(b.id) ||
          (Array.isArray(b.offers) && b.offers.some((o) => o.title.toLowerCase().includes(q) || (o.description && o.description.toLowerCase().includes(q))))
      );
    }
    return list;
  }, [businessesList, savedLocation, mapCenter, category, searchQuery, geofenceRadiusKm, shouldUseViewport, productMatchBusinessIds, activeAuctionBusinessIds]);

  const nearbyOffers = useMemo<NearbyOffer[]>(() => {
    const offers: NearbyOffer[] = [];
    locationBusinesses.forEach((business) => {
      business.offers.forEach((offer) => {
        offers.push({ offer, business, distance: business.distance ?? 0 });
      });
    });
    offers.sort((a, b) => a.distance - b.distance);
    return offers;
  }, [locationBusinesses]);

  const scrapedList = Array.isArray(allScrapedBusinesses) ? allScrapedBusinesses : [];
  const locationScrapedBusinesses = useMemo(() => {
    const focus = savedLocation ?? { lat: mapCenter.lat, lng: mapCenter.lng };
    let list: (Business & { distance?: number })[];
    if (shouldUseViewport) {
      list = scrapedList.map((b) => ({ ...b, distance: distanceKm(focus, b.location) }));
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } else if (scrapedFromFallback) {
      list = scrapedList.map((b) => ({ ...b, distance: distanceKm(focus, b.location) }));
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    } else {
      const displayRadiusKm = geofenceRadiusKm;
      list = scrapedList
        .map((b) => ({ ...b, distance: distanceKm(focus, b.location) }))
        .filter((b) => b.distance <= displayRadiusKm);
      if (list.length === 0 && scrapedList.length > 0) {
        list = scrapedList.map((b) => ({ ...b, distance: distanceKm(focus, b.location) }));
      }
      list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    }
    // Category filter: show only businesses matching selected category (or Auctions from table)
    if (category === 'Auctions') {
      list = list.filter((b) => activeAuctionBusinessIds.has(b.id));
    } else if (category !== 'all') {
      list = list.filter((b) => b.category === category);
    }
    // Search filter: by name, category, address, or by product/offer match
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          (b.subcategory && b.subcategory.toLowerCase().includes(q)) ||
          (b.address && b.address.toLowerCase().includes(q)) ||
          productMatchBusinessIds.has(b.id)
      );
    }
    return list;
  }, [scrapedList, savedLocation, mapCenter, scrapedFromFallback, shouldUseViewport, geofenceRadiusKm, category, searchQuery, productMatchBusinessIds, activeAuctionBusinessIds]);

  const value = useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      category,
      setCategory,
      mapCenter,
      setMapCenter,
      userLocation,
      setUserLocation,
      savedLocation,
      setSavedLocation,
      isPlacingPin,
      setIsPlacingPin,
      geofenceRadiusKm,
      setGeofenceRadiusKm,
      geofenceOptionsKm: GEOFENCE_OPTIONS_KM,
      locationBusinesses,
      nearbyOffers,
      categories,
      allBusinesses,
      businessesLoading,
      locationScrapedBusinesses,
      setMapViewportQuery,
      viewportLoading,
    }),
    [
      searchQuery,
      category,
      mapCenter,
      userLocation,
      savedLocation,
      isPlacingPin,
      geofenceRadiusKm,
      locationBusinesses,
      nearbyOffers,
      categories,
      allBusinesses,
      businessesLoading,
      locationScrapedBusinesses,
      setMapViewportQuery,
      viewportLoading,
    ]
  );

  return (
    <SearchCategoryContext.Provider value={value}>
      {children}
    </SearchCategoryContext.Provider>
  );
}

export function useSearchCategory() {
  const ctx = useContext(SearchCategoryContext);
  if (!ctx) throw new Error('useSearchCategory must be used within SearchCategoryProvider');
  return ctx;
}

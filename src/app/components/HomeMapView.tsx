import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSearchCategory } from '../context/SearchCategoryContext';
import type { Business } from '../types';

// ── Map style ────────────────────────────────────────────────────────────────

const DARK_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: 'Dark',
  sources: {
    basemap: {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
    },
  },
  layers: [{ id: 'basemap', type: 'raster', source: 'basemap', minzoom: 0, maxzoom: 19,
    paint: { 'raster-brightness-min': 0.12, 'raster-brightness-max': 1, 'raster-contrast': -0.1, 'raster-saturation': 0.3 },
  }],
};

// ── Constants ─────────────────────────────────────────────────────────────────

const RADIUS_OPTIONS = [2, 5, 10, 15, 20] as const;
type RadiusKm = typeof RADIUS_OPTIONS[number];

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: '#f97316', food: '#f97316', cafe: '#fb923c',
  electronics: '#3b82f6', phone: '#3b82f6',
  fashion: '#ec4899', clothing: '#ec4899', boutique: '#ec4899',
  pharmacy: '#22c55e', medical: '#22c55e', health: '#22c55e',
  grocery: '#84cc16', supermarket: '#84cc16', vegetables: '#84cc16',
  beauty: '#a855f7', salon: '#a855f7', spa: '#a855f7',
  jewellery: '#f59e0b', gold: '#f59e0b',
  default: '#7c3aed',
};

function getCategoryColor(cat: string): string {
  const k = (cat ?? '').toLowerCase();
  for (const [key, val] of Object.entries(CATEGORY_COLORS)) {
    if (k.includes(key)) return val;
  }
  return CATEGORY_COLORS.default;
}

function getCategoryEmoji(cat: string): string {
  const k = (cat ?? '').toLowerCase();
  if (k.includes('restaurant') || k.includes('food') || k.includes('cafe')) return '🍽️';
  if (k.includes('electronics') || k.includes('phone')) return '📱';
  if (k.includes('fashion') || k.includes('clothing') || k.includes('boutique')) return '👗';
  if (k.includes('pharmacy') || k.includes('medical') || k.includes('health')) return '💊';
  if (k.includes('grocery') || k.includes('supermarket') || k.includes('vegetables')) return '🛒';
  if (k.includes('beauty') || k.includes('salon') || k.includes('spa')) return '💅';
  if (k.includes('jewellery') || k.includes('gold')) return '💍';
  return '🏪';
}

// ── Geometry ──────────────────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function buildCircleGeoJSON(center: [number, number], radiusKm: number, steps = 72) {
  const [lng, lat] = center;
  const R = 6371;
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const θ = (i / steps) * 2 * Math.PI;
    const dLat = (radiusKm / R) * (180 / Math.PI) * Math.cos(θ);
    const dLng =
      (radiusKm / R) * (180 / Math.PI) / Math.cos((lat * Math.PI) / 180) * Math.sin(θ);
    coords.push([lng + dLng, lat + dLat]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {},
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function HomeMapView() {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<maplibregl.Map | null>(null);
  const locMarkerRef   = useRef<maplibregl.Marker | null>(null);
  const bizMarkersRef  = useRef<maplibregl.Marker[]>([]);
  const mapLoadedRef   = useRef(false);

  const [selectedRadius, setSelectedRadius] = useState<RadiusKm>(5);
  const [selectedBiz, setSelectedBiz]       = useState<Business | null>(null);

  const { mapCenter, userLocation, savedLocation, locationBusinesses, locationScrapedBusinesses } =
    useSearchCategory();

  const currentLocation = useMemo(() => {
    const loc = savedLocation ?? userLocation ?? mapCenter;
    return { lat: loc.lat, lng: loc.lng };
  }, [savedLocation, userLocation, mapCenter]);

  // Merge + dedup + filter by radius
  const nearbyBusinesses = useMemo(() => {
    const seen = new Set<string>();
    return [...locationBusinesses, ...locationScrapedBusinesses]
      .filter(b => {
        if (!b?.location?.lat || !b?.location?.lng) return false;
        if (seen.has(b.id)) return false;
        seen.add(b.id);
        return (
          haversineKm(currentLocation.lat, currentLocation.lng, b.location.lat, b.location.lng) <=
          selectedRadius
        );
      })
      .sort(
        (a, b) =>
          haversineKm(currentLocation.lat, currentLocation.lng, a.location.lat, a.location.lng) -
          haversineKm(currentLocation.lat, currentLocation.lng, b.location.lat, b.location.lng),
      );
  }, [locationBusinesses, locationScrapedBusinesses, currentLocation, selectedRadius]);

  // ── Update radius circle ────────────────────────────────────────────────────
  const updateRadiusCircle = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;
    const src = map.getSource('radius-circle') as maplibregl.GeoJSONSource | undefined;
    if (src) {
      src.setData(buildCircleGeoJSON([currentLocation.lng, currentLocation.lat], selectedRadius));
    }
  }, [currentLocation, selectedRadius]);

  // ── Update business markers ─────────────────────────────────────────────────
  const updateBizMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoadedRef.current) return;

    // Remove old markers
    bizMarkersRef.current.forEach(m => m.remove());
    bizMarkersRef.current = [];

    nearbyBusinesses.forEach(biz => {
      const el = document.createElement('div');
      const color = getCategoryColor(biz.category);
      el.style.cssText = `
        width:34px;height:34px;border-radius:50%;
        background:${color};border:2.5px solid #fff;
        box-shadow:0 2px 8px rgba(0,0,0,0.35);
        cursor:pointer;display:flex;align-items:center;
        justify-content:center;font-size:15px;
        transition:transform 0.15s,box-shadow 0.15s;
        user-select:none;
      `;
      el.title = biz.name;
      el.textContent = getCategoryEmoji(biz.category);

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.22)';
        el.style.boxShadow = `0 4px 16px ${color}88`;
        el.style.zIndex = '10';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
        el.style.zIndex = '';
      });
      el.addEventListener('click', () => setSelectedBiz(biz));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([biz.location.lng, biz.location.lat])
        .addTo(map);

      bizMarkersRef.current.push(marker);
    });
  }, [nearbyBusinesses]);

  // ── Initialise map ──────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: DARK_STYLE,
      center: [currentLocation.lng, currentLocation.lat],
      zoom: selectedRadius <= 2 ? 15 : selectedRadius <= 5 ? 14 : selectedRadius <= 10 ? 13 : 12,
      attributionControl: false,
      maplibreLogo: false,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // Brighten canvas
      const canvas = container.querySelector('canvas.maplibregl-canvas') as HTMLCanvasElement | null;
      if (canvas) canvas.style.filter = 'brightness(1.55) contrast(0.88)';

      // Radius fill + outline
      map.addSource('radius-circle', {
        type: 'geojson',
        data: buildCircleGeoJSON([currentLocation.lng, currentLocation.lat], selectedRadius),
      });
      map.addLayer({
        id: 'radius-fill',
        type: 'fill',
        source: 'radius-circle',
        paint: { 'fill-color': '#7c3aed', 'fill-opacity': 0.07 },
      });
      map.addLayer({
        id: 'radius-outline',
        type: 'line',
        source: 'radius-circle',
        paint: { 'line-color': '#7c3aed', 'line-width': 2, 'line-dasharray': [5, 4] },
      });

      mapLoadedRef.current = true;
      updateBizMarkers();
    });

    // Current-location marker
    const locEl = document.createElement('div');
    locEl.style.cssText = `
      width:20px;height:20px;border-radius:50%;
      background:#22c55e;border:3px solid #fff;
      box-shadow:0 1px 6px rgba(0,0,0,0.35);cursor:pointer;
    `;
    locEl.title = 'Your location';

    const locMarker = new maplibregl.Marker({ element: locEl })
      .setLngLat([currentLocation.lng, currentLocation.lat])
      .setPopup(new maplibregl.Popup({ offset: 20 }).setHTML('<strong>Your location</strong>'))
      .addTo(map);

    mapRef.current    = map;
    locMarkerRef.current = locMarker;

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(container);

    return () => {
      mapLoadedRef.current = false;
      ro.disconnect();
      bizMarkersRef.current.forEach(m => m.remove());
      bizMarkersRef.current = [];
      locMarker.remove();
      map.remove();
      mapRef.current    = null;
      locMarkerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLocation.lat, currentLocation.lng]);

  // Sync location marker + fly when location changes
  useEffect(() => {
    const map    = mapRef.current;
    const marker = locMarkerRef.current;
    if (!map || !marker) return;
    marker.setLngLat([currentLocation.lng, currentLocation.lat]);
    map.flyTo({ center: [currentLocation.lng, currentLocation.lat], duration: 600 });
  }, [currentLocation.lat, currentLocation.lng]);

  // Update circle when radius or location changes
  useEffect(() => { updateRadiusCircle(); }, [updateRadiusCircle]);

  // Update markers when businesses or radius changes
  useEffect(() => { updateBizMarkers(); }, [updateBizMarkers]);

  const handleCenterOnLocation = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [currentLocation.lng, currentLocation.lat], zoom: 14, duration: 800 });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden',
        background: '#0f172a', height: 'calc(100vh - 120px)', minHeight: 400,
      }}
    >
      {/* Map canvas */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* ── Radius selector ──────────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 14, left: 14, zIndex: 10,
        display: 'flex', gap: 6, padding: '6px 8px',
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 50, border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
      }}>
        {RADIUS_OPTIONS.map(r => (
          <button
            key={r}
            onClick={() => setSelectedRadius(r)}
            style={{
              padding: '5px 13px', borderRadius: 50, border: 'none',
              background: selectedRadius === r
                ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
                : 'transparent',
              color: selectedRadius === r ? '#fff' : '#94a3b8',
              fontSize: 12.5, fontWeight: selectedRadius === r ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.18s',
              boxShadow: selectedRadius === r ? '0 2px 8px rgba(124,58,237,0.45)' : 'none',
            }}
          >
            {r} km
          </button>
        ))}
      </div>

      {/* ── Business count badge ──────────────────────────────────────────────── */}
      <div style={{
        position: 'absolute', top: 14, right: 56, zIndex: 10,
        padding: '6px 14px',
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
        borderRadius: 50, border: '1px solid rgba(255,255,255,0.12)',
        color: '#e2e8f0', fontSize: 12.5, fontWeight: 600,
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}>
        🏪 {nearbyBusinesses.length} nearby
      </div>

      {/* ── Center-on-location button ─────────────────────────────────────────── */}
      <button
        onClick={handleCenterOnLocation}
        style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '9px 16px', borderRadius: 50, border: 'none',
          background: 'rgba(15,23,42,0.90)', backdropFilter: 'blur(8px)',
          color: '#e2e8f0', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.40)',
          transition: 'all 0.18s',
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        My location
      </button>

      {/* ── Selected business popup ───────────────────────────────────────────── */}
      {selectedBiz && (
        <div style={{
          position: 'absolute', bottom: 60, left: 14, right: 14, zIndex: 20,
          background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: 20, border: '1px solid rgba(255,255,255,0.12)',
          padding: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.50)',
          maxWidth: 420, margin: '0 auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: getCategoryColor(selectedBiz.category),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                {getCategoryEmoji(selectedBiz.category)}
              </div>
              <div>
                <div style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, marginBottom: 3 }}>
                  {selectedBiz.name}
                </div>
                <div style={{ color: '#64748b', fontSize: 12 }}>
                  {selectedBiz.category}
                  {selectedBiz.location && ` · ${haversineKm(
                    currentLocation.lat, currentLocation.lng,
                    selectedBiz.location.lat, selectedBiz.location.lng
                  ).toFixed(1)} km away`}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedBiz(null)}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                cursor: 'pointer', fontSize: 18, padding: '0 4px', lineHeight: 1,
              }}
            >×</button>
          </div>

          {selectedBiz.offers?.length > 0 && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedBiz.offers.slice(0, 3).map((o, i) => (
                <span key={i} style={{
                  padding: '4px 10px', borderRadius: 50,
                  background: 'rgba(124,58,237,0.25)', color: '#c4b5fd',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {o.discount_percent ? `${o.discount_percent}% off` : o.title ?? 'Offer'}
                </span>
              ))}
            </div>
          )}

          {selectedBiz.address && (
            <div style={{ marginTop: 10, color: '#94a3b8', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              📍 {selectedBiz.address}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

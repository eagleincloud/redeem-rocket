/**
 * Haversine distance in km between two points.
 */
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371; // Earth radius km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/** Radius (km) for loading businesses around the selected/saved location. */
export const LOCATION_RADIUS_KM = 5;

/** Bounding box for a circle (center + radius_km). Approximate; use for DB filters. */
export function getBoundingBox(
  center: { lat: number; lng: number },
  radiusKm: number
): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  const latDeg = radiusKm / 111;
  const lngDeg = radiusKm / (111 * Math.max(0.1, Math.cos((center.lat * Math.PI) / 180)));
  return {
    minLat: Math.max(-90, center.lat - latDeg),
    maxLat: Math.min(90, center.lat + latDeg),
    minLng: Math.max(-180, center.lng - lngDeg),
    maxLng: Math.min(180, center.lng + lngDeg),
  };
}

/** Default coords when lat/lng are missing or invalid (so every business can be pinned). */
export const DEFAULT_PIN_COORDS = { lat: 20.5937, lng: 78.9629 } as const;

/**
 * Returns valid lat/lng for map pins. Clamps to valid ranges (lat -90..90, lng -180..180)
 * and uses DEFAULT_PIN_COORDS when value is missing, non-finite, or out of range.
 */
export function validLatLng(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined
): { lat: number; lng: number } {
  const nLat = typeof lat === 'number' ? lat : (lat != null && lat !== '' ? Number(lat) : NaN);
  const nLng = typeof lng === 'number' ? lng : (lng != null && lng !== '' ? Number(lng) : NaN);
  return {
    lat: Number.isFinite(nLat) && nLat >= -90 && nLat <= 90 ? Math.max(-90, Math.min(90, nLat)) : DEFAULT_PIN_COORDS.lat,
    lng: Number.isFinite(nLng) && nLng >= -180 && nLng <= 180 ? Math.max(-180, Math.min(180, nLng)) : DEFAULT_PIN_COORDS.lng,
  };
}

/** Total distance in km along a route (sum of segment distances between consecutive points). */
export function routeDistanceKm(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distanceKm(
      { lat: points[i][0], lng: points[i][1] },
      { lat: points[i + 1][0], lng: points[i + 1][1] }
    );
  }
  return total;
}

/** Average speed in km/h for estimated travel time. */
export const AVERAGE_SPEED_KMH = 30;

/** Estimated time in minutes at AVERAGE_SPEED_KMH for a given distance in km. */
export function estimatedTimeMinutes(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  const hours = distanceKm / AVERAGE_SPEED_KMH;
  return Math.round(hours * 60);
}

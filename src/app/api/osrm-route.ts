/**
 * Open-source routing via OSRM public demo server.
 * Docs: https://project-osrm.org/docs/v5.24.0/api/
 * Coordinates: longitude,latitude (GeoJSON order).
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Fetch a multi-segment route through an ordered list of waypoints.
 * Returns one result per segment (from[i] → from[i+1]).
 */
export async function fetchOSRMTour(
  waypoints: { lat: number; lng: number }[],
): Promise<(OSRMRouteResult | null)[]> {
  if (waypoints.length < 2) return [];
  const results: (OSRMRouteResult | null)[] = [];

  // Fetch each segment independently so we get per-leg geometry/distance
  const fetches = waypoints.slice(0, -1).map((from, i) =>
    fetchOSRMRoute(from, waypoints[i + 1]),
  );

  // Run in parallel (OSRM public server handles it fine for ≤10 segments)
  const settled = await Promise.allSettled(fetches);
  for (const s of settled) {
    results.push(s.status === 'fulfilled' ? s.value : null);
  }
  return results;
}

export interface OSRMRouteResult {
  distanceMeters: number;
  durationSeconds: number;
  /** Coordinates as [lat, lng][] for Leaflet */
  coordinates: [number, number][];
}

export interface OSRMRouteResponse {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates: [number, number][] };
  }>;
}

/**
 * Fetch a driving route from A to B using OSRM public API.
 * @param from - { lat, lng } start (e.g. user location)
 * @param to - { lat, lng } destination (e.g. business)
 * @returns Route with distance, duration and polyline coordinates, or null on error
 */
export async function fetchOSRMRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<OSRMRouteResult | null> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  // NOTE: coords must NOT be encoded — OSRM expects literal commas/semicolons in the path
  const url = `${OSRM_BASE}/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: OSRMRouteResponse = await res.json();
    if (data.code !== 'Ok' || !data.routes?.[0]) return null;

    const route = data.routes[0];
    const coordsRaw = route.geometry?.coordinates ?? [];
    // OSRM GeoJSON is [lng, lat]; convert to [lat, lng] for Leaflet
    const coordinates: [number, number][] = coordsRaw.map(([lng, lat]) => [lat, lng]);

    return {
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      coordinates,
    };
  } catch {
    return null;
  }
}

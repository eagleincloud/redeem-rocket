/**
 * Fetch driving route from OSRM (open source).
 * Returns array of [lat, lng] for distance calc and Leaflet.
 */
export async function fetchRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<[number, number][]> {
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${encodeURIComponent(coords)}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  const coordsList = data.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coordsList)) return [];
  return coordsList.map(([lng, lat]: [number, number]) => [lat, lng]);
}

/** GeoJSON coordinates [lng, lat][] for MapLibre from the same OSRM response. */
export function routeToGeoJSONCoordinates(routeLatLng: [number, number][]): [number, number][] {
  return routeLatLng.map(([lat, lng]) => [lng, lat]);
}

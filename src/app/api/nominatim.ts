const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search?format=json&q=';

export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
  place_id: number;
}

export async function searchPlaces(query: string): Promise<NominatimResult[]> {
  const q = query.trim();
  if (!q || q.length < 2) return [];
  const res = await fetch(`${NOMINATIM_URL}${encodeURIComponent(q)}&limit=5`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

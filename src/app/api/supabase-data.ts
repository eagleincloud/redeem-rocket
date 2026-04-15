import { supabase } from '../lib/supabase';
import type { Business, Offer, Product, WalletTransaction } from '../types';
import { validLatLng, getBoundingBox, distanceKm } from '../utils/geo';

interface DbBusiness {
  id: string;
  source_db: string;
  source_id: string;
  name: string | null;
  type: string | null;
  category: string | null;
  description: string | null;
  image: string | null;
  lat: number | string | null;
  lng: number | string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  rating: number | string | null;
  is_active: number | null;
  featured: number | null;
}

interface DbOffer {
  id: string;
  source_db: string;
  source_id: string;
  business_id: string | null;
  title: string | null;
  description: string | null;
  discount_value: number | string | null;
  end_date: string | null;
  start_date: string | null;
  is_active: number | null;
}

interface DbProduct {
  id: string;
  source_db: string;
  source_id: string;
  business_id: string | null;
  name: string | null;
  description: string | null;
  price: number | string | null;
  image: string | null;
  category: string | null;
}

interface DbWalletTransaction {
  id: string;
  user_id: string | null;
  amount: number | string | null;
  type: string | null;
  description: string | null;
  created_at: string | null;
}

interface DbScrapedBusiness {
  id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  lat?: number | string | null;
  lng?: number | string | null;
  long?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}

export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const SCRAPED_TABLE_CANDIDATES = ['scraped_businesses', 'scrapped_buinesses'] as const;
/** Table used for loading businesses (initial + viewport). */
export const SCRAPED_BUSINESSES_TABLE = 'scraped_businesses';
/** Use only lat and lng column names for fetching scraped businesses. */
const SCRAPED_SELECT_VARIANTS = [
  { select: 'id, name, address, phone, lat, lng', latCol: 'lat', lngCol: 'lng' },
] as const;

function num(v: number | string | null | undefined): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: string | null | undefined): string {
  return v != null ? String(v) : '';
}

/** Fetch all businesses with their offers from Supabase, mapped to app types */
export async function fetchBusinessesWithOffers(): Promise<Business[]> {
  if (!supabase) return [];

  const [businessesRes, offersRes] = await Promise.all([
    supabase.from('businesses').select('*'),
    supabase.from('offers').select('*'),
  ]);

  const rawBusinesses = businessesRes.data;
  const rawOffers = offersRes.data;
  const businesses: DbBusiness[] = Array.isArray(rawBusinesses) ? rawBusinesses : [];
  const offers: DbOffer[] = Array.isArray(rawOffers) ? rawOffers : [];

  const offerByBizKey = new Map<string, DbOffer[]>();
  for (const o of offers) {
    const key = `${o.source_db}:${o.business_id ?? ''}`;
    if (!offerByBizKey.has(key)) offerByBizKey.set(key, []);
    offerByBizKey.get(key)!.push(o);
  }

  const result: Business[] = businesses.map((b) => {
    const key = `${b.source_db}:${b.source_id}`;
    const bizOffers = offerByBizKey.get(key) ?? [];
    const { lat, lng } = validLatLng(b.lat, b.lng);
    const appOffers: Offer[] = bizOffers.map((o) => ({
      id: o.id,
      businessId: b.id,
      title: str(o.title),
      description: str(o.description),
      discount: num(o.discount_value),
      expiresAt: o.end_date ? new Date(o.end_date) : new Date(Date.now() + 86400000),
      category: str(b.category) || 'Offer',
      price: num(o.price) || undefined,
    }));

    const category = str(b.category) || 'Other';
    const name = str(b.name) || 'Business';
    const logo = b.image || (name.charAt(0)?.toUpperCase() ?? '🏪');

    return {
      id: b.id,
      name,
      category,
      logo,
      location: { lat, lng },
      address: str(b.address) || 'Address not set',
      rating: num(b.rating) || 0,
      offers: appOffers,
      isPremium: b.featured === 1,
    };
  });

  return result;
}

const NEARBY_CLAIMED_LIMIT = 500;
const NEARBY_SCRAPED_LIMIT = 2000;

function mapBusinessesToApp(
  businessList: DbBusiness[],
  offerByBizKey: Map<string, DbOffer[]>
): Business[] {
  return businessList.map((b) => {
    const key = `${b.source_db}:${b.source_id}`;
    const bizOffers = offerByBizKey.get(key) ?? [];
    const { lat: blat, lng: blng } = validLatLng(b.lat, b.lng);
    const appOffers: Offer[] = bizOffers.map((o) => ({
      id: o.id,
      businessId: b.id,
      title: str(o.title),
      description: str(o.description),
      discount: num(o.discount_value),
      expiresAt: o.end_date ? new Date(o.end_date) : new Date(Date.now() + 86400000),
      category: str(b.category) || 'Offer',
      price: num(o.price) || undefined,
    }));

    return {
      id: b.id,
      name: str(b.name) || 'Business',
      category: str(b.category) || 'Other',
      logo: b.image || (str(b.name).charAt(0)?.toUpperCase() ?? '🏪'),
      location: { lat: blat, lng: blng },
      address: str(b.address) || 'Address not set',
      rating: num(b.rating) || 0,
      offers: appOffers,
      isPremium: b.featured === 1,
    };
  });
}

async function fetchOffersIndexForBusinesses(
  businessList: DbBusiness[]
): Promise<Map<string, DbOffer[]>> {
  const offerByBizKey = new Map<string, DbOffer[]>();
  if (!supabase || businessList.length === 0) return offerByBizKey;

  // Fetch only offers for visible businesses (instead of scanning whole offers table).
  const sourceIds = Array.from(new Set(businessList.map((b) => b.source_id).filter(Boolean)));
  if (sourceIds.length === 0) return offerByBizKey;

  const { data: offersData } = await supabase
    .from('offers')
    .select('*')
    .in('business_id', sourceIds);
  const offers: DbOffer[] = Array.isArray(offersData) ? offersData : [];

  const bizKeys = new Set(businessList.map((b) => `${b.source_db}:${b.source_id}`));
  for (const o of offers) {
    const key = `${o.source_db}:${o.business_id ?? ''}`;
    if (!bizKeys.has(key)) continue;
    if (!offerByBizKey.has(key)) offerByBizKey.set(key, []);
    offerByBizKey.get(key)!.push(o);
  }
  return offerByBizKey;
}

/** Fetch claimed businesses (with offers) within radius of (lat, lng). Uses bounding box for fast DB filter. */
export async function fetchBusinessesWithOffersNear(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<Business[]> {
  if (!supabase) return [];

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox({ lat, lng }, radiusKm);

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .gte('lat', minLat)
    .lte('lat', maxLat)
    .gte('lng', minLng)
    .lte('lng', maxLng)
    .limit(NEARBY_CLAIMED_LIMIT);

  if (bizError || !Array.isArray(businesses)) return [];

  const businessList = businesses as DbBusiness[];
  const offerByBizKey = await fetchOffersIndexForBusinesses(businessList);
  return mapBusinessesToApp(businessList, offerByBizKey);
}

/** Fetch claimed businesses (with offers) in current map viewport bounds. */
export async function fetchBusinessesWithOffersInBounds(
  bounds: MapBounds,
  limit = NEARBY_CLAIMED_LIMIT
): Promise<Business[]> {
  if (!supabase) return [];

  const { data: businesses, error: bizError } = await supabase
    .from('businesses')
    .select('*')
    .gte('lat', bounds.minLat)
    .lte('lat', bounds.maxLat)
    .gte('lng', bounds.minLng)
    .lte('lng', bounds.maxLng)
    .limit(limit);

  if (bizError || !Array.isArray(businesses)) return [];
  const businessList = businesses as DbBusiness[];
  const offerByBizKey = await fetchOffersIndexForBusinesses(businessList);
  return mapBusinessesToApp(businessList, offerByBizKey);
}

/** Infer category from name/address for map icons (Restaurant, Cafe, Retail, Hotel, Pharmacy, etc.). */
export function inferCategory(name: string, address = ''): string {
  const text = `${(name || '').toLowerCase()} ${(address || '').toLowerCase()}`;
  if (/\b(restaurant|resto|dining|food|eat|grill|pizza|burger|bistro)\b/.test(text)) return 'Restaurant';
  if (/\b(cafe|coffee|tea|café)\b/.test(text)) return 'Cafe';
  if (/\b(hotel|motel|inn|stay|lodging)\b/.test(text)) return 'Hotel';
  if (/\b(pharmacy|pharma|chemist|drugstore)\b/.test(text)) return 'Pharmacy';
  if (/\b(shop|store|retail|mall|clothing|fashion)\b/.test(text)) return 'Retail';
  return 'Other';
}

function mapScrapedRowsToBusinesses(rows: DbScrapedBusiness[]): Business[] {
  return rows.map((r) => {
    const rawLat = r.lat ?? r.latitude ?? null;
    const rawLng = r.lng ?? r.long ?? r.longitude ?? null;
    const location = validLatLng(rawLat, rawLng);
    const name = str(r.name) || 'Scraped place';
    const address = str(r.address) || 'Address not set';
    const category = inferCategory(name, address);
    return {
      id: r.id,
      name,
      category,
      logo: '📍',
      location,
      address,
      rating: 0,
      offers: [],
    };
  });
}

async function runScrapedQuery(
  queryBuilder: (
    table: string,
    selectVariant: (typeof SCRAPED_SELECT_VARIANTS)[number]
  ) => Promise<{ data: unknown; error: unknown }>
): Promise<DbScrapedBusiness[]> {
  return runScrapedQueryTable(SCRAPED_BUSINESSES_TABLE, queryBuilder);
}

/** Run a scraped-businesses query against a single table (e.g. scraped_businesses). */
async function runScrapedQueryTable(
  table: string,
  queryBuilder: (
    tableName: string,
    selectVariant: (typeof SCRAPED_SELECT_VARIANTS)[number]
  ) => Promise<{ data: unknown; error: unknown }>
): Promise<DbScrapedBusiness[]> {
  if (!supabase) return [];

  let firstSuccessfulEmpty: DbScrapedBusiness[] | null = null;
  for (const selectVariant of SCRAPED_SELECT_VARIANTS) {
    const { data, error } = await queryBuilder(table, selectVariant);
    if (error || !Array.isArray(data)) continue;

    const rows = (data as Record<string, unknown>[]).map((row) => ({
      id: String(row.id ?? ''),
      name: row.name != null ? String(row.name) : null,
      address: row.address != null ? String(row.address) : null,
      phone: row.phone != null ? String(row.phone) : null,
      lat: (row as Record<string, unknown>)[selectVariant.latCol] as number | string | null | undefined,
      lng: (row as Record<string, unknown>)[selectVariant.lngCol] as number | string | null | undefined,
    })) as DbScrapedBusiness[];

    if (rows.length > 0) return rows;
    if (!firstSuccessfulEmpty) firstSuccessfulEmpty = rows;
  }
  return firstSuccessfulEmpty ?? [];
}

async function getTableRowCount(table: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return typeof count === 'number' ? count : 0;
}

async function pickLargestScrapedTable(): Promise<string | null> {
  let selected: string | null = null;
  let maxCount = -1;
  for (const table of SCRAPED_TABLE_CANDIDATES) {
    const c = await getTableRowCount(table);
    if (c > maxCount) {
      maxCount = c;
      selected = table;
    }
  }
  return selected;
}

async function detectCoordinateVariantForTable(
  table: string
): Promise<(typeof SCRAPED_SELECT_VARIANTS)[number] | null> {
  for (const variant of SCRAPED_SELECT_VARIANTS) {
    const { data, error } = await supabase!
      .from(table)
      .select(variant.select)
      .limit(1);
    if (!error && Array.isArray(data)) return variant;
  }
  return null;
}

function getRowCoordinate(row: Record<string, unknown>): { lat: number; lng: number } | null {
  const latRaw = row.lat ?? row.latitude ?? null;
  const lngRaw = row.lng ?? row.long ?? row.longitude ?? null;
  const latNum = Number(latRaw);
  const lngNum = Number(lngRaw);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) return null;
  return { lat: latNum, lng: lngNum };
}

/** Testing helper: choose biggest scraped table (e.g. 16k rows), fetch top N full rows, map lat/lng to businesses. */
export async function fetchScrapedBusinessesSample(limit = 10): Promise<Business[]> {
  if (!supabase) return [];

  let selectedTable = SCRAPED_TABLE_CANDIDATES[0];
  let selectedCount = -1;
  for (const table of SCRAPED_TABLE_CANDIDATES) {
    const c = await getTableRowCount(table);
    if (c > selectedCount) {
      selectedCount = c;
      selectedTable = table;
    }
  }

  const { data, error } = await supabase
    .from(selectedTable)
    .select('*')
    .order('id', { ascending: true })
    .limit(Math.max(limit * 8, 80)); // fetch extra to guarantee enough valid coordinates

  if (error || !Array.isArray(data)) return [];

  const out: Business[] = [];
  for (const row of data as Record<string, unknown>[]) {
    const coords = getRowCoordinate(row);
    if (!coords) continue;
    out.push({
      id: String(row.id ?? `scraped-${out.length + 1}`),
      name: str((row.name as string | null | undefined) ?? 'Scraped place'),
      category: 'Scraped',
      logo: '📍',
      location: coords,
      address: str((row.address as string | null | undefined) ?? 'Address not set'),
      rating: 0,
      offers: [],
    });
    if (out.length >= limit) break;
  }

  return out;
}

/** Fetch ALL businesses from the largest scraped table and map coordinate columns to lat/lng. */
export async function fetchScrapedBusinessesFromLargestTable(): Promise<Business[]> {
  if (!supabase) return [];
  const table = await pickLargestScrapedTable();
  if (!table) return [];

  const variant = await detectCoordinateVariantForTable(table);
  if (!variant) return [];

  const allRows: Record<string, unknown>[] = [];
  let from = 0;
  const pageSize = SCRAPED_PAGE_SIZE;
  let hasMore = true;

  while (hasMore) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase
      .from(table)
      .select(variant.select)
      .range(from, to)
      .order('id', { ascending: true });
    if (error || !Array.isArray(data)) break;
    allRows.push(...(data as Record<string, unknown>[]));
    hasMore = data.length === pageSize;
    from = to + 1;
  }

  const mapped: DbScrapedBusiness[] = allRows.map((row) => ({
    id: String(row.id ?? ''),
    name: row.name != null ? String(row.name) : null,
    address: row.address != null ? String(row.address) : null,
    phone: row.phone != null ? String(row.phone) : null,
    lat: (row as Record<string, unknown>)[variant.latCol] as number | string | null | undefined,
    lng: (row as Record<string, unknown>)[variant.lngCol] as number | string | null | undefined,
  }));

  return mapScrapedRowsToBusinesses(mapped);
}

/** Fetch scraped businesses within radius of (lat, lng). Uses bounding box; only nearby batch. */
export async function fetchScrapedBusinessesNear(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<Business[]> {
  if (!supabase) return [];

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox({ lat, lng }, radiusKm);

  const rows = await runScrapedQuery((table, selectVariant) =>
    supabase
      .from(table)
      .select(selectVariant.select)
      .gte(selectVariant.latCol, minLat)
      .lte(selectVariant.latCol, maxLat)
      .gte(selectVariant.lngCol, minLng)
      .lte(selectVariant.lngCol, maxLng)
      .limit(NEARBY_SCRAPED_LIMIT)
  );

  return mapScrapedRowsToBusinesses(rows);
}

/** Fetch up to `limit` nearest scraped businesses from the scraped_businesses table. */
export async function fetchScrapedBusinessesNearFromLargestTable(
  lat: number,
  lng: number,
  radiusKm = 20,
  limit = 100
): Promise<Business[]> {
  if (!supabase) return [];
  const table = SCRAPED_BUSINESSES_TABLE;
  const variant = await detectCoordinateVariantForTable(table);
  if (!variant) return [];

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox({ lat, lng }, radiusKm);
  const fetchLimit = Math.min(limit * 5, 600);
  const { data, error } = await supabase
    .from(table)
    .select(variant.select)
    .gte(variant.latCol, minLat)
    .lte(variant.latCol, maxLat)
    .gte(variant.lngCol, minLng)
    .lte(variant.lngCol, maxLng)
    .limit(fetchLimit);

  if (error || !Array.isArray(data)) return [];
  const rows = (data as Record<string, unknown>[]).map((row) => ({
    id: String(row.id ?? ''),
    name: row.name != null ? String(row.name) : null,
    address: row.address != null ? String(row.address) : null,
    phone: row.phone != null ? String(row.phone) : null,
    lat: (row as Record<string, unknown>)[variant.latCol] as number | string | null | undefined,
    lng: (row as Record<string, unknown>)[variant.lngCol] as number | string | null | undefined,
  })) as DbScrapedBusiness[];

  const businesses = mapScrapedRowsToBusinesses(rows);
  const center = { lat, lng };
  const sorted = [...businesses].sort(
    (a, b) => distanceKm(center, a.location) - distanceKm(center, b.location)
  );
  return sorted.slice(0, limit);
}

/** Fetch scraped businesses in current map viewport bounds. */
export async function fetchScrapedBusinessesInBounds(
  bounds: MapBounds,
  limit = NEARBY_SCRAPED_LIMIT
): Promise<Business[]> {
  if (!supabase) return [];

  const rows = await runScrapedQuery((table, selectVariant) =>
    supabase
      .from(table)
      .select(selectVariant.select)
      .gte(selectVariant.latCol, bounds.minLat)
      .lte(selectVariant.latCol, bounds.maxLat)
      .gte(selectVariant.lngCol, bounds.minLng)
      .lte(selectVariant.lngCol, bounds.maxLng)
      .limit(limit)
  );
  return mapScrapedRowsToBusinesses(rows);
}

// -----------------------------------------------------------------------------
// Map pins: migrated Supabase "businesses" table (latitude / longitude)
// -----------------------------------------------------------------------------

/** Table used for map pins: migrated from MySQL scraped_businesses, same schema (latitude, longitude). */
export const MAP_BUSINESSES_TABLE = 'businesses';

function mapMapBusinessRowToBusiness(row: Record<string, unknown>, offersMap?: Map<string, Offer[]>): Business {
  const location = validLatLng(row.latitude, row.longitude);
  const name = str((row.name as string) ?? '') || 'Business';
  const address = str((row.address as string) ?? '') || 'Address not set';
  const category = str((row.category as string) ?? '') || inferCategory(name, address);
  const subcategory = str((row.subcategory as string) ?? '') || undefined;
  const businessType = str((row.business_type as string) ?? '') || undefined;
  const rating = num(row.rating) || 0;
  const hasAuction = row.has_auction === true || row.has_auction === 1;
  const isPremium = row.featured === 1 || row.featured === true;
  const sourceId = str((row.source_id as string) ?? '');
  const offers = (offersMap && sourceId && offersMap.has(sourceId)) ? offersMap.get(sourceId)! : [];
  return {
    id: String(row.id ?? ''),
    name,
    category,
    subcategory: subcategory || undefined,
    businessType: businessType || undefined,
    logo: '📍',
    location,
    address,
    rating,
    offers,
    isPremium,
    hasAuction: hasAuction || undefined,
  };
}

// Basic select — guaranteed columns that always exist on the map businesses table
const MAP_BUSINESSES_SELECT_BASIC = 'id, name, address, phone, latitude, longitude, category, subcategory, rating, business_type';
// Enriched select — includes premium/offer data (may fail on older scraped rows; falls back to basic)
const MAP_BUSINESSES_SELECT = `${MAP_BUSINESSES_SELECT_BASIC}, source_db, source_id, featured`;
const MAP_BUSINESSES_SELECT_WITH_AUCTION = `${MAP_BUSINESSES_SELECT}, has_auction`;
const MAP_BUSINESSES_SELECT_BASIC_WITH_AUCTION = `${MAP_BUSINESSES_SELECT_BASIC}, has_auction`;

/** Fetch offers for a set of map business rows (keyed by source_id) and return a lookup map. */
async function fetchOffersForMapRows(rows: Record<string, unknown>[]): Promise<Map<string, Offer[]>> {
  const offersMap = new Map<string, Offer[]>();
  if (!supabase || rows.length === 0) return offersMap;
  const sourceIds = [...new Set(rows.map(r => str(r.source_id as string)).filter(Boolean))];
  if (sourceIds.length === 0) return offersMap;
  const { data } = await supabase
    .from('offers')
    .select('id, business_id, source_db, title, description, discount_value, end_date, price, status')
    .in('business_id', sourceIds)
    .eq('is_active', true);
  for (const o of (data ?? []) as Record<string, unknown>[]) {
    const sid = str(o.business_id as string);
    const offer: Offer = {
      id: str(o.id as string),
      businessId: sid,
      title: str(o.title as string),
      description: str(o.description as string),
      discount: num(o.discount_value),
      expiresAt: o.end_date ? new Date(o.end_date as string) : new Date(Date.now() + 86400000),
      category: 'Offer',
      price: num(o.price) || undefined,
      status: (o.status as Offer['status']) || undefined,
    };
    if (!offersMap.has(sid)) offersMap.set(sid, []);
    offersMap.get(sid)!.push(offer);
  }
  return offersMap;
}

/** Fetch businesses near (lat, lng) from the map businesses table. Used for initial load near current location. */
export async function fetchMapBusinessesNear(
  lat: number,
  lng: number,
  radiusKm = 20,
  limit = 2000
): Promise<Business[]> {
  if (!supabase) return [];

  const { minLat, maxLat, minLng, maxLng } = getBoundingBox({ lat, lng }, radiusKm);
  const fetchLimit = Math.min(limit, 2000);
  let { data, error } = await supabase
    .from(MAP_BUSINESSES_TABLE)
    .select(MAP_BUSINESSES_SELECT_WITH_AUCTION)
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .limit(fetchLimit);

  if (error) {
    // Fallback 1: enriched without has_auction
    const fb1 = await supabase
      .from(MAP_BUSINESSES_TABLE)
      .select(MAP_BUSINESSES_SELECT)
      .gte('latitude', minLat).lte('latitude', maxLat)
      .gte('longitude', minLng).lte('longitude', maxLng)
      .limit(fetchLimit);
    if (!fb1.error && Array.isArray(fb1.data)) { data = fb1.data; error = null; }
    else {
      // Fallback 2: absolute minimum — only guaranteed columns (no has_auction, no enrichment)
      const fb2 = await supabase
        .from(MAP_BUSINESSES_TABLE)
        .select(MAP_BUSINESSES_SELECT_BASIC)
        .gte('latitude', minLat).lte('latitude', maxLat)
        .gte('longitude', minLng).lte('longitude', maxLng)
        .limit(fetchLimit);
      data = fb2.data; error = fb2.error;
    }
  }
  if (error || !Array.isArray(data)) return [];
  const rows = data as Record<string, unknown>[];
  const offersMap = await fetchOffersForMapRows(rows);
  const businesses = rows.map(r => mapMapBusinessRowToBusiness(r, offersMap));
  const center = { lat, lng };
  const sorted = [...businesses].sort(
    (a, b) => distanceKm(center, a.location) - distanceKm(center, b.location)
  );
  return sorted.slice(0, limit);
}

/** Fetch businesses in viewport bounds from the map businesses table. Used when user pans/zooms the map. */
export async function fetchMapBusinessesInBounds(
  bounds: MapBounds,
  limit = 2000
): Promise<Business[]> {
  if (!supabase) return [];

  let { data, error } = await supabase
    .from(MAP_BUSINESSES_TABLE)
    .select(MAP_BUSINESSES_SELECT_WITH_AUCTION)
    .gte('latitude', bounds.minLat)
    .lte('latitude', bounds.maxLat)
    .gte('longitude', bounds.minLng)
    .lte('longitude', bounds.maxLng)
    .limit(Math.min(limit, 2000));

  if (error) {
    // Fallback 1: enriched without has_auction
    const fb1 = await supabase
      .from(MAP_BUSINESSES_TABLE)
      .select(MAP_BUSINESSES_SELECT)
      .gte('latitude', bounds.minLat).lte('latitude', bounds.maxLat)
      .gte('longitude', bounds.minLng).lte('longitude', bounds.maxLng)
      .limit(Math.min(limit, 2000));
    if (!fb1.error && Array.isArray(fb1.data)) { data = fb1.data; error = null; }
    else {
      // Fallback 2: basic guaranteed columns only
      const fb2 = await supabase
        .from(MAP_BUSINESSES_TABLE)
        .select(MAP_BUSINESSES_SELECT_BASIC)
        .gte('latitude', bounds.minLat).lte('latitude', bounds.maxLat)
        .gte('longitude', bounds.minLng).lte('longitude', bounds.maxLng)
        .limit(Math.min(limit, 2000));
      data = fb2.data;
      error = fb2.error;
    }
  }
  if (error || !Array.isArray(data)) return [];
  const rows = data as Record<string, unknown>[];
  const offersMap = await fetchOffersForMapRows(rows);
  return rows.map(r => mapMapBusinessRowToBusiness(r, offersMap));
}

/** Fallback: fetch a batch of scraped businesses without location filter (so pins show when data is in another region). */
export async function fetchScrapedBusinessesFallback(): Promise<Business[]> {
  if (!supabase) return [];

  const rows = await runScrapedQuery((table, selectVariant) =>
    supabase
      .from(table)
      .select(selectVariant.select)
      .not(selectVariant.latCol, 'is', null)
      .not(selectVariant.lngCol, 'is', null)
      .order('id', { ascending: true })
      .limit(NEARBY_SCRAPED_LIMIT)
  );

  return mapScrapedRowsToBusinesses(rows);
}

/** Fetch business IDs that have an offer or product matching the search query (for search-by-product). */
export async function fetchBusinessIdsWithMatchingOfferOrProduct(query: string): Promise<string[]> {
  if (!supabase || !query || query.trim().length < 2) return [];
  const pattern = `%${query.trim()}%`;
  const pairs: { source_db: string; source_id: string }[] = [];
  try {
    const { data: offers } = await supabase
      .from('offers')
      .select('source_db, business_id')
      .or(`title.ilike.${pattern},description.ilike.${pattern}`)
      .limit(80);
    if (Array.isArray(offers)) {
      const seen = new Set<string>();
      for (const o of offers as { source_db?: string; business_id?: string }[]) {
        const db = o.source_db ?? '';
        const sid = o.business_id ?? '';
        if (sid && !seen.has(`${db}\t${sid}`)) {
          seen.add(`${db}\t${sid}`);
          pairs.push({ source_db: db, source_id: sid });
        }
      }
    }
    const { data: products } = await supabase
      .from('products')
      .select('source_db, business_id')
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .limit(80);
    if (Array.isArray(products)) {
      const seen = new Set(pairs.map((p) => `${p.source_db}\t${p.source_id}`));
      for (const p of products as { source_db?: string; business_id?: string }[]) {
        const db = p.source_db ?? '';
        const sid = p.business_id ?? '';
        if (sid && !seen.has(`${db}\t${sid}`)) {
          seen.add(`${db}\t${sid}`);
          pairs.push({ source_db: db, source_id: sid });
        }
      }
    }
    if (pairs.length === 0) return [];
    const ids = new Set<string>();
    await Promise.all(
      pairs.slice(0, 50).map(async ({ source_db, source_id }) => {
        const { data } = await supabase
          .from('businesses')
          .select('id')
          .eq('source_db', source_db)
          .eq('source_id', source_id)
          .maybeSingle();
        if (data && (data as { id?: string }).id) ids.add((data as { id: string }).id);
      })
    );
    return Array.from(ids);
  } catch {
    return [];
  }
}

/** Fetch business IDs that have an auction active right now (now() between start_at and end_at). */
export async function fetchBusinessIdsWithActiveAuction(): Promise<string[]> {
  if (!supabase) return [];
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('business_id')
      .lte('start_at', now)
      .gte('end_at', now);
    if (error) return [];
    const rows = Array.isArray(data) ? data : [];
    const ids = new Set<string>();
    for (const row of rows as { business_id?: string }[]) {
      if (row.business_id) ids.add(row.business_id);
    }
    return Array.from(ids);
  } catch {
    return [];
  }
}

/** Fetch business IDs that have an active auction and are within radius of (lat, lng). */
export async function fetchBusinessIdsWithActiveAuctionNear(
  lat: number,
  lng: number,
  radiusKm: number
): Promise<string[]> {
  if (!supabase) return [];
  const [activeIds, bounds] = await Promise.all([
    fetchBusinessIdsWithActiveAuction(),
    Promise.resolve(getBoundingBox({ lat, lng }, radiusKm)),
  ]);
  if (activeIds.length === 0) return [];
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const { data, error } = await supabase
    .from(MAP_BUSINESSES_TABLE)
    .select('id')
    .gte('latitude', minLat)
    .lte('latitude', maxLat)
    .gte('longitude', minLng)
    .lte('longitude', maxLng)
    .in('id', activeIds.slice(0, 500));
  if (error || !Array.isArray(data)) return activeIds;
  const inBounds = new Set((data as { id: string }[]).map((r) => r.id));
  return activeIds.filter((id) => inBounds.has(id));
}

/** Fetch a single business by id (uuid) with offers */
export async function fetchBusinessById(id: string): Promise<Business | null> {
  if (!supabase) return null;

  const { data: b } = await supabase.from('businesses').select('*').eq('id', id).single();
  if (!b) return null;

  const dbBiz = b as DbBusiness;
  const { data: offers } = await supabase
    .from('offers')
    .select('*')
    .eq('source_db', dbBiz.source_db)
    .eq('business_id', dbBiz.source_id);

  const dbOffers = (offers ?? []) as DbOffer[];
  const appOffers: Offer[] = dbOffers.map((o) => ({
    id: o.id,
    businessId: dbBiz.id,
    title: str(o.title),
    description: str(o.description),
    discount: num(o.discount_value),
    expiresAt: o.end_date ? new Date(o.end_date) : new Date(Date.now() + 86400000),
    category: str(dbBiz.category) || 'Offer',
  }));

  const category = str(dbBiz.category) || 'Other';
  const name = str(dbBiz.name) || 'Business';
  const logo = dbBiz.image || (name.charAt(0)?.toUpperCase() ?? '🏪');

  const location = validLatLng(dbBiz.lat, dbBiz.lng);
  return {
    id: dbBiz.id,
    name,
    category,
    logo,
    location,
    address: str(dbBiz.address) || 'Address not set',
    rating: num(dbBiz.rating) || 0,
    offers: appOffers,
    isPremium: dbBiz.featured === 1,
  };
}

/** Fetch products for a business (match by source_db + source_id; business_id in products is legacy id) */
export async function fetchProductsByBusinessId(businessId: string): Promise<Product[]> {
  if (!supabase) return [];

  const { data: b } = await supabase.from('businesses').select('source_db, source_id').eq('id', businessId).single();
  if (!b) return [];

  const { data: rows } = await supabase
    .from('products')
    .select('*')
    .eq('source_db', (b as { source_db: string }).source_db)
    .eq('business_id', (b as { source_id: string }).source_id);

  const list: DbProduct[] = Array.isArray(rows) ? rows : [];
  return list.map((p) => ({
    id: p.id,
    businessId: businessId,
    name: str(p.name) || 'Product',
    description: str(p.description),
    price: num(p.price),
    image: p.image ?? undefined,
    category: str(p.category) || 'General',
  }));
}

const SCRAPED_PAGE_SIZE = 1000;

/** Fetch all scraped businesses (paginated) — supports 16k+ rows from scraped_businesses table */
export async function fetchScrapedBusinesses(): Promise<Business[]> {
  if (!supabase) return [];

  const allRows: DbScrapedBusiness[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + SCRAPED_PAGE_SIZE - 1;
    const rows = await runScrapedQuery((table, selectVariant) =>
      supabase
        .from(table)
        .select(selectVariant.select)
        .range(from, to)
        .order('id', { ascending: true })
    );

    const chunk: DbScrapedBusiness[] = rows;
    allRows.push(...chunk);
    hasMore = chunk.length === SCRAPED_PAGE_SIZE;
    from = to + 1;
  }

  return allRows.map((r) => {
    const location = validLatLng(r.lat, r.lng);
    return {
      id: r.id,
      name: str(r.name) || 'Scraped place',
      category: 'Scraped',
      logo: '📍',
      location,
      address: str(r.address) || 'Address not set',
      rating: 0,
      offers: [],
    };
  });
}

// ─── Admin helpers ────────────────────────────────────────────────────────────

export interface AdminOffer {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  discount: number;
  price: number;
  category: string;
  status: string;
  submittedAt: Date;
  expiresAt: Date;
}

export interface AdminBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  is_claimed: boolean;
  rating: number;
}

/** Fetch offers pending approval from Supabase */
export async function fetchPendingOffers(): Promise<AdminOffer[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('*, businesses(name)')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((o) => ({
      id: String(o.id ?? ''),
      businessId: String(o.business_id ?? ''),
      businessName: (o.businesses as { name?: string } | null)?.name ?? 'Unknown Business',
      title: String(o.title ?? 'Untitled'),
      description: String(o.description ?? ''),
      discount: Number(o.discount_value ?? 0),
      price: Number(o.price ?? 0),
      category: String(o.category ?? 'General'),
      status: String(o.status ?? 'pending_approval'),
      submittedAt: o.created_at ? new Date(o.created_at as string) : new Date(),
      expiresAt: o.end_date ? new Date(o.end_date as string) : new Date(Date.now() + 7 * 86400000),
    }));
  } catch {
    return [];
  }
}

/** Approve an offer (set status → approved) */
export async function approveOffer(offerId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('offers')
    .update({ status: 'approved', is_active: true })
    .eq('id', offerId);
  return !error;
}

/** Reject an offer (set status → rejected + reason) */
export async function rejectOffer(offerId: string, reason: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('offers')
    .update({ status: 'rejected', rejection_reason: reason, is_active: false })
    .eq('id', offerId);
  return !error;
}

/** Fetch businesses for Admin panel */
export async function fetchAdminBusinesses(): Promise<AdminBusiness[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name, category, address, is_claimed, rating')
      .order('name', { ascending: true })
      .limit(200);
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((b) => ({
      id: String(b.id ?? ''),
      name: String(b.name ?? 'Business'),
      category: String(b.category ?? 'Other'),
      address: String(b.address ?? ''),
      is_claimed: Boolean(b.is_claimed),
      rating: Number(b.rating ?? 0),
    }));
  } catch {
    return [];
  }
}

// ─── Auction helpers ──────────────────────────────────────────────────────────

export interface AuctionRow {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  image: string;
  startingBid: number;
  currentBid: number;
  totalBids: number;
  startAt: Date;
  endAt: Date;
}

/** Fetch all active auctions (currently running) */
export async function fetchActiveAuctions(): Promise<AuctionRow[]> {
  if (!supabase) return [];
  const now = new Date().toISOString();
  try {
    const { data, error } = await supabase
      .from('auctions')
      .select('id, business_id, start_at, end_at, businesses(name)')
      .lte('start_at', now)
      .gte('end_at', now)
      .order('end_at', { ascending: true })
      .limit(50);
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((a, i) => ({
      id: String(a.id ?? ''),
      businessId: String(a.business_id ?? ''),
      businessName: (a.businesses as { name?: string } | null)?.name ?? `Business ${i + 1}`,
      title: `Exclusive Deal #${i + 1}`,
      description: 'Bid now and win this exclusive offer!',
      image: ['🛍️', '🎁', '🏆', '💎', '⭐'][i % 5],
      startingBid: 500,
      currentBid: 500 + (Math.random() * 1000 | 0),
      totalBids: Math.floor(Math.random() * 20 + 1),
      startAt: new Date(a.start_at as string),
      endAt: new Date(a.end_at as string),
    }));
  } catch {
    return [];
  }
}

// ─── Customer Requirements helpers ───────────────────────────────────────────

export interface RequirementPayload {
  userId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  urgency: 'low' | 'medium' | 'high';
}

/** Save a customer requirement to Supabase leads table */
export async function saveCustomerRequirement(payload: RequirementPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('leads').insert({
      user_id: payload.userId,
      title: payload.title,
      description: payload.description,
      category: payload.category,
      budget: payload.budget,
      urgency: payload.urgency,
      status: 'open',
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}

/** Fetch customer requirements from Supabase leads table */
export async function fetchCustomerRequirements(): Promise<import('../types').CustomerRequirement[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      id: String(r.id ?? ''),
      customerId: String(r.user_id ?? 'anonymous'),
      title: String(r.title ?? ''),
      description: String(r.description ?? ''),
      category: String(r.category ?? 'Other'),
      budget: Number(r.budget ?? 0),
      urgency: (['low', 'medium', 'high'].includes(String(r.urgency)) ? r.urgency : 'medium') as 'low' | 'medium' | 'high',
      status: (['open', 'in_progress', 'completed'].includes(String(r.status)) ? r.status : 'open') as 'open' | 'in_progress' | 'completed',
      createdAt: r.created_at ? new Date(r.created_at as string) : new Date(),
      responses: [],
    }));
  } catch {
    return [];
  }
}

/** Fetch all wallet transactions (for demo; later filter by user_id when auth exists) */
export async function fetchWalletTransactions(_userId?: string): Promise<WalletTransaction[]> {
  if (!supabase) return [];

  const q = supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(500);
  const { data } = await q;

  const list: DbWalletTransaction[] = Array.isArray(data) ? data : [];
  const typeMap = {
    reward: 'reward' as const,
    cashback: 'cashback' as const,
    payment: 'payment' as const,
    refund: 'refund' as const,
  };
  return list.map((t) => ({
    id: t.id,
    type: typeMap[t.type as keyof typeof typeMap] ?? 'reward',
    amount: num(t.amount),
    description: str(t.description) || 'Transaction',
    createdAt: t.created_at ? new Date(t.created_at) : new Date(),
  }));
}

// ─── Business App write functions ─────────────────────────────────────────────

export interface ProductPayload {
  businessId: string;
  name: string;
  description: string;
  mrp: number;
  selling_price: number;
  category: string;
  image?: string;
}

/** Create a new product for a business */
export async function createProduct(data: ProductPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').insert({
      business_id: data.businessId,
      name: data.name,
      description: data.description,
      price: data.mrp,
      category: data.category,
      image: data.image ?? null,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch { return false; }
}

/** Update an existing product */
export async function updateProduct(id: string, data: Partial<ProductPayload>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').update({
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.mrp && { price: data.mrp }),
      ...(data.category && { category: data.category }),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return !error;
  } catch { return false; }
}

/** Delete a product by id */
export async function deleteProduct(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return !error;
  } catch { return false; }
}

export interface OfferPayload {
  businessId: string;
  title: string;
  description: string;
  discount: number;
  price?: number;
  category: string;
  isFlashDeal?: boolean;
  startDate: string;
  endDate: string;
}

/** Create a new offer (goes to pending_approval) */
export async function createOffer(data: OfferPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('offers').insert({
      business_id: data.businessId,
      title: data.title,
      description: data.description,
      discount_value: data.discount,
      price: data.price ?? null,
      category: data.category,
      is_flash_deal: data.isFlashDeal ?? false,
      start_date: data.startDate,
      end_date: data.endDate,
      status: 'pending_approval',
      is_active: false,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch { return false; }
}

/** Update an offer */
export async function updateOffer(id: string, data: Partial<OfferPayload>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('offers').update({
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.discount !== undefined && { discount_value: data.discount }),
      ...(data.endDate && { end_date: data.endDate }),
      status: 'pending_approval',
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return !error;
  } catch { return false; }
}

/** Delete an offer */
export async function deleteOffer(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('offers').delete().eq('id', id);
    return !error;
  } catch { return false; }
}

// ── Activity Logging ──────────────────────────────────────────────────────────

export interface ActivityLogParams {
  businessId: string;
  actorId: string;
  actorType: 'owner' | 'team_member';
  actorName?: string;
  action: string;           // e.g. 'login', 'create_product', 'update_offer', 'delete_lead'
  entityType?: string;      // 'product' | 'offer' | 'lead' | 'campaign' | 'team_member' | ...
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an entry to the activity_logs table.
 * Fire-and-forget — errors are silently swallowed so they never break the UX.
 */
export async function logActivity(params: ActivityLogParams): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('activity_logs').insert({
      business_id: params.businessId,
      actor_id:    params.actorId,
      actor_type:  params.actorType,
      actor_name:  params.actorName ?? null,
      action:      params.action,
      entity_type: params.entityType ?? null,
      entity_id:   params.entityId ?? null,
      entity_name: params.entityName ?? null,
      metadata:    params.metadata ?? {},
    });
  } catch { /* silent — never break the user flow */ }
}

// ── Business-side own offers fetch (by business_id) ──────────────────────────

export interface OwnOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  price: number | null;
  category: string;
  isFlashDeal: boolean;
  startDate: string;
  endDate: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
}

export async function fetchOwnOffers(businessId: string): Promise<OwnOffer[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('offers')
      .select('id, title, description, discount_value, price, category, is_flash_deal, start_date, end_date, status, rejection_reason')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];
    return data.map(r => ({
      id: r.id as string,
      title: r.title as string,
      description: (r.description as string) ?? '',
      discount: (r.discount_value as number) ?? 0,
      price: (r.price as number | null) ?? null,
      category: (r.category as string) ?? 'General',
      isFlashDeal: Boolean(r.is_flash_deal),
      startDate: (r.start_date as string) ?? '',
      endDate: (r.end_date as string) ?? '',
      status: (r.status as OwnOffer['status']) ?? 'pending_approval',
      rejectionReason: (r.rejection_reason as string | undefined),
    }));
  } catch { return []; }
}

// ── Business-side own products fetch (by business_id) ────────────────────────

export interface OwnProduct {
  id: string;
  name: string;
  description: string;
  mrp: number;
  sellingPrice: number;
  category: string;
  emoji: string;
  stock: number;
}

export async function fetchOwnProducts(businessId: string): Promise<OwnProduct[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, description, price, selling_price, category, image, stock')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error || !Array.isArray(data)) return [];
    return data.map(r => ({
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string) ?? '',
      mrp: (r.price as number) ?? 0,
      sellingPrice: (r.selling_price as number) ?? (r.price as number) ?? 0,
      category: (r.category as string) ?? 'Other',
      emoji: '📦',
      stock: (r.stock as number) ?? 0,
    }));
  } catch { return []; }
}

export interface AuctionPayload {
  businessId: string;
  title: string;
  description: string;
  image: string;
  startingBid: number;
  endAt: string;
}

/** Create a new auction */
export async function createAuction(data: AuctionPayload): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('auctions').insert({
      business_id: data.businessId,
      title: data.title,
      description: data.description,
      image: data.image,
      starting_bid: data.startingBid,
      current_bid: data.startingBid,
      total_bids: 0,
      start_at: new Date().toISOString(),
      end_at: data.endAt,
    });
    return !error;
  } catch { return false; }
}

/** Update an auction */
export async function updateAuction(id: string, data: Partial<AuctionPayload>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('auctions').update({
      ...(data.title && { title: data.title }),
      ...(data.description && { description: data.description }),
      ...(data.endAt && { end_at: data.endAt }),
    }).eq('id', id);
    return !error;
  } catch { return false; }
}

/** Fetch orders for a specific business */
export async function fetchOrdersForBusiness(businessId: string): Promise<import('../types').Order[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((o) => ({
      id: String(o.id ?? ''),
      businessId: String(o.business_id ?? ''),
      businessName: String(o.business_name ?? ''),
      verificationCode: String(o.verification_code ?? ''),
      createdAt: o.created_at ? new Date(o.created_at as string) : new Date(),
      items: Array.isArray(o.items) ? o.items as import('../types').Order['items'] : [],
      total: Number(o.total ?? 0),
      redeemed: Boolean(o.redeemed),
      cashbackAmount: Number(o.cashback_amount ?? 0),
    }));
  } catch { return []; }
}

/** Respond to a customer requirement (lead) */
export async function respondToRequirement(
  reqId: string,
  businessId: string,
  message: string,
  price: number
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('lead_responses').insert({
      lead_id: reqId,
      business_id: businessId,
      message,
      price,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch { return false; }
}

/** Fetch revenue summary for a business */
export async function fetchBusinessRevenue(
  businessId: string
): Promise<{ gross: number; fees: number; net: number }> {
  if (!supabase) return { gross: 0, fees: 0, net: 0 };
  try {
    const { data } = await supabase
      .from('wallet_transactions')
      .select('amount, type')
      .eq('business_id', businessId);
    if (!Array.isArray(data)) return { gross: 0, fees: 0, net: 0 };
    const gross = data.filter((t: { type: string }) => t.type === 'order_payment').reduce((s: number, t: { amount: number }) => s + num(t.amount), 0);
    const fees  = data.filter((t: { type: string }) => t.type === 'platform_fee').reduce((s: number, t: { amount: number }) => s + num(t.amount), 0);
    return { gross, fees, net: gross - fees };
  } catch { return { gross: 0, fees: 0, net: 0 }; }
}

/** Upsert business opening hours */
export async function upsertBusinessHours(
  businessId: string,
  hours: import('../types').BusinessHours[]
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('business_hours').upsert(
      hours.map((h) => ({
        business_id: businessId,
        day: h.day,
        open: h.open,
        close: h.close,
        closed: h.closed,
      })),
      { onConflict: 'business_id,day' }
    );
    return !error;
  } catch { return false; }
}

/** Upsert business photo gallery */
export async function upsertBusinessPhotos(
  businessId: string,
  photos: import('../types').BusinessPhoto[]
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('business_photos').upsert(
      photos.map((p) => ({
        id: p.id,
        business_id: businessId,
        url: p.url,
        is_cover: p.isCover,
        order: p.order,
      })),
      { onConflict: 'id' }
    );
    return !error;
  } catch { return false; }
}

/** Upsert business subscription plan */
export async function upsertBusinessSubscription(
  businessId: string,
  plan: import('../types').SubscriptionPlan
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('businesses').update({ subscription_plan: plan }).eq('id', businessId);
    return !error;
  } catch { return false; }
}

/** Update basic business profile fields */
export async function updateBusinessProfile(
  id: string,
  data: {
    name?: string;
    description?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    category?: string;
    logo?: string;
  }
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('businesses').update({
      ...(data.name && { name: data.name }),
      ...(data.description && { description: data.description }),
      ...(data.address && { address: data.address }),
      ...(data.phone && { phone: data.phone }),
      ...(data.email && { email: data.email }),
      ...(data.category && { category: data.category }),
      ...(data.logo && { image: data.logo }),
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    return !error;
  } catch { return false; }
}


// ── Business Registration (Business App → Customer Map) ────────────────────────

/**
 * Register or update a claimed business in the Supabase businesses table.
 * Called when a business owner completes onboarding in the Business App.
 * The customer app reads from this same table, so the pin will appear on the map.
 * No-ops silently if Supabase is not configured (local dev without env vars).
 */
export async function registerBusiness(data: {
  id: string;
  name: string;
  logo: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  plan: string;
}): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('businesses').upsert({
      id: data.id,
      name: data.name,
      image: data.logo,
      category: data.category,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      is_claimed: true,
      plan: data.plan,
      rating: 4.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// ── Auto-Onboarding Pipeline ───────────────────────────────────────────────────

export interface ScrapedBizPipelineRecord {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  category: string | null;
  enrichment_status: string;
  outreach_sent_at: string | null;
  outreach_channel: string | null;
  enriched_at: string | null;
}

export interface OnboardingPipelineData {
  counts: Record<string, number>;
  recent: ScrapedBizPipelineRecord[];
}

/** Fetch pipeline funnel counts and the 50 most recent scraped records. */
export async function fetchOnboardingPipeline(): Promise<OnboardingPipelineData> {
  if (!supabase) return { counts: {}, recent: [] };
  try {
    const statuses = ['raw', 'enriched', 'outreach_sent', 'claimed', 'rejected'] as const;
    const countResults = await Promise.all(
      statuses.map(s =>
        supabase!
          .from('scraped_businesses')
          .select('id', { count: 'exact', head: true })
          .eq('enrichment_status', s)
      )
    );
    const counts: Record<string, number> = {};
    statuses.forEach((s, i) => { counts[s] = countResults[i].count ?? 0; });

    const { data, error } = await supabase
      .from('scraped_businesses')
      .select('id, name, address, phone, category, enrichment_status, outreach_sent_at, outreach_channel, enriched_at')
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data)) return { counts, recent: [] };
    return { counts, recent: data as ScrapedBizPipelineRecord[] };
  } catch {
    return { counts: {}, recent: [] };
  }
}

/** Invoke the biz-enricher edge function for a batch of raw records. */
export async function runEnricherBatch(batch = 50): Promise<{ enriched: number; skipped: number }> {
  if (!supabase) return { enriched: 0, skipped: 0 };
  try {
    const { data, error } = await supabase.functions.invoke('biz-enricher', { body: { batch } });
    if (error) throw error;
    return { enriched: data?.enriched ?? 0, skipped: data?.skipped ?? 0 };
  } catch {
    return { enriched: 0, skipped: 0 };
  }
}

/** Invoke the biz-outreach edge function to send claim invitations. */
export async function runOutreachBatch(
  batch = 20,
  channel: 'whatsapp' | 'sms' = 'whatsapp'
): Promise<{ sent: number; failed: number }> {
  if (!supabase) return { sent: 0, failed: 0 };
  try {
    const { data, error } = await supabase.functions.invoke('biz-outreach', { body: { batch, channel } });
    if (error) throw error;
    return { sent: data?.sent ?? 0, failed: data?.failed ?? 0 };
  } catch {
    return { sent: 0, failed: 0 };
  }
}

/** Mark a scraped business as claimed (called after successful onboarding). */
export async function markScrapedBizClaimed(scrapedId: string): Promise<boolean> {
  if (!supabase || !scrapedId) return false;
  try {
    const { error } = await supabase
      .from('scraped_businesses')
      .update({ enrichment_status: 'claimed' })
      .eq('id', scrapedId);
    return !error;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD MANAGEMENT SYSTEM — data functions
// ═══════════════════════════════════════════════════════════════════════════════

export type LeadStage    = 'new'|'contacted'|'qualified'|'proposal'|'negotiation'|'won'|'lost';
export type LeadPriority = 'low'|'medium'|'high'|'urgent';
export type LeadSource   = 'manual'|'csv'|'scrape'|'campaign'|'referral'|'walk_in'|'website';
export type ActivityType = 'note'|'call'|'email'|'whatsapp'|'sms'|'meeting'|'stage_change'|
                           'follow_up_set'|'follow_up_done'|'proposal_sent'|'won'|'lost';

export interface Lead {
  id: string; business_id: string; name: string; phone?: string; email?: string;
  company?: string; source_url?: string; stage: LeadStage; priority: LeadPriority;
  deal_value?: number; product_interest?: string; source: LeadSource;
  scraped_biz_id?: string; proposal_sent_at?: string; proposal_url?: string;
  won_at?: string; lost_at?: string; lost_reason?: string; closed_value?: number;
  notes?: string; tags?: string[]; created_at: string; updated_at: string;
  // UI-only enriched fields
  follow_up_count?: number; overdue_follow_ups?: number;
}

export interface LeadActivity {
  id: string; lead_id: string; business_id: string; type: ActivityType;
  title: string; body?: string; old_stage?: string; new_stage?: string; created_at: string;
}

export interface LeadFollowUp {
  id: string; lead_id: string; business_id: string; type: string;
  title: string; notes?: string; due_at: string;
  reminder_sent: boolean; completed: boolean; completed_at?: string; created_at: string;
}

export interface ScrapedBizForImport {
  id: string; name: string; address: string | null; phone: string | null;
  category: string | null; lat?: number | null; lng?: number | null;
}

/**
 * Fetches leads for a business, enriched with follow_up_count and overdue_follow_ups.
 * Returns null if Supabase is unavailable or the table doesn't exist yet.
 * Returns [] if the table exists but has no leads.
 */
export async function fetchLeads(businessId: string): Promise<Lead[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[leads] fetch error', error.message); return null; }

    const leads = (data ?? []) as Lead[];
    if (leads.length === 0) return leads;

    // Enrich with follow-up counts from lead_follow_ups
    const leadIds = leads.map(l => l.id);
    const now = new Date().toISOString();
    const { data: fuData } = await supabase
      .from('lead_follow_ups')
      .select('lead_id, due_at, completed')
      .in('lead_id', leadIds)
      .eq('completed', false);

    const fuMap: Record<string, { total: number; overdue: number }> = {};
    for (const fu of (fuData ?? [])) {
      if (!fuMap[fu.lead_id]) fuMap[fu.lead_id] = { total: 0, overdue: 0 };
      fuMap[fu.lead_id].total += 1;
      if (fu.due_at < now) fuMap[fu.lead_id].overdue += 1;
    }

    return leads.map(l => ({
      ...l,
      follow_up_count:   fuMap[l.id]?.total   ?? 0,
      overdue_follow_ups: fuMap[l.id]?.overdue ?? 0,
    }));
  } catch { return null; }
}

export async function insertLead(lead: Omit<Lead,'id'|'created_at'|'updated_at'>): Promise<Lead|null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert(lead)
      .select()
      .single();
    if (error) { console.warn('[leads] insert error', error.message); return null; }
    return data as Lead;
  } catch { return null; }
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('leads')
      .update(patch)
      .eq('id', id);
    if (error) { console.warn('[leads] update error', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function deleteLead(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { console.warn('[leads] delete error', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function fetchLeadActivities(leadId: string): Promise<LeadActivity[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[lead_activities] fetch error', error.message); return []; }
    return (data ?? []) as LeadActivity[];
  } catch { return []; }
}

export async function insertLeadActivity(a: Omit<LeadActivity,'id'|'created_at'>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('lead_activities').insert(a);
    if (error) { console.warn('[lead_activities] insert error', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function fetchLeadFollowUps(leadId: string): Promise<LeadFollowUp[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lead_follow_ups')
      .select('*')
      .eq('lead_id', leadId)
      .order('due_at', { ascending: true });
    if (error) { console.warn('[lead_follow_ups] fetch error', error.message); return []; }
    return (data ?? []) as LeadFollowUp[];
  } catch { return []; }
}

export async function insertLeadFollowUp(fu: Omit<LeadFollowUp,'id'|'created_at'>): Promise<LeadFollowUp|null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('lead_follow_ups')
      .insert(fu)
      .select()
      .single();
    if (error) { console.warn('[lead_follow_ups] insert error', error.message); return null; }
    return data as LeadFollowUp;
  } catch { return null; }
}

export async function completeFollowUp(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('lead_follow_ups')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { console.warn('[lead_follow_ups] complete error', error.message); return false; }
    return true;
  } catch { return false; }
}

export async function fetchScrapedForImport(
  bizId: string, limit: number, offset: number, search: string
): Promise<ScrapedBizForImport[]> {
  if (!supabase) return [];
  try {
    let q = supabase
      .from('scraped_businesses')
      .select('id, name, address, phone, category, lat, lng')
      .not('id', 'in',
        supabase.from('leads').select('scraped_biz_id').eq('business_id', bizId).not('scraped_biz_id', 'is', null)
      )
      .range(offset, offset + limit - 1);
    if (search.trim()) {
      q = q.ilike('name', `%${search.trim()}%`);
    }
    const { data, error } = await q;
    if (error) { console.warn('[scraped_for_import] fetch error', error.message); return []; }
    return (data ?? []) as ScrapedBizForImport[];
  } catch { return []; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD MATCHING — AI-powered historical lead search
// ═══════════════════════════════════════════════════════════════════════════════

export interface LeadMatchResult {
  lead: Lead;
  confidence: number;  // 0–100
  matchReason: string;
  lastActivity?: LeadActivity;
  lastFollowUp?: LeadFollowUp;
}

export interface LeadMatchLink {
  id: string;
  business_id: string;
  primary_lead_id: string;
  linked_lead_id: string;
  confidence: number;
  linked_by: 'auto' | 'manual';
  created_at: string;
}

/**
 * Fuzzy-search historical leads by name / phone / email / company.
 * Calls the search_similar_leads Postgres RPC (requires pg_trgm extension).
 * Returns enriched results with last activity + follow-up context.
 */
export async function searchSimilarLeads(
  businessId: string,
  query: { name?: string; phone?: string; email?: string; company?: string },
  excludeId?: string,
): Promise<LeadMatchResult[]> {
  if (!supabase) return [];
  const { name, phone, email, company } = query;
  if (!name && !phone && !email && !company) return [];
  try {
    const { data: rows, error } = await supabase.rpc('search_similar_leads', {
      p_business_id: businessId,
      p_name:        name    || null,
      p_phone:       phone   || null,
      p_email:       email   || null,
      p_company:     company || null,
      p_exclude_id:  excludeId || null,
      p_limit:       5,
    });
    if (error) { console.warn('[lead_match] rpc error', error.message); return []; }
    if (!rows || rows.length === 0) return [];

    // Fetch full lead data for matched IDs
    const ids = rows.map((r: { lead_id: string }) => r.lead_id);
    const { data: leads } = await supabase.from('leads').select('*').in('id', ids);
    if (!leads) return [];

    // Fetch last activity for each matched lead
    const { data: activities } = await supabase
      .from('lead_activities')
      .select('*')
      .in('lead_id', ids)
      .order('created_at', { ascending: false });

    // Fetch last follow-up for each matched lead
    const { data: followUps } = await supabase
      .from('lead_follow_ups')
      .select('*')
      .in('lead_id', ids)
      .eq('completed', false)
      .order('due_at', { ascending: true });

    return rows.map((r: { lead_id: string; confidence: number; match_reason: string }) => {
      const lead = leads.find((l: Lead) => l.id === r.lead_id);
      if (!lead) return null;
      return {
        lead: lead as Lead,
        confidence: Number(r.confidence),
        matchReason: r.match_reason,
        lastActivity: (activities ?? []).find((a: LeadActivity) => a.lead_id === r.lead_id),
        lastFollowUp: (followUps  ?? []).find((f: LeadFollowUp) => f.lead_id === r.lead_id),
      };
    }).filter(Boolean) as LeadMatchResult[];
  } catch { return []; }
}

/** Fetch last N activities for a lead (mini-timeline in match panel). */
export async function fetchLeadMiniTimeline(leadId: string, limit = 8): Promise<LeadActivity[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return [];
    return (data ?? []) as LeadActivity[];
  } catch { return []; }
}

/** Link two leads as the same entity (e.g., same person under different names). */
export async function linkLeads(
  businessId: string,
  primaryLeadId: string,
  linkedLeadId: string,
  confidence: number,
  linkedBy: 'auto' | 'manual' = 'manual',
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('lead_match_links').upsert({
      business_id: businessId,
      primary_lead_id: primaryLeadId,
      linked_lead_id: linkedLeadId,
      confidence,
      linked_by: linkedBy,
    }, { onConflict: 'primary_lead_id,linked_lead_id' });
    return !error;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OUTREACH / BULK MARKETING — types & data functions
// ═══════════════════════════════════════════════════════════════════════════════

export type OutreachChannel = 'email' | 'whatsapp' | 'sms' | 'multi';
export type OutreachStatus  = 'draft' | 'scheduled' | 'warming_up' | 'running' | 'paused' | 'completed' | 'failed';
export type RecipientStatus = 'pending' | 'queued' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'failed' | 'bounced' | 'unsubscribed' | 'skipped';

export interface OutreachCampaign {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  channel: OutreachChannel;
  status: OutreachStatus;
  // Content
  subject?: string;
  body: string;
  template_id?: string;
  // Counters
  total_recipients: number;
  queued_count: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  bounced_count: number;
  unsubscribed_count: number;
  // Scheduling
  scheduled_at?: string;
  completed_at?: string;
  send_window_start: string;
  send_window_end: string;
  timezone: string;
  // Batching
  batch_size: number;
  batch_interval_minutes: number;
  // Sender
  sender_identity_id?: string;
  warmup_enabled: boolean;
  utm_source?: string;
  utm_campaign?: string;
  created_at: string;
  updated_at: string;
}

export interface OutreachRecipient {
  id: string;
  campaign_id: string;
  business_id: string;
  name?: string;
  email?: string;
  phone?: string;
  lead_id?: string;
  status: RecipientStatus;
  error_message?: string;
  batch_number?: number;
  queued_at?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  created_at: string;
}

export interface OutreachBatch {
  id: string;
  campaign_id: string;
  batch_number: number;
  total_count: number;
  sent_count: number;
  failed_count: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface SenderIdentity {
  id: string;
  business_id: string;
  channel: 'email' | 'whatsapp' | 'sms';
  display_name: string;
  from_email?: string;
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_use_tls?: boolean;
  wa_number?: string;
  sms_sender_id?: string;
  warmup_enabled: boolean;
  warmup_day: number;
  warmup_daily_limit: number;
  warmup_today_sent: number;
  reputation_score: number;
  bounce_rate: number;
  spam_rate: number;
  is_verified: boolean;
  is_default: boolean;
  created_at: string;
}

// ── CRUD functions ────────────────────────────────────────────────────────────

export async function fetchOutreachCampaigns(businessId: string): Promise<OutreachCampaign[] | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) { console.warn('[outreach] fetch error', error.message); return null; }
    return (data ?? []) as OutreachCampaign[];
  } catch { return null; }
}

export async function insertOutreachCampaign(
  campaign: Omit<OutreachCampaign, 'id' | 'created_at' | 'updated_at' | 'total_recipients' | 'queued_count' | 'sent_count' | 'delivered_count' | 'opened_count' | 'clicked_count' | 'failed_count' | 'bounced_count' | 'unsubscribed_count'>
): Promise<OutreachCampaign | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('outreach_campaigns')
      .insert(campaign)
      .select()
      .single();
    if (error) { console.warn('[outreach] insert error', error.message); return null; }
    return data as OutreachCampaign;
  } catch { return null; }
}

export async function updateOutreachCampaign(id: string, patch: Partial<OutreachCampaign>): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('outreach_campaigns').update(patch).eq('id', id);
    return !error;
  } catch { return false; }
}

export async function deleteOutreachCampaign(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('outreach_campaigns').delete().eq('id', id);
    return !error;
  } catch { return false; }
}

/** Bulk-insert recipients for a campaign. Deduplicates by email/phone. */
export async function insertOutreachRecipients(
  recipients: Omit<OutreachRecipient, 'id' | 'created_at' | 'status' | 'batch_number'>[],
): Promise<number> {
  if (!supabase || recipients.length === 0) return 0;
  try {
    const { data, error } = await supabase
      .from('outreach_recipients')
      .insert(recipients.map(r => ({ ...r, status: 'pending' })))
      .select('id');
    if (error) { console.warn('[outreach_recipients] insert error', error.message); return 0; }
    return data?.length ?? 0;
  } catch { return 0; }
}

export async function fetchOutreachRecipients(
  campaignId: string,
  limit = 200,
  offset = 0,
): Promise<OutreachRecipient[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('outreach_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .range(offset, offset + limit - 1);
    if (error) return [];
    return (data ?? []) as OutreachRecipient[];
  } catch { return []; }
}

export async function fetchSenderIdentities(businessId: string): Promise<SenderIdentity[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('sender_identities')
      .select('*')
      .eq('business_id', businessId)
      .order('is_default', { ascending: false });
    if (error) return [];
    return (data ?? []) as SenderIdentity[];
  } catch { return []; }
}

export async function upsertSenderIdentity(
  identity: Omit<SenderIdentity, 'id' | 'created_at' | 'warmup_day' | 'warmup_today_sent' | 'reputation_score' | 'bounce_rate' | 'spam_rate'> & { id?: string }
): Promise<SenderIdentity | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('sender_identities')
      .upsert(identity)
      .select()
      .single();
    if (error) { console.warn('[sender_identity] upsert error', error.message); return null; }
    return data as SenderIdentity;
  } catch { return null; }
}

export async function deleteSenderIdentity(id: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('sender_identities').delete().eq('id', id);
    return !error;
  } catch { return false; }
}

/** Add an unsubscribe record (called from the unsubscribe edge function). */
export async function addUnsubscribe(
  businessId: string,
  contact: { email?: string; phone?: string },
  channel: 'email' | 'whatsapp' | 'sms' | 'all' = 'all',
  reason?: string,
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('outreach_unsubscribes').upsert({
      business_id: businessId,
      email: contact.email || null,
      phone: contact.phone || null,
      channel,
      reason: reason || null,
    });
    return !error;
  } catch { return false; }
}

/** Check if a contact is unsubscribed for a given channel. */
export async function isUnsubscribed(
  businessId: string,
  contact: { email?: string; phone?: string },
  channel: 'email' | 'whatsapp' | 'sms',
): Promise<boolean> {
  if (!supabase) return false;
  try {
    let q = supabase
      .from('outreach_unsubscribes')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .in('channel', [channel, 'all']);
    if (contact.email) q = q.eq('email', contact.email);
    else if (contact.phone) q = q.eq('phone', contact.phone);
    const { count } = await q;
    return (count ?? 0) > 0;
  } catch { return false; }
}

/**
 * Schedule a campaign: creates outreach_batches rows distributed across the send window.
 * Called client-side after campaign is created — Edge Function picks them up.
 */
export async function scheduleCampaignBatches(campaign: OutreachCampaign): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Fetch all pending recipients
    const { data: recipients, error: rErr } = await supabase
      .from('outreach_recipients')
      .select('id')
      .eq('campaign_id', campaign.id)
      .eq('status', 'pending');
    if (rErr || !recipients || recipients.length === 0) return false;

    const total      = recipients.length;
    const batchSize  = campaign.batch_size;
    const numBatches = Math.ceil(total / batchSize);

    // Distribute batches across send window
    const start    = campaign.scheduled_at ? new Date(campaign.scheduled_at) : new Date();
    const [sh, sm] = campaign.send_window_start.split(':').map(Number);
    const [eh, em] = campaign.send_window_end.split(':').map(Number);
    const windowMinutes = (eh * 60 + em) - (sh * 60 + sm);
    const intervalMinutes = numBatches > 1
      ? Math.max(campaign.batch_interval_minutes, Math.floor(windowMinutes / numBatches))
      : 0;

    const batches = Array.from({ length: numBatches }, (_, i) => {
      const scheduledAt = new Date(start.getTime() + i * intervalMinutes * 60000);
      return {
        campaign_id:  campaign.id,
        batch_number: i + 1,
        total_count:  i < numBatches - 1 ? batchSize : total - i * batchSize,
        status:       'pending' as const,
        scheduled_at: scheduledAt.toISOString(),
      };
    });

    const { error: bErr } = await supabase.from('outreach_batches').insert(batches);
    if (bErr) { console.warn('[outreach_batches] schedule error', bErr.message); return false; }

    // Assign batch numbers to recipients
    for (let i = 0; i < numBatches; i++) {
      const ids = recipients.slice(i * batchSize, (i + 1) * batchSize).map(r => r.id);
      await supabase
        .from('outreach_recipients')
        .update({ batch_number: i + 1, status: 'queued' })
        .in('id', ids);
    }

    // Mark campaign as scheduled/running
    await supabase
      .from('outreach_campaigns')
      .update({ status: campaign.scheduled_at ? 'scheduled' : 'running', queued_count: total })
      .eq('id', campaign.id);

    return true;
  } catch { return false; }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD LINEAGE — Entity graph, timeline aggregation, AI similarity matching
// ═══════════════════════════════════════════════════════════════════════════════

/** Canonical entity record (person / company). Multiple leads share one entity. */
export interface LeadEntity {
  id: string;
  business_id: string;
  entity_type: 'person' | 'company' | 'both';
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  total_deals: number;
  total_value: number;
  last_stage?: string;
  last_seen_at?: string;
  created_at: string;
}

/** A single entry in the lineage timeline — one lead + its latest activity snippet */
export interface LeadLineageEntry {
  lead: Lead;
  latestActivity?: LeadActivity;
  activitiesCount: number;
  followUpsCount: number;
  overdueFollowUps: number;
}

/** Result from search_similar_entities RPC */
export interface EntityMatchResult {
  entity_id: string;
  confidence: number;
  match_reason: string;
  entity?: LeadEntity;
}

/** Create a new canonical entity. */
export async function createLeadEntity(
  entity: Omit<LeadEntity, 'id' | 'total_deals' | 'total_value' | 'created_at'>
): Promise<LeadEntity | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('lead_entities')
      .insert({ ...entity, total_deals: 0, total_value: 0 })
      .select()
      .single();
    if (error) { console.warn('[lead_entities] insert error', error.message); return null; }
    return data as LeadEntity;
  } catch { return null; }
}

/** Find an existing entity that matches this lead, or create one. */
export async function createOrFindLeadEntity(params: {
  businessId: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  entityType?: 'person' | 'company' | 'both';
  confidenceThreshold?: number;
}): Promise<{ entity: LeadEntity; created: boolean } | null> {
  if (!supabase) return null;
  try {
    const threshold = params.confidenceThreshold ?? 60;
    const { data: matches, error: rpcErr } = await supabase.rpc('search_similar_entities', {
      p_business_id: params.businessId,
      p_name:        params.name        || null,
      p_phone:       params.phone       || null,
      p_email:       params.email       || null,
      p_company:     params.company     || null,
      p_limit:       3,
    });
    if (rpcErr) console.warn('[search_similar_entities]', rpcErr.message);
    const topMatch = (matches ?? []).find((m: EntityMatchResult) => m.confidence >= threshold);
    if (topMatch) {
      const { data: ent } = await supabase.from('lead_entities').select('*').eq('id', topMatch.entity_id).single();
      if (ent) return { entity: ent as LeadEntity, created: false };
    }
    const { data: newEnt, error: insErr } = await supabase
      .from('lead_entities')
      .insert({ business_id: params.businessId, entity_type: params.entityType ?? 'person', name: params.name, phone: params.phone || null, email: params.email || null, company: params.company || null, total_deals: 0, total_value: 0 })
      .select().single();
    if (insErr) { console.warn('[lead_entities] create error', insErr.message); return null; }
    return { entity: newEnt as LeadEntity, created: true };
  } catch { return null; }
}

/** Link a lead to an entity by setting entity_id. */
export async function linkLeadToEntity(leadId: string, entityId: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('leads').update({ entity_id: entityId }).eq('id', leadId);
    if (error) { console.warn('[linkLeadToEntity]', error.message); return false; }
    return true;
  } catch { return false; }
}

/** Fetch the entity record for a given lead (via entity_id). */
export async function fetchLeadEntity(leadId: string): Promise<LeadEntity | null> {
  if (!supabase) return null;
  try {
    const { data: lead } = await supabase.from('leads').select('entity_id').eq('id', leadId).single();
    if (!lead?.entity_id) return null;
    const { data: entity } = await supabase.from('lead_entities').select('*').eq('id', lead.entity_id).single();
    return (entity as LeadEntity) ?? null;
  } catch { return null; }
}

/** Fetch the full lineage for an entity: all linked leads + activity summaries. */
export async function fetchEntityLineage(entityId: string): Promise<LeadLineageEntry[]> {
  if (!supabase) return [];
  try {
    const { data: leads, error: lErr } = await supabase.from('leads').select('*').eq('entity_id', entityId).order('created_at', { ascending: true });
    if (lErr || !leads?.length) return [];
    const leadIds = leads.map(l => l.id);
    const { data: actCounts } = await supabase.from('lead_activities').select('lead_id').in('lead_id', leadIds);
    const actCountMap: Record<string, number> = {};
    (actCounts ?? []).forEach((a: { lead_id: string }) => { actCountMap[a.lead_id] = (actCountMap[a.lead_id] ?? 0) + 1; });
    const { data: latestActs } = await supabase.from('lead_activities').select('*').in('lead_id', leadIds).order('created_at', { ascending: false });
    const latestActMap: Record<string, LeadActivity> = {};
    (latestActs ?? []).forEach((a: LeadActivity) => { if (!latestActMap[a.lead_id]) latestActMap[a.lead_id] = a; });
    const now = new Date().toISOString();
    const { data: fus } = await supabase.from('lead_follow_ups').select('lead_id, due_at, completed').in('lead_id', leadIds).eq('completed', false);
    const fuCountMap: Record<string, number> = {};
    const fuOverdueMap: Record<string, number> = {};
    (fus ?? []).forEach((f: { lead_id: string; due_at: string; completed: boolean }) => {
      fuCountMap[f.lead_id] = (fuCountMap[f.lead_id] ?? 0) + 1;
      if (f.due_at < now) fuOverdueMap[f.lead_id] = (fuOverdueMap[f.lead_id] ?? 0) + 1;
    });
    return leads.map(l => ({ lead: l as Lead, latestActivity: latestActMap[l.id], activitiesCount: actCountMap[l.id] ?? 0, followUpsCount: fuCountMap[l.id] ?? 0, overdueFollowUps: fuOverdueMap[l.id] ?? 0 }));
  } catch { return []; }
}

/** Fetch all leads for a business that fuzzy-match a given lead by name/phone/email/company. */
export async function fetchSimilarLeadsForLineage(
  businessId: string,
  lead: { name?: string; phone?: string; email?: string; company?: string; id?: string },
): Promise<Lead[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const nameLower    = (lead.name    ?? '').toLowerCase().trim();
    const phoneTrimmed = (lead.phone   ?? '').replace(/\D/g, '');
    const emailLower   = (lead.email   ?? '').toLowerCase().trim();
    const companyLower = (lead.company ?? '').toLowerCase().trim();

    return (data as Lead[]).filter(l => {
      if (l.id === lead.id) return false;

      // Phone match (exact digits)
      if (phoneTrimmed && l.phone && l.phone.replace(/\D/g, '') === phoneTrimmed) return true;
      // Email match (exact)
      if (emailLower && l.email && l.email.toLowerCase() === emailLower) return true;

      // Name fuzzy match (first 4+ chars)
      if (nameLower.length >= 3) {
        const lNameLower  = (l.name ?? '').toLowerCase();
        const namePrefix  = nameLower.slice(0, Math.max(4, Math.floor(nameLower.length * 0.6)));
        const lNamePrefix = lNameLower.slice(0, Math.max(4, Math.floor(lNameLower.length * 0.6)));
        if (lNameLower.includes(namePrefix) || nameLower.includes(lNamePrefix)) return true;
      }

      // Company match
      if (companyLower.length >= 3 && l.company) {
        const companyPrefix = companyLower.slice(0, Math.max(4, Math.floor(companyLower.length * 0.6)));
        if (l.company.toLowerCase().includes(companyPrefix)) return true;
      }

      return false;
    });
  } catch (e) {
    console.warn('[fetchSimilarLeadsForLineage]', e);
    return [];
  }
}

/** Search for similar entities (enriched with full entity rows). */
export async function searchSimilarEntities(params: { businessId: string; name?: string; phone?: string; email?: string; company?: string; limit?: number }): Promise<EntityMatchResult[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.rpc('search_similar_entities', { p_business_id: params.businessId, p_name: params.name || null, p_phone: params.phone || null, p_email: params.email || null, p_company: params.company || null, p_limit: params.limit ?? 5 });
    if (error) { console.warn('[searchSimilarEntities]', error.message); return []; }
    if (!data?.length) return [];
    const entityIds = data.map((r: EntityMatchResult) => r.entity_id);
    const { data: entities } = await supabase.from('lead_entities').select('*').in('id', entityIds);
    const entityMap: Record<string, LeadEntity> = {};
    (entities ?? []).forEach((e: LeadEntity) => { entityMap[e.id] = e; });
    return data.map((r: EntityMatchResult) => ({ ...r, entity: entityMap[r.entity_id] }));
  } catch { return []; }
}

/** Batch-match import rows against existing entities. Returns map: rowIndex → best match or null. */
export async function batchMatchEntities(
  businessId: string,
  rows: Array<{ name?: string; phone?: string; email?: string; company?: string }>,
  confidenceThreshold = 55,
): Promise<Map<number, EntityMatchResult | null>> {
  const result = new Map<number, EntityMatchResult | null>();
  if (!supabase) { rows.forEach((_, i) => result.set(i, null)); return result; }
  const CHUNK = 5;
  for (let start = 0; start < rows.length; start += CHUNK) {
    const chunk = rows.slice(start, start + CHUNK);
    const matches = await Promise.all(chunk.map(row => searchSimilarEntities({ businessId, ...row, limit: 1 })));
    matches.forEach((m, i) => {
      const best = m[0] ?? null;
      result.set(start + i, best && best.confidence >= confidenceThreshold ? best : null);
    });
  }
  return result;
}

/** Cluster interface for import preview */
export interface ImportCluster {
  entityId: string | null;
  entityName: string;
  confidence: number;
  matchReason: string;
  isNew: boolean;
  rowIndexes: number[];
  entity?: LeadEntity;
}

/** Group import rows into entity clusters for AI lineage mapping preview. */
export async function groupImportRowsByEntity(
  businessId: string,
  rows: Array<{ name?: string; phone?: string; email?: string; company?: string }>,
): Promise<ImportCluster[]> {
  const matchMap = await batchMatchEntities(businessId, rows, 55);
  const clusters = new Map<string, ImportCluster>();
  rows.forEach((row, i) => {
    const match = matchMap.get(i);
    if (match) {
      const existing = clusters.get(match.entity_id);
      if (existing) { existing.rowIndexes.push(i); existing.confidence = Math.max(existing.confidence, match.confidence); }
      else clusters.set(match.entity_id, { entityId: match.entity_id, entityName: match.entity?.name ?? row.name ?? 'Unknown', confidence: match.confidence, matchReason: match.match_reason, isNew: false, rowIndexes: [i], entity: match.entity });
    } else {
      const key = `new::${row.name ?? ''}::${row.phone ?? ''}::${row.email ?? ''}`;
      const existing = clusters.get(key);
      if (existing) existing.rowIndexes.push(i);
      else clusters.set(key, { entityId: null, entityName: row.name ?? 'Unknown', confidence: 0, matchReason: 'New entity', isNew: true, rowIndexes: [i] });
    }
  });
  return Array.from(clusters.values()).sort((a, b) => b.confidence - a.confidence);
}

// ── Business Photos API ──────────────────────────────────────────────────────

export interface BusinessPhoto {
  id: string;
  business_id: string;
  url: string;
  is_cover: boolean;
  order_idx: number;
  uploaded_at: string;
}

/** Upload a single photo to business-photos bucket */
export async function uploadBusinessPhoto(
  file: File,
  businessId: string,
  uploadedBy?: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Supabase not initialized' };
  if (!file.type.startsWith('image/')) return { url: null, error: 'File must be an image' };

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${businessId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from('business-photos').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    console.warn('[business-photos] upload error', error.message);
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from('business-photos').getPublicUrl(path);
  const publicUrl = data?.publicUrl ?? null;

  return { url: publicUrl, error: null };
}

/** Fetch all photos for a business */
export async function fetchBusinessPhotos(businessId: string): Promise<BusinessPhoto[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('business_photos')
    .select('*')
    .eq('business_id', businessId)
    .order('order_idx', { ascending: true });

  if (error) {
    console.warn('[business_photos] fetch error', error.message);
    return [];
  }

  return (data ?? []).map((row: any) => ({
    id: row.id,
    business_id: row.business_id,
    url: row.url,
    is_cover: row.is_cover,
    order_idx: row.order_idx,
    uploaded_at: row.uploaded_at,
  }));
}


/** Upsert business photos (update order and cover status) */

/** Insert a new photo record in database */
export async function insertBusinessPhoto(
  businessId: string,
  url: string,
  isCover = false,
  order = 0,
): Promise<BusinessPhoto | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('business_photos')
    .insert({
      business_id: businessId,
      url,
      is_cover: isCover,
      order: order,
    })
    .select()
    .single();

  if (error) {
    console.warn('[business_photos] insert error', error.message);
    return null;
  }

  return (
    data && {
      id: data.id,
      url: data.url,
      isCover: data.is_cover,
      order: data.order,
    }
  );
}

/** Delete a photo */
export async function deleteBusinessPhoto(photoId: string): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase
    .from('business_photos')
    .delete()
    .eq('id', photoId);

  if (error) {
    console.warn('[business_photos] delete error', error.message);
    return false;
  }

  return true;
}

// ─── Enhanced Onboarding: Document Management ────────────────────────────

/** Upload a business document to Supabase storage */
export async function uploadBusinessDocument(
  file: File,
  businessId: string,
  documentType: string,
): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Supabase not initialized' };

  try {
    const ext = file.name.split('.').pop() || 'pdf';
    const path = `${businessId}/${documentType}/${Date.now()}.${ext}`;

    const { data, error: uploadError } = await supabase.storage
      .from('business-documents')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from('business-documents')
      .getPublicUrl(path);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    console.error('Document upload failed:', err);
    return { url: null, error: 'Upload failed' };
  }
}

/** Delete a business document */
export async function deleteBusinessDocument(
  businessId: string,
  documentType: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase not initialized' };

  try {
    const { error: deleteError } = await supabase
      .from('business_documents')
      .delete()
      .eq('business_id', businessId)
      .eq('document_type', documentType);

    if (deleteError) {
      return { ok: false, error: deleteError.message };
    }

    return { ok: true, error: null };
  } catch (err) {
    console.error('Document deletion failed:', err);
    return { ok: false, error: 'Deletion failed' };
  }
}

/** Fetch all documents for a business */
export async function fetchBusinessDocuments(businessId: string) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('business_documents')
    .select('*')
    .eq('business_id', businessId);

  if (error) {
    console.warn('[business_documents] fetch error', error.message);
    return [];
  }

  return data || [];
}

// ─── Profile Updates ─────────────────────────────────────────────────────

/** Update business location */
export async function updateBusinessLocation(
  businessId: string,
  lat: number,
  lng: number,
  address: string,
): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase not initialized' };

  try {
    const { error: updateError } = await supabase
      .from('businesses')
      .update({
        lat,
        lng,
        address,
      })
      .eq('id', businessId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Also update in biz_users for profile consistency
    await supabase
      .from('biz_users')
      .update({
        map_lat: lat,
        map_lng: lng,
      })
      .eq('business_id', businessId);

    return { ok: true, error: null };
  } catch (err) {
    console.error('Location update failed:', err);
    return { ok: false, error: 'Update failed' };
  }
}

/** Update business service coverage */
export async function updateBusinessServices(
  businessId: string,
  radius: number,
  areas: string[],
): Promise<{ ok: boolean; error: string | null }> {
  if (!supabase) return { ok: false, error: 'Supabase not initialized' };

  try {
    const { error: updateError } = await supabase
      .from('biz_users')
      .update({
        service_radius: radius,
        service_areas: areas,
      })
      .eq('business_id', businessId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, error: null };
  } catch (err) {
    console.error('Services update failed:', err);
    return { ok: false, error: 'Update failed' };
  }
}

/** ─────── Campaign Management ─────── */
export async function fetchCampaignsForBusiness(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch campaigns failed:', err);
    return [];
  }
}

export async function createCampaignForBusiness(
  businessId: string,
  name: string,
  messageTemplate: string,
  channel: 'whatsapp' | 'sms' | 'push',
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('campaigns')
      .insert({
        business_id: businessId,
        name,
        message_template: messageTemplate,
        channel,
        status: 'draft',
      });
    return !error;
  } catch (err) {
    console.error('Create campaign failed:', err);
    return false;
  }
}

export async function updateCampaignForBusiness(
  campaignId: string,
  patch: Partial<{ name: string; message_template: string; status: string }>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('campaigns')
      .update(patch)
      .eq('id', campaignId);
    return !error;
  } catch (err) {
    console.error('Update campaign failed:', err);
    return false;
  }
}

export async function deleteCampaignForBusiness(campaignId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
    return !error;
  } catch (err) {
    console.error('Delete campaign failed:', err);
    return false;
  }
}

/** ─────── Business Notifications ─────── */
export async function fetchBusinessNotifications(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('in_app_notifications')
      .select('*')
      .eq('user_id', businessId)
      .eq('user_type', 'business')
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch notifications failed:', err);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    return !error;
  } catch (err) {
    console.error('Mark notification read failed:', err);
    return false;
  }
}

export async function markAllNotificationsRead(businessId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('in_app_notifications')
      .update({ is_read: true })
      .eq('user_id', businessId)
      .eq('user_type', 'business')
      .eq('is_read', false);
    return !error;
  } catch (err) {
    console.error('Mark all notifications read failed:', err);
    return false;
  }
}

/** ─────── Team Members Management ─────── */
export async function fetchBusinessTeamMembers(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('business_team_members')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch team members failed:', err);
    return [];
  }
}

export async function createTeamMember(
  businessId: string,
  data: {
    name: string;
    email: string;
    phone?: string;
    password?: string;
    role_id?: string;
    permissions?: Record<string, string>;
    status?: 'invited' | 'active' | 'inactive';
  },
) {
  if (!supabase) return { ok: false, error: 'Supabase not initialized', id: null };
  try {
    const insertData = {
      business_id: businessId,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      password: data.password || null,
      role_id: data.role_id || null,
      permissions: data.permissions || null,
      status: data.status || 'invited',
      first_login: !!data.password,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error } = await supabase
      .from('business_team_members')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return { ok: false, error: error.message, id: null };
    }

    return { ok: true, error: null, id: inserted?.id };
  } catch (err) {
    console.error('Create team member failed:', err);
    return { ok: false, error: 'Failed to create team member', id: null };
  }
}

export async function updateTeamMember(
  teamMemberId: string,
  patch: Partial<{ name: string; email: string; role: string; permissions: Record<string, string> }>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('business_team_members')
      .update(patch)
      .eq('id', teamMemberId);
    return !error;
  } catch (err) {
    console.error('Update team member failed:', err);
    return false;
  }
}

export async function deleteTeamMember(teamMemberId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('business_team_members')
      .delete()
      .eq('id', teamMemberId);
    return !error;
  } catch (err) {
    console.error('Delete team member failed:', err);
    return false;
  }
}

/** ─────── Invoices / Payment Submissions ─────── */
export async function fetchPaymentSubmissionsForBusiness(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch payment submissions failed:', err);
    return [];
  }
}

export async function updatePaymentSubmissionStatus(
  paymentId: string,
  status: 'pending' | 'acknowledged' | 'approved' | 'rejected',
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('payment_submissions')
      .update({ status })
      .eq('id', paymentId);
    return !error;
  } catch (err) {
    console.error('Update payment status failed:', err);
    return false;
  }
}

/** ─────── EMAIL PROVIDER CONFIGS ─────── */
export async function fetchEmailProviderConfigs(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('email_provider_configs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch email provider configs failed:', err);
    return [];
  }
}

export async function createEmailProviderConfig(
  businessId: string,
  config: {
    provider_type: string;
    provider_name: string;
    config_data: Record<string, any>;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('email_provider_configs')
      .insert([{ business_id: businessId, ...config }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create email provider config failed:', err);
    return null;
  }
}

export async function updateEmailProviderConfig(
  configId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('email_provider_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', configId);
    return !error;
  } catch (err) {
    console.error('Update email provider config failed:', err);
    return false;
  }
}

export async function deleteEmailProviderConfig(configId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('email_provider_configs')
      .delete()
      .eq('id', configId);
    return !error;
  } catch (err) {
    console.error('Delete email provider config failed:', err);
    return false;
  }
}

/** ─────── EMAIL SEQUENCES ─────── */
export async function fetchEmailSequences(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('email_sequences')
      .select('*')
      .eq('business_id', businessId)
      .order('step_number', { ascending: true });
    return data || [];
  } catch (err) {
    console.error('Fetch email sequences failed:', err);
    return [];
  }
}

export async function createEmailSequence(
  businessId: string,
  sequence: {
    campaign_id?: string;
    sequence_name: string;
    trigger_type: string;
    step_number: number;
    step_delay_days: number;
    email_subject: string;
    email_body: string;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('email_sequences')
      .insert([{ business_id: businessId, ...sequence }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create email sequence failed:', err);
    return null;
  }
}

export async function updateEmailSequence(
  sequenceId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('email_sequences')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', sequenceId);
    return !error;
  } catch (err) {
    console.error('Update email sequence failed:', err);
    return false;
  }
}

export async function deleteEmailSequence(sequenceId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('email_sequences')
      .delete()
      .eq('id', sequenceId);
    return !error;
  } catch (err) {
    console.error('Delete email sequence failed:', err);
    return false;
  }
}

/** ─────── SOCIAL ACCOUNTS ─────── */
export async function fetchSocialAccounts(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', businessId)
      .order('platform', { ascending: true });
    return data || [];
  } catch (err) {
    console.error('Fetch social accounts failed:', err);
    return [];
  }
}

export async function createSocialAccount(
  businessId: string,
  account: {
    platform: string;
    account_name: string;
    account_id: string;
    access_token: string;
    refresh_token?: string;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('social_accounts')
      .insert([{ business_id: businessId, ...account }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create social account failed:', err);
    return null;
  }
}

export async function updateSocialAccount(
  accountId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('social_accounts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', accountId);
    return !error;
  } catch (err) {
    console.error('Update social account failed:', err);
    return false;
  }
}

export async function deleteSocialAccount(accountId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('social_accounts')
      .delete()
      .eq('id', accountId);
    return !error;
  } catch (err) {
    console.error('Delete social account failed:', err);
    return false;
  }
}

/** ─────── SOCIAL POSTS ─────── */
export async function fetchSocialPosts(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('social_posts')
      .select('*')
      .eq('business_id', businessId)
      .order('scheduled_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch social posts failed:', err);
    return [];
  }
}

export async function createSocialPost(
  businessId: string,
  post: {
    social_account_id: string;
    platform: string;
    post_content: string;
    post_type?: string;
    media_urls?: string[];
    scheduled_at?: string;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('social_posts')
      .insert([{ business_id: businessId, ...post }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create social post failed:', err);
    return null;
  }
}

export async function updateSocialPost(
  postId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('social_posts')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', postId);
    return !error;
  } catch (err) {
    console.error('Update social post failed:', err);
    return false;
  }
}

export async function publishSocialPost(postId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('social_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', postId);
    return !error;
  } catch (err) {
    console.error('Publish social post failed:', err);
    return false;
  }
}

export async function deleteSocialPost(postId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('social_posts')
      .delete()
      .eq('id', postId);
    return !error;
  } catch (err) {
    console.error('Delete social post failed:', err);
    return false;
  }
}

/** ─────── AUTOMATION RULES ─────── */
export async function fetchAutomationRules(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch automation rules failed:', err);
    return [];
  }
}

export async function createAutomationRule(
  businessId: string,
  rule: {
    rule_name: string;
    trigger_type: string;
    trigger_conditions: Record<string, any>;
    action_type: string;
    action_config: Record<string, any>;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('automation_rules')
      .insert([{ business_id: businessId, ...rule }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create automation rule failed:', err);
    return null;
  }
}

export async function updateAutomationRule(
  ruleId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('automation_rules')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', ruleId);
    return !error;
  } catch (err) {
    console.error('Update automation rule failed:', err);
    return false;
  }
}

export async function deleteAutomationRule(ruleId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('automation_rules')
      .delete()
      .eq('id', ruleId);
    return !error;
  } catch (err) {
    console.error('Delete automation rule failed:', err);
    return false;
  }
}

/** ─────── LEAD CONNECTORS ─────── */
export async function fetchLeadConnectors(businessId: string) {
  if (!supabase) return [];
  try {
    const { data } = await supabase
      .from('lead_connectors')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    return data || [];
  } catch (err) {
    console.error('Fetch lead connectors failed:', err);
    return [];
  }
}

export async function createLeadConnector(
  businessId: string,
  connector: {
    connector_name: string;
    connector_type: string;
    source_name?: string;
    webhook_url?: string;
    api_key?: string;
    form_embed_code?: string;
    field_mapping?: Record<string, any>;
  },
) {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from('lead_connectors')
      .insert([{ business_id: businessId, ...connector }])
      .select()
      .single();
    return data;
  } catch (err) {
    console.error('Create lead connector failed:', err);
    return null;
  }
}

export async function updateLeadConnector(
  connectorId: string,
  updates: Record<string, any>,
) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('lead_connectors')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', connectorId);
    return !error;
  } catch (err) {
    console.error('Update lead connector failed:', err);
    return false;
  }
}

export async function deleteLeadConnector(connectorId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('lead_connectors')
      .delete()
      .eq('id', connectorId);
    return !error;
  } catch (err) {
    console.error('Delete lead connector failed:', err);
    return false;
  }
}

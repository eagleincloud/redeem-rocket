import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { distanceKm } from '../utils/geo';
import type { Business, Offer } from '../types';

// ─── Geofence Alert Hook ──────────────────────────────────────────────────────
// Runs once, mounted in Root.tsx.
// Watches user location vs nearby businesses. When the user moves within
// geofenceRadiusKm of a business that has approved offers (and we haven't
// alerted for this business this session), shows a toast + dispatches
// `geo:geofence_alert` for the NotificationsPage to record.

export function useGeofenceAlerts() {
  const { userLocation, locationScrapedBusinesses, geofenceRadiusKm } = useSearchCategory();

  // In-memory set: business IDs we've already alerted this session
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userLocation) return;
    if (!Array.isArray(locationScrapedBusinesses) || locationScrapedBusinesses.length === 0) return;

    for (const biz of locationScrapedBusinesses) {
      // Already alerted this session
      if (seenRef.current.has(biz.id)) continue;

      // Distance check
      const dist = distanceKm(userLocation, biz.location);
      if (dist > geofenceRadiusKm) continue;

      // Must have at least one approved offer
      const approvedOffers: Offer[] = Array.isArray(biz.offers)
        ? biz.offers.filter((o) => !o.status || o.status === 'approved')
        : [];
      if (approvedOffers.length === 0) continue;

      // Mark seen before async work to prevent double-fire
      seenRef.current.add(biz.id);

      const bestOffer = approvedOffers.sort((a, b) => b.discount - a.discount)[0];
      const distLabel = dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`;

      // Toast with action button
      toast(`📍 ${biz.name} is ${distLabel} away`, {
        description: `${bestOffer.discount}% off — ${bestOffer.title}`,
        duration: 6000,
        action: {
          label: 'View',
          onClick: () => {
            window.dispatchEvent(new CustomEvent('geo:flyto', { detail: biz.location }));
            window.dispatchEvent(new CustomEvent('geo:openbiz', { detail: biz }));
          },
        },
      });

      // Dispatch for NotificationsPage to record
      window.dispatchEvent(
        new CustomEvent('geo:geofence_alert', {
          detail: { biz, offer: bestOffer, dist },
        })
      );
    }
  }, [userLocation?.lat, userLocation?.lng, locationScrapedBusinesses, geofenceRadiusKm]); // eslint-disable-line react-hooks/exhaustive-deps
}

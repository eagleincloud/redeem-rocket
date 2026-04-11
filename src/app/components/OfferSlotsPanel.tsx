import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchCategory } from '../context/SearchCategoryContext';
import type { NearbyOffer, Business, Offer } from '../types';
import { distanceKm } from '../utils/geo';

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = 'today' | 'featured' | 'nearby' | 'hot';

interface CardData {
  business: Business;
  offer: Offer | null;
  distance?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function bestApprovedOffer(business: Business): Offer | null {
  const approved = (business.offers ?? []).filter(
    (o) => !o.status || o.status === 'approved'
  );
  if (approved.length === 0) return null;
  return approved.sort((a, b) => b.discount - a.discount)[0];
}

function distanceLabel(km?: number): string {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function discountLabel(offer: Offer | null): string {
  if (!offer) return '';
  if (offer.price && offer.price > 0) {
    const rupeeOff = Math.floor(offer.price * offer.discount / 100);
    if (rupeeOff > 0) return `₹${rupeeOff} off`;
  }
  if (offer.discount > 0) return `${offer.discount}% off`;
  return offer.title;
}

const TAB_CONFIG: { key: Tab; label: string; emoji: string }[] = [
  { key: 'today',    label: "Today",    emoji: '🔥' },
  { key: 'featured', label: "Featured", emoji: '⭐' },
  { key: 'nearby',   label: "Near You", emoji: '📍' },
  { key: 'hot',      label: "Hot",      emoji: '🏷️' },
];

// ─── Card ─────────────────────────────────────────────────────────────────────
function OfferCard({ card, onTap }: { card: CardData; onTap: () => void }) {
  const emoji = card.business.logo?.length <= 2 ? card.business.logo : '🏪';
  const disc = discountLabel(card.offer);
  const dist = distanceLabel(card.distance ?? card.business.distance);

  return (
    <button
      type="button"
      onClick={onTap}
      className="flex-shrink-0 flex flex-col gap-1 rounded-2xl p-3 text-left"
      style={{
        width: 150,
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        cursor: 'pointer',
      }}
    >
      {/* Emoji circle */}
      <div
        className="flex items-center justify-center rounded-full text-xl"
        style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.10)' }}
      >
        {emoji}
      </div>

      {/* Business name */}
      <p
        className="text-xs font-semibold leading-tight"
        style={{ color: '#f1f5f9', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {card.business.name}
      </p>

      {/* Offer title */}
      {card.offer && (
        <p
          className="text-xs leading-tight"
          style={{ color: '#94a3b8', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {card.offer.title || card.offer.description || 'Special offer'}
        </p>
      )}

      {/* Footer: discount + distance */}
      <div className="flex items-center justify-between mt-auto pt-1 gap-1" style={{ width: '100%' }}>
        {disc ? (
          <span
            className="text-xs font-bold rounded-full px-2 py-0.5"
            style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff' }}
          >
            {disc}
          </span>
        ) : (
          <span />
        )}
        {dist && (
          <span className="text-xs" style={{ color: '#64748b' }}>
            {dist}
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function OfferSlotsPanel() {
  const { nearbyOffers, locationScrapedBusinesses, mapCenter, savedLocation, userLocation } = useSearchCategory();
  const [activeTab, setActiveTab] = useState<Tab>('nearby');
  const [expanded, setExpanded] = useState(false);

  const now = Date.now();
  const focus = savedLocation ?? userLocation ?? mapCenter;

  // Today: offers expiring within 24 h, sorted soonest first
  const todayCards = useMemo<CardData[]>(() => {
    return (nearbyOffers as NearbyOffer[])
      .filter((no) => no.offer.expiresAt.getTime() - now < 86_400_000)
      .sort((a, b) => a.offer.expiresAt.getTime() - b.offer.expiresAt.getTime())
      .map((no) => ({ business: no.business, offer: no.offer, distance: no.distance }));
  }, [nearbyOffers, now]);

  // Featured: premium businesses (with or without offers)
  const featuredCards = useMemo<CardData[]>(() => {
    return locationScrapedBusinesses
      .filter((b) => b.isPremium)
      .map((b) => ({ business: b, offer: bestApprovedOffer(b), distance: b.distance }));
  }, [locationScrapedBusinesses]);

  // Nearby: offers first; fallback to all nearby businesses if no offers
  const nearbyCards = useMemo<CardData[]>(() => {
    const withOffers = [...(nearbyOffers as NearbyOffer[])]
      .sort((a, b) => a.distance - b.distance)
      .map((no) => ({ business: no.business, offer: no.offer, distance: no.distance }));
    if (withOffers.length > 0) return withOffers;
    // No offer data yet — show nearest businesses regardless
    return [...locationScrapedBusinesses]
      .map((b) => ({
        business: b,
        offer: bestApprovedOffer(b),
        distance: b.distance ?? distanceKm(focus, b.location),
      }))
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
      .slice(0, 20);
  }, [nearbyOffers, locationScrapedBusinesses, focus]);

  // Hot: all offers sorted by discount desc
  const hotCards = useMemo<CardData[]>(() => {
    return [...(nearbyOffers as NearbyOffer[])]
      .sort((a, b) => b.offer.discount - a.offer.discount)
      .map((no) => ({ business: no.business, offer: no.offer, distance: no.distance }));
  }, [nearbyOffers]);

  const cards: CardData[] =
    activeTab === 'today'    ? todayCards :
    activeTab === 'featured' ? featuredCards :
    activeTab === 'nearby'   ? nearbyCards :
    hotCards;

  // Don't render if no data at all
  const hasAnyData =
    todayCards.length > 0 ||
    featuredCards.length > 0 ||
    nearbyCards.length > 0 ||
    hotCards.length > 0;

  if (!hasAnyData) return null;

  function handleCardTap(card: CardData) {
    window.dispatchEvent(
      new CustomEvent('geo:flyto', { detail: card.business.location })
    );
    window.dispatchEvent(
      new CustomEvent('geo:openbiz', { detail: card.business })
    );
  }

  // Count badge per tab
  const counts: Record<Tab, number> = {
    today:    todayCards.length,
    featured: featuredCards.length,
    nearby:   nearbyCards.length,
    hot:      hotCards.length,
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 70,
        left: 0,
        right: 0,
        zIndex: 160,
        pointerEvents: 'auto',
      }}
    >
      {/* Tab bar — always visible */}
      <div
        className="flex items-center gap-1 px-3 py-2"
        style={{
          background: 'rgba(15,23,42,0.90)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {TAB_CONFIG.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              if (activeTab === t.key) {
                setExpanded((v) => !v);
              } else {
                setActiveTab(t.key);
                setExpanded(true);
              }
            }}
            className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all"
            style={{
              background: activeTab === t.key && expanded
                ? 'linear-gradient(135deg,#f97316,#fb923c)'
                : 'rgba(255,255,255,0.08)',
              color: activeTab === t.key && expanded ? '#fff' : '#94a3b8',
              border: activeTab === t.key && !expanded
                ? '1px solid rgba(249,115,22,0.5)'
                : '1px solid transparent',
              flexShrink: 0,
            }}
          >
            <span>{t.emoji}</span>
            <span>{t.label}</span>
            {counts[t.key] > 0 && (
              <span
                className="rounded-full text-xs font-bold px-1"
                style={{
                  background: 'rgba(255,255,255,0.20)',
                  color: '#fff',
                  minWidth: 16,
                  textAlign: 'center',
                }}
              >
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}

        {/* Chevron toggle */}
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="ml-auto rounded-full p-1 transition-transform"
          style={{
            color: '#64748b',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s',
          }}
          aria-label={expanded ? 'Collapse offers panel' : 'Expand offers panel'}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 10l5-5 5 5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Card tray — animates open/close */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="tray"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="flex gap-3 px-3 pb-3 pt-2 overflow-x-auto"
              style={{
                background: 'rgba(15,23,42,0.92)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              {cards.length === 0 ? (
                <p className="text-sm py-4 px-2" style={{ color: '#64748b' }}>
                  No {TAB_CONFIG.find(t => t.key === activeTab)?.label.toLowerCase()} offers nearby right now.
                </p>
              ) : (
                cards.slice(0, 20).map((card, i) => (
                  <OfferCard
                    key={`${card.business.id}-${i}`}
                    card={card}
                    onTap={() => handleCardTap(card)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

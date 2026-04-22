import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import type { Business } from '../types';
import {
  Navigation2,
  Star,
  Clock,
  MapPin,
  X,
  Flame,
  ShoppingCart,
  Store,
  IndianRupee,
  BadgePercent,
  Bookmark,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchBusinessById } from '../api/supabase-data';
import { getBusinessTypeKey } from '../utils/businessType';
import { savePlace, removeSavedPlace, isSaved } from './ExploreSheet';

// ── Category colour map ──────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; text: string; light: string }> = {
  restaurant: { bg: '#f97316', text: '#fff',    light: '#fff7ed' },
  grocery:    { bg: '#16a34a', text: '#fff',    light: '#f0fdf4' },
  pharmacy:   { bg: '#2563eb', text: '#fff',    light: '#eff6ff' },
  salon:      { bg: '#db2777', text: '#fff',    light: '#fdf2f8' },
  hotel:      { bg: '#7c3aed', text: '#fff',    light: '#f5f3ff' },
  atm:        { bg: '#ca8a04', text: '#fff',    light: '#fefce8' },
  other:      { bg: '#475569', text: '#fff',    light: '#f8fafc' },
};

function getCatColor(typeKey: string) {
  return CATEGORY_COLORS[typeKey] ?? CATEGORY_COLORS.other;
}

function getTimeRemaining(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return 'Ended';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h > 48) return `${Math.floor(h / 24)}d left`;
  if (h > 0)  return `${h}h ${m}m left`;
  return `${m}m left`;
}

interface Props {
  business: Business;
  onClose: () => void;
  onStartNavigation: (business: Business) => void;
  onOpenBusiness: (businessId: string) => void;
}

export function MapBusinessPopup({ business: initial, onClose, onStartNavigation, onOpenBusiness }: Props) {
  const navigate    = useNavigate();
  const { addOffer } = useCart();
  const [biz, setBiz]               = useState<Business>(initial);
  const [loadingOffers, setLoading] = useState(false);
  const [saved, setSaved]           = useState(() => isSaved(initial.id));
  const [bookmarkAnim, setBookmarkAnim] = useState(false);

  const typeKey = getBusinessTypeKey(biz.businessType ?? biz.category ?? biz.subcategory ?? biz.name);
  const color   = getCatColor(typeKey);

  // Load full offers if not yet loaded
  useEffect(() => {
    setBiz(initial);
    setSaved(isSaved(initial.id));
    if (initial.offers.length > 0) return;
    setLoading(true);
    fetchBusinessById(initial.id)
      .then((full) => { if (full) setBiz(full); })
      .finally(() => setLoading(false));
  }, [initial.id]);

  const handleBookmark = () => {
    if (saved) {
      removeSavedPlace(biz.id);
      setSaved(false);
    } else {
      savePlace(biz);
      setSaved(true);
      setBookmarkAnim(true);
      setTimeout(() => setBookmarkAnim(false), 600);
    }
  };

  const handleBuyNow   = () => { onClose(); navigate(`/business/${biz.id}`); };
  const handleAddCart  = (offer: Business['offers'][0]) => addOffer(offer, biz.name);
  const handlePayNow   = () => {
    window.dispatchEvent(new CustomEvent('geo:paynow', { detail: biz }));
    onClose();
  };

  const hasImage = biz.logo?.startsWith('http');

  const content = (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: .22 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
        style={{ zIndex: 9998 }}
        aria-hidden
      />

      {/* Card */}
      <motion.div
        key="card"
        initial={{ opacity: 0, y: '100%', scale: .94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: '60%', scale: .97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 310, mass: .75 }}
        className="fixed left-1/2 -translate-x-1/2 bottom-4 w-[calc(100%-28px)] max-w-[360px] rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh', zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Coloured category header ───────────────────────────────────────── */}
        <div
          className="relative shrink-0 overflow-hidden"
          style={{ background: color.bg, minHeight: hasImage ? 140 : 100 }}
        >
          {hasImage
            ? <img src={biz.logo} alt="" className="w-full h-36 object-cover opacity-80" />
            : (
              <div className="w-full h-24 flex items-center justify-center text-6xl opacity-30 select-none">
                {biz.logo && !hasImage ? biz.logo : '🏪'}
              </div>
            )
          }
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors pointer-events-auto"
            aria-label="Close"
          >
            <X size={16} className="text-white" strokeWidth={2.5} />
          </button>

          {/* Bookmark button */}
          <motion.button
            type="button"
            onClick={handleBookmark}
            animate={bookmarkAnim ? { scale: [1, 1.4, 0.9, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="absolute top-3 right-14 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors pointer-events-auto"
            aria-label={saved ? 'Remove bookmark' : 'Save place'}
          >
            <Bookmark
              size={15}
              strokeWidth={2.5}
              className={saved ? 'fill-amber-400 text-amber-400' : 'text-white'}
            />
          </motion.button>

          {/* Category pill */}
          <div className="absolute top-3 left-3">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
              {biz.category}
            </span>
          </div>

          {/* Unclaimed badge */}
          {biz.is_claimed === false && (
            <div className="absolute bottom-3 left-3">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/70 backdrop-blur-sm text-slate-200 border border-slate-500/40">
                Unclaimed business
              </span>
            </div>
          )}
        </div>

        {/* ── Business info ──────────────────────────────────────────────────── */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">{biz.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {biz.rating && (
                  <span className="flex items-center gap-1 text-[13px] font-semibold text-amber-600">
                    <Star size={13} className="fill-amber-400 text-amber-400" />
                    {biz.rating}
                  </span>
                )}
                {biz.address && (
                  <span className="flex items-center gap-1 text-[12px] text-slate-500 truncate max-w-[200px]">
                    <MapPin size={11} className="shrink-0 text-slate-400" />
                    {biz.address.slice(0, 40)}{biz.address.length > 40 ? '…' : ''}
                  </span>
                )}
              </div>
            </div>
            {/* Cashback hint badge */}
            <div
              className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[11px] font-bold"
              style={{ background: color.light, color: color.bg }}
            >
              <IndianRupee size={11} />
              Cashback
            </div>
          </div>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
          {/* Offers */}
          {loadingOffers ? (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
              <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              Loading offers…
            </div>
          ) : biz.offers.length > 0 ? (
            <div className="space-y-2.5 mb-4">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                <Flame size={15} className="text-orange-500" />
                Active Offers
                <span className="ml-auto text-[11px] font-semibold text-slate-400">{biz.offers.length} deal{biz.offers.length > 1 ? 's' : ''}</span>
              </h3>
              {biz.offers.map((offer) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border overflow-hidden"
                  style={{ borderColor: `${color.bg}30`, background: `${color.bg}08` }}
                >
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: color.light, color: color.bg }}
                      >
                        <BadgePercent size={11} />
                        {offer.discount}% OFF
                      </span>
                      {offer.isFlashDeal && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                          ⚡ FLASH
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{offer.title}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2">{offer.description}</p>
                    <p className="text-[11px] text-orange-500 font-semibold flex items-center gap-1 mt-1.5">
                      <Clock size={11} />
                      {getTimeRemaining(offer.expiresAt)}
                    </p>
                  </div>
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      className="flex-1 py-2 rounded-xl text-white text-xs font-bold transition-opacity hover:opacity-90 active:opacity-80"
                      style={{ background: color.bg }}
                    >
                      Buy Now
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddCart(offer)}
                      className="py-2 px-3 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
                    >
                      <ShoppingCart size={13} />
                      Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-sm text-slate-400">
              No active offers right now.
              <br />Open the store to explore products.
            </div>
          )}

          {/* ── CTA buttons ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-2.5 mb-2.5">
            <button
              type="button"
              onClick={() => { onStartNavigation(initial); onClose(); }}
              className="py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              style={{ background: color.bg, boxShadow: `0 6px 18px ${color.bg}50` }}
            >
              <Navigation2 size={16} strokeWidth={2.5} />
              Navigate
            </button>
            <button
              type="button"
              onClick={() => { onClose(); onOpenBusiness(biz.id); }}
              className="py-3 rounded-2xl text-slate-700 text-sm font-bold flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all border border-slate-200"
            >
              <Store size={16} />
              Open Store
            </button>
          </div>
          {/* Pay Now — full width */}
          <button
            type="button"
            onClick={handlePayNow}
            className="w-full py-3 rounded-2xl text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 6px 18px rgba(16,185,129,0.35)' }}
          >
            <IndianRupee size={16} strokeWidth={2.5} />
            💳 Pay Now &amp; Earn Cashback
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(content, document.body) : content;
}

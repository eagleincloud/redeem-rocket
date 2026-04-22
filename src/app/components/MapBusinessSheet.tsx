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
  ArrowRight,
  BadgePercent,
  IndianRupee,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { getBusinessTypeKey } from '../utils/businessType';

// ── Category colours ──────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { bg: string; light: string }> = {
  restaurant: { bg: '#f97316', light: '#fff7ed' },
  grocery:    { bg: '#16a34a', light: '#f0fdf4' },
  pharmacy:   { bg: '#2563eb', light: '#eff6ff' },
  salon:      { bg: '#db2777', light: '#fdf2f8' },
  hotel:      { bg: '#7c3aed', light: '#f5f3ff' },
  atm:        { bg: '#ca8a04', light: '#fefce8' },
  other:      { bg: '#475569', light: '#f8fafc' },
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

// ─────────────────────────────────────────────────────────────────────────────
function BusinessCard({
  business,
  onNavigate,
  onOpenBusiness,
  onClose,
}: {
  business: Business;
  onNavigate: () => void;
  onOpenBusiness: () => void;
  onClose: () => void;
}) {
  const navigate    = useNavigate();
  const { addOffer } = useCart();

  const typeKey = getBusinessTypeKey(business.businessType ?? business.category ?? business.subcategory ?? business.name);
  const color   = getCatColor(typeKey);
  const hasImage = business.logo?.startsWith('http');

  const handleBuyNow = () => { onClose(); navigate(`/business/${business.id}`); };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden flex flex-col h-full">
      {/* ── Coloured hero ────────────────────────────────────────────────── */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{ background: color.bg, height: 110 }}
      >
        {hasImage
          ? <img src={business.logo} alt="" className="w-full h-full object-cover opacity-70" />
          : (
            <div className="w-full h-full flex items-center justify-center text-5xl opacity-25 select-none">
              {business.logo ?? '🏪'}
            </div>
          )
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

        {/* Category pill */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm text-white border border-white/30">
          {business.category}
        </span>

        {/* Unclaimed */}
        {business.is_claimed === false && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/60 text-slate-300 border border-slate-500/30">
            Unclaimed
          </span>
        )}

        {/* Business name over gradient */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
          <h3 className="font-bold text-white text-sm truncate leading-tight">{business.name}</h3>
        </div>
      </div>

      {/* ── Meta row ─────────────────────────────────────────────────────── */}
      <div className="px-3 pt-2.5 pb-2 flex items-center gap-2 shrink-0">
        {business.rating && (
          <span className="flex items-center gap-1 text-[12px] font-bold text-amber-600">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            {business.rating}
          </span>
        )}
        {business.address && (
          <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
            <MapPin size={10} className="shrink-0 text-slate-400" />
            {business.address.slice(0, 30)}{business.address.length > 30 ? '…' : ''}
          </span>
        )}
        <span
          className="ml-auto shrink-0 flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: color.light, color: color.bg }}
        >
          <IndianRupee size={10} />
          Cashback
        </span>
      </div>

      {/* ── Offers ───────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        {business.offers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <Flame size={11} className="text-orange-500" />
              {business.offers.length} offer{business.offers.length > 1 ? 's' : ''}
            </p>
            {business.offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl p-2.5 border"
                style={{ background: `${color.bg}08`, borderColor: `${color.bg}25` }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span
                    className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: color.light, color: color.bg }}
                  >
                    <BadgePercent size={9} />
                    {offer.discount}% OFF
                  </span>
                  {offer.isFlashDeal && (
                    <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">⚡ FLASH</span>
                  )}
                </div>
                <p className="font-semibold text-slate-800 text-xs leading-snug">{offer.title}</p>
                <p className="text-[11px] text-orange-500 font-semibold flex items-center gap-1 mt-1">
                  <Clock size={10} />
                  {getTimeRemaining(offer.expiresAt)}
                </p>
                <div className="flex gap-1.5 mt-2">
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 py-1.5 rounded-lg text-white text-[11px] font-bold transition-opacity hover:opacity-90"
                    style={{ background: color.bg }}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={() => addOffer(offer, business.name)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 hover:bg-slate-50"
                  >
                    <ShoppingCart size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-slate-400 py-2">No active offers. Open store to explore.</p>
        )}
      </div>

      {/* ── Action buttons ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2 px-3 pb-3 shrink-0 border-t border-slate-50 pt-2">
        <button
          onClick={onNavigate}
          className="py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          style={{ background: color.bg }}
        >
          <Navigation2 size={13} strokeWidth={2.5} />
          Navigate
        </button>
        <button
          onClick={onOpenBusiness}
          className="py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-50 active:scale-95 transition-all"
        >
          <ArrowRight size={13} />
          Open Store
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
interface Props {
  businesses: Business[];
  onClose: () => void;
  onStartNavigation: (b: Business) => void;
  onOpenBusiness: (id: string) => void;
}

export function MapBusinessSheet({ businesses, onClose, onStartNavigation, onOpenBusiness }: Props) {
  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="sheet-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[2000] bg-black/35 backdrop-blur-[2px]"
        aria-hidden
      />

      {/* Sheet */}
      <motion.div
        key="sheet-panel"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[2001] flex flex-col rounded-t-[28px] bg-slate-50 shadow-2xl"
        style={{ maxHeight: '88vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        <div className="px-5 pb-3 shrink-0 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{businesses.length} businesses here</h2>
            <p className="text-sm text-slate-500">Swipe to explore • tap to navigate or order</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm"
            aria-label="Close"
          >
            <X size={18} className="text-slate-600" strokeWidth={2.5} />
          </button>
        </div>

        {/* Horizontal scroll cards */}
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-5 pb-6">
          <div className="flex gap-4 h-full pb-2" style={{ minWidth: 'min-content' }}>
            {businesses.map((biz) => (
              <div key={biz.id} className="shrink-0 w-[min(300px,80vw)] flex flex-col">
                <BusinessCard
                  business={biz}
                  onClose={onClose}
                  onNavigate={() => { onStartNavigation(biz); onClose(); }}
                  onOpenBusiness={() => { onClose(); onOpenBusiness(biz.id); }}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

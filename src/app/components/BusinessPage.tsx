import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingCart, Minus, Plus, Check, X, Star, MapPin, ArrowLeft,
  IndianRupee, Gift, Clock, Camera, ChevronDown, ChevronUp,
  Phone, Share2, Heart, ThumbsUp, Send, ChevronRight,
} from 'lucide-react';
import { mockBusinesses, mockProductsByBusiness } from '../mockData';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { useSearchCategory } from '../context/SearchCategoryContext';
import { fetchBusinessById, fetchProductsByBusinessId } from '../api/supabase-data';
import { hasSupabase } from '../lib/supabase';
import { useTheme } from '../context/ThemeContext';
import type { Business, Product } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateVerificationCode(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

function computeProductCashback(product: Product): number {
  const margin = product.mrp - product.selling_price;
  const max = Math.floor(margin / 2);
  if (max <= 0) return 0;
  return Math.floor(Math.random() * max) + 1;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const PHOTO_GRADIENTS = [
  'linear-gradient(135deg,#ff6b35 0%,#e040fb 100%)',
  'linear-gradient(135deg,#147EFB 0%,#00d68f 100%)',
  'linear-gradient(135deg,#e040fb 0%,#ff6b35 100%)',
  'linear-gradient(135deg,#ffb300 0%,#ff6b35 100%)',
  'linear-gradient(135deg,#00d68f 0%,#147EFB 100%)',
  'linear-gradient(135deg,#8b5cf6 0%,#e040fb 100%)',
];

const PHOTO_EMOJIS = ['🍽️','🏪','🛍️','⭐','🎉','✨'];

const HOURS: { day: string; open: string; close: string; closed?: boolean }[] = [
  { day: 'Monday',    open: '09:00', close: '21:00' },
  { day: 'Tuesday',   open: '09:00', close: '21:00' },
  { day: 'Wednesday', open: '09:00', close: '21:00' },
  { day: 'Thursday',  open: '09:00', close: '21:00' },
  { day: 'Friday',    open: '09:00', close: '22:00' },
  { day: 'Saturday',  open: '10:00', close: '22:00' },
  { day: 'Sunday',    open: '11:00', close: '20:00' },
];

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

interface MockReview {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  text: string;
  helpful: number;
  liked: boolean;
}

const MOCK_REVIEWS: MockReview[] = [
  {
    id: 'r1',
    name: 'Priya S.',
    avatar: '👩',
    rating: 5,
    date: '2 days ago',
    text: 'Absolutely loved it! The cashback was credited instantly. Staff was super helpful and the ambience is great. Will definitely visit again.',
    helpful: 12,
    liked: false,
  },
  {
    id: 'r2',
    name: 'Arjun M.',
    avatar: '👨',
    rating: 4,
    date: '1 week ago',
    text: 'Good quality products at fair prices. The app made ordering really easy. Minor wait time but overall a great experience.',
    helpful: 8,
    liked: false,
  },
  {
    id: 'r3',
    name: 'Sneha R.',
    avatar: '🧑',
    rating: 5,
    date: '2 weeks ago',
    text: 'Best place nearby! I earned ₹85 cashback on my last visit. The verification code process is seamless.',
    helpful: 19,
    liked: false,
  },
  {
    id: 'r4',
    name: 'Rohit K.',
    avatar: '👦',
    rating: 3,
    date: '3 weeks ago',
    text: 'Decent experience but could improve customer service. Products are good though. Cashback system is great.',
    helpful: 4,
    liked: false,
  },
  {
    id: 'r5',
    name: 'Divya T.',
    avatar: '👩‍💼',
    rating: 4,
    date: '1 month ago',
    text: 'My go-to place in the neighbourhood. The deals through Redeem Rocket are amazing — saved a lot this month!',
    helpful: 14,
    liked: false,
  },
];

const RATING_DIST = [
  { stars: 5, count: 38 },
  { stars: 4, count: 24 },
  { stars: 3, count: 12 },
  { stars: 2, count: 4 },
  { stars: 1, count: 2 },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StarRow({ rating, size = 14, color = '#f59e0b' }: { rating: number; size?: number; color?: string }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={size}
          style={{
            color:      i <= rating ? color : 'rgba(156,163,175,0.4)',
            fill:       i <= rating ? color : 'transparent',
          }}
        />
      ))}
    </span>
  );
}

function isOpenNow(): boolean {
  const today = new Date();
  const dayName = DAY_NAMES[today.getDay()];
  const h = HOURS.find(h => h.day === dayName);
  if (!h || h.closed) return false;
  const [oh, om] = h.open.split(':').map(Number);
  const [ch, cm] = h.close.split(':').map(Number);
  const now = today.getHours() * 60 + today.getMinutes();
  return now >= oh * 60 + om && now < ch * 60 + cm;
}

function todayHours(): string {
  const dayName = DAY_NAMES[new Date().getDay()];
  const h = HOURS.find(h => h.day === dayName);
  if (!h || h.closed) return 'Closed today';
  return `${h.open} – ${h.close}`;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function BusinessPage() {
  const { id } = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { isDark } = useTheme();
  const { allBusinesses } = useSearchCategory();
  const { items, addProduct, removeItem, updateQuantity } = useCart();
  const { addOrder } = useOrders();

  // State
  const [showCart,          setShowCart]          = useState(false);
  const [verificationCode,  setVerificationCode]  = useState<string | null>(null);
  const [cashbackEarned,    setCashbackEarned]    = useState(0);
  const [hoursExpanded,     setHoursExpanded]     = useState(false);
  const [activePhotoIdx,    setActivePhotoIdx]    = useState(0);
  const [reviews,           setReviews]           = useState<MockReview[]>(MOCK_REVIEWS);
  const [reviewText,        setReviewText]        = useState('');
  const [reviewRating,      setReviewRating]      = useState(5);
  const [reviewHoverStar,   setReviewHoverStar]   = useState(0);
  const [submittingReview,  setSubmittingReview]  = useState(false);
  const [reviewExpanded,    setReviewExpanded]    = useState(false);
  const [saved,             setSaved]             = useState(false);
  const [activeTab,         setActiveTab]         = useState<'products' | 'reviews' | 'info'>('products');

  const [business, setBusiness] = useState<Business | null>(
    () => allBusinesses.find(b => b.id === id) ?? mockBusinesses.find(b => b.id === id) ?? null
  );
  const [products, setProducts] = useState<Product[]>(id ? (mockProductsByBusiness[id] ?? []) : []);
  const [loading,  setLoading]  = useState(hasSupabase() && !business);

  const reviewInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    const fromCtx = allBusinesses.find(b => b.id === id) ?? mockBusinesses.find(b => b.id === id);
    if (fromCtx) setBusiness(fromCtx);
  }, [id, allBusinesses]);

  useEffect(() => {
    if (!id) return;
    if (!business) {
      if (hasSupabase()) {
        setLoading(true);
        fetchBusinessById(id).then(b => { setBusiness(b ?? null); setLoading(false); });
      } else {
        setBusiness(mockBusinesses.find(b => b.id === id) ?? null);
      }
      return;
    }
    if (hasSupabase()) {
      setLoading(true);
      fetchProductsByBusinessId(id).then(list => {
        setProducts(list.length > 0 ? list : (mockProductsByBusiness[id] ?? []));
        setLoading(false);
      });
    } else {
      setProducts(mockProductsByBusiness[id] ?? []);
    }
  }, [id, business?.id]);

  const cartForBiz    = items.filter(i => i.businessId === id);
  const cartIndices   = items.map((it, idx) => (it.businessId === id ? idx : -1)).filter(i => i >= 0);
  const cartTotal     = cartForBiz.reduce((s, i) => s + i.price * i.quantity, 0);
  const openNow       = isOpenNow();
  const totalReviews  = RATING_DIST.reduce((s, r) => s + r.count, 0);
  const avgRating     = RATING_DIST.reduce((s, r) => s + r.stars * r.count, 0) / totalReviews;

  const handleCheckout = () => {
    if (cartForBiz.length === 0) return;
    let totalCashback = 0;
    const orderItems = cartForBiz.map(i => {
      if (i.product) totalCashback += computeProductCashback(i.product) * i.quantity;
      return { productId: i.product?.id ?? i.offer?.id ?? '', name: i.name, quantity: i.quantity, price: i.price };
    });
    const code = generateVerificationCode();
    addOrder({ businessId: id!, businessName: business?.name ?? 'Business', verificationCode: code, items: orderItems, total: cartTotal, cashbackAmount: totalCashback });
    [...cartIndices].reverse().forEach(idx => removeItem(idx));
    setVerificationCode(code);
    setCashbackEarned(totalCashback);
    setShowCart(false);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    setSubmittingReview(true);
    setTimeout(() => {
      setReviews(rs => [{
        id: `new_${Date.now()}`,
        name: 'You',
        avatar: '🙂',
        rating: reviewRating,
        date: 'Just now',
        text: reviewText.trim(),
        helpful: 0,
        liked: false,
      }, ...rs]);
      setReviewText('');
      setReviewRating(5);
      setSubmittingReview(false);
      setActiveTab('reviews');
    }, 800);
  };

  const toggleLike = (id: string) => {
    setReviews(rs => rs.map(r => r.id === id ? { ...r, liked: !r.liked, helpful: r.liked ? r.helpful - 1 : r.helpful + 1 } : r));
  };

  // ── Theme helpers ────────────────────────────────────────────────────────────
  const bg     = isDark ? 'var(--bg)'   : '#f5f5f7';
  const card   = isDark ? 'var(--card)' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  // ── Loading / Not found ───────────────────────────────────────────────────
  if (loading && !business) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--text2)' }}>Loading business…</div>
    );
  }
  if (!business) {
    return (
      <div className="p-6 text-center">
        <p style={{ color: 'var(--text2)' }}>Business not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 font-medium" style={{ color: '#147EFB' }}>Back to map</button>
      </div>
    );
  }

  const displayedReviews = reviewExpanded ? reviews : reviews.slice(0, 3);

  return (
    <div className="h-full overflow-y-auto pb-32" style={{ background: bg }}>

      {/* ── Sticky back bar ── */}
      <div
        className="sticky top-0 z-20 flex items-center justify-between px-4 h-12 border-b"
        style={{
          background: isDark ? 'rgba(10,10,15,0.94)' : 'rgba(245,245,247,0.96)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderColor: border,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-medium text-sm"
          style={{ color: 'var(--text2)' }}
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaved(s => !s)}
            className="w-8 h-8 flex items-center justify-center rounded-full border"
            style={{ background: saved ? 'rgba(255,107,53,0.1)' : card, borderColor: saved ? 'rgba(255,107,53,0.3)' : border }}
          >
            <Heart size={14} style={{ color: saved ? '#ff6b35' : 'var(--text3)', fill: saved ? '#ff6b35' : 'none' }} />
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-full border"
            style={{ background: card, borderColor: border, color: 'var(--text3)' }}
          >
            <Share2 size={14} />
          </button>
        </div>
      </div>

      {/* ── Photo Gallery ── */}
      <div className="relative overflow-hidden" style={{ height: 220 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activePhotoIdx}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: PHOTO_GRADIENTS[activePhotoIdx] }}
          >
            <span style={{ fontSize: 80, opacity: 0.35 }}>{PHOTO_EMOJIS[activePhotoIdx]}</span>
          </motion.div>
        </AnimatePresence>

        {/* Photo strip */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {PHOTO_GRADIENTS.map((g, i) => (
            <button
              key={i}
              onClick={() => setActivePhotoIdx(i)}
              className="rounded-full transition-all border border-white/50"
              style={{
                width:  i === activePhotoIdx ? 20 : 7,
                height: 7,
                background: i === activePhotoIdx ? '#fff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>

        {/* Thumbnail strip */}
        <div className="absolute bottom-14 right-3 flex gap-1.5">
          {PHOTO_GRADIENTS.slice(0, 4).map((g, i) => (
            <button
              key={i}
              onClick={() => setActivePhotoIdx(i)}
              className="w-10 h-10 rounded-xl border-2 overflow-hidden flex items-center justify-center shrink-0 transition-all"
              style={{
                background: g,
                borderColor: i === activePhotoIdx ? '#fff' : 'rgba(255,255,255,0.3)',
                transform: i === activePhotoIdx ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <span style={{ fontSize: 16, opacity: 0.6 }}>{PHOTO_EMOJIS[i]}</span>
            </button>
          ))}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          >
            <Camera size={12} />
          </div>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: isDark ? 'linear-gradient(transparent,rgba(10,10,15,0.9))' : 'linear-gradient(transparent,rgba(245,245,247,0.9))' }}
        />
      </div>

      {/* ── Business Info Card ── */}
      <div className="px-4 -mt-2 relative z-10">
        <div className="rounded-3xl border p-5 shadow-lg" style={{ background: card, borderColor: border }}>
          <div className="flex items-start gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl border-2 shrink-0"
              style={{ background: PHOTO_GRADIENTS[0], borderColor: 'rgba(255,255,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.20)' }}
            >
              {business.logo}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold leading-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>
                {business.name}
              </h1>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text3)' }}>{business.category}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
                  style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                  <Star size={11} style={{ fill: '#f59e0b' }} />
                  {avgRating.toFixed(1)}
                  <span className="font-normal opacity-70">({totalReviews})</span>
                </span>
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold"
                  style={{
                    background: openNow ? 'rgba(0,214,143,0.12)' : 'rgba(239,68,68,0.12)',
                    color:      openNow ? '#00d68f' : '#ef4444',
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: openNow ? '#00d68f' : '#ef4444' }} />
                  {openNow ? 'Open now' : 'Closed'} · {todayHours()}
                </span>
                {business.isPremium && (
                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>Premium</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-1.5 mt-3">
            <MapPin size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--text3)' }} />
            <span className="text-xs" style={{ color: 'var(--text2)' }}>{business.address}</span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff', boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}
            >
              <Phone size={14} />
              Call
            </button>
            <button
              onClick={() => navigate('/', { state: { highlightBusiness: business } })}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-sm font-bold border"
              style={{ background: 'rgba(20,126,251,0.1)', borderColor: 'rgba(20,126,251,0.2)', color: '#147EFB' }}
            >
              <MapPin size={14} />
              Directions
            </button>
          </div>
        </div>
      </div>

      {/* ── Cashback banner ── */}
      <div className="mx-4 mt-3">
        <div
          className="rounded-2xl px-4 py-3 flex items-center gap-3"
          style={{
            background: 'linear-gradient(135deg, rgba(0,214,143,0.15) 0%, rgba(20,126,251,0.1) 100%)',
            border: '1px solid rgba(0,214,143,0.25)',
          }}
        >
          <Gift size={18} style={{ color: '#00d68f', flexShrink: 0 }} />
          <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            Earn cashback on every purchase! Pay MRP, get ₹ back in wallet.
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-12 z-10 mx-4 mt-3">
        <div className="flex rounded-2xl border p-1 gap-1" style={{ background: card, borderColor: border }}>
          {([['products', '🛒 Products'], ['reviews', '⭐ Reviews'], ['info', 'ℹ️ Info']] as const).map(([tab, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
              style={{
                background:  activeTab === tab ? 'var(--accent)' : 'transparent',
                color:       activeTab === tab ? '#fff' : 'var(--text2)',
                fontFamily:  'var(--font-b)',
                boxShadow:   activeTab === tab ? '0 4px 12px rgba(255,107,53,0.28)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ══ PRODUCTS TAB ══ */}
      <AnimatePresence mode="wait">
        {activeTab === 'products' && (
          <motion.div
            key="products"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 mt-3"
          >
            <div className="rounded-3xl border overflow-hidden" style={{ background: card, borderColor: border }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: border }}>
                <h2 className="font-bold text-base" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Products & Services</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text3)' }}>Add to cart and get a verification code</p>
              </div>
              <div className="divide-y" style={{ borderColor: border }}>
                {products.length === 0 && (
                  <div className="px-5 py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>No products listed yet</div>
                )}
                {products.map((product, idx) => {
                  const maxCb = Math.floor((product.mrp - product.selling_price) / 2);
                  return (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{product.name}</h3>
                        <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text2)' }}>{product.description}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="font-bold text-sm flex items-center gap-0.5" style={{ color: 'var(--text)' }}>
                            <IndianRupee size={13} />{product.mrp}
                          </p>
                          {maxCb > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,214,143,0.12)', color: '#00d68f' }}>
                              +₹{maxCb} cashback
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => addProduct(product, business.name, 1)}
                        className="shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                        style={{
                          background: 'var(--accent)',
                          color: '#fff',
                          boxShadow: '0 4px 12px rgba(255,107,53,0.25)',
                        }}
                      >
                        Add
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ REVIEWS TAB ══ */}
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 mt-3 space-y-3"
          >
            {/* Rating summary */}
            <div className="rounded-3xl border p-5" style={{ background: card, borderColor: border }}>
              <div className="flex items-center gap-5">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>
                    {avgRating.toFixed(1)}
                  </div>
                  <StarRow rating={Math.round(avgRating)} size={16} />
                  <div className="text-xs mt-1" style={{ color: 'var(--text3)' }}>{totalReviews} reviews</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {RATING_DIST.map(rd => (
                    <div key={rd.stars} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold w-3 text-right" style={{ color: 'var(--text3)' }}>{rd.stars}</span>
                      <Star size={9} style={{ color: '#f59e0b', fill: '#f59e0b', flexShrink: 0 }} />
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(rd.count / totalReviews) * 100}%`,
                            background: 'linear-gradient(90deg,#ff6b35,#e040fb)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] w-5 text-right" style={{ color: 'var(--text3)' }}>{rd.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Write a review */}
            <div className="rounded-3xl border p-5" style={{ background: card, borderColor: border }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Write a review</h3>
              {/* Star picker */}
              <div className="flex items-center gap-1 mb-3">
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    type="button"
                    onMouseEnter={() => setReviewHoverStar(s)}
                    onMouseLeave={() => setReviewHoverStar(0)}
                    onClick={() => setReviewRating(s)}
                  >
                    <Star
                      size={26}
                      style={{
                        color: s <= (reviewHoverStar || reviewRating) ? '#f59e0b' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'),
                        fill:  s <= (reviewHoverStar || reviewRating) ? '#f59e0b' : 'transparent',
                        transition: 'color .15s, fill .15s',
                      }}
                    />
                  </button>
                ))}
                <span className="text-xs ml-2" style={{ color: 'var(--text3)' }}>
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewHoverStar || reviewRating]}
                </span>
              </div>
              <textarea
                ref={reviewInputRef}
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Share your experience…"
                rows={3}
                className="w-full rounded-xl p-3 text-sm resize-none border outline-none transition-all"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  borderColor: border,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-b)',
                }}
              />
              <button
                onClick={handleSubmitReview}
                disabled={!reviewText.trim() || submittingReview}
                className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: reviewText.trim() ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'),
                  color:      reviewText.trim() ? '#fff' : 'var(--text3)',
                  cursor:     reviewText.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {submittingReview ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : <Send size={14} />}
                {submittingReview ? 'Posting…' : 'Post review'}
              </button>
            </div>

            {/* Review cards */}
            {displayedReviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-3xl border p-5"
                style={{ background: card, borderColor: border }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-2xl flex items-center justify-center text-xl border"
                      style={{ background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: border }}
                    >
                      {r.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-b)' }}>{r.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text3)' }}>{r.date}</p>
                    </div>
                  </div>
                  <StarRow rating={r.rating} size={12} />
                </div>
                <p className="text-sm leading-relaxed mt-3" style={{ color: 'var(--text2)' }}>{r.text}</p>
                <button
                  onClick={() => toggleLike(r.id)}
                  className="flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all"
                  style={{
                    background: r.liked ? 'rgba(20,126,251,0.1)' : 'transparent',
                    borderColor: r.liked ? 'rgba(20,126,251,0.2)' : border,
                    color: r.liked ? '#147EFB' : 'var(--text3)',
                  }}
                >
                  <ThumbsUp size={11} style={{ fill: r.liked ? '#147EFB' : 'none' }} />
                  Helpful ({r.helpful})
                </button>
              </motion.div>
            ))}

            {reviews.length > 3 && (
              <button
                onClick={() => setReviewExpanded(x => !x)}
                className="w-full py-3 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2 transition-all"
                style={{ background: card, borderColor: border, color: 'var(--text2)' }}
              >
                {reviewExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {reviewExpanded ? 'Show less' : `Show all ${reviews.length} reviews`}
              </button>
            )}
          </motion.div>
        )}

        {/* ══ INFO TAB ══ */}
        {activeTab === 'info' && (
          <motion.div
            key="info"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 mt-3 space-y-3"
          >
            {/* Hours */}
            <div className="rounded-3xl border overflow-hidden" style={{ background: card, borderColor: border }}>
              <button
                className="w-full flex items-center justify-between px-5 py-4"
                onClick={() => setHoursExpanded(x => !x)}
              >
                <div className="flex items-center gap-2.5">
                  <Clock size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div className="text-left">
                    <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Business Hours</p>
                    <p className="text-xs mt-0.5" style={{ color: openNow ? '#00d68f' : '#ef4444' }}>
                      {openNow ? '● Open now' : '● Closed'} · {todayHours()}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  style={{
                    color: 'var(--text3)',
                    transform: hoursExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>
              <AnimatePresence>
                {hoursExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="border-t" style={{ borderColor: border }}>
                      {HOURS.map(h => {
                        const isToday = h.day === DAY_NAMES[new Date().getDay()];
                        return (
                          <div
                            key={h.day}
                            className="flex items-center justify-between px-5 py-2.5 text-sm"
                            style={{
                              background: isToday ? (isDark ? 'rgba(255,107,53,0.06)' : 'rgba(255,107,53,0.04)') : 'transparent',
                            }}
                          >
                            <span
                              className="font-semibold"
                              style={{ color: isToday ? 'var(--accent)' : 'var(--text2)', fontFamily: isToday ? 'var(--font-b)' : undefined }}
                            >
                              {h.day.slice(0, 3)} {isToday && '(Today)'}
                            </span>
                            <span style={{ color: h.closed ? '#ef4444' : 'var(--text)' }}>
                              {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Contact / About */}
            <div className="rounded-3xl border p-5" style={{ background: card, borderColor: border }}>
              <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>About</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin size={15} className="shrink-0 mt-0.5" style={{ color: 'var(--text3)' }} />
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>{business.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={15} className="shrink-0" style={{ color: 'var(--text3)' }} />
                  <p className="text-sm" style={{ color: 'var(--text2)' }}>+91 98765 43210</p>
                </div>
                {business.isPremium && (
                  <div className="mt-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                    ⭐ Premium verified business on Redeem Rocket
                  </div>
                )}
                {!business.is_claimed && (
                  <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)', color: 'var(--text3)' }}>
                    This business hasn't been claimed yet. Are you the owner?{' '}
                    <button className="font-bold underline" style={{ color: 'var(--accent)' }}>Claim now →</button>
                  </div>
                )}
              </div>
            </div>

            {/* Offers summary */}
            {business.offers.length > 0 && (
              <div className="rounded-3xl border overflow-hidden" style={{ background: card, borderColor: border }}>
                <div className="px-5 py-4 border-b" style={{ borderColor: border }}>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Active Offers ({business.offers.length})</p>
                </div>
                {business.offers.slice(0, 3).map(offer => (
                  <div key={offer.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-0" style={{ borderColor: border }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--accent)' }}>
                      <Gift size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{offer.title}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text3)' }}>{offer.description}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--accent)' }}>
                      {offer.discount}% off
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cart FAB ── */}
      <AnimatePresence>
        {cartForBiz.length > 0 && (
          <motion.button
            key="cart-fab"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            onClick={() => setShowCart(true)}
            className="fixed bottom-24 right-4 flex items-center gap-2 px-4 h-12 rounded-2xl text-white font-bold shadow-xl z-30"
            style={{ background: 'linear-gradient(135deg, var(--accent), #e040fb)', boxShadow: '0 8px 24px rgba(255,107,53,0.4)' }}
          >
            <ShoppingCart size={18} />
            {cartForBiz.length} item{cartForBiz.length > 1 ? 's' : ''} · ₹{cartTotal.toFixed(0)}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart drawer ── */}
      <AnimatePresence>
        {showCart && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !verificationCode && setShowCart(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 rounded-t-3xl shadow-2xl z-50 max-h-[85vh] overflow-y-auto"
              style={{ background: card, borderTop: `1px solid ${border}` }}
            >
              <div className="p-6">
                {verificationCode ? (
                  <>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4 mb-4">
                      <div className="text-5xl mb-3">🎉</div>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Order Placed!</h3>
                      {cashbackEarned > 0 && (
                        <div className="mt-3 rounded-2xl px-6 py-3 inline-block"
                          style={{ background: 'linear-gradient(135deg,#00d68f,#147EFB)', color: '#fff' }}>
                          <div className="text-sm font-medium">You earned</div>
                          <div className="text-3xl font-bold">₹{cashbackEarned} cashback</div>
                          <div className="text-xs opacity-75 mt-0.5">Added to wallet · Valid 1 year</div>
                        </div>
                      )}
                    </motion.div>
                    <div className="text-center mb-4">
                      <p className="text-sm mb-2" style={{ color: 'var(--text2)' }}>Show this code at the merchant</p>
                      <p className="text-4xl font-mono font-bold tracking-widest" style={{ color: 'var(--text)' }}>{verificationCode}</p>
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                        <span className="text-sm font-medium" style={{ color: '#f59e0b' }}>Not redeemed yet</span>
                      </div>
                    </div>
                    <button
                      onClick={() => { setVerificationCode(null); setShowCart(false); navigate('/orders'); }}
                      className="w-full py-3 rounded-2xl font-semibold text-white"
                      style={{ background: 'var(--accent)' }}
                    >
                      View recent orders
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-d)' }}>Your Cart</h3>
                      <button onClick={() => setShowCart(false)}><X size={20} style={{ color: 'var(--text2)' }} /></button>
                    </div>
                    {cartForBiz.length === 0 ? (
                      <p className="py-8 text-center text-sm" style={{ color: 'var(--text3)' }}>Cart is empty</p>
                    ) : (
                      <>
                        <ul className="space-y-3 mb-4">
                          {items.flatMap((item, gi) => item.businessId === id ? [{ item, gi }] : []).map(({ item, gi }) => (
                            <li key={gi} className="flex items-center justify-between py-2 border-b" style={{ borderColor: border }}>
                              <div>
                                <p className="font-medium text-sm" style={{ color: 'var(--text)' }}>{item.name}</p>
                                <p className="text-xs" style={{ color: 'var(--text3)' }}>₹{item.price} × {item.quantity}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQuantity(gi, Math.max(1, item.quantity - 1))}
                                  className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: border, color: 'var(--text2)' }}>
                                  <Minus size={12} />
                                </button>
                                <span className="w-5 text-center text-sm font-medium" style={{ color: 'var(--text)' }}>{item.quantity}</span>
                                <button onClick={() => updateQuantity(gi, item.quantity + 1)}
                                  className="w-7 h-7 rounded-full border flex items-center justify-center" style={{ borderColor: border, color: 'var(--text2)' }}>
                                  <Plus size={12} />
                                </button>
                                <button onClick={() => removeItem(gi)} className="ml-1"><X size={16} style={{ color: '#ef4444' }} /></button>
                              </div>
                            </li>
                          ))}
                        </ul>
                        <div className="rounded-xl px-3 py-2 mb-4 text-xs font-medium flex items-center gap-1.5"
                          style={{ background: 'rgba(0,214,143,0.08)', color: '#00d68f', border: '1px solid rgba(0,214,143,0.15)' }}>
                          <Gift size={13} />
                          Cashback credited to wallet after redemption
                        </div>
                        <p className="text-right font-bold text-lg mb-4" style={{ color: 'var(--text)' }}>Total: ₹{cartTotal.toFixed(0)}</p>
                        <button
                          onClick={handleCheckout}
                          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
                          style={{ background: 'linear-gradient(135deg, var(--accent), #e040fb)', boxShadow: '0 8px 24px rgba(255,107,53,0.35)' }}
                        >
                          <Check size={20} />
                          Pay & get verification code
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

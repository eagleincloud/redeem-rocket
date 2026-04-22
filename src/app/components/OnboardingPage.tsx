import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate }  from 'react-router-dom';
import {
  MapPin, Tag, CreditCard, Navigation, ChevronRight,
  Star, Bell, Zap, Check, X,
} from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'restaurants',   emoji: '🍽️', label: 'Food & Dining'   },
  { key: 'grocery',       emoji: '🛒', label: 'Grocery'          },
  { key: 'fashion',       emoji: '👗', label: 'Fashion'          },
  { key: 'electronics',   emoji: '📱', label: 'Electronics'      },
  { key: 'beauty',        emoji: '💄', label: 'Beauty & Spa'     },
  { key: 'pharmacy',      emoji: '💊', label: 'Pharmacy'         },
  { key: 'fitness',       emoji: '🏋️', label: 'Fitness'         },
  { key: 'books',         emoji: '📚', label: 'Books & Stationery'},
  { key: 'travel',        emoji: '✈️', label: 'Travel & Hotels'  },
  { key: 'entertainment', emoji: '🎬', label: 'Entertainment'    },
  { key: 'pets',          emoji: '🐾', label: 'Pets'             },
  { key: 'automotive',    emoji: '🚗', label: 'Automotive'       },
];

const RADIUS_OPTIONS = [0.5, 1, 2, 5, 10] as const;

// ── Step components ───────────────────────────────────────────────────────────

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Animated logo */}
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 180, delay: 0.1 }}
        className="mb-8"
      >
        <div
          className="w-28 h-28 rounded-[36px] flex items-center justify-center shadow-2xl relative"
          style={{ background: 'linear-gradient(145deg,#ff6b35,#e040fb)' }}
        >
          <MapPin size={52} color="#fff" />
          {/* Sparkle dots */}
          {[[-22,-22],[22,-22],[-26,10],[26,10]].map(([x, y], i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{ background: i % 2 === 0 ? '#ffb300' : '#00d68f', left: '50%', top: '50%', x, y }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="flex justify-center mb-3">
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 90, width: 'auto', objectFit: 'contain' }} />
        </div>
        <p className="text-lg font-semibold text-white mb-4">Discover deals near you</p>
        <p className="text-sm text-white/70 leading-relaxed">
          Shop at local businesses, earn cashback on every purchase, and never miss a deal in your neighbourhood.
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="flex flex-wrap gap-2 justify-center mt-6 mb-10">
        {[
          { icon: <Tag size={13} />, text: 'Live Deals',    color: '#ff6b35' },
          { icon: <CreditCard size={13} />, text: 'Cashback', color: '#00d68f' },
          { icon: <MapPin size={13} />, text: 'Map View',    color: '#147EFB' },
          { icon: <Zap size={13} />, text: 'Auctions',       color: '#e040fb' },
        ].map((f, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}30` }}
          >
            {f.icon}{f.text}
          </span>
        ))}
      </motion.div>

      <motion.button
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        whileTap={{ scale: 0.96 }}
        onClick={onNext}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 text-base"
        style={{ background: 'linear-gradient(135deg,#ff6b35,#e040fb)', boxShadow: '0 12px 32px rgba(255,107,53,0.4)' }}
      >
        Get started <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}

function StepLocation({ onNext }: { onNext: () => void }) {
  const [granted, setGranted] = useState<'idle' | 'granted' | 'denied'>('idle');

  const requestLocation = () => {
    if (!navigator.geolocation) { setGranted('denied'); return; }
    navigator.geolocation.getCurrentPosition(
      () => { setGranted('granted'); setTimeout(onNext, 800); },
      ()  => { setGranted('denied'); },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 160 }}
        className="mb-8 relative"
      >
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(20,126,251,0.15)', border: '2px solid rgba(20,126,251,0.3)' }}>
          <Navigation size={44} style={{ color: '#147EFB' }} />
        </div>
        {/* Pulse rings */}
        {[1.3, 1.6, 1.9].map((s, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-3xl"
            style={{ border: '1.5px solid rgba(20,126,251,0.25)' }}
            animate={{ scale: s, opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.6, ease: 'easeOut' }}
          />
        ))}
      </motion.div>

      <h2 className="text-2xl font-black text-white mb-3">Find deals near you</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-8">
        Allow location access so we can show you real-time deals and businesses within your chosen radius. Your location is never stored on our servers.
      </p>

      <AnimatePresence mode="wait">
        {granted === 'granted' ? (
          <motion.div
            key="granted"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'rgba(0,214,143,0.2)' }}
          >
            <Check size={32} style={{ color: '#00d68f' }} />
          </motion.div>
        ) : granted === 'denied' ? (
          <motion.div key="denied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-xs mb-6">
            <div className="text-sm py-3 px-4 rounded-2xl mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              Location access denied. You can enable it later in settings.
            </div>
            <button
              onClick={onNext}
              className="w-full py-4 rounded-2xl font-bold text-white"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              Continue without location
            </button>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xs space-y-3">
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={requestLocation}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#147EFB,#00d68f)', boxShadow: '0 12px 32px rgba(20,126,251,0.35)' }}
            >
              <Navigation size={18} />
              Allow location access
            </motion.button>
            <button
              onClick={onNext}
              className="w-full py-3 rounded-2xl text-sm font-semibold"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Skip for now
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepInterests({ selected: sel, onToggle, onNext }: {
  selected: string[];
  onToggle: (k: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col h-full px-6 pt-2 pb-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-white">What are you into?</h2>
        <p className="text-sm text-white/60 mt-1">Pick categories to personalise your feed</p>
      </div>
      <div className="grid grid-cols-3 gap-2.5 flex-1 content-start overflow-y-auto">
        {CATEGORIES.map((c, i) => {
          const active = sel.includes(c.key);
          return (
            <motion.button
              key={c.key}
              type="button"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.93 }}
              onClick={() => onToggle(c.key)}
              className="relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border transition-all"
              style={{
                background:  active ? 'rgba(255,107,53,0.15)' : 'rgba(255,255,255,0.06)',
                borderColor: active ? '#ff6b35' : 'rgba(255,255,255,0.10)',
              }}
            >
              {active && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: '#ff6b35' }}
                >
                  <Check size={9} color="#fff" />
                </motion.div>
              )}
              <span style={{ fontSize: 28 }}>{c.emoji}</span>
              <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: active ? '#fff' : 'rgba(255,255,255,0.65)' }}>
                {c.label}
              </span>
            </motion.button>
          );
        })}
      </div>
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onNext}
        disabled={sel.length === 0}
        className="mt-5 w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{
          background: sel.length > 0 ? 'linear-gradient(135deg,#ff6b35,#e040fb)' : 'rgba(255,255,255,0.1)',
          boxShadow: sel.length > 0 ? '0 12px 32px rgba(255,107,53,0.35)' : 'none',
          opacity: sel.length > 0 ? 1 : 0.5,
        }}
      >
        Continue ({sel.length} selected) <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}

function StepRadius({ radius, setRadius, onNext }: {
  radius: number;
  setRadius: (r: number) => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 160 }}
        className="mb-8">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(255,179,0,0.15)', border: '2px solid rgba(255,179,0,0.3)' }}>
          <MapPin size={44} style={{ color: '#ffb300' }} />
        </div>
      </motion.div>

      <h2 className="text-2xl font-black text-white mb-2">How far should we look?</h2>
      <p className="text-sm text-white/70 mb-8">Set your search radius for nearby deals</p>

      <div className="flex gap-2.5 justify-center mb-8">
        {RADIUS_OPTIONS.map(r => {
          const active = radius === r;
          return (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className="flex flex-col items-center gap-1 px-3 py-3 rounded-2xl border transition-all min-w-[56px]"
              style={{
                background:  active ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.06)',
                borderColor: active ? '#ffb300' : 'rgba(255,255,255,0.10)',
              }}
            >
              <span className="text-xl">
                {r <= 1 ? '🚶' : r <= 2 ? '🚴' : r <= 5 ? '🛵' : '🚗'}
              </span>
              <span className="text-sm font-bold" style={{ color: active ? '#ffb300' : 'rgba(255,255,255,0.6)' }}>
                {r < 1 ? `${r*1000}m` : `${r}km`}
              </span>
            </button>
          );
        })}
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={onNext}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#ffb300,#ff6b35)', boxShadow: '0 12px 32px rgba(255,179,0,0.35)' }}
      >
        Continue <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}

function StepNotifications({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <motion.div initial={{ scale: 0, rotate: 20 }} animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160 }} className="mb-8 relative">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{ background: 'rgba(224,64,251,0.15)', border: '2px solid rgba(224,64,251,0.3)' }}>
          <Bell size={44} style={{ color: '#e040fb' }} />
        </div>
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-black"
          style={{ background: '#ff6b35' }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          3
        </motion.div>
      </motion.div>

      <h2 className="text-2xl font-black text-white mb-3">Stay in the loop</h2>
      <p className="text-sm text-white/70 leading-relaxed mb-6">
        Get notified about flash deals, cashback expiry alerts, auction results, and new businesses near you.
      </p>

      <div className="w-full max-w-xs space-y-2 mb-8 text-left">
        {[
          { icon: '🔥', text: 'Flash deal alerts in real time'   },
          { icon: '💰', text: 'Cashback expiry reminders'         },
          { icon: '🏆', text: 'Auction result notifications'      },
          { icon: '📍', text: 'New businesses near you'           },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{item.text}</span>
          </motion.div>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg,#e040fb,#147EFB)', boxShadow: '0 12px 32px rgba(224,64,251,0.35)' }}
        >
          <Bell size={18} />
          Allow notifications
        </motion.button>
        <button onClick={onNext} className="w-full py-3 text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}

function StepDone({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-8xl mb-6"
      >
        🚀
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-3xl font-black text-white mb-3">You're all set!</h2>
        <p className="text-sm text-white/70 leading-relaxed mb-8">
          Your personalised deal map is ready. Explore businesses near you, earn cashback, and start saving!
        </p>
      </motion.div>

      {/* Confetti dots */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full pointer-events-none"
          style={{
            background: ['#ff6b35','#e040fb','#00d68f','#147EFB','#ffb300'][i % 5],
            left: `${10 + (i * 7.5) % 80}%`,
            top: `${10 + (i * 13) % 60}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ repeat: Infinity, duration: 2 + (i % 3) * 0.5, delay: i * 0.15 }}
        />
      ))}

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.96 }}
        onClick={onFinish}
        className="w-full max-w-xs py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg,#ff6b35,#e040fb)', boxShadow: '0 12px 32px rgba(255,107,53,0.4)' }}
      >
        <Star size={20} style={{ fill: '#fff' }} />
        Explore deals now!
      </motion.button>
    </div>
  );
}

// ── Onboarding (top-level) ────────────────────────────────────────────────────

const STEPS = ['welcome', 'location', 'interests', 'radius', 'notifications', 'done'] as const;
type Step = typeof STEPS[number];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState<Step>('welcome');
  const [interests, setInterests] = useState<string[]>([]);
  const [radius, setRadius]   = useState<number>(2);

  const currentIdx = STEPS.indexOf(step);
  const progress   = ((currentIdx) / (STEPS.length - 1)) * 100;

  const next = useCallback(() => {
    const nextIdx = currentIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx]);
  }, [currentIdx]);

  const toggleInterest = useCallback((k: string) => {
    setInterests(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  }, []);

  const finish = useCallback(() => {
    localStorage.setItem('geo:onboarding_done', '1');
    localStorage.setItem('geo:interests', JSON.stringify(interests));
    localStorage.setItem('geo:radius', String(radius));
    // Signal the feature guide to appear on the next page
    localStorage.setItem('geo:show_feature_guide', '1');
    localStorage.removeItem('geo:feature_guide_done');
    navigate('/');
  }, [navigate, interests, radius]);

  const skip = () => finish();

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      style={{
        background: 'linear-gradient(160deg, #0d0d18 0%, #1a0c28 40%, #0a1428 100%)',
      }}
    >
      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'linear-gradient(90deg,#ff6b35,#e040fb)' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Dots */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="rounded-full transition-all"
              style={{
                width:   i === currentIdx ? 20 : 6,
                height:  6,
                background: i <= currentIdx ? '#ff6b35' : 'rgba(255,255,255,0.15)',
              }}
            />
          ))}
        </div>
        {step !== 'done' && (
          <button onClick={skip} className="text-xs font-semibold flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Skip <X size={12} />
          </button>
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {step === 'welcome'       && <StepWelcome onNext={next} />}
            {step === 'location'      && <StepLocation onNext={next} />}
            {step === 'interests'     && <StepInterests selected={interests} onToggle={toggleInterest} onNext={next} />}
            {step === 'radius'        && <StepRadius radius={radius} setRadius={setRadius} onNext={next} />}
            {step === 'notifications' && <StepNotifications onNext={next} />}
            {step === 'done'          && <StepDone onFinish={finish} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

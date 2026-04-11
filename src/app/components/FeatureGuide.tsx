import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── Step data ──────────────────────────────────────────────────────────────────

interface GuideStep {
  icon: string;
  title: string;
  description: string;
  hint: string;
  color1: string;
  color2: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    icon: '🗺️',
    title: 'Explore the Map',
    description: 'Tap any glowing pin to discover local businesses and their live deals right on the streets near you. Zoom in to see deals by block.',
    hint: 'Try tapping a coloured pin on the map',
    color1: '#147EFB',
    color2: '#00d68f',
  },
  {
    icon: '🏷️',
    title: 'Deals & Flash Offers',
    description: 'Browse time-limited flash deals and discounts from shops in your neighbourhood. New deals drop every hour — don\'t miss out!',
    hint: 'Open "Explore" from the menu bar',
    color1: '#ff6b35',
    color2: '#ffb300',
  },
  {
    icon: '🔨',
    title: 'Live Auctions',
    description: 'Bid on products from local businesses in real-time. The highest bid wins at a fraction of the market price. Auctions end in minutes!',
    hint: 'Find auctions in the bottom navigation',
    color1: '#e040fb',
    color2: '#8b5cf6',
  },
  {
    icon: '📋',
    title: 'Post a Requirement',
    description: 'Need something specific? Post a requirement and let businesses come to you with their best offers and quotes — no more calling around.',
    hint: 'Tap the + button to post a requirement',
    color1: '#00d68f',
    color2: '#147EFB',
  },
  {
    icon: '💰',
    title: 'Wallet & Cashback',
    description: 'Earn cashback on every purchase at local businesses. Your wallet balance is valid for a full year and can be used on your next order.',
    hint: 'Check your wallet in the profile section',
    color1: '#f59e0b',
    color2: '#ff6b35',
  },
  {
    icon: '🚀',
    title: "You're All Set!",
    description: 'Your personalized deal map is ready. Discover great local businesses, save money every day, and support your neighbourhood.',
    hint: 'Tap the "?" icon anytime to replay this tour',
    color1: '#8b5cf6',
    color2: '#e040fb',
  },
];

// ── Props ──────────────────────────────────────────────────────────────────────

interface FeatureGuideProps {
  onDismiss: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function FeatureGuide({ onDismiss }: FeatureGuideProps) {
  const [step, setStep] = useState(0);
  const current = GUIDE_STEPS[step];
  const isLast = step === GUIDE_STEPS.length - 1;

  // Lock body scroll while guide is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function next() {
    if (isLast) {
      onDismiss();
    } else {
      setStep(s => s + 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        padding: 24,
      }}
    >
      {/* Skip button */}
      <button
        onClick={onDismiss}
        style={{
          position: 'absolute', top: 20, right: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 20, padding: '6px 16px',
          color: 'rgba(255,255,255,0.6)', fontSize: 13,
          cursor: 'pointer', fontWeight: 500,
          letterSpacing: '0.02em',
        }}
      >
        Skip tour
      </button>

      {/* Step counter */}
      <div style={{ position: 'absolute', top: 22, left: 24, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
        {step + 1} / {GUIDE_STEPS.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 32, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 420, width: '100%' }}
        >
          {/* Spotlight circle */}
          <div style={{ position: 'relative', marginBottom: 36 }}>
            {/* Pulse ring */}
            <motion.div
              animate={{ scale: [1, 1.55, 1], opacity: [0.45, 0, 0.45] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                inset: -24,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${current.color1}55, transparent 70%)`,
              }}
            />
            {/* Second pulse ring (offset) */}
            <motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.25, 0, 0.25] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
              style={{
                position: 'absolute',
                inset: -40,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${current.color2}33, transparent 70%)`,
              }}
            />
            {/* Main spotlight */}
            <div style={{
              width: 110,
              height: 110,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${current.color1}33, ${current.color2}33)`,
              border: `2px solid ${current.color1}88`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              boxShadow: `0 0 40px ${current.color1}44, 0 0 80px ${current.color1}22`,
            }}>
              {current.icon}
            </div>
          </div>

          {/* Tooltip card with gradient border */}
          <div style={{
            padding: 2,
            borderRadius: 26,
            background: `linear-gradient(135deg, ${current.color1}, ${current.color2})`,
            width: '100%',
            boxShadow: `0 20px 60px ${current.color1}33, 0 8px 24px rgba(0,0,0,0.4)`,
          }}>
            <div style={{
              background: '#0d0d1a',
              borderRadius: 24,
              padding: '28px 32px',
              textAlign: 'center',
            }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 800,
                marginBottom: 12,
                background: `linear-gradient(135deg, ${current.color1}, ${current.color2})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1.2,
              }}>
                {current.title}
              </h2>

              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.72)',
                lineHeight: 1.7,
                marginBottom: 20,
              }}>
                {current.description}
              </p>

              {/* Hint pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 20,
                background: `${current.color1}18`,
                border: `1px solid ${current.color1}33`,
                marginBottom: 24,
              }}>
                <span style={{ fontSize: 11 }}>💡</span>
                <span style={{ fontSize: 11, color: current.color1, fontWeight: 600 }}>{current.hint}</span>
              </div>

              {/* Next / Finish button */}
              <button
                onClick={next}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 16,
                  border: 'none',
                  background: `linear-gradient(135deg, ${current.color1}, ${current.color2})`,
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  letterSpacing: '0.02em',
                  boxShadow: `0 4px 20px ${current.color1}44`,
                  transition: 'transform 0.12s, box-shadow 0.12s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 28px ${current.color1}55`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${current.color1}44`;
                }}
              >
                {isLast ? '🎉 Start Exploring!' : 'Next →'}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot progress */}
      <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
        {GUIDE_STEPS.map((s, i) => (
          <motion.button
            key={i}
            onClick={() => setStep(i)}
            animate={{
              width: i === step ? 28 : 8,
              background: i === step ? current.color1 : i < step ? current.color1 + '88' : 'rgba(255,255,255,0.2)',
            }}
            transition={{ duration: 0.3 }}
            style={{
              height: 8,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
      </div>

      {/* Feature preview strip — shows what's coming */}
      {!isLast && (
        <div style={{
          position: 'absolute',
          bottom: 20,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Coming up:</span>
          {GUIDE_STEPS.slice(step + 1, step + 3).map((s, i) => (
            <div key={i} style={{
              fontSize: 11, color: 'rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, padding: '4px 10px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

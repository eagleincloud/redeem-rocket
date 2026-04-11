import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

// ── Navigation items (5 routes + 1 action) ───────────────────────────────────
const TABS = [
  { id: 'map',          icon: '🏠',  label: 'Home',         path: '/'              },
  { id: 'auctions',     icon: '🔨',  label: 'Auctions',     path: '/auctions'      },
  { id: 'explore',      icon: '🧭',  label: 'Explore',      path: '__explore__'    },
  { id: 'requirements', icon: '📋',  label: 'Needs',        path: '/requirements'  },
  { id: 'wallet',       icon: '💳',  label: 'Wallet',       path: '/wallet'        },
  { id: 'profile',      icon: '👤',  label: 'Profile',      path: '/profile'       },
];

// ── Fan arc — 6 items, symmetrical around 12 o'clock ─────────────────────────
const ORBIT_R = 122;                              // px radius
const ANGLES  = [-90, -54, -18, 18, 54, 90];     // degrees from vertical (30° apart)

function orbPos(i: number): { x: number; y: number } {
  const rad = ANGLES[i] * (Math.PI / 180);
  return {
    x:  Math.sin(rad) * ORBIT_R,
    y: -Math.cos(rad) * ORBIT_R - 20,
  };
}

// Badge count by tab id
const BADGES: Record<string, number> = { auctions: 2, requirements: 1 };

interface Props {
  onExplore?: () => void;
}

export function CircularFABMenu({ onExplore }: Props) {
  const [open, setOpen] = useState(false);
  const navigate        = useNavigate();
  const location        = useLocation();

  const activeTab = TABS.find(t =>
    t.path === '/' ? location.pathname === '/' : location.pathname.startsWith(t.path)
  )?.id ?? 'map';

  const handleItem = (path: string) => {
    if (path === '__explore__') {
      onExplore?.();
      setOpen(false);
      return;
    }
    navigate(path);
    setOpen(false);
  };

  return (
    <>
      {/* ── FAB wrapper — centred at bottom ─────────────────────────────── */}
      <div
        className="fixed z-[200] flex items-center justify-center"
        style={{ bottom: 28, left: '50%', transform: 'translateX(-50%)' }}
      >
        {/* Orbit items */}
        {TABS.map((tab, i) => {
          const pos    = orbPos(i);
          const active = activeTab === tab.id;
          const badge  = BADGES[tab.id];
          const isExplore = tab.id === 'explore';

          return (
            <div
              key={tab.id}
              onClick={() => handleItem(tab.path)}
              style={{
                position: 'absolute',
                display:  'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
                userSelect: 'none',
                opacity:    open ? 1 : 0,
                pointerEvents: open ? 'all' : 'none',
                transform: open
                  ? `translate(${pos.x}px, ${pos.y}px) scale(1)`
                  : `translate(0px, 0px) scale(0.3)`,
                transition: open
                  ? `transform 0.42s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.045}s, opacity 0.28s ease ${i * 0.045}s`
                  : `transform 0.32s cubic-bezier(0.55,0,1,0.45) ${(5 - i) * 0.03}s, opacity 0.22s ease ${(5 - i) * 0.03}s`,
              }}
            >
              {/* Circle icon */}
              <div
                style={{
                  width: 52, height: 52,
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  background: isExplore
                    ? 'linear-gradient(145deg, #16a34a, #15803d)'
                    : active
                      ? 'linear-gradient(145deg, var(--accent), var(--accent3))'
                      : 'var(--card2)',
                  border: `1.5px solid ${isExplore ? 'rgba(34,197,94,0.6)' : active ? 'var(--accent2)' : 'var(--border2)'}`,
                  boxShadow: isExplore
                    ? '0 4px 20px rgba(22,163,74,0.50)'
                    : active
                      ? '0 4px 20px rgba(255,107,53,0.50)'
                      : '0 4px 18px rgba(0,0,0,0.45)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {tab.icon}
                {badge && (
                  <div style={{
                    position: 'absolute', top: -2, right: -2,
                    width: 14, height: 14,
                    background: 'var(--red)',
                    borderRadius: '50%',
                    border: '2px solid var(--bg)',
                    fontSize: 8, fontWeight: 800, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {badge}
                  </div>
                )}
                {/* Explore pulse ring */}
                {isExplore && open && (
                  <div style={{
                    position: 'absolute', inset: -4,
                    borderRadius: '50%',
                    border: '2px solid rgba(34,197,94,0.4)',
                    animation: 'explore-ring 1.8s ease-out infinite',
                    pointerEvents: 'none',
                  }} />
                )}
              </div>

              {/* Label */}
              <span style={{
                fontFamily:    'var(--font-d)',
                fontSize:      10,
                fontWeight:    700,
                letterSpacing: '0.04em',
                color: isExplore ? '#4ade80' : active ? 'var(--accent2)' : 'var(--text2)',
                textShadow:    '0 2px 8px rgba(0,0,0,0.80)',
                whiteSpace:    'nowrap',
                transition:    'color 0.2s',
              }}>
                {tab.label}
              </span>
            </div>
          );
        })}

        {/* Ripple rings — only when closed */}
        {!open && (
          <>
            <div style={{
              position: 'absolute', width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(255,107,53,0.35)',
              animation: 'fab-ring 2.2s ease-out infinite',
              pointerEvents: 'none',
            }} />
            <div style={{
              position: 'absolute', width: 64, height: 64, borderRadius: '50%',
              border: '2px solid rgba(255,107,53,0.35)',
              animation: 'fab-ring 2.2s ease-out infinite',
              animationDelay: '0.7s',
              pointerEvents: 'none',
            }} />
          </>
        )}

        {/* Main FAB button */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          style={{
            width: 60, height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, var(--accent), var(--accent3))',
            border: 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 28px rgba(255,107,53,0.55), 0 2px 8px rgba(0,0,0,0.40)',
            position: 'relative', zIndex: 2,
            transform: open ? 'rotate(45deg) scale(1.07)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            fontSize: 24,
            lineHeight: 1,
          }}
        >
          {open ? '✕' : '🚀'}
        </button>
      </div>

      {/* ── Keyframes ────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes fab-ring {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.4); opacity: 0;   }
        }
        @keyframes explore-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.7); opacity: 0;   }
        }
      `}</style>
    </>
  );
}

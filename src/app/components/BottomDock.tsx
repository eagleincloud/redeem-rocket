import { useTheme } from '../context/ThemeContext';

interface Props {
  onOpen?: () => void;
}

export function BottomDock({ onOpen }: Props) {
  const { isDark } = useTheme();

  return (
    <>
      <style>{`
        @keyframes dock-glow {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes dot-pulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.35); opacity: 0.7; }
        }
      `}</style>

      <div style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: 70,
        zIndex: 175,
        pointerEvents: 'none',
        borderRadius: '22px 22px 0 0',
        overflow: 'hidden',
      }}>
        {/* Frosted glass body */}
        <div style={{
          position: 'absolute', inset: 0,
          background: isDark
            ? 'linear-gradient(160deg, rgba(12,5,2,0.97) 0%, rgba(18,7,24,0.97) 100%)'
            : 'linear-gradient(160deg, rgba(255,253,250,0.97) 0%, rgba(250,244,255,0.97) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }} />

        {/* Animated top gradient border */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1.5,
          background: 'linear-gradient(90deg, transparent 0%, #ff6b35 20%, #e040fb 50%, #ff6b35 80%, transparent 100%)',
          boxShadow: '0 0 12px rgba(255,107,53,0.55), 0 0 26px rgba(224,64,251,0.3)',
          animation: 'dock-glow 3.5s ease-in-out infinite',
        }} />

        {/* Subtle inner top highlight */}
        <div style={{
          position: 'absolute', top: 1.5, left: '8%', right: '8%', height: 1,
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.05), transparent)',
        }} />

        {/* Center FAB seat glow */}
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          width: 100, height: 100, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 60%, rgba(255,107,53,0.16) 0%, rgba(224,64,251,0.08) 45%, transparent 70%)',
        }} />

        {/* ── Left: stacked indicator bars (clickable → opens ExploreSheet) ── */}
        <button
          onClick={onOpen}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: 88,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
            cursor: 'pointer',
            background: 'transparent',
            border: 'none',
            padding: 0,
          }}
          title="Explore nearby"
          aria-label="Open explore panel"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 28 }}>
            {([28, 18, 22] as number[]).map((w, i) => (
              <div key={i} style={{
                width: w, height: 2.5, borderRadius: 2,
                background: i === 0
                  ? 'linear-gradient(90deg, #ff6b35, #e040fb)'
                  : isDark
                    ? `rgba(255,255,255,${0.18 - i * 0.05})`
                    : `rgba(0,0,0,${0.14 - i * 0.04})`,
                boxShadow: i === 0 ? '0 0 7px rgba(255,107,53,0.65)' : 'none',
              }} />
            ))}
          </div>
        </button>

        {/* Right: glowing dots */}
        <div style={{
          position: 'absolute', right: 28, top: '50%',
          transform: 'translateY(-50%)', display: 'flex', gap: 8, alignItems: 'center',
        }}>
          {[
            { size: 9,  color: '#ff6b35', shadow: 'rgba(255,107,53,0.9)', delay: '0s' },
            { size: 7,  color: '#e040fb', shadow: 'rgba(224,64,251,0.8)', delay: '0.6s' },
            { size: 5,  color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.18)', shadow: 'none', delay: '1.2s' },
          ].map((dot, i) => (
            <div key={i} style={{
              width: dot.size, height: dot.size, borderRadius: '50%',
              background: dot.color,
              boxShadow: dot.shadow !== 'none' ? `0 0 8px ${dot.shadow}, 0 0 18px ${dot.shadow}55` : 'none',
              animation: dot.shadow !== 'none' ? `dot-pulse 2.8s ease-in-out infinite` : 'none',
              animationDelay: dot.delay,
            }} />
          ))}
        </div>

        {/* Decorative side lines */}
        <div style={{
          position: 'absolute', left: 72, top: '50%', transform: 'translateY(-50%)',
          width: 1, height: 28,
          background: isDark
            ? 'linear-gradient(180deg, transparent, rgba(255,107,53,0.3), transparent)'
            : 'linear-gradient(180deg, transparent, rgba(255,107,53,0.25), transparent)',
        }} />
        <div style={{
          position: 'absolute', right: 72, top: '50%', transform: 'translateY(-50%)',
          width: 1, height: 28,
          background: isDark
            ? 'linear-gradient(180deg, transparent, rgba(224,64,251,0.3), transparent)'
            : 'linear-gradient(180deg, transparent, rgba(224,64,251,0.25), transparent)',
        }} />
      </div>
    </>
  );
}

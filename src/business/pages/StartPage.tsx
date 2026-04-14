import { useNavigate } from 'react-router';
import { CheckCircle, ArrowRight, Copy, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function StartPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const accent = '#f97316';
  const text = '#e2e8f0';
  const textMuted = '#64748b';
  const cardBg = '#0e1530';
  const cardBorder = 'rgba(255,140,80,0.12)';

  const cosmicGradient = 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 30%, #2d1080 50%, #1a0a4d 70%, #0d0621 100%)';
  const glowOverlay = 'radial-gradient(ellipse at 80% 50%, rgba(255,100,30,0.2) 0%, rgba(120,40,200,0.3) 40%, transparent 70%)';

  const demoCredentials = [
    {
      title: 'Business Account',
      email: 'business@example.com',
      password: 'Business@123',
      type: 'business',
      icon: '🏢',
      badgeColor: accent,
    },
    {
      title: 'Admin Account',
      email: 'admin@example.com',
      password: 'Admin@123',
      type: 'admin',
      icon: '🛡️',
      badgeColor: '#a855f7',
    },
  ];

  function copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedField(null), 2000);
  }

  // Star particles
  const stars = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    top: `${(i * 37 + 13) % 100}%`,
    left: `${(i * 53 + 7) % 100}%`,
    size: (i % 3) + 1,
    opacity: 0.2 + (i % 5) * 0.1,
  }));

  return (
    <div style={{ minHeight: '100vh', background: '#080d20', color: text, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Hero banner */}
      <section style={{ padding: '80px 48px 72px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: cosmicGradient }}>
        <div style={{ position: 'absolute', inset: 0, background: glowOverlay, pointerEvents: 'none' }} />
        {stars.map((star) => (
          <div key={star.id} style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#fff',
            opacity: star.opacity,
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>🚀</div>
          <h1 style={{ fontSize: 48, fontWeight: 900, marginBottom: 14, letterSpacing: '-1.5px', margin: '0 auto 14px' }}>
            Welcome to{' '}
            <span style={{
              color: 'transparent',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              backgroundImage: `linear-gradient(135deg, ${accent}, #fb923c, #fbbf24)`,
            }}>
              Redeem Rocket
            </span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(226,232,240,0.70)', maxWidth: 520, margin: '0 auto', lineHeight: 1.65 }}>
            Experience the full platform with demo credentials
          </p>
        </div>
      </section>

      {/* Main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 32px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 40, alignItems: 'start' }}>

          {/* Left: Features list */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: text, marginBottom: 24, letterSpacing: '-0.5px' }}>
              Platform Highlights
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📦', color: accent, title: 'Product Management', desc: 'Manage inventory and full catalog' },
                { icon: '💰', color: '#22c55e', title: 'Order Processing', desc: 'Track and manage customer orders' },
                { icon: '👥', color: '#3b82f6', title: 'Team Collaboration', desc: 'Manage team members and roles' },
                { icon: '📸', color: '#a855f7', title: 'Business Gallery', desc: 'Showcase products with photos' },
                { icon: '📊', color: '#fbbf24', title: 'Analytics', desc: 'Track performance and insights' },
                { icon: '💸', color: '#22c55e', title: 'Wallet System', desc: 'Manage payments and cashback' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  style={{
                    display: 'flex',
                    gap: 16,
                    padding: '16px 20px',
                    borderRadius: 14,
                    border: `1px solid ${cardBorder}`,
                    background: cardBg,
                    alignItems: 'center',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${feature.color}18`,
                    border: `1px solid ${feature.color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    flexShrink: 0,
                  }}>
                    {feature.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 3 }}>{feature.title}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Demo credential cards */}
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: text, marginBottom: 24, letterSpacing: '-0.5px' }}>
              Demo Credentials
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {demoCredentials.map((cred, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 28,
                    borderRadius: 20,
                    border: `1.5px solid rgba(255,140,80,0.25)`,
                    background: cardBg,
                    boxShadow: `0 0 40px rgba(249,115,22,0.08), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    backdropFilter: 'blur(8px)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {/* Card glow */}
                  <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 120, height: 120, borderRadius: '50%', background: `radial-gradient(circle, ${cred.badgeColor}20 0%, transparent 70%)`, pointerEvents: 'none' }} />

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: `1px solid ${cardBorder}` }}>
                    <div style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: `${cred.badgeColor}20`,
                      border: `1px solid ${cred.badgeColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}>
                      {cred.icon}
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: text, margin: 0 }}>{cred.title}</h3>
                    <CheckCircle size={16} color={cred.badgeColor} style={{ marginLeft: 'auto' }} />
                  </div>

                  {/* Email field */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                      Email
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${cardBorder}`,
                      background: 'rgba(8,13,32,0.6)',
                    }}>
                      <code style={{ fontSize: 13, color: text, flex: 1, fontFamily: '"Fira Code", "Courier New", monospace', wordBreak: 'break-all' }}>
                        {cred.email}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cred.email, `email-${idx}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedField === `email-${idx}` ? accent : textMuted,
                          display: 'flex',
                          padding: '4px',
                          transition: 'color 0.2s',
                        }}
                        title="Copy email"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Password field */}
                  <div style={{ marginBottom: 22 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
                      Password
                    </label>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: `1px solid ${cardBorder}`,
                      background: 'rgba(8,13,32,0.6)',
                    }}>
                      <code style={{ fontSize: 13, color: text, flex: 1, fontFamily: '"Fira Code", "Courier New", monospace' }}>
                        {showPassword ? cred.password : '••••••••••••'}
                      </code>
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', padding: '4px', transition: 'color 0.2s' }}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(cred.password, `password-${idx}`)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: copiedField === `password-${idx}` ? accent : textMuted,
                          display: 'flex',
                          padding: '4px',
                          transition: 'color 0.2s',
                        }}
                        title="Copy password"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Login button */}
                  <button
                    onClick={() => navigate('/login')}
                    style={{
                      width: '100%',
                      padding: '13px',
                      borderRadius: 11,
                      border: 'none',
                      background: `linear-gradient(135deg, ${cred.badgeColor === accent ? accent : '#a855f7'}, ${cred.badgeColor === accent ? '#fb923c' : '#7c3aed'})`,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      boxShadow: `0 0 20px ${cred.badgeColor}30`,
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 6px 24px ${cred.badgeColor}45`;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 20px ${cred.badgeColor}30`;
                    }}
                  >
                    Login as {cred.type === 'admin' ? 'Admin' : 'Business'} <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom tip card */}
        <div style={{
          marginTop: 52,
          padding: '24px 32px',
          borderRadius: 16,
          border: `1px solid ${cardBorder}`,
          background: cardBg,
          maxWidth: 620,
          margin: '52px auto 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 12,
        }}>
          <div style={{ fontSize: 28 }}>⚡</div>
          <p style={{ fontSize: 13, color: textMuted, margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: text }}>Tip:</strong> These are demo credentials for testing. Create your own account for production use.
          </p>
          <p style={{ fontSize: 13, color: textMuted, margin: 0 }}>
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: 'none',
                border: 'none',
                color: accent,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontWeight: 700,
                fontSize: 13,
                padding: 0,
              }}
            >
              Sign up here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

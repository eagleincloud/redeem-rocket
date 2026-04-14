import { useNavigate } from 'react-router';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [hoveredAdvantage, setHoveredAdvantage] = useState<string | null>(null);

  const accent = '#f97316';
  const text = '#e2e8f0';
  const textMuted = '#64748b';
  const cardBg = '#0e1530';
  const elevatedBg = '#1a2040';
  const cardBorder = 'rgba(255,140,80,0.12)';

  const cosmicGradient = 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 30%, #2d1080 50%, #1a0a4d 70%, #0d0621 100%)';
  const glowOverlay = 'radial-gradient(ellipse at 80% 50%, rgba(255,100,30,0.2) 0%, rgba(120,40,200,0.3) 40%, transparent 70%)';

  const features = [
    { icon: '📦', title: 'Product Management', description: 'Manage your entire product catalog with ease. Upload, organize, and track inventory all in one place.' },
    { icon: '💰', title: 'Smart Pricing & Offers', description: 'Create dynamic pricing strategies, manage discounts, and run promotional campaigns instantly.' },
    { icon: '🎯', title: 'Auction & Bidding', description: 'Run auctions and competitive bidding events to maximize product value and customer engagement.' },
    { icon: '📊', title: 'Advanced Analytics', description: 'Real-time dashboards, revenue tracking, order insights, and performance metrics.' },
    { icon: '💸', title: 'Secure Payment System', description: 'Integrated wallet, multiple payment methods, secure transactions, and instant settlements.' },
    { icon: '👥', title: 'Team Collaboration', description: 'Manage team members with role-based access, permissions, and performance tracking.' },
    { icon: '📸', title: 'Photo Gallery', description: 'Showcase your products with professional galleries and bulk uploads.' },
    { icon: '🚀', title: 'Marketing Automation', description: 'Automated campaigns, customer outreach, lead management, and email marketing.' },
    { icon: '📋', title: 'Order Management', description: 'Track orders from creation to delivery with complete history and status updates.' },
    { icon: '👤', title: 'Lead & CRM', description: 'Capture, nurture, and convert leads with integrated customer relationship management.' },
    { icon: '🔔', title: 'Smart Notifications', description: 'Real-time alerts for orders, messages, and business events.' },
    { icon: '📄', title: 'Invoice & Billing', description: 'Auto-generate invoices, manage subscriptions, and track payments.' },
  ];

  const benefits = [
    'Increase sales by up to 40% with smart tools',
    'Connect with customers 24/7 automatically',
    'Real-time analytics and comprehensive reporting',
    'Enterprise-grade security with encrypted data',
    'Dedicated 24/7 customer support team',
    'Seamless integrations with popular platforms',
  ];

  const advantages = [
    { icon: '⚡', color: '#f97316', title: 'All-in-One Platform', description: 'Stop using multiple tools. Manage products, payments, marketing, and analytics in one unified dashboard.' },
    { icon: '📈', color: '#3b82f6', title: 'Smart Growth Features', description: 'Built-in auction system, automated campaigns, and lead management designed specifically for business growth.' },
    { icon: '🔐', color: '#a855f7', title: 'Enterprise Security', description: 'Bank-level encryption, role-based access control, and compliance with data protection regulations.' },
    { icon: '⚙️', color: '#22c55e', title: 'Role-Based Permissions', description: 'Assign custom roles to team members with granular control over who can access what features.' },
    { icon: '📊', color: '#3b82f6', title: 'Actionable Insights', description: "Deep analytics that show exactly what's working — revenue trends, customer behavior, and sales patterns." },
    { icon: '🤖', color: '#a855f7', title: 'Automation at Scale', description: 'Automate repetitive tasks — from marketing campaigns to order processing to customer notifications.' },
  ];

  // Star particles
  const stars = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 3 + 1,
    opacity: Math.random() * 0.7 + 0.2,
  }));

  return (
    <div style={{ background: '#080d20', color: text, minHeight: '100vh', overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '18px 48px',
        borderBottom: `1px solid ${cardBorder}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(8,13,32,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: accent, letterSpacing: '-0.5px' }}>Redeem Rocket</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: `1px solid rgba(255,140,80,0.3)`,
              background: 'transparent',
              color: text,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '10px 24px',
              borderRadius: 10,
              border: 'none',
              background: `linear-gradient(135deg, ${accent}, #fb923c)`,
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '110px 48px 100px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: cosmicGradient,
      }}>
        {/* Glow overlay */}
        <div style={{ position: 'absolute', inset: 0, background: glowOverlay, pointerEvents: 'none' }} />

        {/* Star particles */}
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
          <div style={{ fontSize: 72, marginBottom: 24 }}>🚀</div>
          <h1 style={{
            fontSize: 64,
            fontWeight: 900,
            marginBottom: 20,
            margin: '0 auto 20px',
            maxWidth: 900,
            lineHeight: 1.1,
            letterSpacing: '-2px',
          }}>
            Your Business{' '}
            <span style={{
              color: 'transparent',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              backgroundImage: `linear-gradient(135deg, ${accent}, #fb923c, #fbbf24)`,
            }}>
              Supercharged
            </span>
          </h1>
          <p style={{ fontSize: 19, color: 'rgba(226,232,240,0.75)', maxWidth: 680, margin: '0 auto 48px', lineHeight: 1.65 }}>
            Redeem Rocket is the all-in-one platform for modern businesses. Manage products, engage customers, process payments, and grow your revenue — all in one place.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                border: 'none',
                background: `linear-gradient(135deg, ${accent}, #fb923c)`,
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: `0 0 32px rgba(249,115,22,0.45)`,
              }}
            >
              Get Started Free <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                padding: '16px 36px',
                borderRadius: 12,
                border: `1.5px solid rgba(255,255,255,0.2)`,
                background: 'rgba(255,255,255,0.06)',
                color: text,
                fontSize: 16,
                fontWeight: 700,
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
              }}
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '100px 48px', background: '#080d20' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              Features
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
              Everything You Need to{' '}
              <span style={{ color: accent }}>Succeed</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {features.map((feature) => (
              <div
                key={feature.title}
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: cardBg,
                  border: `1px solid ${hoveredFeature === feature.title ? 'rgba(249,115,22,0.35)' : cardBorder}`,
                  cursor: 'pointer',
                  transform: hoveredFeature === feature.title ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                  boxShadow: hoveredFeature === feature.title ? `0 16px 40px rgba(249,115,22,0.15)` : 'none',
                }}
                onMouseEnter={() => setHoveredFeature(feature.title)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div style={{ fontSize: 44, marginBottom: 18 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: text }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.65, margin: 0 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section style={{ padding: '100px 48px', background: elevatedBg }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 72, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)', color: accent, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>
                Why Us
              </div>
              <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 36, lineHeight: 1.15, letterSpacing: '-1px' }}>
                Why <span style={{ color: accent }}>Choose</span> Redeem Rocket?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {benefits.map((benefit) => (
                  <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle size={16} color={accent} />
                    </div>
                    <span style={{ fontSize: 15, color: text, lineHeight: 1.5 }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              padding: 44,
              borderRadius: 24,
              background: cardBg,
              border: `1.5px solid rgba(249,115,22,0.3)`,
              textAlign: 'center',
              boxShadow: '0 0 60px rgba(249,115,22,0.1)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 72, marginBottom: 20 }}>🚀</div>
              <h3 style={{ fontSize: 48, fontWeight: 900, marginBottom: 8, color: accent, letterSpacing: '-2px' }}>10,000+</h3>
              <p style={{ fontSize: 15, color: textMuted, marginBottom: 32, lineHeight: 1.6 }}>
                Businesses trust Redeem Rocket to power their sales and customer engagement
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ padding: 20, borderRadius: 12, background: elevatedBg }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: accent }}>40%</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>Avg Sales Increase</div>
                </div>
                <div style={{ padding: 20, borderRadius: 12, background: elevatedBg }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#22c55e' }}>24/7</div>
                  <div style={{ fontSize: 12, color: textMuted, marginTop: 4 }}>Customer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages — 3-column grid with icon badges */}
      <section style={{ padding: '100px 48px', background: '#080d20' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 70 }}>
            <div style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#a855f7', fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              Advantages
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
              Why Businesses <span style={{ color: accent }}>Choose</span> Us
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 28 }}>
            {advantages.map((advantage) => (
              <div
                key={advantage.title}
                style={{
                  padding: 32,
                  borderRadius: 16,
                  background: cardBg,
                  border: `1px solid ${hoveredAdvantage === advantage.title ? `${advantage.color}50` : cardBorder}`,
                  transition: 'all 0.3s ease',
                  transform: hoveredAdvantage === advantage.title ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: hoveredAdvantage === advantage.title ? `0 12px 32px ${advantage.color}20` : 'none',
                  cursor: 'default',
                }}
                onMouseEnter={() => setHoveredAdvantage(advantage.title)}
                onMouseLeave={() => setHoveredAdvantage(null)}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: `${advantage.color}20`,
                  border: `1px solid ${advantage.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  marginBottom: 20,
                }}>
                  {advantage.icon}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: text }}>{advantage.title}</h3>
                <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.65, margin: 0 }}>{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 48px', background: elevatedBg }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 40, textAlign: 'center' }}>
            {[
              { icon: '💼', value: '10K+', label: 'Active Businesses', color: accent },
              { icon: '💰', value: '$500M+', label: 'Transactions Processed', color: '#22c55e' },
              { icon: '⭐', value: '4.9/5', label: 'Customer Rating', color: '#fbbf24' },
              { icon: '🌍', value: '50+', label: 'Countries Served', color: '#3b82f6' },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: 32, borderRadius: 16, background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div style={{ fontSize: 44, marginBottom: 14 }}>{stat.icon}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: stat.color, marginBottom: 8, letterSpacing: '-1px' }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: textMuted }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner — cosmic gradient */}
      <section style={{ padding: '110px 48px', background: cosmicGradient, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: glowOverlay, pointerEvents: 'none' }} />
        {stars.slice(0, 15).map((star) => (
          <div key={star.id} style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            borderRadius: '50%',
            background: '#fff',
            opacity: star.opacity * 0.6,
            pointerEvents: 'none',
          }} />
        ))}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, marginBottom: 20, letterSpacing: '-1.5px' }}>
            Start Growing Today
          </h2>
          <p style={{ fontSize: 18, color: 'rgba(226,232,240,0.75)', marginBottom: 40, lineHeight: 1.65 }}>
            Join thousands of successful businesses using Redeem Rocket. Start free — no credit card required.
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              padding: '18px 44px',
              borderRadius: 14,
              border: 'none',
              background: `linear-gradient(135deg, ${accent}, #fb923c)`,
              color: '#fff',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: `0 0 48px rgba(249,115,22,0.5)`,
            }}
          >
            Get Started Free <ArrowRight size={22} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '48px', borderTop: `1px solid ${cardBorder}`, background: '#080d20' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Redeem Rocket" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, color: accent, fontSize: 16 }}>Redeem Rocket</span>
          </div>
          <p style={{ fontSize: 13, color: textMuted, textAlign: 'center', margin: 0 }}>
            © 2026 Redeem Rocket. All rights reserved. &nbsp;|&nbsp; Transforming businesses worldwide.
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {['Privacy Policy', 'Terms of Service', 'Contact Us'].map((link) => (
              <span key={link} style={{ fontSize: 13, color: textMuted, cursor: 'pointer', transition: 'color 0.2s' }}>{link}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

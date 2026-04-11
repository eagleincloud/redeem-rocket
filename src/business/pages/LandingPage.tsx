import { useNavigate } from 'react-router';
import { useTheme } from '@/app/context/ThemeContext';
import { ArrowRight, CheckCircle, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export function LandingPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const bg = isDark ? '#080d20' : '#ffffff';
  const bgSecondary = isDark ? '#0e1530' : '#f8f9fa';
  const card = isDark ? '#0e1530' : '#ffffff';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text = isDark ? '#e2e8f0' : '#18100a';
  const textMuted = isDark ? '#64748b' : '#9a7860';
  const accent = '#f97316';

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
    { icon: '⚡', title: 'All-in-One Platform', description: 'Stop using multiple tools. Manage products, payments, marketing, and analytics in one unified dashboard.' },
    { icon: '📈', title: 'Smart Growth Features', description: 'Built-in auction system, automated campaigns, and lead management designed specifically for business growth.' },
    { icon: '🔐', title: 'Enterprise Security', description: 'Bank-level encryption, role-based access control, and compliance with data protection regulations.' },
    { icon: '⚙️', title: 'Role-Based Permissions', description: 'Assign custom roles to team members with granular control over who can access what features.' },
    { icon: '📊', title: 'Actionable Insights', description: 'Deep analytics that show exactly what\'s working - revenue trends, customer behavior, and sales patterns.' },
    { icon: '🤖', title: 'Automation at Scale', description: 'Automate repetitive tasks - from marketing campaigns to order processing to customer notifications.' },
  ];

  return (
    <div style={{ background: bg, color: text, minHeight: '100vh', overflow: 'hidden' }}>
      {/* Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: `1px solid ${border}`, position: 'sticky', top: 0, zIndex: 1000, background: bg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 40, width: 'auto', objectFit: 'contain' }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: accent }}>Redeem Rocket</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button onClick={toggleTheme} style={{ background: 'none', border: 'none', cursor: 'pointer', color: textMuted, display: 'flex', padding: '8px', borderRadius: 8 }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', borderRadius: 8, border: `1px solid ${border}`, background: 'transparent', color: text, cursor: 'pointer', fontWeight: 600 }}>
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '100px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 120, width: 'auto', objectFit: 'contain', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: 56, fontWeight: 800, marginBottom: 16, margin: '0 auto 16px', maxWidth: 900 }}>
            Your Business <span style={{ color: accent }}>Supercharged</span>
          </h1>
          <p style={{ fontSize: 18, color: textMuted, maxWidth: 700, margin: '0 auto 40px', lineHeight: 1.6 }}>
            Redeem Rocket is the all-in-one platform for modern businesses. Manage products, engage customers, process payments, and grow your revenue—all in one place.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} style={{ padding: '16px 32px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              Get Started Free <ArrowRight size={20} />
            </button>
            <button onClick={() => navigate('/login')} style={{ padding: '16px 32px', borderRadius: 12, border: `2px solid ${border}`, background: 'transparent', color: text, fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
              View Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '80px 40px', background: bgSecondary }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>
            Everything You Need to <span style={{ color: accent }}>Succeed</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {features.map((feature) => (
              <div key={feature.title} style={{ padding: 32, borderRadius: 16, background: card, border: `1px solid ${border}`, cursor: 'pointer', transform: hoveredFeature === feature.title ? 'translateY(-8px)' : 'translateY(0)', transition: 'all 0.3s' }} onMouseEnter={() => setHoveredFeature(feature.title)} onMouseLeave={() => setHoveredFeature(null)}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 60, alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 32 }}>
                Why <span style={{ color: accent }}>Choose</span> Redeem Rocket?
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {benefits.map((benefit) => (
                  <div key={benefit} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle size={24} color={accent} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 16, color: text }}>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 40, borderRadius: 20, background: bgSecondary, border: `2px solid ${accent}`, textAlign: 'center' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🚀</div>
              <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: accent }}>10,000+</h3>
              <p style={{ fontSize: 14, color: textMuted, marginBottom: 24 }}>
                Businesses trust Redeem Rocket to power their sales and customer engagement
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>40%</div>
                  <div style={{ fontSize: 12, color: textMuted }}>Avg Sales Increase</div>
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>24/7</div>
                  <div style={{ fontSize: 12, color: textMuted }}>Customer Support</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section style={{ padding: '80px 40px', background: bgSecondary }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>
            Why Businesses <span style={{ color: accent }}>Choose</span> Us
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 32 }}>
            {advantages.map((advantage) => (
              <div key={advantage.title} style={{ padding: 32, borderRadius: 16, background: card, border: `1px solid ${border}` }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>{advantage.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{advantage.title}</h3>
                <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.6 }}>{advantage.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ padding: '80px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 40, textAlign: 'center' }}>
            {[
              { icon: '💼', value: '10K+', label: 'Active Businesses' },
              { icon: '💰', value: '$500M+', label: 'Transactions Processed' },
              { icon: '⭐', value: '4.9/5', label: 'Customer Rating' },
              { icon: '🌍', value: '50+', label: 'Countries Served' },
            ].map((stat) => (
              <div key={stat.label}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>{stat.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: accent, marginBottom: 8 }}>{stat.value}</div>
                <div style={{ fontSize: 14, color: textMuted }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ padding: '100px 40px', background: `linear-gradient(135deg, ${accent}22 0%, ${accent}11 100%)`, textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, marginBottom: 24 }}>
            Ready to Grow Your Business?
          </h2>
          <p style={{ fontSize: 18, color: textMuted, marginBottom: 32, lineHeight: 1.6 }}>
            Join thousands of successful businesses using Redeem Rocket. Start free, no credit card required.
          </p>
          <button onClick={() => navigate('/signup')} style={{ padding: '16px 40px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${accent}, #fb923c)`, color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start Your Free Trial <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px', borderTop: `1px solid ${border}`, textAlign: 'center', color: textMuted, fontSize: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          <img src="/logo.png" alt="Redeem Rocket" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontWeight: 700, color: accent }}>Redeem Rocket</span>
        </div>
        <p style={{ marginBottom: 16 }}>
          © 2026 Redeem Rocket. All rights reserved. | Transforming businesses worldwide.
        </p>
      </footer>
    </div>
  );
}

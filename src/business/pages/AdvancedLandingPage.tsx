/**
 * Advanced Landing Page
 * Entry point with use-case selector for smart routing
 */

import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Zap, Shield, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import type { UseCase } from '../types/advanced-onboarding';

export function AdvancedLandingPage() {
  const navigate = useNavigate();
  const [selectedUseCase, setSelectedUseCase] = useState<UseCase | null>(null);

  const accent = '#FF9E1B';
  const text = '#e2e8f0';
  const textMuted = '#64748b';
  const cardBg = '#0e1530';
  const elevatedBg = '#1a2040';
  const cardBorder = 'rgba(255,140,80,0.12)';

  const cosmicGradient = 'linear-gradient(135deg, #0d0621 0%, #1a0a4d 30%, #2d1080 50%, #1a0a4d 70%, #0d0621 100%)';

  const useCases = [
    {
      id: 'restaurant' as const,
      label: 'Run a restaurant',
      icon: '🍽️',
      description: 'Manage orders, delivery, and customer relationships',
    },
    {
      id: 'services' as const,
      label: 'Sell services',
      icon: '🏢',
      description: 'Track projects, invoices, and client communication',
    },
    {
      id: 'online_store' as const,
      label: 'Run an online store',
      icon: '🛍️',
      description: 'Manage products, inventory, and customer orders',
    },
    {
      id: 'none' as const,
      label: 'Not sure yet',
      icon: '❓',
      description: 'Explore all features and find what fits',
    },
  ];

  const features = [
    { icon: '📦', title: 'All-in-One Platform', description: 'Products, Orders, CRM, Analytics - everything in one place' },
    { icon: '⚡', title: 'Get to Value in 10 mins', description: 'Smart onboarding sets up your business automatically' },
    { icon: '🤖', title: 'AI-Powered Setup', description: 'Share your website, we extract and configure everything' },
    { icon: '👥', title: 'Team Collaboration', description: 'Role-based permissions, task assignment, real-time sync' },
    { icon: '📊', title: 'Real-Time Analytics', description: 'Monitor revenue, pipeline health, customer behavior' },
    { icon: '🔐', title: 'Enterprise Security', description: 'Bank-level encryption, compliance, and data protection' },
  ];

  const benefits = [
    'Set up your business system in under 10 minutes',
    'Connect with customers 24/7 with automated workflows',
    'Get insights with real-time dashboards and reports',
    'Scale without hiring (automation does the heavy lifting)',
    'Enterprise-grade security out of the box',
    'Integrations with all your favorite tools',
  ];

  const testimonials = [
    { author: 'Sarah Chen', role: 'Restaurant Owner', quote: 'Doubled our online orders in 3 months' },
    { author: 'Mike Johnson', role: 'Freelance Designer', quote: 'Saves 10+ hours every week on admin work' },
    { author: 'Lisa Park', role: 'E-commerce Manager', quote: 'Best business investment we made this year' },
  ];

  const handleGetStarted = () => {
    if (!selectedUseCase || selectedUseCase === 'none') {
      navigate('/signup');
    } else {
      navigate(`/signup?useCase=${selectedUseCase}`);
    }
  };

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
        background: 'rgba(8,13,32,0.9)',
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
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
              (e.currentTarget as HTMLButtonElement).style.color = accent;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,80,0.3)';
              (e.currentTarget as HTMLButtonElement).style.color = text;
            }}
          >
            Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        padding: '80px 48px',
        background: cosmicGradient,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,100,30,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'rgba(255,140,80,0.15)',
            border: `1px solid ${accent}`,
            borderRadius: 20,
            marginBottom: 24,
            fontSize: 13,
            fontWeight: 600,
            color: accent,
          }}>
            Setting up your business just got 10x easier
          </div>

          {/* Main Heading */}
          <h1 style={{
            fontSize: 64,
            fontWeight: 900,
            lineHeight: 1.2,
            marginBottom: 24,
            letterSpacing: '-2px',
          }}>
            Run your entire business <span style={{ color: accent }}>from one system</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 20,
            color: textMuted,
            marginBottom: 48,
            lineHeight: 1.6,
          }}>
            Get to value in 10 minutes. Smart setup extracts your business info, creates pipelines, and sets up automation.
          </p>

          {/* Use Case Selector */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 16,
            marginBottom: 48,
            maxWidth: 700,
            margin: '0 auto 48px',
          }}>
            {useCases.map((uc) => (
              <button
                key={uc.id}
                onClick={() => setSelectedUseCase(uc.id)}
                style={{
                  padding: 24,
                  background: selectedUseCase === uc.id ? elevatedBg : cardBg,
                  border: `2px solid ${selectedUseCase === uc.id ? accent : 'rgba(255,140,80,0.2)'}`,
                  borderRadius: 16,
                  color: text,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = accent;
                  (e.currentTarget as HTMLButtonElement).style.background = elevatedBg;
                }}
                onMouseLeave={(e) => {
                  if (selectedUseCase !== uc.id) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,140,80,0.2)';
                    (e.currentTarget as HTMLButtonElement).style.background = cardBg;
                  }
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{uc.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{uc.label}</div>
                <div style={{ fontSize: 12, color: textMuted }}>{uc.description}</div>
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGetStarted}
            style={{
              padding: '16px 48px',
              background: accent,
              color: '#000',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px rgba(249,115,22,0.3)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>

          <p style={{ fontSize: 12, color: textMuted, marginTop: 24 }}>
            No credit card required. Free tier includes all core features.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '80px 48px', background: '#0a0e27' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 48, textAlign: 'center' }}>
            Everything you need to <span style={{ color: accent }}>grow faster</span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            marginBottom: 80,
          }}>
            {features.map((feature, idx) => (
              <div key={idx} style={{
                padding: 32,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 16,
                transition: 'all 0.3s',
              }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = accent;
                  el.style.boxShadow = `0 8px 24px rgba(249,115,22,0.1)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.borderColor = cardBorder;
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 16 }}>{feature.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{feature.title}</h3>
                <p style={{ color: textMuted, lineHeight: 1.6 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{ padding: '80px 48px', background: '#080d20' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 48, textAlign: 'center' }}>
            Why <span style={{ color: accent }}>thousands of businesses</span> trust us
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 80 }}>
            {benefits.map((benefit, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ color: accent, marginTop: 4 }}>
                  <CheckCircle size={24} />
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6 }}>{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section style={{ padding: '80px 48px', background: '#0a0e27' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 48, textAlign: 'center' }}>
            Loved by <span style={{ color: accent }}>entrepreneurs</span> worldwide
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
            {testimonials.map((testimonial, idx) => (
              <div key={idx} style={{
                padding: 32,
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: 16,
              }}>
                <div style={{ marginBottom: 20 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ color: '#fbbf24', fontSize: 16 }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 20, fontStyle: 'italic' }}>
                  "{testimonial.quote}"
                </p>
                <div>
                  <div style={{ fontWeight: 700 }}>{testimonial.author}</div>
                  <div style={{ color: textMuted, fontSize: 14 }}>{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{
        padding: '80px 48px',
        background: cosmicGradient,
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, marginBottom: 24 }}>
          Ready to grow your business?
        </h2>
        <p style={{ fontSize: 18, color: textMuted, marginBottom: 48 }}>
          Join thousands of businesses already using our platform
        </p>
        <button
          onClick={handleGetStarted}
          style={{
            padding: '16px 48px',
            background: accent,
            color: '#000',
            border: 'none',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 12px 24px rgba(249,115,22,0.3)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
          }}
        >
          Get Started Free <ArrowRight size={18} />
        </button>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '32px 48px',
        borderTop: `1px solid ${cardBorder}`,
        color: textMuted,
        fontSize: 14,
        textAlign: 'center',
      }}>
        <p>Redeem Rocket © 2026. All rights reserved.</p>
      </footer>
    </div>
  );
}

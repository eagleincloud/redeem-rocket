import { useState } from 'react';
import { ChevronRight, ChevronLeft, Zap, TrendingUp, Users, Smartphone, Megaphone, Lock } from 'lucide-react';
import { useBusinessContext } from '../context/BusinessContext';
import { FeatureDetailModal } from './FeatureDetailModal';

export interface Feature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  roiMetric: string;
  category: string;
  businessTypes: string[];
  useCase: string;
  templates: string[];
}

const FEATURES_BY_CATEGORY: Record<string, Feature[]> = {
  'Technology': [
    {
      id: 'automation',
      name: 'Workflow Automation',
      description: 'Automate repetitive tasks and business processes',
      icon: <Zap size={28} />,
      roiMetric: '40% time savings',
      category: 'Productivity',
      businessTypes: ['Technology', 'Education', 'Consulting'],
      useCase: 'Automate client onboarding, invoice generation, and follow-ups',
      templates: ['Client Onboarding', 'Invoice & Payment', 'Lead Follow-up'],
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Track performance metrics and gain insights',
      icon: <TrendingUp size={28} />,
      roiMetric: '25% efficiency boost',
      category: 'Insights',
      businessTypes: ['Technology', 'E-commerce', 'SaaS'],
      useCase: 'Monitor revenue trends, user behavior, and conversion metrics',
      templates: ['Sales Dashboard', 'Customer Analytics', 'Performance Report'],
    },
    {
      id: 'team_collab',
      name: 'Team Collaboration',
      description: 'Enable seamless team communication and project tracking',
      icon: <Users size={28} />,
      roiMetric: '30% faster execution',
      category: 'Team',
      businessTypes: ['Technology', 'Agency', 'Consulting'],
      useCase: 'Assign tasks, track progress, and collaborate in real-time',
      templates: ['Project Board', 'Team Tasks', 'Sprint Planning'],
    },
    {
      id: 'mobile_app',
      name: 'Mobile App Access',
      description: 'Access your dashboard on the go from any device',
      icon: <Smartphone size={28} />,
      roiMetric: 'Always connected',
      category: 'Accessibility',
      businessTypes: ['Technology', 'Retail', 'Services'],
      useCase: 'Manage orders, respond to customers, and track metrics on mobile',
      templates: ['Mobile Dashboard', 'Quick Actions', 'Push Notifications'],
    },
  ],
  'Retail': [
    {
      id: 'product_catalog',
      name: 'Product Catalog',
      description: 'Showcase and manage your products with rich details',
      icon: <Megaphone size={28} />,
      roiMetric: '50% more engagement',
      category: 'Sales',
      businessTypes: ['Retail', 'E-commerce', 'Fashion'],
      useCase: 'Display products with photos, descriptions, pricing, and inventory',
      templates: ['Basic Catalog', 'Fashion Showcase', 'Electronics Store'],
    },
    {
      id: 'customer_reviews',
      name: 'Customer Reviews',
      description: 'Collect and display customer feedback and ratings',
      icon: <Users size={28} />,
      roiMetric: '45% more conversions',
      category: 'Trust',
      businessTypes: ['Retail', 'E-commerce', 'Services'],
      useCase: 'Build trust with verified customer reviews and ratings',
      templates: ['Review Widget', 'Testimonials', 'Social Proof'],
    },
    {
      id: 'pos_integration',
      name: 'POS Integration',
      description: 'Connect with your point-of-sale system',
      icon: <Lock size={28} />,
      roiMetric: '100% sync accuracy',
      category: 'Operations',
      businessTypes: ['Retail', 'Restaurant', 'Grocery'],
      useCase: 'Sync inventory, sales, and transactions in real-time',
      templates: ['POS Sync', 'Inventory Management', 'Sales Reports'],
    },
  ],
  'Services': [
    {
      id: 'booking_system',
      name: 'Booking & Scheduling',
      description: 'Let customers book services and appointments easily',
      icon: <Users size={28} />,
      roiMetric: '35% more bookings',
      category: 'Sales',
      businessTypes: ['Services', 'Healthcare', 'Salon'],
      useCase: 'Accept online bookings, manage calendar, send reminders',
      templates: ['Service Booking', 'Appointment Scheduler', 'Calendar View'],
    },
    {
      id: 'lead_management',
      name: 'Lead Management',
      description: 'Capture, track, and convert sales leads',
      icon: <TrendingUp size={28} />,
      roiMetric: '60% higher conversion',
      category: 'Sales',
      businessTypes: ['Services', 'Real Estate', 'Consulting'],
      useCase: 'Track prospects from inquiry to closing',
      templates: ['Lead Pipeline', 'Deal Tracker', 'Follow-up Queue'],
    },
    {
      id: 'email_campaigns',
      name: 'Email Marketing',
      description: 'Send targeted campaigns and newsletters',
      icon: <Megaphone size={28} />,
      roiMetric: '3x ROI on average',
      category: 'Marketing',
      businessTypes: ['Services', 'Education', 'SaaS'],
      useCase: 'Nurture leads with automated email sequences',
      templates: ['Welcome Series', 'Promotional', 'Newsletter'],
    },
  ],
};

interface FeatureShowcasePhaseProps {
  onNext: () => void;
  onPrevious: () => void;
  selectedFeatures?: string[];
  onFeatureToggle?: (featureId: string) => void;
}

export function FeatureShowcasePhase({
  onNext,
  onPrevious,
  selectedFeatures = [],
  onFeatureToggle,
}: FeatureShowcasePhaseProps) {
  const { bizUser } = useBusinessContext();
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const businessCategory = bizUser?.businessCategory || 'Technology';
  const categoryFeatures = FEATURES_BY_CATEGORY[businessCategory] || FEATURES_BY_CATEGORY['Technology'];
  const displayFeatures = categoryFeatures.slice(0, 6);

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    hover: '#1a1f3a',
  };

  function handleExplore(feature: Feature) {
    setSelectedFeature(feature);
    setIsModalOpen(true);
  }

  function handleFeatureSelect(featureId: string) {
    onFeatureToggle?.(featureId);
  }

  return (
    <div style={{ width: '100%' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500 }}>
            Phase 2 of 3: Feature Showcase
          </span>
          <span style={{ fontSize: '13px', color: colors.accent, fontWeight: 600 }}>
            ~2 minutes
          </span>
        </div>
        <div
          style={{
            height: '3px',
            background: colors.border,
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: colors.accent,
              width: '33%',
              transition: 'width 0.3s ease-out',
            }}
          />
        </div>
      </div>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 12px 0',
            lineHeight: '1.2',
          }}
        >
          Explore Features for Your Business
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: colors.textMuted,
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          Curated features for {businessCategory} businesses. Click explore to learn more about each feature.
        </p>
      </div>

      {/* Features Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '40px',
        }}
      >
        {displayFeatures.map(feature => (
          <div
            key={feature.id}
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              transition: 'all 0.2s ease',
              cursor: 'pointer',
              opacity: selectedFeatures.includes(feature.id) ? 1 : 0.8,
              transform: selectedFeatures.includes(feature.id) ? 'scale(1.02)' : 'scale(1)',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = colors.hover;
              el.style.borderColor = colors.accent;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = colors.card;
              el.style.borderColor = colors.border;
            }}
          >
            {/* Feature Icon */}
            <div
              style={{
                fontSize: '28px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                background: `${colors.accent}20`,
                borderRadius: '8px',
                color: colors.accent,
              }}
            >
              {feature.icon}
            </div>

            {/* Feature Name */}
            <h3
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: colors.text,
                margin: '0 0 8px 0',
              }}
            >
              {feature.name}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: '13px',
                color: colors.textMuted,
                margin: '0 0 12px 0',
                lineHeight: '1.4',
              }}
            >
              {feature.description}
            </p>

            {/* ROI Metric */}
            <div
              style={{
                fontSize: '12px',
                color: colors.success,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '4px', height: '4px', background: colors.success, borderRadius: '50%' }} />
              {feature.roiMetric}
            </div>

            {/* Explore Button */}
            <button
              onClick={() => handleExplore(feature)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: `1px solid ${colors.accent}`,
                color: colors.accent,
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement;
                el.style.background = colors.accent;
                el.style.color = 'white';
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement;
                el.style.background = 'transparent';
                el.style.color = colors.accent;
              }}
            >
              Explore
            </button>

            {/* Selected Indicator */}
            {selectedFeatures.includes(feature.id) && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px',
                  background: `${colors.success}20`,
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: colors.success,
                  textAlign: 'center',
                  fontWeight: 500,
                }}
              >
                ✓ Selected
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onPrevious}
          style={{
            flex: 1,
            padding: '16px',
            background: 'transparent',
            border: `1.5px solid ${colors.border}`,
            color: colors.textMuted,
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.text;
            el.style.color = colors.text;
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.border;
            el.style.color = colors.textMuted;
          }}
        >
          <ChevronLeft size={18} />
          Previous
        </button>
        <button
          onClick={onNext}
          style={{
            flex: 1,
            padding: '16px',
            background: colors.accent,
            border: 'none',
            color: 'white',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLElement;
            el.style.opacity = '0.9';
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            el.style.opacity = '1';
          }}
        >
          Next
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Feature Detail Modal */}
      {isModalOpen && selectedFeature && (
        <FeatureDetailModal
          feature={selectedFeature}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={() => {
            handleFeatureSelect(selectedFeature.id);
          }}
          isSelected={selectedFeatures.includes(selectedFeature.id)}
        />
      )}
    </div>
  );
}

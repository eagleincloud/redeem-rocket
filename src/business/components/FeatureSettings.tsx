import { useState } from 'react';
import { useBusinessContext } from '../context/BusinessContext';
import { completeOnboarding } from '@/app/api/supabase-data';
import { Check, Loader } from 'lucide-react';

export interface FeaturePreferences {
  product_catalog: boolean;
  lead_management: boolean;
  email_campaigns: boolean;
  automation: boolean;
  social_media: boolean;
}

const FEATURES = [
  {
    id: 'product_catalog' as const,
    name: 'Product Catalog',
    icon: '📦',
    description: 'Showcase and manage your products or services',
    features: ['Digital catalog', 'Product photos', 'Pricing management', 'Customer browsing'],
  },
  {
    id: 'lead_management' as const,
    name: 'Lead Management',
    icon: '👥',
    description: 'Capture and track sales opportunities',
    features: ['Lead tracking', 'Sales pipeline', 'Deal management', 'Win/loss analysis'],
  },
  {
    id: 'email_campaigns' as const,
    name: 'Email Campaigns',
    icon: '📧',
    description: 'Send automated email sequences to customers',
    features: ['Email templates', 'Auto-sequences', 'Email tracking', 'Open/click analytics'],
  },
  {
    id: 'automation' as const,
    name: 'Workflow Automation',
    icon: '🤖',
    description: 'Automate repetitive business tasks',
    features: ['If-then rules', 'Trigger-based actions', 'Multi-step workflows', 'Automation logs'],
  },
  {
    id: 'social_media' as const,
    name: 'Social Media',
    icon: '📱',
    description: 'Manage all your social accounts in one place',
    features: ['Account management', 'Post scheduling', 'Cross-platform posting', 'Analytics'],
  },
];

export function FeatureSettings() {
  const { bizUser, setBizUser } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const [preferences, setPreferences] = useState<FeaturePreferences>(
    bizUser?.feature_preferences || {
      product_catalog: true,
      lead_management: false,
      email_campaigns: false,
      automation: false,
      social_media: false,
    }
  );

  const toggleFeature = (featureId: keyof FeaturePreferences) => {
    setPreferences(prev => ({
      ...prev,
      [featureId]: !prev[featureId],
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!bizUser) return;

    try {
      setLoading(true);
      const success = await completeOnboarding(bizUser.id, preferences);

      if (success) {
        const updatedUser = {
          ...bizUser,
          feature_preferences: preferences,
        };
        setBizUser(updatedUser);
        localStorage.setItem('biz_user', JSON.stringify(updatedUser));
        setSaved(true);

        // Reset saved message after 3 seconds
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const colors = {
    bg: '#f9fafb',
    card: '#ffffff',
    border: '#e5e7eb',
    text: '#1f2937',
    textMuted: '#6b7280',
    accent: '#3b82f6',
    success: '#10b981',
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: colors.text, margin: '0 0 8px 0' }}>
          Feature Preferences
        </h1>
        <p style={{ fontSize: '14px', color: colors.textMuted, margin: 0 }}>
          Customize which features are enabled in your dashboard
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {FEATURES.map(feature => (
          <div
            key={feature.id}
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: preferences[feature.id] ? 1 : 0.6,
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = colors.accent;
              el.style.boxShadow = `0 0 0 3px ${colors.accent}20`;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ fontSize: '32px' }}>{feature.icon}</div>
              <input
                type="checkbox"
                checked={preferences[feature.id]}
                onChange={() => toggleFeature(feature.id)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: colors.accent,
                }}
              />
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 600, color: colors.text, margin: '0 0 4px 0' }}>
              {feature.name}
            </h3>
            <p style={{ fontSize: '13px', color: colors.textMuted, margin: '0 0 12px 0', lineHeight: '1.4' }}>
              {feature.description}
            </p>

            <div style={{ display: 'grid', gap: '4px' }}>
              {feature.features.map((f, idx) => (
                <div key={idx} style={{ fontSize: '12px', color: colors.textMuted, display: 'flex', gap: '6px' }}>
                  <span>✓</span>
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.success }}>
            <Check size={20} />
            <span style={{ fontSize: '14px', fontWeight: 600 }}>Saved successfully</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '12px 24px',
            background: colors.accent,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLElement;
            if (!loading) el.style.opacity = '0.9';
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            if (!loading) el.style.opacity = '1';
          }}
        >
          {loading ? (
            <>
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Saving...
            </>
          ) : (
            <>
              <Check size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

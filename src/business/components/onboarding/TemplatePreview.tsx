import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Clock,
  Zap,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingCart,
  Check,
  Link as LinkIcon,
} from 'lucide-react';

// Template Interface (same as TemplateSelector)
export interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  featureCount: number;
  setupTimeMinutes: number;
  complexity: 'simple' | 'intermediate' | 'advanced';
  businessTypeId: string;
  features: string[];
  automations: string[];
  integrations: string[];
  sampleData: boolean;
}

interface TemplatePreviewProps {
  template: Template;
  onConfirm: (template: Template) => void;
  onBack: () => void;
}

interface ExpandableSection {
  features: boolean;
  automations: boolean;
  integrations: boolean;
}

export function TemplatePreview({ template, onConfirm, onBack }: TemplatePreviewProps) {
  const [expandedSections, setExpandedSections] = useState<ExpandableSection>({
    features: true,
    automations: false,
    integrations: false,
  });

  const colors = {
    bg: '#0f172a',
    card: '#1e293b',
    cardLight: '#334155',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#cbd5e1',
    accent: '#9333ea',
    accentHover: '#a855f7',
    success: '#10b981',
    warning: '#f59e0b',
  };

  const complexityColor = useMemo(() => {
    switch (template.complexity) {
      case 'simple':
        return '#dcfce7';
      case 'intermediate':
        return '#fef3c7';
      case 'advanced':
        return '#fee2e2';
      default:
        return colors.border;
    }
  }, [template.complexity]);

  const complexityTextColor = useMemo(() => {
    switch (template.complexity) {
      case 'simple':
        return '#166534';
      case 'intermediate':
        return '#92400e';
      case 'advanced':
        return '#991b1b';
      default:
        return colors.textMuted;
    }
  }, [template.complexity]);

  const toggleSection = (section: keyof ExpandableSection) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        background: colors.bg,
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '32px',
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'transparent',
            border: `1px solid ${colors.border}`,
            color: colors.textMuted,
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '16px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.accent;
            el.style.color = colors.accent;
          }}
          onMouseLeave={e => {
            const el = e.target as HTMLElement;
            el.style.borderColor = colors.border;
            el.style.color = colors.textMuted;
          }}
          aria-label="Go back to template selection"
        >
          <ChevronLeft size={16} />
          Back to Templates
        </button>

        <h1
          style={{
            fontSize: '40px',
            fontWeight: 800,
            color: colors.text,
            margin: '0 0 12px 0',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '48px' }}>{template.icon}</span>
          {template.name}
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: colors.textMuted,
            margin: 0,
            lineHeight: '1.6',
          }}
        >
          {template.description}
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '32px',
        }}
      >
        {/* Left Column - Dashboard Preview */}
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Dashboard Preview
          </h2>

          {/* Dashboard Mockup */}
          <div
            style={{
              background: colors.card,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              height: '600px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Header Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: '16px',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Dashboard
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  color: colors.success,
                  fontWeight: 600,
                }}
              >
                ● Live
              </span>
            </div>

            {/* Metrics Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
              }}
            >
              {[
                { icon: '📊', label: 'Revenue', value: '$12,450' },
                { icon: '👥', label: 'Customers', value: '1,247' },
                { icon: '📦', label: 'Orders', value: '156' },
                { icon: '⭐', label: 'Rating', value: '4.8/5' },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: colors.cardLight,
                    borderRadius: '8px',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: '20px',
                      marginBottom: '6px',
                    }}
                  >
                    {metric.icon}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: colors.textMuted,
                      marginBottom: '4px',
                    }}
                  >
                    {metric.label}
                  </div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: colors.text,
                    }}
                  >
                    {metric.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Placeholder */}
            <div
              style={{
                flex: 1,
                background: colors.cardLight,
                borderRadius: '8px',
                border: `1px dashed ${colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <TrendingUp
                  size={32}
                  style={{
                    color: colors.accent,
                    marginBottom: '8px',
                    margin: '0 auto 8px',
                  }}
                />
                <p
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: 0,
                  }}
                >
                  Revenue Trend Chart
                </p>
              </div>
            </div>

            {/* Sample Data Table */}
            <div
              style={{
                paddingTop: '12px',
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <div
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontWeight: 600,
                }}
              >
                Recent Orders
              </div>
              <div
                style={{
                  fontSize: '11px',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                {['Order #1024', 'Order #1023', 'Order #1022'].map((order, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '6px 0',
                      borderBottom: `1px solid ${colors.border}`,
                      color: colors.textMuted,
                    }}
                  >
                    <span>{order}</span>
                    <span style={{ color: colors.success }}>✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Template Details */}
        <div>
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Template Details
          </h2>

          {/* Details Card */}
          <div
            style={{
              background: colors.card,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Metadata Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Setup Time
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                  }}
                >
                  <Clock size={18} />
                  {template.setupTimeMinutes}m
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Complexity
                </div>
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: complexityColor,
                    color: complexityTextColor,
                    fontSize: '13px',
                    fontWeight: 600,
                    width: 'fit-content',
                  }}
                >
                  {template.complexity === 'simple'
                    ? 'Simple'
                    : template.complexity === 'intermediate'
                      ? 'Intermediate'
                      : 'Advanced'}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Features
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                  }}
                >
                  <Zap size={18} />
                  {template.featureCount}
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    marginBottom: '6px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Integrations
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: colors.text,
                  }}
                >
                  <LinkIcon size={18} />
                  {template.integrations.length}
                </div>
              </div>
            </div>

            {/* Sample Data Badge */}
            {template.sampleData && (
              <div
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  background: `${colors.accent}15`,
                  border: `1px solid ${colors.accent}`,
                  color: colors.accent,
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Check size={16} />
                Includes Pre-loaded Sample Data
              </div>
            )}

            {/* Feature Checklist */}
            <div>
              <button
                onClick={() => toggleSection('features')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  marginBottom: '12px',
                }}
                aria-expanded={expandedSections.features}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={16} />
                  Key Features ({template.features.length})
                </span>
                {expandedSections.features ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.features && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {template.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: colors.textMuted,
                      }}
                    >
                      <Check size={14} style={{ color: colors.success }} />
                      {feature}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Automations */}
            <div>
              <button
                onClick={() => toggleSection('automations')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  marginBottom: '12px',
                }}
                aria-expanded={expandedSections.automations}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={16} />
                  Automations ({template.automations.length})
                </span>
                {expandedSections.automations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.automations && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {template.automations.map((automation, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: colors.textMuted,
                      }}
                    >
                      <Check size={14} style={{ color: colors.success }} />
                      {automation}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Integrations */}
            <div>
              <button
                onClick={() => toggleSection('integrations')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  background: 'transparent',
                  border: 'none',
                  color: colors.text,
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${colors.border}`,
                  marginBottom: '12px',
                }}
                aria-expanded={expandedSections.integrations}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LinkIcon size={16} />
                  Integrations ({template.integrations.length})
                </span>
                {expandedSections.integrations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {expandedSections.integrations && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    marginBottom: '16px',
                  }}
                >
                  {template.integrations.map((integration, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '13px',
                        color: colors.textMuted,
                      }}
                    >
                      <LinkIcon size={14} style={{ color: colors.accent }} />
                      {integration}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmation Button */}
            <button
              onClick={() => onConfirm(template)}
              style={{
                width: '100%',
                padding: '14px',
                background: colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginTop: '12px',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement;
                el.style.background = colors.accentHover;
                el.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement;
                el.style.background = colors.accent;
                el.style.transform = 'translateY(0)';
              }}
            >
              Apply Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TemplatePreview;

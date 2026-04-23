import { useState } from 'react';
import { ChevronRight, ChevronLeft, Settings, RefreshCw } from 'lucide-react';
import { PreviewCustomizations } from './PreviewCustomizations';

interface DashboardPreviewPhaseProps {
  onNext: () => void;
  onPrevious: () => void;
  selectedFeatures?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  businessName?: string;
  businessType?: string;
  selectedPipelines?: string[];
  onCustomizationsChange?: (customizations: any) => void;
}

interface DashboardCustomizations {
  businessName: string;
  pipelineStages: string[];
  visibleWidgets: string[];
  sidebarFeatures: string[];
  colorTheme: {
    primary: string;
    secondary: string;
  };
  logoUrl: string;
}

const DASHBOARD_WIDGETS = [
  { id: 'revenue', icon: '💰', label: 'Revenue', metric: '$24,580' },
  { id: 'deals', icon: '📊', label: 'Active Deals', metric: '12' },
  { id: 'leads', icon: '👥', label: 'New Leads', metric: '45' },
  { id: 'emails', icon: '📧', label: 'Emails Sent', metric: '328' },
];

const DEFAULT_PIPELINE_STAGES = ['Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won'];

const BUSINESS_WIDGETS: Record<string, string[]> = {
  retail: ['revenue', 'deals', 'inventory'],
  service: ['revenue', 'deals', 'customers'],
  tech: ['revenue', 'deals', 'projects'],
  consulting: ['revenue', 'deals', 'leads'],
  ecommerce: ['revenue', 'deals', 'inventory'],
};

export function DashboardPreviewPhase({
  onNext,
  onPrevious,
  selectedFeatures = [],
  primaryColor = '#ffffff',
  secondaryColor = '#f3f4f6',
  logoUrl = '',
  businessName = 'My Business',
  businessType = 'retail',
  selectedPipelines = [],
  onCustomizationsChange,
}: DashboardPreviewPhaseProps) {
  const [showCustomizations, setShowCustomizations] = useState(false);
  const [customizations, setCustomizations] = useState<DashboardCustomizations>({
    businessName,
    pipelineStages: selectedPipelines.length > 0 ? selectedPipelines : DEFAULT_PIPELINE_STAGES,
    visibleWidgets: BUSINESS_WIDGETS[businessType] || ['revenue', 'deals', 'leads'],
    sidebarFeatures: selectedFeatures,
    colorTheme: { primary: primaryColor, secondary: secondaryColor },
    logoUrl,
  });

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

  const handleCustomizationsSave = (newCustomizations: DashboardCustomizations) => {
    setCustomizations(newCustomizations);
    onCustomizationsChange?.(newCustomizations);
    setShowCustomizations(false);
  };

  const visibleWidgets = DASHBOARD_WIDGETS.filter(w =>
    customizations.visibleWidgets.includes(w.id)
  );

  return (
    <div
      style={{
        opacity: !showCustomizations ? 1 : 0.5,
        transition: 'opacity 0.3s ease',
      }}
    >
      {!showCustomizations ? (
        <>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '32px' }}>👀</div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                }}
              >
                Preview Your Dashboard
              </h1>
            </div>
            <p
              style={{
                fontSize: '14px',
                color: colors.textMuted,
                margin: 0,
                marginLeft: '44px',
              }}
            >
              This is your personalized dashboard preview. Customize it to your liking before going live.
            </p>
          </div>

          {/* Two-Column Layout: Preview + Customizations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            {/* Left: Dashboard Preview */}
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Preview Header */}
              <div
                style={{
                  background: customizations.colorTheme.primary,
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      background: customizations.colorTheme.secondary,
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      color: customizations.colorTheme.primary,
                    }}
                  >
                    🚀
                  </div>
                )}
                <span
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: colors.text,
                  }}
                >
                  {customizations.businessName}
                </span>
              </div>

              {/* Preview Content */}
              <div style={{ padding: '20px' }}>
                {/* KPI Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {visibleWidgets.slice(0, 4).map(widget => (
                    <div
                      key={widget.id}
                      style={{
                        background: colors.hover,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>
                        {widget.icon}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: colors.textMuted,
                          marginBottom: '6px',
                        }}
                      >
                        {widget.label}
                      </div>
                      <div
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: colors.accent,
                        }}
                      >
                        {widget.metric}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pipeline Section */}
                {selectedFeatures.includes('lead_management') && (
                  <div style={{ marginBottom: '20px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Sales Pipeline
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                      }}
                    >
                      {customizations.pipelineStages.map((stage, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: colors.hover,
                            border: `1px solid ${colors.border}`,
                            borderRadius: '6px',
                            padding: '8px 12px',
                            whiteSpace: 'nowrap',
                            fontSize: '12px',
                            color: colors.text,
                            flexShrink: 0,
                          }}
                        >
                          {stage}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features Section */}
                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colors.textMuted,
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Enabled Features
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {customizations.sidebarFeatures.map(feature => (
                      <div
                        key={feature}
                        style={{
                          background: `${customizations.colorTheme.secondary}40`,
                          border: `1px solid ${customizations.colorTheme.secondary}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: colors.text,
                        }}
                      >
                        {feature.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Customizations */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Customization Summary */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 12px 0',
                  }}
                >
                  Current Setup
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>Business Name</span>
                    <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>
                      {customizations.businessName}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>Features</span>
                    <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>
                      {customizations.sidebarFeatures.length} enabled
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>Pipeline Stages</span>
                    <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>
                      {customizations.pipelineStages.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: colors.textMuted }}>Widgets</span>
                    <span style={{ fontSize: '13px', color: colors.text, fontWeight: 500 }}>
                      {customizations.visibleWidgets.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Color Preview */}
              <div
                style={{
                  background: colors.card,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 12px 0',
                  }}
                >
                  Theme Colors
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>Primary</span>
                    <div
                      style={{
                        width: '100%',
                        height: '40px',
                        background: customizations.colorTheme.primary,
                        borderRadius: '8px',
                        border: `2px solid ${colors.border}`,
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <span style={{ fontSize: '12px', color: colors.textMuted }}>Secondary</span>
                    <div
                      style={{
                        width: '100%',
                        height: '40px',
                        background: customizations.colorTheme.secondary,
                        borderRadius: '8px',
                        border: `2px solid ${colors.border}`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Customize Button */}
              <button
                onClick={() => setShowCustomizations(true)}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: colors.accent,
                  border: 'none',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
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
                <Settings size={16} />
                Customize Dashboard
              </button>

              {/* Info Box */}
              <div
                style={{
                  background: `${colors.success}15`,
                  border: `1px solid ${colors.success}40`,
                  borderRadius: '8px',
                  padding: '12px',
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    color: colors.textMuted,
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  You can change these settings anytime after launch from the Settings panel.
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onPrevious}
              style={{
                flex: 1,
                padding: '14px',
                background: 'transparent',
                border: `1.5px solid ${colors.border}`,
                color: colors.textMuted,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
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
              <ChevronLeft size={16} />
              Back
            </button>
            <button
              onClick={onNext}
              style={{
                flex: 1,
                padding: '14px',
                background: colors.accent,
                border: 'none',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
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
              Launch My Dashboard
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      ) : (
        <PreviewCustomizations
          customizations={customizations}
          onSave={handleCustomizationsSave}
          onCancel={() => setShowCustomizations(false)}
        />
      )}
    </div>
  );
}

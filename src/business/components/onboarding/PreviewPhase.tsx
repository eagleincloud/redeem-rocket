import { useState } from 'react';
import { Eye, Code, Settings, Zap } from 'lucide-react';

interface PreviewPhaseProps {
  themePreference?: {
    layout: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string | null;
    fontStyle: string;
  };
  featurePreferences?: Record<string, boolean>;
  pipelines?: any[];
}

export function PreviewPhase({
  themePreference = {
    layout: 'data-heavy',
    primaryColor: '#ff4400',
    secondaryColor: '#ffffff',
    logoUrl: null,
    fontStyle: 'modern',
  },
  featurePreferences = {},
  pipelines = [],
}: PreviewPhaseProps) {
  const [activeTab, setActiveTab] = useState<'theme' | 'features' | 'pipelines'>('theme');

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    warning: '#f59e0b',
    hover: '#1a1f3a',
  };

  const selectedFeatures = Object.entries(featurePreferences)
    .filter(([_, v]) => v)
    .map(([k]) => k);

  const featureLabels: Record<string, string> = {
    product_catalog: '📦 Product Catalog',
    lead_management: '🎯 Lead Management',
    email_campaigns: '📧 Email Campaigns',
    automation: '🤖 Automation',
    social_media: '📱 Social Media',
  };

  const layoutDescriptions: Record<string, string> = {
    minimal: 'Clean, minimal interface with essential information only',
    detailed: 'Comprehensive dashboard with detailed metrics and insights',
    visual: 'Visual-focused with charts, graphs, and data visualizations',
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 12px 0',
            lineHeight: '1.2',
          }}
        >
          Review Your Setup
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: colors.textMuted,
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          Here's a preview of your Redeem Rocket configuration
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {[
          { id: 'theme' as const, label: '🎨 Theme', icon: Eye },
          { id: 'features' as const, label: '⚙️ Features', icon: Settings },
          { id: 'pipelines' as const, label: '🔄 Pipelines', icon: Zap },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              color: activeTab === tab.id ? colors.accent : colors.textMuted,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              borderBottom: `2px solid ${activeTab === tab.id ? colors.accent : 'transparent'}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                const el = e.currentTarget as HTMLElement;
                el.style.color = colors.text;
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                const el = e.currentTarget as HTMLElement;
                el.style.color = colors.textMuted;
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ minHeight: '300px', marginBottom: '32px' }}>
        {/* Theme Preview */}
        {activeTab === 'theme' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px',
            }}
          >
            {/* Theme Layout */}
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 12px 0',
                }}
              >
                Layout Style
              </h3>
              <div
                style={{
                  background: colors.bg,
                  border: `2px solid ${colors.accent}`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.accent,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    marginBottom: '8px',
                  }}
                >
                  {themePreference.layout}
                </div>
                <p
                  style={{
                    fontSize: '13px',
                    color: colors.textMuted,
                    margin: 0,
                    lineHeight: '1.5',
                  }}
                >
                  {layoutDescriptions[themePreference.layout] || 'Custom layout'}
                </p>
              </div>
            </div>

            {/* Color Scheme */}
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 12px 0',
                }}
              >
                Color Scheme
              </h3>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      display: 'block',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Primary
                  </label>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: themePreference.primaryColor,
                      borderRadius: '8px',
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      marginTop: '8px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {themePreference.primaryColor}
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      display: 'block',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Secondary
                  </label>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      background: themePreference.secondaryColor,
                      borderRadius: '8px',
                      border: `2px solid ${colors.border}`,
                    }}
                  />
                  <div
                    style={{
                      fontSize: '12px',
                      color: colors.textMuted,
                      marginTop: '8px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {themePreference.secondaryColor}
                  </div>
                </div>
              </div>
            </div>

            {/* Font Style */}
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 12px 0',
                }}
              >
                Typography
              </h3>
              <div
                style={{
                  background: colors.bg,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: colors.accent,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    marginBottom: '8px',
                  }}
                >
                  {themePreference.fontStyle}
                </div>
                <p
                  style={{
                    fontSize: '14px',
                    color: colors.text,
                    margin: 0,
                    fontWeight: 500,
                  }}
                >
                  Sample Text Preview
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Features Preview */}
        {activeTab === 'features' && (
          <div>
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 20px 0',
                }}
              >
                Enabled Features
              </h3>
              {selectedFeatures.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                  }}
                >
                  {selectedFeatures.map((feature) => (
                    <div
                      key={feature}
                      style={{
                        background: colors.bg,
                        border: `1px solid ${colors.accent}50`,
                        borderRadius: '8px',
                        padding: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: colors.success,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '14px',
                          color: colors.text,
                          fontWeight: 500,
                        }}
                      >
                        {featureLabels[feature] || feature}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: colors.textMuted,
                  }}
                >
                  No features selected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pipelines Preview */}
        {activeTab === 'pipelines' && (
          <div>
            <div
              style={{
                background: colors.card,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '24px',
              }}
            >
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text,
                  margin: '0 0 20px 0',
                }}
              >
                Generated Pipelines ({pipelines.length})
              </h3>
              {pipelines.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {pipelines.slice(0, 5).map((pipeline, index) => (
                    <div
                      key={index}
                      style={{
                        background: colors.bg,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        padding: '16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: colors.text,
                          marginBottom: '8px',
                        }}
                      >
                        {pipeline.name || `Pipeline ${index + 1}`}
                      </div>
                      <p
                        style={{
                          fontSize: '13px',
                          color: colors.textMuted,
                          margin: 0,
                          lineHeight: '1.5',
                        }}
                      >
                        {pipeline.description ||
                          `Automated workflow with ${pipeline.stages?.length || 0} stages`}
                      </p>
                    </div>
                  ))}
                  {pipelines.length > 5 && (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '12px',
                        color: colors.accent,
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      +{pipelines.length - 5} more pipelines
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: colors.textMuted,
                  }}
                >
                  No pipelines generated yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Summary */}
      <div
        style={{
          background: colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: '12px',
          padding: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          textAlign: 'center',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.accent,
              marginBottom: '4px',
            }}
          >
            {selectedFeatures.length}
          </div>
          <div style={{ fontSize: '12px', color: colors.textMuted }}>
            Features Active
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.success,
              marginBottom: '4px',
            }}
          >
            {pipelines.length}
          </div>
          <div style={{ fontSize: '12px', color: colors.textMuted }}>
            Pipelines Ready
          </div>
        </div>
        <div>
          <div
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colors.warning,
              marginBottom: '4px',
            }}
          >
            {themePreference.layout}
          </div>
          <div style={{ fontSize: '12px', color: colors.textMuted }}>
            Layout Style
          </div>
        </div>
      </div>

      {/* Ready to Launch */}
      <div
        style={{
          background: `${colors.success}15`,
          border: `1px solid ${colors.success}50`,
          borderRadius: '12px',
          padding: '20px',
          marginTop: '24px',
          textAlign: 'center',
        }}
      >
        <h3
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: colors.success,
            margin: '0 0 8px 0',
          }}
        >
          Ready to Launch
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: colors.textMuted,
            margin: 0,
          }}
        >
          Your Redeem Rocket is fully configured. Click "Launch My Redeem Rocket! 🚀" to get started.
        </p>
      </div>
    </div>
  );
}

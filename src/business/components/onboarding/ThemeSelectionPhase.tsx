import { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, Eye } from 'lucide-react';
import { PipelineTemplateSelector } from './PipelineTemplateSelector';

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  layout: string;
  colors: {
    primary: string;
    secondary: string;
  };
}

const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean, focused interface with essential info only',
    layout: 'minimal',
    colors: { primary: '#ffffff', secondary: '#f3f4f6' },
  },
  {
    id: 'data-heavy',
    name: 'Data-Heavy',
    description: 'Comprehensive dashboard with detailed metrics',
    layout: 'detailed',
    colors: { primary: '#3b82f6', secondary: '#1e40af' },
  },
  {
    id: 'visual-focused',
    name: 'Visual-Focused',
    description: 'Charts, graphs, and visual representations',
    layout: 'visual',
    colors: { primary: '#ff4400', secondary: '#ff7a3d' },
  },
];

interface ThemeSelectionPhaseProps {
  onNext: () => void;
  onPrevious: () => void;
  selectedTheme?: string;
  onThemeChange?: (themeId: string) => void;
  primaryColor?: string;
  onPrimaryColorChange?: (color: string) => void;
  secondaryColor?: string;
  onSecondaryColorChange?: (color: string) => void;
  logoUrl?: string;
  onLogoUpload?: (url: string) => void;
  selectedPipelines?: string[];
  onPipelinesChange?: (pipelineIds: string[]) => void;
}

export function ThemeSelectionPhase({
  onNext,
  onPrevious,
  selectedTheme = 'minimalist',
  onThemeChange,
  primaryColor = '#ffffff',
  onPrimaryColorChange,
  secondaryColor = '#f3f4f6',
  onSecondaryColorChange,
  logoUrl = '',
  onLogoUpload,
  selectedPipelines = [],
  onPipelinesChange,
}: ThemeSelectionPhaseProps) {
  const [showColorPicker, setShowColorPicker] = useState<'primary' | 'secondary' | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string>(logoUrl);

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

  const selectedThemeObj = THEME_PRESETS.find(t => t.id === selectedTheme);

  const handleThemeSelect = (themeId: string) => {
    onThemeChange?.(themeId);
    const theme = THEME_PRESETS.find(t => t.id === themeId);
    if (theme) {
      onPrimaryColorChange?.(theme.colors.primary);
      onSecondaryColorChange?.(theme.colors.secondary);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setPreviewLogo(dataUrl);
        onLogoUpload?.(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Progress Bar */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: colors.textMuted, fontWeight: 500 }}>
            Phase 3 of 3: Theme & Pipelines
          </span>
          <span style={{ fontSize: '13px', color: colors.accent, fontWeight: 600 }}>
            ~3 minutes
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
              width: '66%',
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
          Customize Your Dashboard
        </h1>
        <p
          style={{
            fontSize: '15px',
            color: colors.textMuted,
            margin: 0,
            lineHeight: '1.5',
          }}
        >
          Choose your theme, colors, and set up your business pipelines.
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '40px' }}>
        {/* Theme Selection */}
        <section>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Dashboard Layout
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
            }}
          >
            {THEME_PRESETS.map(theme => (
              <div
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                style={{
                  background: colors.card,
                  border: `2px solid ${selectedTheme === theme.id ? colors.accent : colors.border}`,
                  borderRadius: '10px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (selectedTheme !== theme.id) {
                    el.style.borderColor = colors.text;
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement;
                  if (selectedTheme !== theme.id) {
                    el.style.borderColor = colors.border;
                  }
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '80px',
                    background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                    borderRadius: '6px',
                    marginBottom: '12px',
                  }}
                />
                <h3
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: colors.text,
                    margin: '0 0 4px 0',
                  }}
                >
                  {theme.name}
                </h3>
                <p
                  style={{
                    fontSize: '11px',
                    color: colors.textMuted,
                    margin: 0,
                    lineHeight: '1.3',
                  }}
                >
                  {theme.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Color Customization */}
        <section>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Brand Colors
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Primary Color */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Primary Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  onClick={() => setShowColorPicker(showColorPicker === 'primary' ? null : 'primary')}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: primaryColor,
                    borderRadius: '8px',
                    border: `2px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1)';
                  }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => onPrimaryColorChange?.(e.target.value)}
                  placeholder="#ffffff"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  color: colors.textMuted,
                  marginBottom: '8px',
                  fontWeight: 500,
                }}
              >
                Secondary Color
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div
                  onClick={() => setShowColorPicker(showColorPicker === 'secondary' ? null : 'secondary')}
                  style={{
                    width: '50px',
                    height: '50px',
                    background: secondaryColor,
                    borderRadius: '8px',
                    border: `2px solid ${colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'scale(1)';
                  }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={e => onSecondaryColorChange?.(e.target.value)}
                  placeholder="#f3f4f6"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Logo Upload */}
        <section>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Business Logo
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
            }}
          >
            {/* Upload Area */}
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: `2px dashed ${colors.border}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: colors.card,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = colors.accent;
                el.style.background = colors.hover;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = colors.border;
                el.style.background = colors.card;
              }}
            >
              <Upload size={24} style={{ color: colors.accent, marginBottom: '8px' }} />
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: colors.text,
                  marginBottom: '4px',
                }}
              >
                Click to upload logo
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: colors.textMuted,
                }}
              >
                PNG, JPG up to 2MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                style={{ display: 'none' }}
              />
            </label>

            {/* Logo Preview */}
            {previewLogo && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                  background: colors.hover,
                  borderRadius: '10px',
                  border: `1px solid ${colors.border}`,
                }}
              >
                <img
                  src={previewLogo}
                  alt="Logo preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '120px',
                    borderRadius: '6px',
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* Pipeline Templates */}
        <section>
          <PipelineTemplateSelector
            selectedTemplates={selectedPipelines}
            onSelectionChange={onPipelinesChange}
          />
        </section>

        {/* Live Preview */}
        <section>
          <h2
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: colors.text,
              margin: '0 0 16px 0',
            }}
          >
            Live Preview
          </h2>
          <div
            style={{
              background: colors.card,
              border: `1px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Eye size={16} style={{ color: colors.accent }} />
              <span style={{ fontSize: '13px', color: colors.textMuted }}>
                How your dashboard will look
              </span>
            </div>

            <div
              style={{
                background: selectedThemeObj?.colors.primary,
                borderRadius: '8px',
                padding: '16px',
                minHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                {previewLogo && (
                  <img
                    src={previewLogo}
                    alt="Logo preview"
                    style={{
                      maxWidth: '60px',
                      maxHeight: '60px',
                      marginBottom: '12px',
                      borderRadius: '4px',
                    }}
                  />
                )}
                <div style={{ fontSize: '14px', fontWeight: 600 }}>
                  {selectedThemeObj?.name} Theme
                </div>
              </div>
            </div>

            {selectedPipelines.length > 0 && (
              <div
                style={{
                  fontSize: '12px',
                  color: colors.textMuted,
                }}
              >
                <strong style={{ color: colors.text }}>Pipelines enabled:</strong> {selectedPipelines.join(', ')}
              </div>
            )}
          </div>
        </section>
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
    </div>
  );
}
